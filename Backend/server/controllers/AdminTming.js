const express = require('express'); 
const mysql=require('mysql');
require('dotenv').config()
var moment = require('moment'); 
var fs = require('fs')
const CommonController = require("../controllers/CommonController");

const pool = require('../utils/db');
const StoreHours = require('../services/StoreHours');

const TimingController = {
  addTiming: async (req, res) => {
    try {
      const { StartTime, EndTime } = req.body;
      
      if (!StartTime || !EndTime) {
        return res.json({ status: 0, message: 'StartTime and EndTime are required.' });
      }

      const query = "INSERT INTO OrderTimings (StartTime, EndTime, Status) VALUES (?, ?, 1)";
      pool.query(query, [StartTime, EndTime], (err, result) => {
        if (err) {
          return res.json({ status: 0, message: err.sqlMessage });
        }
        res.json({ status: 1, message: 'Order timing added successfully.' });
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ status: 0, message: 'Server error' });
    }
  },

  updateTiming: async (req, res) => {
    try {
      const { TimingID } = req.params;
      const { StartTime, EndTime } = req.body;

      if (!StartTime || !EndTime) {
        return res.json({ status: 0, message: 'StartTime and EndTime are required.' });
      }

      const query = "UPDATE OrderTimings SET StartTime = ?, EndTime = ? WHERE TimingID = ?";
      pool.query(query, [StartTime, EndTime, TimingID], (err, result) => {
        if (err) {
          return res.json({ status: 0, message: err.sqlMessage });
        }
        res.json({ status: 1, message: 'Order timing updated successfully.' });
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ status: 0, message: 'Server error' });
    }
  },

  getTiming: async (req, res) => {
    try {
      const query = "SELECT * FROM OrderTimings WHERE Status = 1 ORDER BY CreatedAt DESC";
      pool.query(query, (err, results) => {
        if (err) {
          return res.json({ status: 0, message: err.sqlMessage });
        }
        res.json({ status: 1, data: results });
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ status: 0, message: 'Server error' });
    }
  },

  deleteTiming: async (req, res) => {
    try {
      const { TimingID } = req.params;
      const query = "UPDATE OrderTimings SET Status = 0 WHERE TimingID = ?";
      pool.query(query, [TimingID], (err, result) => {
        if (err) {
          return res.json({ status: 0, message: err.sqlMessage });
        }
        res.json({ status: 1, message: 'Order timing deleted successfully.' });
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ status: 0, message: 'Server error' });
    }
  },


// checkOrderTiming: async (req, res) => {
//     try {
//       // Step 1: Check if the shop is open using the ShopStatus toggle
//       const shopStatusQuery = "SELECT ShopStatus FROM AdminShopToggleSettings LIMIT 1"; // Assuming there's only one settings row
//       pool.query(shopStatusQuery, (err, shopResults) => {
//         if (err) {
//           return res.json({ status: 0, message: err.sqlMessage });
//         }
  
//         // If shop is closed (ShopStatus = 0)
//         if (shopResults[0].ShopStatus === 0) {
//           return res.json({ status: 0, message: 'The shop is currently closed.' });
//         }
  
//         // Step 2: Shop is open, now check the order timings
//         const query = "SELECT * FROM OrderTimings WHERE Status = 1 ORDER BY CreatedAt DESC LIMIT 1";
//         pool.query(query, (err, results) => {
//           if (err) {
//             return res.json({ status: 0, message: err.sqlMessage });
//           }
  
//           if (results.length === 0) {
//             return res.json({ status: 0, message: 'No active timings found.' });
//           }
  
//           const currentTime = new Date();
//           const startTime = new Date();
//           const endTime = new Date();
  
//           const [startHours, startMinutes] = results[0].StartTime.split(':');
//           const [endHours, endMinutes] = results[0].EndTime.split(':');
  
//           startTime.setHours(startHours, startMinutes);
//           endTime.setHours(endHours, endMinutes);
  
//           if (currentTime >= startTime && currentTime <= endTime) {
//             res.json({ status: 1, message: 'Order can be placed now.' });
//           } else {
//             res.json({ status: 0, message: 'Order placement is outside the allowed time range.' });
//           }
//         });
//       });
//     } catch (error) {
//       console.log(error);
//       return res.status(500).json({ status: 0, message: 'Server error' });
//     }
//   },

// checkOrderTiming: async (req, res) => {
//     try {
//         // Step 1: Fetch the latest order timings
//         const query = "SELECT * FROM OrderTimings WHERE Status = 1 ORDER BY CreatedAt DESC LIMIT 1";
//         pool.query(query, (err, results) => {
//             if (err) {
//                 return res.json({ status: 0, message: err.sqlMessage });
//             }

//             if (results.length === 0) {
//                 return res.json({ status: 0, message: 'The Shop Is Closed Now.' });
//             }

//             const currentTime = new Date();
//             const startTime = new Date();
//             const endTime = new Date();

//                         // Convert the times to IST
//             const ISTOffset = 5 * 60 + 30; // IST is UTC+5:30

//             currentTime.setMinutes(currentTime.getMinutes() + ISTOffset);
//             startTime.setMinutes(startTime.getMinutes() + ISTOffset);
//             endTime.setMinutes(endTime.getMinutes() + ISTOffset);

//             const [startHours, startMinutes] = results[0].StartTime.split(':');
//             const [endHours, endMinutes] = results[0].EndTime.split(':');

//             startTime.setHours(startHours, startMinutes);
//             endTime.setHours(endHours, endMinutes);

//             // Step 2: Check if current time is within the allowed order timings
//             if (currentTime >= startTime && currentTime <= endTime) {
//                 // If within time, make sure shop status is open
//                 const openShopQuery = "UPDATE AdminShopToggleSettings SET ShopStatus = 1";
//                 pool.query(openShopQuery, (err, result) => {
//                     if (err) {
//                         return res.json({ status: 0, message: 'Error updating shop status.' });
//                     }
//                     res.json({ status: 1, message: 'The shop is open. Order can be placed now.' });
//                 });
//             } else {
//                 // If outside the allowed time, close the shop
//                 const closeShopQuery = "UPDATE AdminShopToggleSettings SET ShopStatus = 0";
//                 pool.query(closeShopQuery, (err, result) => {
//                     if (err) {
//                         return res.json({ status: 0, message: 'Error updating shop status.' });
//                     }
//                     res.json({ status: 0, message: 'The shop is closed due to timing restrictions.' });
//                 });
//             }
//         });
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ status: 0, message: 'Server error' });
//     }
// },


