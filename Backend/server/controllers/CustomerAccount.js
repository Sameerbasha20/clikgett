// Customer-facing account APIs: app settings, referral details and membership purchase.
const crypto = require('crypto');
const moment = require('moment');
const Razorpay = require('razorpay');
const pool = require('../utils/db');
const { consumePayment } = require('./Orders');

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

let razorpay = null;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAYID || 'rzp_test_local_mock_key',
        key_secret: process.env.RAZORPAYSECRET || 'local_mock_secret',
    });
} catch (e) {
    console.log('Razorpay init failed in CustomerAccount:', e.message);
}

const jsonSetting = (value, fallback) => {
    try {
        const parsed = JSON.parse(value);
        return parsed == null ? fallback : parsed;
    } catch (_) {
        return fallback;
    }
};

async function settingsMap() {
    const rows = await queryAsync('SELECT SettingKey, SettingValue FROM Settings');
    const s = {};
    rows.forEach((r) => { s[r.SettingKey] = r.SettingValue; });
    return s;
}

async function referralRewards(s) {
    const [config] = await queryAsync('SELECT * FROM ReferralConfigurations WHERE ConfigID = 1 LIMIT 1').catch(() => []);
    // The configured program wins; otherwise the Settings amounts are paid (CommonController.Referred_Amount_Details).
    if (config && config.IsEnabled) {
        return {
            Enabled: true,
            ReferrerReward: parseFloat(config.ReferrerReward) || 0,
            FriendReward: parseFloat(config.ReferredReward) || 0,
            MinOrderValue: parseFloat(config.MinOrderValue) || 0,
        };
    }
    return {
        Enabled: true,
        ReferrerReward: parseFloat(s.Referral_firstorderBonus || 0),
        FriendReward: parseFloat(s.ReferAmount || 0),
        MinOrderValue: parseFloat(s.MinOrderValue || 0),
    };
}

async function activeMembership(userId) {
    const rows = await queryAsync(
        `SELECT um.UserMembershipID, um.PlanID, um.StartDate, um.EndDate, mp.PlanName
           FROM UserMemberships um JOIN MembershipPlans mp ON mp.PlanID = um.PlanID
          WHERE um.UserID = ? AND um.EndDate >= NOW()
          ORDER BY um.EndDate DESC LIMIT 1`,
        [userId]
    );
    return rows.length ? rows[0] : null;
}

