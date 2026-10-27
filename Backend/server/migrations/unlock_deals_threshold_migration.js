// Unlock deals use ONE cart value for every deal (admin → Unlock deals), stored in
// AdminShopToggleSettings.UnlockDealsThreshold. Also tidies old rules so each pack has a
// single live deal, and switches off rules without a deal price (checkout never applied them).
// Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    const [col] = await query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'AdminShopToggleSettings' AND COLUMN_NAME = 'UnlockDealsThreshold'`);
    if (!col.n) {
        await query('ALTER TABLE AdminShopToggleSettings ADD COLUMN UnlockDealsThreshold DECIMAL(10,2) NOT NULL DEFAULT 499.00');
        // Start from the lowest value already in use, so live deals do not get harder to unlock.
        const [low] = await query(
            'SELECT MIN(ThresholdAmount) AS v FROM product_unlocks WHERE Status = 1 AND UnlockPrice IS NOT NULL AND ThresholdAmount > 0');
        if (low && low.v) await query('UPDATE AdminShopToggleSettings SET UnlockDealsThreshold = ?', [low.v]);
        console.log('Unlock deals: added UnlockDealsThreshold');
    }

    const priceless = await query('UPDATE product_unlocks SET Status = 0 WHERE Status = 1 AND UnlockPrice IS NULL');
    if (priceless.affectedRows) console.log(`Unlock deals: switched off ${priceless.affectedRows} rule(s) without a deal price`);

    // One live deal per pack: keep the cheapest (then the oldest).
    const dupes = await query(`
        UPDATE product_unlocks pu
          JOIN (SELECT a.UnlockID FROM product_unlocks a
                  JOIN product_unlocks b
                    ON b.Status = 1 AND a.Status = 1 AND b.UnlockID <> a.UnlockID
                   AND b.ProductID = a.ProductID AND COALESCE(b.VariantID, 0) = COALESCE(a.VariantID, 0)
                   AND (b.UnlockPrice < a.UnlockPrice OR (b.UnlockPrice = a.UnlockPrice AND b.UnlockID < a.UnlockID))) d
            ON d.UnlockID = pu.UnlockID
           SET pu.Status = 0`);
    if (dupes.affectedRows) console.log(`Unlock deals: switched off ${dupes.affectedRows} duplicate rule(s)`);

    await query(`UPDATE product_unlocks
                    SET ThresholdAmount = (SELECT UnlockDealsThreshold FROM AdminShopToggleSettings LIMIT 1)
                  WHERE ThresholdAmount <> (SELECT UnlockDealsThreshold FROM AdminShopToggleSettings LIMIT 1)`);
    console.log('Unlock deals threshold migration complete');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Unlock deals threshold migration failed:', err.message);
        process.exit(1);
    });
}
