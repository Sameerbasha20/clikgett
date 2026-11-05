# 03 — Backend API Audit

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

## 1. How the inventory was built

- Every router in `Backend/server/routes/` was loaded in Node and its route list walked. That gives method, path, the full middleware chain and the handler name, including middleware applied with `router.use(...)`.
- Mount prefixes come from `server/server.js:139-186`.
- Result: **609 route registrations** across 45 mount points, collapsing to **404 distinct endpoints** once aliases are merged. An alias is the same router mounted under another prefix, e.g. `/api/adminuser` = `/api/adminusers` = `/api/admin`.
- For each endpoint, the handler source was scanned for `req.query.*`, `req.body.*`, the tables it touches and its controller line. The result is in **`api_inventory.json`** (365 of 404 handlers located automatically; the rest are inline or anonymous functions).

Endpoints by required role:

| Role | Endpoints |
|---|---|
| Admin (`adminAuthenticate`, AdminUsers.Role=1) | 267 |
| Customer (`userAuthenticate`) | 61 |
| Public | 26 |
| Public, customer optional (`optionalUserAuthenticate`) | 23 |
| Rider (`deliveryboyAuthenticate`, AdminUsers.Role=2) | 18 |
| Cron secret or admin | 5 |
| Customer or signed invoice link | 4 |

## 2. How endpoints were verified

Environment: local Docker backend `http://127.0.0.1:5001`, local MySQL `clikgett-dev`. No production system was contacted. The probe script is outside the repo; its raw output is summarised in **`endpoint_test_results.json`**.

| Check | What was sent | Result |
|---|---|---|
| A. No token | Every protected endpoint, every method, no `Authorization` header | **349 / 355 refused (401)**. The other 6 returned 400 because validation runs before auth (see §4.3); auth still blocks them. |
| B. Wrong role | Customer and rider tokens against admin routes; customer and admin tokens against rider routes; admin token against customer routes | All refused except the same validation-first routes (400). |
| C. Authorized GET | Every GET endpoint with a valid token of the right role and real local IDs; side-effect GETs (triggers) skipped | 208 × HTTP 200 (182 with `Status:1`, 25 non-JSON-Status bodies), 3 × 400 (missing required query), 4 × 404 (no image for fixture id 1), 1 × 403 (rider ownership check working), 1 × 501 (`datatransfer`). |
| D. Test suites | `npm test` (20 suites, 452 checks, 0 failures; see 11) | 121 endpoint registrations exercised with real request bodies and DB assertions. |

**Classification rules**

| Status | Meaning |
|---|---|
| PASS | Exercised by a passing test suite (functional and DB assertions), or an authorized GET returned 200 with valid data. Of the 252 PASS, 121 are suite-verified and 131 are verified by the authorized-GET probe only (it checks response and shape, not deep business rules). |
| FAIL | Defect reproduced. |
| BLOCKED | Not called because it would send SMS or push, needs a Razorpay signature, or triggers cron jobs. |
| NOT TESTED | Mutating endpoint with no suite coverage. Only check A/B was run, so auth is verified but behaviour is not. |

## 3. Results

| PASS | FAIL | BLOCKED | NOT TESTED | Total |
|---|---|---|---|---|
| 252 | 2 | 9 | 141 | **404** |

### Per router

