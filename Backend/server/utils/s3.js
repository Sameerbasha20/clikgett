const Minio = require('minio');
const { PassThrough, Readable } = require('stream');
const media = require('./media');
require('dotenv').config();

// All files live in one bucket and are served to apps and the admin by the backend at
// /media (see utils/media.js). Two places can hold the bucket:
//   - MinIO from docker-compose (S3_ENDPOINT, e.g. http://minio:9000), for local work;
//   - Supabase Storage (SUPABASE_URL + SUPABASE_SERVICE_KEY), used when those are set.
// The controllers were written against the aws-sdk v2 S3 client, so this keeps its call
// shapes: s3.upload(params, cb), s3.upload(params).promise(), s3.putObject(...).promise(),
// s3.getObject(params).createReadStream(). Bucket in params is ignored: there is one bucket.
const bucket = process.env.bucketname || process.env.S3_BUCKET || 'clikgett-media';

const toBuffer = async (body) => {
    if (Buffer.isBuffer(body)) return body;
    if (body && typeof body.pipe === 'function') {
        const chunks = [];
        for await (const chunk of body) chunks.push(chunk);
        return Buffer.concat(chunks);
    }
    return Buffer.from(body === undefined || body === null ? '' : body);
};

const notFound = () => Object.assign(new Error('Not found'), { code: 'NotFound' });

function minioStore() {
    const endpoint = new URL(process.env.S3_ENDPOINT || 'http://minio:9000');
    const client = new Minio.Client({
        endPoint: endpoint.hostname,
        port: Number(endpoint.port) || (endpoint.protocol === 'https:' ? 443 : 80),
        useSSL: endpoint.protocol === 'https:',
        accessKey: process.env.S3_ACCESS_KEY || process.env.S3AccessKey,
        secretKey: process.env.S3_SECRET_KEY || process.env.S3SecretKey,
        // Cloudflare R2 uses "auto"; MinIO ignores it.
        ...(process.env.S3_REGION ? { region: process.env.S3_REGION } : {})
    });
    return {
        write: async (key, body, contentType) => {
            const buffer = await toBuffer(body);
            await client.putObject(bucket, key, buffer, buffer.length, contentType ? { 'Content-Type': contentType } : {});
        },
        stat: async (key) => {
            const info = await client.statObject(bucket, key);
            return { size: info.size, contentType: info.metaData && info.metaData['content-type'] };
        },
        stream: (key) => client.getObject(bucket, key)
    };
}

// Supabase Storage REST API with the service-role key (server-side only).
function supabaseStore() {
    const base = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object`;
    const key = process.env.SUPABASE_SERVICE_KEY;
    const auth = { Authorization: `Bearer ${key}`, apikey: key };
    const objectUrl = (k) => `${base}/${bucket}/${String(k).split('/').map(encodeURIComponent).join('/')}`;
    return {
        write: async (k, body, contentType) => {
            const res = await fetch(objectUrl(k), {
                method: 'POST',
                headers: { ...auth, 'Content-Type': contentType || 'application/octet-stream', 'x-upsert': 'true' },
                body: await toBuffer(body)
            });
            if (!res.ok) throw new Error(`Supabase upload failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
        },
        stat: async (k) => {
            const res = await fetch(objectUrl(k), { method: 'HEAD', headers: auth });
            if (res.status === 400 || res.status === 404) throw notFound();
            if (!res.ok) throw new Error(`Supabase stat failed (${res.status})`);
            return { size: parseInt(res.headers.get('content-length'), 10) || 0, contentType: res.headers.get('content-type') };
        },
        stream: async (k) => {
            const res = await fetch(objectUrl(k), { headers: auth });
            if (res.status === 400 || res.status === 404) throw notFound();
            if (!res.ok || !res.body) throw new Error(`Supabase download failed (${res.status})`);
            return Readable.fromWeb(res.body);
        }
    };
}

const store = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY ? supabaseStore() : minioStore();

async function put(params) {
    await store.write(params.Key, params.Body, params.ContentType);
    return { Location: media.urlFor(params.Key), Key: params.Key, Bucket: bucket };
}

// Supports both aws-sdk v2 styles: fn(params, callback) and fn(params).promise().
const sdkStyle = (fn) => (params, callback) => {
    const result = fn(params);
    if (typeof callback === 'function') {
        result.then((data) => callback(null, data), (err) => callback(err));
        return undefined;
    }
    return { promise: () => result };
};

const s3 = {
    upload: sdkStyle(put),
    putObject: sdkStyle(put),

    getObject: (params) => ({
        createReadStream: () => {
            const out = new PassThrough();
            Promise.resolve(store.stream(params.Key)).then((stream) => stream.pipe(out), (err) => out.destroy(err));
            return out;
        },
        promise: async () => ({ Body: await toBuffer(await store.stream(params.Key)) })
    }),

    // For /media: object details and a read stream.
    stat: (key) => store.stat(key),
    stream: (key) => store.stream(key),
    exists: (key) => store.stat(key).then(() => true, () => false),
    put,

    // The admin uploads through the backend (PUT /media/<key> with a signed link), so
    // it works from any browser that can reach the admin site.
    createPresignedUpload: (key, contentType, expiresSeconds = 300) => ({
        uploadUrl: media.uploadUrlFor(key, contentType, expiresSeconds),
        location: media.urlFor(key),
        key
    })
};

module.exports = s3;
