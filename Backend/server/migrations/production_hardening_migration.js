'use strict';
// Production hardening, idempotent:
// - LoginOtps: customer and rider login codes with expiry, attempt limits and lockout
//   (services/LoginOtp.js). Replaces the plain Users.OTP / AdminUsers.OTP columns,
//   which are no longer read.
// - OrderPayments capture/auto-refund columns for services/PaymentRecovery.js.
//   node server/migrations/production_hardening_migration.js
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) =>
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const addColumnIfNotExists = async (table, column, definition) => {
    const [row] = await query(
        'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [table, column]);
    if (row.n === 0) {
        await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`Added ${table}.${column}`);
    }
};

(async () => {
    try {
        await addColumnIfNotExists('OrderPayments', 'CapturedAt', 'DATETIME NULL');
        await addColumnIfNotExists('OrderPayments', 'AutoRefundedAt', 'DATETIME NULL');
        await addColumnIfNotExists('OrderPayments', 'AutoRefundID', 'VARCHAR(64) NULL');
        await addColumnIfNotExists('OrderPayments', 'AutoRefundError', 'VARCHAR(255) NULL');
        console.log('OrderPayments auto-refund columns ready');

        await query(`CREATE TABLE IF NOT EXISTS LoginOtps (
            Audience VARCHAR(20) NOT NULL,
            MobileNumber VARCHAR(20) NOT NULL,
            CodeHash CHAR(64) NULL,
            ExpiresAt DATETIME NULL,
            FailedAttempts INT NOT NULL DEFAULT 0,
            SendCount INT NOT NULL DEFAULT 0,
            SendWindowStart DATETIME NULL,
            LastSentAt DATETIME NULL,
            RecentFailures INT NOT NULL DEFAULT 0,
            FailureWindowStart DATETIME NULL,
            LockedUntil DATETIME NULL,
            PRIMARY KEY (Audience, MobileNumber)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        console.log('LoginOtps table ready');

        // Old plain-text codes would still be readable in the database; clear them.
        const users = await query("UPDATE Users SET OTP = NULL WHERE OTP IS NOT NULL");
        const riders = await query("UPDATE AdminUsers SET OTP = NULL WHERE OTP IS NOT NULL");
        console.log(`Cleared old plain-text codes: ${users.affectedRows} customers, ${riders.affectedRows} riders`);
    } catch (e) {
        console.error('Login security migration failed:', e.message);
        process.exitCode = 1;
    } finally {
        pool.end();
    }
})();
