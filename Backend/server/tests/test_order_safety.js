// Orders sent at the same moment, and deactivated staff accounts, against a running
// backend and the LOCAL database.
//
//   API_URL=http://127.0.0.1:5001/api node server/tests/test_order_safety.js
//
// Uses throwaway customers, staff and carts (removed afterwards). Opens the store for
// the run and puts it and the stock back at the end.
require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
const passwords = require('../utils/password');

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

const NEAR = { Latitude: 15.8281, Longitude: 78.0373 };
const stamp = String(Date.now()).slice(-7);
const staff = [];
const users = [];
const orders = [];
let nextMobile = 0;

const newCustomer = async (wallet = 0) => {
    const mobile = `97${stamp}${nextMobile++}`;
    const ins = await q('INSERT INTO Users SET ?', [{ FirstName: 'Safety', LastName: 'Test', MobileNumber: mobile, WalletAmount: wallet, Status: 1 }]);
    users.push(ins.insertId);
    if (wallet) {
        await q("INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, CreatedAt) VALUES (?, ?, 1, 5, 0, 'test seed', NOW())",
            [ins.insertId, wallet]);
    }
    return { id: ins.insertId, token: `bearer ${sign({ UserID: ins.insertId, MobileNumber: mobile })}` };
};
const fillCart = async (userId, variant, quantity) => {
    const cart = await q('INSERT INTO Carts (UserID, Status, isOrderLinked, CreatedAt) VALUES (?, 1, 1, NOW())', [userId]);
    await q('INSERT INTO CartItems (CartID, ProductID, VariantID, Quantity, Price, Type, CreatedAt) VALUES (?, ?, ?, ?, ?, 1, NOW())',
        [cart.insertId, variant.ProductID, variant.VariantID, quantity, variant.OfferPrice]);
    return cart.insertId;
};
const placeOrder = async (customer, body) => {
    const r = await call('POST', '/orders/createorder', customer.token, { ...NEAR, Address: 'TEST ORDER - safety test', PaymentMethod: 'COD', ...body });
    if (r.json && r.json.OrderID) orders.push(r.json.OrderID);
    return r;
};
const stockOf = async (variant) => (await q('SELECT AvailableQty FROM ProductVariants WHERE VariantID = ?', [variant.VariantID]))[0].AvailableQty;
const walletOf = async (id) => Number((await q('SELECT WalletAmount FROM Users WHERE UserID = ?', [id]))[0].WalletAmount);
const ledgerOf = async (id) => Number((await q(
    'SELECT COALESCE(SUM(CASE WHEN Credited_Debited = 1 THEN Amount ELSE -Amount END), 0) AS total FROM Wallets WHERE UserID = ?', [id]))[0].total);

