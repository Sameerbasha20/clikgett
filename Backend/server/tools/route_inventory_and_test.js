'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');

// Dynamically import all routers exactly as server.js mounts them
const mounts = [
    { prefix: '/api/users', file: '../routes/Users' },
    { prefix: '/api/categories', file: '../routes/Categories' },
    { prefix: '/api/products', file: '../routes/Products' },
    { prefix: '/api/carts', file: '../routes/Carts' },
    { prefix: '/api/adminuser', file: '../routes/AdminUsers' },
    { prefix: '/api/banners', file: '../routes/Banners' },
    { prefix: '/api/subcategories', file: '../routes/SubCategories' },
    { prefix: '/api/adminproducts', file: '../routes/AdminProducts' },
    { prefix: '/api/promocodes', file: '../routes/PromoCodes' },
    { prefix: '/api/address', file: '../routes/Address' },
    { prefix: '/api/orders', file: '../routes/Orders' },
    { prefix: '/api/adminorders', file: '../routes/AdminOrders' },
    { prefix: '/api/deliveryboy', file: '../routes/DeliveryBoy' },
    { prefix: '/api/routes', file: '../routes/Routes' },
    { prefix: '/api/productcsv', file: '../routes/Productcsv' },
    { prefix: '/api/admintiming', file: '../routes/AdminTiming' },
    { prefix: '/api/warehouses', file: '../routes/Warehouses' },
    { prefix: '/api/forms', file: '../routes/Forms' },
    { prefix: '/api/sales', file: '../routes/Sales' },
    { prefix: '/api/rewards', file: '../routes/Rewards' },
    { prefix: '/api/buymore', file: '../routes/BuyMore' },
    { prefix: '/api/restrictions', file: '../routes/ProductRestrictions' },
    { prefix: '/api/cartoffers', file: '../routes/CartOffers' },
    { prefix: '/api/membership', file: '../routes/Membership' },
    { prefix: '/api/cost-overview', file: '../routes/AdminCostOverview' },
    { prefix: '/api/product-unlocks', file: '../routes/ProductUnlocks' },
    { prefix: '/api/home-sections', file: '../routes/AdminHomeSections' },
    { prefix: '/api/search-analytics', file: '../routes/SearchAnalytics' },
    { prefix: '/api/cashback-admin', file: '../routes/CashbackAdmin' },
    { prefix: '/api/photo-orders', file: '../routes/PhotoOrders' },
    { prefix: '/api/admin/photo-orders', file: '../routes/AdminPhotoOrders' },
    { prefix: '/api/customer', file: '../routes/CustomerRequests' },
    { prefix: '/api/admin', file: '../routes/AdminCustomerRequests' },
    { prefix: '/health', file: '../routes/Health' },
    { prefix: '/api/health', file: '../routes/Health' }
];

