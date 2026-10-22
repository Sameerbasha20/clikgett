// Manual cashback review, end to end, against a running backend and the LOCAL database.
//
//   API_URL=http://127.0.0.1:5001/api npm run test:cashback
//
// Switches Cashback Mode to Manual, delivers real test orders through the rider
// flow (assign -> picked up -> arrived -> OTP), then approves one cashback and
// rejects another from the admin side. Everything is put back afterwards.
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
const money = (v) => Math.round(parseFloat(v) * 100) / 100;

(async () => {
    const [user] = await q("SELECT UserID, MobileNumber, WalletAmount FROM Users WHERE MobileNumber = '9999999999' LIMIT 1");
    const [rider] = await q("SELECT AdminID FROM AdminUsers WHERE MobileNumber = '9999999999' AND Role = 2 LIMIT 1");
    const [adminUser] = await q('SELECT AdminID FROM AdminUsers WHERE Role = 1 AND Status = 1 LIMIT 1');
    const [variant] = await q(
        `SELECT V.ProductID, V.VariantID, V.Price, V.OfferPrice, V.AvailableQty FROM ProductVariants V
           JOIN Products P ON P.ProductID = V.ProductID
          WHERE V.Status = 1 AND P.Status = 1 AND V.AvailableQty > 10 AND V.OfferPrice BETWEEN 80 AND 300
          ORDER BY V.VariantID LIMIT 1`
    );
    const [settings] = await q('SELECT CashbackMode, CashbackEnabled, CashbackPercentage, CashbackMaxAmount FROM AdminShopToggleSettings LIMIT 1');
    if (!user || !rider || !adminUser || !variant || !settings) {
        console.error('Missing test fixtures (test user/rider 9999999999, an admin, an in-stock variant priced 80-300).');
        process.exit(1);
    }
    const ADMIN = `token ${sign({ AdminID: adminUser.AdminID })}`;
    const RIDER = `bearer ${sign({ AdminID: rider.AdminID, Role: 2 })}`;
    const walletNow = async () => money((await q('SELECT WalletAmount FROM Users WHERE UserID = ?', [user.UserID]))[0].WalletAmount);

    // A COD order delivered the way a rider does it.
    const deliverOrder = async (qty) => {
        const ins = await q(
            `INSERT INTO Orders (UserID, MobileNumber, SubTotal, GrandTotal, WalletAmount, PaymentMethod, PaymentStatus, PaymentTransactionID,
                                 OrderStatus, DeliveryBoyID, Address, Latitude, Longitude, Distance, CreatedAt)
             VALUES (?, ?, ?, ?, 0, 'COD', 0, 'NA', 8, 0, 'TEST ORDER - cashback review test', 15.8281, 78.0373, 2, NOW())`,
            [user.UserID, user.MobileNumber, variant.OfferPrice * qty, variant.OfferPrice * qty]
        );
        const id = ins.insertId;
        created.push(id);
        await q(`INSERT INTO OrderItems (OrderID, ProductID, VariantID, ProductName, Quantity, Price, OfferPrice, Type)
                 VALUES (?, ?, ?, 'TEST ITEM', ?, ?, ?, 1)`, [id, variant.ProductID, variant.VariantID, qty, variant.Price, variant.OfferPrice]);
        await call('PUT', `/adminorders/updatestatus/${id}`, ADMIN, { OrderStatus: 2 });
        await call('PUT', `/adminorders/assigndeliverboy/${id}`, ADMIN, { DeliveryBoyID: rider.AdminID });
        await call('PUT', `/deliveryboy/updatestatus/${id}`, RIDER, { OrderStatus: 5 });
        await call('PUT', `/deliveryboy/updatestatus/${id}`, RIDER, { OrderStatus: 7, Latitude: 15.8281, Longitude: 78.0373 });
        const [{ OTP }] = await q('SELECT OTP FROM Orders WHERE OrderID = ?', [id]);
        const r = await call('POST', `/deliveryboy/deliver/${id}`, RIDER, { OTP: String(OTP), Latitude: 15.8281, Longitude: 78.0373 });
        const [{ OrderStatus }] = await q('SELECT OrderStatus FROM Orders WHERE OrderID = ?', [id]);
        return { id, delivered: OrderStatus === 1, response: r.json };
    };
    const pendingRow = async (orderId) => (await q('SELECT * FROM CashbackPending WHERE OrderID = ?', [orderId]));

    await q("UPDATE AdminUsers SET DutyStatus = 'ONLINE' WHERE AdminID = ?", [rider.AdminID]);
    try {
        await q("UPDATE AdminShopToggleSettings SET CashbackMode = 'manual', CashbackEnabled = 1, CashbackPercentage = 10, CashbackMaxAmount = 100");

        // ---- Order A: delivered -> waits for review -> approved -> wallet credited
        const before = await walletNow();
        const A = await deliverOrder(2);
        check('order A delivered through the rider flow', A.delivered, JSON.stringify(A.response));
        let rows = await pendingRow(A.id);
        const expected = money(Math.min(variant.OfferPrice * 2 * 0.1, 100));
        check('cashback waits for review instead of reaching the wallet',
            rows.length === 1 && rows[0].Status === 'pending' && (await walletNow()) === before,
            rows[0] && `queued ₹${rows[0].CashbackAmount}, expected about ₹${expected}`);
        check('cashback amount is 10% of the order', rows[0] && Math.abs(money(rows[0].CashbackAmount) - expected) < 0.02);

        let r = await call('GET', '/cashback/pending', ADMIN);
        const listed = r.json && (r.json.data || []).find((x) => x.OrderID === A.id);
        check('review page lists it with customer, phone and amount',
            listed && listed.PendingID > 0 && money(listed.Amount) === money(rows[0].CashbackAmount) && listed.Mobile === user.MobileNumber && typeof listed.UserName === 'string',
            listed && JSON.stringify({ PendingID: listed.PendingID, Amount: listed.Amount, UserName: listed.UserName }));
        check('review page shows the mode and counts', r.json && r.json.CashbackMode === 'manual' && r.json.Counts && r.json.Counts.Pending >= 1);

        r = await call('POST', '/cashback/approve', ADMIN, {});
        check('approve needs an id', r.status === 400);
        r = await call('POST', '/cashback/approve', ADMIN, { PendingID: listed.PendingID });
        const after = await walletNow();
        check('approve credits the wallet once', r.json && r.json.Status === 1 && Math.abs(after - before - money(listed.Amount)) < 0.01,
            `wallet ${before} -> ${after}`);
        const ledger = await q('SELECT Amount, ExpiryDate FROM Wallets WHERE ContentID = ? AND ContentType = 4 AND UserID = ?', [A.id, user.UserID]);
        check('wallet history shows the cashback with an expiry date', ledger.length === 1 && ledger[0].ExpiryDate);
        r = await call('POST', '/cashback/approve', ADMIN, { PendingID: listed.PendingID });
        check('approving twice does not pay twice', r.status === 409 && (await walletNow()) === after);
        r = await call('POST', '/cashback/reject', ADMIN, { PendingID: listed.PendingID, Reason: 'too late' });
        check('an approved cashback cannot be rejected afterwards', r.status === 409);
        r = await call('GET', '/cashback/pending?status=approved', ADMIN);
        check('it moves to the Approved tab', r.json && (r.json.data || []).some((x) => x.OrderID === A.id));

        // ---- Order B: delivered, then returned -> cannot be approved -> rejected with a reason
        const B = await deliverOrder(1);
        rows = await pendingRow(B.id);
        check('order B cashback is queued', B.delivered && rows.length === 1 && rows[0].Status === 'pending');
        await q('UPDATE Orders SET OrderStatus = 6 WHERE OrderID = ?', [B.id]);
        r = await call('POST', '/cashback/approve', ADMIN, { PendingID: rows[0].CashbackPendingID });
        check('cashback for a returned order cannot be approved', r.status === 409 && (await walletNow()) === after, r.json && r.json.Message);
        r = await call('POST', '/cashback/reject', ADMIN, { PendingID: rows[0].CashbackPendingID, Reason: '' });
        check('reject needs a reason', r.status === 400);
        r = await call('POST', '/cashback/reject', ADMIN, { PendingID: rows[0].CashbackPendingID, Reason: 'Order was returned' });
        check('reject keeps the wallet unchanged', r.json && r.json.Status === 1 && (await walletNow()) === after);
        r = await call('GET', '/cashback/pending?status=rejected', ADMIN);
        const rejected = r.json && (r.json.data || []).find((x) => x.OrderID === B.id);
        check('it moves to the Rejected tab with the reason', rejected && rejected.Reason === 'Order was returned');

        // ---- Automatic mode skips the queue
        await q("UPDATE AdminShopToggleSettings SET CashbackMode = 'automatic'");
        const C = await deliverOrder(1);
        const credited = await q('SELECT Amount FROM Wallets WHERE ContentID = ? AND ContentType = 4 AND UserID = ?', [C.id, user.UserID]);
        check('in Automatic mode cashback goes straight to the wallet', C.delivered && (await pendingRow(C.id)).length === 0 && credited.length === 1);
    } catch (err) {
        check('test run completed without errors', false, err.sqlMessage || err.message);
    } finally {
        await q('UPDATE AdminShopToggleSettings SET CashbackMode = ?, CashbackEnabled = ?, CashbackPercentage = ?, CashbackMaxAmount = ?',
            [settings.CashbackMode, settings.CashbackEnabled, settings.CashbackPercentage, settings.CashbackMaxAmount]);
        if (created.length) {
            await q('DELETE FROM CashbackPending WHERE OrderID IN (?)', [created]);
            for (const t of ['OrderStatusTimeline', 'OrderItems', 'DeliveryPoints']) {
                await q(`DELETE FROM ${t} WHERE OrderID IN (?)`, [created]).catch(() => {});
            }
            await q('DELETE FROM Wallets WHERE ContentID IN (?) AND UserID = ?', [created, user.UserID]).catch(() => {});
            await q('DELETE FROM Orders WHERE OrderID IN (?)', [created]);
        }
        await q("DELETE FROM UserNotifications WHERE UserID = ? AND CreatedAt > NOW() - INTERVAL 10 MINUTE", [user.UserID]).catch(() => {});
        await q('UPDATE AdminUsers SET ActiveOrdersCount = 0 WHERE AdminID = ?', [rider.AdminID]);
        await q('UPDATE Users SET WalletAmount = ? WHERE UserID = ?', [user.WalletAmount, user.UserID]);
        await q('UPDATE ProductVariants SET AvailableQty = ? WHERE VariantID = ?', [variant.AvailableQty, variant.VariantID]);
        const passed = results.filter(Boolean).length;
        console.log(`\n${passed}/${results.length} passed against ${BASE}`);
        pool.end();
        process.exit(passed === results.length ? 0 : 1);
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
