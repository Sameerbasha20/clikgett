# 12 — Performance and Code Quality

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

## 1. API response times (local Docker, authorized GET probe, 208 successful calls)

| Percentile | Time |
|---|---|
| p50 | 7 ms |
| p90 | 55 ms |
| p99 | 206 ms |
| max | 512 ms |

Slowest endpoints:

| Endpoint | Time | Size |
|---|---|---|
| `GET /api/users/homepage` | 512 ms | 186 KB |
| `GET /api/adminproducts/out-of-stock` | 358 ms | 35 KB |
| `GET /api/users/updateproducts` (writes, see 03) | 323 ms | — |
| `GET /api/users/webhomepage` | 206 ms | 186 KB |
| `GET /api/users/homepagesectionproducts` | 175 ms | 274 KB |
| `GET /api/adminorders/pastorders*` (8 variants) | 92–158 ms | **1.57–1.63 MB each** |

These are local timings with the DB on the same machine. On Render with a remote Aiven DB, each extra query costs network round trips, so the homepage (9 sections, several queries each) is the first candidate for caching.

## 2. Payload and pagination issues

| Issue | Evidence | Suggested fix |
|---|---|---|
| Past orders unpaginated, capped at 2,000 | `controllers/AdminOrders.js:22-90` (`LIMIT 2000`); 1.6 MB per call locally (979 orders) | Server-side paging and counts; the admin table already shows pages client-side |
| Homepage payload 186 KB plus 274 KB section products | probe | Cache per section (Redis is available), shorter product objects for rails |
| Abandoned carts page renders 200+ rows at once | admin sweep: 25 table rows, 35 buttons, 2,988 chars on the first page | Already paged in the UI; check server paging |
| `UserNotifications` ≈ 373,000 rows | DB | Retention job |

## 3. Database efficiency

- **Missing indexes:** `Orders.OrderStatus`, `Orders.CreatedAt`, `OrderItems.ProductID`, `Wallets.UserID`, `SearchLogs.UserID` (07 §5). All are used in WHERE/ORDER BY on hot paths: admin lists, dashboard, previously bought, wallet history.
- **N+1:** product variants batched (good); kits still per row (legacy).

## 4. App size and frontend performance

| Artifact | Size | Note |
|---|---|---|
| Customer APK (universal, release) | 95.7 MB | Split per ABI (`--split-per-abi`) or ship an AAB; enable `minifyEnabled`/`shrinkResources` |
| Delivery APK (debug) | 17.8 MB | — |
| Admin main bundle | 1.74 MB uncompressed (~23 MB `static/js` including source maps) | Route-level code splitting; don't ship source maps to production |

Flutter:
- Infos: 216 `deprecated_member_use`, 60 `prefer_const_constructors` (extra rebuild work), 54 `avoid_print` (logging in release builds; e.g. `ItemDescription.dart:55-56` prints on every product open).
- The product card and home use GetX `Obx` for cart state. Runtime rebuild counts couldn't be measured (no device).

## 5. Code quality

| Area | Observation |
|---|---|
| Size of files | Several controllers over 1,000 lines (`AdminUsers.js` 2,107; `Orders.js` 1,980; `Users.js` 1,599); `ItemDescription.dart` 1,262; `Cart.dart` 1,648. Hard to review and test. |
| Architecture | SQL inline in controllers (no repository layer); newer code moved logic into `services/` (PricingEngine, CheckoutBill, OrderLifecycle), which is where the tests concentrate. |
| Duplication | Duplicate route spellings (03 §4.6); old/new Flutter layers side by side; two product-list SQL builders (`CommonController.products` vs `getproducts`). |
| Dead code | 89 endpoints without clients; 19 unused tables; commented-out blocks; `unused_import` ×18 in Flutter; 129 unused Android resources; dead `Verifylogin` admin login path. |
| Logging | Backend logs full SQL statements and query results with `console.log` (e.g. `DeliveryBoy.js:317-320`, `Products.js:107`). Noisy, and it can put personal data in logs. Use a leveled logger and drop result dumps. |
| Error handling consistency | Mixed HTTP-status vs `Status:0` errors (03 §4.4); 20 Flutter `catchError` handlers that don't return a value (05 §4). |
| Tests | Strong backend API suite (452 checks). Thin client tests (Flutter 43 unit tests, admin 5, Android 1 template). No end-to-end UI tests. |
