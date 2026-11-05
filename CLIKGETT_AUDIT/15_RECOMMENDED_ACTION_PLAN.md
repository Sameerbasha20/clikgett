# 15 — Recommended Action Plan

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

Nothing below has been started. Each phase needs your approval. Efforts are rough estimates for one developer.

## Phase 1: Release blockers (≈ 3-5 days)

| # | Action | Fixes | Effort |
|---|---|---|---|
| 1.1 | Restore Android upload keystores and `key.properties` for both apps (kept outside Git); make release builds fail without them | H3 | 0.5 d (plus finding the original keystore) |
| 1.2 | Wallet: trace the write path causing ledger ≠ balance; reviewed correction script for affected accounts; schedule `admin-wallet-check` with an alert | H2 | 1-2 d |
| 1.3 | Passwords: force reset/rehash of non-scrypt admin and rider passwords; then remove the plain/MD5 branch; delete `Verifylogin`/`adminlogin` | H1 | 0.5 d |
| 1.4 | Remove or lock down `GET /api/users/updateproducts` and `/datatransfer` | M1, L2 | 0.5 h |
| 1.5 | Delivery app release config: HTTPS-only, `exported=false` on internal activities, `allowBackup=false` | M4 | 0.5 d |
| 1.6 | Remove `REVIEW_LOGIN_*` from production config once store review is done | M3 | 0.1 d |

## Phase 2: Prove the apps work (≈ 3-4 days)

| # | Action | Effort |
|---|---|---|
| 2.1 | Device test pass on a real Android phone against Render with Razorpay **test mode**, following `05 §7` (13 flows) and the delivery app flows in `06 §3`. Record pass/fail per flow. | 1-1.5 d |
| 2.2 | Admin click-through on local with a disposable DB: create/edit/delete for each module in `04 §3` | 1 d |
| 2.3 | iOS: add the Apple and Maps secrets and run the TestFlight workflow; repeat 2.1 on an iPhone | 0.5-1 d |
| 2.4 | Add 13 unrun backend test files to `npm test` (or delete obsolete ones) | 0.5 d |

## Phase 3: Production cut-over (per the approved runbook)

| # | Action |
|---|---|
| 3.1 | Read-only comparison of the production schema with local (needs your approval for SSH/RDS read access) |
| 3.2 | Migration rehearsal on a snapshot copy of production RDS; run the wallet check on the copy |
| 3.3 | Execute `Handover/ClikGett-AWS-Server-Replacement-Runbook.md` (backups, new instance, checks, rollback plan) |
| 3.4 | Fix the bare-domain certificate (`clikgett.com`) |
| 3.5 | Point release builds of both apps to production; Play and App Store submission |

## Phase 4: Hardening (≈ 1-2 weeks, can run after launch)

| # | Action | Fixes |
|---|---|---|
| 4.1 | Admin roles (catalog, operations, finance, super-admin) on sensitive endpoints | M2 |
| 4.2 | Paginate admin order lists; cache the homepage sections | M5 |
| 4.3 | Indexes on hot columns; DECIMAL for money columns; notification retention job | M7, M8, M10 |
| 4.4 | CI: run backend suites, `flutter test` and the admin tests on every push | M9 |
| 4.5 | Flutter: fix the 20 `catchError` handlers, add request timeouts and error states | M6 |
| 4.6 | Auth before validation on 6 routes; tidy error responses (`getroutes`, `LIMIT NaN`) | L1, L3, L4 |
| 4.7 | Clean-up: unused tables (archive first), duplicate and unused endpoints, legacy `old/` Flutter layer, SQL logging | L7, L8, L10 |
| 4.8 | Admin CSP header; restrict `/health` details and the Redis test route in production | L5, L6 |

## Suggested order of approval

1. Phase 1 items 1.4, 1.5 and 1.6: small, low risk.
2. 1.1: needs the keystore from you.
3. 1.2 and 1.3: touch real accounts; review the scripts before running them.
4. Phase 2 (verification).
5. Phase 3 (production).
6. Phase 4 (hardening).
