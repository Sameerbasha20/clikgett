// Print store end to end: upload a PDF, add it to the cart, check the bill and delivery
// time, place a cash order and find the print job on the order.
//   API_URL=http://127.0.0.1:5000/api node server/tests/test_print_store.js
require('dotenv').config();
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const pool = require('../utils/db');

const BASE = (process.env.API_URL || 'http://127.0.0.1:5000/api').replace(/\/$/, '');
let passed = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
    if (ok) { passed++; console.log(`  PASS  ${name}`); } else { failed++; console.log(`  FAIL  ${name} ${detail}`); }
};
const q = (sql, params = []) => new Promise((resolve, reject) => pool.query(sql, params, (e, r) => (e ? reject(e) : resolve(r))));

const pdfBuffer = (pages) => new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    for (let i = 0; i < pages; i++) {
        if (i) doc.addPage();
        doc.text(`Page ${i + 1}`);
    }
    doc.end();
});

async function api(token, method, path, body) {
    const res = await fetch(BASE + path, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
}

(async () => {
    const [user] = await q(
        `SELECT u.UserID, a.Latitude, a.Longitude, a.Address FROM Users u JOIN Address a ON a.UserID = u.UserID
          WHERE IFNULL(u.Status, 1) <> 2 ORDER BY u.UserID LIMIT 1`);
    if (!user) throw new Error('Need a customer with a saved address');
    const token = jwt.sign({ UserID: user.UserID }, process.env.SECRET_KEY, { expiresIn: '1h' });
    const loc = { Latitude: user.Latitude, Longitude: user.Longitude };

    // Start from an empty cart.
    const [cart] = await q('SELECT CartID FROM Carts WHERE UserID = ? AND IsOrderLinked = 1', [user.UserID]);
    if (cart) await api(token, 'DELETE', `/carts/deletecart/${cart.CartID}`);

    const cfg = await api(token, 'GET', '/print/config');
    check('config has prices', cfg.data.Config && cfg.data.Config.PriceBW > 0 && cfg.data.Config.PriceColor > 0, JSON.stringify(cfg.data));

    const bad = await api(token, 'POST', '/print/upload-url', { ContentType: 'application/zip' });
    check('rejects other file types', bad.status === 400);

    const up = await api(token, 'POST', '/print/upload-url', { ContentType: 'application/pdf', FileName: 'notes.pdf' });
    check('upload link issued', up.data.Status === 1 && up.data.UploadUrl, JSON.stringify(up.data));
    const pdf = await pdfBuffer(3);
    const put = await fetch(up.data.UploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: pdf });
    check('file uploaded', put.status === 200, `HTTP ${put.status}`);

    const other = jwt.sign({ UserID: user.UserID + 999999 }, process.env.SECRET_KEY);
    const stolen = await api(other, 'POST', '/print/files', { Key: up.data.Key });
    check("another customer cannot claim the file", stolen.status !== 200 || stolen.data.Status !== 1);

    const file = await api(token, 'POST', '/print/files', { Key: up.data.Key, FileName: 'notes.pdf' });
    check('pages counted (3)', file.data.PrintJob && file.data.PrintJob.Pages === 3, JSON.stringify(file.data));
    const jobId = file.data.PrintJob.PrintJobID;

    const added = await api(token, 'POST', '/print/cart', { Jobs: [{ PrintJobID: jobId, Copies: 2, ColorMode: 'COLOR', Orientation: 'LANDSCAPE' }] });
    const expected = 3 * 2 * cfg.data.Config.PriceColor;
    check('in cart at 3 pages x 2 copies x colour', added.data.PrintJobs && added.data.PrintJobs[0].LineTotal === expected, JSON.stringify(added.data));

    let bill = (await api(token, 'POST', '/carts/bill', loc)).data.Bill;
    check('bill lists the print', bill.PrintItems.length === 1 && bill.PrintTotal === expected, JSON.stringify(bill.PrintItems));
    check('prints only: 20 minutes', bill.EtaMinutes === 20, `got ${bill.EtaMinutes}`);
    check('prints only: no minimum order', bill.MinOrderMet === true);
    check('to pay = prints + delivery', bill.ToPay === Math.round((expected + bill.DeliveryFee) * 100) / 100, `${bill.ToPay} vs ${expected}+${bill.DeliveryFee}`);

    const [product] = await q(
        `SELECT P.ProductID, V.VariantID FROM Products P JOIN ProductVariants V ON V.ProductID = P.ProductID
          WHERE P.Status = 1 AND V.Status = 1 AND V.AvailableQty > 5 ORDER BY V.OfferPrice DESC LIMIT 1`);
    await api(token, 'POST', '/carts/addcart', { ProductID: product.ProductID, VariantID: product.VariantID, Quantity: 1, Type: 1 });
    const withoutPrint = await (async () => {
        const DeliveryTime = require('../services/DeliveryTime');
        const km = await DeliveryTime.distanceFromStore(loc.Latitude, loc.Longitude);
        const items = await q('SELECT P.SubCategoryID, 1 AS Quantity FROM Products P WHERE P.ProductID = ?', [product.ProductID]);
        return (await DeliveryTime.estimate({ distanceKm: km, items })).totalMinutes;
    })();
    bill = (await api(token, 'POST', '/carts/bill', loc)).data.Bill;
    check('with other items: +10 minutes', bill.EtaMinutes === withoutPrint + 10, `got ${bill.EtaMinutes}, items alone ${withoutPrint}`);

    const patch = await api(token, 'PATCH', `/print/cart/${jobId}`, { Copies: 1 });
    bill = (await api(token, 'POST', '/carts/bill', loc)).data.Bill;
    check('copies change re-prices', patch.data.Status === 1 && bill.PrintTotal === 3 * cfg.data.Config.PriceColor, String(bill.PrintTotal));

    const order = await api(token, 'POST', '/orders/createorder', {
        ...loc, Address: user.Address, PaymentMethod: 'COD', TipAmount: 0, WalletAmount: 0, OrderType: 'Delivery', ScheduleStatus: 'Immediate',
    });
    if (order.data.Status !== 1 && /closed/i.test(order.data.Message || '')) {
        console.log('  SKIP  order placement (store closed):', order.data.Message);
    } else {
        check('order placed', order.data.Status === 1, JSON.stringify(order.data));
        const orderId = order.data.OrderID;
        const detail = await api(token, 'GET', `/orders/myorder/${orderId}`);
        const jobs = (detail.data.Orders || {}).PrintJobs || [];
        check('order shows the print job', jobs.length === 1 && jobs[0].Status === 'ORDERED', JSON.stringify(jobs));
        const current = await api(token, 'GET', '/orders/currentorders');
        const row = (current.data.Orders || []).find((o) => o.OrderID === orderId);
        check('order list flags prints', row && row.HasPrints === 1, JSON.stringify(row));
        const [o] = await q('SELECT SubTotal, GrandTotal FROM Orders WHERE OrderID = ?', [orderId]);
        check('subtotal includes prints', parseFloat(o.SubTotal) >= 3 * cfg.data.Config.PriceColor, JSON.stringify(o));
        const admin = await q('SELECT AdminID FROM AdminUsers WHERE Role = 1 LIMIT 1');
        const adminToken = jwt.sign({ AdminID: admin[0].AdminID }, process.env.SECRET_KEY);
        const adminJobs = await api(adminToken, 'GET', `/print/admin/orders/${orderId}`);
        check('admin gets a file link', adminJobs.data.PrintJobs && adminJobs.data.PrintJobs[0].FileUrl.includes('PrintFiles/'), JSON.stringify(adminJobs.data));
        const file = await fetch(adminJobs.data.PrintJobs[0].FileUrl);
        check('file link downloads the PDF', file.status === 200 && (file.headers.get('content-type') || '').includes('pdf'), `HTTP ${file.status}`);
        const unsigned = await fetch(adminJobs.data.PrintJobs[0].FileUrl.split('?')[0]);
        check('file is private without the signed link', unsigned.status === 403, `HTTP ${unsigned.status}`);
        // Leave the store as it was.
        await q('UPDATE Orders SET OrderStatus = 4, CancellationReason = ? WHERE OrderID = ?', ['print store test', orderId]);
    }

    console.log(`\n${passed}/${passed + failed} passed against ${BASE}`);
    process.exit(failed ? 1 : 0);
})().catch((err) => {
    console.error('FAIL  unexpected error', err);
    process.exit(1);
});
