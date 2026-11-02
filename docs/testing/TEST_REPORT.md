# ClikGett test report

**Date:** 2 November 2026
**Code tested:** branch `dev`, commit `760e634`
**Where:** local Docker system (backend on Node 22, MySQL), nothing on live

## Result

**All 15 regular backend suites pass (352 of 352 checks), along with the admin (2 of 2) and
customer app (34 of 34) tests.** That does not make the system release-ready. The regular
suites do not cover the wallet race, duplicate orders or deactivated accounts, which the
audit proved are real. An older suite also found one real ETA bug. Real-phone testing, live
Razorpay and iOS are not done.

| Test set | Files | Result |
|---|---:|---|
| Backend, regular (`npm test`) | 15 | 15 pass, 352 of 352 checks |
| Backend, older suites | 15 | 3 pass, 1 real bug, 1 unexplained failure, 10 could not give a result |
| Admin website | 2 | 2 of 2 pass |
| Customer app (Flutter) | 6 | 34 of 34 pass |
| Delivery app | 2 | Not run; default template tests only |

## Defects found

| # | Severity | Defect | Found by | Status |
|---|---|---|---|---|
| 1 | Critical | One wallet balance pays for several simultaneous orders: ₹800 paid for 3 ₹492 orders, ending at ₹-676 | Audit test | Open |
| 2 | High | The same cart creates duplicate orders when submitted at the same moment | Audit test | Open |
| 3 | High | Deactivated admins and riders can still use the API | Audit test | Open |
| 4 | Medium | A rider's delay report overwrites the admin's ETA adjustment. Admin +10 then rider +15 gives +15, not +25. A smaller second report can move the ETA earlier. | `test_eta_sync_e2e` | Open |
| 5 | To review | `test_delivery_assignment_workflow`, check 17: after a rider is reassigned, the old assignment's audit note came back empty | Older suite | Not diagnosed |

Defects 1–4 are in `docs/audit/AUDIT_REPORT.md` as C1, H1, H2 and M11.

## Backend: regular suites

Run with `npm test`. All must pass before deploying.

| Suite | Checks | Covers |
|---|---:|---|
| `test_security_regressions` | 28 | Token handling, access control, known past security fixes |
| `test_login_security` | 21 | OTP limits, lockouts, login rules |
| `test_refresh_tokens` | 21 | Token renewal, reuse detection, logout |
| `test_product_actions` | 26 | Add, buy-more, notify-me and limits on products |
| `test_order_flow` | 23 | Order status from placed to delivered, cancelling |
| `test_checkout` | 34 | Server-side bill, delivery fees, coupons, wallet |
| `test_account` | 12 | App settings, referral, membership, account deletion |
| `test_admin` | 26 | Admin accounts and admin actions |
| `test_features` | 16 | Search, notifications, tracking features |
| `test_cashback_review` | 17 | Cashback rules and review |
| `test_print_store` | 20 | Print orders and pricing |
| `test_stock_and_deals` | 21 | Stock, unlock deals, limits |
| `test_qa_bug_fixes` | 45 | Bugs fixed during QA, including photo uploads |
| `test_doorstep_upi` | 15 | UPI at the door, with a stand-in for Razorpay |
| `test_customer_rewards` | 27 | Comeback and birthday rewards, savings, typed photo orders, keywords |
| **Total** | **352** | |

## Backend: older suites

These are not in `npm test`. Many report "passed" to the system even when their checks
failed, so each was reviewed by hand. Those with an old port were run through a temporary
bridge from port 5000 to the backend's port 5001.

| Suite | Result | Verdict |
|---|---|---|
| `test_photo_orders_e2e` | 17 of 17 | Pass |
| `test_customer_requests_and_enquiries` | All passed | Pass |
| `test_buymore_e2e` | 4 of 4 | Pass |
| `test_eta_sync_e2e` | Stopped at check 2 | **Real bug**, defect 4 |
| `test_delivery_assignment_workflow` | 19 of 20 | Unexplained, defect 5 |
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

## Not tested

| Area | Why it matters |
|---|---|
| Real phones, end to end against the release build | Automated tests do not touch the app screens or a real rider flow |
| Live Razorpay: payment, failure, refund, doorstep QR | Only stand-ins and test keys so far |
| iOS app | Not built or run |
| Delivery app | No automated tests |
| Admin website screens | Only 2 basic tests |
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
