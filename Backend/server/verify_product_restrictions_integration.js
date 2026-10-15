const pool = require('./utils/db');
const PricingEngine = require('./services/PricingEngine');
const util = require('./utils/utils');

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function runTest() {
    console.log("============================================================");
    console.log("CLIKGETT PRODUCT RESTRICTIONS -> PRODUCTS INTEGRATION TEST");
    console.log("============================================================");

    const testProductId = 591; // Aashirvaad Superior MP Aata 10kg
    const results = [];

    try {
        // 1. Check Product exists
        const products = await queryAsync("SELECT * FROM Products WHERE ProductID = ?", [testProductId]);
        if (products.length === 0) throw new Error("Product 591 not found");
        console.log(`[PASS] Found test product: ${products[0].ProductName} (Base Price: ₹${products[0].Price})`);
        results.push({ test: "Product Exists in AWS RDS", status: "PASS" });

        // Backup existing restrictions if any
        const existingRestrictions = await queryAsync("SELECT * FROM product_restrictions WHERE ProductID = ?", [testProductId]);
        console.log(`Initial restrictions for Product 591 in AWS RDS: ${existingRestrictions.length}`);

        // 2. Test Controller saveProductRestrictions
        const ProductRestrictionsController = require('./controllers/ProductRestrictions');
        
        // Mock res & req
        let resData = null;
        const mockRes = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(data) { resData = data; return this; }
        };

        const reqEnable = {
            body: {
                ProductID: testProductId,
                restrictions: {
                    no_cashback: 1,
                    no_coupon: 1,
                    no_membership: 1
                }
            }
        };

        await ProductRestrictionsController.saveProductRestrictions(reqEnable, mockRes);
        if (!resData || resData.Status !== 1) throw new Error("saveProductRestrictions failed: " + JSON.stringify(resData));
        console.log("[PASS] saveProductRestrictions (All ON):", resData.Message);
        results.push({ test: "saveProductRestrictions (Create/Update)", status: "PASS" });

        // 3. Verify AWS RDS DB records
        const savedRows = await queryAsync("SELECT * FROM product_restrictions WHERE ProductID = ? AND Status = 1", [testProductId]);
        console.log(`[PASS] Verified in AWS RDS product_restrictions: ${savedRows.length} active restrictions found`);
        const savedTypes = savedRows.map(r => r.RestrictionType);
        if (!savedTypes.includes('no_cashback') || !savedTypes.includes('no_coupon') || !savedTypes.includes('no_membership')) {
            throw new Error("Missing restriction types in DB: " + JSON.stringify(savedTypes));
        }
        results.push({ test: "AWS RDS Persistence (All Types Active)", status: "PASS" });

        // 4. Test PricingEngine Consumption
        const cartItem = {
            ProductID: testProductId,
            ProductName: products[0].ProductName,
            Quantity: 2,
            Price: parseFloat(products[0].Price || 20)
        };

        // 4a. Cashback Exclusion Test: cart with excluded product
        const calcResExcluded = await PricingEngine.calculateCart([cartItem], "TESTPROMO", 1, null);
        console.log(`[INFO] Excluded Cart Calculation: SubTotal = ₹${calcResExcluded.SubTotal}, CashbackEligible = ₹${calcResExcluded.CashbackEligibleSubTotal}, CouponEligible = ₹${calcResExcluded.CouponEligibleSubTotal}, CashbackEarned = ₹${calcResExcluded.CashbackEarned}`);
        if (calcResExcluded.CashbackEligibleSubTotal !== 0) throw new Error("CashbackEligibleSubTotal should be 0 for no_cashback product");
        if (calcResExcluded.CouponEligibleSubTotal !== 0) throw new Error("CouponEligibleSubTotal should be 0 for no_coupon product");
        results.push({ test: "PricingEngine Excludes Restricted Product (Cashback & Coupon)", status: "PASS" });

        // 5. Test Disable restrictions (Toggle OFF)
        const reqDisable = {
            body: {
                ProductID: testProductId,
                restrictions: {
                    no_cashback: 0,
                    no_coupon: 0,
                    no_membership: 0
                }
            }
        };

        await ProductRestrictionsController.saveProductRestrictions(reqDisable, mockRes);
        const disabledRows = await queryAsync("SELECT * FROM product_restrictions WHERE ProductID = ? AND Status = 1", [testProductId]);
        console.log(`[PASS] Toggled restrictions OFF. Active in DB: ${disabledRows.length}`);
        if (disabledRows.length !== 0) throw new Error("Expected 0 active restrictions after disabling");
        results.push({ test: "saveProductRestrictions (Toggle OFF / Disable)", status: "PASS" });

        // 6. Test PricingEngine Return to Eligibility
        const calcResEnabled = await PricingEngine.calculateCart([cartItem], null, 1, null);
        console.log(`[INFO] Enabled Cart Calculation: SubTotal = ₹${calcResEnabled.SubTotal}, CashbackEligible = ₹${calcResEnabled.CashbackEligibleSubTotal}`);
        if (calcResEnabled.CashbackEligibleSubTotal <= 0) throw new Error("CashbackEligibleSubTotal should be > 0 when no_cashback is inactive");
        results.push({ test: "PricingEngine Restores Full Eligibility When Restrictions Inactive", status: "PASS" });

        // Clean up test restrictions for Product 591 to restore original clean state
        await queryAsync("DELETE FROM product_restrictions WHERE ProductID = ?", [testProductId]);
        if (existingRestrictions.length > 0) {
            for (const r of existingRestrictions) {
                await queryAsync("INSERT INTO product_restrictions (ProductID, VariantID, RestrictionType, RestrictionValue, Status) VALUES (?, ?, ?, ?, ?)",
                    [r.ProductID, r.VariantID, r.RestrictionType, r.RestrictionValue, r.Status]);
            }
        }
        console.log("[PASS] Cleaned up test restrictions on Product 591.");
        results.push({ test: "Clean Teardown / State Restored", status: "PASS" });

        console.log("\n============================================================");
        console.log("INTEGRATION TEST SUMMARY: ALL PASS (100%)");
        console.log("============================================================");
        console.table(results);
        process.exit(0);
    } catch (err) {
        console.error("\n[FAIL] Test encountered error:", err);
        // Clean up anyway
        await queryAsync("DELETE FROM product_restrictions WHERE ProductID = ?", [testProductId]).catch(() => {});
        process.exit(1);
    }
}

runTest();