| Router | Mount prefix(es) | Endpoints | PASS | FAIL | BLOCKED | NOT TESTED | Auth middleware used | No client found |
|---|---|---|---|---|---|---|---|---|
| AdminUsers | `/api/adminuser`, `/api/adminusers`, `/api/admin` | 54 | 27 | 0 | 2 | 25 | none, admin | 5 |
| AdminOrders | `/api/adminorders`, `/api/admin/delivery` | 39 | 31 | 0 | 0 | 8 | admin, invoice, invoiceLink | 18 |
| AdminHomeSections | `/api/home-sections`, `/api/admin-home-sections` | 24 | 8 | 0 | 0 | 16 | admin | 12 |
| Users | `/api/users` | 23 | 17 | 2 | 0 | 4 | none, generateUserAuthToken, user, optionalUser, admin | 5 |
| DeliveryBoy | `/api/deliveryboy` | 20 | 13 | 0 | 3 | 4 | none, generatedeliveryboyAuthToken, deliveryboy | 6 |
| Sales | `/api/sales` | 16 | 11 | 0 | 0 | 5 | none, admin | 1 |
| AdminProducts | `/api/adminproducts` | 15 | 9 | 0 | 0 | 6 | admin | 4 |
| Carts | `/api/carts` | 14 | 6 | 0 | 2 | 6 | user, cronOrAdmin, admin | 1 |
| Products | `/api/products` | 12 | 11 | 0 | 0 | 1 | optionalUser | 2 |
| ProductUnlocks | `/api/product-unlocks` | 12 | 9 | 0 | 0 | 3 | admin, none, optionalUser | 3 |
| Orders | `/api/orders` | 11 | 10 | 0 | 0 | 1 | user, none, invoice, invoiceLink | 2 |
| Rewards | `/api/rewards`, `/api/milestones` | 11 | 6 | 0 | 0 | 5 | admin, user | 2 |
| CustomerAccount | `/api/account` | 10 | 10 | 0 | 0 | 0 | none, user, optionalUser, admin | 0 |
| SubCategories | `/api/subcategories` | 10 | 3 | 0 | 0 | 7 | admin | 2 |
| Promotions | `/api/promotions` | 10 | 10 | 0 | 0 | 0 | optionalUser, admin | 0 |
| Categories | `/api/categories` | 9 | 7 | 0 | 0 | 2 | optionalUser, none, admin | 2 |
| PromoCodes | `/api/promocodes` | 9 | 4 | 0 | 1 | 4 | cronOrAdmin, user, admin | 2 |
| AdminTiming | `/api/admintiming` | 8 | 4 | 0 | 0 | 4 | admin | 0 |
| BuyMore | `/api/buymore` | 8 | 3 | 0 | 0 | 5 | admin | 2 |
| Membership | `/api/membership`, `/api/membershipplans` | 8 | 5 | 0 | 0 | 3 | admin | 2 |
| PrintStore | `/api/print` | 8 | 3 | 0 | 0 | 5 | none, user, admin | 0 |
| Address | `/api/address` | 7 | 3 | 0 | 0 | 4 | user, none | 2 |
| PhotoOrders | `/api/photo-orders` | 7 | 6 | 0 | 0 | 1 | user | 0 |
| AdminPhotoOrders | `/api/admin/photo-orders` | 7 | 6 | 0 | 0 | 1 | admin | 1 |
| AdminCustomerRequests | `/api/admin` | 7 | 4 | 0 | 0 | 3 | admin | 2 |
| ProductRestrictions | `/api/restrictions` | 6 | 2 | 0 | 0 | 4 | admin | 1 |
| CustomerRequests | `/api/customer` | 6 | 4 | 0 | 0 | 2 | user | 2 |
| Banners | `/api/banners` | 5 | 2 | 0 | 0 | 3 | admin | 0 |
| CartOffers | `/api/cartoffers` | 5 | 1 | 0 | 0 | 4 | admin | 1 |
| Productcsv | `/api/productcsv`, `/api/csv` | 4 | 3 | 0 | 0 | 1 | admin | 0 |
| Health | `/health`, `/api/health` | 4 | 3 | 0 | 0 | 1 | none | 4 |
| SearchAnalytics | `/api/search-analytics` | 3 | 2 | 0 | 0 | 1 | admin | 1 |
| CashbackAdmin | `/api/cashback-admin`, `/api/cashback` | 3 | 3 | 0 | 0 | 0 | admin | 0 |
| StockLevels | `/api/admin-stock` | 3 | 3 | 0 | 0 | 0 | admin | 0 |
| server.js inline | `/media/*`, webhook | 3 | 0 | 0 | 1 | 2 | signed URL / signature | 3 |
| Auth | `/api/auth` | 2 | 2 | 0 | 0 | 0 | none | 0 |
| WalletCheck | `/api/admin-wallet-check` | 1 | 1 | 0 | 0 | 0 | cronOrAdmin | 1 |
| **Total** | | **404** | **252** | **2** | **9** | **141** | | |

### BLOCKED (not called on purpose)

`GET/POST /api/carts/abandoned/trigger-notifications` (push), `POST /api/adminuser/send-2fa-sms` (SMS), `POST /api/adminuser/sendnotifications` (push), `POST /api/promocodes/winback/trigger` (coupons + push), `POST /api/deliveryboy/sendotp`, `POST /api/deliveryboy/sendotp_order` (SMS), `POST /api/deliveryboy/fcmtoken` (writes a real FCM token), `POST /api/payments/razorpay-webhook` (needs a Razorpay-signed body; signature check exists at `services/PaymentRecovery.js:33-40`).

## 4. Findings

### 4.1 FAIL — `GET /api/users/updateproducts` changes data on a GET

