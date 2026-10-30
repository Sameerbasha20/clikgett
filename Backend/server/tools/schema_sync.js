'use strict';
// Additive schema sync, used to bring an older database (the live RDS) up to the schema
// the current code runs on (the local Docker MySQL, after all migrations).
//
//   node server/tools/schema_sync.js export schema.json   (run against the reference DB)
//   node server/tools/schema_sync.js diff schema.json     (target DB: print the SQL only)
//   node server/tools/schema_sync.js diff schema.json --apply
//
// It only ever adds: missing tables (reference CREATE TABLE), missing columns and missing
// indexes. It never drops or changes anything. Columns whose definition differs, and
// foreign keys, are listed for a person to review. Connection settings come from .env
// (utils/db.js).
const fs = require('fs');
const path = require('path');
const db = require(path.join(__dirname, '..', 'utils', 'db'));

const q = (sql, params = []) => new Promise((resolve, reject) =>
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

// Column, index and constraint lines of a SHOW CREATE TABLE statement.
function parseCreate(sql) {
    const columns = {};
    const order = [];
    const indexes = {};
    const foreignKeys = [];
    for (const raw of sql.split('\n').slice(1)) {
        const line = raw.trim().replace(/,$/, '');
        let m;
        if ((m = line.match(/^`([^`]+)`\s+(.*)$/))) {
            columns[m[1]] = m[2];
            order.push(m[1]);
        } else if ((m = line.match(/^(UNIQUE KEY|KEY|FULLTEXT KEY|SPATIAL KEY)\s+`([^`]+)`\s+(.*)$/))) {
            indexes[m[2]] = `${m[1]} \`${m[2]}\` ${m[3]}`;
        } else if (/^CONSTRAINT\s/.test(line) && /FOREIGN KEY/.test(line)) {
            foreignKeys.push(line);
        }
    }
    return { columns, order, indexes, foreignKeys };
}

async function readSchema() {
    const tables = await q("SELECT TABLE_NAME AS name FROM information_schema.TABLES " +
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
    const out = {};
    for (const { name } of tables) {
        const [row] = await q(`SHOW CREATE TABLE \`${name}\``);
        const create = row['Create Table'].replace(/ AUTO_INCREMENT=\d+/, '');
        out[name] = { create, ...parseCreate(create) };
    }
    return out;
}

// Definitions compare equal when they differ only in display details MySQL adds itself.
const norm = (def) => def.replace(/\s+COMMENT\s+'.*'$/, '').replace(/\bint\(\d+\)/g, 'int')
    .replace(/ COLLATE \w+/g, '').replace(/ CHARACTER SET \w+/g, '').trim();

async function diff(refFile, apply) {
    const ref = JSON.parse(fs.readFileSync(refFile, 'utf8'));
    const cur = await readSchema();
    const statements = [];
    const review = [];

    for (const [name, table] of Object.entries(ref)) {
        const have = cur[name];
        if (!have) {
            // Foreign keys are left out so tables can be created in any order.
            const create = table.create
                .split('\n').filter((l) => !/^\s*CONSTRAINT\s.*FOREIGN KEY/.test(l)).join('\n')
                .replace(/,\n\)/, '\n)')
                .replace(/^CREATE TABLE/, 'CREATE TABLE IF NOT EXISTS');
            statements.push(create + ';');
            for (const fk of table.foreignKeys) review.push(`${name}: foreign key not created: ${fk}`);
            continue;
        }
        table.order.forEach((col, i) => {
            if (!have.columns[col]) {
                // The previous column exists or was added by an earlier statement.
                const after = i === 0 ? ' FIRST' : ` AFTER \`${table.order[i - 1]}\``;
                statements.push(`ALTER TABLE \`${name}\` ADD COLUMN \`${col}\` ${table.columns[col]}${after};`);
            } else if (norm(have.columns[col]) !== norm(table.columns[col])) {
                review.push(`${name}.${col}: live "${have.columns[col]}" vs code "${table.columns[col]}"`);
            }
        });
        for (const [idx, def] of Object.entries(table.indexes)) {
            if (!have.indexes[idx]) statements.push(`ALTER TABLE \`${name}\` ADD ${def};`);
        }
        for (const fk of table.foreignKeys) {
            if (!have.foreignKeys.includes(fk)) review.push(`${name}: foreign key missing: ${fk}`);
        }
    }
    const extra = Object.keys(cur).filter((t) => !ref[t]);

    console.log(`-- ${statements.length} additive statements`);
    statements.forEach((s) => console.log(s));
    console.log(`\n-- ${review.length} items to review (not changed):`);
    review.forEach((r) => console.log(`--   ${r}`));
    if (extra.length) console.log(`\n-- Tables only on this database (kept): ${extra.join(', ')}`);

    if (apply) {
        for (const s of statements) {
            await q(s);
        }
        console.log(`\n-- Applied ${statements.length} statements.`);
    }
}

(async () => {
    const [mode, file] = process.argv.slice(2);
    try {
        if (mode === 'export' && file) {
            fs.writeFileSync(file, JSON.stringify(await readSchema(), null, 1));
            console.log(`Schema written to ${file}`);
        } else if (mode === 'diff' && file) {
            await diff(file, process.argv.includes('--apply'));
        } else {
            console.log('Usage: schema_sync.js export <file> | diff <file> [--apply]');
            process.exitCode = 2;
        }
    } catch (err) {
        console.error(err.message);
        process.exitCode = 1;
    } finally {
        db.end();
    }
})();
