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

async function testWalletExpiry() {
    const adminToken = jwt.sign({ AdminID: 1 }, process.env.SECRET_KEY || 'defaultsecret');
    const headers = { Authorization: 'token ' + adminToken };
    const BASE_URL = 'http://localhost:5000/api';

    console.log('1. Fetching a test user...');
    const [users] = await new Promise((res, rej) => pool.query('SELECT UserID, WalletAmount FROM Users LIMIT 1', (err, r) => err ? rej(err) : res([r])));
    const user = users[0];
    const initialBalance = parseFloat(user.WalletAmount);
    console.log('User:', user.UserID, 'Initial WalletAmount:', initialBalance);

    console.log('2. Inserting test cashback with PAST ExpiryDate...');
    const pastExpiry = '2026-01-01 00:00:00';
    const insRes = await new Promise((res, rej) => pool.query(
        'INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, ExpiryDate, IsExpired, CreatedAt) VALUES (?, 75.00, 1, 4, 999999, "Test Expiring Cashback", ?, 0, NOW())',
        [user.UserID, pastExpiry],
        (err, r) => err ? rej(err) : res(r)
    ));
    const testWalletID = insRes.insertId;
    await new Promise((res) => pool.query('UPDATE Users SET WalletAmount = WalletAmount + 75.00 WHERE UserID = ?', [user.UserID], res));
    console.log('Inserted WalletID:', testWalletID, 'credited ₹75.00');

    console.log('3. Triggering POST /api/adminusers/expirecashback...');
    const expRes1 = await axios.post(BASE_URL + '/adminusers/expirecashback', {}, { headers });
    console.log('First Expiry Run:', expRes1.data);

    // Wait a brief moment for async queries
    await new Promise(r => setTimeout(r, 1000));

    console.log('4. Verifying DB state...');
    const [checkWallet] = await new Promise((res, rej) => pool.query('SELECT * FROM Wallets WHERE WalletID = ?', [testWalletID], (err, r) => err ? rej(err) : res([r])));
    const [checkUser] = await new Promise((res, rej) => pool.query('SELECT WalletAmount FROM Users WHERE UserID = ?', [user.UserID], (err, r) => err ? rej(err) : res([r])));
    const [debitEntry] = await new Promise((res, rej) => pool.query('SELECT * FROM Wallets WHERE ContentID = ? AND Description = "Cashback expired debit"', [testWalletID], (err, r) => err ? rej(err) : res([r])));
    
    console.log('Wallet IsExpired status:', checkWallet[0].IsExpired, '(Expected: 1)');
    console.log('Updated User WalletAmount:', parseFloat(checkUser[0].WalletAmount), '(Expected:', initialBalance, ')');
    console.log('Debit Ledger Record:', debitEntry && debitEntry.length > 0 ? 'Found ID ' + debitEntry[0].WalletID + ' amount ' + debitEntry[0].Amount : 'Not Found');

    console.log('5. Testing Idempotency (Second Expiry Run)...');
    const expRes2 = await axios.post(BASE_URL + '/adminusers/expirecashback', {}, { headers });
    console.log('Second Expiry Run:', expRes2.data, '(Expected: 0 expired)');

    console.log('6. Cleaning up test records...');
    await new Promise((res) => pool.query('DELETE FROM Wallets WHERE WalletID = ? OR ContentID = ?', [testWalletID, testWalletID], res));
    await new Promise((res) => pool.query('UPDATE Users SET WalletAmount = ? WHERE UserID = ?', [initialBalance, user.UserID], res));
    console.log('Cleanup complete. Balance restored to:', initialBalance);
    process.exit(0);
}

testWalletExpiry().catch(e => { console.error('Error:', e); process.exit(1); });