- **Where:** `routes/Users.js:53`, handler `controllers/Users.js:297-320`.
- **What:** rewrites `Products.ProductImages` for every row with `IsTransfered = 1`. The SQL is built by pasting `JSON.stringify(...)` into a single-quoted string (`controllers/Users.js:308`), so an image name containing `'` breaks the query.
- **Evidence:** the audit probe called this GET twice; the backend log shows 856 `UPDATE Products SET ProductImages` statements (2 × 428 rows). Every affected row already held a JSON array, so the content is unchanged (checked afterwards: 428/428 still `[...]`).
- **Impact:** any admin page, crawler or retry calling a GET can trigger a bulk write. This is a one-off migration left in production routes.
- **Fix:** delete the route, or make it a POST behind a confirm step with parameterised SQL.

### 4.2 FAIL — `GET /api/users/datatransfer` returns 501

- **Where:** `routes/Users.js:51`; `controllers/Users.js:191-198` requires `xlsx`, which isn't installed. It also reads a hard-coded file at `/home/ubuntu/clikgett/server/controllers/ProductsListforClikgett.xlsx` (`:282`).
- **Fix:** remove it (a one-off import), or install `xlsx` and take an upload instead of a server path.

### 4.3 Validation runs before authentication (low)

- **Where:**
  - `routes/Categories.js:17`
  - `routes/SubCategories.js:19`
  - `routes/AdminProducts.js:17-18`
  - `routes/PromoCodes.js:20`
  - `routes/Address.js:14`
- **What:** the mandatory-field validator runs before the login check, so an unauthenticated caller gets a 400 that lists the required fields instead of a 401. The handler isn't reached without a valid token, so this is not an access bypass.
- **Fix:** put the auth middleware first.

### 4.4 Weak error responses (low)

- **`GET /api/deliveryboy/getroutes` without `Type`:** returns HTTP 200 with `{"Status":0,"Message":"error"}` (`controllers/DeliveryBoy.js:303-306`, `820-835`). With `Type=pending` or `past` it works: rider 16 has 95 past orders, and the delivery OTP is removed from the response.
- **`Type=byid` branch:** queries `RouteID = <DeliveryBoyID>` (`:830-836`), which is wrong but appears unused.
- **Admin home-sections list:** `page` is parsed without a NaN guard (`controllers/AdminHomeSections.js:127-131`). A non-numeric `page` with a numeric `limit` produces `LIMIT NaN, n` → SQL error (500).

### 4.5 Unpaginated, capped lists (medium, performance and correctness)

- **Where:** `GET /api/adminorders/pastorders` and its 7 sort/filter variants (`controllers/AdminOrders.js:22-90`).
- **What:** they return every past order in one response, up to a hard-coded `LIMIT 2000`. Locally that's 1.57-1.63 MB per call (979 orders).
- **Impact:** in production, history beyond 2,000 orders silently disappears from the admin list.
- **Fix:** server-side paging with total counts.

### 4.6 Endpoints nobody calls

89 distinct endpoints aren't referenced by the admin site, the customer app or the delivery app (static scan of `Admin/src/Services.js`, all Dart string literals and all Java string literals). Examples:
- AdminOrders sort/filter duplicates (18);
- the duplicate `/sections/*` and `/admin/*` sets in AdminHomeSections (12);
- the health routes (4, used by monitors).

They widen the attack surface and the maintenance load.

### 4.7 Other observations

- **Rate limiting:**
  - `/api` limited to 600 requests per IP per minute (`server.js:117`);
  - OTP sending 20 per 10 minutes and logins 40 per 10 minutes (`server.js:109-116`);
  - per-number OTP limits: 5 sends per hour, 5 tries per code, a 24-hour lock after 10 failures (`services/LoginOtp.js:15-18`).

  The audit probe itself hit the 600/minute limit and had to slow down.
- **Error handling:** most handlers catch errors and return `{Status:0, Message}`. Some return HTTP 200 with `Status:0` (e.g. 4.4), so clients must check `Status`, not the HTTP code.
- **Transactions, rollback and concurrency:**
  - covered by suites for order placement (`test_order_safety.js`, `test_checkout.js`: one request can claim a cart, `Carts.isOrderLinked` acts as a lock);
  - covered for rider assignment (`test_delivery_assignment_workflow.js` Test 20, concurrent assignment);
  - not tested elsewhere.
- **Database-down behaviour:** not tested (BLOCKED: would require stopping the shared MySQL container). `/api/health/db` reports connection state.

## 5. Pagination, filtering, sorting

| Endpoint | Behaviour |
|---|---|
| Customer category listing (`GET /api/products/...` with `offset`/`rowCount`) | Paginated; sort from an allow-list (`controllers/Products.js:95-106`) |
| AdminHomeSections list | Supports `page`/`limit`/`sortBy` with an allow-list |
| AdminOrders lists | Filter and sort supported; no paging (see 4.5) |
| Search analytics | Filter by keyword; refreshes every 30 s from the admin page |
