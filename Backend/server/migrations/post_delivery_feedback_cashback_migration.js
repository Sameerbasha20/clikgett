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

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

const runMigration = async () => {
    console.log('--- Starting Post-Delivery Feedback & Cashback Migration ---');

    try {
        // 1. Inspect existing columns in Feedback table
        const columns = await queryAsync('SHOW COLUMNS FROM Feedback');
        const colNames = columns.map(c => c.Field);
        console.log('Existing Feedback columns:', colNames);

        // Add AdminReply if not present
        if (!colNames.includes('AdminReply')) {
            console.log('Adding AdminReply column to Feedback...');
            await queryAsync('ALTER TABLE Feedback ADD COLUMN AdminReply TEXT NULL');
        }

        // Add AdminID if not present
        if (!colNames.includes('AdminID')) {
            console.log('Adding AdminID column to Feedback...');
            await queryAsync('ALTER TABLE Feedback ADD COLUMN AdminID INT NULL');
        }

        // Add ReviewedAt if not present
        if (!colNames.includes('ReviewedAt')) {
            console.log('Adding ReviewedAt column to Feedback...');
            await queryAsync('ALTER TABLE Feedback ADD COLUMN ReviewedAt DATETIME NULL');
        }

        // Add ReviewNotes if not present
        if (!colNames.includes('ReviewNotes')) {
            console.log('Adding ReviewNotes column to Feedback...');
            await queryAsync('ALTER TABLE Feedback ADD COLUMN ReviewNotes TEXT NULL');
        }

        // Add RewardStatus if not present
        if (!colNames.includes('RewardStatus')) {
            console.log('Adding RewardStatus column to Feedback...');
            await queryAsync("ALTER TABLE Feedback ADD COLUMN RewardStatus VARCHAR(30) DEFAULT 'pending'");
        }

        // Add RewardAmount if not present
        if (!colNames.includes('RewardAmount')) {
            console.log('Adding RewardAmount column to Feedback...');
            await queryAsync('ALTER TABLE Feedback ADD COLUMN RewardAmount DECIMAL(10,2) DEFAULT 0.00');
        }

        // Add WalletTransactionID if not present
        if (!colNames.includes('WalletTransactionID')) {
            console.log('Adding WalletTransactionID column to Feedback...');
            await queryAsync('ALTER TABLE Feedback ADD COLUMN WalletTransactionID INT NULL');
        }

        // Inspect indexes on Feedback
        const indexes = await queryAsync('SHOW INDEX FROM Feedback');
        const indexNames = indexes.map(i => i.Key_name);

        if (!indexNames.includes('idx_feedback_user_order')) {
            console.log('Adding index idx_feedback_user_order on Feedback(UserID, OrderID)...');
            try {
                await queryAsync('ALTER TABLE Feedback ADD INDEX idx_feedback_user_order (UserID, OrderID)');
            } catch (err) {
                console.warn('Index notice:', err.message);
            }
        }

        if (!indexNames.includes('idx_feedback_reward_status')) {
            console.log('Adding index idx_feedback_reward_status on Feedback(RewardStatus)...');
            try {
                await queryAsync('ALTER TABLE Feedback ADD INDEX idx_feedback_reward_status (RewardStatus)');
            } catch (err) {
                console.warn('Index notice:', err.message);
            }
        }

        // 2. Ensure Settings defaults exist for Feedback Reward
        const rewardAmountSetting = await queryAsync("SELECT * FROM Settings WHERE SettingKey = 'FeedbackRewardAmount'");
        if (!rewardAmountSetting || rewardAmountSetting.length === 0) {
            console.log('Seeding FeedbackRewardAmount setting in Settings table...');
            await queryAsync("INSERT INTO Settings (SettingKey, SettingValue) VALUES ('FeedbackRewardAmount', '20.00')");
        } else {
            console.log('FeedbackRewardAmount setting already present:', rewardAmountSetting[0].SettingValue);
        }

        const rewardEnabledSetting = await queryAsync("SELECT * FROM Settings WHERE SettingKey = 'FeedbackRewardEnabled'");
        if (!rewardEnabledSetting || rewardEnabledSetting.length === 0) {
            console.log('Seeding FeedbackRewardEnabled setting in Settings table...');
            await queryAsync("INSERT INTO Settings (SettingKey, SettingValue) VALUES ('FeedbackRewardEnabled', '1')");
        } else {
            console.log('FeedbackRewardEnabled setting already present:', rewardEnabledSetting[0].SettingValue);
        }

        console.log('✅ Post-Delivery Feedback & Cashback Migration completed successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exitCode = 1;
    } finally {
        pool.end();
    }
};

runMigration();
