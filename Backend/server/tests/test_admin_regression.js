const axios = require('axios');

async function testRegression() {
    const loginRes = await axios.post('http://localhost:5000/api/adminuser/login', {
        EmailID: 'clikgett@admin.com',
        Password: 'clikgett'
    });
    const headers = { Authorization: 'token ' + loginRes.data.token };

    const tests = [
        { name: 'Current Orders', url: 'http://localhost:5000/api/adminorders/currentorders' },
        { name: 'Live Operations', url: 'http://localhost:5000/api/adminorders/live-operations' },
        { name: 'Delay Queue', url: 'http://localhost:5000/api/adminorders/delays' },
        { name: 'Dynamic ETA', url: 'http://localhost:5000/api/adminorders/dynamic-eta/910' },
        { name: 'Eligible Drivers', url: 'http://localhost:5000/api/adminorders/eligible-drivers' },
    ];

    console.log('--- ADMIN API REGRESSION TEST ---');
    for (const t of tests) {
        try {
            const res = await axios.get(t.url, { headers });
            console.log(`[PASS] ${t.name}: HTTP ${res.status}, Status: ${res.data.Status}`);
        } catch (e) {
            console.error(`[FAIL] ${t.name}: HTTP ${e.response?.status}, Error:`, e.response?.data);
        }
    }
}

testRegression();
