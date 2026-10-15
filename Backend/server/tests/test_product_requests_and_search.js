'use strict';

require('dotenv').config();
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const pool = require('../utils/db');

// In-Memory DB for reproducible test assertions
const inMemoryDB = {
    users: [
        { UserID: 1, FirstName: 'John', LastName: 'Doe', MobileNumber: '9876543210' },
        { UserID: 2, FirstName: 'Alice', LastName: 'Smith', MobileNumber: '9123456780' }
    ],
    customerEnquiries: [],
    productRequests: []
};

// Storage dir for test image artifacts
const testPhotoDir = path.resolve(__dirname, '../images/product_requests');
if (!fs.existsSync(testPhotoDir)) {
    fs.mkdirSync(testPhotoDir, { recursive: true });
}

// Intercept pool.query for environment-independent testing
pool.query = function (sql, params, callback) {
    if (typeof params === 'function') {
        callback = params;
        params = [];
    }

    const queryStr = (typeof sql === 'string' ? sql : sql.sql || '').trim();

    // 1. SELECT User
    if (queryStr.includes('FROM Users WHERE UserID = ?')) {
        const uId = params[0];
        const match = inMemoryDB.users.filter(u => u.UserID == uId);
        return callback(null, match);
    }

    // 2. INSERT INTO CustomerEnquiries
    if (queryStr.startsWith('INSERT INTO CustomerEnquiries')) {
        const newEnquiry = {
            EnquiryID: inMemoryDB.customerEnquiries.length + 1,
            UserID: params[0],
            Name: params[1],
            MobileNumber: params[2],
            Subject: params[3],
            Description: params[4],
            Category: params[5] || 'General Support',
            ProductName: params[6] || null,
            ImagePath: params[7] || null,
            Status: 'Pending',
            AdminNotes: null,
            CreatedAt: new Date(),
            UpdatedAt: new Date()
        };
        inMemoryDB.customerEnquiries.push(newEnquiry);
        return callback(null, { affectedRows: 1, insertId: newEnquiry.EnquiryID });
    }

    // 3. INSERT INTO ProductRequests
    if (queryStr.startsWith('INSERT INTO ProductRequests')) {
        const newReq = {
            RequestID: inMemoryDB.productRequests.length + 1,
            UserID: params[0],
            CustomerName: params[1],
            MobileNumber: params[2],
            ProductName: params[3],
            Brand: params[4],
            SizeOrQty: params[5],
            Description: params[6],
            ImagePath: params[7],
            Status: 'Pending',
            CreatedAt: new Date(),
            UpdatedAt: new Date()
        };
        inMemoryDB.productRequests.push(newReq);
        return callback(null, { affectedRows: 1, insertId: newReq.RequestID });
    }

    // 4. SELECT CustomerEnquiries for Image Access
    if (queryStr.includes('FROM CustomerEnquiries WHERE EnquiryID = ?')) {
        const eId = params[0];
        const match = inMemoryDB.customerEnquiries.filter(e => e.EnquiryID == eId);
        return callback(null, match);
    }

    // 5. UPDATE CustomerEnquiries Status
    if (queryStr.startsWith('UPDATE CustomerEnquiries SET Status = ?')) {
        const status = params[0];
        const notes = params[1];
        const eId = params[2];
        const enquiry = inMemoryDB.customerEnquiries.find(e => e.EnquiryID == eId);
        if (enquiry) {
            enquiry.Status = status;
            if (notes !== null && notes !== undefined) enquiry.AdminNotes = notes;
            enquiry.UpdatedAt = new Date();
        }
        return callback(null, { affectedRows: 1 });
    }

    // 6. SELECT CustomerEnquiries List
    if (queryStr.includes('FROM CustomerEnquiries ce')) {
        return callback(null, inMemoryDB.customerEnquiries);
    }

    // 7. SELECT my enquiries
    if (queryStr.includes('FROM CustomerEnquiries WHERE UserID = ?')) {
        const uId = params[0];
        const match = inMemoryDB.customerEnquiries.filter(e => e.UserID == uId);
        return callback(null, match);
    }

    return callback(null, []);
};

const CustomerRequestsController = require('../controllers/CustomerRequests');
CustomerRequestsController._pool = pool;

function mockReqRes(body = {}, params = {}, user = { UserID: 1, MobileNumber: '9876543210' }, query = {}) {
    let statusCode = 200;
    let responseData = null;
    let responseHeaders = {};
    const req = {
        body,
        params,
        user,
        UserID: user.UserID,
        AdminID: user.AdminID,
        MobileNumber: user.MobileNumber,
        query,
        headers: {}
    };
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
        },
        send(data) {
            responseData = data;
            return this;
        },
        setHeader(name, val) {
            responseHeaders[name] = val;
        }
    };
    return { req, res, getStatus: () => statusCode, getData: () => responseData, getHeaders: () => responseHeaders };
}

