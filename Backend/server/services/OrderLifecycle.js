// Order lifecycle: every order status change goes through transition() so that
// validation, the status timeline, stock/wallet/refund side effects and push
// notifications happen the same way no matter who triggers the change
// (customer, admin or rider).
const moment = require('moment');
const admin = require('firebase-admin');
const pool = require('../utils/db');
const CommonController = require('../controllers/CommonController');
const { ORDER_STATUS: S, STATUS_LABELS, RIDER_ACTIVE_STATUSES, canTransition, isFinal } = require('../utils/orderStatus');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

// Timestamps in this codebase are stored as IST wall-clock values.
const istNow = () => moment().utcOffset(330).format('YYYY-MM-DD HH:mm:ss');

const orderLabel = (order) => `#${String(order.OrderID).padStart(4, '0')}`;

class LifecycleError extends Error {
    constructor(message, httpStatus = 400) {
        super(message);
        this.httpStatus = httpStatus;
    }
}

let razorpay = null;
const getRazorpay = () => {
    if (!razorpay && process.env.RAZORPAYID && process.env.RAZORPAYSECRET) {
        const Razorpay = require('razorpay');
        razorpay = new Razorpay({ key_id: process.env.RAZORPAYID.trim(), key_secret: process.env.RAZORPAYSECRET.trim() });
    }
    return razorpay;
};

const addTimeline = (orderId, status, note) =>
    query("INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, ?, ?, NOW())", [orderId, status, note])
        .catch((err) => console.error('timeline insert failed', err.message));

const notifyCustomer = async (order, title, message) => {
    try {
        await CommonController.Send_Notification({ Title: title, Message: message }, order.UserID);
    } catch (err) {
        console.error('customer push failed', err && err.message);
    }
};

// The delivery app lives in its own Firebase project (clikgett-delivery), so rider
// pushes need that project's service account: RIDER_FIREBASE_CREDENTIALS = path to its JSON,
// or the file Backend/server/utils/clikgett-delivery-firebase.json (git-ignored).
let riderMessaging = null;
const getRiderMessaging = () => {
    if (riderMessaging) return riderMessaging;
    const fs = require('fs');
    const path = require('path');
    const defaultPath = path.join(__dirname, '..', 'utils', 'clikgett-delivery-firebase.json');
    const credPath = process.env.RIDER_FIREBASE_CREDENTIALS || (fs.existsSync(defaultPath) ? defaultPath : null);
    try {
        if (credPath) {
            const existing = admin.apps.find((a) => a && a.name === 'rider');
            const app = existing || admin.initializeApp({ credential: admin.credential.cert(require(require('path').resolve(credPath))) }, 'rider');
            riderMessaging = app.messaging();
        } else if (admin.apps.length) {
            riderMessaging = admin.messaging();
        }
    } catch (err) {
        console.error('rider firebase init failed', err.message);
    }
    return riderMessaging;
};

const notifyRider = async (riderId, title, message, data = {}) => {
    if (!riderId) return;
    try {
        const rows = await query("SELECT FCMToken FROM AdminUsers WHERE AdminID = ? AND Role = 2", [riderId]);
        const token = rows[0] && rows[0].FCMToken;
        const messaging = getRiderMessaging();
        if (!token || !messaging) return;
        await messaging.send({
            token,
            notification: { title, body: message },
            data: Object.fromEntries(Object.entries({ title, body: message, ...data }).map(([k, v]) => [k, String(v)])),
            android: { priority: 'high', notification: { channelId: 'orders', sound: 'default' } },
        });
    } catch (err) {
        console.error('rider push failed', err && err.message);
        if (err && (err.code === 'messaging/registration-token-not-registered')) {
            query("UPDATE AdminUsers SET FCMToken = NULL WHERE AdminID = ?", [riderId]).catch(() => {});
        }
    }
};

