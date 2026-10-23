'use strict';
// Order lifecycle times (picked up, arrived, delivered, cancelled) used to be written
// as IST wall-clock values while every other timestamp (CreatedAt, NOW()) is UTC.
// They are now written in UTC (services/OrderLifecycle.js); this shifts the old rows
// back by 5:30 once. A Settings marker stops it from shifting twice.
//   node server/migrations/timestamps_utc_migration.js
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) =>
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const MARKER = 'OrderTimesStoredUtc';
const COLUMNS = ['PickedUpAt', 'OrderArrivedDateTime', 'deliveredDateTime', 'Delivered_Cancelled_datetime'];

(async () => {
    try {
        const done = await query('SELECT SettingValue FROM Settings WHERE SettingKey = ?', [MARKER]);
        if (done.length) {
            console.log('Order times are already stored in UTC; nothing to do.');
            return;
        }
        const existing = (await query(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Orders' AND COLUMN_NAME IN (?)",
            [COLUMNS])).map((c) => c.COLUMN_NAME);
        const sets = existing.map((c) => `\`${c}\` = IF(\`${c}\` IS NULL, NULL, \`${c}\` - INTERVAL 330 MINUTE)`).join(', ');
        const conn = await new Promise((res, rej) => pool.getConnection((e, c) => (e ? rej(e) : res(c))));
        const run = (sql, params = []) => new Promise((res, rej) => conn.query(sql, params, (e, r) => (e ? rej(e) : res(r))));
        try {
            await run('START TRANSACTION');
            const result = await run(`UPDATE Orders SET ${sets} WHERE ${existing.map((c) => `\`${c}\` IS NOT NULL`).join(' OR ')}`);
            await run('INSERT INTO Settings (SettingKey, SettingValue) VALUES (?, ?)', [MARKER, new Date().toISOString()]);
            await run('COMMIT');
            console.log(`Shifted ${existing.join(', ')} to UTC on ${result.affectedRows} orders`);
        } catch (e) {
            await run('ROLLBACK').catch(() => {});
            throw e;
        } finally {
            conn.release();
        }
    } catch (e) {
        console.error('Timestamp migration failed:', e.message);
        process.exitCode = 1;
    } finally {
        pool.end();
    }
})();
