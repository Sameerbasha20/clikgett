const pool = require('../server/utils/db');

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

/**
 * Authoritative abandoned cart synchronization & retrieval function
 */
async function syncAndGetAbandonedCarts(options = {}) {
    const thresholdHours = options.thresholdHours || 8;
    const filterStatus = options.status || 'active'; // 'active', 'recovered', 'expired', or 'all'

    // 1. Mark logs as 'recovered' for any carts that have since been ordered (isOrderLinked = 0)
    await queryAsync(`
        UPDATE AbandonedCartLogs acl
        JOIN Carts c ON acl.CartID = c.CartID
        SET acl.Status = 'recovered',
            acl.RecoveredAt = COALESCE(acl.RecoveredAt, NOW()),
            acl.UpdatedAt = NOW()
        WHERE c.isOrderLinked = 0
          AND acl.Status = 'active'
    `);

    // 2. Mark logs as 'recovered' if customer returned and performed recent activity (within thresholdHours)
    await queryAsync(`
        UPDATE AbandonedCartLogs acl
        JOIN (
            SELECT c.CartID,
                   GREATEST(
                       COALESCE(c.UpdatedAt, c.created_at),
                       COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)
                   ) AS LastActivity
            FROM Carts c
            JOIN CartItems ci ON c.CartID = ci.CartID
            WHERE c.isOrderLinked = 1
            GROUP BY c.CartID, c.UpdatedAt, c.created_at
            HAVING LastActivity >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        ) active_carts ON acl.CartID = active_carts.CartID
        SET acl.Status = 'recovered',
            acl.RecoveredAt = COALESCE(acl.RecoveredAt, NOW()),
            acl.UpdatedAt = NOW()
        WHERE acl.Status = 'active'
    `, [thresholdHours]);

    // 3. Mark logs as 'expired' for carts that have been emptied (no CartItems remain)
    await queryAsync(`
        UPDATE AbandonedCartLogs acl
        LEFT JOIN CartItems ci ON acl.CartID = ci.CartID
        SET acl.Status = 'expired',
            acl.UpdatedAt = NOW()
        WHERE acl.Status = 'active'
          AND ci.CartItemID IS NULL
    `);

    // 4. Find all currently qualifying abandoned carts:
    // - isOrderLinked = 1
    // - has at least 1 item
    // - LastActivity strictly < NOW() - 8 HOURS (not <=)
    const qualifying = await queryAsync(`
        SELECT 
            c.CartID,
            c.UserID,
            c.isOrderLinked,
            GREATEST(
                COALESCE(c.UpdatedAt, c.created_at),
                COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)
            ) AS LastActivity,
            ROUND(TIMESTAMPDIFF(SECOND, GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)), NOW()) / 3600.0, 2) AS HoursSinceActivity,
            DATE_ADD(GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)), INTERVAL ? HOUR) AS AbandonedAt,
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
        WHERE c.isOrderLinked = 1
        GROUP BY c.CartID, c.UserID, c.isOrderLinked, c.UpdatedAt, c.created_at, u.FirstName, u.LastName, u.MobileNumber, u.EmailID
        HAVING ItemCount > 0 
           AND LastActivity < DATE_SUB(NOW(), INTERVAL ? HOUR)
        ORDER BY LastActivity DESC
    `, [thresholdHours, thresholdHours]);

    // 5. Ensure AbandonedCartLogs has entries with accurate snapshots for each qualifying cart
    for (const cart of qualifying) {
        // Fetch items snapshot
        const items = await queryAsync(`
            SELECT ci.CartItemID, ci.ProductID, ci.VariantID, ci.Quantity,
                   p.ProductName,
                   COALESCE(NULLIF(pv.OfferPrice, 0), pv.Price, ci.Price, 0) as Price,
                   pv.metricvalue, pv.metrictype
            FROM CartItems ci
            LEFT JOIN Products p ON ci.ProductID = p.ProductID
            LEFT JOIN ProductVariants pv ON ci.VariantID = pv.VariantID
            WHERE ci.CartID = ?
        `, [cart.CartID]);

        const snapshotJson = JSON.stringify(items);

        // Check if log exists
        const existingLogs = await queryAsync('SELECT * FROM AbandonedCartLogs WHERE CartID = ?', [cart.CartID]);
        if (existingLogs.length === 0) {
            const insRes = await queryAsync(`
                INSERT INTO AbandonedCartLogs 
                (UserID, CartID, CartSnapshot, TotalAmount, ItemCount, Status, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, 'active', ?, NOW())
            `, [
                cart.UserID,
                cart.CartID,
                snapshotJson,
                cart.TotalAmount,
                cart.ItemCount,
                cart.AbandonedAt // CreatedAt corresponds to when it became abandoned
            ]);
            cart.LogID = insRes.insertId;
            cart.Status = 'active';
            cart.CartSnapshot = snapshotJson;
        } else {
            const log = existingLogs[0];
            // If already marked recovered/expired by admin, keep that status unless reactivation
            cart.LogID = log.LogID;
            cart.Status = log.Status;
            cart.CartSnapshot = log.CartSnapshot;
            // Update snapshot & amounts if active
            if (log.Status === 'active') {
                await queryAsync(`
                    UPDATE AbandonedCartLogs
                    SET CartSnapshot = ?, TotalAmount = ?, ItemCount = ?, UpdatedAt = NOW()
                    WHERE LogID = ?
                `, [snapshotJson, cart.TotalAmount, cart.ItemCount, log.LogID]);
                cart.CartSnapshot = snapshotJson;
            }
        }
    }

    // Return the list filtered by requested status
    if (filterStatus === 'all') {
        return qualifying;
    }
    return qualifying.filter(c => c.Status === filterStatus);
}

async function run() {
    try {
        const results = await syncAndGetAbandonedCarts({ thresholdHours: 8, status: 'active' });
        console.log(`Found ${results.length} active abandoned carts (> 8h):`);
        if (results.length > 0) {
            console.log('Sample:', results[0]);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

run();
