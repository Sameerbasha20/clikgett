const http = require('http');
const jwt = require('jsonwebtoken');

const secret = process.env.SECRET_KEY;
const adminToken = jwt.sign({ AdminID: 2, Role: 1 }, secret, { expiresIn: '2h' });

const endpoints = [
    '/api/adminuser/getalldeliveryboys',
    '/api/adminorders/currentorders',
    '/api/adminorders/pastorders',
    '/api/categories/allcategoriesadmin',
    '/api/banners',
    '/api/subcategories',
    '/api/adminuser/userslist',
    '/api/warehouses/all',
    '/api/promocodes/admin/all',
    '/api/adminproducts/bycategory',
    '/api/admin/photo-orders/list',
    '/api/admin/customer-enquiries',
    '/api/admin/product-requests',
    '/api/sales/all',
    '/api/carts/abandoned/list',
    '/api/rewards/all',
    '/api/buymore/tiers',
    '/api/restrictions/restrictions',
    '/api/cartoffers/offers',
    '/api/adminusers/feedback/list',
    '/api/adminusers/feedback/reward-config',
    '/api/search-analytics/keywords',
    '/api/admin-home-sections/sections',
    '/api/product-unlocks/unlocks',
    '/api/cost-overview/cost-overview',
    '/api/adminorders/live-operations',
    '/api/adminorders/delays',
    '/api/adminorders/eligible-drivers',
    '/api/adminuser/2fa-status',
    '/api/adminuser/referrals/config',
    '/api/adminuser/referrals/audit-history',
    '/api/adminuser/referrals/claims',
    '/api/adminuser/delivery-eta/rules',
    '/api/forms/franchiseEnquiryforms',
    '/api/forms/callbackforms',
    '/api/forms/availabilityforms',
    '/api/adminusers/notifyproducts',
    '/api/adminuser/Settingslist',
    '/api/admintiming',
    '/api/admintiming/shopstatus',
    '/api/adminproducts/allkits',
    '/api/adminproducts/recommendedproducts',
    '/api/membership/plans'
];

async function check(path) {
    return new Promise(resolve => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 5000,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `token ${adminToken}`,
                'Accept': 'application/json'
            },
            timeout: 5000
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ path, status: res.statusCode, data: parsed });
            });
        });
        req.on('error', err => resolve({ path, status: 0, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ path, status: 408, error: 'Timeout' }); });
        req.end();
    });
}

async function run() {
    console.log('Testing all 43 Real Admin Frontend Endpoints...\n');
    let failures = 0;
    for (const ep of endpoints) {
        const res = await check(ep);
        const isHttpFail = res.status !== 200;
        const isAppFail = res.data && (
            res.data.Status === 0 || 
            res.data.status === 0 || 
            (typeof res.data.Message === 'string' && res.data.Message.toLowerCase().includes('error')) ||
            (typeof res.data === 'string' && res.data.toLowerCase().includes('error'))
        );
        if (isHttpFail || isAppFail) {
            failures++;
            console.log(`❌ FAIL [HTTP ${res.status}] ${res.path}`);
            const msg = res.data ? JSON.stringify(res.data).substring(0, 160) : res.error;
            console.log(`   --> ${msg}`);
        } else {
            console.log(`✅ OK   [HTTP 200] ${res.path}`);
        }
    }
    console.log(`\n========================================`);
    console.log(`RESULTS: ${endpoints.length - failures} passed, ${failures} failed out of ${endpoints.length}`);
    console.log(`========================================`);
}

run();
