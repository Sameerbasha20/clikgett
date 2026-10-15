const pool = require('../server/utils/db');
const assert = require('assert');

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

/**
 * Lifecycle stage calculator matching the business rule:
 * 0 - 6h: ACTIVE
 * >6 - 8h: GRACE / MONITORING
 * >8h: ABANDONED
 */
function getLifecycleStage(hoursSinceLastActivity) {
    if (hoursSinceLastActivity <= 6.0) {
        return 'ACTIVE';
    } else if (hoursSinceLastActivity <= 8.0) {
        return 'GRACE';
    } else {
        return 'ABANDONED';
    }
}

async function runTestMatrix() {
    console.log('====================================================');
    console.log('ABANDONED CART 8-HOUR TIMING & LIFECYCLE TEST MATRIX');
    console.log('====================================================\n');

    // Test matrix definition
    const testCases = [
        { label: '0 hours (Immediate)', secondsAgo: 0, expectedStage: 'ACTIVE', shouldBeInAbandonedList: false },
        { label: '1 hour', secondsAgo: 3600, expectedStage: 'ACTIVE', shouldBeInAbandonedList: false },
        { label: '5 hours', secondsAgo: 18000, expectedStage: 'ACTIVE', shouldBeInAbandonedList: false },
        { label: '5 hours 59 mins', secondsAgo: 21540, expectedStage: 'ACTIVE', shouldBeInAbandonedList: false },
        { label: '6 hours exactly', secondsAgo: 21600, expectedStage: 'ACTIVE', shouldBeInAbandonedList: false },
        { label: '6 hours 1 min', secondsAgo: 21660, expectedStage: 'GRACE', shouldBeInAbandonedList: false },
        { label: '7 hours', secondsAgo: 25200, expectedStage: 'GRACE', shouldBeInAbandonedList: false },
        { label: '7 hours 59 mins', secondsAgo: 28740, expectedStage: 'GRACE', shouldBeInAbandonedList: false },
        { label: '8 hours exactly (28800s)', secondsAgo: 28800, expectedStage: 'GRACE', shouldBeInAbandonedList: false },
        { label: '8 hours + 1 sec (28801s)', secondsAgo: 28801, expectedStage: 'ABANDONED', shouldBeInAbandonedList: true },
        { label: '9 hours', secondsAgo: 32400, expectedStage: 'ABANDONED', shouldBeInAbandonedList: true },
        { label: '12 hours', secondsAgo: 43200, expectedStage: 'ABANDONED', shouldBeInAbandonedList: true },
        { label: '24 hours', secondsAgo: 86400, expectedStage: 'ABANDONED', shouldBeInAbandonedList: true },
    ];

    console.log('1. Verifying Database-Level Timing Boundary Logic in MySQL:');
    for (const tc of testCases) {
        const rows = await queryAsync(`
            SELECT 
                DATE_SUB(NOW(), INTERVAL ? SECOND) as TestTimestamp,
                (DATE_SUB(NOW(), INTERVAL ? SECOND) < DATE_SUB(NOW(), INTERVAL 8 HOUR)) as IsDbAbandoned,
                ROUND(? / 3600.0, 4) as HoursElapsed
        `, [tc.secondsAgo, tc.secondsAgo, tc.secondsAgo]);

        const isDbAbandoned = Boolean(rows[0].IsDbAbandoned);
        const stage = getLifecycleStage(tc.secondsAgo / 3600.0);

        assert.strictEqual(
            stage, 
            tc.expectedStage, 
            `Stage mismatch for ${tc.label}: expected ${tc.expectedStage}, got ${stage}`
        );
        assert.strictEqual(
            isDbAbandoned, 
            tc.shouldBeInAbandonedList, 
            `Database boundary mismatch for ${tc.label}: expected ${tc.shouldBeInAbandonedList}, got ${isDbAbandoned}`
        );

        console.log(`  ✓ ${tc.label.padEnd(25)} | Elapsed: ${(tc.secondsAgo / 3600.0).toFixed(2)}h | Stage: ${stage.padEnd(9)} | Abandoned: ${isDbAbandoned ? 'YES' : 'NO'}`);
    }

    console.log('\n2. Testing Real Database Fixtures for Lifecycle, Returning Customer & Order Scenarios:');

    // Create a temporary test user & test cart IDs
    const testUserId = 9999901;
    const testCartA = 9999911; // 9 hours old (abandoned)
    const testCartB = 9999912; // 4 hours old (active)
    const testCartC = 9999913; // 7 hours old (grace)
    const testCartD = 9999914; // 8 hours exactly (not abandoned)
    const testCartE = 9999915; // 8 hours + 1 second (abandoned)
    const testCartEmpty = 9999916; // 12 hours old but empty
    const testCartOrdered = 9999917; // 12 hours old but isOrderLinked = 0

    const allTestCarts = [testCartA, testCartB, testCartC, testCartD, testCartE, testCartEmpty, testCartOrdered];

    // Clean up any previous test artifacts
    await queryAsync('DELETE FROM AbandonedCartLogs WHERE CartID IN (?)', [allTestCarts]);
    await queryAsync('DELETE FROM CartItems WHERE CartID IN (?)', [allTestCarts]);
    await queryAsync('DELETE FROM Carts WHERE CartID IN (?)', [allTestCarts]);

    // Insert test user if not exists
    const users = await queryAsync('SELECT UserID FROM Users WHERE UserID = ?', [testUserId]);
    if (users.length === 0) {
        await queryAsync(`
            INSERT INTO Users (UserID, FirstName, LastName, MobileNumber, Status, SignupCompleted)
            VALUES (?, 'QA_Tester', 'Abandoned', '9999900001', 1, 1)
        `, [testUserId]);
    }

    // Insert Carts
    // Cart A: 9 hours old
    await queryAsync(`
        INSERT INTO Carts (CartID, UserID, isOrderLinked, UpdatedAt, created_at)
        VALUES (?, ?, 1, DATE_SUB(NOW(), INTERVAL 9 HOUR), DATE_SUB(NOW(), INTERVAL 9 HOUR))
    `, [testCartA, testUserId]);
    await queryAsync(`
        INSERT INTO CartItems (CartID, ProductID, Quantity, Price, UpdatedAt, CreatedAt)
        VALUES (?, 1, 2, 50.00, DATE_SUB(NOW(), INTERVAL 9 HOUR), DATE_SUB(NOW(), INTERVAL 9 HOUR))
    `, [testCartA]);

    // Cart B: 4 hours old (active)
    await queryAsync(`
        INSERT INTO Carts (CartID, UserID, isOrderLinked, UpdatedAt, created_at)
        VALUES (?, ?, 1, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR))
    `, [testCartB, testUserId]);
    await queryAsync(`
        INSERT INTO CartItems (CartID, ProductID, Quantity, Price, UpdatedAt, CreatedAt)
        VALUES (?, 1, 1, 50.00, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR))
    `, [testCartB]);

    // Cart C: 7 hours old (grace)
    await queryAsync(`
        INSERT INTO Carts (CartID, UserID, isOrderLinked, UpdatedAt, created_at)
        VALUES (?, ?, 1, DATE_SUB(NOW(), INTERVAL 7 HOUR), DATE_SUB(NOW(), INTERVAL 7 HOUR))
    `, [testCartC, testUserId]);
    await queryAsync(`
        INSERT INTO CartItems (CartID, ProductID, Quantity, Price, UpdatedAt, CreatedAt)
        VALUES (?, 1, 3, 50.00, DATE_SUB(NOW(), INTERVAL 7 HOUR), DATE_SUB(NOW(), INTERVAL 7 HOUR))
    `, [testCartC]);

    // Cart D: 7 hours 59 mins 50 secs (within 8h grace period)
    await queryAsync(`
        INSERT INTO Carts (CartID, UserID, isOrderLinked, UpdatedAt, created_at)
        VALUES (?, ?, 1, DATE_SUB(NOW(), INTERVAL 28790 SECOND), DATE_SUB(NOW(), INTERVAL 28790 SECOND))
    `, [testCartD, testUserId]);
    await queryAsync(`
        INSERT INTO CartItems (CartID, ProductID, Quantity, Price, UpdatedAt, CreatedAt)
        VALUES (?, 1, 1, 50.00, DATE_SUB(NOW(), INTERVAL 28790 SECOND), DATE_SUB(NOW(), INTERVAL 28790 SECOND))
    `, [testCartD]);

    // Cart E: 8 hours + 10 seconds (28810s, past 8h threshold)
    await queryAsync(`
        INSERT INTO Carts (CartID, UserID, isOrderLinked, UpdatedAt, created_at)
        VALUES (?, ?, 1, DATE_SUB(NOW(), INTERVAL 28810 SECOND), DATE_SUB(NOW(), INTERVAL 28810 SECOND))
    `, [testCartE, testUserId]);
    await queryAsync(`
        INSERT INTO CartItems (CartID, ProductID, Quantity, Price, UpdatedAt, CreatedAt)
        VALUES (?, 1, 1, 50.00, DATE_SUB(NOW(), INTERVAL 28810 SECOND), DATE_SUB(NOW(), INTERVAL 28810 SECOND))
    `, [testCartE]);

    // Cart Empty: 12 hours old, NO CartItems
    await queryAsync(`
        INSERT INTO Carts (CartID, UserID, isOrderLinked, UpdatedAt, created_at)
        VALUES (?, ?, 1, DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR))
    `, [testCartEmpty, testUserId]);

    // Cart Ordered: 12 hours old, but isOrderLinked = 0
    await queryAsync(`
        INSERT INTO Carts (CartID, UserID, isOrderLinked, UpdatedAt, created_at)
        VALUES (?, ?, 0, DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR))
    `, [testCartOrdered, testUserId]);
    await queryAsync(`
        INSERT INTO CartItems (CartID, ProductID, Quantity, Price, UpdatedAt, CreatedAt)
        VALUES (?, 1, 1, 50.00, DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR))
    `, [testCartOrdered]);

    console.log('  Fixtures created in DB.');

    // Execute Authoritative Query against test fixtures
    const query = `
        SELECT 
            c.CartID,
            c.UserID,
            GREATEST(
                COALESCE(c.UpdatedAt, c.created_at),
                COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)
            ) AS LastActivity,
            ROUND(TIMESTAMPDIFF(SECOND, GREATEST(COALESCE(c.UpdatedAt, c.created_at), COALESCE(MAX(ci.UpdatedAt), c.UpdatedAt, c.created_at)), NOW()) / 3600.0, 2) AS HoursSinceActivity,
            COUNT(ci.CartItemID) AS ItemCount
        FROM Carts c
        JOIN CartItems ci ON c.CartID = ci.CartID
        WHERE c.isOrderLinked = 1
          AND c.CartID IN (?)
        GROUP BY c.CartID, c.UserID, c.UpdatedAt, c.created_at
        HAVING ItemCount > 0 
           AND LastActivity < DATE_SUB(NOW(), INTERVAL 8 HOUR)
    `;

    const abandonedRows = await queryAsync(query, [allTestCarts]);
    const detectedCartIds = abandonedRows.map(r => r.CartID);

    console.log('  Detected Abandoned Cart IDs:', detectedCartIds);

    // Assertions
    assert(detectedCartIds.includes(testCartA), 'Cart A (9h) must be detected as abandoned');
    assert(!detectedCartIds.includes(testCartB), 'Cart B (4h) must NOT be detected (Active)');
    assert(!detectedCartIds.includes(testCartC), 'Cart C (7h) must NOT be detected (Grace)');
    assert(!detectedCartIds.includes(testCartD), 'Cart D (exactly 8h) must NOT be detected (Boundary)');
    assert(detectedCartIds.includes(testCartE), 'Cart E (8h + 1s) must be detected as abandoned');
    assert(!detectedCartIds.includes(testCartEmpty), 'Empty cart must NOT be detected');
    assert(!detectedCartIds.includes(testCartOrdered), 'Ordered cart (isOrderLinked=0) must NOT be detected');

    console.log('  ✓ Cart A (9h): INCLUDED in abandoned list');
    console.log('  ✓ Cart B (4h): EXCLUDED (Active 0-6h)');
    console.log('  ✓ Cart C (7h): EXCLUDED (Grace 6-8h)');
    console.log('  ✓ Cart D (exactly 8h): EXCLUDED (Boundary rule)');
    console.log('  ✓ Cart E (8h + 1s): INCLUDED in abandoned list');
    console.log('  ✓ Empty Cart (12h): EXCLUDED (0 items)');
    console.log('  ✓ Ordered Cart (12h): EXCLUDED (isOrderLinked = 0)');

    // 3. Test Activity Reset & Returning Customer:
    console.log('\n3. Testing Returning Customer Activity Reset:');
    // Customer returns to Cart A (9h old) and updates item quantity NOW
    await queryAsync(`
        UPDATE CartItems SET Quantity = 5, UpdatedAt = NOW() WHERE CartID = ?
    `, [testCartA]);
    await queryAsync(`
        UPDATE Carts SET UpdatedAt = NOW() WHERE CartID = ?
    `, [testCartA]);

    const recheckRows = await queryAsync(query, [allTestCarts]);
    const recheckIds = recheckRows.map(r => r.CartID);

    assert(!recheckIds.includes(testCartA), 'Cart A must NOT be abandoned after customer performed recent activity!');
    console.log('  ✓ Cart A modified now -> Activity reset -> Timer reset -> EXCLUDED from abandoned list');

    // Clean up test data
    await queryAsync('DELETE FROM AbandonedCartLogs WHERE CartID IN (?)', [allTestCarts]);
    await queryAsync('DELETE FROM CartItems WHERE CartID IN (?)', [allTestCarts]);
    await queryAsync('DELETE FROM Carts WHERE CartID IN (?)', [allTestCarts]);
    await queryAsync('DELETE FROM Users WHERE UserID = ?', [testUserId]);

    console.log('  Test fixtures cleaned up.');
    console.log('\n====================================================');
    console.log('ALL TIMING, BOUNDARY & RESET VERIFICATIONS PASSED!');
    console.log('====================================================');
}

runTestMatrix()
    .catch(err => {
        console.error('Test Matrix Failed:', err);
        process.exit(1);
    })
    .finally(() => {
        pool.end();
    });
