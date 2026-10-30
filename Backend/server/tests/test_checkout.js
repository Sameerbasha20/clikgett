// Checkout pricing test against a running backend and the LOCAL database.
//
//   API_URL=http://127.0.0.1:5001/api npm run test:checkout
//
// Builds carts for the test customer (mobile 9999999999), checks the server bill
// (/carts/bill) and that /orders/createorder charges the server bill no matter
// what totals the app sends. Restores the customer's cart, wallet and stock.
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
const FAR = { Latitude: 15.93, Longitude: 78.11 };

(async () => {
    const [user] = await q("SELECT UserID, MobileNumber, WalletAmount FROM Users WHERE MobileNumber = '9999999999' LIMIT 1");
    const [variant] = await q(
        `SELECT V.ProductID, V.VariantID, V.Price, V.OfferPrice, V.AvailableQty FROM ProductVariants V
           JOIN Products P ON P.ProductID = V.ProductID
          WHERE V.Status = 1 AND P.Status = 1 AND V.AvailableQty >= 30 AND V.OfferPrice BETWEEN 40 AND 120
            AND V.ProductID NOT IN (SELECT ProductID FROM product_unlocks WHERE Status = 1)
            AND P.SubCategoryID NOT IN (SELECT SubCategoryID FROM SubCategories WHERE SubCategoryName LIKE '%fruit%')
          ORDER BY V.VariantID LIMIT 1`
    );
    if (!user || !variant) {
        console.error('Missing test fixtures (test user 9999999999, an in-stock variant priced 40-120).');
        process.exit(1);
    }
    const CUSTOMER = `bearer ${sign({ UserID: user.UserID })}`;
    const created = [];
    const parkedCarts = (await q('SELECT CartID FROM Carts WHERE UserID = ? AND isOrderLinked = 1', [user.UserID])).map((c) => c.CartID);
    if (parkedCarts.length) await q('UPDATE Carts SET isOrderLinked = 9 WHERE CartID IN (?)', [parkedCarts]);
    const cart = await q('INSERT INTO Carts (UserID, Status, isOrderLinked, CreatedAt) VALUES (?, 1, 1, NOW())', [user.UserID]);
    const cartId = cart.insertId;

    const setCart = async (qty) => {
        await q('DELETE FROM CartItems WHERE CartID = ?', [cartId]);
        await q('UPDATE Carts SET isOrderLinked = 1 WHERE CartID = ?', [cartId]);
        await q('INSERT INTO CartItems (CartID, ProductID, VariantID, Quantity, Price, Type, CreatedAt) VALUES (?, ?, ?, ?, ?, 1, NOW())',
            [cartId, variant.ProductID, variant.VariantID, qty, variant.OfferPrice]);
    };
    const bill = async (extra = {}) => (await call('POST', '/carts/bill', CUSTOMER, { ...NEAR, ...extra })).json.Bill;
    const placeOrder = async (body) => {
        const r = await call('POST', '/orders/createorder', CUSTOMER, { ...NEAR, Address: 'TEST ORDER - checkout test', ...body });
        if (r.json && r.json.OrderID) created.push(r.json.OrderID);
        return r;
    };

    // Orders are refused while the store is closed, so open it for the run.
    const [storeMode] = await q('SELECT StoreMode, StoreModeUntil FROM AdminShopToggleSettings LIMIT 1');

    try {
        await setCart(1);
        await q("UPDATE AdminShopToggleSettings SET StoreMode = 'CLOSED', StoreModeUntil = NULL");
        let closed = await placeOrder({ PaymentMethod: 'COD' });
        check('order is refused while the store is closed', closed.json && closed.json.Status === 0 && closed.json.StoreClosed === true, closed.json && closed.json.Message);
        await q("UPDATE AdminShopToggleSettings SET StoreMode = 'OPEN', StoreModeUntil = NULL");

        await q('UPDATE Users SET WalletAmount = 500 WHERE UserID = ?', [user.UserID]);
        const bigQty = Math.ceil(450 / parseFloat(variant.OfferPrice));
        await setCart(bigQty);

        // ---- Bill arithmetic
        let b = await bill({ Tip: 20 });
        check('bill returned for the cart', b && b.Items.length === 1, b ? `items=${b.Items.length}` : 'no bill');
        check('to-pay = items - discounts + delivery + tip',
            near(b.ToPay, b.ItemsTotal - b.CouponDiscount - b.CartOfferDiscount + b.DeliveryFee + b.Tip), `toPay=${b.ToPay}`);
        check('tip is applied', b.Tip === 20);
        const capped = await bill({ Tip: 99999 });
        check('tip is capped at 1000', capped.Tip === 1000);
        if (!b.FreeDeliveryApplied) {
            const far = await bill({ ...FAR });
            check('delivery fee grows with distance', far.DeliveryFee > b.DeliveryFee, `near=${b.DeliveryFee} far=${far.DeliveryFee}`);
        }
        check('free-delivery gap reported', b.FreeDeliveryApplied ? b.AmountForFreeDelivery === 0 : near(b.AmountForFreeDelivery, b.FreeDeliveryThreshold - b.ItemsTotal));

        // ---- Wallet rule
        const w = await bill({ UseWallet: true });
        check('large order: wallet covers up to the payable amount', near(w.WalletApplied, Math.min(500, w.ToPay + w.WalletApplied)), `applied=${w.WalletApplied}`);
        await setCart(Math.max(2, Math.ceil(160 / parseFloat(variant.OfferPrice))));
        const small = await bill({ UseWallet: true });
        if (small.ItemsTotal + small.DeliveryFee < small.WalletRule.MinOrderForFullWallet) {
            check('small order: wallet limited to MinUseOfWallet', small.WalletApplied <= small.WalletRule.SmallOrderWalletCap + 0.001, `applied=${small.WalletApplied}`);
        }

        // ---- Tampered order: app sends fake totals, server charges the real bill
        await setCart(bigQty);
        const expected = await bill({ Tip: 10 });
        let r = await placeOrder({ PaymentMethod: 'COD', GrandTotal: 1, SubTotal: 1, DeliverCharges: 0, TipAmount: 10, WalletAmount: 0,
            OrderItems: [{ ProductID: variant.ProductID, VariantID: variant.VariantID, Quantity: 1, Price: 0, OfferPrice: 0 }] });
        check('order placed', r.json && r.json.Status === 1, r.json && r.json.Message);
        if (r.json && r.json.OrderID) {
            const [o] = await q('SELECT * FROM Orders WHERE OrderID = ?', [r.json.OrderID]);
            check('stored grand total is the server bill', near(o.GrandTotal, expected.ToPay), `stored=${o.GrandTotal} bill=${expected.ToPay}`);
            check('stored subtotal / delivery / tip match the bill',
                near(o.SubTotal, expected.ItemsTotal) && near(o.DeliverCharges, expected.DeliveryFee) && near(o.TipAmount, 10));
            const items = await q('SELECT Quantity, OfferPrice FROM OrderItems WHERE OrderID = ?', [r.json.OrderID]);
            check('order items use server prices and cart quantities',
                items.length === 1 && items[0].Quantity === bigQty && near(items[0].OfferPrice, expected.Items[0].UnitPrice));
            check('order delivery time matches checkout', o.BaseETAMinutes + o.OrderSizeBufferMinutes === expected.EtaMinutes,
                `order=${o.BaseETAMinutes}+${o.OrderSizeBufferMinutes} checkout=${expected.EtaMinutes}`);
            const [c] = await q('SELECT isOrderLinked FROM Carts WHERE CartID = ?', [cartId]);
            check('cart is closed after the order', c.isOrderLinked === 0);
        }

        // ---- Wallet over-ask is capped to the rule
        await setCart(bigQty);
        const wb = await bill({ UseWallet: true });
        r = await placeOrder({ PaymentMethod: 'COD', WalletAmount: 99999 });
        if (r.json && r.json.OrderID) {
            const [o] = await q('SELECT WalletAmount, GrandTotal FROM Orders WHERE OrderID = ?', [r.json.OrderID]);
            check('wallet use is capped by the server', near(o.WalletAmount, wb.WalletApplied) && near(o.GrandTotal, wb.ToPay), `wallet=${o.WalletAmount}/${wb.WalletApplied} total=${o.GrandTotal}/${wb.ToPay}`);
            const [u] = await q('SELECT WalletAmount FROM Users WHERE UserID = ?', [user.UserID]);
            check('wallet debited by the applied amount', near(u.WalletAmount, 500 - wb.WalletApplied), `balance=${u.WalletAmount}`);
        } else {
            check('wallet order placed', false, r.json && r.json.Message);
        }
        await q('UPDATE Users SET WalletAmount = 500 WHERE UserID = ?', [user.UserID]);

        // ---- Rejections
        await setCart(1);
        const tiny = await bill({});
        if (!tiny.MinOrderMet) {
            r = await placeOrder({ PaymentMethod: 'COD' });
            check('order below minimum value is refused', r.json && r.json.Status === 0 && /Minimum order/.test(r.json.Message), r.json && r.json.Message);
        }
        await setCart(bigQty);
        r = await placeOrder({ PaymentMethod: 'WALLET', WalletAmount: 0 });
        check('wallet payment without enough balance is refused', r.json && r.json.Status === 0, r.json && r.json.Message);
        r = await placeOrder({ PaymentMethod: 'COD', PromoCode: 'NO-SUCH-CODE-XYZ' });
        check('invalid coupon is refused', r.json && r.json.Status === 0, r.json && r.json.Message);
        r = await placeOrder({ PaymentMethod: 'ONLINE', RazorpayOrderID: 'order_fake', razorpay_payment_id: 'pay_fake', razorpay_signature: 'bad' });
        check('online order with a forged signature is refused', r.json && r.json.Status === 0, r.json && r.json.Message);

        // ---- Delivery time: <=5 km 20 min, >5 km 30 min, +10 per 10 items above 10, +10 for fresh fruit
        const etaFor = async (qty, loc = NEAR) => { await setCart(qty); return (await bill({ ...loc })).EtaMinutes; };
        check('delivery time: near, 5 items = 20 min', (await etaFor(5)) === 20);
        check('delivery time: far (>5 km) = 30 min', (await etaFor(5, FAR)) === 30);
        check('delivery time: 11 items = 30 min', (await etaFor(11)) === 30);
        check('delivery time: 21 items = 40 min', (await etaFor(21)) === 40);
        check('delivery time: 31 items = 50 min', (await etaFor(31)) === 50);
        const [fruit] = await q(
            `SELECT V.ProductID, V.VariantID, V.OfferPrice FROM ProductVariants V JOIN Products P ON P.ProductID = V.ProductID
               JOIN SubCategories S ON S.SubCategoryID = P.SubCategoryID
              WHERE V.Status = 1 AND P.Status = 1 AND V.AvailableQty > 0 AND S.SubCategoryName LIKE '%fruit%'
                AND S.SubCategoryName NOT LIKE '%dr%' AND S.SubCategoryName NOT LIKE '%juice%' LIMIT 1`
        );
        if (fruit) {
            await setCart(5);
            await q('INSERT INTO CartItems (CartID, ProductID, VariantID, Quantity, Price, Type, CreatedAt) VALUES (?, ?, ?, 1, ?, 1, NOW())',
                [cartId, fruit.ProductID, fruit.VariantID, fruit.OfferPrice]);
            const fb = await bill({});
            check('delivery time: fresh fruit adds 10 min (near, 6 items = 30 min)', fb.EtaMinutes === 30, `eta=${fb.EtaMinutes}`);
        }
        r = await call('POST', '/address/check-serviceability', null, NEAR);
        check('home header time for a near address = 20 min', r.json && r.json.EtaMinutes === 20, r.json && `eta=${r.json.EtaMinutes}`);

        // ---- Out of stock: the line stays visible, is not charged, and blocks the order
        await setCart(3);
        await q('UPDATE ProductVariants SET AvailableQty = 0 WHERE VariantID = ?', [variant.VariantID]);
        let ob = await bill({});
        let line = ob.Items.find((i) => i.VariantID === variant.VariantID);
        check('out-of-stock item still shows in checkout', line && Number(line.AvailableQty) === 0 && line.OutOfStock === true);
        check('out-of-stock item is not charged', line && Number(line.LineTotal) === 0 && Number(ob.ItemsTotal) === 0);
        check('out-of-stock item is reported as a stock issue', ob.StockIssues.length === 1 && ob.StockIssues[0].VariantID === variant.VariantID);
        r = await placeOrder({ PaymentMethod: 'COD' });
        check('order with an out-of-stock item is refused and names it', r.json && r.json.Status === 0 && /out of stock/.test(r.json.Message), r.json && r.json.Message);
        await q('UPDATE ProductVariants SET AvailableQty = 2 WHERE VariantID = ?', [variant.VariantID]);
        ob = await bill({});
        line = ob.Items.find((i) => i.VariantID === variant.VariantID);
        check('short stock (3 wanted, 2 left) is reported', line && Number(line.AvailableQty) === 2 && ob.StockIssues.length === 1);
        await q('UPDATE ProductVariants SET AvailableQty = ? WHERE VariantID = ?', [variant.AvailableQty, variant.VariantID]);

        // ---- Re-order only works on your own orders
        const [other] = await q('SELECT OrderID FROM Orders WHERE UserID <> ? ORDER BY OrderID DESC LIMIT 1', [user.UserID]);
        if (other) {
            await setCart(1);
            r = await call('POST', '/orders/reorder', CUSTOMER, { OrderID: other.OrderID });
            const items = await q('SELECT COUNT(*) AS n FROM CartItems WHERE CartID = ?', [cartId]);
            check("cannot re-order another customer's order", r.json && r.json.Status === 0 && items[0].n === 1, r.json && r.json.Message);
        }
    } catch (err) {
        check('test run completed without errors', false, err.sqlMessage || err.message);
    } finally {
        await q('UPDATE AdminShopToggleSettings SET StoreMode = ?, StoreModeUntil = ?', [storeMode.StoreMode, storeMode.StoreModeUntil]);
        if (created.length) {
            await q('DELETE FROM OrderStatusTimeline WHERE OrderID IN (?)', [created]).catch(() => {});
            await q('DELETE FROM OrderItems WHERE OrderID IN (?)', [created]);
            await q('DELETE FROM Wallets WHERE ContentID IN (?) AND UserID = ?', [created, user.UserID]).catch(() => {});
            await q('DELETE FROM Orders WHERE OrderID IN (?)', [created]);
        }
        await q("DELETE FROM UserNotifications WHERE UserID = ? AND CreatedAt > NOW() - INTERVAL 10 MINUTE", [user.UserID]).catch(() => {});
        await q('DELETE FROM CartItems WHERE CartID = ?', [cartId]);
        await q('DELETE FROM Carts WHERE CartID = ?', [cartId]);
        if (parkedCarts.length) await q('UPDATE Carts SET isOrderLinked = 1 WHERE CartID IN (?)', [parkedCarts]);
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
