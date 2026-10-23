'use strict';
// Copies every image the database refers to from the old AWS CloudFront distribution
// into the MinIO bucket, under the same keys (Products/x.png, Categories/y.png, ...).
// Files already in MinIO are skipped, so it is safe to re-run.
//   node server/tools/import_cloudfront_media.js
const pool = require('../utils/db');
const storage = require('../utils/s3');
const { TOKEN } = require('../utils/media');

const CLOUDFRONT = 'https://d3c9kvg5gaqz48.cloudfront.net/';
const CONCURRENCY = 8;

const query = (sql, params = []) => new Promise((resolve, reject) =>
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const usable = (v) => v && !['NA', 'null', 'undefined'].includes(String(v).trim()) && !/^https?:\/\//.test(String(v).trim());

async function collectKeys() {
    const keys = new Set();
    const addColumn = async (sql, folder) => {
        for (const row of await query(sql).catch(() => [])) {
            if (usable(row.v)) keys.add(`${folder}/${String(row.v).trim()}`);
        }
    };
    await addColumn("SELECT ImageUrl AS v FROM Products", 'Products');
    for (const row of await query("SELECT ProductImages AS v FROM Products WHERE ProductImages IS NOT NULL")) {
        let list = [];
        try { list = JSON.parse(row.v); } catch (e) { list = []; }
        for (const name of Array.isArray(list) ? list : []) if (usable(name)) keys.add(`Products/${String(name).trim()}`);
    }
    await addColumn("SELECT ImageUrl AS v FROM Categories", 'Categories');
    await addColumn("SELECT SubCategoryImage AS v FROM SubCategories", 'SubCategories');
    await addColumn("SELECT ImageUrl AS v FROM Banners", 'Banners');
    await addColumn("SELECT BannerImage AS v FROM Banners", 'Banners');
    await addColumn("SELECT ImageUrl AS v FROM HomepageSections", 'Sections');
    await addColumn("SELECT ProfilePic AS v FROM AdminUsers", 'deliveryboys');
    await addColumn("SELECT profilePic AS v FROM Users", 'Users');
    // Order history stores the token form (see remove_aws_media_urls_migration.js).
    for (const row of await query("SELECT DISTINCT ImageUrl AS v FROM OrderItems WHERE ImageUrl LIKE ?", [`${TOKEN}%`])) {
        keys.add(decodeURIComponent(String(row.v).slice(TOKEN.length)));
    }
    return [...keys];
}

async function copy(key) {
    if (await storage.exists(key)) return 'present';
    const url = CLOUDFRONT + key.split('/').map(encodeURIComponent).join('/');
    const res = await fetch(url);
    if (res.status === 403 || res.status === 404) return 'missing';
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = Buffer.from(await res.arrayBuffer());
    await storage.put({ Key: key, Body: body, ContentType: res.headers.get('content-type') || undefined });
    return 'copied';
}

(async () => {
    const keys = await collectKeys();
    console.log(`${keys.length} files referenced by the database`);
    const counts = { copied: 0, present: 0, missing: 0, failed: 0 };
    const missing = [];
    let next = 0;
    const worker = async () => {
        while (next < keys.length) {
            const key = keys[next++];
            try {
                const outcome = await copy(key);
                counts[outcome]++;
                if (outcome === 'missing') missing.push(key);
            } catch (err) {
                counts.failed++;
                console.warn(`failed ${key}: ${err.message}`);
            }
            const done = counts.copied + counts.present + counts.missing + counts.failed;
            if (done % 200 === 0) console.log(`  ${done}/${keys.length}`);
        }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    console.log(`copied ${counts.copied}, already in MinIO ${counts.present}, not on CloudFront ${counts.missing}, failed ${counts.failed}`);
    if (missing.length) console.log(`not on CloudFront (first 20): ${missing.slice(0, 20).join(', ')}`);
    pool.end();
    process.exit(counts.failed ? 1 : 0);
})();
