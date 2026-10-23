'use strict';
// One-time login codes for customers and riders (stored in LoginOtps, one row per
// audience + mobile number). Only an HMAC of the code is kept. A code expires after
// 5 minutes, works once, and dies after 5 wrong tries; 10 wrong tries within 24 hours
// lock the number for 24 hours. Sending is limited to 5 codes per hour, 30s apart.
// All time comparisons run in MySQL so app and DB clocks can't disagree.
//
// Settings: LOGIN_OTP_DIGITS / RIDER_OTP_DIGITS (4 or 6, default 4: the apps on the
// store today have 4 boxes), REVIEW_LOGIN_MOBILE + REVIEW_LOGIN_OTP (store-review
// account that logs in with a fixed code and gets no SMS; off unless both are set).
const crypto = require('crypto');
const pool = require('../utils/db');

const CODE_TTL_MINUTES = 5;
const MAX_TRIES_PER_CODE = 5;
const MAX_FAILURES_PER_DAY = 10;
const LOCK_HOURS = 24;
const MAX_SENDS_PER_HOUR = 5;
const RESEND_SECONDS = 30;

const AUDIENCES = ['customer', 'rider'];

const query = (sql, params = []) => new Promise((resolve, reject) =>
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const digitsFor = (audience) => {
    const raw = audience === 'rider' ? process.env.RIDER_OTP_DIGITS : process.env.LOGIN_OTP_DIGITS;
    return String(raw) === '6' ? 6 : 4;
};

const hashCode = (audience, mobile, code) => crypto
    .createHmac('sha256', process.env.SECRET_KEY || '')
    .update(`${audience}:${mobile}:${code}`)
    .digest('hex');

const isReviewLogin = (mobile) => !!process.env.REVIEW_LOGIN_MOBILE && !!process.env.REVIEW_LOGIN_OTP
    && String(mobile) === String(process.env.REVIEW_LOGIN_MOBILE);

const fail = (status, message) => ({ ok: false, status, message });

/**
 * Creates a new code for the number. Returns { ok, code, digits } where code is null
 * for the review account (nothing to send), or { ok: false, status, message }.
 */
async function issue(audience, mobile) {
    if (!AUDIENCES.includes(audience)) throw new Error(`Unknown OTP audience ${audience}`);
    mobile = String(mobile || '').trim();
    const digits = digitsFor(audience);
    if (isReviewLogin(mobile)) return { ok: true, code: null, digits: String(process.env.REVIEW_LOGIN_OTP).length };

    await query('INSERT IGNORE INTO LoginOtps (Audience, MobileNumber) VALUES (?, ?)', [audience, mobile]);
    const [row] = await query(
        `SELECT LockedUntil > NOW() AS locked,
                TIMESTAMPDIFF(SECOND, LastSentAt, NOW()) AS sinceLastSend,
                (SendWindowStart IS NULL OR SendWindowStart < NOW() - INTERVAL 1 HOUR) AS windowExpired,
                SendCount
           FROM LoginOtps WHERE Audience = ? AND MobileNumber = ?`, [audience, mobile]);
    if (row.locked) return fail(429, 'Too many wrong codes. This number is locked for 24 hours. Please contact support if you need help.');
    if (row.sinceLastSend !== null && row.sinceLastSend < RESEND_SECONDS) {
        return fail(429, `Please wait ${RESEND_SECONDS - row.sinceLastSend} seconds before requesting another code.`);
    }
    if (!row.windowExpired && row.SendCount >= MAX_SENDS_PER_HOUR) {
        return fail(429, 'Too many codes requested. Please try again in an hour.');
    }

    const code = String(crypto.randomInt(0, 10 ** digits)).padStart(digits, '0');
    await query(
        `UPDATE LoginOtps SET CodeHash = ?, ExpiresAt = NOW() + INTERVAL ${CODE_TTL_MINUTES} MINUTE, FailedAttempts = 0,
                LastSentAt = NOW(),
                SendCount = IF(SendWindowStart IS NULL OR SendWindowStart < NOW() - INTERVAL 1 HOUR, 1, SendCount + 1),
                SendWindowStart = IF(SendWindowStart IS NULL OR SendWindowStart < NOW() - INTERVAL 1 HOUR, NOW(), SendWindowStart)
          WHERE Audience = ? AND MobileNumber = ?`, [hashCode(audience, mobile, code), audience, mobile]);
    return { ok: true, code, digits };
}

/** Checks a code. Returns { ok: true } once; afterwards the code is gone. */
async function verify(audience, mobile, code) {
    if (!AUDIENCES.includes(audience)) throw new Error(`Unknown OTP audience ${audience}`);
    mobile = String(mobile || '').trim();
    code = String(code === undefined || code === null ? '' : code).trim();
    if (!mobile || !/^\d{4,6}$/.test(code)) return fail(400, 'Incorrect OTP');
    if (isReviewLogin(mobile)) {
        const expected = String(process.env.REVIEW_LOGIN_OTP);
        return code.length === expected.length && crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expected))
            ? { ok: true } : fail(400, 'Incorrect OTP');
    }

    // Reserve one try atomically, so parallel guesses can't exceed the limit.
    const reserved = await query(
        `UPDATE LoginOtps SET FailedAttempts = FailedAttempts + 1
          WHERE Audience = ? AND MobileNumber = ? AND CodeHash IS NOT NULL AND ExpiresAt > NOW()
            AND FailedAttempts < ? AND (LockedUntil IS NULL OR LockedUntil <= NOW())`,
        [audience, mobile, MAX_TRIES_PER_CODE]);
    if (!reserved.affectedRows) {
        const [row] = await query('SELECT LockedUntil > NOW() AS locked FROM LoginOtps WHERE Audience = ? AND MobileNumber = ?', [audience, mobile]);
        if (row && row.locked) return fail(429, 'Too many wrong codes. This number is locked for 24 hours. Please contact support if you need help.');
        return fail(400, 'This code has expired or was already used. Please request a new code.');
    }

    const [row] = await query('SELECT CodeHash, FailedAttempts FROM LoginOtps WHERE Audience = ? AND MobileNumber = ?', [audience, mobile]);
    const expected = Buffer.from(row.CodeHash, 'hex');
    const actual = Buffer.from(hashCode(audience, mobile, code), 'hex');
    if (expected.length === actual.length && crypto.timingSafeEqual(expected, actual)) {
        await query(
            `UPDATE LoginOtps SET CodeHash = NULL, ExpiresAt = NULL, FailedAttempts = 0, RecentFailures = 0,
                    FailureWindowStart = NULL, LockedUntil = NULL
              WHERE Audience = ? AND MobileNumber = ?`, [audience, mobile]);
        return { ok: true };
    }

    // Wrong code: count it towards the 24-hour limit and kill the code after 5 tries.
    await query(
        `UPDATE LoginOtps SET
                RecentFailures = IF(FailureWindowStart IS NULL OR FailureWindowStart < NOW() - INTERVAL 1 DAY, 1, RecentFailures + 1),
                FailureWindowStart = IF(FailureWindowStart IS NULL OR FailureWindowStart < NOW() - INTERVAL 1 DAY, NOW(), FailureWindowStart),
                CodeHash = IF(FailedAttempts >= ?, NULL, CodeHash)
          WHERE Audience = ? AND MobileNumber = ?`, [MAX_TRIES_PER_CODE, audience, mobile]);
    const locked = await query(
        `UPDATE LoginOtps SET LockedUntil = NOW() + INTERVAL ${LOCK_HOURS} HOUR, CodeHash = NULL
          WHERE Audience = ? AND MobileNumber = ? AND RecentFailures >= ?`, [audience, mobile, MAX_FAILURES_PER_DAY]);
    if (locked.affectedRows) return fail(429, 'Too many wrong codes. This number is locked for 24 hours. Please contact support if you need help.');

    const left = MAX_TRIES_PER_CODE - row.FailedAttempts;
    return left > 0
        ? fail(400, `Incorrect OTP. ${left} attempt(s) left.`)
        : fail(400, 'Incorrect OTP. Please request a new code.');
}

/**
 * issue() and text the code. Returns the JSON body for the send-OTP endpoints
 * (business errors are Status 0 with HTTP 200, as the apps expect).
 */
async function send(audience, mobile) {
    const otp = await issue(audience, mobile);
    if (!otp.ok) return { Status: 0, Message: otp.message };
    if (otp.code) {
        const sent = await require('../controllers/CommonController').sendSms(String(mobile).trim(), otp.code).catch((e) => {
            console.error('[LoginOtp] SMS send failed:', e.message);
            return false;
        });
        if (!sent) return { Status: 0, Message: 'Could not send the OTP right now. Please try again.' };
    }
    return { Status: 1, Message: 'OTP sent successfully', OtpLength: otp.digits };
}

module.exports = { issue, verify, send, digitsFor };
