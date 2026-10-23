const pool = require('../utils/db');
const { toDbTime } = require('../utils/dbTime');

const BuyMoreController = {
    // Get all tiers for a product or variant
    getTiers: async (req, res) => {
        try {
            const { ProductID, VariantID } = req.query;
            let sql = `
                SELECT bmc.*, bmc.MinQuantity as Quantity, p.ProductName, pv.metrictype, pv.metricvalue, pv.Price as BasePrice
                FROM buy_more_config bmc
                LEFT JOIN Products p ON bmc.ProductID = p.ProductID
                LEFT JOIN ProductVariants pv ON bmc.VariantID = pv.VariantID
                WHERE 1=1
            `;
            const params = [];

            if (ProductID) {
                sql += " AND bmc.ProductID = ?";
                params.push(parseInt(ProductID, 10));
            }
            if (VariantID) {
                sql += " AND bmc.VariantID = ?";
                params.push(parseInt(VariantID, 10));
            }

            sql += " ORDER BY bmc.ProductID, bmc.VariantID, bmc.MinQuantity ASC";

            pool.query(sql, params, (err, rows) => {
                if (err) {
                    console.error("Error fetching buy more tiers:", err);
                    return res.status(500).json({ Status: 0, Message: "Error fetching pricing tiers" });
                }
                return res.json({ Status: 1, Tiers: rows || [] });
            });
        } catch (err) {
            console.error("Exception in getTiers:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    // Save multiple quantity pricing points for a product at once
    saveProductTiers: async (req, res) => {
        try {
            const ProductID = req.body.ProductID || req.body.productId;
            const VariantID = req.body.VariantID || req.body.variantId || null;
            const items = req.body.items || req.body.tiers || req.body.Tiers || [];
            const StartDate = req.body.StartDate || req.body.startDate || null;
            const EndDate = req.body.EndDate || req.body.endDate || null;
            const Status = req.body.Status !== undefined ? req.body.Status : (req.body.status !== undefined ? req.body.status : 1);
            const AdminID = (req.user && req.user.AdminID) || req.body.CreatedBy || null;

            if (!ProductID || isNaN(parseInt(ProductID, 10))) {
                return res.status(400).json({ Status: 0, Message: "Valid ProductID is required" });
            }

            const cleanProductID = parseInt(ProductID, 10);
            const cleanVariantID = (VariantID && !isNaN(parseInt(VariantID, 10))) ? parseInt(VariantID, 10) : null;

            // Validate all items
            const parsedItems = [];
            const seenQuantities = new Set();

            if (Array.isArray(items)) {
                for (const item of items) {
                    if (!item) continue;
                    const rawQty = item.Quantity !== undefined ? item.Quantity : (item.quantity !== undefined ? item.quantity : item.MinQuantity);
                    const rawPrice = item.Price !== undefined ? item.Price : (item.price !== undefined ? item.price : item.OfferPrice);

                    // Skip empty/blank rows
                    if ((rawQty === "" || rawQty === null || rawQty === undefined) && 
                        (rawPrice === "" || rawPrice === null || rawPrice === undefined)) {
                        continue;
                    }

                    const qty = parseInt(rawQty, 10);
                    const price = parseFloat(rawPrice);

                    if (isNaN(qty) || qty < 1) {
                        return res.status(400).json({ Status: 0, Message: "Quantity must be a positive integer" });
                    }
                    if (seenQuantities.has(qty)) {
                        return res.status(400).json({ Status: 0, Message: `Duplicate quantity detected: ${qty}. Each quantity tier must be unique.` });
                    }
                    seenQuantities.add(qty);

                    if (isNaN(price) || price < 0) {
                        return res.status(400).json({ Status: 0, Message: `Invalid offer price for quantity ${qty}` });
                    }

                    parsedItems.push({
                        Quantity: qty,
                        Price: price
                    });
                }
            }

            if (StartDate && EndDate && new Date(EndDate) < new Date(StartDate)) {
                return res.status(400).json({ Status: 0, Message: "End Date cannot precede Start Date" });
            }

            // Build base delete query for clearing existing tiers for this product / variant
            let deleteSql = "DELETE FROM buy_more_config WHERE ProductID = ?";
            const deleteParams = [cleanProductID];
            if (cleanVariantID) {
                deleteSql += " AND VariantID = ?";
                deleteParams.push(cleanVariantID);
            } else {
                deleteSql += " AND (VariantID IS NULL OR VariantID = 0)";
            }

            // If no tiers provided or all cleared, clear tiers and return success
            if (parsedItems.length === 0) {
                return pool.query(deleteSql, deleteParams, (delErr) => {
                    if (delErr) {
                        console.error("Error clearing existing tiers:", delErr);
                        return res.status(500).json({ Status: 0, Message: "Error clearing pricing tiers" });
                    }
                    return res.json({
                        Status: 1,
                        Message: "Buy More pricing tiers cleared successfully",
                        Count: 0
                    });
                });
            }

            // Otherwise delete existing tiers and insert the new tiers
            pool.query(deleteSql, deleteParams, (delErr) => {
                if (delErr) {
                    console.error("Error clearing existing tiers:", delErr);
                    return res.status(500).json({ Status: 0, Message: "Error updating pricing tiers" });
                }

                const insertSql = `
                    INSERT INTO buy_more_config 
                    (ProductID, VariantID, MinQuantity, MaxQuantity, Price, Status, StartDate, EndDate, CreatedBy, CreatedAt, UpdatedAt)
                    VALUES ?
                `;

                const values = parsedItems.map(item => [
                    ProductID,
                    VariantID || null,
                    item.Quantity,
                    item.Quantity,
                    item.Price,
                    Status !== undefined ? Status : 1,
                    toDbTime(StartDate),
                    toDbTime(EndDate),
                    AdminID,
                    new Date(),
                    new Date()
                ]);

                pool.query(insertSql, [values], (insErr, insRes) => {
                    if (insErr) {
                        console.error("Error inserting buy more tiers:", insErr);
                        return res.status(500).json({ Status: 0, Message: "Error saving pricing tiers" });
                    }

                    return res.json({
                        Status: 1,
                        Message: `Successfully saved ${parsedItems.length} Buy More pricing tier(s)`,
                        InsertedCount: insRes.affectedRows
                    });
                });
            });
        } catch (err) {
            console.error("Exception in saveProductTiers:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    // Add a single tier
    addTier: async (req, res) => {
        try {
            const { ProductID, VariantID, Quantity, MinQuantity, MaxQuantity, Price, Status, StartDate, EndDate } = req.body;
            const AdminID = (req.user && req.user.AdminID) || req.body.CreatedBy || null;

            if (!ProductID || isNaN(parseInt(ProductID, 10))) {
                return res.status(400).json({ Status: 0, Message: "Valid ProductID is required" });
            }
            const q = parseInt(Quantity !== undefined ? Quantity : MinQuantity, 10);
            const maxQ = MaxQuantity !== undefined && MaxQuantity !== null && MaxQuantity !== '' ? parseInt(MaxQuantity, 10) : q;
            const tierPrice = parseFloat(Price);

            if (isNaN(q) || q < 1) {
                return res.status(400).json({ Status: 0, Message: "Quantity must be a positive integer" });
            }
            if (isNaN(tierPrice) || tierPrice < 0) {
                return res.status(400).json({ Status: 0, Message: "Price must be a valid non-negative number" });
            }
            if (StartDate && EndDate && new Date(EndDate) < new Date(StartDate)) {
                return res.status(400).json({ Status: 0, Message: "End Date cannot precede Start Date" });
            }

            // Check for duplicate active tier quantity or overlapping range
            let duplicateSql = `
                SELECT * FROM buy_more_config 
                WHERE ProductID = ? 
                  AND Status = 1 
                  AND (
                      MinQuantity = ? 
                      OR (MinQuantity <= ? AND MaxQuantity >= ?)
                      OR (MinQuantity <= ? AND MaxQuantity >= ?)
                      OR (? <= MinQuantity AND ? >= MaxQuantity)
                  )
            `;
            const dupParams = [ProductID, q, q, q, maxQ, maxQ, q, maxQ];
            if (VariantID) {
                duplicateSql += " AND VariantID = ?";
                dupParams.push(VariantID);
            } else {
                duplicateSql += " AND (VariantID IS NULL OR VariantID = 0)";
            }

            pool.query(duplicateSql, dupParams, (checkErr, existing) => {
                if (checkErr) {
                    console.error("Error checking duplicate:", checkErr);
                    return res.status(500).json({ Status: 0, Message: "Error validating tier" });
                }

                if (existing && existing.length > 0) {
                    return res.status(400).json({
                        Status: 0,
                        Message: `An active tier for Quantity ${q} already exists for this product.`
                    });
                }

                const insertSql = `
                    INSERT INTO buy_more_config 
                    (ProductID, VariantID, MinQuantity, MaxQuantity, Price, Status, StartDate, EndDate, CreatedBy, CreatedAt, UpdatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;
                pool.query(
                    insertSql,
                    [
                        ProductID,
                        VariantID || null,
                        q,
                        maxQ,
                        tierPrice,
                        Status !== undefined ? Status : 1,
                        toDbTime(StartDate),
                        toDbTime(EndDate),
                        AdminID
                    ],
                    (insErr, insRes) => {
                        if (insErr) {
                            console.error("Error inserting buy more tier:", insErr);
                            return res.status(500).json({ Status: 0, Message: "Error saving tier" });
                        }
                        return res.json({
                            Status: 1,
                            Message: "Buy More tier added successfully",
                            TierID: insRes.insertId
                        });
                    }
                );
            });
        } catch (err) {
            console.error("Exception in addTier:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    // Update a single tier
    updateTier: async (req, res) => {
        try {
            const ID = req.params.ID || req.body.ID;
            const { ProductID, VariantID, Quantity, MinQuantity, MaxQuantity, Price, Status, StartDate, EndDate } = req.body;

            if (!ID) {
                return res.status(400).json({ Status: 0, Message: "Tier ID is required" });
            }

            const q = parseInt(Quantity !== undefined ? Quantity : MinQuantity, 10);
            const maxQ = MaxQuantity !== undefined && MaxQuantity !== null && MaxQuantity !== '' ? parseInt(MaxQuantity, 10) : q;
            const tierPrice = parseFloat(Price);

            if (isNaN(q) || q < 1) {
                return res.status(400).json({ Status: 0, Message: "Quantity must be a positive integer" });
            }
            if (isNaN(tierPrice) || tierPrice < 0) {
                return res.status(400).json({ Status: 0, Message: "Price must be a valid non-negative number" });
            }
            if (StartDate && EndDate && new Date(EndDate) < new Date(StartDate)) {
                return res.status(400).json({ Status: 0, Message: "End Date cannot precede Start Date" });
            }

            // Check duplicate excluding this tier ID
            let duplicateSql = "SELECT * FROM buy_more_config WHERE ProductID = ? AND MinQuantity = ? AND Status = 1 AND ID != ?";
            const dupParams = [ProductID, q, ID];
            if (VariantID) {
                duplicateSql += " AND VariantID = ?";
                dupParams.push(VariantID);
            }

            pool.query(duplicateSql, dupParams, (checkErr, existing) => {
                if (checkErr) {
                    console.error("Error checking duplicate:", checkErr);
                    return res.status(500).json({ Status: 0, Message: "Error validating tier" });
                }

                if (existing && existing.length > 0) {
                    return res.status(400).json({
                        Status: 0,
                        Message: `Another active tier for Quantity ${q} already exists for this product.`
                    });
                }

                const updateSql = `
                    UPDATE buy_more_config 
                    SET MinQuantity = ?, MaxQuantity = ?, Price = ?, Status = ?, StartDate = ?, EndDate = ?, UpdatedAt = NOW()
                    WHERE ID = ?
                `;
                pool.query(
                    updateSql,
                    [
                        q,
                        maxQ,
                        tierPrice,
                        Status !== undefined ? Status : 1,
                        toDbTime(StartDate),
                        toDbTime(EndDate),
                        ID
                    ],
                    (upErr, upRes) => {
                        if (upErr) {
                            console.error("Error updating tier:", upErr);
                            return res.status(500).json({ Status: 0, Message: "Error updating tier" });
                        }
                        return res.json({
                            Status: 1,
                            Message: "Buy More tier updated successfully"
                        });
                    }
                );
            });
        } catch (err) {
            console.error("Exception in updateTier:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    // Toggle status (enable/disable)
    toggleStatus: async (req, res) => {
        try {
            const ID = req.params.ID;
            const { Status } = req.body;
            pool.query("UPDATE buy_more_config SET Status = ?, UpdatedAt = NOW() WHERE ID = ?", [Status, ID], (err, result) => {
                if (err) {
                    console.error("Error toggling tier status:", err);
                    return res.status(500).json({ Status: 0, Message: "Error updating status" });
                }
                return res.json({ Status: 1, Message: "Tier status updated successfully" });
            });
        } catch (err) {
            console.error("Exception in toggleStatus:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    // Delete tier
    deleteTier: async (req, res) => {
        try {
            const ID = req.params.ID;
            pool.query("DELETE FROM buy_more_config WHERE ID = ?", [ID], (err, result) => {
                if (err) {
                    console.error("Error deleting tier:", err);
                    return res.status(500).json({ Status: 0, Message: "Error deleting tier" });
                }
                return res.json({ Status: 1, Message: "Tier deleted successfully" });
            });
        } catch (err) {
            console.error("Exception in deleteTier:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    }
};

module.exports = BuyMoreController;
