const mysql = require('mysql');
const assert = require('assert');
require('dotenv').config({ path: 'c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/.env' });
const PricingEngine = require('../server/services/PricingEngine');

const pool = mysql.createPool({
    connectionLimit: 2,
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.db,
    port: process.env.DB_PORT
});

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

async function runVerification() {
    console.log("===============================================================");
    console.log("VERIFYING DYNAMIC SETTINGS & ADMIN ORDER CANCELLATION WORKFLOW");
    console.log("===============================================================\n");

    try {
        // 1. VERIFY SETTINGS TABLE & ADMIN SHOP TOGGLE
        console.log("--- 1. Checking AdminShopToggleSettings Database State ---");
        const [shopSettings] = await queryAsync("SELECT * FROM AdminShopToggleSettings LIMIT 1");
        assert(shopSettings, "AdminShopToggleSettings must exist");
        console.log(`[PASS] Found settings row:`);
        console.log(`       - LongDistanceFeeEnabled: ${shopSettings.LongDistanceFeeEnabled}`);
        console.log(`       - LongDistanceThresholdKm: ${shopSettings.LongDistanceThresholdKm} km`);
        console.log(`       - LongDistanceFee: ₹${shopSettings.LongDistanceFee}`);
        console.log(`       - LargeCartThreshold1Items: ${shopSettings.LargeCartThreshold1Items}`);
        console.log(`       - LargeCartThreshold1Minutes: ${shopSettings.LargeCartThreshold1Minutes}m`);
        console.log(`       - LargeCartThreshold2Items: ${shopSettings.LargeCartThreshold2Items}`);
        console.log(`       - LargeCartThreshold2Minutes: ${shopSettings.LargeCartThreshold2Minutes}m`);
        console.log(`       - CashbackMode: ${shopSettings.CashbackMode}`);
        console.log(`       - DeliveryAddressVisibility: ${shopSettings.DeliveryAddressVisibility}`);
        console.log(`       - DeliveryProductListVisibility: ${shopSettings.DeliveryProductListVisibility}`);

        // 2. VERIFY DYNAMIC LONG-DISTANCE CHARGE
        console.log("\n--- 2. Verifying Dynamic Long-Distance Delivery Charge ---");
        // Update to 5 km threshold and ₹40 fee
        await queryAsync("UPDATE AdminShopToggleSettings SET LongDistanceFeeEnabled = 1, LongDistanceThresholdKm = 5.0, LongDistanceFee = 40.00 WHERE SettingID = ?", [shopSettings.SettingID]);
        
        const sampleCart = [{ ProductID: 1, VariantID: 1, OfferPrice: 100, Quantity: 1 }];
        
        // Test within distance (e.g. 3 km <= 5 km)
        const calcShort = await PricingEngine.calculateCart(sampleCart, null, 1, { distanceKm: 3 });
        assert(!calcShort.IsLongDistance, "Distance 3km should NOT be long-distance (threshold 5km)");
        assert.strictEqual(calcShort.LongDistanceFee, 0, "LongDistanceFee should be 0 for 3km");
        console.log(`[PASS] 3 km delivery: IsLongDistance = ${calcShort.IsLongDistance}, LongDistanceFee = ₹${calcShort.LongDistanceFee}`);

        // Test exceeding distance (e.g. 7 km > 5 km)
        const calcLong = await PricingEngine.calculateCart(sampleCart, null, 1, { distanceKm: 7 });
        assert(calcLong.IsLongDistance, "Distance 7km MUST trigger long-distance fee");
        assert.strictEqual(calcLong.LongDistanceFee, 40, "LongDistanceFee must be ₹40");
        console.log(`[PASS] 7 km delivery: IsLongDistance = ${calcLong.IsLongDistance}, LongDistanceFee = ₹${calcLong.LongDistanceFee} (Included in deliveryCharges: ₹${calcLong.DeliveryCharges})`);

        // Test with LongDistanceFeeEnabled = 0 (disabled)
        await queryAsync("UPDATE AdminShopToggleSettings SET LongDistanceFeeEnabled = 0 WHERE SettingID = ?", [shopSettings.SettingID]);
        const calcDisabled = await PricingEngine.calculateCart(sampleCart, null, 1, { distanceKm: 7 });
        assert(!calcDisabled.IsLongDistance, "Should be disabled when toggle is 0");
        assert.strictEqual(calcDisabled.LongDistanceFee, 0, "Fee must be 0 when disabled");
        console.log(`[PASS] Long distance disabled toggle: IsLongDistance = ${calcDisabled.IsLongDistance}, Fee = ₹${calcDisabled.LongDistanceFee}`);

        // Restore toggle to 1
        await queryAsync("UPDATE AdminShopToggleSettings SET LongDistanceFeeEnabled = 1 WHERE SettingID = ?", [shopSettings.SettingID]);

        // 3. VERIFY DYNAMIC LARGE CART ETA BUFFERS
        console.log("\n--- 3. Verifying Dynamic Large Cart Delivery Time Buffers ---");
        // Test with 5 items (<= 10 items)
        const cart5 = [{ ProductID: 1, VariantID: 1, OfferPrice: 50, Quantity: 5 }];
        const calcTier0 = await PricingEngine.calculateCart(cart5, null, 1);
        assert.strictEqual(calcTier0.AdditionalDeliveryMinutes, 0, "5 items should have 0 buffer minutes");
        console.log(`[PASS] 5 items cart: +${calcTier0.AdditionalDeliveryMinutes} mins buffer (Total ETA: ${calcTier0.EstimatedDeliveryMinutes} mins)`);

        // Test with 15 items (Between Tier 1 [10] and Tier 2 [20])
        const cart15 = [{ ProductID: 1, VariantID: 1, OfferPrice: 50, Quantity: 15 }];
        const calcTier1 = await PricingEngine.calculateCart(cart15, null, 1);
        assert.strictEqual(calcTier1.AdditionalDeliveryMinutes, 10, "15 items should have Tier 1 buffer (+10 mins)");
        console.log(`[PASS] 15 items cart: +${calcTier1.AdditionalDeliveryMinutes} mins buffer (Total ETA: ${calcTier1.EstimatedDeliveryMinutes} mins)`);

        // Test with 25 items (> Tier 2 [20])
        const cart25 = [{ ProductID: 1, VariantID: 1, OfferPrice: 50, Quantity: 25 }];
        const calcTier2 = await PricingEngine.calculateCart(cart25, null, 1);
        assert.strictEqual(calcTier2.AdditionalDeliveryMinutes, 20, "25 items should have Tier 2 buffer (+20 mins)");
        console.log(`[PASS] 25 items cart: +${calcTier2.AdditionalDeliveryMinutes} mins buffer (Total ETA: ${calcTier2.EstimatedDeliveryMinutes} mins)`);

        // Test dynamic reconfiguration: Change Tier 1 to 5 items (+15 mins) and Tier 2 to 10 items (+15 mins)
        await queryAsync("UPDATE AdminShopToggleSettings SET LargeCartThreshold1Items = 5, LargeCartThreshold1Minutes = 15, LargeCartThreshold2Items = 10, LargeCartThreshold2Minutes = 15 WHERE SettingID = ?", [shopSettings.SettingID]);
        const calcReconfig = await PricingEngine.calculateCart(cart15, null, 1);
        assert.strictEqual(calcReconfig.AdditionalDeliveryMinutes, 30, "Dynamic update: 15 items with new thresholds should be +30 mins");
        console.log(`[PASS] Reconfigured settings dynamically reflected in PricingEngine: 15 items -> +${calcReconfig.AdditionalDeliveryMinutes} mins buffer`);

        // Restore original settings (10/10, 20/10)
        await queryAsync("UPDATE AdminShopToggleSettings SET LargeCartThreshold1Items = 10, LargeCartThreshold1Minutes = 10, LargeCartThreshold2Items = 20, LargeCartThreshold2Minutes = 10 WHERE SettingID = ?", [shopSettings.SettingID]);

        // 4. VERIFY ADMIN ORDER CANCELLATION WITH REASON & NOTIFICATION
        console.log("\n--- 4. Verifying Admin Order Cancellation Workflow ---");
        const [existingUser] = await queryAsync("SELECT UserID, MobileNumber FROM Users LIMIT 1");
        const validUserId = existingUser ? existingUser.UserID : 1;
        const validMobile = existingUser ? existingUser.MobileNumber : '9999988888';

        const insertOrderResult = await queryAsync(`
            INSERT INTO Orders (UserID, MobileNumber, SubTotal, GrandTotal, OrderStatus, DeliverCharges, CreatedAt)
            VALUES (?, ?, 250.00, 250.00, 8, 25.00, NOW())
        `, [validUserId, validMobile]);
        const testOrderId = insertOrderResult.insertId;
        console.log(`Created test order #${testOrderId} with UserID = ${validUserId}, OrderStatus = 8 (RECEIVED)`);

        // Simulate Admin cancelling the order via the updated logic
        const adminOrdersController = require('../server/controllers/AdminOrders');
        const testReason = "Item out of stock: Fresh milk and paneer are unavailable tonight";

        const fakeReq = {
            params: { OrderID: testOrderId },
            body: {
                OrderStatus: 4,
                UserID: validUserId,
                CancellationReason: testReason
            }
        };

        const fakeResp = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.responseData = data;
                return this;
            }
        };

        await adminOrdersController.updatestatus(fakeReq, fakeResp);
        console.log(`Admin updateStatus response:`, fakeResp.responseData || "OK");

        // Verify DB update on Orders table
        const [updatedOrder] = await queryAsync("SELECT OrderID, OrderStatus, CancellationReason, Delivered_Cancelled_datetime FROM Orders WHERE OrderID = ?", [testOrderId]);
        assert.strictEqual(updatedOrder.OrderStatus, 4, "OrderStatus must be 4 (CANCELLED)");
        assert.strictEqual(updatedOrder.CancellationReason, testReason, "CancellationReason must match the exact reason specified by Admin");
        assert(updatedOrder.Delivered_Cancelled_datetime, "Delivered_Cancelled_datetime timestamp must be set");
        console.log(`[PASS] Orders table updated: OrderStatus = ${updatedOrder.OrderStatus}, CancellationReason = "${updatedOrder.CancellationReason}"`);

        // Verify OrderStatusTimeline table
        const timelineEntries = await queryAsync("SELECT * FROM OrderStatusTimeline WHERE OrderID = ? AND OrderStatus = 4 ORDER BY TimelineID DESC", [testOrderId]);
        assert(timelineEntries.length > 0, "Timeline entry for OrderStatus 4 must exist");
        console.log(`[PASS] OrderStatusTimeline recorded: Notes = "${timelineEntries[0].Notes}"`);

        // Verify UserNotifications table
        const notifications = await queryAsync("SELECT * FROM UserNotifications WHERE UserID = ? ORDER BY NotificationID DESC LIMIT 1", [validUserId]);
        assert(notifications.length > 0, "Notification entry must be created for customer");
        assert(notifications[0].Message.includes(testReason), "Notification message must include the cancellation reason");
        console.log(`[PASS] UserNotifications created for customer:`);
        console.log(`       - Title: "${notifications[0].Title}"`);
        console.log(`       - Message: "${notifications[0].Message}"`);

        // Clean up test order
        await queryAsync("DELETE FROM OrderStatusTimeline WHERE OrderID = ?", [testOrderId]);
        await queryAsync("DELETE FROM Orders WHERE OrderID = ?", [testOrderId]);
        console.log(`\nCleaned up test order #${testOrderId}`);

        console.log("\n===============================================================");
        console.log("ALL TESTS PASSED: BUSINESS RULES ARE DYNAMICALLY INTEGRATED");
        console.log("& ADMIN ORDER CANCELLATION WITH REASON + NOTIFICATION VERIFIED!");
        console.log("===============================================================\n");

        process.exit(0);
    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    }
}

runVerification();
