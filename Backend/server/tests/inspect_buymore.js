const pool = require('../utils/db');

async function test() {
  pool.query('DESCRIBE buy_more_config', (err, rows) => {
    if (err) {
      console.error('Error describing buy_more_config:', err);
    } else {
      console.log('Columns:');
      rows.forEach(r => console.log(`${r.Field} | ${r.Type} | Null:${r.Null} | Key:${r.Key} | Default:${r.Default}`));
    }
    pool.end();
  });
}

test();
