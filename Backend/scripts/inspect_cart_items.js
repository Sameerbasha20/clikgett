const pool = require('../server/utils/db');

async function test() {
    pool.query('SELECT * FROM CartItems LIMIT 10', (err, rows) => {
        if (err) console.error(err);
        else console.log('CartItems sample:', rows);

        pool.query(`
            SELECT c.CartID, c.UserID, c.isOrderLinked, c.UpdatedAt, c.created_at,
                   COUNT(ci.CartItemID) as itemCount
            FROM Carts c
            JOIN CartItems ci ON c.CartID = ci.CartID
            WHERE c.isOrderLinked = 1
            GROUP BY c.CartID
            LIMIT 5
        `, (e2, r2) => {
            console.log('Active carts with items:', r2);
            pool.end();
        });
    });
}

test();
