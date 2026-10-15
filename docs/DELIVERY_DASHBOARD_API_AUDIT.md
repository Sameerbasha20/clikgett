# ClikGett Delivery Dashboard — Complete API Audit & Inventory

---

## 1. Complete Delivery API Inventory

| Method | Endpoint | Controller File | Purpose | Authentication | Used By | Current Status | Identified Problems | Recommended Improvement |
|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/deliveryboy/sendotp` | `DeliveryBoy.js` (`SendotpLogin`) | Sends 4-digit SMS OTP to delivery boy's mobile number. | None (Public) | Delivery App (`SentotpActivity`) | **OPERATIONAL** | Random 4-digit math generator; hardcoded bypass for `9999999999`. No rate limiting by IP/phone. | Add rate limiting (max 3 requests per 10 mins); integrate SMS template DLT validation. |
| `POST` | `/api/deliveryboy/login` | `DeliveryBoy.js` (`deliveryboylogin`) | Verifies driver mobile + OTP, returns JWT token with `Role=2`. | None (Public) | Delivery App (`VerifyOtpActivity`) | **OPERATIONAL** | Generates JWT without device ID validation; no token rotation. | Include driver device ID/FCM token in payload; store active session token. |
| `GET` | `/api/deliveryboy/getroutes?Type=pending` | `DeliveryBoy.js` (`get_routes`) | Returns active orders assigned to the authenticated delivery boy (`OrderStatus NOT IN (1,4,3,6)`). | `deliveryboyAuthenticate` | Delivery App (`CurrentOrdersFragment`) | **OPERATIONAL** | Endpoint name `getroutes` is a misnomer; returns raw `Orders` list, not routes. Lacks pagination. | Rename/alias to `/api/deliveryboy/orders/active`; return pickup warehouse coordinates and dynamic ETA. |
| `GET` | `/api/deliveryboy/getroutes?Type=past` | `DeliveryBoy.js` (`get_routes`) | Returns delivered and cancelled orders for driver history. | `deliveryboyAuthenticate` | Delivery App (`PastOrdersFragment`) | **OPERATIONAL** | Unbounded SQL query (`SELECT * FROM Orders WHERE ...`); performance will degrade as order volume grows. | Add `LIMIT`, `OFFSET`, date filtering, and driver earnings per order. |
| `GET` | `/api/deliveryboy/orderdetail?OrderID=:id` | `DeliveryBoy.js` (`myorder`) | Fetches full order details including items, customer address, phone, instructions. | `deliveryboyAuthenticate` | Delivery App (`OrderDetailsActivity`) | **OPERATIONAL** | Respects Admin address/product toggles; formats dates with server-offset timezone instead of ISO 8601. | Return standardized UTC ISO timestamps; include warehouse pickup address and contact info. |
| `PUT` | `/api/deliveryboy/updatestatus/:OrderID` | `DeliveryBoy.js` (`updatestatus`) | Updates `Orders.OrderStatus` (e.g. 5=Picked Up, 7=Arrived, 1=Delivered). | `deliveryboyAuthenticate` | Delivery App (`OrderDetailsActivity`) | **OPERATIONAL** | Driver can jump directly from 2 to 7 without 5; no geofence check before setting status 7. | Enforce state machine transitions (2 -> 5 -> 7 -> 1); validate driver GPS coordinates before marking arrived. |
| `POST` | `/api/deliveryboy/sendotp_order` | `DeliveryBoy.js` (`Sendotp_Orders`) | Generates random 4-digit OTP for order delivery handover and updates `Orders.OTP`. | `deliveryboyAuthenticate` | Delivery App (`OrderDetailsActivity`) | **OPERATIONAL** | Generates plain random 4-digit OTP in `Orders` table; SMS to customer is handled via background function. | Add SMS failure fallback and push notification with OTP to customer app. |
| `POST` | `/api/deliveryboy/verifyotp_order` | `DeliveryBoy.js` (`Orders_VerifyOTP`) | Compares driver-submitted OTP with `Orders.OTP`. | `deliveryboyAuthenticate` | Delivery App (`OrderDetailsActivity`) | **OPERATIONAL** | SQL string interpolation in query (`where OrderID=${Body.OrderID} and OTP=${Body.OTP}`); lacks parameterized query. | Use parameterized queries (`pool.query(..., [OrderID, OTP])`) to prevent SQL injection. |
| `GET` | `/api/deliveryboy/orderstatus` | `DeliveryBoy.js` (`orderstatus`) | Returns aggregate count of delivered orders and sum of GrandTotal. | `deliveryboyAuthenticate` | Delivery App (`StatusActivity`) | **PARTIAL** | Sums `GrandTotal` (customer merchandise value) under the key `Earnings`. Driver payout is NOT order value. | Return true driver payout earnings ledger (base pay + distance bonus + tips). |
| `PUT` | `/api/deliveryboy/update/:AdminID` | `DeliveryBoy.js` (`updatedeliveryboy`) | Updates driver profile details (first name, last name, picture in S3). | `deliveryboyAuthenticate` | Delivery App | **OPERATIONAL** | Allows arbitrary name update without admin verification. | Restrict profile edits; require ops approval for bank details or contact changes. |
| `GET` | `/api/deliveryboy/ordersbyroute?RouteID=:id` | `DeliveryBoy.js` (`ordersbyroute`) | Retrieves orders grouped under a specific Route ID. | `deliveryboyAuthenticate` | Delivery App (`RouteIdActivity`) | **OPERATIONAL** | Loop queries `getorder` iteratively in JavaScript rather than using a single SQL `IN (...)` join. | Optimize into single batch query `WHERE OrderID IN (...)`. |
| `GET` | `/api/routes/deliveryboy/detail/:RouteID` | `Routes.js` (`Routesdetail`) | Fetches route bundle details for driver. | `deliveryboyAuthenticate` | Delivery App (`RouteIdActivity`) | **OPERATIONAL** | Duplicate of `ordersbyroute`; creates routing confusion in client code. | Unify route management endpoints under a single REST pattern. |
| `PUT` | `/api/adminorders/assigndeliverboy/:OrderID` | `AdminOrders.js` (`assignordertodeliveryboy`) | Assigns an order to a delivery boy (`Orders.DeliveryBoyID = ID, IsAssigned = 1`). | `adminAuthenticate` | Admin (`OrderDetails.jsx`) | **OPERATIONAL** | Does not check if driver is currently online, on duty, or already carrying maximum orders. | Add driver capacity and online availability check before assignment. |
| `PUT` | `/api/adminorders/editedeliverytime/:OrderID` | `AdminOrders.js` (`editedeliverytime`) | Edits expected delivery time by +5, +10, +15, or custom minutes. Logs to `OrderETAAdjustments` and `OrderStatusTimeline`. | `adminAuthenticate` | Admin (`OrderDetails.jsx`) | **COMPLETE** | Fully audits adjustments, but does NOT broadcast update to active delivery boy app. | Emit WebSocket/push notification to delivery partner app when Admin adjusts ETA. |
| `GET` | `/api/adminorders/ordertimeline/:OrderID` | `AdminOrders.js` (`ordertimeline`) | Retrieves historical status transitions and notes from `OrderStatusTimeline`. | `adminAuthenticate` | Admin (`OrderDetails.jsx`) | **COMPLETE** | Cleanly logs events; timestamps are ISO compliant. | Expose read-only timeline to Delivery Boy app and User App for visibility. |
| `GET` | `/api/adminorders/adjustments/:OrderID` | `AdminOrders.js` (`getorderadjustments`) | Returns list of all ETA adjustments and reasons for an order from `OrderETAAdjustments`. | `adminAuthenticate` | Admin (`OrderDetails.jsx`) | **COMPLETE** | Audits `PreviousETA`, `NewETA`, `AdjustmentMinutes`, `Reason`, `AdminID`. | Fully functional; can be extended for driver delay request history. |

---

## 2. API Reuse & Extension Analysis

### 2.1 Existing APIs to Reuse "As-Is"
1. `PUT /api/adminorders/editedeliverytime/:OrderID`: Excellent implementation with dual-table audit logging (`OrderETAAdjustments` and `OrderStatusTimeline`). This endpoint should remain the single source of truth for committing ETA updates.
2. `POST /api/deliveryboy/verifyotp_order`: Reliable handshake for final doorstep confirmation. Parameterize SQL inputs for security, but retain business contract.
3. `GET /api/adminorders/ordertimeline/:OrderID`: Reusable across Admin, Customer, and Delivery portals to inspect the timeline of events.

### 2.2 Existing APIs Requiring Extension
1. `PUT /api/deliveryboy/updatestatus/:OrderID`:
   - *Current:* Takes `{ OrderStatus: number, UserID: number }`.
   - *Extension:* Accept optional `{ Latitude: number, Longitude: number, Timestamp: string }` so status transitions record the exact physical coordinates where the driver marked "Picked Up" or "Arrived".
2. `GET /api/deliveryboy/orderstatus`:
   - *Current:* Returns `{ DeliveredCount: 15, Earnings: 4500 }` where earnings is GMV.
   - *Extension:* Return `{ DeliveredCount: 15, DriverEarnings: 450, DistanceTraveledKm: 32.5, ActiveShiftHours: 4.5 }`.
3. `PUT /api/adminorders/assigndeliverboy/:OrderID`:
   - *Current:* Blind assignment to any `AdminUsers` ID where `Role=2`.
   - *Extension:* Validate that driver's `DutyStatus == 'ONLINE'` and active order count < capacity limit.

---

## 3. Missing APIs Required for Quick-Commerce Operations

The following endpoints do **not** exist in the current codebase and are required for modern quick-commerce delivery operations:

### 3.1 Driver Live Location APIs
```http
POST /api/deliveryboy/location/ping
Authorization: Bearer <deliveryboy_token>
Content-Type: application/json

