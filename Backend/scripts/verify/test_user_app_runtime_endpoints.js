const https = require('https');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(`https://api.clikgett.com/api${path}`);
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    const req = https.request(
      url,
      {
        method,
        headers: reqHeaders,
        timeout: 8000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = data.slice(0, 200);
          }
          resolve({ status: res.statusCode, data: json });
        });
      }
    );

    req.on('error', (err) => resolve({ error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Timeout' });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("=== TESTING USER APP PRODUCTION RUNTIME API ENDPOINTS ===");

  // 1. Settings / Launch
  const settings = await request('GET', '/users/settings');
  console.log("1. /users/settings:", settings.status === 200 ? "PASS" : "FAIL", settings.status);

  // 2. Homepage (Banners, Categories, Sections)
  const home = await request('GET', '/users/homepage');
  console.log("2. /users/homepage:", home.status === 200 ? "PASS" : "FAIL", home.status, 
    `Banners: ${home.data?.Banners?.length || 0}`);

  // 3. Product Details / Variants
  const prodDetail = await request('GET', '/products/detail/1');
  console.log("3. /products/detail/1:", prodDetail.status === 200 ? "PASS" : "FAIL", prodDetail.status);

  // 4. Coupons
  const coupons = await request('GET', '/promocodes/active');
  console.log("4. /promocodes/active:", coupons.status === 200 ? "PASS" : "FAIL", coupons.status);

  // 5. Flash Sales
  const sales = await request('GET', '/sales/getsales');
  console.log("5. /sales/getsales:", sales.status === 200 ? "PASS" : "FAIL", sales.status);

  // 6. Membership Plans
  const membership = await request('GET', '/membership/plans');
  console.log("6. /membership/plans:", membership.status === 200 ? "PASS" : "FAIL", membership.status);

  // 7. Cart Pricing Engine (Cart, Discounts, ETA)
  const cartPricing = await request('POST', '/pricing/calculate-cart', {
    CartItems: [{ ProductID: 1, VariantID: 1, Quantity: 2 }],
    PromoCode: null,
    UserID: 1
  });
  console.log("7. /pricing/calculate-cart:", cartPricing.status === 200 ? "PASS" : "FAIL", cartPricing.status);

  console.log("=== ENDPOINTS TEST COMPLETE ===");
}

runTests();
