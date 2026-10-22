// End-to-end order lifecycle test against a running backend and the LOCAL database.
//
//   API_URL=http://127.0.0.1:5001/api npm run test:order-flow
//
// Creates throwaway COD orders for the test customer (mobile 9999999999) and the
// test rider (mobile 9999999999), drives them through the real HTTP endpoints as
// admin / rider / customer, checks the rules, then deletes everything it created.
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
const created = [];

async function createTestOrder(user, variant, qty = 1, wallet = 0) {
    const r = await q(
        `INSERT INTO Orders (UserID, MobileNumber, SubTotal, GrandTotal, WalletAmount, PaymentMethod, PaymentStatus, PaymentTransactionID,
                             OrderStatus, DeliveryBoyID, Address, Latitude, Longitude, Distance, CreatedAt)
         VALUES (?, ?, ?, ?, ?, 'COD', 0, 'NA', 8, 0, 'TEST ORDER - automated lifecycle test', 15.8281, 78.0373, 2, NOW())`,
        [user.UserID, user.MobileNumber, variant.OfferPrice * qty, variant.OfferPrice * qty, wallet]
    );
    const id = r.insertId;
    created.push(id);
    await q(`INSERT INTO OrderItems (OrderID, ProductID, VariantID, ProductName, Quantity, Price, OfferPrice, Type)
             VALUES (?, ?, ?, 'TEST ITEM', ?, ?, ?, 1)`, [id, variant.ProductID, variant.VariantID, qty, variant.Price, variant.OfferPrice]);
    await q("UPDATE ProductVariants SET AvailableQty = AvailableQty - ? WHERE VariantID = ?", [qty, variant.VariantID]);
    if (wallet > 0) await q("UPDATE Users SET WalletAmount = WalletAmount - ? WHERE UserID = ?", [wallet, user.UserID]);
    return id;
}

const status = async (id) => (await q("SELECT OrderStatus FROM Orders WHERE OrderID = ?", [id]))[0].OrderStatus;

