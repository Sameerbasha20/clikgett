// Admin Stock page (/api/admin-stock): every product pack with what is left, quick
// "add stock", and the out-of-stock alerts the admin panel polls for its reminder.
// (The older Out-of-stock page uses controllers/AdminStock.js.)
const pool = require('../utils/db');

const LOW_STOCK = 10;
const MAX_ADD = 100000;
const PRODUCTS_MEDIA = 'http://clikgett-media.local/Products/';

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const imageOf = (row) => {
    let img = row.ImageUrl && row.ImageUrl !== 'NA' ? row.ImageUrl : null;
    if (!img) {
        try {
            const list = JSON.parse(row.ProductImages || '[]');
            if (list.length) img = list[0];
        } catch (_) { /* no images */ }
    }
    if (!img) return null;
    return String(img).startsWith('http') ? img : PRODUCTS_MEDIA + img;
};

const STOCK_SQL = `
    SELECT p.ProductID, p.ProductName, p.ImageUrl, p.ProductImages, p.Status AS ProductStatus,
           c.CategoryName, s.SubCategoryName,
           v.VariantID, v.metricvalue, v.metrictype, v.Price, v.OfferPrice, v.Status AS VariantStatus,
           GREATEST(COALESCE(v.AvailableQty, 0), 0) AS AvailableQty, v.UpdatedAt
      FROM ProductVariants v
      JOIN Products p ON p.ProductID = v.ProductID
      LEFT JOIN Categories c ON c.CategoryID = p.CategoryID
      LEFT JOIN SubCategories s ON s.SubCategoryID = p.SubCategoryID
     WHERE p.Status <> 2`;

function stockState(qty) {
    if (qty <= 0) return 'OUT';
    return qty < LOW_STOCK ? 'LOW' : 'OK';
}

function present(row) {
    const qty = parseInt(row.AvailableQty, 10) || 0;
    return {
        ProductID: row.ProductID,
        VariantID: row.VariantID,
        ProductName: String(row.ProductName || '').trim(),
        Unit: row.metrictype ? `${parseFloat(row.metricvalue)} ${row.metrictype}` : '',
        CategoryName: row.CategoryName || '',
        SubCategoryName: row.SubCategoryName || '',
        ImageUrl: imageOf(row),
        Price: parseFloat(row.Price) || 0,
        OfferPrice: parseFloat(row.OfferPrice) || 0,
        AvailableQty: qty,
        Active: Number(row.ProductStatus) === 1 && Number(row.VariantStatus) === 1,
        StockState: stockState(qty),
        UpdatedAt: row.UpdatedAt,
    };
}

module.exports = {
    LOW_STOCK,

    list: async (req, resp) => {
        try {
            const rows = (await queryAsync(`${STOCK_SQL} ORDER BY p.ProductName ASC, v.VariantID ASC`)).map(present);
            const live = rows.filter((r) => r.Active);
            return resp.json({
                Status: 1,
                Stock: rows,
                Summary: {
                    Packs: live.length,
                    OutOfStock: live.filter((r) => r.StockState === 'OUT').length,
                    LowStock: live.filter((r) => r.StockState === 'LOW').length,
                    LowStockBelow: LOW_STOCK,
                },
            });
        } catch (err) {
            console.error('[stock] list failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not load stock' });
        }
    },

    /** Adds stock to one pack (negative stock from oversells counts from 0). */
    add: async (req, resp) => {
        try {
            const variantId = parseInt(req.params.VariantID, 10);
            const quantity = parseInt((req.body || {}).Quantity, 10);
            if (!(variantId > 0)) return resp.status(400).json({ Status: 0, Message: 'Choose a product pack' });
            if (!(quantity > 0) || quantity > MAX_ADD) {
                return resp.status(400).json({ Status: 0, Message: `Enter a quantity between 1 and ${MAX_ADD}` });
            }
            const result = await queryAsync(
                'UPDATE ProductVariants SET AvailableQty = GREATEST(COALESCE(AvailableQty, 0), 0) + ?, UpdatedAt = NOW() WHERE VariantID = ?',
                [quantity, variantId]);
            if (!result.affectedRows) return resp.status(404).json({ Status: 0, Message: 'Product pack not found' });
            const [row] = await queryAsync(`${STOCK_SQL} AND v.VariantID = ?`, [variantId]);
            console.log(`[stock] admin ${req.AdminID} added ${quantity} to variant ${variantId}`);
            return resp.json({
                Status: 1,
                Message: `Added ${quantity}. Now ${row ? row.AvailableQty : '?'} in stock.`,
                Item: row ? present(row) : null,
            });
        } catch (err) {
            console.error('[stock] add failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not update stock' });
        }
    },

    /** Live packs with nothing left (the admin panel shows a reminder). */
    alerts: async (req, resp) => {
        try {
            const rows = (await queryAsync(
                `${STOCK_SQL} AND p.Status = 1 AND v.Status = 1 AND COALESCE(v.AvailableQty, 0) <= 0
                 ORDER BY v.UpdatedAt DESC, p.ProductName ASC`
            )).map(present);
            return resp.json({ Status: 1, OutOfStock: rows.length, VariantIDs: rows.map((r) => r.VariantID), Items: rows.slice(0, 20) });
        } catch (err) {
            console.error('[stock] alerts failed', err.message);
            return resp.status(500).json({ Status: 0, Message: 'Could not load stock alerts' });
        }
    },
};
