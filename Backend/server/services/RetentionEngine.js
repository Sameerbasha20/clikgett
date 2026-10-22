const pool = require('../utils/db');

class RetentionEngine {
    /**
     * Query helper with Promise
     */
    static query(sql, params = []) {
        return new Promise((resolve, reject) => {
            pool.query(sql, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    /**
     * Get detailed item snapshot for a cart with pricing from variants
     */
    static async getCartItemSnapshot(cartId) {
        try {
            const items = await this.query(`
                SELECT ci.CartItemID, ci.ProductID, ci.VariantID, ci.Quantity,
                       COALESCE(NULLIF(pv.OfferPrice, 0), pv.Price, ci.Price, 0) AS Price,
                       pv.OfferPrice, pv.metricvalue, pv.metrictype,
                       COALESCE(p.ProductName, CONCAT('Product #', ci.ProductID)) AS ProductName
                FROM CartItems ci
                LEFT JOIN Products p ON ci.ProductID = p.ProductID
                LEFT JOIN ProductVariants pv ON ci.VariantID = pv.VariantID
                WHERE ci.CartID = ?
            `, [cartId]);
            return items;
        } catch (e) {
            console.error('[RetentionEngine] Error getting cart snapshot:', e);
            return [];
        }
    }

    /**
     * Step 4: Detect carts abandoned for more than 8 hours and sync AbandonedCartLogs
     * Intended lifecycle:
     *   0-6h: ACTIVE
     *   >6-8h: GRACE / MONITORING
     *   >8h: ABANDONED (last_activity < NOW() - INTERVAL 8 HOUR)
     * @param {number} thresholdHours default 8
     */
    static async processAbandonedCarts(thresholdHours = 8) {
        console.log(`[RetentionEngine] Scanning for carts abandoned > ${thresholdHours} hours...`);
        try {
            // 1. Auto-recover any active logs for carts that have since been ordered (isOrderLinked = 0) or emptied
            const inactiveLogs = await this.query(`
                SELECT acl.LogID 
                FROM AbandonedCartLogs acl
                JOIN Carts c ON acl.CartID = c.CartID
                LEFT JOIN CartItems ci ON c.CartID = ci.CartID
                WHERE acl.Status = 'active'
                GROUP BY acl.LogID, c.isOrderLinked
                HAVING c.isOrderLinked = 0 OR COUNT(ci.CartItemID) = 0
            `);
            if (inactiveLogs.length > 0) {
                const logIds = inactiveLogs.map(l => l.LogID);
                await this.query(`UPDATE AbandonedCartLogs SET Status = 'recovered', RecoveredAt = NOW(), UpdatedAt = NOW() WHERE LogID IN (?)`, [logIds]);
                console.log(`[RetentionEngine] Recovered ${logIds.length} abandoned logs (carts ordered or emptied).`);
            }

            // 2. Auto-recover any active logs for carts where customer returned and modified cart within thresholdHours
            const revivedLogs = await this.query(`
                SELECT acl.LogID
                FROM AbandonedCartLogs acl
                JOIN Carts c ON acl.CartID = c.CartID
                LEFT JOIN CartItems ci ON c.CartID = ci.CartID
                WHERE acl.Status = 'active'
                GROUP BY acl.LogID, c.UpdatedAt, c.created_at
                HAVING GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)) >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            `, [thresholdHours]);
            if (revivedLogs.length > 0) {
                const revivedIds = revivedLogs.map(l => l.LogID);
                await this.query(`UPDATE AbandonedCartLogs SET Status = 'recovered', RecoveredAt = NOW(), UpdatedAt = NOW() WHERE LogID IN (?)`, [revivedIds]);
                console.log(`[RetentionEngine] Recovered ${revivedIds.length} abandoned logs (customer resumed activity).`);
            }

            // 3. Find active unplaced carts with items older than thresholdHours (strictly > thresholdHours based on last activity)
            const abandonedCarts = await this.query(`
                SELECT c.CartID, c.UserID,
                       GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)) AS LastActivity,
                       ROUND(TIMESTAMPDIFF(SECOND, GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)), NOW()) / 3600.0, 2) AS HoursSinceActivity,
                       u.FirstName, u.LastName, u.MobileNumber, u.EmailID,
                       COUNT(ci.CartItemID) as ItemCount
                FROM Carts c
                JOIN CartItems ci ON c.CartID = ci.CartID
                LEFT JOIN Users u ON c.UserID = u.UserID
                WHERE c.isOrderLinked = 1 
                GROUP BY c.CartID, c.UserID, c.UpdatedAt, c.created_at, u.FirstName, u.LastName, u.MobileNumber, u.EmailID
                HAVING ItemCount > 0 
                   AND LastActivity < DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY LastActivity DESC
                LIMIT 200
            `, [thresholdHours]);

            let notificationsSent = 0;
            const processedDetails = [];

            for (const cart of abandonedCarts) {
                if (!cart.UserID) continue;

                // Load detailed items breakdown for snapshot
                const items = await this.getCartItemSnapshot(cart.CartID);
                const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.Price || 0) * parseInt(item.Quantity || 1, 10)), 0);

                // Check or create AbandonedCartLogs entry
                let log = await this.query("SELECT * FROM AbandonedCartLogs WHERE CartID = ? AND Status = 'active'", [cart.CartID]);
                let logId = null;

                if (log.length === 0) {
                    const insertRes = await this.query(`
                        INSERT INTO AbandonedCartLogs 
                        (UserID, CartID, CartSnapshot, TotalAmount, ItemCount, Status, CreatedAt, UpdatedAt)
                        VALUES (?, ?, ?, ?, ?, 'active', DATE_ADD(?, INTERVAL ? HOUR), NOW())
                    `, [
                        cart.UserID,
                        cart.CartID,
                        JSON.stringify(items),
                        totalAmount,
                        items.length,
                        cart.LastActivity,
                        thresholdHours
                    ]);
                    logId = insertRes.insertId;
                } else {
                    logId = log[0].LogID;
                    // Keep snapshot and amounts fresh
                    await this.query(`
                        UPDATE AbandonedCartLogs 
                        SET CartSnapshot = ?, TotalAmount = ?, ItemCount = ?, UpdatedAt = NOW()
                        WHERE LogID = ?
                    `, [JSON.stringify(items), totalAmount, items.length, logId]);
                }

                // Check if notification already sent in the last thresholdHours
                const recentNotif = await this.query(`
                    SELECT NotificationID FROM UserNotifications 
                    WHERE UserID = ? 
                      AND (Title LIKE '%cart%' OR Title LIKE '%waiting%')
                      AND CreatedAt > DATE_SUB(NOW(), INTERVAL ? HOUR)
                    LIMIT 1
                `, [cart.UserID, thresholdHours]);

                if (recentNotif.length === 0) {
                    const customerName = cart.FirstName ? ` ${cart.FirstName}` : '';
                    const title = '🛒 Items waiting in your cart!';
                    const message = `Hi${customerName}, you left ${cart.ItemCount} item(s) in your cart. Complete your order today before stock runs out!`;

                    // Insert notification for user
                    await this.query(`
                        INSERT INTO UserNotifications (UserID, Title, Message, Status, Type, CreatedAt)
                        VALUES (?, ?, ?, 1, 1, NOW())
                    `, [cart.UserID, title, message]);

                    // Also as a phone notification (only reaches customers with notifications on).
                    try {
                        await require('../controllers/CommonController').send_push_notifications({ Title: title, Message: message }, cart.UserID);
                    } catch (pushErr) {
                        console.error('[RetentionEngine] cart reminder push failed:', pushErr && pushErr.message);
                    }

                    // Update AbandonedCartLogs
                    await this.query(`
                        UPDATE AbandonedCartLogs 
                        SET ReminderSentAt = NOW(), 
                            ReminderCount = ReminderCount + 1, 
                            UpdatedAt = NOW() 
                        WHERE LogID = ?
                    `, [logId]);

                    notificationsSent++;
                    processedDetails.push({
                        CartID: cart.CartID,
                        UserID: cart.UserID,
                        Customer: cart.FirstName,
                        ItemCount: cart.ItemCount,
                        TotalAmount: totalAmount,
                        Notified: true
                    });
                } else {
                    processedDetails.push({
                        CartID: cart.CartID,
                        UserID: cart.UserID,
                        Customer: cart.FirstName,
                        ItemCount: cart.ItemCount,
                        TotalAmount: totalAmount,
                        Notified: false,
                        Reason: 'Already notified within interval'
                    });
                }
            }

            console.log(`[RetentionEngine] Scanned ${abandonedCarts.length} abandoned carts. Sent ${notificationsSent} notifications.`);
            return {
                Success: true,
                ScannedCarts: abandonedCarts.length,
                NotificationsSent: notificationsSent,
                Details: processedDetails
            };
        } catch (error) {
            console.error('[RetentionEngine] Error processing abandoned carts:', error);
            throw error;
        }
    }

    /**
     * Step 5: Ensure Win-back coupon exists and send retention coupon to inactive users
     * @param {number} inactivityDays default 14
     * @param {string} couponCode default 'COMEBACK20'
     */
    static async processWinBackCoupons(inactivityDays = 14, couponCode = 'COMEBACK20') {
        console.log(`[RetentionEngine] Scanning for users inactive > ${inactivityDays} days...`);
        try {
            // 1. Ensure COMEBACK20 coupon is active in PromoCodes table
            const existingCoupon = await this.query("SELECT * FROM PromoCodes WHERE UPPER(PromoCode) = ?", [couponCode.toUpperCase()]);
            if (existingCoupon.length === 0) {
                await this.query(`
                    INSERT INTO PromoCodes 
                    (PromoCode, Type, OfferValue, MinOrderValue, MaxDiscount, Status, StartDate, EndDate, Description)
                    VALUES (?, 1, 20, 199, 100, 1, '2024-01-01', '2030-12-31', 'Special 20% off win-back coupon for returning customers')
                `, [couponCode.toUpperCase()]);
                console.log(`[RetentionEngine] Created active win-back coupon: ${couponCode}`);
            } else if (existingCoupon[0].Status === 0) {
                await this.query("UPDATE PromoCodes SET Status = 1 WHERE PromoCodeID = ?", [existingCoupon[0].PromoCodeID]);
                console.log(`[RetentionEngine] Activated win-back coupon: ${couponCode}`);
            }

            // 2. Find inactive users (no order in inactivityDays, or signed up > inactivityDays without order)
            const inactiveUsers = await this.query(`
                SELECT u.UserID, u.FirstName, u.LastName, u.MobileNumber, u.CreatedAt,
                       MAX(o.CreatedAt) as LastOrderDate,
                       DATEDIFF(NOW(), COALESCE(MAX(o.CreatedAt), u.CreatedAt)) as DaysInactive
                FROM Users u
                LEFT JOIN Orders o ON u.UserID = o.UserID AND o.OrderStatus = 1
                GROUP BY u.UserID, u.FirstName, u.LastName, u.MobileNumber, u.CreatedAt
                HAVING DaysInactive >= ?
                LIMIT 50
            `, [inactivityDays]);

            let couponsSent = 0;
            const sentDetails = [];

            for (const user of inactiveUsers) {
                if (!user.UserID) continue;

                // Check if win-back notification already sent within the last inactivityDays
                const recentNotif = await this.query(`
                    SELECT NotificationID FROM UserNotifications 
                    WHERE UserID = ? 
                      AND (Title LIKE '%miss you%' OR Message LIKE ${pool.escape('%' + couponCode + '%')})
                      AND CreatedAt > DATE_SUB(NOW(), INTERVAL ? DAY)
                    LIMIT 1
                `, [user.UserID, inactivityDays]);

                if (recentNotif.length === 0) {
                    const name = user.FirstName ? ` ${user.FirstName}` : '';
                    const title = '🎁 We miss you! Enjoy 20% OFF';
                    const message = `Hi${name}, it's been a while! Use coupon code ${couponCode} on your next order above ₹199 to enjoy 20% off. Valid for a limited time!`;

                    await this.query(`
                        INSERT INTO UserNotifications (UserID, Title, Message, Status, Type, CreatedAt)
                        VALUES (?, ?, ?, 1, 1, NOW())
                    `, [user.UserID, title, message]);

                    couponsSent++;
                    sentDetails.push({
                        UserID: user.UserID,
                        Customer: user.FirstName,
                        DaysInactive: user.DaysInactive,
                        CouponCode: couponCode,
                        Notified: true
                    });
                }
            }

            console.log(`[RetentionEngine] Found ${inactiveUsers.length} inactive users. Sent ${couponsSent} win-back coupons.`);
            return {
                Success: true,
                CouponCode: couponCode,
                Discount: '20%',
                InactiveUsersCount: inactiveUsers.length,
                CouponsSent: couponsSent,
                Details: sentDetails
            };
        } catch (error) {
            console.error('[RetentionEngine] Error processing win-back coupons:', error);
            throw error;
        }
    }

    /**
     * Start background automation interval (hourly check for 8-hour abandoned carts)
     */
    static startBackgroundRunner() {
        console.log('[RetentionEngine] Initializing background retention automation (8h abandoned cart policy)...');
        
        // Initial run delayed by 15 seconds to let server finish boot
        setTimeout(async () => {
            try {
                await this.processAbandonedCarts(8);
                await this.processWinBackCoupons(14, 'COMEBACK20');
            } catch (err) {
                console.error('[RetentionEngine] Error during initial background run:', err.message);
            }
        }, 15000);

        // Periodic run every 1 hour for abandoned carts, 6 hours for coupons
        setInterval(async () => {
            try {
                await this.processAbandonedCarts(8);
            } catch (err) {
                console.error('[RetentionEngine] Error in hourly abandoned carts runner:', err.message);
            }
        }, 60 * 60 * 1000);

        setInterval(async () => {
            try {
                await this.processWinBackCoupons(14, 'COMEBACK20');
            } catch (err) {
                console.error('[RetentionEngine] Error in win-back coupon runner:', err.message);
            }
        }, 6 * 60 * 60 * 1000);
    }
}

module.exports = RetentionEngine;
