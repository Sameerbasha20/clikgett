const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql');
const pool = mysql.createPool({
  connectionLimit: 2,
  password: process.env.PASSWORD,
  user: process.env.DB_USER,
  database: process.env.db,
  host: process.env.HOST,
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
});

pool.query('SHOW TABLES', (err, tables) => {
  if (err) {
    console.error('Error fetching tables:', err.message);
    process.exit(1);
  }
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log('TABLES COUNT:', tableNames.length);
  console.log('ALL TABLES:', tableNames.sort().join(', '));
  
  const interesting = ['sales', 'Sales', 'sale_items', 'SaleItems', 'rewards', 'Rewards', 'UserRewards', 'user_rewards', 'abandoned_cart_logs', 'AbandonedCartLogs', 'ProductVariants', 'product_variants', 'OrderStatusTimeline', 'Orders', 'order_adjustments', 'buy_more_config'];
  const matches = tableNames.filter(t => interesting.map(i => i.toLowerCase()).includes(t.toLowerCase()));
  console.log('\nMatching tables:', matches);

  let done = 0;
  if (matches.length === 0) process.exit(0);
  matches.forEach(tbl => {
    pool.query(`DESCRIBE ${tbl}`, (err2, cols) => {
      console.log(`\n=== ${tbl} ===`);
      if (err2) console.log(err2.message);
      else console.log(cols.map(c => c.Field + ' (' + c.Type + ')').join(', '));
      done++;
      if (done === matches.length) process.exit(0);
    });
  });
});
