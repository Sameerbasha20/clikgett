# 16 — Fixes and Re-audit (5 November 2026)

The fixes from `14_CRITICAL_BUGS_AND_RISKS.md` and `15_RECOMMENDED_ACTION_PLAN.md` were implemented. The same checks were then repeated on the same local environment:
- endpoint inventory and probe;
- backend suites;
- admin browser sweep;
- Flutter analyze/test/build;
- Android build/lint;
- database checks.

Items that need the owner (keystores, production access, a phone, Apple secrets) are listed at the end.

## 1. Results before → after

| Check | Before (4 Nov) | After (5 Nov) |
|---|---|---|
| Distinct endpoints | 404 | 403 (2 unsafe legacy endpoints removed, 1 roles endpoint added) |
| Endpoint FAIL | 2 | **0** |
| PASS / BLOCKED / NOT TESTED | 252 / 9 / 141 | 261 / 9 / 133 |
| Protected endpoints refusing calls without a token | 349 / 355 (6 validation-first) | **354 / 354** |
| Wrong-role tokens refused | all but validation-first routes | **all** |
| Backend test files run by `npm test` | 20 (13 never run) | **31** (1 remaining file has no assertions) |
| Backend suites result | 20 pass | **31 pass, 0 fail** |
| Admin pages loading without errors (browser) | 38/38 (after container rebuild) | **39/39** (FAQs editor added), 136 API calls, 0 failures, 0 console errors |
| Admin component tests | 5 pass | 5 pass |
| Flutter analyzer | 0 errors, 79 warnings | **0 errors, 38 warnings** |
| Flutter tests | 43 pass | 43 pass |
| Rider app build / lint | debug OK; lint 0 errors | debug OK; lint 0 errors; release guard verified |
| Legacy plain/MD5 admin passwords | 19 of 21 | **0** |
| Wallet balance ≠ ledger | 9 accounts | **0** (`admin-wallet-check`: Healthy) |
| Orphan cart lines | 93 | **0** |
| FLOAT/DOUBLE money columns | 3 | **0** |
| Unused tables | 19 live | **0 live** (archived as `zz_archived_*`) |
| Hot columns without index | 5 | **0** |

## 2. What was fixed

### High

| # | Finding | Fix | Evidence |
|---|---|---|---|
| H1 | Plain-text / MD5 admin passwords accepted | `utils/password.js` accepts only `scrypt$` and `scrypt-md5$`. The new migration `password_hash_upgrade_migration.js` hashes plain text and wraps MD5 at start-up, so the same passwords keep working. MD5 accounts are upgraded to scrypt at their next login. The dead SQL password check (`Verifylogin`/`adminlogin`) was deleted. | Local DB: 19 rows hashed, 0 left. `test_admin.js`: plain/MD5 refused, hashed works, MD5 upgraded on login. |
| H2 | Wallet ledger mismatches | **Root cause:** admin manual credit/debit read the balance, then wrote an absolute value, so a concurrent order payment could be overwritten. Now it uses one conditional relative `UPDATE` plus the ledger row, and undoes the balance if the ledger write fails. `Backend/scripts/wallet-reconcile.js` (dry run by default, `--apply`) adds one labelled ledger row per mismatched account. Balances are unchanged. | `test_audit_fixes.js`: 10 parallel debits leave balance = ledger ≥ 0. Local reconcile: 9 → 0. All other wallet write paths were traced and write both sides. |
| H3 | Release APKs debug-signed | Both apps: a release build **fails** without `key.properties`, unless `CLIKGETT_ALLOW_DEBUG_SIGNING=true` (test APKs only). | Verified: plain release build refused, flagged build succeeds. **The keystore itself is still needed from the owner.** |

### Medium

