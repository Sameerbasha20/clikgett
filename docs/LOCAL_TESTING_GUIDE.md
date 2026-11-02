# CLIKGETT — LOCAL TESTING & AUTOMATION GUIDE

**Environment:** Fully Isolated Local Docker Compose  
**Scope:** Automated Health Probes, Database Validation, Redis Caching Tests, MinIO Storage Tests, and Frontend Verification  

---

## 1. Quick Verification Commands (PowerShell)

### A. Health & Dependency Check
```powershell
# Probe the combined backend health endpoint
Invoke-RestMethod -Uri "http://localhost:5001/health" -Method GET | ConvertTo-Json -Depth 5
```
Expected response:
```json
{
  "status": "healthy",
  "message": "ClikGett API is running",
  "service": "clikgett-backend",
  "environment": "development",
  "dependencies": {
    "database": {
      "type": "mysql",
      "status": "connected",
      "host": "mysql"
    },
    "redis": {
      "status": "connected",
      "enabled": true,
      "host": "redis"
    }
  }
}
```

### B. Redis Integration Test (Set / Get / Delete)
```powershell
# Execute safe Redis automated operations
Invoke-RestMethod -Uri "http://localhost:5001/health/redis/test" -Method POST | ConvertTo-Json
```
Expected response:
```json
{
  "status": "success",
  "message": "Redis set/get/del operations verified successfully",
  "operations": {
    "set": true,
    "get": { "probe": "ok" },
    "delete": true
  }
}
```

### C. Direct MySQL Database Query
```powershell
# Verify seeded customer in local MySQL
docker exec -i clikgett-mysql mysql -u clikgett_user -pclikgett_dev_password clikgett-dev -e "SELECT UserID, FirstName, MobileNumber, WalletAmount FROM Users WHERE UserID = 1000523;"
```

### D. Direct PostgreSQL Query
```powershell
# Verify migration target schema in local PostgreSQL
docker exec -i clikgett-postgres psql -U clikgett_pg_user -d clikgett_pg_dev -c "SELECT \"UserID\", \"FirstName\", \"MobileNumber\" FROM \"Users\";"
```

### E. MinIO Bucket Listing
```powershell
# Check local S3 buckets
docker exec -i clikgett-minio mc ls local
```

### F. Mailpit Email Inspection
Open [http://localhost:8025](http://localhost:8025) in your browser to view all intercepted development emails in real time without sending real messages to customer mailboxes.

---

## 2. API Authentication & Flow Testing

### A. Customer Authentication (Public OTP & Login)
```powershell
# 1. Send OTP to test mobile
$loginProbe = Invoke-RestMethod -Uri "http://localhost:5001/api/users/login/sendotp" -Method POST -ContentType "application/json" -Body '{"MobileNumber":"9999999999"}'
$loginProbe | ConvertTo-Json

# 2. Verify OTP (Fixed demo OTP for local testing is 1234)
$tokenRes = Invoke-RestMethod -Uri "http://localhost:5001/api/users/login/verifyotp" -Method POST -ContentType "application/json" -Body '{"MobileNumber":"9999999999","OTP":"1234"}'
$tokenRes | ConvertTo-Json
```

### B. Catalog Exploration (Protected Routes with Customer JWT)
```powershell
$token = $tokenRes.Token

# Fetch user categories
Invoke-RestMethod -Uri "http://localhost:5001/api/categories/allcategoriesuser" -Method GET -Headers @{ "Authorization" = "Bearer $token" } | ConvertTo-Json

# Fetch products in category
Invoke-RestMethod -Uri "http://localhost:5001/api/products/list?CategoryID=1" -Method GET -Headers @{ "Authorization" = "Bearer $token" } | ConvertTo-Json
```

### C. Admin Web Dashboard Authentication
```powershell
# Admin Login
$adminRes = Invoke-RestMethod -Uri "http://localhost:5001/api/adminuser/login" -Method POST -ContentType "application/json" -Body '{"EmailID":"admin@clikgett.com","Password":"0192023a7bbd73250516f069df18b500"}'
$adminRes | ConvertTo-Json
```

---

## 3. Database Backup & Restore Procedures

All backup and restore commands target local Docker containers exclusively:

### Backup Local MySQL
```powershell
docker exec clikgett-mysql mysqldump -u clikgett_user -pclikgett_dev_password clikgett-dev > local_mysql_backup.sql
```

### Restore Local MySQL
```powershell
Get-Content local_mysql_backup.sql | docker exec -i clikgett-mysql mysql -u clikgett_user -pclikgett_dev_password clikgett-dev
```

### Safe Local Data Reset
```powershell
# 1. Stop containers and delete local test volumes
docker compose down -v

# 2. Restart stack and re-seed clean synthetic data
docker compose up -d
```
*(Safety Guarantee: This command targets local Docker volumes only and cannot impact live AWS RDS databases).*
