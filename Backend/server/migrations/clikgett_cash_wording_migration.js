// The wallet is called ClikGett Cash everywhere customers read it, including the FAQs,
// which are stored as data. Safe to re-run (runs on every deploy via run_on_start.js).
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    const result = await query(
        `UPDATE Settings
            SET SettingValue = REPLACE(REPLACE(REPLACE(REPLACE(SettingValue,
                'wallet money', 'ClikGett Cash'), 'Wallet money', 'ClikGett Cash'), 'wallet', 'ClikGett Cash'), 'Wallet', 'ClikGett Cash')
          WHERE SettingKey = 'FAQs' AND SettingValue LIKE '%wallet%'`);
    if (result.affectedRows) console.log('ClikGett Cash: FAQs updated');
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('ClikGett Cash wording migration failed:', err.message);
        process.exit(1);
    });
}
