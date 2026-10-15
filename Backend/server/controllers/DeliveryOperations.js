const pool = require('../utils/db.js');
const moment = require('moment');

// Helper to execute MySQL queries with promises
function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

// Haversine formula to compute distance in meters between two lat/lng points
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}

const DeliveryOperations = {
    // -------------------------------------------------------------
    // PHASE 1: Driver Duty Status Management
    // -------------------------------------------------------------
    updateDutyStatus: async (req, resp) => {
        try {
            const driverId = req.AdminID;
            const DutyStatus = req.body.DutyStatus || req.body.dutyStatus || req.body.status;
            const Latitude = req.body.Latitude !== undefined ? req.body.Latitude : req.body.latitude;
            const Longitude = req.body.Longitude !== undefined ? req.body.Longitude : req.body.longitude;
            const BatteryLevel = req.body.BatteryLevel !== undefined ? req.body.BatteryLevel : req.body.batteryLevel;
            const forceOffline = req.body.forceOffline !== undefined ? req.body.forceOffline : req.body.ForceOffline;

            const allowedStatuses = ['ONLINE', 'OFFLINE', 'ON_BREAK', 'ON_DELIVERY'];
            if (!DutyStatus || !allowedStatuses.includes(DutyStatus)) {
                return resp.status(400).json({
                    Status: 0,
                    Message: `Invalid DutyStatus. Allowed values: ${allowedStatuses.join(', ')}`
                });
            }

            // Check if driver has active orders when attempting to go OFFLINE or ON_BREAK
            if ((DutyStatus === 'OFFLINE' || DutyStatus === 'ON_BREAK') && !forceOffline) {
                const activeOrders = await queryAsync(
                    "SELECT OrderID, OrderStatus FROM Orders WHERE DeliveryBoyID = ? AND OrderStatus IN (2, 5, 7)",
                    [driverId]
                );
                if (activeOrders.length > 0) {
                    return resp.status(400).json({
                        Status: 0,
                        RequiresConfirmation: true,
                        ActiveOrdersCount: activeOrders.length,
                        Message: `You have ${activeOrders.length} active delivery in progress. Please complete them before going ${DutyStatus.toLowerCase()} or provide confirmation.`
                    });
                }
            }

            // Get current driver status
            const driverRows = await queryAsync(
                "SELECT AdminID, DutyStatus, BatteryLevel FROM AdminUsers WHERE AdminID = ?",
                [driverId]
            );
            if (driverRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: "Driver account not found" });
            }

            const currentStatus = driverRows[0].DutyStatus || 'OFFLINE';

            // Close existing open shift record if status changed
            if (currentStatus !== DutyStatus) {
                await queryAsync(
                    `UPDATE DeliveryBoyShifts 
                     SET EndedAt = NOW(), FinalLatitude = ?, FinalLongitude = ?, FinalBattery = ? 
                     WHERE DriverID = ? AND EndedAt IS NULL`,
                    [Latitude || null, Longitude || null, BatteryLevel || null, driverId]
                );

                // Insert new shift record
                await queryAsync(
                    `INSERT INTO DeliveryBoyShifts 
                     (DriverID, Status, StartedAt, InitialLatitude, InitialLongitude, InitialBattery) 
                     VALUES (?, ?, NOW(), ?, ?, ?)`,
                    [driverId, DutyStatus, Latitude || null, Longitude || null, BatteryLevel || null]
                );
            }

            // Update AdminUsers
            await queryAsync(
                `UPDATE AdminUsers 
                 SET DutyStatus = ?, 
                     LastLocationLat = COALESCE(?, LastLocationLat), 
                     LastLocationLng = COALESCE(?, LastLocationLng), 
                     LastLocationUpdatedAt = NOW(), 
                     BatteryLevel = COALESCE(?, BatteryLevel) 
                 WHERE AdminID = ?`,
                [DutyStatus, Latitude || null, Longitude || null, BatteryLevel || null, driverId]
            );

            return resp.status(200).json({
                Status: 1,
                Message: `Duty status updated to ${DutyStatus}`,
                DutyStatus: DutyStatus
            });
        } catch (err) {
            console.error("Error updating duty status:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error updating duty status" });
        }
    },

    getDutyStatus: async (req, resp) => {
        try {
            const driverId = req.AdminID;

            const driverRows = await queryAsync(
                `SELECT AdminID, FirstName, LastName, DutyStatus, LastLocationLat, LastLocationLng, 
                        LastLocationUpdatedAt, BatteryLevel, MobileNumber 
                 FROM AdminUsers WHERE AdminID = ?`,
                [driverId]
            );

            if (driverRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: "Driver not found" });
            }

            const driver = driverRows[0];

            // Count active orders
            const activeRows = await queryAsync(
                "SELECT COUNT(*) as count FROM Orders WHERE DeliveryBoyID = ? AND OrderStatus IN (2, 5, 7)",
                [driverId]
            );

            // Count today's delivered orders
            const todayRows = await queryAsync(
                `SELECT COUNT(*) as count FROM Orders 
                 WHERE DeliveryBoyID = ? AND OrderStatus = 1 
                   AND DATE(COALESCE(deliveredDateTime, Delivered_Cancelled_datetime, UpdatedAt)) = CURDATE()`,
                [driverId]
            );

            return resp.status(200).json({
                Status: 1,
                Driver: {
                    DriverID: driver.AdminID,
                    Name: `${driver.FirstName || ''} ${driver.LastName || ''}`.trim(),
                    DutyStatus: driver.DutyStatus || 'OFFLINE',
                    BatteryLevel: driver.BatteryLevel || null,
                    LastLocationLat: driver.LastLocationLat,
                    LastLocationLng: driver.LastLocationLng,
                    LastLocationUpdatedAt: driver.LastLocationUpdatedAt,
                    ActiveOrdersCount: activeRows[0].count,
                    TodayDeliveriesCount: todayRows[0].count
                }
            });
        } catch (err) {
            console.error("Error fetching duty status:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error fetching duty status" });
        }
    },

    // -------------------------------------------------------------
    // PHASE 2: Real-Time GPS Location Ping & Telematics
    // -------------------------------------------------------------
    recordLocationPing: async (req, resp) => {
        try {
            const driverId = req.AdminID;
            const {
                latitude,
                longitude,
                accuracy,
                speed,
                heading,
                batteryLevel,
                isCharging,
                activeOrderId,
                timestamp
            } = req.body;

            // Validate coordinate bounds
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return resp.status(400).json({ Status: 0, Message: "Invalid latitude or longitude coordinates" });
            }

            // Reject (0, 0) coordinates which indicate GPS initialization failure
            if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) {
                return resp.status(400).json({ Status: 0, Message: "Null island coordinates (0,0) rejected" });
            }

            // Verify activeOrderId ownership if supplied
            let verifiedOrderId = null;
            if (activeOrderId) {
                const orderCheck = await queryAsync(
                    "SELECT OrderID FROM Orders WHERE OrderID = ? AND DeliveryBoyID = ? AND OrderStatus IN (2, 5, 7)",
                    [activeOrderId, driverId]
                );
                if (orderCheck.length > 0) {
                    verifiedOrderId = activeOrderId;
                }
            }

            const cleanAccuracy = parseFloat(accuracy) || 0;
            const cleanSpeed = parseFloat(speed) || 0;
            const cleanHeading = parseFloat(heading) || 0;
            const cleanBattery = parseInt(batteryLevel, 10) || null;
            const cleanIsCharging = isCharging ? 1 : 0;

            // Upsert into latest driver locations
            await queryAsync(
                `INSERT INTO DeliveryBoyLocations 
                 (DeliveryBoyID, Latitude, Longitude, Accuracy, Speed, Heading, BatteryLevel, IsCharging, ActiveOrderID, LastUpdatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE 
                     Latitude = VALUES(Latitude), 
                     Longitude = VALUES(Longitude), 
                     Accuracy = VALUES(Accuracy), 
                     Speed = VALUES(Speed), 
                     Heading = VALUES(Heading), 
                     BatteryLevel = VALUES(BatteryLevel), 
                     IsCharging = VALUES(IsCharging), 
                     ActiveOrderID = VALUES(ActiveOrderID), 
                     LastUpdatedAt = NOW()`,
                [driverId, lat, lng, cleanAccuracy, cleanSpeed, cleanHeading, cleanBattery, cleanIsCharging, verifiedOrderId]
            );

            // Append to breadcrumb log
            await queryAsync(
                `INSERT INTO DeliveryBoyLocationLogs 
                 (DeliveryBoyID, Latitude, Longitude, Accuracy, Speed, Heading, BatteryLevel, IsCharging, ActiveOrderID, CreatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [driverId, lat, lng, cleanAccuracy, cleanSpeed, cleanHeading, cleanBattery, cleanIsCharging, verifiedOrderId]
            );

            // Update summary on AdminUsers
            await queryAsync(
                `UPDATE AdminUsers 
                 SET LastLocationLat = ?, LastLocationLng = ?, LastLocationUpdatedAt = NOW(), BatteryLevel = ? 
                 WHERE AdminID = ?`,
                [lat, lng, cleanBattery, driverId]
            );

            return resp.status(200).json({ Status: 1, Message: "Location recorded successfully" });
        } catch (err) {
            console.error("Error recording location ping:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error recording location" });
        }
    },

    // -------------------------------------------------------------
    // PHASE 7: Driver Delay Reporting
    // -------------------------------------------------------------
    reportDelay: async (req, resp) => {
        try {
            const driverId = req.AdminID || (req.user && (req.user.AdminID || req.user.DeliveryBoyID)) || req.driverId;
            const OrderID = req.body.OrderID || req.body.orderId;
            const Reason = req.body.Reason || req.body.reason;
            const RequestedMinutes = req.body.RequestedMinutes !== undefined ? req.body.RequestedMinutes : req.body.requestedMinutes;
            const Remarks = req.body.Remarks || req.body.remarks;
            const Latitude = req.body.Latitude !== undefined ? req.body.Latitude : req.body.latitude;
            const Longitude = req.body.Longitude !== undefined ? req.body.Longitude : req.body.longitude;

            const allowedReasons = [
                'HEAVY_TRAFFIC',
                'WEATHER_CONDITIONS',
                'STORE_PREPARATION_DELAY',
                'ORDER_NOT_READY',
                'DIFFICULTY_LOCATING_CUSTOMER',
                'VEHICLE_ISSUE',
                'OTHER',
                // Backward-compatible synonyms
                'HEAVY_RAIN',
                'RESTAURANT_DELAY',
                'CUSTOMER_LOCATION_ISSUE',
                'ROAD_BLOCK',
                'ORDER_ISSUE',
                'APP_NETWORK_ISSUE'
            ];

            if (!Reason || !allowedReasons.includes(Reason)) {
                return resp.status(400).json({
                    Status: 0,
                    Message: `Invalid Reason. Allowed reasons: ${allowedReasons.join(', ')}`
                });
            }

            // When "OTHER" is selected, require a meaningful explanation (mandatory >= 5 characters)
            if (Reason === 'OTHER' && (!Remarks || Remarks.trim().length < 5)) {
                return resp.status(400).json({
                    Status: 0,
                    Message: "A meaningful explanation is required when selecting 'Other'"
                });
            }

            const allowedMinutes = [5, 10, 15, 20, 30, 45, 60];
            const minutes = parseInt(RequestedMinutes, 10);
            if (!allowedMinutes.includes(minutes)) {
                return resp.status(400).json({
                    Status: 0,
                    Message: `Invalid RequestedMinutes. Allowed values: ${allowedMinutes.join(', ')}`
                });
            }

            // Verify order ownership and active status
            const orderRows = await queryAsync(
                "SELECT OrderID, OrderStatus, EstimateDateTime, TotalDelayMinutes, CreatedAt, UserID FROM Orders WHERE OrderID = ? AND DeliveryBoyID = ?",
                [OrderID, driverId]
            );

            if (orderRows.length === 0) {
                return resp.status(403).json({
                    Status: 0,
                    Message: "Order not found or not assigned to you"
                });
            }

            const order = orderRows[0];
            if (![2, 5, 7].includes(order.OrderStatus)) {
                return resp.status(400).json({
                    Status: 0,
                    Message: "Delay can only be reported for active orders (Packed, Out for Delivery, Arrived)"
                });
            }

            // Anti-duplicate / Idempotent retry check:
            // If the same delay was reported recently with the same reason and minutes, avoid adding it again
            const recentDelays = await queryAsync(
                "SELECT DelayID, Reason, RequestedMinutes, CreatedAt FROM OrderDelays WHERE OrderID = ? ORDER BY CreatedAt DESC LIMIT 1",
                [OrderID]
            );

            if (recentDelays.length > 0) {
                const lastDelay = recentDelays[0];
                const timeDiffMs = Date.now() - new Date(lastDelay.CreatedAt).getTime();
                if (timeDiffMs < 2 * 60 * 1000 && lastDelay.Reason === Reason && parseInt(lastDelay.RequestedMinutes, 10) === minutes) {
                    return resp.status(200).json({
                        Status: 1,
                        Message: `Delay of ${minutes} mins already recorded for order ETA (idempotent retry)`,
                        DelayID: lastDelay.DelayID,
                        RequestedMinutes: minutes,
                        NewETA: moment(order.EstimateDateTime).format('YYYY-MM-DD HH:mm:ss'),
                        IsDuplicateRetry: true
                    });
                }
            }

            // Authoritative baseline calculation:
            // If order already had delays, baseline is the ETA before delays were added
            const existingDelayMins = parseInt(order.TotalDelayMinutes || 0, 10);
            let baselineDate;
            if (order.EstimateDateTime) {
                const currentEtaTime = new Date(order.EstimateDateTime).getTime();
                baselineDate = new Date(currentEtaTime - (existingDelayMins * 60000));
            } else if (order.CreatedAt) {
                baselineDate = new Date(new Date(order.CreatedAt).getTime() + (25 * 60000));
            } else {
                baselineDate = new Date();
            }

            // Calculate revised authoritative ETA from baseline
            const updatedDate = new Date(baselineDate.getTime() + (minutes * 60000));
            const formattedNewETA = moment(updatedDate).format('YYYY-MM-DD HH:mm:ss');
            const formattedBaseline = moment(baselineDate).format('YYYY-MM-DD HH:mm:ss');

            // Insert delay audit record as APPLIED immediately (no admin approval required)
            const insertResult = await queryAsync(
                `INSERT INTO OrderDelays 
                 (OrderID, DriverID, Reason, RequestedMinutes, ApprovedMinutes, Status, Latitude, Longitude, Remarks, CreatedAt) 
                 VALUES (?, ?, ?, ?, ?, 'APPLIED', ?, ?, ?, NOW())`,
                [OrderID, driverId, Reason, minutes, minutes, Latitude || null, Longitude || null, Remarks || null]
            );

            // Update order authoritative ETA and delay status immediately without changing OrderStatus
            await queryAsync(
                `UPDATE Orders 
                 SET EstimateDateTime = ?, 
                     DelayStatus = 'REPORTED', 
                     TotalDelayMinutes = ?, 
                     UpdatedAt = NOW() 
                 WHERE OrderID = ?`,
                [formattedNewETA, minutes, OrderID]
            );

            // Record in authoritative OrderETAAdjustments audit ledger
            await queryAsync(
                `INSERT INTO OrderETAAdjustments 
                 (OrderID, PreviousETA, NewETA, AdjustmentMinutes, Reason, DriverID, InitiatorType, CreatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, 'DRIVER', NOW())`,
                [
                    OrderID,
                    order.EstimateDateTime || null,
                    formattedNewETA,
                    minutes,
                    `Rider updated delay: ${Reason.replace(/_/g, ' ')} (+${minutes} mins from baseline ${formattedBaseline})${Remarks ? '. Remarks: ' + Remarks : ''}`,
                    driverId
                ]
            );

            // Log operational timeline event
            const noteText = `Rider reported delay: ${Reason.replace(/_/g, ' ')} (+${minutes} mins, New ETA: ${formattedNewETA}). ${Remarks ? 'Remarks: ' + Remarks : ''}`;
            await queryAsync(
                "INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, ?, ?, NOW())",
                [OrderID, order.OrderStatus, noteText]
            );

            // Send notification to customer via existing notification infrastructure
            const humanReadableReasons = {
                'HEAVY_TRAFFIC': 'heavy traffic',
                'WEATHER_CONDITIONS': 'weather conditions',
                'HEAVY_RAIN': 'weather conditions',
                'STORE_PREPARATION_DELAY': 'store preparation delay',
                'RESTAURANT_DELAY': 'store preparation delay',
                'ORDER_NOT_READY': 'order not ready for pickup',
                'ORDER_ISSUE': 'order not ready for pickup',
                'DIFFICULTY_LOCATING_CUSTOMER': 'difficulty locating your address',
                'CUSTOMER_LOCATION_ISSUE': 'difficulty locating your address',
                'VEHICLE_ISSUE': 'delivery vehicle issue',
                'ROAD_BLOCK': 'road block / diversion',
                'APP_NETWORK_ISSUE': 'network connectivity issue',
                'OTHER': Remarks && Remarks.trim().length > 0 ? Remarks.trim() : 'operational delay'
            };

            const reasonLabel = humanReadableReasons[Reason] || Reason.replace(/_/g, ' ').toLowerCase();
            const arrivalTimeFormatted = moment(updatedDate).format('hh:mm A');

            if (order.UserID) {
                try {
                    const CommonController = require('./CommonController');
                    const notifBody = {
                        Title: `Delivery Delayed — Order #${OrderID}`,
                        Message: `Your delivery is taking longer than expected due to ${reasonLabel}. Updated estimated arrival: ${arrivalTimeFormatted}.`
                    };
                    await CommonController.Send_Notification(notifBody, order.UserID);
                } catch (notifErr) {
                    console.error("Error sending delay notification to user:", notifErr);
                }
            }

            return resp.status(200).json({
                Status: 1,
                Message: `Delay of ${minutes} mins applied to order ETA immediately`,
                DelayID: insertResult.insertId,
                RequestedMinutes: minutes,
                Reason: Reason,
                ReasonLabel: reasonLabel,
                BaselineETA: formattedBaseline,
                NewETA: formattedNewETA
            });
        } catch (err) {
            console.error("Error reporting delay:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error reporting delay" });
        }
    },

    // -------------------------------------------------------------
    // PHASE 13: Driver Incident & Issue Reporting
    // -------------------------------------------------------------
    reportIssue: async (req, resp) => {
        try {
            const driverId = req.AdminID;
            const OrderID = req.body.OrderID || req.body.orderId;
            const IssueType = req.body.IssueType || req.body.issueType;
            const Description = req.body.Description || req.body.description;
            const Latitude = req.body.Latitude !== undefined ? req.body.Latitude : req.body.latitude;
            const Longitude = req.body.Longitude !== undefined ? req.body.Longitude : req.body.longitude;

            const allowedIssues = [
                'VEHICLE_BREAKDOWN',
                'CUSTOMER_UNREACHABLE',
                'WRONG_ADDRESS',
                'ROAD_BLOCK',
                'RESTAURANT_PROBLEM',
                'ORDER_PROBLEM',
                'WEATHER',
                'APP_PROBLEM',
                'NETWORK_PROBLEM',
                'OTHER'
            ];

            if (!IssueType || !allowedIssues.includes(IssueType)) {
                return resp.status(400).json({
                    Status: 0,
                    Message: `Invalid IssueType. Allowed: ${allowedIssues.join(', ')}`
                });
            }

            // Verify order ownership
            const orderRows = await queryAsync(
                "SELECT OrderID, OrderStatus FROM Orders WHERE OrderID = ? AND DeliveryBoyID = ?",
                [OrderID, driverId]
            );

            if (orderRows.length === 0) {
                return resp.status(403).json({ Status: 0, Message: "Order not assigned to you" });
            }

            const order = orderRows[0];

            const insertResult = await queryAsync(
                `INSERT INTO OrderIssues 
                 (OrderID, DriverID, IssueType, Description, Latitude, Longitude, Status, CreatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, 'OPEN', NOW())`,
                [OrderID, driverId, IssueType, Description || null, Latitude || null, Longitude || null]
            );

            // Add timeline note
            const timelineNote = `Driver reported issue: ${IssueType.replace('_', ' ')}. ${Description ? 'Details: ' + Description : ''}`;
            await queryAsync(
                "INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, ?, ?, NOW())",
                [OrderID, order.OrderStatus, timelineNote]
            );

            return resp.status(200).json({
                Status: 1,
                Message: "Issue reported to dispatcher",
                IssueID: insertResult.insertId
            });
        } catch (err) {
            console.error("Error reporting issue:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error reporting issue" });
        }
    },

    // -------------------------------------------------------------
    // PHASE 8: Admin Delay Review Queue & Action Desk
    // -------------------------------------------------------------
    getDelayQueue: async (req, resp) => {
        try {
            const delays = await queryAsync(`
                SELECT 
                    d.DelayID, d.OrderID, d.DriverID, d.Reason, d.RequestedMinutes, d.Status,
                    d.Latitude, d.Longitude, d.Remarks, d.CreatedAt, d.ReviewedAt, d.ApprovedMinutes, d.AdminReason,
                    o.EstimateDateTime, o.OrderStatus, o.Address, o.GrandTotal,
                    CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, '')) AS DriverName,
                    u.MobileNumber AS DriverMobile
                FROM OrderDelays d
                LEFT JOIN Orders o ON d.OrderID = o.OrderID
                LEFT JOIN AdminUsers u ON d.DriverID = u.AdminID
                ORDER BY (d.Status = 'PENDING') DESC, d.CreatedAt DESC
                LIMIT 100
            `);

            return resp.status(200).json({
                Status: 1,
                Delays: delays
            });
        } catch (err) {
            console.error("Error fetching delay queue:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error fetching delay queue" });
        }
    },

    reviewDelay: async (req, resp) => {
        try {
            const delayId = req.params.DelayID;
            const action = ((req.body.action || req.body.Action || '')).toUpperCase();
            const approvedMinutes = req.body.approvedMinutes !== undefined ? req.body.approvedMinutes : req.body.ApprovedMinutes;
            const adminReason = req.body.adminReason || req.body.AdminReason;
            const adminId = req.AdminID || null;

            if (!['APPROVE', 'ADJUST', 'REJECT'].includes(action)) {
                return resp.status(400).json({ Status: 0, Message: "Action must be APPROVE, ADJUST, or REJECT" });
            }

            const delayRows = await queryAsync("SELECT * FROM OrderDelays WHERE DelayID = ?", [delayId]);
            if (delayRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: "Delay record not found" });
            }

            const delay = delayRows[0];
            if (!['PENDING', 'APPLIED'].includes(delay.Status)) {
                return resp.status(400).json({ Status: 0, Message: `Delay already reviewed with status: ${delay.Status}` });
            }

            const orderRows = await queryAsync("SELECT * FROM Orders WHERE OrderID = ?", [delay.OrderID]);
            if (orderRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: "Associated order not found" });
            }

            const order = orderRows[0];
            const currentETA = order.EstimateDateTime ? new Date(order.EstimateDateTime) : new Date();

            if (action === 'APPROVE') {
                // Delay was already applied upon driver report — do not double count!
                await queryAsync(
                    `UPDATE Orders 
                     SET DelayStatus = 'APPROVED', 
                         UpdatedAt = NOW() 
                     WHERE OrderID = ?`,
                    [delay.OrderID]
                );

                await queryAsync(
                    `UPDATE OrderDelays 
                     SET Status = 'APPROVED', ApprovedMinutes = ?, ReviewedAt = NOW(), ReviewedBy = ?, AdminReason = ? 
                     WHERE DelayID = ?`,
                    [delay.RequestedMinutes, adminId, adminReason || 'Approved by Admin', delayId]
                );

                const timelineNote = `Admin confirmed rider delay (+${delay.RequestedMinutes} mins). Current ETA: ${moment(currentETA).format('YYYY-MM-DD HH:mm:ss')}`;
                await queryAsync(
                    "INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, ?, ?, NOW())",
                    [delay.OrderID, order.OrderStatus || 2, timelineNote]
                );

                return resp.status(200).json({
                    Status: 1,
                    Message: `Delay approved (+${delay.RequestedMinutes} mins)`,
                    NewETA: moment(currentETA).format('YYYY-MM-DD HH:mm:ss'),
                    ApprovedMinutes: delay.RequestedMinutes
                });
            } else if (action === 'ADJUST') {
                const targetMinutes = parseInt(approvedMinutes !== undefined ? approvedMinutes : 5, 10);
                const deltaMinutes = targetMinutes - delay.RequestedMinutes;
                const updatedDate = new Date(currentETA.getTime() + deltaMinutes * 60000);
                const formattedNewETA = moment(updatedDate).format('YYYY-MM-DD HH:mm:ss');

                await queryAsync(
                    `UPDATE Orders 
                     SET EstimateDateTime = ?, 
                         DelayStatus = 'ADJUSTED', 
                         TotalDelayMinutes = GREATEST(0, TotalDelayMinutes + ?), 
                         UpdatedAt = NOW() 
                     WHERE OrderID = ?`,
                    [formattedNewETA, deltaMinutes, delay.OrderID]
                );

                await queryAsync(
                    `INSERT INTO OrderETAAdjustments 
                     (OrderID, PreviousETA, NewETA, AdjustmentMinutes, Reason, AdminID, InitiatorType, DriverID, CreatedAt) 
                     VALUES (?, ?, ?, ?, ?, ?, 'ADMIN_OVERRULE', ?, NOW())`,
                    [
                        delay.OrderID,
                        order.EstimateDateTime || null,
                        formattedNewETA,
                        deltaMinutes,
                        `Admin adjusted rider delay from +${delay.RequestedMinutes}m to +${targetMinutes}m. ${adminReason || ''}`.trim(),
                        adminId,
                        delay.DriverID
                    ]
                );

                await queryAsync(
                    `UPDATE OrderDelays 
                     SET Status = 'ADJUSTED', ApprovedMinutes = ?, ReviewedAt = NOW(), ReviewedBy = ?, AdminReason = ? 
                     WHERE DelayID = ?`,
                    [targetMinutes, adminId, adminReason || null, delayId]
                );

                const timelineNote = `Admin adjusted rider delay to +${targetMinutes} mins (New ETA: ${formattedNewETA}). ${adminReason ? 'Reason: ' + adminReason : ''}`;
                await queryAsync(
                    "INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, ?, ?, NOW())",
                    [delay.OrderID, order.OrderStatus || 2, timelineNote]
                );

                return resp.status(200).json({
                    Status: 1,
                    Message: `Delay adjusted to +${targetMinutes} mins`,
                    NewETA: formattedNewETA,
                    ApprovedMinutes: targetMinutes
                });
            } else {
                // REJECT: Revert driver's applied delay
                const revertMinutes = -delay.RequestedMinutes;
                const updatedDate = new Date(currentETA.getTime() + revertMinutes * 60000);
                const formattedNewETA = moment(updatedDate).format('YYYY-MM-DD HH:mm:ss');

                await queryAsync(
                    `UPDATE Orders 
                     SET EstimateDateTime = ?, 
                         DelayStatus = 'REJECTED', 
                         TotalDelayMinutes = GREATEST(0, TotalDelayMinutes - ?), 
                         UpdatedAt = NOW() 
                     WHERE OrderID = ?`,
                    [formattedNewETA, delay.RequestedMinutes, delay.OrderID]
                );

                await queryAsync(
                    `INSERT INTO OrderETAAdjustments 
                     (OrderID, PreviousETA, NewETA, AdjustmentMinutes, Reason, AdminID, InitiatorType, DriverID, CreatedAt) 
                     VALUES (?, ?, ?, ?, ?, ?, 'ADMIN_OVERRULE', ?, NOW())`,
                    [
                        delay.OrderID,
                        order.EstimateDateTime || null,
                        formattedNewETA,
                        revertMinutes,
                        `Admin rejected rider delay of +${delay.RequestedMinutes}m. ${adminReason || ''}`.trim(),
                        adminId,
                        delay.DriverID
                    ]
                );

                await queryAsync(
                    `UPDATE OrderDelays 
                     SET Status = 'REJECTED', ApprovedMinutes = 0, ReviewedAt = NOW(), ReviewedBy = ?, AdminReason = ? 
                     WHERE DelayID = ?`,
                    [adminId, adminReason || 'Rejected by Admin', delayId]
                );

                const rejectNote = `Rider delay request of +${delay.RequestedMinutes}m rejected by operations. ${adminReason ? 'Reason: ' + adminReason : ''}`;
                await queryAsync(
                    "INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, ?, ?, NOW())",
                    [delay.OrderID, order.OrderStatus || 2, rejectNote]
                );

                return resp.status(200).json({
                    Status: 1,
                    Message: "Delay rejected and reverted from ETA",
                    NewETA: formattedNewETA,
                    ApprovedMinutes: 0
                });
            }
        } catch (err) {
            console.error("Error reviewing delay:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error reviewing delay" });
        }
    },

    // -------------------------------------------------------------
    // PHASE 11: Admin Live Fleet & Operations Radar Command Center
    // -------------------------------------------------------------
    getLiveOperations: async (req, resp) => {
        try {
            // Fetch active orders (2 = Packed/Assigned, 5 = Out for Delivery, 7 = Arrived)
            const activeOrders = await queryAsync(`
                SELECT 
                    o.OrderID, o.OrderStatus, o.DeliveryBoyID, o.UserID, o.Address, o.Latitude AS CustomerLat, 
                    o.Longitude AS CustomerLng, o.Distance, o.EstimateDateTime, o.DelayStatus, o.TotalDelayMinutes, 
                    o.ScheduleStatus, o.ScheduledDateTime,
                    o.GrandTotal, o.CreatedAt, o.UpdatedAt, o.CurrentLeg,
                    CASE 
                        WHEN o.DeliveryBoyID = 0 OR o.DeliveryBoyID IS NULL THEN 'UNASSIGNED'
                        ELSE CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, '')) 
                    END AS DriverName,
                    u.MobileNumber AS DriverMobile, u.BatteryLevel, 
                    CASE 
                        WHEN o.DeliveryBoyID = 0 OR o.DeliveryBoyID IS NULL THEN 'UNASSIGNED'
                        ELSE COALESCE(u.DutyStatus, 'OFFLINE')
                    END AS DutyStatus,
                    loc.Latitude AS DriverLat, loc.Longitude AS DriverLng, loc.LastUpdatedAt AS DriverLastPing
                FROM Orders o
                LEFT JOIN AdminUsers u ON o.DeliveryBoyID = u.AdminID
                LEFT JOIN DeliveryBoyLocations loc ON o.DeliveryBoyID = loc.DeliveryBoyID
                WHERE o.OrderStatus IN (8, 2, 5, 7)
                ORDER BY (o.OrderStatus = 8 OR o.DeliveryBoyID = 0 OR o.DeliveryBoyID IS NULL) DESC, o.EstimateDateTime ASC
            `);

            const now = new Date().getTime();
            let onTimeCount = 0;
            let atRiskCount = 0;
            let delayedCount = 0;

            const processedOrders = activeOrders.map(order => {
                const isScheduledFuture = order.ScheduleStatus === 'Scheduled' && order.ScheduledDateTime && (new Date(order.ScheduledDateTime).getTime() > now);
                const etaTime = order.EstimateDateTime ? new Date(order.EstimateDateTime).getTime() : now + 15 * 60000;
                const diffMin = (etaTime - now) / 60000;

                let slaStatus = 'ON_TIME';
                if (isScheduledFuture) {
                    slaStatus = 'SCHEDULED';
                    onTimeCount++;
                } else if (diffMin < 0) {
                    slaStatus = 'DELAYED';
                    delayedCount++;
                } else if (diffMin <= 5) {
                    slaStatus = 'AT_RISK';
                    atRiskCount++;
                } else {
                    slaStatus = 'ON_TIME';
                    onTimeCount++;
                }

                // Calculate distance between driver and customer if both coordinates exist
                let liveDistanceMeters = null;
                if (order.DriverLat && order.DriverLng && order.CustomerLat && order.CustomerLng) {
                    liveDistanceMeters = calculateDistanceMeters(
                        order.DriverLat,
                        order.DriverLng,
                        order.CustomerLat,
                        order.CustomerLng
                    );
                }

                return {
                    ...order,
                    SlaStatus: slaStatus,
                    RemainingMinutes: Math.round(diffMin),
                    LiveDistanceMeters: liveDistanceMeters
                };
            });

            // Fetch all delivery fleet drivers (Role = 2)
            const fleetDrivers = await queryAsync(`
                SELECT 
                    u.AdminID AS DriverID,
                    CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, '')) AS Name,
                    u.MobileNumber,
                    COALESCE(u.DutyStatus, 'OFFLINE') AS DutyStatus,
                    u.BatteryLevel,
                    u.LastLocationLat,
                    u.LastLocationLng,
                    u.LastLocationUpdatedAt,
                    loc.Accuracy,
                    loc.Speed,
                    loc.Heading,
                    loc.ActiveOrderID,
                    (SELECT COUNT(*) FROM Orders o WHERE o.DeliveryBoyID = u.AdminID AND o.OrderStatus IN (2, 5, 7)) AS ActiveOrdersCount
                FROM AdminUsers u
                LEFT JOIN DeliveryBoyLocations loc ON u.AdminID = loc.DeliveryBoyID
                WHERE u.Role = 2 AND u.Status = 1
                ORDER BY (u.DutyStatus = 'ONLINE' OR u.DutyStatus = 'ON_DELIVERY') DESC, u.FirstName ASC
            `);

            // Mark stale drivers (> 10 minutes without ping)
            const processedDrivers = fleetDrivers.map(d => {
                const isStale = d.LastLocationUpdatedAt
                    ? now - new Date(d.LastLocationUpdatedAt).getTime() > 10 * 60000
                    : true;
                return {
                    ...d,
                    IsStale: isStale
                };
            });

            // Count unassigned orders (Status 8 = Received, 2 = Packed/Assigned but DeliveryBoyID = 0)
            const unassignedRows = await queryAsync(
                "SELECT COUNT(*) as count FROM Orders WHERE OrderStatus IN (8, 2) AND (DeliveryBoyID = 0 OR DeliveryBoyID IS NULL)"
            );

            const onlineCount = processedDrivers.filter(d => d.DutyStatus === 'ONLINE' || d.DutyStatus === 'ON_DELIVERY').length;
            const offlineCount = processedDrivers.filter(d => d.DutyStatus === 'OFFLINE' || d.DutyStatus === 'ON_BREAK').length;

            return resp.status(200).json({
                Status: 1,
                KPIs: {
                    activeDeliveries: activeOrders.length,
                    onTimeCount,
                    atRiskCount,
                    delayedCount,
                    onlineDrivers: onlineCount,
                    offlineDrivers: offlineCount,
                    unassignedOrders: unassignedRows[0].count
                },
                ActiveDeliveries: processedOrders,
                FleetDrivers: processedDrivers
            });
        } catch (err) {
            console.error("Error fetching live operations data:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error fetching live operations" });
        }
    },

    // -------------------------------------------------------------
    // PHASE 12: Admin Driver Assignment & Reassignment
    // -------------------------------------------------------------
    assignDeliveryBoy: async (req, resp) => {
        try {
            const orderId = req.params.OrderID;
            const DeliveryBoyID = parseInt(req.body.DeliveryBoyID || req.body.NewDeliveryBoyID, 10);
            const Reason = req.body.Reason || null;
            const adminId = req.AdminID || null;

            if (!DeliveryBoyID || isNaN(DeliveryBoyID) || DeliveryBoyID <= 0) {
                return resp.status(400).json({ Status: 0, Message: "Valid DeliveryBoyID is required" });
            }

            // 1. Verify order exists
            const orderRows = await queryAsync("SELECT * FROM Orders WHERE OrderID = ?", [orderId]);
            if (orderRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: "Order not found" });
            }

            const order = orderRows[0];

            // 2. Prevent assignment if order is Cancelled (4) or Delivered (1)
            if (order.OrderStatus === 1) {
                return resp.status(400).json({ Status: 0, Message: "Order delivered cannot be assigned" });
            }
            if (order.OrderStatus === 4 || order.OrderStatus === 3) {
                return resp.status(400).json({ Status: 0, Message: "Order cancelled cannot be assigned" });
            }

            // 3. Verify driver exists and belongs to a valid Delivery Boy (Role = 2)
            const driverRows = await queryAsync(
                "SELECT AdminID, FirstName, LastName, Status, Role, DutyStatus, MobileNumber FROM AdminUsers WHERE AdminID = ? AND Role = 2",
                [DeliveryBoyID]
            );

            if (driverRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: "Delivery boy not found" });
            }

            const driver = driverRows[0];

            // 4. Eligibility: Active status (not suspended/inactive)
            if (driver.Status !== 1) {
                return resp.status(400).json({ Status: 0, Message: "Driver is unavailable" });
            }

            // 5. Eligibility: Duty Status (must be ONLINE or ON_DELIVERY)
            const dutyStatus = (driver.DutyStatus || '').toUpperCase();
            const allowOffline = req.body.ForceAssign || req.body.force;
            if (dutyStatus !== 'ONLINE' && dutyStatus !== 'ON_DELIVERY' && !allowOffline) {
                return resp.status(400).json({ Status: 0, Message: "Driver is currently offline" });
            }

            // 6. Eligibility: Capacity check (MaxOrders = 5)
            const countRows = await queryAsync(
                "SELECT COUNT(*) AS activeCount FROM Orders WHERE DeliveryBoyID = ? AND OrderStatus IN (2, 5, 7)",
                [DeliveryBoyID]
            );
            const activeCount = countRows[0].activeCount || 0;
            const maxCapacity = 5;

            const alreadyOwns = (order.DeliveryBoyID === DeliveryBoyID);
            if (!alreadyOwns && activeCount >= maxCapacity) {
                return resp.status(400).json({ Status: 0, Message: "Driver has reached maximum active order capacity" });
            }

            const driverName = `${driver.FirstName || ''} ${driver.LastName || ''}`.trim() || `Driver #${DeliveryBoyID}`;
            const previousDriverId = order.DeliveryBoyID;
            const isReassignment = previousDriverId && previousDriverId > 0 && previousDriverId !== DeliveryBoyID;

            // 7. Update order state: DeliveryBoyID, IsAssigned = 1, OrderStatus = 2 (Assigned)
            await queryAsync(
                `UPDATE Orders 
                 SET DeliveryBoyID = ?, IsAssigned = 1, OrderStatus = 2, AssignedAt = NOW(), UpdatedAt = NOW() 
                 WHERE OrderID = ?`,
                [DeliveryBoyID, orderId]
            );

            // 8. Update driver ActiveOrdersCount in AdminUsers
            await queryAsync(
                "UPDATE AdminUsers SET ActiveOrdersCount = (SELECT COUNT(*) FROM Orders WHERE DeliveryBoyID = ? AND OrderStatus IN (2, 5, 7)) WHERE AdminID = ?",
                [DeliveryBoyID, DeliveryBoyID]
            );
            if (isReassignment) {
                await queryAsync(
                    "UPDATE AdminUsers SET ActiveOrdersCount = (SELECT COUNT(*) FROM Orders WHERE DeliveryBoyID = ? AND OrderStatus IN (2, 5, 7)) WHERE AdminID = ?",
                    [previousDriverId, previousDriverId]
                );
            }

            // 9. Audit logging in OrderStatusTimeline
            let timelineNote = "";
            if (isReassignment) {
                timelineNote = `Order reassigned from driver #${previousDriverId} to ${driverName} (#${DeliveryBoyID}) by Admin #${adminId}. Reason: ${Reason || 'Operational dispatcher action'}`;
            } else {
                timelineNote = `Order assigned to driver ${driverName} (#${DeliveryBoyID}) by Admin #${adminId}`;
            }

            await queryAsync(
                "INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, 2, ?, NOW())",
                [orderId, timelineNote]
            );

            // 10. Auto-resolve any open OrderIssues if this was a reassignment
            if (isReassignment) {
                await queryAsync(
                    `UPDATE OrderIssues 
                     SET Status = 'RESOLVED', ResolvedAt = NOW(), ResolvedBy = ?, 
                         ResolutionNotes = 'Auto-resolved via driver reassignment' 
                     WHERE OrderID = ? AND Status = 'OPEN'`,
                    [adminId, orderId]
                );
            }

            return resp.status(200).json({
                Status: 1,
                Message: isReassignment
                    ? `Order successfully reassigned to ${driverName}`
                    : `Order successfully assigned to ${driverName}`,
                OrderID: parseInt(orderId, 10),
                DeliveryBoyID: DeliveryBoyID,
                OrderStatus: 2,
                DriverName: driverName,
                IsReassignment: !!isReassignment
            });
        } catch (err) {
            console.error("Error assigning order to delivery boy:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error assigning order" });
        }
    },

    reassignDriver: async (req, resp) => {
        if (req.body.NewDeliveryBoyID && !req.body.DeliveryBoyID) {
            req.body.DeliveryBoyID = req.body.NewDeliveryBoyID;
        }
        return DeliveryOperations.assignDeliveryBoy(req, resp);
    },

    getEligibleDrivers: async (req, resp) => {
        try {
            const drivers = await queryAsync(`
                SELECT 
                    u.AdminID AS DriverID,
                    CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, '')) AS Name,
                    u.MobileNumber,
                    COALESCE(u.DutyStatus, 'OFFLINE') AS DutyStatus,
                    u.Status AS AccountStatus,
                    u.BatteryLevel,
                    COALESCE(u.VehicleType, 'Motorcycle') AS VehicleType,
                    COALESCE(u.VehicleNumber, 'N/A') AS VehicleNumber,
                    loc.Latitude AS CurrentLat,
                    loc.Longitude AS CurrentLng,
                    loc.LastUpdatedAt AS LastLocationUpdatedAt,
                    (SELECT COUNT(*) FROM Orders o WHERE o.DeliveryBoyID = u.AdminID AND o.OrderStatus IN (2, 5, 7)) AS ActiveOrdersCount
                FROM AdminUsers u
                LEFT JOIN DeliveryBoyLocations loc ON u.AdminID = loc.DeliveryBoyID
                WHERE u.Role = 2 AND u.Status != 0
                ORDER BY (u.DutyStatus = 'ONLINE' OR u.DutyStatus = 'ON_DELIVERY') DESC, u.FirstName ASC
            `);

            const now = Date.now();
            const maxCapacity = 5;

            const processed = drivers.map(d => {
                const activeCount = d.ActiveOrdersCount || 0;
                const availableCapacity = Math.max(0, maxCapacity - activeCount);

                let gpsStatus = 'Unavailable';
                let lastGpsText = 'No location';
                if (d.LastLocationUpdatedAt) {
                    const diffSec = Math.floor((now - new Date(d.LastLocationUpdatedAt).getTime()) / 1000);
                    if (diffSec < 300) {
                        gpsStatus = 'Active';
                        lastGpsText = diffSec < 60 ? `${diffSec} sec ago` : `${Math.floor(diffSec / 60)} min ago`;
                    } else {
                        gpsStatus = 'Stale';
                        lastGpsText = `${Math.floor(diffSec / 60)} min ago`;
                    }
                }

                let isEligible = true;
                let ineligibilityReason = null;

                if (d.AccountStatus !== 1) {
                    isEligible = false;
                    ineligibilityReason = "Driver is unavailable";
                } else if (d.DutyStatus !== 'ONLINE' && d.DutyStatus !== 'ON_DELIVERY') {
                    isEligible = false;
                    ineligibilityReason = "Driver is currently offline";
                } else if (activeCount >= maxCapacity) {
                    isEligible = false;
                    ineligibilityReason = "Driver has reached maximum active order capacity";
                }

                return {
                    DriverID: d.DriverID,
                    Name: d.Name.trim() || `Driver #${d.DriverID}`,
                    MobileNumber: d.MobileNumber || '--',
                    DutyStatus: d.DutyStatus,
                    AccountStatus: d.AccountStatus,
                    BatteryLevel: d.BatteryLevel !== null && d.BatteryLevel !== undefined ? d.BatteryLevel : null,
                    VehicleType: d.VehicleType,
                    VehicleNumber: d.VehicleNumber,
                    CurrentLat: d.CurrentLat,
                    CurrentLng: d.CurrentLng,
                    GpsStatus: gpsStatus,
                    LastGpsText: lastGpsText,
                    ActiveOrdersCount: activeCount,
                    MaxCapacity: maxCapacity,
                    AvailableCapacity: availableCapacity,
                    IsEligible: isEligible,
                    IneligibilityReason: ineligibilityReason
                };
            });

            return resp.status(200).json({
                Status: 1,
                Drivers: processed
            });
        } catch (err) {
            console.error("Error fetching eligible drivers:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error fetching eligible drivers" });
        }
    },

    // -------------------------------------------------------------
    // PHASE 10: Dynamic Quick-Commerce ETA Calculator
    // -------------------------------------------------------------
    calculateDynamicETA: async (req, resp) => {
        try {
            const orderId = req.params.OrderID;
            const orderRows = await queryAsync(
                "SELECT OrderID, Distance, CreatedAt, EstimateDateTime, OrderSizeBufferMinutes, TotalItemQuantity, TotalDelayMinutes FROM Orders WHERE OrderID = ?",
                [orderId]
            );

            if (orderRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: "Order not found" });
            }

            const order = orderRows[0];

            let totalItemQty = order.TotalItemQuantity || 0;
            if (!totalItemQty) {
                const itemRows = await queryAsync("SELECT SUM(Quantity) as totalQty FROM OrderItems WHERE OrderID = ?", [orderId]);
                totalItemQty = parseInt((itemRows[0] && itemRows[0].totalQty) || 0, 10);
            }

            // Fetch dynamic shop threshold settings
            const shopSettings = await queryAsync("SELECT LargeCartThreshold1Items, LargeCartThreshold1Minutes, LargeCartThreshold2Items, LargeCartThreshold2Minutes FROM AdminShopToggleSettings LIMIT 1");
            const t1Items = shopSettings[0] ? (shopSettings[0].LargeCartThreshold1Items || 10) : 10;
            const t1Mins = shopSettings[0] ? (shopSettings[0].LargeCartThreshold1Minutes || 10) : 10;
            const t2Items = shopSettings[0] ? (shopSettings[0].LargeCartThreshold2Items || 20) : 20;
            const t2Mins = shopSettings[0] ? (shopSettings[0].LargeCartThreshold2Minutes || 10) : 10;

            let orderSizeBuffer = 0;
            if (totalItemQty <= 10) {
                orderSizeBuffer = 0;
            } else {
                orderSizeBuffer = Math.ceil((totalItemQty - 10) / 10) * 10;
            }

            const DeliveryETA = require('./DeliveryETA');
            let baseDeliveryMinutes = order.BaseETAMinutes;
            if (!baseDeliveryMinutes) {
                const etaCalc = await DeliveryETA.calculateBaseETA(order.Distance);
                baseDeliveryMinutes = etaCalc.baseMinutes;
            }
            const operationalDelayMinutes = parseInt(order.TotalDelayMinutes || 0, 10);
            const totalMinutes = baseDeliveryMinutes + orderSizeBuffer + operationalDelayMinutes;

            const createdAtTime = order.CreatedAt ? moment(order.CreatedAt) : moment();
            const calculatedETA = createdAtTime.clone().add(totalMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            const authoritativeETA = order.EstimateDateTime ? moment(order.EstimateDateTime).format('YYYY-MM-DD HH:mm:ss') : calculatedETA;

            return resp.status(200).json({
                Status: 1,
                OrderID: order.OrderID,
                BaseDeliveryMinutes: baseDeliveryMinutes,
                OrderSizeBufferMinutes: orderSizeBuffer,
                OperationalDelayMinutes: operationalDelayMinutes,
                TotalMinutes: totalMinutes,
                TotalItemQuantity: totalItemQty,
                CalculatedETA: calculatedETA,
                EstimateDateTime: authoritativeETA,
                CurrentAuthoritativeETA: authoritativeETA,
                Breakdown: {
                    baseDeliveryMinutes,
                    orderSizeBuffer,
                    operationalDelayMinutes,
                    totalMinutes,
                    totalItemQty
                }
            });
        } catch (err) {
            console.error("Error calculating dynamic ETA:", err);
            return resp.status(500).json({ Status: 0, Message: "Internal server error calculating ETA" });
        }
    }
};

module.exports = DeliveryOperations;
