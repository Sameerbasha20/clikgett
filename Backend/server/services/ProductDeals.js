// Adds live deal info to product lists so the app shows the same price the
// cart will charge:
//   variant.SalePrice  flash-sale unit price (only when lower than OfferPrice)
//   product.Deal       { SaleName, EndDate } of the running flash sale
//   product.BulkTiers  buy-more tiers [{ VariantID|null, MinQuantity, MaxQuantity, Price }]
//                      (Min == Max: bundle, Price is the total; otherwise Price is per item)
// The pricing rules mirror PricingEngine.calculateLinePrice.
const pool = require('../utils/db');
const requestContext = require('../utils/requestContext');

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const salePrice = (offerPrice, sale) => {
    const base = parseFloat(offerPrice) || 0;
    const value = parseFloat(sale.DiscountValue) || 0;
    if (!(base > 0) || !(value > 0)) return null;
    const discount = sale.DiscountType === 'percentage' ? (base * value) / 100 : sale.DiscountType === 'flat' ? value : 0;
    const price = Math.max(0, Math.round((base - discount) * 100) / 100);
    return price < base ? price : null;
};

async function attachDeals(products) {
    const list = Array.isArray(products) ? products : [];
    const ids = [...new Set(list.map((p) => parseInt(p.ProductID, 10)).filter((n) => n > 0))];
    if (!ids.length) return list;
    const [sales, tiers] = await Promise.all([
        queryAsync(
            `SELECT s.SaleName, s.DiscountType, s.DiscountValue, s.EndDate, si.ProductID
               FROM Sales s JOIN SaleItems si ON si.SaleID = s.SaleID
              WHERE si.ProductID IN (?) AND s.Status = 1 AND s.StartDate <= NOW() AND s.EndDate >= NOW()
              ORDER BY s.CreatedAt DESC`,
            [ids]
        ).catch(() => []),
        queryAsync(
            `SELECT ProductID, VariantID, MinQuantity, MaxQuantity, Price FROM buy_more_config
              WHERE ProductID IN (?) AND Status = 1
                AND (StartDate IS NULL OR StartDate <= NOW()) AND (EndDate IS NULL OR EndDate >= NOW())
              ORDER BY MinQuantity ASC`,
            [ids]
        ).catch(() => []),
    ]);
    for (const p of list) {
        const sale = sales.find((s) => s.ProductID == p.ProductID);
        p.Deal = null;
        if (sale) {
            let any = false;
            (p.ProductVariants || []).forEach((v) => {
                const price = salePrice(v.OfferPrice || v.Price, sale);
                v.SalePrice = price;
                if (price != null) any = true;
            });
            if (any) p.Deal = { SaleName: sale.SaleName, EndDate: sale.EndDate };
        }
        p.BulkTiers = tiers
            .filter((t) => t.ProductID == p.ProductID)
            .map((t) => ({ VariantID: t.VariantID || null, MinQuantity: t.MinQuantity, MaxQuantity: t.MaxQuantity, Price: parseFloat(t.Price) }));
    }
    await attachMemberPrices(list, ids);
    return list;
}

// Membership prices, mirroring PricingEngine.calculateLinePrice:
//   product.MemberOffer  { PlanName, Price } cheapest plan price, shown to everyone as a teaser
//   variant.MemberPrice  the signed-in member's own plan price (only when below OfferPrice)
// Products with a no_membership restriction (product or category) get neither.
async function attachMemberPrices(list, ids) {
    const userId = requestContext.userId();
    const [offers, restricted, membership] = await Promise.all([
        queryAsync(
            `SELECT mpp.ProductID, mpp.PlanID, mpp.MembershipPrice, mp.PlanName
               FROM membership_product_prices mpp JOIN MembershipPlans mp ON mp.PlanID = mpp.PlanID AND mp.Status = 1
              WHERE mpp.ProductID IN (?) AND mpp.Status = 1 AND mpp.MembershipPrice > 0`,
            [ids]
        ).catch(() => []),
        queryAsync(
            `SELECT ProductID, CategoryID FROM product_restrictions
              WHERE Status = 1 AND RestrictionType IN ('no_membership', 'membership_excluded')
                AND (ProductID IN (?) OR CategoryID IS NOT NULL)`,
            [ids]
        ).catch(() => []),
        userId ? require('./PricingEngine').getUserActiveMembership(userId).catch(() => null) : null,
    ]);
    for (const p of list) {
        const excluded = restricted.some((r) => (r.ProductID && r.ProductID == p.ProductID) || (r.CategoryID && r.CategoryID == p.CategoryID));
        const rows = excluded ? [] : offers.filter((o) => o.ProductID == p.ProductID);
        const cheapest = rows.reduce((best, o) => (!best || parseFloat(o.MembershipPrice) < parseFloat(best.MembershipPrice) ? o : best), null);
        p.MemberOffer = cheapest ? { PlanName: cheapest.PlanName, Price: parseFloat(cheapest.MembershipPrice) } : null;
        const mine = membership ? rows.find((o) => o.PlanID == membership.PlanID) : null;
        (p.ProductVariants || []).forEach((v) => {
            const price = mine ? parseFloat(mine.MembershipPrice) : null;
            v.MemberPrice = price != null && price < (parseFloat(v.OfferPrice || v.Price) || 0) ? price : null;
        });
    }
}

/** Product ids with bulk prices (buy-more slabs or a "buy 2" price). */
async function bulkDealProductIds() {
    const rows = await queryAsync(
        `SELECT DISTINCT b.ProductID FROM buy_more_config b
           WHERE b.Status = 1 AND (b.StartDate IS NULL OR b.StartDate <= NOW()) AND (b.EndDate IS NULL OR b.EndDate >= NOW())
         UNION
         SELECT DISTINCT v.ProductID FROM ProductVariants v WHERE v.status = 1 AND v.Buy2Price > 0 AND v.AvailableQty > 0`
    );
    return rows.map((r) => r.ProductID);
}

module.exports = { attachDeals, bulkDealProductIds, salePrice };
