const mysql = require('mysql');
require('dotenv').config({ path: './.env' });

const pool = mysql.createPool({
    connectionLimit: 2,
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT
});

pool.query("SHOW TABLES LIKE 'order_item_removals'", (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('order_item_removals table exists:', rows.length > 0);
    }
    process.exit(0);
});
