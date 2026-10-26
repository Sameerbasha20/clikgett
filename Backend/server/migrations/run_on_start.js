// Runs before the server on every container start (Dockerfile CMD), so each deploy
// brings the database up to date. If a migration fails the server does not start and
// Render keeps the previous deploy live.
//
// Only add migrations that are safe to run again and again (CREATE TABLE IF NOT EXISTS,
// "insert if missing"). One-off data changes (e.g. timestamps_utc_migration.js) must
// stay manual.
const MIGRATIONS = [
    require('./print_store_migration'),
];

(async () => {
    for (const migration of MIGRATIONS) {
        await migration.run();
    }
    console.log(`[migrations] ${MIGRATIONS.length} up to date`);
    process.exit(0);
})().catch((err) => {
    console.error(`[migrations] failed, not starting the server: ${err.code || ''} ${err.message}`);
    process.exit(1);
});
