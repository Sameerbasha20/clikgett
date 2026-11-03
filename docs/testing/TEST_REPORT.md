# ClikGett test report

**Date:** 2 November 2026
**Code tested:** branch `dev`, commit `dedaee5`
**Where:** local Docker system (backend on Node 22, MySQL) and the AWS copy of live data; nothing on live

## Result

**All 18 regular backend suites pass, along with the admin (5 of 5) and customer app (34 of
34) tests. The defects found on 2 November are fixed and proven by new or repaired tests.**
That does not make the system release-ready on its own: real-phone testing, live Razorpay
and iOS are not done.

| Test set | Files | Result |
|---|---:|---|
| Backend, regular (`npm test`) | 19 | 19 pass, 431 counted checks plus the ETA suite |
| Backend, older suites | 13 | 3 pass, 10 could not give a result |
| Admin website | 3 | 5 of 5 pass |
| Customer app (Flutter) | 6 | 39 of 39 pass |
| Delivery app | 2 | Not run; default template tests only |

## Defects found

| # | Severity | Defect | Found by | Status | Proof |
|---|---|---|---|---|---|
| 1 | Critical | One wallet balance paid for several simultaneous orders: ₹800 paid for 3 ₹492 orders, ending at ₹-676 | Audit test | **Fixed** | 3 orders at once: 1 accepted, wallet stays above zero and matches its history |
| 2 | High | The same cart created duplicate orders, and stock could be oversold | Audit test | **Fixed** | One order per cart; the last units sell once, and the customer who misses out keeps their wallet and cart |
| 3 | High | Deactivated admins and riders could still use the API, and admins could log in | Audit test | **Fixed** | Refused at login and on every request; active staff unaffected |
| 4 | Medium | A rider's delay report overwrote the admin's ETA change: admin +10 then rider +15 gave +15, not +25 | `test_eta_sync_e2e` | **Fixed** | Gives +25. A rider's newer estimate still replaces their own earlier one, by design |
| 5 | Medium | A double-tap on a photo-order proposal could create 2 orders, and stock was not protected. Admins could change a request after its order existed. | Audit, code | **Fixed** | Accepted 3 times at once: 1 order, stock taken once; closed requests refuse admin changes; no stock leaves the proposal open |
| 6 | None | Not a defect. The reassignment note says "rider"; the old test looked for "driver". The audit trail was correct. | Older suite | Test corrected | 20 of 20 |

Defects 1–5 are C1, H1, H2, M11 and M1 in `docs/audit/AUDIT_REPORT.md`.

## Backend: regular suites

Run with `npm test`. All must pass before deploying.

| Suite | Checks | Covers |
|---|---:|---|
| `test_security_regressions` | 28 | Token handling, access control, known past security fixes |
| `test_login_security` | 21 | OTP limits, lockouts, login rules |
| `test_refresh_tokens` | 21 | Token renewal, reuse detection, logout |
| `test_product_actions` | 28 | Add, buy-more, notify-me and limits on products; flash sale 20% off MRP; Chilled tag set by admin |
| `test_order_flow` | 23 | Order status from placed to delivered, cancelling |
| `test_checkout` | 39 | Server-side bill, delivery fees, coupons, wallet, ClikGett Cash only from ₹250, no minimum order, order for someone else |
| `test_flash_sale` | 14 | Sale discount taken off MRP, used only when below the offer price, units per order at the sale price, admin photos, prices and limits |
| `test_account` | 12 | App settings, referral, membership, account deletion |
| `test_admin` | 26 | Admin accounts and admin actions |
| `test_features` | 16 | Search, notifications, tracking features |
| `test_cashback_review` | 17 | Cashback rules and review |
| `test_print_store` | 24 | Print orders and pricing, print switched off in admin |
| `test_stock_and_deals` | 21 | Stock, unlock deals, limits |
| `test_qa_bug_fixes` | 45 | Bugs fixed during QA, including photo uploads |
| `test_doorstep_upi` | 15 | UPI at the door, with a stand-in for Razorpay |
| `test_customer_rewards` | 27 | Comeback and birthday rewards, savings, typed photo orders, keywords |
| `test_order_safety` | 34 | Orders and photo orders at the same moment, wallet, stock, deactivated staff, store cancellation reason, prepaid cancellation refunded as ClikGett Cash |
| `test_delivery_assignment_workflow` | 20 | Assigning and reassigning riders |
| `test_eta_sync_e2e` | Passes | Admin and rider ETA changes combine |
| **Total** | **431 + ETA suite** | |

