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

    console.log(`\n${passed}/${passed + failed} passed against ${BASE}`);
    process.exit(failed ? 1 : 0);
})().catch((err) => {
    console.error('FAIL  unexpected error', err);
    process.exit(1);
});
