# ClikGett audit report

**Date:** 2 November 2026
**Code audited:** branch `dev`, commit `054f116`
**Covers:** backend API, admin website, customer app, delivery app, database, AWS setup

## Result

**Not ready for release until the code fixes in the first table below are done.** The
core security is sound: no SQL injection, customers cannot reach each other's data, and
payments are verified on the server. The main risk is money and access: a customer can
spend the same wallet balance several times, and a deactivated admin or rider keeps access.

| Severity | Count | Meaning |
|---|---:|---|
| Critical | 1 | Direct money loss; fix before release |
| High | 7 | Serious risk; fix before or right after release, as marked |
| Medium | 11 | Fix in the first weeks after release |
| Low | 6 | Clean-up |

Each finding says how it was checked:

- **Tested:** reproduced on the local Docker system with throwaway accounts, then removed.
- **Code:** found by reading the code.
- **Scan:** reported by a tool (raw output in `evidence/`).
- **Seen:** observed on AWS on 28–30 Oct 2026. The AWS console was not available on
  2 Nov, so these were not re-checked.

## What must happen before release

| # | Action | Finding | Who |
|---|---|---|---|
| 1 | Make wallet spending safe against simultaneous orders | C1 | Development |
| 2 | Stop duplicate orders and overselling | H1 | Development |
| 3 | Block deactivated admins and riders at login and on every request | H2 | Development |
| 4 | Remove or update the risky packages | H3 | Development |
| 5 | Add the webhook secret and test Razorpay with live keys | H4 | Client + Development |
| 6 | Set up alarms | H5 | Development (needs an alert email) |

## Critical

### C1. One wallet balance can pay for several orders (Tested)

**What happens:** a customer with ₹800 sent 3 ₹492 orders at the same moment. All 3 were
accepted and the wallet ended at **₹-676**. The customer received ₹1,476 of goods for
₹800. A double-tap or a slow network retry can trigger this by accident.

**Cause:** the balance is read when the bill is worked out, then reduced later with no
check that enough is left (`decWalletAmount`, `controllers/Orders.js`).

**Fix:** reduce the balance only if it covers the amount
(`UPDATE ... WHERE WalletAmount >= ?`), and refuse the order if no row changed.

## High

### H1. Duplicate orders and overselling (Tested for duplicates, Code for overselling)

**What happens:** the same test created 3 separate orders from one cart. Stock is reduced
with no check either (`decvariantsQuantity`, `controllers/Orders.js`), so two customers can
buy the last item and stock can go below zero.

**Cause:** order creation is a series of separate database steps, not one transaction. If
a step fails midway, the order can be left half-saved.

**Fix:** wrap order creation in a transaction, claim the cart once at the start so a
second request fails, and reduce stock only where `AvailableQty >= ?`.

### H2. Deactivated admins and riders keep access (Tested)

**What happens:** an admin and a rider with `Status = 0` both called protected APIs with
their tokens and got normal answers. Admin login does not check `Status` either (Code,
`controllers/AdminAuth2FA.js`). A dismissed staff member could keep full admin access,
including changing wallets and prices.

**Fix:** add `AND Status = 1` to the checks in `utils/utils.js` (admin and rider) and to
admin login.

### H3. Vulnerable packages (Scan)

Backend: 2 critical, 5 high, 15 moderate, 1 low. Admin: 5 moderate.

| Package | Severity | Action |
|---|---|---|
| `request`, `form-data` | Critical | Come through `request-promise-core`, which the server code does not import. Remove it. |
| `body-parser` | High | Update to 1.20.9 or later |
| `follow-redirects` | High | Update |
| `minio`, with `query-string` and `decode-uri-component` | High | npm's only offer is a downgrade to 7.1.3. Review before changing; S3 storage depends on it. |

### H4. Live payments are untested (Code, Seen)

Razorpay has only run with test keys. `RAZORPAY_WEBHOOK_SECRET` is not on the server, and
without it webhooks are refused, which removes the quickest way to detect payments that
were taken but not attached to an order. The webhook must be added, and a small real
payment, failed payment and refund tested.

### H5. No monitoring or alarms (Seen)

Nobody is told if the server stops, the disk fills or the database runs out of connections.
Customers would find out first. The wallet check also runs only when someone calls it.

### H6. Network too open (Seen)

Port 3000 (the old backend) and 3306 (the database) accept connections from the whole
internet at firewall level, and SSH port 22 is open to everyone. RDS is marked not public,
which limits 3306, but the rule should still go. Close 3000 and 3306 right after release,
once the new backend's database access is confirmed, and limit 22 to known addresses.

### H7. Secrets and recovery (Seen, Code)

- Live secrets are in a plain `.env` on the server, not a secret manager.
- `clikgett-rehearsal` has the same database password as live and holds real customer data.
- One `SECRET_KEY` signs all logins, OTP hashes and file links, so a leak affects all of
  them at once.
- `secrets-backup-2026-10-23` on a developer's PC holds live database credentials.
- RDS backups are 1 day until the 5 Nov maintenance window, and restore time is unknown.

## Medium

