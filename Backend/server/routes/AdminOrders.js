const adminordercontroller = require("../controllers/AdminOrders");
const deliveryOperations = require("../controllers/DeliveryOperations");
const adminDashboard = require("../controllers/AdminDashboard");
const express = require('express'); 
const router = express.Router();
const util = require("../utils/utils");
const validate = require('../utils/validations');

router
    .get('/dashboard', util.authenticate.adminAuthenticate, adminDashboard.summary)
    .get('/new-since', util.authenticate.adminAuthenticate, adminDashboard.newSince)
    .get('/currentorders', util.authenticate.adminAuthenticate, adminordercontroller.currentorders)
    .get('/pastorders', util.authenticate.adminAuthenticate, adminordercontroller.pastorders)
    .get('/orderdetail', util.authenticate.adminAuthenticate, adminordercontroller.myorder)
    .get('/invoice/:OrderID', util.authenticate.invoiceAuthenticate, adminordercontroller.downloadInvoice)

    .get('/eligible-drivers', util.authenticate.adminAuthenticate, deliveryOperations.getEligibleDrivers)
    .put('/assigndeliverboy/:OrderID', util.authenticate.adminAuthenticate, deliveryOperations.assignDeliveryBoy)
    .put('/updatestatus/:OrderID', util.authenticate.adminAuthenticate, adminordercontroller.updatestatus)
    .put('/editedeliverytime/:OrderID', util.authenticate.adminAuthenticate, adminordercontroller.editedeliverytime)
    .put('/adjustorder', util.authenticate.adminAuthenticate, adminordercontroller.adjustorder)
    .post('/adjustorder', util.authenticate.adminAuthenticate, adminordercontroller.adjustorder)
    .put('/adjustorder/:OrderID', util.authenticate.adminAuthenticate, adminordercontroller.adjustorder)
    .post('/remove-item', util.authenticate.adminAuthenticate, adminordercontroller.removeItemFromOrder)
    .delete('/orders/:OrderID/items/:OrderItemID', util.authenticate.adminAuthenticate, adminordercontroller.removeItemFromOrder)
    .get('/removed-items/:OrderID', util.authenticate.adminAuthenticate, adminordercontroller.getRemovedItems)
    .get('/adjustments/:OrderID', util.authenticate.adminAuthenticate, adminordercontroller.getorderadjustments)
    .get('/adjustorder/:OrderID', util.authenticate.adminAuthenticate, adminordercontroller.getorderadjustments)
    .get('/scheduledorders', util.authenticate.adminAuthenticate, adminordercontroller.scheduledorders)
    .get('/orderdetail/timeline/:OrderID', util.authenticate.adminAuthenticate, adminordercontroller.ordertimeline)
    .get('/ordertimeline/:OrderID', util.authenticate.adminAuthenticate, adminordercontroller.ordertimeline)
    .get('/pastorders/sort', util.authenticate.adminAuthenticate, adminordercontroller.pastorderssort)
    .get('/pastorderssort', util.authenticate.adminAuthenticate, adminordercontroller.pastorderssort)
    .get('/pastorders/filter', util.authenticate.adminAuthenticate, adminordercontroller.pastordersfilter)
    .get('/pastordersfilter', util.authenticate.adminAuthenticate, adminordercontroller.pastordersfilter)
    .get('/pastorders/mobilefilter', util.authenticate.adminAuthenticate, adminordercontroller.pastordersmobilefilter)
    .get('/pastordersmobilefilter', util.authenticate.adminAuthenticate, adminordercontroller.pastordersmobilefilter)
    .get('/pastorders/usernamefilter', util.authenticate.adminAuthenticate, adminordercontroller.pastordersusernamefilter)
    .get('/pastordersusernamefilter', util.authenticate.adminAuthenticate, adminordercontroller.pastordersusernamefilter)
    .get('/pastorders/orderidfilter', util.authenticate.adminAuthenticate, adminordercontroller.pastordersorderidfilter)
    .get('/pastordersorderidfilter', util.authenticate.adminAuthenticate, adminordercontroller.pastordersorderidfilter)
    .get('/currentorders/sort', util.authenticate.adminAuthenticate, adminordercontroller.currentorderssort)
    .get('/currentorderssort', util.authenticate.adminAuthenticate, adminordercontroller.currentorderssort)

    // --- Live Delivery Operations & Fleet Extensions ---
    .get('/live-operations', util.authenticate.adminAuthenticate, deliveryOperations.getLiveOperations)
    .get('/delays', util.authenticate.adminAuthenticate, deliveryOperations.getDelayQueue)
    .post('/delays/:DelayID/review', util.authenticate.adminAuthenticate, deliveryOperations.reviewDelay)
    .put('/reassign/:OrderID', util.authenticate.adminAuthenticate, deliveryOperations.reassignDriver)
    .get('/dynamic-eta/:OrderID', util.authenticate.adminAuthenticate, deliveryOperations.calculateDynamicETA);

module.exports = router;
