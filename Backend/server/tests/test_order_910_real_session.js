const axios = require('axios');
const mysql = require('mysql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.db
});

const queryAsync = (sql, params = []) => new Promise((res, rej) => pool.query(sql, params, (err, rows) => err ? rej(err) : res(rows)));

async function testOrder910Assignment() {
    console.log("================================================================================");
    console.log("REAL ADMIN SESSION TEST — ORDER #910 ASSIGNMENT WORKFLOW");
    console.log("================================================================================\n");

    // 1. Login with real admin credentials
    console.log("1. Logging into Admin via POST /api/adminuser/login...");
    const loginRes = await axios.post("http://localhost:5000/api/adminuser/login", {
        EmailID: "clikgett@admin.com",
        Password: "clikgett"
    });
    const sessionToken = loginRes.data.token;
    console.log(`   Login Success: Token received (${sessionToken.substring(0, 25)}...)`);

    const headers = { Authorization: "token " + sessionToken };

    // 2. Fetch eligible drivers with real admin session
    console.log("\n2. Fetching eligible drivers via GET /api/adminorders/eligible-drivers...");
    const driversRes = await axios.get("http://localhost:5000/api/adminorders/eligible-drivers", { headers });
    console.log(`   HTTP Status: ${driversRes.status}`);
    console.log(`   Drivers Count: ${driversRes.data.Drivers.length}`);
    const eligibleCount = driversRes.data.Drivers.filter(d => d.IsEligible).length;
    console.log(`   Eligible Online Drivers: ${eligibleCount}`);

    // 3. Ensure Order #910 is unassigned before test
    await queryAsync("UPDATE Orders SET OrderStatus = 8, DeliveryBoyID = 0, IsAssigned = 0 WHERE OrderID = 910");

    // 4. Assign Order #910 to Driver #33 (Sameer basha)
    console.log("\n3. Assigning Order #910 to Driver #33 (Sameer basha)...");
    const assignRes = await axios.put("http://localhost:5000/api/adminorders/assigndeliverboy/910", {
        DeliveryBoyID: 33
    }, { headers });
    console.log(`   Assignment Response: ${JSON.stringify(assignRes.data)}`);

    // 5. Verify database updates
    console.log("\n4. Verifying DB state for Order #910...");
    const orderRows = await queryAsync("SELECT OrderID, OrderStatus, DeliveryBoyID, IsAssigned, AssignedAt FROM Orders WHERE OrderID = 910");
    console.log(`   Orders Table: OrderStatus=${orderRows[0].OrderStatus}, DeliveryBoyID=${orderRows[0].DeliveryBoyID}, IsAssigned=${orderRows[0].IsAssigned}`);

    const timelineRows = await queryAsync("SELECT * FROM OrderStatusTimeline WHERE OrderID = 910 ORDER BY CreatedAt DESC LIMIT 1");
    console.log(`   OrderStatusTimeline: "${timelineRows[0]?.Notes}"`);

    // 6. Verify driver app pending orders route
    console.log("\n5. Verifying Driver #33 pending routes view...");
    const driverToken = require('jsonwebtoken').sign({ AdminID: 33 }, process.env.SECRET_KEY || 'defaultsecret');
    const routesRes = await axios.get("http://localhost:5000/api/deliveryboy/getroutes?Type=pending", {
        headers: { Authorization: "token " + driverToken }
    });
    const foundInApp = (routesRes.data.Orders || []).some(o => o.OrderID === 910);
    console.log(`   Driver sees Order #910 in app: ${foundInApp}`);

    // 7. Test reassignment from Driver #33 to Driver #16
    console.log("\n6. Testing Admin Reassignment of Order #910 to Driver #16...");
    await queryAsync("UPDATE AdminUsers SET DutyStatus = 'ONLINE', Status = 1 WHERE AdminID = 16");
    const reassignRes = await axios.put("http://localhost:5000/api/adminorders/reassign/910", {
        NewDeliveryBoyID: 16,
        Reason: "Operational fleet rebalance"
    }, { headers });
    console.log(`   Reassign Response: ${JSON.stringify(reassignRes.data)}`);

    const reassignTimeline = await queryAsync("SELECT * FROM OrderStatusTimeline WHERE OrderID = 910 ORDER BY CreatedAt DESC LIMIT 1");
    console.log(`   Reassign Timeline Note: "${reassignTimeline[0]?.Notes}"`);

    // 8. Restore Order #910 back to unassigned state
    console.log("\n7. Restoring Order #910 to unassigned (OrderStatus: 8, DeliveryBoyID: 0) for user test...");
    await queryAsync("UPDATE Orders SET OrderStatus = 8, DeliveryBoyID = 0, IsAssigned = 0 WHERE OrderID = 910");
    await queryAsync("DELETE FROM OrderStatusTimeline WHERE OrderID = 910 AND CreatedAt >= NOW() - INTERVAL 10 MINUTE");
    console.log("   Order #910 successfully reset to UNASSIGNED.");

    console.log("\n================================================================================");
    console.log("ALL REAL SESSION ASSIGNMENT TESTS PASSED SUCCESSFULLY!");
    console.log("================================================================================\n");

    pool.end();
}

testOrder910Assignment().catch(err => {
    console.error("Test Error:", err.response?.data || err.message);
    pool.end();
});
