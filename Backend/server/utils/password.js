// Admin password hashing with Node's built-in scrypt ("scrypt$<salt>$<hash>").
// Older rows hold plain text (or MD5); verify() still accepts them and reports
// needsUpgrade so the caller can store the hashed form after a successful login.
const crypto = require('crypto');

const KEYLEN = 64;

function hash(plain) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(String(plain), salt, KEYLEN).toString('hex');
    return `scrypt$${salt}$${derived}`;
}

function safeEqual(a, b) {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** @returns {{ ok: boolean, needsUpgrade: boolean }} */
function verify(plain, stored) {
    if (stored == null || plain == null) return { ok: false, needsUpgrade: false };
    const value = String(stored);
    if (value.startsWith('scrypt$')) {
        const [, salt, expected] = value.split('$');
        if (!salt || !expected) return { ok: false, needsUpgrade: false };
        const derived = crypto.scryptSync(String(plain), salt, KEYLEN).toString('hex');
        return { ok: safeEqual(derived, expected), needsUpgrade: false };
    }
    const md5 = crypto.createHash('md5').update(String(plain)).digest('hex');
    const ok = safeEqual(plain, value) || safeEqual(md5, value);
    return { ok, needsUpgrade: ok };
}

module.exports = { hash, verify };
