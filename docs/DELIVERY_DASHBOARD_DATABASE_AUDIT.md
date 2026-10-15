# ClikGett Delivery Dashboard — Database Audit & Schema Strategy

---

## 1. Existing Database Schema Audit

This section examines all existing tables in the active ClikGett database (`clikgett-dev` MySQL RDS) directly relevant to delivery dispatch, routing, drivers, order status, and ETA management.

---

### 1.1 Table: `Orders`
- **Purpose:** Primary transaction record storing customer order details, financials, delivery address, assignment, and lifecycle status.
- **Relevant Fields Currently Present:**
  - `OrderID` (INT, Primary Key): Unique order number.
  - `UserID` (INT): Customer identifier.
  - `OrderStatus` (INT): Lifecycle state:
    - `8`: Order Received / Placed
    - `2`: Packed / Assigned
    - `5`: Picked Up / Out for Delivery
    - `7`: Arrived at Doorstep
    - `1`: Delivered
    - `4`: Cancelled
    - `6`: Returned
    - `3`: Shipment Created
  - `DeliveryBoyID` (INT): Foreign key linking to `AdminUsers.AdminID` (where `Role=2`).
  - `IsAssigned` (INT, default `0`): Flag indicating if a rider is assigned (`1`) or unassigned (`0`).
  - `EstimateDateTime` (DATETIME): Promised delivery timestamp.
  - `Delivered_Cancelled_datetime` (DATETIME): Final completion/cancellation timestamp.
  - `deliveredDateTime` (DATETIME): Exact delivery timestamp recorded on OTP verification.
  - `OrderArrivedDateTime` (DATETIME): Timestamp when driver marked doorstep arrival.
  - `Distance` (DECIMAL(4,2)): Distance in km between customer address and store.
  - `DeliveryPoints` (DOUBLE): Reward points awarded to rider (`Distance * 10`).
  - `Latitude`, `Longitude` (DECIMAL(9,6)): Destination customer delivery coordinates.
  - `Address`, `FlatNo`, `LandMark` (VARCHAR/TEXT): Customer doorstep address details.
  - `DeliveryInstructions` (JSON): Custom notes from customer (e.g. "Leave at door", "Do not ring bell").
  - `OTP` (VARCHAR(45)): 4-digit verification code for delivery confirmation.
  - `TipAmount` (FLOAT): Customer tip for delivery partner.
- **Current Usage:** Heavily utilized across Backend, Admin, and Delivery Boy apps.
- **Missing Fields for Quick-Commerce:**
  - `PickupWarehouseID` (INT NULL): Identifies which physical dark store / hub fulfills the order.
  - `PickedUpAt` (DATETIME NULL): Dedicated timestamp when status changed to 5 (`Picked Up`).
  - `AssignedAt` (DATETIME NULL): Dedicated timestamp when rider assignment occurred.
  - `DelayStatus` (ENUM('ON_TIME','AT_RISK','DELAYED') DEFAULT 'ON_TIME'): Operational SLA flag.
  - `TotalDelayMinutes` (INT DEFAULT 0): Cumulative delayed minutes on this order.

---

### 1.2 Table: `AdminUsers`
- **Purpose:** Stores admin users (`Role=1`) and delivery personnel (`Role=2`).
- **Relevant Fields Currently Present:**
  - `AdminID` (INT, Primary Key): Unique identifier (used as `DeliveryBoyID`).
  - `FirstName`, `LastName` (VARCHAR(50)): Rider name.
  - `MobileNumber` (VARCHAR(45)): Rider login and contact phone.
  - `Role` (TINYINT): `1` for Admin, `2` for Delivery Boy.
  - `Status` (INT): `0` = Deleted, `1` = Active, `2` = Deactivated.
  - `ProfilePic` (VARCHAR(45)): S3 profile photo filename.
  - `DeliveryPoints` (DOUBLE): Accumulated delivery points balance.
  - `WarehouseID` (INT NULL): Assigned hub / dark store ID.
- **Current Usage:** Used for driver authentication, profile retrieval, and order assignment.
- **Missing Fields for Quick-Commerce:**
  - `DutyStatus` (ENUM('OFFLINE','ONLINE','ON_DELIVERY','ON_BREAK') DEFAULT 'OFFLINE'): Dynamic shift status.
  - `LastLocationLat`, `LastLocationLng` (DECIMAL(9,6) NULL): Last pinged GPS position.
  - `LastLocationUpdatedAt` (DATETIME NULL): Timestamp of latest GPS ping.
  - `BatteryLevel` (INT NULL): Rider phone battery level (prevents assigning to dying devices).
  - `VehicleType` (VARCHAR(30) NULL): Bike, scooter, EV, bicycle.
  - `VehicleNumber` (VARCHAR(30) NULL): Registration number for security and delivery visibility.
  - `ActiveOrdersCount` (INT DEFAULT 0): Cached count of active orders in driver possession.

