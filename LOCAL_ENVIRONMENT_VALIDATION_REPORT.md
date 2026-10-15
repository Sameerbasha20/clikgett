# CLIKGETT — LOCAL DOCKER ENVIRONMENT VALIDATION REPORT

**Audit Date:** October 14, 2026  
**Environment:** Complete Local Isolated Docker Compose Stack  
**Validation Status:** **100% OPERATIONAL & VERIFIED**  

---

## 1. Executive Summary

This report documents the verification of the complete, isolated local Docker Compose environment for the ClikGett platform. 

The environment runs entirely on local infrastructure, connects to local databases and caches, captures development emails locally, provisions local S3-compatible object storage, and guarantees **zero dependency on or fallback to live AWS production services**.

---

## 2. Service Status & Health Verification Table

All services were verified via real runtime checks and health probes:

| Service | Container Name | Version / Base | Health Status | Host Port | Internal Port | Evidence / Verification Method |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **`mysql`** | `clikgett-mysql` | `mysql:8.0` | **HEALTHY** | `3306` | `3306` | `mysqladmin ping` / 30 tables initialized |
| **`postgres`** | `clikgett-postgres` | `postgres:16-alpine` | **HEALTHY** | `5433` | `5432` | `pg_isready` / 16 tables initialized |
| **`redis`** | `clikgett-redis` | `redis:7-alpine` | **HEALTHY** | `6379` | `6379` | `redis-cli ping` -> `PONG` |
| **`minio`** | `clikgett-minio` | `cgr.dev/.../minio` | **HEALTHY** | `9100` / `9101` | `9000` / `9001` | `mc ready local` / Web UI on 9101 |
| **`minio-init`**| `clikgett-minio-init`| `cgr.dev/.../minio` | **EXITED (0)** | — | — | Idempotent bucket provisioning complete |
| **`mailpit`** | `clikgett-mailpit` | `axllent/mailpit` | **HEALTHY** | `8025` / `1025` | `8025` / `1025` | Web inbox on 8025 / SMTP on 1025 |
| **`backend`** | `clikgett-backend` | `node:18-alpine` | **HEALTHY** | `5001` | `5000` | `GET /health` -> 200 OK |
| **`admin`** | `clikgett-admin` | `nginx:alpine` | **HEALTHY** | `3001` | `3000` | `GET /` -> 200 OK HTML |

---

## 3. Database Schema Verification

### A. Local MySQL 8.0 (`clikgett-mysql`)
- **Database:** `clikgett-dev`
- **Tables Initialized (30 Core Tables):**
  `Address`, `AdminShopToggleSettings`, `AdminUsers`, `Banners`, `CartItems`, `Carts`, `Categories`, `CustomerRequests`, `DriverLocationPings`, `Feedback`, `MembershipPlans`, `OrderETAAdjustments`, `OrderItems`, `Orders`, `PhotoOrders`, `ProductNotify`, `ProductVariants`, `Products`, `PromoCodes`, `RewardMilestones`, `Routes`, `Settings`, `SubCategories`, `Users`, `Warehouses`, `buy_more_config`, `cart_offers`, `cashback_rules`, `product_restrictions`, `wallet_transactions`.
- **Seed Data Verified:**
  - Admin: `admin@clikgett.com` (`AdminID = 1`, Role = 1).
  - Delivery Partner: `deliveryboy1@clikgett.com` (`AdminID = 16`, Role = 16, DutyStatus = `ONLINE`).
  - Customer: `1000523` / `9999999999` (Wallet Balance: 500.00).
  - Core Catalog: Milk Product 82 with Variant 1, Categories, Subcategories, Warehouse, and Operational Settings.

### B. Local PostgreSQL 16 (`clikgett-postgres`)
- **Database:** `clikgett_pg_dev`
- **Tables Initialized (16 Core Relational Tables):**
  `"Address"`, `"AdminUsers"`, `"Banners"`, `"CartItems"`, `"Carts"`, `"Categories"`, `"OrderItems"`, `"Orders"`, `"ProductVariants"`, `"Products"`, `"PromoCodes"`, `"Routes"`, `"Settings"`, `"SubCategories"`, `"Users"`, `"Warehouses"`.
- **Identity & Trigger Verification:**
  - Sequences created for primary keys.
  - Automatic `update_updated_at_column()` trigger function verified.

---

## 4. Redis Integration & Operations Verification

- **Client:** `ioredis` (installed in `Backend/package.json`).
- **Service Module:** `Backend/server/utils/redis.js`.
- **Operational Features:**
  - Connection retry strategy with 5 max attempts.
  - Non-fatal offline mode (Express server does not crash if Redis is unavailable).
  - Dedicated `/health/redis` and automated set/get/del verification via `POST /health/redis/test`.
- **Security Rule Enforced:** Sensitive personal data, passwords, OTPs, and payment tokens are never cached.

---

## 5. MinIO Object Storage Verification

- **Buckets Created:**
  - `clikgett-media` (Public read for frontend catalog asset serving).
  - `clikgett-uploads` (Isolated private bucket for temporary order photos and customer prescriptions).
- **Access Endpoints:**
  - API Gateway: `http://localhost:9100` (Internal: `http://minio:9000`).
  - Web Console: `http://localhost:9101` (Credentials: `clikgett_minio_admin` / `clikgett_minio_pass123`).

---

## 6. Admin Frontend & Production Build Verification

- **Framework:** React 18 / React Router.
- **Production Bundle:** Built with `react-scripts build` into static distribution served by `nginx:alpine`.
- **Routing & Reverse Proxy:**
  - `GET /` -> Served via Nginx with SPA `try_files` fallback.
  - `GET /api/*` -> Reverse proxied directly to `http://backend:5000/api/*` inside the Docker bridge network.
- **Local Access:** [http://localhost:3001](http://localhost:3001).

---

## 7. Mobile App Integration Guidelines

- **Android Emulator Access:** Configure `http://10.0.2.2:5001/api` in `Flutter/UserApp/`.
- **Physical Device Access:** Run `adb reverse tcp:5001 tcp:5001` over USB to enable direct connection to `http://localhost:5001/api`.
- **Network Security:** Declared `android:usesCleartextTraffic="true"` in local development manifests.

---

## 8. Exact Reproduction Commands

```powershell
# 1. Validate Docker Compose syntax
docker compose config

# 2. Start all services in the background
docker compose up -d

# 3. Check container health status
docker compose ps

# 4. Probe live backend health
Invoke-RestMethod -Uri "http://localhost:5001/health"

# 5. Verify Redis operations
Invoke-RestMethod -Uri "http://localhost:5001/health/redis/test" -Method POST

# 6. Stop stack safely
docker compose down
```

**Status:** **LOCAL DOCKER ENVIRONMENT VERIFIED & READY FOR TEAM USE**
