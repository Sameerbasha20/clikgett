const Minio = require('minio');
const { PassThrough } = require('stream');
const media = require('./media');
require('dotenv').config();

// All files live in the MinIO bucket from docker-compose (S3_ENDPOINT, e.g. http://minio:9000)
// and are served to apps and the admin by the backend at /media (see utils/media.js).
// The controllers were written against the aws-sdk v2 S3 client, so this keeps its call
// shapes: s3.upload(params, cb), s3.upload(params).promise(), s3.putObject(...).promise(),
// s3.getObject(params).createReadStream(). Bucket in params is ignored: there is one bucket.
const endpoint = new URL(process.env.S3_ENDPOINT || 'http://minio:9000');
const client = new Minio.Client({
    endPoint: endpoint.hostname,
    port: Number(endpoint.port) || (endpoint.protocol === 'https:' ? 443 : 80),
    useSSL: endpoint.protocol === 'https:',
    accessKey: process.env.S3_ACCESS_KEY || process.env.S3AccessKey,
    secretKey: process.env.S3_SECRET_KEY || process.env.S3SecretKey
});
const bucket = process.env.bucketname || process.env.S3_BUCKET || 'clikgett-media';

async function put(params) {
    const key = params.Key;
    const meta = params.ContentType ? { 'Content-Type': params.ContentType } : {};
    const body = params.Body;
    if (body && typeof body.pipe === 'function') {
        await client.putObject(bucket, key, body, undefined, meta);
    } else {
        const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body === undefined || body === null ? '' : body);
        await client.putObject(bucket, key, buffer, buffer.length, meta);
    }
    return { Location: media.urlFor(key), Key: key, Bucket: bucket };
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
            client.getObject(bucket, params.Key).then((stream) => stream.pipe(out), (err) => out.destroy(err));
            return out;
        },
        promise: async () => {
            const chunks = [];
            for await (const chunk of await client.getObject(bucket, params.Key)) chunks.push(chunk);
            return { Body: Buffer.concat(chunks) };
        }
    }),

    // For /media: object details and a read stream.
    stat: async (key) => {
        const info = await client.statObject(bucket, key);
        return { size: info.size, contentType: info.metaData && info.metaData['content-type'] };
    },
    stream: (key) => client.getObject(bucket, key),
    exists: (key) => client.statObject(bucket, key).then(() => true, () => false),
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
