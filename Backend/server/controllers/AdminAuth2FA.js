'use strict';
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const totp = require('../utils/totp');
const passwords = require('../utils/password');
require('dotenv').config();

const pool = require('../utils/db');

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
};

// Check if Demo OTP mode is active (strictly development environment + explicit flag)
const isDemoOtpEnabled = () => {
    return (
        process.env.NODE_ENV === 'development' &&
        (process.env.ADMIN_2FA_DEMO_OTP === 'true' || process.env.ADMIN_2FA_DEMO_OTP === '123456' || Boolean(process.env.ADMIN_2FA_DEMO_OTP))
    );
};

// Configurable Demo OTP value
const getDemoOtpValue = () => {
    return process.env.ADMIN_2FA_FIXED_DEMO_OTP || '123456';
};

// Email integration placeholder for future Brevo / SMTP dispatch
const sendAdmin2FAEmail = async (email, otpCode) => {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    if (brevoApiKey) {
        try {
            // Placeholder: When Brevo API key is configured, invoke Brevo transactional email
            console.log(`[EmailService:Brevo] Dispatching 2FA OTP email to ${email}`);
        } catch (e) {
            console.error('[EmailService:Brevo] Error dispatching 2FA email:', e.message);
        }
    } else if (smtpHost) {
        console.log(`[EmailService:SMTP] Dispatching 2FA OTP email to ${email}`);
    } else {
        if (isDemoOtpEnabled()) {
            console.log(`[AdminAuth2FA:DevMode] SMTP/Brevo not configured. Demo OTP generated for ${email}: ${otpCode}`);
        } else {
            console.warn(`[AdminAuth2FA:Warning] SMTP/Brevo not configured and Demo OTP mode disabled. Cannot send OTP to ${email}`);
        }
    }
};

const SMS_CODE_TTL_SECONDS = 600; // the approved SMS template says "valid for 10 minutes"
const SMS_RESEND_SECONDS = 30;

// SMS codes go to TwoFactorMobileNumbers (comma-separated, so the store owner and a
// developer can both receive them), falling back to the admin's own MobileNumber.
const getSmsNumbers = (user) => {
    const raw = user.TwoFactorMobileNumbers || user.MobileNumber || '';
    const numbers = String(raw).split(',').map((n) => n.trim()).filter((n) => /^[6-9][0-9]{9}$/.test(n));
    return [...new Set(numbers)];
};

const maskNumber = (number) => `******${number.slice(-4)}`;

// Keyed with the server secret so a leaked hash can't be brute-forced over all 10^6 codes.
const hashSmsCode = (adminId, code) => crypto
    .createHmac('sha256', process.env.SECRET_KEY)
    .update(`${adminId}:${code}`)
    .digest('hex');

// TwoFactorLastUsedTimestamp holds the last TOTP time-step (30s). Older demo-OTP logins
// stored Unix seconds there, which made every authenticator code look like a replay.
const toTimeStep = (value) => {
    const n = Number(value) || 0;
    return n > 1e9 ? Math.floor(n / 30) : n;
};

const verifyPreAuthToken = (twoFactorToken) => {
    if (!twoFactorToken) return null;
    try {
        const decoded = jwt.verify(twoFactorToken, process.env.SECRET_KEY);
        return decoded.is2FAPending && decoded.AdminID ? decoded : null;
    } catch (e) {
        return null;
    }
};

