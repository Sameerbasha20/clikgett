// Customer account API test against a running backend and the LOCAL database.
//
//   API_URL=http://127.0.0.1:5001/api npm run test:account
//
// Uses the test customer (9999999999) for read-only checks and a throwaway user
// for account deletion; the throwaway user is removed afterwards.
require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');

const BASE = (process.env.API_URL || 'http://127.0.0.1:5001/api').replace(/\/$/, '');
require('./testDatabaseGuard')();

const q = (sql, params = []) => new Promise((res, rej) => pool.query(sql, params, (e, r) => (e ? rej(e) : res(r))));
const sign = (p) => jwt.sign(p, process.env.SECRET_KEY, { expiresIn: 600 });
const call = async (method, path, token, body) => {
    const r = await fetch(BASE + path, {
        method,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: token } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try { json = await r.json(); } catch (e) { /* ignore */ }
    return { status: r.status, json };
};

const results = [];
const check = (name, ok, detail = '') => {
    results.push(ok);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

(async () => {
    const [user] = await q("SELECT UserID FROM Users WHERE MobileNumber = '9999999999' LIMIT 1");
    const CUSTOMER = `bearer ${sign({ UserID: user.UserID })}`;
    const throwawayMobile = '9000000' + String(Date.now()).slice(-3);
    let throwawayId = null;
    try {
        let r = await call('GET', '/account/config');
        check('app config is public', r.json && r.json.Status === 1 && r.json.Config && Array.isArray(r.json.Config.FAQs));
        check('app config has support contacts', !!(r.json.Config.SupportPhone && r.json.Config.SupportEmail));

        r = await call('GET', '/account/referral');
        check('referral details need login', r.status === 401);
        r = await call('GET', '/account/referral', CUSTOMER);
        check('referral details for the customer', r.json && r.json.Status === 1 && r.json.Referral && typeof r.json.Referral.Earned === 'number');

        r = await call('GET', '/account/membership/plans');
        check('membership plans visible to guests', r.json && r.json.Status === 1 && Array.isArray(r.json.Plans) && r.json.Current === null);
        r = await call('POST', '/account/membership/buy', null, { PlanID: 1 });
        check('buying a membership needs login', r.status === 401);
        r = await call('POST', '/account/membership/confirm', CUSTOMER, { RazorpayOrderID: 'order_x', razorpay_payment_id: 'pay_x', razorpay_signature: 'bad' });
        check('membership with a forged payment is refused', r.json && r.json.Status === 0);

        // ---- Account deletion
        const ins = await q(
            "INSERT INTO Users (FirstName, LastName, MobileNumber, EmailID, WalletAmount, Status, CreatedAt) VALUES ('Test', 'Delete', ?, 'delete-test@example.com', 0, 1, NOW())",
            [throwawayMobile]
        );
        throwawayId = ins.insertId;
        const TEMP = `bearer ${sign({ UserID: throwawayId })}`;
        r = await call('GET', '/account/referral', TEMP);
        check('throwaway user can use the app', r.json && r.json.Status === 1);
        r = await call('DELETE', '/users/deleteuser', TEMP);
        check('delete account succeeds', r.json && r.json.Status === 1, r.json && r.json.Message);
        const [row] = await q('SELECT Status, FirstName, MobileNumber, EmailID FROM Users WHERE UserID = ?', [throwawayId]);
        check('personal details are removed', row.Status === 2 && row.MobileNumber !== throwawayMobile && !row.EmailID, JSON.stringify(row));
        r = await call('GET', '/account/referral', TEMP);
        check('deleted account cannot use its old login', r.status === 401);
        const again = await q('SELECT COUNT(*) AS n FROM Users WHERE MobileNumber = ?', [throwawayMobile]);
        check('mobile number is free to sign up again', again[0].n === 0);
    } catch (err) {
        check('test run completed without errors', false, err.sqlMessage || err.message);
    } finally {
        if (throwawayId) await q('DELETE FROM Users WHERE UserID = ?', [throwawayId]);
        const passed = results.filter(Boolean).length;
        console.log(`\n${passed}/${results.length} passed against ${BASE}`);
        pool.end();
        process.exit(passed === results.length ? 0 : 1);
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
