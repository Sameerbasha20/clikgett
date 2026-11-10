// Delivery partner sign-up: one row per application (name, verified mobile, selfie,
// Aadhaar, driving licence, bike/auto). Documents are private object-storage keys.
// Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    await query(`
        CREATE TABLE IF NOT EXISTS RiderApplications (
            ApplicationID INT AUTO_INCREMENT PRIMARY KEY,
            FullName VARCHAR(80) NOT NULL,
            MobileNumber VARCHAR(15) NOT NULL,
            VehicleType ENUM('bike','auto') NOT NULL,
            SelfieKey VARCHAR(255) NOT NULL,
            AadhaarKey VARCHAR(255) NOT NULL,
            LicenceKey VARCHAR(255) NOT NULL,
            Status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
            RejectReason VARCHAR(255) NULL,
            ReviewedBy INT NULL,
            ReviewedAt DATETIME NULL,
            RiderAdminID INT NULL,
            CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_rider_app_mobile (MobileNumber),
            KEY idx_rider_app_status (Status, CreatedAt)
        )`);
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Rider applications migration failed:', err.message);
        process.exit(1);
    });
}