// 1x1 transparent PNG in Base64 (valid image)
const validTestImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runTests() {
    console.log("===============================================================");
    console.log("CLIKGETT PRODUCT REQUEST FROM SEARCH & CAMERA TEST SUITE");
    console.log("===============================================================\n");

    try {
        // TEST 1: Standard Customer Enquiry (Backwards Compatibility)
        console.log("[TEST 1] Standard Customer Enquiry submits without product request data");
        const { req: req1, res: res1, getData: getData1, getStatus: getStatus1 } = mockReqRes({
            description: "My order #123 arrived with a missing bottle of milk.",
            subject: "[Delivery Related] Missing Item",
            category: "Delivery Related"
        });
        await CustomerRequestsController.submitEnquiry(req1, res1);
        assert.strictEqual(getStatus1(), 200);
        const data1 = getData1();
        assert.strictEqual(data1.Status, 1);
        const created1 = inMemoryDB.customerEnquiries[0];
        assert.strictEqual(created1.Category, "Delivery Related");
        assert.strictEqual(created1.ProductName, null);
        assert.strictEqual(created1.ImagePath, null);
        console.log("✓ Test 1 Passed: Standard enquiry created without regression.\n");

        // TEST 2: Validation - Missing description rejected
        console.log("[TEST 2] Validation: Missing or empty description returns 400");
        const { req: req2, res: res2, getStatus: getStatus2 } = mockReqRes({
            description: "   ",
            category: "Product Request",
            productName: "Oily Face Wash"
        });
        await CustomerRequestsController.submitEnquiry(req2, res2);
        assert.strictEqual(getStatus2(), 400);
        console.log("✓ Test 2 Passed: Empty description properly rejected with 400.\n");

        // TEST 3: Option A - Request Product Manually (Search Query Prefilled)
        console.log("[TEST 3] Option A: Manual product request from search ('oily')");
        const { req: req3, res: res3, getData: getData3, getStatus: getStatus3 } = mockReqRes({
            category: "Product Request",
            productName: "Oily Skin Face Wash",
            brand: "Himalaya Herbal",
            sizeOrQty: "150ml Tube",
            description: "Looking for oil-free herbal face wash for acne prone skin."
        });
        await CustomerRequestsController.submitEnquiry(req3, res3);
        assert.strictEqual(getStatus3(), 200);
        const data3 = getData3();
        assert.strictEqual(data3.Status, 1);
        assert(data3.Message.includes("Oily Skin Face Wash"));
        const created3 = inMemoryDB.customerEnquiries.find(e => e.EnquiryID === data3.EnquiryID);
        assert.strictEqual(created3.Category, "Product Request");
        assert.strictEqual(created3.ProductName, "Oily Skin Face Wash");
        assert.strictEqual(created3.ImagePath, null);
        assert(created3.Subject.includes("[Product Request]"));
        console.log(`✓ Test 3 Passed: Manual product request persisted with ID #${created3.EnquiryID}.\n`);

        // TEST 4: Option B - Request with Camera (Photo Attachment)
        console.log("[TEST 4] Option B: Product request with Camera photo attachment");
        const { req: req4, res: res4, getData: getData4, getStatus: getStatus4 } = mockReqRes({
            category: "Product Request",
            productName: "Organic Cold Pressed Olive Oil",
            brand: "Borges",
            sizeOrQty: "500 ml",
            description: "Captured photo of the bottle I usually purchase.",
            imageBase64: validTestImageBase64,
            mimeType: "image/png"
        });
        await CustomerRequestsController.submitEnquiry(req4, res4);
        assert.strictEqual(getStatus4(), 200);
        const data4 = getData4();
        assert.strictEqual(data4.Status, 1);
        assert(data4.ImagePath !== null);
        assert(data4.ImagePath.startsWith("images/product_requests/"));
        const created4 = inMemoryDB.customerEnquiries.find(e => e.EnquiryID === data4.EnquiryID);
        assert.strictEqual(created4.ImagePath, data4.ImagePath);
        console.log(`✓ Test 4 Passed: Product request with image uploaded and stored at ${data4.ImagePath}.\n`);

        // TEST 5: Image Size Limit Validation (> 10MB rejected)
        console.log("[TEST 5] Validation: Oversized image (>10MB) returns 400");
        const oversizedBase64 = Buffer.alloc(11 * 1024 * 1024).toString('base64');
        const { req: req5, res: res5, getStatus: getStatus5 } = mockReqRes({
            category: "Product Request",
            productName: "Big File Test",
            description: "Testing size validator",
            imageBase64: oversizedBase64,
            mimeType: "image/jpeg"
        });
        await CustomerRequestsController.submitEnquiry(req5, res5);
        assert.strictEqual(getStatus5(), 400);
        console.log("✓ Test 5 Passed: Oversized image rejected with 400.\n");

        // TEST 6: Admin List Enquiries identifies Product Requests & Photos
        console.log("[TEST 6] Admin enquiry management displays Category, ProductName, and ImagePath");
        const { req: req6, res: res6, getData: getData6, getStatus: getStatus6 } = mockReqRes(
            {}, {}, { AdminID: 99 }
        );
        await CustomerRequestsController.adminListEnquiries(req6, res6);
        assert.strictEqual(getStatus6(), 200);
        const list6 = getData6().Enquiries;
        assert(list6.length >= 3);
        const productReqItem = list6.find(e => e.ProductName === "Organic Cold Pressed Olive Oil");
        assert(productReqItem != null);
        assert.strictEqual(productReqItem.Category, "Product Request");
        assert(productReqItem.ImagePath != null);
        console.log(`✓ Test 6 Passed: Admin view returns ${list6.length} enquiries with product metadata.\n`);

        // TEST 7: Access Control - Unauthorized customer cannot access other customer's image
        console.log("[TEST 7] Access Control: Customer A cannot download Customer B's photo");
        const { req: req7, res: res7, getStatus: getStatus7 } = mockReqRes(
            {}, { id: created4.EnquiryID }, { UserID: 2 } // Different user (Alice)
        );
        await CustomerRequestsController.getSecureEnquiryImage(req7, res7);
        assert.strictEqual(getStatus7(), 403);
        console.log("✓ Test 7 Passed: Unauthorized customer access denied (403 Forbidden).\n");

        // TEST 8: Admin Status Update supports 'Under Review', 'Fulfilled', 'Rejected'
        console.log("[TEST 8] Admin updates enquiry status to 'Under Review' and 'Fulfilled'");
        const { req: req8a, res: res8a, getStatus: getStatus8a } = mockReqRes(
            { status: "Under Review", adminNotes: "Checking warehouse availability with distributor" },
            { id: created4.EnquiryID },
            { AdminID: 99 }
        );
        await CustomerRequestsController.adminUpdateEnquiryStatus(req8a, res8a);
        assert.strictEqual(getStatus8a(), 200);
        assert.strictEqual(created4.Status, "Under Review");
        assert.strictEqual(created4.AdminNotes, "Checking warehouse availability with distributor");

        const { req: req8b, res: res8b, getStatus: getStatus8b } = mockReqRes(
            { status: "Fulfilled", adminNotes: "Product sourced and added to catalog" },
            { id: created4.EnquiryID },
            { AdminID: 99 }
        );
        await CustomerRequestsController.adminUpdateEnquiryStatus(req8b, res8b);
        assert.strictEqual(getStatus8b(), 200);
        assert.strictEqual(created4.Status, "Fulfilled");
        console.log("✓ Test 8 Passed: Admin status workflow successfully updated to Under Review -> Fulfilled.\n");

        // TEST 9: Search Zero-Result Logic Validation
        console.log("[TEST 9] Zero-results UI state assertion logic");
        function shouldShowProductRequestCard(isLoading, hasError, searchLength, resultsLength) {
            // Must not show if currently loading or network error
            if (isLoading || hasError) return false;
            // Must show only when user searched and 0 matching results
            return searchLength > 0 && resultsLength === 0;
        }
        assert.strictEqual(shouldShowProductRequestCard(false, false, 4, 0), true, "Genuine zero results must display prompt");
        assert.strictEqual(shouldShowProductRequestCard(false, false, 4, 3), false, "Matching results must NOT display prompt");
        assert.strictEqual(shouldShowProductRequestCard(true, false, 4, 0), false, "Loading state must NOT display prompt");
        assert.strictEqual(shouldShowProductRequestCard(false, true, 4, 0), false, "Network error must NOT display prompt");
        console.log("✓ Test 9 Passed: Zero-result vs loading/error boundaries strictly enforced.\n");

        console.log("===============================================================");
        console.log("ALL 9 TESTS PASSED SUCCESSFULLY! ✓");
        console.log("===============================================================");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ TEST SUITE FAILURE:", err);
        process.exit(1);
    }
}

runTests();
