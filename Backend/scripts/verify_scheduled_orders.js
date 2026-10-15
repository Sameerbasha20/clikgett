const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const axios = require('axios');
const pool = require('../server/utils/db');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';
const SECRET_KEY = process.env.SECRET_KEY || 'defaultsecret';
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
  }
}

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function run() {
  console.log('====================================================');
  console.log('SCHEDULED ORDERS END-TO-END VERIFICATION');
  console.log('====================================================\n');

  let testOrderId = null;

  try {
    // 1. Get an existing customer and generate token
    const users = await queryAsync('SELECT UserID, MobileNumber FROM Users LIMIT 1');
    assert(users.length > 0, 'Found registered customer in database');
    const customer = users[0];
    const customerToken = jwt.sign(
      { UserID: customer.UserID, Role: 3 },
      SECRET_KEY
    );
    const customerHeaders = { Authorization: 'token ' + customerToken };

    // 2. Get an admin token for admin verification
    const admins = await queryAsync('SELECT AdminID, MobileNumber FROM AdminUsers WHERE Role = 1 LIMIT 1');
    assert(admins.length > 0, 'Found admin user in database');
    const admin = admins[0];
    const adminToken = jwt.sign(
      { AdminID: admin.AdminID, Role: 1 },
      SECRET_KEY
    );
    const adminHeaders = { Authorization: 'token ' + adminToken };

    // 3. Create a Scheduled Order via POST /api/orders/createorder
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduledDateTimeStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')} 08:00:00`;

    const createPayload = {
      MobileNumber: customer.MobileNumber,
      City: 'Bengaluru',
      CartID: 0,
      UserID: customer.UserID,
      SubTotal: 250.00,
      GrandTotal: 250.00,
      PaymentMethod: 'COD',
      Address: '123 Indiranagar, 100ft Road',
      FlatNo: 'Flat 402',
      LandMark: 'Near Metro',
      Latitude: 12.9716,
      Longitude: 77.5946,
      PaymentStatus: 0,
      PaymentTransactionID: 'TXN_TEST_SCHED',
      Discount: 0,
      DeliveryInstructions: ['No Contact Delivery'],
      OrderType: 'Delivery',
      ScheduleStatus: 'Scheduled',
      ScheduledDateTime: scheduledDateTimeStr,
      OrderItems: [
        {
          ProductID: 2,
          ProductName: 'Red Label Tea Powder 100g',
          Quantity: 1,
          Price: 44.00,
          OfferPrice: 35.20,
          Type: 'Product'
        }
      ]
    };

    const createRes = await axios.post(`${BASE_URL}/orders/createorder`, createPayload, {
      headers: customerHeaders
    });
    console.log('createRes.data:', createRes.data);

    assert(createRes.status === 200 && createRes.data.Status === 1, 'POST /api/orders/createorder succeeds with Status 1');
    testOrderId = createRes.data.OrderID || createRes.data.orderID || createRes.data.orderId;
    assert(testOrderId > 0, `Scheduled Order successfully created with OrderID: ${testOrderId}`);

    // 4. Verify DB persistence of ScheduleStatus and ScheduledDateTime
    const dbOrderRows = await queryAsync('SELECT OrderID, ScheduleStatus, ScheduledDateTime, EstimateDateTime FROM Orders WHERE OrderID = ?', [testOrderId]);
    assert(dbOrderRows.length === 1, 'Order row exists in DB');
    assert(dbOrderRows[0].ScheduleStatus === 'Scheduled', `ScheduleStatus persisted correctly as 'Scheduled' (got: ${dbOrderRows[0].ScheduleStatus})`);
    assert(dbOrderRows[0].ScheduledDateTime != null, `ScheduledDateTime persisted correctly: ${dbOrderRows[0].ScheduledDateTime}`);

    // 5. Verify Customer API GET /api/orders/myorder/:id returns schedule info
    const myOrderRes = await axios.get(`${BASE_URL}/orders/myorder/${testOrderId}`, {
      headers: customerHeaders
    });
    assert(myOrderRes.data.Status === 1, 'GET /api/orders/myorder/:id returns Status 1');
    assert(myOrderRes.data.Orders.ScheduleStatus === 'Scheduled', 'myorder returns ScheduleStatus = Scheduled');
    assert(myOrderRes.data.Orders.ScheduledDateTime != null, 'myorder returns non-null ScheduledDateTime');

    // 6. Verify Admin API GET /api/adminorders/scheduledorders contains the order
    const adminSchedRes = await axios.get(`${BASE_URL}/adminorders/scheduledorders`, {
      headers: adminHeaders
    });
    assert(adminSchedRes.data.Status === 1, 'GET /api/adminorders/scheduledorders returns Status 1');
    const schedOrders = adminSchedRes.data.ScheduledOrders || [];
    const foundSched = schedOrders.find(o => o.OrderID === testOrderId);
    assert(foundSched !== undefined, `Scheduled order #${testOrderId} appears in Admin Scheduled Orders list`);

    // 7. Verify Live Operations SLA does NOT mark future scheduled orders as delayed
    const liveOpsRes = await axios.get(`${BASE_URL}/adminorders/live-operations`, {
      headers: adminHeaders
    });
    assert(liveOpsRes.data.Status === 1, 'GET /api/adminorders/live-operations returns Status 1');
    const liveActiveOrders = liveOpsRes.data.LiveOperations?.ActiveOrders || [];
    const liveSchedOrder = liveActiveOrders.find(o => o.OrderID === testOrderId);
    if (liveSchedOrder) {
      assert(liveSchedOrder.SLAStatus === 'SCHEDULED' || liveSchedOrder.SLAStatus === 'ON_TIME', `Live Operations marks future scheduled order as ${liveSchedOrder.SLAStatus} (not DELAYED)`);
    } else {
      assert(true, 'Live operations handled order cleanly');
    }

  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message || err);
    failed++;
  } finally {
    // 8. Cleanup test order
    if (testOrderId) {
      await queryAsync('DELETE FROM OrderItems WHERE OrderID = ?', [testOrderId]);
      await queryAsync('DELETE FROM Orders WHERE OrderID = ?', [testOrderId]);
      console.log(`[CLEANUP] Deleted test order #${testOrderId}`);
    }
    pool.end();
  }

  console.log('\n====================================================');
  console.log(`VALIDATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
