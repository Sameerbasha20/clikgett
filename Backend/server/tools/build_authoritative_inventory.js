'use strict';

const fs = require('fs');
const path = require('path');

// All router mounts configured in server.js
const canonicalMounts = [
    { prefix: '/api/users', file: '../routes/Users', moduleName: 'Users.js' },
    { prefix: '/api/categories', file: '../routes/Categories', moduleName: 'Categories.js' },
    { prefix: '/api/products', file: '../routes/Products', moduleName: 'Products.js' },
    { prefix: '/api/carts', file: '../routes/Carts', moduleName: 'Carts.js' },
    { prefix: '/api/adminuser', file: '../routes/AdminUsers', moduleName: 'AdminUsers.js' },
    { prefix: '/api/banners', file: '../routes/Banners', moduleName: 'Banners.js' },
    { prefix: '/api/subcategories', file: '../routes/SubCategories', moduleName: 'SubCategories.js' },
    { prefix: '/api/adminproducts', file: '../routes/AdminProducts', moduleName: 'AdminProducts.js' },
    { prefix: '/api/promocodes', file: '../routes/PromoCodes', moduleName: 'PromoCodes.js' },
    { prefix: '/api/address', file: '../routes/Address', moduleName: 'Address.js' },
    { prefix: '/api/orders', file: '../routes/Orders', moduleName: 'Orders.js' },
    { prefix: '/api/adminorders', file: '../routes/AdminOrders', moduleName: 'AdminOrders.js' },
    { prefix: '/api/deliveryboy', file: '../routes/DeliveryBoy', moduleName: 'DeliveryBoy.js' },
    { prefix: '/api/routes', file: '../routes/Routes', moduleName: 'Routes.js' },
    { prefix: '/api/productcsv', file: '../routes/Productcsv', moduleName: 'Productcsv.js' },
    { prefix: '/api/admintiming', file: '../routes/AdminTiming', moduleName: 'AdminTiming.js' },
    { prefix: '/api/warehouses', file: '../routes/Warehouses', moduleName: 'Warehouses.js' },
    { prefix: '/api/forms', file: '../routes/Forms', moduleName: 'Forms.js' },
    { prefix: '/api/sales', file: '../routes/Sales', moduleName: 'Sales.js' },
    { prefix: '/api/rewards', file: '../routes/Rewards', moduleName: 'Rewards.js' },
    { prefix: '/api/buymore', file: '../routes/BuyMore', moduleName: 'BuyMore.js' },
    { prefix: '/api/restrictions', file: '../routes/ProductRestrictions', moduleName: 'ProductRestrictions.js' },
    { prefix: '/api/cartoffers', file: '../routes/CartOffers', moduleName: 'CartOffers.js' },
    { prefix: '/api/membership', file: '../routes/Membership', moduleName: 'Membership.js' },
    { prefix: '/api/cost-overview', file: '../routes/AdminCostOverview', moduleName: 'AdminCostOverview.js' },
    { prefix: '/api/product-unlocks', file: '../routes/ProductUnlocks', moduleName: 'ProductUnlocks.js' },
    { prefix: '/api/home-sections', file: '../routes/AdminHomeSections', moduleName: 'AdminHomeSections.js' },
    { prefix: '/api/search-analytics', file: '../routes/SearchAnalytics', moduleName: 'SearchAnalytics.js' },
    { prefix: '/api/cashback-admin', file: '../routes/CashbackAdmin', moduleName: 'CashbackAdmin.js' },
    { prefix: '/api/photo-orders', file: '../routes/PhotoOrders', moduleName: 'PhotoOrders.js' },
    { prefix: '/api/admin/photo-orders', file: '../routes/AdminPhotoOrders', moduleName: 'AdminPhotoOrders.js' },
    { prefix: '/api/customer', file: '../routes/CustomerRequests', moduleName: 'CustomerRequests.js' },
    { prefix: '/api/admin', file: '../routes/AdminCustomerRequests', moduleName: 'AdminCustomerRequests.js' },
    { prefix: '/health', file: '../routes/Health', moduleName: 'Health.js' },
    { prefix: '/api/health', file: '../routes/Health', moduleName: 'Health.js' }
];

// Alias mounts present in server.js
const aliasMounts = [
    { prefix: '/api/adminusers', file: '../routes/AdminUsers', moduleName: 'AdminUsers.js' },
    { prefix: '/api/csv', file: '../routes/Productcsv', moduleName: 'Productcsv.js' },
    { prefix: '/api/milestones', file: '../routes/Rewards', moduleName: 'Rewards.js' },
    { prefix: '/api/membershipplans', file: '../routes/Membership', moduleName: 'Membership.js' },
    { prefix: '/api/admin-home-sections', file: '../routes/AdminHomeSections', moduleName: 'AdminHomeSections.js' },
    { prefix: '/api/cashback', file: '../routes/CashbackAdmin', moduleName: 'CashbackAdmin.js' },
    { prefix: '/api/admin/delivery', file: '../routes/AdminOrders', moduleName: 'AdminOrders.js' },
    { prefix: '/api/admin', file: '../routes/AdminUsers', moduleName: 'AdminUsers.js' }
];

