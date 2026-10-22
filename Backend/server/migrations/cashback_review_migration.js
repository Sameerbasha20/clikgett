// Manual cashback review (2026-10-21): keep the reason when an admin rejects a
// cashback, and look pending rows up by order quickly. Safe to re-run.
const pool = require('../utils/db.js');

const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
});

async function runMigration() {
    console.log('=== Cashback review ===');
    const col = await runQuery(
        `SELECT 1 FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CashbackPending' AND COLUMN_NAME = 'RejectReason'`
    );
    if (!col.length) {
        await runQuery('ALTER TABLE CashbackPending ADD COLUMN RejectReason VARCHAR(255) NULL DEFAULT NULL');
        console.log('Added CashbackPending.RejectReason');
    }
    const idx = await runQuery(
        `SELECT 1 FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CashbackPending' AND INDEX_NAME = 'idx_cashback_pending_order'`
    );
    if (!idx.length) {
        await runQuery('CREATE INDEX idx_cashback_pending_order ON CashbackPending (OrderID)');
        console.log('Added index on CashbackPending.OrderID');
    }
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
