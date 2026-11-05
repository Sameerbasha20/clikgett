# 13 — Project Completion Scorecard

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

## Method

- **Features:** each feature in `feature_completion_matrix.csv` (175 features in 8 areas) gets exactly one status from evidence gathered in this audit.

| Status | Rule |
|---|---|
| VERIFIED | Implementation present **and** expected behaviour shown by a passing automated test, the endpoint probe, or a browser check in this audit |
| IMPLEMENTED_NOT_VERIFIED | Code complete and wired end to end, but the behaviour wasn't exercised in this audit (e.g. no device, button not clicked) |
| PARTIAL | Works only in part, or has a known gap |
| NOT_IMPLEMENTED | Expected capability absent |
| BROKEN | Defect reproduced |
| BLOCKED | Implemented in code but couldn't be exercised safely (real SMS, push, payments) or needs access not granted |

- **Two percentages per area:**
  - **Implementation % = (Verified + Implemented-not-verified + Blocked + 0.5 × Partial) / Features.** Broken and Not-implemented count 0. Blocked counts as implemented because the code exists; it's still unproven.
  - **Verified % = Verified / Features.** The share proven to work in this audit.
- **Not used:** file counts, screen counts and lines of code.
- **Weighting:** each feature has equal weight. The feature list is the auditor's judgement of the main capabilities; changing the list changes the numbers.

## Scorecard

| Area | Features | Verified | Implemented, not verified | Partial | Not implemented | Broken | Blocked | **Implementation %** | **Verified %** |
|---|---|---|---|---|---|---|---|---|---|
| Backend | 54 | 33 | 13 | 1 | 0 | 2 | 5 | **95%** | **61%** |
| Admin website | 39 | 6 | 31 | 0 | 1 | 0 | 1 | **97%** | **15%** |
| Customer Flutter app | 29 | 0 | 24 | 2 | 1 | 0 | 2 | **93%** | **0%** |
| Delivery Android app | 12 | 1 | 9 | 0 | 1 | 0 | 1 | **92%** | **8%** |
| Database & integrations | 10 | 5 | 0 | 3 | 0 | 1 | 1 | **75%** | **50%** |
| Security | 12 | 6 | 1 | 4 | 1 | 0 | 0 | **75%** | **50%** |
| Testing & automation | 9 | 1 | 0 | 3 | 5 | 0 | 0 | **28%** | **11%** |
| Deployment readiness | 10 | 3 | 1 | 3 | 3 | 0 | 0 | **55%** | **30%** |
| **All** | **175** | **55** | **79** | **16** | **12** | **3** | **10** | **87%** | **31%** |

## How to read this

- **Features are largely built (87%), but only 31% is proven working end to end.**
  - The gap is biggest in the two mobile apps (0% and 8% verified): no device tests or UI automation were possible.
  - Admin is at 15% verified: pages load and read-only pages are verified, but create/edit/delete weren't clicked.
- **The backend is the most mature part:** 61% verified by 452 passing API checks plus the probe.
- **Testing & automation (28%) and deployment readiness (55%) are the weakest areas.** They decide whether a release is safe:
  - no CI;
  - no UI or device tests;
  - debug-signed release builds;
  - production still on the old code;
  - the server replacement not executed.

## What raises the verified numbers fastest

1. A scripted device test pass for both apps (15 §Phase 2). This moves about 30 features from "implemented" to "verified".
2. An admin click-through test with a test database (Playwright or similar). This covers about 30 admin features.
3. Adding the 13 unrun backend test files to `npm test` and running everything in CI.
