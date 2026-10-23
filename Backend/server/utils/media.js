'use strict';
// Media (images, invoices, CSV exports) lives in the MinIO bucket and is served by the
// backend at /media/<key>, so phones and the admin only ever need the backend's address.
//
// Code builds media URLs with TOKEN as the host ("http://clikgett-media.local/Products/x.png");
// it starts with "http", so existing "already a URL?" checks keep working. Every JSON
// response replaces TOKEN with this server's own address as the client reached it
// (or PUBLIC_MEDIA_BASE_URL when set, e.g. https://api.clikgett.com/media/).
//
// Catalog folders are public. Everything else (CSV exports, invoices, customer uploads)
// is only served through a signed link that expires.
const crypto = require('crypto');

const TOKEN = 'http://clikgett-media.local/';
const PUBLIC_PREFIXES = ['Products/', 'Categories/', 'SubCategories/', 'Banners/', 'Sections/', 'Users/', 'deliveryboys/'];
const SIGNED_LINK_MINUTES = 60;

const isPublicKey = (key) => PUBLIC_PREFIXES.some((p) => key.startsWith(p));

const sign = (key, exp) => crypto.createHmac('sha256', process.env.SECRET_KEY || '')
    .update(`media:${key}:${exp}`).digest('hex');

/** URL for an object key; private keys get a signed link valid for SIGNED_LINK_MINUTES. */
function urlFor(key) {
    const path = String(key).split('/').map(encodeURIComponent).join('/');
    if (isPublicKey(key)) return TOKEN + path;
    const exp = Math.floor(Date.now() / 1000) + SIGNED_LINK_MINUTES * 60;
    return `${TOKEN}${path}?exp=${exp}&sig=${sign(key, exp)}`;
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Signed PUT link the admin uses to upload one file to this key. */
function uploadUrlFor(key, contentType, expiresSeconds = 300) {
    const path = String(key).split('/').map(encodeURIComponent).join('/');
    const exp = Math.floor(Date.now() / 1000) + expiresSeconds;
    const ct = encodeURIComponent(contentType || '');
    return `${TOKEN}${path}?exp=${exp}&ct=${ct}&sig=${sign(`put:${key}:${contentType || ''}`, exp)}`;
}

const validSig = (payload, exp, sig) => {
    const expected = Buffer.from(sign(payload, exp));
    const given = Buffer.from(String(sig || ''));
    return exp > Date.now() / 1000 && expected.length === given.length && crypto.timingSafeEqual(expected, given);
};

const baseFor = (req) => process.env.PUBLIC_MEDIA_BASE_URL
    ? process.env.PUBLIC_MEDIA_BASE_URL.replace(/\/?$/, '/')
    : `${req.protocol}://${req.get('host')}/media/`;

/** Middleware: swaps TOKEN for this server's /media/ address in JSON responses. */
function rewriteResponses(req, res, next) {
    const json = res.json.bind(res);
    res.json = (body) => {
        const text = JSON.stringify(body);
        if (text === undefined || !text.includes(TOKEN)) return json(body);
        if (!res.get('Content-Type')) res.type('application/json');
        return res.send(text.split(TOKEN).join(baseFor(req)));
    };
    next();
}

const CONTENT_TYPES = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    pdf: 'application/pdf', csv: 'text/csv'
};

/** GET /media/<key> */
function serve(storage) {
    return async (req, res) => {
        const key = decodeURIComponent(req.params[0] || '');
        if (!key || key.includes('..') || key.startsWith('/')) return res.status(404).end();
        if (!isPublicKey(key) && !validSig(key, parseInt(req.query.exp, 10), req.query.sig)) {
            return res.status(403).json({ Status: 0, Message: 'This link has expired' });
        }
        try {
            const stat = await storage.stat(key);
            const ext = key.split('.').pop().toLowerCase();
            res.setHeader('Content-Type', stat.contentType && stat.contentType !== 'application/octet-stream'
                ? stat.contentType : (CONTENT_TYPES[ext] || 'application/octet-stream'));
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Cache-Control', isPublicKey(key) ? 'public, max-age=86400' : 'private, no-store');
            const stream = await storage.stream(key);
            stream.on('error', () => res.destroy());
            stream.pipe(res);
        } catch (err) {
            if (err && (err.code === 'NotFound' || err.code === 'NoSuchKey')) return res.status(404).end();
            console.error('[media] serve failed', key, err && err.message);
            return res.status(502).end();
        }
    };
}

/** PUT /media/<key> with a link from uploadUrlFor(): stores the request body. */
function receive(storage) {
    return async (req, res) => {
        const key = decodeURIComponent(req.params[0] || '');
        const contentType = String(req.query.ct || '');
        if (!key || key.includes('..') || !validSig(`put:${key}:${contentType}`, parseInt(req.query.exp, 10), req.query.sig)) {
            return res.status(403).json({ Status: 0, Message: 'Upload link is invalid or has expired' });
        }
        const declared = parseInt(req.headers['content-length'], 10);
        if (!(declared > 0) || declared > MAX_UPLOAD_BYTES) {
            return res.status(413).json({ Status: 0, Message: 'File is empty or larger than 20 MB' });
        }
        try {
            const chunks = [];
            let size = 0;
            for await (const chunk of req) {
                size += chunk.length;
                if (size > MAX_UPLOAD_BYTES) return res.status(413).json({ Status: 0, Message: 'File is larger than 20 MB' });
                chunks.push(chunk);
            }
            await storage.put({ Key: key, Body: Buffer.concat(chunks), ContentType: contentType || undefined });
            return res.status(200).end();
        } catch (err) {
            console.error('[media] upload failed', key, err && err.message);
            return res.status(502).json({ Status: 0, Message: 'Upload failed' });
        }
    };
}

module.exports = { TOKEN, urlFor, uploadUrlFor, isPublicKey, rewriteResponses, serve, receive };
