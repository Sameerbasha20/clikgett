'use strict';
// Refunds Razorpay payments that were captured but never turned into an order,
// wallet top-up or membership (e.g. the app closed or lost signal right after paying).
//
// Razorpay's payment.captured webhook records the payment on its OrderPayments row
// (CapturedAt). Every path that uses a payment sets ConsumedAt, so a row captured more
// than UNUSED_AFTER_MINUTES ago and still unconsumed is claimed (ConsumedAt set, so a
// late app request can no longer use it) and refunded in full.
//
// Settings: RAZORPAY_WEBHOOK_SECRET (Razorpay Dashboard > Webhooks, event
// payment.captured, URL https://<api-host>/api/payments/razorpay-webhook).
const crypto = require('crypto');
const pool = require('../utils/db');

const UNUSED_AFTER_MINUTES = 30;
const SWEEP_EVERY_MINUTES = 10;

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

const validSignature = (rawBody, signature) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature || !rawBody) return false;
    const expected = Buffer.from(crypto.createHmac('sha256', secret).update(rawBody).digest('hex'));
    const actual = Buffer.from(String(signature));
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

// POST /api/payments/razorpay-webhook (raw JSON body, X-Razorpay-Signature header)
async function webhook(req, res) {
    if (!validSignature(req.body, req.headers['x-razorpay-signature'])) {
        return res.status(400).json({ Status: 0, Message: 'Invalid signature' });
    }
    try {
        const event = JSON.parse(req.body.toString('utf8'));
        const payment = event && event.payload && event.payload.payment && event.payload.payment.entity;
        if (event.event === 'payment.captured' && payment && payment.order_id) {
            await query(
                `UPDATE OrderPayments SET CapturedAt = COALESCE(CapturedAt, NOW()), PaymentID = COALESCE(PaymentID, ?)
                  WHERE RazorpayOrderID = ? AND ConsumedAt IS NULL`,
                [payment.id, payment.order_id]);
        }
        return res.json({ Status: 1 });
    } catch (err) {
        console.error('[PaymentRecovery] webhook failed:', err.message);
        return res.status(500).json({ Status: 0 });
    }
}

/** Claims and refunds captured payments nobody used. Returns how many were refunded. */
async function refundUnusedPayments() {
    const rp = getRazorpay();
    if (!rp) return 0;
    const rows = await query(
        `SELECT OrderPaymentID, PaymentID, UserID, OrderAmount, Purpose FROM OrderPayments
          WHERE CapturedAt IS NOT NULL AND ConsumedAt IS NULL AND PaymentID LIKE 'pay\\_%'
            AND CapturedAt < NOW() - INTERVAL ${UNUSED_AFTER_MINUTES} MINUTE
          LIMIT 50`);
    let refunded = 0;
    for (const row of rows) {
        const claim = await query(
            "UPDATE OrderPayments SET ConsumedAt = NOW(), AutoRefundedAt = NOW() WHERE OrderPaymentID = ? AND ConsumedAt IS NULL",
            [row.OrderPaymentID]);
        if (!claim.affectedRows) continue;  // used by the app in the meantime
        try {
            const refund = await rp.payments.refund(row.PaymentID);
            await query("UPDATE OrderPayments SET AutoRefundID = ? WHERE OrderPaymentID = ?", [refund.id, row.OrderPaymentID]);
            refunded++;
            console.log(`[PaymentRecovery] refunded unused ${row.Purpose} payment ${row.PaymentID} (user ${row.UserID}, Rs.${row.OrderAmount})`);
        } catch (err) {
            const reason = String((err && err.error && err.error.description) || (err && err.message) || 'refund failed').slice(0, 250);
            await query("UPDATE OrderPayments SET AutoRefundError = ? WHERE OrderPaymentID = ?", [reason, row.OrderPaymentID]);
            console.error(`[PaymentRecovery] refund of ${row.PaymentID} failed, needs a manual refund:`, reason);
        }
    }
    return refunded;
}

function start() {
    setInterval(() => {
        refundUnusedPayments().catch((err) => console.error('[PaymentRecovery] sweep failed:', err.message));
    }, SWEEP_EVERY_MINUTES * 60 * 1000);
}

module.exports = { webhook, refundUnusedPayments, start, validSignature };
