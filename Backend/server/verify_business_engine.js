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

async function runBusinessLogicTests() {
    console.log("============================================================");
    console.log("STARTING FINAL BUSINESS LOGIC & CALCULATION ENGINE AUDIT");
    console.log("============================================================\n");

    const results = [];
    const record = (feature, testCase, status, details) => {
        results.push({ feature, testCase, status, details });
        console.log(`[${status}] ${feature} -> ${testCase}: ${details}`);
    };

    try {
        // Fetch test products/variants from DB
        const [testProd] = await queryAsync("SELECT ProductID, ProductName FROM Products WHERE Status = 1 LIMIT 1");
        const [testVar] = await queryAsync("SELECT VariantID, ProductID, Price, OfferPrice, Buy2Price FROM ProductVariants WHERE ProductID = ? LIMIT 1", [testProd.ProductID]);
        const testProductID = testProd.ProductID;
        const testVariantID = testVar.VariantID;
        const baseOfferPrice = 95.00;
        const testBuy2Price = 160.00;

        // ------------------------------------------------------------
        // 1. BUY 2 PRICING
        // ------------------------------------------------------------
        console.log("--- 1. Testing Buy 2 Pricing Calculation ---");
        const sampleItem = {
            ProductID: testProductID,
            VariantID: testVariantID,
            ProductName: testProd.ProductName,
            Price: 100.00,
            OfferPrice: baseOfferPrice,
            Buy2Price: testBuy2Price
        };

        // Qty 1: standard price
        const calc1 = PricingEngine.calculateLinePrice({ ...sampleItem, Quantity: 1 });
        if (calc1.LineTotal === baseOfferPrice && calc1.UnitPrice === baseOfferPrice) {
            record("Buy 2 Pricing", "Quantity = 1", "PASS", `LineTotal = ₹${calc1.LineTotal} @ ₹${calc1.UnitPrice}/unit`);
        } else {
            record("Buy 2 Pricing", "Quantity = 1", "FAIL", `Expected ₹${baseOfferPrice}, got ₹${calc1.LineTotal}`);
        }

        // Qty 2: Buy 2 special price
        const calc2 = PricingEngine.calculateLinePrice({ ...sampleItem, Quantity: 2 });
        if (calc2.LineTotal === testBuy2Price && calc2.UnitPrice === testBuy2Price / 2) {
            record("Buy 2 Pricing", "Quantity = 2 (Buy2 Price)", "PASS", `LineTotal = ₹${calc2.LineTotal} (Rule: ${calc2.AppliedRule})`);
        } else {
            record("Buy 2 Pricing", "Quantity = 2 (Buy2 Price)", "FAIL", `Expected ₹${testBuy2Price}, got ₹${calc2.LineTotal}`);
        }

        // Qty 3: 1 pair @ Buy2 + 1 @ OfferPrice = 160 + 95 = 255
        const calc3 = PricingEngine.calculateLinePrice({ ...sampleItem, Quantity: 3 });
        if (calc3.LineTotal === (testBuy2Price + baseOfferPrice)) {
            record("Buy 2 Pricing", "Quantity = 3 (Pairs + Remainder)", "PASS", `LineTotal = ₹${calc3.LineTotal} (Rule: ${calc3.AppliedRule})`);
        } else {
            record("Buy 2 Pricing", "Quantity = 3 (Pairs + Remainder)", "FAIL", `Expected ₹${testBuy2Price + baseOfferPrice}, got ₹${calc3.LineTotal}`);
        }

        // Qty 4: 2 pairs @ Buy2 = 160 * 2 = 320
        const calc4 = PricingEngine.calculateLinePrice({ ...sampleItem, Quantity: 4 });
        if (calc4.LineTotal === (testBuy2Price * 2)) {
            record("Buy 2 Pricing", "Quantity = 4 (2 Pairs)", "PASS", `LineTotal = ₹${calc4.LineTotal} (Rule: ${calc4.AppliedRule})`);
        } else {
            record("Buy 2 Pricing", "Quantity = 4 (2 Pairs)", "FAIL", `Expected ₹${testBuy2Price * 2}, got ₹${calc4.LineTotal}`);
        }

        // Buy2Price = NULL (Fallback to offer price)
        const calcNull = PricingEngine.calculateLinePrice({ ...sampleItem, Buy2Price: null, Quantity: 2 });
        if (calcNull.LineTotal === baseOfferPrice * 2) {
            record("Buy 2 Pricing", "Buy2Price = NULL Fallback", "PASS", `LineTotal = ₹${calcNull.LineTotal} @ standard offer price`);
        } else {
            record("Buy 2 Pricing", "Buy2Price = NULL Fallback", "FAIL", `Expected ₹${baseOfferPrice * 2}, got ₹${calcNull.LineTotal}`);
        }

        // ------------------------------------------------------------
        // 2. BUY MORE MULTI-TIER PRICING
        // ------------------------------------------------------------
        console.log("\n--- 2. Testing Buy More Multi-Tier Pricing Engine ---");
        // Insert test tiers into buy_more_config in AWS RDS
        await queryAsync("DELETE FROM buy_more_config WHERE ProductID = ?", [testProductID]);
        await queryAsync("INSERT INTO buy_more_config (ProductID, VariantID, MinQuantity, MaxQuantity, Price, Status) VALUES (?, ?, 1, 1, 100.00, 1)", [testProductID, testVariantID]);
        await queryAsync("INSERT INTO buy_more_config (ProductID, VariantID, MinQuantity, MaxQuantity, Price, Status) VALUES (?, ?, 2, 4, 90.00, 1)", [testProductID, testVariantID]);
        await queryAsync("INSERT INTO buy_more_config (ProductID, VariantID, MinQuantity, MaxQuantity, Price, Status) VALUES (?, ?, 5, 9, 80.00, 1)", [testProductID, testVariantID]);
        await queryAsync("INSERT INTO buy_more_config (ProductID, VariantID, MinQuantity, MaxQuantity, Price, Status) VALUES (?, ?, 10, NULL, 70.00, 1)", [testProductID, testVariantID]);

        const tiers = await PricingEngine.getBuyMoreTiers(testProductID, testVariantID);

        const bmTests = [
            { qty: 1, expUnit: 100, expTotal: 100 },
            { qty: 2, expUnit: 90, expTotal: 180 },
            { qty: 4, expUnit: 90, expTotal: 360 },
            { qty: 5, expUnit: 80, expTotal: 400 },
            { qty: 9, expUnit: 80, expTotal: 720 },
            { qty: 10, expUnit: 70, expTotal: 700 },
            { qty: 20, expUnit: 70, expTotal: 1400 }
        ];

        for (const t of bmTests) {
            const res = PricingEngine.calculateLinePrice(sampleItem, tiers, null, []);
            const qtyRes = PricingEngine.calculateLinePrice({ ...sampleItem, Quantity: t.qty }, tiers, null, []);
            if (qtyRes.UnitPrice === t.expUnit && qtyRes.LineTotal === t.expTotal) {
                record("Buy More Multi-Tier", `Quantity = ${t.qty}`, "PASS", `Unit: ₹${qtyRes.UnitPrice}, Total: ₹${qtyRes.LineTotal} (Rule: ${qtyRes.AppliedRule})`);
            } else {
                record("Buy More Multi-Tier", `Quantity = ${t.qty}`, "FAIL", `Expected Unit: ₹${t.expUnit}, Total: ₹${t.expTotal} | Got Unit: ₹${qtyRes.UnitPrice}, Total: ₹${qtyRes.LineTotal}`);
            }
        }

        // Clean up test tiers
        await queryAsync("DELETE FROM buy_more_config WHERE ProductID = ?", [testProductID]);

        // ------------------------------------------------------------
        // 3. CASHBACK EXCLUSIONS & DYNAMIC CASHBACK CALCULATION
        // ------------------------------------------------------------
        console.log("\n--- 3. Testing Cashback Exclusions Engine ---");
        // Setup: Product A = ₹300 (Eligible), Product B = ₹200 (Excluded)
        const prodA = { ProductID: 101, VariantID: 101, ProductName: "Eligible Product A", OfferPrice: 300.00, Quantity: 1 };
        const prodB = { ProductID: 102, VariantID: 102, ProductName: "Restricted Product B", OfferPrice: 200.00, Quantity: 1 };

        // Insert restriction for Product B in AWS RDS
        await queryAsync("DELETE FROM product_restrictions WHERE ProductID IN (101, 102)");
        await queryAsync("INSERT INTO product_restrictions (ProductID, RestrictionType, Status) VALUES (102, 'no_cashback', 1)");

        // Enable 10% cashback in settings
        await queryAsync("UPDATE AdminShopToggleSettings SET CashbackEnabled = 1, CashbackPercentage = 10, CashbackMaxAmount = 100 WHERE SettingID = 1");

        // Case 1: Eligible product only (₹300)
        const cbCart1 = await PricingEngine.calculateCart([prodA]);
        if (cbCart1.CashbackEligibleSubTotal === 300 && cbCart1.CashbackEarned === 30.00) {
            record("Cashback Engine", "Case 1: Eligible Product Only", "PASS", `SubTotal: ₹${cbCart1.SubTotal}, Eligible: ₹${cbCart1.CashbackEligibleSubTotal}, Cashback: ₹${cbCart1.CashbackEarned}`);
        } else {
            record("Cashback Engine", "Case 1: Eligible Product Only", "FAIL", `Expected Cashback ₹30.00, got ₹${cbCart1.CashbackEarned}`);
        }

        // Case 2: Excluded product only (₹200)
        const cbCart2 = await PricingEngine.calculateCart([prodB]);
        if (cbCart2.CashbackEligibleSubTotal === 0 && cbCart2.CashbackEarned === 0) {
            record("Cashback Engine", "Case 2: Excluded Product Only", "PASS", `SubTotal: ₹${cbCart2.SubTotal}, Eligible: ₹${cbCart2.CashbackEligibleSubTotal}, Cashback: ₹${cbCart2.CashbackEarned}`);
        } else {
            record("Cashback Engine", "Case 2: Excluded Product Only", "FAIL", `Expected Cashback ₹0, got ₹${cbCart2.CashbackEarned}`);
        }

        // Case 3: Mixed cart (₹300 + ₹200 = ₹500)
        const cbCart3 = await PricingEngine.calculateCart([prodA, prodB]);
        if (cbCart3.SubTotal === 500 && cbCart3.CashbackEligibleSubTotal === 300 && cbCart3.CashbackEarned === 30.00) {
            record("Cashback Engine", "Case 3: Mixed Eligible + Excluded", "PASS", `SubTotal: ₹${cbCart3.SubTotal}, Eligible: ₹${cbCart3.CashbackEligibleSubTotal}, Cashback: ₹${cbCart3.CashbackEarned} (10% of ₹300 only)`);
        } else {
            record("Cashback Engine", "Case 3: Mixed Eligible + Excluded", "FAIL", `Expected Cashback ₹30.00 on ₹300, got ₹${cbCart3.CashbackEarned}`);
        }

        // ------------------------------------------------------------
        // 4. COUPON EXCLUSIONS
        // ------------------------------------------------------------
        console.log("\n--- 4. Testing Coupon Exclusions Engine ---");
        // Insert restriction for Product B (no_coupon) in AWS RDS
        await queryAsync("INSERT INTO product_restrictions (ProductID, RestrictionType, Status) VALUES (102, 'no_coupon', 1)");

        // Insert test promo code: TESTPROMO10 (10% off, MinOrderValue = 250, MaxDiscount = 100)
        await queryAsync("DELETE FROM PromoCodes WHERE PromoCode = 'TESTPROMO10'");
        await queryAsync("INSERT INTO PromoCodes (PromoCode, Type, OfferValue, MinOrderValue, MaxDiscount, Status, StartDate, EndDate) VALUES ('TESTPROMO10', 1, 10, 250, 100, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY))");

        // Mixed Cart with PromoCode: Product A (₹300) + Product B (₹200) = ₹500
        const promoCart = await PricingEngine.calculateCart([prodA, prodB], 'TESTPROMO10');
        if (promoCart.CouponEligibleSubTotal === 300 && promoCart.CouponDiscount === 30.00) {
            record("Coupon Engine", "Mixed Cart Coupon Exclusion", "PASS", `SubTotal: ₹${promoCart.SubTotal}, Eligible: ₹${promoCart.CouponEligibleSubTotal}, Discount: ₹${promoCart.CouponDiscount} (10% of ₹300, not ₹500)`);
        } else {
            record("Coupon Engine", "Mixed Cart Coupon Exclusion", "FAIL", `Expected Discount ₹30.00, got ₹${promoCart.CouponDiscount}`);
        }

        // Excluded Item Only with PromoCode (₹200 < MinOrder ₹250)
        const promoCartEx = await PricingEngine.calculateCart([prodB], 'TESTPROMO10');
        if (promoCartEx.CouponDiscount === 0) {
            record("Coupon Engine", "Excluded Product Only Rejection", "PASS", `Discount: ₹${promoCartEx.CouponDiscount} (Reason: ${promoCartEx.CouponMessage})`);
        } else {
            record("Coupon Engine", "Excluded Product Only Rejection", "FAIL", `Expected Discount ₹0, got ₹${promoCartEx.CouponDiscount}`);
        }

        // Clean up PromoCode & Restrictions
        await queryAsync("DELETE FROM PromoCodes WHERE PromoCode = 'TESTPROMO10'");
        await queryAsync("DELETE FROM product_restrictions WHERE ProductID IN (101, 102)");

        // ------------------------------------------------------------
        // 5. CART THRESHOLD OFFERS
        // ------------------------------------------------------------
        console.log("\n--- 5. Testing Cart Threshold Offers Engine ---");
        // Insert test offer: Spend ₹500 get ₹50 off (fixed_discount)
        await queryAsync("DELETE FROM cart_offers WHERE OfferName = 'TEST_THRESHOLD_500'");
        await queryAsync("INSERT INTO cart_offers (OfferName, ThresholdAmount, OfferType, OfferValue, Status) VALUES ('TEST_THRESHOLD_500', 500.00, 'fixed_discount', 50.00, 1)");

        // Test Cart ₹499
        const item499 = [{ ProductID: 1, VariantID: 1, ProductName: "Item", OfferPrice: 499.00, Quantity: 1 }];
        const offerCart499 = await PricingEngine.calculateCart(item499);
        if (offerCart499.CartOfferDiscount === 0 && !offerCart499.AppliedCartOffer) {
            record("Cart Threshold Offers", "Below Threshold (₹499)", "PASS", `No offer applied, Discount = ₹${offerCart499.CartOfferDiscount}`);
        } else {
            record("Cart Threshold Offers", "Below Threshold (₹499)", "FAIL", `Expected ₹0, got ₹${offerCart499.CartOfferDiscount}`);
        }

        // Test Cart ₹500
        const item500 = [{ ProductID: 1, VariantID: 1, ProductName: "Item", OfferPrice: 500.00, Quantity: 1 }];
        const offerCart500 = await PricingEngine.calculateCart(item500);
        if (offerCart500.CartOfferDiscount === 50.00 && offerCart500.AppliedCartOffer) {
            record("Cart Threshold Offers", "Exact Threshold (₹500)", "PASS", `Offer '${offerCart500.AppliedCartOffer.OfferName}' applied, Discount = ₹${offerCart500.CartOfferDiscount}`);
        } else {
            record("Cart Threshold Offers", "Exact Threshold (₹500)", "FAIL", `Expected ₹50.00, got ₹${offerCart500.CartOfferDiscount}`);
        }

        // Test Cart ₹501
        const item501 = [{ ProductID: 1, VariantID: 1, ProductName: "Item", OfferPrice: 501.00, Quantity: 1 }];
        const offerCart501 = await PricingEngine.calculateCart(item501);
        if (offerCart501.CartOfferDiscount === 50.00) {
            record("Cart Threshold Offers", "Above Threshold (₹501)", "PASS", `Discount = ₹${offerCart501.CartOfferDiscount}`);
        } else {
            record("Cart Threshold Offers", "Above Threshold (₹501)", "FAIL", `Expected ₹50.00, got ₹${offerCart501.CartOfferDiscount}`);
        }

        // Clean up offer
        await queryAsync("DELETE FROM cart_offers WHERE OfferName = 'TEST_THRESHOLD_500'");

        // ------------------------------------------------------------
        // 6. MEMBERSHIP EXCLUSION & PRICING
        // ------------------------------------------------------------
        console.log("\n--- 6. Testing Membership Exclusion Engine ---");
        // Create a test user membership with Free Delivery
        const [testUser] = await queryAsync("SELECT UserID FROM Users LIMIT 1");
        const [plan] = await queryAsync("SELECT PlanID FROM MembershipPlans WHERE FreeDelivery = 1 LIMIT 1");
        
        if (plan) {
            await queryAsync("DELETE FROM UserMemberships WHERE UserID = ?", [testUser.UserID]);
            await queryAsync("INSERT INTO UserMemberships (UserID, PlanID, Price, StartDate, EndDate) VALUES (?, ?, 199.00, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY))", [testUser.UserID, plan.PlanID]);

            // Test normal cart: Free delivery should be granted to member
            const memberCart = await PricingEngine.calculateCart([{ ProductID: 1, VariantID: 1, OfferPrice: 100.00, Quantity: 1 }], null, testUser.UserID);
            if (memberCart.FreeDeliveryApplied === true && memberCart.DeliveryCharges === 0) {
                record("Membership Engine", "Active Member Free Delivery", "PASS", `Delivery charges waived to ₹0 for member (Plan: ${memberCart.UserMembership.PlanName})`);
            } else {
                record("Membership Engine", "Active Member Free Delivery", "FAIL", `Expected Free Delivery, got ₹${memberCart.DeliveryCharges}`);
            }

            // Clean up test membership
            await queryAsync("DELETE FROM UserMemberships WHERE UserID = ?", [testUser.UserID]);
        }

        console.log("\n============================================================");
        console.log("SUMMARY OF BUSINESS LOGIC VERIFICATION:");
        console.log(`TOTAL CHECKS: ${results.length}`);
        const passCount = results.filter(r => r.status === "PASS").length;
        const failCount = results.filter(r => r.status === "FAIL").length;
        console.log(`PASS: ${passCount} | FAIL: ${failCount} | BLOCKED: 0`);
        console.log("============================================================");

    } catch (e) {
        console.error("Verification Exception:", e);
    } finally {
        process.exit(0);
    }
}

runBusinessLogicTests();
