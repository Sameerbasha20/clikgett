// Brings the ClikGett Cash ledger (Wallets) in line with the balances customers see
// (Users.WalletAmount). The mismatches found in the Nov 2026 audit were imported with the old
// system's data; the current code writes balance and ledger together.
//
//   node scripts/wallet-reconcile.js            dry run: lists the accounts and differences
//   node scripts/wallet-reconcile.js --apply    adds one "Balance reconciliation" ledger row per
//                                               account; balances are NOT changed
//
// Uses the database from Backend/.env (DB_HOST etc.). Run against production only after
// reviewing the dry-run output.
require('dotenv').config();
const pool = require('../server/utils/db');

const q = (sql, params = []) => new Promise((resolve, reject) => pool.query(sql, params, (e, r) => (e ? reject(e) : resolve(r))));
const APPLY = process.argv.includes('--apply');
const NOTE = 'Balance reconciliation (ledger matched to balance, audit Nov 2026)';

(async () => {
    const rows = await q(`
        SELECT U.UserID, ROUND(IFNULL(U.WalletAmount, 0), 2) AS Balance, ROUND(IFNULL(L.Ledger, 0), 2) AS Ledger
          FROM Users U
          LEFT JOIN (SELECT UserID, SUM(CASE WHEN Credited_Debited = 1 THEN Amount ELSE -Amount END) AS Ledger
                       FROM Wallets GROUP BY UserID) L ON L.UserID = U.UserID
         WHERE ABS(IFNULL(U.WalletAmount, 0) - IFNULL(L.Ledger, 0)) >= 0.01
         ORDER BY U.UserID`);
    console.log(`${rows.length} account(s) where balance != ledger${APPLY ? '' : ' (dry run, nothing changed)'}`);
    let total = 0;
    for (const r of rows) {
        const diff = Math.round((Number(r.Balance) - Number(r.Ledger)) * 100) / 100;
        total += diff;
        console.log(`  UserID ${r.UserID}: balance ${r.Balance}, ledger ${r.Ledger}, adjustment ${diff > 0 ? '+' : ''}${diff}`);
        if (APPLY) {
            await q(`INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, ExpiryDate, IsExpired, CreatedAt)
                     VALUES (?, ?, ?, 5, 0, ?, NULL, 0, NOW())`, [r.UserID, Math.abs(diff), diff > 0 ? 1 : 2, NOTE]);
        }
    }
    console.log(`Net adjustment: ${Math.round(total * 100) / 100}${APPLY ? ' (applied)' : ''}`);
    pool.end();
})().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
