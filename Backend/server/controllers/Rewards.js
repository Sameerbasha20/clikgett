const mysql = require('mysql');
require('dotenv').config();

const pool = require('../utils/db');

const RewardsController = {
    getAllRewards: (req, res) => {
        const query = "SELECT * FROM Rewards ORDER BY TriggerValue ASC";
        pool.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching rewards:', err);
                return res.status(500).json({ Status: 0, Message: 'Error fetching rewards' });
            }
            return res.json({ Status: 1, Rewards: results });
        });
    },

    getMilestoneConfig: (req, res) => {
        const query = "SELECT * FROM Rewards WHERE TriggerType = 'order_count' ORDER BY TriggerValue ASC";
        pool.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching milestones:', err);
                return res.status(500).json({ Status: 0, Message: 'Error fetching milestones' });
            }
            return res.json({ Status: 1, Milestones: results });
        });
    },

    createReward: (req, res) => {
        const { RewardName, RewardType, TriggerType, TriggerValue, RewardValue, Description, Status } = req.body;
        if (!RewardName || !RewardType || !TriggerType || TriggerValue === undefined || RewardValue === undefined) {
            return res.status(400).json({ Status: 0, Message: 'Missing required milestone/reward fields' });
        }

        const insertQuery = `
            INSERT INTO Rewards (RewardName, RewardType, TriggerType, TriggerValue, RewardValue, Description, Status, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const values = [
            RewardName,
            RewardType,
            TriggerType,
            parseFloat(TriggerValue),
            parseFloat(RewardValue),
            Description || '',
            Status !== undefined ? Status : 1
        ];

        pool.query(insertQuery, values, (err, result) => {
            if (err) {
                console.error('Error creating reward:', err);
                return res.status(500).json({ Status: 0, Message: 'Error creating reward' });
            }
            return res.json({ Status: 1, Message: 'Milestone reward created successfully', RewardID: result.insertId });
        });
    },

    updateReward: (req, res) => {
        const { RewardID, RewardName, RewardType, TriggerType, TriggerValue, RewardValue, Description, Status } = req.body;
        if (!RewardID) {
            return res.status(400).json({ Status: 0, Message: 'RewardID is required' });
        }

        const updateQuery = `
            UPDATE Rewards 
            SET RewardName = COALESCE(?, RewardName),
                RewardType = COALESCE(?, RewardType),
                TriggerType = COALESCE(?, TriggerType),
                TriggerValue = COALESCE(?, TriggerValue),
                RewardValue = COALESCE(?, RewardValue),
                Description = COALESCE(?, Description),
                Status = COALESCE(?, Status),
                UpdatedAt = NOW()
            WHERE RewardID = ?
        `;
        const values = [
            RewardName || null,
            RewardType || null,
            TriggerType || null,
            TriggerValue !== undefined ? parseFloat(TriggerValue) : null,
            RewardValue !== undefined ? parseFloat(RewardValue) : null,
            Description !== undefined ? Description : null,
            Status !== undefined ? Status : null,
            RewardID
        ];

        pool.query(updateQuery, values, (err, result) => {
            if (err) {
                console.error('Error updating reward:', err);
                return res.status(500).json({ Status: 0, Message: 'Error updating reward' });
            }
            return res.json({ Status: 1, Message: 'Reward updated successfully' });
        });
    },

    deleteReward: (req, res) => {
        const rewardId = req.params.id || req.body.RewardID;
        if (!rewardId) {
            return res.status(400).json({ Status: 0, Message: 'RewardID is required' });
        }

        pool.query("DELETE FROM Rewards WHERE RewardID = ?", [rewardId], (err, result) => {
            if (err) {
                console.error('Error deleting reward:', err);
                return res.status(500).json({ Status: 0, Message: 'Error deleting reward' });
            }
            return res.json({ Status: 1, Message: 'Reward deleted successfully' });
        });
    },

    
    getMyMilestones: async (req, res) => {
        try {
            const userId = req.UserID || req.query.UserID || (req.user && req.user.UserID);
            if (!userId) {
                return res.status(400).json({ Status: 0, Message: "UserID is required" });
            }

            // Count actual delivered/completed orders
            pool.query("SELECT COUNT(*) as OrderCount FROM Orders WHERE UserID = ? AND OrderStatus = 1", [userId], (cntErr, cntRows) => {
                if (cntErr) {
                    console.error("Error counting orders for milestones:", cntErr);
                    return res.status(500).json({ Status: 0, Message: "Error counting orders" });
                }

                const orderCount = (cntRows && cntRows.length > 0) ? parseInt(cntRows[0].OrderCount || 0) : 0;

                // Fetch active order count milestones
                pool.query("SELECT * FROM Rewards WHERE Status = 1 AND TriggerType = 'order_count' ORDER BY TriggerValue ASC", (rewErr, rewards) => {
                    if (rewErr) {
                        console.error("Error fetching rewards:", rewErr);
                        return res.status(500).json({ Status: 0, Message: "Error fetching rewards" });
                    }

                    let effectiveRewards = (rewards && rewards.length > 0) ? rewards : [
                        { RewardID: 101, RewardName: 'Bronze Shopper', RewardType: 'wallet_cashback', TriggerValue: 5, RewardValue: 50, Description: 'Get ₹50 cashback on completing 5 orders' },
                        { RewardID: 102, RewardName: 'Silver Saver', RewardType: 'wallet_cashback', TriggerValue: 10, RewardValue: 100, Description: 'Get ₹100 cashback on completing 10 orders' },
                        { RewardID: 103, RewardName: 'Gold Star', RewardType: 'free_delivery', TriggerValue: 25, RewardValue: 250, Description: 'Unlock VIP Perks on completing 25 orders' },
                        { RewardID: 104, RewardName: 'Platinum VIP', RewardType: 'discount_percentage', TriggerValue: 50, RewardValue: 500, Description: 'Unlock 15% VIP discount on completing 50 orders' }
                    ];

                    const milestones = effectiveRewards.map(r => {
                        const target = parseFloat(r.TriggerValue);
                        const isCompleted = orderCount >= target;
                        const remaining = Math.max(0, target - orderCount);
                        const progressPct = Math.min(100, Math.round((orderCount / target) * 100));

                        return {
                            RewardID: r.RewardID,
                            RewardName: r.RewardName,
                            RewardType: r.RewardType,
                            TriggerValue: target,
                            RewardValue: parseFloat(r.RewardValue),
                            Description: r.Description,
                            CurrentOrders: orderCount,
                            RemainingOrders: remaining,
                            IsCompleted: isCompleted,
                            ProgressPercentage: progressPct
                        };
                    });

                    // Next milestone to achieve
                    const nextMilestone = milestones.find(m => !m.IsCompleted) || milestones[milestones.length - 1];

                    return res.json({
                        Status: 1,
                        TotalDeliveredOrders: orderCount,
                        NextMilestone: nextMilestone,
                        Milestones: milestones
                    });
                });
            });
        } catch (e) {
            console.error("Exception in getMyMilestones:", e);
            return res.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    getUserProgress: (req, res) => {
        const query = `
            SELECT ur.*, r.RewardName, r.RewardType, r.TriggerType, r.TriggerValue, r.RewardValue,
                   u.FirstName, u.LastName, u.MobileNumber
            FROM UserRewards ur
            LEFT JOIN Rewards r ON ur.RewardID = r.RewardID
            LEFT JOIN Users u ON ur.UserID = u.UserID
            ORDER BY ur.CreatedAt DESC
            LIMIT 100
        `;
        pool.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching user milestone progress:', err);
                return res.status(500).json({ Status: 0, Message: 'Error fetching progress' });
            }
            return res.json({ Status: 1, Progress: results });
        });
    }
};

module.exports = RewardsController;
