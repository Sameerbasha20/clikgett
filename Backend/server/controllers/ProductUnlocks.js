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

const ProductUnlocksController = {
    // List all configured product unlocks
    getUnlocks: async (req, res) => {
        try {
            const sql = `
                SELECT pu.*, p.ProductName, p.ProductImages, 
                       COALESCE(pv.OfferPrice, 0) as OfferPrice, 
                       COALESCE(pv.Price, 0) as Price
                FROM product_unlocks pu
                JOIN Products p ON pu.ProductID = p.ProductID
                LEFT JOIN ProductVariants pv ON (pu.VariantID IS NOT NULL AND pu.VariantID = pv.VariantID) 
                                             OR (pu.VariantID IS NULL AND p.ProductID = pv.ProductID)
                GROUP BY pu.UnlockID
                ORDER BY pu.ThresholdAmount ASC
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
            const { ThresholdAmount, ProductID, VariantID, UnlockPrice, Message, StartDate, EndDate, Status } = req.body;
            const threshold = parseFloat(ThresholdAmount);
            const productId = parseInt(ProductID, 10);

            if (isNaN(threshold) || threshold <= 0) {
                return res.status(400).json({ Status: 0, status: 0, Message: "Valid threshold amount is required", message: "Valid threshold amount is required" });
            }
            if (isNaN(productId) || productId <= 0) {
                return res.status(400).json({ Status: 0, status: 0, Message: "Valid ProductID is required", message: "Valid ProductID is required" });
            }

            const unlockPriceVal = (UnlockPrice !== undefined && UnlockPrice !== null && UnlockPrice !== '') ? parseFloat(UnlockPrice) : null;

            const insertSql = `
                INSERT INTO product_unlocks
                (ThresholdAmount, ProductID, VariantID, UnlockPrice, Message, StartDate, EndDate, Status, CreatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            const result = await queryAsync(insertSql, [
                threshold,
                productId,
                VariantID || null,
                unlockPriceVal,
                Message || null,
                toDbTime(StartDate),
                toDbTime(EndDate),
                Status !== undefined ? Status : 1
            ]);

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
            const UnlockID = req.params.UnlockID || req.body.UnlockID;
            const { ThresholdAmount, ProductID, VariantID, UnlockPrice, Message, StartDate, EndDate, Status } = req.body;

            const unlockPriceVal = (UnlockPrice !== undefined && UnlockPrice !== null && UnlockPrice !== '') ? parseFloat(UnlockPrice) : null;

            const updateSql = `
                UPDATE product_unlocks
                SET ThresholdAmount = ?, ProductID = ?, VariantID = ?, UnlockPrice = ?, Message = ?, StartDate = ?, EndDate = ?, Status = ?
                WHERE UnlockID = ?
            `;
            await queryAsync(updateSql, [
                parseFloat(ThresholdAmount),
                parseInt(ProductID, 10),
                VariantID || null,
                unlockPriceVal,
                Message || null,
                toDbTime(StartDate),
                toDbTime(EndDate),
                Status !== undefined ? Status : 1,
                UnlockID
            ]);

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
