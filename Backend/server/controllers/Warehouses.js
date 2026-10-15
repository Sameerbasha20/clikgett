const mysql = require('mysql');
require('dotenv').config();

const pool = require('../utils/db');

const WarehouseController = {
    allWarehouses: async (req, resp) => {
        try {
            const query = "SELECT WarehouseID, WarehouseID AS warehouseId, WarehouseName AS warehouseName, City AS city, Latitude AS latitude, Longitude AS longitude, Pincode AS pincode, Status AS status FROM Warehouses WHERE Status != 0 ORDER BY CreatedAt DESC";
            pool.query(query, (err, results) => {
                if (err) {
                    return resp.json({ Status: 1, warehouses: [] });
                }
                return resp.json({ Status: 1, warehouses: results || [] });
            });
        } catch (e) {
            console.log("error in allWarehouses:", e);
            return resp.json({ Status: 1, warehouses: [] });
        }
    },

    warehouseDetail: async (req, resp) => {
        try {
            const id = req.params.id || req.params.WarehouseID;
            const query = "SELECT WarehouseID, WarehouseID AS warehouseId, WarehouseName AS warehouseName, City AS city, Latitude AS latitude, Longitude AS longitude, Pincode AS pincode, Status AS status FROM Warehouses WHERE WarehouseID = ?";
            pool.query(query, [id], (err, results) => {
                if (err || !results || results.length === 0) {
                    return resp.json({ Status: 1, warehouse: {}, warehouses: {} });
                }
                return resp.json({ Status: 1, warehouse: results[0], warehouses: results[0] });
            });
        } catch (e) {
            console.log("error in warehouseDetail:", e);
            return resp.json({ Status: 1, warehouses: {} });
        }
    },

    addWarehouse: async (req, resp) => {
        try {
            const body = req.body;
            const warehouseName = body.warehouseName || body.WarehouseName;
            const city = body.city || body.City;
            const latitude = body.latitude || body.Latitude || null;
            const longitude = body.longitude || body.Longitude || null;
            const pincode = body.pincode || body.Pincode || null;
            const status = body.status !== undefined ? body.status : 1;

            if (!warehouseName || !city) {
                return resp.json({ Status: 0, Message: "Warehouse Name and City are required" });
            }

            const newWarehouse = {
                WarehouseName: warehouseName,
                City: city,
                Latitude: latitude,
                Longitude: longitude,
                Pincode: pincode,
                Status: status
            };

            const query = "INSERT INTO Warehouses SET ?";
            pool.query(query, newWarehouse, (err, results) => {
                if (err) {
                    console.log("error adding warehouse:", err);
                    return resp.json({ Status: 0, Message: err.sqlMessage || "Error adding warehouse" });
                }
                return resp.json({ Status: 1, Message: "Warehouse added successfully", warehouseId: results.insertId, WarehouseID: results.insertId });
            });
        } catch (e) {
            console.log("exception in addWarehouse:", e);
            return resp.status(500).json({ Status: 0, Message: "Error adding warehouse" });
        }
    },

    updateWarehouse: async (req, resp) => {
        try {
            const id = req.params.id || req.params.WarehouseID;
            const body = req.body;
            let updates = [];
            let params = [];

            if (body.warehouseName || body.WarehouseName) {
                updates.push("WarehouseName = ?");
                params.push(body.warehouseName || body.WarehouseName);
            }
            if (body.city || body.City) {
                updates.push("City = ?");
                params.push(body.city || body.City);
            }
            if (body.latitude !== undefined || body.Latitude !== undefined) {
                updates.push("Latitude = ?");
                params.push(body.latitude !== undefined ? body.latitude : body.Latitude);
            }
            if (body.longitude !== undefined || body.Longitude !== undefined) {
                updates.push("Longitude = ?");
                params.push(body.longitude !== undefined ? body.longitude : body.Longitude);
            }
            if (body.pincode !== undefined || body.Pincode !== undefined) {
                updates.push("Pincode = ?");
                params.push(body.pincode !== undefined ? body.pincode : body.Pincode);
            }
            if (body.status !== undefined || body.Status !== undefined) {
                updates.push("Status = ?");
                params.push(body.status !== undefined ? body.status : body.Status);
            }

            if (updates.length === 0) {
                return resp.json({ Status: 1, Message: "No changes to update" });
            }

            params.push(id);
            const query = "UPDATE Warehouses SET " + updates.join(", ") + " WHERE WarehouseID = ?";
            pool.query(query, params, (err, results) => {
                if (err) {
                    console.log("error updating warehouse:", err);
                    return resp.json({ Status: 0, Message: err.sqlMessage || "Error updating warehouse" });
                }
                return resp.json({ Status: 1, Message: "Warehouse updated successfully" });
            });
        } catch (e) {
            console.log("exception in updateWarehouse:", e);
            return resp.status(500).json({ Status: 0, Message: "Error updating warehouse" });
        }
    },

    deleteWarehouse: async (req, resp) => {
        try {
            const id = req.params.id || req.params.WarehouseID;
            const query = "UPDATE Warehouses SET Status = 0 WHERE WarehouseID = ?";
            pool.query(query, [id], (err, results) => {
                if (err) {
                    console.log("error deleting warehouse:", err);
                    return resp.json({ Status: 0, Message: err.sqlMessage || "Error deleting warehouse" });
                }
                return resp.json({ Status: 1, Message: "Warehouse deleted successfully" });
            });
        } catch (e) {
            console.log("exception in deleteWarehouse:", e);
            return resp.status(500).json({ Status: 0, Message: "Error deleting warehouse" });
        }
    }
};

module.exports = WarehouseController;