---

### 1.3 Table: `OrderETAAdjustments`
- **Purpose:** Audit ledger recording modifications to `Orders.EstimateDateTime`.
- **Fields Currently Present:**
  - `AdjustmentID` (INT, Primary Key, AUTO_INCREMENT)
  - `OrderID` (INT): Order modified.
  - `PreviousETA` (DATETIME): ETA before change.
  - `NewETA` (DATETIME): ETA after change.
  - `AdjustmentMinutes` (INT): Positive or negative minutes added.
  - `Reason` (TEXT): Description/reason for the adjustment.
  - `AdminID` (INT NULL): Admin user who initiated the change.
  - `CreatedAt` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- **Current Usage:** Written by `PUT /api/adminorders/editedeliverytime/:OrderID`; queried by `GET /api/adminorders/adjustments/:OrderID`.
- **Missing Fields:**
  - `InitiatorType` (ENUM('ADMIN','SYSTEM','DRIVER') DEFAULT 'ADMIN'): Tracks whether adjustment was initiated by ops manager, an automated rain rule, or driver delay report.
  - `DriverID` (INT NULL): If driver requested the delay, links to `AdminUsers.AdminID`.

---

### 1.4 Table: `OrderStatusTimeline`
- **Purpose:** Event timeline logging historical transitions and operational notes for an order.
- **Fields Currently Present:**
  - `TimelineID` (INT, Primary Key, AUTO_INCREMENT)
  - `OrderID` (INT): Order identifier.
  - `OrderStatus` (INT): Order status associated with the event.
  - `Notes` (TEXT): Event description (e.g. ETA adjustment note, stock removal note).
  - `CreatedAt` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- **Current Usage:** Displayed in Admin `OrderDetails.jsx` timeline view.
- **Missing Fields:**
  - `TriggeredBy` (ENUM('CUSTOMER','ADMIN','DRIVER','SYSTEM') DEFAULT 'SYSTEM')
  - `Latitude`, `Longitude` (DECIMAL(9,6) NULL): Geotag of where the driver performed the transition.

---

### 1.5 Table: `Routes`
- **Purpose:** Bundles multiple orders into a named dispatch route for a delivery boy.
- **Fields Currently Present:**
  - `RouteID` (INT, Primary Key, AUTO_INCREMENT)
  - `OrderIDs` (JSON): Array of Order IDs bundled in this route.
  - `Name` (VARCHAR(255)): Human-readable route name.
  - `DeliveryBoyID` (INT): Assigned driver.
  - `Status` (TINYINT): Route completion status (`1`=Active, `2`=Completed).
  - `CreatedAt` (DATETIME)
  - `updated_at` (TIMESTAMP)
- **Current Usage:** Legacy route batching; rarely used in single-order quick commerce dispatch.
- **Missing Fields:**
  - `OptimizedSequence` (JSON NULL): Ordered stop sequence computed by routing algorithm.
  - `TotalDistanceKm` (DECIMAL(6,2) NULL): Aggregate travel distance of all stops.

---

### 1.6 Table: `AdminShopToggleSettings`
- **Purpose:** Global operations configuration store.
- **Relevant Fields Currently Present:**
  - `Latitude`, `Longitude` (DECIMAL(9,6)): Warehouse/Shop central coordinates (15.8391, 78.0397).
  - `DeliveryRadiusKm` (DECIMAL): Maximum delivery service boundary (20 km).
  - `BaseDeliveryCharge` (DECIMAL): Flat fee (₹25).
  - `PricePerKm` (DECIMAL): Distance pricing rate (₹5/km).
  - `LongDistanceFeeEnabled`, `LongDistanceThresholdKm`, `LongDistanceFee`: Surcharge configuration.
  - `DeliveryAddressVisibility` (TINYINT): Toggles whether driver sees full customer address in app.
  - `DeliveryProductListVisibility` (TINYINT): Toggles whether driver sees cart item list in app.
- **Current Usage:** Queried by pricing engine, cart calculation, and `myorder` delivery endpoint.
- **Missing Fields:**
  - `RainModeEnabled` (TINYINT DEFAULT 0): Global or per-zone rain mode toggle.
  - `RainBufferMinutes` (INT DEFAULT 10): Default minutes automatically added during bad weather.
  - `MaxOrdersPerDriver` (INT DEFAULT 3): Hard cap on simultaneous active orders per delivery boy.

