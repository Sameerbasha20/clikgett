// Welcome offer and "Our app: X% lower" price tags: customer reads and admin management.
const pool = require('../utils/db');
const CommonController = require('./CommonController');
const WelcomeOffer = require('../services/WelcomeOffer');

const PRODUCT_IMAGES = 'http://clikgett-media.local/Products/';

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const firstImage = (raw) => {
    try {
        const list = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
        const img = list.find(Boolean);
        return img ? (String(img).startsWith('http') ? img : PRODUCT_IMAGES + img) : null;
    } catch (e) {
        return null;
    }
};

const fail = (resp, code, message) => resp.status(code).json({ Status: 0, Message: message });

const validPercent = (v) => {
    const n = parseInt(v, 10);
    return n >= 1 && n <= 90 ? n : null;
};

module.exports = {
    // ---------------- Customer ----------------

    // GET /promotions/welcome: the offer card (guests see it as a new customer).
    welcome: async (req, resp) => {
        try {
            const offer = await WelcomeOffer.forUser(req.UserID || null);
            return resp.json({ Status: 1, Offer: offer });
        } catch (e) {
            console.error('welcome offer failed', e.message);
            return fail(resp, 500, 'Could not load the offer');
        }
    },

    // GET /promotions/price-compare: products tagged "X% lower", in the admin's order.
    priceCompareProducts: async (req, resp) => {
        try {
            const results = await CommonController.getproducts(
                `select p.* from Products p join ProductPriceCompare c on c.ProductID = p.ProductID
                  where p.Status = 1 and c.Status = 1
                  order by c.SortOrder asc, p.ProductName asc limit 0,50`);
            return resp.json({ Status: 1, Products: results || [] });
        } catch (e) {
            console.error('price compare products failed', e && e.message);
            return fail(resp, 500, 'Could not load products');
        }
    },

    // ---------------- Admin ----------------

    adminWelcome: async (req, resp) => {
        try {
            const [offer, stats] = await Promise.all([WelcomeOffer.config(), WelcomeOffer.stats()]);
            return resp.json({ Status: 1, Offer: offer, Stats: stats });
        } catch (e) {
            console.error('admin welcome offer failed', e.message);
            return fail(resp, 500, 'Could not load the welcome offer');
        }
    },

    adminSaveWelcome: async (req, resp) => {
        try {
            const error = await WelcomeOffer.save(req.body || {});
            if (error) return fail(resp, 400, error);
            return resp.json({ Status: 1, Message: 'Welcome offer saved', Offer: await WelcomeOffer.config() });
        } catch (e) {
            console.error('save welcome offer failed', e.message);
            return fail(resp, 500, 'Could not save the welcome offer');
        }
    },

    // Products with a tag, with photo and price, in display order.
    adminPriceCompare: async (req, resp) => {
        try {
            const rows = await queryAsync(
                `SELECT c.ProductID, c.PercentLower, c.SortOrder, c.Status, c.UpdatedAt,
                        p.ProductName, p.ProductImages, p.Status AS ProductStatus,
                        v.Price AS MRP, v.OfferPrice, CONCAT(v.metricvalue, ' ', v.metrictype) AS Unit
                   FROM ProductPriceCompare c
                   JOIN Products p ON p.ProductID = c.ProductID
                   LEFT JOIN ProductVariants v ON v.VariantID =
                        (SELECT MIN(v2.VariantID) FROM ProductVariants v2 WHERE v2.ProductID = p.ProductID AND v2.status = 1)
                  ORDER BY c.SortOrder ASC, p.ProductName ASC`);
            return resp.json({
                Status: 1,
                Items: rows.map((r) => ({ ...r, ProductImages: undefined, Image: firstImage(r.ProductImages) })),
            });
        } catch (e) {
            console.error('admin price compare failed', e.message);
            return fail(resp, 500, 'Could not load the price tags');
        }
    },

    // GET /promotions/admin/products?q=: product search with photos for the picker.
    adminProductSearch: async (req, resp) => {
        try {
            const q = String(req.query.q || '').trim();
            if (q.length < 2) return resp.json({ Status: 1, Products: [] });
            const like = `%${q}%`;
            const rows = await queryAsync(
                `SELECT p.ProductID, p.ProductName, p.ProductImages, v.Price AS MRP, v.OfferPrice,
                        CONCAT(v.metricvalue, ' ', v.metrictype) AS Unit,
                        (c.ProductID IS NOT NULL) AS Tagged
                   FROM Products p
                   JOIN ProductVariants v ON v.VariantID =
                        (SELECT MIN(v2.VariantID) FROM ProductVariants v2 WHERE v2.ProductID = p.ProductID AND v2.status = 1)
                   LEFT JOIN ProductPriceCompare c ON c.ProductID = p.ProductID
                  WHERE p.Status = 1 AND (p.ProductName LIKE ? OR p.SearchKeywords LIKE ?)
                  ORDER BY (p.ProductName LIKE ?) DESC, p.ProductName ASC
                  LIMIT 20`, [like, like, `${q}%`]);
            return resp.json({
                Status: 1,
                Products: rows.map((r) => ({ ...r, Tagged: Number(r.Tagged) === 1, ProductImages: undefined, Image: firstImage(r.ProductImages) })),
            });
        } catch (e) {
            console.error('price compare product search failed', e.message);
            return fail(resp, 500, 'Could not search products');
        }
    },

    // POST { ProductID, PercentLower }: add a product (or change its percentage).
    adminAddPriceCompare: async (req, resp) => {
        try {
            const productId = parseInt(req.body && req.body.ProductID, 10);
            const pct = validPercent(req.body && req.body.PercentLower);
            if (!(productId > 0)) return fail(resp, 400, 'Choose a product.');
            if (pct == null) return fail(resp, 400, 'Percentage must be between 1 and 90.');
            const [product] = await queryAsync('SELECT ProductID FROM Products WHERE ProductID = ? AND Status != 0', [productId]);
            if (!product) return fail(resp, 404, 'Product not found.');
            const [last] = await queryAsync('SELECT COALESCE(MAX(SortOrder), 0) AS n FROM ProductPriceCompare');
            await queryAsync(
                `INSERT INTO ProductPriceCompare (ProductID, PercentLower, SortOrder, Status) VALUES (?, ?, ?, 1)
                 ON DUPLICATE KEY UPDATE PercentLower = VALUES(PercentLower), Status = 1`,
                [productId, pct, (Number(last && last.n) || 0) + 1]);
            return resp.json({ Status: 1, Message: 'Price tag saved' });
        } catch (e) {
            console.error('add price compare failed', e.message);
            return fail(resp, 500, 'Could not save the price tag');
        }
    },

    // PUT /:id { PercentLower?, Status? }
    adminUpdatePriceCompare: async (req, resp) => {
        try {
            const productId = parseInt(req.params.id, 10);
            const sets = [];
            const params = [];
            if (req.body.PercentLower !== undefined) {
                const pct = validPercent(req.body.PercentLower);
                if (pct == null) return fail(resp, 400, 'Percentage must be between 1 and 90.');
                sets.push('PercentLower = ?');
                params.push(pct);
            }
            if (req.body.Status !== undefined) {
                sets.push('Status = ?');
                params.push(Number(req.body.Status) ? 1 : 0);
            }
            if (!sets.length) return fail(resp, 400, 'Nothing to change.');
            const r = await queryAsync(`UPDATE ProductPriceCompare SET ${sets.join(', ')} WHERE ProductID = ?`, [...params, productId]);
            if (!r.affectedRows) return fail(resp, 404, 'Price tag not found.');
            return resp.json({ Status: 1, Message: 'Price tag updated' });
        } catch (e) {
            console.error('update price compare failed', e.message);
            return fail(resp, 500, 'Could not update the price tag');
        }
    },

    // POST /order { ProductIDs: [...] }: display order, first = top.
    adminOrderPriceCompare: async (req, resp) => {
        try {
            const ids = (Array.isArray(req.body && req.body.ProductIDs) ? req.body.ProductIDs : [])
                .map((n) => parseInt(n, 10)).filter((n) => n > 0);
            if (!ids.length) return fail(resp, 400, 'No products to sort.');
            await Promise.all(ids.map((id, i) =>
                queryAsync('UPDATE ProductPriceCompare SET SortOrder = ? WHERE ProductID = ?', [i + 1, id])));
            return resp.json({ Status: 1, Message: 'Order saved' });
        } catch (e) {
            console.error('order price compare failed', e.message);
            return fail(resp, 500, 'Could not save the order');
        }
    },

    adminDeletePriceCompare: async (req, resp) => {
        try {
            const r = await queryAsync('DELETE FROM ProductPriceCompare WHERE ProductID = ?', [parseInt(req.params.id, 10)]);
            if (!r.affectedRows) return fail(resp, 404, 'Price tag not found.');
            return resp.json({ Status: 1, Message: 'Price tag removed' });
        } catch (e) {
            console.error('delete price compare failed', e.message);
            return fail(resp, 500, 'Could not remove the price tag');
        }
    },
};
