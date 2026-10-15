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

    try {
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
    } catch (err) {
        check('test run completed without errors', false, err.sqlMessage || err.message);
    } finally {
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
