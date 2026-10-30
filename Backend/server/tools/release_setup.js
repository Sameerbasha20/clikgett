'use strict';
// Brings the store setup made in the test admin (Render/Aiven) into the live database for
// the release, and the data steps the new code needs. Customers, orders, wallets, stock,
// product on/off and opening hours are never touched: live is the truth for those.
//
//   node server/tools/release_setup.js export setup.json   (connected to Aiven)
//   node server/tools/release_setup.js apply setup.json    (target: print what would change)
//   node server/tools/release_setup.js apply setup.json --apply
//
// What it copies (rows are only added; existing ids are never overwritten):
//   - home screen: HomepageSections, HomeSectionCategories
//   - SubCategories missing on the target
//   - Settings keys missing on the target (by key; never OrderTimesStoredUtc, which the
//     one-off timestamps_utc_migration writes after converting order times)
//   - DeliveryETARules row values, UnlockDealsThreshold
// Deals (buy_more_config, product_unlocks, product_restrictions) are emptied instead: the
// launch starts with none and the admin adds them.
// Before the data it widens a few live columns the new code needs wider (see WIDEN).
// And one data step: the old shop switch (ShopStatus 0 = closed) becomes StoreMode CLOSED,
// so the new code does not open a store the old code keeps closed.
const fs = require('fs');
const path = require('path');
const db = require(path.join(__dirname, '..', 'utils', 'db'));