// Helper to deduce DB tables from module name and path
function inferTables(moduleName, fullPath) {
    const p = fullPath.toLowerCase();
    const tables = [];
    if (p.includes('user') || moduleName.includes('Users')) tables.push('Users');
    if (p.includes('admin') || moduleName.includes('Admin')) tables.push('AdminUsers');
    if (p.includes('category') || moduleName.includes('Categories')) tables.push('Categories');
    if (p.includes('subcategory') || moduleName.includes('SubCategories')) tables.push('SubCategories');
    if (p.includes('product') || moduleName.includes('Products')) tables.push('Products', 'ProductVariants');
    if (p.includes('cart') || moduleName.includes('Cart')) tables.push('Carts', 'CartItems');
    if (p.includes('order') || moduleName.includes('Orders')) tables.push('Orders', 'OrderItems');
    if (p.includes('delivery') || moduleName.includes('Delivery')) tables.push('DeliveryBoyShiftLogs', 'DriverLocationPings');
    if (p.includes('address') || moduleName.includes('Address')) tables.push('UserAddresses', 'AdminShopToggleSettings');
    if (p.includes('banner') || moduleName.includes('Banner')) tables.push('Banners');
    if (p.includes('promocode') || moduleName.includes('Promo')) tables.push('PromoCodes');
    if (p.includes('route') || moduleName.includes('Routes')) tables.push('Routes');
    if (p.includes('photo-order') || moduleName.includes('PhotoOrder')) tables.push('PhotoOrderRequests');
    if (p.includes('enquir') || moduleName.includes('CustomerRequest')) tables.push('CustomerEnquiries', 'CustomerProductRequests');
    if (p.includes('reward') || moduleName.includes('Reward')) tables.push('UserRewards', 'RewardMilestones');
    if (p.includes('buymore') || moduleName.includes('BuyMore')) tables.push('BuyMoreOffers');
    if (p.includes('membership') || moduleName.includes('Membership')) tables.push('MembershipPlans', 'UserMemberships');
    if (p.includes('cashback') || moduleName.includes('Cashback')) tables.push('CashbackRules', 'UserCashbackLogs');
    if (p.includes('warehouse') || moduleName.includes('Warehouse')) tables.push('Warehouses');
    return Array.from(new Set(tables));
}

// Helper to deduce frontends consuming this endpoint
function inferFrontends(moduleName, fullPath, auth) {
    const p = fullPath.toLowerCase();
    let customerApp = false;
    let deliveryApp = false;
    let adminWeb = false;

    // Delivery boy paths
    if (p.includes('/deliveryboy') || auth === 'DeliveryBoy JWT') {
        deliveryApp = true;
    }

    // Admin paths
    if (p.includes('/admin') || auth === 'Admin JWT' || moduleName.startsWith('Admin') || p.includes('/cost-overview') || p.includes('/search-analytics')) {
        adminWeb = true;
    }

    // Customer app paths
    if (
        p.includes('/users') ||
        p.includes('/categories') ||
        p.includes('/products') ||
        p.includes('/carts') ||
        p.includes('/address') ||
        p.includes('/orders') ||
        p.includes('/photo-orders') ||
        p.includes('/customer') ||
        p.includes('/buymore') ||
        p.includes('/cartoffers') ||
        p.includes('/rewards') ||
        p.includes('/membership') ||
        auth === 'Customer JWT'
    ) {
        if (!p.includes('/admin')) {
            customerApp = true;
        }
    }

    // Health
    if (p.includes('/health')) {
        adminWeb = true;
        customerApp = true;
    }

    return { customerApp, deliveryApp, adminWeb };
}

