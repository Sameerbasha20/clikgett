const pool = require('../server/utils/db');

function queryAsync(sql, params = []) {
    const t0 = Date.now();
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            console.log(`Query took ${Date.now() - t0}ms:`, sql.trim().substring(0, 60).replace(/\n/g, ' '));
            resolve(rows);
        });
    });
}

async function testJoined() {
    try {
        const rows = await queryAsync(`
            SELECT 
                c.CartID,
                c.UserID,
                COALESCE(acl.LogID, c.CartID) as LogID,
                COALESCE(acl.Status, 'active') as Status,
                acl.ReminderSentAt,
                COALESCE(acl.ReminderCount, 0) as ReminderCount,
                acl.RecoveredAt,
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
                u.EmailID
            FROM Carts c
            JOIN CartItems ci ON c.CartID = ci.CartID
            LEFT JOIN Products p ON ci.ProductID = p.ProductID
            LEFT JOIN ProductVariants pv ON ci.VariantID = pv.VariantID
            LEFT JOIN Users u ON c.UserID = u.UserID
            LEFT JOIN AbandonedCartLogs acl ON c.CartID = acl.CartID
            WHERE c.isOrderLinked = 1
            GROUP BY c.CartID, c.UserID, c.isOrderLinked, c.UpdatedAt, c.created_at, acl.LogID, acl.Status, acl.ReminderSentAt, acl.ReminderCount, acl.RecoveredAt, u.FirstName, u.LastName, u.MobileNumber, u.EmailID
            HAVING ItemCount > 0 
               AND LastActivity < DATE_SUB(NOW(), INTERVAL 8 HOUR)
            ORDER BY LastActivity DESC
            LIMIT 100
        `);

        console.log(`Found ${rows.length} joined abandoned carts:`);
        if (rows.length > 0) {
            console.log('First cart sample:', rows[0]);
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

testJoined();
