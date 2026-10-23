'use strict';
// Lets the admin product-page actions save:
// - Buy More tiers for the whole product have no VariantID, and open-ended slabs ("10+")
//   have no MaxQuantity; both columns were NOT NULL, so every save failed.
// - Membership prices are keyed by PlanID (MembershipPlans); the old MembershipID column
//   (legacy `memberships` table) was NOT NULL without a default, so every save failed.
// Idempotent.
//   node server/migrations/product_actions_schema_migration.js
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) =>
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const allowNull = async (table, column, type) => {
    const [col] = await query(
        'SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [table, column]);
    if (!col) return console.log(`${table}.${column} not found, skipped`);
    if (col.IS_NULLABLE === 'YES') return console.log(`${table}.${column} already allows NULL`);
    await query(`ALTER TABLE \`${table}\` MODIFY \`${column}\` ${type} NULL`);
    console.log(`${table}.${column} now allows NULL`);
};

(async () => {
    try {
        await allowNull('buy_more_config', 'VariantID', 'BIGINT');
        await allowNull('buy_more_config', 'MaxQuantity', 'INT');
        await allowNull('membership_product_prices', 'MembershipID', 'BIGINT');
    } catch (e) {
        console.error('Product actions schema migration failed:', e.message);
        process.exitCode = 1;
    } finally {
        pool.end();
    }
})();
