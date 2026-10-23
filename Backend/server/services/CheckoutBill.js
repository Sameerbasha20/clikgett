// Single source of truth for what a customer pays at checkout.
// The cart screen shows this bill and addorder / orderpayments recompute it,
// so the app can never charge something different from what the server stores.
const pool = require('../utils/db');
const PricingEngine = require('./PricingEngine');
const DeliveryTime = require('./DeliveryTime');

const MAX_TIP = 1000;
const PRODUCTS_S3 = 'http://clikgett-media.local/Products/';
const DEFAULT_TIP_PRESETS = [10, 20, 30, 50];

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const money = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

async function loadSettings() {
    const rows = await queryAsync('SELECT SettingKey, SettingValue FROM Settings');
    const s = {};
    (rows || []).forEach((r) => { s[r.SettingKey] = r.SettingValue; });
    let tipPresets = DEFAULT_TIP_PRESETS;
    try {
        const parsed = JSON.parse(s.TipPresets || 'null');
        if (Array.isArray(parsed) && parsed.length) tipPresets = parsed.map(Number).filter((n) => n > 0);
    } catch (_) { /* keep defaults */ }
    return {
        minOrderValue: parseFloat(s.MinOrderValue || 149),
        minOrderForFullWallet: parseFloat(s.Minordervalue_wallet || 399),
        smallOrderWalletCap: parseFloat(s.MinUseOfWallet || 40),
        freeDeliveryThreshold: parseFloat(s.FreeDelivery_CartAmount || 499),
        tipPresets,
    };
}

async function loadCart(userId) {
    const carts = await queryAsync('SELECT CartID FROM Carts WHERE UserID = ? AND IsOrderLinked = 1 ORDER BY CartID DESC LIMIT 1', [userId]);
    if (!carts.length) return { cartId: null, items: [] };
    const cartId = carts[0].CartID;
    const items = await queryAsync(
        // Every cart line, so the customer sees what ran out instead of it vanishing;
        // a switched-off product or pack counts as out of stock.
        `SELECT CI.ProductID, CI.Type, P.ProductName, P.ImageUrl, P.ProductImages,
                CASE WHEN P.Status = 1 AND V.Status = 1 THEN GREATEST(V.AvailableQty, 0) ELSE 0 END AS AvailableQty,
                CI.VariantID, CI.Quantity,
                V.metricvalue, V.metrictype, V.Price, V.OfferPrice, V.Buy2Price, 0 AS KitID,
                P.CategoryID, P.SubCategoryID, V.maxQty
           FROM CartItems CI
           JOIN Products P ON P.ProductID = CI.ProductID
           JOIN ProductVariants V ON V.VariantID = CI.VariantID
          WHERE CI.CartID = ?`,
        [cartId]
    );
    items.forEach((i) => {
        let image = i.ImageUrl && i.ImageUrl !== 'NA' ? i.ImageUrl : null;
        if (!image) {
            try {
                const list = JSON.parse(i.ProductImages || '[]');
                if (Array.isArray(list) && list.length) image = list[0];
            } catch (_) { /* no images */ }
        }
        i.ImageUrl = image ? (String(image).startsWith('http') ? image : PRODUCTS_S3 + image) : 'NA';
        delete i.ProductImages;
    });
    return { cartId, items };
}

/**
 * Wallet rule (from Settings):
 *  - order total >= Minordervalue_wallet  -> wallet can cover the whole order
 *  - smaller orders                       -> at most MinUseOfWallet from the wallet
 */
function walletUsable(balance, payableBeforeWallet, cfg) {
    if (balance <= 0 || payableBeforeWallet <= 0) return 0;
    const cap = payableBeforeWallet >= cfg.minOrderForFullWallet ? payableBeforeWallet : cfg.smallOrderWalletCap;
    return money(Math.min(balance, cap, payableBeforeWallet));
}

/**
 * @param {object} opts { userId, promoCode, latitude, longitude, tip, useWallet }
 */
