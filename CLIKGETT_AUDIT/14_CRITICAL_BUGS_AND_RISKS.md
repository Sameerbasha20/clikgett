# 14 — Critical Bugs and Risks

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

Ordered by severity. Each item gives location, impact, evidence and the recommended fix. Nothing has been fixed. This is an audit.

## High

### H1. Legacy plain-text / MD5 passwords accepted for admin and rider accounts
- **Where:** `Backend/server/utils/password.js:21-31` (accepts plain/MD5), used by `controllers/AdminAuth2FA.js:132-133`; dead plain-SQL check at `controllers/AdminUsers.js:1963-1966`.
- **Evidence:** local DB: 19 of 21 `AdminUsers` rows are not `scrypt$…`.
- **Impact:** if the database or a backup leaks, these passwords are readable.
- **Fix:**
  - force a password reset (or rehash on next login plus expiry) for every non-scrypt row in production;
  - remove the plain/MD5 branch after migration;
  - delete `Verifylogin` and `adminlogin`.

### H2. Wallet ledger does not match balances
- **Where:** `Users.WalletAmount` vs the `Wallets` ledger; checker `GET /api/admin-wallet-check`.
- **Evidence:** `?days=3650` → `BalanceMismatch: 9`, `Healthy: false` (local data, which mirrors production-derived data).
- **Impact:** customers may hold the wrong ClikGett Cash; refunds and cashback decisions use the balance.
- **Fix:**
  - trace the write path that changes one side only;
  - correct the 9 accounts with a reviewed script;
  - schedule the checker with alerts.

### H3. Release builds of both apps fall back to debug signing
- **Where:** `Flutter/UserApp/android/app/build.gradle:97`, `Flutter/Deliveryboy/app/build.gradle:48`; no `key.properties` in the checkout.
- **Impact:** APKs can't be uploaded to Play as updates of the existing app; testers install debug-signed builds.
- **Fix:** restore the upload keystore and `key.properties` (outside Git); fail the release build when signing is missing.

### H4. Production still runs the old backend and schema
- **Where:** AWS EC2/RDS (see `10_DOCKER_INFRASTRUCTURE_AUDIT.md`).
- **Impact:**
  - every feature verified here exists only on local and Render/Aiven;
  - real customers don't have it;
  - none of the production data migrations have been run or rehearsed;
  - schema comparison with production is BLOCKED.
- **Fix:** execute the approved server replacement runbook and a migration rehearsal on a copy of production.

### H5. No automated verification of the mobile apps
- **Evidence:** 0% (customer) and 8% (delivery) verified features. No integration or Espresso tests; 43 Flutter unit tests and 1 Android template test.
- **Impact:** screen-level regressions are found only by manual testing (as in this session's QA rounds).
- **Fix:** device test plan now (15 Phase 2); integration tests for login → cart → order → track.

## Medium

| # | Finding | Location | Evidence | Fix |
|---|---|---|---|---|
| M1 | GET endpoint performs bulk UPDATE with string-built SQL | `routes/Users.js:53`, `controllers/Users.js:297-320` (SQL at :308) | Probe call rewrote 428 rows (values unchanged) | Remove the route, or POST + parameterised SQL + confirmation |
| M2 | Single all-powerful admin role | `utils/utils.js:87` | Every admin route checks only `Role=1` | Add roles (operations, catalog, finance, super-admin) for wallet, refund, user and export endpoints |
| M3 | Store-review OTP bypass in any environment | `services/LoginOtp.js:36-49, 83` | Code | Remove the env vars after review; restrict to one account with an expiry |
| M4 | Delivery app transport and storage | `Deliveryboy/.../AndroidManifest.xml:23,31-32,64-85`, `res/xml/network_security_config.xml` | Cleartext for all hosts, 5 exported activities, `allowBackup=true` with token in SharedPreferences | HTTPS-only release config, `exported=false`, `allowBackup=false` or encrypted storage |
| M5 | Admin past-orders lists unpaginated and silently capped at 2,000 | `controllers/AdminOrders.js:22-90` | 1.6 MB responses locally | Server-side paging |
| M6 | Customer-app network error handling | 20 `body_might_complete_normally_catch_error` in `lib/new/Controllers/*` | `flutter analyze` | Return values from `catchError`, add timeouts, show error states |
| M7 | Missing indexes on hot columns | `Orders.OrderStatus`, `Orders.CreatedAt`, `OrderItems.ProductID`, `Wallets.UserID`, `SearchLogs.UserID` | `information_schema.statistics` | Add indexes (via migration) after checking production sizes |
| M8 | Money stored as FLOAT/DOUBLE | `Wallets.Amount`, `Orders.TipAmount`, `AdminShopToggleSettings.PricePerKm` | `information_schema.columns` | Convert to `DECIMAL(10,2)` |
| M9 | 13 backend test files not in `npm test`, no CI | `Backend/package.json` scripts; `.github/workflows` has only iOS | — | Fold them in or delete them; add a CI job running the suites on a disposable DB |
| M10 | `UserNotifications` growth (~373k rows locally) | DB | — | Retention/cleanup job |
| M11 | Backend dev container listens on all interfaces | `docker-compose.yml:146` | — | Default to 127.0.0.1 |

## Low

| # | Finding | Location |
|---|---|---|
| L1 | Validation before auth on 6 routes (400 instead of 401) | `routes/Categories.js:17`, `SubCategories.js:19`, `AdminProducts.js:17-18`, `PromoCodes.js:20`, `Address.js:14` |
| L2 | `GET /api/users/datatransfer` 501 (xlsx missing, hard-coded server path) | `controllers/Users.js:191-198, 282` |
| L3 | `getroutes` without `Type` returns 200 `"error"`; `byid` branch queries the wrong column | `controllers/DeliveryBoy.js:303-306, 820-836` |
| L4 | `LIMIT NaN` on bad `page` in admin home-sections list | `controllers/AdminHomeSections.js:127-131` |
| L5 | Public Redis test write; health reports internal DB host | `routes/Health.js:103-115` |
| L6 | No Content-Security-Policy on the admin site | `Admin` nginx config |
| L7 | 19 unused tables, `Sales`/`sales` case duplicate, orphan rows (5 orders, 18 variants, 93 cart items, 2 order items) | DB |
| L8 | 89 endpoints with no client; duplicate route spellings | `api_inventory.json` |
| L9 | Admin product search only within the selected category, exact substring | Admin Products page |
| L10 | Backend logs full SQL and result rows | e.g. `controllers/DeliveryBoy.js:317-320`, `Products.js:107` |
| L11 | 123 admin ESLint warnings, 315 Android lint warnings, 79 Flutter warnings | builds |
| L12 | Unpinned `:latest` Docker images | `docker-compose.yml:83,108,126` |
| L13 | No FAQ screen; no rider accept/decline step | product gaps (confirm whether wanted) |

## Functional defects found

**Reproduced:** M1, L2, L3, L4, plus the wallet mismatch (H2).

**Environment (not code) issues found:**
- the local admin container was 12 days stale;
- the browser cached the old admin bundle after the rebuild.
