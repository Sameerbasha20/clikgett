'use strict';
// Copies every file from the local MinIO bucket to Supabase Storage (same keys).
// Files already in Supabase are skipped, so it is safe to re-run. Run inside the
// backend container (it reaches MinIO there):
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node server/tools/copy_media_to_supabase.js
const Minio = require('minio');

const bucket = process.env.bucketname || process.env.S3_BUCKET || 'clikgett-media';
const endpoint = new URL(process.env.S3_ENDPOINT || 'http://minio:9000');
const minio = new Minio.Client({
    endPoint: endpoint.hostname,
    port: Number(endpoint.port) || 80,
    useSSL: endpoint.protocol === 'https:',
    accessKey: process.env.S3_ACCESS_KEY || process.env.S3AccessKey,
    secretKey: process.env.S3_SECRET_KEY || process.env.S3SecretKey
});

const base = `${String(process.env.SUPABASE_URL || '').replace(/\/$/, '')}/storage/v1`;
const key = process.env.SUPABASE_SERVICE_KEY;
const auth = { Authorization: `Bearer ${key}`, apikey: key };
const objectUrl = (k) => `${base}/object/${bucket}/${k.split('/').map(encodeURIComponent).join('/')}`;
const CONCURRENCY = 6;

const listKeys = () => new Promise((resolve, reject) => {
    const keys = [];
    minio.listObjectsV2(bucket, '', true)
        .on('data', (o) => o.name && keys.push(o.name))
        .on('error', reject)
        .on('end', () => resolve(keys));
});

async function ensureBucket() {
    const res = await fetch(`${base}/bucket`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bucket, name: bucket, public: false })
    });
    if (!res.ok && res.status !== 409 && !(await res.text()).includes('already exists')) {
        throw new Error(`Could not create bucket ${bucket} (${res.status})`);
    }
}

async function copy(k) {
    const head = await fetch(objectUrl(k), { method: 'HEAD', headers: auth });
    if (head.ok) return 'present';
    const stat = await minio.statObject(bucket, k);
    const chunks = [];
    for await (const chunk of await minio.getObject(bucket, k)) chunks.push(chunk);
    const res = await fetch(objectUrl(k), {
        method: 'POST',
        headers: { ...auth, 'Content-Type': (stat.metaData && stat.metaData['content-type']) || 'application/octet-stream', 'x-upsert': 'true' },
        body: Buffer.concat(chunks)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
    return 'copied';
}

(async () => {
    if (!process.env.SUPABASE_URL || !key) {
        console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
        process.exit(1);
    }
    await ensureBucket();
    const keys = await listKeys();
    console.log(`${keys.length} files in MinIO bucket ${bucket}`);
    const counts = { copied: 0, present: 0, failed: 0 };
    let next = 0;
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
        while (next < keys.length) {
            const k = keys[next++];
            try {
                counts[await copy(k)]++;
            } catch (err) {
                counts.failed++;
                console.warn(`failed ${k}: ${err.message}`);
            }
            const done = counts.copied + counts.present + counts.failed;
            if (done % 200 === 0) console.log(`  ${done}/${keys.length}`);
        }
    }));
    console.log(`copied ${counts.copied}, already there ${counts.present}, failed ${counts.failed}`);
    process.exit(counts.failed ? 1 : 0);
})().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
