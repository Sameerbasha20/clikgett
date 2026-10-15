const pool = require('../utils/db');
const assert = require('assert');
const BuyMoreController = require('../controllers/BuyMore');
const PricingEngine = require('../services/PricingEngine');

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function mockReqRes(body = {}, params = {}, query = {}, user = { AdminID: 1 }) {
    let statusCode = 200;
    let responseData = null;
    const req = { body, params, query, user, headers: {} };
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

async function runBuyMoreTests() {
    console.log("=== RUNNING BUY MORE PRICING E2E VERIFICATION ===");
    let testProductId = null;
    let testVariantId = null;

    try {
        // Setup: Create a temporary test product and variant
        const [cat] = await queryAsync("SELECT CategoryID FROM Categories LIMIT 1");
        const catId = cat ? cat.CategoryID : 1;

        const prodRes = await queryAsync(`
            INSERT INTO Products (ProductName, CategoryID, Status, CreatedAt)
            VALUES ('TEST_BUYMORE_PROD', ?, 1, NOW())
        `, [catId]);
        testProductId = prodRes.insertId;

        const varRes = await queryAsync(`
            INSERT INTO ProductVariants (ProductID, metrictype, metricvalue, Price, OfferPrice, AvailableQty, Status)
            VALUES (?, 'pc', '1', 50.00, 45.00, 100, 1)
        `, [testProductId]);
        testVariantId = varRes.insertId;

        console.log(`[SETUP] Created test Product #${testProductId} and Variant #${testVariantId}`);

        // TEST 1: Admin configures Buy More quantity tiers (Qty 2 @ ₹40, Qty 5 @ ₹35)
        console.log("\n--- TEST 1: Save Buy More pricing tiers ---");
        const { req: req1, res: res1, getData: getData1, getStatus: getStatus1 } = mockReqRes({
            ProductID: testProductId,
            items: [
                { Quantity: 2, Price: 40.00 },
                { Quantity: 5, Price: 35.00 }
            ],
            Status: 1
        });
        await BuyMoreController.saveProductTiers(req1, res1);
        await new Promise(r => setTimeout(r, 400));
        const resData1 = getData1();
        console.log("saveProductTiers response:", resData1);
        assert.strictEqual(resData1.Status, 1, "Saving tiers should succeed");

        // Verify persisted tiers
        const tiersInDb = await queryAsync("SELECT * FROM buy_more_config WHERE ProductID = ? ORDER BY MinQuantity ASC", [testProductId]);
        assert.strictEqual(tiersInDb.length, 2, "Should have 2 tiers saved in DB");
        assert.strictEqual(tiersInDb[0].MinQuantity, 2, "Tier 1 MinQuantity is 2");
        assert.strictEqual(parseFloat(tiersInDb[0].Price), 40.00, "Tier 1 Price is 40.00");
        assert.strictEqual(tiersInDb[1].MinQuantity, 5, "Tier 2 MinQuantity is 5");
        assert.strictEqual(parseFloat(tiersInDb[1].Price), 35.00, "Tier 2 Price is 35.00");
        console.log("✓ Test 1 Passed: Tiers saved and persisted correctly in MySQL.");

        // TEST 2: Rejection of invalid inputs & duplicate quantities
        console.log("\n--- TEST 2: Reject invalid tiers and duplicate quantities ---");
        // Duplicate quantity
        const { req: req2a, res: res2a, getData: getData2a, getStatus: getStatus2a } = mockReqRes({
            ProductID: testProductId,
            items: [
                { Quantity: 3, Price: 30.00 },
                { Quantity: 3, Price: 28.00 }
            ]
        });
        await BuyMoreController.saveProductTiers(req2a, res2a);
        await new Promise(r => setTimeout(r, 200));
        assert.strictEqual(getStatus2a(), 400, "Should reject duplicate quantities with 400");
        console.log("Duplicate check passed:", getData2a().Message);

        // Invalid negative price
        const { req: req2b, res: res2b, getData: getData2b, getStatus: getStatus2b } = mockReqRes({
            ProductID: testProductId,
            items: [{ Quantity: 4, Price: -10.00 }]
        });
        await BuyMoreController.saveProductTiers(req2b, res2b);
        await new Promise(r => setTimeout(r, 200));
        assert.strictEqual(getStatus2b(), 400, "Should reject negative price with 400");
        console.log("Negative price check passed:", getData2b().Message);

        // Missing product ID
        const { req: req2c, res: res2c, getData: getData2c, getStatus: getStatus2c } = mockReqRes({
            items: [{ Quantity: 4, Price: 30.00 }]
        });
        await BuyMoreController.saveProductTiers(req2c, res2c);
        await new Promise(r => setTimeout(r, 200));
        assert.strictEqual(getStatus2c(), 400, "Should reject missing ProductID with 400");
        console.log("Missing ProductID check passed:", getData2c().Message);
        console.log("✓ Test 2 Passed: Invalid inputs and duplicates are properly rejected.");

        // TEST 3: PricingEngine calculation with Buy More tiers
        console.log("\n--- TEST 3: PricingEngine cart calculation ---");
        // Cart item with qty = 2 (matches tier 1: ₹40/unit -> total ₹80 instead of base ₹45 * 2 = ₹90)
        const cartItems = [
            {
                ProductID: testProductId,
                VariantID: testVariantId,
                Quantity: 2,
                Price: 50.00,
                OfferPrice: 45.00
            }
        ];
        const pricingResult = await PricingEngine.calculateCart(cartItems, null, null, null);
        console.log("PricingEngine calculation (Qty = 2):", {
            subTotal: pricingResult.SubTotal,
            grandTotal: pricingResult.GrandTotal,
            itemTotal: pricingResult.Items[0].LineTotal,
            rule: pricingResult.Items[0].AppliedRule
        });
        // With Buy More tier (Qty 2 @ ₹40.00), LineTotal is ₹40.00 vs regular 2 * ₹45.00 = ₹90.00
        assert(pricingResult.Items[0].LineTotal < (45.00 * 2), "Buy More price should be applied and save money vs base offer price");
        assert.strictEqual(pricingResult.Items[0].LineTotal, 40.00, "Buy More package price should be ₹40.00");
        console.log("✓ Test 3 Passed: PricingEngine applies Buy More pricing correctly in cart calculations.");

        // TEST 4: Clearing all tiers for a product
        console.log("\n--- TEST 4: Admin clears/removes all tiers ---");
        const { req: req4, res: res4, getData: getData4, getStatus: getStatus4 } = mockReqRes({
            ProductID: testProductId,
            items: []
        });
        await BuyMoreController.saveProductTiers(req4, res4);
        await new Promise(r => setTimeout(r, 400));
        const resData4 = getData4();
        console.log("Clear tiers response:", resData4);
        assert.strictEqual(resData4.Status, 1, "Clearing tiers should succeed");

        const remainingTiers = await queryAsync("SELECT * FROM buy_more_config WHERE ProductID = ?", [testProductId]);
        assert.strictEqual(remainingTiers.length, 0, "No tiers should remain in DB");
        console.log("✓ Test 4 Passed: Admin can clear/remove all Buy More tiers without error.");

        console.log("\n========================================");
        console.log(">>> ALL BUY MORE PRICING TESTS PASSED! <<<");
        console.log("========================================");
    } catch (err) {
        console.error("Test failed with error:", err);
        process.exitCode = 1;
    } finally {
        if (testProductId) {
            await queryAsync("DELETE FROM buy_more_config WHERE ProductID = ?", [testProductId]);
            await queryAsync("DELETE FROM ProductVariants WHERE ProductID = ?", [testProductId]);
            await queryAsync("DELETE FROM Products WHERE ProductID = ?", [testProductId]);
            console.log(`[CLEANUP] Deleted test product #${testProductId}`);
        }
        pool.end();
    }
}

runBuyMoreTests();