(async () => {
    const [shop] = await q('SELECT SettingID, ShopStatus, StoreMode FROM AdminShopToggleSettings LIMIT 1');
    let variant = null;
    try {
        // ---- Deactivated staff
        const addStaff = async (Role, Status, extra = {}) => {
            const ins = await q('INSERT INTO AdminUsers SET ?', [{
                FirstName: 'Safety', LastName: 'Staff', EmailID: `safety${stamp}${staff.length}@example.com`,
                MobileNumber: `96${stamp}${staff.length}`, Role, Status, Password: passwords.hash('Safety-test-1'), ...extra,
            }]);
            staff.push(ins.insertId);
            return ins.insertId;
        };
        const activeAdmin = await addStaff(1, 1);
        const goneAdmin = await addStaff(1, 0);
        const activeRider = await addStaff(2, 1);
        const goneRider = await addStaff(2, 0);

        let r = await call('GET', '/account/rewards/settings', `token ${sign({ AdminID: activeAdmin })}`);
        check('active admin is allowed', r.status === 200, r.status);
        r = await call('GET', '/account/rewards/settings', `token ${sign({ AdminID: goneAdmin })}`);
        check('deactivated admin is refused on every request', r.status === 401, r.status);
        r = await call('GET', '/deliveryboy/summary', `token ${sign({ AdminID: activeRider })}`);
        check('active rider is allowed', r.status === 200, r.status);
        r = await call('GET', '/deliveryboy/summary', `token ${sign({ AdminID: goneRider })}`);
        check('deactivated rider is refused on every request', r.status === 401, r.status);
        const [gone] = await q('SELECT EmailID FROM AdminUsers WHERE AdminID = ?', [goneAdmin]);
        r = await call('POST', '/adminuser/login', null, { EmailID: gone.EmailID, Password: 'Safety-test-1' });
        check('deactivated admin cannot log in', r.json && r.json.Status === 0 && !r.json.twoFactorToken, JSON.stringify(r.json));

        // ---- Orders at the same moment
        await q("UPDATE AdminShopToggleSettings SET ShopStatus = 1, StoreMode = 'OPEN' WHERE SettingID = ?", [shop.SettingID]);
        [variant] = await q(
            `SELECT V.ProductID, V.VariantID, V.OfferPrice, V.AvailableQty FROM ProductVariants V JOIN Products P ON P.ProductID = V.ProductID
              WHERE V.Status = 1 AND P.Status = 1 AND V.AvailableQty >= 30 AND V.OfferPrice BETWEEN 90 AND 120
                AND V.ProductID NOT IN (SELECT ProductID FROM product_unlocks WHERE Status = 1)
                AND P.SubCategoryID NOT IN (SELECT SubCategoryID FROM SubCategories WHERE SubCategoryName LIKE '%fruit%')
              ORDER BY V.VariantID LIMIT 1`);
        const quantity = Math.ceil(450 / variant.OfferPrice);

        const rich = await newCustomer(800);
        await fillCart(rich.id, variant, quantity);
        let before = await stockOf(variant);
        const three = await Promise.all([1, 2, 3].map(() => placeOrder(rich, { WalletAmount: 800 })));
        const placed = three.filter((x) => x.json && x.json.OrderID);
        check('one cart makes exactly one order, sent 3 times at once', placed.length === 1, three.map((x) => x.status).join(','));
        check('the repeats get a clear message', three.filter((x) => !(x.json && x.json.OrderID)).every((x) => x.json && x.json.Status === 0));
        const balance = await walletOf(rich.id);
        check('wallet never goes below zero', balance >= 0, balance);
        check('wallet balance matches its history', Math.abs(balance - await ledgerOf(rich.id)) < 0.01, `${balance} / ${await ledgerOf(rich.id)}`);
        check('stock is taken once', before - await stockOf(variant) === quantity, `${before} -> ${await stockOf(variant)}`);

        // A single order still pays from the wallet and records it.
        const shared = await newCustomer(600);
        const first = await fillCart(shared.id, variant, quantity);
        const [billed] = await q('SELECT Quantity FROM CartItems WHERE CartID = ?', [first]);
        check('test cart is ready', billed.Quantity === quantity);
        const one = await placeOrder(shared, { WalletAmount: 600 });
        check('a normal wallet order still works', !!(one.json && one.json.OrderID), JSON.stringify(one.json));
        check('its wallet payment is in the history', Math.abs(await walletOf(shared.id) - await ledgerOf(shared.id)) < 0.01);

        // Two customers, stock for one: never oversold, and the loser gets everything back.
        const lastCustomerA = await newCustomer(800);
        const lastCustomerB = await newCustomer(800);
        await fillCart(lastCustomerA.id, variant, quantity);
        await fillCart(lastCustomerB.id, variant, quantity);
        before = await stockOf(variant);
        await q('UPDATE ProductVariants SET AvailableQty = ? WHERE VariantID = ?', [quantity, variant.VariantID]);
        const race = await Promise.all([placeOrder(lastCustomerA, { WalletAmount: 800 }), placeOrder(lastCustomerB, { WalletAmount: 800 })]);
        const left = await stockOf(variant);
        const winners = race.filter((x) => x.json && x.json.OrderID).length;
        check('the last units are sold once', winners === 1, race.map((x) => x.json && (x.json.OrderID || x.json.Message)).join(' | '));
        check('stock never goes below zero', left === 0, left);
        const loser = race[0].json && race[0].json.OrderID ? lastCustomerB : lastCustomerA;
        check('the customer who missed out keeps their wallet', await walletOf(loser.id) === 800, await walletOf(loser.id));
        const [cart] = await q('SELECT isOrderLinked FROM Carts WHERE UserID = ?', [loser.id]);
        check('and keeps their cart', cart.isOrderLinked === 1, cart.isOrderLinked);
        await q('UPDATE ProductVariants SET AvailableQty = ? WHERE VariantID = ?', [before, variant.VariantID]);
    } catch (err) {
        check('test run completed without errors', false, err.sqlMessage || err.message);
    } finally {
        if (variant) await q('UPDATE ProductVariants SET AvailableQty = ? WHERE VariantID = ?', [variant.AvailableQty, variant.VariantID]);
        await q('UPDATE AdminShopToggleSettings SET ShopStatus = ?, StoreMode = ? WHERE SettingID = ?', [shop.ShopStatus, shop.StoreMode, shop.SettingID]);
        for (const id of orders) {
            await q('DELETE FROM OrderStatusTimeline WHERE OrderID = ?', [id]);
            await q('DELETE FROM OrderItems WHERE OrderID = ?', [id]);
            await q('DELETE FROM Orders WHERE OrderID = ?', [id]);
        }
        for (const id of users) {
            await q('DELETE FROM CartItems WHERE CartID IN (SELECT CartID FROM Carts WHERE UserID = ?)', [id]);
            await q('DELETE FROM Carts WHERE UserID = ?', [id]);
            await q('DELETE FROM Wallets WHERE UserID = ?', [id]);
            await q('DELETE FROM UserNotifications WHERE UserID = ?', [id]);
            await q('DELETE FROM Users WHERE UserID = ?', [id]);
        }
        for (const id of staff) await q('DELETE FROM AdminUsers WHERE AdminID = ?', [id]);
        const passed = results.filter(Boolean).length;
        console.log(`\n${passed}/${results.length} passed against ${BASE}`);
        pool.end();
        process.exit(passed === results.length ? 0 : 1);
    }
})();
