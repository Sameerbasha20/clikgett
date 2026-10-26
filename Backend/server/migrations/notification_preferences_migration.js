// Customer notification preferences: order updates and offers can be switched off in the app.
// Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const COLUMNS = ['NotifyOrderUpdates', 'NotifyOffers'];

async function run() {
    for (const name of COLUMNS) {
        const [col] = await query(
            `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = ?`, [name]);
        if (!col.n) {
            await query(`ALTER TABLE Users ADD COLUMN ${name} TINYINT(1) NOT NULL DEFAULT 1`);
            console.log(`Notification preferences: added ${name}`);
        }
    }
    console.log('Notification preferences migration complete');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Notification preferences migration failed:', err.message);
        process.exit(1);
    });
}
