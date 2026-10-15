const pool = require('mysql').createPool({
    connectionLimit: 1,
    password: 'root',
    user: 'root',
    database: 'clikgett',
    host: 'localhost',
    port: 3306
});

pool.query('SHOW TABLES', function(err, results) {
    if (err) {
        console.log('Error:', err.message);
    } else {
        console.log('Tables:', results.map(r => Object.keys(r)[0]));
    }
    pool.end();
});