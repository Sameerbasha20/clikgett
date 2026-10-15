const pool = require('../utils/db');

const CartOffersController = {
    // List all offers
    getOffers: async (req, res) => {
        try {
            const { Status, search } = req.query;
            let sql = `
                SELECT co.*, a.FirstName as AdminFirstName, a.LastName as AdminLastName
                FROM cart_offers co
                LEFT JOIN AdminUsers a ON co.CreatedBy = a.AdminID
                WHERE 1=1
            `;
            const params = [];

            if (Status !== undefined && Status !== '') {
                sql += " AND co.Status = ?";
                params.push(parseInt(Status, 10));
            }
            if (search) {
                sql += " AND (co.OfferName LIKE ? OR co.OfferType LIKE ?)";
                params.push(`%${search}%`, `%${search}%`);
            }

            sql += " ORDER BY co.CreatedAt DESC";

            pool.query(sql, params, (err, rows) => {
                if (err) {
                    console.error("Error fetching cart offers:", err);
                    return res.status(500).json({ Status: 0, Message: "Error fetching cart offers" });
                }
                return res.json({ Status: 1, Offers: rows || [] });
            });
        } catch (err) {
            console.error("Exception in getOffers:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    // Create a new cart threshold offer
    createOffer: async (req, res) => {
        try {
            const { OfferName, ThresholdAmount, OfferType, OfferValue, StartDate, EndDate, ApplicableProducts, ExcludedProducts, Status } = req.body;
            const AdminID = (req.user && req.user.AdminID) || req.body.CreatedBy || null;

            if (!OfferName || !OfferName.trim()) {
                return res.status(400).json({ Status: 0, Message: "Offer name is required" });
            }
            const threshold = parseFloat(ThresholdAmount);
            if (isNaN(threshold) || threshold <= 0) {
                return res.status(400).json({ Status: 0, Message: "Threshold amount must be a positive number" });
            }
            const val = parseFloat(OfferValue);
            if (isNaN(val) || val < 0) {
                return res.status(400).json({ Status: 0, Message: "Offer value must be a valid number" });
            }

            const insertSql = `
                INSERT INTO cart_offers 
                (OfferName, ThresholdAmount, OfferType, OfferValue, StartDate, EndDate, ApplicableProducts, ExcludedProducts, Status, CreatedBy, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;

            pool.query(
                insertSql,
                [
                    OfferName.trim(),
                    threshold,
                    OfferType || 'flat_discount',
                    val,
                    StartDate || null,
                    EndDate || null,
                    ApplicableProducts ? JSON.stringify(ApplicableProducts) : null,
                    ExcludedProducts ? JSON.stringify(ExcludedProducts) : null,
                    Status !== undefined ? Status : 1,
                    AdminID
                ],
                (insErr, result) => {
                    if (insErr) {
                        console.error("Error creating cart offer:", insErr);
                        return res.status(500).json({ Status: 0, Message: "Error creating cart offer" });
                    }
                    return res.json({
                        Status: 1,
                        Message: "Cart offer created successfully",
                        OfferID: result.insertId
                    });
                }
            );
        } catch (err) {
            console.error("Exception in createOffer:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    // Update cart offer
    updateOffer: async (req, res) => {
        try {
            const OfferID = req.params.OfferID || req.body.OfferID;
            const { OfferName, ThresholdAmount, OfferType, OfferValue, StartDate, EndDate, ApplicableProducts, ExcludedProducts, Status } = req.body;

            if (!OfferID) {
                return res.status(400).json({ Status: 0, Message: "OfferID is required" });
            }

            const threshold = parseFloat(ThresholdAmount);
            const val = parseFloat(OfferValue);

            const updateSql = `
                UPDATE cart_offers
                SET OfferName = COALESCE(?, OfferName),
                    ThresholdAmount = COALESCE(?, ThresholdAmount),
                    OfferType = COALESCE(?, OfferType),
                    OfferValue = COALESCE(?, OfferValue),
                    StartDate = COALESCE(?, StartDate),
                    EndDate = COALESCE(?, EndDate),
                    ApplicableProducts = COALESCE(?, ApplicableProducts),
                    ExcludedProducts = COALESCE(?, ExcludedProducts),
                    Status = COALESCE(?, Status),
                    UpdatedAt = NOW()
                WHERE OfferID = ?
            `;

            pool.query(
                updateSql,
                [
                    OfferName ? OfferName.trim() : null,
                    isNaN(threshold) ? null : threshold,
                    OfferType || null,
                    isNaN(val) ? null : val,
                    StartDate || null,
                    EndDate || null,
                    ApplicableProducts ? JSON.stringify(ApplicableProducts) : null,
                    ExcludedProducts ? JSON.stringify(ExcludedProducts) : null,
                    Status !== undefined ? Status : null,
                    OfferID
                ],
                (upErr, result) => {
                    if (upErr) {
                        console.error("Error updating cart offer:", upErr);
                        return res.status(500).json({ Status: 0, Message: "Error updating cart offer" });
                    }
                    return res.json({ Status: 1, Message: "Cart offer updated successfully" });
                }
            );
        } catch (err) {
            console.error("Exception in updateOffer:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    // Toggle status or delete
    toggleStatus: async (req, res) => {
        try {
            const OfferID = req.params.OfferID;
            const { Status } = req.body;
            pool.query("UPDATE cart_offers SET Status = ?, UpdatedAt = NOW() WHERE OfferID = ?", [Status, OfferID], (err, result) => {
                if (err) {
                    console.error("Error toggling cart offer status:", err);
                    return res.status(500).json({ Status: 0, Message: "Error updating status" });
                }
                return res.json({ Status: 1, Message: "Offer status updated successfully" });
            });
        } catch (err) {
            console.error("Exception in toggleStatus:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    deleteOffer: async (req, res) => {
        try {
            const OfferID = req.params.OfferID;
            pool.query("DELETE FROM cart_offers WHERE OfferID = ?", [OfferID], (err, result) => {
                if (err) {
                    console.error("Error deleting cart offer:", err);
                    return res.status(500).json({ Status: 0, Message: "Error deleting offer" });
                }
                return res.json({ Status: 1, Message: "Cart offer deleted successfully" });
            });
        } catch (err) {
            console.error("Exception in deleteOffer:", err);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    }
};

module.exports = CartOffersController;