| # | Finding | Checked by | Fix |
|---|---|---|---|
| M1 | **Photo orders are not atomic.** Accepting a proposal checks the status, then writes in separate steps, so a double-tap can create 2 orders. Admins can claim, edit or cancel a request after its order exists (`controllers/PhotoOrders.js`). | Code | Claim the status change atomically; limit admin actions by status |
| M2 | **Admin wallet edits overwrite the balance.** `creditDebitWallet` reads then writes an absolute value, so a customer order at the same moment is lost (`controllers/AdminUsers.js`). The ledger does not record which admin did it. | Code | Use a relative update; store the admin ID |
| M3 | **Cashback expiry is manual and can take spent money.** It runs only when an admin triggers it, and it deducts the full credit even if spent, without matching the ledger (`expireCashback`). The new comeback and birthday rewards do not have this flaw. | Code | Use the same logic as `services/CustomerRewards.js`; run it on a schedule |
| M4 | **Customer data in logs.** 815 `console.log` calls in server code, 16 of which print whole order or payment bodies. The old log reached 1.8 GB on a 16 GB disk with no rotation. | Code, Seen | Remove body logging; rotate logs |
| M5 | **Cart reminders and win-back coupons never run by themselves.** `RetentionEngine.startBackgroundRunner()` is never called, though the runbook says they run. | Code | Start it with the other jobs, or correct the runbook |
| M6 | **Health endpoints are too open.** `/health/db` shows the database host and name to anyone, and `POST /health/redis/test` needs no login. | Tested, Code | Return only ok or not ok; remove the test route in production |
| M7 | **App hardening is off.** Both release apps allow unencrypted HTTP. The delivery app allows Android backup and exports 6 screens it need not. Code shrinking is off in both. | Code | Allow HTTP only in debug builds; set `allowBackup=false`; un-export screens |
| M8 | **All admins have full power.** There is one admin role. Sign-ins are logged, but other admin actions are not. | Code | Add roles and an action log |
| M9 | **Weak request limits.** No security headers (`helmet`). JSON bodies up to 15 MB on a server with 914 MB of memory and no swap. | Code, Seen | Add `helmet`; lower the limit except on upload routes |
| M10 | **Data quality on live.** 8 customers' balances differ from their ledger, and one account holds ₹3,39,204 (client report kept outside git: `Handover\wallet-mismatches-2026-11-02.csv`). Duplicate mobile numbers block the unique rule. Foreign keys are mostly absent. Near-duplicate tables exist (`Cart`/`Carts`, `Sales`/`sales`). | Tested, Seen | Client decides on balances; merge accounts; clean up in a later release |
| M11 | **Rider delay overwrites the admin's ETA change.** Admin +10 then rider +15 gives +15, not +25, and a smaller second report can move the ETA earlier (`reportDelay` logic, `controllers/DeliveryOperations.js`). Found by `test_eta_sync_e2e`; see `docs/testing/TEST_REPORT.md`. | Tested | Add each delay to the current ETA |

## Low

| # | Finding | Fix |
|---|---|---|
| L1 | Customer logins use 4-digit OTPs. Limits on tries and number locks make guessing hard. | Move to 6 digits when old apps retire |
| L2 | The customer app has 608 analyzer notices, and 42 current files still import `lib/old`. | Reduce gradually |
| L3 | No crash reporting in either app. | Add Firebase Crashlytics |
| L4 | Tests run only by hand: CI has only the iOS build. The admin has 2 test files. | Run `npm test` on each push |
| L5 | The store owner's mobile and name are hard-coded in the alert SMS code. `mysql` is imported in 27 files, but the database uses `mysql2`. | Move to settings; remove the imports |
| L6 | iOS still shows version 1.0.3, and its camera text mentions QR codes. The old backend runs Node 18. | Fix before App Store review; retire the old backend after release |

## Checked and found sound

| Area | Result | Checked by |
|---|---|---|
| SQL injection | Request values are parameterised or escaped; only token-derived IDs are placed in SQL directly | Code |
| Customer data separation | Orders, addresses, invoices and photo orders are limited to their owner | Code, test suite |
| API login checks | 391 routes listed. All 16 with no login were reviewed: OTP requests, public store data and health checks. Only the health routes are a concern (M6). | Scan, Code |
| Payment verification | Signature checked on the server, amount confirmed with Razorpay, each payment usable once, webhook signature checked | Code, test suite |
| Prices | Bills are calculated on the server; amounts from the app are ignored | Code, test suite |
| Double refunds | Status changes are atomic, so a repeated cancel cannot refund twice | Code |
| Secrets in git | None in the code or history. The Razorpay values in the app are key IDs; Firebase keys are public by design. | Scan |
| Customer OTPs | Hashed, expire in 5 minutes, limited tries, number lock, limits on sending | Code, test suite |
| Admin sign-in | Scrypt passwords, SMS second step, lockouts, sign-in audit log. Demo codes work only in development. | Code |
| Stored files | Path traversal blocked; private files need signed, expiring links | Code |
| Public settings | `/users/settings` holds no secrets | Tested |
| Database upgrades | Add only; rehearsed on a copy of live | Tested |

## Not covered

- No outside penetration test or load test.
- No live Razorpay payments.
- The iOS app was not built or run.
- App code was reviewed for configuration and key flows, not line by line.
- AWS settings date from 28–30 Oct 2026.

## Evidence

| File | Contents |
|---|---|
| `evidence/route-inventory.tsv` | All 391 API routes and their login check |
| `evidence/npm-audit-backend.json` | Raw dependency scan, backend |
| `evidence/npm-audit-admin.json` | Raw dependency scan, admin |

`Backend/scripts/endpoint-audit/` holds older tools for listing and testing routes.