## Backend: older suites

These are not in `npm test`. Many report "passed" to the system even when their checks
failed, so each was reviewed by hand. Those with an old port were run through a temporary
bridge from port 5000 to the backend's port 5001.

| Suite | Result | Verdict |
|---|---|---|
| `test_photo_orders_e2e` | 17 of 17 | Pass |
| `test_customer_requests_and_enquiries` | All passed | Pass |
| `test_buymore_e2e` | 4 of 4 | Pass |
| `test_buymore_api` | Prints results only | No pass or fail checks |
| `test_delay_and_serviceability` | 9 of 10 | Test out of date: it never opens the store, so the order is refused as closed |
| `test_post_delivery_feedback_and_cashback` | 6 of 7 | Test out of date: the reward is one-time and the test account has used it |
| `test_product_requests_and_search` | 2 of 3 | Test out of date: its stand-in database no longer matches the code |
| `test_admin_regression` | No result | Cannot sign in |
| `test_audit_regressions` | 20 of 34 | Cannot sign in |
| `test_demo_otp` | 5 of 10 | Cannot sign in |
| `test_dynamic_home_sections` | No result | Cannot sign in |
| `test_four_features` | 1 of 4 | Cannot sign in |
| `test_order_910_real_session` | No result | Cannot sign in |

"Cannot sign in": these sign in as an admin using the password stored in the database,
which no longer works now that passwords are hashed. They prove nothing either way. Some
cover admin 2-step concurrency, so that area has no current automated test.

## Run on the AWS copy

The last run on `clikgett-rehearsal` (a copy of live data) was on 30 October 2026, before
the latest changes:

- 12 of 14 suites passed, 281 checks. The other 2 needed file uploads, switched off for
  that run.
- The current live app's calls got the same answers from the old and new backends.
- Database upgrade steps ran cleanly, and were repeated with timings on 2 November.

Re-run there on 2 November with the fixes, against a temporary test server:
`test_order_safety` 17 of 17 (before the photo-order checks were added), `test_eta_sync_e2e` pass, `test_checkout` 34 of 34,
`test_order_flow` 23 of 23, `test_customer_rewards` 27 of 27, `test_doorstep_upi` 15 of 15.
This matters because live stores wallet balances in a different number format from local.

## Not tested

| Area | Why it matters |
|---|---|
| Real phones, end to end against the release build | Automated tests do not touch the app screens or a real rider flow |
| Live Razorpay: payment, failure, refund, doorstep QR | Only stand-ins and test keys so far |
| iOS app | Not built or run |
| Delivery app | No automated tests |
| Admin website screens | Only basic tests, plus the new shared pager; pages were built but not clicked through in a browser |
| Load | Behaviour under many customers at once on the small server is unknown |
| Push notifications and SMS on real devices | Stand-ins in tests |

## Manual tests to run before release

| Role | Test | Result |
|---|---|---|
| Customer | Sign up, log in, add an address | Not run |
| Customer | Search, add to cart, apply a coupon | Not run |
| Customer | Pay by cash, online and wallet | Not run |
| Customer | Track an order, get a notification, open the invoice | Not run |
| Customer | Photo order: send, accept the proposal | Not run |
| Customer | Current Play app still works after the backend switch | Not run |
| Rider | Log in, go online, receive an order | Not run |
| Rider | Pick up, arrive, collect by UPI QR, deliver with OTP | Not run |
| Admin | Sign in with SMS code | Not run |
| Admin | Change a price, assign a rider, cancel with a refund | Not run |
| Admin | Add a deal, turn on rewards, Run now | Not run |

## Evidence

| File | Contents |
|---|---|
| `evidence/backend-results.tsv` | Result of each backend suite |
| `evidence/admin-results.txt` | Admin test summary |
| `evidence/flutter-results.txt` | Customer app test summary |

To repeat the regular run, see `docs/LOCAL_SETUP.md`.
