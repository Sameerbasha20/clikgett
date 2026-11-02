// Flash sales: a per-product limit of units per order at the sale price
// (SaleItems.MaxQtyPerOrder; null or 0 = no limit). Extra units cost the normal offer price.
// Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    const [col] = await query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SaleItems' AND COLUMN_NAME = 'MaxQtyPerOrder'`);
    if (!col.n) {
        await query('ALTER TABLE SaleItems ADD COLUMN MaxQtyPerOrder INT NULL');
        console.log('Flash sales: added SaleItems.MaxQtyPerOrder');
    }
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Sale limits migration failed:', err.message);
        process.exit(1);
    });
}
