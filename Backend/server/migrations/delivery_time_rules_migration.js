// Delivery-time rules agreed with the store owner (2026-10-16):
//   up to 5 km -> 20 min, beyond 5 km -> 30 min
//   more than 10 items -> +10 min, then +10 min for every further 10 items (21-30 items -> +20, ...)
//   fresh fruit in the order -> +10 min (services/DeliveryTime.js)
// Safe to re-run; it sets the values below.
const pool = require('../utils/db.js');

const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
});

async function runMigration() {
    console.log('=== Delivery time rules ===');
    const rules = {
        IsEnabled: 1,
        Band1MaxKm: 5, Band1BaseMinutes: 20,
        // Band 2 collapses into band 3 so the admin screen shows the same two-step rule.
        Band2MinKm: 5, Band2MaxKm: 5, Band2BaseMinutes: 30,
        Band3MinKm: 5, Band3BaseMinutes: 30,
        DefaultBaseMinutes: 20,
    };
    const existing = await runQuery('SELECT RuleID FROM DeliveryETARules WHERE RuleID = 1');
    if (existing.length) {
        await runQuery('UPDATE DeliveryETARules SET ? WHERE RuleID = 1', [rules]);
    } else {
        await runQuery('INSERT INTO DeliveryETARules SET ?', [{ RuleID: 1, ...rules }]);
    }
    await runQuery(
        `UPDATE AdminShopToggleSettings SET LargeCartThreshold1Items = 10, LargeCartThreshold1Minutes = 10,
                LargeCartThreshold2Items = 20, LargeCartThreshold2Minutes = 10`
    );
    console.log('Distance: <=5 km 20 min, >5 km 30 min. Items: +10 min above 10, +10 per further 10.');
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
