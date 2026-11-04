// Welcome offer: a fixed ₹ discount on each of a new customer's first N orders
// (e.g. ₹50 off the 1st, 2nd and 3rd order), when the items total reaches a minimum.
// Cancelled and returned orders don't count, so the step is offered again.
const pool = require('../utils/db');

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const money = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;
const MAX_STEPS = 10;
const NOT_COUNTED = [3, 4, 6]; // cancelled by store, cancelled by customer, returned

function parseSteps(raw) {
    try {
        const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return (Array.isArray(list) ? list : []).map(money).filter((n) => n > 0).slice(0, MAX_STEPS);
    } catch (e) {
        return [];
    }
}

async function config() {
    const rows = await queryAsync('SELECT * FROM WelcomeOffer WHERE ID = 1').catch(() => []);
    const r = rows[0] || {};
    return {
        Enabled: Number(r.Enabled) === 1,
        Title: r.Title || 'Welcome offer for you!',
        MinOrderValue: money(r.MinOrderValue != null ? r.MinOrderValue : 299),
        Steps: parseSteps(r.StepsJson || '[]'),
    };
}

/** Validates and saves the admin's settings. Returns an error message or null. */
async function save(body) {
    const steps = Array.isArray(body.Steps) ? body.Steps.map((n) => parseFloat(n)) : null;
    if (!steps || !steps.length) return 'Add at least one order with a discount.';
    if (steps.length > MAX_STEPS) return `At most ${MAX_STEPS} orders.`;
    if (steps.some((n) => !(n > 0) || n > 1000)) return 'Each discount must be between ₹1 and ₹1000.';
    const min = parseFloat(body.MinOrderValue);
    if (!(min >= 0) || min > 100000) return 'Enter a valid minimum order value.';
    if (steps.some((n) => min > 0 && n >= min)) return 'Each discount must be less than the minimum order value.';
    const title = String(body.Title || '').trim().slice(0, 80) || 'Welcome offer for you!';
    await queryAsync(
        'UPDATE WelcomeOffer SET Enabled = ?, Title = ?, MinOrderValue = ?, StepsJson = ? WHERE ID = 1',
        [body.Enabled ? 1 : 0, title, money(min), JSON.stringify(steps.map(money))]);
    return null;
}

async function ordersCounted(userId) {
    if (!userId) return 0;
    const [row] = await queryAsync(
        `SELECT COUNT(*) AS n FROM Orders WHERE UserID = ? AND OrderStatus NOT IN (${NOT_COUNTED.join(',')})`, [userId]);
    return Number(row && row.n) || 0;
}

/** The offer as this customer sees it: which order is next and its discount. */
async function forUser(userId) {
    const cfg = await config();
    const placed = await ordersCounted(userId);
    const nextIndex = placed < cfg.Steps.length ? placed : null;
    return {
        ...cfg,
        OrdersPlaced: placed,
        NextStep: nextIndex == null ? null : nextIndex + 1,
        NextDiscount: nextIndex == null ? 0 : cfg.Steps[nextIndex],
        Active: cfg.Enabled && nextIndex != null && cfg.Steps.length > 0,
    };
}

/** Discount for this bill: itemsTotal is the items total after coupons and cart offers. */
async function forBill(userId, itemsTotal) {
    const offer = await forUser(userId);
    if (!offer.Active) return { Discount: 0, Step: null, Offer: null };
    const reached = itemsTotal >= offer.MinOrderValue;
    const discount = reached ? money(Math.min(offer.NextDiscount, itemsTotal)) : 0;
    return {
        Discount: discount,
        Step: discount > 0 ? offer.NextStep : null,
        Offer: {
            Title: offer.Title,
            Step: offer.NextStep,
            TotalSteps: offer.Steps.length,
            Discount: offer.NextDiscount,
            MinOrderValue: offer.MinOrderValue,
            Applied: discount > 0,
            AmountNeeded: reached ? 0 : money(offer.MinOrderValue - itemsTotal),
        },
    };
}

/** Orders that used the offer, per step: how many and how much was given. */
async function stats() {
    const rows = await queryAsync(
        `SELECT WelcomeStep AS Step, COUNT(*) AS Orders, COALESCE(SUM(WelcomeDiscount), 0) AS Amount,
                COUNT(DISTINCT UserID) AS Customers
           FROM Orders
          WHERE WelcomeDiscount > 0 AND OrderStatus NOT IN (${NOT_COUNTED.join(',')})
          GROUP BY WelcomeStep ORDER BY WelcomeStep`).catch(() => []);
    const steps = rows.map((r) => ({ Step: Number(r.Step), Orders: Number(r.Orders), Amount: money(r.Amount), Customers: Number(r.Customers) }));
    return {
        Steps: steps,
        TotalOrders: steps.reduce((n, s) => n + s.Orders, 0),
        TotalAmount: money(steps.reduce((n, s) => n + s.Amount, 0)),
    };
}

module.exports = { config, save, forUser, forBill, stats, MAX_STEPS };
