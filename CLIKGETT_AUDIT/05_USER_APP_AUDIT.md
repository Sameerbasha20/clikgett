# 05 — Customer App (Flutter) Audit

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

## 1. Scope and limits

- **Code:** `Flutter/UserApp/lib`, 183 Dart files and 38,912 lines. The current UI is in `lib/new/`; `lib/old/` still supplies models and some services (33 of its 37 files are imported by current code).
- **Device testing: BLOCKED.** No phone was connected (`adb devices` empty). An emulator image (`Pixel_8`) exists, but there are no integration or UI tests (`integration_test/` doesn't exist) to drive it. So screens were **not** exercised at runtime in this audit, and runtime logs couldn't be collected: Flutter exceptions, render overflow, `setState` during build, GetX lifecycle, memory.
- **What was done instead:**
  - `flutter analyze` and `flutter test`;
  - a release build (`flutter build apk --release`, made earlier in this session from the same commit, 95.7 MB);
  - a static scan of every screen;
  - mapping every API URL in the app to a backend route;
  - verifying the backend side of each flow with the API suites.

## 2. App → API integration

- **URL check:** 110 API URL literals across the Dart code reference **89 distinct backend routes. All 89 exist; 0 point at missing endpoints.**
- **Base URL:** `--dart-define=API_BASE_URL` at build time (`lib/new/Constants/Constants.dart`). APKs for testing point at Render.
- **Auth header:** sent by `ApiInterceptor` (`lib/Services/common/intercepter.dart`); refresh tokens are handled (backend suite `test_refresh_tokens.js` passes).

## 3. Screen inventory and static health

Status meanings:
- **I (implemented, not verified on a device)**: code complete and the backend flow verified by suites, but the screen itself not run in this audit.
- **I-partial**: backend side only partly verified.
- **BLOCKED**: the flow needs a real external service.

Columns: loading / empty / error = loading indicator / empty-state widget / error handling found in that file (static grep counts; 0 = none found in the file itself, possibly handled by a shared widget or controller). Backend verification is from `endpoint_test_results.json`.

| Area | Screen file (`lib/new/NewScreens/…`) | Lines | Loading | Empty | Error | Backend flow verified | Status |
|---|---|---|---|---|---|---|---|
| Splash / onboarding | `Auth/OnBoarding1.dart`, `Auth/LoginIntro.dart`, `main.dart` | 201/121 | – | – | – | config GET (probe) | I |
| Login / OTP | `Auth/OtpVerify.dart`, `Auth/auth_shell.dart` | 262/258 | yes | – | 0 in file | OTP verify and lockout (test_login_security); SMS delivery BLOCKED | I |
| Registration / profile | `Account/CreateProfile.dart`, `EditProfile.dart`, `Profile.dart` | 294/295/366 | yes/yes/0 | – | **0** | profile update (test_account) | I |
| Home | `Homepage/Homepage.dart`, `Tabs/HomeTab.dart` + `home_sections/*`, `Storefront/*` | 210/244 | yes | yes | 0 | `GET /users/homepage` 200, 9 dynamic sections (probe) | I |
| Search | `Homepage/SearchScreen.dart` | 465 | yes | yes | yes | search + suggestions (probe, test_qa_bug_fixes) | I |
| Categories / subcategories | `Tabs/Categories/Categories.dart`, `SingleCategory.dart` | 233/434 | yes | yes | yes | category listing (probe) | I |
| Product details, variants, Select unit, similar products | `Homepage/ItemDescription.dart`, `widgets/pack_options.dart`, `similar_products_widget.dart` | 1,262 | 0 in file | yes | **0** | product detail, similar (probe), buy-more tiers (test_stock_and_deals) | I |
| Buy 1 / Buy 2 options | `Widgets/purchase_options_sheet.dart` | — | — | — | — | buy2 pricing (test_checkout) | I |
| Cart / checkout / time slots / receiver | `Tabs/Cart/Cart.dart`, `delivery_slot_widget.dart` | 1,648 | yes | yes | yes | server bill, coupons, wallet, minimum, welcome offer, receiver (test_checkout, test_promotions) | I |
| Payment (Razorpay) | `Cart.dart:1575`, `wallet.dart:72`, `membership_screen.dart:62` | — | — | — | yes | signature verification code present; **BLOCKED** (no test-mode run) | BLOCKED |
| Order success | `Tabs/Cart/SuccessCart.dart` | 194 | – | – | – | createorder (test_checkout) | I |
| Orders: current / past / details / tracking / receipt / delivered banner | `Tabs/Orders/*` | 486/229/867/251 | yes | yes | yes | myorder, cancel, reorder (test_order_flow, test_order_safety) | I |
| Address management and serviceability | `Address/*`, `location/*` | 560-634 | yes | partial | partial | addaddress, check-serviceability (suite) | I |
| Wallet / ClikGett Cash | `CouponAndOffers/wallet.dart` | 269 | yes | yes | yes | wallet history (probe); top-up via Razorpay BLOCKED | I-partial |
| Offers / coupons | `CouponAndOffers/Offers.dart` | 138 | yes | – | yes | coupon list (probe) | I |
| Rewards / milestones / unlock deals | `Deals/UnlockDealsScreen.dart`, `milestone_reward_card.dart` | 492/732 | yes | yes | yes | unlock deals (suite), milestones (probe) | I |
| Membership | `Account/membership_screen.dart` | 192 | yes | – | yes | plans/buy/confirm (suite); payment BLOCKED | I-partial |
| Notifications | `Notifications.dart`, `notification_settings_screen.dart` | 295/127 | yes | yes | partial | list and preferences (suite); push receipt BLOCKED | I |
| Support / enquiries | `Support/Support.dart`, `Support/EnquiryScreen.dart` | 99/843 | yes | yes | yes | enquiries (suite) | I |
| FAQ | (no dedicated screen; FAQ text lives in Profile/Enquiry) | — | — | — | — | — | **Not implemented as a screen** |
| Photo orders | `PhotoOrders/*` | 647/279/636 | yes | – | 0 in file | submit, request, confirm (suite) | I |
| Product request | `Homepage/ProductRequestScreen.dart` | 565 | yes | – | yes | product-requests (suite) | I |
| Print store | `PrintStore/*` | 295/420 | yes | yes | yes | print config/jobs (test_print_store) | I |
| Referral | `Referral/referralScreen.dart` | 149 | yes | – | **0** | referral settings (probe) | I |
| My requests | `Account/my_requests_screen.dart` | 161 | yes | yes | 0 | my enquiries/requests (suite) | I |

Total: 50 screen files under `lib/new/NewScreens` with a `Scaffold`, plus 4 legacy screens (2 of which, `old/Screens/Auth_Screens/*`, are effectively unused).

## 4. Static analysis

`flutter analyze lib` → exit 1 (issues found), 624 issues: **0 errors, 79 warnings, 545 infos**.

| Warning | Count | Risk |
|---|---|---|
| `body_might_complete_normally_catch_error` | 20 | `.catchError` handlers that return nothing in controllers (cart, address, orders, profile, wallet, notifications, search). At runtime a failed request can throw a type error instead of being handled. **Network-failure handling in these controllers is unreliable.** |
| `unused_import` | 18 | Dead code |
| `must_be_immutable` | 10 | Widgets with non-final fields |
| `unused_local_variable` / `unused_element` | 11 | Dead code (e.g. `ItemDescription._showPurchaseOptions`) |
| `dead_null_aware_expression`, `unnecessary_null_comparison`, `invalid_null_aware_operator` | 12 | Null-safety leftovers |
| `invalid_return_type_for_catch_error` | 1 | `old/Services/Home/home_services.dart:25` |

Infos: 216 `deprecated_member_use` (mostly `withOpacity`), 54 `avoid_print`, 29 `use_build_context_synchronously` (possible "context used after widget disposed" crashes), 54 `file_names`.

## 5. Tests

`flutter test` → exit 0, **43 passed, 0 failed, 0 skipped**, across 8 files:
- cart decimals;
- delivered banner;
- dynamic home sections (×2);
- low stock;
- price label;
- recommendations;
- widget smoke test.

There are no tests for navigation, the cart screen, checkout or login.

## 6. Other observations

- **Network failures:** 10 references to connectivity or `SocketException`, 4 explicit timeouts across the app. Most HTTP calls have no timeout, so a hung request leaves a spinner.
- **Cart synchronisation:** cart state lives in `CartController` (GetX). The bill is always computed by the server (`/carts/bill`), so displayed totals can't drift from what is charged (verified by test_checkout).
- **Release config:**
  - `android/app/build.gradle:97` falls back to **debug signing** when `key.properties` is absent; it is absent in this checkout, so the APKs in `RENDER_APKS/` are debug-signed.
  - `minifyEnabled false`, `shrinkResources false`.
  - The universal APK is 95.7 MB.
- **iOS:** the build runs only in GitHub Actions (`.github/workflows/ios-testflight.yml`). Not run in this audit (needs Apple secrets).

## 7. What must be verified on a device before release

1. Login with a real OTP.
2. Address with GPS and Places search.
3. Add to cart: variants, Select unit, Buy 2.
4. Checkout with COD, the time slot and someone-else delivery.
5. Razorpay **test-mode** payment and the failure path.
6. Order tracking through to delivery (delivered banners).
7. Cancel within the window.
8. Push notification receipt.
9. Photo order.
10. Print order.
11. Wallet top-up.
12. Behaviour when offline or with a slow network.
13. App kill/resume during payment.
