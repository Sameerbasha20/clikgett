const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();

const user_jwtExpirySeconds = 31536000;        // mobile apps have no refresh flow
const deliveryboy_jwtExpirySeconds = 31536000;

// Accepts "Authorization: <scheme> <token>" or a bare token. Invoice/PDF links
// opened in a browser or PDF viewer cannot send headers, so routes that opt in
// via allowQueryToken also accept ?token=<jwt>.
const extractToken = (req, allowQueryToken = false) => {
    const header = req.headers['authorization'];
    if (header) {
        const parts = header.trim().split(/\s+/);
        return parts.length > 1 ? parts[1] : parts[0];
    }
    if (allowQueryToken && req.query && typeof req.query.token === 'string') {
        return req.query.token;
    }
    return null;
};

const verifyToken = (Token) => new Promise((resolve, reject) => {
    jwt.verify(Token, process.env.SECRET_KEY, (err, decoded) => (err ? reject(err) : resolve(decoded)));
});

const query = (sql, params) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
});

const tokenErrorResponse = (resp, err) => {
    if (err && err.name === 'TokenExpiredError') {
        return resp.status(401).json({ "Status": 0, "Message": "Token expired" });
    }
    return resp.status(401).json({ "Status": 0, "Message": "Invalid Token" });
};

const userAuth = (allowQueryToken) => async (req, resp, next) => {
    const Token = extractToken(req, allowQueryToken);
    if (!Token) {
        return resp.status(401).json({ "Status": 0, "Message": "Token empty" });
    }
    let decoded;
    try {
        decoded = await verifyToken(Token);
    } catch (err) {
        return tokenErrorResponse(resp, err);
    }
    try {
        const results = await query(
            "select UserID, MobileNumber, WalletAmount from Users where UserID = ?",
            [decoded.UserID]
        );
        if (!results.length) {
            return resp.status(401).json({ "Status": 0, "Message": "unauthorized user" });
        }
        req.UserID = results[0].UserID;
        req.MobileNumber = results[0].MobileNumber;
        req.WalletAmount = results[0].WalletAmount;
        next();
    } catch (err) {
        console.log("error in retrieving user for access token: ", err.message);
        return resp.status(401).json({ "Status": 0, "Message": "unauthorized user" });
    }
};

const adminAuth = (allowQueryToken) => async (req, resp, next) => {
    const Token = extractToken(req, allowQueryToken);
    if (!Token) {
        return resp.status(401).json({ "Status": 0, "Message": "Token empty" });
    }
    let decoded;
    try {
        decoded = await verifyToken(Token);
    } catch (err) {
        return tokenErrorResponse(resp, err);
    }
    if (decoded && decoded.is2FAPending) {
        return resp.status(401).json({ "Status": 0, "Message": "Two-factor authentication pending. Complete 2FA before accessing protected resources." });
    }
    if (!decoded || !decoded.AdminID) {
        return resp.status(401).json({ "Status": 0, "Message": "Unauthorized: Admin privileges required" });
    }
    try {
        const results = await query("select AdminID from AdminUsers where Role=1 and AdminID = ?", [decoded.AdminID]);
        if (!results.length) {
            return resp.status(401).json({ "Status": 0, "Message": "unauthorized admin user" });
        }
        req.AdminID = results[0].AdminID;
        next();
    } catch (err) {
        console.log("error in retrieving admin for access token: ", err.message);
        return resp.status(401).json({ "Status": 0, "Message": "unauthorized admin user" });
    }
};

