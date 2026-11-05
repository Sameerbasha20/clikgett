// AdminUsers.AdminRole: what an admin may do (utils/adminRoles.js). Existing admins become
// "super" so nobody loses access. Safe to re-run.
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    const [col] = await query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'AdminUsers' AND COLUMN_NAME = 'AdminRole'`);
    if (col.n) return;
    await query("ALTER TABLE AdminUsers ADD COLUMN AdminRole VARCHAR(20) NOT NULL DEFAULT 'super'");
    console.warn('AdminUsers: added AdminRole (existing admins are super)');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Admin roles migration failed:', err.message);
        process.exit(1);
    });
}