async function computeBill(opts) {
    const { userId } = opts;
    const promoCode = opts.promoCode ? String(opts.promoCode).trim() : null;
    const tip = Math.min(MAX_TIP, Math.max(0, Math.round(parseFloat(opts.tip) || 0)));

    const [cfg, cart, users] = await Promise.all([
        loadSettings(),
        loadCart(userId),
        queryAsync('SELECT WalletAmount FROM Users WHERE UserID = ?', [userId]),
    ]);
    const walletBalance = money(users.length ? users[0].WalletAmount : 0);

    const location = {};
    const lat = parseFloat(opts.latitude);
    const lng = parseFloat(opts.longitude);
    if (lat && lng) { location.latitude = lat; location.longitude = lng; }

    // Out-of-stock lines are listed but not priced; the order is blocked until they are removed.
    const inStock = cart.items.filter((i) => parseInt(i.AvailableQty, 10) > 0);
    const outOfStock = cart.items
        .filter((i) => !(parseInt(i.AvailableQty, 10) > 0))
        .map((i) => ({ ...i, AvailableQty: 0, UnitPrice: parseFloat(i.OfferPrice) || 0, LineTotal: 0, OriginalTotal: 0, OutOfStock: true }));
    const calc = await PricingEngine.calculateCart(inStock, promoCode, userId, location);
    const allItems = [...(calc.Items || []), ...outOfStock];

    const itemsTotal = money(calc.SubTotal);
    const couponDiscount = money(calc.CouponDiscount);
    const offerDiscount = money(calc.CartOfferDiscount);
    const deliveryFee = money(calc.DeliveryCharges);
    const itemsAfterDiscounts = money(itemsTotal - couponDiscount - offerDiscount);
    const payableBeforeWallet = money(Math.max(0, itemsAfterDiscounts + deliveryFee + tip));
    const usable = walletUsable(walletBalance, payableBeforeWallet, cfg);
    const walletApplied = opts.useWallet ? usable : 0;
    const toPay = money(payableBeforeWallet - walletApplied);

    const distanceKm = await DeliveryTime.distanceFromStore(lat, lng);
    const eta = await DeliveryTime.estimate({ distanceKm, items: calc.Items || [] });

    const freeDeliverySavings = calc.FreeDeliveryApplied
        ? money(Math.max(0, (parseFloat(calc.DeliveryChargesBeforeWaiver) || 0) - deliveryFee))
        : 0;

    const stockIssues = allItems
        .filter((i) => parseInt(i.Quantity, 10) > parseInt(i.AvailableQty, 10))
        .map((i) => ({ ProductID: i.ProductID, VariantID: i.VariantID, ProductName: i.ProductName, AvailableQty: i.AvailableQty }));

    return {
        CartID: cart.cartId,
        Items: allItems,
        ItemCount: (calc.Items || []).reduce((n, i) => n + (parseInt(i.Quantity, 10) || 0), 0),
        MRPTotal: money(calc.OriginalSubTotal),
        ItemsTotal: itemsTotal,
        ProductSavings: money(calc.OriginalSubTotal - itemsTotal),
        PromoCode: couponDiscount > 0 ? promoCode : null,
        CouponDiscount: couponDiscount,
        CouponMessage: calc.CouponMessage || null,
        CartOffer: calc.AppliedCartOffer,
        CartOfferDiscount: offerDiscount,
        DeliveryFee: deliveryFee,
        FreeDeliveryApplied: !!calc.FreeDeliveryApplied,
        FreeDeliveryThreshold: cfg.freeDeliveryThreshold,
        AmountForFreeDelivery: calc.FreeDeliveryApplied ? 0 : money(Math.max(0, cfg.freeDeliveryThreshold - itemsTotal)),
        Tip: tip,
        TipPresets: cfg.tipPresets,
        WalletBalance: walletBalance,
        WalletUsable: usable,
        WalletApplied: walletApplied,
        ToPay: toPay,
        FreeDeliverySavings: freeDeliverySavings,
        TotalSavings: money(calc.OriginalSubTotal - itemsTotal + couponDiscount + offerDiscount + freeDeliverySavings),
        MinOrderValue: cfg.minOrderValue,
        MinOrderMet: itemsAfterDiscounts >= cfg.minOrderValue,
        AmountForMinOrder: money(Math.max(0, cfg.minOrderValue - itemsAfterDiscounts)),
        WalletRule: {
            MinOrderForFullWallet: cfg.minOrderForFullWallet,
            SmallOrderWalletCap: cfg.smallOrderWalletCap,
        },
        CashbackEarned: money(calc.CashbackEarned),
        ApplicableCoupons: calc.ApplicableCoupons || [],
        SuggestedCoupons: calc.SuggestedCoupons || [],
        ProductUnlocks: calc.ProductUnlocks || [],
        EtaMinutes: eta.totalMinutes,
        LargeCartNotice: eta.notes.length ? eta.notes.join(' · ') : null,
        StockIssues: stockIssues,
    };
}

module.exports = { computeBill, walletUsable, MAX_TIP };
