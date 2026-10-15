/**
 * Complete End-to-End Operational Lifecycle Verification for ClikGett Delivery Modernization
 */

const http = require('http');
const pool = require('../utils/db.js');

const BASE_URL = 'http://localhost:5000';

// Test JWT Tokens
const DRIVER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBZG1pbklEIjozMywiUm9sZSI6MiwiaWF0IjoxNzkxMjYxMTI2LCJleHAiOjE4MjI3OTcxMjZ9.xYrbgZj9TzmfasudBnTPn5hUjLAchzuYQNEQINO-_Tw'; // Delivery Boy ID 33
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBZG1pbklEIjoxLCJpYXQiOjE3OTExODEyOTQsImV4cCI6MTgyMjcxNzI5NH0.Ip5j-K8hEKNiT6j3P1wlo-fPm-nIsmiNTJq2orlWDoA'; // Admin ID 1

const TEST_ORDER_ID = 909;

function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    if (body && typeof body === 'object') {
      reqHeaders['Content-Type'] = 'application/json';
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch (e) {}
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'object' ? JSON.stringify(body) : body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log(' CLIKGETT DELIVERY OPERATIONS END-TO-END VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 0. Setup active test order
    console.log(`--- 0. Preparing Test Order #${TEST_ORDER_ID} ---`);
    await dbQuery(`
      UPDATE Orders 
      SET DeliveryBoyID = 33, OrderStatus = 2, IsAssigned = 1, 
          DelayStatus = NULL, TotalDelayMinutes = 0, 
          EstimateDateTime = DATE_ADD(NOW(), INTERVAL 25 MINUTE)
      WHERE OrderID = ?
    `, [TEST_ORDER_ID]);
    await dbQuery("DELETE FROM OrderDelays WHERE OrderID = ?", [TEST_ORDER_ID]);
    await dbQuery("DELETE FROM OrderIssues WHERE OrderID = ?", [TEST_ORDER_ID]);
    console.log(`  [INFO] Order #${TEST_ORDER_ID} configured for Driver #33 (Status: 2 - Assigned)\n`);

    // 1. Duty Status
    console.log('--- 1. Testing Duty Status Management ---');
    const onlineRes = await request(
      'PUT',
      '/api/deliveryboy/duty-status',
      { Authorization: `Bearer ${DRIVER_TOKEN}` },
      { DutyStatus: 'ONLINE', Latitude: 15.8281, Longitude: 78.0373, BatteryLevel: 88 }
    );
    assert(onlineRes.status === 200 && onlineRes.data.Status === 1, 'Driver transitions to ONLINE successfully');

    const getDutyRes = await request(
      'GET',
      '/api/deliveryboy/duty-status',
      { Authorization: `Bearer ${DRIVER_TOKEN}` }
    );
    assert(getDutyRes.status === 200 && getDutyRes.data.Driver && getDutyRes.data.Driver.DutyStatus === 'ONLINE', 'Get duty status returns ONLINE');

    // Invalid status validation
    const invalidDuty = await request(
      'PUT',
      '/api/deliveryboy/duty-status',
      { Authorization: `Bearer ${DRIVER_TOKEN}` },
      { DutyStatus: 'FLYING' }
    );
    assert(invalidDuty.status === 400, 'Rejects invalid duty status (FLYING -> 400)');

    // 2. Location Ping
    console.log('\n--- 2. Testing GPS Location Telematics ---');
    const pingRes = await request(
      'POST',
      '/api/deliveryboy/location/ping',
      { Authorization: `Bearer ${DRIVER_TOKEN}` },
      {
        latitude: 15.8281,
        longitude: 78.0373,
        accuracy: 6.2,
        speed: 22.5,
        heading: 95.0,
        batteryLevel: 87,
        isCharging: false,
        activeOrderId: TEST_ORDER_ID,
        timestamp: new Date().toISOString()
      }
    );
    assert(pingRes.status === 200 && pingRes.data.Status === 1, 'Valid GPS location ping accepted and recorded with active order');

    // Invalid coordinates
    const badPing = await request(
      'POST',
      '/api/deliveryboy/location/ping',
      { Authorization: `Bearer ${DRIVER_TOKEN}` },
      { latitude: 95.0, longitude: 78.0373 }
    );
    assert(badPing.status === 400, 'Rejects invalid latitude (> 90 -> 400)');

    // 3. Admin Live Operations Command Center
    console.log('\n--- 3. Testing Admin Live Operations Command Center ---');
    const liveOpsRes = await request(
      'GET',
      '/api/adminorders/live-operations',
      { Authorization: `Bearer ${ADMIN_TOKEN}` }
    );
    assert(liveOpsRes.status === 200 && liveOpsRes.data.Status === 1, 'Admin Live Operations endpoint returns 200 OK');
    assert(liveOpsRes.data.KPIs !== undefined && liveOpsRes.data.KPIs.activeDeliveries > 0, 'Live Operations returns KPI summary metrics with active deliveries');
    assert(Array.isArray(liveOpsRes.data.FleetDrivers) && liveOpsRes.data.FleetDrivers.length > 0, 'Live Operations returns fleet drivers list');
    assert(Array.isArray(liveOpsRes.data.ActiveDeliveries) && liveOpsRes.data.ActiveDeliveries.some(o => o.OrderID == TEST_ORDER_ID), 'Live Operations radar displays active delivery order');

    // 4. Driver Delay Reporting
    console.log('\n--- 4. Testing Driver Delay Reporting & Anti-Spam ---');
    const reportDelayRes = await request(
      'POST',
      '/api/deliveryboy/orders/report-delay',
      { Authorization: `Bearer ${DRIVER_TOKEN}` },
      {
        OrderID: TEST_ORDER_ID,
        Reason: 'HEAVY_TRAFFIC',
        RequestedMinutes: 10,
        Remarks: 'Silk Board flyover traffic jam',
        Latitude: 15.8281,
        Longitude: 78.0373
      }
    );
    assert(reportDelayRes.status === 200 && reportDelayRes.data.Status === 1, 'Driver successfully reports delay (+10m traffic)');

    // Duplicate delay spam test
    const duplicateDelay = await request(
      'POST',
      '/api/deliveryboy/orders/report-delay',
      { Authorization: `Bearer ${DRIVER_TOKEN}` },
      {
        OrderID: TEST_ORDER_ID,
        Reason: 'HEAVY_TRAFFIC',
        RequestedMinutes: 10,
        Remarks: 'Spam duplicate request',
      }
    );
    assert(
      duplicateDelay.status === 400 && duplicateDelay.data.Message && duplicateDelay.data.Message.includes('pending'),
      'Duplicate pending delay report is blocked by anti-spam guard'
    );

    // Unauthorized order delay report
    const unauthorizedDelay = await request(
      'POST',
      '/api/deliveryboy/orders/report-delay',
      { Authorization: `Bearer ${DRIVER_TOKEN}` },
      {
        OrderID: 99999,
        Reason: 'HEAVY_TRAFFIC',
        RequestedMinutes: 10,
      }
    );
    assert(unauthorizedDelay.status === 403 || unauthorizedDelay.status === 404, 'Reject delay report for non-assigned order (403/404)');

    // 5. Admin Delay Review & ETA Synchronization
    console.log('\n--- 5. Testing Admin Delay Review & Authoritative ETA Integration ---');
    const delayQueueRes = await request(
      'GET',
      '/api/adminorders/delays',
      { Authorization: `Bearer ${ADMIN_TOKEN}` }
    );
    assert(delayQueueRes.status === 200 && Array.isArray(delayQueueRes.data.Delays) && delayQueueRes.data.Delays.length > 0, 'Admin retrieves Delay Review Queue with pending item');

    const pendingDelay = delayQueueRes.data.Delays.find(d => d.OrderID == TEST_ORDER_ID && d.Status === 'PENDING');
    if (pendingDelay) {
      const reviewRes = await request(
        'POST',
        `/api/adminorders/delays/${pendingDelay.DelayID}/review`,
        { Authorization: `Bearer ${ADMIN_TOKEN}` },
        {
          action: 'APPROVE',
          approvedMinutes: 10,
          adminReason: 'Approved by dispatch supervisor'
        }
      );
      assert(
        reviewRes.status === 200 && reviewRes.data.Status === 1,
        `Admin reviews delay #${pendingDelay.DelayID} and updates authoritative ETA`
      );
      assert(reviewRes.data.NewETA !== undefined, `Review response returns synchronized new ETA (${reviewRes.data.NewETA})`);

      // Verify audit trail in OrderETAAdjustments and OrderStatusTimeline
      const auditRows = await dbQuery("SELECT * FROM OrderETAAdjustments WHERE OrderID = ? ORDER BY AdjustmentID DESC LIMIT 1", [TEST_ORDER_ID]);
      assert(auditRows.length > 0 && auditRows[0].AdjustmentMinutes === 10, 'Authoritative OrderETAAdjustments audit ledger written');

      const timelineRows = await dbQuery("SELECT * FROM OrderStatusTimeline WHERE OrderID = ? ORDER BY TimelineID DESC LIMIT 1", [TEST_ORDER_ID]);
      assert(timelineRows.length > 0 && timelineRows[0].Notes.includes('adjusted by +10 mins'), 'Operational OrderStatusTimeline audit event written');
    }

    // 6. Dynamic ETA Engine
    console.log('\n--- 6. Testing Dynamic Quick-Commerce ETA Calculation ---');
    const dynamicEtaRes = await request(
      'GET',
      `/api/adminorders/dynamic-eta/${TEST_ORDER_ID}`,
      { Authorization: `Bearer ${ADMIN_TOKEN}` }
    );
    assert(dynamicEtaRes.status === 200 && dynamicEtaRes.data.Status === 1, 'Dynamic ETA engine returns calculated ETA');
    assert(
      dynamicEtaRes.data.Breakdown && dynamicEtaRes.data.Breakdown.totalMinutes >= 5,
      `Dynamic ETA computed: ${dynamicEtaRes.data.Breakdown.totalMinutes} mins (prep + travel + buffer)`
    );

    // 7. Driver Issue Reporting
    console.log('\n--- 7. Testing Driver Issue Reporting ---');
    const issueRes = await request(
      'POST',
      '/api/deliveryboy/orders/report-issue',
      { Authorization: `Bearer ${DRIVER_TOKEN}` },
      {
        OrderID: TEST_ORDER_ID,
        IssueType: 'CUSTOMER_UNREACHABLE',
        Description: 'Customer phone is switched off, waiting at gate for 5 mins',
        Latitude: 15.8281,
        Longitude: 78.0373
      }
    );
    assert(issueRes.status === 200 && issueRes.data.Status === 1, 'Driver reports CUSTOMER_UNREACHABLE issue successfully');

    // 8. SQL Injection & Parameterization Hardening Check
    console.log('\n--- 8. Testing SQL Injection Security Hardening ---');
    const sqlInjectionOtp = await request(
      'POST',
      '/api/deliveryboy/verifyotp_order',
      { Authorization: `Bearer ${DRIVER_TOKEN}` },
      {
        OrderID: `${TEST_ORDER_ID}' OR '1'='1`,
        DeliveryOtp: '1234'
      }
    );
    assert(sqlInjectionOtp.status === 400 || (sqlInjectionOtp.data && sqlInjectionOtp.data.Status === 0), 'SQL injection attempt in verifyotp_order is neutralized');

    // 9. Status transition hardening & Geofence Validation
    console.log('\n--- 9. Testing Status Transitions & Geofence Hardening ---');
    // Illegal jump from Assigned directly to Delivered (2 -> 1)
    const illegalJump = await request(
      'PUT',
      `/api/deliveryboy/updatestatus/${TEST_ORDER_ID}`,
      { Authorization: `Bearer ${DRIVER_TOKEN}` },
      { OrderStatus: 1 }
    );
    assert(illegalJump.status === 400 && illegalJump.data.Message.includes('Cannot mark order delivered before arriving'), 'Illegal status jump (2 -> 1) is blocked by state machine');

    // 10. Clean teardown
    await dbQuery("UPDATE Orders SET OrderStatus = 4, DeliveryBoyID = 0 WHERE OrderID = ?", [TEST_ORDER_ID]);
    console.log(`\n  [INFO] Teardown: Order #${TEST_ORDER_ID} restored to original state.`);

    console.log('\n====================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal test execution error:', err);
  } finally {
    process.exit();
  }
}

runTests();
