# 11 — Build and Test Results

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

All commands ran on the developer PC (Windows 11, Git Bash) against the local Docker stack on 4 Nov 2026, at commit `b519e92`. No source code was changed to make anything pass.

## Backend

| Command | Exit | Result |
|---|---|---|
| `API_URL=http://127.0.0.1:5001/api npm test` (in `Backend/`) | **0** | 20 suites, **452 checks passed, 0 failed, 0 skipped** |
| Linting | — | No ESLint config or lint script in `Backend/package.json`: **not available** |
| Dependency status | — | `node_modules` present; `xlsx` missing (needed by `/api/users/datatransfer`) |

Per suite (in `npm test` order):

| Suite | Checks |
|---|---|
| test_security_regressions | 28 |
| test_login_security | 21 |
| test_product_actions | 28 |
| test_order_flow | 23 |
| test_checkout | 39 |
| test_flash_sale | 14 |
| test_promotions | 24 |
| test_account | 12 |
| test_admin | 26 |
| test_features | 16 |
| test_cashback_review | 17 |
| test_print_store | 17 |
| test_stock_and_deals | 21 |
| test_qa_bug_fixes | 45 |
| test_refresh_tokens | 21 |
| test_doorstep_upi | 15 |
| test_customer_rewards | 27 |
| test_order_safety | 34 |
| test_eta_sync_e2e | 4 |
| test_delivery_assignment_workflow | 20 |
| **Total** | **452** |

**Test files not run by `npm test`** (13; not run in this audit because their data cleanup isn't known):
- `test_admin_regression.js`
- `test_audit_regressions.js`
- `test_buymore_api.js`
- `test_buymore_e2e.js`
- `test_customer_requests_and_enquiries.js`
- `test_delay_and_serviceability.js`
- `test_demo_otp.js`
- `test_dynamic_home_sections.js`
- `test_four_features.js`
- `test_order_910_real_session.js`
- `test_photo_orders_e2e.js`
- `test_post_delivery_feedback_and_cashback.js`
- `test_product_requests_and_search.js`

**Audit endpoint probe** (read-only GETs plus unauthenticated/wrong-role requests; script kept outside the repo): 404 distinct endpoints, 1,300+ requests. Results in `endpoint_test_results.json`. The suites and the probe create and remove their own test rows in the local DB. One side effect of the probe: the GET `/api/users/updateproducts` rewrote 428 rows with identical values (03 §4.1).

## Admin

| Command | Exit | Result |
|---|---|---|
| `CI=false npx react-scripts build` | **0** | Compiled with warnings: **123 ESLint warnings** (62 `no-unused-vars`, 38 `eqeqeq`, 21 `react-hooks/exhaustive-deps`, 2 `unicode-bom`), 0 errors. Main bundle 1.74 MB uncompressed. |
| `CI=true npx react-scripts test --watchAll=false` | **0** | 3 suites (`App.test.js`, `Login.test.jsx`, `usePagedList.test.jsx`), **5 tests passed, 0 failed**. No tests for any dashboard module. |
| Browser tests | manual-scripted | 38/38 pages load on the current build; 129 API calls, 0 failures; 0 console errors; 5 interaction checks (see 04) |

## Customer app (Flutter)

| Command | Exit | Result |
|---|---|---|
| `flutter analyze lib` | 1 (issues found) | 624 issues: **0 errors, 79 warnings, 545 infos** |
| `flutter test` | **0** | **43 passed, 0 failed, 0 skipped** (8 test files) |
| `flutter build apk --release --dart-define=API_BASE_URL=… --dart-define=GOOGLE_PLACES_KEY=…` | 0 | Built earlier in this session from the same commit: 95.7 MB universal APK, **debug-signed** (no `key.properties`) |
| Debug build | — | Not run separately (the release build compiles the same code) |
| iOS | — | **BLOCKED**: requires macOS; the GitHub Actions workflow needs Apple secrets |

## Delivery app (Android)

| Command | Exit | Result |
|---|---|---|
| `./gradlew.bat testDebugUnitTest assembleDebug lintDebug --console=plain` | **0** | BUILD SUCCESSFUL in 2 m 56 s |
| Unit tests | | 1 (template) passed, 0 failed, 0 skipped |
| `assembleDebug` | | `app-debug.apk` 17.8 MB |
| Lint | | **0 errors, 315 warnings** (129 UnusedResources, 53 HardcodedText, …) |
| Compiler | | 3 javac warnings (obsolete options, deprecation) |
| `assembleRelease` | not run | Would be debug-signed (no `key.properties`) |
| Instrumented / device tests | — | **BLOCKED** (no device) |

## Summary

| Area | Automated tests | Passed | Failed | Skipped / blocked |
|---|---|---|---|---|
| Backend API suites | 452 | 452 | 0 | 13 files not in the run |
| Customer app unit/widget | 43 | 43 | 0 | device tests BLOCKED |
| Delivery app | 1 (template) | 1 | 0 | device tests BLOCKED |
| Admin component tests | 5 | 5 | 0 | browser sweep done (38 pages); no module tests |

A successful build or a passing suite is not proof that the screens work. Device-level and click-through UI verification remain open (see 13 and 15).
