const pool = require('../utils/db');
const { toDbTime } = require('../utils/dbTime');

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

const MAX_DEAL_QTY = 20;

/**
 * Validates an unlock rule from the admin form. The deal price is required (₹0 = free),
 * the pack must belong to the product, and at most MaxQtyPerOrder units get the price.
 */
async function readRule(body) {
    const threshold = parseFloat(body.ThresholdAmount);
    const productId = parseInt(body.ProductID, 10);
    const variantId = body.VariantID ? parseInt(body.VariantID, 10) : null;
    const unlockPrice = body.UnlockPrice === '' || body.UnlockPrice === null || body.UnlockPrice === undefined
        ? NaN : parseFloat(body.UnlockPrice);
    const maxQty = body.MaxQtyPerOrder === undefined || body.MaxQtyPerOrder === '' ? 1 : parseInt(body.MaxQtyPerOrder, 10);
    if (!(threshold > 0)) return { error: 'Enter the cart value that unlocks the deal' };
    if (!(productId > 0)) return { error: 'Choose a product' };
    if (Number.isNaN(unlockPrice) || unlockPrice < 0) return { error: 'Enter the deal price (0 for free)' };
    if (!(maxQty >= 1 && maxQty <= MAX_DEAL_QTY)) return { error: `Limit per order must be between 1 and ${MAX_DEAL_QTY}` };
    const packs = await queryAsync(
        'SELECT VariantID, COALESCE(NULLIF(OfferPrice, 0), Price) AS Selling FROM ProductVariants WHERE ProductID = ? AND Status = 1',
        [productId]);
    if (!packs.length) return { error: 'This product has no active pack' };
    const pack = variantId ? packs.find((p) => p.VariantID === variantId) : null;
    if (variantId && !pack) return { error: 'That pack does not belong to this product' };
    if (pack && unlockPrice >= parseFloat(pack.Selling)) {
        return { error: `The deal price must be below the normal price (₹${parseFloat(pack.Selling)})` };
    }
    const message = String(body.Message || body.UnlockMessage || '').trim().slice(0, 255) || null;
    return {
        threshold,
        productId,
        variantId,
        unlockPrice,
        maxQty,
        message,
        startDate: toDbTime(body.StartDate),
        endDate: toDbTime(body.EndDate),
        status: body.Status !== undefined && body.Status !== '' ? (parseInt(body.Status, 10) === 1 ? 1 : 0) : 1,
    };
}

