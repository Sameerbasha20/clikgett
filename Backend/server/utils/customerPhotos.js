'use strict';
// Customer photos (photo orders, enquiries, product requests) live in object storage
// (Supabase / MinIO) under their old path, e.g. "images/photo_orders/<file>.jpg", so
// records written before the move still resolve. They are private: only served
// through the authenticated /image/:id routes, never from the public /media folders.
const fs = require('fs');
const path = require('path');
const storage = require('./s3');

const SERVER_ROOT = path.resolve(__dirname, '..');
const CONTENT_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

/** Stores the photo and returns the path to keep in the database. */
async function save(buffer, folder, fileName, contentType) {
    const key = `images/${folder}/${fileName}`;
    await storage.put({ Key: key, Body: buffer, ContentType: contentType || CONTENT_TYPES[path.extname(fileName).toLowerCase()] });
    return key;
}

/** Streams a stored photo: local disk first (older local installs), then object storage. */
async function send(resp, storedPath) {
    const key = String(storedPath || '').replace(/^\/+/, '');
    if (!key || key.includes('..')) return resp.status(404).send('Image not found');
    const contentType = CONTENT_TYPES[path.extname(key).toLowerCase()] || 'image/jpeg';
    resp.setHeader('Content-Type', contentType);
    resp.setHeader('Cache-Control', 'private, max-age=3600');

    const localPath = path.resolve(SERVER_ROOT, key);
    if (localPath.startsWith(SERVER_ROOT) && fs.existsSync(localPath)) {
        return fs.createReadStream(localPath).pipe(resp);
    }
    try {
        const stream = await storage.stream(key);
        stream.on('error', () => resp.destroy());
        return stream.pipe(resp);
    } catch (err) {
        resp.removeHeader('Cache-Control');
        return resp.status(404).send('Image file not found');
    }
}

module.exports = { save, send };
