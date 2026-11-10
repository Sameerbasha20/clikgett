const express = require('express');
const util = require('../utils/utils');
const c = require('../controllers/RiderApplications');

// Rider app sign-up (no login yet).
const signup = express.Router()
    .post('/sendotp', c.sendOtp)
    .post('/apply', c.apply);

// Admin review (riders permission).
const admin = express.Router()
    .get('/', util.authenticate.adminAuthenticate, c.list)
    .get('/:id/document/:doc', util.authenticate.adminAuthenticate, c.document)
    .post('/:id/approve', util.authenticate.adminAuthenticate, c.approve)
    .post('/:id/reject', util.authenticate.adminAuthenticate, c.reject);

module.exports = { signup, admin };
