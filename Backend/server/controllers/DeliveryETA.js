'use strict';
const mysql = require('mysql');
const moment = require('moment');
require('dotenv').config();

const pool = require('../utils/db');

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, res) => {
            if (err) return reject(err);
            resolve(res || []);
        });
    });
};

const DeliveryETA = {
    // -------------------------------------------------------------
    // ADMIN CONFIGURATION & MANAGEMENT APIS
    // -------------------------------------------------------------
    getRules: async (req, resp) => {
        try {
            const [rules] = await queryAsync("SELECT * FROM DeliveryETARules WHERE RuleID = 1 LIMIT 1");
            return resp.status(200).json({
                Status: 1,
                rules: rules || {
                    RuleID: 1,
                    IsEnabled: 1,
                    Band1MaxKm: 3.00,
                    Band1BaseMinutes: 20,
                    Band2MinKm: 3.00,
                    Band2MaxKm: 5.00,
                    Band2BaseMinutes: 25,
                    Band3MinKm: 5.00,
                    Band3BaseMinutes: 30,
                    DefaultBaseMinutes: 25
                }
            });
        } catch (err) {
            console.error("Exception in getETARules:", err);
            return resp.status(500).json({ Status: 0, Message: "Error fetching delivery ETA rules" });
        }
    },

    updateRules: async (req, resp) => {
        try {
            const {
                IsEnabled,
                Band1MaxKm,
                Band1BaseMinutes,
                Band2MinKm,
                Band2MaxKm,
                Band2BaseMinutes,
                Band3MinKm,
                Band3BaseMinutes,
                DefaultBaseMinutes
            } = req.body || {};

            const isEnabled = IsEnabled === 1 || IsEnabled === true || IsEnabled === '1' ? 1 : 0;
            const b1Max = parseFloat(Band1MaxKm);
            const b1Mins = parseInt(Band1BaseMinutes, 10);
            const b2Min = parseFloat(Band2MinKm);
            const b2Max = parseFloat(Band2MaxKm);
            const b2Mins = parseInt(Band2BaseMinutes, 10);
            const b3Min = parseFloat(Band3MinKm);
            const b3Mins = parseInt(Band3BaseMinutes, 10);
            const defMins = parseInt(DefaultBaseMinutes !== undefined ? DefaultBaseMinutes : 25, 10);

            // Validation rules
            const errors = [];
            if (isNaN(b1Max) || b1Max <= 0) errors.push("Band 1 maximum distance must be greater than 0 km.");
            if (isNaN(b1Mins) || b1Mins <= 0) errors.push("Band 1 base ETA minutes must be a positive integer.");
            if (isNaN(b2Min) || b2Min <= 0) errors.push("Band 2 minimum distance must be greater than 0 km.");
            if (isNaN(b2Max) || b2Max <= b2Min) errors.push("Band 2 maximum distance must be strictly greater than Band 2 minimum distance.");
            if (isNaN(b2Mins) || b2Mins <= 0) errors.push("Band 2 base ETA minutes must be a positive integer.");
            if (isNaN(b3Min) || b3Min <= 0) errors.push("Band 3 minimum distance must be greater than 0 km.");
            if (isNaN(b3Mins) || b3Mins <= 0) errors.push("Band 3 base ETA minutes must be a positive integer.");
            if (isNaN(defMins) || defMins <= 0) errors.push("Default base ETA minutes must be a positive integer.");

            // Boundary alignment checks: ensure seamless transitions without gaps or overlaps
            if (!isNaN(b1Max) && !isNaN(b2Min) && Math.abs(b1Max - b2Min) > 0.001) {
                errors.push(`Band 1 maximum (${b1Max} km) must match Band 2 minimum (${b2Min} km) to prevent unhandled distance gaps or overlaps.`);
            }
            if (!isNaN(b2Max) && !isNaN(b3Min) && Math.abs(b2Max - b3Min) > 0.001) {
                errors.push(`Band 2 maximum (${b2Max} km) must match Band 3 minimum (${b3Min} km) to prevent unhandled distance gaps or overlaps.`);
            }

            if (errors.length > 0) {
                return resp.status(400).json({
                    Status: 0,
                    Message: errors[0],
                    errors
                });
            }

            const updatedRules = {
                IsEnabled: isEnabled,
                Band1MaxKm: b1Max,
                Band1BaseMinutes: b1Mins,
                Band2MinKm: b2Min,
                Band2MaxKm: b2Max,
                Band2BaseMinutes: b2Mins,
                Band3MinKm: b3Min,
                Band3BaseMinutes: b3Mins,
                DefaultBaseMinutes: defMins,
                UpdatedBy: req.AdminID
            };

            await queryAsync(`
                INSERT INTO DeliveryETARules 
                    (RuleID, IsEnabled, Band1MaxKm, Band1BaseMinutes, Band2MinKm, Band2MaxKm, Band2BaseMinutes, Band3MinKm, Band3BaseMinutes, DefaultBaseMinutes, UpdatedBy)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    IsEnabled = VALUES(IsEnabled),
                    Band1MaxKm = VALUES(Band1MaxKm),
                    Band1BaseMinutes = VALUES(Band1BaseMinutes),
                    Band2MinKm = VALUES(Band2MinKm),
                    Band2MaxKm = VALUES(Band2MaxKm),
                    Band2BaseMinutes = VALUES(Band2BaseMinutes),
                    Band3MinKm = VALUES(Band3MinKm),
                    Band3BaseMinutes = VALUES(Band3BaseMinutes),
                    DefaultBaseMinutes = VALUES(DefaultBaseMinutes),
                    UpdatedBy = VALUES(UpdatedBy),
                    UpdatedAt = NOW()
            `, [isEnabled, b1Max, b1Mins, b2Min, b2Max, b2Mins, b3Min, b3Mins, defMins, req.AdminID]);

            return resp.status(200).json({
                Status: 1,
                Message: "Distance-based delivery ETA rules updated successfully",
                rules: updatedRules
            });
        } catch (err) {
            console.error("Exception in updateETARules:", err);
            return resp.status(500).json({ Status: 0, Message: "Error updating delivery ETA rules" });
        }
    },

    // -------------------------------------------------------------
    // AUTHORITATIVE DISTANCE-BASED ETA ENGINE
    // -------------------------------------------------------------
    calculateBaseETA: async (distanceKm) => {
        try {
            const [ruleRow] = await queryAsync("SELECT * FROM DeliveryETARules WHERE RuleID = 1 LIMIT 1");
            const rules = ruleRow || {
                IsEnabled: 1,
                Band1MaxKm: 3.00,
                Band1BaseMinutes: 20,
                Band2MinKm: 3.00,
                Band2MaxKm: 5.00,
                Band2BaseMinutes: 25,
                Band3MinKm: 5.00,
                Band3BaseMinutes: 30,
                DefaultBaseMinutes: 25
            };

            const defaultMinutes = rules.DefaultBaseMinutes || 25;

            // If distance-based policy is disabled, use default
            if (!rules.IsEnabled) {
                return {
                    baseMinutes: defaultMinutes,
                    band: 'policy_disabled',
                    isPolicyActive: false,
                    distanceKm: distanceKm || 0
                };
            }

            const dist = parseFloat(distanceKm);
            if (isNaN(dist) || dist < 0) {
                return {
                    baseMinutes: defaultMinutes,
                    band: 'unknown_distance_fallback',
                    isPolicyActive: true,
                    distanceKm: 0
                };
            }

            // Boundary logic:
            // 1. Below Band1MaxKm (e.g. < 3 km) -> Band 1 (20 mins)
            // 2. Exactly Band2MinKm to Band2MaxKm inclusive (e.g. 3.00 km to 5.00 km) -> Band 2 (25 mins)
            // 3. Above Band3MinKm (e.g. > 5 km) -> Band 3 (30 mins)
            if (dist < rules.Band1MaxKm) {
                return {
                    baseMinutes: rules.Band1BaseMinutes,
                    band: `below_${rules.Band1MaxKm}km`,
                    isPolicyActive: true,
                    distanceKm: dist
                };
            } else if (dist <= rules.Band2MaxKm) {
                return {
                    baseMinutes: rules.Band2BaseMinutes,
                    band: `between_${rules.Band2MinKm}km_and_${rules.Band2MaxKm}km`,
                    isPolicyActive: true,
                    distanceKm: dist
                };
            } else {
                return {
                    baseMinutes: rules.Band3BaseMinutes,
                    band: `above_${rules.Band3MinKm}km`,
                    isPolicyActive: true,
                    distanceKm: dist
                };
            }
        } catch (e) {
            console.error("Error in calculateBaseETA:", e);
            return {
                baseMinutes: 25,
                band: 'error_fallback',
                isPolicyActive: false,
                distanceKm: 0
            };
        }
    },

    // Recalculate and return effective ETA details for an order
    getOrderEffectiveETA: async (req, resp) => {
        try {
            const orderId = req.params.OrderID;
            const [order] = await queryAsync(
                `SELECT OrderID, Distance, CreatedAt, EstimateDateTime, OrderStatus,
                        TotalDelayMinutes, OrderSizeBufferMinutes, TotalItemQuantity,
                        BaseETAMinutes, DistanceETABand, ETACalculationDetails
                 FROM Orders WHERE OrderID = ?`,
                [orderId]
            );

            if (!order) {
                return resp.status(404).json({ Status: 0, Message: "Order not found" });
            }

            // Determine distance base ETA
            const etaCalculation = await DeliveryETA.calculateBaseETA(order.Distance);
            const baseMinutes = order.BaseETAMinutes || etaCalculation.baseMinutes;
            const orderSizeBuffer = parseInt(order.OrderSizeBufferMinutes || 0, 10);
            const delayMinutes = parseInt(order.TotalDelayMinutes || 0, 10);
            const totalMinutes = baseMinutes + orderSizeBuffer + delayMinutes;

            const createdAt = order.CreatedAt ? moment(order.CreatedAt) : moment();
            const calculatedETA = createdAt.clone().add(totalMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            const effectiveETA = order.EstimateDateTime ? moment(order.EstimateDateTime).format('YYYY-MM-DD HH:mm:ss') : calculatedETA;

            return resp.status(200).json({
                Status: 1,
                OrderID: order.OrderID,
                Distance: order.Distance,
                BaseETAMinutes: baseMinutes,
                DistanceETABand: order.DistanceETABand || etaCalculation.band,
                OrderSizeBufferMinutes: orderSizeBuffer,
                TotalDelayMinutes: delayMinutes,
                TotalMinutes: totalMinutes,
                EstimateDateTime: effectiveETA,
                CalculatedETA: calculatedETA,
                Breakdown: {
                    baseDeliveryMinutes: baseMinutes,
                    orderSizeBuffer,
                    operationalDelayMinutes: delayMinutes,
                    totalMinutes,
                    distanceKm: order.Distance
                }
            });
        } catch (err) {
            console.error("Exception in getOrderEffectiveETA:", err);
            return resp.status(500).json({ Status: 0, Message: "Error fetching order effective ETA" });
        }
    }
};

module.exports = DeliveryETA;
