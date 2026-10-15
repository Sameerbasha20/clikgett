const pool = require('../utils/db.js');

async function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
    const result = await runQuery(
        `SELECT COUNT(*) AS count FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
        [tableName, columnName]
    );
    if (result[0].count === 0) {
        console.log(`Adding column ${columnName} to ${tableName}...`);
        await runQuery(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    } else {
        console.log(`Column ${columnName} already exists in ${tableName}.`);
    }
}

async function runMigration() {
    console.log("=== Starting Order Lifecycle Migration ===");

    // Push notifications to riders (delivery app registers its FCM token)
    await addColumnIfNotExists('AdminUsers', 'FCMToken', "VARCHAR(255) NULL");

    // Online-payment refunds on cancellation
    await addColumnIfNotExists('Orders', 'RefundStatus', "VARCHAR(30) NULL");
    await addColumnIfNotExists('Orders', 'RefundID', "VARCHAR(64) NULL");

    console.log("=== Order Lifecycle Migration Complete ===");
}

if (require.main === module) {
    runMigration()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("Migration failed:", err.message);
            process.exit(1);
        });
}

module.exports = runMigration;
