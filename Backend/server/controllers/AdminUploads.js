const s3 = require('../utils/s3');

// Upload destinations the admin panel may write to, and the content types allowed in each.
const FOLDERS = {
    Products: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    productscsv: ['text/csv', 'application/vnd.ms-excel']
};

const AdminUploads = {
    // POST /api/adminuser/upload-url  { folder, fileName, contentType }
    // Returns a presigned PUT URL so the browser never holds storage credentials.
    createUploadUrl: (req, resp) => {
        try {
            const { folder, fileName, contentType } = req.body || {};
            const allowedTypes = FOLDERS[folder];
            if (!allowedTypes) {
                return resp.status(400).json({ "Status": 0, "Message": "Invalid upload folder" });
            }
            if (!allowedTypes.includes(contentType)) {
                return resp.status(400).json({ "Status": 0, "Message": "File type not allowed" });
            }
            const safeName = String(fileName || '').replace(/[^A-Za-z0-9._-]/g, '');
            if (!safeName || safeName.startsWith('.')) {
                return resp.status(400).json({ "Status": 0, "Message": "Invalid file name" });
            }
            const upload = s3.createPresignedUpload(`${folder}/${safeName}`, contentType);
            return resp.json({ "Status": 1, ...upload });
        } catch (err) {
            console.log("error creating upload url", err.message);
            return resp.status(500).json({ "Status": 0, "Message": "Unable to create upload URL" });
        }
    }
};

module.exports = AdminUploads;
