require('dotenv').config({ path: './.env' });
const mysql = require('mysql');
const pool = mysql.createPool({
  connectionLimit: 2,
  password: process.env.PASSWORD,
  user: process.env.DB_USER,
  database: process.env.db,
  host: process.env.HOST,
  port: process.env.DB_PORT || 3306
});

const tables = ['Orders', 'OrderItems', 'OrderStatusTimeline', 'ProductVariants', 'Products', 'Wallets', 'AdminUsers', 'Settings', 'PromoCodes'];
let done = 0;
tables.forEach(t => {
  pool.query(`DESCRIBE ${t}`, (err, cols) => {
    if (err) console.log(t, 'err:', err.message);
    else console.log('\n=== ' + t + ' ===\n' + cols.map(c => c.Field + ' (' + c.Type + ' ' + (c.Null === 'YES' ? 'NULL' : 'NOT NULL') + (c.Default ? ' DEFAULT ' + c.Default : '') + ')').join('\n'));
    done++;
    if (done === tables.length) pool.end();
  });
});
