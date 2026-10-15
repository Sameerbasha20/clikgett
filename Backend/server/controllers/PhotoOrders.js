'use strict';

const mysql = require('mysql');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AWS = require('aws-sdk');
const CommonController = require('./CommonController');
const PricingEngine = require('../services/PricingEngine');

const pool = require('../utils/db');
const OrderLifecycle = require('../services/OrderLifecycle');
const { ORDER_STATUS } = require('../utils/orderStatus');

const s3 = require('../utils/s3');

// Helper for promise-based query
const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

// Ensure photo storage directory exists
const localPhotoDir = path.resolve(__dirname, '../images/photo_orders');
if (!fs.existsSync(localPhotoDir)) {
    fs.mkdirSync(localPhotoDir, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const PhotoOrdersController = {

    /**
     * Customer: Submit a new photo order request
     * POST /api/photo-orders/submit
     */
    submitRequest: async (req, resp) => {
        try {
            const userId = req.UserID;
            if (!userId) {
                return resp.status(401).json({ Status: 0, Message: 'Unauthorized' });
            }

            const { imageBase64, mimeType, customerNotes, deliveryAddressID, deliveryAddressSnapshot } = req.body;

            if (!imageBase64) {
                return resp.status(400).json({ Status: 0, Message: 'Image is required' });
            }

            // Validate MIME type
            const cleanMime = (mimeType || 'image/jpeg').toLowerCase();
            const extension = ALLOWED_MIME_TYPES[cleanMime];
            if (!extension) {
                return resp.status(400).json({ Status: 0, Message: 'Invalid image format. Allowed: JPG, PNG, WEBP' });
            }

            // Clean base64 string
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            // Size check: Max 10MB
            if (buffer.length > 10 * 1024 * 1024) {
                return resp.status(400).json({ Status: 0, Message: 'Image size exceeds maximum limit of 10MB' });
            }
            if (buffer.length < 10) {
                return resp.status(400).json({ Status: 0, Message: 'Invalid or corrupt image content' });
            }

            // Generate safe filename & storage path
            const uniqueId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
            const fileName = `photo_order_${Date.now()}_${uniqueId}${extension}`;
            const localFilePath = path.join(localPhotoDir, fileName);

            // Write to disk
            fs.writeFileSync(localFilePath, buffer);
            const storagePath = `images/photo_orders/${fileName}`;

            // Try S3 upload if configured (with private ACL)
            if (process.env.bucketname && process.env.S3AccessKey) {
                try {
                    const s3Key = `photo_orders/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileName}`;
                    await s3.putObject({
                        Bucket: process.env.bucketname,
                        Key: s3Key,
                        Body: buffer,
                        ContentType: cleanMime,
                        ACL: 'private'
                    }).promise();
                } catch (s3Err) {
                    console.log('S3 private upload notice (falling back to secure local storage):', s3Err.message);
                }
            }

            // Generate unique reference code: POR-YYYYMMDD-XXXX
            const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const requestCode = `POR-${todayStr}-${randomCode}`;

            // Insert into PhotoOrderRequests
            const insertSql = `
                INSERT INTO PhotoOrderRequests (
                    RequestCode, UserID, ImageStoragePath, CustomerNotes,
                    DeliveryAddressID, DeliveryAddressSnapshot, RequestStatus, CreatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())
            `;
            const result = await queryAsync(insertSql, [
                requestCode,
                userId,
                storagePath,
                customerNotes || null,
                deliveryAddressID || null,
                typeof deliveryAddressSnapshot === 'object' ? JSON.stringify(deliveryAddressSnapshot) : (deliveryAddressSnapshot || null)
            ]);

            const requestId = result.insertId;

            // Audit timeline entry
            await queryAsync(`
                INSERT INTO PhotoOrderStatusTimeline (RequestID, PreviousStatus, NewStatus, ChangedByRole, ChangedByID, Notes, CreatedAt)
                VALUES (?, NULL, 'PENDING', 'CUSTOMER', ?, 'Photo order request submitted by customer', NOW())
            `, [requestId, userId]);

            // Notify user of receipt
            try {
                await CommonController.Send_Notification({
                    Title: 'Photo Order Received',
                    Message: `Your photo order request #${requestCode} has been received. Our team is preparing your order!`
                }, userId);
            } catch (notifyErr) {
                console.log('Notification dispatch note:', notifyErr.message);
            }

            return resp.status(200).json({
                Status: 1,
                Message: 'Photo order request submitted successfully',
                RequestID: requestId,
                RequestCode: requestCode
            });

        } catch (err) {
            console.error('Error submitting photo order:', err);
            return resp.status(500).json({ Status: 0, Message: 'Internal server error while submitting photo order' });
        }
    },

    /**
     * Customer: Get list of user's photo order requests
     * GET /api/photo-orders/my-requests
     */
    getMyRequests: async (req, resp) => {
        try {
            const userId = req.UserID;
            const sql = `
                SELECT 
                    r.RequestID, r.RequestCode, r.RequestStatus, r.CustomerNotes,
                    r.SubTotal, r.DeliveryCharges, r.Discount, r.GrandTotal,
                    r.CreatedOrderID, r.CreatedAt, r.UpdatedAt, r.ProposedAt,
                    (SELECT COUNT(*) FROM PhotoOrderItems i WHERE i.RequestID = r.RequestID) as ItemCount
                FROM PhotoOrderRequests r
                WHERE r.UserID = ?
                ORDER BY r.CreatedAt DESC
            `;
            const requests = await queryAsync(sql, [userId]);
            return resp.status(200).json({ Status: 1, Requests: requests });
        } catch (err) {
            console.error('Error fetching customer photo orders:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error fetching requests' });
        }
    },

    /**
     * Customer or Admin: Get single request details
     * GET /api/photo-orders/request/:id
     */
    getRequestDetail: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const userId = req.UserID;
            const adminId = req.AdminID;

            const reqRows = await queryAsync(`
                SELECT r.*, u.MobileNumber as CustomerMobile,
                       TRIM(CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, ''))) as CustomerName
                FROM PhotoOrderRequests r
                LEFT JOIN Users u ON r.UserID = u.UserID
                WHERE r.RequestID = ?
            `, [requestId]);

            if (!reqRows || reqRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: 'Request not found' });
            }

            const request = reqRows[0];

            // Access control: customer must own the request or requestor must be admin
            if (!adminId && request.UserID !== userId) {
                return resp.status(403).json({ Status: 0, Message: 'Access denied' });
            }

            // Fetch proposed items with product details
            const items = await queryAsync(`
                SELECT 
                    poi.*, p.ProductName, p.ProductImages,
                    pv.metrictype, pv.metricvalue, pv.AvailableQty as CurrentStock,
                    altP.ProductName as AlternativeProductName
                FROM PhotoOrderItems poi
                JOIN Products p ON poi.ProductID = p.ProductID
                JOIN ProductVariants pv ON poi.VariantID = pv.VariantID
                LEFT JOIN Products altP ON poi.AlternativeProductID = altP.ProductID
                WHERE poi.RequestID = ?
            `, [requestId]);

            // Fetch audit timeline
            const timeline = await queryAsync(`
                SELECT * FROM PhotoOrderStatusTimeline
                WHERE RequestID = ?
                ORDER BY CreatedAt ASC
            `, [requestId]);

            return resp.status(200).json({
                Status: 1,
                Request: request,
                Items: items,
                Timeline: timeline
            });
        } catch (err) {
            console.error('Error fetching request detail:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error retrieving request details' });
        }
    },

    /**
     * Secure image access endpoint
     * GET /api/photo-orders/image/:id
     */
    getSecureImage: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const userId = req.UserID;
            const adminId = req.AdminID;

            const rows = await queryAsync("SELECT UserID, ImageStoragePath FROM PhotoOrderRequests WHERE RequestID = ?", [requestId]);
            if (!rows || rows.length === 0) {
                return resp.status(404).send('Image not found');
            }

            // Isolation: only request owner or admin
            if (!adminId && rows[0].UserID !== userId) {
                return resp.status(403).send('Forbidden');
            }

            const storagePath = rows[0].ImageStoragePath;
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
            console.error('Error serving secure image:', err);
            return resp.status(500).send('Error serving image');
        }
    },

    /**
     * Customer: Confirm and accept proposed order
     * POST /api/photo-orders/request/:id/confirm
     */
    confirmProposal: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const userId = req.UserID;
            const { paymentMethod, addressId } = req.body;

            // Fetch request
            const reqRows = await queryAsync("SELECT * FROM PhotoOrderRequests WHERE RequestID = ?", [requestId]);
            if (!reqRows || reqRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: 'Request not found' });
            }

            const photoReq = reqRows[0];
            if (photoReq.UserID !== userId) {
                return resp.status(403).json({ Status: 0, Message: 'Unauthorized' });
            }

            // Status check: Must be in AWAITING_CUSTOMER_CONFIRMATION
            if (photoReq.RequestStatus === 'ORDER_CREATED') {
                return resp.status(400).json({ Status: 0, Message: 'This proposal has already been confirmed and order was created.' });
            }
            if (photoReq.RequestStatus !== 'AWAITING_CUSTOMER_CONFIRMATION') {
                return resp.status(400).json({ Status: 0, Message: `Cannot confirm request in status: ${photoReq.RequestStatus}` });
            }

            // Fetch proposed items
            const proposedItems = await queryAsync(`
                SELECT poi.*, p.ProductName, pv.Price, pv.OfferPrice, pv.AvailableQty, pv.metrictype, pv.metricvalue
                FROM PhotoOrderItems poi
                JOIN Products p ON poi.ProductID = p.ProductID
                JOIN ProductVariants pv ON poi.VariantID = pv.VariantID
                WHERE poi.RequestID = ?
            `, [requestId]);

            if (!proposedItems || proposedItems.length === 0) {
                return resp.status(400).json({ Status: 0, Message: 'No items in this proposal to create an order.' });
            }

            // 1. Authoritative Stock & Availability Revalidation
            for (const item of proposedItems) {
                if (item.AvailableQty < item.Quantity) {
                    return resp.status(400).json({
                        Status: 0,
                        Message: `Product "${item.ProductName}" has only ${item.AvailableQty} units in stock, but ${item.Quantity} was requested. Please contact support.`
                    });
                }
            }

            // 2. Authoritative Price Recalculation via PricingEngine
            const cartItems = proposedItems.map(i => ({
                ProductID: i.ProductID,
                VariantID: i.VariantID,
                ProductName: i.ProductName,
                Quantity: i.Quantity,
                Price: i.Price,
                OfferPrice: i.OfferPrice,
                metrictype: i.metrictype,
                metricvalue: i.metricvalue
            }));

            // Resolve customer address
            let targetAddress = null;
            const effAddressId = addressId || photoReq.DeliveryAddressID;
            if (effAddressId) {
                const addrRows = await queryAsync("SELECT * FROM Address WHERE AddressID = ? AND UserID = ?", [effAddressId, userId]);
                if (addrRows.length > 0) targetAddress = addrRows[0];
            }
            if (!targetAddress && photoReq.DeliveryAddressSnapshot) {
                try {
                    targetAddress = JSON.parse(photoReq.DeliveryAddressSnapshot);
                } catch (e) {}
            }

            const pricingResult = await PricingEngine.calculateCart(cartItems, null, userId, targetAddress);

            // Re-check Minimum Order Value
            const configRows = await queryAsync("SELECT SettingValue FROM Settings WHERE SettingKey = 'MinOrderValue'");
            const minOrderVal = configRows.length > 0 ? parseFloat(configRows[0].SettingValue || 149) : 149;
            if (pricingResult.GrandTotal < minOrderVal) {
                return resp.status(400).json({
                    Status: 0,
                    Message: `Order total (₹${pricingResult.GrandTotal.toFixed(2)}) is below minimum order value of ₹${minOrderVal}`
                });
            }

            // 3. Atomically create canonical ClikGett order
            const chosenPayment = (paymentMethod || photoReq.PaymentMethod || 'COD').toUpperCase();
            // Photo orders have no Razorpay checkout yet, so only cash on delivery is accepted
            // (previously "ONLINE" was marked paid without any payment).
            if (chosenPayment !== 'COD') {
                return resp.status(400).json({ Status: 0, Message: 'Only Cash on Delivery is available for photo orders right now.' });
            }
            const OrdersController = require('./Orders');

            // Format order body for canonical CreateOrders
            const orderPayload = {
                UserID: userId,
                MobileNumber: req.MobileNumber || '',
                CartID: 0,
                PromoCode: 'NA',
                PromoAmount: 0,
                SubTotal: pricingResult.SubTotal,
                DeliverCharges: pricingResult.DeliveryCharges,
                Discount: pricingResult.TotalSavings || 0,
                TaxAmount: 0,
                GrandTotal: pricingResult.GrandTotal,
                PaymentMethod: chosenPayment,
                PaymentStatus: chosenPayment === 'ONLINE' ? 1 : 0,
                PaymentTransactionID: 'PHOTO_ORDER_' + requestId,
                Address: targetAddress ? (targetAddress.Address || targetAddress.address || '') : '',
                FlatNo: targetAddress ? (targetAddress.FlatNo || targetAddress.flatNo || '') : '',
                LandMark: targetAddress ? (targetAddress.LandMark || targetAddress.landmark || 'NA') : 'NA',
                Latitude: targetAddress ? (targetAddress.Latitude || targetAddress.latitude || 0) : 0,
                Longitude: targetAddress ? (targetAddress.Longitude || targetAddress.longitude || 0) : 0,
                OrderType: 'Delivery',
                WalletAmount: 0,
                TipAmount: 0,
                DeliveryInstructions: photoReq.CustomerNotes ? [photoReq.CustomerNotes] : [],
                OrderItems: cartItems
            };

            // Call canonical creation helper
            const orderInsertRes = await queryAsync(`
                INSERT INTO Orders (
                    MobileNumber, CancellationReason, City, CartID, UserID, PromoCode,
                    SubTotal, TaxAmount, PromoAmount, DeliverCharges, GrandTotal,
                    PaymentMethod, Address, FlatNo, LandMark, Latitude, Longitude,
                    PaymentStatus, PaymentTransactionID, OrderStatus, DeliveryBoyID,
                    RazorpayOrderID, Discount, OrderType, WalletAmount, TipAmount,
                    Distance, ScheduleStatus, TotalItemQuantity, CreatedAt
                ) VALUES (
                    ?, 'NA', 'NA', 0, ?, 'NA',
                    ?, 0, 0, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, 8, 0,
                    'NA', ?, 'Delivery', 0, 0,
                    1, 'Immediate', ?, NOW()
                )
            `, [
                orderPayload.MobileNumber,
                orderPayload.UserID,
                orderPayload.SubTotal,
                orderPayload.DeliverCharges,
                orderPayload.GrandTotal,
                orderPayload.PaymentMethod,
                orderPayload.Address,
                orderPayload.FlatNo,
                orderPayload.LandMark,
                orderPayload.Latitude,
                orderPayload.Longitude,
                orderPayload.PaymentStatus,
                orderPayload.PaymentTransactionID,
                orderPayload.Discount,
                cartItems.reduce((sum, item) => sum + (parseInt(item.Quantity) || 1), 0)
            ]);

            const createdOrderId = orderInsertRes.insertId;

            // Insert OrderItems
            for (const item of cartItems) {
                await queryAsync(`
                    INSERT INTO OrderItems (
                        OrderID, ProductID, VariantID, ProductName, Quantity,
                        Price, OfferPrice, metrictype, metricvalue, Type, ImageUrl
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '')
                `, [
                    createdOrderId, item.ProductID, item.VariantID, item.ProductName,
                    item.Quantity, item.Price, item.OfferPrice, item.metrictype, item.metricvalue
                ]);

                // Authoritative Inventory Deduction
                await queryAsync(`
                    UPDATE ProductVariants 
                    SET AvailableQty = AvailableQty - ? 
                    WHERE ProductID = ? AND VariantID = ?
                `, [item.Quantity, item.ProductID, item.VariantID]);
            }

            // Update PhotoOrderRequests status to ORDER_CREATED
            await queryAsync(`
                UPDATE PhotoOrderRequests 
                SET RequestStatus = 'ORDER_CREATED',
                    CreatedOrderID = ?,
                    ConfirmedAt = NOW(),
                    ResolvedAt = NOW(),
                    GrandTotal = ?
                WHERE RequestID = ?
            `, [createdOrderId, pricingResult.GrandTotal, requestId]);

            await OrderLifecycle.addTimeline(createdOrderId, ORDER_STATUS.RECEIVED, `Order received from photo order request #${requestId} (COD).`);
            CommonController.sendSmsForNewOrder(createdOrderId).catch((e) => console.log('new order sms failed', e.message));

            // Audit timeline
            await queryAsync(`
                INSERT INTO PhotoOrderStatusTimeline (RequestID, PreviousStatus, NewStatus, ChangedByRole, ChangedByID, Notes, CreatedAt)
                VALUES (?, 'AWAITING_CUSTOMER_CONFIRMATION', 'ORDER_CREATED', 'CUSTOMER', ?, ?, NOW())
            `, [requestId, userId, `Proposal confirmed by customer. Created Order ID #${createdOrderId}`]);

            // Notify customer
            try {
                await CommonController.Send_Notification({
                    Title: 'Order Created from Photo!',
                    Message: `Your order #${createdOrderId.toString().padStart(4, '0')} has been successfully placed. We are preparing it for delivery!`
                }, userId);
            } catch (notifyErr) {
                console.log('Customer notification notice:', notifyErr.message);
            }

            return resp.status(200).json({
                Status: 1,
                Message: 'Proposal accepted and order created successfully',
                OrderID: createdOrderId,
                OrderSequence: createdOrderId.toString().padStart(4, '0')
            });

        } catch (err) {
            console.error('Error confirming photo order proposal:', err);
            return resp.status(500).json({ Status: 0, Message: 'Internal server error while confirming proposal' });
        }
    },

    /**
     * Customer: Reject proposed order
     * POST /api/photo-orders/request/:id/reject
     */
    rejectProposal: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const userId = req.UserID;
            const { rejectionReason } = req.body;

            const reqRows = await queryAsync("SELECT * FROM PhotoOrderRequests WHERE RequestID = ?", [requestId]);
            if (!reqRows || reqRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: 'Request not found' });
            }

            const photoReq = reqRows[0];
            if (photoReq.UserID !== userId) {
                return resp.status(403).json({ Status: 0, Message: 'Unauthorized' });
            }

            if (photoReq.RequestStatus !== 'AWAITING_CUSTOMER_CONFIRMATION') {
                return resp.status(400).json({ Status: 0, Message: `Cannot reject request in status: ${photoReq.RequestStatus}` });
            }

            await queryAsync(`
                UPDATE PhotoOrderRequests 
                SET RequestStatus = 'CUSTOMER_REJECTED',
                    ResolvedAt = NOW(),
                    CustomerNotes = CONCAT(COALESCE(CustomerNotes, ''), ' [Customer Rejection Note: ', ?, ']')
                WHERE RequestID = ?
            `, [rejectionReason || 'No reason provided', requestId]);

            await queryAsync(`
                INSERT INTO PhotoOrderStatusTimeline (RequestID, PreviousStatus, NewStatus, ChangedByRole, ChangedByID, Notes, CreatedAt)
                VALUES (?, 'AWAITING_CUSTOMER_CONFIRMATION', 'CUSTOMER_REJECTED', 'CUSTOMER', ?, ?, NOW())
            `, [requestId, userId, `Proposal declined by customer: ${rejectionReason || 'No reason specified'}`]);

            return resp.status(200).json({
                Status: 1,
                Message: 'Proposal rejected successfully'
            });

        } catch (err) {
            console.error('Error rejecting proposal:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error rejecting proposal' });
        }
    },

    // ────────────────────────────────────────────────────────────
    // ADMIN ENDPOINTS
    // ────────────────────────────────────────────────────────────

    /**
     * Admin: List photo order requests with filters and pagination
     * GET /api/admin/photo-orders/list
     */
    adminListRequests: async (req, resp) => {
        try {
            const { status, search, startDate, endDate, page = 1, limit = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            let whereClauses = [];
            let params = [];

            if (status && status !== 'ALL') {
                whereClauses.push('r.RequestStatus = ?');
                params.push(status);
            }

            if (search) {
                whereClauses.push('(r.RequestCode LIKE ? OR u.MobileNumber LIKE ? OR u.FirstName LIKE ? OR u.LastName LIKE ?)');
                const term = `%${search}%`;
                params.push(term, term, term, term);
            }

            if (startDate) {
                whereClauses.push('DATE(r.CreatedAt) >= ?');
                params.push(startDate);
            }
            if (endDate) {
                whereClauses.push('DATE(r.CreatedAt) <= ?');
                params.push(endDate);
            }

            const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

            const countSql = `
                SELECT COUNT(*) as total 
                FROM PhotoOrderRequests r
                LEFT JOIN Users u ON r.UserID = u.UserID
                ${whereSql}
            `;
            const totalRows = await queryAsync(countSql, params);
            const total = totalRows[0].total;

            const listSql = `
                SELECT 
                    r.RequestID, r.RequestCode, r.RequestStatus, r.CustomerNotes,
                    r.SubTotal, r.DeliveryCharges, r.Discount, r.GrandTotal,
                    r.CreatedOrderID, r.AdminReviewerID, r.CreatedAt, r.UpdatedAt,
                    TRIM(CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, ''))) as CustomerName,
                    u.MobileNumber as CustomerMobile,
                    TRIM(CONCAT(COALESCE(au.FirstName, ''), ' ', COALESCE(au.LastName, ''))) as ReviewerName,
                    (SELECT COUNT(*) FROM PhotoOrderItems i WHERE i.RequestID = r.RequestID) as ItemCount
                FROM PhotoOrderRequests r
                LEFT JOIN Users u ON r.UserID = u.UserID
                LEFT JOIN AdminUsers au ON r.AdminReviewerID = au.AdminID
                ${whereSql}
                ORDER BY r.CreatedAt DESC
                LIMIT ? OFFSET ?
            `;
            params.push(parseInt(limit), parseInt(offset));

            const list = await queryAsync(listSql, params);

            return resp.status(200).json({
                Status: 1,
                Total: total,
                Page: parseInt(page),
                Limit: parseInt(limit),
                Requests: list
            });
        } catch (err) {
            console.error('Error fetching admin photo order requests:', err);
            return resp.status(500).json({ Status: 0, Message: 'Internal server error' });
        }
    },

    /**
     * Admin: Claim a request for review
     * PUT /api/admin/photo-orders/claim/:id
     */
    adminClaimRequest: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const adminId = req.AdminID;

            const rows = await queryAsync("SELECT RequestStatus FROM PhotoOrderRequests WHERE RequestID = ?", [requestId]);
            if (!rows || rows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: 'Request not found' });
            }

            const prevStatus = rows[0].RequestStatus;
            await queryAsync(`
                UPDATE PhotoOrderRequests 
                SET AdminReviewerID = ?,
                    RequestStatus = 'UNDER_REVIEW',
                    ReviewedAt = NOW()
                WHERE RequestID = ?
            `, [adminId, requestId]);

            await queryAsync(`
                INSERT INTO PhotoOrderStatusTimeline (RequestID, PreviousStatus, NewStatus, ChangedByRole, ChangedByID, Notes, CreatedAt)
                VALUES (?, ?, 'UNDER_REVIEW', 'ADMIN', ?, 'Admin claimed request for review', NOW())
            `, [requestId, prevStatus, adminId]);

            return resp.status(200).json({ Status: 1, Message: 'Request claimed for review' });
        } catch (err) {
            console.error('Error claiming request:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error claiming request' });
        }
    },

    /**
     * Admin: Prepare or update proposal items and recalculate totals
     * POST /api/admin/photo-orders/prepare-proposal/:id
     */
    adminPrepareProposal: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const adminId = req.AdminID;
            const { items, adminNotes } = req.body;

            if (!items || !Array.isArray(items)) {
                return resp.status(400).json({ Status: 0, Message: 'Items array is required' });
            }

            const reqRows = await queryAsync("SELECT * FROM PhotoOrderRequests WHERE RequestID = ?", [requestId]);
            if (!reqRows || reqRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: 'Request not found' });
            }

            const photoReq = reqRows[0];

            // Replace existing proposal items with updated set
            await queryAsync("DELETE FROM PhotoOrderItems WHERE RequestID = ?", [requestId]);

            const cartItemsForPricing = [];

            for (const it of items) {
                const prodRows = await queryAsync(`
                    SELECT p.ProductName, pv.Price, pv.OfferPrice, pv.AvailableQty, pv.metrictype, pv.metricvalue
                    FROM Products p
                    JOIN ProductVariants pv ON p.ProductID = pv.ProductID
                    WHERE p.ProductID = ? AND pv.VariantID = ?
                `, [it.ProductID, it.VariantID]);

                if (prodRows.length > 0) {
                    const pr = prodRows[0];
                    const unitPrice = parseFloat(it.UnitPrice || pr.OfferPrice || pr.Price || 0);
                    const qty = parseInt(it.Quantity || 1);
                    const lineTotal = parseFloat((unitPrice * qty).toFixed(2));

                    await queryAsync(`
                        INSERT INTO PhotoOrderItems (
                            RequestID, ProductID, VariantID, Quantity, UnitPrice, LineTotal,
                            AvailabilityStatus, AlternativeProductID, AlternativeVariantID, AdminNotes, CreatedAt
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    `, [
                        requestId, it.ProductID, it.VariantID, qty, unitPrice, lineTotal,
                        it.AvailabilityStatus || 'AVAILABLE',
                        it.AlternativeProductID || null,
                        it.AlternativeVariantID || null,
                        it.AdminNotes || null
                    ]);

                    cartItemsForPricing.push({
                        ProductID: it.ProductID,
                        VariantID: it.VariantID,
                        ProductName: pr.ProductName,
                        Quantity: qty,
                        Price: pr.Price,
                        OfferPrice: pr.OfferPrice,
                        metrictype: pr.metrictype,
                        metricvalue: pr.metricvalue
                    });
                }
            }

            // Calculate proposal totals via PricingEngine
            const pricing = await PricingEngine.calculateCart(cartItemsForPricing, null, photoReq.UserID);

            await queryAsync(`
                UPDATE PhotoOrderRequests 
                SET SubTotal = ?,
                    DeliveryCharges = ?,
                    Discount = ?,
                    GrandTotal = ?,
                    AdminNotes = ?,
                    AdminReviewerID = COALESCE(AdminReviewerID, ?),
                    RequestStatus = 'PROPOSAL_DRAFT'
                WHERE RequestID = ?
            `, [
                pricing.SubTotal,
                pricing.DeliveryCharges,
                pricing.TotalSavings || 0,
                pricing.GrandTotal,
                adminNotes || photoReq.AdminNotes || null,
                adminId,
                requestId
            ]);

            await queryAsync(`
                INSERT INTO PhotoOrderStatusTimeline (RequestID, PreviousStatus, NewStatus, ChangedByRole, ChangedByID, Notes, CreatedAt)
                VALUES (?, ?, 'PROPOSAL_DRAFT', 'ADMIN', ?, 'Admin updated proposal draft', NOW())
            `, [requestId, photoReq.RequestStatus, adminId]);

            return resp.status(200).json({
                Status: 1,
                Message: 'Proposal draft prepared successfully',
                Pricing: pricing
            });

        } catch (err) {
            console.error('Error preparing proposal:', err);
            return resp.status(500).json({ Status: 0, Message: 'Internal server error preparing proposal' });
        }
    },

    /**
     * Admin: Finalize and send proposal to customer for confirmation
     * POST /api/admin/photo-orders/send-proposal/:id
     */
    adminSendProposal: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const adminId = req.AdminID;

            const reqRows = await queryAsync("SELECT * FROM PhotoOrderRequests WHERE RequestID = ?", [requestId]);
            if (!reqRows || reqRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: 'Request not found' });
            }

            const photoReq = reqRows[0];
            const itemCountRows = await queryAsync("SELECT COUNT(*) as count FROM PhotoOrderItems WHERE RequestID = ?", [requestId]);
            if (!itemCountRows[0].count) {
                return resp.status(400).json({ Status: 0, Message: 'Cannot send an empty proposal. Add items first.' });
            }

            await queryAsync(`
                UPDATE PhotoOrderRequests 
                SET RequestStatus = 'AWAITING_CUSTOMER_CONFIRMATION',
                    ProposedAt = NOW()
                WHERE RequestID = ?
            `, [requestId]);

            await queryAsync(`
                INSERT INTO PhotoOrderStatusTimeline (RequestID, PreviousStatus, NewStatus, ChangedByRole, ChangedByID, Notes, CreatedAt)
                VALUES (?, ?, 'AWAITING_CUSTOMER_CONFIRMATION', 'ADMIN', ?, 'Admin sent order proposal to customer', NOW())
            `, [requestId, photoReq.RequestStatus, adminId]);

            // Send notification to customer
            try {
                await CommonController.Send_Notification({
                    Title: 'Your Order Proposal is Ready!',
                    Message: `We prepared matching items for request #${photoReq.RequestCode} (Total: ₹${parseFloat(photoReq.GrandTotal).toFixed(2)}). Review and confirm now!`
                }, photoReq.UserID);
            } catch (notifyErr) {
                console.log('Customer proposal notification note:', notifyErr.message);
            }

            return resp.status(200).json({
                Status: 1,
                Message: 'Proposal sent to customer for confirmation'
            });

        } catch (err) {
            console.error('Error sending proposal:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error sending proposal' });
        }
    },

    /**
     * Admin: Cancel request
     * POST /api/admin/photo-orders/cancel/:id
     */
    adminCancelRequest: async (req, resp) => {
        try {
            const requestId = req.params.id;
            const adminId = req.AdminID;
            const { cancelReason } = req.body;

            const reqRows = await queryAsync("SELECT * FROM PhotoOrderRequests WHERE RequestID = ?", [requestId]);
            if (!reqRows || reqRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: 'Request not found' });
            }

            const photoReq = reqRows[0];

            await queryAsync(`
                UPDATE PhotoOrderRequests 
                SET RequestStatus = 'CANCELLED',
                    ResolvedAt = NOW(),
                    AdminNotes = CONCAT(COALESCE(AdminNotes, ''), ' [Cancelled by Admin: ', ?, ']')
                WHERE RequestID = ?
            `, [cancelReason || 'Cancelled by admin', requestId]);

            await queryAsync(`
                INSERT INTO PhotoOrderStatusTimeline (RequestID, PreviousStatus, NewStatus, ChangedByRole, ChangedByID, Notes, CreatedAt)
                VALUES (?, ?, 'CANCELLED', 'ADMIN', ?, ?, NOW())
            `, [requestId, photoReq.RequestStatus, adminId, `Request cancelled by admin: ${cancelReason || 'No reason specified'}`]);

            // Notify user of cancellation
            try {
                await CommonController.Send_Notification({
                    Title: 'Photo Order Update',
                    Message: `Your photo order request #${photoReq.RequestCode} has been cancelled: ${cancelReason || 'Unable to process'}`
                }, photoReq.UserID);
            } catch (notifyErr) {
                console.log('Cancel notification note:', notifyErr.message);
            }

            return resp.status(200).json({
                Status: 1,
                Message: 'Request cancelled successfully'
            });

        } catch (err) {
            console.error('Error cancelling request:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error cancelling request' });
        }
    }
};

module.exports = PhotoOrdersController;
