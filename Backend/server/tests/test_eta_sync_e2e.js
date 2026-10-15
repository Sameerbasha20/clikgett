const pool = require('../utils/db');
const moment = require('moment');
const assert = require('assert');
const AdminOrdersController = require('../controllers/AdminOrders');
const DeliveryOperations = require('../controllers/DeliveryOperations');

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function mockReqRes(body = {}, params = {}, user = { AdminID: 1 }, query = {}) {
    let statusCode = 200;
    let responseData = null;
    const req = { body, params, user, AdminID: user.AdminID, query, headers: {} };
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

async function runTests() {
    console.log("=== RUNNING DELIVERY ETA SYNC E2E VERIFICATION ===");
    let testOrderId = null;
    let testDriverId = 999;

    try {
        // Setup a test order
        const baseCreatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
        const initialETA = moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');

        const insertRes = await queryAsync(`
            INSERT INTO Orders 
            (MobileNumber, CartID, UserID, SubTotal, GrandTotal, PaymentMethod, PaymentStatus, OrderStatus, CreatedAt, EstimateDateTime, TotalDelayMinutes, DelayStatus, DeliveryBoyID)
            VALUES ('9999999999', 1, 1, 200.00, 200.00, 'COD', 0, 2, ?, ?, 0, 'NONE', ?)
        `, [baseCreatedAt, initialETA, testDriverId]);

        testOrderId = insertRes.insertId;
        console.log(`[SETUP] Created test order #${testOrderId} with base ETA +30 mins: ${initialETA}`);

        // TEST 1: Admin adds 10 minutes
        console.log("\n--- TEST 1: Admin adds 10 minutes ---");
        const { req: req1, res: res1, getData: getData1, getStatus: getStatus1 } = mockReqRes(
            { adjustmentMinutes: 10, reason: "Traffic surge in sector 4" },
            { OrderID: testOrderId }
        );
        await AdminOrdersController.editedeliverytime(req1, res1);

        // Wait for callbacks
        await new Promise(r => setTimeout(r, 600));
        const resData1 = getData1();
        console.log("Admin editedeliverytime response:", resData1);
        assert.strictEqual(resData1.Status, 1, "Admin adjustment should succeed");
        assert.strictEqual(resData1.AdjustmentMinutes, 10, "Adjustment minutes should be 10");
        assert.strictEqual(resData1.TotalDelayMinutes, 10, "Total delay minutes should be 10");

        const [orderAfterAdmin] = await queryAsync("SELECT EstimateDateTime, TotalDelayMinutes FROM Orders WHERE OrderID = ?", [testOrderId]);
        const expectedEtaAdmin = moment(initialETA).add(10, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        const actualEtaAdmin = moment(orderAfterAdmin.EstimateDateTime).format('YYYY-MM-DD HH:mm:ss');
        console.log(`Order ETA after Admin: Expected ${expectedEtaAdmin}, Got ${actualEtaAdmin}, TotalDelayMinutes: ${orderAfterAdmin.TotalDelayMinutes}`);
        assert.strictEqual(actualEtaAdmin, expectedEtaAdmin, "ETA should increase by 10 minutes");
        assert.strictEqual(orderAfterAdmin.TotalDelayMinutes, 10, "TotalDelayMinutes should be 10");

        // Check audit ledger
        const [audit1] = await queryAsync("SELECT * FROM OrderETAAdjustments WHERE OrderID = ? ORDER BY AdjustmentID DESC LIMIT 1", [testOrderId]);
        assert.strictEqual(audit1.AdjustmentMinutes, 10, "Audit ledger minutes match");
        assert.strictEqual(audit1.InitiatorType, 'ADMIN', "InitiatorType should be ADMIN");
        console.log("✓ Test 1 Passed: Admin +10m cumulative update & audit ledger verified.");

        // TEST 2: Delivery partner reports 15 minutes delay
        console.log("\n--- TEST 2: Delivery partner reports 15 minutes delay ---");
        const { req: req2, res: res2, getData: getData2, getStatus: getStatus2 } = mockReqRes(
            { OrderID: testOrderId, Reason: 'HEAVY_TRAFFIC', RequestedMinutes: 15, Remarks: 'Flyover congestion' },
            {},
            { AdminID: testDriverId, DeliveryBoyID: testDriverId, DriverID: testDriverId }
        );
        req2.driverId = testDriverId;
        await DeliveryOperations.reportDelay(req2, res2);

        await new Promise(r => setTimeout(r, 600));
        const resData2 = getData2();
        console.log("DeliveryOperations reportDelay response:", resData2);
        assert.strictEqual(resData2.Status, 1, "Driver delay report should succeed");
        assert.strictEqual(resData2.RequestedMinutes, 15, "Requested minutes should be 15");

        const [orderAfterDriver] = await queryAsync("SELECT EstimateDateTime, TotalDelayMinutes, DelayStatus FROM Orders WHERE OrderID = ?", [testOrderId]);
        const expectedEtaDriver = moment(expectedEtaAdmin).add(15, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        const actualEtaDriver = moment(orderAfterDriver.EstimateDateTime).format('YYYY-MM-DD HH:mm:ss');
        console.log(`Order ETA after Driver: Expected ${expectedEtaDriver}, Got ${actualEtaDriver}, TotalDelayMinutes: ${orderAfterDriver.TotalDelayMinutes}`);
        assert.strictEqual(actualEtaDriver, expectedEtaDriver, "ETA should be combined cumulatively (30m base + 10m admin + 15m driver = 55m total)");
        assert.strictEqual(orderAfterDriver.TotalDelayMinutes, 25, "TotalDelayMinutes should be 25");

        // Check audit ledger
        const [audit2] = await queryAsync("SELECT * FROM OrderETAAdjustments WHERE OrderID = ? ORDER BY AdjustmentID DESC LIMIT 1", [testOrderId]);
        assert.strictEqual(audit2.AdjustmentMinutes, 15, "Audit ledger minutes match");
        assert.strictEqual(audit2.InitiatorType, 'DRIVER', "InitiatorType should be DRIVER");
        assert.strictEqual(audit2.DriverID, testDriverId, "DriverID should match");
        console.log("✓ Test 2 Passed: Driver +15m cumulative update (30 + 10 + 15 = 55 mins) & audit ledger verified.");

        // TEST 3: Admin reviews and APPROVES delay without double counting
        console.log("\n--- TEST 3: Admin reviews and approves driver delay ---");
        const delayId = resData2.DelayID;
        const { req: req3, res: res3, getData: getData3, getStatus: getStatus3 } = mockReqRes(
            { action: 'APPROVE', adminReason: "Confirmed traffic report" },
            { DelayID: delayId }
        );
        await DeliveryOperations.reviewDelay(req3, res3);

        await new Promise(r => setTimeout(r, 600));
        const resData3 = getData3();
        console.log("Admin reviewDelay (APPROVE) response:", resData3);
        assert.strictEqual(resData3.Status, 1, "Review delay should succeed");

        const [orderAfterApprove] = await queryAsync("SELECT EstimateDateTime, TotalDelayMinutes, DelayStatus FROM Orders WHERE OrderID = ?", [testOrderId]);
        const actualEtaApprove = moment(orderAfterApprove.EstimateDateTime).format('YYYY-MM-DD HH:mm:ss');
        console.log(`Order ETA after Approve: ${actualEtaApprove}, TotalDelayMinutes: ${orderAfterApprove.TotalDelayMinutes}, DelayStatus: ${orderAfterApprove.DelayStatus}`);
        assert.strictEqual(actualEtaApprove, expectedEtaDriver, "No double counting! ETA must not be added again on approval");
        assert.strictEqual(orderAfterApprove.TotalDelayMinutes, 25, "TotalDelayMinutes must remain 25 without double counting");
        assert.strictEqual(orderAfterApprove.DelayStatus, 'APPROVED', "DelayStatus should be APPROVED");
        console.log("✓ Test 3 Passed: Approval does NOT double count delay.");

        // TEST 4: Completed or cancelled orders cannot be adjusted
        console.log("\n--- TEST 4: Completed order adjustment rejection ---");
        await queryAsync("UPDATE Orders SET OrderStatus = 1 WHERE OrderID = ?", [testOrderId]);
        const { req: req4, res: res4, getData: getData4, getStatus: getStatus4 } = mockReqRes(
            { adjustmentMinutes: 10 },
            { OrderID: testOrderId }
        );
        await AdminOrdersController.editedeliverytime(req4, res4);
        await new Promise(r => setTimeout(r, 400));
        console.log("Completed order adjustment response:", getStatus4(), getData4());
        assert.strictEqual(getStatus4(), 400, "Completed order must reject ETA adjustment with 400");
        console.log("✓ Test 4 Passed: Safe guard prevents modifying ETA of completed/cancelled orders.");

        console.log("\n==========================================");
        console.log(">>> ALL DELIVERY ETA SYNC TESTS PASSED! <<<");
        console.log("==========================================");
    } catch (err) {
        console.error("Test failed with error:", err);
        process.exitCode = 1;
    } finally {
        if (testOrderId) {
            await queryAsync("DELETE FROM OrderETAAdjustments WHERE OrderID = ?", [testOrderId]);
            await queryAsync("DELETE FROM OrderDelays WHERE OrderID = ?", [testOrderId]);
            await queryAsync("DELETE FROM OrderStatusTimeline WHERE OrderID = ?", [testOrderId]);
            await queryAsync("DELETE FROM Orders WHERE OrderID = ?", [testOrderId]);
            console.log(`[CLEANUP] Deleted test order #${testOrderId}`);
        }
        pool.end();
    }
}

runTests();
