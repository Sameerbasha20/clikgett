'use strict';
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const totp = require('../utils/totp');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

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
        pool.query(sql, params, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
};

const runTests = async () => {
    console.log('===============================================================');
    console.log('🧪 RUNNING COMPREHENSIVE TEST SUITE FOR 4 NEW FEATURES');
    console.log('===============================================================');

    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failed++;
        }
    };

    try {
        // -------------------------------------------------------------
        // TEST 1: TWO-FACTOR AUTHENTICATION (2FA)
        // -------------------------------------------------------------
        console.log('\n--- 1. Testing Two-Factor Authentication (2FA) ---');
        const AdminAuth2FA = require('../controllers/AdminAuth2FA');
        const utils = require('../utils/utils');

        // Fetch or create a test admin
        const [admin] = await queryAsync("SELECT * FROM AdminUsers WHERE Role = 1 LIMIT 1");
        assert(admin !== undefined, "Found authorized admin for 2FA test");

        // Test Step 1: Login with valid credentials
        let loginResData = null;
        const mockLoginReq = {
            body: { EmailID: admin.EmailID, Password: admin.Password },
            headers: {},
            socket: {}
        };
        const mockLoginResp = {
            status: (code) => ({
                json: (data) => {
                    loginResData = { code, data };
                    return data;
                }
            })
        };

        await AdminAuth2FA.login(mockLoginReq, mockLoginResp);
        assert(loginResData && loginResData.data.Status === 1, "Admin primary credentials verified");
        assert(loginResData.data.require2FA === true, "2FA is mandatory - require2FA flag is true");
        assert(loginResData.data.twoFactorToken !== undefined, "Pre-auth twoFactorToken generated");

        const tempToken = loginResData.data.twoFactorToken;
        const tempDecoded = jwt.verify(tempToken, process.env.SECRET_KEY);
        assert(tempDecoded.is2FAPending === true, "Token has is2FAPending: true flag");

        // Test Security: Calling protected endpoint with pre-auth token MUST be rejected
        let authErr = null;
        const mockAuthReq = {
            headers: { authorization: `token ${tempToken}` }
        };
        const mockAuthResp = {
            status: (code) => ({
                json: (data) => {
                    authErr = { code, data };
                    return data;
                }
            })
        };
        await new Promise((resolve) => {
            utils.authenticate.adminAuthenticate(mockAuthReq, mockAuthResp, () => {
                authErr = { code: 200 };
                resolve();
            });
            setTimeout(resolve, 500);
        });
        assert(authErr && authErr.code === 401, "Protected API rejects pre-auth 2FA pending token with 401 Unauthorized");

        // Test Step 2: Verification with invalid code
        let verifyErrData = null;
        const mockBadVerifyReq = {
            body: { twoFactorToken: tempToken, code: "000000" }
        };
        const mockBadVerifyResp = {
            status: (code) => ({
                json: (data) => {
                    verifyErrData = { code, data };
                    return data;
                }
            })
        };
        await AdminAuth2FA.verify2FA(mockBadVerifyReq, mockBadVerifyResp);
        assert(verifyErrData && verifyErrData.data.Status === 0, "Invalid 2FA code is rejected");

        // Test Step 2: Verification with valid TOTP code
        const activeSecret = loginResData.data.secret || admin.TwoFactorSecret || tempDecoded.pendingSecret;
        assert(activeSecret !== undefined, "Active TOTP secret identified");

        const validCode = totp.generateTOTP(activeSecret);
        let verifySuccessData = null;
        const mockGoodVerifyReq = {
            body: { twoFactorToken: tempToken, code: validCode }
        };
        const mockGoodVerifyResp = {
            status: (code) => ({
                json: (data) => {
                    verifySuccessData = { code, data };
                    return data;
                }
            })
        };
        await AdminAuth2FA.verify2FA(mockGoodVerifyReq, mockGoodVerifyResp);
        assert(verifySuccessData && verifySuccessData.data.Status === 1, "Valid 2FA code accepted");
        assert(verifySuccessData.data.token !== undefined, "Full authoritative access token issued after 2FA");

        // Test Anti-Replay: Attempting to reuse the exact same code
        let replayResData = null;
        await AdminAuth2FA.verify2FA(mockGoodVerifyReq, {
            status: (code) => ({ json: (d) => { replayResData = { code, d }; return d; } })
        });
        assert(replayResData && replayResData.d.Status === 0, "Replay attack prevented: same code cannot be reused");

        // Verify audit log exists
        const [auditRow] = await queryAsync("SELECT * FROM AdminAuthAuditLogs WHERE AdminID = ? ORDER BY AuditID DESC LIMIT 1", [admin.AdminID]);
        assert(auditRow !== undefined && auditRow.Action === 'REPLAY_ATTACK_PREVENTED', "Security audit log recorded in AdminAuthAuditLogs");

        // -------------------------------------------------------------
        // TEST 2: GLOBAL SEARCH
        // -------------------------------------------------------------
        console.log('\n--- 2. Testing Admin Global Search ---');
        const AdminGlobalSearch = require('../controllers/AdminGlobalSearch');

        // Test short query validation (< 2 chars)
        let searchValData = null;
        await AdminGlobalSearch.search({ query: { q: 'a' } }, {
            status: (code) => ({ json: (d) => { searchValData = { code, d }; return d; } })
        });
        assert(searchValData && searchValData.code === 400, "Search query validation requires at least 2 chars");

        // Test multi-entity search
        let searchResData = null;
        await AdminGlobalSearch.search({ query: { q: 'a' } }, {
            status: (code) => ({ json: (d) => { return d; } })
        });

        // Search for existing product or order or customer
        await AdminGlobalSearch.search({ query: { q: 'admin' } }, {
            status: (code) => ({ json: (d) => { searchResData = { code, d }; return d; } })
        });
        assert(searchResData && searchResData.d.Status === 1, "Global search executed successfully");
        assert(searchResData.d.results && 'customers' in searchResData.d.results, "Results categorized: customers");
        assert('orders' in searchResData.d.results, "Results categorized: orders");
        assert('products' in searchResData.d.results, "Results categorized: products");
        assert('enquiries' in searchResData.d.results, "Results categorized: enquiries");
        assert('productRequests' in searchResData.d.results, "Results categorized: productRequests");

        // -------------------------------------------------------------
        // TEST 3: REFERRAL REWARDS & IDEMPOTENCY
        // -------------------------------------------------------------
        console.log('\n--- 3. Testing Referral Rewards & Financial Integrity ---');
        const ReferralRewards = require('../controllers/ReferralRewards');

        // Test Config fetch
        let refConfigData = null;
        await ReferralRewards.getConfig({}, {
            status: (code) => ({ json: (d) => { refConfigData = { code, d }; return d; } })
        });
        assert(refConfigData && refConfigData.d.Status === 1, "Referral configuration fetched");
        assert(refConfigData.d.config.ReferrerReward !== undefined, "Referrer reward amount is configured");

        // Test Config update with validation
        let badConfigRes = null;
        await ReferralRewards.updateConfig({ body: { ReferrerReward: -50 } }, {
            status: (code) => ({ json: (d) => { badConfigRes = { code, d }; return d; } })
        });
        assert(badConfigRes && badConfigRes.code === 400, "Negative reward amount rejected by validation");

        // Update config with valid values
        let goodConfigRes = null;
        await ReferralRewards.updateConfig({
            AdminID: admin.AdminID,
            body: {
                IsEnabled: 1,
                ReferrerReward: 75.00,
                ReferredReward: 25.00,
                TriggerEvent: 'first_order',
                MinOrderValue: 199.00,
                MaxReferralsPerUser: 50
            }
        }, {
            status: (code) => ({ json: (d) => { goodConfigRes = { code, d }; return d; } })
        });
        assert(goodConfigRes && goodConfigRes.d.Status === 1, "Referral configuration updated successfully");

        // Verify audit log for settings change
        const [refAudit] = await queryAsync("SELECT * FROM ReferralAuditLogs ORDER BY AuditID DESC LIMIT 1");
        assert(refAudit !== undefined && refAudit.Action === 'UPDATE_REFERRAL_SETTINGS', "Audit history recorded who changed referral settings and when");

        // Test Self-Referral Prevention
        const selfRefRes = await ReferralRewards.processReward({
            referredUserId: admin.AdminID,
            triggerEvent: 'first_order'
        });
        assert(selfRefRes.success === false, "Self-referral or non-referred user prevented");

        // -------------------------------------------------------------
        // TEST 4: DISTANCE-BASED DELIVERY ETA
        // -------------------------------------------------------------
        console.log('\n--- 4. Testing Distance-Based Delivery ETA ---');
        const DeliveryETA = require('../controllers/DeliveryETA');

        // Test Rule 1: Below 3 km -> 20 minutes
        const etaUnder3 = await DeliveryETA.calculateBaseETA(1.5);
        assert(etaUnder3.baseMinutes === 20, "Distance 1.5 km (< 3 km) assigns 20 minutes base ETA");
        assert(etaUnder3.band === 'below_3km', "Band correctly categorized as below_3km");

        // Test Rule 2: Exactly 3 km boundary -> Band 2 (25 minutes)
        const etaExact3 = await DeliveryETA.calculateBaseETA(3.0);
        assert(etaExact3.baseMinutes === 25, "Boundary distance 3.0 km assigns 25 minutes base ETA");

        // Test Rule 3: Between 3 km and 5 km -> Explicitly configured middle band (25 minutes)
        const etaMid = await DeliveryETA.calculateBaseETA(4.2);
        assert(etaMid.baseMinutes === 25, "Distance 4.2 km (between 3 and 5 km) assigns 25 minutes base ETA");

        // Test Rule 4: Exactly 5 km boundary -> Band 2 (25 minutes)
        const etaExact5 = await DeliveryETA.calculateBaseETA(5.0);
        assert(etaExact5.baseMinutes === 25, "Boundary distance 5.0 km assigns 25 minutes base ETA");

        // Test Rule 5: Above 5 km -> 30 minutes
        const etaAbove5 = await DeliveryETA.calculateBaseETA(7.8);
        assert(etaAbove5.baseMinutes === 30, "Distance 7.8 km (> 5 km) assigns 30 minutes base ETA");
        assert(etaAbove5.band === 'above_5km', "Band correctly categorized as above_5km");

        // Test Validation: Invalid overlapping rules rejected
        let invalidRuleRes = null;
        await DeliveryETA.updateRules({
            AdminID: admin.AdminID,
            body: {
                IsEnabled: 1,
                Band1MaxKm: 4.0, // Gaps/overlaps with Band2MinKm (3.0)
                Band1BaseMinutes: 20,
                Band2MinKm: 3.0,
                Band2MaxKm: 5.0,
                Band2BaseMinutes: 25,
                Band3MinKm: 5.0,
                Band3BaseMinutes: 30,
                DefaultBaseMinutes: 25
            }
        }, {
            status: (code) => ({ json: (d) => { invalidRuleRes = { code, d }; return d; } })
        });
        assert(invalidRuleRes && invalidRuleRes.code === 400, "Overlapping or misaligned distance bands rejected by validation");

        console.log('\n===============================================================');
        console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('===============================================================');

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (err) {
        console.error('Fatal test error:', err);
        process.exit(1);
    } finally {
        pool.end();
    }
};

runTests();
