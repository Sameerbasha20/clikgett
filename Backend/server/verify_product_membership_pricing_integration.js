const PricingEngine = require('./services/PricingEngine');
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

const API_BASE = 'http://localhost:5000/api';
const SECRET_KEY = process.env.SECRET_KEY || 'defaultsecret';
const adminToken = jwt.sign({ AdminID: 1 }, SECRET_KEY);
const authHeaders = { headers: { Authorization: `token ${adminToken}` } };

async function runMembershipPricingTests() {
    console.log("============================================================");
    console.log("STARTING DEDICATED PRODUCT MEMBERSHIP PRICING INTEGRATION TESTS");
    console.log("Target: Live AWS RDS MySQL | API: http://localhost:5000/api");
    console.log("============================================================\n");

    const results = [];
    const record = (stepNum, stepName, status, details) => {
        results.push({ stepNum, stepName, status, details });
        console.log(`[Step ${stepNum.toString().padStart(2, '0')}] [${status}] ${stepName}: ${details}`);
    };

    let testProductID = null;
    let testProductName = null;
    let testBaseOfferPrice = null;
    let testPlanID = null;
    let testPlanName = null;
    let testUserID = null;
    const testMemberPrice = 32.50; // Special test member price below base

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

        const [variant] = await queryAsync("SELECT VariantID, Price, OfferPrice FROM ProductVariants WHERE ProductID = ? LIMIT 1", [testProductID]);
        testBaseOfferPrice = variant && variant.OfferPrice ? parseFloat(variant.OfferPrice) : 44.00;

        record(1, "Find Valid Live Product", "PASS", `ProductID: ${testProductID} ("${testProductName}"), Base OfferPrice: ₹${testBaseOfferPrice}`);

        // ------------------------------------------------------------
        // Step 2: Identify valid membership plan
        // ------------------------------------------------------------
        const [plan] = await queryAsync("SELECT PlanID, PlanName, Price, Status FROM MembershipPlans WHERE Status = 1 LIMIT 1");
        if (!plan) {
            throw new Error("No active membership plan found in MembershipPlans");
        }
        testPlanID = plan.PlanID;
        testPlanName = plan.PlanName;

        record(2, "Identify Valid Membership Plan", "PASS", `PlanID: ${testPlanID} ("${testPlanName}"), Fee: ₹${plan.Price}`);

        // Clean up any existing test pricing or membership for this test
        await queryAsync("DELETE FROM membership_product_prices WHERE ProductID = ? AND PlanID = ?", [testProductID, testPlanID]);

        // ------------------------------------------------------------
        // Step 3: Configure product membership pricing via API
        // ------------------------------------------------------------
        const saveRes = await axios.post(`${API_BASE}/membership/product/save`, {
            ProductID: testProductID,
            items: [
                {
                    PlanID: testPlanID,
                    MembershipPrice: testMemberPrice,
                    Status: 1
                }
            ]
        }, authHeaders);

        if (saveRes.status === 200 && saveRes.data.Status === 1) {
            record(3, "Configure Product Membership Pricing", "PASS", `API saved MemberPrice ₹${testMemberPrice} for ProductID ${testProductID} and PlanID ${testPlanID}`);
        } else {
            record(3, "Configure Product Membership Pricing", "FAIL", `API error: ${JSON.stringify(saveRes.data)}`);
        }

        // ------------------------------------------------------------
        // Step 4: Verify database persistence in AWS RDS
        // ------------------------------------------------------------
        const mppRows = await queryAsync("SELECT * FROM membership_product_prices WHERE ProductID = ? AND PlanID = ?", [testProductID, testPlanID]);
        if (mppRows.length > 0 && parseFloat(mppRows[0].MembershipPrice) === testMemberPrice && mppRows[0].Status === 1) {
            record(4, "Verify Database Persistence", "PASS", `Persisted in AWS RDS: PriceID ${mppRows[0].PriceID}, MemberPrice ₹${mppRows[0].MembershipPrice}, Status: ${mppRows[0].Status}`);
        } else {
            record(4, "Verify Database Persistence", "FAIL", `Database record mismatch or not found: ${JSON.stringify(mppRows)}`);
        }

        // ------------------------------------------------------------
        // Step 5: Verify configuration lookup via API
        // ------------------------------------------------------------
        const lookupRes = await axios.get(`${API_BASE}/membership/product/${testProductID}`, authHeaders);
        const plansList = lookupRes.data.Plans || [];
        const configuredPlan = plansList.find(p => p.PlanID === testPlanID);

        if (configuredPlan && parseFloat(configuredPlan.MembershipPrice) === testMemberPrice) {
            record(5, "Verify Configuration Lookup API", "PASS", `API returned plan "${configuredPlan.PlanName}" with MemberPrice ₹${configuredPlan.MembershipPrice}`);
        } else {
            record(5, "Verify Configuration Lookup API", "FAIL", `Lookup failed or MemberPrice mismatch: ${JSON.stringify(configuredPlan)}`);
        }

        // ------------------------------------------------------------
        // Step 6: Verify active member receives membership pricing
        // ------------------------------------------------------------
        const [user] = await queryAsync("SELECT UserID FROM Users LIMIT 1");
        testUserID = user ? user.UserID : 1;

        // Create temporary active membership for test user
        await queryAsync("DELETE FROM UserMemberships WHERE UserID = ?", [testUserID]);
        await queryAsync(
            "INSERT INTO UserMemberships (UserID, PlanID, Price, StartDate, EndDate) VALUES (?, ?, 199.00, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY))",
            [testUserID, testPlanID]
        );

        const memberCart = await PricingEngine.calculateCart([
            { ProductID: testProductID, VariantID: 1, ProductName: testProductName, OfferPrice: testBaseOfferPrice, Quantity: 1 }
        ], null, testUserID);

        const memberItem = memberCart.Items[0];
        if (memberItem && memberItem.UnitPrice === testMemberPrice && memberItem.ActiveMembershipPricing) {
            record(6, "Active Member Receives Member Pricing", "PASS", `Calculated UnitPrice: ₹${memberItem.UnitPrice} (AppliedRule: "${memberItem.AppliedRule}")`);
        } else {
            record(6, "Active Member Receives Member Pricing", "FAIL", `Expected ₹${testMemberPrice}, got ₹${memberItem ? memberItem.UnitPrice : 'undefined'}`);
        }

        // ------------------------------------------------------------
        // Step 7: Verify non-member does not receive membership pricing
        // ------------------------------------------------------------
        const nonMemberCart = await PricingEngine.calculateCart([
            { ProductID: testProductID, VariantID: 1, ProductName: testProductName, OfferPrice: testBaseOfferPrice, Quantity: 1 }
        ], null, null); // userId = null (non-member)

        const nonMemberItem = nonMemberCart.Items[0];
        if (nonMemberItem && nonMemberItem.UnitPrice === testBaseOfferPrice && !nonMemberItem.ActiveMembershipPricing) {
            record(7, "Non-Member Normal Pricing", "PASS", `Non-member pays standard OfferPrice: ₹${nonMemberItem.UnitPrice} (Rule: "${nonMemberItem.AppliedRule}")`);
        } else {
            record(7, "Non-Member Normal Pricing", "FAIL", `Non-member got member pricing! UnitPrice: ₹${nonMemberItem.UnitPrice}`);
        }

        // ------------------------------------------------------------
        // Step 8: Verify disabled configuration does not apply
        // ------------------------------------------------------------
        await queryAsync("UPDATE membership_product_prices SET Status = 0 WHERE ProductID = ? AND PlanID = ?", [testProductID, testPlanID]);
        
        const disabledCart = await PricingEngine.calculateCart([
            { ProductID: testProductID, VariantID: 1, ProductName: testProductName, OfferPrice: testBaseOfferPrice, Quantity: 1 }
        ], null, testUserID);

        const disabledItem = disabledCart.Items[0];
        if (disabledItem && disabledItem.UnitPrice === testBaseOfferPrice && !disabledItem.ActiveMembershipPricing) {
            record(8, "Disabled Configuration Ignored", "PASS", `Status = 0 ignored. Member pays standard OfferPrice: ₹${disabledItem.UnitPrice}`);
        } else {
            record(8, "Disabled Configuration Ignored", "FAIL", `Disabled config was applied! UnitPrice: ₹${disabledItem.UnitPrice}`);
        }

        // Re-enable configuration for subsequent tests
        await queryAsync("UPDATE membership_product_prices SET Status = 1 WHERE ProductID = ? AND PlanID = ?", [testProductID, testPlanID]);

        // ------------------------------------------------------------
        // Step 9: Verify no_membership restriction blocks the benefit
        // ------------------------------------------------------------
        await queryAsync("DELETE FROM product_restrictions WHERE ProductID = ?", [testProductID]);
        await queryAsync("INSERT INTO product_restrictions (ProductID, RestrictionType, Status) VALUES (?, 'no_membership', 1)", [testProductID]);

        const restrictedCart = await PricingEngine.calculateCart([
            { ProductID: testProductID, VariantID: 1, ProductName: testProductName, OfferPrice: testBaseOfferPrice, Quantity: 1 }
        ], null, testUserID);

        const restrictedItem = restrictedCart.Items[0];
        if (restrictedItem && restrictedItem.UnitPrice === testBaseOfferPrice && restrictedItem.IsMembershipExcluded === true) {
            record(9, "no_membership Restriction Enforced", "PASS", `Restriction active: Member pricing blocked, UnitPrice stays ₹${restrictedItem.UnitPrice}`);
        } else {
            record(9, "no_membership Restriction Enforced", "FAIL", `Restriction failed to block member pricing! UnitPrice: ₹${restrictedItem.UnitPrice}`);
        }

        // Remove restriction
        await queryAsync("DELETE FROM product_restrictions WHERE ProductID = ?", [testProductID]);

        // ------------------------------------------------------------
        // Step 10: Verify updated price is dynamically consumed
        // ------------------------------------------------------------
        const updatedMemberPrice = 28.00;
        await axios.post(`${API_BASE}/membership/product/save`, {
            ProductID: testProductID,
            items: [
                {
                    PlanID: testPlanID,
                    MembershipPrice: updatedMemberPrice,
                    Status: 1
                }
            ]
        }, authHeaders);

        const updatedCart = await PricingEngine.calculateCart([
            { ProductID: testProductID, VariantID: 1, ProductName: testProductName, OfferPrice: testBaseOfferPrice, Quantity: 1 }
        ], null, testUserID);

        const updatedItem = updatedCart.Items[0];
        if (updatedItem && updatedItem.UnitPrice === updatedMemberPrice) {
            record(10, "Updated Price Dynamically Consumed", "PASS", `Updated ₹${testMemberPrice} -> ₹${updatedMemberPrice}. PricingEngine dynamically reflected ₹${updatedItem.UnitPrice}`);
        } else {
            record(10, "Updated Price Dynamically Consumed", "FAIL", `Expected updated price ₹${updatedMemberPrice}, got ₹${updatedItem.UnitPrice}`);
        }

        // ------------------------------------------------------------
        // Step 11: Verify deletion/removal via API
        // ------------------------------------------------------------
        const deleteRes = await axios.post(`${API_BASE}/membership/product/delete`, {
            ProductID: testProductID,
            PlanID: testPlanID
        }, authHeaders);

        const remainingRows = await queryAsync("SELECT * FROM membership_product_prices WHERE ProductID = ? AND PlanID = ?", [testProductID, testPlanID]);
        if (deleteRes.status === 200 && remainingRows.length === 0) {
            record(11, "Verify Deletion / Removal API", "PASS", `API deleted membership pricing. Remaining rows in AWS RDS: 0`);
        } else {
            record(11, "Verify Deletion / Removal API", "FAIL", `Deletion failed. Remaining rows: ${remainingRows.length}`);
        }

        // ------------------------------------------------------------
        // Step 12: Verify normal pricing is restored
        // ------------------------------------------------------------
        const restoredCart = await PricingEngine.calculateCart([
            { ProductID: testProductID, VariantID: 1, ProductName: testProductName, OfferPrice: testBaseOfferPrice, Quantity: 1 }
        ], null, testUserID);

        const restoredItem = restoredCart.Items[0];
        if (restoredItem && restoredItem.UnitPrice === testBaseOfferPrice && !restoredItem.ActiveMembershipPricing) {
            record(12, "Normal Pricing Restored", "PASS", `Pricing returned to standard OfferPrice: ₹${restoredItem.UnitPrice}`);
        } else {
            record(12, "Normal Pricing Restored", "FAIL", `Expected standard price ₹${testBaseOfferPrice}, got ₹${restoredItem.UnitPrice}`);
        }

        // ------------------------------------------------------------
        // Step 13: Clean up all temporary test records
        // ------------------------------------------------------------
        await queryAsync("DELETE FROM membership_product_prices WHERE ProductID = ?", [testProductID]);
        await queryAsync("DELETE FROM product_restrictions WHERE ProductID = ?", [testProductID]);
        if (testUserID) {
            await queryAsync("DELETE FROM UserMemberships WHERE UserID = ?", [testUserID]);
        }

        const checkMPP = await queryAsync("SELECT * FROM membership_product_prices WHERE ProductID = ?", [testProductID]);
        const checkUM = testUserID ? await queryAsync("SELECT * FROM UserMemberships WHERE UserID = ?", [testUserID]) : [];

        if (checkMPP.length === 0 && checkUM.length === 0) {
            record(13, "Clean Up All Temporary Test Records", "PASS", `All test records successfully purged from AWS RDS`);
        } else {
            record(13, "Clean Up All Temporary Test Records", "FAIL", `Leftover records: MPP=${checkMPP.length}, UM=${checkUM.length}`);
        }

    } catch (err) {
        console.error("Test execution failed with error:", err);
        record(99, "Execution Error", "FAIL", err.message);
    } finally {
        try {
            if (testProductID) {
                await queryAsync("DELETE FROM membership_product_prices WHERE ProductID = ?", [testProductID]);
                await queryAsync("DELETE FROM product_restrictions WHERE ProductID = ?", [testProductID]);
            }
            if (testUserID) {
                await queryAsync("DELETE FROM UserMemberships WHERE UserID = ?", [testUserID]);
            }
        } catch (e) {}

        console.log("\n============================================================");
        console.log("SUMMARY OF MEMBERSHIP PRICING INTEGRATION TESTS:");
        console.log(`TOTAL CHECKS: ${results.length}`);
        const passCount = results.filter(r => r.status === "PASS").length;
        const failCount = results.filter(r => r.status === "FAIL").length;
        console.log(`PASS: ${passCount} | FAIL: ${failCount} | BLOCKED: 0`);
        console.log("============================================================");

        pool.end();
        process.exit(failCount === 0 ? 0 : 1);
    }
}

runMembershipPricingTests();