checkOrderTiming: async (req, res) => {
  try {
      const state = await StoreHours.getState();
      return res.json({
          status: state.isOpen ? 1 : 0,
          message: StoreHours.customerMessage(state),
          OpensAt: StoreHours.opensAtText(state),
      });
  } catch (error) {
      console.log(error);
      return res.status(500).json({ status: 0, message: 'Server error' });
  }
},

  // Kept for older admin builds: 0 closes the store, 1 hands it back to the timings.
  toggleShopStatus: async (req, res) => {
      try {
          const mode = String(req.query.status) === '0' ? 'CLOSED' : 'AUTO';
          await StoreHours.setMode(mode, false);
          return res.status(200).json({ "Status": 1, "Message": mode === 'CLOSED' ? 'Store closed' : 'Store follows its timings' });
      } catch (err) {
          console.error("Error in toggling shop status", err);
          return res.status(500).json({ "Status": 0, "Message": "Error in toggling shop status" });
      }
  },

  // PUT /admintiming/store-mode {Mode: AUTO|OPEN|CLOSED, UntilNextChange: bool}
  setStoreMode: async (req, res) => {
      try {
          const mode = String((req.body && req.body.Mode) || '').toUpperCase();
          if (!StoreHours.MODES.includes(mode)) {
              return res.status(400).json({ Status: 0, Message: 'Choose Follow timings, Open now or Close now.' });
          }
          const state = await StoreHours.setMode(mode, !!req.body.UntilNextChange);
          const msg = mode === 'AUTO' ? 'Store now follows its timings'
              : `Store ${mode === 'OPEN' ? 'opened' : 'closed'}${state.modeUntil ? ' until the next scheduled opening or closing' : ''}`;
          return res.json({ Status: 1, Message: msg, State: state });
      } catch (err) {
          console.error('Error in setting store mode', err);
          return res.status(500).json({ Status: 0, Message: 'Could not change the store status' });
      }
  },

  getShopStatus: async (req, res) => {
    try {
        const query = "SELECT * FROM AdminShopToggleSettings LIMIT 1";
        const state = await StoreHours.getState();
        pool.query(query, (err, results) => {
            if (err) {
                return res.json({ status: 0, message: err.sqlMessage });
            }
            return res.json({ status: 1, Shop: results[0], State: state });
        });
    } catch (error) {
        console.log("Error in fetching shop status:", error);
        return res.status(500).json({ status: 0, message: 'Server error' });
    }
},

updateBanner : async (req, resp, next) => {
  try {
      const Body = req.body;
      const updates = [];
      const values = [];

      const allowedFields = [
          'PricePerKm', 'BaseDeliveryCharge', 'Longitude', 'Latitude',
          'CashbackMode', 'CashbackEnabled', 'CashbackPercentage', 'CashbackMaxAmount', 'CancelWindowSeconds', 'LongDistanceFeeEnabled', 'LongDistanceThresholdKm', 'LongDistanceFee',
          'LargeCartThreshold1Items', 'LargeCartThreshold1Minutes',
          'LargeCartThreshold2Items', 'LargeCartThreshold2Minutes',
          'DeliveryAddressVisibility', 'DeliveryProductListVisibility'
      ];

      if (Body.CashbackPercentage !== undefined && !(Number(Body.CashbackPercentage) >= 0 && Number(Body.CashbackPercentage) <= 100)) {
          return resp.status(400).json({ status: 0, Message: "Cashback % must be between 0 and 100" });
      }
      if (Body.CancelWindowSeconds !== undefined && !(Number(Body.CancelWindowSeconds) >= 0 && Number(Body.CancelWindowSeconds) <= 3600)) {
          return resp.status(400).json({ status: 0, Message: "Cancel window must be between 0 and 60 minutes" });
      }
      if (Body.CashbackMaxAmount !== undefined && !(Number(Body.CashbackMaxAmount) >= 0)) {
          return resp.status(400).json({ status: 0, Message: "Maximum cashback cannot be negative" });
      }

      allowedFields.forEach(field => {
          if (Body[field] !== undefined && Body[field] !== null) {
              updates.push(`${field} = ?`);
              values.push(Body[field]);
          }
      });

      if (updates.length === 0) {
          return resp.json({ status: 1, Message: "No changes to update" });
      }

      const queryString = `UPDATE AdminShopToggleSettings SET ${updates.join(', ')} WHERE SettingID = ?`;
      values.push(req.params.SettingID || 1);

      pool.query(queryString, values, function(err, result) {
          if (err) {
              console.log("Error in updating AdminShopToggleSettings:", err);
              return resp.json({ status: 0, Message: "Error in updating settings in DB" });
          }
          return resp.json({ status: 1, Message: "Settings Update Successful" });
      });
  } catch (err) {
      console.log("exception in updating setting ", err);
      return resp.status(500).json({ status: 0, Message: "Error in updating setting" });
  }
},



};

module.exports = TimingController;
