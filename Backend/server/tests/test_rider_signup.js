// Delivery partner sign-up and admin review, against a running backend and the LOCAL database.
//
//   API_URL=http://127.0.0.1:5001/api node server/tests/test_rider_signup.js
//
// OTP codes are set directly in the local database (no SMS is needed or sent).
require('dotenv').config();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');

const BASE = (process.env.API_URL || 'http://127.0.0.1:5001/api').replace(/\/$/, '');
require('./testDatabaseGuard')();

const q = (sql, params = []) => new Promise((res, rej) => pool.query(sql, params, (e, r) => (e ? rej(e) : res(r))));
const call = async (method, path, token, body) => {
    const r = await fetch(BASE + path, {
        method,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: token } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    const type = r.headers.get('content-type') || '';
    let json = null;
    if (type.includes('json')) json = await r.json().catch(() => null);
    else await r.arrayBuffer();
    return { status: r.status, json, type };
};
const results = [];
const check = (name, ok, detail = '') => {
    results.push(ok);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

// A small valid JPEG (header + padding) and a fake "image".
const JPEG = 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), crypto.randomBytes(3000), Buffer.from([0xff, 0xd9])]).toString('base64');
const NOT_IMAGE = 'data:image/jpeg;base64,' + Buffer.from('hello this is not an image'.repeat(80)).toString('base64');

const MOBILE_A = '6111100071';
const MOBILE_B = '6111100072';
const digits = () => (String(process.env.RIDER_OTP_DIGITS) === '6' ? '135792' : '1357');
async function setCode(mobile) {
    const code = digits();
    const hash = crypto.createHmac('sha256', process.env.SECRET_KEY || '').update(`rider_signup:${mobile}:${code}`).digest('hex');
    await q('INSERT IGNORE INTO LoginOtps (Audience, MobileNumber) VALUES (?, ?)', ['rider_signup', mobile]);
    await q("UPDATE LoginOtps SET CodeHash = ?, ExpiresAt = NOW() + INTERVAL 10 MINUTE, FailedAttempts = 0, LockedUntil = NULL WHERE Audience = 'rider_signup' AND MobileNumber = ?", [hash, mobile]);
    return code;
}
const cleanup = async () => {
    const storage = require('../utils/s3');
    const rows = await q('SELECT SelfieKey, AadhaarKey, LicenceKey FROM RiderApplications WHERE MobileNumber IN (?, ?)', [MOBILE_A, MOBILE_B]);
    for (const r of rows) for (const k of [r.SelfieKey, r.AadhaarKey, r.LicenceKey]) if (k) await storage.remove(k).catch(() => {});
    await q('DELETE FROM RiderApplications WHERE MobileNumber IN (?, ?)', [MOBILE_A, MOBILE_B]);
    await q('DELETE FROM AdminUsers WHERE MobileNumber IN (?, ?) AND Role = 2', [MOBILE_A, MOBILE_B]);
    await q('DELETE FROM LoginOtps WHERE MobileNumber IN (?, ?)', [MOBILE_A, MOBILE_B]);
};

