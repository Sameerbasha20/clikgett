// Admin password hashing with Node's built-in scrypt.
//   scrypt$<salt>$<hash>      scrypt of the password (all new and changed passwords)
//   scrypt-md5$<salt>$<hash>  scrypt of the old MD5 hex, for accounts that still had an MD5
//                             value (migrations/password_hash_upgrade_migration.js). Accepted at
//                             login and upgraded to scrypt$ right away.
// Plain-text and bare MD5 values are no longer accepted.
const crypto = require('crypto');

const KEYLEN = 64;

const derive = (input, salt) => crypto.scryptSync(String(input), salt, KEYLEN).toString('hex');
const md5 = (s) => crypto.createHash('md5').update(String(s)).digest('hex');

function hash(plain) {
    const salt = crypto.randomBytes(16).toString('hex');
    return `scrypt$${salt}$${derive(plain, salt)}`;
}

/** Wraps a stored MD5 hex value so it is never kept as bare MD5. */
function wrapMd5(md5Hex) {
    const salt = crypto.randomBytes(16).toString('hex');
    return `scrypt-md5$${salt}$${derive(String(md5Hex).toLowerCase(), salt)}`;
}

/** True when the stored value is one of the hashed formats above. */
const isHashed = (stored) => /^scrypt(-md5)?\$[0-9a-f]+\$[0-9a-f]+$/.test(String(stored || ''));

function safeEqual(a, b) {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** @returns {{ ok: boolean, needsUpgrade: boolean }} */
function verify(plain, stored) {
    if (stored == null || plain == null || plain === '') return { ok: false, needsUpgrade: false };
    const value = String(stored);
    const [kind, salt, expected] = value.split('$');
    if (!salt || !expected) return { ok: false, needsUpgrade: false };
    if (kind === 'scrypt') return { ok: safeEqual(derive(plain, salt), expected), needsUpgrade: false };
    if (kind === 'scrypt-md5') {
        const ok = safeEqual(derive(md5(plain), salt), expected);
        return { ok, needsUpgrade: ok };
    }
    return { ok: false, needsUpgrade: false };
}

module.exports = { hash, wrapMd5, isHashed, verify };
