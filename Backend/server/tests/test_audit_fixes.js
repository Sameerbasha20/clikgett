// Fixes from the Nov 2026 audit, against a running backend and the LOCAL database.
//
//   API_URL=http://127.0.0.1:5001/api node server/tests/test_audit_fixes.js
//
// Wallet balance/ledger integrity, admin roles, paged order lists, product search,
// auth-before-validation, rider list errors, removed legacy endpoints.
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
const near = (a, b) => Math.abs((parseFloat(a) || 0) - (parseFloat(b) || 0)) < 0.011;
const TEST_MOBILE = '9999900088';

(async () => {
    const [superAdmin] = await q("SELECT AdminID FROM AdminUsers WHERE Role = 1 AND Status = 1 AND AdminRole = 'super' LIMIT 1");
    const SUPER = `token ${sign({ AdminID: superAdmin.AdminID })}`;
    const [rider] = await q('SELECT AdminID FROM AdminUsers WHERE Role = 2 AND Status = 1 LIMIT 1');
    const RIDER = `bearer ${sign({ AdminID: rider.AdminID })}`;
    const stamp = Date.now();
    const created = { users: [], admins: [] };

    try {
        // ---------- Wallet: balance and ledger move together ----------
        const u = await q("INSERT INTO Users (MobileNumber, FirstName, WalletAmount, Status) VALUES (?, 'Wallet Test', 0, 1)", [TEST_MOBILE]);
        const userId = u.insertId;
        created.users.push(userId);
        const ledger = async () => {
            const [row] = await q(`SELECT ROUND(U.WalletAmount, 2) AS bal,
                     ROUND(IFNULL((SELECT SUM(CASE WHEN Credited_Debited = 1 THEN Amount ELSE -Amount END) FROM Wallets W WHERE W.UserID = U.UserID), 0), 2) AS led
                FROM Users U WHERE U.UserID = ?`, [userId]);
            return row;
        };
        let r = await call('POST', '/adminuser/creditdebitwallet', SUPER, { UserID: userId, Amount: 100, Credited_Debited: 1, Description: 'test credit' });
        let w = await ledger();
        check('admin credit: balance and ledger both 100', r.json && r.json.Status === 1 && near(w.bal, 100) && near(w.led, 100), JSON.stringify(w));
        r = await call('POST', '/adminuser/creditdebitwallet', SUPER, { UserID: userId, Amount: 500, Credited_Debited: 2 });
        w = await ledger();
        check('debit above the balance is refused, nothing written', r.status === 400 && near(w.bal, 100) && near(w.led, 100));
        // Ten parallel debits of 15 from 100: at most 6 succeed, and the balance never goes negative.
        const runs = await Promise.all(Array.from({ length: 10 }, () =>
            call('POST', '/adminuser/creditdebitwallet', SUPER, { UserID: userId, Amount: 15, Credited_Debited: 2 })));
        const ok = runs.filter((x) => x.json && x.json.Status === 1).length;
        w = await ledger();
        check('parallel debits: balance = ledger, never below 0', near(w.bal, w.led) && w.bal >= 0 && ok <= 6 && near(w.bal, 100 - 15 * ok),
            `${ok} succeeded, balance ${w.bal}, ledger ${w.led}`);
        r = await call('GET', '/admin-wallet-check?days=1', SUPER);
        check('wallet check finds no mismatch for this account', r.json && !(r.json.BalanceMismatch || []).some((m) => m.UserID === userId));

        // ---------- Customer profile for admins ----------
        await q("UPDATE Users SET OTP = '9999', FCMToken = 'test-push-token', DateOfBirth = '1995-03-14' WHERE UserID = ?", [userId]).catch(() => {});
        r = await call('GET', `/adminusers/customer-full-details/${userId}`, SUPER);
        const prof = (r.json && r.json.Profile) || {};
        check('customer profile never includes the login OTP or push token', r.json && r.json.Status === 1 && !('OTP' in prof) && !('FCMToken' in prof));
        check('customer profile has birthday and app-installed flag', String(prof.DateOfBirth || '').startsWith('1995-03') && r.json.DeviceInfo.AppInstalled === true);
        check('customer profile lists carts, requests, feedback and searches',
            ['CurrentCart', 'AbandonedCarts', 'PhotoOrders', 'Enquiries', 'ProductRequests', 'Feedback', 'RecentSearches'].every((k) => Array.isArray(r.json[k]))
            && 'CancelledByStore' in r.json.OrderStats && 'CancelledByCustomer' in r.json.OrderStats);

        // ---------- Admin roles ----------
        const mk = async (role) => {
            const ins = await q("INSERT INTO AdminUsers (FirstName, LastName, EmailID, Password, Role, Status, ProfilePic, AdminRole) VALUES ('Role', 'Test', ?, 'NA', 1, 1, 'NA', ?)",
                [`role-${role}-${stamp}@example.com`, role]);
            created.admins.push(ins.insertId);
            return { id: ins.insertId, token: `token ${sign({ AdminID: ins.insertId })}` };
        };
        const catalog = await mk('catalog');
        const finance = await mk('finance');
        const operations = await mk('operations');
        r = await call('POST', '/adminuser/creditdebitwallet', catalog.token, { UserID: userId, Amount: 1, Credited_Debited: 1 });
        check('catalog admin cannot adjust wallets (403)', r.status === 403);
        r = await call('GET', '/adminproducts/out-of-stock', catalog.token);
        check('catalog admin can open catalog pages', r.status === 200 && r.json.Status === 1);
        r = await call('GET', '/adminorders/pastorders?page=1&pageSize=5', catalog.token);
        check('catalog admin cannot list orders (403)', r.status === 403);
        r = await call('GET', `/adminuser/wallettransactions/${userId}`, finance.token);
        check('finance admin can read wallet transactions', r.status === 200);
        r = await call('GET', '/adminproducts/out-of-stock', finance.token);
        check('finance admin cannot open catalog pages (403)', r.status === 403);
        r = await call('GET', '/adminorders/pastorders?page=1&pageSize=5', operations.token);
        check('operations admin can list orders', r.status === 200 && r.json.Status === 1);
        r = await call('GET', '/adminuser/settingslist', operations.token);
        check('only super admins open settings (403)', r.status === 403);
        r = await call('GET', '/adminuser/global-search?query=milk', catalog.token);
        check('every role can use the top-bar search', r.status === 200);
        r = await call('GET', '/adminorders/dashboard', finance.token);
        check('every role can open the dashboard', r.status === 200);
        r = await call('PUT', `/adminusers/updateadminuser/${catalog.id}`, SUPER, { adminRole: 'nonsense' });
        check('unknown role is refused', r.json && r.json.Status === 0);
        r = await call('PUT', `/adminusers/updateadminuser/${catalog.id}`, SUPER, { adminRole: 'marketing' });
        const [roleRow] = await q('SELECT AdminRole FROM AdminUsers WHERE AdminID = ?', [catalog.id]);
        check('super admin changes a role', r.json && r.json.Status === 1 && roleRow.AdminRole === 'marketing');
        r = await call('PUT', `/adminusers/updateadminuser/${superAdmin.AdminID}`, SUPER, { adminRole: 'catalog' });
        check('a super admin cannot demote themselves', r.json && r.json.Status === 0);
        r = await call('GET', '/adminuser/roles', SUPER);
        check('roles list for the admin page', r.json && r.json.Status === 1 && r.json.Roles.length === 5);

        // ---------- Paged past orders ----------
        r = await call('GET', '/adminorders/pastorders?page=1&pageSize=5', SUPER);
        const total = r.json && r.json.Total;
        check('past orders page 1: 5 rows and a total', r.json && r.json.Status === 1 && r.json.Orders.length === Math.min(5, total) && total >= 0);
        const r2 = await call('GET', '/adminorders/pastorders?page=2&pageSize=5', SUPER);
        const overlap = r.json.Orders.some((o) => r2.json.Orders.some((p) => p.OrderID === o.OrderID));
        check('page 2 has different orders', total <= 5 || (!overlap && r2.json.Orders.length > 0));
        r = await call('GET', '/adminorders/pastorders?page=1&pageSize=1000', SUPER);
        check('page size is capped at 100', r.json && r.json.PageSize === 100);
        r = await call('GET', '/adminorders/pastorders', SUPER);
        check('without page the old full list still works', r.json && r.json.Status === 1 && r.json.Total === undefined);

        // ---------- Product search ----------
        const [prod] = await q(`SELECT P.ProductID, P.ProductName FROM Products P JOIN ProductVariants V ON V.ProductID = P.ProductID AND V.status = 1
                                 WHERE P.Status = 1 AND P.ProductName REGEXP '^[A-Za-z]+ [A-Za-z]+' LIMIT 1`);
        const words = prod.ProductName.split(/\s+/);
        r = await call('GET', `/adminproducts/search/${encodeURIComponent(`${words[1]} ${words[0]}`.toLowerCase())}`, SUPER);
        const hit = r.json && (r.json.Products || []).find((p) => p.ProductID === prod.ProductID);
        check('search matches words in any order', !!hit, `${words[1]} ${words[0]}`);
        check('search returns variants and the category', hit && Array.isArray(hit.ProductVariants) && hit.ProductVariants.length > 0 && 'CategoryName' in hit);
        check('search answers under Products, Product and data', r.json && r.json.Product && r.json.data && r.json.Product.length === r.json.Products.length);

        // Customer search: every word, any order ("freedom bottle" finds "Freedom ... Oil Bottle").
        r = await call('GET', `/products/search/${encodeURIComponent(`${words[1]} ${words[0]}`)}`, null);
        check('customer search matches words in any order', r.json && (r.json.Products || []).some((p) => p.ProductID === prod.ProductID));
        r = await call('GET', `/products/search/${encodeURIComponent(`zzqqxx ${words[0]}`)}`, null);
        check('customer search needs every word to match', r.json && (r.json.Products || []).length === 0);

        // ---------- Auth before validation, clearer errors, removed endpoints ----------
        for (const p of ['/categories/addcategory', '/subcategories/add', '/adminproducts/addproduct', '/adminproducts/addvariant', '/promocodes/admin/add']) {
            r = await call('POST', p, null, {});
            check(`POST ${p} without a token -> 401 (not the field list)`, r.status === 401);
        }
        r = await call('POST', '/address/addaddress', null, {});
        check('POST /address/addaddress without a token -> 401', r.status === 401);
        r = await call('GET', '/deliveryboy/getroutes', RIDER);
        check('rider list without Type -> 400 with a clear message', r.status === 400 && /Type/.test(r.json.Message));
        r = await call('GET', '/admin-home-sections/sections?page=abc&limit=5', SUPER);
        check('home sections with a bad page number still load', r.status === 200 && r.json && (r.json.Status === 1 || r.json.status === 1));
        for (const p of ['/users/updateproducts', '/users/datatransfer']) {
            r = await call('GET', p, SUPER);
            check(`GET ${p} is gone (404)`, r.status === 404);
        }
        r = await call('GET', '/health');
        check('health answers', r.status === 200 && r.json && r.json.service === 'clikgett-backend');
    } finally {
        if (created.admins.length) {
            await q('DELETE FROM AdminAuthAuditLogs WHERE AdminID IN (?)', [created.admins]).catch(() => {});
            await q('DELETE FROM AdminUsers WHERE AdminID IN (?)', [created.admins]);
        }
        if (created.users.length) {
            await q('DELETE FROM Wallets WHERE UserID IN (?)', [created.users]);
            await q('DELETE FROM Users WHERE UserID IN (?)', [created.users]);
        }
        const passed = results.filter(Boolean).length;
        console.log(`\n${passed}/${results.length} passed against ${BASE}`);
        pool.end();
        process.exit(passed === results.length ? 0 : 1);
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