const ProductUnlocksController = {
    // List all configured product unlocks
    getUnlocks: async (req, res) => {
        try {
            // VariantID is the rule's pack, or the product's first active pack when none was chosen
            // (the same pack the pricing engine and the deals screen use).
            const sql = `
                SELECT pu.UnlockID, pu.ProductID, pv.VariantID, pu.VariantID AS RuleVariantID, pu.ThresholdAmount,
                       pu.UnlockPrice, pu.Message, pu.Message AS UnlockMessage, pu.StartDate, pu.EndDate, pu.Status,
                       COALESCE(pu.MaxQtyPerOrder, 1) AS MaxQtyPerOrder,
                       p.ProductName, p.ProductImages,
                       COALESCE(pv.OfferPrice, 0) AS OfferPrice, COALESCE(pv.Price, 0) AS Price,
                       pv.metricvalue, pv.metrictype, GREATEST(COALESCE(pv.AvailableQty, 0), 0) AS AvailableQty
                FROM product_unlocks pu
                JOIN Products p ON pu.ProductID = p.ProductID
                LEFT JOIN ProductVariants pv ON pv.VariantID = COALESCE(pu.VariantID,
                     (SELECT MIN(v2.VariantID) FROM ProductVariants v2 WHERE v2.ProductID = pu.ProductID AND v2.Status = 1))
                ORDER BY pu.UnlockPrice ASC, pu.ThresholdAmount ASC
            `;
            const unlocks = await queryAsync(sql);
            const list = unlocks || [];
            return res.json({ Status: 1, status: 1, Unlocks: list, data: list });
        } catch (err) {
            console.error("Error fetching product unlocks:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error fetching product unlocks", message: "Error fetching product unlocks" });
        }
    },

    // Create a new product unlock rule
    createUnlock: async (req, res) => {
        try {
            const rule = await readRule(req.body || {});
            if (rule.error) return res.status(400).json({ Status: 0, status: 0, Message: rule.error, message: rule.error });
            const result = await queryAsync(
                `INSERT INTO product_unlocks
                 (ThresholdAmount, ProductID, VariantID, UnlockPrice, MaxQtyPerOrder, Message, StartDate, EndDate, Status, CreatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [rule.threshold, rule.productId, rule.variantId, rule.unlockPrice, rule.maxQty, rule.message,
                    rule.startDate, rule.endDate, rule.status]
            );
            return res.json({
                Status: 1,
                status: 1,
                Message: "Product unlock created successfully",
                message: "Product unlock created successfully",
                UnlockID: result.insertId
            });
        } catch (err) {
            console.error("Error creating product unlock:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error creating product unlock", message: "Error creating product unlock" });
        }
    },

    // Update product unlock rule
    updateUnlock: async (req, res) => {
        try {
            const UnlockID = req.params.UnlockID || (req.body || {}).UnlockID;
            const rule = await readRule(req.body || {});
            if (rule.error) return res.status(400).json({ Status: 0, status: 0, Message: rule.error, message: rule.error });
            const result = await queryAsync(
                `UPDATE product_unlocks
                    SET ThresholdAmount = ?, ProductID = ?, VariantID = ?, UnlockPrice = ?, MaxQtyPerOrder = ?, Message = ?,
                        StartDate = ?, EndDate = ?, Status = ?
                  WHERE UnlockID = ?`,
                [rule.threshold, rule.productId, rule.variantId, rule.unlockPrice, rule.maxQty, rule.message,
                    rule.startDate, rule.endDate, rule.status, UnlockID]
            );
            if (!result.affectedRows) return res.status(404).json({ Status: 0, status: 0, Message: "Rule not found", message: "Rule not found" });
            return res.json({ Status: 1, status: 1, Message: "Product unlock updated successfully", message: "Product unlock updated successfully" });
        } catch (err) {
            console.error("Error updating product unlock:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error updating product unlock", message: "Error updating product unlock" });
        }
    },

    // Delete product unlock rule
    deleteUnlock: async (req, res) => {
        try {
            const UnlockID = req.params.UnlockID;
            await queryAsync("DELETE FROM product_unlocks WHERE UnlockID = ?", [UnlockID]);
            return res.json({ Status: 1, status: 1, Message: "Product unlock deleted successfully", message: "Product unlock deleted successfully" });
        } catch (err) {
            console.error("Error deleting product unlock:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error deleting product unlock", message: "Error deleting product unlock" });
        }
    },

    // Customer deals screen: every active unlock with how much more the cart needs.
    // Uses the checkout bill, so "unlocked" here is exactly what the cart will charge.
    deals: async (req, res) => {
        try {
            const rows = await queryAsync(`
                SELECT pu.UnlockID, pu.ProductID, v.VariantID, pu.ThresholdAmount, pu.UnlockPrice, pu.Message,
                       COALESCE(pu.MaxQtyPerOrder, 1) AS DealLimit,
                       p.ProductName, p.ImageUrl, p.ProductImages, p.CategoryID, p.SubCategoryID,
                       v.Price, v.OfferPrice, v.metricvalue, v.metrictype, v.AvailableQty, v.maxQty
                  FROM product_unlocks pu
                  JOIN Products p ON p.ProductID = pu.ProductID AND p.Status = 1
                  JOIN ProductVariants v ON v.VariantID = COALESCE(pu.VariantID,
                       (SELECT MIN(v2.VariantID) FROM ProductVariants v2 WHERE v2.ProductID = pu.ProductID AND v2.Status = 1))
                 WHERE pu.Status = 1
                   AND (pu.StartDate IS NULL OR pu.StartDate <= NOW())
                   AND (pu.EndDate IS NULL OR pu.EndDate >= NOW())
                 ORDER BY pu.UnlockPrice ASC, pu.ThresholdAmount ASC`);
            const progress = new Map();
            const cartQty = new Map();
            if (req.UserID) {
                const bill = await require('../services/CheckoutBill').computeBill({ userId: req.UserID });
                (bill.ProductUnlocks || []).forEach((u) => progress.set(u.UnlockID, u));
                (bill.Items || []).forEach((i) => cartQty.set(`${i.ProductID}:${i.VariantID}`, parseInt(i.Quantity, 10) || 0));
            }
            const image = (r) => {
                let img = r.ImageUrl && r.ImageUrl !== 'NA' ? r.ImageUrl : null;
                if (!img) {
                    try {
                        const list = JSON.parse(r.ProductImages || '[]');
                        if (list.length) img = list[0];
                    } catch (_) { /* no images */ }
                }
                return img ? (String(img).startsWith('http') ? img : `http://clikgett-media.local/Products/${img}`) : null;
            };
            const deals = rows.map((r) => {
                const p = progress.get(r.UnlockID);
                const threshold = parseFloat(r.ThresholdAmount) || 0;
                return {
                    UnlockID: r.UnlockID,
                    ProductID: r.ProductID,
                    VariantID: r.VariantID,
                    ProductName: r.ProductName,
                    ImageUrl: image(r),
                    Unit: r.metrictype ? `${parseFloat(r.metricvalue)} ${r.metrictype}` : '',
                    Price: parseFloat(r.Price) || 0,
                    OfferPrice: parseFloat(r.OfferPrice || r.Price) || 0,
                    UnlockPrice: parseFloat(r.UnlockPrice) || 0,
                    ThresholdAmount: threshold,
                    IsUnlocked: p ? p.IsUnlocked === true : false,
                    AmountNeeded: p ? p.AmountNeeded : threshold + 1,
                    InStock: (parseInt(r.AvailableQty, 10) || 0) > 0,
                    MaxQty: Math.min(parseInt(r.AvailableQty, 10) || 0, parseInt(r.maxQty, 10) || 99),
                    DealLimit: parseInt(r.DealLimit, 10) || 1,
                    InCart: cartQty.get(`${r.ProductID}:${r.VariantID}`) || 0,
                    Message: r.Message || null,
                    CategoryID: r.CategoryID,
                    SubCategoryID: r.SubCategoryID,
                };
            });
            const locked = deals.filter((d) => !d.IsUnlocked && d.InStock).sort((a, b) => a.AmountNeeded - b.AmountNeeded);
            return res.json({
                Status: 1,
                Deals: deals,
                NextUnlock: locked.length
                    ? { AmountNeeded: locked[0].AmountNeeded, ThresholdAmount: locked[0].ThresholdAmount, UnlockPrice: locked[0].UnlockPrice }
                    : null,
                LoggedIn: !!req.UserID,
            });
        } catch (err) {
            console.error('Error loading unlock deals:', err.message);
            return res.status(500).json({ Status: 0, Message: 'Could not load the deals' });
        }
    }
};

module.exports = ProductUnlocksController;