Request Payload:
{
  "latitude": 15.828120,
  "longitude": 78.037340,
  "accuracy": 12.5,
  "speed": 24.2,
  "heading": 182.0,
  "batteryLevel": 84,
  "activeOrderID": 1002492
}

Response (200 OK):
{
  "Status": 1,
  "Acknowledged": true,
  "ServerTimestamp": "2026-10-06T05:00:00.000Z"
}
```

### 3.2 Driver Shift & Availability APIs
```http
PUT /api/deliveryboy/duty-status
Authorization: Bearer <deliveryboy_token>
Content-Type: application/json

Request Payload:
{
  "dutyStatus": "ONLINE" // ONLINE | OFFLINE | ON_BREAK
}

Response (200 OK):
{
  "Status": 1,
  "Message": "You are now ONLINE and ready to receive delivery orders."
}
```

### 3.3 Driver Delay Reporting API
```http
POST /api/deliveryboy/orders/report-delay
Authorization: Bearer <deliveryboy_token>
Content-Type: application/json

Request Payload:
{
  "orderID": 1002492,
  "delayMinutes": 10,
  "reasonCategory": "HEAVY_TRAFFIC", // HEAVY_RAIN | HEAVY_TRAFFIC | VEHICLE_ISSUE | RESTAURANT_DELAY | CUSTOMER_LOCATION | ROAD_BLOCK | OTHER
  "notes": "Severe jam near Flyover junction",
  "latitude": 15.832100,
  "longitude": 78.041200
}