---

## 2. Recommended Future Database Changes

> **CRITICAL RULE:** DO NOT modify the database schema during this analysis task. The recommendations below are architectural designs to be implemented during future development phases.

### 2.1 Recommended New Table: `DeliveryBoyLocationLogs`
Stores historical breadcrumb tracking for auditability, dispute resolution, and route playback:
```sql
CREATE TABLE IF NOT EXISTS DeliveryBoyLocationLogs (
    LogID BIGINT AUTO_INCREMENT PRIMARY KEY,
    DeliveryBoyID INT NOT NULL,
    OrderID INT NULL,
    Latitude DECIMAL(9,6) NOT NULL,
    Longitude DECIMAL(9,6) NOT NULL,
    Speed FLOAT NULL,
    Heading FLOAT NULL,
    Accuracy FLOAT NULL,
    BatteryLevel INT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_driver_time (DeliveryBoyID, CreatedAt),
    INDEX idx_order (OrderID)
) ENGINE=InnoDB;
```

### 2.2 Recommended New Table: `DeliveryDelayReports`
Stores driver-submitted delay requests awaiting Admin approval:
```sql
CREATE TABLE IF NOT EXISTS DeliveryDelayReports (
    ReportID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID INT NOT NULL,
    DeliveryBoyID INT NOT NULL,
    DelayMinutes INT NOT NULL,
    ReasonCategory ENUM(
        'HEAVY_RAIN',
        'HEAVY_TRAFFIC',
        'VEHICLE_ISSUE',
        'RESTAURANT_DELAY',
        'CUSTOMER_LOCATION',
        'ROAD_BLOCK',
        'OTHER'
    ) NOT NULL,
    DriverNotes TEXT NULL,
    DriverLat DECIMAL(9,6) NULL,
    DriverLng DECIMAL(9,6) NULL,
    Status ENUM('PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPLIED') DEFAULT 'PENDING',
    AdminID INT NULL,
    AdminNotes TEXT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ResolvedAt DATETIME NULL,
    INDEX idx_order (OrderID),
    INDEX idx_status (Status)
) ENGINE=InnoDB;
```

### 2.3 Recommended New Table: `DeliveryIncidents`
Stores field emergencies, accidents, customer disputes, or damaged packages:
```sql
CREATE TABLE IF NOT EXISTS DeliveryIncidents (
    IncidentID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID INT NOT NULL,
    DeliveryBoyID INT NOT NULL,
    IncidentType ENUM(
        'VEHICLE_BREAKDOWN',
        'ACCIDENT_EMERGENCY',
        'CUSTOMER_UNREACHABLE',
        'WRONG_ADDRESS',
        'DAMAGED_ITEMS',
        'CUSTOMER_REFUSED',
        'SEVERE_WEATHER',
        'OTHER'
    ) NOT NULL,
    Description TEXT NOT NULL,
    PhotoUrl VARCHAR(255) NULL,
    Status ENUM('OPEN', 'IN_REVIEW', 'RESOLVED') DEFAULT 'OPEN',
    ResolutionNotes TEXT NULL,
    ResolvedBy INT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ResolvedAt DATETIME NULL,
    INDEX idx_order (OrderID),
    INDEX idx_driver (DeliveryBoyID)
) ENGINE=InnoDB;
```

### 2.4 Recommended Columns for Existing Tables
```sql
-- For AdminUsers (Driver Availability & Coordinates):
ALTER TABLE AdminUsers 
ADD COLUMN DutyStatus ENUM('OFFLINE', 'ONLINE', 'ON_DELIVERY', 'ON_BREAK') DEFAULT 'OFFLINE',
ADD COLUMN CurrentLat DECIMAL(9,6) NULL,
ADD COLUMN CurrentLng DECIMAL(9,6) NULL,
ADD COLUMN LastLocationAt DATETIME NULL,
ADD COLUMN ActiveOrdersCount INT DEFAULT 0;

-- For Orders (Quick Commerce Granularity):
ALTER TABLE Orders
ADD COLUMN PickedUpAt DATETIME NULL,
ADD COLUMN AssignedAt DATETIME NULL,
ADD COLUMN DelayStatus ENUM('ON_TIME', 'AT_RISK', 'DELAYED') DEFAULT 'ON_TIME',
ADD COLUMN TotalDelayMinutes INT DEFAULT 0;
```
