const http = require('http');
const PricingEngine = require('../server/services/PricingEngine');
const DeliveryOperations = require('../server/controllers/DeliveryOperations');

function httpGet(path) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:5000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
    });
}

async function runTests() {
    console.log("==================================================");
    console.log("CLIKGETT AUDIT TEST SUITE: SEARCH, UNLOCKS & DYNAMIC ETA");
    console.log("==================================================\n");
    let passed = 0;
    let failed = 0;

    function assert(name, condition, details = "") {
        if (condition) {
            console.log(`[PASS] ${name}`);
            if (details) console.log(`       -> ${details}`);
            passed++;
        } else {
            console.error(`[FAIL] ${name}`);
            if (details) console.error(`       -> ${details}`);
            failed++;
        }
    }

    // 1. Search Suggestions API Tests
    console.log("--- 1. SEARCH SUGGESTIONS API TESTS ---");
    try {
        const resEmpty = await httpGet('/api/products/suggestions');
        assert("Suggestions endpoint reachable", resEmpty.status === 200, `Status: ${resEmpty.status}`);
        assert("Suggestions returns valid payload with Suggestions list", Array.isArray(resEmpty.body.Suggestions), `Count: ${resEmpty.body.Suggestions ? resEmpty.body.Suggestions.length : 0}`);

        const resQuery = await httpGet('/api/products/suggestions/c');
        assert("Min 2 chars rule handled (query < 2)", resQuery.status === 200 && Array.isArray(resQuery.body.Suggestions) && resQuery.body.Suggestions.length === 0, "Query < 2 returns empty Suggestions list");

        const resMatch = await httpGet('/api/products/suggestions/ch');
        assert("Query with 2+ chars returns suggestions", resMatch.status === 200, `Result count: ${resMatch.body.Suggestions ? resMatch.body.Suggestions.length : 0}`);
        if (resMatch.body.Suggestions && resMatch.body.Suggestions.length > 0) {
            const first = resMatch.body.Suggestions[0];
            assert("Suggestion structure has ProductName & Category", Boolean(first.ProductName), `Item: ${first.ProductName} (${first.CategoryName || 'General'})`);
            assert("Suggestion has InStock & Pricing info", typeof first.InStock === 'boolean' && typeof first.OfferPrice === 'number', `Price: ₹${first.OfferPrice}, InStock: ${first.InStock}`);
        }
    } catch (e) {
        assert("Search suggestions API online", false, e.message);
    }

    // 2. PricingEngine Unlock Logic Tests (Threshold > ₹1000)
    console.log("\n--- 2. CART VALUE UNLOCK THRESHOLD & PRICING TESTS ---");
    
    // Test Cart 850: Locked, gap = 151
    const cart850 = [{ ProductID: 10, VariantID: 10, Quantity: 1, OfferPrice: 850, Price: 850 }];
    const res850 = await PricingEngine.calculateCart(cart850);
    const unlock850 = (res850.ProductUnlocks || []).find(u => u.ThresholdAmount === 1000);
    assert("Found active ₹1000 threshold unlock rule", Boolean(unlock850), `UnlockID: ${unlock850 ? unlock850.UnlockID : 'N/A'}`);
    if (unlock850) {
        assert("Cart ₹850 is LOCKED", unlock850.IsUnlocked === false, `IsUnlocked: ${unlock850.IsUnlocked}`);
        assert("Cart ₹850 gap calculation is ₹151", unlock850.AmountNeeded === 151, `AmountNeeded: ₹${unlock850.AmountNeeded}`);
    }

    // Test Cart 999: Locked, gap = 2
    const cart999 = [{ ProductID: 10, VariantID: 10, Quantity: 1, OfferPrice: 999, Price: 999 }];
    const res999 = await PricingEngine.calculateCart(cart999);
    const unlock999 = (res999.ProductUnlocks || []).find(u => u.ThresholdAmount === 1000);
    if (unlock999) {
        assert("Cart ₹999 is LOCKED", unlock999.IsUnlocked === false, `IsUnlocked: ${unlock999.IsUnlocked}`);
        assert("Cart ₹999 gap calculation is ₹2", unlock999.AmountNeeded === 2, `AmountNeeded: ₹${unlock999.AmountNeeded}`);
    }

    // Test Cart 1000: Locked (threshold is strictly > 1000), gap = 1
    const cart1000 = [{ ProductID: 10, VariantID: 10, Quantity: 1, OfferPrice: 1000, Price: 1000 }];
    const res1000 = await PricingEngine.calculateCart(cart1000);
    const unlock1000 = (res1000.ProductUnlocks || []).find(u => u.ThresholdAmount === 1000);
    if (unlock1000) {
        assert("Cart ₹1000 is LOCKED (requires > 1000)", unlock1000.IsUnlocked === false, `IsUnlocked: ${unlock1000.IsUnlocked}`);
        assert("Cart ₹1000 gap calculation is ₹1", unlock1000.AmountNeeded === 1, `AmountNeeded: ₹${unlock1000.AmountNeeded}`);
    }

    // Test Cart 1001: UNLOCKED, gap = 0
    const cart1001 = [{ ProductID: 10, VariantID: 10, Quantity: 1, OfferPrice: 1001, Price: 1001 }];
    const res1001 = await PricingEngine.calculateCart(cart1001);
    const unlock1001 = (res1001.ProductUnlocks || []).find(u => u.ThresholdAmount === 1000);
    if (unlock1001) {
        assert("Cart ₹1001 is UNLOCKED", unlock1001.IsUnlocked === true, `IsUnlocked: ${unlock1001.IsUnlocked}`);
        assert("Cart ₹1001 gap calculation is ₹0", unlock1001.AmountNeeded === 0, `AmountNeeded: ₹${unlock1001.AmountNeeded}`);
    }

    // Test Dynamic Unlock Price applied when unlocked vs regular price when locked
    if (unlock1001) {
        const unlockProdId = unlock1001.ProductID;
        const targetUnlockPrice = unlock1001.UnlockPrice; // ₹1

        // When subtotal > 1000, unlock product in cart should receive UnlockPrice
        const cartAbove1000 = [
            { ProductID: 10, VariantID: 10, Quantity: 1, OfferPrice: 1005, Price: 1005 },
            { ProductID: unlockProdId, VariantID: 2, Quantity: 1, OfferPrice: 35.20, Price: 40.00 }
        ];
        const resAbove1000 = await PricingEngine.calculateCart(cartAbove1000);
        const itemAbove = resAbove1000.Items.find(i => i.ProductID == unlockProdId);
        assert("Cart item receives discounted UnlockPrice (₹1) when subtotal > ₹1000", itemAbove && itemAbove.UnitPrice === targetUnlockPrice, `Price: ₹${itemAbove ? itemAbove.UnitPrice : 'N/A'}`);

        // When item removed and cart drops below 1000, unlock item reverts to regular price (> ₹1)
        const cartBelow1000 = [
            { ProductID: 10, VariantID: 10, Quantity: 1, OfferPrice: 500, Price: 500 },
            { ProductID: unlockProdId, VariantID: 2, Quantity: 1, OfferPrice: 35.20, Price: 40.00 }
        ];
        const resBelow1000 = await PricingEngine.calculateCart(cartBelow1000);
        const itemBelow = resBelow1000.Items.find(i => i.ProductID == unlockProdId);
        assert("Cart item reverts to regular non-unlock price (> ₹1) when subtotal <= ₹1000", itemBelow && itemBelow.UnitPrice > targetUnlockPrice, `Price: ₹${itemBelow ? itemBelow.UnitPrice : 'N/A'}`);
    }

    // 3. Dynamic Delivery ETA & Order Size Buffer Tests
    console.log("\n--- 3. DYNAMIC DELIVERY ETA BY TOTAL ITEM QUANTITY TESTS ---");
    // 5 items -> Base 30 min, 0 buffer -> 30 min
    const cartQty5 = [{ ProductID: 10, VariantID: 10, Quantity: 5, OfferPrice: 100, Price: 100 }];
    const resQty5 = await PricingEngine.calculateCart(cartQty5);
    assert("5 items  -> Base 30m, Buffer 0m (Total: 30 min)", resQty5.BaseDeliveryMinutes === 30 && resQty5.AdditionalDeliveryMinutes === 0 && resQty5.TotalDeliveryMinutes === 30, `Total: ${resQty5.TotalDeliveryMinutes}m`);

    // 10 items -> Base 30 min, 0 buffer -> 30 min
    const cartQty10 = [{ ProductID: 10, VariantID: 10, Quantity: 10, OfferPrice: 100, Price: 100 }];
    const resQty10 = await PricingEngine.calculateCart(cartQty10);
    assert("10 items -> Base 30m, Buffer 0m (Total: 30 min)", resQty10.BaseDeliveryMinutes === 30 && resQty10.AdditionalDeliveryMinutes === 0 && resQty10.TotalDeliveryMinutes === 30, `Total: ${resQty10.TotalDeliveryMinutes}m`);

    // 11 items -> Base 30 min, 10 buffer -> 40 min
    const cartQty11 = [{ ProductID: 10, VariantID: 10, Quantity: 11, OfferPrice: 100, Price: 100 }];
    const resQty11 = await PricingEngine.calculateCart(cartQty11);
    assert("11 items -> Base 30m, Buffer 10m (Total: 40 min)", resQty11.BaseDeliveryMinutes === 30 && resQty11.AdditionalDeliveryMinutes === 10 && resQty11.TotalDeliveryMinutes === 40, `Total: ${resQty11.TotalDeliveryMinutes}m`);
    assert("11 items -> Zepto-style buffer notice displayed", Boolean(resQty11.LargeCartNotice), `Notice: "${resQty11.LargeCartNotice}"`);

    // 20 items -> Base 30 min, 10 buffer -> 40 min
    const cartQty20 = [{ ProductID: 10, VariantID: 10, Quantity: 20, OfferPrice: 100, Price: 100 }];
    const resQty20 = await PricingEngine.calculateCart(cartQty20);
    assert("20 items -> Base 30m, Buffer 10m (Total: 40 min)", resQty20.BaseDeliveryMinutes === 30 && resQty20.AdditionalDeliveryMinutes === 10 && resQty20.TotalDeliveryMinutes === 40, `Total: ${resQty20.TotalDeliveryMinutes}m`);

    // 21 items -> Base 30 min, 20 buffer -> 50 min
    const cartQty21 = [{ ProductID: 10, VariantID: 10, Quantity: 21, OfferPrice: 100, Price: 100 }];
    const resQty21 = await PricingEngine.calculateCart(cartQty21);
    assert("21 items -> Base 30m, Buffer 20m (Total: 50 min)", resQty21.BaseDeliveryMinutes === 30 && resQty21.AdditionalDeliveryMinutes === 20 && resQty21.TotalDeliveryMinutes === 50, `Total: ${resQty21.TotalDeliveryMinutes}m`);

    // 35 items -> Base 30 min, 20 buffer -> 50 min
    const cartQty35 = [{ ProductID: 10, VariantID: 10, Quantity: 35, OfferPrice: 100, Price: 100 }];
    const resQty35 = await PricingEngine.calculateCart(cartQty35);
    assert("35 items -> Base 30m, Buffer 20m (Total: 50 min)", resQty35.BaseDeliveryMinutes === 30 && resQty35.AdditionalDeliveryMinutes === 20 && resQty35.TotalDeliveryMinutes === 50, `Total: ${resQty35.TotalDeliveryMinutes}m`);

    // 4. Operational Delay Preservation
    console.log("\n--- 4. OPERATIONAL DELAY PRESERVATION TESTS ---");
    const mockReq = { params: { OrderID: 934 } };
    let mockResult = null;
    const mockResp = {
        status: (code) => ({
            json: (payload) => {
                mockResult = { code, payload };
                return payload;
            }
        })
    };

    try {
        await DeliveryOperations.calculateDynamicETA(mockReq, mockResp);
        assert("calculateDynamicETA executed successfully for Order 934", mockResult && mockResult.code === 200, `Status: ${mockResult ? mockResult.code : 'ERR'}`);
        if (mockResult && mockResult.payload) {
            const p = mockResult.payload;
            assert("Base delivery is authoritative 30 mins", p.BaseDeliveryMinutes === 30, `Base: ${p.BaseDeliveryMinutes}m`);
            assert("Order size buffer field present", typeof p.OrderSizeBufferMinutes === 'number', `Buffer: ${p.OrderSizeBufferMinutes}m`);
            assert("Operational delay field present", typeof p.OperationalDelayMinutes === 'number', `Delay: ${p.OperationalDelayMinutes}m`);
            assert("Total ETA combines Base + Buffer + Delay", p.TotalMinutes === (p.BaseDeliveryMinutes + p.OrderSizeBufferMinutes + p.OperationalDelayMinutes), `Total: ${p.TotalMinutes}m`);
            assert("Authoritative EstimateDateTime is provided", Boolean(p.EstimateDateTime), `ETA DateTime: ${p.EstimateDateTime}`);
        }
    } catch (err) {
        assert("calculateDynamicETA controller test", false, err.message);
    }

    console.log("\n==================================================");
    console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
