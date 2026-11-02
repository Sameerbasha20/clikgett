# CLIKGETT — COMPLETE LOCAL DOCKER ENVIRONMENT SETUP GUIDE

**Document Version:** 1.0.0  
**Environment:** Local Development, Automated Testing & QA Staging  
**Isolation Guarantee:** 100% Isolated from AWS Production Services  

---

## 1. Architecture Overview

This Docker Compose environment provides a fully self-contained local stack for ClikGett development, API testing, and UI integration without touching live cloud databases or third-party gateways.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   Host Browser / Postman               │
                    └────────┬──────────────────────┬────────────────────────┘
                             │ :3001                │ :5001
                             ▼                      ▼
┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│      clikgett-admin (Nginx)      │─────▶│     clikgett-backend (Node.js)   │
│  React 18 SPA + Reverse Proxy    │ /api │  Express 4 + Comprehensive Health│
└──────────────────────────────────┘      └──────────────┬───────────────────┘
                                                         │
         ┌───────────────────────┬───────────────────────┼───────────────────────┐
         │ :3306                 │ :6379                 │ :9000                 │ :1025
         ▼                       ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  clikgett-mysql  │   │  clikgett-redis  │   │  clikgett-minio  │   │ clikgett-mailpit │
│    MySQL 8.0     │   │   Redis 7-alpine │   │ S3-Compatible Storage│   │ Local SMTP & Web │
│ Authoritative DB │   │  Cache & Sessions│   │ Media & Uploads  │   │ Email Inspector  │
└──────────────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘
         │
         │ (Planned Migration)
         ▼ :5433
┌──────────────────┐
│clikgett-postgres │
│  PostgreSQL 16   │
│ Migration Target │
└──────────────────┘
```

---

## 2. Service Inventory & Port Allocations

| Service Name | Container Name | Image | Host Port | Internal Port | Healthcheck | Purpose |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **`backend`** | `clikgett-backend` | `Dockerfile` | **`5001`** | `5000` | `GET /health` | Express API, auth guards, business logic |
| **`admin`** | `clikgett-admin` | `Dockerfile` | **`3001`** | `3000` | `GET /` (HTTP 200) | React Admin Dashboard with Nginx proxy |
| **`mysql`** | `clikgett-mysql` | `mysql:8.0` | **`3306`** | `3306` | `mysqladmin ping` | Authoritative relational schema & seed data |
| **`postgres`**| `clikgett-postgres`| `postgres:16-alpine`| **`5433`**| `5432` | `pg_isready` | PostgreSQL migration target schema |
| **`redis`** | `clikgett-redis` | `redis:7-alpine` | **`6379`** | `6379` | `redis-cli ping` | In-memory cache & session store |
| **`minio`** | `clikgett-minio` | `cgr.dev/.../minio` | **`9100`** / **`9101`** | `9000` / `9001` | `mc ready local` | S3 API (9100) and Console (9101) |
| **`minio-init`**| `clikgett-minio-init`| `cgr.dev/.../minio`| — | — | One-shot (`/init.sh`)| Idempotent bucket provisioning |
| **`mailpit`** | `clikgett-mailpit`| `axllent/mailpit` | **`8025`** / **`1025`**| `8025` / `1025` | Process check | Web UI (8025) and SMTP inbox (1025) |

*Note: Host ports have been carefully selected to avoid conflicts with existing processes on Windows (e.g. MinIO is on 9100/9101, PostgreSQL on 5433, Admin on 3001, Backend on 5001).*

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- **Docker Desktop** for Windows with WSL2 backend enabled.
- **Node.js 18+** (for host testing tools if running outside Docker).

### Step 1: Clone & Configure Environment
In the repository root (`C:\Users\DELL\Desktop\clikgett\clikgett-code`):

```powershell
# Copy the environment template
Copy-Item .env.example .env
```

### Step 2: Validate Docker Compose Configuration
```powershell
docker compose config
```

### Step 3: Launch the Full Local Stack
```powershell
docker compose up -d
```

### Step 4: Verify Container Health
```powershell
docker compose ps
```

All services will report `healthy`.

---

## 4. Persistent Storage (Named Docker Volumes)

Data persists across container restarts using dedicated named Docker volumes:

- `clikgett_mysql_data` -> Persists MySQL relational tables, indexes, and seeded data.
- `clikgett_postgres_data` -> Persists PostgreSQL migration test database.
- `clikgett_redis_data` -> Persists Redis append-only files (AOF).
- `clikgett_minio_data` -> Persists S3 media buckets (`clikgett-media`, `clikgett-uploads`).

---

## 5. Local Service Endpoints

- **Admin Web Dashboard:** [http://localhost:3001](http://localhost:3001)
  - Default Admin Login: `admin@clikgett.com` / `admin123` (Demo OTP: `123456`)
- **Backend API Health Check:** [http://localhost:5001/health](http://localhost:5001/health)
- **Backend Database Health:** [http://localhost:5001/health/db](http://localhost:5001/health/db)
- **Backend Redis Health:** [http://localhost:5001/health/redis](http://localhost:5001/health/redis)
- **MinIO Console UI:** [http://localhost:9101](http://localhost:9101)
  - Credentials: `clikgett_minio_admin` / `clikgett_minio_pass123`
- **Mailpit Web Inbox:** [http://localhost:8025](http://localhost:8025)

---

## 6. Mobile Application Integration (Emulators & Physical Devices)

When testing mobile applications against this local Docker backend:

### Android Emulator (Pixel 8 / AVD)
The Android emulator runs inside its own virtual network. To access the host machine's Docker backend:
- **Base URL:** `http://10.0.2.2:5001/api`
- Update `Flutter/UserApp/lib/Services/base_url.dart` or configuration constant to `http://10.0.2.2:5001/api`.
- Ensure `android:usesCleartextTraffic="true"` is declared in `AndroidManifest.xml` for local HTTP testing.

### Physical Devices (over Wi-Fi / ADB Reverse)
To connect a physical device connected via USB:
```powershell
adb reverse tcp:5001 tcp:5001
```
The mobile app can then connect to `http://localhost:5001/api` directly over USB.

---

## 7. Common Operational Commands

```powershell
# View real-time logs across all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f mysql

# Restart backend after code changes
docker compose restart backend

# Stop all local containers safely (preserving volume data)
docker compose down

# Stop and wipe local database volumes (clean reset)
docker compose down -v
```
