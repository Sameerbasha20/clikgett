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
        // Try different db name
        pool.changeUser({database: 'clikgett_db'}, function(err2) {
            if (err2) console.log('DB change error:', err2.message);
            else {
                pool.query('SHOW TABLES', function(err3, results3) {
                    if (err3) console.log('Still error:', err3.message);
                    else console.log(results3.map(r => Object.keys(r)[0]));
                    pool.end();
                });
            }
        });
    } else {
        console.log(results.map(r => Object.keys(r)[0]));
        pool.end();
    }
});