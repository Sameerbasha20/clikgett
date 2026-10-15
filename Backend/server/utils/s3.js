const AWS = require('aws-sdk');
require('dotenv').config();

// Single shared S3 client. When S3_ENDPOINT is set (local MinIO), uploads go
// there; otherwise they go to AWS S3. Both the legacy (S3AccessKey) and the
// newer (S3_ACCESS_KEY) variable names are accepted.
const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || (endpoint ? 'us-east-1' : 'ap-south-1');
const bucket = process.env.bucketname || process.env.S3_BUCKET;

const baseConfig = {
    accessKeyId: process.env.S3_ACCESS_KEY || process.env.S3AccessKey,
    secretAccessKey: process.env.S3_SECRET_KEY || process.env.S3SecretKey,
    region,
    signatureVersion: 'v4'
};

const makeClient = (ep) => new AWS.S3(ep ? { ...baseConfig, endpoint: ep, s3ForcePathStyle: true } : baseConfig);

const s3 = makeClient(endpoint);

// Browsers cannot reach docker-internal hosts such as http://minio:9000, so
// presigned URLs are signed against S3_PUBLIC_ENDPOINT when it is set.
const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT || endpoint;
const signer = publicEndpoint === endpoint ? s3 : makeClient(publicEndpoint);

// Returns a short-lived URL the admin browser can PUT a file to, plus the
// public location of the object once uploaded.
s3.createPresignedUpload = (key, contentType, expiresSeconds = 300) => {
    const uploadUrl = signer.getSignedUrl('putObject', {
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        Expires: expiresSeconds
    });
    const location = publicEndpoint
        ? `${publicEndpoint.replace(/\/$/, '')}/${bucket}/${key}`
        : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return { uploadUrl, location, key };
};

module.exports = s3;
