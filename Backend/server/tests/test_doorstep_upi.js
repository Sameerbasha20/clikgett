'use strict';
// UPI at the door for cash-on-delivery orders (services/DoorstepUpi.js), with a
// stand-in for Razorpay. Borrows one order, changes it for the test and puts every
// field back at the end.
//   node server/tests/test_doorstep_upi.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

require('./testDatabaseGuard')();

const pool = require('../utils/db');
const DoorstepUpi = require('../services/DoorstepUpi');

let passed = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
    if (ok) { passed++; console.log(`  PASS  ${name}`); } else { failed++; console.log(`  FAIL  ${name} ${detail}`); }
};
const q = (sql, params = []) => new Promise((resolve, reject) => pool.query(sql, params, (e, r) => (e ? reject(e) : resolve(r))));
const fails = async (fn) => {
    try { await fn(); return null; } catch (err) { return err; }
};

// Stand-in Razorpay: QR codes it made, and payments "made" by the customer.
const fakeRazorpay = () => {
    const qrs = new Map();
    let n = 0;
    return {
        qrs,
        qrCode: {
            create: async (body) => {
                const qr = { id: `qr_test_${++n}`, image_url: `https://rzp.io/i/qr_test_${n}`, status: 'active', ...body, payments: [] };
                qrs.set(qr.id, qr);
                return qr;
            },
            fetch: async (id) => qrs.get(id),
            fetchAllPayments: async (id) => ({ items: (qrs.get(id) || { payments: [] }).payments }),
        },
    };
};

