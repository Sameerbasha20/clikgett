// Support enquiries: up to 3 photos per enquiry (ImagePaths, a JSON list; ImagePath keeps the first).
// Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    const [col] = await query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CustomerEnquiries' AND COLUMN_NAME = 'ImagePaths'`);
    if (!col.n) {
        await query('ALTER TABLE CustomerEnquiries ADD COLUMN ImagePaths TEXT NULL');
        console.log('Enquiry attachments: added ImagePaths');
    }
    console.log('Enquiry attachments migration complete');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Enquiry attachments migration failed:', err.message);
        process.exit(1);
    });
}
