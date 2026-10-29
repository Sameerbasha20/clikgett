'use strict';
// UPI at the door for cash-on-delivery orders.
//
// The rider shows a Razorpay UPI QR code for exactly the order amount. Razorpay tells
// us when it is paid (qr_code.credited webhook); the rider app also asks
// (GET .../upi-status), which checks Razorpay directly, so it works even if the
// webhook is late. Once paid, the order is marked PaymentStatus = 1 with
// DoorstepPaidVia = 'UPI', the rider has nothing to collect, and the customer's
// tracking screen shows "Paid via UPI".
//
// Needs RAZORPAYID / RAZORPAYSECRET (QR codes enabled on the Razorpay account) and,
// for instant updates, the webhook event qr_code.credited on
// https://<api-host>/api/payments/razorpay-webhook.
const pool = require('../utils/db');
const { ORDER_STATUS } = require('../utils/orderStatus');

const QR_MINUTES = 20;

const query = (sql, params = []) => new Promise((resolve, reject) =>
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

let razorpay = null;
const getRazorpay = () => {
    if (!razorpay && process.env.RAZORPAYID && process.env.RAZORPAYSECRET) {
        const Razorpay = require('razorpay');
        razorpay = new Razorpay({ key_id: process.env.RAZORPAYID.trim(), key_secret: process.env.RAZORPAYSECRET.trim() });
    }
    return razorpay;
};
// Tests replace the Razorpay client.
const setRazorpayForTests = (client) => { razorpay = client; };

class DoorstepError extends Error {
    constructor(message, httpStatus = 400) {
        super(message);
        this.httpStatus = httpStatus;
    }
}

const paise = (rupees) => Math.round(Number(rupees || 0) * 100);
const rupees = (v) => `₹${Number(v || 0) % 1 === 0 ? Number(v) : Number(v).toFixed(2)}`;

const riderOrder = async (orderId, riderId) => {
    const [order] = await query('SELECT * FROM Orders WHERE OrderID = ? AND DeliveryBoyID = ?', [orderId, riderId]);
    return order || null;
};

const isPaid = (order) => String(order.PaymentStatus) === '1';

/** Rider asks for a QR code. Returns { ImageUrl, Amount, QrID, ExpiresAt }. */
async function createQr(orderId, riderId) {
    const order = await riderOrder(orderId, riderId);
    if (!order) throw new DoorstepError('This order is not assigned to you', 403);
    if (String(order.PaymentMethod || '').toUpperCase() !== 'COD') throw new DoorstepError('This order is already paid online');
    if (isPaid(order)) throw new DoorstepError('This order is already paid');
    if (![ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ARRIVED].includes(Number(order.OrderStatus))) {
        throw new DoorstepError('Start the delivery first');
    }
    const amount = paise(order.GrandTotal);
    if (amount < 100) throw new DoorstepError('Nothing to collect for this order');
    const rp = getRazorpay();
    if (!rp) throw new DoorstepError('UPI QR is not set up yet. Please collect cash.', 503);

    // Reuse a QR made in the last few minutes so a double tap doesn't make two.
    if (order.DoorstepQrID) {
        try {
            const existing = await rp.qrCode.fetch(order.DoorstepQrID);
            if (existing && existing.status === 'active' && Number(existing.payment_amount) === amount) {
                return { QrID: existing.id, ImageUrl: existing.image_url, Amount: amount / 100, ExpiresAt: existing.close_by };
            }
        } catch (err) {
            // Make a new one below.
        }
    }
    const closeBy = Math.floor(Date.now() / 1000) + QR_MINUTES * 60;
    const qr = await rp.qrCode.create({
        type: 'upi_qr',
        name: 'ClikGett',
        usage: 'single_use',
        fixed_amount: true,
        payment_amount: amount,
        description: `Order #${String(order.OrderID).padStart(4, '0')}`,
        close_by: closeBy,
        notes: { OrderID: String(order.OrderID), Purpose: 'DOORSTEP_UPI' },
    });
    await query('UPDATE Orders SET DoorstepQrID = ?, DoorstepQrCreatedAt = NOW() WHERE OrderID = ?', [qr.id, order.OrderID]);
    return { QrID: qr.id, ImageUrl: qr.image_url, Amount: amount / 100, ExpiresAt: qr.close_by || closeBy };
}

/**
 * Records a captured payment against the order whose QR it paid. Idempotent: the
 * first matching call marks the order paid and notifies; later calls do nothing.
 * Returns true when this call recorded it.
 */
async function recordPayment(qrId, payment) {
    if (!qrId || !payment || payment.status !== 'captured') return false;
    const [order] = await query('SELECT * FROM Orders WHERE DoorstepQrID = ?', [qrId]);
    if (!order) return false;
    if (Number(payment.amount) !== paise(order.GrandTotal)) {
        console.error(`[DoorstepUpi] amount mismatch on order ${order.OrderID}: paid ${payment.amount}, due ${paise(order.GrandTotal)}`);
        return false;
    }
    const result = await query(
        `UPDATE Orders SET PaymentStatus = 1, DoorstepPaidVia = 'UPI', DoorstepPaymentID = ?, DoorstepPaidAt = NOW(),
                PaymentTransactionID = ?
          WHERE OrderID = ? AND DoorstepQrID = ? AND DoorstepPaymentID IS NULL`,
        [payment.id, payment.id, order.OrderID, qrId]);
    if (!result.affectedRows) return false;

    // Required lazily: OrderLifecycle pulls in Firebase.
    const OrderLifecycle = require('./OrderLifecycle');
    const amountText = rupees(order.GrandTotal);
    await OrderLifecycle.addTimeline(order.OrderID, order.OrderStatus, `Customer paid ${amountText} by UPI at the door (${payment.id}).`);
    await OrderLifecycle.notifyCustomer(order, '✅ Payment received', `We received ${amountText} by UPI. Thank you!`);
    await OrderLifecycle.notifyRider(order.DeliveryBoyID, '✅ UPI payment received',
        `${amountText} paid by UPI. Nothing to collect, just hand over the order.`, { orderId: order.OrderID, type: 'payment' });
    return true;
}

/** Rider app polls this while the QR is on screen. Returns { Paid, PaidVia, Amount }. */
async function status(orderId, riderId) {
    let order = await riderOrder(orderId, riderId);
    if (!order) throw new DoorstepError('This order is not assigned to you', 403);
    if (!isPaid(order) && order.DoorstepQrID && getRazorpay()) {
        try {
            const list = await getRazorpay().qrCode.fetchAllPayments(order.DoorstepQrID);
            const items = (list && list.items) || [];
            const captured = items.find((p) => p.status === 'captured');
            if (captured && await recordPayment(order.DoorstepQrID, captured)) {
                order = await riderOrder(orderId, riderId);
            }
        } catch (err) {
            console.error('[DoorstepUpi] status check failed:', err.message);
        }
    }
    return { Paid: isPaid(order) && order.DoorstepPaidVia === 'UPI', PaidVia: order.DoorstepPaidVia || null, Amount: Number(order.GrandTotal) };
}

/** From the Razorpay webhook (qr_code.credited). */
async function handleWebhookEvent(event) {
    if (!event || event.event !== 'qr_code.credited') return false;
    const qr = event.payload && event.payload.qr_code && event.payload.qr_code.entity;
    const payment = event.payload && event.payload.payment && event.payload.payment.entity;
    return recordPayment(qr && qr.id, payment);
}

module.exports = { createQr, status, recordPayment, handleWebhookEvent, DoorstepError, setRazorpayForTests };
