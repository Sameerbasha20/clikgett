// Admin panel API test against a running backend and the LOCAL database.
//
//   API_URL=http://127.0.0.1:5001/api npm run test:admin
//
// Dashboard, new-order feed, membership plans and admin password hashing.
// Creates a throwaway admin and a throwaway plan, removes both afterwards.
require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');

const BASE = (process.env.API_URL || 'http://127.0.0.1:5001/api').replace(/\/$/, '');
const dbHost = String(process.env.DB_HOST || process.env.HOST || '');
if (!/^(127\.0\.0\.1|localhost|mysql)$/.test(dbHost.replace(/"/g, ''))) {
    console.error(`Refusing to run: DB host "${dbHost}" is not local.`);
    process.exit(1);
}

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
    const [adminUser] = await q('SELECT AdminID FROM AdminUsers WHERE Role = 1 AND Status = 1 LIMIT 1');
    const ADMIN = `token ${sign({ AdminID: adminUser.AdminID })}`;
    let tempAdminId = null;
    let tempPlanId = null;
    let oosVariant = null;
    let tempSaleId = null;
    const [storeMode] = await q('SELECT StoreMode, StoreModeUntil FROM AdminShopToggleSettings LIMIT 1');
    const email = `admin-test-${Date.now()}@example.com`;
    try {
        // ---- Dashboard
        let r = await call('GET', '/adminorders/dashboard', ADMIN);
        const d = r.json || {};
        check('dashboard loads', d.Status === 1 && d.Today && d.Pipeline && d.Riders && Array.isArray(d.LowStock));
        check('dashboard has 7 days of history', Array.isArray(d.Last7Days) && d.Last7Days.length === 7);

        // ---- New-order feed
        r = await call('GET', '/adminorders/new-since', ADMIN);
        const latest = r.json && r.json.LatestOrderID;
        check('new-order feed returns the latest order id', typeof latest === 'number');
        if (latest > 0) {
            r = await call('GET', `/adminorders/new-since?after=${latest - 1}`, ADMIN);
            check('orders after a given id are returned', r.json && r.json.Orders.length === 1 && r.json.Orders[0].OrderID === latest);
            r = await call('GET', `/adminorders/new-since?after=${latest}`, ADMIN);
            check('no new orders after the latest id', r.json && r.json.Orders.length === 0);
        }

        // ---- Membership plans
        r = await call('POST', '/membership/plans/save', ADMIN, { PlanName: '', Price: 0, DurationDays: 0 });
        check('invalid plan is refused', r.status === 400 && r.json.Status === 0);
        r = await call('POST', '/membership/plans/save', ADMIN, { PlanName: 'TEST PLAN', Price: 49, DurationDays: 7, FreeDelivery: true, ExtraCashbackPercentage: 1, Status: 0 });
        tempPlanId = r.json && r.json.PlanID;
        check('plan created (inactive)', r.json && r.json.Status === 1 && tempPlanId > 0);
        r = await call('GET', '/account/membership/plans');
        check('inactive plan is hidden from customers', r.json && !r.json.Plans.some((p) => p.PlanID === tempPlanId));
        r = await call('GET', '/membership/members', ADMIN);
        check('member list loads', r.json && r.json.Status === 1 && Array.isArray(r.json.Members));

        // ---- Admin password hashing (old plain-text rows upgrade on login)
        const ins = await q("INSERT INTO AdminUsers (FirstName, LastName, EmailID, Password, Role, Status, ProfilePic) VALUES ('Test', 'Admin', ?, 'PlainPass123', 1, 1, 'NA')", [email]);
        tempAdminId = ins.insertId;
        r = await call('POST', '/adminuser/login', null, { EmailID: email, Password: 'PlainPass123' });
        const [row] = await q('SELECT Password FROM AdminUsers WHERE AdminID = ?', [tempAdminId]);
        check('old plain-text password still logs in', r.json && r.json.Status === 1, r.json && r.json.Message);
        check('password is stored hashed after login', String(row.Password).startsWith('scrypt$'));
        r = await call('POST', '/adminuser/login', null, { EmailID: email, Password: 'PlainPass123' });
        check('hashed password logs in', r.json && r.json.Status === 1);
        r = await call('POST', '/adminuser/login', null, { EmailID: email, Password: 'wrong-password' });
        check('wrong password is refused', r.json && r.json.Status === 0);

        r = await call('PUT', `/adminusers/updateadminuser/${tempAdminId}`, ADMIN, { password: 'short' });
        check('short new password is refused', r.json && r.json.Status === 0);
        r = await call('DELETE', `/adminusers/deleteadminuser/${adminUser.AdminID}`, ADMIN);
        check('admin cannot remove their own account', r.json && r.json.Status === 0);

        // ---- Out of stock list: a pack leaves it as soon as it has stock
        r = await call('GET', '/adminproducts/out-of-stock', ADMIN);
        const oos = r.json && r.json.Items && r.json.Items[0];
        check('out-of-stock list loads', r.json && r.json.Status === 1 && typeof r.json.Count === 'number');
        if (oos) {
            oosVariant = { id: oos.VariantID, qty: oos.AvailableQty };
            r = await call('PUT', `/adminproducts/restock/${oos.VariantID}`, ADMIN, { AvailableQty: 0 });
            check('restock needs a quantity above 0', r.json && r.json.Status === 0);
            r = await call('PUT', `/adminproducts/restock/${oos.VariantID}`, ADMIN, { AvailableQty: 7 });
            const after = await call('GET', '/adminproducts/out-of-stock', ADMIN);
            check('restocked pack leaves the out-of-stock list',
                r.json && r.json.Status === 1 && !after.json.Items.some((i) => i.VariantID === oos.VariantID));
        }

        // ---- Bulk deals and flash-sale prices shown to customers
        r = await call('GET', '/products/bulk-deals');
        check('bulk deals list products with bulk tiers', r.json && r.json.Status === 1 && r.json.Products.every((p) =>
            (p.BulkTiers && p.BulkTiers.length) || (p.ProductVariants || []).some((v) => parseFloat(v.Buy2Price) > 0)));

        const [prod] = await q(`SELECT V.ProductID, V.OfferPrice FROM ProductVariants V JOIN Products P ON P.ProductID = V.ProductID
                                 WHERE V.status = 1 AND P.Status = 1 AND V.OfferPrice >= 20 AND V.AvailableQty > 0 LIMIT 1`);
        const sale = await q(`INSERT INTO Sales (SaleName, Description, DiscountType, DiscountValue, StartDate, EndDate, Status, CreatedAt)
                              VALUES ('TEST DEAL', 'automated test', 'percentage', 10, NOW() - INTERVAL 1 HOUR, NOW() + INTERVAL 1 HOUR, 1, NOW())`);
        tempSaleId = sale.insertId;
        await q('INSERT INTO SaleItems (SaleID, ProductID, CreatedAt) VALUES (?, ?, NOW())', [tempSaleId, prod.ProductID]);
        r = await call('GET', `/products/detail/${prod.ProductID}`);
        const detail = r.json && r.json.Products;
        const expected = Math.round(parseFloat(prod.OfferPrice) * 0.9 * 100) / 100;
        check('product shows the running deal and its sale price',
            detail && detail.Deal && detail.Deal.SaleName === 'TEST DEAL' && detail.ProductVariants.some((v) => Math.abs(v.SalePrice - expected) < 0.01),
            detail && JSON.stringify(detail.ProductVariants.map((v) => v.SalePrice)));

        // ---- Store open / close override
        r = await call('PUT', '/admintiming/store-mode', ADMIN, { Mode: 'SOMETIMES' });
        check('unknown store mode is refused', r.status === 400);
        r = await call('PUT', '/admintiming/store-mode', ADMIN, { Mode: 'CLOSED' });
        let timing = await call('GET', '/orders/checktiming');
        check('admin can close the store', r.json && r.json.Status === 1 && timing.json.status === 0);
        r = await call('PUT', '/admintiming/store-mode', ADMIN, { Mode: 'OPEN' });
        timing = await call('GET', '/orders/checktiming');
        check('admin can open the store', r.json && r.json.Status === 1 && timing.json.status === 1);
        r = await call('PUT', '/admintiming/store-mode', ADMIN, { Mode: 'CLOSED', UntilNextChange: true });
        const st = r.json && r.json.State;
        const [hasTimings] = await q('SELECT COUNT(*) AS n FROM OrderTimings WHERE Status = 1');
        check('closing until the next scheduled change sets an end time',
            st && st.isOpen === false && (hasTimings.n === 0 || !!st.modeUntil), st && JSON.stringify(st.modeUntil));
        await q("UPDATE AdminShopToggleSettings SET StoreModeUntil = NOW() - INTERVAL 1 MINUTE");
        r = await call('GET', '/admintiming/shopstatus', ADMIN);
        check('an expired override goes back to the timings', r.json && r.json.State && r.json.State.mode === 'AUTO');
        r = await call('PUT', '/admintiming/store-mode', ADMIN, { Mode: 'AUTO' });
        timing = await call('GET', '/orders/checktiming');
        check('following the timings matches the schedule', r.json && r.json.State && timing.json.status === (r.json.State.scheduleOpen ? 1 : 0));
    } catch (err) {
        check('test run completed without errors', false, err.sqlMessage || err.message);
    } finally {
        if (storeMode) await q('UPDATE AdminShopToggleSettings SET StoreMode = ?, StoreModeUntil = ?', [storeMode.StoreMode, storeMode.StoreModeUntil]);
        if (tempAdminId) {
            await q('DELETE FROM AdminAuthAuditLogs WHERE AdminID = ?', [tempAdminId]).catch(() => {});
            await q('DELETE FROM AdminUsers WHERE AdminID = ?', [tempAdminId]);
        }
        if (tempPlanId) await q('DELETE FROM MembershipPlans WHERE PlanID = ?', [tempPlanId]);
        if (oosVariant) await q('UPDATE ProductVariants SET AvailableQty = ? WHERE VariantID = ?', [oosVariant.qty, oosVariant.id]);
        if (tempSaleId) {
            await q('DELETE FROM SaleItems WHERE SaleID = ?', [tempSaleId]);
            await q('DELETE FROM Sales WHERE SaleID = ?', [tempSaleId]);
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
