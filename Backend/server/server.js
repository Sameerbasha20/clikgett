'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const parser = require('body-parser');
const app = express();
require('dotenv').config();

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception thrown:', err);
    // Controlled graceful termination to prevent corrupted server state
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

const userRouter = require('./routes/Users');
const categoryRouter = require('./routes/Categories');
const productRouter = require('./routes/Products');
const cartRouter = require('./routes/Carts');
const adminRouter = require('./routes/AdminUsers');
const bannerRouter = require('./routes/Banners');
const subcategoryRouter = require('./routes/SubCategories');
const adminproductRouter = require('./routes/AdminProducts');
const Promocoderouter = require('./routes/PromoCodes');
const Addressrouter = require('./routes/Address');
const Ordersrouter = require('./routes/Orders');
const AdminOrdersrouter = require('./routes/AdminOrders');
const deliveryboyrouter = require('./routes/DeliveryBoy');
const routesrouter = require('./routes/Routes');
const Productcsvrouter = require('./routes/Productcsv');
const AdminTimingRouter = require('./routes/AdminTiming');
const warehousesRouter = require('./routes/Warehouses');
const formsRouter = require('./routes/Forms');
const salesRouter = require('./routes/Sales');
const rewardsRouter = require('./routes/Rewards');
const buyMoreRouter = require('./routes/BuyMore');
const restrictionsRouter = require('./routes/ProductRestrictions');
const cartOffersRouter = require('./routes/CartOffers');
const membershipRouter = require('./routes/Membership');
const costOverviewRouter = require('./routes/AdminCostOverview');
const productUnlocksRouter = require('./routes/ProductUnlocks');
const homeSectionsRouter = require('./routes/AdminHomeSections');
const searchAnalyticsRouter = require('./routes/SearchAnalytics');
const cashbackAdminRouter = require('./routes/CashbackAdmin');
const healthRouter = require('./routes/Health');
const photoOrdersRouter = require('./routes/PhotoOrders');
const adminPhotoOrdersRouter = require('./routes/AdminPhotoOrders');
const customerRequestsRouter = require('./routes/CustomerRequests');
const adminCustomerRequestsRouter = require('./routes/AdminCustomerRequests');

app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || '5000';

try {
    app.use(parser.urlencoded({ extended: true }));
    app.use(parser.json({ limit: "50mb" }));
    app.use(express.json({ limit: "2mb" }));
    app.use(parser.json());
    
    app.use('/api/users', userRouter);
    app.use('/api/categories', categoryRouter);
    app.use('/api/products', productRouter);
    app.use('/api/carts', cartRouter);
    app.use('/api/adminuser', adminRouter);
    app.use('/api/adminusers', adminRouter);
    app.use('/api/banners', bannerRouter);
    app.use('/api/subcategories', subcategoryRouter);
    app.use('/api/adminproducts', adminproductRouter);
    app.use('/api/promocodes', Promocoderouter);    
    app.use('/api/address', Addressrouter);
    app.use('/api/orders', Ordersrouter);
    app.use('/api/adminorders', AdminOrdersrouter);
    app.use('/api/deliveryboy', deliveryboyrouter);
    app.use('/api/routes', routesrouter);
    app.use('/api/productcsv', Productcsvrouter);
    app.use('/api/csv', Productcsvrouter);
    app.use('/api/admintiming', AdminTimingRouter);
    app.use('/api/warehouses', warehousesRouter);
    app.use('/api/forms', formsRouter);
    app.use('/api/sales', salesRouter);
    app.use('/api/rewards', rewardsRouter);
    app.use('/api/milestones', rewardsRouter);
    app.use('/api/buymore', buyMoreRouter);
    app.use('/api/restrictions', restrictionsRouter);
    app.use('/api/cartoffers', cartOffersRouter);
    app.use('/api/membership', membershipRouter);
    app.use('/api/membershipplans', membershipRouter);
    app.use('/api/cost-overview', costOverviewRouter);
    app.use('/api/product-unlocks', productUnlocksRouter);
    app.use('/api/home-sections', homeSectionsRouter);
    app.use('/api/admin-home-sections', homeSectionsRouter);
    app.use('/api/search-analytics', searchAnalyticsRouter);
    app.use('/api/cashback-admin', cashbackAdminRouter);
    app.use('/api/cashback', cashbackAdminRouter);
    app.use('/api/admin/delivery', AdminOrdersrouter);
    app.use('/api/photo-orders', photoOrdersRouter);
    app.use('/api/admin/photo-orders', adminPhotoOrdersRouter);
    app.use('/api/customer', customerRequestsRouter);
    app.use('/api/admin', adminCustomerRequestsRouter);
    app.use('/api/admin', adminRouter);

    // ── Health check endpoints (no auth required) ──────────────────────────
    // Mounted at both /health and /api/health so both paths work.
    app.use('/health', healthRouter);
    app.use('/api/health', healthRouter);

    app.listen(PORT, () => {
        console.log('==================================================');
        console.log('ClikGett Backend Started');
        console.log(`Port:       ${PORT}`);
        console.log(`Health:     http://localhost:${PORT}/health`);
        console.log(`API Health: http://localhost:${PORT}/api/health`);
        console.log(`DB Health:  http://localhost:${PORT}/api/health/db`);
        console.log('==================================================');
    });
}
catch (e) {
    console.log(e, 'error');
}
