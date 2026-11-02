const mysql = require('mysql');
require('dotenv').config({ path: './.env' });

const pool = mysql.createPool({
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT
});

async function run() {
    const [tables] = await new Promise(res => pool.query("SHOW TABLES", (err, r) => res([r])));
    console.log("All tables in AWS RDS:", tables.map(t => Object.values(t)[0]));

    const [settings] = await new Promise(res => pool.query("SELECT * FROM Settings", (err, r) => res([r])));
    console.log("Settings rows:", settings);

    const [shopSettings] = await new Promise(res => pool.query("SELECT * FROM AdminShopToggleSettings", (err, r) => res([r])));
    console.log("AdminShopToggleSettings rows:", shopSettings);

    const [mpCols] = await new Promise(res => pool.query("DESCRIBE MembershipPlans", (err, r) => res([r])));
    console.log("MembershipPlans columns:", mpCols ? mpCols.map(c => `${c.Field} (${c.Type})`) : "Table not found");

    const [umCols] = await new Promise(res => pool.query("DESCRIBE UserMemberships", (err, r) => res([r])));
    console.log("UserMemberships columns:", umCols ? umCols.map(c => `${c.Field} (${c.Type})`) : "Table not found");

    const [saleCols] = await new Promise(res => pool.query("DESCRIBE SaleItems", (err, r) => res([r])));
    console.log("SaleItems columns:", saleCols ? saleCols.map(c => `${c.Field} (${c.Type})`) : "Table not found");

    process.exit(0);
}
run();
