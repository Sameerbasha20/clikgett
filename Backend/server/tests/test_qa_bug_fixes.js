// QA bug batch (admin web + user app reports, Oct 2026), against the local Docker DB.
//   API_URL=http://127.0.0.1:5000/api node server/tests/test_qa_bug_fixes.js
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

// 1x1 PNG
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

(async () => {
    const [{ AdminID }] = await q('SELECT AdminID FROM AdminUsers WHERE Role = 1 LIMIT 1');
    const admin = jwt.sign({ AdminID }, process.env.SECRET_KEY, { expiresIn: '10m' });
    const [buyer] = await q('SELECT UserID FROM Orders GROUP BY UserID ORDER BY COUNT(*) DESC LIMIT 1');
    const user = jwt.sign({ UserID: buyer.UserID }, process.env.SECRET_KEY, { expiresIn: '10m' });

    // ---- Admin orders: status text filter and status field (BUG: NaN status, filter error)
    const past = await call('GET', '/adminorders/pastorders?status=DELIVERED', admin);
    check('past orders filter by status name', past.status === 200 && past.data.Status === 1, `HTTP ${past.status}`);
    check('filtered past orders are all delivered', (past.data.Orders || []).every((o) => o.OrderStatus === 1));
    const current = await call('GET', '/adminorders/currentorders?status=9', admin);
    check('current orders filter by status number', current.status === 200 && (current.data.Orders || []).every((o) => o.OrderStatus === 9));
    const unknown = await call('GET', '/adminorders/pastorders?status=abc', admin);
    check('unknown status gets a clear message', unknown.status === 400 && /Unknown status/.test(unknown.data.Message));
    const odd = await call('GET', '/adminorders/pastorders?mobile=%27%20OR%201%3D1', admin);
    check('quotes in the mobile filter are treated as text', odd.status === 200 && odd.data.Orders.length === 0, `HTTP ${odd.status}`);

    // ---- Category create with an image (was a 500: base64 went into a short column)
    const catName = `QA Category ${Date.now()}`;
    const cat = await call('POST', '/categories/addcategory', admin, { CategoryName: catName, ImageUrl: `data:image/png;base64,${PNG}` });
    check('category with image is created', cat.data.Status === 1 || cat.data.status === 1, JSON.stringify(cat.data).slice(0, 160));
    const [catRow] = await q('SELECT CategoryID, ImageUrl FROM Categories WHERE CategoryName = ?', [catName]);
    check('category stores an image file name', catRow && catRow.ImageUrl && !catRow.ImageUrl.startsWith('data:'), catRow && catRow.ImageUrl);
    const dup = await call('POST', '/categories/addcategory', admin, { CategoryName: catName, ImageUrl: `data:image/png;base64,${PNG}` });
    check('duplicate category is refused', !(dup.data.Status === 1 || dup.data.status === 1));

    // ---- Product step 1 without images
    const [sub] = await q('SELECT SubCategoryID, CategoryID FROM SubCategories LIMIT 1');
    const prodName = `QA Product ${Date.now()}`;
    const prod = await call('POST', '/adminproducts/addproduct', admin, {
        CategoryID: sub.CategoryID, SubCategoryID: sub.SubCategoryID, ProductName: prodName, Description: "Bob's <b>fresh</b>",
        Type: 1, Status: 1,
        ProductVariants: [{ metrictype: 'gm', metricvalue: '500', AvailableQty: 5, Price: 100, OfferPrice: 90 }],
    });
    check('product is created before images are added', prod.data.Status === 1 && prod.data.ProductID, JSON.stringify(prod.data).slice(0, 160));
    const noName = await call('POST', '/adminproducts/addproduct', admin, { SubCategoryID: sub.SubCategoryID, ProductName: '  ', Type: 1, ProductVariants: [{}] });
    check('blank product name is refused', noName.status === 422 || noName.status === 400 || noName.data.Status === 0, `HTTP ${noName.status}`);

    // ---- Support enquiry with three photos
    const enq = await call('POST', '/customer/enquiries', user, {
        description: 'Two items were damaged', subject: 'Damaged items in my order', category: 'Order Related',
        images: [1, 2, 3].map(() => ({ imageBase64: PNG, mimeType: 'image/png' })),
    });
    check('enquiry with 3 photos is saved', enq.data.Status === 1, JSON.stringify(enq.data).slice(0, 160));
    const enquiryId = enq.data.EnquiryID;
    const [enqRow] = await q('SELECT ImagePaths FROM CustomerEnquiries WHERE EnquiryID = ?', [enquiryId]);
    check('all 3 photo paths are stored', JSON.parse(enqRow.ImagePaths || '[]').length === 3);
    const third = await fetch(`${BASE}/admin/customer-enquiries/image/${enquiryId}?index=2`, { headers: { Authorization: `Bearer ${admin}` } });
    check('admin can open the third photo', third.status === 200, `HTTP ${third.status}`);

    // ---- Photo order: customer cancels while waiting
    const photo = await call('POST', '/photo-orders/submit', user, { imageBase64: PNG, mimeType: 'image/png', customerNotes: 'QA test' });
    check('photo order is submitted', photo.data.Status === 1, JSON.stringify(photo.data).slice(0, 160));
    const requestId = photo.data.RequestID || (photo.data.Data && photo.data.Data.RequestID);
    const img = await fetch(`${BASE}/photo-orders/image/${requestId}`, { headers: { Authorization: `Bearer ${user}` } });
    check('customer can load their photo', img.status === 200, `HTTP ${img.status}`);
    const other = jwt.sign({ UserID: buyer.UserID + 999999 }, process.env.SECRET_KEY, { expiresIn: '10m' });
    check('someone else cannot cancel it', (await call('POST', `/photo-orders/request/${requestId}/cancel`, other)).status !== 200);
    const cancel = await call('POST', `/photo-orders/request/${requestId}/cancel`, user);
    const [pr] = await q('SELECT RequestStatus FROM PhotoOrderRequests WHERE RequestID = ?', [requestId]);
    check('customer cancels a pending photo order', cancel.data.Status === 1 && pr.RequestStatus === 'CANCELLED', pr && pr.RequestStatus);
    check('a cancelled request cannot be cancelled again', (await call('POST', `/photo-orders/request/${requestId}/cancel`, user)).status === 400);

    // ---- Notification settings
    const prefs = await call('GET', '/users/notification-preferences', user);
    check('notification settings load (on by default)', prefs.data.Status === 1 && prefs.data.OrderUpdates === true);
    const off = await call('PUT', '/users/notification-preferences', user, { Offers: false });
    const after = await call('GET', '/users/notification-preferences', user);
    check('offers can be switched off', off.data.Status === 1 && after.data.Offers === false && after.data.OrderUpdates === true);
    check('empty update is refused', (await call('PUT', '/users/notification-preferences', user, {})).status === 400);
    await call('PUT', '/users/notification-preferences', user, { Offers: true });

    // ---- Clean up
    await q('DELETE FROM Categories WHERE CategoryName = ?', [catName]);
    if (prod.data.ProductID) {
        await q('DELETE FROM ProductVariants WHERE ProductID = ?', [prod.data.ProductID]);
        await q('DELETE FROM Products WHERE ProductID = ?', [prod.data.ProductID]);
    }
    if (enquiryId) await q('DELETE FROM CustomerEnquiries WHERE EnquiryID = ?', [enquiryId]);
    if (requestId) {
        await q('DELETE FROM PhotoOrderStatusTimeline WHERE RequestID = ?', [requestId]);
        await q('DELETE FROM PhotoOrderRequests WHERE RequestID = ?', [requestId]);
    }

    console.log(`\n${passed}/${passed + failed} passed against ${BASE}`);
    process.exit(failed ? 1 : 0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
