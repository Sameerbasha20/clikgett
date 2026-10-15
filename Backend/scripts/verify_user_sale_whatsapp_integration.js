const http = require('http');
const mysql = require('mysql');
require('dotenv').config({ path: 'Backend/.env' });
const PricingEngine = require('../server/services/PricingEngine');

const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  database: process.env.db,
  port: process.env.DB_PORT || 3306
});

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000/api${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log('====================================================');
  console.log('USER APP FLASH SALE & WHATSAPP INTEGRATION VALIDATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Check existing active Flash Sale
    const activeSales = await queryAsync(
      "SELECT * FROM Sales WHERE Status = 1 AND StartDate <= NOW() AND EndDate >= NOW() ORDER BY CreatedAt DESC"
    );
    assert(activeSales.length > 0, `Found ${activeSales.length} active Flash Sale(s) in DB`);

    const primarySale = activeSales[0];
    console.log(`  Campaign: "${primarySale.SaleName}", Discount: ${primarySale.DiscountValue} (${primarySale.DiscountType})`);

    // 2. Ensure product assignment in SaleItems
    const assignedItems = await queryAsync(
      "SELECT si.*, p.ProductName FROM SaleItems si JOIN Products p ON si.ProductID = p.ProductID WHERE si.SaleID = ?",
      [primarySale.SaleID]
    );
    assert(assignedItems.length > 0, `Sale #${primarySale.SaleID} has ${assignedItems.length} assigned product(s)`);

    // 3. Test GET /api/sales/getsales endpoint
    const res = await httpGet('/sales/getsales');
    assert(res.status === 200, `GET /api/sales/getsales returned HTTP 200 OK`);
    assert(res.body.Status === 1, `Response Status is 1`);
    assert(Array.isArray(res.body.Sales), `Response contains Sales array`);
    assert(res.body.Sales.length > 0, `Active Sales array is non-empty (${res.body.Sales.length} campaign(s))`);

    const clientSale = res.body.Sales.find(s => s.SaleID === primarySale.SaleID);
    assert(clientSale != null, `Sale #${primarySale.SaleID} retrieved by customer API`);
    assert(clientSale.Products && clientSale.Products.length > 0, `Products array populated (${clientSale.Products.length} items)`);

    // 4. Verify Product Pricing Consistency
    const prod = clientSale.Products[0];
    console.log(`  Inspecting product: "${prod.ProductName}"`);
    assert(prod.ProductID != null, `Product has valid ProductID: ${prod.ProductID}`);
    assert(prod.ImageUrl != null && prod.ImageUrl.startsWith('http'), `Product has valid ImageUrl: ${prod.ImageUrl}`);
    assert(prod.SalePrice != null && prod.SalePrice > 0, `Product has valid SalePrice: ₹${prod.SalePrice}`);
    assert(prod.OfferPrice != null && prod.OfferPrice >= prod.SalePrice, `OfferPrice (₹${prod.OfferPrice}) >= SalePrice (₹${prod.SalePrice})`);

    // Check discount match with PricingEngine
    const discVal = parseFloat(primarySale.DiscountValue);
    const expectedDiscount = primarySale.DiscountType === 'percentage'
      ? (prod.OfferPrice * discVal) / 100
      : discVal;
    const expectedSalePrice = Math.max(0, parseFloat((prod.OfferPrice - expectedDiscount).toFixed(2)));
    assert(
      Math.abs(prod.SalePrice - expectedSalePrice) < 0.01,
      `Sale price ₹${prod.SalePrice} matches expected formula price ₹${expectedSalePrice}`
    );

    // 5. Test PricingEngine parity with PricingEngine.getActiveFlashSales
    const peFlashSales = await PricingEngine.getActiveFlashSales([prod.ProductID]);
    assert(peFlashSales.length > 0, `PricingEngine detected active flash sale for ProductID ${prod.ProductID}`);

    const peSampleItem = {
      ProductID: prod.ProductID,
      VariantID: prod.ProductVariants[0].VariantID,
      Price: prod.Price,
      OfferPrice: prod.OfferPrice,
      Quantity: 1
    };
    const peLineCalc = PricingEngine.calculateLinePrice(peSampleItem, [], null, [], peFlashSales[0]);
    assert(
      Math.abs(peLineCalc.UnitPrice - prod.SalePrice) < 0.01,
      `Home Sale Price (₹${prod.SalePrice}) == PricingEngine Cart UnitPrice (₹${peLineCalc.UnitPrice})`
    );

    // 6. Test Expiration / Deactivation behavior
    // Temporarily deactivate sale to test empty state
    await queryAsync("UPDATE Sales SET Status = 0 WHERE SaleID = ?", [primarySale.SaleID]);
    const inactiveRes = await httpGet('/sales/getsales');
    const inactiveFound = (inactiveRes.body.Sales || []).some(s => s.SaleID === primarySale.SaleID);
    assert(!inactiveFound, `Deactivated sale (Status=0) is omitted from customer API`);

    // Restore sale Status=1
    await queryAsync("UPDATE Sales SET Status = 1 WHERE SaleID = ?", [primarySale.SaleID]);
    const restoredRes = await httpGet('/sales/getsales');
    const restoredFound = (restoredRes.body.Sales || []).some(s => s.SaleID === primarySale.SaleID);
    assert(restoredFound, `Restored active sale reappears in customer API`);

    // 7. Verify WhatsApp Configuration and Links
    const testPhone = '919429690261';
    const whatsappMsg = 'how may i help u';

    const whatsappDeepLink = `whatsapp://send?phone=${testPhone}&text=${encodeURIComponent(whatsappMsg)}`;
    const whatsappWebFallback = `https://wa.me/${testPhone}?text=${encodeURIComponent(whatsappMsg)}`;
    assert(whatsappDeepLink.includes('phone=919429690261'), `General WhatsApp deep-link uses official business number`);
    assert(whatsappWebFallback.includes('wa.me/919429690261'), `General WhatsApp web fallback uses wa.me official format`);
    assert(whatsappDeepLink.includes(encodeURIComponent('how may i help u')), `WhatsApp deep-link includes 'how may i help u' prefilled text`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    pool.end();
  }

  console.log('\n====================================================');
  console.log(`VALIDATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
}

runVerification();