const CustomerAccount = {
    // Public settings the app needs (support contacts, tips, wallet amounts, FAQ, payment key).
    appConfig: async (req, resp) => {
        try {
            const s = await settingsMap();
            const referral = await referralRewards(s);
            return resp.json({
                Status: 1,
                Config: {
                    SupportPhone: s.SupportPhone || '',
                    SupportEmail: s.SupportEmail || '',
                    TipPresets: jsonSetting(s.TipPresets, [10, 20, 30, 50]),
                    WalletTopupAmounts: jsonSetting(s.WalletTopupAmounts, [100, 200, 500, 1000]),
                    MinOrderValue: parseFloat(s.MinOrderValue || 0),
                    FreeDeliveryAbove: parseFloat(s.FreeDelivery_CartAmount || 0),
                    WalletFullUseAbove: parseFloat(s.Minordervalue_wallet || 0),
                    WalletSmallOrderCap: parseFloat(s.MinUseOfWallet || 0),
                    ReferrerReward: referral.ReferrerReward,
                    FriendReward: referral.FriendReward,
                    FAQs: jsonSetting(s.FAQs, []),
                    RazorpayKey: process.env.RAZORPAYID || '',
                },
            });
        } catch (err) {
            console.log('appConfig failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not load settings' });
        }
    },

    referralInfo: async (req, resp) => {
        try {
            const s = await settingsMap();
            const rewards = await referralRewards(s);
            const [user] = await queryAsync('SELECT MyReferralCode FROM Users WHERE UserID = ?', [req.UserID]);
            const code = user && user.MyReferralCode ? String(user.MyReferralCode).toUpperCase() : null;
            let joined = 0;
            let ordered = 0;
            if (code) {
                const [counts] = await queryAsync(
                    `SELECT COUNT(*) AS joined,
                            SUM(EXISTS (SELECT 1 FROM Orders o WHERE o.UserID = u.UserID AND o.OrderStatus = 1)) AS ordered
                       FROM Users u WHERE UPPER(u.ReferredBy) = ?`,
                    [code]
                );
                joined = Number(counts.joined) || 0;
                ordered = Number(counts.ordered) || 0;
            }
            // Referral rewards are credited to the referrer with ContentType 2.
            const [credit] = await queryAsync(
                'SELECT COALESCE(SUM(Amount), 0) AS total FROM Wallets WHERE UserID = ? AND ContentType = 2 AND Credited_Debited = 1',
                [req.UserID]
            );
            const earned = Math.round((parseFloat(credit.total) || 0) * 100) / 100;
            return resp.json({
                Status: 1,
                Referral: {
                    Code: code,
                    ...rewards,
                    FriendsJoined: joined,
                    FriendsOrdered: ordered,
                    Earned: earned,
                },
            });
        } catch (err) {
            console.log('referralInfo failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not load referral details' });
        }
    },

    membershipPlans: async (req, resp) => {
        try {
            const plans = await queryAsync(
                `SELECT PlanID, PlanName, DurationDays, Price, FreeDelivery, ExtraCashbackPercentage, ExclusiveCoupons, PriorityCustomer
                   FROM MembershipPlans WHERE Status = 1 ORDER BY Price ASC`
            );
            const current = req.UserID ? await activeMembership(req.UserID) : null;
            return resp.json({ Status: 1, Plans: plans, Current: current });
        } catch (err) {
            console.log('membershipPlans failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not load membership plans' });
        }
    },

    // Starts a Razorpay payment for a plan; the amount always comes from the plan.
    membershipBuy: async (req, resp) => {
        try {
            const [plan] = await queryAsync('SELECT * FROM MembershipPlans WHERE PlanID = ? AND Status = 1', [req.body && req.body.PlanID]);
            if (!plan) return resp.status(404).json({ Status: 0, Message: 'This plan is not available' });
            const amount = parseFloat(plan.Price);
            const order = await razorpay.orders.create({
                amount: Math.round(amount * 100),
                currency: 'INR',
                receipt: `mem_${req.UserID}_${Date.now()}`,
                payment_capture: 1,
            });
            await queryAsync(
                `INSERT INTO OrderPayments (OrderReceiptID, UserID, OrderAmount, OrderCurrency, Notes, PaymentCapture, RazorpayOrderID, Type, Purpose)
                 VALUES (?, ?, ?, 'INR', ?, 1, ?, 3, 'MEMBERSHIP')`,
                [Math.floor(Math.random() * 1999999) + 1000000, req.UserID, amount, `PlanID:${plan.PlanID}`, order.id]
            );
            return resp.json({ Status: 1, RazorpayOrderID: order.id, Amount: amount, PlanName: plan.PlanName });
        } catch (err) {
            console.log('membershipBuy failed', err && (err.error || err.message));
            return resp.status(500).json({ Status: 0, Message: 'Could not start the payment. Please try again.' });
        }
    },

    // Verifies the payment and activates (or extends) the membership.
    membershipConfirm: async (req, resp) => {
        try {
            const body = req.body || {};
            if (!process.env.RAZORPAYSECRET) return resp.status(503).json({ Status: 0, Message: 'Online payments are not configured' });
            const expected = crypto.createHmac('sha256', process.env.RAZORPAYSECRET)
                .update(`${body.RazorpayOrderID}|${body.razorpay_payment_id}`).digest('hex');
            if (expected !== body.razorpay_signature) return resp.status(400).json({ Status: 0, Message: 'Payment could not be verified' });

            const [payment] = await queryAsync(
                "SELECT * FROM OrderPayments WHERE RazorpayOrderID = ? AND UserID = ? AND Purpose = 'MEMBERSHIP'",
                [body.RazorpayOrderID, req.UserID]
            );
            if (!payment) return resp.status(404).json({ Status: 0, Message: 'Payment not found' });
            const planId = parseInt(String(payment.Notes || '').replace('PlanID:', ''), 10);
            const [plan] = await queryAsync('SELECT * FROM MembershipPlans WHERE PlanID = ?', [planId]);
            if (!plan) return resp.status(404).json({ Status: 0, Message: 'Plan not found' });

            const details = await razorpay.payments.fetch(body.razorpay_payment_id);
            if (!details || details.order_id !== body.RazorpayOrderID || (parseFloat(details.amount) || 0) / 100 + 0.5 < parseFloat(plan.Price))
                return resp.status(400).json({ Status: 0, Message: 'Payment amount does not match the plan' });
            if (!(await consumePayment(body.RazorpayOrderID, body.razorpay_payment_id, req.UserID)))
                return resp.status(400).json({ Status: 0, Message: 'This payment has already been used' });

            // Buying again while active extends the current membership.
            const current = await activeMembership(req.UserID);
            const start = current ? moment(current.EndDate) : moment();
            const end = start.clone().add(parseInt(plan.DurationDays, 10) || 30, 'days');
            await queryAsync(
                `INSERT INTO UserMemberships (UserID, PlanID, Price, StartDate, EndDate, RazorpayOrderID, PaymentTransactionID)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [req.UserID, plan.PlanID, plan.Price, start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss'),
                    body.RazorpayOrderID, body.razorpay_payment_id]
            );
            return resp.json({ Status: 1, Message: `${plan.PlanName} is active until ${end.format('D MMM YYYY')}` });
        } catch (err) {
            console.log('membershipConfirm failed', err && (err.error || err.message));
            return resp.status(500).json({ Status: 0, Message: 'Could not activate the membership. Contact support if money was deducted.' });
        }
    },
};

module.exports = CustomerAccount;