(async () => {
    const [user] = await q("SELECT UserID, MobileNumber, WalletAmount FROM Users WHERE MobileNumber = '9999999999' LIMIT 1");
    const [rider] = await q("SELECT AdminID FROM AdminUsers WHERE MobileNumber = '9999999999' AND Role = 2 LIMIT 1");
    const [otherRider] = await q("SELECT AdminID FROM AdminUsers WHERE Role = 2 AND Status = 1 AND AdminID <> ? LIMIT 1", [rider ? rider.AdminID : 0]);
    const [adminUser] = await q("SELECT AdminID FROM AdminUsers WHERE Role = 1 AND Status = 1 LIMIT 1");
    const [variant] = await q("SELECT ProductID, VariantID, Price, OfferPrice, AvailableQty FROM ProductVariants WHERE Status = 1 AND AvailableQty > 5 LIMIT 1");
    if (!user || !rider || !adminUser || !variant) {
        console.error('Missing test fixtures (test user/rider 9999999999, an admin, an in-stock variant).');
        process.exit(1);
    }
    const ADMIN = `token ${sign({ AdminID: adminUser.AdminID })}`;
    const RIDER = `bearer ${sign({ AdminID: rider.AdminID, Role: 2 })}`;
    const OTHER = otherRider ? `bearer ${sign({ AdminID: otherRider.AdminID, Role: 2 })}` : null;
    const CUSTOMER = `bearer ${sign({ UserID: user.UserID })}`;
    await q("UPDATE AdminUsers SET DutyStatus = 'ONLINE' WHERE AdminID = ?", [rider.AdminID]);

    try {
        // ---- Happy path: received -> packing -> assigned -> out -> arrived -> delivered
        const A = await createTestOrder(user, variant);
        let r = await call('PUT', `/adminorders/updatestatus/${A}`, ADMIN, { OrderStatus: 2 });
        check('admin "packing" (legacy code 2) -> 9', r.json && r.json.Status === 1 && (await status(A)) === 9, JSON.stringify(r.json));

        r = await call('PUT', `/adminorders/assigndeliverboy/${A}`, ADMIN, { DeliveryBoyID: rider.AdminID });
        check('admin assigns rider -> 2', r.json && r.json.Status === 1 && (await status(A)) === 2, r.json && r.json.Message);

        if (OTHER) {
            r = await call('PUT', `/deliveryboy/updatestatus/${A}`, OTHER, { OrderStatus: 5 });
            check("another rider cannot update this order", r.status === 403 && (await status(A)) === 2, `HTTP ${r.status}`);
            r = await call('GET', `/deliveryboy/orderdetail?OrderID=${A}`, OTHER);
            check("another rider cannot view this order", r.status === 403, `HTTP ${r.status}`);
        }

        r = await call('PUT', `/deliveryboy/updatestatus/${A}`, RIDER, { OrderStatus: 4 });
        check('rider cannot cancel', r.json && r.json.Status === 0 && (await status(A)) === 2, r.json && r.json.Message);

        r = await call('PUT', `/deliveryboy/updatestatus/${A}`, RIDER, { OrderStatus: 1, adminBypass: true });
        check('rider cannot skip to delivered (adminBypass ignored)', r.json && r.json.Status === 0 && (await status(A)) === 2, r.json && r.json.Message);

        r = await call('PUT', `/deliveryboy/updatestatus/${A}`, RIDER, { OrderStatus: 5 });
        check('rider picked up -> 5', r.json && r.json.Status === 1 && (await status(A)) === 5);

        r = await call('PUT', `/deliveryboy/updatestatus/${A}`, RIDER, { OrderStatus: 7, Latitude: 15.8281, Longitude: 78.0373 });
        const [{ OTP }] = await q("SELECT OTP FROM Orders WHERE OrderID = ?", [A]);
        check('rider arrived -> 7 with OTP generated', r.json && r.json.Status === 1 && (await status(A)) === 7 && /^\d{4}$/.test(String(OTP)));

        r = await call('GET', `/orders/myorder/${A}`, CUSTOMER);
        const o = r.json && r.json.Orders;
        check('customer sees OTP, rider and timeline', o && String(o.OTP) === String(OTP) && o.Rider && o.Rider.Name && Array.isArray(o.Timeline) && o.Timeline.length >= 4,
            o ? `rider=${o.Rider && o.Rider.Name} timeline=${o.Timeline && o.Timeline.length}` : '');

        r = await call('GET', `/deliveryboy/orderdetail?OrderID=${A}`, RIDER);
        check('rider cannot read the delivery OTP', r.json && r.json.Status === 1 && r.json.Orders && !('OTP' in r.json.Orders));
        r = await call('GET', '/deliveryboy/getroutes?Type=pending', RIDER);
        check('rider order list hides the OTP', r.json && Array.isArray(r.json.Orders) && r.json.Orders.every((x) => !('OTP' in x)));

        r = await call('POST', `/deliveryboy/deliver/${A}`, RIDER, { OTP: '0000' === String(OTP) ? '1111' : '0000' });
        check('wrong OTP is rejected', r.json && r.json.Status === 0 && (await status(A)) === 7);

        r = await call('PUT', `/deliveryboy/updatestatus/${A}`, RIDER, { OrderStatus: 1 });
        check('delivered without OTP verification is rejected', r.json && r.json.Status === 0 && (await status(A)) === 7);

        r = await call('POST', `/deliveryboy/deliver/${A}`, RIDER, { OTP: String(OTP), Latitude: 15.8281, Longitude: 78.0373 });
        const [delivered] = await q("SELECT OrderStatus, PaymentStatus, deliveredDateTime FROM Orders WHERE OrderID = ?", [A]);
        check('deliver with correct OTP -> 1, COD marked paid', delivered.OrderStatus === 1 && delivered.PaymentStatus == 1 && delivered.deliveredDateTime, JSON.stringify(r.json));

        r = await call('PUT', `/adminorders/updatestatus/${A}`, ADMIN, { OrderStatus: 4 });
        check('delivered order cannot be cancelled', r.json && r.json.Status === 0 && (await status(A)) === 1);

        r = await call('GET', '/deliveryboy/summary', RIDER);
        check('rider summary counts the delivery', r.json && r.json.Status === 1 && r.json.Today && r.json.Today.Delivered >= 1
            && typeof r.json.Today.CashCollected === 'number', r.json && JSON.stringify(r.json.Today));

        const [{ n }] = await q("SELECT COUNT(*) AS n FROM OrderStatusTimeline WHERE OrderID = ?", [A]);
        check('timeline row for every step', n >= 5, `${n} rows`);

        // ---- Legacy two-step delivery used by the current delivery app
        const L = await createTestOrder(user, variant);
        await call('PUT', `/adminorders/assigndeliverboy/${L}`, ADMIN, { DeliveryBoyID: rider.AdminID });
        await call('PUT', `/deliveryboy/updatestatus/${L}`, RIDER, { OrderStatus: 5 });
        await call('PUT', `/deliveryboy/updatestatus/${L}`, RIDER, { OrderStatus: 7, Latitude: 15.8281, Longitude: 78.0373 });
        const [{ OTP: OTP2 }] = await q("SELECT OTP FROM Orders WHERE OrderID = ?", [L]);
        r = await call('POST', '/deliveryboy/verifyotp_order', RIDER, { OrderID: L, OTP: String(OTP2) });
        const r2 = await call('PUT', `/deliveryboy/updatestatus/${L}`, RIDER, { OrderStatus: 1 });
        check('legacy verify-then-deliver still works', r.json.Status === 1 && r2.json.Status === 1 && (await status(L)) === 1);

        // ---- Customer cancel restores stock
        const before = (await q("SELECT AvailableQty FROM ProductVariants WHERE VariantID = ?", [variant.VariantID]))[0].AvailableQty;
        const C = await createTestOrder(user, variant, 2);
        r = await call('PUT', `/orders/cancelorderuser/${C}`, CUSTOMER, { CancellationReason: 'test' });
        const after = (await q("SELECT AvailableQty FROM ProductVariants WHERE VariantID = ?", [variant.VariantID]))[0].AvailableQty;
        check('customer cancel -> 4 and stock restored', r.json.Status === 1 && (await status(C)) === 4 && after === before, `stock ${before} -> ${after}`);
        r = await call('PUT', `/orders/cancelorderuser/${C}`, CUSTOMER, {});
        check('second cancel is refused (no double refund)', r.json.Status === 0);

        // ---- Admin cancel refunds wallet once
        const w0 = parseFloat((await q("SELECT WalletAmount FROM Users WHERE UserID = ?", [user.UserID]))[0].WalletAmount);
        const D = await createTestOrder(user, variant, 1, 10);
        r = await call('PUT', `/adminorders/updatestatus/${D}`, ADMIN, { OrderStatus: 4, CancellationReason: 'Out of stock (test)' });
        const w1 = parseFloat((await q("SELECT WalletAmount FROM Users WHERE UserID = ?", [user.UserID]))[0].WalletAmount);
        check('admin cancel -> 3 (store) and wallet refunded', r.json.Status === 1 && (await status(D)) === 3 && Math.abs(w1 - w0) < 0.001, `wallet ${w0} -> ${w1}`);
        r = await call('PUT', `/adminorders/updatestatus/${D}`, ADMIN, { OrderStatus: 4 });
        const w2 = parseFloat((await q("SELECT WalletAmount FROM Users WHERE UserID = ?", [user.UserID]))[0].WalletAmount);
        check('cancelling again is refused, no second refund', r.json.Status === 0 && Math.abs(w2 - w1) < 0.001);

        // ---- Customer cannot cancel someone else's order / after rider assigned
        const E = await createTestOrder(user, variant);
        await call('PUT', `/adminorders/assigndeliverboy/${E}`, ADMIN, { DeliveryBoyID: rider.AdminID });
        r = await call('PUT', `/orders/cancelorderuser/${E}`, CUSTOMER, {});
        check('customer cannot cancel after rider assigned', r.json.Status === 0 && (await status(E)) === 2);
        await call('PUT', `/adminorders/updatestatus/${E}`, ADMIN, { OrderStatus: 4, CancellationReason: 'cleanup' });
    } catch (err) {
        check('test run completed without errors', false, err.sqlMessage || err.message);
    } finally {
        // Clean up everything this test created
        if (created.length) {
            await q("DELETE FROM OrderStatusTimeline WHERE OrderID IN (?)", [created]);
            await q("DELETE FROM OrderItems WHERE OrderID IN (?)", [created]);
            await q("DELETE FROM Wallets WHERE ContentID IN (?) AND UserID = ?", [created, user.UserID]).catch(() => {});
            await q("DELETE FROM Orders WHERE OrderID IN (?)", [created]);
        }
        await q("DELETE FROM UserNotifications WHERE UserID = ? AND CreatedAt > NOW() - INTERVAL 10 MINUTE", [user.UserID]).catch(() => {});
        await q("UPDATE AdminUsers SET ActiveOrdersCount = 0 WHERE AdminID = ?", [rider.AdminID]);
        // Cashback/refunds from the test orders change the balance; put it back.
        await q("UPDATE Users SET WalletAmount = ? WHERE UserID = ?", [user.WalletAmount, user.UserID]);
        await q("UPDATE ProductVariants SET AvailableQty = ? WHERE VariantID = ?", [variant.AvailableQty, variant.VariantID]);
        const passed = results.filter(Boolean).length;
        console.log(`\n${passed}/${results.length} passed against ${BASE}`);
        pool.end();
        process.exit(passed === results.length ? 0 : 1);
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
