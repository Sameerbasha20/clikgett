const mysql = require('mysql');
require('dotenv').config({ path: './.env' });

const pool = mysql.createPool({
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT
});

pool.query("ALTER TABLE product_restrictions MODIFY COLUMN RestrictionType VARCHAR(50) NOT NULL", (err, res) => {
    if (err) console.error("Error altering product_restrictions:", err);
    else console.log("product_restrictions.RestrictionType successfully converted to VARCHAR(50)");
    process.exit(0);
});
