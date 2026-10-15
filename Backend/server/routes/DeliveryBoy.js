const deliveryboycontroller = require("../controllers/DeliveryBoy");
const deliveryOperations = require("../controllers/DeliveryOperations");
const express = require('express'); 
const router = express.Router();
const util = require("../utils/utils");

router
    // Existing authentication & login
    .post('/sendotp', deliveryboycontroller.SendotpLogin)
    .post('/login', deliveryboycontroller.deliveryboylogin, util.authenticate.generatedeliveryboyAuthToken)

    // Existing routes & orders
    .get('/getroutes', util.authenticate.deliveryboyAuthenticate, deliveryboycontroller.get_routes)
    .get('/ordersbyroute', util.authenticate.deliveryboyAuthenticate, deliveryboycontroller.ordersbyroute)
    .get('/orderdetail', util.authenticate.deliveryboyAuthenticate, deliveryboycontroller.myorder)
    .get('/orderstatus', util.authenticate.deliveryboyAuthenticate, deliveryboycontroller.orderstatus)

    // Order status progression & updates (now hardened with geofencing & transition validation)
    .put('/updatestatus/:OrderID', util.authenticate.deliveryboyAuthenticate, deliveryboycontroller.updatestatus)
    .put('/update/:AdminID', util.authenticate.deliveryboyAuthenticate, deliveryboycontroller.updatedeliveryboy)

    // OTP confirmation (now parameterized against SQL injection)
    .post('/sendotp_order', util.authenticate.deliveryboyAuthenticate, deliveryboycontroller.Sendotp_Orders)
    .post('/verifyotp_order', util.authenticate.deliveryboyAuthenticate, deliveryboycontroller.Orders_VerifyOTP)
    .post('/deliver/:OrderID', util.authenticate.deliveryboyAuthenticate, deliveryboycontroller.deliverOrder)
    .post('/fcmtoken', util.authenticate.deliveryboyAuthenticate, deliveryboycontroller.updateFcmToken)

    // --- Modern Quick-Commerce Delivery Operations Extensions ---
    // Phase 1: Duty & Shift Management (ONLINE / OFFLINE / ON_BREAK)
    .put('/duty-status', util.authenticate.deliveryboyAuthenticate, deliveryOperations.updateDutyStatus)
    .get('/duty-status', util.authenticate.deliveryboyAuthenticate, deliveryOperations.getDutyStatus)

    // Phase 2: Live Location Ingestion & Telematics
    .post('/location/ping', util.authenticate.deliveryboyAuthenticate, deliveryOperations.recordLocationPing)

    // Phase 7: Delay Reporting (Weather, Traffic, Vehicle, Restaurant)
    .post('/orders/report-delay', util.authenticate.deliveryboyAuthenticate, deliveryOperations.reportDelay)

    // Phase 13: Emergency & Issue Reporting (Breakdown, Customer Unreachable)
    .post('/orders/report-issue', util.authenticate.deliveryboyAuthenticate, deliveryOperations.reportIssue);

module.exports = router;
