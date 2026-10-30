# ClikGett runbook

How to deploy, roll back, rebuild the apps and check that money is right.
No secret values are written here; it only says where each one lives.

## What runs where

| Part | Host | Address |
|---|---|---|
| Backend API (Node/Express, Docker) | Render, service `clikgett-backend` | https://clikgett-backend.onrender.com |
| Admin panel (React) | Vercel | https://clikgett.vercel.app (forwards `/api` and `/media` to Render) |
| Database (MySQL 8) | Aiven | settings in `deploy/aiven.env`, CA cert `deploy/aiven-ca.pem` |
| Images and customer photos | Supabase Storage | settings in `deploy/supabase.env` |
| Push notifications | Firebase | `FIREBASE_SERVICE_ACCOUNT_JSON` on Render |
| Customer app / rider app | Android APK / Play Store | built on a dev machine (below) |

`deploy/` is the folder next to `clikgett-code/` on the dev machine (not in git).

## Deploy

1. Commit and push to the team repo: `git push origin dev/local-docker-updates`
2. Push to the deploy repo: `git push personal dev/local-docker-updates:main`
3. Render and Vercel build from `personal/main` by themselves (Render takes ~5 min).
4. Database changes run automatically when the backend starts
   (`Backend/server/migrations/run_on_start.js`). If one fails, the new version does
   not start and Render keeps the old one live. Check the Render log for
   `[migrations] N up to date`.
5. Check: https://clikgett-backend.onrender.com/api/health returns OK, then log in to
   the admin panel.

## Roll back

- **Fast:** Render → `clikgett-backend` → Events → pick the last good deploy → *Rollback*.
  Vercel → Deployments → last good one → *Promote to Production*.
- **In git:** `git revert <commit>` then deploy as above.
- Migrations only add tables/columns, so rolling back the code is safe.

## First release to the live AWS server

Live: one EC2 server (old backend, pm2 `server`, port 3000, Node 18) and RDS `clikgett`.
The new backend sits beside it in `/home/ubuntu/clikgett-v2` (pm2 `server-v2`, port 3001,
Node 22 in `/opt/node22`), so switching back is one nginx change. Every step below was
run first on `clikgett-rehearsal`, a copy restored from snapshot `before-release-2026-10-29`.

1. RDS snapshot of `clikgett` (console: Actions → Take snapshot) and wait for *Available*.
2. Copy the release build into `clikgett-v2` (`git archive HEAD:Backend`), keep its `.env`.
3. In `clikgett-v2/.env`: delete the `DB_HOST=` line (then `HOST`, the live database, is
   used) and `ADMIN_ALERT_MOBILE=none`; keep `BACKGROUND_JOBS=off` and
   `DB_SQL_MODE=NO_ENGINE_SUBSTITUTION` (live's mode; strict mode breaks old-style writes
   such as adding to the cart).
4. Database, from `clikgett-v2` with `/opt/node22/bin/node`; look at each dry run first:
   - `server/tools/schema_sync.js diff schema_ref.json`, then add `--apply`
     (`schema_ref.json` is exported from the local Docker database).
   - `server/migrations/run_on_start.js`
   - `server/migrations/production_hardening_migration.js` (clears old plain-text OTPs)
   - `server/migrations/timestamps_utc_migration.js` (once; shifts old order times to UTC)
   - `server/tools/release_setup.js apply setup.json`, then add `--apply` (`setup.json` is
     exported from Aiven with `release_setup.js export`)
5. `pm2 restart server-v2 --update-env`; check `/api/health/db` on port 3001 names
   `clikgett`, and that the old app's calls give the same answers on 3000 and 3001.
6. Switch: in nginx `sites-enabled/default`, api.clikgett.com `proxy_pass` → `127.0.0.1:3001`,
   `nginx -t && systemctl reload nginx`. Then set `BACKGROUND_JOBS=on` and restart `server-v2`.
   Only one backend may run the jobs: the payment sweep issues real Razorpay refunds.
7. Roll back: point nginx back to `127.0.0.1:3000` and reload. The database changes only
   add tables, columns and rows, so the old backend keeps working.

## Secrets: where each one lives

