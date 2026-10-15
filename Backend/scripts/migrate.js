const pool = require('../server/utils/db');

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function runMigrations() {
  console.log('Running safe migrations...');

  const addColumnIfNotExists = async (table, column, def) => {
    try {
      const cols = await query(`DESCRIBE ${table}`);
      const exists = cols.some(c => c.Field.toLowerCase() === column.toLowerCase());
      if (!exists) {
        console.log(`Adding ${column} to ${table}`);
        await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
      } else {
        console.log(`${column} already exists on ${table}`);
      }
    } catch (e) {
      console.error(`Error on ${table}.${column}:`, e.message);
    }
  };

  // 1. SubCategories DisplayOrder
  await addColumnIfNotExists('SubCategories', 'DisplayOrder', 'INT DEFAULT 0');

  // 2. Settings Minordervalue_wallet = 399
  const walletRows = await query("SELECT * FROM Settings WHERE SettingKey = 'Minordervalue_wallet'");
  if (walletRows.length > 0) {
    await query("UPDATE Settings SET SettingValue = '399' WHERE SettingKey = 'Minordervalue_wallet'");
    console.log('Updated Minordervalue_wallet to 399');
  } else {
    await query("INSERT INTO Settings (SettingKey, SettingValue, CreatedAt) VALUES ('Minordervalue_wallet', '399', NOW())");
    console.log('Inserted Minordervalue_wallet = 399');
  }

  // 3. product_restrictions CategoryID
  await addColumnIfNotExists('product_restrictions', 'CategoryID', 'INT NULL');
  // Add restriction for Atta (CategoryID 23) if not present
  const attaRestrictions = await query("SELECT * FROM product_restrictions WHERE CategoryID = 23 AND RestrictionType = 'no_coupon'");
  if (attaRestrictions.length === 0) {
    await query("INSERT INTO product_restrictions (ProductID, CategoryID, RestrictionType, Status, CreatedAt) VALUES (0, 23, 'no_coupon', 1, NOW())");
    console.log('Configured Atta Category coupon restriction (CategoryID: 23, no_coupon)');
  } else {
    console.log('Atta Category coupon restriction already configured');
  }

  // 4. AdminShopToggleSettings
  await addColumnIfNotExists('AdminShopToggleSettings', 'CashbackMode', "ENUM('automatic', 'manual') DEFAULT 'automatic'");
  await addColumnIfNotExists('AdminShopToggleSettings', 'LongDistanceFeeEnabled', 'TINYINT(1) DEFAULT 0');
  await addColumnIfNotExists('AdminShopToggleSettings', 'LongDistanceThresholdKm', 'DECIMAL(5,2) DEFAULT 8.00');
  await addColumnIfNotExists('AdminShopToggleSettings', 'LongDistanceFee', 'DECIMAL(10,2) DEFAULT 40.00');
  await addColumnIfNotExists('AdminShopToggleSettings', 'LargeCartThreshold1Items', 'INT DEFAULT 10');
  await addColumnIfNotExists('AdminShopToggleSettings', 'LargeCartThreshold1Minutes', 'INT DEFAULT 5');
  await addColumnIfNotExists('AdminShopToggleSettings', 'LargeCartThreshold2Items', 'INT DEFAULT 20');
  await addColumnIfNotExists('AdminShopToggleSettings', 'LargeCartThreshold2Minutes', 'INT DEFAULT 10');
  await addColumnIfNotExists('AdminShopToggleSettings', 'DeliveryAddressVisibility', 'TINYINT(1) DEFAULT 1');
  await addColumnIfNotExists('AdminShopToggleSettings', 'DeliveryProductListVisibility', 'TINYINT(1) DEFAULT 1');

  // 5. Banners Destination
  await addColumnIfNotExists('Banners', 'DestinationType', "VARCHAR(50) DEFAULT 'none'");
  await addColumnIfNotExists('Banners', 'DestinationID', 'INT NULL');

  // 6. HomepageSections
  await addColumnIfNotExists('HomepageSections', 'Description', 'TEXT NULL');
  await addColumnIfNotExists('HomepageSections', 'ImageUrl', 'VARCHAR(255) NULL');
  await addColumnIfNotExists('HomepageSections', 'StartDate', 'DATETIME NULL');
  await addColumnIfNotExists('HomepageSections', 'EndDate', 'DATETIME NULL');
  await addColumnIfNotExists('HomepageSections', 'DisplayOrder', 'INT DEFAULT 0');

  // 7. SearchLogs
  await query(`
    CREATE TABLE IF NOT EXISTS SearchLogs (
      SearchID INT AUTO_INCREMENT PRIMARY KEY,
      Keyword VARCHAR(255) NOT NULL,
      UserID INT NULL,
      ResultCount INT DEFAULT 0,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('SearchLogs table ready');

  // 8. OrderETAAdjustments
  await query(`
    CREATE TABLE IF NOT EXISTS OrderETAAdjustments (
      AdjustmentID INT AUTO_INCREMENT PRIMARY KEY,
      OrderID INT NOT NULL,
      PreviousETA DATETIME NULL,
      NewETA DATETIME NOT NULL,
      AdjustmentMinutes INT NOT NULL,
      Reason TEXT NULL,
      AdminID INT NULL,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('OrderETAAdjustments table ready');

  // 9. CashbackPending
  await query(`
    CREATE TABLE IF NOT EXISTS CashbackPending (
      CashbackPendingID INT AUTO_INCREMENT PRIMARY KEY,
      OrderID INT NOT NULL,
      UserID INT NOT NULL,
      CashbackAmount DECIMAL(10,2) NOT NULL,
      Status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      AdminID INT NULL,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      ApprovedAt DATETIME NULL
    )
  `);
  console.log('CashbackPending table ready');

  // 10. product_unlocks
  await query(`
    CREATE TABLE IF NOT EXISTS product_unlocks (
      UnlockID INT AUTO_INCREMENT PRIMARY KEY,
      ThresholdAmount DECIMAL(10,2) NOT NULL,
      ProductID INT NOT NULL,
      VariantID INT NULL,
      Message VARCHAR(255) NULL,
      StartDate DATETIME NULL,
      EndDate DATETIME NULL,
      Status TINYINT(1) DEFAULT 1,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('product_unlocks table ready');

  pool.end();
  console.log('All migrations executed successfully!');
}

runMigrations().catch(err => {
  console.error(err);
  pool.end();
});
