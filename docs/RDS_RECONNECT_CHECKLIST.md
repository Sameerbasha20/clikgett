# Reconnecting the backend to AWS RDS

Development currently runs against the local Docker stack. `Backend/.env` points at
local MySQL and MinIO; the production values are kept in `Backend/.env.rds`
(git-ignored, never commit it).

## 1. Before switching

- Rotate every credential that was exposed in git history or in old admin bundles:
  JWT `SECRET_KEY`, AWS IAM keys (S3), Firebase service account, SMS keys
  (`SMS_APIKEY`, `TEXTSPEED_APIKEY`), Razorpay secret, Google API key.
  Put the new values only in `Backend/.env.rds` / the server's environment.
- Take an RDS snapshot.

## 2. Schema: tables that exist locally but not on RDS

These were added by features built against the local database (checked
2026-10-15 against a structure-only dump of RDS). Create them on RDS, using the
definitions in `docker/mysql/init.sql`, before deploying the new backend:

`CustomerRequests`, `DriverLocationPings`, `HomeSectionCategories`,
`HomeSectionSubcategories`, `PhotoOrders`, `ProductNotify`, `RewardMilestones`,
`abandoned_carts`, `cashback_rules`, `cashback_transactions`,
`customer_milestones`, `memberships`, `milestone_rewards`, `notification_media`,
`order_timeline`, `sale_products`, `sales`, `scheduled_orders`, `wallet_expiry`,
`wallet_transactions`.

Columns added locally since then should be compared the same way: dump RDS with
`mysqldump --no-data`, load it into a scratch database and diff
`information_schema.columns` against the local schema.

The reverse direction (RDS tables/columns missing locally) is handled by
`docker/mysql/schema_sync_rds.sql`, which is additive and safe to re-run.

Then run the backend migrations against RDS (each is idempotent), including:

```sh
node server/migrations/order_lifecycle_migration.js   # AdminUsers.FCMToken, Orders.RefundStatus/RefundID, OrderPayments.PaymentID/ConsumedAt/Purpose
node server/migrations/app_settings_migration.js       # SupportPhone/Email, TipPresets, WalletTopupAmounts, FAQs (only if missing)
node server/migrations/delivery_time_rules_migration.js # <=5 km 20 min, >5 km 30 min, +10 min per 10 items above 10
node server/migrations/store_mode_migration.js       # admin Open now / Close now / Follow timings (StoreMode, StoreModeUntil)
node server/migrations/cashback_review_migration.js   # CashbackPending.RejectReason + index on OrderID (manual cashback review)
```

## 3. Switch

```sh
cp Backend/.env.rds Backend/.env      # then edit:
#   NODE_ENV=production
#   DB_SSL=true
#   DB_SSL_CA=/path/to/<region>-bundle.pem   (https://truststore.pki.rds.amazonaws.com)
#   CRON_SECRET=<long random value>          (for the abandoned-cart / win-back scheduler)
#   remove S3_ENDPOINT so uploads go to AWS S3; set S3_REGION=ap-south-1
#   OrderPlace=3, OrderCancel=4               (wallet transaction type codes)
#   ADMIN_ALERT_MOBILE=<store owner's mobile>  (new-order SMS; defaults to the old number in production)
```

In `NODE_ENV=development` the backend refuses to start against an
`*.rds.amazonaws.com` host unless `ALLOW_REMOTE_DB=true` is set, which protects
production from local test runs.

## 4. Verify

```sh
cd Backend && API_URL=https://<api-host>/api npm run test:security
```

Mobile release builds need the HTTPS API URL:
`flutter build apk --release --dart-define=API_BASE_URL=https://<api-host>/api`
and `./gradlew assembleRelease -PapiBaseUrl=https://<api-host>/api/` for the
delivery app, plus a real signing key in `key.properties`.

## Rider push notifications

The delivery app is in the Firebase project `clikgett-delivery`. Put that project's
service-account key at `Backend/server/utils/clikgett-delivery-firebase.json`
(git-ignored) or set `RIDER_FIREBASE_CREDENTIALS` to its path. Without it riders
still get new orders through the app's 20-second refresh.

## Admin passwords

Admin passwords are stored hashed (scrypt). Existing plain-text rows are upgraded
automatically the first time each admin logs in; nothing to run.

## Test data left in production

Earlier automated tests created live catalog items in production. Hide them (done locally):

```sql
UPDATE Products SET Status = 0 WHERE ProductName LIKE 'E2E Unified Test Product%';
UPDATE Sales SET Status = 0 WHERE SaleName IN ('E2E Automated Mega Flash Sale', 'Negative Sale');
```
