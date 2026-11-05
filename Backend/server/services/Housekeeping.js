// Daily clean-up: customer notifications are kept for 90 days once read and 180 days
// unread (the table grows by every order update and offer push). Deletes in small batches
// so the table is never locked for long. Started from server.js unless BACKGROUND_JOBS=off.
const pool = require('../utils/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const BATCH = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

async function pruneNotifications() {
    let removed = 0;
    for (const [days, readOnly] of [[90, true], [180, false]]) {
        for (let i = 0; i < 200; i++) {
            const r = await query(
                `DELETE FROM UserNotifications WHERE CreatedAt < NOW() - INTERVAL ? DAY ${readOnly ? 'AND IsRead = 1' : ''} LIMIT ${BATCH}`,
                [days]);
            removed += r.affectedRows;
            if (r.affectedRows < BATCH) break;
        }
    }
    if (removed) console.warn(`[Housekeeping] removed ${removed} old notification(s)`);
    return removed;
}

function start() {
    const runOnce = () => pruneNotifications().catch((e) => console.error('[Housekeeping] failed:', e.message));
    setTimeout(runOnce, 5 * 60 * 1000); // a few minutes after start, then daily
    setInterval(runOnce, DAY_MS).unref();
}

module.exports = { start, pruneNotifications };
