const pool = require('../utils/db.js');

async function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
    try {
        const checkSql = `
            SELECT COUNT(*) AS count 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
              AND table_name = ? 
              AND column_name = ?
        `;
        const result = await runQuery(checkSql, [tableName, columnName]);
        if (result[0].count === 0) {
            console.log(`Adding column ${columnName} to ${tableName}...`);
            await runQuery(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
            console.log(`Successfully added column ${columnName} to ${tableName}.`);
        } else {
            console.log(`Column ${columnName} already exists in ${tableName}.`);
        }
    } catch (err) {
        console.error(`Error adding column ${columnName} to ${tableName}:`, err.message);
        throw err;
    }
}

async function runMigration() {
    console.log("=== Starting Delivery Operations Database Migration ===");

    // 1. Extend AdminUsers
    await addColumnIfNotExists('AdminUsers', 'DutyStatus', "VARCHAR(20) DEFAULT 'OFFLINE'");
    await addColumnIfNotExists('AdminUsers', 'LastLocationLat', "DECIMAL(10, 8) NULL");
    await addColumnIfNotExists('AdminUsers', 'LastLocationLng', "DECIMAL(11, 8) NULL");
    await addColumnIfNotExists('AdminUsers', 'LastLocationUpdatedAt', "DATETIME NULL");
    await addColumnIfNotExists('AdminUsers', 'BatteryLevel', "INT NULL");
    await addColumnIfNotExists('AdminUsers', 'VehicleType', "VARCHAR(50) NULL");
    await addColumnIfNotExists('AdminUsers', 'VehicleNumber', "VARCHAR(50) NULL");
    await addColumnIfNotExists('AdminUsers', 'ActiveOrdersCount', "INT DEFAULT 0");

    // 2. Extend Orders
    await addColumnIfNotExists('Orders', 'DelayStatus', "VARCHAR(20) DEFAULT 'NONE'");
    await addColumnIfNotExists('Orders', 'TotalDelayMinutes', "INT DEFAULT 0");
    await addColumnIfNotExists('Orders', 'CurrentLeg', "VARCHAR(30) DEFAULT 'ASSIGNED'");
    await addColumnIfNotExists('Orders', 'AssignedAt', "DATETIME NULL");
    await addColumnIfNotExists('Orders', 'PickedUpAt', "DATETIME NULL");
    await addColumnIfNotExists('Orders', 'StoreLatitude', "DECIMAL(10, 8) NULL");
    await addColumnIfNotExists('Orders', 'StoreLongitude', "DECIMAL(11, 8) NULL");

    // 3. Extend OrderETAAdjustments
    await addColumnIfNotExists('OrderETAAdjustments', 'InitiatorType', "VARCHAR(20) DEFAULT 'ADMIN'");
    await addColumnIfNotExists('OrderETAAdjustments', 'DriverID', "INT NULL");

    // 4. Create DeliveryBoyLocations
    console.log("Ensuring table DeliveryBoyLocations exists...");
    await runQuery(`
        CREATE TABLE IF NOT EXISTS DeliveryBoyLocations (
            LocationID INT AUTO_INCREMENT PRIMARY KEY,
            DeliveryBoyID INT NOT NULL,
            Latitude DECIMAL(10, 8) NOT NULL,
            Longitude DECIMAL(11, 8) NOT NULL,
            Accuracy FLOAT DEFAULT 0,
            Speed FLOAT DEFAULT 0,
            Heading FLOAT DEFAULT 0,
            BatteryLevel INT DEFAULT 0,
            IsCharging BOOLEAN DEFAULT FALSE,
            ActiveOrderID INT NULL,
            LastUpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_delivery_boy (DeliveryBoyID),
            INDEX idx_active_order (ActiveOrderID),
            INDEX idx_last_updated (LastUpdatedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create DeliveryBoyLocationLogs
    console.log("Ensuring table DeliveryBoyLocationLogs exists...");
    await runQuery(`
        CREATE TABLE IF NOT EXISTS DeliveryBoyLocationLogs (
            LogID BIGINT AUTO_INCREMENT PRIMARY KEY,
            DeliveryBoyID INT NOT NULL,
            Latitude DECIMAL(10, 8) NOT NULL,
            Longitude DECIMAL(11, 8) NOT NULL,
            Accuracy FLOAT DEFAULT 0,
            Speed FLOAT DEFAULT 0,
            Heading FLOAT DEFAULT 0,
            BatteryLevel INT DEFAULT 0,
            IsCharging BOOLEAN DEFAULT FALSE,
            ActiveOrderID INT NULL,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_driver_created (DeliveryBoyID, CreatedAt),
            INDEX idx_order_created (ActiveOrderID, CreatedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Create DeliveryBoyShifts
    console.log("Ensuring table DeliveryBoyShifts exists...");
    await runQuery(`
        CREATE TABLE IF NOT EXISTS DeliveryBoyShifts (
            ShiftID INT AUTO_INCREMENT PRIMARY KEY,
            DriverID INT NOT NULL,
            Status VARCHAR(20) NOT NULL,
            StartedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            EndedAt DATETIME NULL,
            InitialLatitude DECIMAL(10, 8) NULL,
            InitialLongitude DECIMAL(11, 8) NULL,
            InitialBattery INT NULL,
            FinalLatitude DECIMAL(10, 8) NULL,
            FinalLongitude DECIMAL(11, 8) NULL,
            FinalBattery INT NULL,
            INDEX idx_driver_status (DriverID, Status),
            INDEX idx_started_at (StartedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Create OrderDelays
    console.log("Ensuring table OrderDelays exists...");
    await runQuery(`
        CREATE TABLE IF NOT EXISTS OrderDelays (
            DelayID INT AUTO_INCREMENT PRIMARY KEY,
            OrderID INT NOT NULL,
            DriverID INT NOT NULL,
            Reason VARCHAR(50) NOT NULL,
            RequestedMinutes INT NOT NULL,
            Status VARCHAR(20) DEFAULT 'PENDING',
            Latitude DECIMAL(10, 8) NULL,
            Longitude DECIMAL(11, 8) NULL,
            Remarks TEXT NULL,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            ReviewedAt DATETIME NULL,
            ReviewedBy INT NULL,
            ApprovedMinutes INT DEFAULT 0,
            AdminReason VARCHAR(255) NULL,
            INDEX idx_order_status (OrderID, Status),
            INDEX idx_driver (DriverID),
            INDEX idx_created (CreatedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Create OrderIssues
    console.log("Ensuring table OrderIssues exists...");
    await runQuery(`
        CREATE TABLE IF NOT EXISTS OrderIssues (
            IssueID INT AUTO_INCREMENT PRIMARY KEY,
            OrderID INT NOT NULL,
            DriverID INT NOT NULL,
            IssueType VARCHAR(50) NOT NULL,
            Description TEXT NULL,
            Latitude DECIMAL(10, 8) NULL,
            Longitude DECIMAL(11, 8) NULL,
            Status VARCHAR(20) DEFAULT 'OPEN',
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            ResolvedAt DATETIME NULL,
            ResolvedBy INT NULL,
            ResolutionNotes TEXT NULL,
            INDEX idx_order_issue (OrderID, Status),
            INDEX idx_driver_issue (DriverID),
            INDEX idx_created (CreatedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("=== Delivery Operations Database Migration Completed Successfully ===");
    process.exit(0);
}

runMigration().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
