'use strict';
// Daily wallet health check: finds money that went out when it should not have.
//   GET /api/admin-wallet-check?days=1   (admin token, or x-cron-secret for a scheduler)
//   npm run wallet:check                 (prints the same report)
//
// Ledger: Wallets.Credited_Debited 1 = credit, 2 = debit. Cashback rows are
// ContentType 4 with Description "Cashback earned on Order #<id>".
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const CASHBACK = "W.ContentType = 4 AND W.Credited_Debited = 1 AND W.Description LIKE 'Cashback earned%'";
// Anything above this share of the order is unusual enough for a person to look at.
const HIGH_CASHBACK_SHARE = 0.2;

async function run(days = 1) {
    const since = Math.max(1, Math.min(90, parseInt(days, 10) || 1));
    const [settings] = await query(
        'SELECT CashbackEnabled, CashbackPercentage, CashbackMaxAmount, CashbackMode FROM AdminShopToggleSettings LIMIT 1');

    const [summary] = await query(`
        SELECT
          (SELECT COUNT(*) FROM Orders WHERE OrderStatus = 1 AND UpdatedAt >= NOW() - INTERVAL ? DAY) AS DeliveredOrders,
          (SELECT IFNULL(SUM(Amount), 0) FROM Wallets W WHERE ${CASHBACK} AND W.CreatedAt >= NOW() - INTERVAL ? DAY) AS CashbackPaid,
          (SELECT COUNT(*) FROM Wallets W WHERE ${CASHBACK} AND W.CreatedAt >= NOW() - INTERVAL ? DAY) AS CashbackRows,
          (SELECT IFNULL(SUM(Amount), 0) FROM Wallets W WHERE W.Credited_Debited = 1 AND W.CreatedAt >= NOW() - INTERVAL ? DAY) AS AllCredits,
          (SELECT IFNULL(SUM(Amount), 0) FROM Wallets W WHERE W.Credited_Debited = 2 AND W.CreatedAt >= NOW() - INTERVAL ? DAY) AS AllDebits`,
    [since, since, since, since, since]);

    // Cashback paid on an order that was cancelled or never delivered.
    const cashbackOnUndelivered = await query(`
        SELECT W.WalletID, W.UserID, W.ContentID AS OrderID, W.Amount, O.OrderStatus, W.CreatedAt
          FROM Wallets W LEFT JOIN Orders O ON O.OrderID = W.ContentID
         WHERE ${CASHBACK} AND (O.OrderID IS NULL OR O.OrderStatus <> 1)
         ORDER BY W.CreatedAt DESC LIMIT 100`);

    // The same order paid cashback more than once.
    const duplicateCashback = await query(`
        SELECT W.ContentID AS OrderID, W.UserID, COUNT(*) AS Times, SUM(W.Amount) AS Total
          FROM Wallets W WHERE ${CASHBACK}
         GROUP BY W.ContentID, W.UserID HAVING COUNT(*) > 1
         ORDER BY Total DESC LIMIT 100`);

    // Cashback that is a large share of the order, or above the per-order cap.
    const cap = Number(settings && settings.CashbackMaxAmount) || 0;
    const highCashback = await query(`
        SELECT W.ContentID AS OrderID, W.UserID, W.Amount, O.SubTotal,
               ROUND(W.Amount / NULLIF(O.SubTotal, 0) * 100, 1) AS PercentOfOrder
          FROM Wallets W JOIN Orders O ON O.OrderID = W.ContentID
         WHERE ${CASHBACK} AND W.CreatedAt >= NOW() - INTERVAL ? DAY
           AND (W.Amount > O.SubTotal * ? OR (? > 0 AND W.Amount > ? + 0.01))
         ORDER BY W.Amount DESC LIMIT 100`, [since, HIGH_CASHBACK_SHARE, cap, cap]);

    // Stored balance differs from the ledger (credits minus debits).
    const balanceMismatch = await query(`
        SELECT U.UserID, ROUND(U.WalletAmount, 2) AS StoredBalance, ROUND(IFNULL(L.Ledger, 0), 2) AS LedgerBalance
          FROM Users U
          LEFT JOIN (SELECT UserID, SUM(CASE WHEN Credited_Debited = 1 THEN Amount ELSE -Amount END) AS Ledger
                       FROM Wallets GROUP BY UserID) L ON L.UserID = U.UserID
         WHERE ABS(IFNULL(U.WalletAmount, 0) - IFNULL(L.Ledger, 0)) >= 0.01
         ORDER BY ABS(IFNULL(U.WalletAmount, 0) - IFNULL(L.Ledger, 0)) DESC LIMIT 100`);

    const negativeBalance = await query(
        'SELECT UserID, WalletAmount FROM Users WHERE WalletAmount < 0 ORDER BY WalletAmount LIMIT 100');

    const problems = cashbackOnUndelivered.length + duplicateCashback.length + highCashback.length
        + balanceMismatch.length + negativeBalance.length;

    return {
        Status: 1,
        Days: since,
        Healthy: problems === 0,
        Settings: settings || null,
        Summary: {
            DeliveredOrders: summary.DeliveredOrders,
            CashbackPaid: Number(summary.CashbackPaid.toFixed(2)),
            CashbackRows: summary.CashbackRows,
            WalletCredits: Number(Number(summary.AllCredits).toFixed(2)),
            WalletDebits: Number(Number(summary.AllDebits).toFixed(2)),
        },
        CashbackOnUndelivered: cashbackOnUndelivered,
        DuplicateCashback: duplicateCashback,
        HighCashback: highCashback,
        BalanceMismatch: balanceMismatch,
        NegativeBalance: negativeBalance,
    };
}

module.exports = { run };

if (require.main === module) {
    require('dotenv').config();
    run(process.argv[2]).then((r) => {
        const s = r.Summary;
        console.log(`Wallet check, last ${r.Days} day(s): ${r.Healthy ? 'OK' : 'NEEDS A LOOK'}`);
        console.log(`  Cashback: ${r.Settings ? `${r.Settings.CashbackEnabled ? r.Settings.CashbackPercentage : 0}% (${r.Settings.CashbackMode}), cap ₹${r.Settings.CashbackMaxAmount}` : 'n/a'}`);
        console.log(`  Delivered orders ${s.DeliveredOrders} · cashback paid ₹${s.CashbackPaid} on ${s.CashbackRows} order(s)`);
        console.log(`  Wallet credits ₹${s.WalletCredits} · debits ₹${s.WalletDebits}`);
        for (const [name, rows] of Object.entries({
            'Cashback on cancelled/undelivered orders': r.CashbackOnUndelivered,
            'Cashback paid twice': r.DuplicateCashback,
            [`Cashback over ${HIGH_CASHBACK_SHARE * 100}% of order or over cap`]: r.HighCashback,
            'Wallet balance differs from ledger': r.BalanceMismatch,
            'Negative wallet balance': r.NegativeBalance,
        })) {
            console.log(`  ${rows.length ? '✗' : '✓'} ${name}: ${rows.length}`);
            rows.slice(0, 5).forEach((row) => console.log('      ', JSON.stringify(row)));
        }
        process.exit(0);
    }).catch((err) => {
        console.error('Wallet check failed:', err.message);
        process.exit(1);
    });
}
