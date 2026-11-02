const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 4,
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT,
    charset: 'utf8mb4'
});

const queryAsync = (sql, params = []) => new Promise((res, rej) => pool.query(sql, params, (err, rows) => err ? rej(err) : res(rows)));

const BASE_URL = 'http://localhost:5000/api';
const adminToken = jwt.sign({ AdminID: 1 }, process.env.SECRET_KEY || 'defaultsecret');
const headers = { Authorization: 'token ' + adminToken };

async function verifySalesE2E() {
    console.log("================================================================================");
    console.log("CLIKGETT ADMIN — FLASH SALES E2E FUNCTIONAL VALIDATION");
    console.log("================================================================================\n");

    const results = [];
    const record = (testName, status, details) => {
        results.push({ testName, status, details });
        console.log(`[${status}] ${testName}: ${details}`);
    };

    try {
        // 1. Test Product Loading (getAllProducts backend equivalent)
        console.log("--- 1. PRODUCT LOADING VERIFICATION ---");
        const prodRes = await axios.get(`${BASE_URL}/adminproducts/bycategory`, { headers });
        const hasProducts = prodRes.data.Status === 1 && Array.isArray(prodRes.data.Products) && prodRes.data.Products.length > 0;
        const firstProd = prodRes.data.Products[0];
        record("Product Loading (All Products)", hasProducts ? "PASS" : "FAIL", 
            `Loaded ${prodRes.data.Products.length} active products from AWS RDS (Sample: "${firstProd.ProductName}" [ID: ${firstProd.ProductID}])`);

        // 2. Test Sales List API
        console.log("\n--- 2. FLASH SALES LISTING ---");
        const listRes = await axios.get(`${BASE_URL}/sales/all`, { headers });
        const listOk = listRes.data.Status === 1 && Array.isArray(listRes.data.Sales);
        record("Sales Listing API", listOk ? "PASS" : "FAIL", `Loaded ${listRes.data.Sales.length} existing flash sales`);

        // 3. Test Sale Creation with Product Assignment
        console.log("\n--- 3. FLASH SALE CREATION ---");
        const testProductIDs = [firstProd.ProductID];
        const createPayload = {
            SaleName: "E2E Automated Mega Flash Sale",
            Description: "Special 20% discount on grocery staples",
            DiscountType: "percentage",
            DiscountValue: 20.00,
            StartDate: "2026-10-01 10:00:00",
            EndDate: "2026-10-10 23:59:59",
            ProductIDs: testProductIDs,
            Status: 1
        };

        const createRes = await axios.post(`${BASE_URL}/sales/create`, createPayload, { headers });
        const saleCreated = createRes.data.Status === 1 && createRes.data.SaleID;
        const testSaleID = createRes.data.SaleID;
        record("Create Flash Sale", saleCreated ? "PASS" : "FAIL", `Sale created with SaleID: ${testSaleID}`);

        // Verify AWS RDS persistence
        const [dbSale] = await queryAsync("SELECT * FROM Sales WHERE SaleID = ?", [testSaleID]);
        const dbItems = await queryAsync("SELECT * FROM SaleItems WHERE SaleID = ?", [testSaleID]);
        const dbPersisted = dbSale && dbSale.SaleName === createPayload.SaleName && dbItems.length === testProductIDs.length;
        record("AWS RDS Persistence (Sales + SaleItems)", dbPersisted ? "PASS" : "FAIL", 
            `Sales row verified: "${dbSale.SaleName}" | SaleItems assigned: ${dbItems.length}`);

        // 4. Test Sale Details API
        console.log("\n--- 4. FLASH SALE DETAILS ---");
        const detailRes = await axios.get(`${BASE_URL}/sales/details/${testSaleID}`, { headers });
        const detailOk = detailRes.data.Status === 1 && detailRes.data.Items && detailRes.data.Items.length > 0;
        record("Sale Details & Assigned Items", detailOk ? "PASS" : "FAIL", 
            `Details loaded with ${detailRes.data.Items.length} assigned product(s)`);

        // 5. Test Sale Update (Edit Name and Discount)
        console.log("\n--- 5. FLASH SALE EDITING ---");
        const updatePayload = {
            SaleID: testSaleID,
            SaleName: "E2E Automated Mega Flash Sale — Updated",
            Description: "Updated 25% discount description",
            DiscountType: "percentage",
            DiscountValue: 25.00,
            StartDate: "2026-10-01 10:00:00",
            EndDate: "2026-10-12 23:59:59",
            Status: 1
        };
        const updateRes = await axios.post(`${BASE_URL}/sales/update`, updatePayload, { headers });
        const [dbUpdatedSale] = await queryAsync("SELECT * FROM Sales WHERE SaleID = ?", [testSaleID]);
        const updateOk = updateRes.data.Status === 1 && dbUpdatedSale.SaleName === updatePayload.SaleName && parseFloat(dbUpdatedSale.DiscountValue) === 25.00;
        record("Edit Flash Sale", updateOk ? "PASS" : "FAIL", 
            `Updated discount to 25.00% and name to "${dbUpdatedSale.SaleName}"`);

        // 6. Test Enable / Disable Status Toggle
        console.log("\n--- 6. STATUS TOGGLE ---");
        await axios.post(`${BASE_URL}/sales/update`, { SaleID: testSaleID, Status: 0 }, { headers });
        const [dbDisabledSale] = await queryAsync("SELECT Status FROM Sales WHERE SaleID = ?", [testSaleID]);
        const disableOk = dbDisabledSale.Status === 0;
        record("Enable / Disable Flash Sale", disableOk ? "PASS" : "FAIL", `Status successfully toggled to 0 (Disabled)`);

        // 7. Test Item Removal & Sale Deletion
        console.log("\n--- 7. ITEM REMOVAL & DELETION ---");
        if (dbItems.length > 0) {
            const removeRes = await axios.post(`${BASE_URL}/sales/removeitem`, { SaleItemID: dbItems[0].SaleItemID }, { headers });
            const [remCheck] = await queryAsync("SELECT * FROM SaleItems WHERE SaleItemID = ?", [dbItems[0].SaleItemID]);
            const remOk = removeRes.data.Status === 1 && !remCheck;
            record("Remove Product from Sale", remOk ? "PASS" : "FAIL", `SaleItem #${dbItems[0].SaleItemID} removed`);
        }

        const deleteRes = await axios.post(`${BASE_URL}/sales/delete`, { SaleID: testSaleID }, { headers });
        const [delCheck] = await queryAsync("SELECT * FROM Sales WHERE SaleID = ?", [testSaleID]);
        const deleteOk = deleteRes.data.Status === 1 && !delCheck;
        record("Delete Flash Sale", deleteOk ? "PASS" : "FAIL", `Sale #${testSaleID} deleted and cleaned up`);

        // 8. Negative Tests (Validation)
        console.log("\n--- 8. NEGATIVE VALIDATIONS ---");
        // Missing required fields
        const negRes1 = await axios.post(`${BASE_URL}/sales/create`, { SaleName: "" }, { headers, validateStatus: () => true });
        const neg1Ok = negRes1.status === 400 || negRes1.data.Status === 0;
        record("Negative: Missing Required Fields Rejection", neg1Ok ? "PASS" : "FAIL", `Rejected invalid empty payload (HTTP ${negRes1.status})`);

        // Invalid negative discount
        const negRes2 = await axios.post(`${BASE_URL}/sales/create`, {
            SaleName: "Negative Sale",
            DiscountType: "percentage",
            DiscountValue: -15,
            StartDate: "2026-10-01",
            EndDate: "2026-10-05"
        }, { headers, validateStatus: () => true });
        const neg2Ok = negRes2.status === 400 || negRes2.data.Status === 0;
        record("Negative: Negative Discount Rejection", neg2Ok ? "PASS" : "FAIL", `Rejected negative discount (HTTP ${negRes2.status})`);

        console.log("\n================================================================================");
        console.log("FLASH SALES E2E VALIDATION SUMMARY:");
        console.log(`TOTAL CHECKS: ${results.length}`);
        const passCount = results.filter(r => r.status === "PASS").length;
        const failCount = results.filter(r => r.status === "FAIL").length;
        console.log(`PASS: ${passCount} | FAIL: ${failCount}`);
        console.log("================================================================================");

    } catch (e) {
        console.error("Flash Sales E2E Exception:", e);
    } finally {
        process.exit(0);
    }
}

verifySalesE2E();