(async () => {
    const [superAdmin] = await q("SELECT AdminID FROM AdminUsers WHERE Role = 1 AND Status = 1 AND AdminRole = 'super' LIMIT 1");
    const SUPER = `token ${jwt.sign({ AdminID: superAdmin.AdminID }, process.env.SECRET_KEY, { expiresIn: 600 })}`;
    const created = [];
    await cleanup();
    try {
        // ---------- validation ----------
        let r = await call('POST', '/rider-signup/sendotp', null, { MobileNumber: '512345' });
        check('send OTP refuses a bad number', r.status === 400 && /10-digit/.test(r.json.Message));
        const good = { FullName: 'Suresh Kumar', MobileNumber: MOBILE_A, VehicleType: 'bike', Selfie: JPEG, Aadhaar: JPEG, Licence: JPEG };
        r = await call('POST', '/rider-signup/apply', null, { ...good, FullName: 'Suresh 99' });
        check('name with digits is refused', r.status === 400 && /numbers/.test(r.json.Message));
        r = await call('POST', '/rider-signup/apply', null, { ...good, VehicleType: 'truck' });
        check('vehicle must be bike or auto', r.status === 400 && /bike or auto/.test(r.json.Message));
        r = await call('POST', '/rider-signup/apply', null, { ...good, Aadhaar: undefined });
        check('missing Aadhaar photo is refused', r.status === 400 && /Aadhaar/.test(r.json.Message));
        r = await call('POST', '/rider-signup/apply', null, { ...good, Licence: NOT_IMAGE });
        check('a non-image licence is refused', r.status === 400 && /JPG or PNG/.test(r.json.Message));
        r = await call('POST', '/rider-signup/apply', null, { ...good, OTP: '0000' });
        check('wrong OTP is refused', r.status === 400 && /OTP|code/.test(r.json.Message));

        // ---------- apply ----------
        let code = await setCode(MOBILE_A);
        r = await call('POST', '/rider-signup/apply', null, { ...good, OTP: code });
        check('application submitted with a verified number', r.json && r.json.Status === 1 && r.json.ApplicationID > 0, r.json && r.json.Message);
        const appA = r.json.ApplicationID;
        const [row] = await q('SELECT * FROM RiderApplications WHERE ApplicationID = ?', [appA]);
        check('documents stored privately (not public media folders)', row && /^images\/rider_kyc\//.test(row.AadhaarKey) && /^images\/rider_kyc\//.test(row.LicenceKey));
        r = await call('POST', '/rider-signup/sendotp', null, { MobileNumber: MOBILE_A });
        check('a second application while one is pending is refused', r.status === 400 && /under review/.test(r.json.Message));
        r = await call('POST', '/deliveryboy/sendotp', null, { MobileNumber: MOBILE_A });
        check('rider login says the application is under review', r.json && r.json.Status === 0 && /under review/.test(r.json.Message));

        // ---------- admin ----------
        r = await call('GET', '/admin/rider-applications?status=pending', null);
        check('admin list needs a login', r.status === 401 || (r.json && r.json.Status === 0));
        r = await call('GET', `/admin/rider-applications/${appA}/document/aadhaar`, null);
        check('Aadhaar photo is not public', r.status === 401 || r.status === 403 || (r.json && r.json.Status === 0));
        const mk = async (role) => {
            const ins = await q("INSERT INTO AdminUsers (FirstName, LastName, EmailID, Password, Role, Status, ProfilePic, AdminRole) VALUES ('Role', 'Test', ?, 'NA', 1, 1, 'NA', ?)",
                [`rider-app-${role}-${Date.now()}@example.com`, role]);
            created.push(ins.insertId);
            return `token ${jwt.sign({ AdminID: ins.insertId }, process.env.SECRET_KEY, { expiresIn: 600 })}`;
        };
        const catalog = await mk('catalog');
        const operations = await mk('operations');
        r = await call('GET', '/admin/rider-applications', catalog);
        check('catalog admins cannot see applications (403)', r.status === 403);
        r = await call('GET', '/admin/rider-applications?status=pending', operations);
        check('operations admins see pending applications', r.json && r.json.Status === 1 && r.json.Applications.some((a) => a.ApplicationID === appA) && r.json.Counts.pending >= 1);
        check('the list never includes document paths', r.json && !JSON.stringify(r.json).includes('rider_kyc'));
        r = await call('GET', `/admin/rider-applications/${appA}/document/licence`, SUPER);
        check('admins can open the licence photo', r.status === 200 && /image/.test(r.type));
        r = await call('GET', `/admin/rider-applications/${appA}/document/../../etc`, SUPER);
        check('unknown document names are refused', r.status === 404);

        r = await call('POST', `/admin/rider-applications/${appA}/approve`, SUPER, {});
        check('approve creates the rider login', r.json && r.json.Status === 1 && r.json.RiderID > 0);
        const [rider] = await q('SELECT FirstName, LastName, Role, Status FROM AdminUsers WHERE MobileNumber = ? AND Role = 2', [MOBILE_A]);
        check('rider account is active with the applicant\'s name', rider && rider.Status === 1 && rider.FirstName === 'Suresh' && rider.LastName === 'Kumar');
        r = await call('POST', `/admin/rider-applications/${appA}/approve`, SUPER, {});
        check('approving twice is refused', r.status === 400);
        r = await call('POST', '/rider-signup/sendotp', null, { MobileNumber: MOBILE_A });
        check('an approved rider is told to log in instead', r.status === 400 && /log in/.test(r.json.Message));

        // ---------- reject ----------
        code = await setCode(MOBILE_B);
        r = await call('POST', '/rider-signup/apply', null, { ...good, MobileNumber: MOBILE_B, FullName: 'Anil', VehicleType: 'auto', OTP: code });
        const appB = r.json && r.json.ApplicationID;
        r = await call('POST', `/admin/rider-applications/${appB}/reject`, SUPER, { Reason: '' });
        check('reject needs a reason', r.status === 400);
        r = await call('POST', `/admin/rider-applications/${appB}/reject`, SUPER, { Reason: 'Licence photo is blurred' });
        check('reject with a reason', r.json && r.json.Status === 1);
        r = await call('POST', '/deliveryboy/sendotp', null, { MobileNumber: MOBILE_B });
        check('rejected applicant is told why at login', r.json && /blurred/.test(r.json.Message));
        const [rejected] = await q('SELECT COUNT(*) AS n FROM AdminUsers WHERE MobileNumber = ? AND Role = 2', [MOBILE_B]);
        check('no rider account for a rejected application', rejected.n === 0);

        // ---------- documents of rejected applications are erased after 30 days ----------
        const storage = require('../utils/s3');
        const { purgeRejectedRiderDocuments } = require('../services/Housekeeping');
        const [bRow] = await q('SELECT * FROM RiderApplications WHERE ApplicationID = ?', [appB]);
        const [aRow] = await q('SELECT * FROM RiderApplications WHERE ApplicationID = ?', [appA]);
        check('rejected documents are still there right after rejection', await storage.exists(bRow.AadhaarKey));
        await q('UPDATE RiderApplications SET ReviewedAt = NOW() - INTERVAL 5 DAY WHERE ApplicationID = ?', [appB]);
        await purgeRejectedRiderDocuments();
        check('documents kept 5 days after rejection', await storage.exists(bRow.AadhaarKey));
        r = await call('GET', '/admin/rider-applications?status=rejected', SUPER);
        const listed = r.json && r.json.Applications.find((x) => x.ApplicationID === appB);
        check('admin list shows the deletion date', listed && listed.DocumentsDeleteOn && !listed.DocumentsDeletedAt);
        await q('UPDATE RiderApplications SET ReviewedAt = NOW() - INTERVAL 31 DAY WHERE ApplicationID IN (?, ?)', [appA, appB]);
        await purgeRejectedRiderDocuments();
        const gone = !(await storage.exists(bRow.SelfieKey)) && !(await storage.exists(bRow.AadhaarKey)) && !(await storage.exists(bRow.LicenceKey));
        check('selfie, Aadhaar and licence files deleted 30+ days after rejection', gone);
        const [bAfter] = await q('SELECT AadhaarKey, DocumentsDeletedAt, FullName FROM RiderApplications WHERE ApplicationID = ?', [appB]);
        check('the application row stays, marked as documents deleted', bAfter && bAfter.AadhaarKey === '' && !!bAfter.DocumentsDeletedAt && bAfter.FullName === 'Anil');
        r = await call('GET', `/admin/rider-applications/${appB}/document/aadhaar`, SUPER);
        check('opening a deleted document says it is gone (410)', r.status === 410);
        check("an approved rider's documents are never deleted", await storage.exists(aRow.AadhaarKey));
    } finally {
        await cleanup();
        if (created.length) {
            await q('DELETE FROM AdminAuthAuditLogs WHERE AdminID IN (?)', [created]).catch(() => {});
            await q('DELETE FROM AdminUsers WHERE AdminID IN (?)', [created]);
        }
        const passed = results.filter(Boolean).length;
        console.log(`\n${passed}/${results.length} passed against ${BASE}`);
        pool.end();
        process.exit(passed === results.length ? 0 : 1);
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
