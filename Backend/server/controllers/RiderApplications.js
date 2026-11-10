// Delivery partner sign-up from the rider app, and the admin review of applications.
//
// Rider app (no login yet):
//   POST /api/rider-signup/sendotp  { MobileNumber }                       -> SMS code
//   POST /api/rider-signup/apply    { FullName, MobileNumber, OTP, VehicleType,
//                                     Selfie, Aadhaar, Licence }            (base64 JPEG/PNG)
// Admin (riders area):
//   GET  /api/admin/rider-applications?status=pending
//   GET  /api/admin/rider-applications/:id/document/:doc   (selfie | aadhaar | licence)
//   POST /api/admin/rider-applications/:id/approve         -> creates the rider login
//   POST /api/admin/rider-applications/:id/reject  { Reason }
//
// Aadhaar and licence photos are personal documents: stored privately and only streamed
// to signed-in admins with the riders permission. Never placed in public media folders.
const crypto = require('crypto');
const pool = require('../utils/db');
const LoginOtp = require('../services/LoginOtp');
const customerPhotos = require('../utils/customerPhotos');

const q = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const MOBILE = /^[6-9]\d{9}$/;
const NAME = /^[A-Za-z][A-Za-z .']{1,59}$/;
const VEHICLES = ['bike', 'auto'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DOCS = { selfie: 'SelfieKey', aadhaar: 'AadhaarKey', licence: 'LicenceKey' };
const { REJECTED_DOCS_DAYS } = require('../services/Housekeeping');

const bad = (resp, message, status = 400) => resp.status(status).json({ Status: 0, Message: message });

/** Decodes a base64 photo; returns { buffer, ext, mime } or an error message. */
function readPhoto(value, label) {
    if (!value || typeof value !== 'string') return { error: `Please add your ${label} photo` };
    const m = value.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,/i);
    const mime = m ? m[1].toLowerCase().replace('jpg', 'jpeg') : 'image/jpeg';
    const buffer = Buffer.from(value.replace(/^data:[^,]+,/, ''), 'base64');
    if (buffer.length < 1024) return { error: `The ${label} photo is not readable. Please take it again.` };
    if (buffer.length > MAX_IMAGE_BYTES) return { error: `The ${label} photo is too large (max 5 MB)` };
    // Real image files only (JPEG / PNG / WEBP signatures).
    const sig = buffer.subarray(0, 12);
    const isJpeg = sig[0] === 0xff && sig[1] === 0xd8;
    const isPng = sig[0] === 0x89 && sig.toString('ascii', 1, 4) === 'PNG';
    const isWebp = sig.toString('ascii', 0, 4) === 'RIFF' && sig.toString('ascii', 8, 12) === 'WEBP';
    if (!isJpeg && !isPng && !isWebp) return { error: `The ${label} photo must be a JPG or PNG image` };
    return { buffer, ext: isPng ? '.png' : isWebp ? '.webp' : '.jpg', mime: isPng ? 'image/png' : isWebp ? 'image/webp' : mime };
}

const RiderApplications = {
    sendOtp: async (req, resp) => {
        try {
            const mobile = String((req.body || {}).MobileNumber || '').trim();
            if (!MOBILE.test(mobile)) return bad(resp, 'Enter a valid 10-digit mobile number');
            const [rider] = await q('SELECT AdminID FROM AdminUsers WHERE MobileNumber = ? AND Role = 2 AND Status <> 0 LIMIT 1', [mobile]);
            if (rider) return bad(resp, 'This number is already a delivery partner. Please log in.');
            const [open] = await q("SELECT ApplicationID FROM RiderApplications WHERE MobileNumber = ? AND Status = 'pending' LIMIT 1", [mobile]);
            if (open) return bad(resp, 'Your application is already under review. We will call you soon.');
            return resp.json(await LoginOtp.send('rider_signup', mobile));
        } catch (err) {
            console.error('[rider-signup] sendOtp failed:', err.message);
            return bad(resp, 'Could not send the OTP right now. Please try again.', 500);
        }
    },

    apply: async (req, resp) => {
        try {
            const b = req.body || {};
            const name = String(b.FullName || '').trim().replace(/\s+/g, ' ');
            const mobile = String(b.MobileNumber || '').trim();
            const vehicle = String(b.VehicleType || '').trim().toLowerCase();
            if (!name) return bad(resp, 'Please enter your full name');
            if (/\d/.test(name)) return bad(resp, 'Name cannot contain numbers');
            if (!NAME.test(name)) return bad(resp, 'Name can only have letters and spaces (2-60 characters)');
            if (!MOBILE.test(mobile)) return bad(resp, 'Enter a valid 10-digit mobile number');
            if (!VEHICLES.includes(vehicle)) return bad(resp, 'Choose bike or auto');

            const photos = {};
            for (const [field, label] of [['Selfie', 'selfie'], ['Aadhaar', 'Aadhaar card'], ['Licence', 'driving licence']]) {
                const p = readPhoto(b[field], label);
                if (p.error) return bad(resp, p.error);
                photos[field] = p;
            }

            const [rider] = await q('SELECT AdminID FROM AdminUsers WHERE MobileNumber = ? AND Role = 2 AND Status <> 0 LIMIT 1', [mobile]);
            if (rider) return bad(resp, 'This number is already a delivery partner. Please log in.');
            const [open] = await q("SELECT ApplicationID FROM RiderApplications WHERE MobileNumber = ? AND Status = 'pending' LIMIT 1", [mobile]);
            if (open) return bad(resp, 'Your application is already under review. We will call you soon.');

            // The number must be the applicant's own (OTP checked last, so a typo above doesn't use up the code).
            const otp = await LoginOtp.verify('rider_signup', mobile, b.OTP);
            if (!otp.ok) return bad(resp, otp.message, otp.status || 400);

            const id = crypto.randomBytes(8).toString('hex');
            const keys = {};
            for (const [field, folderName] of [['Selfie', 'selfie'], ['Aadhaar', 'aadhaar'], ['Licence', 'licence']]) {
                const p = photos[field];
                keys[field] = await customerPhotos.save(p.buffer, 'rider_kyc', `${mobile}_${id}_${folderName}${p.ext}`, p.mime);
            }
            const result = await q(
                `INSERT INTO RiderApplications (FullName, MobileNumber, VehicleType, SelfieKey, AadhaarKey, LicenceKey)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [name, mobile, vehicle, keys.Selfie, keys.Aadhaar, keys.Licence]);
            return resp.json({
                Status: 1,
                ApplicationID: result.insertId,
                Message: 'Application submitted. Our team will verify your documents and call you within 2 days.',
            });
        } catch (err) {
            console.error('[rider-signup] apply failed:', err.message);
            return bad(resp, 'Could not submit your application. Please try again.', 500);
        }
    },

    // ---------------------------------------------------------------- admin

    list: async (req, resp) => {
        try {
            const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : null;
            const rows = await q(
                `SELECT a.ApplicationID, a.FullName, a.MobileNumber, a.VehicleType, a.Status, a.RejectReason,
                        a.ReviewedAt, a.RiderAdminID, a.CreatedAt, a.DocumentsDeletedAt,
                        DATE_ADD(a.ReviewedAt, INTERVAL ${REJECTED_DOCS_DAYS} DAY) AS DocumentsDeleteOn,
                        TRIM(CONCAT(COALESCE(r.FirstName, ''), ' ', COALESCE(r.LastName, ''))) AS ReviewedByName
                   FROM RiderApplications a LEFT JOIN AdminUsers r ON r.AdminID = a.ReviewedBy
                  ${status ? 'WHERE a.Status = ?' : ''}
                  ORDER BY a.Status = 'pending' DESC, a.CreatedAt DESC LIMIT 300`,
                status ? [status] : []);
            const [counts] = await q(
                `SELECT SUM(Status = 'pending') AS pending, SUM(Status = 'approved') AS approved, SUM(Status = 'rejected') AS rejected
                   FROM RiderApplications`);
            return resp.json({
                Status: 1,
                Applications: rows,
                Counts: { pending: Number(counts.pending) || 0, approved: Number(counts.approved) || 0, rejected: Number(counts.rejected) || 0 },
            });
        } catch (err) {
            console.error('[rider-applications] list failed:', err.message);
            return bad(resp, 'Could not load applications', 500);
        }
    },

    document: async (req, resp) => {
        try {
            const column = DOCS[req.params.doc];
            if (!column) return resp.status(404).send('Not found');
            const [row] = await q(`SELECT ${column} AS k FROM RiderApplications WHERE ApplicationID = ?`, [req.params.id]);
            if (!row) return resp.status(404).send('Not found');
            if (!row.k) return resp.status(410).send('Documents were deleted');
            resp.setHeader('Cache-Control', 'private, no-store');
            return customerPhotos.send(resp, row.k);
        } catch (err) {
            console.error('[rider-applications] document failed:', err.message);
            return resp.status(500).send('Could not load the document');
        }
    },

    approve: async (req, resp) => {
        const conn = await new Promise((res, rej) => pool.getConnection((e, c) => (e ? rej(e) : res(c))));
        const cq = (sql, params = []) => new Promise((res, rej) => conn.query(sql, params, (e, r) => (e ? rej(e) : res(r))));
        try {
            await cq('START TRANSACTION');
            const [app] = await cq('SELECT * FROM RiderApplications WHERE ApplicationID = ? FOR UPDATE', [req.params.id]);
            if (!app) { await cq('ROLLBACK'); return bad(resp, 'Application not found', 404); }
            if (app.Status !== 'pending') { await cq('ROLLBACK'); return bad(resp, `This application is already ${app.Status}`); }
            const [existing] = await cq('SELECT AdminID FROM AdminUsers WHERE MobileNumber = ? AND Role = 2 AND Status <> 0 LIMIT 1', [app.MobileNumber]);
            if (existing) { await cq('ROLLBACK'); return bad(resp, 'A rider with this mobile number already exists'); }
            const parts = app.FullName.split(' ');
            const first = parts.shift();
            const last = parts.join(' ') || 'NA';
            const ins = await cq(
                `INSERT INTO AdminUsers (FirstName, LastName, MobileNumber, EmailID, Password, Role, Status, ProfilePic)
                 VALUES (?, ?, ?, ?, 'NA', 2, 1, 'NA')`,
                [first, last, app.MobileNumber, `rider${app.MobileNumber}@riders.clikgett.local`]);
            await cq(
                `UPDATE RiderApplications SET Status = 'approved', ReviewedBy = ?, ReviewedAt = NOW(), RiderAdminID = ?
                  WHERE ApplicationID = ?`, [req.AdminID || null, ins.insertId, app.ApplicationID]);
            await cq('COMMIT');
            return resp.json({ Status: 1, RiderID: ins.insertId, Message: `${app.FullName} can now log in to the rider app with ${app.MobileNumber}` });
        } catch (err) {
            await cq('ROLLBACK').catch(() => {});
            console.error('[rider-applications] approve failed:', err.message);
            return bad(resp, 'Could not approve the application', 500);
        } finally {
            conn.release();
        }
    },

    reject: async (req, resp) => {
        try {
            const reason = String((req.body || {}).Reason || '').trim();
            if (reason.length < 3) return bad(resp, 'Please give a reason (the applicant may be told it)');
            if (reason.length > 255) return bad(resp, 'Keep the reason under 255 characters');
            const result = await q(
                `UPDATE RiderApplications SET Status = 'rejected', RejectReason = ?, ReviewedBy = ?, ReviewedAt = NOW()
                  WHERE ApplicationID = ? AND Status = 'pending'`, [reason, req.AdminID || null, req.params.id]);
            if (!result.affectedRows) return bad(resp, 'Application not found or already reviewed', 404);
            return resp.json({ Status: 1, Message: 'Application rejected' });
        } catch (err) {
            console.error('[rider-applications] reject failed:', err.message);
            return bad(resp, 'Could not reject the application', 500);
        }
    },
};

module.exports = RiderApplications;
