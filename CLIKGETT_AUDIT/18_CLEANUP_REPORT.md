# 18 · Code clean-up report (11 November 2026)

**What was removed and why, item by item.** Rule used: an item is removed only when nothing in the current build uses it: the admin site (`Admin/src`), the customer app (`Flutter/UserApp/lib`), the rider app (`Flutter/Deliveryboy`), the backend itself (server, startup migrations, tests, scripts in `package.json`), Docker/Render/CI files, or the docs. Old app versions no longer count (no active users; the live server is being replaced).

**How it was checked.**
- Backend routes: every route listed from the running code, matched against every URL the three clients call; each candidate then searched by hand. One URL built in code (`invoice/:id/link`, the receipt's "Open in browser") was caught by the tests and restored.
- Files: import/require graphs from each entry point (`server.js`, `src/index.js`, `lib/main.dart`), then every deleted file name searched across the whole repo.
- After removal: 711 backend checks, 46 customer-app tests, 5 admin tests, rider unit tests + lint, and all four builds pass.

| | Count |
|---|---|
| Files deleted | 314 |
| Backend routes removed | 65 (66 found, 1 restored) |
| Extra URL prefixes removed | 5 |
| Backend functions removed | 31 (+1 file) |
| Packages removed | 10 admin, 14 customer app, 9 rider app |
| Lines of code removed | about 56,000 |

## 1. Deleted files

### Admin/src (12)

| File | Why it was removed |
|---|---|
| `Admin/src/Assets/Delete.svg` | Image never imported by any admin page (admin import graph from `src/index.js`). |
| `Admin/src/Assets/Edit.svg` | Image never imported by any admin page (admin import graph from `src/index.js`). |
| `Admin/src/Assets/icon_cat.png` | Image never imported by any admin page (admin import graph from `src/index.js`). |
| `Admin/src/Assets/log.webp` | Image never imported by any admin page (admin import graph from `src/index.js`). |
| `Admin/src/Assets/login/forgotpassword.jpeg` | Image never imported by any admin page (admin import graph from `src/index.js`). |
| `Admin/src/Assets/login/rice hub.png` | Image never imported by any admin page (admin import graph from `src/index.js`). |
| `Admin/src/Assets/logo.png` | Image never imported by any admin page (admin import graph from `src/index.js`). |
| `Admin/src/Assets/logo_dashboard.png` | Image never imported by any admin page (admin import graph from `src/index.js`). |
| `Admin/src/Assets/ricehub.png` | Image never imported by any admin page (admin import graph from `src/index.js`). |
| `Admin/src/logo.png` | Create-React-App sample logo, never imported. The site icon is `public/logo.png` (kept). |
| `Admin/src/logo.svg` | Create-React-App sample logo, never imported. The site icon is `public/logo.png` (kept). |
| `Admin/src/s3Config.js` | Old S3 config stub (bucket name only), imported nowhere. Uploads go through the backend (`Services.uploadFile`). |

### Backend/images (1)

| File | Why it was removed |
|---|---|
| `Backend/images/1791785077277_20.png` | Stray test upload committed by mistake. Not referenced by any code. |

### Backend/scripts (59)

| File | Why it was removed |
|---|---|
| `Backend/scripts/checks/check_activity_ts.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_categories.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_counts.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_db.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_db_basic.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_fruit_categories.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_orders_schema.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_retention_and_abandoned.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_schema_3a.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_shop_settings.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_table.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/check_unlocks.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/describe_all.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/inspect_abandoned_state.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/inspect_business_schema.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/inspect_buymore.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/checks/inspect_cart_items.js` | Old read-only database inspection script written during development. Not run by the server, the tests, package.json, Docker, CI or any doc. |
| `Backend/scripts/db-one-offs/alter_restrictions_varchar.js` | Old one-time database change, already applied. Marked "do not re-run on live"; the release uses `schema_sync.js` and `release_setup.js` instead. Not referenced anywhere. |
| `Backend/scripts/db-one-offs/migrate.js` | Old one-time database change, already applied. Marked "do not re-run on live"; the release uses `schema_sync.js` and `release_setup.js` instead. Not referenced anywhere. |
| `Backend/scripts/db-one-offs/migrate_order_item_removals.js` | Old one-time database change, already applied. Marked "do not re-run on live"; the release uses `schema_sync.js` and `release_setup.js` instead. Not referenced anywhere. |
| `Backend/scripts/db-one-offs/run_migrations_safe.js` | Old one-time database change, already applied. Marked "do not re-run on live"; the release uses `schema_sync.js` and `release_setup.js` instead. Not referenced anywhere. |
| `Backend/scripts/db-one-offs/setup_membership_pricing.js` | Old one-time database change, already applied. Marked "do not re-run on live"; the release uses `schema_sync.js` and `release_setup.js` instead. Not referenced anywhere. |
| `Backend/scripts/endpoint-audit/api_inventory_result.json` | Old endpoint-audit tool and its output (replaced by the audits in `CLIKGETT_AUDIT/`). Not referenced anywhere. |
| `Backend/scripts/endpoint-audit/audit_admin_views.js` | Old endpoint-audit tool and its output (replaced by the audits in `CLIKGETT_AUDIT/`). Not referenced anywhere. |
| `Backend/scripts/endpoint-audit/audit_real_admin_views.js` | Old endpoint-audit tool and its output (replaced by the audits in `CLIKGETT_AUDIT/`). Not referenced anywhere. |
| `Backend/scripts/endpoint-audit/build_authoritative_inventory.js` | Old endpoint-audit tool and its output (replaced by the audits in `CLIKGETT_AUDIT/`). Not referenced anywhere. |
| `Backend/scripts/endpoint-audit/compile_final_audit.js` | Old endpoint-audit tool and its output (replaced by the audits in `CLIKGETT_AUDIT/`). Not referenced anywhere. |
| `Backend/scripts/endpoint-audit/exhaustive_endpoint_audit.js` | Old endpoint-audit tool and its output (replaced by the audits in `CLIKGETT_AUDIT/`). Not referenced anywhere. |
| `Backend/scripts/endpoint-audit/reconcile_audit_with_evidence.js` | Old endpoint-audit tool and its output (replaced by the audits in `CLIKGETT_AUDIT/`). Not referenced anywhere. |
| `Backend/scripts/endpoint-audit/route_inventory_and_test.js` | Old endpoint-audit tool and its output (replaced by the audits in `CLIKGETT_AUDIT/`). Not referenced anywhere. |
| `Backend/scripts/verify/audit_order_adjustments.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/audit_wallet_expiry.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/comprehensive_e2e_abandoned_8h_test.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/run_master_e2e_validation.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/test_abandoned_query.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/test_auth_query.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/test_joined.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/test_perf.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/test_recovery_queries.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/test_sync_abandoned.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/test_user_app_runtime_endpoints.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_3a_apis.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_abandoned_8h_boundary.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_all_blocked_features.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_all_requirements.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_business_engine.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_business_rules_and_cancellation.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_delivery_operations.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_fruit_timer.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_order_item_removal.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_product_flash_sale_integration.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_product_membership_pricing_integration.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_product_restrictions_integration.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_retention_and_feedback.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_sales_e2e.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_scheduled_orders.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_search_unlock_eta.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_unified_product_editor_and_dynamic_plans.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |
| `Backend/scripts/verify/verify_user_sale_whatsapp_integration.js` | Old one-time verification script for a past feature. Not part of `npm test`; superseded by `server/tests/` (711 automated checks). Not referenced anywhere. |

### Backend/server (2)

| File | Why it was removed |
|---|---|
| `Backend/server/controllers/NotificationMessages.js` | Held one leftover template copied from another product ("learn2Read"). No file required it. |
| `Backend/server/tests/test_buymore_api.js` | Old mock-based test, not in `npm test`. Buy-more is covered by `test_buymore_e2e.js` (in the suite). |

### Flutter/Deliveryboy/app (161)

| File | Why it was removed |
|---|---|
| `Flutter/Deliveryboy/app/src/main/res/anim/slide_in_bottom.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/anim/slide_in_left.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/anim/slide_in_right.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/anim/slide_out_bottom.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable-v24/ic_launcher_foreground.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/bg_driver_card.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/bg_rounded_12.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/bottom_spl.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/btn_delay_selector.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/btn_issue_selector.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/btn_outline_selector.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/buttonbg.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/calendar_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/call_24.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/callbackfrombg.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/dot_default.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/dot_selected.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/ic_baseline_call_24.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/ic_channel_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/ic_email.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/ic_launcher_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/ic_launcher_foreground.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/login_circle.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/loginmiddle_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/logout_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/logout_menu_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/navigation_header.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/orderamount_bg.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/orderid_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/orders_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/orders_menu_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/orderslist_bg.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/paymentmethode_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/profile_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/spl.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/splash_bg.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/splash_screen_belowicon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/splash_screen_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/splashscreenbelow.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/status_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/status_menu_icon_background.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/tab_bg.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/tab_bg_color.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/tab_selector.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/unselect.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/drawable/verticalline.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/calendar_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/ic_channel.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/loginmiddle.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/logout_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/logout_menu_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/logout_menu_icon_round.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/orderid_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/orders_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/orders_menu_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/paymentmethode_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/profile_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/splash_screen_belowicon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/splash_screen_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/status_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-anydpi-v26/status_menu_icon.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/below_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/calendar_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/ic_launcher.webp` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/ic_launcher_round.webp` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/loginicon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/loginmiddle_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/logintop_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/logout_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/logout_menu_icon.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/logout_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/logout_menu_icon_round.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/orderid_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/orders_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/orders_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/paymentmethode_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/splash_screen_belowicon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/splash_screen_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/status_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-hdpi/status_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/below_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/calendar_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/ic_launcher.webp` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/ic_launcher_round.webp` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/loginicon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/loginmiddle_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/logintop_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/logout_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/logout_menu_icon.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/logout_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/logout_menu_icon_round.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/orderid_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/orders_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/orders_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/paymentmethode_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/splash_screen_belowicon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/splash_screen_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/status_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-mdpi/status_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/below_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/below_splash_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/calendar_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/ic_launcher.webp` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/ic_launcher_round.webp` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/loginicon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/loginmiddle_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/logintop_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/logout_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/logout_menu_icon.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/logout_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/logout_menu_icon_round.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/orderid_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/orders_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/orders_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/paymentmethode_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/splash_screen_belowicon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/splash_screen_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/status_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xhdpi/status_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/below_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/calendar_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/ic_launcher.webp` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.webp` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/loginicon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/loginmiddle_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/logintop_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/logout_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/logout_menu_icon.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/logout_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/logout_menu_icon_round.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/orderid_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/orders_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/orders_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/paymentmethode_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/splash_screen_belowicon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/splash_screen_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/status_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxhdpi/status_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/below_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/calendar_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/ic_launcher.webp` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.webp` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/loginicon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/loginmiddle_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/logintop_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/logout_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/logout_menu_icon.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/logout_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/logout_menu_icon_round.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/orderid_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/orders_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/orders_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/paymentmethode_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/splash_screen_belowicon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/splash_screen_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/status_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/mipmap-xxxhdpi/status_menu_icon_foreground.png` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/xml/backup_rules.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |
| `Flutter/Deliveryboy/app/src/main/res/xml/data_extraction_rules.xml` | Android resource that Android lint reports unused, and whose name appears nowhere in the rider app code, layouts, manifest or Gradle files. |

### Flutter/UserApp/.run (1)

| File | Why it was removed |
|---|---|
| `Flutter/UserApp/.run/main.dart.run.xml` | Android Studio run configuration of one developer machine. |

### Flutter/UserApp/Assets (42)

| File | Why it was removed |
|---|---|
| `Flutter/UserApp/Assets/Images/Auth/oilsvegiees.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/COCO.svg` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/Category.svg` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/Home.svg` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/animation.json` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/animation.lottie` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/animation2.gif` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/cart.svg` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/cart/confirmation.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/cart/down.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/location.svg` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/location2.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/online.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/Homepage/packing.json` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/categories/cereals.svg` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/categories/fruits.svg` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/categories/grains.svg` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/categories/vegtables.svg` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/clickgetBag.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/combosSelecctedIcon.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/combosUnselectedIcon.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/emptyCart.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_account_selected.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_accounttab.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_basket.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_categorytab.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_hometab.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_hometab_unselected.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_logo.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_logo_bottom.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_logo_homepage.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_menu.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_notification.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_offer_selected.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_offertab.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/fav_App_offertab_select.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/favmall_edit.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/orderSuccess.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/profile/refer.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/propic.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/recentIcon.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |
| `Flutter/UserApp/Assets/Images/support/chat.png` | Image/animation not referenced by any reachable screen, pubspec entry, Android or iOS file. |

### Flutter/UserApp/lib (10)

| File | Why it was removed |
|---|---|
| `Flutter/UserApp/lib/Models/Home/cart_model.dart` | Duplicate of `lib/old/Models/Home/cart_model.dart` (the one the app imports). |
| `Flutter/UserApp/lib/firebase_options.dart` | Generated Firebase options; only mentioned in commented-out code. Firebase starts from `google-services.json` / `GoogleService-Info.plist`. |
| `Flutter/UserApp/lib/new/NewScreens/Account/CreateProfile.dart` | Old create-profile screen; only mentioned in commented-out code. Sign-up takes the name on the sign-up screen. |
| `Flutter/UserApp/lib/new/NewScreens/Auth/LoginIntro.dart` | Old login intro screen; no screen navigates to it. |
| `Flutter/UserApp/lib/new/NewScreens/Homepage/widgets/analogedTimer.dart` | Dart file not reachable from `lib/main.dart` (no import path leads to it). |
| `Flutter/UserApp/lib/new/NewScreens/location/enteraddress.dart` | Old address form whose "Confirm" saved nothing. The real address forms are `Address/AddAddress.dart` and `EditAddress.dart`. |
| `Flutter/UserApp/lib/new/NewScreens/location/grantlocation.dart` | Old "Grant location" step after sign-up. Removed from the flow on request (location is now asked at checkout), so nothing opens it. |
| `Flutter/UserApp/lib/old/Constants/customMediaQuery.dart` | Helper only used by the old order-placed screen, which was rewritten. |
| `Flutter/UserApp/lib/old/Constants/textfield.dart` | Dart file not reachable from `lib/main.dart` (no import path leads to it). |
| `Flutter/UserApp/lib/old/Screens/Auth_Screens/login_Screens.dart` | Old login screen; replaced by `new/NewScreens/Auth/Login.dart`. |

### Flutter/UserApp/web (7)

| File | Why it was removed |
|---|---|
| `Flutter/UserApp/web/favicon.png` | Flutter web build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/web/icons/Icon-192.png` | Flutter web build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/web/icons/Icon-512.png` | Flutter web build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/web/icons/Icon-maskable-192.png` | Flutter web build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/web/icons/Icon-maskable-512.png` | Flutter web build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/web/index.html` | Flutter web build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/web/manifest.json` | Flutter web build files. The customer app ships only on Android and iOS. |

### Flutter/UserApp/windows (18)

| File | Why it was removed |
|---|---|
| `Flutter/UserApp/windows/.gitignore` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/CMakeLists.txt` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/flutter/CMakeLists.txt` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/flutter/generated_plugin_registrant.cc` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/flutter/generated_plugin_registrant.h` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/flutter/generated_plugins.cmake` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/CMakeLists.txt` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/Runner.rc` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/flutter_window.cpp` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/flutter_window.h` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/main.cpp` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/resource.h` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/resources/app_icon.ico` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/runner.exe.manifest` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/utils.cpp` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/utils.h` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/win32_window.cpp` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |
| `Flutter/UserApp/windows/runner/win32_window.h` | Flutter Windows desktop build files. The customer app ships only on Android and iOS. |

### docker/postgres (1)

| File | Why it was removed |
|---|---|
| `docker/postgres/init.sql` | PostgreSQL schema for a "planned migration" that never happened. The backend only uses MySQL; the container was removed from docker-compose. |

## 2. Backend routes removed

Each one is a route no current screen calls. Where the feature still exists, the screen uses another route (right column).

| Route file | Method and path | What the clients use instead |
|---|---|---|
| Address.js | `GET /api/address/byaddressid/:AddressID` | No admin page, customer-app or rider-app screen calls it |
| Address.js | `POST /api/address/checkserviceability` | No admin page, customer-app or rider-app screen calls it |
| AdminHomeSections.js | `GET /api/home-sections/admin` | Admin uses `admin-home-sections/sections/...` |
| AdminHomeSections.js | `POST /api/home-sections/admin` | Admin uses `admin-home-sections/sections/...` |
| AdminHomeSections.js | `GET /api/home-sections/admin/:SectionID` | Admin uses `admin-home-sections/sections/...` |
| AdminHomeSections.js | `PUT /api/home-sections/admin/:SectionID` | Admin uses `admin-home-sections/sections/...` |
| AdminHomeSections.js | `DELETE /api/home-sections/admin/:SectionID` | Admin uses `admin-home-sections/sections/...` |
| AdminHomeSections.js | `POST /api/home-sections/admin/:SectionID/duplicate` | Admin uses `admin-home-sections/sections/...` |
| AdminHomeSections.js | `PATCH /api/home-sections/admin/:SectionID/status` | Admin uses `admin-home-sections/sections/...` |
| AdminHomeSections.js | `PUT /api/home-sections/admin/:SectionID/status` | Admin uses `admin-home-sections/sections/...` |
| AdminHomeSections.js | `PUT /api/home-sections/admin/reorder` | Admin uses `admin-home-sections/sections/...` |
| AdminHomeSections.js | `POST /api/home-sections/admin/reorder` | Admin uses `admin-home-sections/sections/...` |
| AdminHomeSections.js | `GET /api/home-sections/category-options` | Admin uses `admin-home-sections/sections/category-options` |
| AdminHomeSections.js | `GET /api/home-sections/product-options` | Admin uses `admin-home-sections/sections/product-options` |
| AdminOrders.js | `GET /api/adminorders/currentorders/sort` | Admin uses `adminorders/currentorders` |
| AdminOrders.js | `GET /api/adminorders/currentorderssort` | Admin uses `adminorders/currentorders` |
| AdminOrders.js | `GET /api/adminorders/orderdetail/timeline/:OrderID` | Admin uses `adminorders/ordertimeline/:id` |
| AdminOrders.js | `DELETE /api/adminorders/orders/:OrderID/items/:OrderItemID` | Admin uses `adminorders/remove-item` |
| AdminOrders.js | `GET /api/adminorders/pastorders/filter` | Admin uses `adminorders/pastorders` (paged list) |
| AdminOrders.js | `GET /api/adminorders/pastorders/mobilefilter` | Admin uses `adminorders/pastorders` (paged list) |
| AdminOrders.js | `GET /api/adminorders/pastorders/orderidfilter` | Admin uses `adminorders/pastorders` (paged list) |
| AdminOrders.js | `GET /api/adminorders/pastorders/sort` | Admin uses `adminorders/pastorders` (paged list) |
| AdminOrders.js | `GET /api/adminorders/pastorders/usernamefilter` | Admin uses `adminorders/pastorders` (paged list) |
| AdminOrders.js | `GET /api/adminorders/pastordersfilter` | Admin uses `adminorders/pastorders` (paged list) |
| AdminOrders.js | `GET /api/adminorders/pastordersmobilefilter` | Admin uses `adminorders/pastorders` (paged list) |
| AdminOrders.js | `GET /api/adminorders/pastordersorderidfilter` | Admin uses `adminorders/pastorders` (paged list) |
| AdminOrders.js | `GET /api/adminorders/pastorderssort` | Admin uses `adminorders/pastorders` (paged list) |
| AdminOrders.js | `GET /api/adminorders/pastordersusernamefilter` | Admin uses `adminorders/pastorders` (paged list) |
| AdminOrders.js | `GET /api/adminorders/scheduledorders` | No admin page, customer-app or rider-app screen calls it |
| AdminProducts.js | `GET /api/adminproducts/buy-more-config` | Admin uses `buymore/tiers...` |
| AdminProducts.js | `PUT /api/adminproducts/buy-more-config/:ConfigID` | Admin uses `buymore/tiers...` |
| AdminProducts.js | `DELETE /api/adminproducts/buy-more-config/:ConfigID` | Admin uses `buymore/tiers...` |
| AdminProducts.js | `GET /api/adminproducts/bysubcategory` | No admin page, customer-app or rider-app screen calls it |
| AdminUsers.js | `GET /api/adminuser/adminlist` | No admin page, customer-app or rider-app screen calls it |
| AdminUsers.js | `GET /api/adminuser/feedbackdetail/:FeedbackID` | Admin feedback page uses `adminuser/feedback/...` routes still in use |
| AdminUsers.js | `GET /api/adminuser/feedbacklist` | Admin feedback page uses `adminuser/feedback/...` routes still in use |
| AdminUsers.js | `GET /api/adminuser/getactivedeliveryboys` | No admin page, customer-app or rider-app screen calls it |
| AdminUsers.js | `PUT /api/adminuser/updateuser/:UserID` | Admin uses `adminuser/user/update/:id` (same handler) |
| BuyMore.js | `PUT /api/buymore/tiers/status/:ID` | No admin page, customer-app or rider-app screen calls it |
| CartOffers.js | `PUT /api/cartoffers/offers/status/:OfferID` | No admin page, customer-app or rider-app screen calls it |
| Carts.js | `GET /api/carts/abandoned` | No admin page, customer-app or rider-app screen calls it |
| Categories.js | `GET /api/categories/subcategorydetail/:SubCategoryID` | No admin page, customer-app or rider-app screen calls it |
| Categories.js | `GET /api/categories/websubcategories` | No admin page, customer-app or rider-app screen calls it |
| CustomerRequests.js | `GET /api/customer/enquiries/image/:id` | Admin views photos via `admin/customer-enquiries/image/:id` and `admin/product-requests/image/:id`; customers never view them |
| CustomerRequests.js | `GET /api/customer/product-requests/image/:id` | Admin views photos via `admin/customer-enquiries/image/:id` and `admin/product-requests/image/:id`; customers never view them |
| DeliveryBoy.js | `GET /api/deliveryboy/ordersbyroute` | Rider app uses `deliveryboy/getroutes?Type=...` |
| DeliveryBoy.js | `GET /api/deliveryboy/orderstatus` | Rider app uses `deliveryboy/updatestatus/:id` |
| DeliveryBoy.js | `PUT /api/deliveryboy/update/:AdminID` | No admin page, customer-app or rider-app screen calls it |
| DeliveryBoy.js | `POST /api/deliveryboy/verifyotp_order` | Rider app delivers in one step: `deliveryboy/deliver/:id` with the OTP |
| Membership.js | `DELETE /api/membership/product/:productId/:planId` | Admin uses `membership/product/save` and `membership/product/delete` |
| Membership.js | `POST /api/membership/save-product-pricing` | Admin uses `membership/product/save` and `membership/product/delete` |
| Orders.js | `GET /api/orders/orderstatus/:OrderID` | No admin page, customer-app or rider-app screen calls it |
| ProductRestrictions.js | `POST /api/restrictions/restrictions/save-product-restrictions` | Admin uses `restrictions/save-product-restrictions` (same handler, other spelling) |
| ProductUnlocks.js | `GET /api/product-unlocks/admin` | Admin uses `product-unlocks/unlocks` |
| ProductUnlocks.js | `POST /api/product-unlocks/admin` | Admin uses `product-unlocks/unlocks` |
| ProductUnlocks.js | `GET /api/product-unlocks/list` | Admin uses `product-unlocks/unlocks` |
| Products.js | `GET /api/products/weblist` | No admin page, customer-app or rider-app screen calls it |
| Rewards.js | `GET /api/rewards/milestones` | Admin uses `milestones/config`; the app gets milestones from `rewards/...` routes still in use |
| Rewards.js | `GET /api/rewards/myRewards` | Admin uses `milestones/config`; the app gets milestones from `rewards/...` routes still in use |
| SearchAnalytics.js | `GET /api/search-analytics/admin` | No admin page, customer-app or rider-app screen calls it |
| SubCategories.js | `PUT /api/subcategories/admin/reorder` | Admin uses `subcategories/reorder` |
| SubCategories.js | `POST /api/subcategories/admin/reorder` | Admin uses `subcategories/reorder` |
| Users.js | `GET /api/users/feedback/order-status/:orderId` | App uses `users/feedback/eligibility/:id` |
| Users.js | `GET /api/users/homepagesectionproducts` | App uses `users/homepagesectionproducts_all/:id` |
| Users.js | `GET /api/users/webhomepage` | No admin page, customer-app or rider-app screen calls it |

**Restored after testing:** `GET /api/orders/invoice/:OrderID/link`. The receipt screen builds this address in code (`pdfUrl + "/link"`) for "Open in browser", so the scan missed it; the invoice tests caught it.

## 3. Extra URL prefixes removed (`server.js`)

The same router was reachable under a second prefix that no client uses. The used prefix stays.

| Removed prefix | Router | Prefix the clients use (kept) |
|---|---|---|
| `/api/membershipplans` | Membership | `/api/membership` |
| `/api/home-sections` | AdminHomeSections | `/api/admin-home-sections` |
| `/api/cashback-admin` | CashbackAdmin | `/api/cashback` |
| `/api/admin/delivery` | AdminOrders | `/api/adminorders` |
| `/api/admin` | AdminUsers | `/api/adminuser`, `/api/adminusers` |

Admin permission rules (`utils/adminRoles.js`) were updated to drop the removed prefixes.

## 4. Backend functions removed

| Controller | Function | Why |
|---|---|---|
| Address.js | `getaddressbyaddressid` | Only called by a route that was removed (see section 2); nothing else calls it. |
| AdminOrders.js | `assignordertodeliveryboy` | Only called by a route that was removed (see section 2); nothing else calls it. |
| AdminOrders.js | `pendingorders` | Only called by a route that was removed (see section 2); nothing else calls it. |
| AdminProducts.js | `productsbysubcategory_admin` | Only called by a route that was removed (see section 2); nothing else calls it. |
| AdminProducts.js | `allKits` | Only called by a route that was removed (see section 2); nothing else calls it. |
| AdminProducts.js | `kitdetail` | Old "kits" (combo packs) feature: no screen, no route left, no table in use. |
| AdminProducts.js | `addkit` | Old "kits" (combo packs) feature: no screen, no route left, no table in use. |
| AdminProducts.js | `updatekit` | Old "kits" (combo packs) feature: no screen, no route left, no table in use. |
| AdminProducts.js | `addkititem` | Old "kits" (combo packs) feature: no screen, no route left, no table in use. |
| AdminProducts.js | `updatekititems` | Old "kits" (combo packs) feature: no screen, no route left, no table in use. |
| AdminProducts.js | `deletekititem` | Old "kits" (combo packs) feature: no screen, no route left, no table in use. |
| AdminProducts.js | `addRecommendedProducts` | Old recommended-products admin calls; no route left (recommendations are computed). |
| AdminProducts.js | `delete_RecommendedProducts` | Old recommended-products admin calls; no route left (recommendations are computed). |
| AdminUsers.js | `getactivedeliveryboys` | Only called by a route that was removed (see section 2); nothing else calls it. |
| AdminUsers.js | `creditDebitWallet_old` | Replaced by the atomic `creditDebitWallet` (Nov 2026 audit); nothing called the old one. |
| AdminUsers.js | `notifyproducts` | Old "notify me when back in stock" admin feature with no admin page and no route left. |
| AdminUsers.js | `notifyproductupdate` | Old "notify me when back in stock" admin feature with no admin page and no route left. |
| AdminUsers.js | `notifyproductdetail` | Old "notify me when back in stock" admin feature with no admin page and no route left. |
| AdminUsers.js | `triggernotifyproduct` | Old "notify me when back in stock" admin feature with no admin page and no route left. |
| Categories.js | `SubcategoryDetail` | Only called by a route that was removed (see section 2); nothing else calls it. |
| DeliveryBoy.js | `getdeliveryboydetail` | Only called by a route that was removed (see section 2); nothing else calls it. |
| DeliveryBoy.js | `Orders_VerifyOTP` | Only called by a route that was removed (see section 2); nothing else calls it. |
| DeliveryBoy.js | `ordersbyroute` | Only called by a route that was removed (see section 2); nothing else calls it. |
| DeliveryBoy.js | `updatedeliveryboy` | Only called by a route that was removed (see section 2); nothing else calls it. |
| DeliveryBoy.js | `orderstatus` | Only called by a route that was removed (see section 2); nothing else calls it. |
| Orders.js | `getOrderStatus` | Only called by a route that was removed (see section 2); nothing else calls it. |
| Productcsv.js | `warehousedetails` | Only called by a route that was removed (see section 2); nothing else calls it. |
| Products.js | `kits` | Old "kits" (combo packs) feature: no screen, no route left, no table in use. |
| Products.js | `allKits` | Only called by a route that was removed (see section 2); nothing else calls it. |
| Products.js | `kitdetail` | Old "kits" (combo packs) feature: no screen, no route left, no table in use. |
| Users.js | `HomepageSection_Products` | Only called by a route that was removed (see section 2); nothing else calls it. |

## 5. Packages removed

| Project | Package | Why |
|---|---|---|
| Admin | `ajv` | Never imported (`react-router-dom` brings its own `react-router`) |
| Admin | `ajv-keywords` | Never imported (`react-router-dom` brings its own `react-router`) |
| Admin | `country-state-city` | Never imported (`react-router-dom` brings its own `react-router`) |
| Admin | `emotion` | Never imported (`react-router-dom` brings its own `react-router`) |
| Admin | `multiselect-react-dropdown` | Never imported (`react-router-dom` brings its own `react-router`) |
| Admin | `react-dnd` | Never imported (`react-router-dom` brings its own `react-router`) |
| Admin | `react-dnd-html5-backend` | Never imported (`react-router-dom` brings its own `react-router`) |
| Admin | `react-outer-click` | Never imported (`react-router-dom` brings its own `react-router`) |
| Admin | `react-router` | Never imported (`react-router-dom` brings its own `react-router`) |
| Admin | `react-tag-input` | Never imported (`react-router-dom` brings its own `react-router`) |
| Customer app | `flutter_svg` | Never imported |
| Customer app | `badges` | Never imported |
| Customer app | `modal_bottom_sheet` | Never imported |
| Customer app | `coupon_uikit` | Never imported |
| Customer app | `animated_text_kit` | Never imported |
| Customer app | `slide_countdown` | Never imported |
| Customer app | `slide_to_act` | Never imported |
| Customer app | `flutter_inappwebview` | Never imported |
| Customer app | `webview_flutter` | Never imported |
| Customer app | `webview_flutter_android` | Never imported |
| Customer app | `connectivity_for_web` | Web-only plugin; the app has no web build |
| Customer app | `geolocator_web` | Web-only plugin; the app has no web build |
| Customer app | `image_picker_for_web` | Web-only plugin; the app has no web build |
| Customer app | `url_launcher_web` | Web-only plugin; the app has no web build |
| Rider app | `androidx.constraintlayout` | No layout uses ConstraintLayout |
| Rider app | `com.tbuonomo:dotsindicator` | Never used |
| Rider app | `tk.zielony:carbon` | Never used |
| Rider app | `com.ncorti:slidetoact` | Never used (the app has its own `SlideToActView`) |
| Rider app | `org.java-websocket` | Never used |
| Rider app | `io.socket:socket.io-client` | Never used |
| Rider app | `com.razorpay:checkout` | Never used (riders show a UPI QR made with zxing) |
| Rider app | `com.android.volley` | Never used (the app uses OkHttp/Retrofit) |
| Rider app | `com.karumi:dexter` | Never used |

`geolocator_android` stays: it is pinned to an exact version on purpose.

## 6. Rider-app resources

123 resources removed in three passes (deleting unused icons made the parts they used unused too). Files are listed in section 1 under `Flutter/Deliveryboy/app`. Value entries removed from `values/*.xml`:

`color/purple_500`, `color/purple_700`, `color/teal_200`, `color/teal_700`, `color/color_card_bg`, `color/color_border`, `color/color_blue_call`, `color/color_blue_call_bg`, `color/green_stroke`, `dimen/spacing_xxs`, `dimen/spacing_xs`, `dimen/spacing_s`, `dimen/spacing_m`, `dimen/spacing_l`, `dimen/spacing_xl`, `dimen/spacing_xxl`, `dimen/spacing_xxxl`, `dimen/radius_small`, `dimen/radius_medium`, `dimen/radius_large`, `dimen/radius_pill`, `dimen/elevation_flat`, `dimen/elevation_card`, `dimen/elevation_modal`, `dimen/button_height_primary`, `dimen/button_height_compact`, `dimen/app_bar_height`, `dimen/tab_height`, `dimen/text_display`, `dimen/text_title`, `dimen/text_subtitle`, `dimen/text_body`, `dimen/text_secondary`, `dimen/text_caption`, `string/please_enter_the_verification`, `string/otp_verification`, `string/code_sent_to`, `string/_91_9553290143`, `string/enter_otp`, `string/verify_otp`, `string/resend_otp_in`, `string/no_records_found`, `style/AppTheme`

## 7. Kept on purpose

| Item | Why it stays |
|---|---|
| `Backend/server/migrations/*` not run at startup | One-time release steps for the live database (`production_hardening`, `timestamps_utc`, `remove_aws_media_urls`) or the history of how the schema was built. Listed in `docs/RUNBOOK.md`. |
| `Backend/server/tools/*` | Release tools: `schema_sync`, `release_setup`, `export_since`, and the media import tools for moving images to the new server. |
| `Backend/scripts/wallet-reconcile.js` | Money check for ClikGett Cash; run before and after the release. |
| `Flutter/UserApp/lib/old/...` | Still imported by live screens (models, services). Removing it means rewriting those screens. |
| `Flutter/UserApp/packages/google_fonts` | A local copy the app depends on. |
| `CLIKGETT_AUDIT/*` | Earlier audit reports (history). |
