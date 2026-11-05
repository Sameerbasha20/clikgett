# 02 — Project Structure and Inventory

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

Audit date: 4 Nov 2026 · Commit audited: `b519e92` (branch `dev`, working tree clean before the audit) · Method: `git ls-files`, Express router introspection, static scans. Nothing in the source tree was changed; the only new files are in `CLIKGETT_AUDIT/`.

## 1. Modules

| Module | Path | Tech | Tracked source files | Lines |
|---|---|---|---|---|
| Backend API | `Backend/server` | Node.js, Express 4, `mysql` driver, ioredis, MinIO (S3 API) | 178 `.js` | 38,633 |
| Admin website | `Admin/src` | React (CRA), react-router, Bootstrap, react-toastify | 76 `.js/.jsx` | 29,007 |
| Customer app | `Flutter/UserApp/lib` | Flutter/Dart, GetX, http + http_interceptor, Firebase Messaging, Razorpay SDK | 183 `.dart` | 38,912 |
| Delivery app | `Flutter/Deliveryboy/app/src/main/java` | Native Android (Java), Volley-style `Api` helper, FCM, foreground location service | 28 `.java` (+125 XML layouts/resources) | 4,854 |
| Local infrastructure | `docker-compose.yml`, `docker/` | MySQL 8, Redis 7, MinIO, Mailpit, Postgres 16, backend, admin (nginx) | 6 files | — |
| Deployment config | `render.yaml`, `Backend/Dockerfile`, `Admin/Dockerfile`, `.github/workflows/ios-testflight.yml` | Render (backend), Vercel (admin), GitHub Actions (iOS) | — | — |
| Docs/other | `docs/`, `README.md`, `screenshots/`, `universal_qa.py`, `Backend/scripts/` | — | — | — |

## 2. Backend layout

| Folder | Files | Role |
|---|---|---|
| `server/routes` | 36 | Express routers; 45 mount points in `server/server.js:139-186` (8 routers are mounted under 2-3 prefixes) |
| `server/controllers` | 41 | Request handlers. Largest: `AdminUsers.js` (2,107 lines), `Orders.js` (1,980), `Users.js` (1,599), `AdminProducts.js` (1,420), `CommonController.js` (1,337) |
| `server/services` | 15 | Business logic: `PricingEngine`, `CheckoutBill`, `OrderLifecycle`, `DeliveryTime`, `LoginOtp`, `PaymentRecovery`, `PrintStore`, `ProductDeals`, `WelcomeOffer`, `CustomerRewards`, `RedisService`, … |
| `server/utils` | 15 | `db.js` (pool + RDS-in-dev guard), `utils.js` (auth middleware), `media.js` (signed media URLs), `orderStatus.js`, validations |
| `server/migrations` | 32 | Idempotent migrations run at start (`run_on_start.js`) + one `.sql` |
| `server/tests` | 34 | 33 test files + DB guard; 20 run by `npm test` |
| `Backend/scripts` | 30+ | One-off DB checks and an older endpoint-audit tool (`scripts/endpoint-audit/`) |

There are no `models/` or `middleware/` folders: SQL is written inline in controllers/services, and auth middleware lives in `utils/utils.js`.

## 3. Admin layout

- `src/App.js`: 38 page routes, a login route, 5 legacy redirects and a catch-all.
- `src/Services.js`: 1 HTTP helper (`httpcall`), 187 API-call URL literals (73 standalone functions + ~130 exported arrow functions).
- `src/Components/dashboard/*`: one folder per module (Orders, Products, Settings, Sales, Promotions, photoOrders, SearchAnalytics, …).
- `src/Components/Navbar/Config.js`: sidebar (32 menu entries, grouped).

Page list: Dashboard, Orders, Order details, Live operations, Photo orders, Photo order detail, Customer enquiries, Product requests, Products, Product details, Out of stock, Stock, Categories, Subcategories, Update price (bulk CSV), Home sections, Banners, Coupon codes, Flash sales, Welcome offer, Price compare, Cart offers, Abandoned carts, Send notification, Cashback review, Milestones, Product unlocks, Feedback, Membership, Customers, Customer detail, Customer transactions, Delivery boys, Admin users, Settings (5 tabs), Store timings, Search analytics, Exports.

## 4. Customer app layout

| Folder | Dart files | Notes |
|---|---|---|
| `lib/new/` | 125 | Current app: `NewScreens/` (50 screen files with a `Scaffold`), `Controllers/` (GetX), `Services/`, `NewModel/`, `Constants/` |
| `lib/old/` | 37 | Older layer, **still in use**: 33 of 37 files are imported from outside `old/` (mostly models such as `old/Models/Home/home_model.dart`) |
| other (`lib/Services`, `lib/Models`, `lib/Screens`, `main.dart`, `firebase_options.dart`) | 21 | Older services (e.g. `lib/Services/Orders/orders.dart`), interceptor |
| `test/` | 6 test files | 43 unit/widget tests |

