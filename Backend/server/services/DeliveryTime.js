// One delivery-time estimate for the home header, checkout and the placed order.
//
//   distance  : up to Band1MaxKm (5 km) -> Band1BaseMinutes (20); farther -> Band3BaseMinutes (30)
//               (DeliveryETARules, editable by admin)
//   items     : total quantity above LargeCartThreshold1Items (10) adds LargeCartThreshold1Minutes (10),
//               then every further (Threshold2 - Threshold1) items (10) adds LargeCartThreshold2Minutes (10)
//               (AdminShopToggleSettings, editable by admin)
//   fruit     : any fresh-fruit item adds FRUIT_MINUTES, at any distance
const pool = require('../utils/db');

const FRUIT_MINUTES = 10;

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function loadRules() {
    const [eta] = await queryAsync('SELECT * FROM DeliveryETARules WHERE RuleID = 1 LIMIT 1').catch(() => []);
    const [shop] = await queryAsync('SELECT * FROM AdminShopToggleSettings LIMIT 1').catch(() => []);
    return {
        nearKm: parseFloat(eta && eta.Band1MaxKm) || 5,
        nearMinutes: parseInt(eta && eta.Band1BaseMinutes, 10) || 20,
        farMinutes: parseInt(eta && eta.Band3BaseMinutes, 10) || 30,
        item1: parseInt(shop && shop.LargeCartThreshold1Items, 10) || 10,
        item1Minutes: parseInt(shop && shop.LargeCartThreshold1Minutes, 10) || 10,
        item2: parseInt(shop && shop.LargeCartThreshold2Items, 10) || 20,
        item2Minutes: parseInt(shop && shop.LargeCartThreshold2Minutes, 10) || 10,
        storeLat: parseFloat(shop && shop.Latitude),
        storeLng: parseFloat(shop && shop.Longitude),
    };
}

/** Straight-line distance from the store, in km (2 decimals). */
function haversineKm(lat1, lng1, lat2, lng2) {
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLng = (lng2 - lng1) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}

async function distanceFromStore(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!lat || !lng) return null;
    const rules = await loadRules();
    if (!rules.storeLat || !rules.storeLng) return null;
    return haversineKm(rules.storeLat, rules.storeLng, lat, lng);
}

function itemMinutes(qty, r) {
    if (qty <= r.item1) return 0;
    if (qty <= r.item2) return r.item1Minutes;
    const step = r.item2 - r.item1 > 0 ? r.item2 - r.item1 : 10;
    return r.item1Minutes + Math.ceil((qty - r.item2) / step) * r.item2Minutes;
}

/** True when any item is in a fresh-fruit subcategory ("All Fruits", "Exotic Fruits"; not dried fruit or juice). */
async function hasFreshFruit(items) {
    const subIds = [...new Set(items.map((i) => parseInt(i.SubCategoryID, 10)).filter((n) => n > 0))];
    if (!subIds.length) return false;
    const rows = await queryAsync('SELECT SubCategoryName FROM SubCategories WHERE SubCategoryID IN (?)', [subIds]).catch(() => []);
    return rows.some((r) => /fruit/i.test(r.SubCategoryName || '') && !/dr(y|ied)|juice/i.test(r.SubCategoryName || ''));
}

/**
 * @param {object} p { distanceKm, items: [{ Quantity, SubCategoryID }] }
 * @returns {{ totalMinutes, distanceMinutes, itemMinutes, fruitMinutes, itemQuantity, distanceKm, band, notes: string[] }}
 */
async function estimate({ distanceKm = null, items = [] } = {}) {
    const r = await loadRules();
    const dist = parseFloat(distanceKm);
    const distanceMinutes = !isNaN(dist) && dist > r.nearKm ? r.farMinutes : r.nearMinutes;
    const qty = items.reduce((n, i) => n + (parseInt(i.Quantity, 10) || 0), 0);
    const extraForItems = itemMinutes(qty, r);
    const fruitMinutes = (await hasFreshFruit(items)) ? FRUIT_MINUTES : 0;
    const notes = [];
    if (extraForItems) notes.push(`${qty} items · +${extraForItems} min to pack`);
    if (fruitMinutes) notes.push(`Fresh fruit · +${fruitMinutes} min`);
    return {
        totalMinutes: distanceMinutes + extraForItems + fruitMinutes,
        distanceMinutes,
        itemMinutes: extraForItems,
        fruitMinutes,
        itemQuantity: qty,
        distanceKm: isNaN(dist) ? null : dist,
        band: isNaN(dist) ? 'unknown_distance' : (dist > r.nearKm ? `above_${r.nearKm}km` : `within_${r.nearKm}km`),
        notes,
    };
}

module.exports = { estimate, distanceFromStore, haversineKm, FRUIT_MINUTES };
