// Refresh tokens for the customer and rider apps (utils/authTokens.js): short login
// tokens are renewed with these instead of lasting a year. Only a SHA-256 hash of
// each refresh token is stored. Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    await query(`CREATE TABLE IF NOT EXISTS AuthRefreshTokens (
        TokenID BIGINT AUTO_INCREMENT PRIMARY KEY,
        SubjectType ENUM('USER', 'RIDER') NOT NULL,
        SubjectID BIGINT NOT NULL,
        TokenHash CHAR(64) NOT NULL,
        FamilyID CHAR(32) NOT NULL,
        ExpiresAt DATETIME NOT NULL,
        RevokedAt DATETIME NULL,
        RevokeReason VARCHAR(40) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_refresh_hash (TokenHash),
        KEY idx_refresh_family (FamilyID),
        KEY idx_refresh_subject (SubjectType, SubjectID)
    )`);
    console.log('Auth refresh tokens migration complete');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Auth refresh tokens migration failed:', err.message);
        process.exit(1);
    });
}
