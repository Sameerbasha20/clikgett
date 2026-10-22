// Customer requests, enquiries, serviceability and rider problem reports, against
// a running backend and the LOCAL database. Everything created is removed.
//
//   API_URL=http://127.0.0.1:5001/api npm run test:features
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

(async () => {
    const [user] = await q("SELECT UserID, MobileNumber FROM Users WHERE MobileNumber = '9999999999' LIMIT 1");
    const [rider] = await q("SELECT AdminID FROM AdminUsers WHERE MobileNumber = '9999999999' AND Role = 2 LIMIT 1");
    const [admin] = await q('SELECT AdminID FROM AdminUsers WHERE Role = 1 AND Status = 1 LIMIT 1');
    const [shop] = await q('SELECT Latitude, Longitude, DeliveryRadiusKm FROM AdminShopToggleSettings LIMIT 1');
    const CUSTOMER = `bearer ${sign({ UserID: user.UserID })}`;
    const RIDER = `bearer ${sign({ AdminID: rider.AdminID, Role: 2 })}`;
    const ADMIN = `token ${sign({ AdminID: admin.AdminID })}`;
    const name = `TEST REQUEST ${Date.now()}`;
    let orderId = null;
    try {
        // ---- Product request: customer asks, admin sees and updates, customer sees the reply
        let r = await call('POST', '/customer/product-requests', CUSTOMER, { productName: '' });
        check('product request needs a product name', r.status === 400);
        r = await call('POST', '/customer/product-requests', CUSTOMER, { productName: name, brand: 'TestBrand', sizeOrQty: '1 kg' });
        check('customer submits a product request', r.json && r.json.Status === 1, r.json && r.json.Message);
        const [req] = await q('SELECT RequestID FROM ProductRequests WHERE ProductName = ? AND UserID = ?', [name, user.UserID]);
        r = await call('GET', '/admin/product-requests', ADMIN);
        check('admin sees the request', r.json && JSON.stringify(r.json).includes(name));
        r = await call('PUT', `/admin/product-requests/${req.RequestID}/status`, ADMIN, { status: 'In Progress', adminNotes: 'Ordering from supplier' });
        check('admin updates the request', r.json && r.json.Status === 1, r.json && r.json.Message);
        r = await call('GET', '/customer/product-requests/my', CUSTOMER);
        const mine = r.json && (r.json.Requests || []).find((x) => x.ProductName === name);
        check('customer sees status and reply', mine && mine.Status === 'In Progress' && mine.AdminNotes === 'Ordering from supplier');

        // ---- Enquiry
        r = await call('POST', '/customer/enquiries', CUSTOMER, { subject: name, description: '' });
        check('enquiry needs a description', r.status === 400);
        r = await call('POST', '/customer/enquiries', CUSTOMER, { subject: name, description: 'Item missing from my order' });
        check('customer sends an enquiry', r.json && r.json.Status === 1, r.json && r.json.Message);
        const [enq] = await q('SELECT EnquiryID FROM CustomerEnquiries WHERE Subject = ? AND UserID = ?', [name, user.UserID]);
        r = await call('PUT', `/admin/customer-enquiries/${enq.EnquiryID}/status`, ADMIN, { status: 'Resolved', adminNotes: 'Refunded to wallet' });
        check('admin resolves the enquiry', r.json && r.json.Status === 1, r.json && r.json.Message);
        r = await call('GET', '/customer/enquiries/my', CUSTOMER);
        const myEnq = r.json && (r.json.Enquiries || []).find((x) => x.Subject === name);
        check('customer sees the resolution', myEnq && myEnq.Status === 'Resolved' && myEnq.AdminNotes === 'Refunded to wallet');

        // ---- Serviceability: inside vs outside the delivery radius
        r = await call('POST', '/address/check-serviceability', null, { Latitude: parseFloat(shop.Latitude) + 0.01, Longitude: parseFloat(shop.Longitude) });
        check('address near the store is serviceable', r.json && r.json.IsServiceable === true && r.json.EtaMinutes > 0);
        r = await call('POST', '/address/check-serviceability', null, { Latitude: parseFloat(shop.Latitude) + 1, Longitude: parseFloat(shop.Longitude) });
        check('address 100+ km away is not serviceable', r.json && r.json.IsServiceable === false && r.json.EtaMinutes == null);

        // ---- Rider delay and problem reports on a test order
        const [variant] = await q('SELECT ProductID, VariantID, Price, OfferPrice FROM ProductVariants WHERE status = 1 AND AvailableQty > 5 LIMIT 1');
        const ins = await q(
            `INSERT INTO Orders (UserID, MobileNumber, SubTotal, GrandTotal, WalletAmount, PaymentMethod, PaymentStatus, PaymentTransactionID,
                                 OrderStatus, DeliveryBoyID, Address, Latitude, Longitude, Distance, EstimateDateTime, CreatedAt)
             VALUES (?, ?, ?, ?, 0, 'COD', 0, 'NA', 5, ?, 'TEST ORDER - features test', 15.8281, 78.0373, 2, NOW() + INTERVAL 20 MINUTE, NOW())`,
            [user.UserID, user.MobileNumber, variant.OfferPrice, variant.OfferPrice, rider.AdminID]
        );
        orderId = ins.insertId;
        r = await call('POST', '/deliveryboy/orders/report-delay', RIDER, { OrderID: orderId, Reason: 'OTHER', RequestedMinutes: 10, Remarks: '' });
        check('"Other" delay needs an explanation', r.json && r.json.Status === 0);
        r = await call('POST', '/deliveryboy/orders/report-delay', RIDER, { OrderID: orderId, Reason: 'HEAVY_TRAFFIC', RequestedMinutes: 10, Remarks: 'Heavy traffic' });
        check('rider reports a delay', r.json && r.json.Status === 1, r.json && r.json.Message);
        r = await call('POST', '/deliveryboy/orders/report-issue', RIDER, { OrderID: orderId, IssueType: 'CUSTOMER_UNREACHABLE', Description: 'Customer not reachable' });
        check('rider reports a problem', r.json && r.json.Status === 1, r.json && r.json.Message);
        r = await call('GET', '/adminorders/delays', ADMIN);
        check('admin sees the delay in the review queue', r.json && JSON.stringify(r.json).includes(String(orderId)));
        const OTHER = `bearer ${sign({ AdminID: admin.AdminID, Role: 2 })}`;
        r = await call('POST', '/deliveryboy/orders/report-delay', OTHER, { OrderID: orderId, Reason: 'HEAVY_TRAFFIC', RequestedMinutes: 10, Remarks: 'x' });
        check("rider can't report on someone else's order", r.json && r.json.Status === 0);
    } catch (err) {
        check('test run completed without errors', false, err.sqlMessage || err.message);
    } finally {
        await q('DELETE FROM ProductRequests WHERE ProductName = ?', [name]).catch(() => {});
        await q('DELETE FROM CustomerEnquiries WHERE Subject = ?', [name]).catch(() => {});
        if (orderId) {
            for (const t of ['OrderDelays', 'OrderIssues', 'OrderETAAdjustments', 'OrderStatusTimeline']) {
                await q(`DELETE FROM ${t} WHERE OrderID = ?`, [orderId]).catch(() => {});
            }
            await q('DELETE FROM Orders WHERE OrderID = ?', [orderId]);
        }
        await q("DELETE FROM UserNotifications WHERE UserID = ? AND CreatedAt > NOW() - INTERVAL 10 MINUTE", [user.UserID]).catch(() => {});
        const passed = results.filter(Boolean).length;
        console.log(`\n${passed}/${results.length} passed against ${BASE}`);
        pool.end();
        process.exit(passed === results.length ? 0 : 1);
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
