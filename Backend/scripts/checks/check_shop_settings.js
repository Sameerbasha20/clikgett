const mysql = require('mysql');
require('dotenv').config({ path: 'c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/.env' });

const pool = mysql.createPool({
    connectionLimit: 1,
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.db,
    port: process.env.DB_PORT
});

pool.query("SELECT * FROM AdminShopToggleSettings LIMIT 1", (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("AdminShopToggleSettings row:", rows[0]);
    process.exit(0);
});
