'use strict';
// The tests write and delete data, so they only run against a local database, or against
// a restored copy of production used for a release rehearsal. A copy is allowed only when
// its host is named exactly in TEST_REHEARSAL_DB_HOST and that name contains "rehearsal",
// so the live database can never be unlocked by mistake.
module.exports = function assertTestDatabase() {
    const dbHost = String(process.env.DB_HOST || process.env.HOST || '').replace(/"/g, '');
    const legacyHost = String(process.env.HOST || '').replace(/"/g, '');
    const local = /^(127\.0\.0\.1|localhost|mysql)$/.test(dbHost);
    const rehearsal = process.env.TEST_REHEARSAL_DB_HOST;
    const isRehearsal = Boolean(rehearsal) && /rehearsal/i.test(rehearsal) && dbHost === rehearsal &&
        // Some tests still connect with the legacy HOST variable.
        (!legacyHost || legacyHost === rehearsal || /^(127\.0\.0\.1|localhost|mysql)$/.test(legacyHost));
    if (!local && !isRehearsal) {
        console.error(`Refusing to run: DB host "${dbHost}" is not local or the named rehearsal copy.`);
        process.exit(1);
    }
};
