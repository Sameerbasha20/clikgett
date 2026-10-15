const PricingEngine = require('./services/PricingEngine');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const mysql = require('mysql');

const pool = mysql.createPool({
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT
});

const queryAsync = (sql, params = []) => new Promise((res, rej) => pool.query(sql, params, (err, rows) => err ? rej(err) : res(rows)));

const API_BASE = 'http://localhost:5000/api';
const SECRET_KEY = process.env.SECRET_KEY || 'defaultsecret';
const adminToken = jwt.sign({ AdminID: 1 }, SECRET_KEY);
const authHeaders = { headers: { Authorization: `token ${adminToken}` } };

async function runFlashSaleIntegrationTests() {
    console.log("============================================================");
    console.log("STARTING DEDICATED PRODUCT FLASH SALE INTEGRATION TESTS");
    console.log("Target: Live AWS RDS MySQL | API: http://localhost:5000/api");
    console.log("============================================================\n");

    const results = [];
    const record = (stepNum, stepName, status, details) => {
        results.push({ stepNum, stepName, status, details });
        console.log(`[Step ${stepNum.toString().padStart(2, '0')}] [${status}] ${stepName}: ${details}`);
    };

    let testProductID = null;
    let testProductName = null;
    let testSaleID = null;
    let testSaleItemID = null;
    let testBaseOfferPrice = null;

    try {
        // ------------------------------------------------------------
        // Step 1: Find valid live product
        // ------------------------------------------------------------
        const [prod] = await queryAsync("SELECT ProductID, ProductName FROM Products WHERE Status = 1 LIMIT 1");
        if (!prod || !prod.ProductID) {
            throw new Error("No active product found in AWS RDS database");
        }
        testProductID = prod.ProductID;
        testProductName = prod.ProductName;

        // Get variant / offer price
        const [variant] = await queryAsync("SELECT VariantID, Price, OfferPrice FROM ProductVariants WHERE ProductID = ? LIMIT 1", [testProductID]);
        testBaseOfferPrice = variant && variant.OfferPrice ? parseFloat(variant.OfferPrice) : 100.00;

        record(1, "Find Valid Live Product", "PASS", `ProductID: ${testProductID} ("${testProductName}"), Base OfferPrice: ₹${testBaseOfferPrice}`);

        // ------------------------------------------------------------
        // Step 2: Create test sale in AWS RDS
        // ------------------------------------------------------------
        // Clean up any stale test sales first
        await queryAsync("DELETE FROM SaleItems WHERE SaleID IN (SELECT SaleID FROM Sales WHERE SaleName LIKE 'TEST_FS_%')");
        await queryAsync("DELETE FROM Sales WHERE SaleName LIKE 'TEST_FS_%'");

        // Create an active 20% discount sale
        const saleInsert = await queryAsync(
            "INSERT INTO Sales (SaleName, Description, DiscountType, DiscountValue, StartDate, EndDate, Status, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY), 1, NOW(), NOW())",
            ['TEST_FS_ACTIVE_20', 'Automated Integration Test Flash Sale', 'percentage', 20.00]
        );
        testSaleID = saleInsert.insertId;
        record(2, "Create / Identify Test Sale", "PASS", `SaleID: ${testSaleID}, Name: 'TEST_FS_ACTIVE_20', Discount: 20% (Active)`);

        // ------------------------------------------------------------
        // Step 3: Assign product via API (POST /api/sales/assign-product)
        // ------------------------------------------------------------
        const assignRes = await axios.post(`${API_BASE}/sales/assign-product`, {
            SaleID: testSaleID,
            ProductID: testProductID
        }, authHeaders);

        if (assignRes.status === 200 && (assignRes.data.status === true || assignRes.data.Status === 1 || assignRes.data.message)) {
            record(3, "Assign Product to Sale via API", "PASS", `Assigned ProductID ${testProductID} to SaleID ${testSaleID}. Response: ${assignRes.data.message}`);
        } else {
            record(3, "Assign Product to Sale via API", "FAIL", `API returned status ${assignRes.status}: ${JSON.stringify(assignRes.data)}`);
        }

        // ------------------------------------------------------------
        // Step 4: Verify SaleItems persistence in AWS RDS
        // ------------------------------------------------------------
        const saleItemRows = await queryAsync("SELECT * FROM SaleItems WHERE SaleID = ? AND ProductID = ?", [testSaleID, testProductID]);
        if (saleItemRows.length > 0) {
            testSaleItemID = saleItemRows[0].SaleItemID;
            record(4, "Verify SaleItems Persistence", "PASS", `Found SaleItemID ${testSaleItemID} in AWS RDS for SaleID ${testSaleID} and ProductID ${testProductID}`);
        } else {
            record(4, "Verify SaleItems Persistence", "FAIL", `No record found in SaleItems for SaleID ${testSaleID} and ProductID ${testProductID}`);
        }

        // ------------------------------------------------------------
        // Step 5: Verify product-sale lookup via API (GET /api/sales/product/:productId)
        // ------------------------------------------------------------
        const lookupRes = await axios.get(`${API_BASE}/sales/product/${testProductID}`, authHeaders);
        const assignedSales = lookupRes.data.Sales || lookupRes.data.sales || lookupRes.data.data || [];
        const foundSale = assignedSales.find(s => s.SaleID === testSaleID);
        if (foundSale) {
            record(5, "Verify Product-Sale Lookup API", "PASS", `API returned assigned sale: "${foundSale.SaleName}", Discount: ${foundSale.DiscountValue}%`);
        } else {
            record(5, "Verify Product-Sale Lookup API", "FAIL", `SaleID ${testSaleID} not found in GET /api/sales/product/${testProductID}. Sales: ${JSON.stringify(assignedSales)}`);
        }

        // ------------------------------------------------------------
        // Step 6: Verify active sale is detected by PricingEngine
        // ------------------------------------------------------------
        const activeSalesList = await PricingEngine.getActiveFlashSales([testProductID]);
        const detectedSale = (activeSalesList || []).find(s => s.ProductID == testProductID);
        if (detectedSale && detectedSale.SaleID === testSaleID && detectedSale.DiscountType === 'percentage' && parseFloat(detectedSale.DiscountValue) === 20) {
            record(6, "Verify Active Sale Detected", "PASS", `PricingEngine detected Active Sale: "${detectedSale.SaleName}" (20% off)`);
        } else {
            record(6, "Verify Active Sale Detected", "FAIL", `PricingEngine did not return active sale. Got: ${JSON.stringify(detectedSale)}`);
        }

        // ------------------------------------------------------------
        // Step 7: Verify PricingEngine applies discount
        // ------------------------------------------------------------
        const sampleItem = {
            ProductID: testProductID,
            VariantID: 1,
            ProductName: testProductName,
            OfferPrice: testBaseOfferPrice,
            Quantity: 1
        };

        const expectedUnitPrice = Math.round((testBaseOfferPrice * (1 - 0.20)) * 100) / 100;
        const lineCalc = PricingEngine.calculateLinePrice(sampleItem, null, null, [], detectedSale);

        if (lineCalc.UnitPrice === expectedUnitPrice && lineCalc.LineTotal === expectedUnitPrice && lineCalc.ActiveFlashSale) {
            record(7, "PricingEngine Applies Discount", "PASS", `Original: ₹${testBaseOfferPrice} -> Flash Sale Unit: ₹${lineCalc.UnitPrice} (-20%), LineTotal: ₹${lineCalc.LineTotal} (Rule: ${lineCalc.AppliedRule})`);
        } else {
            record(7, "PricingEngine Applies Discount", "FAIL", `Expected Unit: ₹${expectedUnitPrice}, got ₹${lineCalc.UnitPrice} (LineTotal: ₹${lineCalc.LineTotal})`);
        }

        // ------------------------------------------------------------
        // Step 8: Verify inactive sale does not apply (Status = 0)
        // ------------------------------------------------------------
        await queryAsync("UPDATE Sales SET Status = 0 WHERE SaleID = ?", [testSaleID]);
        const inactiveSalesList = await PricingEngine.getActiveFlashSales([testProductID]);
        const inactiveDetected = (inactiveSalesList || []).find(s => s.ProductID == testProductID);
        const inactiveSaleCalc = PricingEngine.calculateLinePrice(sampleItem, null, null, [], inactiveDetected || null);

        if (!inactiveDetected && inactiveSaleCalc.UnitPrice === testBaseOfferPrice) {
            record(8, "Inactive Sale Ignored", "PASS", `Status = 0: Not detected by getActiveFlashSales, UnitPrice stays ₹${inactiveSaleCalc.UnitPrice}`);
        } else {
            record(8, "Inactive Sale Ignored", "FAIL", `Inactive sale was erroneously applied! UnitPrice: ₹${inactiveSaleCalc.UnitPrice}`);
        }

        // ------------------------------------------------------------
        // Step 9: Verify expired sale does not apply (EndDate < NOW())
        // ------------------------------------------------------------
        await queryAsync("UPDATE Sales SET Status = 1, StartDate = DATE_SUB(NOW(), INTERVAL 5 DAY), EndDate = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE SaleID = ?", [testSaleID]);
        const expiredSalesList = await PricingEngine.getActiveFlashSales([testProductID]);
        const expiredDetected = (expiredSalesList || []).find(s => s.ProductID == testProductID);
        const expiredSaleCalc = PricingEngine.calculateLinePrice(sampleItem, null, null, [], expiredDetected || null);

        if (!expiredDetected && expiredSaleCalc.UnitPrice === testBaseOfferPrice) {
            record(9, "Expired Sale Ignored", "PASS", `EndDate < NOW(): Not detected by getActiveFlashSales, UnitPrice stays ₹${expiredSaleCalc.UnitPrice}`);
        } else {
            record(9, "Expired Sale Ignored", "FAIL", `Expired sale was erroneously applied! UnitPrice: ₹${expiredSaleCalc.UnitPrice}`);
        }

        // ------------------------------------------------------------
        // Step 10: Remove product from sale via API (POST /api/sales/remove-product)
        // ------------------------------------------------------------
        // Reset sale to active first so we test actual removal
        await queryAsync("UPDATE Sales SET Status = 1, StartDate = DATE_SUB(NOW(), INTERVAL 1 DAY), EndDate = DATE_ADD(NOW(), INTERVAL 2 DAY) WHERE SaleID = ?", [testSaleID]);
        
        const removeRes = await axios.post(`${API_BASE}/sales/remove-product`, {
            SaleID: testSaleID,
            ProductID: testProductID
        }, authHeaders);

        const checkAfterRemove = await queryAsync("SELECT * FROM SaleItems WHERE SaleID = ? AND ProductID = ?", [testSaleID, testProductID]);
        if (removeRes.status === 200 && checkAfterRemove.length === 0) {
            record(10, "Remove Product From Sale", "PASS", `API removed product. SaleItems count in AWS RDS: ${checkAfterRemove.length}`);
        } else {
            record(10, "Remove Product From Sale", "FAIL", `Removal failed or record still exists. Count: ${checkAfterRemove.length}`);
        }

        // ------------------------------------------------------------
        // Step 11: Verify pricing returns to normal
        // ------------------------------------------------------------
        const finalSalesList = await PricingEngine.getActiveFlashSales([testProductID]);
        const finalDetected = (finalSalesList || []).find(s => s.ProductID == testProductID);
        const normalCalc = PricingEngine.calculateLinePrice(sampleItem, null, null, [], finalDetected || null);

        if (!finalDetected && normalCalc.UnitPrice === testBaseOfferPrice && normalCalc.LineTotal === testBaseOfferPrice) {
            record(11, "Pricing Returns to Normal", "PASS", `UnitPrice: ₹${normalCalc.UnitPrice}, LineTotal: ₹${normalCalc.LineTotal} (Standard Offer Price)`);
        } else {
            record(11, "Pricing Returns to Normal", "FAIL", `Expected normal price ₹${testBaseOfferPrice}, got ₹${normalCalc.UnitPrice}`);
        }

        // ------------------------------------------------------------
        // Step 12: Cleanup all test records in AWS RDS
        // ------------------------------------------------------------
        await queryAsync("DELETE FROM SaleItems WHERE SaleID = ?", [testSaleID]);
        await queryAsync("DELETE FROM Sales WHERE SaleID = ?", [testSaleID]);

        const remainingSales = await queryAsync("SELECT * FROM Sales WHERE SaleID = ?", [testSaleID]);
        const remainingItems = await queryAsync("SELECT * FROM SaleItems WHERE SaleID = ?", [testSaleID]);

        if (remainingSales.length === 0 && remainingItems.length === 0) {
            record(12, "Clean Up All Test Records", "PASS", `Test SaleID ${testSaleID} and its SaleItems completely purged from AWS RDS`);
        } else {
            record(12, "Clean Up All Test Records", "FAIL", `Leftover records in AWS RDS: Sales=${remainingSales.length}, Items=${remainingItems.length}`);
        }

    } catch (err) {
        console.error("Test execution failed with error:", err);
        record(99, "Execution Error", "FAIL", err.message);
    } finally {
        // Guaranteed cleanup of any leftover TEST_FS records
        try {
            await queryAsync("DELETE FROM SaleItems WHERE SaleID IN (SELECT SaleID FROM Sales WHERE SaleName LIKE 'TEST_FS_%')");
            await queryAsync("DELETE FROM Sales WHERE SaleName LIKE 'TEST_FS_%'");
        } catch (e) {}

        console.log("\n============================================================");
        console.log("SUMMARY OF FLASH SALE INTEGRATION TESTS:");
        console.log(`TOTAL CHECKS: ${results.length}`);
        const passCount = results.filter(r => r.status === "PASS").length;
        const failCount = results.filter(r => r.status === "FAIL").length;
        console.log(`PASS: ${passCount} | FAIL: ${failCount} | BLOCKED: 0`);
        console.log("============================================================");

        pool.end();
        process.exit(failCount === 0 ? 0 : 1);
    }
}

runFlashSaleIntegrationTests();
