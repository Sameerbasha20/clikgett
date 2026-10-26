'use strict';
// Catalog images uploaded by the admin as a data URL ("data:image/png;base64,...") or
// bare base64. Stored in object storage under a public catalog folder
// (Categories/, SubCategories/, Banners/ ...) and served at /media.
const storage = require('./s3');

const TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp' };
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Decodes and stores the image; returns the file name to keep in the row.
 * Throws an Error with a message the admin can act on.
 */
async function saveDataUrl(dataUrl, folder, baseName) {
    const text = String(dataUrl || '');
    const match = /^data:([\w/+.-]+);base64,/.exec(text);
    const mime = match ? match[1].toLowerCase() : 'image/png';
    const ext = TYPES[mime];
    if (!ext) throw new Error('Upload a PNG, JPG or WEBP image');
    const buffer = Buffer.from(match ? text.slice(match[0].length) : text, 'base64');
    if (buffer.length < 100) throw new Error('The image could not be read. Please choose it again');
    if (buffer.length > MAX_BYTES) throw new Error('The image is larger than 5 MB');
    const fileName = `${baseName}.${ext}`;
    await storage.put({ Key: `${folder}/${fileName}`, Body: buffer, ContentType: mime === 'image/jpg' ? 'image/jpeg' : mime });
    return fileName;
}

module.exports = { saveDataUrl };