Response (200 OK):
{
  "Status": 1,
  "DelayRequestID": 42,
  "Message": "Delay report submitted to dispatch operations for review."
}
```

### 3.4 Admin Delay Review APIs
```http
PUT /api/adminorders/delay-requests/:id/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Payload:
{
  "approvedMinutes": 10,
  "adminNotes": "Traffic confirmed on corridor"
}

Response (200 OK):
{
  "Status": 1,
  "NewETA": "2026-10-06 10:45:00",
  "Message": "Delay approved and customer ETA updated."
}
```

### 3.5 Admin Live Operations Fleet API
```http
GET /api/adminorders/live-operations/fleet
Authorization: Bearer <admin_token>

Response (200 OK):
{
  "Status": 1,
  "ActiveDeliveriesCount": 18,
  "DelayedCount": 2,
  "DriversOnlineCount": 12,
  "Drivers": [
    {
      "driverID": 5,
      "name": "Suresh Kumar",
      "dutyStatus": "ON_DELIVERY",
      "latitude": 15.83401,
      "longitude": 78.03819,
      "lastPing": "2026-10-06T05:01:10.000Z",
      "batteryLevel": 78,
      "activeOrderID": 1002492,
      "activeOrderSequence": "0492",
      "customerName": "Manikanta",
      "currentETA": "2026-10-06 10:45:00",
      "delayStatus": "ON_TRACK"
    }
  ]
}
```

### 3.6 Incident / Issue Reporting API
```http
POST /api/deliveryboy/orders/report-issue
Authorization: Bearer <deliveryboy_token>
Content-Type: application/json

Request Payload:
{
  "orderID": 1002492,
  "issueType": "CUSTOMER_UNREACHABLE", // ACCIDENT | BREAKDOWN | CUSTOMER_UNREACHABLE | WRONG_ADDRESS | DAMAGED_ITEM | OTHER
  "description": "Called customer 4 times, phone switched off at gate",
  "latitude": 15.83910,
  "longitude": 78.04012
}

Response (200 OK):
{
  "Status": 1,
  "IncidentID": 18,
  "Message": "Incident logged. Ops team notified."
}
```
