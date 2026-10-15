const pool = require('../server/utils/db');

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

async function inspect() {
    console.log("=== INSPECTING DB TABLES ===");
    try {
        console.log("DESCRIBE Carts:", await query("DESCRIBE Carts"));
        console.log("DESCRIBE CartItems:", await query("DESCRIBE CartItems"));
        console.log("DESCRIBE AbandonedCartLogs:", await query("DESCRIBE AbandonedCartLogs"));
        console.log("DESCRIBE UserNotifications:", await query("DESCRIBE UserNotifications"));
    } catch (e) {
        console.error("Inspect error:", e);
    } finally {
        pool.end();
    }
}

inspect();
