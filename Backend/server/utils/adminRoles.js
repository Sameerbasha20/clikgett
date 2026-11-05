// Admin roles (AdminUsers.AdminRole). "super" may do everything; the other roles may use only
// their areas. Checked in utils.js adminAuthenticate on every admin request, so the admin
// panel's menu is a convenience, not the protection.
//
// Existing admins are "super" (migration default), so adding roles locks nobody out.

const ROLES = {
    super: { label: 'Super admin (everything)', areas: ['*'] },
    operations: { label: 'Operations (orders, riders, customers)', areas: ['common', 'orders', 'riders', 'customers'] },
    catalog: { label: 'Catalog (products, stock, storefront)', areas: ['common', 'catalog'] },
    marketing: { label: 'Marketing (offers, coupons, rewards, notifications)', areas: ['common', 'marketing'] },
    finance: { label: 'Finance (wallet, cashback, exports)', areas: ['common', 'finance', 'customers'] },
};

// First match wins. Paths are matched without the query string.
const ADMIN = '/api/admin(?:users?)?';
const RULES = [
    // Used by every page (top bar, uploads, dashboard).
    ['common', new RegExp(`^${ADMIN}/(global-search|upload-url|2fa-status)`)],
    ['common', /^\/api\/adminorders\/(new-since|dashboard)/],
    ['common', /^\/api\/admin-stock\/alerts/],
    // Super admin only: other admins, settings, store timings, ETA rules, referral rules.
    ['admins', new RegExp(`^${ADMIN}/(addadmin|updateadminuser|deleteadminuser|adminlist|list|detail|update|reset-2fa)(/|$)`)],
    ['settings', new RegExp(`^${ADMIN}/(addsettings|updatesettings|deletesettings|settingslist|settingdetail|delivery-eta/rules|referrals)`)],
    ['settings', /^\/api\/admintiming/],
    // Money.
    ['finance', new RegExp(`^${ADMIN}/(creditdebitwallet|wallettransactions|expirecashback)`)],
    ['finance', /^\/api\/(cashback|cashback-admin|admin-wallet-check)(\/|$)/],
    ['finance', /^\/api\/(csv|productcsv)\/(orderdetails|productdetails|pendingproductscsv)/],
    // People.
    ['riders', new RegExp(`^${ADMIN}/(addeliveryboy|updatedeliveryboy|deletedeliveryboy|deliveryboydetail|getactivedeliveryboys|getalldeliveryboys|delivery-eta/order)`)],
    ['customers', new RegExp(`^${ADMIN}/(userslist|userdetail|user/|updateuser|customer-full-details|feedback)`)],
    ['marketing', new RegExp(`^${ADMIN}/sendnotifications`)],
    // Orders.
    ['orders', /^\/api\/(adminorders|admin\/delivery|admin\/photo-orders)(\/|$)/],
    ['orders', /^\/api\/admin\/(customer-enquiries|product-requests)/],
    // Catalog and storefront (product edit tabs included).
    ['catalog', /^\/api\/(adminproducts|categories|subcategories|admin-stock|buymore|restrictions|banners|home-sections|admin-home-sections)(\/|$)/],
    ['catalog', /^\/api\/(productcsv|csv)\/update/],
    ['catalog', /^\/api\/sales\/(product|assign-product|remove-product)/],
    ['catalog', /^\/api\/(membership|membershipplans)\/(product|save-product-pricing)/],
    // Marketing.
    ['marketing', /^\/api\/(promocodes|sales|promotions|cartoffers|product-unlocks|membership|membershipplans|rewards|milestones|search-analytics)(\/|$)/],
    ['marketing', /^\/api\/carts\/abandoned/],
    ['marketing', /^\/api\/users\//],
];

/** Area of an admin API path, or "settings" (super only) when nothing matches. */
function areaFor(path) {
    const p = String(path || '').split('?')[0];
    for (const [area, re] of RULES) if (re.test(p)) return area;
    return 'settings';
}

const normaliseRole = (role) => (ROLES[role] ? role : 'super');

function allowed(role, path) {
    const r = ROLES[normaliseRole(role)];
    if (r.areas.includes('*')) return true;
    return r.areas.includes(areaFor(path));
}

module.exports = { ROLES, areaFor, allowed, normaliseRole };
