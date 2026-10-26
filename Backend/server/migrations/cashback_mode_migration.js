// Cashback mode: allow 'disabled' (admin Settings offers it, but the column only took
// automatic/manual, so saving "Disabled" failed). Safe to re-run (run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    const [col] = await query(
        `SELECT COLUMN_TYPE AS type FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'AdminShopToggleSettings' AND COLUMN_NAME = 'CashbackMode'`);
    if (col && col.type.startsWith('enum(') && !col.type.includes("'disabled'")) {
        await query("ALTER TABLE AdminShopToggleSettings MODIFY CashbackMode ENUM('automatic','manual','disabled') NULL DEFAULT 'automatic'");
        console.log("Cashback mode: added 'disabled'");
    }
    console.log('Cashback mode migration complete');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Cashback mode migration failed:', err.message);
        process.exit(1);
    });
}
