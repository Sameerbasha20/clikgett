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

pool.query("DESCRIBE Orders", (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    const matching = rows.filter(r => r.Field.toLowerCase().includes('cancel') || r.Field.toLowerCase().includes('reason'));
    console.log("Matching columns in Orders:", matching.map(r => ({ Field: r.Field, Type: r.Type })));
    process.exit(0);
});
