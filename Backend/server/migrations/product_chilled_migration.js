// "Chilled" tag set by the admin per product (Products.IsChilled). When the column is first
// added, products in cold-drink, juice, soda, ice cream and frozen subcategories start as chilled.
// Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    const [col] = await query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Products' AND COLUMN_NAME = 'IsChilled'`);
    if (col.n) return;
    await query('ALTER TABLE Products ADD COLUMN IsChilled TINYINT(1) NOT NULL DEFAULT 0');
    const seeded = await query(
        `UPDATE Products p JOIN SubCategories sc ON sc.SubCategoryID = p.SubCategoryID
            SET p.IsChilled = 1
          WHERE sc.SubCategoryName REGEXP 'cool ?drink|soft ?drink|cold ?drink|juice|soda|ice ?cream|frozen'`);
    console.log(`Products: added IsChilled (${seeded.affectedRows} cold-drink products marked chilled)`);
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Product chilled migration failed:', err.message);
        process.exit(1);
    });
}
