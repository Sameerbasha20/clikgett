// Admin-set customer cancel window (AdminShopToggleSettings.CancelWindowSeconds, default 2 min)
// and the order a notification is about (UserNotifications.OrderID), so tapping it opens the order.
// Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const hasColumn = async (table, column) => {
    const [row] = await query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [table, column]);
    return row.n > 0;
};

async function run() {
    if (!(await hasColumn('AdminShopToggleSettings', 'CancelWindowSeconds'))) {
        await query('ALTER TABLE AdminShopToggleSettings ADD COLUMN CancelWindowSeconds INT NOT NULL DEFAULT 120');
        console.log('Order settings: added CancelWindowSeconds');
    }
    if (!(await hasColumn('UserNotifications', 'OrderID'))) {
        await query('ALTER TABLE UserNotifications ADD COLUMN OrderID BIGINT NULL');
        console.log('Order settings: added UserNotifications.OrderID');
    }
    console.log('Order settings migration complete');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Order settings migration failed:', err.message);
        process.exit(1);
    });
}
