// Unlock deals: how many units a customer gets at the deal price per order.
// Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    const [col] = await query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_unlocks' AND COLUMN_NAME = 'MaxQtyPerOrder'`);
    if (!col.n) {
        await query('ALTER TABLE product_unlocks ADD COLUMN MaxQtyPerOrder INT NOT NULL DEFAULT 1');
        console.log('Product unlock limits: added MaxQtyPerOrder');
    }
    console.log('Product unlock limits migration complete');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Product unlock limits migration failed:', err.message);
        process.exit(1);
    });
}
