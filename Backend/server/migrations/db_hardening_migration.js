// Database hardening from the Nov 2026 audit. Safe to re-run (runs on every deploy).
//  1. Indexes on columns every admin list, dashboard and wallet page filters or sorts by.
//  2. Money columns stored as FLOAT/DOUBLE become DECIMAL (no rounding drift in ledger sums).
//  3. Cart lines whose cart no longer exists are removed.
//  4. Tables no code uses are renamed to zz_archived_<name> (data kept; rename back to restore).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const tableExists = async (t) => (await query(
    'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [t]))[0].n > 0;

async function addIndex(table, name, columns) {
    if (!(await tableExists(table))) return;
    const [idx] = await query(
        'SELECT COUNT(*) AS n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
        [table, name]);
    if (idx.n) return;
    await query(`ALTER TABLE \`${table}\` ADD INDEX \`${name}\` (${columns.map((c) => `\`${c}\``).join(', ')})`);
    console.warn(`${table}: added index ${name}`);
}

async function toDecimal(table, column, type) {
    const [col] = await query(
        `SELECT DATA_TYPE AS t, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS def FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [table, column]);
    if (!col || !['float', 'double'].includes(String(col.t).toLowerCase())) return;
    const nullable = col.nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const def = col.def != null ? ` DEFAULT ${pool.escape(Number(col.def))}` : '';
    await query(`ALTER TABLE \`${table}\` MODIFY \`${column}\` ${type} ${nullable}${def}`);
    console.warn(`${table}.${column}: ${col.t} -> ${type}`);
}

// Not referenced by any controller, service or route (audit, Nov 2026).
const UNUSED_TABLES = [
    'AvailabilityForms', 'CallBackForms', 'DriverLocationPings', 'FranchiseEnquiryForms', 'ProductNotify',
    'RewardMilestones', 'Warehouses', 'abandoned_carts', 'cashback_rules', 'cashback_transactions',
    'customer_milestones', 'memberships', 'milestone_rewards', 'notification_media', 'order_timeline',
    'sale_products', 'scheduled_orders', 'wallet_expiry', 'wallet_transactions',
];

async function run() {
    await addIndex('Orders', 'idx_orders_status_created', ['OrderStatus', 'CreatedAt']);
    await addIndex('Orders', 'idx_orders_created', ['CreatedAt']);
    await addIndex('OrderItems', 'idx_orderitems_product', ['ProductID']);
    await addIndex('Wallets', 'idx_wallets_user', ['UserID']);
    await addIndex('SearchLogs', 'idx_searchlogs_user', ['UserID']);
    await addIndex('UserNotifications', 'idx_usernotifications_created', ['CreatedAt']);

    await toDecimal('Wallets', 'Amount', 'DECIMAL(15,2)');
    await toDecimal('Orders', 'TipAmount', 'DECIMAL(10,2)');
    await toDecimal('AdminShopToggleSettings', 'PricePerKm', 'DECIMAL(10,2)');

    const orphans = await query('DELETE ci FROM CartItems ci LEFT JOIN Carts c ON c.CartID = ci.CartID WHERE c.CartID IS NULL');
    if (orphans.affectedRows) console.warn(`CartItems: removed ${orphans.affectedRows} line(s) without a cart`);

    // Only on servers where table names are case-sensitive or the name is unambiguous.
    for (const t of UNUSED_TABLES) {
        const archived = `zz_archived_${t}`;
        if (await tableExists(t) && !(await tableExists(archived))) {
            await query(`RENAME TABLE \`${t}\` TO \`${archived}\``);
            console.warn(`${t}: archived as ${archived}`);
        }
    }
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('DB hardening migration failed:', err.message);
        process.exit(1);
    });
}
