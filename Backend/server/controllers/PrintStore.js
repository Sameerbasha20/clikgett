// Print store endpoints (/api/print). See services/PrintStore.js for the rules.
const media = require('../utils/media');
const PrintStore = require('../services/PrintStore');
const CartController = require('./Carts');

const { queryAsync } = PrintStore;

const COLOR_MODES = ['BW', 'COLOR'];
const ORIENTATIONS = ['PORTRAIT', 'LANDSCAPE'];

/** The customer's open cart, created when they have none (same shape as Carts.addcart). */
async function openCart(userId) {
    const carts = await queryAsync('SELECT CartID FROM Carts WHERE UserID = ? AND IsOrderLinked = 1 ORDER BY CartID DESC LIMIT 1', [userId]);
    if (carts.length) return carts[0].CartID;
    for (let attempt = 0; attempt < 5; attempt++) {
        const cartId = Math.floor(Math.random() * 1999999) + 1000000;
        try {
            await queryAsync('INSERT INTO Carts SET ?', { CartID: cartId, UserID: userId, isOrderLinked: 1 });
            return cartId;
        } catch (err) {
            if (err.code !== 'ER_DUP_ENTRY') throw err;
        }
    }
    throw new Error('Could not create a cart');
}

const fail = (resp, status, message) => resp.status(status).json({ Status: 0, Message: message });

