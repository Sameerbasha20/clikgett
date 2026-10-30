// Customer rewards, savings total, birthday, typed photo orders and product keywords,
// against a running backend and the LOCAL database.
//
//   API_URL=http://127.0.0.1:5001/api node server/tests/test_customer_rewards.js
//
// Uses throwaway customers (removed afterwards). The comeback rule is set (in the
// database) to 3650 inactive days so only the throwaway customer's 11-year-old order qualifies, and the
// admin's reward settings are put back at the end.
require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
const { indiaToday } = require('../services/CustomerRewards');

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

const ledgerMatches = async (userId) => {
    const [row] = await q(
        `SELECT ROUND(U.WalletAmount, 2) AS kept,
                ROUND(COALESCE((SELECT SUM(CASE WHEN Credited_Debited = 1 THEN Amount ELSE -Amount END) FROM Wallets WHERE UserID = U.UserID), 0), 2) AS ledger
           FROM Users U WHERE U.UserID = ?`, [userId]);
    return Number(row.kept) === Number(row.ledger);
};

(async () => {
    const [adminUser] = await q('SELECT AdminID FROM AdminUsers WHERE Role = 1 AND Status = 1 LIMIT 1');
    const ADMIN = `token ${sign({ AdminID: adminUser.AdminID })}`;
    const [saved] = await q('SELECT * FROM CustomerRewardSettings WHERE ID = 1');
    const users = [];
    const orders = [];
    const photoRequests = [];
    let product = null;
    const newUser = async (extra = {}) => {
        const mobile = '9100' + String(Date.now() + users.length).slice(-6);
        const ins = await q('INSERT INTO Users SET ?', [{ FirstName: 'Reward', LastName: 'Test', MobileNumber: mobile, WalletAmount: 0, Status: 1, ...extra }]);
        users.push(ins.insertId);
        return { id: ins.insertId, token: `bearer ${sign({ UserID: ins.insertId })}` };
    };
    try {
        // ---- Admin settings
        let r = await call('GET', '/account/rewards/settings');
        check('reward settings need an admin', r.status === 401 || r.status === 403);
        r = await call('GET', '/account/rewards/settings', ADMIN);
        check('admin reads reward settings', r.json && r.json.Status === 1 && r.json.Settings && r.json.Settings.ID === 1);
        r = await call('PUT', '/account/rewards/settings', ADMIN, { ...saved, ComebackValidHours: 0 });
        check('validity of 0 hours is refused', r.status === 400);
        r = await call('PUT', '/account/rewards/settings', ADMIN, {
            ComebackEnabled: 1, ComebackInactiveDays: 7, ComebackAmount: 25, ComebackValidHours: 24,
            BirthdayEnabled: 1, BirthdayAmount: 50, BirthdayValidDays: 7,
        });
        check('admin saves reward settings', r.json && r.json.Status === 1, r.json && r.json.Message);
        // Beyond what the admin may set, so no other local customer qualifies.
        await q('UPDATE CustomerRewardSettings SET ComebackInactiveDays = 3650 WHERE ID = 1');

        // ---- Comeback cash
        const quiet = await newUser();
        const ord = await q(
            `INSERT INTO Orders (MobileNumber, CancellationReason, City, CartID, UserID, PromoCode, SubTotal, TaxAmount, PromoAmount,
                DeliverCharges, GrandTotal, PaymentMethod, Address, FlatNo, LandMark, Latitude, Longitude, PaymentStatus,
                PaymentTransactionID, OrderStatus, DeliveryBoyID, RazorpayOrderID, Discount, OrderType, WalletAmount, TipAmount,
                Distance, ScheduleStatus, TotalItemQuantity, CreatedAt)
             VALUES ('', 'NA', 'NA', 0, ?, 'NA', 160, 0, 0, 0, 155, 'COD', 'Test', '1', 'NA', 0, 0, 1, 'TEST', 1, 0, 'NA', 5,
                'Delivery', 0, 0, 1, 'Immediate', 2, NOW() - INTERVAL 4000 DAY)`, [quiet.id]);
        orders.push(ord.insertId);
        await q(`INSERT INTO OrderItems (OrderID, ProductID, VariantID, ProductName, Quantity, Price, OfferPrice, metrictype, metricvalue, Type, ImageUrl)
                 VALUES (?, 0, 0, 'Test item', 2, 100, 80, 'g', '1', 1, ''), (?, 0, 0, 'Old item', 1, 50, 0, 'g', '1', 1, '')`,
        [ord.insertId, ord.insertId]);

        r = await call('POST', '/account/rewards/run', ADMIN);
        check('rewards job runs', r.json && r.json.Status === 1, JSON.stringify(r.json));
        let credits = await q('SELECT * FROM Wallets WHERE UserID = ? AND ContentType = 6 AND Credited_Debited = 1', [quiet.id]);
        check('inactive customer gets comeback cash', credits.length === 1 && Number(credits[0].Amount) === 25);
        const [exp] = await q('SELECT TIMESTAMPDIFF(MINUTE, NOW(), ExpiryDate) AS mins FROM Wallets WHERE WalletID = ?', [credits[0] && credits[0].WalletID]);
        check('comeback cash expires in 24 hours', exp && exp.mins >= 1430 && exp.mins <= 1440, exp && exp.mins);
        await call('POST', '/account/rewards/run', ADMIN);
        credits = await q('SELECT * FROM Wallets WHERE UserID = ? AND ContentType = 6 AND Credited_Debited = 1', [quiet.id]);
        check('comeback cash is given once per quiet spell', credits.length === 1);
        const [notice] = await q("SELECT COUNT(*) AS n FROM UserNotifications WHERE UserID = ? AND Title LIKE '%wallet%'", [quiet.id]);
        check('customer is notified', notice.n === 1);

        // Spend ₹10 of it, then let it expire: only the ₹15 left is taken back.
        await q("INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, CreatedAt) VALUES (?, 10, 2, 3, 0, 'Paid for an order', NOW())", [quiet.id]);
        await q('UPDATE Users SET WalletAmount = WalletAmount - 10 WHERE UserID = ?', [quiet.id]);
        await q('UPDATE Wallets SET ExpiryDate = NOW() - INTERVAL 1 MINUTE WHERE WalletID = ?', [credits[0].WalletID]);
        await call('POST', '/account/rewards/run', ADMIN);
        const [expiry] = await q("SELECT Amount FROM Wallets WHERE UserID = ? AND Credited_Debited = 2 AND Description = 'Reward expired'", [quiet.id]);
        const [bal] = await q('SELECT WalletAmount FROM Users WHERE UserID = ?', [quiet.id]);
        check('only the unspent part expires', expiry && Number(expiry.Amount) === 15 && Number(bal.WalletAmount) === 0,
            `${expiry && expiry.Amount} / balance ${bal.WalletAmount}`);
        check('wallet balance matches the ledger', await ledgerMatches(quiet.id));

        // ---- Total saved: (100-80)*2 + discount 5; items without an offer price are skipped.
        r = await call('GET', '/account/summary', quiet.token);
        check('total saved across delivered orders', r.json && r.json.TotalSaved === 45 && r.json.DeliveredOrders === 1, JSON.stringify(r.json));

        // ---- Birthday
        const t = indiaToday();
        const today = `1990-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
        const bday = await newUser({ DateOfBirth: today });
        await call('POST', '/account/rewards/run', ADMIN);
        await call('POST', '/account/rewards/run', ADMIN);
        const gifts = await q('SELECT Amount FROM Wallets WHERE UserID = ? AND ContentType = 7 AND Credited_Debited = 1', [bday.id]);
        check('birthday reward once on the birthday', gifts.length === 1 && Number(gifts[0].Amount) === 50);
        check('birthday wallet matches the ledger', await ledgerMatches(bday.id));

        const fresh = await newUser();
        r = await call('POST', '/account/birthday', fresh.token, { DateOfBirth: '2031-01-01' });
        check('future birthday is refused', r.status === 400);
        r = await call('POST', '/account/birthday', fresh.token, { DateOfBirth: '1995-02-30' });
        check('impossible date is refused', r.status === 400);
        r = await call('POST', '/account/birthday', fresh.token, { DateOfBirth: '1995-06-15' });
        check('customer saves their birthday', r.json && r.json.Status === 1);
        r = await call('POST', '/account/birthday', fresh.token, { DateOfBirth: '1996-06-15' });
        check('birthday cannot be changed', r.status === 409);
        r = await call('GET', '/account/summary', fresh.token);
        check('summary shows the birthday and reward', r.json && r.json.DateOfBirth === '1995-06-15' && r.json.BirthdayReward === 50
            && r.json.TotalSaved === 0, JSON.stringify(r.json));

        // ---- Photo order with a typed list only
        r = await call('POST', '/photo-orders/submit', fresh.token, { customerNotes: 'x' });
        check('photo order needs a photo or a typed list', r.status === 400);
        r = await call('POST', '/photo-orders/submit', fresh.token, { typedItems: 'x', customerNotes: 'y'.repeat(501) });
        check('instructions over 500 characters are refused', r.status === 400);
        r = await call('POST', '/photo-orders/submit', fresh.token, { typedItems: 'Aashirvaad atta 5kg\nAmul butter 100g x2' });
        check('typed list without a photo is accepted', r.json && r.json.Status === 1, r.json && r.json.Message);
        if (r.json && r.json.RequestID) {
            photoRequests.push(r.json.RequestID);
            const d = await call('GET', `/photo-orders/request/${r.json.RequestID}`, fresh.token);
            check('request shows the typed list', d.json && d.json.Request && /Amul butter/.test(d.json.Request.TypedItems || ''));
            const img = await fetch(`${BASE}/photo-orders/image/${r.json.RequestID}`, { headers: { authorization: fresh.token } });
            check('no image for a typed-only request', img.status === 404);
        }

        // ---- Product keywords
        [product] = await q(`SELECT p.ProductID, p.SearchKeywords FROM Products p JOIN ProductVariants pv ON pv.ProductID = p.ProductID
                              WHERE p.Status = 1 AND pv.Status = 1 AND p.Type = 1 LIMIT 1`);
        r = await call('PUT', `/adminproducts/updateproduct/${product.ProductID}`, ADMIN, { SearchKeywords: 'Zqneyyi, zqnei , ZQNEYYI, zqghritham, zqfour' });
        const [kw] = await q('SELECT SearchKeywords FROM Products WHERE ProductID = ?', [product.ProductID]);
        check('admin saves keywords (trimmed, no duplicates)', kw.SearchKeywords === 'Zqneyyi, zqnei, zqghritham, zqfour', kw.SearchKeywords);
        r = await call('GET', '/products/search/zqnei');
        check('search finds the product by another name', r.json && (r.json.Products || []).some((p) => p.ProductID === product.ProductID));
        r = await call('GET', '/products/suggestions?q=zqghr');
        const hit = r.json && (r.json.Suggestions || []).find((s) => s.ProductID === product.ProductID);
        check('suggestions show at most three other names', hit && hit.Keywords.length === 3 && hit.Keywords[0] === 'Zqneyyi', hit && JSON.stringify(hit.Keywords));
    } catch (err) {
        check('test run completed without errors', false, err.sqlMessage || err.message);
    } finally {
        if (saved) {
            await q(`UPDATE CustomerRewardSettings SET ComebackEnabled = ?, ComebackInactiveDays = ?, ComebackAmount = ?, ComebackValidHours = ?,
                     BirthdayEnabled = ?, BirthdayAmount = ?, BirthdayValidDays = ? WHERE ID = 1`,
            [saved.ComebackEnabled, saved.ComebackInactiveDays, saved.ComebackAmount, saved.ComebackValidHours,
                saved.BirthdayEnabled, saved.BirthdayAmount, saved.BirthdayValidDays]);
        }
        if (product) await q('UPDATE Products SET SearchKeywords = ? WHERE ProductID = ?', [product.SearchKeywords, product.ProductID]);
        for (const id of photoRequests) {
            await q('DELETE FROM PhotoOrderStatusTimeline WHERE RequestID = ?', [id]);
            await q('DELETE FROM PhotoOrderRequests WHERE RequestID = ?', [id]);
        }
        for (const id of orders) {
            await q('DELETE FROM OrderItems WHERE OrderID = ?', [id]);
            await q('DELETE FROM Orders WHERE OrderID = ?', [id]);
        }
        for (const id of users) {
            await q('DELETE FROM Wallets WHERE UserID = ?', [id]);
            await q('DELETE FROM UserNotifications WHERE UserID = ?', [id]);
            await q('DELETE FROM Users WHERE UserID = ?', [id]);
        }
        const passed = results.filter(Boolean).length;
        console.log(`\n${passed}/${results.length} passed against ${BASE}`);
        pool.end();
        process.exit(passed === results.length ? 0 : 1);
    }
})();
