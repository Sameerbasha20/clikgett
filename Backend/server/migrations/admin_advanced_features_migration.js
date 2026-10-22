'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 5,
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
});

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
};

const addColumnIfNotExists = async (table, column, definition) => {
    try {
        const checkSql = `SHOW COLUMNS FROM \`${table}\` LIKE ?`;
        const res = await queryAsync(checkSql, [column]);
        if (res.length === 0) {
            console.log(`Adding column ${column} to table ${table}...`);
            await queryAsync(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
            console.log(`Column ${column} added.`);
        } else {
            console.log(`Column ${column} already exists in ${table}.`);
        }
    } catch (e) {
        console.error(`Error checking/adding column ${column} to ${table}:`, e.message);
    }
};

const runMigration = async () => {
    console.log('=== Starting Advanced Features Migration (2FA, Referral, Distance ETA) ===');

    try {
        // 1. AdminUsers 2FA columns
        await addColumnIfNotExists('AdminUsers', 'TwoFactorEnabled', 'TINYINT(1) DEFAULT 0');
        await addColumnIfNotExists('AdminUsers', 'TwoFactorSecret', 'VARCHAR(128) NULL');
        await addColumnIfNotExists('AdminUsers', 'TwoFactorRecoveryCodes', 'TEXT NULL');
        await addColumnIfNotExists('AdminUsers', 'TwoFactorFailedAttempts', 'INT DEFAULT 0');
        await addColumnIfNotExists('AdminUsers', 'TwoFactorLockedUntil', 'DATETIME NULL');
        await addColumnIfNotExists('AdminUsers', 'TwoFactorLastUsedTimestamp', 'BIGINT DEFAULT 0');
        // SMS codes: comma-separated numbers that receive them, and the pending code (HMAC, never the raw code)
        await addColumnIfNotExists('AdminUsers', 'TwoFactorMobileNumbers', 'VARCHAR(255) NULL');
        await addColumnIfNotExists('AdminUsers', 'TwoFactorSmsCodeHash', 'CHAR(64) NULL');
        await addColumnIfNotExists('AdminUsers', 'TwoFactorSmsExpiresAt', 'DATETIME NULL');
        await addColumnIfNotExists('AdminUsers', 'TwoFactorSmsSentAt', 'DATETIME NULL');

        // 2. AdminAuthAuditLogs table
        await queryAsync(`CREATE TABLE IF NOT EXISTS AdminAuthAuditLogs (
            AuditID INT AUTO_INCREMENT PRIMARY KEY,
            AdminID INT NULL,
            EmailID VARCHAR(100) NULL,
            Action VARCHAR(50) NOT NULL,
            IPAddress VARCHAR(45) NULL,
            UserAgent TEXT NULL,
            Status VARCHAR(20) NOT NULL,
            Details TEXT NULL,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_admin (AdminID),
            INDEX idx_action (Action),
            INDEX idx_created (CreatedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
        console.log('AdminAuthAuditLogs table ready');

        // 3. ReferralConfigurations table
        await queryAsync(`CREATE TABLE IF NOT EXISTS ReferralConfigurations (
            ConfigID INT AUTO_INCREMENT PRIMARY KEY,
            IsEnabled TINYINT(1) DEFAULT 1,
            ReferrerReward DECIMAL(10,2) DEFAULT 50.00,
            ReferredReward DECIMAL(10,2) DEFAULT 50.00,
            TriggerEvent VARCHAR(30) DEFAULT 'first_order',
            MinOrderValue DECIMAL(10,2) DEFAULT 149.00,
            MaxReferralsPerUser INT DEFAULT 50,
            UpdatedBy INT NULL,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
        console.log('ReferralConfigurations table ready');

        // Seed initial ReferralConfigurations if empty
        const [refConfigRows] = await queryAsync('SELECT COUNT(*) as count FROM ReferralConfigurations');
        if (refConfigRows.count === 0) {
            await queryAsync(`INSERT INTO ReferralConfigurations 
                (ConfigID, IsEnabled, ReferrerReward, ReferredReward, TriggerEvent, MinOrderValue, MaxReferralsPerUser)
                VALUES (1, 1, 50.00, 50.00, 'first_order', 149.00, 50)`);
            console.log('Default ReferralConfigurations seeded');
        }

        // 4. ReferralAuditLogs table
        await queryAsync(`CREATE TABLE IF NOT EXISTS ReferralAuditLogs (
            AuditID INT AUTO_INCREMENT PRIMARY KEY,
            AdminID INT NULL,
            AdminName VARCHAR(100) NULL,
            Action VARCHAR(50) DEFAULT 'UPDATE_CONFIG',
            Changes JSON NULL,
            PreviousConfig JSON NULL,
            NewConfig JSON NULL,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_admin (AdminID),
            INDEX idx_created (CreatedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
        console.log('ReferralAuditLogs table ready');

        // 5. ReferralClaims table
        await queryAsync(`CREATE TABLE IF NOT EXISTS ReferralClaims (
            ClaimID INT AUTO_INCREMENT PRIMARY KEY,
            ReferrerUserID INT NOT NULL,
            ReferredUserID INT NOT NULL UNIQUE,
            ReferralCode VARCHAR(50) NOT NULL,
            Status VARCHAR(20) DEFAULT 'pending',
            TriggerEvent VARCHAR(30) DEFAULT 'first_order',
            OrderID INT NULL,
            ReferrerRewardAmount DECIMAL(10,2) DEFAULT 0.00,
            ReferredRewardAmount DECIMAL(10,2) DEFAULT 0.00,
            ReferrerWalletTxnID INT NULL,
            ReferredWalletTxnID INT NULL,
            CreditedAt DATETIME NULL,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_referrer (ReferrerUserID),
            INDEX idx_referred (ReferredUserID),
            INDEX idx_status (Status),
            INDEX idx_order (OrderID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
        console.log('ReferralClaims table ready');

        // 6. DeliveryETARules table
        await queryAsync(`CREATE TABLE IF NOT EXISTS DeliveryETARules (
            RuleID INT AUTO_INCREMENT PRIMARY KEY,
            IsEnabled TINYINT(1) DEFAULT 1,
            Band1MaxKm DECIMAL(5,2) DEFAULT 3.00,
            Band1BaseMinutes INT DEFAULT 20,
            Band2MinKm DECIMAL(5,2) DEFAULT 3.00,
            Band2MaxKm DECIMAL(5,2) DEFAULT 5.00,
            Band2BaseMinutes INT DEFAULT 25,
            Band3MinKm DECIMAL(5,2) DEFAULT 5.00,
            Band3BaseMinutes INT DEFAULT 30,
            DefaultBaseMinutes INT DEFAULT 25,
            UpdatedBy INT NULL,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
        console.log('DeliveryETARules table ready');

        // Seed initial DeliveryETARules if empty
        const [etaRuleRows] = await queryAsync('SELECT COUNT(*) as count FROM DeliveryETARules');
        if (etaRuleRows.count === 0) {
            await queryAsync(`INSERT INTO DeliveryETARules 
                (RuleID, IsEnabled, Band1MaxKm, Band1BaseMinutes, Band2MinKm, Band2MaxKm, Band2BaseMinutes, Band3MinKm, Band3BaseMinutes, DefaultBaseMinutes)
                VALUES (1, 1, 3.00, 20, 3.00, 5.00, 25, 5.00, 30, 25)`);
            console.log('Default DeliveryETARules seeded');
        }

        // 7. Orders distance ETA metadata columns
        await addColumnIfNotExists('Orders', 'BaseETAMinutes', 'INT DEFAULT 25');
        await addColumnIfNotExists('Orders', 'DistanceETABand', 'VARCHAR(50) NULL');
        await addColumnIfNotExists('Orders', 'ETACalculationDetails', 'JSON NULL');

        console.log('=== Migration successfully completed ===');
    } catch (e) {
        console.error('Migration failed with error:', e);
    } finally {
        pool.end();
    }
};

runMigration();
