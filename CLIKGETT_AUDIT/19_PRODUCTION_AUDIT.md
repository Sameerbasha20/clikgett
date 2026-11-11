# 19 · Production readiness audit (11 November 2026)

Scope: the whole repo as it will go to the new AWS server: backend, admin site, customer app,
rider app, Docker/CI, docs. Earlier audits: `01`–`16`. Clean-up details: `18_CLEANUP_REPORT.md`.

**Verdict: the code is ready for a fresh server. What is left is mostly setup that needs the
AWS account owner or the client (keys, accounts, store listings), listed in section 3.**

## 1. Checks run

| Check | Result |
|---|---|
| Backend automated tests (`npm test`, 32 suites, local Docker database) | **711 checks pass** |
| Admin tests / production build | 5 pass / builds |
| Customer app: `flutter analyze` / `flutter test` / release APK | 0 errors, 0 warnings / 46 pass / builds |
| Rider app: unit tests, lint, debug + release build | pass |
| Secret scan of every tracked file (AWS, Google, Razorpay, private keys, GitHub tokens, JWTs) | No secrets. Razorpay key IDs were hardcoded in the app (fixed, see 2.1) |
| `npm audit` (production dependencies) | Backend: 3 high, 13 moderate, 1 low. Admin: 4 moderate. See 3.6 |
| Unused code | Removed (section 2.6, report 18) |

## 2. Fixed in this pass

### 2.1 Customer app could pay with the live Razorpay key on a test server *(high)*
When the server sent no Razorpay key, the app fell back to a live key hardcoded in
`Constants.dart`. A test server could then open real live payments that its backend cannot
verify. **Fix:** the hardcoded keys are gone. The app uses only the key the server sends
(`/account/config`); with none, checkout, wallet top-up and membership say "Online payment is
not available right now" and stop.

### 2.2 App logs in release builds *(medium, privacy)*
65 `print` calls (some with phone numbers, addresses, order details) wrote to the phone's
log, which other tools can read. **Fix:** release builds silence `print` and `debugPrint`
in `main.dart`; debug builds still log.

### 2.3 Backend hardening *(medium)*
| Gap | Fix |
|---|---|
| No catch-all error handler: a crash could answer with Express's HTML page | JSON error handler: `400` bad JSON, `413` upload too large, `500` "Something went wrong"; details only in the server log |
| Unknown `/api/...` paths answered with an HTML page | JSON `404` |
| No clean shutdown: deploys cut requests mid-way | On SIGTERM/SIGINT the server finishes open requests, closes the database, then exits (15 s limit) |
| Docker container ran as root | Runs as the image's `node` user |
| JSON body parser registered 3 times with different limits | One parser (15 MB, needed for photo orders) |

### 2.4 Product images that never uploaded *(medium)*
A failed admin upload saved a made-up file name, so customers saw a broken image (product
1223). **Fix (earlier today):** the admin shows the upload error, and the backend refuses a
product whose pictures are not in storage. The product itself still needs its picture
uploaded again in admin.

### 2.5 Unused infrastructure
The PostgreSQL container ("planned migration target") was never used by the code: removed
from `docker-compose.yml` and `.env.example`.

### 2.6 Old code removed
314 files, 65 routes, 5 duplicate URL prefixes, 32 functions, 33 packages, 123 rider-app
resources; about 56,000 lines. Every item and its reason: `18_CLEANUP_REPORT.md`.

## 3. Open items (need a decision or access)

| # | Item | Risk | Who | What to do |
|---|---|---|---|---|
| 3.1 | **Play Store upload key.** A keystore exists only on the dev PC (`Flutter/UserApp/productionKeys/clikgett-keystore.jks`, git-ignored); `key.properties` is not set up, so release builds use the debug key | High: losing it means a new Play listing | Client + dev | Confirm it is the Play upload key (or create one), keep a copy in a password manager, add `key.properties` |
| 3.2 | **Old admin password in git history** (a deleted test script) | High if that password is still in use | Client | Change that admin's password; it is in history forever |
| 3.3 | **RDS backups**: automated backup retention not confirmed | High | AWS owner | RDS → `clikgett` → Maintenance & backups: retention ≥ 7 days, plus a manual snapshot before the switch |
| 3.4 | **Monitoring**: no uptime alert and no error alerts | Medium | Dev + client | Free uptime check on `https://api.clikgett.com/api/health` (e.g. UptimeRobot) to the owner's phone/email; optionally CloudWatch alarm on CPU/disk |
| 3.5 | **Images on AWS**: today's live images are on the old CloudFront/S3 setup; the new backend reads images from an S3-compatible bucket by key | Medium | Dev + AWS owner | Plan in `20_NEW_AWS_INSTANCE_PLAN.md` (S3 bucket + `import_cloudfront_media.js` + `remove_aws_media_urls_migration.js`) |
| 3.6 | **Dependency advisories** | Low–medium | Dev | Backend highs are all `decode-uri-component` inside the `minio` storage client, which only decodes storage responses (not customer input); fixed versions break the client, so watch for a `minio` release. Moderates: `firebase-admin`'s Google libraries (upgrade `firebase-admin` major in a separate change), admin `react-router` 6 (fixed in 7, breaking) and `quill` (admin-only editor) |
| 3.7 | **iOS release**: TestFlight workflow needs App Store Connect API keys | Medium (iOS only) | Client | Add the ASC secrets to GitHub |
| 3.8 | **Customer delivery OTP in the rider app** is read from the server per order (fine), but riders sign up with Aadhaar photos: privacy policy must mention it | Medium (legal) | Client | Add a line to the privacy policy; rejected documents auto-delete after 30 days |
| 3.9 | **SMS key in the local `.env`**: local testing sends real OTP texts | Low | Dev | Use a blank `TEXTSPEED_APIKEY` locally |
| 3.10 | **Flutter widget tests cannot render text** (Poppins is fetched at runtime) | Low | Dev | Bundle the Poppins font files as assets so screen tests can run |

## 4. Production checklist for the new server

| Area | Status |
|---|---|
| HTTPS only (nginx + Let's Encrypt, HSTS) | In the plan (report 20) |
| API reachable only through nginx (port 5000 not open) | In the plan |
| Database not open to the internet (RDS security group = new server only) | In the plan |
| Secrets only in the server's `.env` (mode 600), never in git | In the plan |
| Database changes run automatically on start (`run_on_start.js`), failed migration = server does not start | Done |
| Background jobs on exactly one server (`BACKGROUND_JOBS`) | Done |
| Login: short tokens + refresh tokens, OTP hashed, lockouts, rate limits | Done (earlier audits) |
| Admin roles checked on every admin request | Done |
| Wallet balance and ledger change together; reconcile script | Done |
| Customer documents and photos private (signed admin-only access) | Done |
| Logs rotated (pm2-logrotate / Docker log limits) | In the plan |
| Restarts after reboot (Docker `restart: unless-stopped` / systemd) | In the plan |
| Health check `/api/health`, `/api/health/db` | Done |
| Error handler, clean shutdown, non-root container | Done (2.3) |
