// Welcome offer and "Our app: X% lower" price tags, against a running backend and the LOCAL database.
//
//   API_URL=http://127.0.0.1:5001/api node server/tests/test_promotions.js
//
// Uses a temporary customer (no orders yet), restores the offer settings and removes
// everything it creates.
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
const NEAR = { Latitude: 15.8281, Longitude: 78.0373 };
const TEST_MOBILE = '9999900077';

(async () => {
    const [adminUser] = await q('SELECT AdminID FROM AdminUsers WHERE Role = 1 AND Status = 1 LIMIT 1');
    const ADMIN = `token ${sign({ AdminID: adminUser.AdminID })}`;
    const [variant] = await q(
        `SELECT V.ProductID, V.VariantID, V.OfferPrice, V.AvailableQty, P.ProductName FROM ProductVariants V
           JOIN Products P ON P.ProductID = V.ProductID
          WHERE V.Status = 1 AND P.Status = 1 AND V.AvailableQty >= 30 AND V.OfferPrice BETWEEN 60 AND 120
            AND V.VariantID = (SELECT MIN(V2.VariantID) FROM ProductVariants V2 WHERE V2.ProductID = V.ProductID AND V2.status = 1)
            AND V.ProductID NOT IN (SELECT ProductID FROM product_unlocks WHERE Status = 1)
            AND V.ProductID NOT IN (SELECT ProductID FROM buy_more_config WHERE Status = 1)
            AND V.ProductID NOT IN (SELECT si.ProductID FROM SaleItems si JOIN Sales s ON s.SaleID = si.SaleID WHERE s.Status = 1)
            AND P.SubCategoryID NOT IN (SELECT SubCategoryID FROM SubCategories WHERE SubCategoryName LIKE '%fruit%')
          ORDER BY V.VariantID LIMIT 1`);
    if (!variant) {
        console.error('Missing test fixture: an in-stock variant priced 60-120 without deals.');
        process.exit(1);
    }
    const [savedOffer] = await q('SELECT * FROM WelcomeOffer WHERE ID = 1');
    const [savedTag] = await q('SELECT * FROM ProductPriceCompare WHERE ProductID = ?', [variant.ProductID]);
    const [storeMode] = await q('SELECT StoreMode, StoreModeUntil FROM AdminShopToggleSettings LIMIT 1');

    await q('DELETE FROM Users WHERE MobileNumber = ?', [TEST_MOBILE]);
    const user = await q("INSERT INTO Users (MobileNumber, FirstName, WalletAmount, Status) VALUES (?, 'Promo Test', 0, 1)", [TEST_MOBILE]);
    const userId = user.insertId;
    const CUSTOMER = `bearer ${sign({ UserID: userId })}`;
    const cart = await q('INSERT INTO Carts (UserID, Status, isOrderLinked, CreatedAt) VALUES (?, 1, 1, NOW())', [userId]);
    const cartIds = [cart.insertId];
    const created = [];

    const setCart = async (qty) => {
        const [open] = await q('SELECT CartID FROM Carts WHERE UserID = ? AND isOrderLinked = 1 ORDER BY CartID DESC LIMIT 1', [userId]);
        let id = open && open.CartID;
        if (!id) {
            id = (await q('INSERT INTO Carts (UserID, Status, isOrderLinked, CreatedAt) VALUES (?, 1, 1, NOW())', [userId])).insertId;
            cartIds.push(id);
        }
        await q('DELETE FROM CartItems WHERE CartID = ?', [id]);
        await q('INSERT INTO CartItems (CartID, ProductID, VariantID, Quantity, Price, Type, CreatedAt) VALUES (?, ?, ?, ?, ?, 1, NOW())',
            [id, variant.ProductID, variant.VariantID, qty, variant.OfferPrice]);
    };
    const bill = async () => (await call('POST', '/carts/bill', CUSTOMER, NEAR)).json.Bill;

    try {
        await q("UPDATE AdminShopToggleSettings SET StoreMode = 'OPEN', StoreModeUntil = NULL");
        await q("UPDATE WelcomeOffer SET Enabled = 0 WHERE ID = 1");

        // ---------- Welcome offer ----------
        let r = await call('GET', '/promotions/welcome');
        check('guest sees the offer as inactive while it is off', r.json && r.json.Status === 1 && r.json.Offer.Active === false);

        r = await call('PUT', '/promotions/admin/welcome', ADMIN, { Enabled: true, MinOrderValue: 100, Steps: [] });
        check('saving with no orders is refused', r.status === 400);
        r = await call('PUT', '/promotions/admin/welcome', ADMIN, { Enabled: true, MinOrderValue: 100, Steps: [150] });
        check('a discount at or above the minimum order is refused', r.status === 400);
        r = await call('PUT', '/promotions/admin/welcome', CUSTOMER, { Enabled: true, MinOrderValue: 100, Steps: [50] });
        check('customers cannot change the offer', r.status === 401 || r.status === 403 || (r.json && r.json.Status === 0));

        r = await call('PUT', '/promotions/admin/welcome', ADMIN, { Enabled: true, Title: 'Test welcome', MinOrderValue: 100, Steps: [50, 30] });
        check('admin saves ₹50 then ₹30, minimum ₹100', r.json && r.json.Status === 1 && r.json.Offer.Steps.join(',') === '50,30');

        r = await call('GET', '/promotions/welcome', CUSTOMER);
        check('new customer: 1st order is next, ₹50 off', r.json && r.json.Offer.Active && r.json.Offer.NextStep === 1 && r.json.Offer.NextDiscount === 50);

        await setCart(1);
        let b = await bill();
        const oneItem = parseFloat(variant.OfferPrice);
        if (oneItem < 100) {
            check('below the minimum: no discount, shows how much more', b.WelcomeDiscount === 0 && b.WelcomeOffer && near(b.WelcomeOffer.AmountNeeded, 100 - oneItem),
                `needed ${b.WelcomeOffer && b.WelcomeOffer.AmountNeeded}`);
        }

        await setCart(2);
        b = await bill();
        check('at the minimum: ₹50 off the 1st order', b.WelcomeDiscount === 50 && b.WelcomeStep === 1 && b.WelcomeOffer.Applied === true);
        check('to pay goes down by ₹50', near(b.ToPay, b.ItemsTotal - b.CouponDiscount - b.CartOfferDiscount - 50 + b.DeliveryFee + b.Tip), `to pay ${b.ToPay}`);

        r = await call('POST', '/orders/createorder', CUSTOMER, { ...NEAR, Address: 'TEST ORDER - promotions test', PaymentMethod: 'COD' });
        if (r.json && r.json.OrderID) created.push(r.json.OrderID);
        const [order] = created.length ? await q('SELECT WelcomeStep, WelcomeDiscount, GrandTotal, Discount FROM Orders WHERE OrderID = ?', [created[0]]) : [];
        check('the order records step 1 and ₹50', order && Number(order.WelcomeStep) === 1 && near(order.WelcomeDiscount, 50), r.json && r.json.Message);
        check('order total matches the bill', order && near(order.GrandTotal, b.ToPay), order && `${order.GrandTotal} vs ${b.ToPay}`);

        await setCart(2);
        b = await bill();
        check('2nd order gets ₹30', b.WelcomeDiscount === 30 && b.WelcomeStep === 2);

        r = await call('GET', '/promotions/admin/welcome', ADMIN);
        const s1 = r.json && r.json.Stats.Steps.find((s) => s.Step === 1);
        check('admin stats count the order and the amount', s1 && s1.Orders >= 1 && s1.Amount >= 50 && r.json.Stats.TotalAmount >= 50);

        if (created.length) await q('UPDATE Orders SET OrderStatus = 4 WHERE OrderID = ?', [created[0]]);
        b = await bill();
        check('a cancelled order does not use up the step', b.WelcomeDiscount === 50 && b.WelcomeStep === 1);

        await q('UPDATE WelcomeOffer SET StepsJson = ? WHERE ID = 1', ['[50]']);
        if (created.length) await q('UPDATE Orders SET OrderStatus = 1 WHERE OrderID = ?', [created[0]]);
        b = await bill();
        check('after the last step there is no discount', b.WelcomeDiscount === 0 && b.WelcomeOffer === null);

        // ---------- "Our app: X% lower" ----------
        await q('DELETE FROM ProductPriceCompare WHERE ProductID = ?', [variant.ProductID]);
        const word = String(variant.ProductName).split(/\s+/).find((w) => w.length >= 3) || variant.ProductName.slice(0, 3);
        r = await call('GET', `/promotions/admin/products?q=${encodeURIComponent(word)}`, ADMIN);
        check('admin product search returns products with photos', r.json && r.json.Status === 1 && r.json.Products.length > 0 && 'Image' in r.json.Products[0]);

        r = await call('POST', '/promotions/admin/price-compare', ADMIN, { ProductID: variant.ProductID, PercentLower: 0 });
        check('0% is refused', r.status === 400);
        r = await call('POST', '/promotions/admin/price-compare', ADMIN, { ProductID: variant.ProductID, PercentLower: 40 });
        check('admin adds a 40% tag', r.json && r.json.Status === 1);

        r = await call('GET', '/promotions/admin/price-compare', ADMIN);
        const item = r.json && r.json.Items.find((i) => i.ProductID === variant.ProductID);
        check('admin list shows it with name and photo field', item && item.PercentLower === 40 && item.ProductName && 'Image' in item);

        r = await call('GET', '/promotions/price-compare');
        let p = r.json && r.json.Products.find((x) => x.ProductID === variant.ProductID);
        check('customer list carries PriceCompareLowerPct 40', p && p.PriceCompareLowerPct === 40);

        r = await call('PUT', `/promotions/admin/price-compare/${variant.ProductID}`, ADMIN, { PercentLower: 35 });
        r = await call('GET', `/products/search/${encodeURIComponent(word)}`);
        p = r.json && (r.json.Product || r.json.Products || []).find((x) => x.ProductID === variant.ProductID);
        check('search results show the updated 35%', !p || p.PriceCompareLowerPct === 35, p ? `${p.PriceCompareLowerPct}` : 'not in search');

        r = await call('POST', '/promotions/admin/price-compare/order', ADMIN, { ProductIDs: [variant.ProductID] });
        const [sorted] = await q('SELECT SortOrder FROM ProductPriceCompare WHERE ProductID = ?', [variant.ProductID]);
        check('sorting puts it first', r.json && r.json.Status === 1 && sorted && sorted.SortOrder === 1);

        await call('PUT', `/promotions/admin/price-compare/${variant.ProductID}`, ADMIN, { Status: 0 });
        r = await call('GET', '/promotions/price-compare');
        check('a switched-off tag is hidden from customers', r.json && !r.json.Products.some((x) => x.ProductID === variant.ProductID));

        r = await call('DELETE', `/promotions/admin/price-compare/${variant.ProductID}`, ADMIN);
        check('admin removes the tag', r.json && r.json.Status === 1);
    } finally {
        await q('UPDATE AdminShopToggleSettings SET StoreMode = ?, StoreModeUntil = ?', [storeMode.StoreMode, storeMode.StoreModeUntil]);
        await q('UPDATE WelcomeOffer SET Enabled = ?, Title = ?, MinOrderValue = ?, StepsJson = ? WHERE ID = 1',
            [savedOffer.Enabled, savedOffer.Title, savedOffer.MinOrderValue, savedOffer.StepsJson]);
        await q('DELETE FROM ProductPriceCompare WHERE ProductID = ?', [variant.ProductID]);
        if (savedTag) {
            await q('INSERT INTO ProductPriceCompare (ProductID, PercentLower, SortOrder, Status) VALUES (?, ?, ?, ?)',
                [savedTag.ProductID, savedTag.PercentLower, savedTag.SortOrder, savedTag.Status]);
        }
        if (created.length) {
            await q('DELETE FROM OrderStatusTimeline WHERE OrderID IN (?)', [created]).catch(() => {});
            await q('DELETE FROM OrderItems WHERE OrderID IN (?)', [created]);
            await q('DELETE FROM Orders WHERE OrderID IN (?)', [created]);
        }
        await q('DELETE FROM UserNotifications WHERE UserID = ?', [userId]).catch(() => {});
        const allCarts = (await q('SELECT CartID FROM Carts WHERE UserID = ?', [userId])).map((c) => c.CartID);
        if (allCarts.length) {
            await q('DELETE FROM CartItems WHERE CartID IN (?)', [allCarts]);
            await q('DELETE FROM Carts WHERE CartID IN (?)', [allCarts]);
        }
        await q('DELETE FROM Users WHERE UserID = ?', [userId]);
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