| Secret | Live copy | Backup copy |
|---|---|---|
| Backend env (DB, JWT `SECRET_KEY`, Razorpay, SMS, Google `GOOGLE_APIKEY`, Supabase, Firebase, `CRON_SECRET`) | Render → Environment | `deploy/render.env` |
| Local Docker env | `clikgett-code/.env`, `Backend/.env` | — |
| App Google keys (`GOOGLE_PLACES_KEY`, `MAPS_API_KEY`) | `deploy/app-keys.env`, `Flutter/UserApp/android/local.properties` | — |
| Play Store upload key (`key.properties` + `.jks`) | **not created yet** (see below) | — |
| Older backups | `secrets-backup-2026-10-23/` | — |

Keep `deploy/` and the upload key in a password manager or a shared encrypted
drive too. If the dev laptop is lost, they cannot be recovered from git.

After rotating a key: update Render (it redeploys), the backup file, and rebuild the
app if it is an app key.

## Login sessions

- Customer and rider apps get a **1-hour login token** plus a **60-day refresh token**
  (renewed on every use; the apps renew in the background, users stay logged in).
  Change with `ACCESS_TOKEN_SECONDS` / `REFRESH_TOKEN_DAYS` on Render.
- Refresh tokens are stored only as hashes (`AuthRefreshTokens`). Reusing an old one
  ends that login everywhere. Logout and account deletion end it on the server.
- App versions before Oct 2026 don't ask for refresh tokens and still get one-year tokens.
- Login tokens are only accepted in the `Authorization` header, never in a URL. Invoice
  links opened in a browser use a 5-minute key for that one invoice.
- To log **everyone** out (e.g. after a leak): change `SECRET_KEY` on Render and run
  `UPDATE AuthRefreshTokens SET RevokedAt = NOW(), RevokeReason = 'reset' WHERE RevokedAt IS NULL;`

## Build the apps

Test APK (Render backend), from `Flutter/UserApp`:

```
PK=$(grep -E "^GOOGLE_PLACES_KEY=" ../../../deploy/app-keys.env | cut -d= -f2- | tr -d '\r')
flutter build apk --release --dart-define=API_BASE_URL=https://clikgett-backend.onrender.com/api --dart-define=GOOGLE_PLACES_KEY=$PK
```

Output: `build/app/outputs/flutter-apk/app-release.apk` (we keep a copy in
`RENDER_APKS/clikgett-user-app-render.apk`).

Play Store bundles (both apps): `Flutter\build-release.ps1 -ApiUrl https://<api>/api`.
It needs `UserApp\android\key.properties` and `Deliveryboy\key.properties` (upload
key). **These do not exist yet**: create the upload key once, back it up, and
never lose it. Without it, updates to a published app cannot be signed.

## Daily checks

| Check | How | Healthy |
|---|---|---|
| API up | `GET /api/health` (set up a free uptime monitor on it) | `"status":"healthy"` |
| Database | `GET /api/health/db` | connected |
| Money | `GET /api/admin-wallet-check?days=1` (admin token, or header `x-cron-secret: <CRON_SECRET>`); locally `npm run wallet:check -- 1` | `Healthy: true` |
| Errors | Render → Logs, search `Error` / `500` | nothing new |

The wallet check flags cashback on cancelled orders, cashback paid twice, cashback
over 20% of an order or over the cap, wallet balances that differ from the
transaction history, and negative balances.

Cashback rate, cap and mode are in admin → **Settings → Cashback**.

## Background jobs

Cart reminders (hourly), win-back coupons (6-hourly) and payment recovery run inside
the backend process.

Customer rewards (hourly, `services/CustomerRewards.js`): comeback wallet cash for
customers who stopped ordering, the birthday gift, and taking back unused reward money
when it expires. Both are off until switched on in admin → **Settings → Comeback &
Birthday Rewards** (amount, days, expiry; "Run now" runs it at once). Wallet rows:
ContentType 6 = comeback, 7 = birthday. On a plan that sleeps when idle they do not run; keep the
backend on an always-on plan. They can also be triggered by a scheduler:
`POST /api/carts/abandoned/trigger-notifications`, `POST /api/promocodes/winback/trigger`
with the `x-cron-secret` header.

## Tests

Local Docker stack: `docker compose up -d` in `clikgett-code`, then from `Backend`:
`API_URL=http://127.0.0.1:5001/api npm test` (all suites must pass before deploying).
