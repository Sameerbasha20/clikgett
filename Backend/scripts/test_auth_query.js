const pool = require('../server/utils/db');

async function testAuthoritativeQuery() {
    console.time('AuthoritativeQuery');
    const sql = `
        SELECT 
            COALESCE(acl.LogID, 0) AS LogID,
            c.CartID,
            c.UserID,
            u.FirstName, u.LastName, u.MobileNumber, u.EmailID,
            COALESCE(acl.Status, 'active') AS Status,
            COALESCE(acl.TotalAmount, cart_calc.CalculatedTotal) AS TotalAmount,
            cart_calc.ItemCount,
            acl.CartSnapshot,
            acl.ReminderSentAt,
            acl.ReminderCount,
            cart_calc.LastActivity,
            ROUND(TIMESTAMPDIFF(SECOND, cart_calc.LastActivity, NOW()) / 3600.0, 1) AS HoursSinceActivity,
            DATE_ADD(cart_calc.LastActivity, INTERVAL 8 HOUR) AS AbandonedAt
        FROM Carts c
        JOIN (
            SELECT 
                ci.CartID,
                COUNT(ci.CartItemID) AS ItemCount,
                COALESCE(SUM(ci.Quantity * COALESCE(NULLIF(pv.OfferPrice, 0), pv.Price, ci.Price, 0)), 0) AS CalculatedTotal,
                GREATEST(COALESCE(c_sub.UpdatedAt, c_sub.created_at), COALESCE(MAX(ci.UpdatedAt), c_sub.UpdatedAt, c_sub.created_at)) AS LastActivity
            FROM Carts c_sub
            JOIN CartItems ci ON c_sub.CartID = ci.CartID
            LEFT JOIN ProductVariants pv ON ci.VariantID = pv.VariantID
            WHERE c_sub.isOrderLinked = 1
            GROUP BY ci.CartID, c_sub.UpdatedAt, c_sub.created_at
            HAVING ItemCount > 0
               AND LastActivity < DATE_SUB(NOW(), INTERVAL 8 HOUR)
        ) cart_calc ON c.CartID = cart_calc.CartID
        LEFT JOIN AbandonedCartLogs acl ON c.CartID = acl.CartID AND acl.Status = 'active'
        LEFT JOIN Users u ON c.UserID = u.UserID
        WHERE c.isOrderLinked = 1
        ORDER BY cart_calc.LastActivity DESC
        LIMIT 200
    `;

    pool.query(sql, (err, rows) => {
        console.timeEnd('AuthoritativeQuery');
        if (err) {
            console.error(err);
        } else {
            console.log('Total rows returned:', rows.length);
            if (rows.length > 0) {
                console.log('Sample row:', rows[0]);
            }
        }
        pool.end();
    });
}

testAuthoritativeQuery();
