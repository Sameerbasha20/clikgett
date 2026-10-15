const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
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
  console.log('RETENTION, MILESTONES, FEEDBACK & ABANDONED CARTS');
  console.log('====================================================\n');

  try {
    // 1. Obtain a valid test customer user
    const users = await queryAsync('SELECT UserID, MobileNumber, FirstName FROM Users LIMIT 1');
    assert(users.length > 0, 'Found test user in DB');
    const testUser = users[0];
    const userToken = jwt.sign(
      { UserID: testUser.UserID, MobileNumber: testUser.MobileNumber },
      SECRET_KEY
    );
    const userHeaders = { Authorization: `token ${userToken}` };

    // ====================================================
    // STEP 2 VERIFICATION: POST-DELIVERY FEEDBACK (OPTIONAL DESCRIPTION)
    // ====================================================
    console.log('\n--- VERIFYING STEP 2: FEEDBACK WITH OPTIONAL DESCRIPTION ---');
    
    // Feedback 1: Rating only, no description
    const resFb1 = await axios.post(`${BASE_URL}/users/addfeedback`, {
      Rating: 5,
      FeedbackType: 'Order Experience',
      OrderID: 9991
    }, { headers: userHeaders });

    assert(resFb1.status === 200, 'Feedback submission (Rating only) returned HTTP 200');
    assert(resFb1.data.Status === 1, 'Feedback response status is 1');
    const fbId1 = resFb1.data.FeedbackID;

    const [fbRow1] = await queryAsync('SELECT * FROM Feedback WHERE FeedbackID = ?', [fbId1]);
    assert(fbRow1 && fbRow1.Rating === 5, 'Feedback persisted in DB with Rating = 5');
    assert(fbRow1.Message === null, 'Feedback message correctly stored as NULL (optional description)');

    // Feedback 2: Rating with optional description text
    const resFb2 = await axios.post(`${BASE_URL}/users/addfeedback`, {
      Rating: 4,
      Message: 'Driver was punctual and polite!',
      FeedbackType: 'Order Experience',
      OrderID: 9992
    }, { headers: userHeaders });

    assert(resFb2.status === 200, 'Feedback submission (with description) returned HTTP 200');
    const fbId2 = resFb2.data.FeedbackID;
    const [fbRow2] = await queryAsync('SELECT * FROM Feedback WHERE FeedbackID = ?', [fbId2]);
    assert(fbRow2 && fbRow2.Message === 'Driver was punctual and polite!', 'Feedback message persisted correctly');

    // Clean up test feedback records
    await queryAsync('DELETE FROM Feedback WHERE FeedbackID IN (?, ?)', [fbId1, fbId2]);

    // ====================================================
    // STEP 3 VERIFICATION: ORDER COUNT & MILESTONE REWARDS
    // ====================================================
    console.log('\n--- VERIFYING STEP 3: ORDERS COUNT & MILESTONE REWARDS ---');
    const resMilestones = await axios.get(`${BASE_URL}/rewards/myMilestones`, { headers: userHeaders });
    assert(resMilestones.status === 200, 'GET /api/rewards/myMilestones returned HTTP 200');
    assert(resMilestones.data.Status === 1, 'Milestones status is 1');
    assert(typeof resMilestones.data.TotalDeliveredOrders === 'number', 'TotalDeliveredOrders returned as number');
    assert(Array.isArray(resMilestones.data.Milestones), 'Milestones array is returned');
    assert(resMilestones.data.Milestones.length > 0, `Milestones array has ${resMilestones.data.Milestones.length} tiers`);
    assert(resMilestones.data.NextMilestone != null, 'NextMilestone is populated');
    console.log(`  User #${testUser.UserID} Delivered Orders: ${resMilestones.data.TotalDeliveredOrders}`);
    console.log(`  Next Milestone: ${resMilestones.data.NextMilestone.RewardName} (Target: ${resMilestones.data.NextMilestone.TriggerValue})`);

    // ====================================================
    // STEP 4 VERIFICATION: ABANDONED CART (>3 DAYS) NOTIFICATION
    // ====================================================
    console.log('\n--- VERIFYING STEP 4: ABANDONED CARTS (>3 DAYS) ---');
    
    // Create an artificial 4-day-old abandoned cart for test user
    const cartId = 9876543;
    await queryAsync('DELETE FROM CartItems WHERE CartID = ?', [cartId]);
    await queryAsync('DELETE FROM AbandonedCartLogs WHERE CartID = ?', [cartId]);
    await queryAsync('DELETE FROM Carts WHERE CartID = ?', [cartId]);

    await queryAsync(`
      INSERT INTO Carts (CartID, UserID, isOrderLinked, UpdatedAt, created_at)
      VALUES (?, ?, 1, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY))
    `, [cartId, testUser.UserID]);

    await queryAsync(`
      INSERT INTO CartItems (CartID, ProductID, Quantity, Price)
      VALUES (?, 1, 2, 45.00)
    `, [cartId]);

    // Trigger abandoned cart scan
    const resAb = await axios.post(`${BASE_URL}/carts/abandoned/trigger-notifications?days=3`);
    assert(resAb.status === 200, 'Trigger abandoned cart notifications returned HTTP 200');
    assert(resAb.data.Status === 1, 'Scan execution Status is 1');
    assert(resAb.data.ScannedCarts > 0, `Detected at least 1 abandoned cart (found: ${resAb.data.ScannedCarts})`);

    // Verify UserNotification was created
    const notifs = await queryAsync(`
      SELECT * FROM UserNotifications 
      WHERE Title LIKE '%cart%' 
      ORDER BY CreatedAt DESC LIMIT 1
    `);
    assert(notifs.length > 0, 'Notification received in UserNotifications table for abandoned cart');
    console.log(`  Notification Title: "${notifs[0]?.Title}"`);
    console.log(`  Notification Message: "${notifs[0]?.Message}"`);

    // Verify AbandonedCartLogs was logged
    const logs = await queryAsync('SELECT * FROM AbandonedCartLogs WHERE ReminderCount >= 1 ORDER BY UpdatedAt DESC LIMIT 1');
    assert(logs.length > 0, 'Abandoned cart logged in AbandonedCartLogs table');
    assert(logs[0]?.ReminderCount >= 1, 'ReminderCount incremented in AbandonedCartLogs');

    // Clean up test cart and notification
    await queryAsync('DELETE FROM CartItems WHERE CartID = ?', [cartId]);
    await queryAsync('DELETE FROM AbandonedCartLogs WHERE CartID = ?', [cartId]);
    await queryAsync('DELETE FROM Carts WHERE CartID = ?', [cartId]);
    if (notifs[0]) {
      await queryAsync('DELETE FROM UserNotifications WHERE NotificationID = ?', [notifs[0].NotificationID]);
    }

    // ====================================================
    // STEP 5 VERIFICATION: WIN-BACK RETENTION COUPONS
    // ====================================================
    console.log('\n--- VERIFYING STEP 5: WIN-BACK COUPONS FOR INACTIVE USERS ---');
    const resWb = await axios.post(`${BASE_URL}/promocodes/winback/trigger?days=14&code=COMEBACK20`);
    assert(resWb.status === 200, 'Trigger win-back coupons returned HTTP 200');
    assert(resWb.data.Status === 1, 'Win-back coupon response Status is 1');
    assert(resWb.data.CouponCode === 'COMEBACK20', 'CouponCode is COMEBACK20');
    console.log(`  Eligible Inactive Users: ${resWb.data.InactiveUsersCount}, Win-back coupons notified: ${resWb.data.CouponsSent}`);

    // Verify COMEBACK20 exists and is active in PromoCodes table
    const [coupon] = await queryAsync('SELECT * FROM PromoCodes WHERE UPPER(PromoCode) = "COMEBACK20"');
    assert(coupon && coupon.Status === 1, 'COMEBACK20 exists in DB and Status = 1 (Active)');
    assert(coupon.OfferValue === 20 && coupon.Type === 1, 'COMEBACK20 offers 20% discount');
    assert(coupon.MinOrderValue === 199, 'COMEBACK20 MinOrderValue is ₹199');

    // Verify customer can retrieve COMEBACK20 via active coupons API
    const resActiveCoupons = await axios.get(`${BASE_URL}/promocodes/active`, { headers: userHeaders });
    assert(resActiveCoupons.status === 200, 'GET /api/promocodes/active returned HTTP 200');
    const promos = resActiveCoupons.data.PromoCodes || [];
    const hasComeback = promos.some(p => p.PromoCode.toUpperCase() === 'COMEBACK20');
    assert(hasComeback, 'COMEBACK20 is visible in customer active coupons list');

  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    failed++;
  } finally {
    console.log('\n====================================================');
    console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
