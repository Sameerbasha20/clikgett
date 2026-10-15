const assert = require('assert');
const PricingEngine = require('../server/services/PricingEngine');

async function testFruitTimerBackend() {
    console.log("=== TESTING BACKEND FRUIT TIMER ETA BUFFER ===");

    // Case 1: Non-fruit cart (ProductID 10 is Tea/Coffee, CategoryID 1)
    const nonFruitCart = [
        { ProductID: 10, VariantID: 10, Quantity: 2, OfferPrice: 100, Price: 100 }
    ];
    const resNonFruit = await PricingEngine.calculateCart(nonFruitCart);
    console.log("Non-fruit cart ETA:", resNonFruit.TotalDeliveryMinutes, "Buffer:", resNonFruit.AdditionalDeliveryMinutes);
    assert.strictEqual(resNonFruit.AdditionalDeliveryMinutes, 0, "Non-fruit cart should have 0 buffer");
    assert.strictEqual(resNonFruit.TotalDeliveryMinutes, 30, "Non-fruit cart total ETA should be 30m");

    // Case 2: Fruit cart (ProductID 870 is Banana, CategoryID 24, SubCategoryID 84 'All Fruits')
    const fruitCart = [
        { ProductID: 870, VariantID: 870, Quantity: 1, OfferPrice: 60, Price: 60 }
    ];
    const resFruit = await PricingEngine.calculateCart(fruitCart);
    console.log("Fruit cart ETA:", resFruit.TotalDeliveryMinutes, "Buffer:", resFruit.AdditionalDeliveryMinutes);
    assert.strictEqual(resFruit.AdditionalDeliveryMinutes, 10, "Fruit cart should have +10m buffer");
    assert.strictEqual(resFruit.TotalDeliveryMinutes, 40, "Fruit cart total ETA should be 40m (30 + 10)");

    // Case 3: Mixed cart (Non-fruit + Fruit)
    const mixedCart = [
        { ProductID: 10, VariantID: 10, Quantity: 2, OfferPrice: 100, Price: 100 },
        { ProductID: 872, VariantID: 872, Quantity: 1, OfferPrice: 120, Price: 120 } // Apples (SubCategoryID 84)
    ];
    const resMixed = await PricingEngine.calculateCart(mixedCart);
    console.log("Mixed cart ETA:", resMixed.TotalDeliveryMinutes, "Buffer:", resMixed.AdditionalDeliveryMinutes);
    assert.strictEqual(resMixed.AdditionalDeliveryMinutes, 10, "Mixed cart should have +10m buffer for fruit");
    assert.strictEqual(resMixed.TotalDeliveryMinutes, 40, "Mixed cart total ETA should be 40m");

    // Case 4: Non-fruit Vegetables (ProductID 1050 Tomatoes, CategoryID 24, SubCategoryID 87 'Vegetables')
    const vegCart = [
        { ProductID: 1050, VariantID: 1050, Quantity: 2, OfferPrice: 40, Price: 40 }
    ];
    const resVeg = await PricingEngine.calculateCart(vegCart);
    console.log("Vegetable cart ETA:", resVeg.TotalDeliveryMinutes, "Buffer:", resVeg.AdditionalDeliveryMinutes);
    assert.strictEqual(resVeg.AdditionalDeliveryMinutes, 0, "Vegetables (SubCat 87) should NOT receive fruit buffer");
    assert.strictEqual(resVeg.TotalDeliveryMinutes, 30, "Vegetable cart total ETA should be 30m");

    console.log("✓ ALL BACKEND FRUIT TIMER TESTS PASSED!");
    process.exit(0);
}

testFruitTimerBackend().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
