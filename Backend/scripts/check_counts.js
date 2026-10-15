const pool = require('../server/utils/db');

async function check() {
    pool.query('SELECT COUNT(*) as cnt FROM Carts WHERE isOrderLinked = 1', (e, r) => {
        console.log('Total active carts:', r[0].cnt);
        pool.query(`
            SELECT COUNT(DISTINCT c.CartID) as cnt
            FROM Carts c
            JOIN CartItems ci ON c.CartID = ci.CartID
            WHERE c.isOrderLinked = 1
        `, (e2, r2) => {
            console.log('Active carts with items:', r2[0].cnt);
            pool.end();
        });
    });
}
check();