| # | Finding | Fix | Evidence |
|---|---|---|---|
| M1 | `GET /api/users/updateproducts` wrote on GET; `datatransfer` broken | Both routes and handlers removed | 404 for both (`test_security_regressions.js`, `test_audit_fixes.js`) |
| M2 | Single all-powerful admin role | `AdminUsers.AdminRole`: `super`, `operations`, `catalog`, `marketing`, `finance` (`utils/adminRoles.js`), enforced in `adminAuthenticate` on every admin request. Existing admins became `super` (no lock-outs). Admin Users page has a role picker; the sidebar shows only allowed pages. A super admin can't demote themselves. | 13 role checks in `test_audit_fixes.js`; browser: a catalog admin sees 9 menu items |
| M3 | Store-review OTP bypass in any environment | Works only for customer logins, and only until `REVIEW_LOGIN_UNTIL` (YYYY-MM-DD). Without a valid future date it's off. | `test_login_security.js`: 24/24 (off without date, off after date, never for riders) |
| M4 | Rider app cleartext, exported screens, backup | Both apps: release = HTTPS-only network config, `usesCleartextTraffic=false`, `allowBackup=false`. Debug builds keep LAN HTTP. Rider internal activities set to `exported=false` (only the launcher stays exported). A rider release build pointing at `http://` is refused. | Merged release manifests inspected for both APKs |
| M5 | Past orders unpaginated, capped at 2,000 | `?page=&pageSize=` with `Total` (max 100 per page). The admin Past tab pages on the server. Calls without `page` keep the old behaviour for older admin builds. | `test_audit_fixes.js` (page 1/2 differ, cap 100, old mode works) |
| M6 | Flutter error handling | 21 `.catchError` chains fixed (typed `.then<void>`). 30-second timeouts on all 24 HTTP clients. 20 unused imports removed. | `flutter analyze`: those warnings gone (79 → 38) |
| M7 | Missing indexes | `db_hardening_migration.js`: `Orders(OrderStatus, CreatedAt)`, `Orders(CreatedAt)`, `OrderItems(ProductID)`, `Wallets(UserID)`, `SearchLogs(UserID)`, `UserNotifications(CreatedAt)` | `information_schema.statistics` |
| M8 | Money in FLOAT/DOUBLE | `Wallets.Amount` DECIMAL(15,2); `Orders.TipAmount`, `PricePerKm` DECIMAL(10,2). The driver returns DECIMAL as numbers (`decimalNumbers: true`). | `information_schema.columns`; all suites pass |
| M9 | 13 test files not run; no CI | 10 legacy files fixed and added to `npm test`: wrong port, real-admin passwords replaced by temporary admins, ETA settings saved and restored, product-request model updated. Two one-off scripts deleted (one held a real admin password and reassigned order 910). `test_buymore_api.js` kept as a manual script (no assertions). New `.github/workflows/ci.yml`: backend syntax and router load, admin tests and build, Flutter analyze (errors) and tests. | `npm test` 31/31 |
| M10 | Notification growth | `services/Housekeeping.js` (daily, batched): read notifications kept 90 days, unread 180 | Code; runs with background jobs |
| M11 | Dev backend on all interfaces | Default bind 127.0.0.1; set `BACKEND_BIND_ADDRESS=0.0.0.0` in `.env` for phone testing on the Wi-Fi | `docker compose config` |

### Low

| # | Fix |
|---|---|
| L1 | Login now runs before validation on the 6 routes. All return 401 without a token. |
| L2 | `datatransfer` removed. |
| L3 | `getroutes` without or with a bad `Type` → 400 "Type must be 'pending' or 'past'". |
| L4 | Home-sections list: a non-numeric `page` no longer breaks the query. |
| L5 | `/health*` hides host, DB name and raw errors in production; the Redis write test returns 404 in production. |
| L6 | Admin site: Content-Security-Policy, nosniff, frame and referrer headers (nginx and `vercel.json`). `index.html` is no-cache, which also fixes stale admin bundles after a deploy. |
| L7 | Orphan cart lines removed. 19 unused tables archived (renamed, data kept). `Sales`/`sales` and 5 orders without a user left as they are (no safe automatic fix). |
| L9 | Admin product search spans all categories and matches words in any order. It also fixed two silent bugs: photo-order search read `res.Product` and product requests read `res.data`, but the API returned `Products`, so both searches always showed nothing; photo-order lines were also missing their price. The API now returns all three keys, with variants. |
| L10 | Production `console.log`/`console.info` silenced unless `VERBOSE_LOGS=true` (warnings and errors still logged). |
| L12 | MinIO and Mailpit pinned by digest. |
| L13 | **FAQ was already implemented.** The `FAQs` setting is shown in Help & support; the original audit missed it. Added an admin **FAQs editor** (groups, questions, order) instead of raw JSON. Rider accept/decline is still a product decision, not built. |

### Other issues found and fixed during the work

- **Checkout ETA ignored Band 2.** The customer delivery estimate used only two bands, so the admin's Band 2 had no effect on checkout. Now all three bands are used, with the same rule as the admin screen and the ops ETA: band 1 below its limit; band 2 up to and including its limit. With the current local settings (5 / 5 km), only a distance of exactly 5.0 km changes (band 2 = 30 min).
- **Test isolation.** `test_audit_regressions.js` changed the 2FA settings of the first real admin. It now uses a temporary admin.

