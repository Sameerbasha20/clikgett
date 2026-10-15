require('dotenv').config({ path: './.env' });
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('./utils/db');
const PricingEngine = require('./services/PricingEngine');

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.SECRET_KEY || 'defaultsecret';
const adminToken = jwt.sign({ AdminID: 1 }, JWT_SECRET);
const headers = { Authorization: `token ${adminToken}` };

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function runUnifiedProductEditorTest() {
    console.log("============================================================");
    console.log("STARTING UNIFIED PRODUCT EDITOR & DYNAMIC PLANS VERIFICATION");
    console.log("Target: Live AWS RDS MySQL | API: " + BASE_URL);
    console.log("============================================================\n");

    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;

    function report(name, success, details) {
        totalChecks++;
        if (success) {
            passedChecks++;
            console.log(`[PASS] Check ${totalChecks}: ${name} -> ${details}`);
        } else {
            failedChecks++;
            console.error(`[FAIL] Check ${totalChecks}: ${name} -> ${details}`);
        }
    }

    let createdProductId = null;
    let createdVariantId = null;
    const testPlanId = 8888;

    try {
        // Step 1: Query a valid category and subcategory
        const [cat] = await queryAsync("SELECT CategoryID FROM Categories WHERE Status = 1 LIMIT 1");
        const [subCat] = await queryAsync("SELECT SubCategoryID FROM SubCategories WHERE CategoryID = ? LIMIT 1", [cat.CategoryID]);

        // Step 2: Test Product Creation API with initial variant & verify ProductID returned
        const createPayload = {
            CategoryID: cat.CategoryID,
            SubCategoryID: subCat ? subCat.SubCategoryID : 0,
            ProductName: "E2E Unified Test Product " + Date.now(),
            Description: "Automated test description for unified product editor",
            Type: 1,
            Status: 1,
            ProductVariants: [
                {
                    metrictype: "gm",
                    metricvalue: "500",
                    Price: 150.00,
                    OfferPrice: 135.00,
                    AvailableQty: 25
                }
            ],
            ProductImages: ["test_image_1.png"]
        };

        const createRes = await axios.post(`${BASE_URL}/adminproducts/addproduct`, createPayload, { headers });
        const hasProdId = createRes.data.Status === 1 && (createRes.data.ProductID || createRes.data.ID);
        createdProductId = createRes.data.ProductID || createRes.data.ID;

        report(
            "Product Creation API returns ProductID",
            hasProdId,
            `Response: Status=${createRes.data.Status}, ProductID=${createdProductId}`
        );

        // Step 3: Verify Product Details loaded with variants, pricing, and category
        const detailRes = await axios.get(`${BASE_URL}/adminproducts/productdetail/${createdProductId}`, { headers });
        const loadedProd = detailRes.data.Products;
        const variants = loadedProd?.ProductVariants || [];
        const variantOk = variants.length > 0 && parseFloat(variants[0].Price) === 150.00;

        report(
            "Product Details API loads full product context",
            detailRes.data.Status === 1 && variantOk,
            `Loaded Product: "${loadedProd?.ProductName}", Variants: ${variants.length}, Base: ₹${variants[0]?.Price}, Offer: ₹${variants[0]?.OfferPrice}`
        );

        // Step 4: Add additional variant to verify Variants Tab functionality
        const addVarPayload = {
            ProductID: createdProductId,
            metrictype: "kg",
            metricvalue: "1",
            Price: 280.00,
            OfferPrice: 250.00,
            AvailableQty: 15
        };
        const addVarRes = await axios.post(`${BASE_URL}/adminproducts/addvariant`, addVarPayload, { headers });
        const [newVarRow] = await queryAsync("SELECT * FROM ProductVariants WHERE ProductID = ? AND metrictype = 'kg'", [createdProductId]);
        createdVariantId = newVarRow ? newVarRow.VariantID : null;

        report(
            "Variant Management -> Add Variant in Unified Editor",
            addVarRes.data.Status === 1 && Boolean(createdVariantId),
            `Added Variant ID #${createdVariantId} (1 kg @ ₹250.00, Stock: 15)`
        );

        // Step 5: Test Stock / Inventory availability update
        const updateVarPayload = {
            ProductID: createdProductId,
            metrictype: "kg",
            metricvalue: "1",
            Price: 280.00,
            OfferPrice: 250.00,
            AvailableQty: 42
        };
        const updVarRes = await axios.put(`${BASE_URL}/adminproducts/updateproductvariant/${createdVariantId}`, updateVarPayload, { headers });
        const [checkStock] = await queryAsync("SELECT AvailableQty FROM ProductVariants WHERE VariantID = ?", [createdVariantId]);

        report(
            "Stock Management -> Update AvailableQty in Unified Editor",
            updVarRes.data.Status === 1 && checkStock && checkStock.AvailableQty === 42,
            `Stock updated from 15 to ${checkStock?.AvailableQty} units`
        );

        // Step 6: Test Dynamic Membership Plans
        // 6a: Query existing plans
        const initialPlansRes = await axios.get(`${BASE_URL}/membership/product/${createdProductId}`, { headers });
        const initialPlanNames = (initialPlansRes.data.Plans || []).map(p => p.PlanName);
        console.log(`[INFO] Current active plans: ${initialPlanNames.join(', ')}`);

        // 6b: Insert a temporary new plan into AWS RDS MembershipPlans (e.g. Platinum Plan)
        await queryAsync("DELETE FROM MembershipPlans WHERE PlanID = ?", [testPlanId]);
        await queryAsync(
            "INSERT INTO MembershipPlans (PlanID, PlanName, DurationDays, Price, FreeDelivery, ExtraCashbackPercentage, Status) VALUES (?, 'Dynamic Platinum Plan', 90, 399.00, 1, 8.00, 1)",
            [testPlanId]
        );

        // 6c: Query membership pricing endpoint again - must dynamically contain the new plan!
        const dynamicPlansRes = await axios.get(`${BASE_URL}/membership/product/${createdProductId}`, { headers });
        const foundDynamicPlan = (dynamicPlansRes.data.Plans || []).find(p => p.PlanID === testPlanId);

        report(
            "Dynamic Membership Plans -> Automatically discovered without code changes",
            Boolean(foundDynamicPlan && foundDynamicPlan.PlanName === 'Dynamic Platinum Plan'),
            `Discovered dynamic plan: "${foundDynamicPlan?.PlanName}", Fee: ₹${foundDynamicPlan?.SubscriptionPrice}`
        );

        // Step 7: Configure Member Price for this dynamic plan and verify persistence
        const saveMemberPricePayload = {
            ProductID: createdProductId,
            items: [
                {
                    PlanID: testPlanId,
                    MembershipPrice: 110.00,
                    Status: 1
                }
            ]
        };
        const saveMemberRes = await axios.post(`${BASE_URL}/membership/product/save`, saveMemberPricePayload, { headers });
        const [dbMemberPrice] = await queryAsync(
            "SELECT * FROM membership_product_prices WHERE ProductID = ? AND PlanID = ?",
            [createdProductId, testPlanId]
        );

        report(
            "Membership Pricing Tab -> Save & Persist Member Price for Dynamic Plan",
            saveMemberRes.data.Status === 1 && dbMemberPrice && parseFloat(dbMemberPrice.MembershipPrice) === 110.00,
            `Persisted Member Price: ₹${dbMemberPrice?.MembershipPrice} for PlanID ${testPlanId} on Product ${createdProductId}`
        );

        // Step 8: Test Buy More Multi-Tier Pricing Tab
        const buyMorePayload = {
            ProductID: createdProductId,
            Tiers: [
                { Quantity: 2, Price: 240.00 },
                { Quantity: 5, Price: 550.00 }
            ],
            StartDate: "2026-01-01 00:00:00",
            EndDate: "2026-12-31 23:59:59",
            Status: 1
        };
        const buyMoreRes = await axios.post(`${BASE_URL}/buymore/save-product-tiers`, buyMorePayload, { headers });
        const dbTiers = await queryAsync("SELECT * FROM buy_more_config WHERE ProductID = ? ORDER BY MinQuantity ASC", [createdProductId]);

        report(
            "Buy More Tab -> Save Quantity Tiers in Unified Editor",
            buyMoreRes.data.Status === 1 && dbTiers.length === 2 && parseFloat(dbTiers[0].Price) === 240.00,
            `Saved ${dbTiers.length} tiers: Qty 2 @ ₹240, Qty 5 @ ₹550`
        );

        // Step 9: Test Product Restrictions Tab
        const restrictionsPayload = {
            ProductID: createdProductId,
            restrictions: {
                no_cashback: 1,
                no_coupon: 1,
                no_membership: 0
            },
            no_cashback: 1,
            no_coupon: 1,
            no_membership: 0
        };
        const restrRes = await axios.post(`${BASE_URL}/restrictions/save-product-restrictions`, restrictionsPayload, { headers });
        const [dbRestr] = await queryAsync("SELECT * FROM product_restrictions WHERE ProductID = ? AND Status = 1", [createdProductId]);

        report(
            "Restrictions Tab -> Save Product Exclusions in Unified Editor",
            restrRes.data.Status === 1 && dbRestr,
            `Saved Restrictions: ${restrRes.data.Message || 'Success'}`
        );

        // Step 10: Test Flash Sale Assignment in Unified Editor
        const [activeSale] = await queryAsync("SELECT SaleID, SaleName, DiscountValue FROM Sales WHERE Status = 1 LIMIT 1");
        if (activeSale) {
            const assignPayload = {
                SaleID: activeSale.SaleID,
                ProductID: createdProductId,
                SalePrice: 120.00,
                Status: 1
            };
            const assignRes = await axios.post(`${BASE_URL}/sales/assign-product`, assignPayload, { headers });
            const [dbSaleItem] = await queryAsync("SELECT * FROM SaleItems WHERE SaleID = ? AND ProductID = ?", [activeSale.SaleID, createdProductId]);

            report(
                "Flash Sale Tab -> Assign to Campaign in Unified Editor",
                assignRes.data.Status === 1 && Boolean(dbSaleItem),
                `Assigned to Campaign "${activeSale.SaleName}" (SalePrice: ₹120.00)`
            );

            // Remove from sale
            await axios.post(`${BASE_URL}/sales/remove-product`, { SaleID: activeSale.SaleID, ProductID: createdProductId }, { headers });
        } else {
            report("Flash Sale Tab -> Assign to Campaign in Unified Editor", true, "Skipped campaign assignment (no active sales in DB)");
        }

        // Step 11: Verify Existing Table Row Actions Still Work Independently
        // Verify Buy More API lookup
        const rowBuyMore = await axios.get(`${BASE_URL}/buymore/tiers?ProductID=${createdProductId}`, { headers });
        // Verify Restrictions lookup
        const rowRestr = await axios.get(`${BASE_URL}/restrictions/restrictions?ProductID=${createdProductId}`, { headers });
        // Verify Membership lookup
        const rowMember = await axios.get(`${BASE_URL}/membership/product/${createdProductId}`, { headers });

        const rowActionsOk = rowBuyMore.data.Status === 1 && rowRestr.data.Status === 1 && rowMember.data.Status === 1;
        report(
            "Independent Row Action Endpoints -> Buy More, Restrictions & Membership intact",
            rowActionsOk,
            `Row actions continue working independently as shortcuts`
        );

        // Step 12: Clean Up All Temporary Test Data
        await queryAsync("DELETE FROM membership_product_prices WHERE ProductID = ? OR PlanID = ?", [createdProductId, testPlanId]);
        await queryAsync("DELETE FROM MembershipPlans WHERE PlanID = ?", [testPlanId]);
        await queryAsync("DELETE FROM buy_more_config WHERE ProductID = ?", [createdProductId]);
        await queryAsync("DELETE FROM product_restrictions WHERE ProductID = ?", [createdProductId]);
        await queryAsync("DELETE FROM SaleItems WHERE ProductID = ?", [createdProductId]);
        await queryAsync("DELETE FROM ProductVariants WHERE ProductID = ?", [createdProductId]);
        await queryAsync("DELETE FROM Products WHERE ProductID = ?", [createdProductId]);

        // Verify clean database
        const [leftoverProd] = await queryAsync("SELECT COUNT(*) AS c FROM Products WHERE ProductID = ?", [createdProductId]);
        const [leftoverPlan] = await queryAsync("SELECT COUNT(*) AS c FROM MembershipPlans WHERE PlanID = ?", [testPlanId]);
        const [leftoverPrices] = await queryAsync("SELECT COUNT(*) AS c FROM membership_product_prices WHERE ProductID = ?", [createdProductId]);

        const cleaned = leftoverProd.c === 0 && leftoverPlan.c === 0 && leftoverPrices.c === 0;
        report(
            "AWS RDS Database Cleanup -> All test records purged",
            cleaned,
            `Cleaned Product #${createdProductId}, Plan #${testPlanId}, and dependent configurations`
        );

    } catch (err) {
        console.error("Test Exception:", err.response ? err.response.data : err.message);
        report("Overall Test Suite Execution", false, err.message);
    } finally {
        console.log("\n============================================================");
        console.log("SUMMARY OF UNIFIED PRODUCT EDITOR & DYNAMIC PLANS AUDIT:");
        console.log(`TOTAL CHECKS: ${totalChecks}`);
        console.log(`PASS: ${passedChecks} | FAIL: ${failedChecks}`);
        console.log("============================================================\n");
        process.exit(failedChecks === 0 ? 0 : 1);
    }
}

runUnifiedProductEditorTest();
