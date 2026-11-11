'use strict';
// Refuses to save a product whose pictures are not actually in storage (a failed
// upload must not leave customers with a broken image). Entries are file names in
// the Products folder ("1712345.jpg") or full URLs; outside URLs are not checked.
const storage = require('./s3');

const keyFor = (entry) => {
    const s = String(entry || '').trim();
    if (!s) return null;
    const m = s.match(/\/media\/(Products\/[^?#]+)/) || s.match(/clikgett-media\.local\/(Products\/[^?#]+)/);
    if (m) return decodeURIComponent(m[1]);
    if (/^https?:\/\//i.test(s)) return null;
    return `Products/${s.replace(/^\/+/, '').replace(/^Products\//, '')}`;
};

async function requireStoredImages(req, resp, next) {
    try {
        const list = (req.body || {}).ProductImages;
        if (!Array.isArray(list) || !list.length) return next();
        const missing = [];
        for (const entry of list) {
            const key = keyFor(entry);
            if (key && !(await storage.exists(key))) missing.push(String(entry).split('/').pop());
        }
        if (missing.length) {
            return resp.status(400).json({
                Status: 0,
                Message: `These pictures did not upload: ${missing.join(', ')}. Remove them and upload again.`,
                MissingImages: missing,
            });
        }
        return next();
    } catch (err) {
        console.error('[productImageCheck]', err.message);
        return next();
    }
}

module.exports = { requireStoredImages, keyFor };
