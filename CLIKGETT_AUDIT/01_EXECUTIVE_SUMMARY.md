# 01 — Executive Summary: ClikGett Technical Audit

> **Update, 5 November 2026: fixes applied and re-audited.** See `16_REAUDIT_AFTER_FIXES.md`.
> - **Endpoints:** 0 FAIL (was 2); all 354 protected endpoints refuse calls without a token; 31 backend suites pass (was 20).
> - **Data:** 0 legacy passwords (was 19); 0 wallet mismatches (was 9).
> - **Admin:** 5 roles enforced; 39/39 admin pages error-free.
> - **Apps:** HTTPS-only release builds; release builds refuse to build without the real keystore.
> - **Overall:** implemented 87% → **94%**, verified 31% → **42%**.
> - **Still blocked on the owner:** keystores, device testing, production cut-over, iOS secrets.
>
> The text below is the original audit of 4 November, kept for reference.

Audit date: 4 November 2026 · Code audited: branch `dev`, commit `b519e92` · Environment: local Docker stack (no production system touched).
Source code was not modified. The audit added only this folder, rebuilt the local admin container from current source, and made local test calls (see 11).

## 1. What is ClikGett?

A quick-commerce grocery platform for Kurnool. Customers order groceries in the app for delivery in about 20-30 minutes, or schedule a 2-hour slot. Store staff manage the catalogue, orders, riders, offers and settings in an admin website. Riders use a separate Android app to deliver orders, collect cash or UPI, and confirm delivery with an OTP. Extras include photo-of-list orders, a print store, ClikGett Cash (wallet), cashback, rewards, membership, flash sales and unlock deals.

## 2. Technologies

| Part | Stack |
|---|---|
| Backend | Node.js + Express, MySQL 8 (`mysql` driver), Redis, MinIO/S3, Firebase Cloud Messaging, Razorpay, TextSpeed SMS |
| Admin website | React (Create React App), react-router, Bootstrap |
| Customer app | Flutter (Android + iOS), GetX, Razorpay SDK, Google Maps/Places |
| Delivery app | Native Android (Java) |
| Infrastructure | Docker Compose (local); Render + Aiven MySQL + Vercel (staging); AWS EC2 + RDS + S3 (production, still on old code) |

## 3. Backend endpoints

**404 distinct endpoints** (609 route registrations, because 8 routers are mounted under 2-3 prefixes).

| Role | Endpoints |
|---|---|
| Admin | 267 |
| Customer | 61 |
| Rider | 18 |
| Public | 49 |
| Cron / invoice links | 9 |

## 4. How many endpoints were tested, and the results

| Result | Endpoints | Meaning |
|---|---|---|
| **PASS** | **252** | 121 by passing API test suites (real bodies + DB assertions), 131 by authorized GET probe |
| **FAIL** | **2** | `GET /api/users/updateproducts` (a GET that bulk-writes), `GET /api/users/datatransfer` (501) |
| **BLOCKED** | **9** | Would send real SMS or push, needs Razorpay signatures, or triggers cron jobs |
| **NOT TESTED** | **141** | Write endpoints without suite coverage; only their access control was verified |

Access control was checked on all **355 protected endpoints**:
- 349 refuse requests without a token;
- the other 6 return a 400 validation message first, but still don't run without login;
- wrong-role tokens (customer, rider, admin) were refused everywhere.

## 5-8. What was audited

| Area | Audited | How |
|---|---|---|
| Admin modules | **38 pages** (all routes) | Browser sweep on the current build: 38/38 load, 129 API calls all OK, 0 console errors; 5 search/filter interactions; create/edit/delete not clicked |
| Customer app screens | **50 screen files** (+4 legacy) | Static review, API mapping (89 routes, 0 missing), `flutter analyze`, 43 unit tests. **Device testing BLOCKED** (no phone or UI tests). |
| Delivery app screens | **6 activities, 2 fragments, 2 services** | Build + lint + unit tests (template only), API mapping (16 routes, 0 missing). **Device testing BLOCKED.** |

## 9. Critical security vulnerabilities

No vulnerability was found that can be exploited remotely **without credentials** in the tested surface:
- auth is enforced everywhere;
- SQL is parameterised or allow-listed;
- uploads are signed;
- payment signatures are checked;
- no secrets are in Git history.

High-risk issues:
- **H1:** 19 of 21 admin/rider password rows are legacy plain-text or MD5 and still accepted (`utils/password.js:21-31`).
- **H2:** ClikGett Cash ledger doesn't match balances for 9 customers (wallet checker reports `Healthy: false`).
- **Medium:**
  - one all-powerful admin role;
  - a GET endpoint that rewrites product rows;
  - a store-review OTP bypass when its env vars are set;
  - the delivery app allows cleartext HTTP, exports internal screens and backs up its token.

## 10. Critical functional defects

- `GET /api/users/updateproducts` performs bulk writes. The audit's own GET call rewrote 428 rows; values were unchanged.
- `GET /api/users/datatransfer` is broken (501, missing `xlsx`, hard-coded server path).
- Wallet ledger mismatches (above).
- Admin past-order lists are capped at 2,000 rows and unpaginated (1.6 MB per call).
- Release APKs of both apps are signed with debug keys, so they can't be used for Play Store updates.
- Minor: rider `getroutes` without a type returns HTTP 200 "error"; the admin home-sections list breaks on a non-numeric page; validation runs before login on 6 routes.

## 11. Incomplete features

- **Not built:**
  - granular admin permissions;
  - rider accept/decline step;
  - FAQ screen;
  - CI test pipeline;
  - mobile UI/device tests.
- **Not verified:**
  - Razorpay payments;
  - push notifications;
  - SMS;
  - home-section admin editing (its test file isn't run);
  - most admin create/edit/delete actions;
  - every mobile screen on a device.
- **Not done:** production cut-over (old code still live), release signing, iOS secrets.

## 12. Verified completion

Feature-based; method in `13_PROJECT_COMPLETION_SCORECARD.md`.

| Area | Implemented | Verified working |
|---|---|---|
| Backend | 95% | **61%** |
| Admin website | 97% | **15%** |
| Customer app | 93% | **0%** (device testing blocked) |
| Delivery app | 92% | **8%** |
| Database & integrations | 75% | 50% |
| Security | 75% | 50% |
| Testing & automation | 28% | 11% |
| Deployment readiness | 55% | 30% |
| **Overall (175 features)** | **87%** | **31%** |

## 13. Is it ready for production?

**No, not yet.** The features are largely built and the backend is well tested (452 automated checks, 0 failures). But:
- the apps haven't been verified on devices;
- payments and notifications haven't been exercised;
- release signing is missing;
- wallet data has inconsistencies;
- legacy passwords are still accepted;
- production still runs the old system, and no migration rehearsal has been done.

## 14. Must be completed before production release

1. Android release keystores for both apps (H3).
2. Wallet ledger investigation and correction, with the checker scheduled (H2).
3. Reset or rehash legacy passwords; remove the plain/MD5 acceptance (H1).
4. Remove or lock down `updateproducts` and `datatransfer`; delivery app HTTPS-only/exported/backup settings; remove the review-login variables after store review.
5. A recorded device test pass of both apps against staging with Razorpay test mode, plus an admin click-through (15 Phase 2).
6. iOS TestFlight build with secrets added.
7. Read-only production schema comparison, migration rehearsal on a production snapshot, then the approved server replacement runbook and the domain certificate fix.

Full details: `03`–`15`, `api_inventory.json`, `endpoint_test_results.json`, `feature_completion_matrix.csv`.
