const pool = require('../utils/db');
const BuyMoreController = require('../controllers/BuyMore');

// Mock req and res
function mockReqRes(body, query = {}, params = {}) {
    const req = {
        body,
        query,
        params,
        user: { AdminID: 1 }
    };
    const res = {
        statusCode: 200,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.data = data;
            return this;
        }
    };
    return { req, res };
}

async function run() {
    console.log("--- TEST 1: Save product tiers with valid payload ---");
    const testPayload = {
        ProductID: 1,
        items: [
            { Quantity: 2, Price: 40.00 },
            { Quantity: 5, Price: 90.00 }
        ],
        StartDate: "2026-10-01 00:00:00",
        EndDate: "2026-12-31 23:59:59",
        Status: 1
    };

    const { req: req1, res: res1 } = mockReqRes(testPayload);
    await BuyMoreController.saveProductTiers(req1, res1);
    console.log("Result 1:", res1.statusCode, res1.data);

    // Give it a moment for callback
    setTimeout(async () => {
        console.log("--- TEST 2: Get tiers for ProductID 1 ---");
        const { req: req2, res: res2 } = mockReqRes({}, { ProductID: 1 });
        await BuyMoreController.getTiers(req2, res2);

        setTimeout(async () => {
            console.log("Result 2:", res2.statusCode, res2.data);

            console.log("--- TEST 3: Invalid quantity / price ---");
            const invalidPayload = {
                ProductID: 1,
                items: [
                    { Quantity: -1, Price: 40.00 }
                ]
            };
            const { req: req3, res: res3 } = mockReqRes(invalidPayload);
            await BuyMoreController.saveProductTiers(req3, res3);
            console.log("Result 3:", res3.statusCode, res3.data);

            console.log("--- TEST 4: Duplicate quantity ---");
            const dupPayload = {
                ProductID: 1,
                items: [
                    { Quantity: 2, Price: 40.00 },
                    { Quantity: 2, Price: 45.00 }
                ]
            };
            const { req: req4, res: res4 } = mockReqRes(dupPayload);
            await BuyMoreController.saveProductTiers(req4, res4);
            console.log("Result 4:", res4.statusCode, res4.data);

            pool.end();
        }, 500);
    }, 500);
}

run();
