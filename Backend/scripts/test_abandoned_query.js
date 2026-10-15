const pool = require('../server/utils/db');

async function testQuery() {
    const sql = `
        SELECT 
            c.CartID,
            c.UserID,
            c.isOrderLinked,
            GREATEST(
                COALESCE(c.UpdatedAt, c.created_at),
                COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)
            ) AS LastActivity,
            ROUND(TIMESTAMPDIFF(SECOND, GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)), NOW()) / 3600.0, 2) AS HoursSinceActivity,
            DATE_ADD(GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)), INTERVAL 8 HOUR) AS AbandonedAt,
            COUNT(ci.CartItemID) AS ItemCount,
            COALESCE(SUM(ci.Quantity * COALESCE(NULLIF(pv.OfferPrice, 0), pv.Price, ci.Price, 0)), 0) AS TotalAmount,
            u.FirstName,
            u.LastName,
            u.MobileNumber,
            u.EmailID,
            CASE 
                WHEN TIMESTAMPDIFF(SECOND, GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)), NOW()) <= 21600 THEN 'ACTIVE'
                WHEN TIMESTAMPDIFF(SECOND, GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)), NOW()) <= 28800 THEN 'GRACE'
                ELSE 'ABANDONED'
            END AS LifecycleStage
        FROM Carts c
        JOIN CartItems ci ON c.CartID = ci.CartID
        LEFT JOIN Products p ON ci.ProductID = p.ProductID
        LEFT JOIN ProductVariants pv ON ci.VariantID = pv.VariantID
        LEFT JOIN Users u ON c.UserID = u.UserID
        WHERE c.isOrderLinked = 1
        GROUP BY c.CartID, c.UserID, c.isOrderLinked, c.UpdatedAt, c.created_at, u.FirstName, u.LastName, u.MobileNumber, u.EmailID
        HAVING ItemCount > 0 
           AND LastActivity < DATE_SUB(NOW(), INTERVAL 8 HOUR)
        ORDER BY LastActivity DESC
        LIMIT 10
    `;

    pool.query(sql, (err, rows) => {
        if (err) {
            console.error('Query error:', err);
        } else {
            console.log('Query success! Found qualifying abandoned carts:', rows.length);
            console.log('Sample rows:', rows.slice(0, 3));
        }
        pool.end();
    });
}

testQuery();
