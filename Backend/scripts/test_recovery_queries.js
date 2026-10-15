const pool = require('../server/utils/db');

async function testRecoveryQueries() {
    console.time('inactiveLogs');
    const inactiveLogs = await new Promise((resolve, reject) => {
        pool.query(`
            SELECT acl.LogID 
            FROM AbandonedCartLogs acl
            JOIN Carts c ON acl.CartID = c.CartID
            LEFT JOIN CartItems ci ON c.CartID = ci.CartID
            WHERE acl.Status = 'active'
            GROUP BY acl.LogID, c.isOrderLinked
            HAVING c.isOrderLinked = 0 OR COUNT(ci.CartItemID) = 0
        `, (err, rows) => err ? reject(err) : resolve(rows));
    });
    console.timeEnd('inactiveLogs');
    console.log('inactiveLogs count:', inactiveLogs.length);

    console.time('revivedLogs');
    const revivedLogs = await new Promise((resolve, reject) => {
        pool.query(`
            SELECT acl.LogID
            FROM AbandonedCartLogs acl
            JOIN Carts c ON acl.CartID = c.CartID
            LEFT JOIN CartItems ci ON c.CartID = ci.CartID
            WHERE acl.Status = 'active'
            GROUP BY acl.LogID, c.UpdatedAt, c.created_at
            HAVING GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)) >= DATE_SUB(NOW(), INTERVAL 8 HOUR)
        `, (err, rows) => err ? reject(err) : resolve(rows));
    });
    console.timeEnd('revivedLogs');
    console.log('revivedLogs count:', revivedLogs.length);

    pool.end();
}

testRecoveryQueries();
