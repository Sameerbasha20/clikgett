const jwt = require('jsonwebtoken');
const pool = require('./db');
const requestContext = require('./requestContext');
require('dotenv').config();

const user_jwtExpirySeconds = 31536000;        // mobile apps have no refresh flow
const deliveryboy_jwtExpirySeconds = 31536000;

// Accepts "Authorization: <scheme> <token>" or a bare token. Login tokens are only
// ever read from the header: in a URL they would end up in server and proxy logs,
// browser history and anything the link is shared with. Links that open in a
// browser (invoices) use a short-lived invoice key instead (see invoiceLink).
const extractToken = (req) => {
    const header = req.headers['authorization'];
    if (!header) return null;
    const parts = header.trim().split(/\s+/);
    return parts.length > 1 ? parts[1] : parts[0];
};

const verifyToken = (Token) => new Promise((resolve, reject) => {
    jwt.verify(Token, process.env.SECRET_KEY, (err, decoded) => (err ? reject(err) : resolve(decoded)));
});

// Invoice keys: one order, 5 minutes, signed with a different secret so a key can
// never be used as a login token (and a login token never works as a key).
const INVOICE_KEY_SECONDS = 300;
const invoiceKeySecret = () => `${process.env.SECRET_KEY}:invoice-link`;

const query = (sql, params) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
});

const tokenErrorResponse = (resp, err) => {
    if (err && err.name === 'TokenExpiredError') {
        return resp.status(401).json({ "Status": 0, "Message": "Token expired" });
    }
    return resp.status(401).json({ "Status": 0, "Message": "Invalid Token" });
};

const userAuth = () => async (req, resp, next) => {
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
        const results = await query(
            "select UserID, MobileNumber, WalletAmount from Users where UserID = ? and IFNULL(Status, 1) <> 2",
            [decoded.UserID]
        );
        if (!results.length) {
            return resp.status(401).json({ "Status": 0, "Message": "unauthorized user" });
        }
        req.UserID = results[0].UserID;
        requestContext.setUserId(req.UserID);
        req.MobileNumber = results[0].MobileNumber;
        req.WalletAmount = results[0].WalletAmount;
        next();
    } catch (err) {
        console.log("error in retrieving user for access token: ", err.message);
        return resp.status(401).json({ "Status": 0, "Message": "unauthorized user" });
    }
};

const adminAuth = () => async (req, resp, next) => {
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
    userAuthenticate: userAuth(),

    optionalUserAuthenticate: async (req, resp, next) => {
        req.UserID = null;
        const Token = extractToken(req);
        if (!Token) return next();
        try {
            const decoded = await verifyToken(Token);
            req.UserID = decoded.UserID || null;
            requestContext.setUserId(req.UserID);
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

    adminAuthenticate: adminAuth(),

    // Invoice PDF access: a login token in the header (admin, or the customer who
    // owns :OrderID), or ?key= from invoiceLink for links opened in a browser.
    invoiceAuthenticate: async (req, resp, next) => {
        // Never cached or passed on as a referrer: the PDF holds personal details.
        resp.setHeader('Cache-Control', 'no-store');
        resp.setHeader('Referrer-Policy', 'no-referrer');
        const key = req.query && typeof req.query.key === 'string' ? req.query.key : null;
        const Token = extractToken(req);
        if (!Token && key) {
            try {
                const k = jwt.verify(key, invoiceKeySecret(), { algorithms: ['HS256'] });
                if (k.scope === 'invoice' && String(k.inv) === String(req.params.OrderID)) {
                    req.InvoiceKey = true;
                    return next();
                }
            } catch (err) {
                return resp.status(401).json({ "Status": 0, "Message": "This invoice link has expired. Open the invoice again from the app." });
            }
            return resp.status(403).json({ "Status": 0, "Message": "Not allowed to access this invoice" });
        }
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

    // After invoiceAuthenticate with a login token: a 5-minute link for one invoice,
    // for opening it in a browser. A key cannot be used to create another key.
    invoiceLink: (req, resp) => {
        if (req.InvoiceKey) {
            return resp.status(401).json({ "Status": 0, "Message": "Sign in to get an invoice link" });
        }
        const key = jwt.sign({ scope: 'invoice', inv: Number(req.params.OrderID) }, invoiceKeySecret(), {
            algorithm: 'HS256',
            expiresIn: INVOICE_KEY_SECONDS
        });
        return resp.json({
            "Status": 1,
            "Path": `${req.baseUrl}/invoice/${encodeURIComponent(req.params.OrderID)}?key=${key}`,
            "ExpiresInSeconds": INVOICE_KEY_SECONDS
        });
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
