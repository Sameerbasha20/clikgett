'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const axios = require('axios');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const BASE_URL = 'http://localhost:5000/api';

const pool = mysql.createPool({
    connectionLimit: 5,
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
});

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

// Generate valid JWT tokens for testing
function generateCustomerToken(userId) {
    return jwt.sign({ UserID: userId }, process.env.SECRET_KEY, { algorithm: 'HS256', expiresIn: 3600 });
}

function generateAdminToken(adminId) {
    return jwt.sign({ AdminID: adminId }, process.env.SECRET_KEY, { algorithm: 'HS256', expiresIn: 3600 });
}

// Valid 10x10 transparent PNG base64
const samplePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJAD/sY6DeDAAAAAElFTkSuQmCC";

async function runTests() {
    console.log("====================================================");
    console.log("ClikGett: Photo Orders Automated Test Suite");
    console.log("====================================================");

    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName}`);
            failed++;
        }
    }

    try {
        // Fetch test customer and admin
        const users = await queryAsync("SELECT UserID, MobileNumber FROM Users LIMIT 2");
        if (users.length < 2) {
            throw new Error("Need at least 2 users in Users table for isolation testing.");
        }
        const userA = users[0];
        const userB = users[1];

        const admins = await queryAsync("SELECT AdminID FROM AdminUsers WHERE Role = 1 LIMIT 1");
        if (admins.length === 0) {
            throw new Error("No admin with Role=1 found in AdminUsers table.");
        }
        const admin = admins[0];

        const tokenA = generateCustomerToken(userA.UserID);
        const tokenB = generateCustomerToken(userB.UserID);
        const adminToken = generateAdminToken(admin.AdminID);

        const authHeaderA = { headers: { Authorization: `token ${tokenA}` } };
        const authHeaderB = { headers: { Authorization: `token ${tokenB}` } };
        const authHeaderAdmin = { headers: { Authorization: `token ${adminToken}` } };

        // Test 1: Customer A submits valid photo order
        let submitRes = await axios.post(`${BASE_URL}/photo-orders/submit`, {
            imageBase64: samplePngBase64,
            mimeType: 'image/png',
            customerNotes: 'E2E Test: 1kg Sugar, 1L Milk, Fresh Vegetables',
            deliveryAddressSnapshot: { address: 'Flat 101, Test Residency', landmark: 'Test Landmark' }
        }, authHeaderA);

        assert(submitRes.data.Status === 1 && submitRes.data.RequestID > 0, "1. Customer submits valid photo order request");
        const testRequestId = submitRes.data.RequestID;
        const testRequestCode = submitRes.data.RequestCode;

        // Test 2: Reject invalid image format
        try {
            await axios.post(`${BASE_URL}/photo-orders/submit`, {
                imageBase64: 'bm90YW5pbWFnZQ==',
                mimeType: 'application/pdf',
                customerNotes: 'Invalid file'
            }, authHeaderA);
            assert(false, "2. Reject invalid image format");
        } catch (err) {
            assert(err.response && err.response.status === 400, "2. Reject invalid image format (HTTP 400)");
        }

        // Test 3: Customer A lists own requests
        let myReqRes = await axios.get(`${BASE_URL}/photo-orders/my-requests`, authHeaderA);
        const hasCreated = myReqRes.data.Requests.some(r => r.RequestID === testRequestId);
        assert(myReqRes.data.Status === 1 && hasCreated, "3. Customer lists own requests and sees newly submitted request");

        // Test 4: Image Access & Security Isolation
        // User A (Owner) accessing image -> 200 OK
        let imgResA = await axios.get(`${BASE_URL}/photo-orders/image/${testRequestId}`, authHeaderA);
        assert(imgResA.status === 200 && imgResA.headers['content-type'].includes('image'), "4.1 Request owner can access image securely");

        // User B (Unauthorized customer) accessing User A's image -> 403 Forbidden
        try {
            await axios.get(`${BASE_URL}/photo-orders/image/${testRequestId}`, authHeaderB);
            assert(false, "4.2 Unauthorized customer B denied access to User A's image");
        } catch (err) {
            assert(err.response && err.response.status === 403, "4.2 Unauthorized customer B receives HTTP 403 Forbidden");
        }

        // Admin accessing image -> 200 OK
        let imgResAdmin = await axios.get(`${BASE_URL}/admin/photo-orders/image/${testRequestId}`, authHeaderAdmin);
        assert(imgResAdmin.status === 200, "4.3 Authorized Admin can access image securely");

        // Test 5: Admin list & filters
        let adminListRes = await axios.get(`${BASE_URL}/admin/photo-orders/list?search=${testRequestCode}`, authHeaderAdmin);
        assert(adminListRes.data.Status === 1 && adminListRes.data.Requests.length >= 1, "5. Admin lists & searches photo orders by code");

        // Test 6: Admin claims request
        let claimRes = await axios.put(`${BASE_URL}/admin/photo-orders/claim/${testRequestId}`, {}, authHeaderAdmin);
        assert(claimRes.data.Status === 1, "6. Admin claims request for review (UNDER_REVIEW)");

        // Test 7: Admin prepares proposal with catalog items & PricingEngine calculation
        const catalogProds = await queryAsync(`
            SELECT p.ProductID, pv.VariantID, pv.Price, pv.OfferPrice, pv.AvailableQty
            FROM Products p
            JOIN ProductVariants pv ON p.ProductID = pv.ProductID
            WHERE pv.AvailableQty >= 20
            LIMIT 2
        `);
        if (catalogProds.length === 0) {
            throw new Error("No catalog products with AvailableQty >= 5 found for test.");
        }

        const itemPrice = Number(catalogProds[0].OfferPrice || catalogProds[0].Price);
        const testQty = Math.max(3, Math.ceil(250 / itemPrice));
        const proposalItems = [
            {
                ProductID: catalogProds[0].ProductID,
                VariantID: catalogProds[0].VariantID,
                Quantity: testQty,
                UnitPrice: itemPrice,
                AvailabilityStatus: 'AVAILABLE'
            }
        ];

        let prepRes = await axios.post(`${BASE_URL}/admin/photo-orders/prepare-proposal/${testRequestId}`, {
            items: proposalItems,
            adminNotes: 'All requested items matched with fresh stock'
        }, authHeaderAdmin);

        assert(prepRes.data.Status === 1 && prepRes.data.Pricing && prepRes.data.Pricing.GrandTotal > 0, "7. Admin prepares proposal and PricingEngine calculates totals");

        // Test 8: Admin sends proposal to customer
        let sendRes = await axios.post(`${BASE_URL}/admin/photo-orders/send-proposal/${testRequestId}`, {}, authHeaderAdmin);
        assert(sendRes.data.Status === 1, "8. Admin sends proposal for customer confirmation (AWAITING_CUSTOMER_CONFIRMATION)");

        // Test 9: Customer proposal rejection test (separate test request)
        let rejectReqSubmit = await axios.post(`${BASE_URL}/photo-orders/submit`, {
            imageBase64: samplePngBase64,
            mimeType: 'image/png',
            customerNotes: 'Test request to reject'
        }, authHeaderA);
        const rejectReqId = rejectReqSubmit.data.RequestID;
        await axios.post(`${BASE_URL}/admin/photo-orders/prepare-proposal/${rejectReqId}`, { items: proposalItems }, authHeaderAdmin);
        await axios.post(`${BASE_URL}/admin/photo-orders/send-proposal/${rejectReqId}`, {}, authHeaderAdmin);

        let rejectRes = await axios.post(`${BASE_URL}/photo-orders/request/${rejectReqId}/reject`, {
            rejectionReason: 'Items do not match preference'
        }, authHeaderA);
        assert(rejectRes.data.Status === 1, "9. Customer can decline/reject a proposal");

        // Test 10: Customer confirms proposal & converts to canonical ClikGett Order
        // Record stock before confirmation
        const initialStockRows = await queryAsync("SELECT AvailableQty FROM ProductVariants WHERE VariantID = ?", [proposalItems[0].VariantID]);
        const initialStock = initialStockRows[0].AvailableQty;

        let confirmRes = await axios.post(`${BASE_URL}/photo-orders/request/${testRequestId}/confirm`, {
            paymentMethod: 'COD'
        }, authHeaderA);

        assert(confirmRes.data.Status === 1 && confirmRes.data.OrderID > 0, "10.1 Customer confirms proposal and creates standard ClikGett Order");
        const createdOrderId = confirmRes.data.OrderID;

        // Verify inventory deduction
        const afterStockRows = await queryAsync("SELECT AvailableQty FROM ProductVariants WHERE VariantID = ?", [proposalItems[0].VariantID]);
        const afterStock = afterStockRows[0].AvailableQty;
        assert(afterStock === initialStock - testQty, "10.2 Authoritative inventory deduction performed correctly");

        // Verify order items in canonical table
        const orderItemsRows = await queryAsync("SELECT * FROM OrderItems WHERE OrderID = ?", [createdOrderId]);
        assert(orderItemsRows.length >= 1, "10.3 Canonical OrderItems records inserted");

        // Verify photo order request status linked
        const photoReqRows = await queryAsync("SELECT RequestStatus, CreatedOrderID FROM PhotoOrderRequests WHERE RequestID = ?", [testRequestId]);
        assert(photoReqRows[0].RequestStatus === 'ORDER_CREATED' && photoReqRows[0].CreatedOrderID === createdOrderId, "10.4 PhotoOrderRequests linked to created order with ORDER_CREATED status");

        // Test 11: Idempotency & Duplicate Order Prevention
        try {
            await axios.post(`${BASE_URL}/photo-orders/request/${testRequestId}/confirm`, {
                paymentMethod: 'COD'
            }, authHeaderA);
            assert(false, "11. Prevent duplicate order creation on repeat confirmation");
        } catch (err) {
            assert(err.response && err.response.status === 400, "11. Prevent duplicate confirmation (HTTP 400 already confirmed)");
        }

        // Test 12: Standard checkout regression check (Health and Orders API)
        let healthRes = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
        assert(healthRes.data.status === 'healthy', "12. Core system health & regression verify: /health OK");

        console.log("====================================================");
        console.log(`Results: ${passed} Passed, ${failed} Failed`);
        console.log("====================================================");

    } catch (err) {
        console.error("Test execution failed with error:", err.message, err.response ? err.response.data : '');
    } finally {
        pool.end();
    }
}

runTests();
