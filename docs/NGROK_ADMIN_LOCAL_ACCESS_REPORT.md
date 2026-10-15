# ClikGett Admin Portal — Single ngrok Tunnel Configuration Report

**Date:** October 9, 2026  
**Status:** Complete  
**Overall Result:** PASS  

---

## 1. Initial Configuration Discovered

- **Admin Portal:** React 18 SPA bootstrapped with Create React App (`react-scripts` 5.0.1) running on port `3000`.
- **Backend API:** Node.js Express server running on port `5000` (`clikgett-backend`), connected to MySQL (`clikgett-dev`).
- **Active ngrok Tunnel:** `https://bootleg-unaware-clubhouse.ngrok-free.dev` forwarding to `http://localhost:3000`.
- **Initial API Base Configuration:**
  - `Admin/.env` had `REACT_APP_BASE_URL="http://localhost:5000/api"`, which caused remote browsers accessing the ngrok URL to attempt API calls directly to their own local machine (`http://localhost:5000/api`), bypassing the server.
  - `Admin/src/Services.js` constructed URLs using `${getBaseApiUrl()}/${url}` with no normalization for leading slashes, redundant `api/` prefixes, or trailing slashes.
  - `Admin/package.json` had `"proxy": "http://localhost:5000"` added by the user, but Webpack Dev Server required a restart to initialize proxy middleware, and blocked external Host headers (`bootleg-unaware-clubhouse.ngrok-free.dev`) with `Invalid Host header` until `DANGEROUSLY_DISABLE_HOST_CHECK=true` was enabled.

---

## 2. Files Inspected and Modified

### Inspected Files
- `clikgett-code/Admin/package.json` — verified `"proxy": "http://localhost:5000"` configuration.
- `clikgett-code/Admin/src/Services.js` — audited all 80+ API service functions and `httpcall`.
- `clikgett-code/Admin/src/Components/dashboard/orders/Orders.jsx` & `OrderDetails.jsx` — checked invoice link URL generation.
- `clikgett-code/Backend/server/server.js` — verified all API routes are mounted under `/api/...`.
- `clikgett-code/Backend/server/utils/utils.js` — verified `Authorization: token <JWT>` header parsing and authentication scheme.

### Modified Files
1. **[`clikgett-code/Admin/src/Services.js`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Admin/src/Services.js)**
   - Implemented `normalizeUrl(rawUrl)` to sanitize paths, trim whitespaces, collapse duplicate slashes, strip redundant `api/` prefixes, preserve query strings, and safely handle absolute/relative base URLs.
   - Updated `getBaseApiUrl()` to resolve to same-origin relative `/api` for development/proxy mode, while honoring remote external production URLs if configured.
   - Added `"Accept": "application/json"` to default headers to prevent CRA development server from treating API calls as SPA navigation requests.
2. **[`clikgett-code/Admin/.env`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Admin/.env)**
   - Updated `REACT_APP_BASE_URL="/api"` to standardize same-origin relative API requests.
   - Added `DANGEROUSLY_DISABLE_HOST_CHECK=true` so Webpack Dev Server accepts requests coming through the public ngrok domain without throwing `Invalid Host header`.

---

## 3. API URL Normalization Behavior

The normalization helper `normalizeUrl` enforces consistent path construction across various caller argument formats:

| Caller Argument Input | Evaluated Target Endpoint | Query String Preserved | Resulting Request URL | Status |
| :--- | :--- | :--- | :--- | :--- |
| `users/settings` | `users/settings` | None | `/api/users/settings` | **PASS** |
| `/users/settings` | `users/settings` | None | `/api/users/settings` | **PASS** |
| `api/users/settings` | `users/settings` | None | `/api/users/settings` | **PASS** |
| `/api/users/settings` | `users/settings` | None | `/api/users/settings` | **PASS** |
| `api/api/test` | `test` | None | `/api/test` | **PASS** |
| `adminorders/pastorders?page=1&limit=10` | `adminorders/pastorders` | `?page=1&limit=10` | `/api/adminorders/pastorders?page=1&limit=10` | **PASS** |
| `  adminproducts/addvariant\n  ` | `adminproducts/addvariant` | None | `/api/adminproducts/addvariant` | **PASS** |
| `subcategories/add/` | `subcategories/add` | None | `/api/subcategories/add` | **PASS** |
| `///adminusers///list` | `adminusers/list` | None | `/api/adminusers/list` | **PASS** |
| `https://external-api.com/v1/test` | External Passthrough | Preserved | `https://external-api.com/v1/test` | **PASS** |

---

## 4. Single-Tunnel Proxy Architecture

No second ngrok tunnel is created. All traffic flows through the single active tunnel on port 3000:

```
Remote Client Browser
       │
       ▼ (HTTPS)
ngrok Public Tunnel (https://bootleg-unaware-clubhouse.ngrok-free.dev)
       │
       ▼ (HTTP)
React Dev Server (localhost:3000)
       │
       ├── Static assets / SPA routes (/, /dashboard, /orders, bundle.js)
       │   └── Served directly by Webpack Dev Server
       │
       └── Relative API calls (/api/*)
           └── Forwarded by "proxy": "http://localhost:5000"
               │
               ▼
       Express Backend (localhost:5000) ──► MySQL RDS Database
```

