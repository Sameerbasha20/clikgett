const http = require('http');
const jwt = require('jsonwebtoken');

const secret = process.env.SECRET_KEY;
const adminToken = jwt.sign({ AdminID: 2, Role: 1 }, secret, { expiresIn: '2h' });

const endpoints = [
    { method: 'GET', path: '/api/adminuser/admindetails' },
    { method: 'GET', path: '/api/deliveryboy/all' },
    { method: 'GET', path: '/api/adminorders/allorders' },
    { method: 'GET', path: '/api/adminorders/pastorders' },
    { method: 'GET', path: '/api/categories/allcategoriesadmin' },
    { method: 'GET', path: '/api/subcategories/allsubcategoriesadmin' },
    { method: 'GET', path: '/api/adminuser/userslist' },
    { method: 'GET', path: '/api/banners/allbannersadmin' },
    { method: 'GET', path: '/api/adminproducts/bycategory' },
    { method: 'GET', path: '/api/admin/photo-orders/list' },
    { method: 'GET', path: '/api/admin/customer-enquiries' },
    { method: 'GET', path: '/api/admin/product-requests' },
    { method: 'GET', path: '/api/promocodes/allpromocodesadmin' },
    { method: 'GET', path: '/api/sales/all' },
    { method: 'GET', path: '/api/carts/abandoned/list' },
    { method: 'GET', path: '/api/milestones/all' },
    { method: 'GET', path: '/api/buymore/tiers' },
    { method: 'GET', path: '/api/restrictions/restrictions' },
    { method: 'GET', path: '/api/cartoffers/offers' },
    { method: 'GET', path: '/api/adminusers/feedback/list' },
    { method: 'GET', path: '/api/adminusers/feedback/cashback-eligible' },
    { method: 'GET', path: '/api/search/analytics' },
    { method: 'GET', path: '/api/homesections/all' },
    { method: 'GET', path: '/api/product-unlocks/unlocks' },
    { method: 'GET', path: '/api/adminorders/cost-overview' },
    { method: 'GET', path: '/api/adminorders/live-operations' },
    { method: 'GET', path: '/api/adminorders/delays' },
    { method: 'GET', path: '/api/storetimings/all' },
    { method: 'GET', path: '/api/routes/admin/bystatus?Status=1' },
    { method: 'GET', path: '/api/warehouse/all' },
    { method: 'GET', path: '/api/kits/all' },
    { method: 'GET', path: '/api/membership/plans' },
    { method: 'GET', path: '/api/rewards/all' },
    { method: 'GET', path: '/api/user-notifications/admin/list' },
    { method: 'GET', path: '/api/callbackform/all' },
    { method: 'GET', path: '/api/availability/all' },
    { method: 'GET', path: '/api/franchiseenquiry/all' },
    { method: 'GET', path: '/api/notify/all' },
    { method: 'GET', path: '/api/adminglobal/search?query=test' }
];

async function checkEndpoint(ep) {
    return new Promise((resolve) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: ep.path,
            method: ep.method,
            headers: {
                'Authorization': `token ${adminToken}`,
                'Accept': 'application/json'
            },
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({
                    path: ep.path,
                    statusCode: res.statusCode,
                    body: parsed
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                path: ep.path,
                statusCode: 0,
                error: err.message
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                path: ep.path,
                statusCode: 408,
                error: 'Timeout'
            });
        });

        req.end();
    });
}

async function run() {
    console.log('Testing all Admin endpoints for failures...\n');
    let failures = 0;
    for (const ep of endpoints) {
        const result = await checkEndpoint(ep);
        const isHttpError = result.statusCode >= 400 || result.statusCode === 0;
        const isAppError = result.body && (
            result.body.Status === 0 || 
            result.body.status === 0 || 
            (typeof result.body.Message === 'string' && result.body.Message.toLowerCase().includes('error')) ||
            (typeof result.body === 'string' && result.body.toLowerCase().includes('error'))
        );

        if (isHttpError || isAppError) {
            failures++;
            console.log(`❌ FAIL [HTTP ${result.statusCode}] ${result.path}`);
            console.log(`   Response:`, JSON.stringify(result.body || result.error));
        } else {
            console.log(`✅ OK   [HTTP ${result.statusCode}] ${result.path}`);
        }
    }
    console.log(`\nAudit complete. Total failures: ${failures} / ${endpoints.length}`);
}

run();
