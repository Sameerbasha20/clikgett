const pool = require('../utils/db');

const ProductRestrictionsController = {
    // Get all restrictions with product information
    getRestrictions: async (req, res) => {
        try {
            const { ProductID, RestrictionType, Status } = req.query;
            let sql = `
                SELECT pr.*, p.ProductName, p.Status as ProductStatus, pv.metrictype, pv.metricvalue, pv.Price
                FROM product_restrictions pr
                INNER JOIN Products p ON pr.ProductID = p.ProductID
                LEFT JOIN ProductVariants pv ON pr.VariantID = pv.VariantID
                WHERE 1=1
            `;
            const params = [];

            if (ProductID) {
                sql += " AND pr.ProductID = ?";
                params.push(parseInt(ProductID, 10));
            }
            if (RestrictionType) {
                sql += " AND pr.RestrictionType = ?";
                params.push(RestrictionType);
            }
            if (Status !== undefined && Status !== '') {
                sql += " AND pr.Status = ?";
                params.push(parseInt(Status, 10));
            }

            sql += " ORDER BY pr.CreatedAt DESC";

            pool.query(sql, params, (err, rows) => {
                if (err) {
                    console.error("Error fetching product restrictions:", err);
                    return res.status(500).json({ Status: 0, Message: "Error fetching restrictions" });
                }
                return res.json({ Status: 1, Restrictions: rows || [] });
            });
        } catch (err) {
            console.error("Exception in getRestrictions:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    // Add a restriction
    addRestriction: async (req, res) => {
        try {
            const { ProductID, VariantID, RestrictionType, RestrictionValue, Status } = req.body;

            if (!ProductID || isNaN(parseInt(ProductID, 10))) {
                return res.status(400).json({ Status: 0, Message: "ProductID is required" });
            }
            if (!RestrictionType || typeof RestrictionType !== 'string') {
                return res.status(400).json({ Status: 0, Message: "RestrictionType is required (e.g., 'no_cashback', 'no_coupon', 'no_membership')" });
            }

            // Check if restriction already exists
            let checkSql = "SELECT * FROM product_restrictions WHERE ProductID = ? AND RestrictionType = ?";
            const checkParams = [ProductID, RestrictionType];
            if (VariantID) {
                checkSql += " AND VariantID = ?";
                checkParams.push(VariantID);
            } else {
                checkSql += " AND (VariantID IS NULL OR VariantID = 0)";
            }

            pool.query(checkSql, checkParams, (checkErr, existing) => {
                if (checkErr) {
                    console.error("Error checking existing restriction:", checkErr);
                    return res.status(500).json({ Status: 0, Message: "Database error" });
                }

                if (existing && existing.length > 0) {
                    // Update existing
                    pool.query(
                        "UPDATE product_restrictions SET Status = ?, RestrictionValue = ?, UpdatedAt = NOW() WHERE ID = ?",
                        [Status !== undefined ? Status : 1, RestrictionValue || null, existing[0].ID],
                        (upErr) => {
                            if (upErr) return res.status(500).json({ Status: 0, Message: "Error updating restriction" });
                            return res.json({ Status: 1, Message: "Restriction updated successfully", RestrictionID: existing[0].ID });
                        }
                    );
                } else {
                    const insertSql = `
                        INSERT INTO product_restrictions (ProductID, VariantID, RestrictionType, RestrictionValue, Status, CreatedAt, UpdatedAt)
                        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                    `;
                    pool.query(
                        insertSql,
                        [
                            ProductID,
                            VariantID || null,
                            RestrictionType,
                            RestrictionValue || null,
                            Status !== undefined ? Status : 1
                        ],
                        (insErr, result) => {
                            if (insErr) {
                                console.error("Error adding product restriction:", insErr);
                                return res.status(500).json({ Status: 0, Message: "Error adding restriction" });
                            }
                            return res.json({ Status: 1, Message: "Restriction added successfully", RestrictionID: result.insertId });
                        }
                    );
                }
            });
        } catch (err) {
            console.error("Exception in addRestriction:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    // Toggle status or update
    updateRestriction: async (req, res) => {
        try {
            const ID = req.params.ID || req.body.ID;
            const { Status, RestrictionValue } = req.body;
            if (!ID) return res.status(400).json({ Status: 0, Message: "ID is required" });

            pool.query(
                "UPDATE product_restrictions SET Status = COALESCE(?, Status), RestrictionValue = COALESCE(?, RestrictionValue), UpdatedAt = NOW() WHERE ID = ?",
                [Status, RestrictionValue, ID],
                (err, result) => {
                    if (err) {
                        console.error("Error updating restriction:", err);
                        return res.status(500).json({ Status: 0, Message: "Error updating restriction" });
                    }
                    return res.json({ Status: 1, Message: "Restriction updated successfully" });
                }
            );
        } catch (err) {
            console.error("Exception in updateRestriction:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    deleteRestriction: async (req, res) => {
        try {
            const ID = req.params.ID;
            pool.query("DELETE FROM product_restrictions WHERE ID = ?", [ID], (err, result) => {
                if (err) {
                    console.error("Error deleting restriction:", err);
                    return res.status(500).json({ Status: 0, Message: "Error deleting restriction" });
                }
                return res.json({ Status: 1, Message: "Restriction deleted successfully" });
            });
        } catch (err) {
            console.error("Exception in deleteRestriction:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    saveProductRestrictions: async (req, res) => {
        try {
            const { ProductID, VariantID, restrictions } = req.body;
            if (!ProductID || isNaN(parseInt(ProductID, 10))) {
                return res.status(400).json({ Status: 0, Message: "ProductID is required" });
            }
            const pId = parseInt(ProductID, 10);
            const vId = VariantID ? parseInt(VariantID, 10) : null;

            const types = ['no_cashback', 'no_coupon', 'no_membership'];
            const statusMap = {};
            const restrObj = restrictions || req.body;
            if (Array.isArray(restrictions)) {
                restrictions.forEach(r => {
                    if (r.RestrictionType) {
                        statusMap[r.RestrictionType] = (r.Status === 1 || r.Status === true || r.Status === '1') ? 1 : 0;
                    }
                });
            } else if (restrObj && typeof restrObj === 'object') {
                types.forEach(t => {
                    if (restrObj[t] !== undefined) {
                        statusMap[t] = (restrObj[t] === 1 || restrObj[t] === true || restrObj[t] === '1') ? 1 : 0;
                    }
                });
            }

            for (const type of types) {
                if (statusMap[type] !== undefined) {
                    const targetStatus = statusMap[type];
                    let checkSql = "SELECT ID FROM product_restrictions WHERE ProductID = ? AND RestrictionType = ?";
                    const checkParams = [pId, type];
                    if (vId) {
                        checkSql += " AND VariantID = ?";
                        checkParams.push(vId);
                    } else {
                        checkSql += " AND (VariantID IS NULL OR VariantID = 0)";
                    }

                    const existing = await new Promise((resolve, reject) => {
                        pool.query(checkSql, checkParams, (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows || []);
                        });
                    });

                    if (existing.length > 0) {
                        await new Promise((resolve, reject) => {
                            pool.query(
                                "UPDATE product_restrictions SET Status = ?, UpdatedAt = NOW() WHERE ID = ?",
                                [targetStatus, existing[0].ID],
                                (err, result) => {
                                    if (err) reject(err);
                                    else resolve(result);
                                }
                            );
                        });
                    } else {
                        await new Promise((resolve, reject) => {
                            pool.query(
                                "INSERT INTO product_restrictions (ProductID, VariantID, RestrictionType, Status, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
                                [pId, vId, type, targetStatus],
                                (err, result) => {
                                    if (err) reject(err);
                                    else resolve(result);
                                }
                            );
                        });
                    }
                }
            }

            return res.json({
                Status: 1,
                Message: "Product restrictions updated successfully",
                ProductID: pId
            });
        } catch (err) {
            console.error("Exception in saveProductRestrictions:", err);
            return res.status(500).json({ Status: 0, Message: "Server error saving restrictions" });
        }
    }
};

module.exports = ProductRestrictionsController;
