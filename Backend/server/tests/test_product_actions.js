// Product page actions (Buy More, Restrictions, Flash Sale, Membership) end to end:
// each is applied through the same admin endpoint and payload the admin Products page
// sends, then checked where the customer sees it (product detail and the cart bill).
//
//   API_URL=http://127.0.0.1:5001/api npm run test:product-actions
//
// Uses a throwaway copy of an in-stock product (Price 100, OfferPrice 90) and the test
// customer (mobile 9999999999); everything it creates is removed at the end.
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

// Copies a row, overriding some columns; returns the new id.
async function copyRow(table, idColumn, id, overrides) {
    const cols = (await q(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND EXTRA NOT LIKE '%auto_increment%'`,
        [table])).map((c) => c.COLUMN_NAME).filter((c) => c !== idColumn);
    const select = cols.map((c) => (c in overrides ? '?' : `\`${c}\``)).join(', ');
    const params = cols.filter((c) => c in overrides).map((c) => overrides[c]);
    const r = await q(`INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(', ')}) SELECT ${select} FROM \`${table}\` WHERE \`${idColumn}\` = ?`, [...params, id]);
    return r.insertId;
}

(async () => {
    const [user] = await q("SELECT UserID FROM Users WHERE MobileNumber = '9999999999' LIMIT 1");
    const [source] = await q(
        `SELECT V.ProductID, V.VariantID FROM ProductVariants V JOIN Products P ON P.ProductID = V.ProductID
          WHERE V.Status = 1 AND P.Status = 1 AND V.AvailableQty >= 10
            AND P.SubCategoryID NOT IN (SELECT SubCategoryID FROM SubCategories WHERE SubCategoryName LIKE '%fruit%')
          ORDER BY V.VariantID LIMIT 1`);
    const [plan] = await q('SELECT PlanID FROM MembershipPlans WHERE Status = 1 ORDER BY PlanID LIMIT 1');
    if (!user || !source || !plan) {
        console.error('Missing fixtures (test user 9999999999, an in-stock product, an active membership plan).');
        process.exit(1);
    }
    const CUSTOMER = `bearer ${sign({ UserID: user.UserID })}`;
    const ADMIN = `bearer ${sign({ AdminID: 1 })}`;
    const stamp = Date.now();

    const productId = await copyRow('Products', 'ProductID', source.ProductID, { ProductName: `ZZ Product Actions Test ${stamp}` });
    const variantId = await copyRow('ProductVariants', 'VariantID', source.VariantID, { ProductID: productId, Price: 100, OfferPrice: 90, AvailableQty: 50, ExpiryDate: null });
    // Buy2Price would also discount 2-packs; keep the baseline plain.
    await q('UPDATE ProductVariants SET Buy2Price = NULL WHERE VariantID = ?', [variantId]).catch(() => {});

    const parked = (await q('SELECT CartID FROM Carts WHERE UserID = ? AND isOrderLinked = 1', [user.UserID])).map((c) => c.CartID);
    if (parked.length) await q('UPDATE Carts SET isOrderLinked = 9 WHERE CartID IN (?)', [parked]);
    const cartId = (await q('INSERT INTO Carts (UserID, Status, isOrderLinked, CreatedAt) VALUES (?, 1, 1, NOW())', [user.UserID])).insertId;
    const setCart = async (qty) => {
        await q('DELETE FROM CartItems WHERE CartID = ?', [cartId]);
        await q('INSERT INTO CartItems (CartID, ProductID, VariantID, Quantity, Price, Type, CreatedAt) VALUES (?, ?, ?, ?, 90, 1, NOW())',
            [cartId, productId, variantId, qty]);
    };
    const bill = async (extra = {}) => (await call('POST', '/carts/bill', CUSTOMER, { ...NEAR, ...extra })).json.Bill;
    const detail = async () => {
        const r = await call('GET', `/products/detail/${productId}`, CUSTOMER);
        const j = r.json || {};
        return Array.isArray(j.Products) ? j.Products[0] : (j.Products || j.Product || {});
    };
    const variantOf = (p) => (p && (p.ProductVariants || p.Variants || []).find((v) => v.VariantID == variantId)) || {};

    let saleId = null;
    let promoId = null;
    try {
        await setCart(1);
        let b = await bill();
        check('baseline: 1 item costs the offer price', b && near(b.ItemsTotal, 90), b && b.ItemsTotal);

        // ---- Buy More
        let r = await call('POST', '/buymore/save-product-tiers', ADMIN,
            { ProductID: productId, items: [{ Quantity: 3, Price: 240 }], StartDate: null, EndDate: null, Status: 1 });
        check('buy more: admin saves a tier', r.json && r.json.Status === 1, r.json && r.json.Message);
        r = await call('GET', `/buymore/tiers/${productId}`, ADMIN);
        const tiers = (r.json && (r.json.Tiers || r.json.tiers || r.json.Data)) || [];
        check('buy more: admin sees the saved tier', JSON.stringify(r.json || {}).includes('240'), JSON.stringify(tiers).slice(0, 120));
        let p = await detail();
        check('buy more: customer product shows the tier', Array.isArray(p.BulkTiers) && p.BulkTiers.some((t) => t.MinQuantity == 3 && near(t.Price, 240)), JSON.stringify(p.BulkTiers));
        await setCart(3);
        b = await bill();
        check('buy more: 3 items cost the tier price', b && near(b.ItemsTotal, 240), b && b.ItemsTotal);
        await setCart(1);
        b = await bill();
        check('buy more: 1 item still costs the offer price', b && near(b.ItemsTotal, 90), b && b.ItemsTotal);
        // Date windows: the admin sends the IST day as exact instants (start/end of that day).
        const istDay = (offsetDays) => {
            const d = new Date(Date.now() + 330 * 60000 + offsetDays * 86400000).toISOString().slice(0, 10);
            return { start: new Date(`${d}T00:00:00+05:30`).toISOString(), end: new Date(`${d}T23:59:59+05:30`).toISOString() };
        };
        const today = istDay(0);
        await call('POST', '/buymore/save-product-tiers', ADMIN,
            { ProductID: productId, items: [{ Quantity: 3, Price: 240 }], StartDate: today.start, EndDate: today.end, Status: 1 });
        p = await detail();
        check('buy more: a tier for today (IST) is active now', (p.BulkTiers || []).length === 1, JSON.stringify(p.BulkTiers));
        const tomorrow = istDay(1);
        await call('POST', '/buymore/save-product-tiers', ADMIN,
            { ProductID: productId, items: [{ Quantity: 3, Price: 240 }], StartDate: tomorrow.start, EndDate: tomorrow.end, Status: 1 });
        p = await detail();
        check('buy more: a tier from tomorrow (IST) is not active yet', (p.BulkTiers || []).length === 0, JSON.stringify(p.BulkTiers));
        r = await call('POST', '/buymore/save-product-tiers', ADMIN, { ProductID: productId, items: [], StartDate: null, EndDate: null, Status: 1 });
        await setCart(3);
        b = await bill();
        check('buy more: clearing the tier restores normal pricing', b && near(b.ItemsTotal, 270), b && b.ItemsTotal);

        // ---- Flash Sale (admin creates a campaign, then assigns the product from the product page)
        const day = 24 * 60 * 60 * 1000;
        const fmt = (d) => new Date(d).toISOString().slice(0, 19).replace('T', ' ');
        r = await call('POST', '/sales/create', ADMIN, {
            SaleName: `ZZ Test Sale ${stamp}`, Description: 'test', DiscountType: 'percentage', DiscountValue: 20,
            StartDate: fmt(Date.now() - day), EndDate: fmt(Date.now() + day), Status: 1, ProductIDs: []
        });
        saleId = r.json && (r.json.SaleID || r.json.insertId || (r.json.Sale && r.json.Sale.SaleID));
        if (!saleId) {
            const [row] = await q('SELECT SaleID FROM Sales WHERE SaleName = ?', [`ZZ Test Sale ${stamp}`]);
            saleId = row && row.SaleID;
        }
        check('flash sale: admin creates a campaign', !!saleId, r.json && r.json.Message);
        r = await call('POST', '/sales/assign-product', ADMIN, { SaleID: saleId, ProductID: productId });
        check('flash sale: admin assigns the product', r.json && r.json.Status === 1, r.json && r.json.Message);
        p = await detail();
        check('flash sale: customer product shows the deal and sale price',
            p.Deal && near(variantOf(p).SalePrice, 72), `Deal=${JSON.stringify(p.Deal)} SalePrice=${variantOf(p).SalePrice}`);
        await setCart(1);
        b = await bill();
        check('flash sale: cart charges the sale price', b && near(b.ItemsTotal, 72), b && b.ItemsTotal);
        r = await call('POST', '/sales/remove-product', ADMIN, { SaleID: saleId, ProductID: productId });
        b = await bill();
        check('flash sale: removing the product ends the discount', r.json && r.json.Status === 1 && b && near(b.ItemsTotal, 90), b && b.ItemsTotal);

        // ---- Membership price
        r = await call('POST', '/membership/product/save', ADMIN,
            { ProductID: productId, items: [{ PlanID: plan.PlanID, MembershipPrice: 80, Status: 1 }] });
        check('membership: admin saves a member price', r.json && r.json.Status === 1, r.json && r.json.Message);
        b = await bill();
        check('membership: non-members pay the offer price', b && near(b.ItemsTotal, 90), b && b.ItemsTotal);
        p = await detail();
        check('membership: non-members see the member offer on the product', p.MemberOffer && near(p.MemberOffer.Price, 80) && !variantOf(p).MemberPrice,
            JSON.stringify(p.MemberOffer));
        await q(`INSERT INTO UserMemberships (UserID, PlanID, Price, StartDate, EndDate, RazorpayOrderID, PaymentTransactionID)
                 VALUES (?, ?, 0, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY, 'TEST-PRODUCT-ACTIONS', 'TEST-PRODUCT-ACTIONS')`,
            [user.UserID, plan.PlanID]);
        b = await bill();
        check('membership: members pay the member price in the cart', b && near(b.ItemsTotal, 80), b && b.ItemsTotal);
        p = await detail();
        check('membership: members see the member price on the product', near(variantOf(p).MemberPrice, 80), `MemberPrice=${variantOf(p).MemberPrice}`);

        // ---- Restrictions
        r = await call('POST', '/restrictions/save-product-restrictions', ADMIN,
            { ProductID: productId, restrictions: { no_cashback: true, no_coupon: true, no_membership: true } });
        check('restrictions: admin saves them', r.json && r.json.Status === 1, r.json && r.json.Message);
        r = await call('GET', `/restrictions/restrictions?ProductID=${productId}`, ADMIN);
        check('restrictions: admin sees them saved', JSON.stringify(r.json || {}).includes('no_coupon'), JSON.stringify(r.json || {}).slice(0, 150));
        b = await bill();
        check('restrictions: no_membership removes the member price', b && near(b.ItemsTotal, 90), b && b.ItemsTotal);
        p = await detail();
        check('restrictions: no_membership hides member prices on the product', !p.MemberOffer && !variantOf(p).MemberPrice,
            `MemberOffer=${JSON.stringify(p.MemberOffer)} MemberPrice=${variantOf(p).MemberPrice}`);

        promoId = (await q(
            `INSERT INTO PromoCodes (PromoCode, DiscountType, DiscountValue, MinOrderAmount, MaxDiscount, StartDate, EndDate, Status,
                                     CreatedAt, Description, Type, OfferValue, MinOrderValue, Is_Secret)
             VALUES (?, 'percentage', 10, 0, 100, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY, 1, NOW(), 'test', 2, 10, 0, 1)`,
            [`ZZT${String(stamp).slice(-6)}`])).insertId;
        const code = `ZZT${String(stamp).slice(-6)}`;
        b = await bill({ PromoCode: code });
        check('restrictions: no_coupon blocks coupons on the product', b && !(b.CouponDiscount > 0), `CouponDiscount=${b && b.CouponDiscount}`);
        check('restrictions: no_cashback gives no cashback', b && !(b.CashbackEarned > 0), `CashbackEarned=${b && b.CashbackEarned}`);

        r = await call('POST', '/restrictions/save-product-restrictions', ADMIN,
            { ProductID: productId, restrictions: { no_cashback: false, no_coupon: false, no_membership: false } });
        b = await bill({ PromoCode: code });
        check('restrictions: turning them off restores member price and coupon',
            b && near(b.ItemsTotal, 80) && b.CouponDiscount > 0, `ItemsTotal=${b && b.ItemsTotal} CouponDiscount=${b && b.CouponDiscount}`);
    } catch (err) {
        check('unexpected error', false, err.stack || err.message);
    } finally {
        await q('DELETE FROM CartItems WHERE CartID = ?', [cartId]);
        await q('DELETE FROM Carts WHERE CartID = ?', [cartId]);
        if (parked.length) await q('UPDATE Carts SET isOrderLinked = 1 WHERE CartID IN (?)', [parked]);
        await q("DELETE FROM UserMemberships WHERE UserID = ? AND RazorpayOrderID = 'TEST-PRODUCT-ACTIONS'", [user.UserID]);
        await q('DELETE FROM buy_more_config WHERE ProductID = ?', [productId]);
        await q('DELETE FROM product_restrictions WHERE ProductID = ?', [productId]);
        await q('DELETE FROM membership_product_prices WHERE ProductID = ?', [productId]);
        await q('DELETE FROM SaleItems WHERE ProductID = ?', [productId]);
        if (saleId) await q('DELETE FROM Sales WHERE SaleID = ?', [saleId]);
        if (promoId) await q('DELETE FROM PromoCodes WHERE PromoCodeID = ?', [promoId]);
        await q('DELETE FROM ProductVariants WHERE ProductID = ?', [productId]);
        await q('DELETE FROM Products WHERE ProductID = ?', [productId]);
        const passed = results.filter(Boolean).length;
        console.log(`\n${passed}/${results.length} passed against ${BASE}`);
        pool.end();
        process.exit(passed === results.length ? 0 : 1);
    }
})();
