# 04 — Admin Panel Audit

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

## 1. Method

- **Environment:** local admin container (`http://127.0.0.1:3001`, nginx serving the production build) → local backend → local MySQL. Browser: Chrome via the Claude-in-Chrome extension.
- **Login:** a short-lived admin JWT for local AdminID 1 was placed in `sessionStorage`. No password was typed, and 2FA was not exercised.
- **Stale container:** the container was first serving a build from **23 Oct 2026**. On it, Stock, Welcome Offer and Price Compare redirected to the dashboard because those pages didn't exist in that build. The container was rebuilt from the current source (`docker compose up -d --build admin`, local only) and **the whole sweep was re-run on the current bundle `main.cf09b3a6.js`**. The results below are from that run.
- **Page sweep (all 38 routes):**
  - navigate with the SPA router, wait 3.5 s;
  - record every `fetch` (method, path, HTTP status, body `Status`);
  - record every `console.error` and uncaught error;
  - count rendered text, buttons, inputs and table rows, and look for "failed to load / something went wrong" text.
- **Interaction tests:** search and filter inputs driven with real input events on 5 pages (§4). No create, edit or delete buttons were clicked: they write to the database or open confirm dialogs that would block automation. These rely on the backend suites instead (§3).
- **Static mapping:** every API URL in `src/Services.js` (187 literals) was matched against the backend route table. **All 187 resolve to an existing route and method.** 0 calls go to missing endpoints.

## 2. Page sweep results (current build)

**38 / 38 pages render. 0 redirects, 0 failed API calls (129 calls, all HTTP 200 with `Status:1`), 0 console errors, 0 error banners.**

| # | Route | Page heading | Rendered text (chars) | Buttons | Inputs | Table rows | API calls | Result |
|---|---|---|---|---|---|---|---|---|
| 1 | /dashboard | Today | 1,448 | 16 | 1 | 15 | 0* | Loads, data shown |
| 2 | /orders | Orders | 1,772 | 13 | 18 | 6 | 4 | Loads, data shown |
| 3 | /orders/1925 | Order Details | 1,592 | 11 | 3 | — | 7 | Loads |
| 4 | /live-operations | Live Delivery Operations | 1,354 | 25 | 2 | 20 | 4 | Loads |
| 5 | /photo-orders | Photo Order Requests | 2,330 | 21 | 5 | 17 | 3 | Loads |
| 6 | /photo-orders/46 | Request #POR-… | 1,073 | 11 | 3 | — | 4 | Loads |
| 7 | /customer-enquiries | Customer Enquiries | 1,122 | 10 | 3 | 4 | 3 | Loads |
| 8 | /product-requests | Unavailable Product Requests | 1,715 | 22 | 3 | 7 | 3 | Loads |
| 9 | /products | (category tabs) | 1,543 | 60 | 3 | 8 | 4 | Loads |
| 10 | /products/details/2 | Red Label Tea Powder 100g | 855 | 7 | 2 | 1 | 3 | Loads |
| 11 | /out-of-stock | Out of stock 109 | 2,613 | 58 | 28 | 25 | 3 | Loads |
| 12 | /stock | Stock 1200 | 5,068 | 115 | 4 | 50 | 3 | Loads |
| 13 | /categories | Category | 495 | 20 | 2 | 8 | 3 | Loads |
| 14 | /subcategories | Subcategory | 646 | 13 | 3 | 4 | 4 | Loads |
| 15 | /update-price | Update Price | 88 | 4 | 2 | — | 2 | Loads (upload form) |
| 16 | /home-sections | Dynamic Home Page Sections | 2,552 | 76 | 5 | 10 | 5 | Loads |
| 17 | /banners | Banners | 300 | 14 | 2 | 5 | 3 | Loads |
| 18 | /promocodes | Coupon Codes | 505 | 14 | 2 | 5 | 3 | Loads |
| 19 | /sales | Flash Sales & Promotions | 571 | 10 | 1 | 3 | 4 | Loads |
| 20 | /welcome-offer | Welcome Offer | 630 | 8 | 7 | 3 | 3 | Loads |
| 21 | /price-compare | Price Compare | 306 | 3 | 4 | 0 (none tagged) | 3 | Loads |
| 22 | /cart-offers | Cart Threshold Offers | 280 | 4 | 1 | 1 | 3 | Loads |
| 23 | /abandoned-carts | Abandoned Carts | 2,988 | 35 | 2 | 25 | 3 | Loads |
| 24 | /notification | Notification | 48 | 4 | 3 | — | 2 | Loads (send form) |
| 25 | /cashback-review | Cashback review | 395 | 6 | 1 | 0 | 3 | Loads (empty state) |
| 26 | /milestones | Customer Milestone Rewards | 586 | 4 | 1 | 1 | 4 | Loads |
| 27 | /product-unlocks | Unlock deals | 3,511 | 72 | 56 | 50 | 5 | Loads |
| 28 | /feedback | Customer Feedback & Rewards | 1,585 | 18 | 7 | 7 | 4 | Loads |
| 29 | /membership | Membership | 372 | 6 | 1 | 2 | 4 | Loads |
| 30 | /customers | Customers | 824 | 13 | 13 | 8 | 3 | Loads |
| 31 | /customers/1000523 | Customer Profile & Ledger | 535 | 9 | 1 | 6 | 3 | Loads |
| 32 | /customers/transactions/1000523 | ClikGett Cash Management & Transactions | 1,608 | 9 | 6 | 17 | 3 | Loads |
| 33 | /DeliveryBoy | Deliveryboy | 598 | 20 | 2 | 8 | 3 | Loads |
| 34 | /admin-users | Admin users | 253 | 9 | 1 | 2 | 3 | Loads |
| 35 | /settings | Admin Configuration & System Settings | 2,351 | 14 | 19 | — | 4 | Loads |
| 36 | /store-timings | (timings) | ~436 | 9 | 2 | 1 | ~5 | Loads (numbers from first sweep) |
| 37 | /search-analytics | (analytics) | ~2,164 | 30 | 2 | 17 | 2+ | Loads; refreshes every 30 s |
| 38 | /exports | (CSV exports) | ~118 | 5 | 1 | — | 1 | Loads |

