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

    // Profile header: total saved on delivered orders and the birthday.
    // Saved per order = offer prices below MRP + coupon/cart-offer discount (as on the order screen).
    summary: async (req, resp) => {
        try {
            const [orders] = await queryAsync(
                'SELECT COUNT(*) AS n, COALESCE(SUM(Discount), 0) AS discount FROM Orders WHERE UserID = ? AND OrderStatus = 1',
                [req.UserID]);
            const [items] = await queryAsync(
                `SELECT COALESCE(SUM(GREATEST(oi.Price - oi.OfferPrice, 0) * oi.Quantity), 0) AS saved
                   FROM OrderItems oi JOIN Orders o ON o.OrderID = oi.OrderID
                  WHERE o.UserID = ? AND o.OrderStatus = 1 AND oi.OfferPrice > 0`,
                [req.UserID]);
            const [user] = await queryAsync("SELECT DATE_FORMAT(DateOfBirth, '%Y-%m-%d') AS dob FROM Users WHERE UserID = ?", [req.UserID]);
            const [rewards] = await queryAsync('SELECT BirthdayEnabled, BirthdayAmount FROM CustomerRewardSettings WHERE ID = 1').catch(() => []);
            return resp.json({
                Status: 1,
                TotalSaved: Math.round((Number(orders.discount) + Number(items.saved)) * 100) / 100,
                DeliveredOrders: Number(orders.n) || 0,
                DateOfBirth: (user && user.dob) || null,
                BirthdayReward: rewards && rewards.BirthdayEnabled ? Number(rewards.BirthdayAmount) : 0,
            });
        } catch (err) {
            console.log('account summary failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not load your account summary' });
        }
    },

    // The customer sets their birthday once; it cannot be changed afterwards.
    setBirthday: async (req, resp) => {
        try {
            const value = String((req.body && req.body.DateOfBirth) || '').trim();
            const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            const date = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
            const valid = date && date.getUTCMonth() === +m[2] - 1 && date.getUTCDate() === +m[3];
            const age = valid ? (Date.now() - date.getTime()) / (365.25 * 24 * 3600 * 1000) : -1;
            if (!valid || age < 5 || age > 120) {
                return resp.status(400).json({ Status: 0, Message: 'Please choose a valid date of birth' });
            }
            const result = await queryAsync('UPDATE Users SET DateOfBirth = ? WHERE UserID = ? AND DateOfBirth IS NULL', [value, req.UserID]);
            if (!result.affectedRows) {
                return resp.status(409).json({ Status: 0, Message: 'Your birthday is already saved and cannot be changed' });
            }
            return resp.json({ Status: 1, Message: 'Birthday saved', DateOfBirth: value });
        } catch (err) {
            console.log('setBirthday failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not save your birthday' });
        }
    },

    // Admin → Settings → Rewards
    rewardSettings: async (req, resp) => {
        try {
            const [settings] = await queryAsync('SELECT * FROM CustomerRewardSettings WHERE ID = 1');
            const [stats] = await queryAsync(
                `SELECT
                   SUM(ContentType = 6 AND Credited_Debited = 1) AS ComebackCount,
                   COALESCE(SUM(CASE WHEN ContentType = 6 AND Credited_Debited = 1 THEN Amount END), 0) AS ComebackGiven,
                   SUM(ContentType = 7 AND Credited_Debited = 1) AS BirthdayCount,
                   COALESCE(SUM(CASE WHEN ContentType = 7 AND Credited_Debited = 1 THEN Amount END), 0) AS BirthdayGiven,
                   COALESCE(SUM(CASE WHEN ContentType IN (6, 7) AND Credited_Debited = 2 THEN Amount END), 0) AS Expired
                 FROM Wallets WHERE ContentType IN (6, 7) AND CreatedAt > NOW() - INTERVAL 30 DAY`);
            const [birthdays] = await queryAsync('SELECT COUNT(*) AS n FROM Users WHERE DateOfBirth IS NOT NULL');
            return resp.json({ Status: 1, Settings: settings || null, Last30Days: stats, CustomersWithBirthday: birthdays.n });
        } catch (err) {
            console.log('rewardSettings failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not load reward settings' });
        }
    },

    updateRewardSettings: async (req, resp) => {
        try {
            const b = req.body || {};
            const num = (v) => Number(v);
            const checks = [
                [num(b.ComebackInactiveDays), 1, 365, 'Inactive days must be between 1 and 365'],
                [num(b.ComebackAmount), 0, 1000, 'Comeback amount must be between ₹0 and ₹1000'],
                [num(b.ComebackValidHours), 1, 720, 'Comeback validity must be between 1 and 720 hours'],
                [num(b.BirthdayAmount), 0, 1000, 'Birthday amount must be between ₹0 and ₹1000'],
                [num(b.BirthdayValidDays), 1, 60, 'Birthday validity must be between 1 and 60 days'],
            ];
            for (const [v, min, max, message] of checks) {
                if (!(v >= min && v <= max)) return resp.status(400).json({ Status: 0, Message: message });
            }
            await queryAsync(
                `UPDATE CustomerRewardSettings SET ComebackEnabled = ?, ComebackInactiveDays = ?, ComebackAmount = ?, ComebackValidHours = ?,
                        BirthdayEnabled = ?, BirthdayAmount = ?, BirthdayValidDays = ? WHERE ID = 1`,
                [b.ComebackEnabled ? 1 : 0, Math.round(num(b.ComebackInactiveDays)), num(b.ComebackAmount), Math.round(num(b.ComebackValidHours)),
                    b.BirthdayEnabled ? 1 : 0, num(b.BirthdayAmount), Math.round(num(b.BirthdayValidDays))]);
            return resp.json({ Status: 1, Message: 'Reward settings saved' });
        } catch (err) {
            console.log('updateRewardSettings failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not save reward settings' });
        }
    },

    // Runs the hourly rewards job now (admin "Run now").
    runRewards: async (req, resp) => {
        try {
            const result = await require('../services/CustomerRewards').runOnce();
            return resp.json({ Status: 1, ...result });
        } catch (err) {
            console.log('runRewards failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not run rewards' });
        }
    },
};

module.exports = CustomerAccount;
