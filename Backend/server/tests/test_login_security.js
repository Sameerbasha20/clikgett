'use strict';
// Login code rules (services/LoginOtp.js) and the webhook signature check. Runs the
// services directly against the database, so no SMS is sent. Uses throwaway numbers
// and removes their rows at the end.
//   npm run test:login            (local Docker MySQL from Backend/.env)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const crypto = require('crypto');

require('./testDatabaseGuard')();

const pool = require('../utils/db');
const LoginOtp = require('../services/LoginOtp');
const PaymentRecovery = require('../services/PaymentRecovery');

const q = (sql, params = []) => new Promise((resolve, reject) =>
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

let passed = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
    if (ok) passed++; else failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `  (${detail})`}`);
};

const stamp = String(Date.now()).slice(-5);
const A = `90011${stamp}`;
const B = `90022${stamp}`;
const C = `90033${stamp}`;
const D = `90044${stamp}`;
const numbers = [A, B, C, D];
// Lets the next issue() through the 30-second resend gap.
const allowResend = (mobile) => q("UPDATE LoginOtps SET LastSentAt = NOW() - INTERVAL 1 MINUTE WHERE MobileNumber = ?", [mobile]);
const wrongCode = (code) => (code === '0000' ? '1111' : '0000');

(async () => {
    try {
        let r = await LoginOtp.issue('customer', A);
        check('issue gives a 4-digit code by default', r.ok && /^\d{4}$/.test(r.code) && r.digits === 4, JSON.stringify(r));
        const first = r.code;
        const [row] = await q('SELECT CodeHash FROM LoginOtps WHERE Audience = ? AND MobileNumber = ?', ['customer', A]);
        check('only a hash of the code is stored', row && /^[0-9a-f]{64}$/.test(row.CodeHash) && row.CodeHash !== first);

        r = await LoginOtp.issue('customer', A);
        check('a second code within 30 seconds is refused', !r.ok && /wait/i.test(r.message), r.message);

        r = await LoginOtp.verify('customer', A, wrongCode(first));
        check('wrong code is rejected with attempts left', !r.ok && /4 attempt/.test(r.message), r.message);
        r = await LoginOtp.verify('rider', A, first);
        check('a customer code does not work for the rider login', !r.ok);
        r = await LoginOtp.verify('customer', A, first);
        check('correct code logs in', r.ok, r.message);
        r = await LoginOtp.verify('customer', A, first);
        check('a used code cannot be reused', !r.ok && /expired or was already used/.test(r.message), r.message);

        await allowResend(A);
        r = await LoginOtp.issue('customer', A);
        const killed = r.code;
        for (let i = 0; i < 5; i++) await LoginOtp.verify('customer', A, wrongCode(killed));
        r = await LoginOtp.verify('customer', A, killed);
        check('5 wrong tries kill the code', !r.ok, r.message);

        await q("UPDATE LoginOtps SET ExpiresAt = NOW() - INTERVAL 1 SECOND, LastSentAt = NOW() - INTERVAL 1 MINUTE WHERE MobileNumber = ?", [A]);
        r = await LoginOtp.verify('customer', A, killed);
        check('an expired code is rejected', !r.ok && /expired/.test(r.message), r.message);

        // 10 wrong codes within 24 hours lock the number.
        let locked = null;
        for (let round = 0; round < 2 && !locked; round++) {
            await allowResend(B);
            const issued = await LoginOtp.issue('customer', B);
            for (let i = 0; i < 5; i++) {
                const v = await LoginOtp.verify('customer', B, wrongCode(issued.code));
                if (/locked/.test(v.message)) { locked = v; break; }
            }
        }
        check('10 wrong codes lock the number', locked && /locked for 24 hours/.test(locked.message), locked && locked.message);
        await allowResend(B);
        r = await LoginOtp.issue('customer', B);
        check('a locked number gets no new code', !r.ok && /locked/.test(r.message), r.message);

        // At most 5 codes an hour.
        let sends = 0;
        let refused = null;
        for (let i = 0; i < 6; i++) {
            await allowResend(C);
            const s = await LoginOtp.issue('rider', C);
            if (s.ok) sends++; else refused = s;
        }
        check('only 5 codes are sent per hour', sends === 5 && refused && /an hour/.test(refused.message), `${sends} sent`);

        // Parallel guesses can't exceed the per-code limit.
        await allowResend(D);
        const parallel = await LoginOtp.issue('customer', D);
        await Promise.all(Array.from({ length: 12 }, () => LoginOtp.verify('customer', D, wrongCode(parallel.code))));
        const [attempts] = await q('SELECT FailedAttempts FROM LoginOtps WHERE Audience = ? AND MobileNumber = ?', ['customer', D]);
        check('parallel wrong guesses stop at 5 tries', attempts.FailedAttempts <= 5, `FailedAttempts=${attempts.FailedAttempts}`);

        process.env.LOGIN_OTP_DIGITS = '6';
        await q('DELETE FROM LoginOtps WHERE MobileNumber = ?', [D]);
        r = await LoginOtp.issue('customer', D);
        check('LOGIN_OTP_DIGITS=6 gives 6-digit codes', r.ok && /^\d{6}$/.test(r.code) && r.digits === 6, JSON.stringify(r));
        delete process.env.LOGIN_OTP_DIGITS;

        process.env.REVIEW_LOGIN_MOBILE = '9999999999';
        process.env.REVIEW_LOGIN_OTP = '4321';
        r = await LoginOtp.issue('customer', '9999999999');
        check('the review account gets no SMS code', r.ok && r.code === null);
        check('the review account logs in with its fixed code', (await LoginOtp.verify('customer', '9999999999', '4321')).ok);
        check('the review account rejects other codes', !(await LoginOtp.verify('customer', '9999999999', '1234')).ok);
        delete process.env.REVIEW_LOGIN_MOBILE;
        delete process.env.REVIEW_LOGIN_OTP;
        r = await LoginOtp.verify('customer', '9999999999', '4321');
        check('without settings the review number has no shortcut', !r.ok, r.message);

        process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_test';
        const body = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
        const goodSig = crypto.createHmac('sha256', 'whsec_test').update(body).digest('hex');
        check('webhook accepts a correctly signed body', PaymentRecovery.validSignature(body, goodSig));
        check('webhook rejects a wrong signature', !PaymentRecovery.validSignature(body, goodSig.replace(/.$/, (c) => (c === '0' ? '1' : '0'))));
        delete process.env.RAZORPAY_WEBHOOK_SECRET;
        check('webhook rejects everything when no secret is set', !PaymentRecovery.validSignature(body, goodSig));
    } catch (err) {
        failed++;
        console.log('FAIL  unexpected error:', err.message);
    } finally {
        await q('DELETE FROM LoginOtps WHERE MobileNumber IN (?)', [numbers]).catch(() => {});
        console.log(`\n${passed}/${passed + failed} passed`);
        pool.end();
        process.exit(failed ? 1 : 0);
    }
})();
