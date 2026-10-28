// Session renewal for the customer and rider apps (utils/authTokens.js).
const express = require('express');
const router = express.Router();
const authTokens = require('../utils/authTokens');

router
    .post('/refresh', authTokens.refresh)
    .post('/logout', authTokens.logout);

module.exports = router;
