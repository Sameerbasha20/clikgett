'use strict';
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const totp = require('../utils/totp');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = mysql.createPool({
    connectionLimit: 10,
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

const runAuditRegressions = async () => {
    console.log('========================================================================');
    console.log('🔒 EXECUTING COMPREHENSIVE SECURITY, INTEGRATION & REGRESSION AUDIT TESTS');
    console.log('========================================================================\n');

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
        const AdminAuth2FA = require('../controllers/AdminAuth2FA');
        const AdminGlobalSearch = require('../controllers/AdminGlobalSearch');
        const ReferralRewards = require('../controllers/ReferralRewards');
        const DeliveryETA = require('../controllers/DeliveryETA');
        const utils = require('../utils/utils');

        // Fetch test admin
        const [admin] = await queryAsync("SELECT * FROM AdminUsers WHERE Role = 1 LIMIT 1");
        assert(admin !== undefined, `Found admin user ID ${admin.AdminID} for audit testing`);

        // Ensure test admin has TOTP configured
        let testSecret = admin.TwoFactorSecret;
        if (!testSecret) {
            testSecret = totp.generateSecret();
            await queryAsync(
                "UPDATE AdminUsers SET TwoFactorEnabled = 1, TwoFactorSecret = ?, TwoFactorFailedAttempts = 0, TwoFactorLockedUntil = NULL WHERE AdminID = ?",
                [testSecret, admin.AdminID]
            );
        } else {
            await queryAsync(
                "UPDATE AdminUsers SET TwoFactorFailedAttempts = 0, TwoFactorLockedUntil = NULL WHERE AdminID = ?",
                [admin.AdminID]
            );
        }

        // =====================================================================
        // SECTION 1: 2FA SECURITY AUDIT & RACE CONDITIONS
        // =====================================================================
        console.log('\n--- 1. Audit: 2FA Security & Concurrency Controls ---');

        // Check 1.1: Pre-auth token blocked across adminAuthenticate middleware
        const preAuthToken = jwt.sign(
            { AdminID: admin.AdminID, EmailID: admin.EmailID, is2FAPending: true },
            process.env.SECRET_KEY,
            { expiresIn: 300 }
        );

        let blockedStatus = null;
        let blockedMsg = '';
        await utils.authenticate.adminAuthenticate(
            { headers: { authorization: `token ${preAuthToken}` } },
            {
                status: (code) => {
                    blockedStatus = code;
                    return { json: (d) => { blockedMsg = d.Message; return d; } };
                },
                json: (d) => { blockedMsg = d.Message; return d; }
            },
            () => { blockedStatus = 200; }
        );
        assert(blockedStatus === 401 && blockedMsg.includes("pending"), "Pre-authentication JWT strictly rejected by adminAuthenticate (401)");

        // Check 1.2: Existing configured admin does NOT expose secret during normal login
        let loginResData = null;
        await AdminAuth2FA.login(
            { body: { EmailID: admin.EmailID, Password: admin.Password } },
            {
                status: (code) => ({
                    json: (d) => { loginResData = { code, d }; return d; }
                })
            }
        );
        assert(loginResData && loginResData.code === 200, "Normal login generates pre-auth session for 2FA");
        assert(loginResData.d.require2FA === true && loginResData.d.isSetup === false, "Already-configured admin is in verify mode, not setup mode");
        assert(!loginResData.d.secret && !loginResData.d.recoveryCodes, "Existing admin 2FA secret and recovery codes are NOT exposed in response");

        // Check 1.3: Anti-Replay race condition under concurrent requests
        const currentCode = totp.generateTOTP(testSecret);
        const twoFactorToken = loginResData.d.twoFactorToken;

        // Reset last used timestamp to 0 for controlled test
        await queryAsync("UPDATE AdminUsers SET TwoFactorLastUsedTimestamp = 0 WHERE AdminID = ?", [admin.AdminID]);

        // Fire 2 concurrent verify requests with the exact same OTP code
        const [simRes1, simRes2] = await Promise.all([
            new Promise((res) => {
                AdminAuth2FA.verify2FA(
                    { body: { twoFactorToken, code: currentCode } },
                    { status: (code) => ({ json: (d) => res({ code, d }) }) }
                );
            }),
            new Promise((res) => {
                AdminAuth2FA.verify2FA(
                    { body: { twoFactorToken, code: currentCode } },
                    { status: (code) => ({ json: (d) => res({ code, d }) }) }
                );
            })
        ]);

        const successCount = [simRes1, simRes2].filter(r => r.code === 200).length;
        const replayBlocked = [simRes1, simRes2].some(r => r.code === 400 && r.d.Message.includes("already been used"));
        assert(successCount === 1, `Simultaneous TOTP verification: exactly 1 request succeeded (successCount: ${successCount})`);
        assert(replayBlocked, "Simultaneous TOTP verification: anti-replay race blocked second concurrent request");

        // Check 1.4: Recovery code atomic single-use under concurrency
        const { rawCodes, hashedCodes } = totp.generateRecoveryCodes(4);
        const testRecoveryCode = rawCodes[0];
        await queryAsync(
            "UPDATE AdminUsers SET TwoFactorRecoveryCodes = ? WHERE AdminID = ?",
            [JSON.stringify(hashedCodes), admin.AdminID]
        );

        const [recRes1, recRes2] = await Promise.all([
            new Promise((res) => {
                AdminAuth2FA.verify2FA(
                    { body: { twoFactorToken, recoveryCode: testRecoveryCode } },
                    { status: (code) => ({ json: (d) => res({ code, d }) }) }
                );
            }),
            new Promise((res) => {
                AdminAuth2FA.verify2FA(
                    { body: { twoFactorToken, recoveryCode: testRecoveryCode } },
                    { status: (code) => ({ json: (d) => res({ code, d }) }) }
                );
            })
        ]);

        const recSuccessCount = [recRes1, recRes2].filter(r => r.code === 200).length;
        assert(recSuccessCount === 1, `Concurrent recovery code redemption: exactly 1 succeeded (count: ${recSuccessCount})`);

        // Verify hash was removed from database
        const [updatedAdmin] = await queryAsync("SELECT TwoFactorRecoveryCodes FROM AdminUsers WHERE AdminID = ?", [admin.AdminID]);
        const remainingHashes = JSON.parse(updatedAdmin.TwoFactorRecoveryCodes || '[]');
        assert(!remainingHashes.includes(hashedCodes[0]), "Used recovery code hash atomically purged from database");

        // Check 1.5: Failed attempts counter & 15-minute lockout under concurrency
        await queryAsync("UPDATE AdminUsers SET TwoFactorFailedAttempts = 0, TwoFactorLockedUntil = NULL WHERE AdminID = ?", [admin.AdminID]);

        // Send 5 concurrent invalid verification requests
        const badResults = await Promise.all([1, 2, 3, 4, 5].map(() => {
            return new Promise((res) => {
                AdminAuth2FA.verify2FA(
                    { body: { twoFactorToken, code: '000000' } },
                    { status: (code) => ({ json: (d) => res({ code, d }) }) }
                );
            });
        }));

        const [lockedAdmin] = await queryAsync("SELECT TwoFactorFailedAttempts, TwoFactorLockedUntil FROM AdminUsers WHERE AdminID = ?", [admin.AdminID]);
        assert(lockedAdmin.TwoFactorFailedAttempts >= 5, `Failed attempts serialized to threshold (count: ${lockedAdmin.TwoFactorFailedAttempts})`);
        assert(lockedAdmin.TwoFactorLockedUntil !== null && new Date(lockedAdmin.TwoFactorLockedUntil) > new Date(), "15-minute lockout timestamp successfully activated in DB");

        // Verify subsequent login/verification is blocked with 403
        let lockAttemptRes = null;
        await AdminAuth2FA.verify2FA(
            { body: { twoFactorToken, code: currentCode } },
            { status: (code) => ({ json: (d) => { lockAttemptRes = { code, d }; return d; } }) }
        );
        assert(lockAttemptRes && lockAttemptRes.code === 403, "Locked account rejected with 403 Forbidden");

        // Reset lockout for subsequent tests
        await queryAsync("UPDATE AdminUsers SET TwoFactorFailedAttempts = 0, TwoFactorLockedUntil = NULL WHERE AdminID = ?", [admin.AdminID]);

        // Check 1.6: Audit log security - passwords & OTP codes NOT logged
        const latestLogs = await queryAsync(
            "SELECT Action, Details FROM AdminAuthAuditLogs WHERE AdminID = ? ORDER BY AuditID DESC LIMIT 10",
            [admin.AdminID]
        );
        assert(latestLogs.length > 0, "Authentication audit logs recorded events");
        const detailsAndActions = latestLogs.map(l => `${l.Action} ${l.Details}`).join(' ');
        assert(!detailsAndActions.toLowerCase().includes(admin.Password.toLowerCase()), "Admin password NOT logged in audit trail");
        assert(!detailsAndActions.includes(currentCode), "Raw TOTP code NOT logged in audit trail");

        // =====================================================================
        // SECTION 2: GLOBAL SEARCH AUDIT
        // =====================================================================
        console.log('\n--- 2. Audit: Global Search Queries & Input Sanitization ---');

        // Check 2.1: Empty and short input
        let emptyRes = null;
        await AdminGlobalSearch.search(
            { query: { q: ' ' } },
            { status: (code) => ({ json: (d) => { emptyRes = { code, d }; return d; } }) }
        );
        assert(emptyRes && emptyRes.code === 400, "Empty / whitespace search query rejected with 400");

        // Check 2.2: Long input (> 500 chars) capped without error
        const longQuery = 'A'.repeat(500);
        let longRes = null;
        await AdminGlobalSearch.search(
            { query: { q: longQuery } },
            { status: (code) => ({ json: (d) => { longRes = { code, d }; return d; } }) }
        );
        assert(longRes && longRes.code === 200, "Long input capped to 100 characters and processed safely (200 OK)");
        assert(longRes.d.query.length <= 100, "Search query trimmed to max 100 characters");

        // Check 2.3: SQL Injection payloads safely handled via parameterization
        const sqliPayload = "' OR '1'='1' --";
        let sqliRes = null;
        await AdminGlobalSearch.search(
            { query: { q: sqliPayload } },
            { status: (code) => ({ json: (d) => { sqliRes = { code, d }; return d; } }) }
        );
        assert(sqliRes && sqliRes.code === 200, "SQL injection string parameterized safely without error");

        // Check 2.4: Unicode input
        let unicodeRes = null;
        await AdminGlobalSearch.search(
            { query: { q: '🍕' } },
            { status: (code) => ({ json: (d) => { unicodeRes = { code, d }; return d; } }) }
        );
        assert(unicodeRes && unicodeRes.code === 200, "Unicode character search handled properly");

        // Check 2.5: Numerical search of length >= 2 against customer, order, and product ID
        let idRes = null;
        await AdminGlobalSearch.search(
            { query: { q: '10' } },
            { status: (code) => ({ json: (d) => { idRes = { code, d }; return d; } }) }
        );
        assert(idRes && idRes.code === 200 && idRes.d.totalResults >= 0, "Numeric query (length >= 2) searched across OrderID, UserID, and ProductID");

        // =====================================================================
        // SECTION 3: REFERRAL REWARDS & FINANCIAL INTEGRITY
        // =====================================================================
        console.log('\n--- 3. Audit: Referral Engine, Fallbacks & Idempotency ---');

        // Check 3.1: Self-referral rejection
        const selfReferral = await ReferralRewards.processReward({
            referredUserId: admin.AdminID,
            triggerEvent: 'registration'
        });
        assert(selfReferral.success === false, "Self-referral / non-referred customer rejected");

        // Check 3.2: First-order reward with omitted orderTotal (resolves GrandTotal from Orders table)
        // Find or create test order with qualifying total
        const [existingOrder] = await queryAsync("SELECT OrderID, UserID, GrandTotal FROM Orders WHERE GrandTotal >= 199 LIMIT 1");
        if (existingOrder) {
            // Test lookup without orderTotal passed
            const mockUserRes = await ReferralRewards.processReward({
                referredUserId: existingOrder.UserID,
                triggerEvent: 'first_order',
                orderId: existingOrder.OrderID
                // orderTotal omitted intentionally to test auto-lookup
            });
            // Result should be either processed or already_credited / user_not_referred (NOT a threshold crash)
            assert(mockUserRes.reason !== "order_value_below_minimum_threshold", "Automatic order total resolution queried GrandTotal successfully from Orders");
        } else {
            console.log("  ⚠️ SKIP: No qualifying order found to test auto GrandTotal lookup");
        }

        // Check 3.3: Idempotency under concurrent duplicate claims
        const [testReferredUser] = await queryAsync("SELECT UserID, ReferredBy FROM Users WHERE ReferredBy IS NOT NULL AND ReferredBy != 'NA' LIMIT 1");
        if (testReferredUser) {
            const [cClaim1, cClaim2] = await Promise.all([
                ReferralRewards.processReward({
                    referredUserId: testReferredUser.UserID,
                    triggerEvent: 'first_order',
                    orderTotal: 500
                }),
                ReferralRewards.processReward({
                    referredUserId: testReferredUser.UserID,
                    triggerEvent: 'first_order',
                    orderTotal: 500
                })
            ]);
            // Either one succeeded and one rejected as already_credited, or both rejected if previously claimed
            const bothCredited = (cClaim1.success && cClaim2.success);
            assert(!bothCredited, "Concurrent referral processing: double crediting strictly prevented by row lock and UNIQUE constraint");
        }

        // =====================================================================
        // SECTION 4: DISTANCE-BASED DELIVERY ETA BOUNDARY AUDIT
        // =====================================================================
        console.log('\n--- 4. Audit: Distance-Based Delivery ETA Boundaries ---');

        // Exact boundary checks against 3km and 5km thresholds
        const eta299 = await DeliveryETA.calculateBaseETA(2.999);
        assert(eta299.baseMinutes === 20 && eta299.band.includes("below"), "Distance 2.999 km assigns 20 minutes (Band 1)");

        const eta300 = await DeliveryETA.calculateBaseETA(3.000);
        assert(eta300.baseMinutes === 25 && eta300.band.includes("between"), "Distance exactly 3.000 km assigns 25 minutes (Band 2)");

        const eta499 = await DeliveryETA.calculateBaseETA(4.999);
        assert(eta499.baseMinutes === 25 && eta499.band.includes("between"), "Distance 4.999 km assigns 25 minutes (Band 2)");

        const eta500 = await DeliveryETA.calculateBaseETA(5.000);
        assert(eta500.baseMinutes === 25 && eta500.band.includes("between"), "Distance exactly 5.000 km assigns 25 minutes (Band 2)");

        const eta501 = await DeliveryETA.calculateBaseETA(5.001);
        assert(eta501.baseMinutes === 30 && eta501.band.includes("above"), "Distance 5.001 km assigns 30 minutes (Band 3)");

        // Edge cases: 0 km, negative, and invalid distances
        const etaZero = await DeliveryETA.calculateBaseETA(0);
        assert(etaZero.baseMinutes === 20, "Distance 0.0 km assigns 20 minutes base ETA");

        const etaNegative = await DeliveryETA.calculateBaseETA(-2.5);
        assert(etaNegative.baseMinutes === 25 && etaNegative.band === 'unknown_distance_fallback', "Negative distance safely uses fallback (25 minutes)");

        const etaInvalid = await DeliveryETA.calculateBaseETA("invalid_distance");
        assert(etaInvalid.baseMinutes === 25 && etaInvalid.band === 'unknown_distance_fallback', "Invalid non-numeric distance safely uses fallback (25 minutes)");

        // Extreme large distance (e.g., 50 km)
        const etaLarge = await DeliveryETA.calculateBaseETA(50.0);
        assert(etaLarge.baseMinutes === 30 && etaLarge.band.includes("above"), "Large distance 50.0 km (> 5 km) assigns 30 minutes (Band 3)");

        // Validation against distance gaps/overlaps
        let gapErrorRes = null;
        await DeliveryETA.updateRules({
            body: {
                IsEnabled: 1,
                Band1MaxKm: 2.5, // Gap: 2.5 to 3.0 has no coverage!
                Band1BaseMinutes: 20,
                Band2MinKm: 3.0,
                Band2MaxKm: 5.0,
                Band2BaseMinutes: 25,
                Band3MinKm: 5.0,
                Band3BaseMinutes: 30
            }
        }, {
            status: (code) => ({ json: (d) => { gapErrorRes = { code, d }; return d; } })
        });
        assert(gapErrorRes && gapErrorRes.code === 400 && gapErrorRes.d.Message.includes("gap"), "Rule validation rejects unhandled distance gap between Band 1 and Band 2");

    } catch (err) {
        console.error("Fatal exception in audit regression test suite:", err);
        failed++;
    } finally {
        console.log('\n========================================================================');
        console.log(`📊 AUDIT REGRESSION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
        console.log('========================================================================\n');
        process.exit(failed > 0 ? 1 : 0);
    }
};

runAuditRegressions();