const authenticate = {
    userAuthenticate: userAuth(false),
    userAuthenticateAllowQueryToken: userAuth(true),

    optionalUserAuthenticate: async (req, resp, next) => {
        req.UserID = null;
        const Token = extractToken(req);
        if (!Token) return next();
        try {
            const decoded = await verifyToken(Token);
            req.UserID = decoded.UserID || null;
            req.MobileNumber = decoded.MobileNumber;
        } catch (e) {
            req.UserID = null;
        }
        next();
    },

    generateUserAuthToken: (req, resp) => {
        try {
            const Token = jwt.sign({ "UserID": req.userData.UserID }, process.env.SECRET_KEY, {
                algorithm: "HS256",
                expiresIn: user_jwtExpirySeconds
            });
            return resp.status(200).json({ "Status": 1, "userData": req.userData, "token": Token, "UserID": req.userData.UserID });
        }
        catch (err) {
            console.log("error generating user token", err.message);
            return resp.status(500).json({ "Status": 0, "Message": "Unable to generate token" });
        }
    },

    adminAuthenticate: adminAuth(false),
    adminAuthenticateAllowQueryToken: adminAuth(true),

    // Accepts either an admin token or a user token that owns :OrderID.
    // Used for invoice downloads, which both the admin panel and the user app open as links.
    invoiceAuthenticate: async (req, resp, next) => {
        const Token = extractToken(req, true);
        if (!Token) {
            return resp.status(401).json({ "Status": 0, "Message": "Token empty" });
        }
        let decoded;
        try {
            decoded = await verifyToken(Token);
        } catch (err) {
            return tokenErrorResponse(resp, err);
        }
        try {
            if (decoded.AdminID && !decoded.is2FAPending) {
                const admins = await query("select AdminID from AdminUsers where Role=1 and AdminID = ?", [decoded.AdminID]);
                if (admins.length) {
                    req.AdminID = admins[0].AdminID;
                    return next();
                }
            }
            if (decoded.UserID) {
                const orders = await query("select OrderID from Orders where OrderID = ? and UserID = ?", [req.params.OrderID, decoded.UserID]);
                if (orders.length) {
                    req.UserID = decoded.UserID;
                    return next();
                }
            }
            return resp.status(403).json({ "Status": 0, "Message": "Not allowed to access this invoice" });
        } catch (err) {
            console.log("error authorizing invoice access: ", err.message);
            return resp.status(401).json({ "Status": 0, "Message": "unauthorized" });
        }
    },

    // For scheduled jobs (abandoned-cart, win-back). Allows an admin token, or
    // the CRON_SECRET header for an external scheduler.
    cronOrAdminAuthenticate: (req, resp, next) => {
        const secret = process.env.CRON_SECRET;
        const provided = req.headers['x-cron-secret'];
        if (secret && provided && provided === secret) {
            return next();
        }
        return adminAuth(false)(req, resp, next);
    },

    generateadminUserAuthToken: (req, resp) => {
        try {
            const Token = jwt.sign({ "AdminID": req.userData.AdminID }, process.env.SECRET_KEY, {
                algorithm: "HS256",
                expiresIn: 7200
            });
            return resp.status(200).json({ "Status": 1, "userDetails": req.userData, "Message": "Admin Login successful", "token": Token });
        }
        catch (err) {
            console.log("error generating admin token", err.message);
            return resp.status(500).json({ "Status": 0, "Message": "Unable to generate token" });
        }
    },

    deliveryboyAuthenticate: async (req, resp, next) => {
        const Token = extractToken(req);
        if (!Token) {
            return resp.status(401).json({ "Status": 0, "Message": "Token empty" });
        }
        let decoded;
        try {
            decoded = await verifyToken(Token);
        } catch (err) {
            return tokenErrorResponse(resp, err);
        }
        try {
            const results = await query("select AdminID from AdminUsers where Role=2 and AdminID = ?", [decoded.AdminID]);
            if (!results.length) {
                return resp.status(401).json({ "Status": 0, "Message": "unauthorized admin user" });
            }
            req.AdminID = results[0].AdminID;
            next();
        } catch (err) {
            console.log("error in retrieving delivery boy for access token: ", err.message);
            return resp.status(401).json({ "Status": 0, "Message": "unauthorized admin user" });
        }
    },

    generatedeliveryboyAuthToken: (req, resp) => {
        try {
            const Token = jwt.sign({ "AdminID": req.userData.AdminID, "Role": req.userData.Role }, process.env.SECRET_KEY, {
                algorithm: "HS256",
                expiresIn: deliveryboy_jwtExpirySeconds
            });
            return resp.status(200).json({ "Status": 1, "userDetails": req.userData, "Message": "Admin Login successful", "token": Token });
        }
        catch (err) {
            console.log("error generating delivery boy token", err.message);
            return resp.status(500).json({ "Status": 0, "Message": "Unable to generate token" });
        }
    },
};

module.exports = { authenticate };
