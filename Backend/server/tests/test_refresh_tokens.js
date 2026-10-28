'use strict';
// Short login tokens + refresh tokens (utils/authTokens.js), through the real login
// endpoints. Login codes are created with services/LoginOtp.js, so no SMS is sent.
//   API_URL=http://127.0.0.1:5001/api node server/tests/test_refresh_tokens.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const jwt = require('jsonwebtoken');

const dbHost = String(process.env.DB_HOST || process.env.HOST || '');
if (/rds\.amazonaws\.com/i.test(dbHost)) {
    console.error('Refusing to run against RDS.');
    process.exit(1);
}

const pool = require('../utils/db');
const LoginOtp = require('../services/LoginOtp');

const BASE = (process.env.API_URL || 'http://127.0.0.1:5000/api').replace(/\/$/, '');
let passed = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
    if (ok) { passed++; console.log(`  PASS  ${name}`); } else { failed++; console.log(`  FAIL  ${name} ${detail}`); }
};
const q = (sql, params = []) => new Promise((resolve, reject) => pool.query(sql, params, (e, r) => (e ? reject(e) : resolve(r))));
const call = async (method, p, { token, body, headers = {} } = {}) => {
    const res = await fetch(BASE + p, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
};
const lifetime = (token) => {
    const d = jwt.decode(token) || {};
    return (d.exp || 0) - (d.iat || 0);
};
const codeFor = async (audience, mobile) => {
    // This suite logs in more often than the hourly code limit allows.
    await q('UPDATE LoginOtps SET LastSentAt = NOW() - INTERVAL 1 MINUTE, SendCount = 0, SendWindowStart = NULL WHERE MobileNumber = ?', [mobile]);
    const r = await LoginOtp.issue(audience, mobile);
    if (!r.ok) throw new Error(`could not create a login code: ${r.message}`);
    return r.code;
};
const NEW_APP = { 'X-Auth-Refresh': '1' };

(async () => {
    const [buyer] = await q("SELECT UserID, MobileNumber FROM Users WHERE Status = 1 AND MobileNumber REGEXP '^[0-9]{10}$' ORDER BY UserID DESC LIMIT 1");
    const customerLogin = async (headers) => call('POST', '/users/login/verifyotp', {
        headers, body: { MobileNumber: buyer.MobileNumber, OTP: await codeFor('customer', buyer.MobileNumber) },
    });

    // ---- Old app (no header): one-year token as before, no refresh token
    const old = await customerLogin({});
    check('old app still logs in', old.data.Status === 1 && !!old.data.token, JSON.stringify(old.data).slice(0, 120));
    check('old app keeps its long token, no refresh token', lifetime(old.data.token) >= 360 * 86400 && !old.data.RefreshToken);

    // ---- New app: 1-hour token + refresh token
    const login = await customerLogin(NEW_APP);
    check('new app gets a 1-hour login token', login.data.Status === 1 && lifetime(login.data.token) === 3600 && login.data.ExpiresIn === 3600,
        `lifetime ${lifetime(login.data.token)}`);
    check('new app gets a refresh token', typeof login.data.RefreshToken === 'string' && login.data.RefreshToken.length >= 40);
    const [stored] = await q('SELECT TokenHash FROM AuthRefreshTokens WHERE TokenHash = SHA2(?, 256)', [login.data.RefreshToken]);
    check('only a hash of the refresh token is stored', !!stored && stored.TokenHash !== login.data.RefreshToken);
    check('the short token works', (await call('GET', '/orders/currentorders', { token: login.data.token })).status === 200);

    // ---- Refresh rotates the pair
    const r1 = await call('POST', '/auth/refresh', { body: { RefreshToken: login.data.RefreshToken } });
    check('refresh gives a new pair', r1.data.Status === 1 && r1.data.token && r1.data.RefreshToken && r1.data.RefreshToken !== login.data.RefreshToken);
    check('the refreshed token works', (await call('GET', '/orders/currentorders', { token: r1.data.token })).status === 200);
    const race = await call('POST', '/auth/refresh', { body: { RefreshToken: login.data.RefreshToken } });
    check('a second refresh right away is a harmless race (409)', race.status === 409 && race.data.Code === 'REFRESH_RACE');
    check('...and does not end the login', (await call('POST', '/auth/refresh', { body: { RefreshToken: r1.data.RefreshToken } })).data.Status === 1);

    // ---- Reuse of an old refresh token ends that login everywhere
    const login2 = await customerLogin(NEW_APP);
    const a = await call('POST', '/auth/refresh', { body: { RefreshToken: login2.data.RefreshToken } });
    await q('UPDATE AuthRefreshTokens SET RevokedAt = NOW() - INTERVAL 5 MINUTE WHERE TokenHash = SHA2(?, 256)', [login2.data.RefreshToken]);
    const stolen = await call('POST', '/auth/refresh', { body: { RefreshToken: login2.data.RefreshToken } });
    check('reusing a used refresh token is refused', stolen.status === 401);
    check('...and the current refresh token of that login stops working too',
        (await call('POST', '/auth/refresh', { body: { RefreshToken: a.data.RefreshToken } })).status === 401);

    // ---- Expired, unknown, logout
    const login3 = await customerLogin(NEW_APP);
    await q('UPDATE AuthRefreshTokens SET ExpiresAt = NOW() - INTERVAL 1 SECOND WHERE TokenHash = SHA2(?, 256)', [login3.data.RefreshToken]);
    check('an expired refresh token is refused', (await call('POST', '/auth/refresh', { body: { RefreshToken: login3.data.RefreshToken } })).status === 401);
    check('an unknown refresh token is refused', (await call('POST', '/auth/refresh', { body: { RefreshToken: 'x'.repeat(43) } })).status === 401);
    check('a login token is not a refresh token', (await call('POST', '/auth/refresh', { body: { RefreshToken: login.data.token } })).status === 401);
    const login4 = await customerLogin(NEW_APP);
    check('logout succeeds', (await call('POST', '/auth/logout', { body: { RefreshToken: login4.data.RefreshToken } })).data.Status === 1);
    check('after logout the refresh token is refused', (await call('POST', '/auth/refresh', { body: { RefreshToken: login4.data.RefreshToken } })).status === 401);

    // ---- An expired login token is refused (the app must refresh)
    const expired = jwt.sign({ UserID: buyer.UserID }, process.env.SECRET_KEY, { expiresIn: -10 });
    const exp = await call('GET', '/orders/currentorders', { token: expired });
    check('expired login token -> 401 "Token expired"', exp.status === 401 && exp.data.Message === 'Token expired');

    // ---- Rider login
    const [rider] = await q("SELECT AdminID, MobileNumber FROM AdminUsers WHERE Role = 2 AND MobileNumber REGEXP '^[0-9]{10}$' LIMIT 1");
    if (rider) {
        const rl = await call('POST', '/deliveryboy/login', {
            headers: NEW_APP, body: { MobileNumber: rider.MobileNumber, OTP: await codeFor('rider', rider.MobileNumber) },
        });
        check('rider app gets a 1-hour token + refresh token', rl.data.Status === 1 && lifetime(rl.data.token) === 3600 && !!rl.data.RefreshToken,
            JSON.stringify(rl.data).slice(0, 160));
        const rr = await call('POST', '/auth/refresh', { body: { RefreshToken: rl.data.RefreshToken } });
        const claims = jwt.decode(rr.data.token) || {};
        check('rider refresh keeps the rider identity', rr.data.Status === 1 && claims.AdminID === rider.AdminID && Number(claims.Role) === 2);
        check('refreshed rider token works', (await call('GET', '/deliveryboy/duty-status', { token: rr.data.token })).status === 200);
        await q("UPDATE AuthRefreshTokens SET RevokedAt = NOW(), RevokeReason = 'test' WHERE SubjectType = 'RIDER' AND SubjectID = ? AND RevokedAt IS NULL", [rider.AdminID]);
    } else {
        console.log('  SKIP  no rider in the database');
    }

    await q("UPDATE AuthRefreshTokens SET RevokedAt = NOW(), RevokeReason = 'test' WHERE SubjectType = 'USER' AND SubjectID = ? AND RevokedAt IS NULL", [buyer.UserID]);
    console.log(`\n${passed}/${passed + failed} passed against ${BASE}`);
    process.exit(failed ? 1 : 0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
