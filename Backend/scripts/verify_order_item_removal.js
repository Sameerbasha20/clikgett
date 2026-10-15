const mysql = require('mysql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const PricingEngine = require('../server/services/PricingEngine');
const adminOrderController = require('../server/controllers/AdminOrders');

const pool = mysql.createPool({
    connectionLimit: 4,
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT
});

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
    if (condition) {
        console.log(`[PASS] ${description}${details ? ' (' + details + ')' : ''}`);
        passed++;
    } else {
        console.error(`[FAIL] ${description}${details ? ' (' + details + ')' : ''}`);
        failed++;
    }
}

async function runTests() {
    console.log("==================================================");
    console.log("CLIKGETT AUDIT TEST SUITE: DYNAMIC ETA & ORDER ITEM REMOVAL");
    console.log("==================================================");

    // ----------------------------------------------------
    // TEST SECTION 1: ETA FORMULA TESTS
    // ----------------------------------------------------
    console.log("\n--- 1. ETA FORMULA UNIT TESTS ---");
    const etaFormula = (totalItems) => {
        if (totalItems <= 10) return 30;
        return 30 + Math.ceil((totalItems - 10) / 10) * 10;
    };

    const etaCases = [
        { items: 1, expected: 30 },
        { items: 5, expected: 30 },
        { items: 10, expected: 30 },
        { items: 11, expected: 40 },
        { items: 15, expected: 40 },
        { items: 20, expected: 40 },
        { items: 21, expected: 50 },
        { items: 25, expected: 50 },
        { items: 30, expected: 50 },
        { items: 31, expected: 60 },
        { items: 40, expected: 60 },
        { items: 41, expected: 70 },
        { items: 50, expected: 70 }
    ];

    etaCases.forEach(tc => {
        const result = etaFormula(tc.items);
        assert(`${tc.items} items -> ${tc.expected} mins`, result === tc.expected, `Got: ${result} mins`);
    });

    // Mixed quantities test: Product A x 5 + Product B x 6 = 11 items -> 40 min
    const mixedItems = 5 + 6;
    assert("Mixed quantities: 5 + 6 = 11 items -> 40 mins", etaFormula(mixedItems) === 40, `Got: ${etaFormula(mixedItems)} mins`);
    const mixedItems2 = 20 + 1;
    assert("Mixed quantities: 20 + 1 = 21 items -> 50 mins", etaFormula(mixedItems2) === 50, `Got: ${etaFormula(mixedItems2)} mins`);

    // Removal scenario: 21 items -> 50, remove 2 -> 19 items -> 40
    const beforeRemove = 21;
    const afterRemove = 21 - 2;
    assert("Removal: 21 items (50 min) - 2 = 19 items -> 40 mins", etaFormula(beforeRemove) === 50 && etaFormula(afterRemove) === 40);

    // Removal scenario: 31 items -> 60, remove 2 -> 29 items -> 50
    const beforeRemove2 = 31;
    const afterRemove2 = 31 - 2;
    assert("Removal: 31 items (60 min) - 2 = 29 items -> 50 mins", etaFormula(beforeRemove2) === 60 && etaFormula(afterRemove2) === 50);

    // ----------------------------------------------------
    // TEST SECTION 2: BACKEND VALIDATION TESTS (MOCK REQ/RESP)
    // ----------------------------------------------------
    console.log("\n--- 2. BACKEND VALIDATION TESTS ---");

    function mockResp() {
        return {
            statusCode: 200,
            body: null,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.body = data;
                return this;
            }
        };
    }

    // 2.1 Unauthorized Admin
    {
        const req = { AdminID: null, body: { OrderID: 934, OrderItemID: 4431, reason: "Out of Stock", description: "None" } };
        const resp = mockResp();
        await adminOrderController.removeItemFromOrder(req, resp);
        assert("Unauthorized admin rejected (401)", resp.statusCode === 401 && resp.body.Status === 0, resp.body?.Message);
    }

    // 2.2 Invalid Reason Rejected
    {
        const req = { AdminID: 1, body: { OrderID: 934, OrderItemID: 4431, reason: "InvalidCustomReason", description: "Valid description" } };
        const resp = mockResp();
        await adminOrderController.removeItemFromOrder(req, resp);
        assert("Invalid reason rejected (400)", resp.statusCode === 400 && resp.body.Status === 0, resp.body?.Message);
    }

    // 2.3 Empty Reason Rejected
    {
        const req = { AdminID: 1, body: { OrderID: 934, OrderItemID: 4431, reason: "", description: "Valid description" } };
        const resp = mockResp();
        await adminOrderController.removeItemFromOrder(req, resp);
        assert("Empty reason rejected (400)", resp.statusCode === 400 && resp.body.Status === 0, resp.body?.Message);
    }

    // 2.4 Empty Description Rejected
    {
        const req = { AdminID: 1, body: { OrderID: 934, OrderItemID: 4431, reason: "Out of Stock", description: "   " } };
        const resp = mockResp();
        await adminOrderController.removeItemFromOrder(req, resp);
        assert("Empty description rejected (400)", resp.statusCode === 400 && resp.body.Status === 0, resp.body?.Message);
    }

    // 2.5 Non-existent Order Rejected
    {
        const req = { AdminID: 1, body: { OrderID: 99999999, OrderItemID: 4431, reason: "Out of Stock", description: "Valid" } };
        const resp = mockResp();
        await adminOrderController.removeItemFromOrder(req, resp);
        assert("Non-existent order rejected (404)", resp.statusCode === 404 && resp.body.Status === 0, resp.body?.Message);
    }

    // 2.6 Immutable Order Rejected (Order 933 is Delivered, Status = 1)
    {
        const req = { AdminID: 1, body: { OrderID: 933, OrderItemID: 4431, reason: "Out of Stock", description: "Valid" } };
        const resp = mockResp();
        await adminOrderController.removeItemFromOrder(req, resp);
        assert("Immutable order rejected (400 with 'This order can no longer be modified.')", 
            resp.statusCode === 400 && resp.body.Status === 0 && resp.body.Message === "This order can no longer be modified.", 
            resp.body?.Message);
    }

    // 2.7 Product Not In Order Rejected
    {
        const req = { AdminID: 1, body: { OrderID: 934, OrderItemID: 9999999, reason: "Out of Stock", description: "Valid" } };
        const resp = mockResp();
        await adminOrderController.removeItemFromOrder(req, resp);
        assert("Product not belonging to order rejected (404)", resp.statusCode === 404 && resp.body.Status === 0, resp.body?.Message);
    }

    // 2.8 Excessive Quantity Rejected
    {
        const req = { AdminID: 1, body: { OrderID: 934, OrderItemID: 4431, removedQuantity: 9999, reason: "Out of Stock", description: "Valid" } };
        const resp = mockResp();
        await adminOrderController.removeItemFromOrder(req, resp);
        assert("Excessive quantity rejected (400)", resp.statusCode === 400 && resp.body.Status === 0, resp.body?.Message);
    }

    // ----------------------------------------------------
    // TEST SECTION 3: END-TO-END REMOVAL, RECALCULATION & AUDIT
    // ----------------------------------------------------
    console.log("\n--- 3. E2E REMOVAL, RECALCULATION & AUDIT TESTS ---");

    // We will create a dedicated test order so we do not corrupt production/existing orders
    let testOrderID = null;
    let testOrderItem1ID = null;
    let testOrderItem2ID = null;

    try {
        const orderInsert = await queryAsync(`
            INSERT INTO Orders 
            (MobileNumber, CartID, UserID, SubTotal, DeliverCharges, GrandTotal, PaymentMethod, PaymentStatus, OrderStatus, CreatedAt, EstimateDateTime, TotalItemQuantity, OrderSizeBufferMinutes)
            VALUES ('9999999999', 0, 1843730, 250.00, 30.00, 280.00, 'COD', 0, 2, NOW(), DATE_ADD(NOW(), INTERVAL 40 MINUTE), 11, 10)
        `);
        testOrderID = orderInsert.insertId;

        const oi1 = await queryAsync(`
            INSERT INTO OrderItems (OrderID, ProductID, VariantID, ProductName, Quantity, Price, OfferPrice)
            VALUES (?, 2, 2, 'Test Product Alpha', 10, 20.00, 20.00)
        `, [testOrderID]);
        testOrderItem1ID = oi1.insertId;

        const oi2 = await queryAsync(`
            INSERT INTO OrderItems (OrderID, ProductID, VariantID, ProductName, Quantity, Price, OfferPrice)
            VALUES (?, 33, 33, 'Test Product Beta', 1, 50.00, 50.00)
        `, [testOrderID]);
        testOrderItem2ID = oi2.insertId;

        assert("Created isolated test order with 11 items (10 + 1)", testOrderID > 0, `OrderID: ${testOrderID}`);

        // Initial ETA should be 40 mins (11 items)
        const initialETA = etaFormula(11);
        assert("Initial order size (11 items) requires 40 mins ETA", initialETA === 40);

        // Perform valid removal of 1 unit of Test Product Beta (leaves 10 items)
        const removeReq = {
            AdminID: 99,
            body: {
                OrderID: testOrderID,
                OrderItemID: testOrderItem2ID,
                removedQuantity: 1,
                reason: "Out of Stock",
                description: "Warehouse ran out of stock for Beta",
                resolution: "Manual Correction"
            }
        };
        const removeResp = mockResp();
        await adminOrderController.removeItemFromOrder(removeReq, removeResp);

        assert("Valid removal request returns 200 SUCCESS", removeResp.statusCode === 200 && removeResp.body.Status === 1, removeResp.body?.Message);

        const resData = removeResp.body;
        // Verify response payload
        assert("Recalculated items count is 10", resData.RecalculatedOrder.TotalItemQuantity === 10, `Got: ${resData.RecalculatedOrder.TotalItemQuantity}`);
        assert("Recalculated order size buffer dropped from 10 to 0", resData.RecalculatedOrder.OrderSizeBufferMinutes === 0, `Got: ${resData.RecalculatedOrder.OrderSizeBufferMinutes}`);
        assert("Recalculated ETA dropped to 30 mins", resData.RecalculatedOrder.TotalDeliveryMinutes === 30, `Got: ${resData.RecalculatedOrder.TotalDeliveryMinutes}`);

        // Check DB for updated Orders row
        const updatedOrderRows = await queryAsync("SELECT * FROM Orders WHERE OrderID = ?", [testOrderID]);
        const updatedOrder = updatedOrderRows[0];
        assert("Orders table TotalItemQuantity updated to 10", updatedOrder.TotalItemQuantity === 10);
        assert("Orders table OrderSizeBufferMinutes updated to 0", updatedOrder.OrderSizeBufferMinutes === 0);
        assert("Orders table SubTotal recalculated by PricingEngine", parseFloat(updatedOrder.SubTotal) === resData.RecalculatedOrder.SubTotal, `Got: ${updatedOrder.SubTotal}`);

        // Check order_item_removals table
        const removalAuditRows = await queryAsync("SELECT * FROM order_item_removals WHERE OrderID = ?", [testOrderID]);
        assert("Removal audit record inserted in order_item_removals", removalAuditRows.length === 1);
        const audit = removalAuditRows[0];
        assert("Audit record has Product Name snapshot", audit.ProductName === 'Test Product Beta');
        assert("Audit record has Quantity 1", audit.Quantity === 1);
        assert("Audit record has Reason 'Out of Stock'", audit.Reason === 'Out of Stock');
        assert("Audit record has Description 'Warehouse ran out of stock for Beta'", audit.Description === 'Warehouse ran out of stock for Beta');
        assert("Audit record has AdminID 99", audit.AdminID === 99);

        // Check order_adjustments table
        const adjRows = await queryAsync("SELECT * FROM order_adjustments WHERE OrderID = ?", [testOrderID]);
        assert("Financial adjustment recorded in order_adjustments", adjRows.length === 1);
        assert("Adjustment recorded deduction difference", parseFloat(adjRows[0].DifferenceAmount) < 0, `Diff: ${adjRows[0].DifferenceAmount}`);

        // Check OrderStatusTimeline table
        const timelineRows = await queryAsync("SELECT * FROM OrderStatusTimeline WHERE OrderID = ? AND Notes LIKE '%Item Removed%'", [testOrderID]);
        assert("Timeline event logged in OrderStatusTimeline", timelineRows.length >= 1, timelineRows[0]?.Notes);

        // Check getRemovedItems endpoint
        const getRemReq = { params: { OrderID: testOrderID } };
        const getRemResp = mockResp();
        await adminOrderController.getRemovedItems(getRemReq, getRemResp);
        assert("getRemovedItems endpoint returns audit items", getRemResp.statusCode === 200 && getRemResp.body.RemovedItems.length === 1);

    } finally {
        // Clean up test data
        if (testOrderID) {
            await queryAsync("DELETE FROM order_item_removals WHERE OrderID = ?", [testOrderID]);
            await queryAsync("DELETE FROM order_adjustments WHERE OrderID = ?", [testOrderID]);
            await queryAsync("DELETE FROM OrderStatusTimeline WHERE OrderID = ?", [testOrderID]);
            await queryAsync("DELETE FROM OrderItems WHERE OrderID = ?", [testOrderID]);
            await queryAsync("DELETE FROM Orders WHERE OrderID = ?", [testOrderID]);
            console.log("\n[CLEANUP] Successfully cleaned up isolated test order.");
        }
    }

    console.log("==================================================");
    console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

    process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(err => {
    console.error("Test execution exception:", err);
    process.exit(1);
});