const refreshRiderLoad = (riderId) => {
    if (!riderId) return Promise.resolve();
    return query(
        `UPDATE AdminUsers SET ActiveOrdersCount =
            (SELECT COUNT(*) FROM Orders WHERE DeliveryBoyID = ? AND OrderStatus IN (${RIDER_ACTIVE_STATUSES.join(',')}))
         WHERE AdminID = ?`,
        [riderId, riderId]
    ).catch((err) => console.error('rider load refresh failed', err.message));
};

const restock = async (orderId) => {
    const items = await query("SELECT ProductID, VariantID, Quantity FROM OrderItems WHERE OrderID = ?", [orderId]);
    for (const item of items) {
        await query(
            "UPDATE ProductVariants SET AvailableQty = AvailableQty + ? WHERE ProductID = ? AND VariantID = ?",
            [parseInt(item.Quantity, 10) || 0, item.ProductID, item.VariantID]
        );
    }
};

const refundWallet = async (order) => {
    const amount = parseFloat(order.WalletAmount) || 0;
    if (amount <= 0) return 0;
    await query("UPDATE Users SET WalletAmount = WalletAmount + ? WHERE UserID = ?", [amount, order.UserID]);
    await CommonController.Add_To_Wallet(order.UserID, (process.env.OrderCancel || 4), order.OrderID, amount);
    return amount;
};

// Refunds the online (Razorpay) part of a cancelled order. Never blocks the
// cancellation: failures are recorded for manual follow-up.
const refundOnline = async (order) => {
    const paymentId = String(order.PaymentTransactionID || '');
    if (!paymentId.startsWith('pay_')) return null;
    const onlineAmount = Math.max(0, (parseFloat(order.GrandTotal) || 0) - (parseFloat(order.WalletAmount) || 0));
    const rp = getRazorpay();
    if (!rp || onlineAmount <= 0) {
        await query("UPDATE Orders SET RefundStatus = 'MANUAL_REQUIRED' WHERE OrderID = ?", [order.OrderID]);
        await addTimeline(order.OrderID, order.OrderStatus, 'Online refund could not be started automatically. Please refund manually.');
        return null;
    }
    try {
        const refund = await rp.payments.refund(paymentId, { amount: Math.round(onlineAmount * 100) });
        await query("UPDATE Orders SET RefundStatus = 'INITIATED', RefundID = ? WHERE OrderID = ?", [refund.id, order.OrderID]);
        await addTimeline(order.OrderID, order.OrderStatus, `Online refund of Rs.${onlineAmount.toFixed(2)} initiated (${refund.id}).`);
        return onlineAmount;
    } catch (err) {
        console.error('razorpay refund failed', err && (err.error || err.message));
        await query("UPDATE Orders SET RefundStatus = 'FAILED' WHERE OrderID = ?", [order.OrderID]);
        await addTimeline(order.OrderID, order.OrderStatus, 'Online refund failed. Please refund manually from the Razorpay dashboard.');
        return null;
    }
};

const runDeliveredRewards = async (order) => {
    try {
        await CommonController.GetReferredDetails(order.UserID, order.OrderID);
    } catch (err) {
        console.error('referral reward failed', err && err.message);
    }
    try {
        if (CommonController.ProcessOrderCashback) await CommonController.ProcessOrderCashback(order.OrderID, order.UserID);
    } catch (err) {
        console.error('cashback failed', err && err.message);
    }
};

/**
 * Moves an order to a new status.
 * @param {number|string} orderId
 * @param {number} to target status (see utils/orderStatus)
 * @param {{type: 'admin'|'rider'|'customer'|'system', id?: number}} actor
 * @param {{reason?: string, override?: boolean, note?: string}} options
 *   override: admin-only, allows skipping rider steps (e.g. marking delivered when the rider's phone died)
 * @returns {Promise<object>} the updated order row
 */