\*Dashboard data comes from a request made before the recorder attached; the page rendered 15 rows.

## 3. Actions per module: UI → API → backend → database evidence

"Backend verified" means the endpoint the button calls is exercised by a passing suite (see `endpoint_test_results.json`). "UI clicked" means a browser interaction was performed in this audit.

| Module | Main actions | API endpoint(s) | Backend verified | UI clicked |
|---|---|---|---|---|
| Orders | list, filter, sort, status change, assign rider, reassign, invoice | `adminorders/*` | Yes: updatestatus, assigndeliverboy, pastorders, delays, dashboard (test_admin, test_delivery_assignment_workflow) | Sort select read (6 options); no write |
| Live operations | assign/reassign, delays | `adminorders/live-*`, `admin/delivery/*` | Yes (assignment suite) | Load only |
| Photo orders | claim, prepare/send proposal, cancel, zoom viewer, product suggestions | `admin/photo-orders/*` | claim, cancel, prepare-proposal (test_qa_bug_fixes / photo tests) | Load only |
| Customer enquiries / product requests | status update, reply | `admin/customer-enquiries/*`, `admin/product-requests/*` | enquiry status (suite) | Load only |
| Products | add/edit product and variants, status, chilled tag, buy-more, restrictions, flash sale, membership | `adminproducts/*`, `buymore/*`, `restrictions/*`, `sales/*`, `membership/*` | add/update product and variant (test_admin, test_product_actions), buy-more save, restrictions save, sale assign | Search typed (per-category filter works, §4) |
| Stock / Out of stock | add stock, restock | `admin-stock/*`, `adminproducts/restock` | Yes (test_stock_and_deals) | Load only |
| Categories / Subcategories / Banners | CRUD with image upload | `categories/*`, `subcategories/*`, `banners/*` | add category (suite); edit/delete **not tested** | Load only |
| Update price | CSV upload → `productcsv/update/:file` | `productscsv`, `productcsv/update` | **Not tested** (no suite) | Load only |
| Home sections | create, edit, reorder, duplicate, status, delete | `admin-home-sections/sections/*` | **Not in npm test** (`test_dynamic_home_sections.js` exists but isn't run) | Load only |
| Coupons / Cart offers | CRUD | `promocodes/admin/*`, `cartoffers/*` | Coupon apply at checkout (test_checkout); admin CRUD **not tested** | Load only |
| Flash sales | create, add items, per-item limit | `sales/*` | Yes (test_flash_sale, test_admin) | Load only |
| Welcome offer / Price compare | save offer; add/edit/sort/remove tags | `promotions/admin/*` | Yes (test_promotions, 24 checks) | Price-compare search suggestions (20 results with Add buttons) |
| Notification | send push to customers | `adminuser/sendnotifications` | BLOCKED (real push) | Load only |
| Cashback review | approve/reject | `cashback/*` | Yes (test_cashback_review) | Load only |
| Milestones / Unlock deals / Membership | configure | `rewards/*`, `product-unlocks/*`, `membership/*` | Partly (test_customer_rewards, unlock admin settings, membership save) | Load only |
| Feedback | reply, review, credit reward | `adminusers/feedback/*` | **Not in npm test** | Load only |
| Customers / Transactions | search, view ledger, wallet credit/debit | `adminuser/userslist`, `adminusers/wallettransactions` | List and detail GET (probe); wallet adjust **not tested** | Search typed: 8 → 1 row (works) |
| Delivery boys / Admin users | CRUD, 2FA reset | `adminuser/*deliveryboy*`, `adminusers/*` | update/delete admin user (suite) | Load only |
| Settings | business rules, delivery fee, ETA bands, referral, rewards | `adminuser/settings*`, `admintiming/*`, delivery-ETA rules | settings list (suite); ETA rules (ETA suite) | Load only |
| Search analytics | live keyword table | `search-analytics/*` | GET probe | Filter typed: 17 → 1 row (works) |
| Exports | CSV downloads | `csv/productdetails`, `csv/orderdetails`, `csv/pendingproductscsv` | GET probe 200 | Load only |

## 4. Interactions performed

| Page | Interaction | Result |
|---|---|---|
| Top bar (all pages) | Global search "red label" | `GET /api/adminuser/global-search` → 200, Status 1 |
| Products | Type "Barley" in "Search by product Name" | 8 → 3 rows, correct products. Search is **only within the selected category** and needs an exact substring: "barley rice 250" → 0 rows because names contain Telugu text between the words. Usability limitation. |
| Customers | Type a test name | 8 → 1 row (correct customer) |
| Price compare | Type "milk" | `GET /api/promotions/admin/products` 200 → 20 suggestions with photos and Add buttons |
| Search analytics | Filter "milk" | 17 → 1 row |
| Orders | Read sort select | Options: latest, oldest, highest/lowest value, status, scheduled date, delivery date |

## 5. Not covered (honest gaps)

- Create, Edit and Delete buttons were not clicked in the browser for any module, to avoid writing to the database and triggering blocking confirm dialogs. Coverage for these comes from backend suites where they exist (§3).
- Form validation messages, pagination controls and permission-based UI were not exercised in the browser.
- **Permissions:** the backend has a single admin role (`AdminUsers.Role = 1`, `utils/utils.js:87`). Every admin can do everything, and the admin UI has no per-module permission model to test.
- Admin 2FA login (SMS) was not exercised (BLOCKED: real SMS).

## 6. Build quality

`CI=false npx react-scripts build` → exit 0, "Compiled with warnings":
- 123 ESLint warnings: 62 `no-unused-vars`, 38 `eqeqeq`, 21 `react-hooks/exhaustive-deps`, 2 `unicode-bom`;
- main bundle 1.74 MB (uncompressed).
