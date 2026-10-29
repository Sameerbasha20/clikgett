// Cash-on-delivery orders the customer pays by UPI at the door (services/DoorstepUpi.js):
// the rider's Razorpay QR code and the payment that settled it.
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

const COLUMNS = [
    ['DoorstepQrID', 'VARCHAR(64) NULL'],
    ['DoorstepQrCreatedAt', 'DATETIME NULL'],
    ['DoorstepPaidVia', 'VARCHAR(20) NULL'],
    ['DoorstepPaymentID', 'VARCHAR(64) NULL'],
    ['DoorstepPaidAt', 'DATETIME NULL'],
];

async function run() {
    for (const [column, type] of COLUMNS) {
        if (!(await hasColumn('Orders', column))) {
            await query(`ALTER TABLE Orders ADD COLUMN ${column} ${type}`);
            console.log(`Doorstep UPI: added Orders.${column}`);
        }
    }
    console.log('Doorstep UPI migration complete');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Doorstep UPI migration failed:', err.message);
        process.exit(1);
    });
}
