// Flash sales against a running backend and the LOCAL database: discount from the MRP,
// per-order limit at the sale price, no sale price when it is not cheaper than the offer
// price, and the admin's photos, prices and limits.
//
//   API_URL=http://127.0.0.1:5001/api node server/tests/test_flash_sale.js
//
// Creates a throwaway customer, cart and sales; removes them afterwards.
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
const near = (a, b) => Math.abs(Number(a) - Number(b)) < 0.011;
const NEAR = { Latitude: 15.8281, Longitude: 78.0373 };

(async () => {
    const sales = [];
    let userId = null;
    try {
        const [admin] = await q('SELECT AdminID FROM AdminUsers WHERE Role = 1 AND Status = 1 LIMIT 1');
        const ADMIN = `token ${sign({ AdminID: admin.AdminID })}`;
        // A pack whose MRP is clearly above its offer price, so 20% off the MRP beats the offer.
        const [v] = await q(
            `SELECT V.ProductID, V.VariantID, V.Price, V.OfferPrice FROM ProductVariants V JOIN Products P ON P.ProductID = V.ProductID
              WHERE V.Status = 1 AND P.Status = 1 AND V.AvailableQty >= 10 AND V.Price * 0.8 < V.OfferPrice - 1 AND V.OfferPrice >= 40
                AND V.ProductID NOT IN (SELECT ProductID FROM product_unlocks WHERE Status = 1)
                AND V.ProductID NOT IN (SELECT ProductID FROM buy_more_config WHERE Status = 1)
                AND V.ProductID NOT IN (SELECT ProductID FROM SaleItems)
                AND (SELECT COUNT(*) FROM ProductVariants V2 WHERE V2.ProductID = V.ProductID AND V2.Status = 1) = 1
              ORDER BY V.VariantID LIMIT 1`);
        // And one whose offer price is already lower than 20% off the MRP.
        const [deep] = await q(
            `SELECT V.ProductID, V.VariantID, V.Price, V.OfferPrice FROM ProductVariants V JOIN Products P ON P.ProductID = V.ProductID
              WHERE V.Status = 1 AND P.Status = 1 AND V.AvailableQty >= 5 AND V.OfferPrice < V.Price * 0.8 AND V.OfferPrice >= 40
                AND V.ProductID NOT IN (SELECT ProductID FROM product_unlocks WHERE Status = 1)
                AND V.ProductID NOT IN (SELECT ProductID FROM buy_more_config WHERE Status = 1)
                AND V.ProductID NOT IN (SELECT ProductID FROM SaleItems) AND V.ProductID <> ?
              ORDER BY V.VariantID LIMIT 1`, [v ? v.ProductID : 0]);
        if (!v || !deep) throw new Error('Need products with MRP above offer price');

        const start = new Date(Date.now() - 3600e3).toISOString();
        const end = new Date(Date.now() + 3600e3).toISOString();
        let r = await call('POST', '/sales/create', ADMIN, {
            SaleName: 'Test sale', DiscountType: 'percentage', DiscountValue: 20, StartDate: start, EndDate: end, Status: 1,
            Items: [{ ProductID: v.ProductID, MaxQtyPerOrder: 2 }, { ProductID: deep.ProductID, MaxQtyPerOrder: 2 }],
        });
        check('admin creates a sale with limits', r.json && r.json.Status === 1, JSON.stringify(r.json));
        const saleId = r.json && r.json.SaleID;
        if (saleId) sales.push(saleId);

        const salePrice = Math.round(v.Price * 0.8 * 100) / 100;
        r = await call('GET', `/sales/details/${saleId}`, ADMIN);
        const item = r.json && (r.json.Items || []).find((i) => i.ProductID === v.ProductID);
        check('sale details show the limit, MRP and offer price', item && item.MaxQtyPerOrder === 2 && near(item.MRP, v.Price) && near(item.OfferPrice, v.OfferPrice),
            JSON.stringify(item));
        check('sale details have a photo address (or none), never "NA"', item && (item.Image === null || /^https?:/.test(item.Image)), item && item.Image);

        r = await call('GET', '/sales/catalog', ADMIN);
        const listed = r.json && (r.json.Products || []).find((p) => p.ProductID === v.ProductID);
        check('product picker shows unit, MRP and offer price', listed && near(listed.MRP, v.Price) && near(listed.OfferPrice, v.OfferPrice) && listed.Unit,
            JSON.stringify(listed));

        // Customer side: the card price and the bill.
        const u = await q('INSERT INTO Users SET ?', [{ FirstName: 'Sale', LastName: 'Test', MobileNumber: '95' + String(Date.now()).slice(-8), WalletAmount: 0, Status: 1 }]);
        userId = u.insertId;
        const CUSTOMER = `bearer ${sign({ UserID: userId })}`;
        r = await call('GET', '/sales/getsales', CUSTOMER);
        const sale = r.json && (r.json.Sales || []).find((s) => s.SaleID === saleId);
        const shown = sale && (sale.Products || []).find((p) => p.ProductID === v.ProductID);
        const variant = shown && (shown.ProductVariants || []).find((x) => x.VariantID === v.VariantID);
        check('the app gets the sale product with its sale price from MRP', variant && near(variant.SalePrice, salePrice),
            variant && `${variant.SalePrice} vs ${salePrice}`);
        check('the app is told the limit', shown && shown.Deal && shown.Deal.MaxQtyPerOrder === 2, shown && JSON.stringify(shown.Deal));
        const notCheaper = sale && (sale.Products || []).find((p) => p.ProductID === deep.ProductID);
        check('no sale price where the offer price is already lower', !notCheaper || !notCheaper.Deal, notCheaper && JSON.stringify(notCheaper.Deal));

        const cart = await q('INSERT INTO Carts (UserID, Status, isOrderLinked, CreatedAt) VALUES (?, 1, 1, NOW())', [userId]);
        const fill = async (qty, row) => {
            await q('DELETE FROM CartItems WHERE CartID = ?', [cart.insertId]);
            await q('INSERT INTO CartItems (CartID, ProductID, VariantID, Quantity, Price, Type, CreatedAt) VALUES (?, ?, ?, ?, ?, 1, NOW())',
                [cart.insertId, row.ProductID, row.VariantID, qty, row.OfferPrice]);
            const b = await call('POST', '/carts/bill', CUSTOMER, { ...NEAR });
            return (b.json && b.json.Bill && b.json.Bill.Items || []).find((i) => i.VariantID === row.VariantID);
        };
        let line = await fill(1, v);
        check('1 unit: sale price (20% off MRP)', line && near(line.LineTotal, salePrice), line && `${line.LineTotal} vs ${salePrice}`);
        line = await fill(3, v);
        check('3 units with a limit of 2: 2 at sale price, 1 at offer price', line && near(line.LineTotal, salePrice * 2 + v.OfferPrice),
            line && `${line.LineTotal} vs ${salePrice * 2 + v.OfferPrice}`);
        line = await fill(2, deep);
        check('a sale that is not cheaper than the offer price is not used', line && near(line.LineTotal, deep.OfferPrice * 2),
            line && `${line.LineTotal} vs ${deep.OfferPrice * 2}`);

        // Admin changes the limit, and replaces the products.
        r = await call('POST', '/sales/item-limit', ADMIN, { SaleItemID: item.SaleItemID, MaxQtyPerOrder: 101 });
        check('limit above 100 is refused', r.status === 400);
        r = await call('POST', '/sales/item-limit', ADMIN, { SaleItemID: item.SaleItemID, MaxQtyPerOrder: 3 });
        check('admin changes the limit', r.json && r.json.Status === 1);
        line = await fill(3, v);
        check('with a limit of 3, all 3 units get the sale price', line && near(line.LineTotal, salePrice * 3), line && line.LineTotal);
        r = await call('POST', '/sales/update', ADMIN, { SaleID: saleId, Items: [{ ProductID: v.ProductID, MaxQtyPerOrder: 1 }] });
        r = await call('GET', `/sales/details/${saleId}`, ADMIN);
        check('saving the sale with a product list replaces its products', r.json && r.json.Items.length === 1 && r.json.Items[0].MaxQtyPerOrder === 1,
            JSON.stringify((r.json.Items || []).map((i) => [i.ProductID, i.MaxQtyPerOrder])));
        await q('DELETE FROM CartItems WHERE CartID = ?', [cart.insertId]);
        await q('DELETE FROM Carts WHERE CartID = ?', [cart.insertId]);
    } catch (err) {
        check('test run completed without errors', false, err.sqlMessage || err.message);
    } finally {
        for (const id of sales) {
            await q('DELETE FROM SaleItems WHERE SaleID = ?', [id]);
            await q('DELETE FROM Sales WHERE SaleID = ?', [id]);
        }
        if (userId) {
            await q('DELETE FROM CartItems WHERE CartID IN (SELECT CartID FROM Carts WHERE UserID = ?)', [userId]);
            await q('DELETE FROM Carts WHERE UserID = ?', [userId]);
            await q('DELETE FROM Users WHERE UserID = ?', [userId]);
        }
        const passed = results.filter(Boolean).length;
        console.log(`\n${passed}/${results.length} passed against ${BASE}`);
        pool.end();
        process.exit(passed === results.length ? 0 : 1);
    }
})();
