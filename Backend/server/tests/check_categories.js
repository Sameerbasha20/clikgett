const pool = require('../utils/db');
pool.query("SELECT CategoryID, CategoryName FROM Categories", (err, rows) => {
    if (err) {
        console.error("DB error:", err);
    } else {
        console.log("Categories:", JSON.stringify(rows, null, 2));
    }
    pool.query("SELECT ProductID, ProductName, CategoryID FROM Products WHERE CategoryID IN (SELECT CategoryID FROM Categories WHERE CategoryName LIKE '%Fruit%') LIMIT 5", (err2, rows2) => {
        if (!err2) {
            console.log("Sample Fruit Products:", JSON.stringify(rows2, null, 2));
        }
        process.exit(0);
    });
});
