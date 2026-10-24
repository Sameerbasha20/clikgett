'use strict';

// Hosting dashboards (e.g. Render's "Add from .env") can keep quotes around values;
// strip one matching pair so TRUST_PROXY='1', DB_SSL="true" etc. mean what they say.
for (const [key, value] of Object.entries(process.env)) {
    const quoted = /^(['"])([\s\S]*)\1$/.exec(value);
    if (quoted) process.env[key] = quoted[2];
}

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
const customerAccountRouter = require('./routes/CustomerAccount');
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
const Productcsvrouter = require('./routes/Productcsv');
const AdminTimingRouter = require('./routes/AdminTiming');
const salesRouter = require('./routes/Sales');
const rewardsRouter = require('./routes/Rewards');
const buyMoreRouter = require('./routes/BuyMore');
const restrictionsRouter = require('./routes/ProductRestrictions');
const cartOffersRouter = require('./routes/CartOffers');
const membershipRouter = require('./routes/Membership');
const productUnlocksRouter = require('./routes/ProductUnlocks');
const homeSectionsRouter = require('./routes/AdminHomeSections');
const searchAnalyticsRouter = require('./routes/SearchAnalytics');
const cashbackAdminRouter = require('./routes/CashbackAdmin');
const healthRouter = require('./routes/Health');
const photoOrdersRouter = require('./routes/PhotoOrders');
const adminPhotoOrdersRouter = require('./routes/AdminPhotoOrders');
const customerRequestsRouter = require('./routes/CustomerRequests');
const adminCustomerRequestsRouter = require('./routes/AdminCustomerRequests');

// Behind nginx / a load balancer set TRUST_PROXY=1 so rate limits see each client's
// own IP instead of the proxy's.
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
}

// The apps send no Origin header and the admin is served from the same origin, so in
// production only origins listed in CORS_ORIGINS (comma-separated) may call the API
// from a browser. Development allows any origin.
const corsOrigins = String(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
    origin: (origin, callback) => callback(null,
        !origin || process.env.NODE_ENV !== 'production' || corsOrigins.includes(origin))
}));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    next();
});
app.disable('x-powered-by');

app.use(require('./utils/requestContext').middleware);

// Files from the MinIO bucket, served at /media; JSON responses carry this server's own
// /media address (utils/media.js).
const media = require('./utils/media');
const storage = require('./utils/s3');
app.use(media.rewriteResponses);
app.get('/media/*', media.serve(storage));
app.put('/media/*', media.receive(storage));

// Login and code endpoints get tight per-IP limits on top of the per-number limits in
// services/LoginOtp.js; everything else a generous one. Phones on one Wi-Fi share an IP.
const rateLimit = require('express-rate-limit');
const limiter = (windowMinutes, max, message) => rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { Status: 0, status: 0, Message: message }
});
const adminPrefixes = ['/api/adminuser', '/api/adminusers', '/api/admin'];
app.use([
    '/api/users/login/sendotp', '/api/users/signup/sendotp', '/api/deliveryboy/sendotp',
    ...adminPrefixes.map((p) => `${p}/send-2fa-sms`)
], limiter(10, 20, 'Too many code requests from this network. Please try again in a few minutes.'));
app.use([
    '/api/users/login/verifyotp', '/api/deliveryboy/login',
    ...adminPrefixes.flatMap((p) => [`${p}/login`, `${p}/verify-2fa`])
], limiter(10, 40, 'Too many login attempts from this network. Please try again in a few minutes.'));
app.use('/api', limiter(1, parseInt(process.env.API_RATE_LIMIT_PER_MINUTE, 10) || 600,
    'Too many requests. Please slow down.'));

// Razorpay signs the exact raw body, so this route must come before the JSON parsers.
const PaymentRecovery = require('./services/PaymentRecovery');
app.post('/api/payments/razorpay-webhook', express.raw({ type: 'application/json', limit: '1mb' }), PaymentRecovery.webhook);

app.use(morgan('dev'));

const PORT = process.env.PORT || '5000';

try {
    app.use(parser.urlencoded({ extended: true }));
    // Photo orders and product requests send one base64 image (a phone photo) in JSON.
    app.use(parser.json({ limit: "15mb" }));
    app.use(express.json({ limit: "2mb" }));
    app.use(parser.json());
    
    app.use('/api/users', userRouter);
    app.use('/api/account', customerAccountRouter);
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
    app.use('/api/productcsv', Productcsvrouter);
    app.use('/api/csv', Productcsvrouter);
    app.use('/api/admintiming', AdminTimingRouter);
    app.use('/api/sales', salesRouter);
    app.use('/api/rewards', rewardsRouter);
    app.use('/api/milestones', rewardsRouter);
    app.use('/api/buymore', buyMoreRouter);
    app.use('/api/restrictions', restrictionsRouter);
    app.use('/api/cartoffers', cartOffersRouter);
    app.use('/api/membership', membershipRouter);
    app.use('/api/membershipplans', membershipRouter);
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

    const httpServer = app.listen(PORT, () => {
        console.log('==================================================');
        console.log('ClikGett Backend Started');
        console.log(`Port:       ${PORT}`);
        console.log(`Health:     http://localhost:${PORT}/health`);
        console.log(`API Health: http://localhost:${PORT}/api/health`);
        console.log(`DB Health:  http://localhost:${PORT}/api/health/db`);
        console.log('==================================================');
        PaymentRecovery.start();
    });
    // Phones reuse idle connections; Node's default 5 s idle timeout closes them
    // just as the app sends the next request ("Connection closed before full header").
    httpServer.keepAliveTimeout = 65000;
    httpServer.headersTimeout = 66000;
}
catch (e) {
    console.log(e, 'error');
}