function extractRoutes() {
    const allRoutes = [];
    const seen = new Set();

    for (const m of mounts) {
        try {
            const routerPath = path.resolve(__dirname, m.file);
            const router = require(routerPath);

            if (router && router.stack) {
                for (const layer of router.stack) {
                    if (layer.route) {
                        const route = layer.route;
                        const subPath = route.path === '/' ? '' : route.path;
                        const fullPath = m.prefix + subPath;
                        const methods = Object.keys(route.methods).map(method => method.toUpperCase());

                        // Detect auth middleware
                        let auth = 'None';
                        const stackNames = layer.route.stack.map(s => s.name || '');
                        if (stackNames.some(n => n.includes('deliveryboyAuthenticate'))) {
                            auth = 'DeliveryBoy JWT';
                        } else if (stackNames.some(n => n.includes('adminAuthenticate'))) {
                            auth = 'Admin JWT';
                        } else if (stackNames.some(n => n.includes('authenticate'))) {
                            auth = 'Customer JWT';
                        }

                        for (const method of methods) {
                            const key = `${method} ${fullPath}`;
                            if (!seen.has(key)) {
                                seen.add(key);
                                allRoutes.push({
                                    method,
                                    path: fullPath,
                                    auth,
                                    module: path.basename(m.file)
                                });
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Failed loading ${m.file}:`, err.message);
        }
    }

    return allRoutes;
}

// HTTP request helper
function sendRequest(method, endpoint, headers = {}, body = null) {
    return new Promise((resolve) => {
        const urlObj = new URL(`http://localhost:5000${endpoint}`);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
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
                resolve({ status: res.statusCode, headers: res.headers, data: parsed });
            });
        });

        req.on('error', (err) => {
            resolve({ status: 0, error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ status: 0, error: 'TIMEOUT' });
        });

        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runInventoryAndTests() {
    console.log('========================================================================');
    console.log('📊 CLIKGETT COMPLETE REGISTERED API INVENTORY & AUTOMATED TEST RUNNER');
    console.log('========================================================================');

    const routes = extractRoutes();
    console.log(`\nDiscovered ${routes.length} distinct registered HTTP route/method combinations across ${mounts.length} modules.\n`);

    // Generate valid test JWTs using authoritative SECRET_KEY and real test records
    const secret = process.env.SECRET_KEY;
    const customerToken = jwt.sign({ UserID: 1000523 }, secret, { expiresIn: '1h' });
    const driverToken = jwt.sign({ AdminID: 16 }, secret, { expiresIn: '1h' });
    const adminToken = jwt.sign({ AdminID: 1 }, secret, { expiresIn: '1h' });

    let passedCount = 0;
    let failedCount = 0;

    const testResults = [];

    // Selected key representative endpoints covering all modules & auth classes
    const testCases = [
        // Health
        { method: 'GET', path: '/health', auth: 'None', expectStatus: 200, category: 'System Health' },
        { method: 'GET', path: '/api/health', auth: 'None', expectStatus: 200, category: 'System Health' },
        { method: 'GET', path: '/api/health/db', auth: 'None', expectStatus: 200, category: 'System Health' },

        // Categories & Products (Authenticated Customer Endpoints)
        { method: 'GET', path: '/api/categories/allcategoriesuser', auth: 'Customer JWT', token: customerToken, expectStatus: 200, category: 'Catalog - Categories' },
        { method: 'GET', path: '/api/categories/subcategories_by_category/3', auth: 'Customer JWT', token: customerToken, expectStatus: 200, category: 'Catalog - Subcategories' },
        { method: 'GET', path: '/api/products/list', auth: 'Customer JWT', token: customerToken, expectStatus: 200, category: 'Catalog - Products' },
        { method: 'GET', path: '/api/products/search/Ghee', auth: 'Customer JWT', token: customerToken, expectStatus: 200, category: 'Search' },
        { method: 'GET', path: '/api/products/suggestions', auth: 'Optional JWT', expectStatus: 200, category: 'Search Suggestions' },

        // Auth Guards (Unauthenticated rejection)
        { method: 'POST', path: '/api/orders/createorder', auth: 'Customer JWT', expectStatus: 401, category: 'Auth Security Guard - Customer' },
        { method: 'PUT', path: '/api/deliveryboy/duty-status', auth: 'DeliveryBoy JWT', expectStatus: 401, category: 'Auth Security Guard - Driver' },
        { method: 'GET', path: '/api/adminorders/live-operations', auth: 'Admin JWT', expectStatus: 401, category: 'Auth Security Guard - Admin' },
        { method: 'GET', path: '/api/photo-orders/my-requests', auth: 'Customer JWT', expectStatus: 401, category: 'Auth Security Guard - Photo Orders' },
        { method: 'GET', path: '/api/customer/enquiries/my', auth: 'Customer JWT', expectStatus: 401, category: 'Auth Security Guard - Enquiries' },

        // Serviceability & Geofence
        { method: 'POST', path: '/api/address/check-serviceability', auth: 'Customer JWT', token: customerToken, body: { Latitude: 15.8391, Longitude: 78.0397 }, expectStatus: 200, category: 'Serviceability Valid', validateData: d => d.IsServiceable === true },
        { method: 'POST', path: '/api/address/check-serviceability', auth: 'Customer JWT', token: customerToken, body: { Latitude: 18.5, Longitude: 79.5 }, expectStatus: 200, category: 'Serviceability Unserviceable', validateData: d => d.IsServiceable === false },
        { method: 'POST', path: '/api/address/check-serviceability', auth: 'Customer JWT', token: customerToken, body: { Latitude: 'invalid' }, expectStatus: 400, category: 'Serviceability Validation' },

        // Delivery Operations
        { method: 'PUT', path: '/api/deliveryboy/duty-status', auth: 'DeliveryBoy JWT', token: driverToken, body: { DutyStatus: 'ONLINE' }, expectStatus: 200, category: 'Delivery Partner Operations' },
        { method: 'PUT', path: '/api/deliveryboy/duty-status', auth: 'DeliveryBoy JWT', token: driverToken, body: { DutyStatus: 'INVALID_STATUS' }, expectStatus: 400, category: 'Delivery Partner Validation' },
        { method: 'POST', path: '/api/deliveryboy/location/ping', auth: 'DeliveryBoy JWT', token: driverToken, body: { latitude: 15.8281, longitude: 78.0373, batteryLevel: 85 }, expectStatus: 200, category: 'Driver Telematics' },

        // Admin Operations
        { method: 'GET', path: '/api/adminorders/live-operations', auth: 'Admin JWT', token: adminToken, expectStatus: 200, category: 'Admin Live Operations' },
        { method: 'GET', path: '/api/adminorders/delays', auth: 'Admin JWT', token: adminToken, expectStatus: 200, category: 'Admin Delay Review Queue' },
        { method: 'GET', path: '/api/adminorders/eligible-drivers', auth: 'Admin JWT', token: adminToken, expectStatus: 200, category: 'Admin Driver Dispatch' },

        // Photo Orders & Enquiries
        { method: 'GET', path: '/api/photo-orders/my-requests', auth: 'Customer JWT', token: customerToken, expectStatus: 200, category: 'Photo Orders' },
        { method: 'GET', path: '/api/customer/enquiries/my', auth: 'Customer JWT', token: customerToken, expectStatus: 200, category: 'Customer Enquiries' },
        { method: 'GET', path: '/api/customer/product-requests/my', auth: 'Customer JWT', token: customerToken, expectStatus: 200, category: 'Product Requests' },

        // Banners & Public Settings
        { method: 'GET', path: '/api/banners', auth: 'Admin JWT', token: adminToken, expectStatus: 200, category: 'Banners Admin' },
        { method: 'GET', path: '/api/users/homepage', auth: 'None', expectStatus: 200, category: 'Customer Home Sections' }
    ];

    console.log('Testing representative endpoint paths across auth tiers, validation and business logic:\n');

    for (const tc of testCases) {
        const headers = {};
        if (tc.token) {
            headers['Authorization'] = `Bearer ${tc.token}`;
        }

        const res = await sendRequest(tc.method, tc.path, headers, tc.body);
        let pass = (res.status === tc.expectStatus);

        if (pass && tc.validateData) {
            try {
                pass = tc.validateData(res.data);
            } catch (e) {
                pass = false;
            }
        }

        const statusTag = pass ? '✅ PASS' : '❌ FAIL';
        if (pass) passedCount++; else failedCount++;

        testResults.push({
            ...tc,
            actualStatus: res.status,
            passed: pass,
            responseSnippet: JSON.stringify(res.data).substring(0, 80)
        });

        console.log(`  ${statusTag} [${tc.method}] ${tc.path.padEnd(42)} Expected: ${tc.expectStatus} | Actual: ${res.status} | Category: ${tc.category}`);
    }

    console.log('\n========================================================================');
    console.log(`TOTAL REGISTERED ENDPOINTS DISCOVERED: ${routes.length}`);
    console.log(`AUTOMATED TEST RUNS: ${testCases.length} (${passedCount} PASSED, ${failedCount} FAILED)`);
    console.log('========================================================================\n');

    // Save full JSON inventory artifact
    const inventoryOutput = {
        totalEndpoints: routes.length,
        timestamp: new Date().toISOString(),
        testedCount: testCases.length,
        passedCount,
        failedCount,
        routes: routes,
        tests: testResults
    };

    fs.writeFileSync(path.resolve(__dirname, 'api_inventory_result.json'), JSON.stringify(inventoryOutput, null, 2));
    console.log('Complete API inventory saved to: Backend/server/tools/api_inventory_result.json');
}

runInventoryAndTests().catch(err => {
    console.error('Fatal error running API inventory:', err);
});
