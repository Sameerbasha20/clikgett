const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const mysql = require('mysql');

const pool = mysql.createPool({
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT
});

async function testOrderAdjustment() {
    const adminToken = jwt.sign({ AdminID: 1 }, process.env.SECRET_KEY || 'defaultsecret');
    const headers = { Authorization: 'token ' + adminToken };
    const BASE_URL = 'http://localhost:5000/api';

    console.log('1. Fetching a test order...');
    const [orders] = await new Promise((res, rej) => pool.query('SELECT OrderID, UserID, GrandTotal FROM Orders LIMIT 1', (err, r) => err ? rej(err) : res([r])));
    const order = orders[0];
    const origTotal = parseFloat(order.GrandTotal);
    console.log('Order:', order.OrderID, 'Original GrandTotal:', origTotal);

    console.log('2. Testing Increase (+₹25)...');
    const newTotal = origTotal + 25;
    const adjRes = await axios.post(BASE_URL + '/adminorders/adjustorder', {
        OrderID: order.OrderID,
        NewAmount: newTotal,
        Reason: 'Audit Verification: Adding expedited handling fee',
        AdjustmentType: 'manual_increase'
    }, { headers });
    console.log('Increase response:', adjRes.data);

    // Verify DB
    const [checkOrder] = await new Promise((res, rej) => pool.query('SELECT GrandTotal FROM Orders WHERE OrderID = ?', [order.OrderID], (err, r) => err ? rej(err) : res([r])));
    const [checkAdj] = await new Promise((res, rej) => pool.query('SELECT * FROM order_adjustments WHERE OrderID = ? ORDER BY AdjustmentID DESC LIMIT 1', [order.OrderID], (err, r) => err ? rej(err) : res([r])));
    console.log('DB GrandTotal after increase:', parseFloat(checkOrder[0].GrandTotal), '(Expected:', newTotal, ')');
    console.log('DB Adjustment row:', checkAdj[0].AdjustmentID, 'Diff:', checkAdj[0].DifferenceAmount, 'Type:', checkAdj[0].AdjustmentType);

    console.log('3. Testing History API (GET /api/adminorders/adjustments/:OrderID)...');
    const histRes = await axios.get(BASE_URL + '/adminorders/adjustments/' + order.OrderID, { headers });
    console.log('History API count:', (histRes.data.Adjustments || []).length);

    console.log('4. Testing Negative/Invalid Input Handling...');
    try {
        await axios.post(BASE_URL + '/adminorders/adjustorder', {
            OrderID: order.OrderID,
            NewAmount: -50,
            Reason: 'Invalid negative total'
        }, { headers });
        console.log('Negative test FAIL (should have been rejected)');
    } catch (e) {
        console.log('Negative amount correctly rejected:', e.response ? e.response.data : e.message);
    }

    try {
        await axios.post(BASE_URL + '/adminorders/adjustorder', {
            OrderID: order.OrderID,
            NewAmount: newTotal,
            Reason: 'Identical amount'
        }, { headers });
        console.log('Zero delta test FAIL (should have been rejected)');
    } catch (e) {
        console.log('Zero delta correctly rejected:', e.response ? e.response.data : e.message);
    }

    console.log('5. Restoring original Order total...');
    await axios.post(BASE_URL + '/adminorders/adjustorder', {
        OrderID: order.OrderID,
        NewAmount: origTotal,
        Reason: 'Audit Cleanup: Restoring original total',
        AdjustmentType: 'manual_decrease'
    }, { headers });
    const [finalOrder] = await new Promise((res, rej) => pool.query('SELECT GrandTotal FROM Orders WHERE OrderID = ?', [order.OrderID], (err, r) => err ? rej(err) : res([r])));
    console.log('Final restored GrandTotal:', parseFloat(finalOrder[0].GrandTotal), '(Matches original:', parseFloat(finalOrder[0].GrandTotal) === origTotal, ')');

    process.exit(0);
}

testOrderAdjustment().catch(e => { console.error('Error:', e); process.exit(1); });
