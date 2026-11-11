# 20 · New AWS server: fresh, new-build only (plan)

**Status: plan only. Nothing in AWS has been changed. Every console step needs the owner's
approval on the day.**

There are no active users, so the old server (old Node 18 backend, old admin, the v1/v2
side-by-side setup in `docs/RUNBOOK.md`) is **not** carried over. The new server runs only
this repo's build, the same Docker image Render runs.

## 1. Target layout

```
Internet ──443──> EC2 "clikgett" (Ubuntu 24.04, t3.small, Elastic IP 13.203.168.243)
                   ├─ nginx (host)  admin.clikgett.com → /var/www/admin (Admin/build)
                   │                api.clikgett.com   → 127.0.0.1:5000 (/api, /media)
                   │                clikgett.com, www  → /var/www/site (restored from backup)
                   ├─ certbot (Let's Encrypt, auto-renew timer)
                   └─ Docker: backend (Backend/Dockerfile, user node, restart unless-stopped)
                                     redis (optional, REDIS_ENABLED)
                    │                              │
                    ▼ 3306 (private)               ▼ HTTPS
              RDS MySQL "clikgett"           S3 bucket "clikgett" (private; images by key)
```

| Choice | Why |
|---|---|
| Docker for the backend | Same image as Render and local, already tested (711 checks); no Node version on the host to manage |
| nginx on the host, not in Docker | Certbot renews in place; the admin site is plain files |
| t3.small (2 GB) instead of t3.micro | Backend + Redis + nginx + Docker build fit comfortably; ~$15/month more. t3.micro works with 2 GB swap if cost matters |
| Keep RDS `clikgett` | Holds the live catalogue, users and order history |
| Keep S3 `clikgett`, private | The backend reads images by key and serves them under `/media`; CloudFront is no longer needed |
| Port 5000 bound to 127.0.0.1 | Only nginx can reach the API |

## 2. Before the night (no downtime)

| # | Step | Who |
|---|---|---|
| 2.1 | Client approves; pick a 2-hour window | Client |
| 2.2 | Fresh backup of the old server to `deploy/live-server-backup-<date>/` (nginx, letsencrypt, website files, both `.env` files). The 29 Oct backup exists already | Dev |
| 2.3 | Build `Admin/build` with `REACT_APP_API_URL=https://api.clikgett.com/api`; `git archive` the release commit | Dev |
| 2.4 | Write `deploy/aws.env` (git-ignored, mode 600). See section 5 | Dev |
| 2.5 | Rehearse steps 4.3–4.8 against a copy of RDS (restore snapshot to `clikgett-rehearsal`), then delete the copy | Dev + Owner |
| 2.6 | Export `schema_ref.json` (local Docker DB) and `setup.json` (`release_setup.js export`) | Dev |

## 3. Backups (window start, site still up)

| # | Step | Who |
|---|---|---|
| 3.1 | RDS `clikgett` → Take snapshot `before-v2-server-<date>`; wait for *Available* | Owner |
| 3.2 | Old EC2 volume → Create snapshot `old-server-<date>`; wait for *Completed* | Owner |
| 3.3 | Check RDS automated backups: retention ≥ 7 days | Owner |

## 4. Build the new server

| # | Step | Who |
|---|---|---|
| 4.1 | Launch Ubuntu 24.04, t3.small, key pair `clikgett`, 20 GB gp3 encrypted, termination protection on. New security group `clikgett-web`: 22 from the office IP only, 80 + 443 from anywhere. Nothing else | Owner |
| 4.2 | Stop the old instance (do not terminate yet). Move Elastic IP 13.203.168.243 to the new one, so DNS stays as it is | Owner |
| 4.3 | Host setup: `apt upgrade`; install `docker.io docker-compose-v2 nginx certbot python3-certbot-nginx`; 2 GB swap; unattended security updates; Docker log limits (`max-size 10m`, `max-file 5`) | Dev |
| 4.4 | Copy the release, `deploy/aws.env` → `/opt/clikgett/.env`, and the Firebase key files. `docker compose up -d backend redis` with the API published as `127.0.0.1:5000:5000` | Dev |
| 4.5 | Database release steps, from the container (each dry run first): `schema_sync.js diff schema_ref.json` → `--apply`; `run_on_start.js`; `production_hardening_migration.js`; `timestamps_utc_migration.js` (once); `release_setup.js apply setup.json` → `--apply` | Dev |
| 4.6 | Images: `import_cloudfront_media.js` (copies every image the DB names into the bucket under the same key; safe to re-run), then `remove_aws_media_urls_migration.js` (stored full URLs → keys). Do this before CloudFront is switched off | Dev |
| 4.7 | nginx: restore the certificates from the backup (or `certbot --nginx -d api.clikgett.com -d admin.clikgett.com -d clikgett.com -d www.clikgett.com`); admin files to `/var/www/admin` with SPA fallback; `client_max_body_size 15m`; HSTS; `certbot renew --dry-run` | Dev |
| 4.8 | RDS security group: allow 3306 **only** from `clikgett-web`; remove `0.0.0.0/0` and the office IP | Owner |
| 4.9 | Set `BACKGROUND_JOBS=on` (only this server runs jobs), restart backend | Dev |