const transition = async (orderId, to, actor, options = {}) => {
    to = Number(to);
    const rows = await query("SELECT * FROM Orders WHERE OrderID = ?", [orderId]);
    if (!rows.length) throw new LifecycleError('Order not found', 404);
    const order = rows[0];
    const from = Number(order.OrderStatus);

    if (isFinal(from)) throw new LifecycleError(`Order is already ${STATUS_LABELS[from].toLowerCase()} and cannot be changed`);
    if (to === S.ASSIGNED) throw new LifecycleError('Use the assign rider action to assign an order');

    // Who may set which status
    if (actor.type === 'customer' && to !== S.CANCELLED_BY_CUSTOMER) throw new LifecycleError('Not allowed', 403);
    if (actor.type === 'rider') {
        if (Number(order.DeliveryBoyID) !== Number(actor.id)) throw new LifecycleError('This order is not assigned to you', 403);
        if (![S.OUT_FOR_DELIVERY, S.ARRIVED, S.DELIVERED].includes(to)) throw new LifecycleError('Not allowed', 403);
    }
    if (to === S.CANCELLED_BY_CUSTOMER && actor.type !== 'customer') throw new LifecycleError('Use "Cancelled by store" for admin cancellations');

    const adminOverride = actor.type === 'admin' && options.override === true;
    if (!canTransition(from, to) && !(adminOverride && [S.OUT_FOR_DELIVERY, S.ARRIVED, S.DELIVERED].includes(to) && RIDER_ACTIVE_STATUSES.includes(from))) {
        throw new LifecycleError(`Cannot change order from "${STATUS_LABELS[from]}" to "${STATUS_LABELS[to] || to}"`);
    }

    const now = istNow();
    const sets = ['OrderStatus = ?', 'UpdatedAt = NOW()'];
    const params = [to];
    let otp = null;

    if (to === S.OUT_FOR_DELIVERY) { sets.push("PickedUpAt = ?", "CurrentLeg = 'OUT_FOR_DELIVERY'"); params.push(now); }
    if (to === S.ARRIVED) {
        otp = String(Math.floor(1000 + Math.random() * 9000));
        sets.push("OrderArrivedDateTime = ?", "OTP = ?", "CurrentLeg = 'ARRIVED_DOOR'");
        params.push(now, otp);
    }
    if (to === S.DELIVERED) {
        sets.push("deliveredDateTime = ?", "Delivered_Cancelled_datetime = ?", "CurrentLeg = 'DELIVERED'", "DeliveryPoints = ?");
        params.push(now, now, Math.round((parseFloat(order.Distance) || 0) * 10));
        if (String(order.PaymentMethod || '').toUpperCase() === 'COD') sets.push("PaymentStatus = 1");
    }
    if (to === S.CANCELLED_BY_STORE || to === S.CANCELLED_BY_CUSTOMER || to === S.RETURNED) {
        sets.push("Delivered_Cancelled_datetime = ?", "CancellationReason = ?");
        params.push(now, options.reason ? String(options.reason).slice(0, 500) : null);
    }

    // Conditional update: only succeeds if nobody changed the order meanwhile,
    // so side effects (refunds, rewards) can never run twice.
    params.push(orderId, from);
    const result = await query(`UPDATE Orders SET ${sets.join(', ')} WHERE OrderID = ? AND OrderStatus = ?`, params);
    if (!result.affectedRows) throw new LifecycleError('The order was updated by someone else. Please refresh.', 409);

    const label = orderLabel(order);
    const who = actor.type === 'admin' ? `admin #${actor.id}` : actor.type === 'rider' ? `rider #${actor.id}` : actor.type;
    const reasonText = options.reason ? ` Reason: ${options.reason}` : '';
    await addTimeline(orderId, to, `${STATUS_LABELS[to]} (by ${who}).${reasonText}${options.note ? ' ' + options.note : ''}`.trim());

    // Side effects and notifications
    if (to === S.PACKING) {
        await notifyCustomer(order, `📦 Packing your order ${label}`, 'Your items are being packed.');
    }
    if (to === S.OUT_FOR_DELIVERY) {
        await notifyCustomer(order, `🛵 Order ${label} is on the way`, 'Your rider has picked up your order.');
    }
    if (to === S.ARRIVED) {
        await notifyCustomer(order, `📍 Rider has arrived`, `Share OTP ${otp} with the rider to receive order ${label}.`);
    }
    if (to === S.DELIVERED) {
        await runDeliveredRewards(order);
        await refreshRiderLoad(order.DeliveryBoyID);
        await notifyCustomer(order, `✅ Order ${label} delivered`, 'Thank you for shopping with ClikGett!');
    }
    if (to === S.CANCELLED_BY_STORE || to === S.CANCELLED_BY_CUSTOMER || to === S.RETURNED) {
        if (to !== S.RETURNED) await restock(orderId);
        const walletBack = await refundWallet(order);
        const onlineBack = await refundOnline(order);
        await refreshRiderLoad(order.DeliveryBoyID);
        const refundText = [walletBack ? `Rs.${walletBack.toFixed(2)} returned to your wallet.` : '', onlineBack ? `Rs.${onlineBack.toFixed(2)} refund initiated to your payment method.` : ''].filter(Boolean).join(' ');
        if (to === S.CANCELLED_BY_CUSTOMER) {
            await notifyCustomer(order, `Order ${label} cancelled`, `Your order has been cancelled as requested. ${refundText}`.trim());
        } else {
            await notifyCustomer(order, `Order ${label} cancelled`, `Sorry, we had to cancel your order.${reasonText} ${refundText}`.trim());
        }
        if (Number(order.DeliveryBoyID) > 0) {
            await notifyRider(order.DeliveryBoyID, `Order ${label} cancelled`, 'This order was cancelled. Do not deliver it.', { orderId: order.OrderID, type: 'cancelled' });
        }
    }

    const updated = await query("SELECT * FROM Orders WHERE OrderID = ?", [orderId]);
    return updated[0];
};

