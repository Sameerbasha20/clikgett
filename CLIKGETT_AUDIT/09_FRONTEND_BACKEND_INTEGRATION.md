# 09 — Frontend ↔ Backend Integration

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

## 1. Integration map

```
Admin (React, Services.js httpcall)  ──┐
Customer app (Flutter, http + ApiInterceptor) ──┼─► Express /api/* ─► rate limiter ─► auth middleware (utils/utils.js)
Delivery app (Java, Utils/Api)        ──┘        ─► validators ─► controller ─► services (PricingEngine, CheckoutBill,
                                                   OrderLifecycle, DeliveryTime, LoginOtp, …) ─► MySQL (pool) / Redis / MinIO
                                                   ─► JSON {Status, Message, …} (media URLs rewritten to signed /media links)
```

## 2. Client → API consistency (static scan of every URL literal)

| Client | URL literals | Distinct backend routes referenced | Calls to missing routes | Wrong HTTP method |
|---|---|---|---|---|
| Admin (`Admin/src/Services.js`) | 187 | 216 endpoints matched | **0** | **0** (method from the call site checked against the route) |
| Customer app (`Flutter/UserApp/lib`) | 110 | 89 | **0** | not determinable statically for all calls |
| Delivery app (`Flutter/Deliveryboy/.../java`) | 20 | 16 | **0** (2 concatenated URLs confirmed by hand) | — |

- **Backend endpoints with no client:** 89 of 404 (see `api_inventory.json`, `consumers: ["none found"]`). Mostly alias or duplicate spellings (AdminOrders sort/filter variants, AdminHomeSections `/admin/*` duplicates), legacy one-offs (`updateproducts`, `datatransfer`) and health routes.
- **Features only on the backend (no UI):** `GET /api/admin-wallet-check` (cron or manual only), home-section duplicate/reorder variants, kit/combo endpoints (`Kits`/`KitItems` tables are empty).
- **Features only on the frontend:** none found. Every admin page's calls resolve to working routes (04 §2: 129 page-load calls, all 200).

## 3. Field-name, payload and parsing consistency

- **Envelope:** responses use `{ Status: 1|0, Message, <Data> }`. All three clients check `Status`, not the HTTP code, so HTTP 200 + `Status:0` errors (e.g. `getroutes` without `Type`) are still shown as errors.
- **Field casing:** mixed PascalCase and camelCase (`ProductVariants[].status` vs `Status`; `metrictype`/`metricvalue`). Clients map them explicitly, e.g. `BestItem.fromJson` (`lib/old/Models/Home/home_model.dart`). No mismatch was found in the flows covered by suites; the suites assert the same fields the apps read (`ToPay`, `WelcomeDiscount`, `PriceCompareLowerPct`, `IsChilled`, …).
- **Auth headers:**
  - admin sends `token <jwt>`;
  - the apps send `bearer <jwt>`;
  - the backend accepts both (`utils/utils.js:15`).
- **Environment URLs:**

| Client | How the API URL is set |
|---|---|
| Admin | `REACT_APP_BASE_URL` (relative `/api` when localhost) |
| Customer app | `--dart-define=API_BASE_URL` |
| Delivery app | `-PapiBaseUrl` → `BuildConfig.API_BASE_URL`; **default is a LAN HTTP address** (`app/build.gradle:12`) |

## 4. Dynamic Home Sections: can admin control the customer home page?

**Yes, for the configurable shelves.**

| Layer | Evidence |
|---|---|
| Storage | Table `HomepageSections` (10 rows locally) with `SectionType`, `SystemKey`, `IsBuiltIn`, `DisplayOrder`, `Status`, `StartDate`/`EndDate`, `ConfigurationJSON`; links in `HomeSectionCategories` (35), `HomeSectionProducts`, `HomeSectionSubcategories`. |
| Seeded built-ins | Promotional Banners, Shop by Category, Bestsellers, Grocery & Kitchen, Snacks & Drinks, Personal & Home Care, Deals & Offers, Recommended for You, Order Again (`migrations/sync_built_in_home_sections.js`). These are rows, not hard-coded UI. |
| API | `GET /api/users/homepage` → `fetchDynamicHomeSections` reads active, in-date sections ordered by `DisplayOrder` (`controllers/Users.js:132`), and fills products and categories per type (`:78-126`). Probe: 200, 9 sections returned with products (15 each) and categories. |
| Admin | `/home-sections` page (loads, 10 rows, 76 controls): create, edit, reorder, duplicate, status and delete via `/api/admin-home-sections/sections/*`. |
| App | `HomeTab._sections()` maps each `SectionType` to a widget: `promotional_banner` → banner carousel, `shop_by_category` → category grid, `category_shelf`/`subcategory_shelf` → grid + "Popular in …" rail, `deals_and_offers`/default → product rail. Hard-coded fallback (banners, categories, Bestsellers) **only** when the API returns no sections. |

**Not controlled by admin (hard-coded positions in `HomeTab.dart`):**
- flash-sale section (always 3rd);
- milestone strip;
- unlock-deals strip;
- welcome-offer card;
- "Previously bought" rail;
- "Lower than other apps" rail;
- store-closed card.

Admin controls their content (sales, offers, tags) but not their position or visibility. The admin home-sections management endpoints are **not in `npm test`** (`test_dynamic_home_sections.js` exists but isn't run), so create/edit/reorder is implemented but not verified in this audit.
