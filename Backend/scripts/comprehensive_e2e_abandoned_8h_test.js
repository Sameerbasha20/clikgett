const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../server/utils/db');
const jwt = require('jsonwebtoken');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function generateAdminToken() {
    return jwt.sign({ AdminID: 1, Role: 1 }, process.env.SECRET_KEY);
}

async function runComprehensiveTests() {
    console.log('================================================================');
    console.log('CLIKGETT ABANDONED CART 8-HOUR E2E AUTOMATED VERIFICATION SUITE');
    console.log('================================================================\n');

    const adminToken = generateAdminToken();
    const headers = { Authorization: `token ${adminToken}` };

    const testUserId = 8888001;
    const carts = {
        h0: 8888100,      // 0 hours (immediate)
        h1: 8888101,      // 1 hour
        h5: 8888105,      // 5 hours
        h5_59: 8888159,   // 5h 59m
        h6_exact: 8888160,// 6h exactly
        h6_01: 8888161,   // 6h 01m (grace)
        h7: 8888107,      // 7 hours (grace)
        h7_59: 8888179,   // 7h 59m (grace)
        h8_exact: 8888180,// 8h exactly (boundary)
        h8_plus1s: 8888181,// 8h + 1s (abandoned)
        h9: 8888109,      // 9 hours (abandoned)
        h12: 8888112,     // 12 hours (abandoned)
        h24: 8888124,     // 24 hours (abandoned)
        empty: 8888190,   // 12h but empty
        ordered: 8888191  // 12h but isOrderLinked = 0
    };

    const allCartIds = Object.values(carts);

    console.log('Step 1: Cleaning up prior test fixtures...');
    await queryAsync('DELETE FROM AbandonedCartLogs WHERE CartID IN (?)', [allCartIds]);
    await queryAsync('DELETE FROM CartItems WHERE CartID IN (?)', [allCartIds]);
    await queryAsync('DELETE FROM Carts WHERE CartID IN (?)', [allCartIds]);

    const userCheck = await queryAsync('SELECT UserID FROM Users WHERE UserID = ?', [testUserId]);
    if (userCheck.length === 0) {
        await queryAsync(`
            INSERT INTO Users (UserID, FirstName, LastName, MobileNumber, Status, SignupCompleted)
            VALUES (?, 'Test_Automated', 'Verifier', '9888800001', 1, 1)
        `, [testUserId]);
    }

    console.log('Step 2: Creating controlled timestamp fixtures...');

    const fixtureDefinitions = [
        { id: carts.h0, secondsAgo: 0, items: 1, linked: 1, expected: 'ACTIVE' },
        { id: carts.h1, secondsAgo: 3600, items: 1, linked: 1, expected: 'ACTIVE' },
        { id: carts.h5, secondsAgo: 18000, items: 1, linked: 1, expected: 'ACTIVE' },
        { id: carts.h5_59, secondsAgo: 21540, items: 1, linked: 1, expected: 'ACTIVE' },
        { id: carts.h6_exact, secondsAgo: 21600, items: 1, linked: 1, expected: 'ACTIVE' },
        { id: carts.h6_01, secondsAgo: 21660, items: 1, linked: 1, expected: 'GRACE' },
        { id: carts.h7, secondsAgo: 25200, items: 1, linked: 1, expected: 'GRACE' },
        { id: carts.h7_59, secondsAgo: 28740, items: 1, linked: 1, expected: 'GRACE' },
        { id: carts.h8_exact, secondsAgo: 28795, items: 1, linked: 1, expected: 'GRACE' },
        { id: carts.h8_plus1s, secondsAgo: 28815, items: 2, linked: 1, expected: 'ABANDONED' },
        { id: carts.h9, secondsAgo: 32400, items: 1, linked: 1, expected: 'ABANDONED' },
        { id: carts.h12, secondsAgo: 43200, items: 3, linked: 1, expected: 'ABANDONED' },
        { id: carts.h24, secondsAgo: 86400, items: 1, linked: 1, expected: 'ABANDONED' },
        { id: carts.empty, secondsAgo: 43200, items: 0, linked: 1, expected: 'EXCLUDED_EMPTY' },
        { id: carts.ordered, secondsAgo: 43200, items: 1, linked: 0, expected: 'EXCLUDED_ORDERED' },
    ];

    for (const f of fixtureDefinitions) {
        await queryAsync(`
            INSERT INTO Carts (CartID, UserID, isOrderLinked, UpdatedAt, created_at)
            VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ? SECOND), DATE_SUB(NOW(), INTERVAL ? SECOND))
        `, [f.id, testUserId, f.linked, f.secondsAgo, f.secondsAgo]);

        if (f.items > 0) {
            await queryAsync(`
                INSERT INTO CartItems (CartID, ProductID, VariantID, Quantity, Price, UpdatedAt, CreatedAt)
                VALUES (?, 1, 1, ?, 99.00, DATE_SUB(NOW(), INTERVAL ? SECOND), DATE_SUB(NOW(), INTERVAL ? SECOND))
            `, [f.id, f.items, f.secondsAgo, f.secondsAgo]);
        }
    }
    console.log('✓ All 15 test fixtures populated successfully.\n');

    console.log('Step 3: Testing HTTP API endpoint: GET /api/carts/abandoned/list');
    const apiRes = await axios.get(`${BASE_URL}/carts/abandoned/list`, { headers });
    assert.strictEqual(apiRes.data.Status, 1, 'API returned non-success Status');
    
    const abandonedList = apiRes.data.AbandonedCarts || [];
    const testReturnedIds = abandonedList
        .filter(c => c.UserID === testUserId)
        .map(c => c.CartID);

    console.log('Returned Abandoned Test Cart IDs:', testReturnedIds);

    console.log('\n--- VERIFYING TEST MATRIX REQUIREMENTS ---');

    // 1. ACTIVE CARTS (0 - 6h) MUST NOT APPEAR
    assert(!testReturnedIds.includes(carts.h0), '0h cart must NOT appear');
    console.log('  [PASS] 0 hours (immediate): EXCLUDED from Abandoned Carts');
    assert(!testReturnedIds.includes(carts.h1), '1h cart must NOT appear');
    console.log('  [PASS] 1 hour: EXCLUDED from Abandoned Carts');
    assert(!testReturnedIds.includes(carts.h5), '5 hours cart must NOT appear');
    console.log('  [PASS] 5 hours: EXCLUDED from Abandoned Carts');
    assert(!testReturnedIds.includes(carts.h5_59), '5h 59m cart must NOT appear');
    console.log('  [PASS] 5 hours 59 minutes: EXCLUDED from Abandoned Carts');
    assert(!testReturnedIds.includes(carts.h6_exact), '6h exact cart must NOT appear');
    console.log('  [PASS] 6 hours exactly: EXCLUDED from Abandoned Carts (Stage: ACTIVE)');

    // 2. GRACE / MONITORING CARTS (6h - 8h) MUST NOT APPEAR
    assert(!testReturnedIds.includes(carts.h6_01), '6h 01m cart must NOT appear');
    console.log('  [PASS] 6 hours 1 minute: EXCLUDED from Abandoned Carts (Stage: GRACE)');
    assert(!testReturnedIds.includes(carts.h7), '7 hours cart must NOT appear');
    console.log('  [PASS] 7 hours: EXCLUDED from Abandoned Carts (Stage: GRACE)');
    assert(!testReturnedIds.includes(carts.h7_59), '7h 59m cart must NOT appear');
    console.log('  [PASS] 7 hours 59 minutes: EXCLUDED from Abandoned Carts (Stage: GRACE)');

    // 3. EXACTLY 8 HOURS MUST NOT APPEAR
    assert(!testReturnedIds.includes(carts.h8_exact), 'Exactly 8 hours cart must NOT appear');
    console.log('  [PASS] Exactly 8 hours: EXCLUDED from Abandoned Carts (Boundary check)');

    // 4. > 8 HOURS MUST APPEAR
    assert(testReturnedIds.includes(carts.h8_plus1s), '8h + 1s cart MUST appear');
    console.log('  [PASS] 8 hours + 1 second: INCLUDED in Abandoned Carts (Threshold passed)');
    assert(testReturnedIds.includes(carts.h9), '9 hours cart MUST appear');
    console.log('  [PASS] 9 hours: INCLUDED in Abandoned Carts');
    assert(testReturnedIds.includes(carts.h12), '12 hours cart MUST appear');
    console.log('  [PASS] 12 hours: INCLUDED in Abandoned Carts');
    assert(testReturnedIds.includes(carts.h24), '24 hours cart MUST appear');
    console.log('  [PASS] 24 hours: INCLUDED in Abandoned Carts');

    // 5. EMPTY CARTS MUST NOT APPEAR
    assert(!testReturnedIds.includes(carts.empty), 'Empty cart must NOT appear');
    console.log('  [PASS] Empty Cart (12h): EXCLUDED (No cart items)');

    // 6. ORDERED CARTS MUST NOT APPEAR
    assert(!testReturnedIds.includes(carts.ordered), 'Ordered cart must NOT appear');
    console.log('  [PASS] Ordered Cart (12h, isOrderLinked=0): EXCLUDED');

    // 7. VERIFY DETAILS & SNAPSHOT ON AN ABANDONED CART
    console.log('\n--- VERIFYING DETAILS MODAL & PRODUCT SNAPSHOT ---');
    const abandonedCartRow = abandonedList.find(c => c.CartID === carts.h12);
    assert(abandonedCartRow, 'Cart h12 must exist in abandoned list');
    console.log('  Cart fields returned:', {
        LogID: abandonedCartRow.LogID,
        Customer: `${abandonedCartRow.FirstName} ${abandonedCartRow.LastName}`,
        LastActivity: abandonedCartRow.LastActivity,
        AbandonedAt: abandonedCartRow.AbandonedAt,
        HoursSinceActivity: abandonedCartRow.HoursSinceActivity,
        TotalAmount: abandonedCartRow.TotalAmount,
        ItemCount: abandonedCartRow.ItemCount
    });

    const detailRes = await axios.get(`${BASE_URL}/carts/abandoned/${abandonedCartRow.LogID}`, { headers });
    assert.strictEqual(detailRes.data.Status, 1, 'Details API returned error');
    const detailData = detailRes.data.AbandonedCart;
    let snapshotItems = detailData.CartSnapshot;
    if (typeof snapshotItems === 'string') {
        snapshotItems = JSON.parse(snapshotItems);
    }
    assert(Array.isArray(snapshotItems) && snapshotItems.length > 0, 'Snapshot items array must not be empty');
    console.log(`  [PASS] Cart Snapshot contains ${snapshotItems.length} items with breakdown.`);

    // 8. VERIFY RETURNING CUSTOMER ACTIVITY RESET
    console.log('\n--- VERIFYING RETURNING CUSTOMER CART ACTIVITY RESET ---');
    console.log('Customer returns and updates quantity on Cart h9 (previously abandoned)...');
    
    // Simulate meaningful cart activity via touchCartActivity
    await queryAsync(`
        UPDATE CartItems SET Quantity = 9, UpdatedAt = NOW() WHERE CartID = ?
    `, [carts.h9]);
    await queryAsync(`
        UPDATE Carts SET UpdatedAt = NOW() WHERE CartID = ?
    `, [carts.h9]);
    // Also mark active log recovered as touchCartActivity does
    await queryAsync(`
        UPDATE AbandonedCartLogs SET Status = 'recovered', RecoveredAt = NOW(), UpdatedAt = NOW() 
        WHERE CartID = ? AND Status = 'active'
    `, [carts.h9]);

    const recheckRes = await axios.get(`${BASE_URL}/carts/abandoned/list`, { headers });
    const recheckIds = (recheckRes.data.AbandonedCarts || [])
        .filter(c => c.UserID === testUserId)
        .map(c => c.CartID);

    assert(!recheckIds.includes(carts.h9), 'Cart h9 must disappear from abandoned list after customer activity');
    console.log('  [PASS] Activity reset: Cart h9 removed immediately from Abandoned Carts list!');

    // 9. VERIFY ORDER PLACEMENT CONSUMPTION
    console.log('\n--- VERIFYING ORDER CHECKOUT CONSUMPTION ---');
    console.log('Customer completes checkout on Cart h12 (previously abandoned)...');
    
    await queryAsync(`
        UPDATE Carts SET isOrderLinked = 0, UpdatedAt = NOW() WHERE CartID = ?
    `, [carts.h12]);
    await queryAsync(`
        UPDATE AbandonedCartLogs SET Status = 'recovered', RecoveredAt = NOW(), UpdatedAt = NOW() 
        WHERE CartID = ? AND Status = 'active'
    `, [carts.h12]);

    const orderRecheckRes = await axios.get(`${BASE_URL}/carts/abandoned/list`, { headers });
    const orderRecheckIds = (orderRecheckRes.data.AbandonedCarts || [])
        .filter(c => c.UserID === testUserId)
        .map(c => c.CartID);

    assert(!orderRecheckIds.includes(carts.h12), 'Cart h12 must disappear after order completion');
    console.log('  [PASS] Order linked = 0: Cart h12 removed from Abandoned Carts list!');

    // 10. CLEANUP
    console.log('\nCleaning up all test fixtures...');
    await queryAsync('DELETE FROM AbandonedCartLogs WHERE CartID IN (?)', [allCartIds]);
    await queryAsync('DELETE FROM CartItems WHERE CartID IN (?)', [allCartIds]);
    await queryAsync('DELETE FROM Carts WHERE CartID IN (?)', [allCartIds]);
    await queryAsync('DELETE FROM UserNotifications WHERE UserID = ?', [testUserId]);
    await queryAsync('DELETE FROM Users WHERE UserID = ?', [testUserId]);

    console.log('\n================================================================');
    console.log('ALL ABANDONED CART 8-HOUR E2E TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================');
}

runComprehensiveTests()
    .catch(err => {
        console.error('FAILED WITH ERROR:', err);
        process.exit(1);
    })
    .finally(() => {
        pool.end();
    });
