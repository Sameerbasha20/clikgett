require('dotenv').config();
if (!process.env.RAZORPAYID) process.env.RAZORPAYID = 'rzp_test_mock';
if (!process.env.RAZORPAYSECRET) process.env.RAZORPAYSECRET = 'mock_secret';

const pool = require('../utils/db');
const moment = require('moment');
const assert = require('assert');

// In-Memory Database State for Mocking
const inMemoryDB = {
    orders: [
        {
            OrderID: 101,
            OrderStatus: 5, // Out for delivery
            EstimateDateTime: moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
            TotalDelayMinutes: 0,
            DelayStatus: 'NONE',
            DeliveryBoyID: 888,
            UserID: 1,
            CreatedAt: moment().subtract(10, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
            GrandTotal: 250.00,
            SubTotal: 250.00,
            PaymentMethod: 'COD'
        }
    ],
    orderDelays: [],
    orderETAAdjustments: [],
    orderStatusTimeline: [],
    userNotifications: [],
    adminShopToggleSettings: [
        {
            SettingID: 1,
            Latitude: 17.3850,
            Longitude: 78.4867,
            Radius: 20.0
        }
    ]
};

// Intercept pool.query for fully reproducible, environment-independent testing
pool.query = function (sql, params, callback) {
    if (typeof params === 'function') {
        callback = params;
        params = [];
    }

    const queryStr = (typeof sql === 'string' ? sql : sql.sql || '').trim();

    // 1. SELECT order for driver delay verification
    if (queryStr.includes('FROM Orders WHERE OrderID = ? AND DeliveryBoyID = ?')) {
        const orderId = params[0];
        const driverId = params[1];
        const match = inMemoryDB.orders.filter(o => o.OrderID == orderId && o.DeliveryBoyID == driverId);
        return callback(null, match);
    }

    // 2. Anti-duplicate recent delay check
    if (queryStr.includes('FROM OrderDelays WHERE OrderID = ? ORDER BY CreatedAt DESC LIMIT 1')) {
        const orderId = params[0];
        const delays = inMemoryDB.orderDelays
            .filter(d => d.OrderID == orderId)
            .sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        return callback(null, delays.slice(0, 1));
    }

    // 3. INSERT INTO OrderDelays
    if (queryStr.startsWith('INSERT INTO OrderDelays')) {
        const newDelay = {
            DelayID: inMemoryDB.orderDelays.length + 1,
            OrderID: params[0],
            DriverID: params[1],
            Reason: params[2],
            RequestedMinutes: params[3],
            ApprovedMinutes: params[4],
            Status: 'APPLIED',
            Remarks: params[7],
            CreatedAt: new Date()
        };
        inMemoryDB.orderDelays.push(newDelay);
        return callback(null, { affectedRows: 1, insertId: newDelay.DelayID });
    }

    // 4. UPDATE Orders with new ETA and DelayStatus
    if (queryStr.startsWith('UPDATE Orders') && queryStr.includes('DelayStatus = \'REPORTED\'')) {
        const newEta = params[0];
        const totalDelay = params[1];
        const orderId = params[2];
        const order = inMemoryDB.orders.find(o => o.OrderID == orderId);
        if (order) {
            order.EstimateDateTime = newEta;
            order.TotalDelayMinutes = totalDelay;
            order.DelayStatus = 'REPORTED';
        }
        return callback(null, { affectedRows: 1 });
    }

    // 5. INSERT INTO OrderETAAdjustments
    if (queryStr.startsWith('INSERT INTO OrderETAAdjustments')) {
        inMemoryDB.orderETAAdjustments.push({
            AdjustmentID: inMemoryDB.orderETAAdjustments.length + 1,
            OrderID: params[0],
            PreviousETA: params[1],
            NewETA: params[2],
            AdjustmentMinutes: params[3],
            Reason: params[4],
            DriverID: params[5],
            InitiatorType: 'DRIVER',
            CreatedAt: new Date()
        });
        return callback(null, { affectedRows: 1, insertId: inMemoryDB.orderETAAdjustments.length });
    }

    // 6. INSERT INTO OrderStatusTimeline
    if (queryStr.startsWith('INSERT INTO OrderStatusTimeline')) {
        inMemoryDB.orderStatusTimeline.push({
            OrderID: params[0],
            OrderStatus: params[1],
            Notes: params[2],
            CreatedAt: new Date()
        });
        return callback(null, { affectedRows: 1 });
    }

    // 7. SELECT AdminShopToggleSettings
    if (queryStr.includes('FROM AdminShopToggleSettings')) {
        return callback(null, inMemoryDB.adminShopToggleSettings);
    }

    // 8. Distance calculation query (Haversine)
    if (queryStr.includes('6371 * acos')) {
        // Parse coordinates from query string
        const latMatches = queryStr.match(/radians\(\s*([\d\.]+)\s*\)/g);
        if (latMatches && latMatches.length >= 2) {
            const lat1 = parseFloat(latMatches[0].replace(/[^\d\.]/g, ''));
            const lat2 = parseFloat(latMatches[1].replace(/[^\d\.]/g, ''));
            // approximate km distance from lat difference
            const dLatKm = Math.abs(lat1 - lat2) * 111.0;
            return callback(null, [{ distance: Math.round(dLatKm * 10) / 10 }]);
        }
        return callback(null, [{ distance: 5.0 }]);
    }

    // 9. INSERT INTO UserNotifications
    if (queryStr.startsWith('INSERT INTO UserNotifications')) {
        inMemoryDB.userNotifications.push(params);
        return callback(null, { affectedRows: 1, insertId: inMemoryDB.userNotifications.length });
    }

    // 10. SELECT Order by OrderID
    if (queryStr.includes('FROM Orders WHERE OrderID = ?')) {
        const orderId = params[0];
        const match = inMemoryDB.orders.filter(o => o.OrderID == orderId);
        return callback(null, match);
    }

    // Default fallback
    return callback(null, []);
};

const DeliveryOperations = require('../controllers/DeliveryOperations');
const AddressController = require('../controllers/Address');
const OrdersController = require('../controllers/Orders');
const CommonController = require('../controllers/CommonController');

// Mock CommonController.commonget to use pool.query
CommonController.commonget = (sql) => {
    return new Promise((resolve) => {
        pool.query(sql, (err, rows) => {
            resolve(rows || []);
        });
    });
};

function mockReqRes(body = {}, params = {}, user = { AdminID: 1 }, query = {}) {
    let statusCode = 200;
    let responseData = null;
    const req = { body, params, user, AdminID: user.AdminID, query, headers: {}, UserID: user.UserID || 1, MobileNumber: '9876543210' };
    const res = {
        statusCode: 200,
        status(code) {
            statusCode = code;
            this.statusCode = code;
            return this;
        },
        json(data) {
            responseData = data;
            return this;
        }
    };
    return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

// Natural countdown format function matching Flutter implementation
function formatNaturalRemainingDuration(diffMs) {
    if (diffMs <= 0) return "0 minutes";
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours === 0) {
        return `${mins} minute${mins === 1 ? '' : 's'}`;
    } else if (mins === 0) {
        return `${hours} hour${hours === 1 ? '' : 's'}`;
    } else {
        return `${hours} hour${hours === 1 ? '' : 's'} ${mins} minute${mins === 1 ? '' : 's'}`;
    }
}

async function runTests() {
    console.log("===============================================================");
    console.log("CLIKGETT DELIVERY DELAY & SERVICEABILITY AUTOMATED TEST SUITE");
    console.log("===============================================================\n");

    const testOrderId = 101;
    const testDriverId = 888;
    const unauthorizedDriverId = 777;

    try {
        // =========================================================================
        // FEATURE 1: DELIVERY DELAY UPDATES & ETA RECALCULATION
        // =========================================================================
        console.log("--- PART 1: DELIVERY DELAY TESTS ---");

        const initialOrder = inMemoryDB.orders[0];
        const initialEta = initialOrder.EstimateDateTime;
        console.log(`[SETUP] Initial test active order #${testOrderId} with base ETA: ${initialEta}`);

        // TEST 1.1: Unauthorized driver cannot report delay
        console.log("\n[TEST 1.1] Unauthorized driver cannot update another driver's order");
        const { req: reqUnauth, res: resUnauth, getData: getUnauthData, getStatus: getUnauthStatus } = mockReqRes(
            { OrderID: testOrderId, Reason: 'HEAVY_TRAFFIC', RequestedMinutes: 10 },
            {},
            { AdminID: unauthorizedDriverId, DeliveryBoyID: unauthorizedDriverId }
        );
        reqUnauth.driverId = unauthorizedDriverId;
        await DeliveryOperations.reportDelay(reqUnauth, resUnauth);
        assert.strictEqual(getUnauthStatus(), 403, "Unauthorized driver must be rejected with 403");
        console.log("✓ Test 1.1 Passed: Unauthorized driver successfully rejected (403).");

        // TEST 1.2: Mandatory explanation required when Reason is 'OTHER'
        console.log("\n[TEST 1.2] Reason 'OTHER' requires meaningful explanation");
        const { req: reqOtherBad, res: resOtherBad, getData: getOtherBadData, getStatus: getOtherBadStatus } = mockReqRes(
            { OrderID: testOrderId, Reason: 'OTHER', RequestedMinutes: 15, Remarks: '   ' },
            {},
            { AdminID: testDriverId, DeliveryBoyID: testDriverId }
        );
        reqOtherBad.driverId = testDriverId;
        await DeliveryOperations.reportDelay(reqOtherBad, resOtherBad);
        assert.strictEqual(getOtherBadStatus(), 400, "Empty remarks for OTHER must return 400");
        console.log("✓ Test 1.2 Passed: 'OTHER' without remarks rejected (400).");

        // TEST 1.3: Authorized driver submits valid delay (+15 mins, HEAVY_TRAFFIC)
        console.log("\n[TEST 1.3] Assigned driver submits valid delay (+15 mins heavy traffic)");
        const { req: reqValid, res: resValid, getData: getValidData, getStatus: getValidStatus } = mockReqRes(
            { OrderID: testOrderId, Reason: 'HEAVY_TRAFFIC', RequestedMinutes: 15, Remarks: 'Traffic gridlock at intersection' },
            {},
            { AdminID: testDriverId, DeliveryBoyID: testDriverId }
        );
        reqValid.driverId = testDriverId;
        await DeliveryOperations.reportDelay(reqValid, resValid);
        const validData = getValidData();
        assert.strictEqual(getValidStatus(), 200, "Valid delay update should return 200");
        assert.strictEqual(validData.Status, 1, "Status should be 1");
        assert.strictEqual(validData.RequestedMinutes, 15, "Requested minutes should be 15");

        const expectedEtaAfterFirstDelay = moment(initialEta).add(15, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        const updatedOrder = inMemoryDB.orders[0];
        assert.strictEqual(updatedOrder.EstimateDateTime, expectedEtaAfterFirstDelay, "New ETA must equal initial ETA + 15 mins");
        assert.strictEqual(updatedOrder.TotalDelayMinutes, 15, "Total delay minutes must be 15");
        assert.strictEqual(updatedOrder.OrderStatus, 5, "Order status must NOT change when reporting delay");
        console.log(`✓ Test 1.3 Passed: Delay applied immediately (${updatedOrder.EstimateDateTime}) without admin approval; status preserved (5).`);

        // TEST 1.4: Idempotency - Retrying the same delay does not add the delay twice
        console.log("\n[TEST 1.4] Idempotent retry does NOT accumulate delay a second time");
        const { req: reqRetry, res: resRetry, getData: getRetryData, getStatus: getRetryStatus } = mockReqRes(
            { OrderID: testOrderId, Reason: 'HEAVY_TRAFFIC', RequestedMinutes: 15, Remarks: 'Traffic gridlock at intersection' },
            {},
            { AdminID: testDriverId, DeliveryBoyID: testDriverId }
        );
        reqRetry.driverId = testDriverId;
        await DeliveryOperations.reportDelay(reqRetry, resRetry);
        const retryData = getRetryData();
        assert.strictEqual(getRetryStatus(), 200, "Retry should return 200");
        assert.strictEqual(retryData.IsDuplicateRetry, true, "Should identify as duplicate retry");
        assert.strictEqual(updatedOrder.EstimateDateTime, expectedEtaAfterFirstDelay, "ETA must NOT have been incremented again");
        assert.strictEqual(updatedOrder.TotalDelayMinutes, 15, "Total delay minutes must remain 15");
        console.log("✓ Test 1.4 Passed: Identical retry recognized idempotently; ETA unchanged.");

        // TEST 1.5: Driver updates delay to +30 mins - recalculates from baseline
        console.log("\n[TEST 1.5] Updating delay to +30 mins recalculates from baseline (not adding 30 onto 15)");
        const { req: reqUpdate, res: resUpdate, getData: getUpdateData, getStatus: getUpdateStatus } = mockReqRes(
            { OrderID: testOrderId, Reason: 'WEATHER_CONDITIONS', RequestedMinutes: 30, Remarks: 'Severe waterlogging' },
            {},
            { AdminID: testDriverId, DeliveryBoyID: testDriverId }
        );
        reqUpdate.driverId = testDriverId;
        await DeliveryOperations.reportDelay(reqUpdate, resUpdate);
        const updateData = getUpdateData();
        assert.strictEqual(getUpdateStatus(), 200, "Delay update must succeed");
        assert.strictEqual(updateData.RequestedMinutes, 30);

        const expectedEtaUpdated = moment(initialEta).add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        assert.strictEqual(updatedOrder.EstimateDateTime, expectedEtaUpdated, "Recalculation must be baseline + 30 mins (not 45 mins)");
        assert.strictEqual(updatedOrder.TotalDelayMinutes, 30, "Total delay minutes must be 30");
        console.log(`✓ Test 1.5 Passed: Recalculated from baseline (${updatedOrder.EstimateDateTime}); no compounding.`);

        // TEST 1.6: Audit trails
        console.log("\n[TEST 1.6] Audit trail and timeline entries recorded");
        assert(inMemoryDB.orderDelays.length >= 2, "OrderDelays must contain delay records");
        assert(inMemoryDB.orderETAAdjustments.length >= 2, "OrderETAAdjustments must contain ledger records");
        assert(inMemoryDB.orderStatusTimeline.length >= 2, "OrderStatusTimeline must contain timeline records");
        console.log(`✓ Test 1.6 Passed: ${inMemoryDB.orderDelays.length} delay audits and ${inMemoryDB.orderETAAdjustments.length} adjustment records persisted.`);

        // TEST 1.7: Natural countdown format validation
        console.log("\n[TEST 1.7] Natural countdown duration formatting rules");
        assert.strictEqual(formatNaturalRemainingDuration(10 * 60000), "10 minutes");
        assert.strictEqual(formatNaturalRemainingDuration(59 * 60000), "59 minutes");
        assert.strictEqual(formatNaturalRemainingDuration(60 * 60000), "1 hour");
        assert.strictEqual(formatNaturalRemainingDuration(61 * 60000), "1 hour 1 minute");
        assert.strictEqual(formatNaturalRemainingDuration(135 * 60000), "2 hours 15 minutes");
        assert.strictEqual(formatNaturalRemainingDuration(-5000), "0 minutes");
        console.log("✓ Test 1.7 Passed: 10 minutes, 59 minutes, 1 hour, 1 hour 1 minute, 2 hours 15 minutes all formatted correctly.");

        // =========================================================================
        // FEATURE 2: SERVICEABILITY CHECKS & UNSUPPORTED LOCATION ENFORCEMENT
        // =========================================================================
        console.log("\n--- PART 2: SERVICEABILITY TESTS ---");

        const storeLat = inMemoryDB.adminShopToggleSettings[0].Latitude;
        const storeLng = inMemoryDB.adminShopToggleSettings[0].Longitude;
        const maxRadius = inMemoryDB.adminShopToggleSettings[0].Radius;
        console.log(`[STORE CONFIG] Store at (${storeLat}, ${storeLng}), Delivery Radius: ${maxRadius} km`);

        // TEST 2.1: Supported location (e.g., 2 km away from store)
        console.log("\n[TEST 2.1] Supported address within 20 km is serviceable");
        const supportedLat = storeLat + 0.015; // ~1.6 km
        const supportedLng = storeLng + 0.015;
        const { req: reqSupp, res: resSupp, getData: getSuppData, getStatus: getSuppStatus } = mockReqRes(
            { Latitude: supportedLat, Longitude: supportedLng }
        );
        await AddressController.checkServiceability(reqSupp, resSupp);
        const suppData = getSuppData();
        assert.strictEqual(getSuppStatus(), 200);
        assert.strictEqual(suppData.Status, 1);
        assert.strictEqual(suppData.IsServiceable, true, "Location within 20 km must be serviceable");
        assert(suppData.DistanceKm <= 20, "Distance must be <= 20 km");
        console.log(`✓ Test 2.1 Passed: Location at ${suppData.DistanceKm} km is serviceable.`);

        // TEST 2.2: Unsupported location (e.g., 35 km away from store)
        console.log("\n[TEST 2.2] Unsupported address > 20 km returns IsServiceable: false");
        const unsupportedLat = storeLat + 0.35; // ~38 km
        const unsupportedLng = storeLng + 0.35;
        const { req: reqUnsupp, res: resUnsupp, getData: getUnsuppData, getStatus: getUnsuppStatus } = mockReqRes(
            { Latitude: unsupportedLat, Longitude: unsupportedLng }
        );
        await AddressController.checkServiceability(reqUnsupp, resUnsupp);
        const unsuppData = getUnsuppData();
        assert.strictEqual(getUnsuppStatus(), 200);
        assert.strictEqual(unsuppData.Status, 1);
        assert.strictEqual(unsuppData.IsServiceable, false, "Location > 20 km must NOT be serviceable");
        assert(unsuppData.DistanceKm > 20, "Distance must be > 20 km");
        console.log(`✓ Test 2.2 Passed: Location at ${unsuppData.DistanceKm} km flagged unserviceable.`);

        // TEST 2.3: Backend order creation strictly rejects unsupported location
        console.log("\n[TEST 2.3] Backend order placement (addorder) rejects unsupported address");
        const { req: reqOrderReject, res: resOrderReject, getData: getOrderRejectData, getStatus: getOrderRejectStatus } = mockReqRes(
            {
                GrandTotal: 300.00,
                SubTotal: 300.00,
                PaymentMethod: 'COD',
                Latitude: unsupportedLat,
                Longitude: unsupportedLng,
                Address: 'Highway 44, Far Away Town'
            }
        );
        await OrdersController.addorder(reqOrderReject, resOrderReject);
        assert.strictEqual(getOrderRejectStatus(), 400, "Backend must return 400 when placing order for unsupported address");
        const orderRejectData = getOrderRejectData();
        assert.strictEqual(orderRejectData.IsServiceable, false);
        console.log("✓ Test 2.3 Passed: Backend rejected order placement for unsupported location (400).");

        // TEST 2.4: Invalid coordinates validation
        console.log("\n[TEST 2.4] Invalid or missing coordinates returns 400");
        const { req: reqBadCoord, res: resBadCoord, getData: getBadCoordData, getStatus: getBadCoordStatus } = mockReqRes(
            { Latitude: 'invalid', Longitude: null }
        );
        await AddressController.checkServiceability(reqBadCoord, resBadCoord);
        assert.strictEqual(getBadCoordStatus(), 400, "Invalid coordinates must return 400");
        console.log("✓ Test 2.4 Passed: Invalid coordinates properly rejected (400).");

        console.log("\n===============================================================");
        console.log("ALL 11 AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY! ✓");
        console.log("===============================================================");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ TEST SUITE FAILURE:", err);
        process.exit(1);
    }
}

runTests();
