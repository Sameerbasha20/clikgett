'use strict';

const mysql = require('mysql');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const CommonController = require('./CommonController');

const defaultPool = require('../utils/db');

// Helper for promise-based query
const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const activePool = CustomerRequestsController._pool || defaultPool;
        activePool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

// Ensure product request photo storage directory exists
const productRequestPhotoDir = path.resolve(__dirname, '../images/product_requests');
if (!fs.existsSync(productRequestPhotoDir)) {
    fs.mkdirSync(productRequestPhotoDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const CustomerRequestsController = {

    // ==========================================
    // 1. CUSTOMER ENQUIRIES
    // ==========================================

    /**
     * Customer: Submit a new enquiry or product request
     * POST /api/customer/enquiries
     */
    submitEnquiry: async (req, resp) => {
        try {
            const userId = req.UserID;
            if (!userId) {
                return resp.status(401).json({ Status: 0, Message: 'Unauthorized' });
            }

            const {
                description,
                subject,
                name,
                mobileNumber,
                category,
                productName,
                brand,
                sizeOrQty,
                imageBase64,
                mimeType
            } = req.body;

            if (!description || typeof description !== 'string' || description.trim().length === 0) {
                return resp.status(400).json({ Status: 0, Message: 'Please enter your enquiry description' });
            }

            // Retrieve user details from Users table if not provided
            let customerName = name ? name.trim() : null;
            let contactMobile = mobileNumber ? mobileNumber.trim() : null;

            if (!customerName || !contactMobile) {
                const userRows = await queryAsync('SELECT FirstName, LastName, MobileNumber FROM Users WHERE UserID = ?', [userId]);
                if (userRows && userRows.length > 0) {
                    const u = userRows[0];
                    if (!customerName) {
                        customerName = `${u.FirstName || ''} ${u.LastName || ''}`.trim() || 'Valued Customer';
                    }
                    if (!contactMobile) {
                        contactMobile = u.MobileNumber || req.MobileNumber || null;
                    }
                }
            }

            const cleanCategory = category && typeof category === 'string'
                ? category.trim()
                : (subject && subject.includes('[Product Request]') ? 'Product Request' : 'General Support');

            const cleanProductName = productName && typeof productName === 'string' && productName.trim().length > 0
                ? productName.trim()
                : (cleanCategory === 'Product Request' && subject ? subject.replace(/\[.*?\]\s*/, '').trim() : null);

            let cleanSubject = subject && typeof subject === 'string' && subject.trim().length > 0
                ? subject.trim()
                : (cleanCategory === 'Product Request' && cleanProductName
                    ? `[Product Request] ${cleanProductName}`
                    : `[${cleanCategory}] Support Request`);

            const cleanDescription = description.trim();

            // Optional image processing for enquiry / product request photo
            let imagePath = null;
            if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.trim().length > 0) {
                const cleanMime = (mimeType || 'image/jpeg').toLowerCase();
                const extension = ALLOWED_MIME_TYPES[cleanMime] || '.jpg';

                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                if (buffer.length > 10 * 1024 * 1024) {
                    return resp.status(400).json({ Status: 0, Message: 'Image size exceeds maximum limit of 10MB' });
                }

                if (buffer.length >= 10) {
                    const uniqueId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
                    const fileName = `enq_img_${Date.now()}_${uniqueId}${extension}`;
                    const localFilePath = path.join(productRequestPhotoDir, fileName);

                    fs.writeFileSync(localFilePath, buffer);
                    imagePath = `images/product_requests/${fileName}`;
                }
            }

            const insertSql = `
                INSERT INTO CustomerEnquiries (
                    UserID, Name, MobileNumber, Subject, Description, Category, ProductName, ImagePath, Status, CreatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())
            `;
            const result = await queryAsync(insertSql, [
                userId,
                customerName,
                contactMobile,
                cleanSubject,
                cleanDescription,
                cleanCategory,
                cleanProductName,
                imagePath
            ]);

            // If this is a Product Request, also persist into ProductRequests table for unified Admin review
            if (cleanCategory === 'Product Request' && cleanProductName) {
                try {
                    await queryAsync(`
                        INSERT INTO ProductRequests (
                            UserID, CustomerName, MobileNumber, ProductName,
                            Brand, SizeOrQty, Description, ImagePath, Status, CreatedAt
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())
                    `, [
                        userId,
                        customerName,
                        contactMobile,
                        cleanProductName,
                        brand ? brand.trim() : null,
                        sizeOrQty ? sizeOrQty.trim() : null,
                        cleanDescription,
                        imagePath
                    ]);
                } catch (e) {
                    // Non-fatal if ProductRequests table has duplicate or schema nuance
                    console.log('Notice: Auto-sync to ProductRequests:', e.message);
                }
            }

            const successMessage = cleanCategory === 'Product Request'
                ? `Request for "${cleanProductName || 'product'}" submitted! Our team will review it and check availability.`
                : 'Your enquiry has been submitted successfully. Our team will get back to you shortly!';

            return resp.status(200).json({
                Status: 1,
                Message: successMessage,
                EnquiryID: result.insertId,
                ImagePath: imagePath
            });

        } catch (err) {
            console.error('Error submitting customer enquiry:', err);
            return resp.status(500).json({ Status: 0, Message: 'Failed to submit enquiry. Please try again.' });
        }
    },

    /**
     * Customer: Fetch own enquiries
     * GET /api/customer/enquiries/my
     */
    getMyEnquiries: async (req, resp) => {
        try {
            const userId = req.UserID;
            const rows = await queryAsync(
                'SELECT * FROM CustomerEnquiries WHERE UserID = ? ORDER BY CreatedAt DESC',
                [userId]
            );
            return resp.status(200).json({ Status: 1, Enquiries: rows });
        } catch (err) {
            console.error('Error getting customer enquiries:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error fetching your enquiries' });
        }
    },

    /**
     * Admin: List customer enquiries
     * GET /api/admin/customer-enquiries
     */
    adminListEnquiries: async (req, resp) => {
        try {
            const { status, search } = req.query;
            let sql = `
                SELECT ce.*, u.FirstName, u.LastName, u.MobileNumber as UserAccountMobile
                FROM CustomerEnquiries ce
                LEFT JOIN Users u ON ce.UserID = u.UserID
                WHERE 1=1
            `;
            const params = [];

            if (status && status !== 'All') {
                sql += ' AND ce.Status = ?';
                params.push(status);
            }

            if (search && search.trim()) {
                const term = `%${search.trim()}%`;
                sql += ' AND (ce.Name LIKE ? OR ce.MobileNumber LIKE ? OR ce.Subject LIKE ? OR ce.Description LIKE ?)';
                params.push(term, term, term, term);
            }

            sql += ' ORDER BY ce.CreatedAt DESC';

            const rows = await queryAsync(sql, params);
            return resp.status(200).json({ Status: 1, Enquiries: rows });
        } catch (err) {
            console.error('Error listing enquiries for admin:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error listing customer enquiries' });
        }
    },

    /**
     * Admin: Update enquiry status
     * PUT /api/admin/customer-enquiries/:id/status
     */
    adminUpdateEnquiryStatus: async (req, resp) => {
        try {
            const enquiryId = req.params.id;
            const { status, adminNotes } = req.body;

            if (!status) {
                return resp.status(400).json({ Status: 0, Message: 'Status is required' });
            }

            const validStatuses = ['Pending', 'In Progress', 'Under Review', 'Fulfilled', 'Resolved', 'Rejected', 'Closed'];
            if (!validStatuses.includes(status)) {
                return resp.status(400).json({ Status: 0, Message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
            }

            await queryAsync(
                'UPDATE CustomerEnquiries SET Status = ?, AdminNotes = COALESCE(?, AdminNotes), UpdatedAt = NOW() WHERE EnquiryID = ?',
                [status, adminNotes !== undefined ? adminNotes : null, enquiryId]
            );

            return resp.status(200).json({
                Status: 1,
                Message: `Enquiry status updated to ${status}`
            });
        } catch (err) {
            console.error('Error updating enquiry status:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error updating enquiry status' });
        }
    },

    /**
     * Secure image retrieval for customer enquiry / product request photo
     * GET /api/customer/enquiries/image/:id
     * or GET /api/admin/customer-enquiries/image/:id
     */
    getSecureEnquiryImage: async (req, resp) => {
        try {
            const enquiryId = req.params.id;
            const userId = req.UserID;
            const adminId = req.AdminID;

            const rows = await queryAsync('SELECT UserID, ImagePath FROM CustomerEnquiries WHERE EnquiryID = ?', [enquiryId]);
            if (!rows || rows.length === 0 || !rows[0].ImagePath) {
                return resp.status(404).send('Image not found');
            }

            // Access control: Only the customer who submitted it or an authenticated admin
            if (!adminId && rows[0].UserID !== userId) {
                return resp.status(403).send('Forbidden: Access denied to this image');
            }

            const storagePath = rows[0].ImagePath;
            const absolutePath = path.resolve(__dirname, '..', storagePath);

            if (!fs.existsSync(absolutePath)) {
                return resp.status(404).send('Image file not found on server');
            }

            const ext = path.extname(absolutePath).toLowerCase();
            const contentTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp'
            };

            resp.setHeader('Content-Type', contentTypes[ext] || 'image/jpeg');
            resp.setHeader('Cache-Control', 'private, max-age=86400');
            const readStream = fs.createReadStream(absolutePath);
            return readStream.pipe(resp);
        } catch (err) {
            console.error('Error serving secure enquiry image:', err);
            return resp.status(500).send('Internal server error');
        }
    },

    // ==========================================
    // 2. PRODUCT REQUESTS (WITH OPTIONAL PHOTO)
    // ==========================================

    /**
     * Customer: Submit request for unavailable product
     * POST /api/customer/product-requests
     */
    submitProductRequest: async (req, resp) => {
        try {
            const userId = req.UserID;
            if (!userId) {
                return resp.status(401).json({ Status: 0, Message: 'Unauthorized' });
            }

            const {
                productName,
                brand,
                sizeOrQty,
                description,
                imageBase64,
                mimeType
            } = req.body;

            if (!productName || typeof productName !== 'string' || productName.trim().length === 0) {
                return resp.status(400).json({ Status: 0, Message: 'Product name is required' });
            }

            const cleanProductName = productName.trim();

            // Deduplication check: Check if user submitted a pending request for the same product in the last 24 hours
            const existing = await queryAsync(`
                SELECT RequestID, CreatedAt 
                FROM ProductRequests 
                WHERE UserID = ? 
                  AND LOWER(TRIM(ProductName)) = LOWER(TRIM(?))
                  AND Status IN ('Pending', 'In Progress')
                  AND CreatedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
                LIMIT 1
            `, [userId, cleanProductName]);

            if (existing && existing.length > 0) {
                return resp.status(200).json({
                    Status: 2,
                    Message: `You have already requested "${cleanProductName}" recently. Our procurement team is actively sourcing it!`,
                    RequestID: existing[0].RequestID
                });
            }

            // Retrieve user details
            let customerName = 'Valued Customer';
            let contactMobile = req.MobileNumber || null;

            const userRows = await queryAsync('SELECT FirstName, LastName, MobileNumber FROM Users WHERE UserID = ?', [userId]);
            if (userRows && userRows.length > 0) {
                const u = userRows[0];
                customerName = `${u.FirstName || ''} ${u.LastName || ''}`.trim() || 'Valued Customer';
                if (!contactMobile) contactMobile = u.MobileNumber;
            }

            // Optional image processing
            let imagePath = null;
            if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.trim().length > 0) {
                const cleanMime = (mimeType || 'image/jpeg').toLowerCase();
                const extension = ALLOWED_MIME_TYPES[cleanMime] || '.jpg';

                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                if (buffer.length > 10 * 1024 * 1024) {
                    return resp.status(400).json({ Status: 0, Message: 'Image size exceeds maximum limit of 10MB' });
                }

                if (buffer.length >= 10) {
                    const uniqueId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
                    const fileName = `prod_req_${Date.now()}_${uniqueId}${extension}`;
                    const localFilePath = path.join(productRequestPhotoDir, fileName);

                    fs.writeFileSync(localFilePath, buffer);
                    imagePath = `images/product_requests/${fileName}`;
                }
            }

            const insertSql = `
                INSERT INTO ProductRequests (
                    UserID, CustomerName, MobileNumber, ProductName,
                    Brand, SizeOrQty, Description, ImagePath, Status, CreatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())
            `;

            const result = await queryAsync(insertSql, [
                userId,
                customerName,
                contactMobile,
                cleanProductName,
                brand ? brand.trim() : null,
                sizeOrQty ? sizeOrQty.trim() : null,
                description ? description.trim() : null,
                imagePath
            ]);

            return resp.status(200).json({
                Status: 1,
                Message: `Request for "${cleanProductName}" submitted! We will notify you as soon as it arrives.`,
                RequestID: result.insertId
            });

        } catch (err) {
            console.error('Error submitting product request:', err);
            return resp.status(500).json({ Status: 0, Message: 'Failed to submit product request. Please try again.' });
        }
    },

    /**
     * Customer: Fetch own product requests
     * GET /api/customer/product-requests/my
     */
    getMyProductRequests: async (req, resp) => {
        try {
            const userId = req.UserID;
            const rows = await queryAsync(
                'SELECT * FROM ProductRequests WHERE UserID = ? ORDER BY CreatedAt DESC',
                [userId]
            );
            return resp.status(200).json({ Status: 1, Requests: rows });
        } catch (err) {
            console.error('Error getting customer product requests:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error fetching product requests' });
        }
    },

    /**
     * Secure image retrieval for product request photo
     * GET /api/customer/product-requests/image/:id
     * or GET /api/admin/product-requests/image/:id
     */
    getSecureProductRequestImage: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const userId = req.UserID;
            const adminId = req.AdminID;

            const rows = await queryAsync('SELECT UserID, ImagePath FROM ProductRequests WHERE RequestID = ?', [requestId]);
            if (!rows || rows.length === 0 || !rows[0].ImagePath) {
                return resp.status(404).send('Image not found');
            }

            // Access control: Only the customer who submitted it or an authenticated admin
            if (!adminId && rows[0].UserID !== userId) {
                return resp.status(403).send('Forbidden: Access denied to this image');
            }

            const storagePath = rows[0].ImagePath;
            const absolutePath = path.resolve(__dirname, '..', storagePath);

            if (fs.existsSync(absolutePath)) {
                const ext = path.extname(absolutePath).toLowerCase();
                const mime = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');
                resp.setHeader('Content-Type', mime);
                resp.setHeader('Cache-Control', 'private, max-age=3600');
                const stream = fs.createReadStream(absolutePath);
                return stream.pipe(resp);
            } else {
                return resp.status(404).send('Image file not found on disk');
            }
        } catch (err) {
            console.error('Error serving product request image:', err);
            return resp.status(500).send('Error serving image');
        }
    },

    /**
     * Admin: List unavailable product requests
     * GET /api/admin/product-requests
     */
    adminListProductRequests: async (req, resp) => {
        try {
            const { status, search } = req.query;
            let sql = `
                SELECT pr.*, 
                       p.ProductName as LinkedCatalogProductName,
                       p.ProductID as CatalogProductID,
                       u.FirstName, u.LastName, u.MobileNumber as UserAccountMobile
                FROM ProductRequests pr
                LEFT JOIN Users u ON pr.UserID = u.UserID
                LEFT JOIN Products p ON pr.LinkedProductID = p.ProductID
                WHERE 1=1
            `;
            const params = [];

            if (status && status !== 'All') {
                sql += ' AND pr.Status = ?';
                params.push(status);
            }

            if (search && search.trim()) {
                const term = `%${search.trim()}%`;
                sql += ' AND (pr.ProductName LIKE ? OR pr.Brand LIKE ? OR pr.CustomerName LIKE ? OR pr.MobileNumber LIKE ?)';
                params.push(term, term, term, term);
            }

            sql += ' ORDER BY pr.CreatedAt DESC';

            const rows = await queryAsync(sql, params);
            return resp.status(200).json({ Status: 1, Requests: rows });
        } catch (err) {
            console.error('Error listing product requests for admin:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error listing product requests' });
        }
    },

    /**
     * Admin: Update product request status & notify customer if marked Available
     * PUT /api/admin/product-requests/:id/status
     */
    adminUpdateProductRequestStatus: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const { status, linkedProductID, adminNotes } = req.body;

            if (!status) {
                return resp.status(400).json({ Status: 0, Message: 'Status is required' });
            }

            const validStatuses = ['Pending', 'In Progress', 'Available', 'Fulfilled', 'Rejected'];
            if (!validStatuses.includes(status)) {
                return resp.status(400).json({ Status: 0, Message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
            }

            const rows = await queryAsync('SELECT * FROM ProductRequests WHERE RequestID = ?', [requestId]);
            if (!rows || rows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: 'Product request not found' });
            }

            const current = rows[0];
            let notifiedNow = false;

            // If transitioning to Available and not already notified
            if (status === 'Available' && !current.NotifiedAt) {
                const prodName = current.ProductName || 'Requested Product';
                const notificationPayload = {
                    Title: 'Product Now Available!',
                    Message: `Good news! "${prodName}" is now available on ClikGett. Order yours today!`,
                    ProductID: linkedProductID || current.LinkedProductID || null,
                    Type: 1
                };

                try {
                    await CommonController.Send_Notification(notificationPayload, current.UserID);
                    notifiedNow = true;
                } catch (notiErr) {
                    console.error('Push notification dispatch note (graceful handle):', notiErr.message);
                }
            }

            const updateSql = `
                UPDATE ProductRequests 
                SET Status = ?,
                    LinkedProductID = COALESCE(?, LinkedProductID),
                    AdminNotes = COALESCE(?, AdminNotes),
                    NotifiedAt = CASE WHEN ? = 1 THEN NOW() ELSE NotifiedAt END,
                    UpdatedAt = NOW()
                WHERE RequestID = ?
            `;

            await queryAsync(updateSql, [
                status,
                linkedProductID !== undefined ? linkedProductID : null,
                adminNotes !== undefined ? adminNotes : null,
                notifiedNow ? 1 : 0,
                requestId
            ]);

            return resp.status(200).json({
                Status: 1,
                Message: `Product request updated to "${status}"${notifiedNow ? ' and customer notified via push notification!' : '.'}`,
                Notified: notifiedNow
            });

        } catch (err) {
            console.error('Error updating product request status:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error updating product request' });
        }
    },

    /**
     * Admin: Explicitly send availability notification for a product request
     * POST /api/admin/product-requests/:id/notify
     */
    adminTriggerProductNotification: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const { linkedProductID } = req.body;

            const rows = await queryAsync('SELECT * FROM ProductRequests WHERE RequestID = ?', [requestId]);
            if (!rows || rows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: 'Product request not found' });
            }

            const record = rows[0];
            const prodName = record.ProductName || 'Requested Product';
            const effectiveProductID = linkedProductID || record.LinkedProductID || null;

            const notificationPayload = {
                Title: 'Product Now Available!',
                Message: `Good news! "${prodName}" is now in stock on ClikGett. Check it out and order now!`,
                ProductID: effectiveProductID,
                Type: 1
            };

            await CommonController.Send_Notification(notificationPayload, record.UserID);

            await queryAsync(`
                UPDATE ProductRequests 
                SET Status = 'Available',
                    LinkedProductID = COALESCE(?, LinkedProductID),
                    NotifiedAt = NOW(),
                    UpdatedAt = NOW()
                WHERE RequestID = ?
            `, [effectiveProductID, requestId]);

            return resp.status(200).json({
                Status: 1,
                Message: `Availability notification sent successfully to customer for "${prodName}"!`,
                NotifiedAt: new Date()
            });

        } catch (err) {
            console.error('Error triggering product notification:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error sending product notification' });
        }
    }
};

module.exports = CustomerRequestsController;
