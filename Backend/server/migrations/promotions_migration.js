// Welcome offer (₹ off each of a customer's first N orders) and "Our app: X% lower"
// price comparison tags. Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function addOrderColumn(name, type) {
    const [col] = await query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Orders' AND COLUMN_NAME = ?`, [name]);
    if (!col.n) {
        await query(`ALTER TABLE Orders ADD COLUMN ${name} ${type}`);
        console.log(`Orders: added ${name}`);
    }
}

async function run() {
    // One row (ID = 1). Steps: JSON list of rupee amounts, one per order: [50, 50, 50].
    await query(`CREATE TABLE IF NOT EXISTS WelcomeOffer (
        ID INT NOT NULL PRIMARY KEY,
        Enabled TINYINT(1) NOT NULL DEFAULT 0,
        Title VARCHAR(80) NOT NULL DEFAULT 'Welcome offer for you!',
        MinOrderValue DECIMAL(10,2) NOT NULL DEFAULT 299,
        StepsJson VARCHAR(500) NOT NULL DEFAULT '[50,50,50]',
        UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    await query(`INSERT IGNORE INTO WelcomeOffer (ID) VALUES (1)`);

    // Which welcome step an order used (1 = first order) and how much it took off.
    await addOrderColumn('WelcomeStep', 'TINYINT NULL');
    await addOrderColumn('WelcomeDiscount', 'DECIMAL(10,2) NOT NULL DEFAULT 0');

    // "Our app: 40% lower" on chosen products, shown in SortOrder.
    await query(`CREATE TABLE IF NOT EXISTS ProductPriceCompare (
        ProductID INT NOT NULL PRIMARY KEY,
        PercentLower INT NOT NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        Status TINYINT(1) NOT NULL DEFAULT 1,
        CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Promotions migration failed:', err.message);
        process.exit(1);
    });
}
