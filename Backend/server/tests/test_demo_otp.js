'use strict';
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

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

// Helper mock response object
const createMockResponse = () => {
    return {
        statusCode: 200,
        data: null,
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(payload) {
            this.data = payload;
            return this;
        }
    };
};

const runDemoOtpTests = async () => {
    console.log('========================================================================');
    console.log('🧪 EXECUTING DEMO OTP 2FA SUITE (VERIFICATION, EXPIRY, REPLAY, LOCKOUT, PROD REJECTION)');
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

    const originalNodeEnv = process.env.NODE_ENV;
    const originalDemoFlag = process.env.ADMIN_2FA_DEMO_OTP;
    const originalFixedOtp = process.env.ADMIN_2FA_FIXED_DEMO_OTP;

    try {
        const AdminAuth2FA = require('../controllers/AdminAuth2FA');

        // Locate or setup a test admin user
        const [admin] = await queryAsync("SELECT * FROM AdminUsers WHERE Role = 1 LIMIT 1");
        assert(admin !== undefined, `Found admin user ${admin.EmailID} (AdminID: ${admin.AdminID})`);

        // Clean state for test admin
        await queryAsync(
            `UPDATE AdminUsers SET 
                TwoFactorFailedAttempts = 0, 
                TwoFactorLockedUntil = NULL,
                TwoFactorLastUsedTimestamp = NULL
             WHERE AdminID = ?`,
            [admin.AdminID]
        );

        // -----------------------------------------------------------------
        // TEST 1: Environment validation & Helper Checks
        // -----------------------------------------------------------------
        console.log('\n--- TEST SUITE 1: Configuration & Environment Guardrails ---');
        process.env.NODE_ENV = 'development';
        process.env.ADMIN_2FA_DEMO_OTP = 'true';
        process.env.ADMIN_2FA_FIXED_DEMO_OTP = '123456';
        assert(AdminAuth2FA._isDemoOtpEnabled() === true, 'Demo OTP is enabled when NODE_ENV=development and ADMIN_2FA_DEMO_OTP=true');
        assert(AdminAuth2FA._getDemoOtpValue() === '123456', 'Configurable demo OTP returns 123456');

        process.env.ADMIN_2FA_FIXED_DEMO_OTP = '987654';
        assert(AdminAuth2FA._getDemoOtpValue() === '987654', 'Configurable demo OTP respects custom values (987654)');
        process.env.ADMIN_2FA_FIXED_DEMO_OTP = '123456';

        // -----------------------------------------------------------------
        // TEST 2: Primary Login issues Demo OTP in Development
        // -----------------------------------------------------------------
        console.log('\n--- TEST SUITE 2: Primary Login in Development Mode ---');
        process.env.NODE_ENV = 'development';
        process.env.ADMIN_2FA_DEMO_OTP = 'true';

        const loginReq = {
            body: {
                EmailID: admin.EmailID,
                Password: admin.Password
            },
            headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'TestAgent' },
            socket: { remoteAddress: '127.0.0.1' }
        };
        const loginResp = createMockResponse();
        await AdminAuth2FA.login(loginReq, loginResp);

        assert(loginResp.statusCode === 200, 'Primary credentials accepted with status 200');
        assert(loginResp.data.require2FA === true, '2FA is mandatory before session grant');
        assert(loginResp.data.isDemoOtp === true, 'isDemoOtp flag returned in development mode');
        assert(loginResp.data.demoOtp === '123456', 'Fixed Demo OTP 123456 provided to frontend');
        assert(typeof loginResp.data.twoFactorToken === 'string', 'Pre-auth twoFactorToken generated');
        assert(!loginResp.data.token, 'Full session access token is NOT issued at primary login');

        // Verify pre-auth token contents
        const preAuthDecoded = jwt.verify(loginResp.data.twoFactorToken, process.env.SECRET_KEY);
        assert(preAuthDecoded.is2FAPending === true, 'Pre-auth token has is2FAPending: true');
        assert(preAuthDecoded.AdminID === admin.AdminID, 'Pre-auth token contains correct AdminID');
        assert(preAuthDecoded.demoOtpHash !== undefined, 'Pre-auth token securely seals SHA-256 hash of Demo OTP');
        assert(preAuthDecoded.demoOtpIssuedAt !== undefined, 'Pre-auth token includes demoOtpIssuedAt timestamp');

        const activeTwoFactorToken = loginResp.data.twoFactorToken;

        // -----------------------------------------------------------------
        // TEST 3: Pre-auth Token Isolation (Cannot be used as Admin Auth Token)
        // -----------------------------------------------------------------
        console.log('\n--- TEST SUITE 3: Pre-auth Token Isolation ---');
        const { authenticate } = require('../utils/utils');
        let authMiddlewarePassed = false;
        const mockAuthReq = {
            headers: { authorization: `Bearer ${activeTwoFactorToken}` }
        };
        const mockAuthResp = createMockResponse();
        await authenticate.adminAuthenticate(mockAuthReq, mockAuthResp, () => {
            authMiddlewarePassed = true;
        });
        assert(authMiddlewarePassed === false, 'Pre-auth twoFactorToken is strictly REJECTED by adminAuthenticate middleware');
        assert(mockAuthResp.statusCode === 401, 'adminAuthenticate returns 401 Unauthorized for pre-auth token');
        assert(mockAuthResp.data.Message.includes('Two-factor authentication pending'), 'Rejection message explains 2FA is pending');

        // -----------------------------------------------------------------
        // TEST 4: Incorrect OTP Rejection & Failed Attempt Counter
        // -----------------------------------------------------------------
        console.log('\n--- TEST SUITE 4: Incorrect OTP & Failed Counter ---');
        const wrongVerifyReq = {
            body: {
                twoFactorToken: activeTwoFactorToken,
                code: '000000'
            },
            headers: {},
            socket: { remoteAddress: '127.0.0.1' }
        };
        const wrongVerifyResp = createMockResponse();
        await AdminAuth2FA.verify2FA(wrongVerifyReq, wrongVerifyResp);

        assert(wrongVerifyResp.statusCode === 400, 'Incorrect OTP returns HTTP 400');
        assert(wrongVerifyResp.data.Status === 0, 'Verification status is 0 (Failed)');
        assert(!wrongVerifyResp.data.token, 'No session token issued on incorrect OTP');

        const [adminAfterFail] = await queryAsync("SELECT TwoFactorFailedAttempts FROM AdminUsers WHERE AdminID = ?", [admin.AdminID]);
        assert(adminAfterFail.TwoFactorFailedAttempts === 1, 'TwoFactorFailedAttempts incremented to 1 in database');

        // -----------------------------------------------------------------
        // TEST 5: Successful Verification with Demo OTP
        // -----------------------------------------------------------------
        console.log('\n--- TEST SUITE 5: Successful Verification via Demo OTP ---');
        const correctVerifyReq = {
            body: {
                twoFactorToken: activeTwoFactorToken,
                code: '123456'
            },
            headers: {},
            socket: { remoteAddress: '127.0.0.1' }
        };
        const correctVerifyResp = createMockResponse();
        await AdminAuth2FA.verify2FA(correctVerifyReq, correctVerifyResp);

        assert(correctVerifyResp.statusCode === 200, 'Correct Demo OTP returns HTTP 200');
        assert(correctVerifyResp.data.Status === 1, 'Verification status is 1 (Success)');
        assert(typeof correctVerifyResp.data.token === 'string', 'Full admin session token generated');
        assert(correctVerifyResp.data.userDetails.AdminID === admin.AdminID, 'Admin user details returned');

        // Verify full session token allows access
        const fullTokenDecoded = jwt.verify(correctVerifyResp.data.token, process.env.SECRET_KEY);
        assert(fullTokenDecoded.is2FAPending === undefined, 'Full session token does NOT have is2FAPending');
        assert(fullTokenDecoded.Role === 1, 'Full session token grants Role 1 admin access');

        const [adminAfterSuccess] = await queryAsync("SELECT TwoFactorFailedAttempts, TwoFactorLastUsedTimestamp FROM AdminUsers WHERE AdminID = ?", [admin.AdminID]);
        assert(adminAfterSuccess.TwoFactorFailedAttempts === 0, 'Failed attempts reset to 0 after success');
        assert(Number(adminAfterSuccess.TwoFactorLastUsedTimestamp) > 0, 'TwoFactorLastUsedTimestamp updated to prevent replay');

        // -----------------------------------------------------------------
        // TEST 6: Single-Use & Anti-Replay Protection
        // -----------------------------------------------------------------
        console.log('\n--- TEST SUITE 6: Single-Use & Anti-Replay Protection ---');
        const replayReq = {
            body: {
                twoFactorToken: activeTwoFactorToken,
                code: '123456'
            },
            headers: {},
            socket: { remoteAddress: '127.0.0.1' }
        };
        const replayResp = createMockResponse();
        await AdminAuth2FA.verify2FA(replayReq, replayResp);

        assert(replayResp.statusCode === 400, 'Replay attempt with same token is rejected (HTTP 400)');
        assert(replayResp.data.Status === 0, 'Replay attempt fails Status 0');
        assert(replayResp.data.Message.includes('already been used'), 'Replay returns error: "This Demo OTP has already been used"');
        assert(!replayResp.data.token, 'No token issued on replay');

        // -----------------------------------------------------------------
        // TEST 7: Expired Token Rejection
        // -----------------------------------------------------------------
        console.log('\n--- TEST SUITE 7: Expired Token Rejection ---');
        const expiredPreAuthPayload = {
            AdminID: admin.AdminID,
            EmailID: admin.EmailID,
            is2FAPending: true,
            demoOtpHash: crypto.createHash('sha256').update('123456').digest('hex'),
            demoOtpIssuedAt: Math.floor(Date.now() / 1000) - 400
        };
        // Sign token expired 10 seconds ago
        const expiredToken = jwt.sign(expiredPreAuthPayload, process.env.SECRET_KEY, { expiresIn: -10 });

        const expiredReq = {
            body: {
                twoFactorToken: expiredToken,
                code: '123456'
            },
            headers: {},
            socket: { remoteAddress: '127.0.0.1' }
        };
        const expiredResp = createMockResponse();
        await AdminAuth2FA.verify2FA(expiredReq, expiredResp);

        assert(expiredResp.statusCode === 401, 'Expired two-factor token returns HTTP 401');
        assert(expiredResp.data.Message.includes('expired'), 'Error message states token expired');

        // -----------------------------------------------------------------
        // TEST 8: Rate Limiting & Account Lockout after 5 Failed Attempts
        // -----------------------------------------------------------------
        console.log('\n--- TEST SUITE 8: Rate Limiting & Account Lockout ---');
        // Reset admin
        await queryAsync(
            "UPDATE AdminUsers SET TwoFactorFailedAttempts = 0, TwoFactorLockedUntil = NULL WHERE AdminID = ?",
            [admin.AdminID]
        );

        // Generate a fresh pre-auth token
        const freshLoginResp = createMockResponse();
        await AdminAuth2FA.login(loginReq, freshLoginResp);
        const freshToken = freshLoginResp.data.twoFactorToken;

        // Perform 4 failed attempts
        for (let i = 1; i <= 4; i++) {
            const failResp = createMockResponse();
            await AdminAuth2FA.verify2FA({ body: { twoFactorToken: freshToken, code: '000000' } }, failResp);
            assert(failResp.statusCode === 400, `Failed attempt ${i} rejected with HTTP 400`);
            assert(failResp.data.Message.includes(`${5 - i} attempt(s) remaining`), `Remaining attempts message correct (${5 - i} remaining)`);
        }

        // 5th failed attempt -> Must trigger lockout
        const fifthFailResp = createMockResponse();
        await AdminAuth2FA.verify2FA({ body: { twoFactorToken: freshToken, code: '000000' } }, fifthFailResp);
        assert(fifthFailResp.statusCode === 403, '5th failed attempt triggers HTTP 403 Lockout');
        assert(fifthFailResp.data.Message.includes('Account locked'), 'Message states account locked for 15 minutes');

        // Verify DB lockout
        const [lockedAdmin] = await queryAsync("SELECT TwoFactorFailedAttempts, TwoFactorLockedUntil FROM AdminUsers WHERE AdminID = ?", [admin.AdminID]);
        assert(lockedAdmin.TwoFactorFailedAttempts >= 5, 'TwoFactorFailedAttempts is >= 5');
        assert(lockedAdmin.TwoFactorLockedUntil !== null, 'TwoFactorLockedUntil timestamp is set');
        assert(new Date(lockedAdmin.TwoFactorLockedUntil) > new Date(), 'TwoFactorLockedUntil is in the future');

        // Further verify attempts are blocked
        const blockedVerifyResp = createMockResponse();
        await AdminAuth2FA.verify2FA({ body: { twoFactorToken: freshToken, code: '123456' } }, blockedVerifyResp);
        assert(blockedVerifyResp.statusCode === 403, 'Subsequent verification attempt while locked returns HTTP 403');

        // Further login attempts are also blocked
        const blockedLoginResp = createMockResponse();
        await AdminAuth2FA.login(loginReq, blockedLoginResp);
        assert(blockedLoginResp.statusCode === 403, 'Subsequent login attempt while locked returns HTTP 403');
        assert(blockedLoginResp.data.Message.includes('Account temporarily locked'), 'Login error explains temporary lockout');

        // Reset lockout for cleanup
        await queryAsync(
            "UPDATE AdminUsers SET TwoFactorFailedAttempts = 0, TwoFactorLockedUntil = NULL WHERE AdminID = ?",
            [admin.AdminID]
        );

        // -----------------------------------------------------------------
        // TEST 9: Production Mode Rejection & Guardrails
        // -----------------------------------------------------------------
        console.log('\n--- TEST SUITE 9: Production Mode Rejection ---');
        process.env.NODE_ENV = 'production';
        process.env.ADMIN_2FA_DEMO_OTP = 'true'; // Even if flag is mistakenly true!

        assert(AdminAuth2FA._isDemoOtpEnabled() === false, 'isDemoOtpEnabled strictly evaluates to FALSE in production');

        const prodLoginResp = createMockResponse();
        await AdminAuth2FA.login(loginReq, prodLoginResp);
        assert(prodLoginResp.statusCode === 200, 'Production login succeeds for valid credentials');
        assert(prodLoginResp.data.require2FA === true, '2FA is still mandatory in production');
        assert(prodLoginResp.data.isDemoOtp === undefined, 'isDemoOtp is NOT present in production response');
        assert(prodLoginResp.data.demoOtp === undefined, 'demoOtp is NOT exposed in production response');

        const prodTokenDecoded = jwt.verify(prodLoginResp.data.twoFactorToken, process.env.SECRET_KEY);
        assert(prodTokenDecoded.demoOtpHash === undefined, 'No demoOtpHash embedded in production pre-auth token');

        // Attempting to submit fixed demo OTP '123456' in production must fail
        const prodVerifyResp = createMockResponse();
        await AdminAuth2FA.verify2FA(
            { body: { twoFactorToken: prodLoginResp.data.twoFactorToken, code: '123456' } },
            prodVerifyResp
        );
        assert(prodVerifyResp.statusCode === 400, 'Fixed Demo OTP 123456 is REJECTED in production mode');
        assert(prodVerifyResp.data.Status === 0, 'Verification status is 0');
        assert(!prodVerifyResp.data.token, 'No session token issued in production with demo OTP');

        // -----------------------------------------------------------------
        // Summary & Cleanup
        // -----------------------------------------------------------------
        console.log('\n========================================================================');
        console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('========================================================================\n');

        // Restore original env
        process.env.NODE_ENV = originalNodeEnv;
        process.env.ADMIN_2FA_DEMO_OTP = originalDemoFlag;
        process.env.ADMIN_2FA_FIXED_DEMO_OTP = originalFixedOtp;

        // Reset database record
        await queryAsync(
            "UPDATE AdminUsers SET TwoFactorFailedAttempts = 0, TwoFactorLockedUntil = NULL WHERE AdminID = ?",
            [admin.AdminID]
        );

        pool.end();
        process.exit(failed > 0 ? 1 : 0);

    } catch (err) {
        console.error('Unhandled error during test execution:', err);
        pool.end();
        process.exit(1);
    }
};

runDemoOtpTests();
