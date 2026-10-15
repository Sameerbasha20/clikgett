const mysql = require('mysql');
require('dotenv').config();

const pool = require('../utils/db');

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

const MembershipController = {
    /**
     * Get all active Membership Plans (Global Definitions)
     */
    getPlans: async (req, res) => {
        try {
            const plans = await queryAsync("SELECT * FROM MembershipPlans ORDER BY Price ASC");
            return res.json({
                Status: 1,
                Plans: plans || []
            });
        } catch (err) {
            console.error('Error fetching membership plans:', err);
            return res.status(500).json({ Status: 0, Message: 'Error fetching membership plans' });
        }
    },

    /**
     * Get membership pricing configured for a specific product
     */
    getProductPricing: async (req, res) => {
        const productId = req.params.productId || req.query.ProductID;
        if (!productId) {
            return res.status(400).json({ Status: 0, Message: 'ProductID is required' });
        }

        try {
            const query = `
                SELECT mp.PlanID, mp.PlanName, mp.Price AS SubscriptionPrice, mp.DurationDays,
                       mpp.PriceID, mpp.ProductID, mpp.MembershipPrice,
                       COALESCE(mpp.Status, 1) AS Status,
                       mpp.UpdatedAt
                FROM MembershipPlans mp
                LEFT JOIN membership_product_prices mpp 
                       ON mp.PlanID = mpp.PlanID AND mpp.ProductID = ?
                WHERE mp.Status = 1
                ORDER BY mp.PlanID ASC
            `;
            const rows = await queryAsync(query, [productId]);
            return res.json({
                Status: 1,
                ProductID: parseInt(productId, 10),
                Plans: rows || []
            });
        } catch (err) {
            console.error('Error fetching product membership pricing:', err);
            return res.status(500).json({ Status: 0, Message: 'Error fetching product membership pricing' });
        }
    },

    /**
     * Save / Update product membership pricing
     */
    saveProductPricing: async (req, res) => {
        const { ProductID, items } = req.body;
        const pId = parseInt(ProductID, 10);
        if (!pId || isNaN(pId)) {
            return res.status(400).json({ Status: 0, Message: 'Valid ProductID is required' });
        }

        // Support array of items or single item
        const pricingItems = Array.isArray(items) ? items : [req.body];

        try {
            for (const item of pricingItems) {
                const planId = parseInt(item.PlanID, 10);
                if (!planId || isNaN(planId)) continue;

                const memberPriceStr = String(item.MembershipPrice || '').trim();
                const status = item.Status !== undefined ? parseInt(item.Status, 10) : 1;

                if (memberPriceStr === '' || memberPriceStr === 'null' || isNaN(parseFloat(memberPriceStr))) {
                    // If blank or removed, delete the entry
                    await queryAsync(
                        "DELETE FROM membership_product_prices WHERE ProductID = ? AND PlanID = ?",
                        [pId, planId]
                    );
                } else {
                    const memberPrice = parseFloat(memberPriceStr);
                    if (memberPrice < 0) {
                        return res.status(400).json({ Status: 0, Message: 'Membership price must be positive' });
                    }

                    await queryAsync(`
                        INSERT INTO membership_product_prices (PlanID, ProductID, MembershipPrice, Status, UpdatedAt)
                        VALUES (?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            MembershipPrice = VALUES(MembershipPrice),
                            Status = VALUES(Status),
                            UpdatedAt = NOW()
                    `, [planId, pId, memberPrice, status]);
                }
            }

            return res.json({
                Status: 1,
                Message: 'Product membership pricing saved successfully'
            });
        } catch (err) {
            console.error('Error saving product membership pricing:', err);
            return res.status(500).json({ Status: 0, Message: 'Error saving product membership pricing' });
        }
    },

    /**
     * Delete product membership pricing
     */
    deleteProductPricing: async (req, res) => {
        const productId = req.params.productId || req.body.ProductID;
        const planId = req.params.planId || req.body.PlanID;
        const priceId = req.params.priceId || req.body.PriceID;

        try {
            if (priceId) {
                await queryAsync("DELETE FROM membership_product_prices WHERE PriceID = ?", [priceId]);
            } else if (productId && planId) {
                await queryAsync("DELETE FROM membership_product_prices WHERE ProductID = ? AND PlanID = ?", [productId, planId]);
            } else if (productId) {
                await queryAsync("DELETE FROM membership_product_prices WHERE ProductID = ?", [productId]);
            } else {
                return res.status(400).json({ Status: 0, Message: 'ProductID or PriceID required' });
            }

            return res.json({
                Status: 1,
                Message: 'Membership pricing removed successfully'
            });
        } catch (err) {
            console.error('Error deleting product membership pricing:', err);
            return res.status(500).json({ Status: 0, Message: 'Error deleting membership pricing' });
        }
    }
};

module.exports = MembershipController;
