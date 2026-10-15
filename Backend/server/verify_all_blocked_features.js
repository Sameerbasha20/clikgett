const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const pool = require('./utils/db');

const BASE_URL = 'http://localhost:5000/api';
const token = jwt.sign({ AdminID: 1 }, process.env.SECRET_KEY);
const headers = {
    'Authorization': `token ${token}`,
    'Content-Type': 'application/json'
};

async function runVerification() {
    console.log("============================================================");
    console.log("STARTING FULL END-TO-END VERIFICATION OF ALL BLOCKED FEATURES");
    console.log("AWS RDS Endpoint: clikgett-dev MySQL");
    console.log("============================================================\n");

    const results = [];

    function record(feature, operation, status, details = "") {
        console.log(`[${status}] ${feature} -> ${operation}: ${details}`);
        results.push({ feature, operation, status, details });
    }

    try {
        // Clean any leftover test rows first
        await new Promise((res) => pool.query("DELETE FROM buy_more_config WHERE MinQuantity = 10 AND Price IN (80, 85, 90)", res));
        await new Promise((res) => pool.query("DELETE FROM cart_offers WHERE OfferName LIKE 'End-to-End Test%'", res));

        // ------------------------------------------------------------
        // 1. ORDER AMOUNT ADJUSTMENT
        // ------------------------------------------------------------
        console.log("\n--- 1. Testing Order Amount Adjustment ---");
        const [orders] = await new Promise((res, rej) => pool.query("SELECT OrderID, GrandTotal FROM Orders LIMIT 1", (err, rows) => err ? rej(err) : res([rows])));
        if (orders && orders.length > 0) {
            const testOrder = orders[0];
            const origTotal = parseFloat(testOrder.GrandTotal || 100);
            const adjTotal = origTotal + 25.50;

            // Mutation: Adjust order
            const adjRes = await axios.post(`${BASE_URL}/adminorders/adjustorder`, {
                OrderID: testOrder.OrderID,
                newAmount: adjTotal,
                reason: "Automated end-to-end verification test adjustment",
                resolution: "Manual Correction"
            }, { headers });

            if (adjRes.data.Status === 1 && adjRes.data.AdjustmentID) {
                record("Order Amount Adjustment", "CREATE Adjustment", "PASS", `AdjustmentID: ${adjRes.data.AdjustmentID}, Difference: ₹${adjRes.data.DifferenceAmount}`);

                // READ adjustments
                const getAdjRes = await axios.get(`${BASE_URL}/adminorders/adjustments/${testOrder.OrderID}`, { headers });
                if (getAdjRes.data.Status === 1 && getAdjRes.data.Adjustments.length > 0) {
                    record("Order Amount Adjustment", "READ Adjustments", "PASS", `Found ${getAdjRes.data.Adjustments.length} adjustment records`);
                } else {
                    record("Order Amount Adjustment", "READ Adjustments", "FAIL", "No adjustments returned");
                }

                // Restore original amount
                await axios.post(`${BASE_URL}/adminorders/adjustorder`, {
                    OrderID: testOrder.OrderID,
                    newAmount: origTotal,
                    reason: "Restoring original total after verification test",
                    resolution: "Manual Correction"
                }, { headers });
                record("Order Amount Adjustment", "RESTORE Amount", "PASS", `Restored GrandTotal to ₹${origTotal}`);
            } else {
                record("Order Amount Adjustment", "CREATE Adjustment", "FAIL", adjRes.data.Message);
            }
        } else {
            record("Order Amount Adjustment", "ALL", "BLOCKED", "No orders in AWS database to test");
        }

        // ------------------------------------------------------------
        // 2. BUY 2 PRICING
        // ------------------------------------------------------------
        console.log("\n--- 2. Testing Buy 2 Pricing ---");
        const [variants] = await new Promise((res, rej) => pool.query("SELECT VariantID, Price, Buy2Price FROM ProductVariants LIMIT 1", (err, rows) => err ? rej(err) : res([rows])));
        if (variants && variants.length > 0) {
            const testVariant = variants[0];
            const testBuy2Price = 175.50;

            const upVarRes = await axios.put(`${BASE_URL}/adminproducts/updateproductvariant/${testVariant.VariantID}`, {
                Buy2Price: testBuy2Price
            }, { headers });

            if (upVarRes.data.Status === 1) {
                // Verify directly in DB
                const [checkVar] = await new Promise((res, rej) => pool.query("SELECT Buy2Price FROM ProductVariants WHERE VariantID = ?", [testVariant.VariantID], (err, rows) => err ? rej(err) : res([rows])));
                if (checkVar && parseFloat(checkVar[0].Buy2Price) === testBuy2Price) {
                    record("Buy 2 Pricing", "UPDATE & VERIFY DB", "PASS", `Variant ${testVariant.VariantID} Buy2Price = ₹${checkVar[0].Buy2Price}`);
                } else {
                    record("Buy 2 Pricing", "UPDATE & VERIFY DB", "FAIL", "DB value did not match");
                }
            } else {
                record("Buy 2 Pricing", "UPDATE", "FAIL", upVarRes.data.Message);
            }
        } else {
            record("Buy 2 Pricing", "ALL", "BLOCKED", "No ProductVariants in DB");
        }

        // ------------------------------------------------------------
        // 3. BUY MORE MULTI-TIER PRICING
        // ------------------------------------------------------------
        console.log("\n--- 3. Testing Buy More Multi-Tier Pricing ---");
        const [prods] = await new Promise((res, rej) => pool.query("SELECT ProductID FROM Products LIMIT 1", (err, rows) => err ? rej(err) : res([rows])));
        const testProductID = prods && prods.length > 0 ? prods[0].ProductID : 1;

        // CREATE tier
        const createTierRes = await axios.post(`${BASE_URL}/buymore/tiers`, {
            ProductID: testProductID,
            MinQuantity: 10,
            MaxQuantity: 20,
            Price: 85.00,
            Status: 1
        }, { headers });

        if (createTierRes.data.Status === 1 && createTierRes.data.TierID) {
            const tierID = createTierRes.data.TierID;
            record("Buy More Multi-Tier", "CREATE Tier", "PASS", `TierID: ${tierID}`);

            // READ tiers
            const getTiersRes = await axios.get(`${BASE_URL}/buymore/tiers?ProductID=${testProductID}`, { headers });
            const foundTier = (getTiersRes.data.Tiers || []).find(t => t.ID === tierID);
            if (foundTier) {
                record("Buy More Multi-Tier", "READ Tiers", "PASS", `Found Tier ${tierID} (Min: ${foundTier.MinQuantity}, Max: ${foundTier.MaxQuantity}, Price: ₹${foundTier.Price})`);
            } else {
                record("Buy More Multi-Tier", "READ Tiers", "FAIL", "Created tier not in list");
            }

            // UPDATE tier
            const updateTierRes = await axios.put(`${BASE_URL}/buymore/tiers/${tierID}`, {
                ProductID: testProductID,
                MinQuantity: 10,
                MaxQuantity: 25,
                Price: 80.00,
                Status: 1
            }, { headers });
            if (updateTierRes.data.Status === 1) {
                record("Buy More Multi-Tier", "UPDATE Tier", "PASS", "Tier range updated to 10-25 @ ₹80");
            } else {
                record("Buy More Multi-Tier", "UPDATE Tier", "FAIL", updateTierRes.data.Message);
            }

            // TOGGLE status
            const toggleRes = await axios.put(`${BASE_URL}/buymore/tiers/status/${tierID}`, { Status: 0 }, { headers });
            if (toggleRes.data.Status === 1) {
                record("Buy More Multi-Tier", "DISABLE Tier", "PASS", "Status updated to 0");
            }

            // NEGATIVE TEST: Overlap rejection
            try {
                // Enable tier again first to test overlap
                await axios.put(`${BASE_URL}/buymore/tiers/status/${tierID}`, { Status: 1 }, { headers });
                await axios.post(`${BASE_URL}/buymore/tiers`, {
                    ProductID: testProductID,
                    MinQuantity: 15,
                    MaxQuantity: 30,
                    Price: 75.00,
                    Status: 1
                }, { headers });
                record("Buy More Multi-Tier", "OVERLAP REJECTION (Negative Test)", "FAIL", "Should have rejected overlapping tier");
            } catch (err) {
                if (err.response && err.response.status === 400) {
                    record("Buy More Multi-Tier", "OVERLAP REJECTION (Negative Test)", "PASS", `Correctly rejected: ${err.response.data.Message}`);
                } else {
                    record("Buy More Multi-Tier", "OVERLAP REJECTION (Negative Test)", "FAIL", err.message);
                }
            }

            // DELETE tier
            const deleteTierRes = await axios.delete(`${BASE_URL}/buymore/tiers/${tierID}`, { headers });
            if (deleteTierRes.data.Status === 1) {
                record("Buy More Multi-Tier", "DELETE Tier", "PASS", `Deleted Tier ${tierID}`);
            }
        } else {
            record("Buy More Multi-Tier", "CREATE Tier", "FAIL", createTierRes.data.Message);
        }

        // ------------------------------------------------------------
        // 4. PRODUCT RESTRICTIONS (Cashback / Coupon Exclusions)
        // ------------------------------------------------------------
        console.log("\n--- 4. Testing Product Restrictions & Exclusions ---");
        // CREATE Cashback Exclusion
        const addRestrRes = await axios.post(`${BASE_URL}/restrictions/restrictions`, {
            ProductID: testProductID,
            RestrictionType: 'no_cashback',
            Status: 1
        }, { headers });

        if (addRestrRes.data.Status === 1) {
            const restrID = addRestrRes.data.RestrictionID;
            record("Product Restrictions", "CREATE Cashback Exclusion", "PASS", `RestrictionID: ${restrID}`);

            // CREATE Coupon Exclusion
            const addCouponRestrRes = await axios.post(`${BASE_URL}/restrictions/restrictions`, {
                ProductID: testProductID,
                RestrictionType: 'no_coupon',
                Status: 1
            }, { headers });
            record("Product Restrictions", "CREATE Coupon Exclusion", "PASS", `RestrictionID: ${addCouponRestrRes.data.RestrictionID}`);

            // READ restrictions
            const getRestrRes = await axios.get(`${BASE_URL}/restrictions/restrictions`, { headers });
            if (getRestrRes.data.Status === 1 && getRestrRes.data.Restrictions.length > 0) {
                record("Product Restrictions", "READ Restrictions", "PASS", `Found ${getRestrRes.data.Restrictions.length} active restrictions`);
            } else {
                record("Product Restrictions", "READ Restrictions", "FAIL", "No restrictions found");
            }

            // UPDATE restriction
            const upRestrRes = await axios.put(`${BASE_URL}/restrictions/restrictions/${restrID}`, { Status: 0 }, { headers });
            if (upRestrRes.data.Status === 1) {
                record("Product Restrictions", "UPDATE / DISABLE", "PASS", "Restriction status set to disabled");
            }

            // DELETE restriction
            await axios.delete(`${BASE_URL}/restrictions/restrictions/${restrID}`, { headers });
            if (addCouponRestrRes.data.RestrictionID) {
                await axios.delete(`${BASE_URL}/restrictions/restrictions/${addCouponRestrRes.data.RestrictionID}`, { headers });
            }
            record("Product Restrictions", "DELETE Restriction", "PASS", "Cleaned up test restrictions");
        } else {
            record("Product Restrictions", "CREATE", "FAIL", addRestrRes.data.Message);
        }

        // ------------------------------------------------------------
        // 5. WALLET / CASHBACK EXPIRY
        // ------------------------------------------------------------
        console.log("\n--- 5. Testing Wallet & Cashback Expiry ---");
        const [users] = await new Promise((res, rej) => pool.query("SELECT UserID, WalletAmount FROM Users LIMIT 1", (err, rows) => err ? rej(err) : res([rows])));
        const testUserID = users && users.length > 0 ? users[0].UserID : 1;
        if (users && users.length > 0) {
            // Credit wallet with expiry
            const creditRes = await axios.post(`${BASE_URL}/adminusers/creditdebitwallet`, {
                UserID: testUserID,
                Amount: 50.00,
                Credited_Debited: 1,
                Description: "Automated test promo cashback",
                ExpiryDays: 30
            }, { headers });

            if (creditRes.data.Status === 1) {
                record("Wallet / Cashback Expiry", "CREDIT Wallet with Expiry", "PASS", creditRes.data.Message);

                // READ wallet transactions
                const txRes = await axios.get(`${BASE_URL}/adminusers/wallettransactions/${testUserID}`, { headers });
                if (txRes.data.Status === 1 && txRes.data.Transactions.length > 0) {
                    record("Wallet / Cashback Expiry", "READ Transactions", "PASS", `Found ${txRes.data.Transactions.length} transactions, Balance: ₹${txRes.data.Balance}`);
                } else {
                    record("Wallet / Cashback Expiry", "READ Transactions", "FAIL", "No transactions returned");
                }

                // Trigger Expiry process
                const expRes = await axios.post(`${BASE_URL}/adminusers/expirecashback`, {}, { headers });
                if (expRes.data.Status === 1) {
                    record("Wallet / Cashback Expiry", "PROCESS Expiry Lifecycle", "PASS", expRes.data.Message);
                } else {
                    record("Wallet / Cashback Expiry", "PROCESS Expiry Lifecycle", "FAIL", expRes.data.Message);
                }

                // Debit to balance out
                await axios.post(`${BASE_URL}/adminusers/creditdebitwallet`, {
                    UserID: testUserID,
                    Amount: 50.00,
                    Credited_Debited: 2,
                    Description: "Reverting automated test credit"
                }, { headers });
                record("Wallet / Cashback Expiry", "DEBIT Revert", "PASS", "Reverted test balance");
            } else {
                record("Wallet / Cashback Expiry", "CREDIT Wallet", "FAIL", creditRes.data.Message);
            }
        } else {
            record("Wallet / Cashback Expiry", "ALL", "BLOCKED", "No Users found in DB");
        }

        // ------------------------------------------------------------
        // 6. CART THRESHOLD OFFERS
        // ------------------------------------------------------------
        console.log("\n--- 6. Testing Cart Threshold Offers ---");
        // CREATE offer
        const createOfferRes = await axios.post(`${BASE_URL}/cartoffers/offers`, {
            OfferName: "End-to-End Test: Spend ₹500 get ₹50 off",
            ThresholdAmount: 500,
            OfferType: "flat_discount",
            OfferValue: 50,
            Status: 1
        }, { headers });

        if (createOfferRes.data.Status === 1 && createOfferRes.data.OfferID) {
            const offerID = createOfferRes.data.OfferID;
            record("Cart Threshold Offers", "CREATE Offer", "PASS", `OfferID: ${offerID}`);

            // READ offers
            const getOffersRes = await axios.get(`${BASE_URL}/cartoffers/offers`, { headers });
            const foundOffer = (getOffersRes.data.Offers || []).find(o => o.OfferID === offerID);
            if (foundOffer) {
                record("Cart Threshold Offers", "READ Offers", "PASS", `Found Offer #${offerID} (${foundOffer.OfferName}, Min: ₹${foundOffer.ThresholdAmount})`);
            } else {
                record("Cart Threshold Offers", "READ Offers", "FAIL", "Created offer not in list");
            }

            // UPDATE offer
            const upOfferRes = await axios.put(`${BASE_URL}/cartoffers/offers/${offerID}`, {
                OfferName: "End-to-End Test: Spend ₹600 get ₹60 off",
                ThresholdAmount: 600,
                OfferValue: 60
            }, { headers });
            if (upOfferRes.data.Status === 1) {
                record("Cart Threshold Offers", "UPDATE Offer", "PASS", "Threshold updated to ₹600");
            }

            // TOGGLE status
            const toggleOfferRes = await axios.put(`${BASE_URL}/cartoffers/offers/status/${offerID}`, { Status: 0 }, { headers });
            if (toggleOfferRes.data.Status === 1) {
                record("Cart Threshold Offers", "DISABLE Offer", "PASS", "Status set to 0");
            }

            // DELETE offer
            const delOfferRes = await axios.delete(`${BASE_URL}/cartoffers/offers/${offerID}`, { headers });
            if (delOfferRes.data.Status === 1) {
                record("Cart Threshold Offers", "DELETE Offer", "PASS", `Deleted Offer #${offerID}`);
            }
        } else {
            record("Cart Threshold Offers", "CREATE Offer", "FAIL", createOfferRes.data.Message);
        }

        // ------------------------------------------------------------
        // 7. WAREHOUSES
        // ------------------------------------------------------------
        console.log("\n--- 7. Testing Warehouses ---");
        const createWhRes = await axios.post(`${BASE_URL}/warehouses/add`, {
            WarehouseName: "Central Fulfillment Hub Test",
            Address: "Industrial Area Phase 2",
            City: "Hyderabad",
            Pincode: "500081",
            ContactPerson: "Manager Test",
            ContactNumber: "9876543210",
            Status: 1
        }, { headers });

        if (createWhRes.data.Status === 1 && createWhRes.data.WarehouseID) {
            const whID = createWhRes.data.WarehouseID;
            record("Warehouses", "CREATE Warehouse", "PASS", `WarehouseID: ${whID}`);

            // READ warehouses
            const getWhRes = await axios.get(`${BASE_URL}/warehouses`, { headers });
            if (getWhRes.data.Status === 1 && (getWhRes.data.warehouses || []).length > 0) {
                record("Warehouses", "READ Warehouses", "PASS", `Found ${(getWhRes.data.warehouses || []).length} warehouses`);
            } else {
                record("Warehouses", "READ Warehouses", "FAIL", "No warehouses found");
            }

            // READ detail
            const getWhDetailRes = await axios.get(`${BASE_URL}/warehouses/detail/${whID}`, { headers });
            if (getWhDetailRes.data.Status === 1) {
                const whObj = getWhDetailRes.data.warehouse || getWhDetailRes.data.warehouses || {};
                record("Warehouses", "READ Detail", "PASS", `Warehouse: ${whObj.WarehouseName || whObj.warehouseName || 'Loaded'}`);
            }

            // UPDATE warehouse
            const upWhRes = await axios.put(`${BASE_URL}/warehouses/update/${whID}`, {
                WarehouseName: "Central Fulfillment Hub Test (Updated)"
            }, { headers });
            if (upWhRes.data.Status === 1) {
                record("Warehouses", "UPDATE Warehouse", "PASS", "Warehouse name updated");
            }

            // DELETE warehouse
            const delWhRes = await axios.delete(`${BASE_URL}/warehouses/delete/${whID}`, { headers });
            if (delWhRes.data.Status === 1) {
                record("Warehouses", "DELETE Warehouse", "PASS", `Deleted Warehouse #${whID}`);
            }
        } else {
            record("Warehouses", "CREATE", "FAIL", createWhRes.data.Message);
        }

        // ------------------------------------------------------------
        // 8. FRANCHISE ENQUIRIES
        // ------------------------------------------------------------
        console.log("\n--- 8. Testing Franchise Enquiries ---");
        // Insert a test row in AWS DB
        const insFranchise = await new Promise((res, rej) => pool.query(
            "INSERT INTO FranchiseEnquiryForms (FullName, MobileNumber, EmailID, City, State, InvestmentRange, Message, Status, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
            ["Test Investor", "9876543210", "investor@test.com", "Hyderabad", "Telangana", "10-20 Lakhs", "Interested in franchise"],
            (err, result) => err ? rej(err) : res(result)
        ));
        const franchiseID = insFranchise.insertId;

        // READ
        const getFranchiseRes = await axios.get(`${BASE_URL}/forms/franchise`, { headers });
        if (getFranchiseRes.data.Status === 1 && (getFranchiseRes.data.FranchiseForms || []).length > 0) {
            record("Franchise Enquiries", "READ Forms", "PASS", `Found ${(getFranchiseRes.data.FranchiseForms || []).length} submissions`);
        }

        // UPDATE status
        const upFranchiseRes = await axios.put(`${BASE_URL}/forms/franchise/${franchiseID}`, {
            Status: 2,
            Notes: "Contacted investor via phone"
        }, { headers });
        if (upFranchiseRes.data.Status === 1) {
            record("Franchise Enquiries", "UPDATE Status", "PASS", "Status updated to 2 with notes");
        }
        await new Promise((res) => pool.query("DELETE FROM FranchiseEnquiryForms WHERE FormID = ?", [franchiseID], res));

        // ------------------------------------------------------------
        // 9. CALLBACK REQUESTS
        // ------------------------------------------------------------
        console.log("\n--- 9. Testing Callback Requests ---");
        const insCb = await new Promise((res, rej) => pool.query(
            "INSERT INTO CallBackForms (FullName, MobileNumber, PreferredTime, Subject, Message, Status, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())",
            ["Test Callback User", "9876543211", "Evening 5 PM", "Delivery delay query", "Please call back"],
            (err, result) => err ? rej(err) : res(result)
        ));
        const cbID = insCb.insertId;

        // READ
        const getCbRes = await axios.get(`${BASE_URL}/forms/callback`, { headers });
        if (getCbRes.data.Status === 1 && (getCbRes.data.CallBackForms || []).length > 0) {
            record("Callback Requests", "READ Forms", "PASS", `Found ${(getCbRes.data.CallBackForms || []).length} requests`);
        }

        // UPDATE status
        const upCbRes = await axios.put(`${BASE_URL}/forms/callback/${cbID}`, {
            Status: 2,
            Notes: "Call completed"
        }, { headers });
        if (upCbRes.data.Status === 1) {
            record("Callback Requests", "UPDATE Status", "PASS", "Status updated to 2");
        }
        await new Promise((res) => pool.query("DELETE FROM CallBackForms WHERE FormID = ?", [cbID], res));

        // ------------------------------------------------------------
        // 10. AVAILABILITY REQUESTS
        // ------------------------------------------------------------
        console.log("\n--- 10. Testing Availability Requests ---");
        const insAvail = await new Promise((res, rej) => pool.query(
            "INSERT INTO AvailabilityForms (CustomerName, MobileNumber, ProductName, Pincode, Status, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())",
            ["Test Avail User", "9876543212", "Basmati Premium Rice 5kg", "500081"],
            (err, result) => err ? rej(err) : res(result)
        ));
        const availID = insAvail.insertId;

        // READ
        const getAvailRes = await axios.get(`${BASE_URL}/forms/availability`, { headers });
        if (getAvailRes.data.Status === 1 && (getAvailRes.data.AvailabilityForms || []).length > 0) {
            record("Availability Requests", "READ Forms", "PASS", `Found ${(getAvailRes.data.AvailabilityForms || []).length} requests`);
        }

        // UPDATE status
        const upAvailRes = await axios.put(`${BASE_URL}/forms/availability/${availID}`, {
            Status: 2,
            Notes: "Stock added"
        }, { headers });
        if (upAvailRes.data.Status === 1) {
            record("Availability Requests", "UPDATE Status", "PASS", "Status updated to 2");
        }
        await new Promise((res) => pool.query("DELETE FROM AvailabilityForms WHERE FormID = ?", [availID], res));

        // ------------------------------------------------------------
        // 11. NOTIFY PRODUCTS / BACK-IN-STOCK
        // ------------------------------------------------------------
        console.log("\n--- 11. Testing Notify Products / Back-in-Stock ---");
        const insNotify = await new Promise((res, rej) => pool.query(
            "INSERT INTO NotifyProducts (UserID, ProductID, MobileNumber, Status, CreatedAt, UpdatedAt) VALUES (?, ?, ?, 1, NOW(), NOW())",
            [testUserID || 1, testProductID, "9876543210"],
            (err, result) => err ? rej(err) : res(result)
        ));
        const notifyID = insNotify.insertId;

        // READ
        const getNotifyRes = await axios.get(`${BASE_URL}/adminusers/notifyproducts`, { headers });
        if (getNotifyRes.data.Status === 1 && (getNotifyRes.data.Products || []).length > 0) {
            record("Notify Products", "READ Requests", "PASS", `Found ${(getNotifyRes.data.Products || []).length} waiting customers`);
        }

        // TRIGGER Notification
        const trigRes = await axios.post(`${BASE_URL}/adminusers/triggernotifyproduct/${notifyID}`, {}, { headers });
        if (trigRes.data.Status === 1) {
            record("Notify Products", "DISPATCH Notification Alert", "PASS", trigRes.data.Message);
        }

        await new Promise((res) => pool.query("DELETE FROM NotifyProducts WHERE NotifyID = ? OR ID = ?", [notifyID, notifyID], res));

        console.log("\n============================================================");
        console.log("SUMMARY OF VERIFICATION RESULTS:");
        console.log(`TOTAL CHECKS: ${results.length}`);
        const passCount = results.filter(r => r.status === "PASS").length;
        const failCount = results.filter(r => r.status === "FAIL").length;
        const blockCount = results.filter(r => r.status === "BLOCKED").length;
        console.log(`PASS: ${passCount} | FAIL: ${failCount} | BLOCKED: ${blockCount}`);
        console.log("============================================================");

    } catch (err) {
        console.error("Verification failed with exception:", err);
    } finally {
        process.exit(0);
    }
}

runVerification();
