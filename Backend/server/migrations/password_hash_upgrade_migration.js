// Hashes every admin/rider password still stored as plain text or bare MD5:
//   plain text -> scrypt$...      (same password keeps working)
//   MD5 hex    -> scrypt-md5$...  (same password keeps working; upgraded to scrypt$ at next login)
// 'NA' / empty (riders who log in with OTP) are left alone. Safe to re-run.
const pool = require('../utils/db');
const passwords = require('../utils/password');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    const rows = await query(
        "SELECT AdminID, Password FROM AdminUsers WHERE Password IS NOT NULL AND Password <> '' AND Password <> 'NA' AND Password NOT LIKE 'scrypt$%' AND Password NOT LIKE 'scrypt-md5$%'");
    let plain = 0;
    let md5 = 0;
    for (const r of rows) {
        const value = String(r.Password);
        const isMd5 = /^[0-9a-f]{32}$/i.test(value);
        const next = isMd5 ? passwords.wrapMd5(value) : passwords.hash(value);
        // Only replace the exact value read, so a password changed meanwhile is not overwritten.
        await query('UPDATE AdminUsers SET Password = ? WHERE AdminID = ? AND Password = ?', [next, r.AdminID, value]);
        if (isMd5) md5++; else plain++;
    }
    if (rows.length) console.warn(`AdminUsers: hashed ${plain} plain-text and wrapped ${md5} MD5 password(s)`);
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Password hash upgrade failed:', err.message);
        process.exit(1);
    });
}
