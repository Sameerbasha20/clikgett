// Store open/close override (2026-10-21). The admin can follow the timings
// (AUTO), open the store now (OPEN) or close it now (CLOSED); an override can
// end on its own at StoreModeUntil (UTC). See services/StoreHours.js.
// Safe to re-run.
const pool = require('../utils/db.js');

const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
});

async function addColumn(name, definition) {
    const rows = await runQuery(
        `SELECT 1 FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'AdminShopToggleSettings' AND COLUMN_NAME = ?`,
        [name]
    );
    if (rows.length) return false;
    await runQuery(`ALTER TABLE AdminShopToggleSettings ADD COLUMN ${name} ${definition}`);
    return true;
}

async function runMigration() {
    console.log('=== Store open/close override ===');
    const addedMode = await addColumn('StoreMode', "VARCHAR(10) NOT NULL DEFAULT 'AUTO'");
    await addColumn('StoreModeUntil', 'DATETIME NULL DEFAULT NULL');
    if (addedMode) {
        // The old switch: ShopStatus 0 meant "closed", so keep those stores closed.
        await runQuery("UPDATE AdminShopToggleSettings SET StoreMode = 'CLOSED' WHERE ShopStatus = 0");
    }
    const [row] = await runQuery('SELECT StoreMode, StoreModeUntil FROM AdminShopToggleSettings LIMIT 1');
    console.log('Store mode:', row ? row.StoreMode : '(no settings row)');
}

if (require.main === module) {
    runMigration()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Migration failed:', err.message);
            process.exit(1);
        });
}

module.exports = runMigration;
