// One-time: put "Snacks & Drinks" third on the home page (after the banners and
// Shop by Category). A marker in Settings makes it run once per database, so later
// reordering in admin > Home Sections is never undone.
const pool = require('../utils/db');

const MARKER = 'home_order_snacks_third_v1';
const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function run() {
    const [done] = await query('SELECT ID FROM Settings WHERE SettingKey = ?', [MARKER]);
    if (done) return;
    const sections = await query('SELECT HomeSectionID, SystemKey, Name, Status FROM HomepageSections ORDER BY DisplayOrder ASC, HomeSectionID ASC');
    const snacks = sections.find((s) => s.SystemKey === 'snacks_drinks') || sections.find((s) => /snack/i.test(s.Name || ''));
    if (snacks) {
        const rest = sections.filter((s) => s.HomeSectionID !== snacks.HomeSectionID);
        // Third among the sections customers actually see (hidden ones don't count).
        let seen = 0;
        let at = rest.length;
        for (let i = 0; i < rest.length; i++) {
            if (Number(rest[i].Status) === 1) seen++;
            if (seen === 2) { at = i + 1; break; }
        }
        rest.splice(at, 0, snacks);
        for (let i = 0; i < rest.length; i++) {
            await query('UPDATE HomepageSections SET DisplayOrder = ? WHERE HomeSectionID = ?', [i + 1, rest[i].HomeSectionID]);
        }
        console.log('Home sections: Snacks & Drinks moved to third');
    }
    await query('INSERT INTO Settings (SettingKey, SettingValue, Status) VALUES (?, ?, 0)', [MARKER, new Date().toISOString()]);
}

module.exports = { run };

if (require.main === module) {
    run().then(() => process.exit(0)).catch((err) => {
        console.error('Home snacks-third migration failed:', err.message);
        process.exit(1);
    });
}
