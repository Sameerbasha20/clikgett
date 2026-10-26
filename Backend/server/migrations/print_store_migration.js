// Print store tables and prices. Safe to re-run (also runs on every deploy via run_on_start.js).
//   node server/migrations/print_store_migration.js   (uses the same DB_* env as the server)
const pool = require('../utils/db');

const queries = [
    `CREATE TABLE IF NOT EXISTS PrintJobs (
        PrintJobID INT AUTO_INCREMENT PRIMARY KEY,
        UserID INT NOT NULL,
        CartID INT NULL,
        OrderID INT NULL,
        FileKey VARCHAR(500) NOT NULL,
        FileName VARCHAR(255) NOT NULL,
        MimeType VARCHAR(100) NOT NULL,
        Pages INT NOT NULL DEFAULT 1,
        Copies INT NOT NULL DEFAULT 1,
        ColorMode ENUM('BW', 'COLOR') NOT NULL DEFAULT 'BW',
        Orientation ENUM('PORTRAIT', 'LANDSCAPE') NOT NULL DEFAULT 'PORTRAIT',
        UnitPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        LineTotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        Status ENUM('DRAFT', 'IN_CART', 'ORDERED') NOT NULL DEFAULT 'DRAFT',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pj_user (UserID),
        INDEX idx_pj_cart (CartID),
        INDEX idx_pj_order (OrderID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `INSERT INTO Settings (SettingKey, SettingValue)
        SELECT 'PrintPriceBW', '3' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE SettingKey = 'PrintPriceBW')`,
    `INSERT INTO Settings (SettingKey, SettingValue)
        SELECT 'PrintPriceColor', '10' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE SettingKey = 'PrintPriceColor')`,
    `INSERT INTO Settings (SettingKey, SettingValue)
        SELECT 'PrintStoreEnabled', '1' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE SettingKey = 'PrintStoreEnabled')`,
];

async function run() {
    for (const [i, sql] of queries.entries()) {
        await new Promise((resolve, reject) => pool.query(sql, (err) => (err ? reject(err) : resolve())));
        console.log(`Print store migration: step ${i + 1}/${queries.length} done`);
    }
    console.log('Print store migration complete');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Print store migration failed:', err.message);
        process.exit(1);
    });
}
