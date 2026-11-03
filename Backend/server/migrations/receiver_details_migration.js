// Orders placed for someone else: the receiver's name and phone (null = the customer receives it).
// Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function addColumn(name, type) {
    const [col] = await query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Orders' AND COLUMN_NAME = ?`, [name]);
    if (!col.n) {
        await query(`ALTER TABLE Orders ADD COLUMN ${name} ${type}`);
        console.log(`Orders: added ${name}`);
    }
}

async function run() {
    await addColumn('ReceiverName', 'VARCHAR(100) NULL');
    await addColumn('ReceiverMobile', 'VARCHAR(15) NULL');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Receiver details migration failed:', err.message);
        process.exit(1);
    });
}
