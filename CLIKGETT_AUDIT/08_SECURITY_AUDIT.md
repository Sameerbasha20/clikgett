# 08 — Security Audit

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

No secret values, tokens or customer data appear in this report. Only file paths and variable names are given.

## 1. Authentication and authorization

| Area | Implementation | Evidence | Verdict |
|---|---|---|---|
| JWT | HS256 with `SECRET_KEY`; `Authorization: bearer/token <jwt>`; expiry enforced (`utils/utils.js:15-36`) | Expired or invalid tokens → 401 (`test_security_regressions`) | OK |
| Refresh tokens | Stored in `AuthRefreshTokens`, rotated on refresh, revoked on logout | `test_refresh_tokens.js` (passes) | OK |
| Customer OTP | 4 digits by default (`LOGIN_OTP_DIGITS`); 5 sends/hour/number, 30 s apart; 5 tries per code; 24 h lock after 10 failures/day (`services/LoginOtp.js:5-18`); per-IP 20 sends and 40 logins per 10 min (`server.js:109-116`) | `test_login_security.js` | OK. 4 digits is acceptable only together with these limits. |
| Store-review login | Fixed OTP for one configured number when both `REVIEW_LOGIN_MOBILE` and `REVIEW_LOGIN_OTP` are set, in **any** environment (`services/LoginOtp.js:36-49, 83`) | Code | **Medium**: a permanent bypass for that account. Remove the env vars after store review. |
| Admin login + 2FA | Password, then SMS 2FA. A demo OTP (`ADMIN_2FA_DEMO_OTP`, default `123456` in docker-compose) is accepted only when `NODE_ENV=development` (`controllers/AdminAuth2FA.js:23-30`) | Render `NODE_ENV=production` (`render.yaml:20-21`, `deploy/render.env`) | OK in production. **Must never run production with NODE_ENV=development.** |
| Password hashing | New and changed passwords use scrypt (`utils/password.js:8-10`). Admin login (`POST /api/adminuser/login` → `controllers/AdminAuth2FA.js:132-133`) still accepts **legacy plain-text or MD5** values (`utils/password.js:30-31`) and upgrades them on the next successful login. | Local DB: **19 of 21 `AdminUsers` rows are not scrypt** (plain text or MD5). Dead function `Verifylogin` compares passwords in SQL (`controllers/AdminUsers.js:1963-1966`; its only caller, `adminlogin` at `:130`, isn't routed). | **High**: a DB leak exposes admin and rider passwords directly. Force a reset or rehash for all legacy rows; delete the dead code. |
| Role-based access | Three token kinds:<br>• customer (`UserID`);<br>• admin (`AdminID`, DB check `Role=1`, `utils.js:87`);<br>• rider (`AdminID`, `Role=2`, `utils.js:236`).<br>All roles are re-checked against the DB on every request. | Probe: 349/355 protected endpoints refuse no-token calls (the other 6 are validation-first, still blocked); wrong-role tokens refused on every admin, rider and customer route | OK |
| Admin granularity | **Single admin role.** Every admin can do everything: wallet credits, refunds, admin-user management, exports. | `utils.js:87` | **Medium**: no least privilege; a stolen admin session has full power. |
| Session invalidation | Logout revokes the refresh token. Access tokens stay valid until expiry (admin 2 h). | Code + suite | Acceptable |
| Ownership (IDOR) | Customer orders filtered by `UserID`; rider order detail checks assignment (probe: 403 "This order is not assigned to you"); invoices need the owner or a signed link | Probe + suites | OK for the paths tested. 141 mutating endpoints weren't functionally tested (03 §2). |

## 2. API security

| Item | Status |
|---|---|
| SQL injection | No injectable input found (07 §6). One unsafe string-built UPDATE in a legacy GET (`controllers/Users.js:308`). |
| Mass assignment | Product, offer and customer updates build explicit column lists (e.g. `AdminProducts.updateproduct` field by field). No generic `SET ?` with `req.body` was found on core tables. |
| Input validation | Mixed. Mandatory-field validators exist (`utils/validations`), but some run **before** auth (03 §4.3); newer endpoints validate inline. |
| Rate limiting | Global 600/min/IP on `/api`, tighter on OTP and login (§1). Admin-wide or per-user limits: none. |
| Error exposure | Most errors return generic messages. `updateproducts` returns `err.message` (`controllers/Users.js:318`). Stack traces aren't returned. |
| CORS | Production allows only origins in `CORS_ORIGINS`; development allows any (`server.js:70-77`). |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS when HTTPS, `x-powered-by` disabled (`server.js:79-86`). No Content-Security-Policy on the admin site. |
| Unsafe GET | `GET /api/users/updateproducts` performs writes (03 §4.1). |
| Public endpoints (26) | Login/OTP, settings, app config, serviceability, timing, active sales, unlock list, print config, health. `POST /health/redis/test` lets anyone write and delete a short-lived Redis test key (low). `GET /health` reports dependency status, including the internal DB host name (low; restrict in production). |

## 3. Files and payments

| Item | Status |
|---|---|
| Uploads | Admin uploads go through signed, expiring PUT URLs (`utils/media.js:33-36, 94-121`), keys with `..` rejected, 20 MB limit enforced on the stream. Content type is taken from the signed URL, not sniffed. Customer photo uploads (base64) check MIME type and a 10 MB limit (`controllers/PhotoOrders.js:32, 76-89`). |
| Private media | Customer photos are served only through signed, expiring links (probe: `/media/*` with an old link → 403 "This link has expired"). |
| Payment verification | Razorpay signature HMAC verified before order creation; amount compared with the server bill; payment IDs consumed once (`controllers/Orders.js:355-375`). Webhook HMAC with timing-safe compare (`services/PaymentRecovery.js:33-40`). **BLOCKED:** no live or test-mode payment was run. |
| Refunds | Store cancellations refund online payments to the original method; customer cancellations to ClikGett Cash (`services/OrderLifecycle.js:262-275`). Covered by `test_order_flow`/`test_order_safety` for wallet; Razorpay refund calls not exercised. |
| Wallet manipulation | The wallet amount is computed server-side in the bill; the client can't choose it (test_checkout). But the **ledger is inconsistent for 9 users** (07 §3): investigate before go-live. |

## 4. Secrets and configuration

| Check | Result |
|---|---|
| Tracked secret files (`.env`, keystores, `key.properties`, service-account JSON, `.p8`, `.pem`) | None. Only `.env.example` and `key.properties.example` are tracked. |
| Git history (81 commits, all branches) | No `.env` or key files ever committed. Pattern search for AWS access keys, private-key blocks and `sk_live_`: 0 hits. |
| Razorpay key ID in the app | `UserApp/lib/new/Constants/Constants.dart:8-9`, `lib/old/constants.dart:9` (live and test key **IDs**). Key IDs are public by design; the secret is server-only (`RAZORPAYSECRET`). OK. |
| Firebase client config | `UserApp/lib/firebase_options.dart` (Google API key). Standard client config; restrict it in Google Cloud to the app's package and SHA-1. |
| Passwords in test files | Literal password strings in `Backend/server/tests/test_admin.js`, `test_admin_regression.js`, `test_dynamic_home_sections.js`, `test_order_910_real_session.js`, `test_order_safety.js`. Confirm none matches a real admin password. |
| Local secrets | Kept outside the repo in `C:\Users\DELL\Desktop\clikgett\deploy\` (`render.env`, `app-keys.env`). Not in Git (correct). The folder is on the developer PC unencrypted. |
| Dev → production isolation | `utils/db.js:23-24` refuses to start with `NODE_ENV=development` against an RDS host. docker-compose pins `DB_HOST=mysql` and S3 to MinIO. |

## 5. Mobile app security

- **Delivery app:**
  - cleartext HTTP allowed for all hosts;
  - 5 activities exported without need;
  - `allowBackup=true` with the token in plain SharedPreferences (06 §4).
- **Both apps:** release builds fall back to debug signing; no code shrinking or obfuscation.
- **Customer app:** token handling is via the interceptor; secure-storage use wasn't verified.

## 6. Severity summary

| # | Finding | Severity |
|---|---|---|
| S0 | Legacy plain-text/MD5 admin and rider passwords (19 of 21 local rows) still accepted | High |
| S1 | Wallet ledger mismatches (9 users) | High (financial integrity) |
| S2 | Release APKs signed with debug keys (both apps) | High (release blocker) |
| S3 | GET endpoint performing bulk writes with string-built SQL (`/api/users/updateproducts`) | Medium |
| S4 | Single all-powerful admin role | Medium |
| S5 | Permanent store-review OTP bypass when its env vars are set | Medium |
| S6 | Delivery app: cleartext allowed, exported activities, backup of the token | Medium |
| S7 | Validation before auth on 6 routes (information leak only) | Low |
| S8 | Public Redis test write and verbose health output | Low |
| S9 | No CSP on the admin site | Low |

No critical (remotely exploitable without credentials) vulnerability was found in the tested surface. 141 mutating endpoints had only their access control verified, not their behaviour.