Screens (by file, `lib/new/NewScreens`): Auth (LoginIntro, OnBoarding1, OtpVerify), Account (Profile, CreateProfile, EditProfile, membership, my requests, notification settings), Address (Add, Edit, Manage, Search, Places search, unsupported location), Homepage (Home tab, Search, Item description, Product request), Categories (Categories, SingleCategory), Cart (Cart, SuccessCart, delivery slot), Orders (Orders, Current, Past, OrderDetails, receipt), Coupons/Wallet, Unlock deals, Notifications, Photo orders (upload, list, proposal), Print store (store, configure), Referral, Support (Support, Enquiry), location (access, grant, enter address), Milestones page.

## 5. Delivery app layout

- Activities: `SplashActivity`, `SentotpActivity` (enter mobile), `VerifyOtpActivity`, `MainActivity` (tabs), `OrderDetailsActivity`, `StatusActivity`.
- Fragments/adapters: `CurrentOrdersFragment`, `PastOrdersFragment`, `MyOrdersFragmentAdapter`, `PendingOrdersAdapter`, `SlideToActView`.
- Services: `LocationTrackingService` (foreground, location type), `RiderMessagingService` (FCM), `ClikGettApp`.
- Utils: `CommonUtilities` (base URL from `BuildConfig.API_BASE_URL`), `Auth` (token in SharedPreferences), `Api`.
- Tests: only the Android Studio templates (`ExampleUnitTest`, `ExampleInstrumentedTest`).

## 6. Database (local `clikgett-dev`)

91 InnoDB tables, 1,038 columns, 198 indexes, 21 foreign keys, 0 views. Every table has a primary key. Details in `07_DATABASE_AUDIT.md`.

## 7. Duplicates, dead code, legacy

| Finding | Evidence |
|---|---|
| Router aliases (same router under several prefixes) | `AdminUsers` → `/api/adminuser`, `/api/adminusers`, `/api/admin`; `AdminOrders` → `/api/adminorders`, `/api/admin/delivery`; `Productcsv` → `/api/productcsv`, `/api/csv`; `Rewards` → `/api/rewards`, `/api/milestones`; `Membership` → `/api/membership`, `/api/membershipplans`; `AdminHomeSections` → `/api/home-sections`, `/api/admin-home-sections`; `CashbackAdmin` → `/api/cashback-admin`, `/api/cashback`; `Health` → `/health`, `/api/health`. 609 route registrations collapse to 466 distinct endpoints. |
| Duplicate route spellings inside routers | e.g. `/pastorders/sort` and `/pastorderssort`, `/pastorders/filter` and `/pastordersfilter`, `/check-serviceability` and `/checkserviceability`, `/sections/...` and `/admin/...` in AdminHomeSections. |
| Backend endpoints with no client | 149 of 466 distinct endpoints are referenced by none of the three apps (static scan; see `api_inventory.json`, `consumers: ["none found"]`). Many are aliases or legacy. |
| Legacy one-off endpoints still routed | `GET /api/users/updateproducts` (bulk image rewrite), `GET /api/users/datatransfer` (Excel import from a hard-coded server path `controllers/Users.js:282`). |
| Unreferenced tables | 19 tables not referenced by any runtime code (list in `07_DATABASE_AUDIT.md`). |
| Commented-out code | Large commented blocks in `controllers/AdminProducts.js`, `Users.js`, `Orders.js`, `Address.js`. |
| Flutter legacy screens | `old/Screens/Auth_Screens/login_Screens.dart` and `otp_Screen.dart` are referenced only by `old/ViewModels/Auth/login_view_model.dart` and an unused import in `lib/Services/common/intercepter.dart` (analyzer: `unused_import`). |
| Previous audit tooling | `Backend/scripts/endpoint-audit/*` and `universal_qa.py` (not part of any test run). |

## 8. Hard-coded configuration

| Item | Location | Note |
|---|---|---|
| Delivery app LAN IPs and cleartext allowed | `Flutter/Deliveryboy/app/src/main/res/xml/network_security_config.xml` | base-config permits cleartext for all hosts |
| Old server IPs in comments | `Deliveryboy/.../Utils/CommonUtilities.java:10-16`, `UserApp/lib/old/constants.dart:14` | commented, harmless but stale |
| Razorpay key ID (public by design) | `UserApp/lib/new/Constants/Constants.dart:8-9`, `old/constants.dart:9` | key IDs are client-side values; the secret is server-only |
| Firebase client config | `UserApp/lib/firebase_options.dart` | standard client config; restrict the API key by app signature in Google Cloud |
| Excel import path | `Backend/server/controllers/Users.js:282` | `/home/ubuntu/clikgett/...` |
| Demo 2FA OTP default `123456` | `docker-compose.yml` (`ADMIN_2FA_DEMO_OTP`) and `controllers/AdminAuth2FA.js:23-30` | only honoured when `NODE_ENV=development`; Render uses `production` |

## 9. Dependencies

- Backend: `xlsx` is required at runtime by `products_transfer` (`controllers/Users.js:194`) but is not installed → that endpoint returns 501.
- No circular-require problems were observed: every router module loaded in isolation during inventory (`require` of all 36 route files succeeded).
