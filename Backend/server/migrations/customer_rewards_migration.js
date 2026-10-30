// Customer rewards and related fields:
//   - Users.DateOfBirth (set once by the customer; birthday wallet reward)
//   - CustomerRewardSettings (admin → Settings → Rewards): comeback cash for inactive
//     customers and the birthday reward, both off until the admin switches them on
//   - Products.SearchKeywords (other names a product is searched by)
//   - Photo orders can be a typed list without a photo (PhotoOrderRequests.TypedItems)
// Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const column = async (table, name) => {
    const [row] = await query(
        `SELECT IS_NULLABLE AS nullable FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [table, name]);
    return row || null;
};

async function run() {
    if (!(await column('Users', 'DateOfBirth'))) {
        await query('ALTER TABLE Users ADD COLUMN DateOfBirth DATE NULL');
        console.log('Customer rewards: added Users.DateOfBirth');
    }
    if (!(await column('Products', 'SearchKeywords'))) {
        await query('ALTER TABLE Products ADD COLUMN SearchKeywords TEXT NULL');
        console.log('Customer rewards: added Products.SearchKeywords');
    }
    if (!(await column('PhotoOrderRequests', 'TypedItems'))) {
        await query('ALTER TABLE PhotoOrderRequests ADD COLUMN TypedItems TEXT NULL');
        console.log('Customer rewards: added PhotoOrderRequests.TypedItems');
    }
    const photoPath = await column('PhotoOrderRequests', 'ImageStoragePath');
    if (photoPath && photoPath.nullable === 'NO') {
        await query('ALTER TABLE PhotoOrderRequests MODIFY ImageStoragePath VARCHAR(500) NULL');
        console.log('Customer rewards: photo order image is now optional');
    }

    await query(`CREATE TABLE IF NOT EXISTS CustomerRewardSettings (
        ID INT PRIMARY KEY,
        ComebackEnabled TINYINT(1) NOT NULL DEFAULT 0,
        ComebackInactiveDays INT NOT NULL DEFAULT 7,
        ComebackAmount DECIMAL(10,2) NOT NULL DEFAULT 25.00,
        ComebackValidHours INT NOT NULL DEFAULT 24,
        BirthdayEnabled TINYINT(1) NOT NULL DEFAULT 0,
        BirthdayAmount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
        BirthdayValidDays INT NOT NULL DEFAULT 7,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    await query('INSERT IGNORE INTO CustomerRewardSettings (ID) VALUES (1)');
    console.log('Customer rewards migration complete');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Customer rewards migration failed:', err.message);
        process.exit(1);
    });
}