const auditLog = async (adminId, email, action, status, details, req) => {
    try {
        const ip = (req && req.headers ? req.headers['x-forwarded-for'] : '') || (req && req.socket ? req.socket.remoteAddress : '') || '127.0.0.1';
        const userAgent = (req && req.headers ? req.headers['user-agent'] : '') || 'AdminPortal';
        await queryAsync(
            `INSERT INTO AdminAuthAuditLogs (AdminID, EmailID, Action, IPAddress, UserAgent, Status, Details, CreatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [adminId, email, action, String(ip).slice(0, 45), String(userAgent).slice(0, 500), status, details]
        );
    } catch (e) {
        console.error('Error writing AdminAuthAuditLogs:', e.message);
    }
};

const AdminAuth2FA = {
    // Expose helper for test verification
    _isDemoOtpEnabled: isDemoOtpEnabled,
    _getDemoOtpValue: getDemoOtpValue,

    // Step 1: Verify primary credentials and initiate 2FA
    login: async (req, resp) => {
        try {
            const { EmailID, Password } = req.body || {};
            if (!EmailID || !Password) {
                return resp.status(400).json({ Status: 0, Message: "Email and password are required" });
            }

            const cleanEmail = String(EmailID).trim();
            const users = await queryAsync(
                "SELECT * FROM AdminUsers WHERE EmailID = ? AND Role = 1",
                [cleanEmail]
            );

            if (users.length === 0) {
                await auditLog(null, cleanEmail, 'LOGIN_FAILED', 'FAILURE', 'Admin email not found', req);
                return resp.status(400).json({ Status: 0, Message: "Invalid email or password" });
            }

            const user = users[0];

            // Hashed passwords (scrypt); older plain/MD5 rows are upgraded on a successful login.
            const check = passwords.verify(Password, user.Password);
            if (check.ok && check.needsUpgrade) {
                await queryAsync("UPDATE AdminUsers SET Password = ? WHERE AdminID = ?", [passwords.hash(Password), user.AdminID]);
            }
            if (!check.ok) {
                await auditLog(user.AdminID, cleanEmail, 'LOGIN_FAILED', 'FAILURE', 'Incorrect password', req);
                return resp.status(400).json({ Status: 0, Message: "Invalid email or password" });
            }

            // Check if account is temporarily locked due to failed 2FA attempts
            if (user.TwoFactorLockedUntil && new Date(user.TwoFactorLockedUntil) > new Date()) {
                const remainingSecs = Math.ceil((new Date(user.TwoFactorLockedUntil) - new Date()) / 1000);
                const remainingMins = Math.ceil(remainingSecs / 60);
                await auditLog(user.AdminID, cleanEmail, 'LOGIN_BLOCKED', 'FAILURE', `Account locked. ${remainingMins} mins remaining`, req);
                return resp.status(403).json({
                    Status: 0,
                    Message: `Account temporarily locked due to multiple failed 2FA attempts. Please try again in ${remainingMins} minute(s).`
                });
            }

            // Generate temporary Demo OTP if in development mode
            let demoOtpCode = null;
            let demoOtpHash = null;
            let demoOtpIssuedAt = null;

            if (isDemoOtpEnabled()) {
                demoOtpCode = getDemoOtpValue();
                demoOtpHash = crypto.createHash('sha256').update(demoOtpCode).digest('hex');
                demoOtpIssuedAt = Math.floor(Date.now() / 1000);
                await sendAdmin2FAEmail(cleanEmail, demoOtpCode);
            }

            // Issue a short-lived (5 min) pre-auth token that CANNOT be used on protected endpoints
            const preAuthPayload = {
                AdminID: user.AdminID,
                EmailID: user.EmailID,
                is2FAPending: true,
                ...(demoOtpHash ? { demoOtpHash, demoOtpIssuedAt } : {})
            };
            const twoFactorToken = jwt.sign(preAuthPayload, process.env.SECRET_KEY, { expiresIn: 300 });

            await auditLog(user.AdminID, cleanEmail, 'PASSWORD_VERIFIED', 'SUCCESS', 'Primary credentials valid; 2FA initiated', req);

            // Masked numbers the admin can choose to receive an SMS code on instead of the app.
            const smsNumbers = getSmsNumbers(user).map(maskNumber);

            // Check if user has already configured TOTP
            if (user.TwoFactorEnabled && user.TwoFactorSecret) {
                const responseData = {
                    Status: 1,
                    require2FA: true,
                    isSetup: false,
                    twoFactorToken,
                    smsNumbers,
                    Message: isDemoOtpEnabled()
                        ? `Temporary Demo OTP mode active. Enter ${demoOtpCode} or code from authenticator app.`
                        : "Please enter the 6-digit code from your authenticator app"
                };
                if (isDemoOtpEnabled()) {
                    responseData.isDemoOtp = true;
                    responseData.demoOtp = demoOtpCode;
                }
                return resp.status(200).json(responseData);
            } else {
                // Initial setup required: generate new secret and recovery codes
                const newSecret = totp.generateSecret();
                const { rawCodes, hashedCodes } = totp.generateRecoveryCodes();
                const keyUri = totp.generateKeyUri(user.EmailID, 'ClikGett Admin', newSecret);

                // Temporarily store pending secret in session token payload so server remains stateless
                const setupPreAuthPayload = {
                    ...preAuthPayload,
                    pendingSecret: newSecret,
                    pendingRecoveryHashes: hashedCodes
                };
                const setupToken = jwt.sign(setupPreAuthPayload, process.env.SECRET_KEY, { expiresIn: 600 });

                const responseData = {
                    Status: 1,
                    require2FA: true,
                    isSetup: true,
                    twoFactorToken: setupToken,
                    smsNumbers,
                    secret: newSecret,
                    qrUri: keyUri,
                    recoveryCodes: rawCodes,
                    Message: isDemoOtpEnabled()
                        ? `Temporary Demo OTP mode active. Enter ${demoOtpCode} or complete authenticator setup.`
                        : "Two-factor authentication setup is required. Scan the QR code or enter the secret in your authenticator app."
                };
                if (isDemoOtpEnabled()) {
                    responseData.isDemoOtp = true;
                    responseData.demoOtp = demoOtpCode;
                }
                return resp.status(200).json(responseData);
            }
        } catch (err) {
            console.error("Exception in 2FA login:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error during login" });
        }
    },

    // Step 2 (SMS option): text a 6-digit code to the admin's registered mobile number(s)
    sendSmsCode: async (req, resp) => {
        try {
            const decoded = verifyPreAuthToken((req.body || {}).twoFactorToken);
            if (!decoded) {
                return resp.status(401).json({ Status: 0, Message: "Two-factor session expired. Please log in again." });
            }

            const [user] = await queryAsync("SELECT * FROM AdminUsers WHERE AdminID = ? AND Role = 1", [decoded.AdminID]);
            if (!user) {
                return resp.status(404).json({ Status: 0, Message: "Admin user not found" });
            }
            if (user.TwoFactorLockedUntil && new Date(user.TwoFactorLockedUntil) > new Date()) {
                const remainingMins = Math.ceil((new Date(user.TwoFactorLockedUntil) - new Date()) / 60000);
                return resp.status(403).json({
                    Status: 0,
                    Message: `Account locked due to failed attempts. Please try again in ${remainingMins} minute(s).`
                });
            }

            const numbers = getSmsNumbers(user);
            if (numbers.length === 0) {
                return resp.status(400).json({ Status: 0, Message: "No mobile number is registered for SMS codes. Please use your authenticator app." });
            }

            const sinceLastSend = user.TwoFactorSmsSentAt ? Date.now() - new Date(user.TwoFactorSmsSentAt).getTime() : Infinity;
            if (sinceLastSend < SMS_RESEND_SECONDS * 1000) {
                const waitSecs = Math.ceil((SMS_RESEND_SECONDS * 1000 - sinceLastSend) / 1000);
                return resp.status(429).json({ Status: 0, Message: `Please wait ${waitSecs} seconds before requesting another code.` });
            }

            // Store the code before sending so a quick reply can't arrive before it exists.
            const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
            await queryAsync(
                "UPDATE AdminUsers SET TwoFactorSmsCodeHash = ?, TwoFactorSmsExpiresAt = ?, TwoFactorSmsSentAt = ? WHERE AdminID = ?",
                [hashSmsCode(user.AdminID, code), new Date(Date.now() + SMS_CODE_TTL_SECONDS * 1000), new Date(), user.AdminID]
            );

            // The same code goes to every registered number; whoever receives it can enter it.
            const CommonController = require('./CommonController');
            const results = await Promise.all(numbers.map((number) =>
                CommonController.sendSms(number, code).catch((e) => {
                    console.error(`[AdminAuth2FA] SMS to ${maskNumber(number)} failed:`, e.message);
                    return false;
                })
            ));
            const sentTo = numbers.filter((number, i) => results[i]).map(maskNumber);

            if (sentTo.length === 0) {
                await queryAsync("UPDATE AdminUsers SET TwoFactorSmsSentAt = NULL WHERE AdminID = ?", [user.AdminID]);
                await auditLog(user.AdminID, user.EmailID, 'SMS_CODE_FAILED', 'FAILURE', `SMS provider rejected all ${numbers.length} number(s)`, req);
                return resp.status(502).json({ Status: 0, Message: "Could not send the SMS code. Please try again or use your authenticator app." });
            }

            await auditLog(user.AdminID, user.EmailID, 'SMS_CODE_SENT', 'SUCCESS', `Sent to ${sentTo.join(', ')}`, req);

            // Re-issue the pre-auth token so it lives as long as the SMS code does.
            const { iat, exp, ...claims } = decoded;
            const refreshedToken = jwt.sign(claims, process.env.SECRET_KEY, { expiresIn: SMS_CODE_TTL_SECONDS });

            return resp.status(200).json({
                Status: 1,
                Message: `Code sent to ${sentTo.join(' and ')}`,
                twoFactorToken: refreshedToken,
                sentTo,
                resendAfterSeconds: SMS_RESEND_SECONDS
            });
        } catch (err) {
            console.error("Exception in sendSmsCode:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error sending SMS code" });
        }
    },

    // Step 2: Verify the 6-digit TOTP code, SMS code or backup recovery code
    verify2FA: async (req, resp) => {
        try {
            const { twoFactorToken, code, smsCode, recoveryCode } = req.body || {};
            if (!twoFactorToken) {
                return resp.status(400).json({ Status: 0, Message: "Session expired or missing two-factor token. Please log in again." });
            }

            let decoded;
            try {
                decoded = jwt.verify(twoFactorToken, process.env.SECRET_KEY);
            } catch (jwtErr) {
                return resp.status(401).json({ Status: 0, Message: "Two-factor session expired. Please log in again." });
            }

            if (!decoded.is2FAPending || !decoded.AdminID) {
                return resp.status(401).json({ Status: 0, Message: "Invalid two-factor session token" });
            }

            return new Promise((resolve) => {
                pool.getConnection(async (connErr, conn) => {
                    if (connErr) {
                        console.error("DB connection error in verify2FA:", connErr);
                        return resolve(resp.status(500).json({ Status: 0, Message: "Database connection error" }));
                    }

                    const exec = (sql, params = []) => new Promise((res, rej) => {
                        conn.query(sql, params, (err, r) => err ? rej(err) : res(r));
                    });

                    try {
                        await exec("START TRANSACTION");

                        // Row-level lock to serialize concurrent requests and eliminate TOCTOU races
                        const [user] = await exec("SELECT * FROM AdminUsers WHERE AdminID = ? FOR UPDATE", [decoded.AdminID]);
                        if (!user) {
                            await exec("ROLLBACK");
                            conn.release();
                            return resolve(resp.status(404).json({ Status: 0, Message: "Admin user not found" }));
                        }

                        // Check lockout
                        if (user.TwoFactorLockedUntil && new Date(user.TwoFactorLockedUntil) > new Date()) {
                            await exec("ROLLBACK");
                            conn.release();
                            const remainingMins = Math.ceil((new Date(user.TwoFactorLockedUntil) - new Date()) / 60000);
                            return resolve(resp.status(403).json({
                                Status: 0,
                                Message: `Account locked due to failed attempts. Please try again in ${remainingMins} minute(s).`
                            }));
                        }

                        let isVerified = false;
                        let usedRecovery = false;
                        let usedDemoOtp = false;
                        let usedSms = false;
                        let counterTime = 0;
                        const lastUsedStep = toTimeStep(user.TwoFactorLastUsedTimestamp);

                        // Handle backup recovery code
                        if (recoveryCode && String(recoveryCode).trim()) {
                            const candidateCode = String(recoveryCode).trim();
                            let storedHashes = [];
                            try {
                                storedHashes = user.TwoFactorRecoveryCodes ? JSON.parse(user.TwoFactorRecoveryCodes) : [];
                            } catch (e) {
                                storedHashes = [];
                            }

                            // Also check pending recovery hashes if in setup mode
                            if (storedHashes.length === 0 && decoded.pendingRecoveryHashes) {
                                storedHashes = decoded.pendingRecoveryHashes;
                            }

                            const recResult = totp.verifyRecoveryCode(candidateCode, storedHashes);
                            if (recResult.valid) {
                                isVerified = true;
                                usedRecovery = true;
                                // Atomically persist consumed recovery code
                                await exec(
                                    "UPDATE AdminUsers SET TwoFactorRecoveryCodes = ? WHERE AdminID = ?",
                                    [JSON.stringify(recResult.remainingHashes), user.AdminID]
                                );
                                await auditLog(user.AdminID, user.EmailID, 'RECOVERY_CODE_USED', 'SUCCESS', 'Backup recovery code utilized', req);
                            }
                        } else if (smsCode && String(smsCode).trim()) {
                            const smsExpired = !user.TwoFactorSmsExpiresAt || new Date(user.TwoFactorSmsExpiresAt) <= new Date();
                            if (!user.TwoFactorSmsCodeHash || smsExpired) {
                                await exec("ROLLBACK");
                                conn.release();
                                return resolve(resp.status(400).json({ Status: 0, Message: "This SMS code has expired or was already used. Please request a new code." }));
                            }
                            const expected = Buffer.from(user.TwoFactorSmsCodeHash, 'hex');
                            const actual = Buffer.from(hashSmsCode(user.AdminID, String(smsCode).trim()), 'hex');
                            if (expected.length === actual.length && crypto.timingSafeEqual(expected, actual)) {
                                isVerified = true;
                                usedSms = true;
                            }
                        } else if (code) {
                            const candidateCode = String(code).trim();

                            // 1. Check Demo OTP: STRICTLY restricted to development mode with explicit flag
                            if (isDemoOtpEnabled() && decoded.demoOtpHash) {
                                const candidateHash = crypto.createHash('sha256').update(candidateCode).digest('hex');
                                if (candidateHash === decoded.demoOtpHash) {
                                    // Anti-replay: Demo OTP cannot be reused
                                    if (lastUsedStep >= Math.floor(Number(decoded.demoOtpIssuedAt) / 30)) {
                                        await exec("ROLLBACK");
                                        conn.release();
                                        await auditLog(user.AdminID, user.EmailID, 'REPLAY_ATTACK_PREVENTED', 'FAILURE', `Reused Demo OTP issued at ${decoded.demoOtpIssuedAt}`, req);
                                        return resolve(resp.status(400).json({ Status: 0, Message: "This Demo OTP has already been used. Please log in again to generate a new OTP." }));
                                    }
                                    isVerified = true;
                                    usedDemoOtp = true;
                                    counterTime = Math.floor(Date.now() / 30000);
                                }
                            }

                            // 2. Fall back to standard RFC 6238 TOTP verification
                            if (!isVerified) {
                                const activeSecret = user.TwoFactorSecret || decoded.pendingSecret;
                                if (activeSecret) {
                                    const verifyRes = totp.verifyTOTP(candidateCode, activeSecret, { window: 1 });
                                    if (verifyRes.valid) {
                                        // Anti-replay: counter must be strictly newer than last recorded counter
                                        if (verifyRes.counter <= lastUsedStep) {
                                            await exec("ROLLBACK");
                                            conn.release();
                                            await auditLog(user.AdminID, user.EmailID, 'REPLAY_ATTACK_PREVENTED', 'FAILURE', `Reused TOTP counter ${verifyRes.counter}`, req);
                                            return resolve(resp.status(400).json({ Status: 0, Message: "This code has already been used. Please wait for the next code in your authenticator app." }));
                                        }
                                        isVerified = true;
                                        counterTime = verifyRes.counter;
                                    }
                                } else if (!isDemoOtpEnabled()) {
                                    await exec("ROLLBACK");
                                    conn.release();
                                    return resolve(resp.status(400).json({ Status: 0, Message: "2FA secret configuration missing. Please restart login." }));
                                }
                            }
                        } else {
                            await exec("ROLLBACK");
                            conn.release();
                            return resolve(resp.status(400).json({ Status: 0, Message: "Please provide a verification code or recovery code" }));
                        }

                        if (!isVerified) {
                            // Increment failed attempts and trigger lockout if >= 5
                            const newFailedAttempts = (user.TwoFactorFailedAttempts || 0) + 1;
                            let lockUntil = null;
                            if (newFailedAttempts >= 5) {
                                lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
                            }

                            await exec(
                                "UPDATE AdminUsers SET TwoFactorFailedAttempts = ?, TwoFactorLockedUntil = ? WHERE AdminID = ?",
                                [newFailedAttempts, lockUntil, user.AdminID]
                            );

                            await exec("COMMIT");
                            conn.release();

                            await auditLog(user.AdminID, user.EmailID, '2FA_FAILED', 'FAILURE', `Attempt ${newFailedAttempts} failed${lockUntil ? ' - Account locked' : ''}`, req);

                            if (lockUntil) {
                                return resolve(resp.status(403).json({
                                    Status: 0,
                                    Message: "Too many failed verification attempts. Account locked for 15 minutes."
                                }));
                            }

                            const remaining = 5 - newFailedAttempts;
                            return resolve(resp.status(400).json({
                                Status: 0,
                                Message: `Invalid verification code. ${remaining} attempt(s) remaining before temporary lockout.`
                            }));
                        }

                        // Verification succeeded!
                        // SMS and recovery codes say nothing about the authenticator, so they keep the last TOTP step.
                        counterTime = counterTime || lastUsedStep;

                        // If setup was pending, finalize 2FA configuration in DB. Only an authenticator
                        // (or recovery) code proves the pending secret was saved; SMS and demo codes don't.
                        if (!usedSms && !usedDemoOtp && (!user.TwoFactorEnabled || !user.TwoFactorSecret)) {
                            const secretToSave = decoded.pendingSecret || totp.generateSecret();
                            const recoveryHashesToSave = JSON.stringify(decoded.pendingRecoveryHashes || []);
                            await exec(
                                `UPDATE AdminUsers SET 
                                    TwoFactorEnabled = 1, 
                                    TwoFactorSecret = ?, 
                                    TwoFactorRecoveryCodes = ?, 
                                    TwoFactorFailedAttempts = 0, 
                                    TwoFactorLockedUntil = NULL, 
                                    TwoFactorLastUsedTimestamp = ?,
                                    TwoFactorSmsCodeHash = NULL,
                                    TwoFactorSmsExpiresAt = NULL
                                 WHERE AdminID = ?`,
                                [secretToSave, recoveryHashesToSave, counterTime, user.AdminID]
                            );
                        } else {
                            await exec(
                                `UPDATE AdminUsers SET 
                                    TwoFactorFailedAttempts = 0, 
                                    TwoFactorLockedUntil = NULL, 
                                    TwoFactorLastUsedTimestamp = ?,
                                    TwoFactorSmsCodeHash = NULL,
                                    TwoFactorSmsExpiresAt = NULL
                                 WHERE AdminID = ?`,
                                [counterTime, user.AdminID]
                            );
                        }

                        await exec("COMMIT");
                        conn.release();

                        const auditDetail = usedRecovery
                            ? 'Logged in via recovery code'
                            : usedDemoOtp
                            ? 'Logged in via Demo OTP (Development Mode)'
                            : usedSms
                            ? 'SMS code verified'
                            : 'TOTP verified';
                        await auditLog(user.AdminID, user.EmailID, '2FA_SUCCESS', 'SUCCESS', auditDetail, req);

                        // Issue full authenticated token
                        const fullAuthPayload = {
                            AdminID: user.AdminID,
                            Role: user.Role
                        };
                        const authToken = jwt.sign(fullAuthPayload, process.env.SECRET_KEY, { expiresIn: 7200 });

                        const userDetails = {
                            AdminID: user.AdminID,
                            FirstName: user.FirstName,
                            LastName: user.LastName,
                            EmailID: user.EmailID,
                            Role: user.Role
                        };

                        return resolve(resp.status(200).json({
                            Status: 1,
                            Message: "Admin authentication successful",
                            token: authToken,
                            userDetails
                        }));
                    } catch (txErr) {
                        console.error("Exception in verify2FA transaction:", txErr);
                        try { await exec("ROLLBACK"); } catch (rb) {}
                        conn.release();
                        return resolve(resp.status(500).json({ Status: 0, Message: "Internal server error during verification" }));
                    }
                });
            });
        } catch (err) {
            console.error("Exception in verify2FA:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error during verification" });
        }
    },

    // Reset 2FA (Super-admin assisted recovery for another admin)
    reset2FA: async (req, resp) => {
        try {
            const targetAdminId = req.params.AdminID;
            if (!targetAdminId) {
                return resp.status(400).json({ Status: 0, Message: "Target AdminID required" });
            }

            const [targetUser] = await queryAsync("SELECT * FROM AdminUsers WHERE AdminID = ?", [targetAdminId]);
            if (!targetUser) {
                return resp.status(404).json({ Status: 0, Message: "Admin not found" });
            }

            await queryAsync(
                `UPDATE AdminUsers SET 
                    TwoFactorEnabled = 0, 
                    TwoFactorSecret = NULL, 
                    TwoFactorRecoveryCodes = NULL, 
                    TwoFactorFailedAttempts = 0, 
                    TwoFactorLockedUntil = NULL, 
                    TwoFactorLastUsedTimestamp = 0
                 WHERE AdminID = ?`,
                [targetAdminId]
            );

            await auditLog(
                targetAdminId,
                targetUser.EmailID,
                '2FA_RESET_BY_ADMIN',
                'SUCCESS',
                `2FA reset by requesting admin ${req.AdminID}`,
                req
            );

            return resp.status(200).json({
                Status: 1,
                Message: `Two-factor authentication reset successfully for ${targetUser.EmailID}. They will be prompted to re-configure 2FA on their next login.`
            });
        } catch (err) {
            console.error("Exception in reset2FA:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error resetting 2FA" });
        }
    },

    // Get 2FA Status for current logged-in admin
    get2FAStatus: async (req, resp) => {
        try {
            const [user] = await queryAsync("SELECT TwoFactorEnabled, EmailID FROM AdminUsers WHERE AdminID = ?", [req.AdminID]);
            return resp.status(200).json({
                Status: 1,
                TwoFactorEnabled: Boolean(user && user.TwoFactorEnabled),
                EmailID: user ? user.EmailID : ''
            });
        } catch (err) {
            return resp.status(500).json({ Status: 0, Message: "Error fetching 2FA status" });
        }
    }
};

module.exports = AdminAuth2FA;
