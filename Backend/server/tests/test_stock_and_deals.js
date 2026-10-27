// Admin stock page, unlock deals and "previously bought" (local Docker DB).
//   API_URL=http://127.0.0.1:5000/api node server/tests/test_stock_and_deals.js
require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');

const BASE = (process.env.API_URL || 'http://127.0.0.1:5000/api').replace(/\/$/, '');
let passed = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
    if (ok) { passed++; console.log(`  PASS  ${name}`); } else { failed++; console.log(`  FAIL  ${name} ${detail}`); }
};
const q = (sql, params = []) => new Promise((resolve, reject) => pool.query(sql, params, (e, r) => (e ? reject(e) : resolve(r))));
const call = async (method, path, token, body) => {
    const res = await fetch(BASE + path, {
        method,
        headers: { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
};

(async () => {
    const [{ AdminID }] = await q('SELECT AdminID FROM AdminUsers WHERE Role = 1 LIMIT 1');
    const admin = jwt.sign({ AdminID }, process.env.SECRET_KEY, { expiresIn: '10m' });
    const [buyer] = await q(
        'SELECT O.UserID FROM Orders O WHERE O.OrderStatus NOT IN (3, 4) GROUP BY O.UserID ORDER BY COUNT(*) DESC LIMIT 1');
    const user = jwt.sign({ UserID: buyer.UserID }, process.env.SECRET_KEY, { expiresIn: '10m' });

    // ---- Stock page
    const stock = await call('GET', '/admin-stock', admin);
    check('stock lists every pack', stock.status === 200 && stock.data.Stock.length > 0, `HTTP ${stock.status}`);
    const live = stock.data.Stock.filter((s) => s.Active);
    check('summary counts out-of-stock packs', stock.data.Summary.OutOfStock === live.filter((s) => s.AvailableQty <= 0).length);
    check('customers cannot see the stock page', (await call('GET', '/admin-stock', user)).status === 401);

    const pack = live.find((s) => s.AvailableQty > 0);
    const added = await call('POST', `/admin-stock/${pack.VariantID}/add`, admin, { Quantity: 7 });
    const [after] = await q('SELECT AvailableQty FROM ProductVariants WHERE VariantID = ?', [pack.VariantID]);
    check('add stock adds to what is there', added.data.Status === 1 && after.AvailableQty === pack.AvailableQty + 7,
        `${pack.AvailableQty} + 7 -> ${after.AvailableQty}`);
    await q('UPDATE ProductVariants SET AvailableQty = ? WHERE VariantID = ?', [pack.AvailableQty, pack.VariantID]);
    check('rejects zero or negative quantities', (await call('POST', `/admin-stock/${pack.VariantID}/add`, admin, { Quantity: -5 })).status === 400);

    await q('UPDATE ProductVariants SET AvailableQty = 0 WHERE VariantID = ?', [pack.VariantID]);
    const alerts = await call('GET', '/admin-stock/alerts', admin);
    check('alerts include a pack that just ran out', alerts.data.VariantIDs.includes(pack.VariantID));
    await q('UPDATE ProductVariants SET AvailableQty = ? WHERE VariantID = ?', [pack.AvailableQty, pack.VariantID]);

    // ---- Previously bought
    const prev = await call('GET', '/products/previously-bought', user);
    const [ordered] = await q(
        `SELECT COUNT(DISTINCT OI.ProductID) n FROM OrderItems OI JOIN Orders O ON O.OrderID = OI.OrderID
           JOIN Products P ON P.ProductID = OI.ProductID
          WHERE O.UserID = ? AND O.OrderStatus NOT IN (3, 4) AND P.Status = 1`, [buyer.UserID]);
    check('previously bought lists the customer\'s products', prev.data.Products.length === Math.min(15, ordered.n),
        `${prev.data.Products.length} vs ${ordered.n}`);
    check('guests get no previously bought items', (await call('GET', '/products/previously-bought')).data.Products.length === 0);

    // ---- Unlock deals
    const deals = await call('GET', '/product-unlocks/deals', user);
    check('deals load', deals.status === 200 && Array.isArray(deals.data.Deals), `HTTP ${deals.status}`);
    const bill = await call('POST', '/carts/bill', user, {});
    const billUnlocks = new Map((bill.data.Bill.ProductUnlocks || []).map((u) => [u.UnlockID, u]));
    check('deal lock state matches the cart bill',
        deals.data.Deals.every((d) => !billUnlocks.has(d.UnlockID) || billUnlocks.get(d.UnlockID).IsUnlocked === d.IsUnlocked));
    const guest = await call('GET', '/product-unlocks/deals');
    check('guests see deals, all locked', guest.data.Deals.every((d) => d.IsUnlocked === false) && guest.data.LoggedIn === false);

    // ---- One cart value unlocks every deal (admin setting)
    const before = (await call('GET', '/product-unlocks/admin/settings', admin)).data.ThresholdAmount;
    check('unlock value is a shop-wide setting', before > 0, JSON.stringify(before));
    check('unlock value must be positive', (await call('PUT', '/product-unlocks/admin/settings', admin, { ThresholdAmount: 0 })).status === 400);
    const set = await call('PUT', '/product-unlocks/admin/settings', admin, { ThresholdAmount: 100 });
    check('admin sets the unlock value', set.data.Status === 1 && (await call('GET', '/product-unlocks/deals', user)).data.ThresholdAmount === 100);

    // ---- Admin creates a ₹1 deal (limit 1 per order) and checkout honours it
    const [dealPack, otherPack] = await q(
        `SELECT V.ProductID, V.VariantID, COALESCE(NULLIF(V.OfferPrice, 0), V.Price) AS Selling
           FROM ProductVariants V JOIN Products P ON P.ProductID = V.ProductID
          WHERE P.Status = 1 AND V.Status = 1 AND V.AvailableQty > 10 AND COALESCE(NULLIF(V.OfferPrice, 0), V.Price) BETWEEN 20 AND 200
            AND NOT EXISTS (SELECT 1 FROM product_unlocks pu WHERE pu.Status = 1 AND pu.ProductID = V.ProductID)
          ORDER BY V.VariantID LIMIT 2`);
    const tooHigh = await call('POST', '/product-unlocks/unlocks', admin, {
        ProductID: dealPack.ProductID, VariantID: dealPack.VariantID, UnlockPrice: dealPack.Selling, ThresholdAmount: 100 });
    check('deal price must be below the normal price', tooHigh.status === 400, JSON.stringify(tooHigh.data));
    const wrongPack = await call('POST', '/product-unlocks/unlocks', admin, {
        ProductID: dealPack.ProductID, VariantID: otherPack.VariantID, UnlockPrice: 1, ThresholdAmount: 100 });
    check('pack must belong to the product', wrongPack.status === 400 || dealPack.ProductID === otherPack.ProductID);
    const created = await call('POST', '/product-unlocks/unlocks', admin, {
        ProductID: dealPack.ProductID, VariantID: dealPack.VariantID, UnlockPrice: 1, ThresholdAmount: 100,
        MaxQtyPerOrder: 1, Message: 'Test deal' });
    check('admin creates a deal', created.data.Status === 1, JSON.stringify(created.data));
    const unlockId = created.data.UnlockID;
    const again = await call('POST', '/product-unlocks/unlocks', admin, {
        ProductID: dealPack.ProductID, VariantID: dealPack.VariantID, UnlockPrice: 0 });
    check('a pack can only be in the deals once', again.status === 400, JSON.stringify(again.data));
    const listed = (await call('GET', '/product-unlocks/unlocks', admin)).data.Unlocks.find((u) => u.UnlockID === unlockId);
    check('deal lists its pack, limit and message', listed && listed.VariantID === dealPack.VariantID
        && listed.MaxQtyPerOrder === 1 && listed.UnlockMessage === 'Test deal', JSON.stringify(listed));

    const [cartRow] = await q('SELECT CartID FROM Carts WHERE UserID = ? AND IsOrderLinked = 1', [buyer.UserID]);
    if (cartRow) await call('DELETE', `/carts/deletecart/${cartRow.CartID}`, user);
    await call('POST', '/carts/addcart', user, { ProductID: dealPack.ProductID, VariantID: dealPack.VariantID, Quantity: 2, Type: 1 });
    let deal = (await call('POST', '/carts/bill', user, {})).data.Bill.Items.find((i) => i.VariantID === dealPack.VariantID);
    check('deal item alone does not unlock itself', deal && Math.abs(deal.LineTotal - dealPack.Selling * 2) < 0.01,
        `line ${deal && deal.LineTotal}`);
    const fillQty = Math.ceil(110 / otherPack.Selling);
    await call('POST', '/carts/addcart', user, { ProductID: otherPack.ProductID, VariantID: otherPack.VariantID, Quantity: fillQty, Type: 1 });
    deal = (await call('POST', '/carts/bill', user, {})).data.Bill.Items.find((i) => i.VariantID === dealPack.VariantID);
    check('unlocked: ₹1 for 1, normal price for the 2nd', deal && Math.abs(deal.LineTotal - (1 + dealPack.Selling)) < 0.01,
        `line ${deal && deal.LineTotal}, expected ${1 + dealPack.Selling}`);

    await call('DELETE', `/product-unlocks/unlocks/${unlockId}`, admin);
    await call('PUT', '/product-unlocks/admin/settings', admin, { ThresholdAmount: before });
    const [cleanup] = await q('SELECT CartID FROM Carts WHERE UserID = ? AND IsOrderLinked = 1', [buyer.UserID]);
    if (cleanup) await call('DELETE', `/carts/deletecart/${cleanup.CartID}`, user);

    console.log(`\n${passed}/${passed + failed} passed against ${BASE}`);
    process.exit(failed ? 1 : 0);
})().catch((err) => {
    console.error('FAIL  unexpected error', err);
    process.exit(1);
});