module.exports = {
    config: async (req, resp) => {
        try {
            return resp.json({ Status: 1, Config: await PrintStore.config() });
        } catch (err) {
            console.error('[print] config failed', err.message);
            return fail(resp, 500, 'Could not load the print store');
        }
    },

    /** Step 1: a signed link the app PUTs the file to (stored privately). */
    uploadUrl: async (req, resp) => {
        try {
            const body = req.body || {};
            const mimeType = String(body.ContentType || '').toLowerCase();
            if (!PrintStore.FILE_TYPES[mimeType]) return fail(resp, 400, 'Upload a PDF, JPG or PNG file.');
            const cfg = await PrintStore.config();
            if (!cfg.Enabled) return fail(resp, 400, 'The print store is closed right now.');
            const key = PrintStore.fileKeyFor(req.UserID, mimeType);
            return resp.json({ Status: 1, Key: key, ContentType: mimeType, UploadUrl: media.uploadUrlFor(key, mimeType, 900) });
        } catch (err) {
            console.error('[print] upload url failed', err.message);
            return fail(resp, 500, 'Could not start the upload');
        }
    },

    /** Step 2: the uploaded file becomes a draft print job with its page count. */
    addFile: async (req, resp) => {
        try {
            const body = req.body || {};
            const key = String(body.Key || '');
            if (!PrintStore.ownsKey(req.UserID, key)) return fail(resp, 400, 'Upload the file first.');
            const ext = key.split('.').pop();
            const mimeType = Object.keys(PrintStore.FILE_TYPES).find((t) => PrintStore.FILE_TYPES[t] === ext);
            let buffer;
            try {
                buffer = await PrintStore.readFile(key);
            } catch (err) {
                if (err.message === 'too_large') return fail(resp, 400, `Files can be up to ${PrintStore.MAX_FILE_MB} MB.`);
                return fail(resp, 400, 'The upload did not finish. Please try again.');
            }
            let pages;
            try {
                pages = await PrintStore.countPages(buffer, mimeType);
            } catch (err) {
                return fail(resp, 400, 'This PDF could not be read. It may be damaged or password-protected.');
            }
            if (!(pages > 0)) return fail(resp, 400, 'This file has no pages to print.');
            const fileName = String(body.FileName || `file.${ext}`).replace(/[\r\n]/g, ' ').slice(0, 200);
            const result = await queryAsync('INSERT INTO PrintJobs SET ?', {
                UserID: req.UserID, FileKey: key, FileName: fileName, MimeType: mimeType, Pages: pages, Status: 'DRAFT',
            });
            const [job] = await queryAsync('SELECT * FROM PrintJobs WHERE PrintJobID = ?', [result.insertId]);
            return resp.json({ Status: 1, PrintJob: PrintStore.present(job) });
        } catch (err) {
            console.error('[print] add file failed', err.message);
            return fail(resp, 500, 'Could not read the file');
        }
    },

    /** Step 3: chosen settings; the jobs join the customer's cart. */
    addToCart: async (req, resp) => {
        try {
            const jobs = Array.isArray((req.body || {}).Jobs) ? req.body.Jobs : [];
            if (!jobs.length) return fail(resp, 400, 'Add at least one file.');
            const cfg = await PrintStore.config();
            if (!cfg.Enabled) return fail(resp, 400, 'The print store is closed right now.');
            const ids = jobs.map((j) => parseInt(j.PrintJobID, 10)).filter((n) => n > 0);
            const owned = await queryAsync(
                "SELECT * FROM PrintJobs WHERE PrintJobID IN (?) AND UserID = ? AND Status IN ('DRAFT', 'IN_CART')", [ids, req.UserID]);
            if (owned.length !== ids.length) return fail(resp, 400, 'Some files are no longer available. Please upload them again.');
            const cartId = await openCart(req.UserID);
            for (const j of jobs) {
                const job = owned.find((o) => o.PrintJobID === parseInt(j.PrintJobID, 10));
                const settings = {
                    Copies: j.Copies,
                    ColorMode: COLOR_MODES.includes(j.ColorMode) ? j.ColorMode : 'BW',
                    Orientation: ORIENTATIONS.includes(j.Orientation) ? j.Orientation : 'PORTRAIT',
                };
                const price = PrintStore.priceJob({ ...job, ...settings }, cfg);
                await queryAsync(
                    "UPDATE PrintJobs SET CartID = ?, Status = 'IN_CART', Copies = ?, ColorMode = ?, Orientation = ?, UnitPrice = ?, LineTotal = ? WHERE PrintJobID = ?",
                    [cartId, price.Copies, settings.ColorMode, settings.Orientation, price.UnitPrice, price.LineTotal, job.PrintJobID]
                );
            }
            await CartController.touchCartActivity(cartId);
            return resp.json({ Status: 1, Message: 'Added to cart', PrintJobs: await PrintStore.cartJobs(cartId) });
        } catch (err) {
            console.error('[print] add to cart failed', err.message);
            return fail(resp, 500, 'Could not add the prints to your cart');
        }
    },

    cart: async (req, resp) => {
        try {
            const carts = await queryAsync('SELECT CartID FROM Carts WHERE UserID = ? AND IsOrderLinked = 1 ORDER BY CartID DESC LIMIT 1', [req.UserID]);
            return resp.json({ Status: 1, PrintJobs: carts.length ? await PrintStore.cartJobs(carts[0].CartID) : [] });
        } catch (err) {
            console.error('[print] cart failed', err.message);
            return fail(resp, 500, 'Could not load your prints');
        }
    },

    /** Change copies (or colour / orientation) of a job in the cart. */
    updateCartJob: async (req, resp) => {
        try {
            const id = parseInt(req.params.PrintJobID, 10);
            const [job] = await queryAsync("SELECT * FROM PrintJobs WHERE PrintJobID = ? AND UserID = ? AND Status = 'IN_CART'", [id, req.UserID]);
            if (!job) return fail(resp, 404, 'This print is not in your cart');
            const body = req.body || {};
            const settings = {
                Copies: body.Copies !== undefined ? body.Copies : job.Copies,
                ColorMode: COLOR_MODES.includes(body.ColorMode) ? body.ColorMode : job.ColorMode,
                Orientation: ORIENTATIONS.includes(body.Orientation) ? body.Orientation : job.Orientation,
            };
            const price = PrintStore.priceJob({ ...job, ...settings }, await PrintStore.config());
            await queryAsync(
                'UPDATE PrintJobs SET Copies = ?, ColorMode = ?, Orientation = ?, UnitPrice = ?, LineTotal = ? WHERE PrintJobID = ?',
                [price.Copies, settings.ColorMode, settings.Orientation, price.UnitPrice, price.LineTotal, id]
            );
            return resp.json({ Status: 1, Message: 'Updated' });
        } catch (err) {
            console.error('[print] update failed', err.message);
            return fail(resp, 500, 'Could not update the print');
        }
    },

    removeCartJob: async (req, resp) => {
        try {
            const result = await queryAsync(
                "UPDATE PrintJobs SET CartID = NULL, Status = 'DRAFT' WHERE PrintJobID = ? AND UserID = ? AND Status = 'IN_CART'",
                [parseInt(req.params.PrintJobID, 10), req.UserID]);
            if (!result.affectedRows) return fail(resp, 404, 'This print is not in your cart');
            return resp.json({ Status: 1, Message: 'Removed from cart' });
        } catch (err) {
            console.error('[print] remove failed', err.message);
            return fail(resp, 500, 'Could not remove the print');
        }
    },

    /** Admin: files to print for an order (links valid for an hour). */
    adminOrderJobs: async (req, resp) => {
        try {
            return resp.json({ Status: 1, PrintJobs: await PrintStore.orderJobs(parseInt(req.params.OrderID, 10)) });
        } catch (err) {
            console.error('[print] admin order jobs failed', err.message);
            return fail(resp, 500, 'Could not load the print files');
        }
    },
};
