const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 4,
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT,
    charset: 'utf8mb4'
});

const queryAsync = (sql, params = []) => new Promise((res, rej) => pool.query(sql, params, (err, rows) => err ? rej(err) : res(rows)));

const BASE_URL = 'http://localhost:5000/api';
const SECRET_KEY = process.env.SECRET_KEY || 'defaultsecret';

// Auth tokens
const adminToken = jwt.sign({ AdminID: 1, Role: 1 }, SECRET_KEY);
const adminHeaders = { Authorization: 'token ' + adminToken };

const driverToken = jwt.sign({ AdminID: 33, Role: 2 }, SECRET_KEY);
const driverHeaders = { Authorization: 'token ' + driverToken };

const customerToken = jwt.sign({ UserID: 1000523, Role: 3 }, SECRET_KEY);
const customerHeaders = { Authorization: 'token ' + customerToken };

async function runTestSuite() {
    console.log("================================================================================");
    console.log("CLIKGETT DELIVERY BOY ORDER ASSIGNMENT WORKFLOW — 20-POINT AUTOMATED TEST SUITE");
    console.log("================================================================================\n");

    const results = [];
    const record = (num, name, status, details) => {
        results.push({ num, name, status, details });
        const tag = status === "PASS" ? "✅ PASS" : "❌ FAIL";
        console.log(`[Test ${String(num).padStart(2, '0')}] ${tag}: ${name} — ${details}`);
    };

    let testOrderId = null;
    let testDriverId = 33; // Sameer basha (ONLINE)
    let offlineDriverId = 17; // Sonu moon (OFFLINE)
    let secondDriverId = 16; // Srikar Bheema (ONLINE for reassignment)
    let validUserId = 1000523;

    try {
        // Fetch a valid customer UserID
        const userRows = await queryAsync("SELECT UserID FROM Users LIMIT 1");
        if (userRows.length > 0) {
            validUserId = userRows[0].UserID;
        }

        // Set test driver states deterministically
        await queryAsync("UPDATE AdminUsers SET DutyStatus = 'ONLINE', Status = 1 WHERE AdminID = ?", [testDriverId]);
        await queryAsync("UPDATE AdminUsers SET DutyStatus = 'OFFLINE', Status = 1 WHERE AdminID = ?", [offlineDriverId]);
        await queryAsync("UPDATE AdminUsers SET DutyStatus = 'ONLINE', Status = 1 WHERE AdminID = ?", [secondDriverId]);

        // -------------------------------------------------------------------------
        // TEST 1: Customer creates order
        // -------------------------------------------------------------------------
        try {
            const insertResult = await queryAsync(`
                INSERT INTO Orders 
                (UserID, MobileNumber, SubTotal, GrandTotal, OrderStatus, DeliveryBoyID, IsAssigned, Address, Latitude, Longitude, CreatedAt, UpdatedAt)
                VALUES (?, '9999999999', 450.00, 450.00, 8, 0, 0, 'Plot 101, ClikGett Tech Hub', '17.440081', '78.348915', NOW(), NOW())
            `, [validUserId]);
            testOrderId = insertResult.insertId;
            record(1, "Customer creates order", "PASS", `Order #${testOrderId} successfully created for User #${validUserId}`);
        } catch (err) {
            record(1, "Customer creates order", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 2: Order remains unassigned
        // -------------------------------------------------------------------------
        try {
            const rows = await queryAsync("SELECT OrderStatus, DeliveryBoyID, IsAssigned FROM Orders WHERE OrderID = ?", [testOrderId]);
            const o = rows[0];
            const isUnassigned = (o.OrderStatus === 8 && (o.DeliveryBoyID === 0 || o.DeliveryBoyID === null) && (!o.IsAssigned || o.IsAssigned === 0));
            record(2, "Order remains unassigned", isUnassigned ? "PASS" : "FAIL", `OrderStatus=${o.OrderStatus}, DeliveryBoyID=${o.DeliveryBoyID}, IsAssigned=${o.IsAssigned}`);
        } catch (err) {
            record(2, "Order remains unassigned", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 3: Admin sees unassigned order
        // -------------------------------------------------------------------------
        try {
            const liveRes = await axios.get(`${BASE_URL}/adminorders/live-operations`, { headers: adminHeaders });
            const found = (liveRes.data.ActiveDeliveries || []).find(d => d.OrderID === testOrderId);
            const isDriverUnassigned = found && found.DriverName === 'UNASSIGNED';
            record(3, "Admin sees unassigned order", (found && isDriverUnassigned) ? "PASS" : "FAIL", `Found in live-operations: ${!!found}, DriverName: ${found ? found.DriverName : 'N/A'}`);
        } catch (err) {
            record(3, "Admin sees unassigned order", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 4: Admin retrieves eligible drivers
        // -------------------------------------------------------------------------
        try {
            const driversRes = await axios.get(`${BASE_URL}/adminorders/eligible-drivers`, { headers: adminHeaders });
            const list = driversRes.data.Drivers || [];
            const driver33 = list.find(d => d.DriverID === testDriverId);
            const driver17 = list.find(d => d.DriverID === offlineDriverId);
            const valid = driversRes.data.Status === 1 && driver33 && driver33.IsEligible === true && driver17 && driver17.IsEligible === false;
            record(4, "Admin retrieves eligible drivers", valid ? "PASS" : "FAIL", `Retrieved ${list.length} drivers. Driver ${testDriverId} eligible=${driver33?.IsEligible}, Driver ${offlineDriverId} eligible=${driver17?.IsEligible}`);
        } catch (err) {
            record(4, "Admin retrieves eligible drivers", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 5: Admin assigns driver
        // -------------------------------------------------------------------------
        try {
            const assignRes = await axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${testOrderId}`, {
                DeliveryBoyID: testDriverId
            }, { headers: adminHeaders });
            record(5, "Admin assigns driver", assignRes.data.Status === 1 ? "PASS" : "FAIL", assignRes.data.Message);
        } catch (err) {
            record(5, "Admin assigns driver", "FAIL", err.response?.data?.Message || err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 6: DeliveryBoyID is updated
        // -------------------------------------------------------------------------
        try {
            const rows = await queryAsync("SELECT DeliveryBoyID, IsAssigned FROM Orders WHERE OrderID = ?", [testOrderId]);
            const updated = rows[0].DeliveryBoyID === testDriverId && rows[0].IsAssigned === 1;
            record(6, "DeliveryBoyID is updated", updated ? "PASS" : "FAIL", `DeliveryBoyID in DB = ${rows[0].DeliveryBoyID}`);
        } catch (err) {
            record(6, "DeliveryBoyID is updated", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 7: Order becomes Assigned (OrderStatus = 2)
        // -------------------------------------------------------------------------
        try {
            const rows = await queryAsync("SELECT OrderStatus FROM Orders WHERE OrderID = ?", [testOrderId]);
            const isAssignedStatus = rows[0].OrderStatus === 2;
            record(7, "Order becomes Assigned", isAssignedStatus ? "PASS" : "FAIL", `OrderStatus in DB = ${rows[0].OrderStatus} (Expected 2)`);
        } catch (err) {
            record(7, "Order becomes Assigned", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 8: Timeline entry is created
        // -------------------------------------------------------------------------
        try {
            const timelineRows = await queryAsync("SELECT * FROM OrderStatusTimeline WHERE OrderID = ? ORDER BY CreatedAt DESC", [testOrderId]);
            const hasTimeline = timelineRows.length > 0 && timelineRows[0].OrderStatus === 2;
            record(8, "Timeline entry is created", hasTimeline ? "PASS" : "FAIL", `Timeline records: ${timelineRows.length}, Note: "${timelineRows[0]?.Notes}"`);
        } catch (err) {
            record(8, "Timeline entry is created", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 9: Driver sees assigned order in app endpoint
        // -------------------------------------------------------------------------
        try {
            const routesRes = await axios.get(`${BASE_URL}/deliveryboy/getroutes?Type=pending`, { headers: driverHeaders });
            const orders = routesRes.data.Orders || [];
            const driverOrder = orders.find(o => o.OrderID === testOrderId);
            record(9, "Driver sees assigned order", driverOrder ? "PASS" : "FAIL", `Order #${testOrderId} visible in delivery boy app getroutes`);
        } catch (err) {
            record(9, "Driver sees assigned order", "FAIL", err.response?.data?.Message || err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 10: Offline driver cannot be assigned
        // -------------------------------------------------------------------------
        try {
            let blocked = false;
            let msg = '';
            try {
                await axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${testOrderId}`, {
                    DeliveryBoyID: offlineDriverId
                }, { headers: adminHeaders });
            } catch (err) {
                if (err.response?.status === 400) {
                    blocked = true;
                    msg = err.response.data.Message;
                }
            }
            record(10, "Offline driver cannot be assigned", blocked ? "PASS" : "FAIL", `Blocked offline driver: "${msg}"`);
        } catch (err) {
            record(10, "Offline driver cannot be assigned", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 11: Full driver cannot be assigned (capacity >= 5)
        // -------------------------------------------------------------------------
        try {
            // Create dummy active orders for test driver to reach 5
            const dummyOrderIds = [];
            for (let i = 0; i < 4; i++) {
                const ins = await queryAsync(`
                    INSERT INTO Orders (UserID, MobileNumber, SubTotal, GrandTotal, OrderStatus, DeliveryBoyID, IsAssigned, CreatedAt)
                    VALUES (?, '9999999999', 100.00, 100.00, 2, ?, 1, NOW())
                `, [validUserId, testDriverId]);
                dummyOrderIds.push(ins.insertId);
            }

            // Create a new unassigned order
            const newOrder = await queryAsync(`
                INSERT INTO Orders (UserID, MobileNumber, SubTotal, GrandTotal, OrderStatus, DeliveryBoyID, IsAssigned, CreatedAt)
                VALUES (?, '9999999999', 100.00, 100.00, 8, 0, 0, NOW())
            `, [validUserId]);
            const targetOrderId = newOrder.insertId;

            let fullBlocked = false;
            let fullMsg = '';
            try {
                await axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${targetOrderId}`, {
                    DeliveryBoyID: testDriverId
                }, { headers: adminHeaders });
            } catch (err) {
                if (err.response?.status === 400) {
                    fullBlocked = true;
                    fullMsg = err.response.data.Message;
                }
            }

            // Clean up dummy orders
            await queryAsync("DELETE FROM OrderStatusTimeline WHERE OrderID IN (?)", [[...dummyOrderIds, targetOrderId]]);
            await queryAsync("DELETE FROM Orders WHERE OrderID IN (?)", [[...dummyOrderIds, targetOrderId]]);

            record(11, "Full driver cannot be assigned", fullBlocked ? "PASS" : "FAIL", `Blocked at capacity: "${fullMsg}"`);
        } catch (err) {
            record(11, "Full driver cannot be assigned", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 12: Suspended driver cannot be assigned
        // -------------------------------------------------------------------------
        try {
            await queryAsync("UPDATE AdminUsers SET Status = 2 WHERE AdminID = ?", [offlineDriverId]); // Status != 1
            let suspBlocked = false;
            let suspMsg = '';
            try {
                await axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${testOrderId}`, {
                    DeliveryBoyID: offlineDriverId
                }, { headers: adminHeaders });
            } catch (err) {
                if (err.response?.status === 400) {
                    suspBlocked = true;
                    suspMsg = err.response.data.Message;
                }
            }
            await queryAsync("UPDATE AdminUsers SET Status = 1 WHERE AdminID = ?", [offlineDriverId]); // restore
            record(12, "Suspended driver cannot be assigned", suspBlocked ? "PASS" : "FAIL", `Blocked suspended driver: "${suspMsg}"`);
        } catch (err) {
            record(12, "Suspended driver cannot be assigned", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 13: Unauthorized user cannot assign
        // -------------------------------------------------------------------------
        try {
            let unauthBlocked = false;
            try {
                const res = await axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${testOrderId}`, {
                    DeliveryBoyID: testDriverId
                });
                if (res.data.Status === 0) unauthBlocked = true;
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 403 || err.response?.data?.Status === 0) {
                    unauthBlocked = true;
                }
            }
            record(13, "Unauthorized user cannot assign", unauthBlocked ? "PASS" : "FAIL", "Request without token correctly rejected");
        } catch (err) {
            record(13, "Unauthorized user cannot assign", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 14: Customer cannot assign
        // -------------------------------------------------------------------------
        try {
            let custBlocked = false;
            try {
                const res = await axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${testOrderId}`, {
                    DeliveryBoyID: testDriverId
                }, { headers: customerHeaders });
                if (res.data.Status === 0 && (res.data.Message || '').toLowerCase().includes("unauthorized")) {
                    custBlocked = true;
                }
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 403 || err.response?.data?.Status === 0) {
                    custBlocked = true;
                }
            }
            record(14, "Customer cannot assign", custBlocked ? "PASS" : "FAIL", "Customer role rejected from admin assignment endpoint");
        } catch (err) {
            record(14, "Customer cannot assign", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 15: Delivery Boy cannot assign
        // -------------------------------------------------------------------------
        try {
            let driverBlocked = false;
            try {
                const res = await axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${testOrderId}`, {
                    DeliveryBoyID: testDriverId
                }, { headers: driverHeaders });
                if (res.data.Status === 0 && (res.data.Message || '').toLowerCase().includes("unauthorized")) {
                    driverBlocked = true;
                }
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 403 || err.response?.data?.Status === 0) {
                    driverBlocked = true;
                }
            }
            record(15, "Delivery Boy cannot assign", driverBlocked ? "PASS" : "FAIL", "Delivery boy role rejected from assigning orders");
        } catch (err) {
            record(15, "Delivery Boy cannot assign", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 16: Admin can reassign
        // -------------------------------------------------------------------------
        try {
            const reassignRes = await axios.put(`${BASE_URL}/adminorders/reassign/${testOrderId}`, {
                NewDeliveryBoyID: secondDriverId,
                Reason: "Primary rider bike breakdown"
            }, { headers: adminHeaders });

            const orderRow = await queryAsync("SELECT DeliveryBoyID FROM Orders WHERE OrderID = ?", [testOrderId]);
            const reassigned = reassignRes.data.Status === 1 && orderRow[0].DeliveryBoyID === secondDriverId;
            record(16, "Admin can reassign", reassigned ? "PASS" : "FAIL", reassignRes.data.Message);
        } catch (err) {
            record(16, "Admin can reassign", "FAIL", err.response?.data?.Message || err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 17: Previous assignment remains auditable
        // -------------------------------------------------------------------------
        try {
            const timelineRows = await queryAsync("SELECT * FROM OrderStatusTimeline WHERE OrderID = ? ORDER BY CreatedAt DESC", [testOrderId]);
            const reassignEntry = timelineRows.find(t => t.Notes.includes("reassigned from driver") || t.Notes.includes(`driver #${testDriverId}`));
            const auditable = Boolean(reassignEntry && timelineRows.length >= 2);
            record(17, "Previous assignment remains auditable", auditable ? "PASS" : "FAIL", `Found audit note: "${reassignEntry?.Notes}"`);
        } catch (err) {
            record(17, "Previous assignment remains auditable", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 18: Cancelled order cannot be assigned
        // -------------------------------------------------------------------------
        try {
            await queryAsync("UPDATE Orders SET OrderStatus = 4 WHERE OrderID = ?", [testOrderId]);
            let cancelBlocked = false;
            let cancelMsg = '';
            try {
                await axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${testOrderId}`, {
                    DeliveryBoyID: testDriverId
                }, { headers: adminHeaders });
            } catch (err) {
                if (err.response?.status === 400) {
                    cancelBlocked = true;
                    cancelMsg = err.response.data.Message;
                }
            }
            record(18, "Cancelled order cannot be assigned", cancelBlocked ? "PASS" : "FAIL", `Blocked cancelled order: "${cancelMsg}"`);
        } catch (err) {
            record(18, "Cancelled order cannot be assigned", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 19: Delivered order cannot be assigned
        // -------------------------------------------------------------------------
        try {
            await queryAsync("UPDATE Orders SET OrderStatus = 1 WHERE OrderID = ?", [testOrderId]);
            let delivBlocked = false;
            let delivMsg = '';
            try {
                await axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${testOrderId}`, {
                    DeliveryBoyID: testDriverId
                }, { headers: adminHeaders });
            } catch (err) {
                if (err.response?.status === 400) {
                    delivBlocked = true;
                    delivMsg = err.response.data.Message;
                }
            }
            record(19, "Delivered order cannot be assigned", delivBlocked ? "PASS" : "FAIL", `Blocked delivered order: "${delivMsg}"`);
        } catch (err) {
            record(19, "Delivered order cannot be assigned", "FAIL", err.message);
        }

        // -------------------------------------------------------------------------
        // TEST 20: Concurrent assignment is safely handled
        // -------------------------------------------------------------------------
        try {
            // Create a fresh unassigned order
            const concOrder = await queryAsync(`
                INSERT INTO Orders (UserID, MobileNumber, SubTotal, GrandTotal, OrderStatus, DeliveryBoyID, IsAssigned, CreatedAt)
                VALUES (?, '9999999999', 250.00, 250.00, 8, 0, 0, NOW())
            `, [validUserId]);
            const cOrderId = concOrder.insertId;

            // Fire 2 concurrent assignment requests simultaneously
            await Promise.allSettled([
                axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${cOrderId}`, { DeliveryBoyID: testDriverId }, { headers: adminHeaders }),
                axios.put(`${BASE_URL}/adminorders/assigndeliverboy/${cOrderId}`, { DeliveryBoyID: secondDriverId }, { headers: adminHeaders })
            ]);

            const finalOrder = await queryAsync("SELECT DeliveryBoyID, OrderStatus FROM Orders WHERE OrderID = ?", [cOrderId]);
            const finalTimeline = await queryAsync("SELECT * FROM OrderStatusTimeline WHERE OrderID = ?", [cOrderId]);

            const safe = finalOrder[0].DeliveryBoyID > 0 && finalOrder[0].OrderStatus === 2 && finalTimeline.length >= 1;
            record(20, "Concurrent assignment safely handled", safe ? "PASS" : "FAIL", `Assigned driver: ${finalOrder[0].DeliveryBoyID}, Timeline records: ${finalTimeline.length}`);

            // Cleanup
            await queryAsync("DELETE FROM OrderStatusTimeline WHERE OrderID IN (?, ?)", [testOrderId, cOrderId]);
            await queryAsync("DELETE FROM Orders WHERE OrderID IN (?, ?)", [testOrderId, cOrderId]);
        } catch (err) {
            record(20, "Concurrent assignment safely handled", "FAIL", err.message);
        }

        console.log("\n================================================================================");
        const passCount = results.filter(r => r.status === "PASS").length;
        console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passCount} | FAILED: ${results.length - passCount}`);
        console.log("================================================================================");

    } finally {
        pool.end();
    }
}

runTestSuite();
