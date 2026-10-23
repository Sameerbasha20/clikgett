'use strict';
// Rewrites stored CloudFront/S3 image addresses to the media token (utils/media.js), so
// they are served from MinIO through /media. Some rows hold the prefix twice
// (".../Products/https://.../Products/x.png"); only the part after the last host is kept.
// Idempotent.
//   node server/migrations/remove_aws_media_urls_migration.js
const pool = require('../utils/db');
const { TOKEN } = require('../utils/media');

const query = (sql, params = []) => new Promise((resolve, reject) =>
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const HOSTS = ['cloudfront.net/', 'amazonaws.com/'];
const COLUMNS = [
    ['OrderItems', 'ImageUrl'], ['Products', 'ImageUrl'], ['Products', 'ProductImages'], ['Categories', 'ImageUrl'],
    ['SubCategories', 'SubCategoryImage'], ['Banners', 'ImageUrl'], ['Banners', 'BannerImage'], ['HomepageSections', 'ImageUrl'],
    ['Kits', 'ImageUrl'], ['AdminUsers', 'ProfilePic'], ['Users', 'profilePic'], ['notification_media', 'ImageURL']
];

(async () => {
    try {
        for (const [table, column] of COLUMNS) {
            const [exists] = await query(
                'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
                [table, column]);
            if (!exists.n) continue;
            if (column === 'ProductImages') {
                // JSON arrays: strip any AWS host inside each entry, keeping file names.
                const result = await query(
                    `UPDATE \`${table}\` SET \`${column}\` = REGEXP_REPLACE(\`${column}\`, 'https?://[^"/]*(cloudfront\\\\.net|amazonaws\\\\.com)/[A-Za-z]+/', '')
                      WHERE \`${column}\` REGEXP 'cloudfront\\\\.net|amazonaws\\\\.com'`);
                if (result.affectedRows) console.log(`${table}.${column}: ${result.affectedRows} rows cleaned`);
                continue;
            }
            let total = 0;
            for (const host of HOSTS) {
                const result = await query(
                    `UPDATE \`${table}\` SET \`${column}\` = CONCAT(?, SUBSTRING_INDEX(\`${column}\`, ?, -1))
                      WHERE \`${column}\` LIKE ?`, [TOKEN, host, `%${host}%`]);
                total += result.affectedRows;
            }
            if (total) console.log(`${table}.${column}: ${total} rows now use the media token`);
        }
        console.log('AWS media addresses removed');
    } catch (e) {
        console.error('Media URL migration failed:', e.message);
        process.exitCode = 1;
    } finally {
        pool.end();
    }
})();
