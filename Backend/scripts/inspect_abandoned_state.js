const pool = require('../server/utils/db');

async function test() {
    pool.query(`
        SELECT 
            DATE_SUB(NOW(), INTERVAL 8 HOUR) as threshold,
            (DATE_SUB(NOW(), INTERVAL 8 HOUR) < DATE_SUB(NOW(), INTERVAL 8 HOUR)) as is_8h_abandoned,
            (DATE_SUB(NOW(), INTERVAL 28801 SECOND) < DATE_SUB(NOW(), INTERVAL 8 HOUR)) as is_8h1s_abandoned,
            (DATE_SUB(NOW(), INTERVAL 28799 SECOND) < DATE_SUB(NOW(), INTERVAL 8 HOUR)) as is_7h59m_abandoned,
            (DATE_SUB(NOW(), INTERVAL 6 HOUR) < DATE_SUB(NOW(), INTERVAL 8 HOUR)) as is_6h_abandoned
    `, (err, rows) => {
        if (err) console.error(err);
        else console.log('Boundary test result:', rows);

        pool.query('SELECT COUNT(*) as totalCarts, SUM(isOrderLinked = 1) as activeCarts FROM Carts', (e1, r1) => {
            console.log('Carts summary:', r1);
            pool.query('SELECT COUNT(*) as totalLogs FROM AbandonedCartLogs', (e2, r2) => {
                console.log('AbandonedCartLogs count:', r2);
                pool.query('SELECT * FROM AbandonedCartLogs LIMIT 5', (e3, r3) => {
                    console.log('Sample AbandonedCartLogs:', r3);
                    pool.end();
                });
            });
        });
    });
}

test();
