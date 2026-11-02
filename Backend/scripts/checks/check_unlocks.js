require('dotenv').config({ path: './.env' });
const mysql = require('mysql');
const pool = mysql.createPool({
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT
});

pool.query('SELECT * FROM product_unlocks', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("product_unlocks rows:", JSON.stringify(rows, null, 2));
    }
    process.exit(0);
});
