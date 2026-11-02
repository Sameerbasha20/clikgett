'use strict';
// Read-only export of everything customers did with money since a point in time, for
// reconciling after the live database is restored from a snapshot (a restore drops
// every write made after the snapshot).
//
//   node server/tools/export_since.js "2026-11-05 18:30:00" ./after-snapshot
//
// The time is UTC, as the database stores it. Writes one CSV per table into the folder
// and prints the row counts. Changes nothing.
const fs = require('fs');
const path = require('path');
const db = require(path.join(__dirname, '..', 'utils', 'db'));

const q = (sql, params = []) => new Promise((resolve, reject) =>
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const SINCE = 'CreatedAt >= ? OR UpdatedAt >= ?';
// [file, query]; each query takes the time as often as it has "?" marks.
const EXPORTS = [
    ['orders', `SELECT * FROM Orders WHERE ${SINCE} OR DoorstepPaidAt >= ?`],
    ['order_items', `SELECT * FROM OrderItems WHERE OrderID IN (SELECT OrderID FROM Orders WHERE ${SINCE})`],
    ['order_payments', 'SELECT * FROM OrderPayments WHERE CapturedAt >= ? OR ConsumedAt >= ? OR AutoRefundedAt >= ?'],
    ['wallets', `SELECT * FROM Wallets WHERE ${SINCE}`],
    ['wallet_balances', `SELECT UserID, WalletAmount FROM Users WHERE UserID IN (SELECT UserID FROM Wallets WHERE ${SINCE})`],
    ['cashback_pending', 'SELECT * FROM CashbackPending WHERE CreatedAt >= ? OR ApprovedAt >= ?'],
    ['referral_claims', `SELECT * FROM ReferralClaims WHERE ${SINCE}`],
    ['user_memberships', 'SELECT * FROM UserMemberships WHERE CreatedAt >= ?'],
    ['photo_order_requests', `SELECT * FROM PhotoOrderRequests WHERE ${SINCE}`],
    ['new_customers', 'SELECT * FROM Users WHERE CreatedAt >= ?'],
    ['new_addresses', 'SELECT * FROM Address WHERE CreatedAt >= ?'],
];

const cell = (v) => {
    if (v === null || v === undefined) return '';
    if (v instanceof Date && Number.isNaN(v.getTime())) return ''; // zero dates in old rows
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

(async () => {
    const [since, folder] = process.argv.slice(2);
    try {
        if (!since || !folder || Number.isNaN(Date.parse(since.replace(' ', 'T') + 'Z'))) {
            console.log('Usage: export_since.js "<YYYY-MM-DD HH:MM:SS, UTC>" <folder>');
            process.exitCode = 2;
            return;
        }
        fs.mkdirSync(folder, { recursive: true });
        for (const [name, sql] of EXPORTS) {
            const rows = await q(sql, Array((sql.match(/\?/g) || []).length).fill(since));
            const cols = rows.length ? Object.keys(rows[0]) : [];
            const lines = [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))];
            fs.writeFileSync(path.join(folder, `${name}.csv`), lines.join('\n'));
            console.log(`${name.padEnd(22)} ${rows.length}`);
        }
        console.log(`Written to ${path.resolve(folder)}`);
    } catch (err) {
        console.error(err.message);
        process.exitCode = 1;
    } finally {
        db.end();
    }
})();