function buildInventory() {
    const endpoints = [];
    const seen = new Set();
    let epCounter = 1;

    for (const m of canonicalMounts) {
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
                        let role = 'Public';
                        const stackNames = layer.route.stack.map(s => (s.name || (s.handle && s.handle.name) || '').toLowerCase());
                        if (stackNames.some(n => n.includes('deliveryboy'))) {
                            auth = 'DeliveryBoy JWT';
                            role = 'Delivery Driver (Role=2)';
                        } else if (stackNames.some(n => n.includes('admin') && n.includes('auth'))) {
                            auth = 'Admin JWT';
                            role = 'Admin (Role=1)';
                        } else if (stackNames.some(n => n.includes('userauthenticate') || (n.includes('auth') && !n.includes('token') && !n.includes('optional')))) {
                            auth = 'Customer JWT';
                            role = 'Customer User';
                        } else if (stackNames.some(n => n.includes('optional'))) {
                            auth = 'Optional JWT';
                            role = 'Public / Customer Optional';
                        }

                        // Handlers
                        const handlerNames = layer.route.stack.map(s => s.name || 'anonymous').filter(n => !n.includes('Authenticate') && n !== '<anonymous>');
                        const handler = handlerNames.join(', ') || 'handler';

                        // Request parameters
                        const pathParams = (fullPath.match(/:[a-zA-Z0-9_]+/g) || []).map(p => p.slice(1));

                        for (const method of methods) {
                            const key = `${method} ${fullPath}`;
                            if (!seen.has(key)) {
                                seen.add(key);

                                const epId = `EP_${String(epCounter).padStart(3, '0')}`;
                                epCounter++;

                                const frontends = inferFrontends(m.moduleName, fullPath, auth);
                                const tables = inferTables(m.moduleName, fullPath);

                                endpoints.push({
                                    endpointId: epId,
                                    method: method,
                                    fullPath: fullPath,
                                    mountPrefix: m.prefix,
                                    subPath: subPath || '/',
                                    routerFile: m.moduleName,
                                    handler: handler,
                                    auth: auth,
                                    roleOrPermission: role,
                                    pathParams: pathParams,
                                    requiredHeaders: auth !== 'None' ? ['Authorization: Bearer <JWT>'] : ['Content-Type: application/json'],
                                    expectedSuccessStatus: method === 'POST' && fullPath.includes('/add') ? 201 : 200,
                                    databaseTables: tables,
                                    sourceFiles: [
                                        `Backend/server/routes/${m.moduleName}`
                                    ],
                                    frontendConsumption: frontends,
                                    testStrategy: {
                                        isStateChanging: ['POST', 'PUT', 'DELETE'].includes(method),
                                        isDestructive: method === 'DELETE' || fullPath.includes('/truncate') || fullPath.includes('/reset'),
                                        requiresAuth: auth !== 'None',
                                        authTier: auth
                                    }
                                });
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Error loading router ${m.file}:`, err.message);
        }
    }

    return {
        totalEndpoints: endpoints.length,
        endpoints
    };
}

const inventory = buildInventory();

console.log(`Generated Authoritative Inventory: ${inventory.totalEndpoints} endpoints.`);

// Save JSON inventory
const jsonPath = path.resolve(__dirname, 'api_inventory_result.json');
fs.writeFileSync(jsonPath, JSON.stringify(inventory, null, 2));
console.log(`Saved JSON inventory to: ${jsonPath}`);

// Generate readable Markdown inventory CLIKGETT_ENDPOINT_AUDIT.md
let md = `# CLIKGETT AUTHORITATIVE ENDPOINT INVENTORY & AUDIT CATALOG

**Total Registered Endpoints:** ${inventory.totalEndpoints}  
**Canonical Routers:** 34 router modules mounted across 35 canonical prefix paths  
**Generated At:** ${new Date().toISOString()}  

---

## 1. Inventory Summary by Module

| Router Module | Mount Prefix | Endpoints | Default Auth |
| :--- | :--- | :--- | :--- |
`;

const modStats = {};
for (const ep of inventory.endpoints) {
    const key = `${ep.routerFile} (${ep.mountPrefix})`;
    if (!modStats[key]) {
        modStats[key] = { count: 0, file: ep.routerFile, prefix: ep.mountPrefix, auth: ep.auth };
    }
    modStats[key].count++;
}

for (const stat of Object.values(modStats)) {
    md += `| \`${stat.file}\` | \`${stat.prefix}\` | ${stat.count} | ${stat.auth} |\n`;
}

md += `\n---

## 2. Exhaustive Endpoint Catalog (${inventory.totalEndpoints} Endpoints)

| ID | Method | Path | Router | Auth | Frontend Consumers | DB Tables |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

for (const ep of inventory.endpoints) {
    const cons = [];
    if (ep.frontendConsumption.customerApp) cons.push('Customer App');
    if (ep.frontendConsumption.deliveryApp) cons.push('Delivery App');
    if (ep.frontendConsumption.adminWeb) cons.push('Admin Web');
    const consStr = cons.join(', ') || 'Internal / Service';
    const tablesStr = ep.databaseTables.join(', ') || 'N/A';

    md += `| **${ep.endpointId}** | \`${ep.method}\` | \`${ep.fullPath}\` | \`${ep.routerFile}\` | ${ep.auth} | ${consStr} | ${tablesStr} |\n`;
}

const auditMdPath = path.resolve(__dirname, '../../../CLIKGETT_ENDPOINT_AUDIT.md');
fs.writeFileSync(auditMdPath, md);
console.log(`Saved Markdown catalog to: ${auditMdPath}`);

process.exit(0);