---

## 5. Local Test Results

| Test Item | Target URL / Command | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| Frontend Server | `http://localhost:3000` | HTTP 200 (HTML bundle) | HTTP 200, `<title>Clikgett</title>` | **PASS** |
| Backend Health | `http://localhost:5000/health` | HTTP 200, database connected | HTTP 200, `database: connected` | **PASS** |
| Local Proxied Health | `http://localhost:3000/api/health` | HTTP 200 via proxy | HTTP 200, `status: healthy` | **PASS** |
| Local Proxied Settings | `http://localhost:3000/api/users/settings` | HTTP 200, settings array | HTTP 200, 9 settings objects returned | **PASS** |
| Local Admin Login | `http://localhost:3000/api/adminuser/login` | HTTP 200, session JWT token | HTTP 200, valid JWT token returned | **PASS** |

---

## 6. Remote ngrok Test Results

All remote tests were executed directly against `https://bootleg-unaware-clubhouse.ngrok-free.dev` over the internet:

| Test Item | Endpoint | Method | Response Code | Verified Content | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Frontend HTML | `/` | GET | `200 OK` | HTML title: `Clikgett`, script bundle | **PASS** |
| API Health Proxy | `/api/health` | GET | `200 OK` | `service: clikgett-backend` | **PASS** |
| Settings Endpoint | `/api/users/settings` | GET | `200 OK` | 9 system settings returned | **PASS** |
| Admin Login | `/api/adminuser/login` | POST | `200 OK` | Valid JWT token received | **PASS** |
| Current Orders | `/api/adminorders/currentorders` | GET | `200 OK` | Orders array returned | **PASS** |
| Customers List | `/api/adminuser/userslist` | GET | `200 OK` | Users array returned | **PASS** |
| Categories List | `/api/categories/allcategoriesadmin` | GET | `200 OK` | Categories array returned | **PASS** |
| Products List | `/api/adminproducts/bycategory` | GET | `200 OK` | Products catalog returned | **PASS** |

---

## 7. Authentication & Token Handling Results

| Test Scenario | Header Sent | Target Endpoint | Expected Status | Actual Status | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Valid Admin Session | `Authorization: token <JWT>` | `/api/adminuser/userslist` | `200 OK` | `200 OK` with user list | **PASS** |
| Missing Token | None | `/api/adminuser/userslist` | `401 Unauthorized` | `401 {"Status":0,"Message":"Token empty"}` | **PASS** |
| Invalid / Expired Token | `Authorization: token invalid_token_123` | `/api/adminuser/userslist` | `401 Unauthorized` | `401 {"Status":0,"Message":"Invalid Token"}` | **PASS** |
| Client Storage Fallback | Preserved in `Services.js` | All `httpcall` invocations | Token attached | Session/Local storage fallback intact | **PASS** |

---

## 8. Errors Discovered and Resolved

1. **`Invalid Host header` from ngrok**  
   - *Cause:* Webpack Dev Server enforces DNS rebinding protection by default when `proxy` is active.  
   - *Resolution:* Added `DANGEROUSLY_DISABLE_HOST_CHECK=true` to `Admin/.env`.
2. **Missing `Accept: application/json` Header**  
   - *Cause:* In Webpack Dev Server proxy logic, GET requests without an explicit `Accept: application/json` header can be intercepted as SPA navigation requests.  
   - *Resolution:* Added `"Accept": "application/json"` to default headers in `Admin/src/Services.js`.
3. **Repeated `/api/api/` in Edge Case Inputs**  
   - *Cause:* Single slice stripped only one `api/` prefix.  
   - *Resolution:* Enhanced `normalizeUrl` with a loop (`while (cleanPath.startsWith("api/"))`) to eliminate all redundant prefixes.

---

## 9. Security Audit

- **Authentication Enforced:** Protected backend endpoints strictly reject unauthenticated calls (HTTP 401).
- **Credentials Protected:** No tokens or database passwords are logged, exposed, or committed.
- **CORS Intact:** Backend CORS remains enabled and untouched; same-origin proxy avoids CORS overhead.
- **No Cloud Deployment / Git Push:** All verification was conducted locally and through the existing tunnel.

---

## 10. Exact Steps to Run Backend, Frontend, and ngrok

### Step 1: Start the Backend (Port 5000)
```powershell
cd C:\Users\DELL\Desktop\clikgett\clikgett-code\Backend
node server/server.js
```
*Health verification:* `http://localhost:5000/health`

### Step 2: Start the Admin Portal (Port 3000)
```powershell
cd C:\Users\DELL\Desktop\clikgett\clikgett-code\Admin
npm start
```
*Local verification:* `http://localhost:3000`

### Step 3: Run the Existing ngrok Tunnel
```powershell
ngrok http 3000
```
*Remote client share link:* `https://bootleg-unaware-clubhouse.ngrok-free.dev`

*(Note: For free ngrok accounts, when the client opens the link in their browser for the first time, they simply click "Visit Site" on the ngrok disclaimer page).*