(async () => {
    const [rider] = await q('SELECT AdminID FROM AdminUsers WHERE Role = 2 LIMIT 1');
    const [order] = await q('SELECT * FROM Orders ORDER BY OrderID DESC LIMIT 1');
    if (!rider || !order) {
        console.log('  SKIP  needs a rider and an order');
        process.exit(0);
    }
    const fields = ['PaymentMethod', 'PaymentStatus', 'OrderStatus', 'DeliveryBoyID', 'GrandTotal', 'PaymentTransactionID',
        'DoorstepQrID', 'DoorstepQrCreatedAt', 'DoorstepPaidVia', 'DoorstepPaymentID', 'DoorstepPaidAt'];
    const original = Object.fromEntries(fields.map((f) => [f, order[f]]));
    const [{ maxNote }] = await q('SELECT COALESCE(MAX(NotificationID), 0) AS maxNote FROM UserNotifications');
    const [{ maxTimeline }] = await q('SELECT COALESCE(MAX(TimelineID), 0) AS maxTimeline FROM OrderStatusTimeline').catch(() => [{ maxTimeline: null }]);
    const id = order.OrderID;

    try {
        await q(`UPDATE Orders SET PaymentMethod = 'COD', PaymentStatus = 0, OrderStatus = 5, DeliveryBoyID = ?, GrandTotal = 41.5,
                    DoorstepQrID = NULL, DoorstepQrCreatedAt = NULL, DoorstepPaidVia = NULL, DoorstepPaymentID = NULL, DoorstepPaidAt = NULL
                  WHERE OrderID = ?`, [rider.AdminID, id]);

        // Without Razorpay keys the rider is told to collect cash.
        DoorstepUpi.setRazorpayForTests(null);
        const savedId = process.env.RAZORPAYID;
        delete process.env.RAZORPAYID;
        let err = await fails(() => DoorstepUpi.createQr(id, rider.AdminID));
        check('no Razorpay keys -> "collect cash"', err && err.httpStatus === 503, err && err.message);
        if (savedId !== undefined) process.env.RAZORPAYID = savedId;

        const rp = fakeRazorpay();
        DoorstepUpi.setRazorpayForTests(rp);

        err = await fails(() => DoorstepUpi.createQr(id, rider.AdminID + 99999));
        check('another rider cannot make the QR', err && err.httpStatus === 403);

        const qr = await DoorstepUpi.createQr(id, rider.AdminID);
        const made = rp.qrs.get(qr.QrID);
        check('QR is a single-use UPI QR for the exact amount (paise)',
            made && made.type === 'upi_qr' && made.usage === 'single_use' && made.fixed_amount === true && made.payment_amount === 4150,
            JSON.stringify(made));
        check('QR image is returned to the rider app', qr.ImageUrl.startsWith('https://') && qr.Amount === 41.5);
        const again = await DoorstepUpi.createQr(id, rider.AdminID);
        check('a second tap reuses the same QR', again.QrID === qr.QrID && rp.qrs.size === 1);

        let s = await DoorstepUpi.status(id, rider.AdminID);
        check('not paid before the customer pays', s.Paid === false);

        // Wrong amount is never accepted.
        const wrong = { id: 'pay_wrong', status: 'captured', amount: 100 };
        check('a payment for a different amount is ignored', (await DoorstepUpi.recordPayment(qr.QrID, wrong)) === false);

        // Customer pays; the rider app's status check finds it at Razorpay.
        made.payments.push({ id: 'pay_test_1', status: 'captured', amount: 4150 });
        s = await DoorstepUpi.status(id, rider.AdminID);
        check('status check records the payment', s.Paid === true && s.PaidVia === 'UPI');
        const [after] = await q('SELECT PaymentStatus, DoorstepPaidVia, DoorstepPaymentID FROM Orders WHERE OrderID = ?', [id]);
        check('order is marked paid by UPI', String(after.PaymentStatus) === '1' && after.DoorstepPaidVia === 'UPI' && after.DoorstepPaymentID === 'pay_test_1');

        // The webhook for the same payment changes nothing (and notifies nobody twice).
        const dup = await DoorstepUpi.handleWebhookEvent({
            event: 'qr_code.credited',
            payload: { qr_code: { entity: { id: qr.QrID } }, payment: { entity: { id: 'pay_test_1', status: 'captured', amount: 4150 } } },
        });
        check('webhook after the status check does nothing', dup === false);
        const notes = await q("SELECT Title, OrderID FROM UserNotifications WHERE NotificationID > ? AND Title LIKE '%Payment received%'", [maxNote]);
        check('customer is told once, linked to the order', notes.length === 1 && Number(notes[0].OrderID) === id, JSON.stringify(notes));

        err = await fails(() => DoorstepUpi.createQr(id, rider.AdminID));
        check('no new QR once paid', err && /already paid/.test(err.message));

        // Webhook path on a fresh QR.
        await q(`UPDATE Orders SET PaymentStatus = 0, DoorstepQrID = NULL, DoorstepPaidVia = NULL, DoorstepPaymentID = NULL, DoorstepPaidAt = NULL WHERE OrderID = ?`, [id]);
        const qr2 = await DoorstepUpi.createQr(id, rider.AdminID);
        const viaHook = await DoorstepUpi.handleWebhookEvent({
            event: 'qr_code.credited',
            payload: { qr_code: { entity: { id: qr2.QrID } }, payment: { entity: { id: 'pay_test_2', status: 'captured', amount: 4150 } } },
        });
        check('qr_code.credited webhook marks the order paid', viaHook === true);

        // Online orders never get a doorstep QR.
        await q("UPDATE Orders SET PaymentMethod = 'ONLINE', PaymentStatus = 0, DoorstepQrID = NULL, DoorstepPaymentID = NULL, DoorstepPaidVia = NULL WHERE OrderID = ?", [id]);
        err = await fails(() => DoorstepUpi.createQr(id, rider.AdminID));
        check('online orders cannot get a doorstep QR', err && /paid online/.test(err.message));
    } finally {
        await q(`UPDATE Orders SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE OrderID = ?`, [...fields.map((f) => original[f]), id]);
        await q('DELETE FROM UserNotifications WHERE NotificationID > ? AND (Title LIKE ? )', [maxNote, '%Payment received%']);
        if (maxTimeline !== null) await q("DELETE FROM OrderStatusTimeline WHERE TimelineID > ? AND Notes LIKE 'Customer paid%by UPI%'", [maxTimeline]);
    }

    console.log(`\n${passed}/${passed + failed} passed`);
    process.exit(failed ? 1 : 0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
