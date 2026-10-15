const pool = require('../server/utils/db');

async function test() {
    pool.query(`
        SELECT c.CartID, c.UpdatedAt as cartUpdated, 
               MAX(ci.UpdatedAt) as itemUpdated,
               GREATEST(c.UpdatedAt, COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt)) as lastActivity
        FROM Carts c
        JOIN CartItems ci ON c.CartID = ci.CartID
        WHERE c.isOrderLinked = 1
        GROUP BY c.CartID
        HAVING itemUpdated > cartUpdated
        LIMIT 10
    `, (err, rows) => {
        if (err) console.error(err);
        else console.log('Carts where itemUpdated > cartUpdated:', rows.length, rows);
        pool.end();
    });
}

test();
