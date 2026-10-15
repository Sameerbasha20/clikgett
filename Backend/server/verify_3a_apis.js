const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const http = require('http');

const adminToken = jwt.sign({ AdminID: 1 }, process.env.SECRET_KEY, { algorithm: "HS256" });

function testApi(method, pathUrl, body = null) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: pathUrl,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${adminToken}`,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(resData); } catch (e) { parsed = resData; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  const tests = [
    { name: 'Flash Sales List', method: 'GET', url: '/api/sales/all' },
    { name: 'Flash Sales Base', method: 'GET', url: '/api/sales' },
    { name: 'Abandoned Carts List', method: 'GET', url: '/api/carts/abandoned/list' },
    { name: 'Abandoned Carts Base', method: 'GET', url: '/api/carts/abandoned' },
    { name: 'Milestone Config', method: 'GET', url: '/api/milestones/config' },
    { name: 'Milestone Rewards All', method: 'GET', url: '/api/rewards/all' },
    { name: 'Milestone Progress', method: 'GET', url: '/api/rewards/userprogress' },
    { name: 'Past Orders Filter (Parameterized)', method: 'GET', url: '/api/adminorders/pastordersfilter?mobileNumber=9999' },
    { name: 'Past Orders Sort (Parameterized)', method: 'GET', url: '/api/adminorders/pastorderssort?sortBy=latest' },
    { name: 'Past Orders Mobile Filter (Parameterized)', method: 'GET', url: '/api/adminorders/pastordersmobilefilter?mobileNumber=999' },
    { name: 'Past Orders Username Filter (Parameterized)', method: 'GET', url: '/api/adminorders/pastordersusernamefilter?username=admin' },
    { name: 'Past Orders ID Filter (Parameterized)', method: 'GET', url: '/api/adminorders/pastordersorderidfilter?orderId=1' },
    { name: 'Order Timeline (Parameterized)', method: 'GET', url: '/api/adminorders/ordertimeline/1' },
    { name: 'Scheduled Orders', method: 'GET', url: '/api/adminorders/scheduledorders' },
  ];

  console.log('Testing Phase 3A APIs against live RDS:');
  for (const t of tests) {
    const res = await testApi(t.method, t.url);
    const pass = res.status === 200 && res.data && res.data.Status === 1;
    console.log(`[${t.method}] ${t.url.padEnd(55)} -> HTTP ${res.status} | Status: ${res.data?.Status} | Result: ${pass ? 'PASS' : 'FAIL'}`);
    if (!pass) console.log('  Response:', res.data);
  }
  process.exit(0);
}

run();
