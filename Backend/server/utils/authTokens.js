// Login tokens for the customer and rider apps.
//
// Apps that send "X-Auth-Refresh: 1" when logging in get a short login token
// (ACCESS_SECONDS) plus a refresh token. They swap the refresh token for a new pair
// at POST /api/auth/refresh before the login token runs out, so a token that leaks
// (logs, screenshots, a lost phone backup) stops working within the hour.
//
// Refresh tokens are random, stored only as a SHA-256 hash, and replaced on every
// use. If an already-used refresh token is presented again, someone else has a copy,
// so every token of that login ("family") is revoked and the app must log in again.
//
// App versions that don't send the header keep the old one-year token (no refresh).
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const ACCESS_SECONDS = parseInt(process.env.ACCESS_TOKEN_SECONDS, 10) || 3600;
const REFRESH_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS, 10) || 60;
const LEGACY_SECONDS = 31536000;
// Two requests from the same app can race to refresh. A token used within this many
// seconds is refused without revoking the login; the app picks up the new pair the
// other request saved.
const RACE_GRACE_SECONDS = 30;

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const hash = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const wantsRefresh = (req) => String(req.headers['x-auth-refresh'] || '') === '1';

const accessClaims = (type, subject) => (type === 'USER'
    ? { UserID: subject.UserID }
    : { AdminID: subject.AdminID, Role: subject.Role });

const signAccess = (claims, seconds) => jwt.sign(claims, process.env.SECRET_KEY, { algorithm: 'HS256', expiresIn: seconds });

async function newRefresh(type, subjectId, familyId) {
    const token = crypto.randomBytes(32).toString('base64url');
    await query(
        `INSERT INTO AuthRefreshTokens (SubjectType, SubjectID, TokenHash, FamilyID, ExpiresAt)
         VALUES (?, ?, ?, ?, NOW() + INTERVAL ? DAY)`,
        [type, subjectId, hash(token), familyId, REFRESH_DAYS]);
    return token;
}

/** Token fields for a login response. `subject` is { UserID } or { AdminID, Role }. */
async function issue(req, type, subject) {
    if (!wantsRefresh(req)) {
        return { token: signAccess(accessClaims(type, subject), LEGACY_SECONDS) };
    }
    const subjectId = type === 'USER' ? subject.UserID : subject.AdminID;
    const RefreshToken = await newRefresh(type, subjectId, crypto.randomBytes(16).toString('hex'));
    return { token: signAccess(accessClaims(type, subject), ACCESS_SECONDS), RefreshToken, ExpiresIn: ACCESS_SECONDS };
}

// Still allowed to be logged in? (customer not deleted, rider still a rider)
async function loadSubject(type, id) {
    if (type === 'USER') {
        const [u] = await query('SELECT UserID FROM Users WHERE UserID = ? AND IFNULL(Status, 1) <> 2', [id]);
        return u ? { UserID: u.UserID } : null;
    }
    const [r] = await query('SELECT AdminID, Role FROM AdminUsers WHERE AdminID = ? AND Role = 2', [id]);
    return r ? { AdminID: r.AdminID, Role: r.Role } : null;
}

const revokeFamily = (familyId, reason) => query(
    'UPDATE AuthRefreshTokens SET RevokedAt = NOW(), RevokeReason = ? WHERE FamilyID = ? AND RevokedAt IS NULL',
    [reason, familyId]);

const refused = (resp, message = 'Please log in again') => resp.status(401).json({ Status: 0, Message: message });

/** POST /api/auth/refresh { RefreshToken } -> { token, RefreshToken, ExpiresIn } */
async function refresh(req, resp) {
    try {
        const presented = req.body && typeof req.body.RefreshToken === 'string' ? req.body.RefreshToken : '';
        if (!presented) return refused(resp);
        const [row] = await query(
            `SELECT TokenID, SubjectType, SubjectID, FamilyID, RevokedAt, RevokeReason,
                    ExpiresAt < NOW() AS Expired, TIMESTAMPDIFF(SECOND, RevokedAt, NOW()) AS RevokedAgo
               FROM AuthRefreshTokens WHERE TokenHash = ?`, [hash(presented)]);
        if (!row) return refused(resp);
        if (row.RevokedAt) {
            if (row.RevokeReason === 'rotated' && row.RevokedAgo !== null && row.RevokedAgo <= RACE_GRACE_SECONDS) {
                return resp.status(409).json({ Status: 0, Message: 'Already refreshed', Code: 'REFRESH_RACE' });
            }
            if (row.RevokeReason === 'rotated') await revokeFamily(row.FamilyID, 'reused');
            return refused(resp);
        }
        if (row.Expired) return refused(resp);
        const subject = await loadSubject(row.SubjectType, row.SubjectID);
        if (!subject) {
            await revokeFamily(row.FamilyID, 'account');
            return refused(resp);
        }
        // Only one request can rotate a given token.
        const rotated = await query(
            "UPDATE AuthRefreshTokens SET RevokedAt = NOW(), RevokeReason = 'rotated' WHERE TokenID = ? AND RevokedAt IS NULL",
            [row.TokenID]);
        if (!rotated.affectedRows) {
            return resp.status(409).json({ Status: 0, Message: 'Already refreshed', Code: 'REFRESH_RACE' });
        }
        const RefreshToken = await newRefresh(row.SubjectType, row.SubjectID, row.FamilyID);
        return resp.json({
            Status: 1,
            token: signAccess(accessClaims(row.SubjectType, subject), ACCESS_SECONDS),
            RefreshToken,
            ExpiresIn: ACCESS_SECONDS
        });
    } catch (err) {
        console.error('refresh token error:', err.message);
        return resp.status(500).json({ Status: 0, Message: 'Could not refresh the session' });
    }
}

/** POST /api/auth/logout { RefreshToken } -> ends that login on the server. */
async function logout(req, resp) {
    try {
        const presented = req.body && typeof req.body.RefreshToken === 'string' ? req.body.RefreshToken : '';
        if (presented) {
            const [row] = await query('SELECT FamilyID FROM AuthRefreshTokens WHERE TokenHash = ?', [hash(presented)]);
            if (row) await revokeFamily(row.FamilyID, 'logout');
        }
        return resp.json({ Status: 1, Message: 'Logged out' });
    } catch (err) {
        console.error('logout error:', err.message);
        return resp.status(500).json({ Status: 0, Message: 'Could not log out' });
    }
}

/** Ends every login of a customer or rider (e.g. account deleted). */
const revokeAllFor = (type, subjectId, reason = 'account') => query(
    'UPDATE AuthRefreshTokens SET RevokedAt = NOW(), RevokeReason = ? WHERE SubjectType = ? AND SubjectID = ? AND RevokedAt IS NULL',
    [reason, type, subjectId]);

module.exports = { issue, refresh, logout, revokeAllFor, ACCESS_SECONDS, REFRESH_DAYS };