## 3. Re-audit evidence

- **Endpoint probe** (local, 1,300+ requests): `endpoint_test_results.json` (regenerated). No authorized GET returns 5xx. The remaining 4xx are expected:
  - required query parameters;
  - 404 for image ids that don't exist;
  - 403 rider-ownership check;
  - 403 expired media link.
- **Suites:** `API_URL=http://127.0.0.1:5001/api npm test` → exit 0.
  - **476 checks** in the 19 suites that print a total;
  - 12 further suites passing their own checks: demo OTP 60, audit regressions 34, distance ETA/2FA/referral 33, delivery assignment 20, dynamic home sections 12, customer requests 11, product requests 9, photo orders, buy-more, delay/serviceability, post-delivery feedback, ETA sync.
- **Admin browser sweep** on the current build `main.9f04b5cd.js`: 39 pages, 0 redirects, 0 failed calls, 0 console errors. Response headers: CSP present, `Cache-Control: no-cache`. A catalog-role admin sees Dashboard, Products, Stock, Out of stock, Categories, Sub categories, Bulk price update, Home Sections, Banners.
- **Builds:**
  - customer APK (Render, test-signed with the explicit flag) 95.7 MB;
  - rider APK (Render, test-signed) 15.1 MB;
  - both copied to `RENDER_APKS/`.

## 4. Updated scorecard

Same method as `13_PROJECT_COMPLETION_SCORECARD.md`. The two removed endpoints are no longer features; 7 features were added for the new capabilities.

| Area | Features | Implemented % (before → after) | Verified % (before → after) |
|---|---|---|---|
| Backend | 56 | 95% → **100%** | 61% → **73%** |
| Admin website | 40 | 97% → **100%** | 15% → **18%** |
| Customer app | 29 | 93% → **98%** | 0% → **0%** (device testing still blocked) |
| Delivery app | 13 | 92% → **92%** | 8% → **15%** |
| Database & integrations | 11 | 75% → **95%** | 50% → **82%** |
| Security | 12 | 75% → **100%** | 50% → **92%** |
| Testing & automation | 9 | 28% → **39%** | 11% → **22%** |
| Deployment readiness | 10 | 55% → **60%** | 30% → **30%** |
| **Overall** | **180** | 87% → **94%** | 31% → **42%** |

## 5. Still open: needs the owner

| Item | Why I couldn't do it |
|---|---|
| Android upload keystores (`key.properties`) for both apps | Only the owner has the original Play upload keys |
| Device test pass of both apps (05 §7, 06 §3) and Razorpay test-mode payments | No phone connected; needs someone at a device |
| Admin create/edit/delete click-through | Writes to the database and opens confirm dialogs; should be run with a disposable DB or by a person |
| Production schema comparison, migration rehearsal, server replacement, bare-domain certificate | Needs approved access to AWS/RDS |
| iOS TestFlight build | Apple API key and Maps key secrets in GitHub |
| Run `Backend/scripts/wallet-reconcile.js` on staging/production | Run the dry run first and review it; it adds ledger rows to real accounts |
| Rider accept/decline step | Product decision |
| Database foreign keys on core tables; 5 orders without a user | Adding FKs to live tables needs a reviewed migration window |
| 123 admin ESLint warnings, 317 rider lint warnings, 38 Flutter warnings | Style/unused code. 38 are `==` vs `===` in admin, where switching blindly could change behaviour; best done with UI tests in place |

## 6. Things that behave differently now

- **Test APK builds:** test release APKs need `CLIKGETT_ALLOW_DEBUG_SIGNING=true` (both apps). The rider app also needs `-PapiBaseUrl=https://…` (or `CLIKGETT_ALLOW_CLEARTEXT=true` for a LAN test build).
- **Dev backend:** listens on 127.0.0.1 only; set `BACKEND_BIND_ADDRESS=0.0.0.0` to test phones against the PC.
- **Store-review login:** needs `REVIEW_LOGIN_UNTIL=YYYY-MM-DD` in addition to the existing two variables.
- **New admins:** default to the **Operations** role. Existing admins are Super.
- **First start of the new backend on any database** (Render/Aiven, production) runs the migrations:
  - passwords hashed;
  - indexes added;
  - money columns converted;
  - orphan cart lines removed;
  - 19 unused tables renamed to `zz_archived_*` (rename back to restore).