/**
 * Assigns (or reassigns) a rider. Allowed while the order is received, packing
 * or already with a rider; a reassignment sends the order back to "assigned"
 * because the new rider has to pick it up.
 */
const assignRider = async (orderId, riderId, actor, options = {}) => {
    const rows = await query("SELECT * FROM Orders WHERE OrderID = ?", [orderId]);
    if (!rows.length) throw new LifecycleError('Order not found', 404);
    const order = rows[0];
    const from = Number(order.OrderStatus);
    if (isFinal(from)) throw new LifecycleError(`Order is already ${STATUS_LABELS[from].toLowerCase()} and cannot be assigned`);

    const previousRider = Number(order.DeliveryBoyID) || 0;
    const result = await query(
        "UPDATE Orders SET DeliveryBoyID = ?, IsAssigned = 1, OrderStatus = ?, AssignedAt = NOW(), CurrentLeg = 'ASSIGNED', UpdatedAt = NOW() WHERE OrderID = ? AND OrderStatus = ?",
        [riderId, S.ASSIGNED, orderId, from]
    );
    if (!result.affectedRows) throw new LifecycleError('The order was updated by someone else. Please refresh.', 409);

    await refreshRiderLoad(riderId);
    const isReassignment = previousRider > 0 && previousRider !== Number(riderId);
    if (isReassignment) await refreshRiderLoad(previousRider);

    const label = orderLabel(order);
    const note = isReassignment
        ? `Reassigned from rider #${previousRider} to ${options.riderName || 'rider #' + riderId} by admin #${actor.id}. Reason: ${options.reason || 'Dispatcher action'}`
        : `Assigned to ${options.riderName || 'rider #' + riderId} by admin #${actor.id}`;
    await addTimeline(orderId, S.ASSIGNED, note);

    await notifyRider(riderId, `New order ${label}`, 'A new order has been assigned to you.', { orderId: order.OrderID, type: 'assigned' });
    if (isReassignment) {
        await notifyRider(previousRider, `Order ${label} reassigned`, 'This order was moved to another rider.', { orderId: order.OrderID, type: 'unassigned' });
    } else {
        await notifyCustomer(order, `🧑‍✈️ Rider assigned for ${label}`, `${options.riderName || 'Your rider'} will deliver your order.`);
    }
    return { isReassignment, previousRider };
};

module.exports = { transition, assignRider, addTimeline, notifyCustomer, notifyRider, LifecycleError, istNow };
