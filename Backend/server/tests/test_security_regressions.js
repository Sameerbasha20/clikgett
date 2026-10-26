// Security regression checks against a running backend (local Docker DB only).
//
//   npm run test:security                       # http://127.0.0.1:5000/api
//   API_URL=http://127.0.0.1:5001/api npm run test:security
//
// Uses SECRET_KEY from Backend/.env to mint short-lived test tokens. Read-only:
// every request either is rejected or only reads data.
require('dotenv').config();
const jwt = require('jsonwebtoken');

const BASE = (process.env.API_URL || 'http://127.0.0.1:5000/api').replace(/\/$/, '');
const sign = (payload) => jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: 300 });
const admin = sign({ AdminID: Number(process.env.TEST_ADMIN_ID || 1) });
const user = sign({ UserID: Number(process.env.TEST_USER_ID || 1) });
const pending2fa = sign({ AdminID: 1, is2FAPending: true });

const request = async (method, path, { auth, body, headers = {} } = {}) => {
    const h = { 'content-type': 'application/json', ...headers };
    if (auth) h.authorization = auth;
    const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    let json = null;
    try { json = await r.json(); } catch (e) { /* non-JSON */ }
    return { status: r.status, json };
};

const checks = [
    // Product search used to put the text into SQL with only quotes escaped.
    {
        name: "search text cannot break out of the SQL string (a\\' OR 1=1 --)",
        run: () => request('GET', `/products/search/${encodeURIComponent("a\\' OR 1=1 -- ")}`),
        expect: (r) => r.status === 200 && Array.isArray(r.json && r.json.Products) && r.json.Products.length === 0,
    },
    // Admin/data endpoints that used to be open must now require an admin token.
    ...[
        ['POST', '/adminuser/sendnotifications'],
        ['GET', '/adminuser/settingslist'],
        ['DELETE', '/adminuser/deletesettings/1'],
        ['GET', '/adminuser/wallettransactions/1'],
        ['GET', '/adminorders/dashboard'],
        ['GET', '/adminorders/new-since?after=0'],
        ['GET', '/csv/orderdetails'],
        ['POST', '/membership/plans/save'],
        ['PUT', '/productcsv/update/x.csv'],
        ['GET', '/users/datatransfer'],
        ['GET', '/users/updateproducts'],
        ['POST', '/adminuser/upload-url'],
        ['GET', '/carts/abandoned/trigger-notifications'],
        ['GET', '/promocodes/winback/trigger'],
    ].map(([m, p]) => ({ name: `${m} ${p} without token -> 401`, run: () => request(m, p), expect: (r) => r.status === 401 })),
    {
        name: 'user token cannot use admin endpoints',
        run: () => request('GET', '/adminuser/settingslist', { auth: `bearer ${user}` }),
        expect: (r) => r.status === 401,
    },
    {
        name: 'admin token with 2FA pending is rejected',
        run: () => request('GET', '/adminuser/settingslist', { auth: `token ${pending2fa}` }),
        expect: (r) => r.status === 401,
    },
    {
        name: 'wrong cron secret is rejected',
        run: () => request('GET', '/promocodes/winback/trigger', { headers: { 'x-cron-secret': 'wrong' } }),
        expect: (r) => r.status === 401,
    },
    {
        name: 'invoice without token -> 401',
        run: () => request('GET', '/orders/invoice/1'),
        expect: (r) => r.status === 401,
    },
    {
        name: 'invoice of another user -> 403',
        run: () => request('GET', `/orders/invoice/999999999?token=${user}`),
        expect: (r) => r.status === 403,
    },
    {
        name: 'signup requires a user token',
        run: () => request('POST', '/users/signup', { body: { UserID: 1, FirstName: 'x' } }),
        expect: (r) => r.status === 401,
    },
    {
        name: 'OTP login rejects SQL injection',
        run: () => request('POST', '/users/login/verifyotp', { body: { MobileNumber: "x' OR '1'='1", OTP: "x' OR '1'='1" } }),
        expect: (r) => !(r.json && r.json.token),
    },
    {
        name: 'delivery boy login rejects SQL injection',
        run: () => request('POST', '/deliveryboy/login', { body: { MobileNumber: "x' OR '1'='1", OTP: "x' OR '1'='1" } }),
        expect: (r) => !(r.json && r.json.token),
    },
    {
        name: 'search treats quotes/backslashes as text',
        run: () => request('GET', '/products/suggestions?q=' + encodeURIComponent("\\' OR 1=1 -- ")),
        expect: (r) => r.status === 200 && r.json && Array.isArray(r.json.Suggestions) && r.json.Suggestions.length === 0,
    },
    {
        name: 'cannot cancel an order the user does not own',
        run: () => request('PUT', '/orders/cancelorderuser/999999999', { auth: `bearer ${user}`, body: {} }),
        expect: (r) => r.json && r.json.Status === 0,
    },
    {
        name: 'upload-url rejects unknown folders',
        run: () => request('POST', '/adminuser/upload-url', { auth: `token ${admin}`, body: { folder: '../x', fileName: 'a.png', contentType: 'image/png' } }),
        expect: (r) => r.status === 400,
    },
    {
        name: 'admin token works on protected endpoint',
        run: () => request('GET', '/adminuser/settingslist', { auth: `token ${admin}` }),
        expect: (r) => r.status === 200,
    },
];

(async () => {
    let failed = 0;
    for (const c of checks) {
        let ok = false, detail = '';
        try {
            const r = await c.run();
            ok = c.expect(r);
            detail = `status ${r.status}`;
        } catch (e) {
            detail = e.message;
        }
        if (!ok) failed++;
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}  (${detail})`);
    }
    console.log(`\n${checks.length - failed}/${checks.length} passed against ${BASE}`);
    process.exit(failed ? 1 : 0);
})();
