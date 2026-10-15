'use strict';
const mysql = require('mysql');
require('dotenv').config();

const pool = require('../utils/db');

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, res) => {
            if (err) return reject(err);
            resolve(res || []);
        });
    });
};

const ReferralRewards = {
    // -------------------------------------------------------------
    // ADMIN CONFIGURATION & AUDIT APIS
    // -------------------------------------------------------------
    getConfig: async (req, resp) => {
        try {
            const [config] = await queryAsync("SELECT * FROM ReferralConfigurations WHERE ConfigID = 1 LIMIT 1");
            const [stats] = await queryAsync(`
                SELECT 
                    COUNT(*) as totalReferrals,
                    SUM(CASE WHEN Status = 'credited' THEN 1 ELSE 0 END) as successfulClaims,
                    SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) as pendingClaims,
                    COALESCE(SUM(CASE WHEN Status = 'credited' THEN ReferrerRewardAmount + ReferredRewardAmount ELSE 0 END), 0) as totalRewardsDistributed
                FROM ReferralClaims
            `);

            return resp.status(200).json({
                Status: 1,
                config: config || {
                    ConfigID: 1,
                    IsEnabled: 1,
                    ReferrerReward: 50.00,
                    ReferredReward: 50.00,
                    TriggerEvent: 'first_order',
                    MinOrderValue: 149.00,
                    MaxReferralsPerUser: 50
                },
                stats: stats || {}
            });
        } catch (err) {
            console.error("Exception in getReferralConfig:", err);
            return resp.status(500).json({ Status: 0, Message: "Error fetching referral configuration" });
        }
    },

    updateConfig: async (req, resp) => {
        try {
            const {
                IsEnabled,
                ReferrerReward,
                ReferredReward,
                TriggerEvent,
                MinOrderValue,
                MaxReferralsPerUser
            } = req.body || {};

            // Validations
            const referrerAmt = parseFloat(ReferrerReward);
            const referredAmt = parseFloat(ReferredReward !== undefined ? ReferredReward : 0);
            const minOrderVal = parseFloat(MinOrderValue !== undefined ? MinOrderValue : 0);
            const maxRefs = parseInt(MaxReferralsPerUser !== undefined ? MaxReferralsPerUser : 50, 10);
            const enabled = IsEnabled === 1 || IsEnabled === true || IsEnabled === '1' ? 1 : 0;
            const trigger = (TriggerEvent || 'first_order').toLowerCase();

            if (isNaN(referrerAmt) || referrerAmt < 0) {
                return resp.status(400).json({ Status: 0, Message: "Referrer reward amount must be a non-negative number" });
            }
            if (isNaN(referredAmt) || referredAmt < 0) {
                return resp.status(400).json({ Status: 0, Message: "Referred user reward amount must be a non-negative number" });
            }
            if (isNaN(minOrderVal) || minOrderVal < 0) {
                return resp.status(400).json({ Status: 0, Message: "Minimum order value must be a non-negative number" });
            }
            if (isNaN(maxRefs) || maxRefs <= 0) {
                return resp.status(400).json({ Status: 0, Message: "Max referrals per user must be a positive integer" });
            }
            if (!['first_order', 'registration'].includes(trigger)) {
                return resp.status(400).json({ Status: 0, Message: "TriggerEvent must be either 'first_order' or 'registration'" });
            }

            // Fetch previous config for audit logging
            const [previousConfig] = await queryAsync("SELECT * FROM ReferralConfigurations WHERE ConfigID = 1");

            // Fetch admin details
            const [adminUser] = await queryAsync("SELECT FirstName, LastName, EmailID FROM AdminUsers WHERE AdminID = ?", [req.AdminID]);
            const adminName = adminUser ? `${adminUser.FirstName || ''} ${adminUser.LastName || ''}`.trim() : 'Admin';

            const newConfig = {
                IsEnabled: enabled,
                ReferrerReward: referrerAmt,
                ReferredReward: referredAmt,
                TriggerEvent: trigger,
                MinOrderValue: minOrderVal,
                MaxReferralsPerUser: maxRefs,
                UpdatedBy: req.AdminID
            };

            await queryAsync(`
                INSERT INTO ReferralConfigurations (ConfigID, IsEnabled, ReferrerReward, ReferredReward, TriggerEvent, MinOrderValue, MaxReferralsPerUser, UpdatedBy)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    IsEnabled = VALUES(IsEnabled),
                    ReferrerReward = VALUES(ReferrerReward),
                    ReferredReward = VALUES(ReferredReward),
                    TriggerEvent = VALUES(TriggerEvent),
                    MinOrderValue = VALUES(MinOrderValue),
                    MaxReferralsPerUser = VALUES(MaxReferralsPerUser),
                    UpdatedBy = VALUES(UpdatedBy),
                    UpdatedAt = NOW()
            `, [enabled, referrerAmt, referredAmt, trigger, minOrderVal, maxRefs, req.AdminID]);

            // Record audit trail
            await queryAsync(`
                INSERT INTO ReferralAuditLogs (AdminID, AdminName, Action, Changes, PreviousConfig, NewConfig, CreatedAt)
                VALUES (?, ?, 'UPDATE_REFERRAL_SETTINGS', ?, ?, ?, NOW())
            `, [
                req.AdminID,
                adminName,
                JSON.stringify({
                    changedFields: Object.keys(newConfig).filter(k => previousConfig && previousConfig[k] !== newConfig[k])
                }),
                JSON.stringify(previousConfig || {}),
                JSON.stringify(newConfig)
            ]);

            return resp.status(200).json({
                Status: 1,
                Message: "Referral program settings updated successfully",
                config: newConfig
            });
        } catch (err) {
            console.error("Exception in updateReferralConfig:", err);
            return resp.status(500).json({ Status: 0, Message: "Error updating referral configuration" });
        }
    },

    getAuditHistory: async (req, resp) => {
        try {
            const logs = await queryAsync(`
                SELECT r.*, a.EmailID as AdminEmail
                FROM ReferralAuditLogs r
                LEFT JOIN AdminUsers a ON r.AdminID = a.AdminID
                ORDER BY r.CreatedAt DESC
                LIMIT 50
            `);
            return resp.status(200).json({ Status: 1, logs });
        } catch (err) {
            console.error("Exception in getReferralAuditHistory:", err);
            return resp.status(500).json({ Status: 0, Message: "Error fetching referral audit history" });
        }
    },

    getClaimsList: async (req, resp) => {
        try {
            const claims = await queryAsync(`
                SELECT 
                    rc.*,
                    uRef.FirstName as ReferrerFirstName, uRef.LastName as ReferrerLastName, uRef.MobileNumber as ReferrerMobile,
                    uNew.FirstName as ReferredFirstName, uNew.LastName as ReferredLastName, uNew.MobileNumber as ReferredMobile,
                    o.GrandTotal as OrderAmount, o.OrderStatus as OrderStatus
                FROM ReferralClaims rc
                LEFT JOIN Users uRef ON rc.ReferrerUserID = uRef.UserID
                LEFT JOIN Users uNew ON rc.ReferredUserID = uNew.UserID
                LEFT JOIN Orders o ON rc.OrderID = o.OrderID
                ORDER BY rc.CreatedAt DESC
                LIMIT 100
            `);
            return resp.status(200).json({ Status: 1, claims });
        } catch (err) {
            console.error("Exception in getReferralClaimsList:", err);
            return resp.status(500).json({ Status: 0, Message: "Error fetching referral claims list" });
        }
    },

    // -------------------------------------------------------------
    // AUTHORITATIVE WALLET REWARD PROCESSING ENGINE
    // -------------------------------------------------------------
    processReward: async ({ referredUserId, triggerEvent, orderId, orderTotal }) => {
        return new Promise((resolve) => {
            pool.getConnection(async (connErr, conn) => {
                if (connErr) {
                    console.error("DB connection error in processReward:", connErr);
                    return resolve({ success: false, reason: "db_connection_error" });
                }

                const exec = (sql, params = []) => new Promise((res, rej) => {
                    conn.query(sql, params, (err, r) => err ? rej(err) : res(r));
                });

                try {
                    // 1. Fetch current referral configuration
                    const [config] = await exec("SELECT * FROM ReferralConfigurations WHERE ConfigID = 1 LIMIT 1");
                    if (!config || !config.IsEnabled) {
                        conn.release();
                        return resolve({ success: false, reason: "referral_program_disabled" });
                    }

                    // 2. Fetch referred customer profile
                    const [referredUser] = await exec(
                        "SELECT UserID, FirstName, LastName, MobileNumber, ReferredBy, WalletAmount FROM Users WHERE UserID = ?",
                        [referredUserId]
                    );

                    if (!referredUser || !referredUser.ReferredBy || referredUser.ReferredBy === 'NA' || !referredUser.ReferredBy.trim()) {
                        conn.release();
                        return resolve({ success: false, reason: "user_not_referred" });
                    }

                    const refCode = referredUser.ReferredBy.trim().toUpperCase();

                    // 3. Resolve Referrer user by ReferralCode
                    const [referrerUser] = await exec(
                        "SELECT UserID, FirstName, LastName, MobileNumber, MyReferralCode, WalletAmount FROM Users WHERE UPPER(MyReferralCode) = ?",
                        [refCode]
                    );

                    if (!referrerUser) {
                        conn.release();
                        return resolve({ success: false, reason: "referrer_not_found" });
                    }

                    // Fraud check: Self-referral prevention
                    if (referrerUser.UserID === referredUser.UserID) {
                        conn.release();
                        return resolve({ success: false, reason: "self_referral_prevented" });
                    }

                    // Fraud check: Max referrals per referrer limit
                    const [countRows] = await exec(
                        "SELECT COUNT(*) as totalCredited FROM ReferralClaims WHERE ReferrerUserID = ? AND Status = 'credited'",
                        [referrerUser.UserID]
                    );
                    if (countRows && countRows.totalCredited >= config.MaxReferralsPerUser) {
                        conn.release();
                        return resolve({ success: false, reason: "referrer_max_limit_reached" });
                    }

                    // Check Trigger Event conditions
                    if (config.TriggerEvent === 'registration') {
                        if (triggerEvent !== 'registration') {
                            conn.release();
                            return resolve({ success: false, reason: "trigger_mismatch" });
                        }
                    } else if (config.TriggerEvent === 'first_order') {
                        if (triggerEvent !== 'first_order') {
                            conn.release();
                            return resolve({ success: false, reason: "trigger_mismatch" });
                        }

                        // Verify minimum order value condition
                        let total = parseFloat(orderTotal);
                        if (isNaN(total) && orderId) {
                            const [orderRow] = await exec("SELECT GrandTotal, SubTotal FROM Orders WHERE OrderID = ?", [orderId]);
                            if (orderRow) {
                                total = parseFloat(orderRow.GrandTotal || orderRow.SubTotal || 0);
                            }
                        }
                        total = isNaN(total) ? 0 : total;
                        if (total < parseFloat(config.MinOrderValue || 0)) {
                            conn.release();
                            return resolve({ success: false, reason: "order_value_below_minimum_threshold" });
                        }

                        // Verify this is indeed the customer's first completed/qualifying order
                        const orderRows = await exec(
                            "SELECT OrderID FROM Orders WHERE UserID = ? AND OrderStatus IN (1, 8, 9) ORDER BY CreatedAt ASC LIMIT 2",
                            [referredUser.UserID]
                        );
                        if (orderRows.length > 1 && orderRows[0].OrderID !== orderId) {
                            conn.release();
                            return resolve({ success: false, reason: "not_first_qualifying_order" });
                        }
                    }

                    // 4. ACID Transaction with FOR UPDATE lock for duplicate-credit idempotency
                    await exec("START TRANSACTION");

                    const [existingClaim] = await exec(
                        "SELECT * FROM ReferralClaims WHERE ReferredUserID = ? FOR UPDATE",
                        [referredUser.UserID]
                    );

                    if (existingClaim && existingClaim.Status === 'credited') {
                        await exec("ROLLBACK");
                        conn.release();
                        return resolve({ success: false, reason: "referral_already_credited" });
                    }

                    const referrerRewardAmount = parseFloat(config.ReferrerReward || 0);
                    const referredRewardAmount = parseFloat(config.ReferredReward || 0);

                    let referrerTxnId = null;
                    let referredTxnId = null;

                    // Credit Referrer Wallet if amount > 0
                    if (referrerRewardAmount > 0) {
                        const refDesc = `Referral bonus for referring ${referredUser.FirstName || 'customer'} (ID: ${referredUser.UserID})`;
                        const refWalletRes = await exec(
                            `INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, IsExpired, CreatedAt)
                             VALUES (?, ?, 1, 2, ?, ?, 0, NOW())`,
                            [referrerUser.UserID, referrerRewardAmount, orderId || 0, refDesc]
                        );
                        referrerTxnId = refWalletRes.insertId;

                        await exec(
                            "UPDATE Users SET WalletAmount = WalletAmount + ? WHERE UserID = ?",
                            [referrerRewardAmount, referrerUser.UserID]
                        );
                    }

                    // Credit Referred Customer Wallet if amount > 0
                    if (referredRewardAmount > 0) {
                        const newDesc = `Welcome bonus for joining with referral code ${refCode}`;
                        const newWalletRes = await exec(
                            `INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, IsExpired, CreatedAt)
                             VALUES (?, ?, 1, 1, ?, ?, 0, NOW())`,
                            [referredUser.UserID, referredRewardAmount, orderId || 0, newDesc]
                        );
                        referredTxnId = newWalletRes.insertId;

                        await exec(
                            "UPDATE Users SET WalletAmount = WalletAmount + ? WHERE UserID = ?",
                            [referredRewardAmount, referredUser.UserID]
                        );
                    }

                    // Record or update ReferralClaims record
                    if (existingClaim) {
                        await exec(
                            `UPDATE ReferralClaims SET 
                                Status = 'credited',
                                TriggerEvent = ?,
                                OrderID = ?,
                                ReferrerRewardAmount = ?,
                                ReferredRewardAmount = ?,
                                ReferrerWalletTxnID = ?,
                                ReferredWalletTxnID = ?,
                                CreditedAt = NOW(),
                                UpdatedAt = NOW()
                             WHERE ClaimID = ?`,
                            [
                                config.TriggerEvent,
                                orderId || null,
                                referrerRewardAmount,
                                referredRewardAmount,
                                referrerTxnId,
                                referredTxnId,
                                existingClaim.ClaimID
                            ]
                        );
                    } else {
                        await exec(
                            `INSERT INTO ReferralClaims 
                                (ReferrerUserID, ReferredUserID, ReferralCode, Status, TriggerEvent, OrderID, ReferrerRewardAmount, ReferredRewardAmount, ReferrerWalletTxnID, ReferredWalletTxnID, CreditedAt, CreatedAt)
                             VALUES (?, ?, ?, 'credited', ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                            [
                                referrerUser.UserID,
                                referredUser.UserID,
                                refCode,
                                config.TriggerEvent,
                                orderId || null,
                                referrerRewardAmount,
                                referredRewardAmount,
                                referrerTxnId,
                                referredTxnId
                            ]
                        );
                    }

                    await exec("COMMIT");
                    conn.release();

                    console.log(`[ReferralEngine] Successfully credited referral reward: Referrer ${referrerUser.UserID} (+₹${referrerRewardAmount}), Referred ${referredUser.UserID} (+₹${referredRewardAmount})`);

                    return resolve({
                        success: true,
                        referrerUserId: referrerUser.UserID,
                        referredUserId: referredUser.UserID,
                        referrerRewardAmount,
                        referredRewardAmount,
                        referrerTxnId,
                        referredTxnId
                    });
                } catch (txErr) {
                    console.error("Transaction error in referral processReward:", txErr);
                    try { await exec("ROLLBACK"); } catch (rbErr) {}
                    conn.release();
                    return resolve({ success: false, reason: "transaction_error", error: txErr.message });
                }
            });
        });
    }
};

module.exports = ReferralRewards;
