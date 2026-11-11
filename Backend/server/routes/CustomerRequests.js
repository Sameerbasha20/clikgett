'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/CustomerRequests');
const util = require('../utils/utils');

// Customer Enquiries
router
    .post('/enquiries', util.authenticate.userAuthenticate, controller.submitEnquiry)
    .get('/enquiries/my', util.authenticate.userAuthenticate, controller.getMyEnquiries)

// Customer Product Requests (Unavailable products with optional photo)
    .post('/product-requests', util.authenticate.userAuthenticate, controller.submitProductRequest)
    .get('/product-requests/my', util.authenticate.userAuthenticate, controller.getMyProductRequests);

module.exports = router;
