'use strict';
// Wallet rewards the admin sets in Settings → Rewards (CustomerRewardSettings):
//   - comeback cash: customers who ordered before but not in N days get ₹X that expires
//     after H hours; once per quiet spell (not again until they order)
//   - birthday: ₹X on the customer's birthday (India date), valid D days, once a year
// Unused reward money is taken back when it expires. Runs hourly inside the backend
// (server.js, skipped with BACKGROUND_JOBS=off).
//
// Ledger: Wallets ContentType 6 = comeback reward, 7 = birthday reward. The expiry
// debit uses the same ContentType with ContentID = the credit's WalletID.
const pool = require('../utils/db');

const COMEBACK = 6;
const BIRTHDAY = 7;
const BATCH = 500;

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function settings() {
    const [row] = await query('SELECT * FROM CustomerRewardSettings WHERE ID = 1');
    return row || null;
}

// Credit (or debit) a wallet and its balance together, so the ledger always matches.
async function inTransaction(work) {
    const conn = await new Promise((res, rej) => pool.getConnection((e, c) => (e ? rej(e) : res(c))));
    const run = (sql, params = []) => new Promise((res, rej) => conn.query(sql, params, (e, r) => (e ? rej(e) : res(r))));
    try {
        await run('START TRANSACTION');
        const result = await work(run);
        await run('COMMIT');
        return result;
    } catch (err) {
        await run('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        conn.release();
    }
}

async function credit(userId, amount, contentType, description, expirySql, expiryValue) {
    await inTransaction(async (run) => {
        await run(
            `INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, ExpiryDate, IsExpired, CreatedAt)
             VALUES (?, ?, 1, ?, 0, ?, DATE_ADD(NOW(), ${expirySql}), 0, NOW())`,
            [userId, amount, contentType, description, expiryValue]);
        await run('UPDATE Users SET WalletAmount = COALESCE(WalletAmount, 0) + ? WHERE UserID = ?', [amount, userId]);
    });
}

function notify(userId, title, message) {
    // Required lazily: CommonController pulls in most of the app.
    const CommonController = require('../controllers/CommonController');
    return CommonController.Send_Notification({ Title: title, Message: message }, userId, 'admin')
        .catch((e) => console.log('[Rewards] notification failed', e.message));
}

const rupees = (n) => `₹${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;

async function giveComeback(s) {
    const amount = Number(s.ComebackAmount);
    const days = parseInt(s.ComebackInactiveDays, 10);
    const hours = parseInt(s.ComebackValidHours, 10);
    if (!s.ComebackEnabled || !(amount > 0) || !(days > 0) || !(hours > 0)) return 0;
    // Customers with a delivered order, none placed in `days`, and no comeback cash since
    // their last order.
    const users = await query(`
        SELECT u.UserID, u.FirstName
          FROM Users u
          JOIN (SELECT UserID, MAX(CreatedAt) AS LastOrder FROM Orders GROUP BY UserID) o ON o.UserID = u.UserID
         WHERE u.Status = 1
           AND o.LastOrder < NOW() - INTERVAL ? DAY
           AND EXISTS (SELECT 1 FROM Orders d WHERE d.UserID = u.UserID AND d.OrderStatus = 1)
           AND NOT EXISTS (SELECT 1 FROM Wallets w WHERE w.UserID = u.UserID AND w.ContentType = ${COMEBACK}
                            AND w.Credited_Debited = 1 AND w.CreatedAt > o.LastOrder)
         LIMIT ${BATCH}`, [days]);
    for (const u of users) {
        await credit(u.UserID, amount, COMEBACK, `Comeback reward (use within ${hours} hours)`, 'INTERVAL ? HOUR', hours);
        await notify(u.UserID, `🎁 ${rupees(amount)} added to your wallet`,
            `We miss you${u.FirstName ? `, ${u.FirstName}` : ''}! ${rupees(amount)} is in your ClikGett wallet. Use it within ${hours} hours before it expires.`);
    }
    return users.length;
}

// Today's month and day in India; 29 Feb birthdays are celebrated on 28 Feb otherwise.
function indiaToday(now = new Date()) {
    const ist = new Date(now.getTime() + 330 * 60 * 1000);
    const y = ist.getUTCFullYear();
    const month = ist.getUTCMonth() + 1;
    const day = ist.getUTCDate();
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return { month, day, alsoLeapDay: !leap && month === 2 && day === 28 };
}

async function giveBirthday(s, now) {
    const amount = Number(s.BirthdayAmount);
    const days = parseInt(s.BirthdayValidDays, 10);
    if (!s.BirthdayEnabled || !(amount > 0) || !(days > 0)) return 0;
    const t = indiaToday(now);
    const users = await query(`
        SELECT u.UserID, u.FirstName FROM Users u
         WHERE u.Status = 1 AND u.DateOfBirth IS NOT NULL
           AND MONTH(u.DateOfBirth) = ? AND (DAY(u.DateOfBirth) = ? OR (? AND DAY(u.DateOfBirth) = 29))
           AND NOT EXISTS (SELECT 1 FROM Wallets w WHERE w.UserID = u.UserID AND w.ContentType = ${BIRTHDAY}
                            AND w.Credited_Debited = 1 AND w.CreatedAt > NOW() - INTERVAL 300 DAY)
         LIMIT ${BATCH}`, [t.month, t.day, t.alsoLeapDay ? 1 : 0]);
    for (const u of users) {
        await credit(u.UserID, amount, BIRTHDAY, `Birthday reward (use within ${days} days)`, 'INTERVAL ? DAY', days);
        await notify(u.UserID, `🎂 Happy birthday${u.FirstName ? `, ${u.FirstName}` : ''}!`,
            `${rupees(amount)} birthday gift is in your ClikGett wallet. Use it within ${days} day${days === 1 ? '' : 's'}.`);
    }
    return users.length;
}

// Takes back what is left of expired reward credits. Spending after the credit is
// counted against it first; the amount taken never exceeds the balance.
async function expireDue() {
    const due = await query(`
        SELECT WalletID, UserID, Amount, ContentType, CreatedAt FROM Wallets
         WHERE ContentType IN (${COMEBACK}, ${BIRTHDAY}) AND Credited_Debited = 1 AND IsExpired = 0
           AND ExpiryDate IS NOT NULL AND ExpiryDate < NOW()
         ORDER BY ExpiryDate LIMIT ${BATCH}`);
    let taken = 0;
    for (const c of due) {
        await inTransaction(async (run) => {
            const [user] = await run('SELECT COALESCE(WalletAmount, 0) AS balance FROM Users WHERE UserID = ? FOR UPDATE', [c.UserID]);
            const [spent] = await run(
                `SELECT COALESCE(SUM(Amount), 0) AS total FROM Wallets
                  WHERE UserID = ? AND Credited_Debited = 2 AND CreatedAt >= ?
                    AND ContentType NOT IN (${COMEBACK}, ${BIRTHDAY}) AND Description NOT LIKE '%expired%'`,
                [c.UserID, c.CreatedAt]);
            const left = Math.max(0, Math.min(Number(c.Amount) - Number(spent.total), Number(user ? user.balance : 0)));
            const amount = Math.round(left * 100) / 100;
            await run('UPDATE Wallets SET IsExpired = 1 WHERE WalletID = ?', [c.WalletID]);
            if (amount > 0) {
                await run(
                    `INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, CreatedAt)
                     VALUES (?, ?, 2, ?, ?, 'Reward expired', NOW())`, [c.UserID, amount, c.ContentType, c.WalletID]);
                await run('UPDATE Users SET WalletAmount = WalletAmount - ? WHERE UserID = ?', [amount, c.UserID]);
                taken++;
            }
        });
    }
    return { expired: due.length, taken };
}

async function runOnce(now = new Date()) {
    const s = await settings();
    if (!s) return null;
    const expiry = await expireDue();
    const comeback = await giveComeback(s);
    const birthday = await giveBirthday(s, now);
    if (comeback || birthday || expiry.expired) {
        console.log(`[Rewards] comeback ${comeback}, birthday ${birthday}, expired ${expiry.expired} (${expiry.taken} with money left)`);
    }
    return { Comeback: comeback, Birthday: birthday, Expired: expiry.expired };
}

function start() {
    const tick = () => runOnce().catch((e) => console.error('[Rewards] run failed:', e.message));
    setTimeout(tick, 30 * 1000).unref();
    setInterval(tick, 60 * 60 * 1000).unref();
}

module.exports = { runOnce, start, indiaToday, settings, COMEBACK, BIRTHDAY };