## 5. Server `.env` (values in `deploy/aws.env`, never in git)

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `HOST`, `DB_USER`, `DB_PASSWORD`, `DATABASE` | RDS `clikgett` (no `DB_HOST`) |
| `DB_SQL_MODE` | `NO_ENGINE_SUBSTITUTION` |
| `SECRET_KEY` | **new random value** (logs everyone out; fine with no users) |
| `S3_ENDPOINT` | `https://s3.ap-south-1.amazonaws.com` |
| `S3_REGION`, `S3_BUCKET` | `ap-south-1`, `clikgett` |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | An IAM user limited to that bucket (owner creates it; or an instance role) |
| `PUBLIC_MEDIA_BASE_URL` | `https://api.clikgett.com/media/` |
| Razorpay | Live key id + secret + webhook secret (`deploy/razorpay-live.env`); webhook URL updated in the Razorpay dashboard |
| `TEXTSPEED_APIKEY` | Live SMS key |
| `FIREBASE_SERVICE_ACCOUNT_JSON`, `RIDER_FIREBASE_CREDENTIALS` | Paths to the key files |
| `GOOGLE_APIKEY` | Server Google key |
| `REDIS_ENABLED` | `true` (Redis container) |
| `BACKGROUND_JOBS` | `off` until 4.9, then `on` |
| `CRON_SECRET` | New random value |
| `ADMIN_ALERT_MOBILE` | Owner's number |

Leave the `SUPABASE_*` variables out, so the backend uses S3.

## 6. Checks (downtime ends when all pass)

| # | Check | Expected |
|---|---|---|
| 6.1 | `https://api.clikgett.com/api/health/db` | `OK`, database `clikgett` |
| 6.2 | `curl http://13.203.168.243:5000` from outside | Times out |
| 6.3 | Admin: log in, open products (images show), add a test product with a photo | Works; the photo is in S3 |
| 6.4 | New customer APK (built with `API_BASE_URL=https://api.clikgett.com/api`): OTP login, home, product images, cart, COD order | Order shows in admin |
| 6.5 | Rider APK (`-PapiBaseUrl=https://api.clikgett.com/api/`): login, accept, deliver with OTP | Order delivered |
| 6.6 | One ₹1 Razorpay payment, then refund from admin | Paid, then refunded |
| 6.7 | `sudo reboot`; after 2 minutes the site answers | Up |
| 6.8 | Uptime check on `/api/health` set up (UptimeRobot or similar) | Alert arrives when stopped |

## 7. Afterwards

- Publish the new app builds (Play Store, signed with the upload key, see report 19 item 3.1).
- Point Render's backend away from production, or delete it, so only AWS runs jobs.
- After 7 stable days: terminate the old instance, delete `cligget-test` and `clikgett-rehearsal`,
  delete the old disk snapshot, switch off CloudFront. **Keep the RDS snapshots.**
- Update `docs/RUNBOOK.md` with the new instance ID and the Docker deploy steps.

## 8. Going back

The old instance is only **stopped** until step 7. If the checks fail and can't be fixed in
30 minutes: move the Elastic IP back to the old instance and start it. The database release
steps only add tables, columns and rows, so the old backend still runs on it. If data must
be rolled back, `export_since.js` saves everything written since the snapshot first.
