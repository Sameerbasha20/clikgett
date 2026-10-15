const pool = require('../utils/db');

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
                StartDate || null,
                EndDate || null,
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
                StartDate || null,
                EndDate || null,
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
    }
};

module.exports = ProductUnlocksController;
