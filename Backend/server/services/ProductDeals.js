// Adds live deal info to product lists so the app shows the same price the
// cart will charge:
//   variant.SalePrice  flash-sale unit price (only when lower than OfferPrice)
//   product.Deal       { SaleName, EndDate } of the running flash sale
//   product.BulkTiers  buy-more tiers [{ VariantID|null, MinQuantity, MaxQuantity, Price }]
//                      (Min == Max: bundle, Price is the total; otherwise Price is per item)
// The pricing rules mirror PricingEngine.calculateLinePrice.
const pool = require('../utils/db');

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
    return list;
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