const q = (sql, params = []) => new Promise((resolve, reject) =>
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

// Live columns too narrow for what the new code writes. Widening keeps the old code working.
const WIDEN = [
    // scrypt hashes are ~160 characters; a 45-character column would cut them and lock admins out
    ['AdminUsers', 'Password', 'varchar(255)', 'VARCHAR(255) DEFAULT NULL'],
    // FAQs, tip presets and other JSON settings
    ['Settings', 'SettingValue', 'text', 'TEXT NOT NULL'],
    ['Categories', 'ImageUrl', 'varchar(255)', 'VARCHAR(255) DEFAULT NULL'],
    ['AdminShopToggleSettings', 'CashbackMode', "enum('automatic','manual','disabled')",
        "ENUM('automatic','manual','disabled') DEFAULT 'automatic'"]
];

const ADD_ROWS = ['HomepageSections', 'HomeSectionCategories', 'SubCategories'];
// Deals start empty at launch (client's decision): the admin adds products and prices.
// Rows already in these tables were made while testing; the old app never used them.
const START_EMPTY = ['buy_more_config', 'product_unlocks', 'product_restrictions'];
const NEVER_COPY_SETTINGS = ['OrderTimesStoredUtc'];

async function primaryKey(table) {
    const rows = await q("SELECT COLUMN_NAME c FROM information_schema.KEY_COLUMN_USAGE " +
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY' LIMIT 1", [table]);
    return rows[0].c;
}

async function columns(table) {
    const rows = await q("SELECT COLUMN_NAME c FROM information_schema.COLUMNS " +
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", [table]);
    return new Set(rows.map((r) => r.c));
}

// Dates come back as the stored text (not Date objects), so they insert unchanged.
const DATE_TYPES = new Set(['DATE', 'DATETIME', 'TIMESTAMP']);
const readAll = (table) => new Promise((resolve, reject) => db.query({
    sql: `SELECT * FROM \`${table}\``,
    typeCast: (field, next) => (DATE_TYPES.has(field.type) ? field.string() : next())
}, (err, rows) => (err ? reject(err) : resolve(rows))));

async function exportSetup(file) {
    const out = { tables: {} };
    for (const t of ADD_ROWS) out.tables[t] = { key: await primaryKey(t), rows: await readAll(t) };
    out.settings = await q('SELECT SettingKey, SettingValue FROM Settings');
    out.eta = await readAll('DeliveryETARules');
    const [shop] = await q('SELECT UnlockDealsThreshold FROM AdminShopToggleSettings LIMIT 1');
    out.unlockDealsThreshold = shop ? shop.UnlockDealsThreshold : null;
    fs.writeFileSync(file, JSON.stringify(out));
    console.log(`Exported to ${file}`);
}

async function applySetup(file, apply) {
    const src = JSON.parse(fs.readFileSync(file, 'utf8'));

    // Schema widenings first: they cannot be part of the data transaction.
    const widen = [];
    for (const [table, column, wanted, definition] of WIDEN) {
        const [col] = await q("SELECT COLUMN_TYPE t FROM information_schema.COLUMNS " +
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", [table, column]);
        if (col && col.t.toLowerCase() !== wanted) {
            widen.push([`${table}.${column}: ${col.t} -> ${wanted}`,
                `ALTER TABLE \`${table}\` MODIFY \`${column}\` ${definition}`]);
        }
    }
    console.log(`${widen.length} column widenings:`);
    widen.forEach(([d]) => console.log(`  ${d}`));
    if (apply) {
        for (const [, sql] of widen) await q(sql);
    }

    const steps = []; // [description, sql, params]
    const productIds = new Set((await q('SELECT ProductID FROM Products')).map((r) => String(r.ProductID)));
    const categoryIds = new Set((await q('SELECT CategoryID FROM Categories')).map((r) => String(r.CategoryID)));
    const sectionIds = new Set(src.tables.HomepageSections.rows.map((r) => String(r.HomeSectionID)));

    for (const t of ADD_ROWS) {
        const { key, rows } = src.tables[t];
        const cols = await columns(t);
        const have = new Set((await q(`SELECT \`${key}\` k FROM \`${t}\``)).map((r) => String(r.k)));
        for (const row of rows) {
            if (have.has(String(row[key]))) continue;
            // Only rows that point at things the target has.
            if (row.ProductID != null && !productIds.has(String(row.ProductID))) continue;
            if (t === 'HomeSectionCategories' && (!sectionIds.has(String(row.HomeSectionID)) ||
                !categoryIds.has(String(row.CategoryID)))) continue;
            if (t === 'SubCategories' && !categoryIds.has(String(row.CategoryID))) continue;
            const data = Object.fromEntries(Object.entries(row).filter(([c]) => cols.has(c)));
            steps.push([`${t} #${row[key]}`, `INSERT INTO \`${t}\` SET ?`, [data]]);
        }
    }

    const haveKeys = new Set((await q('SELECT SettingKey FROM Settings')).map((r) => r.SettingKey));
    for (const s of src.settings) {
        if (haveKeys.has(s.SettingKey) || NEVER_COPY_SETTINGS.includes(s.SettingKey)) continue;
        steps.push([`Settings ${s.SettingKey}`, 'INSERT INTO Settings (SettingKey, SettingValue) VALUES (?, ?)',
            [s.SettingKey, s.SettingValue]]);
    }

    const etaCols = await columns('DeliveryETARules');
    for (const rule of src.eta) {
        const data = Object.fromEntries(Object.entries(rule)
            .filter(([c]) => etaCols.has(c) && !['RuleID', 'CreatedAt', 'UpdatedAt'].includes(c)));
        steps.push([`DeliveryETARules #${rule.RuleID}`, 'UPDATE DeliveryETARules SET ? WHERE RuleID = ?', [data, rule.RuleID]]);
    }

    for (const t of START_EMPTY) {
        const [{ n }] = await q(`SELECT COUNT(*) n FROM \`${t}\``);
        if (n) steps.push([`${t}: remove ${n} test rows`, `DELETE FROM \`${t}\``, []]);
    }

    if (src.unlockDealsThreshold != null) {
        steps.push([`UnlockDealsThreshold ${src.unlockDealsThreshold}`,
            'UPDATE AdminShopToggleSettings SET UnlockDealsThreshold = ?', [src.unlockDealsThreshold]]);
    }

    steps.push(['StoreMode CLOSED where the old shop switch is off',
        "UPDATE AdminShopToggleSettings SET StoreMode = 'CLOSED' WHERE ShopStatus = 0 AND StoreMode <> 'CLOSED'", []]);

    console.log(`${steps.length} steps:`);
    steps.forEach(([d]) => console.log(`  ${d}`));
    if (!apply) return;

    const conn = await new Promise((res, rej) => db.getConnection((e, c) => (e ? rej(e) : res(c))));
    const run = (sql, params) => new Promise((res, rej) => conn.query(sql, params, (e, r) => (e ? rej(e) : res(r))));
    try {
        await run('START TRANSACTION');
        for (const [d, sql, params] of steps) {
            try {
                await run(sql, params);
            } catch (err) {
                throw new Error(`${d}: ${err.message}`);
            }
        }
        await run('COMMIT');
        console.log(`Applied ${steps.length} steps.`);
    } catch (err) {
        await run('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        conn.release();
    }
}

(async () => {
    const [mode, file] = process.argv.slice(2);
    try {
        if (mode === 'export' && file) await exportSetup(file);
        else if (mode === 'apply' && file) await applySetup(file, process.argv.includes('--apply'));
        else {
            console.log('Usage: release_setup.js export <file> | apply <file> [--apply]');
            process.exitCode = 2;
        }
    } catch (err) {
        console.error(err.message);
        process.exitCode = 1;
    } finally {
        db.end();
    }
})();
