# 10 — Docker and Infrastructure Audit

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

## 1. Local stack (`docker-compose.yml`)

All 7 long-running containers were **Up (healthy)** during the audit.

| Service | Image | Host port | Health check | Restart | Volume |
|---|---|---|---|---|---|
| mysql | mysql:8.0 | 127.0.0.1:3306 | yes | unless-stopped | named volume |
| postgres | postgres:16-alpine | 127.0.0.1:5433 | yes | unless-stopped | named volume. Labelled "Planned Migration Target" in compose; **not used by the backend** (no `pg` dependency). It costs resources for nothing today. |
| redis | redis:7-alpine (password) | 127.0.0.1:6379 | yes | unless-stopped | named volume |
| minio | `cgr.dev/chainguard/minio:latest` | 127.0.0.1:9100/9101 | yes | unless-stopped | named volume |
| minio-init | `…minio:latest` | — | one-shot | — | creates the bucket |
| mailpit | `axllent/mailpit:latest` | 127.0.0.1:1025/8025 | yes | unless-stopped | — |
| backend | built from `Backend/Dockerfile` | **0.0.0.0:5001** (overridable by `BACKEND_BIND_ADDRESS`) | `wget /health` | unless-stopped | named volumes for uploaded images |
| admin | built from `Admin/Dockerfile` (nginx) | 127.0.0.1:3001 | yes | unless-stopped | — |

**Findings**

- **Backend exposed to the network:** the backend listens on all interfaces so phones on the Wi-Fi can reach it. Anyone on the same network can reach the dev API, which holds production-derived test data. Bind to 127.0.0.1 when phone testing isn't needed.
- **Unpinned images:** `:latest` tags for MinIO and Mailpit (`docker-compose.yml:83, 108, 126`) make builds non-reproducible. Pin versions.
- **Stale container:** the admin container was 12 days behind the source when the audit started (built 23 Oct). Rebuilt during the audit with `docker compose up -d --build admin`. Nothing rebuilds it automatically.
- **Demo defaults:** demo 2FA OTP default `123456` and default MinIO credentials in compose. Acceptable for local use only.

## 2. Isolation from production

| Guard | Evidence |
|---|---|
| Local DB host fixed | `DB_HOST: mysql` is literal in compose, not taken from the shell environment |
| RDS guard | `utils/db.js:23-24`: in development the backend refuses to start against an `*.rds.amazonaws.com` host unless `ALLOW_REMOTE_DB=true` |
| Storage | `S3_ENDPOINT: http://minio:9000`. Local uploads go to MinIO, not AWS S3 |
| SMS / email | `SMS_APIKEY`/`TEXTSPEED_APIKEY` default to empty; email goes to Mailpit |
| Payments | `RAZORPAYID` defaults to a mock test key |

Local development cannot reach production RDS or S3 unless someone sets those variables deliberately.

## 3. Environments

| Environment | Backend | Database | Admin | Apps |
|---|---|---|---|---|
| Local | Docker :5001 (`NODE_ENV=development`) | Docker MySQL `clikgett-dev` | Docker :3001 | APK with `API_BASE_URL` = PC LAN address |
| Test / staging | Render (`clikgett-backend.onrender.com`, `NODE_ENV=production` per `render.yaml:20-21`) | Aiven MySQL (test data) | Vercel | `RENDER_APKS/*.apk` |
| Production | **Old code** on AWS EC2 (Mumbai) behind nginx + Let's Encrypt; RDS `clikgett`; S3 `clikgett` | RDS | `admin.clikgett.com` (old build) | Play Store / App Store builds (old) |

**Production readiness of the new stack:**
- **HTTPS:** handled by nginx and certbot on EC2 (from the earlier server survey). The bare-domain certificate (`clikgett.com` without `www`) has a name mismatch.
- **Not started:** the server replacement runbook (`Handover/ClikGett-AWS-Server-Replacement-Runbook.md`) hasn't been executed.
- **Unverified:** `BACKGROUND_JOBS` and the cron secret for production.

## 4. Persistence

- MySQL, Redis and MinIO use named volumes, so data survives container rebuilds (the admin rebuild during the audit didn't touch data).
- Uploaded customer images are in MinIO. On Render they go to object storage (from commit history: "Customer photos … go to object storage, so they survive Render restarts").
