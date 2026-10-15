-- =============================================================================
-- ClikGett Local Development & Integration MySQL Schema
-- Reproduces the full AWS RDS MySQL schema with exact table names, casing,
-- indexes, constraints, and synthetic seed data.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `clikgett-dev` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `clikgett-dev`;

-- 1. AdminUsers Table
CREATE TABLE IF NOT EXISTS `AdminUsers` (
    `AdminID` INT AUTO_INCREMENT PRIMARY KEY,
    `FirstName` VARCHAR(100) NOT NULL,
    `LastName` VARCHAR(100) DEFAULT '',
    `EmailID` VARCHAR(150) UNIQUE NOT NULL,
    `MobileNumber` VARCHAR(20) DEFAULT '',
    `Password` VARCHAR(255) NOT NULL,
    `Role` INT NOT NULL DEFAULT 1 COMMENT '1=Admin, 2=SubAdmin, 16=DeliveryBoy',
    `Status` TINYINT(1) DEFAULT 1,
    `DutyStatus` VARCHAR(20) DEFAULT 'OFFLINE',
    `LastLocationLat` DECIMAL(10, 8) NULL,
    `LastLocationLng` DECIMAL(11, 8) NULL,
    `LastLocationUpdatedAt` DATETIME NULL,
    `BatteryLevel` INT NULL,
    `VehicleType` VARCHAR(50) NULL,
    `VehicleNumber` VARCHAR(50) NULL,
    `ActiveOrdersCount` INT DEFAULT 0,
    `TwoFactorEnabled` TINYINT(1) DEFAULT 0,
    `TwoFactorSecret` VARCHAR(128) NULL,
    `TwoFactorRecoveryCodes` TEXT NULL,
    `TwoFactorFailedAttempts` INT DEFAULT 0,
    `TwoFactorLockedUntil` DATETIME NULL,
    `TwoFactorLastUsedTimestamp` BIGINT DEFAULT 0,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_admin_role` (`Role`),
    INDEX `idx_admin_email` (`EmailID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table (Customer)
CREATE TABLE IF NOT EXISTS `Users` (
    `UserID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `FirstName` VARCHAR(100) NOT NULL,
    `LastName` VARCHAR(100) DEFAULT '',
    `MobileNumber` VARCHAR(20) UNIQUE NOT NULL,
    `EmailID` VARCHAR(150) NULL,
    `WalletAmount` DECIMAL(15, 2) DEFAULT 0.00,
    `Status` TINYINT(1) DEFAULT 1,
    `SignupCompleted` TINYINT(1) DEFAULT 0,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_mobile` (`MobileNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS `Categories` (
    `CategoryID` INT AUTO_INCREMENT PRIMARY KEY,
    `CategoryName` VARCHAR(150) NOT NULL,
    `CategoryImage` VARCHAR(255) DEFAULT '',
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SubCategories Table
CREATE TABLE IF NOT EXISTS `SubCategories` (
    `SubCategoryID` INT AUTO_INCREMENT PRIMARY KEY,
    `CategoryID` INT NOT NULL,
    `SubCategoryName` VARCHAR(150) NOT NULL,
    `SubCategoryImage` VARCHAR(255) DEFAULT '',
    `DisplayOrder` INT DEFAULT 0,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_subcat_category` (`CategoryID`),
    CONSTRAINT `fk_subcat_category` FOREIGN KEY (`CategoryID`) REFERENCES `Categories` (`CategoryID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Products Table
CREATE TABLE IF NOT EXISTS `Products` (
    `ProductID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `ProductName` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `CategoryID` INT NOT NULL,
    `SubCategoryID` INT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `Type` INT DEFAULT 1,
    `ImageUrl` VARCHAR(255) DEFAULT '',
    `ProductImages` TEXT NULL,
    `IsTransfered` TINYINT(1) DEFAULT 0,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_product_category` (`CategoryID`),
    INDEX `idx_product_subcat` (`SubCategoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ProductVariants Table
CREATE TABLE IF NOT EXISTS `ProductVariants` (
    `VariantID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `ProductID` BIGINT NOT NULL,
    `metrictype` VARCHAR(50) DEFAULT 'unit',
    `metricvalue` VARCHAR(50) DEFAULT '1',
    `Price` DECIMAL(10, 2) NOT NULL,
    `OfferPrice` DECIMAL(10, 2) NOT NULL,
    `AvailableQty` INT DEFAULT 0,
    `maxQty` INT DEFAULT 10,
    `status` TINYINT(1) DEFAULT 1,
    `IsTransfered` TINYINT(1) DEFAULT 0,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_variant_product` (`ProductID`),
    CONSTRAINT `fk_variant_product` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Address Table
CREATE TABLE IF NOT EXISTS `Address` (
    `AddressID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserID` BIGINT NOT NULL,
    `Type` VARCHAR(50) DEFAULT 'Home',
    `Address` TEXT NOT NULL,
    `FlatNo` VARCHAR(100) DEFAULT '',
    `Landmark` VARCHAR(150) DEFAULT '',
    `City` VARCHAR(100) DEFAULT 'Kurnool',
    `Latitude` DECIMAL(10, 8) NOT NULL,
    `Longitude` DECIMAL(11, 8) NOT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_address_user` (`UserID`),
    CONSTRAINT `fk_address_user` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Carts Table
CREATE TABLE IF NOT EXISTS `Carts` (
    `CartID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserID` BIGINT NOT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cart_user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. CartItems Table
CREATE TABLE IF NOT EXISTS `CartItems` (
    `CartItemID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `CartID` BIGINT NOT NULL,
    `ProductID` BIGINT NOT NULL,
    `VariantID` BIGINT NOT NULL,
    `Quantity` INT NOT NULL DEFAULT 1,
    `Price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cartitem_cart` (`CartID`),
    CONSTRAINT `fk_cartitem_cart` FOREIGN KEY (`CartID`) REFERENCES `Carts` (`CartID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Orders Table
CREATE TABLE IF NOT EXISTS `Orders` (
    `OrderID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserID` BIGINT NOT NULL,
    `OrderNumber` VARCHAR(60) UNIQUE NOT NULL,
    `OrderStatus` INT NOT NULL DEFAULT 2 COMMENT '1=Delivered, 2=Assigned/Processing, 3=Cancelled, 4=Rejected, 5=OutForDelivery, 7=Arrived',
    `DeliveryBoyID` INT NULL,
    `AddressID` BIGINT NULL,
    `TotalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `DiscountAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `WalletAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `FinalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `PaymentType` VARCHAR(50) DEFAULT 'COD',
    `PaymentStatus` VARCHAR(50) DEFAULT 'Pending',
    `DelayStatus` VARCHAR(20) DEFAULT 'NONE',
    `TotalDelayMinutes` INT DEFAULT 0,
    `CurrentLeg` VARCHAR(30) DEFAULT 'ASSIGNED',
    `AssignedAt` DATETIME NULL,
    `PickedUpAt` DATETIME NULL,
    `StoreLatitude` DECIMAL(10, 8) NULL,
    `StoreLongitude` DECIMAL(11, 8) NULL,
    `Delivered_Cancelled_datetime` DATETIME NULL,
    `deliveredDateTime` DATETIME NULL,
    `OrderArrivedDateTime` DATETIME NULL,
    `CancellationReason` TEXT NULL,
    `DeliveryPoints` INT DEFAULT 0,
    `OrderSizeBufferMinutes` INT DEFAULT 0,
    `PaymentMethod` VARCHAR(50) DEFAULT 'COD',
    `IsAssigned` TINYINT(1) DEFAULT 0,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_orders_user` (`UserID`),
    INDEX `idx_orders_driver` (`DeliveryBoyID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. OrderItems Table
CREATE TABLE IF NOT EXISTS `OrderItems` (
    `OrderItemID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `OrderID` BIGINT NOT NULL,
    `ProductID` BIGINT NOT NULL,
    `VariantID` BIGINT NOT NULL,
    `Quantity` INT NOT NULL DEFAULT 1,
    `Price` DECIMAL(10, 2) NOT NULL,
    `OfferPrice` DECIMAL(10, 2) NOT NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_orderitems_order` (`OrderID`),
    CONSTRAINT `fk_orderitems_order` FOREIGN KEY (`OrderID`) REFERENCES `Orders` (`OrderID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Banners Table
CREATE TABLE IF NOT EXISTS `Banners` (
    `BannerID` INT AUTO_INCREMENT PRIMARY KEY,
    `BannerName` VARCHAR(150) NOT NULL,
    `Description` TEXT NULL,
    `BannerImage` VARCHAR(255) NOT NULL,
    `DestinationType` VARCHAR(50) DEFAULT 'none',
    `DestinationID` INT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. PromoCodes Table
CREATE TABLE IF NOT EXISTS `PromoCodes` (
    `PromoCodeID` INT AUTO_INCREMENT PRIMARY KEY,
    `PromoCode` VARCHAR(50) UNIQUE NOT NULL,
    `DiscountType` VARCHAR(20) DEFAULT 'percentage',
    `DiscountValue` DECIMAL(10, 2) NOT NULL,
    `MinOrderAmount` DECIMAL(10, 2) DEFAULT 0.00,
    `MaxDiscount` DECIMAL(10, 2) DEFAULT 0.00,
    `StartDate` DATETIME NULL,
    `EndDate` DATETIME NULL,
    `UsageLimit` INT DEFAULT 1000,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Routes Table
CREATE TABLE IF NOT EXISTS `Routes` (
    `RouteID` INT AUTO_INCREMENT PRIMARY KEY,
    `RouteName` VARCHAR(150) NOT NULL,
    `DeliveryBoyID` INT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Warehouses Table
CREATE TABLE IF NOT EXISTS `Warehouses` (
    `WarehouseID` INT AUTO_INCREMENT PRIMARY KEY,
    `WarehouseName` VARCHAR(150) NOT NULL,
    `Latitude` DECIMAL(10, 8) NOT NULL,
    `Longitude` DECIMAL(11, 8) NOT NULL,
    `Radius` DECIMAL(5, 2) DEFAULT 15.00,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Settings Table
CREATE TABLE IF NOT EXISTS `Settings` (
    `SettingID` INT AUTO_INCREMENT PRIMARY KEY,
    `SettingKey` VARCHAR(100) UNIQUE NOT NULL,
    `SettingValue` TEXT NOT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. AdminShopToggleSettings Table
CREATE TABLE IF NOT EXISTS `AdminShopToggleSettings` (
    `SettingID` INT AUTO_INCREMENT PRIMARY KEY,
    `ShopOpen` TINYINT(1) DEFAULT 1,
    `CashbackMode` ENUM('automatic', 'manual') DEFAULT 'automatic',
    `LongDistanceFeeEnabled` TINYINT(1) DEFAULT 0,
    `LongDistanceThresholdKm` DECIMAL(5,2) DEFAULT 8.00,
    `LongDistanceFee` DECIMAL(10,2) DEFAULT 40.00,
    `LargeCartThreshold1Items` INT DEFAULT 10,
    `LargeCartThreshold1Minutes` INT DEFAULT 5,
    `LargeCartThreshold2Items` INT DEFAULT 20,
    `LargeCartThreshold2Minutes` INT DEFAULT 10,
    `DeliveryAddressVisibility` TINYINT(1) DEFAULT 1,
    `DeliveryProductListVisibility` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. ProductNotify Table
CREATE TABLE IF NOT EXISTS `ProductNotify` (
    `NotifyID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserID` BIGINT NOT NULL,
    `ProductID` BIGINT NOT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. CustomerRequests Table
CREATE TABLE IF NOT EXISTS `CustomerRequests` (
    `RequestID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserID` BIGINT NOT NULL,
    `Subject` VARCHAR(255) NOT NULL,
    `Message` TEXT NOT NULL,
    `Status` VARCHAR(50) DEFAULT 'PENDING',
    `AdminResponse` TEXT NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. PhotoOrders Table
CREATE TABLE IF NOT EXISTS `PhotoOrders` (
    `PhotoOrderID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserID` BIGINT NOT NULL,
    `PhotoUrl` VARCHAR(255) NOT NULL,
    `Notes` TEXT NULL,
    `Status` VARCHAR(50) DEFAULT 'PENDING',
    `AdminNotes` TEXT NULL,
    `EstimatedTotal` DECIMAL(10, 2) DEFAULT 0.00,
    `CreatedOrderID` BIGINT NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. DriverLocationPings Table
CREATE TABLE IF NOT EXISTS `DriverLocationPings` (
    `PingID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `DriverID` INT NOT NULL,
    `Latitude` DECIMAL(10, 8) NOT NULL,
    `Longitude` DECIMAL(11, 8) NOT NULL,
    `BatteryLevel` INT DEFAULT 100,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_driver_ping` (`DriverID`, `CreatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Feedback Table
CREATE TABLE IF NOT EXISTS `Feedback` (
    `FeedbackID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `OrderID` BIGINT NOT NULL,
    `UserID` BIGINT NOT NULL,
    `Rating` INT NOT NULL DEFAULT 5,
    `Comments` TEXT NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. BuyMoreOffers / buy_more_config Table
CREATE TABLE IF NOT EXISTS `buy_more_config` (
    `ID` INT AUTO_INCREMENT PRIMARY KEY,
    `ProductID` BIGINT NOT NULL,
    `VariantID` BIGINT NOT NULL,
    `MinQuantity` INT NOT NULL,
    `MaxQuantity` INT NOT NULL,
    `Price` DECIMAL(10,2) NOT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `StartDate` DATETIME NULL,
    `EndDate` DATETIME NULL,
    `CreatedBy` INT NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_prod_var` (`ProductID`, `VariantID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. product_restrictions Table
CREATE TABLE IF NOT EXISTS `product_restrictions` (
    `ID` INT AUTO_INCREMENT PRIMARY KEY,
    `ProductID` BIGINT NOT NULL,
    `VariantID` BIGINT NULL,
    `CategoryID` INT NULL,
    `RestrictionType` VARCHAR(50) NOT NULL,
    `RestrictionValue` VARCHAR(255) NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_prod_restrict` (`ProductID`, `RestrictionType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. cart_offers Table
CREATE TABLE IF NOT EXISTS `cart_offers` (
    `OfferID` INT AUTO_INCREMENT PRIMARY KEY,
    `Title` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `MinCartValue` DECIMAL(10,2) NOT NULL,
    `DiscountType` VARCHAR(20) DEFAULT 'percentage',
    `DiscountValue` DECIMAL(10,2) NOT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. wallet_transactions Table
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
    `TransactionID` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `UserID` BIGINT NOT NULL,
    `Amount` DECIMAL(15,2) NOT NULL,
    `Credited_Debited` TINYINT NOT NULL COMMENT '1=Credit, 2=Debit, 3=Expiry, 4=Reversal',
    `ContentType` TINYINT NOT NULL COMMENT '1=User, 2=Order, 3=Adjustment, 4=Cashback, 5=Membership',
    `ContentID` BIGINT NOT NULL,
    `Description` VARCHAR(255),
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`UserID`) REFERENCES `Users`(`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. cashback_rules Table
CREATE TABLE IF NOT EXISTS `cashback_rules` (
    `RuleID` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `RuleName` VARCHAR(100) NOT NULL,
    `CashbackAmount` DECIMAL(15,2) NOT NULL,
    `CashbackPercentage` DECIMAL(5,2),
    `MinimumOrderValue` DECIMAL(15,2) DEFAULT 0,
    `StartDate` DATETIME NOT NULL,
    `EndDate` DATETIME,
    `IsActive` TINYINT DEFAULT 1,
    `ApplicableProducts` TEXT DEFAULT NULL,
    `ExcludedProducts` TEXT DEFAULT NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. MembershipPlans Table
CREATE TABLE IF NOT EXISTS `MembershipPlans` (
    `PlanID` INT AUTO_INCREMENT PRIMARY KEY,
    `PlanName` VARCHAR(100) NOT NULL,
    `DurationDays` INT NOT NULL DEFAULT 30,
    `Price` DECIMAL(10, 2) NOT NULL,
    `DiscountPercentage` DECIMAL(5, 2) DEFAULT 10.00,
    `FreeDeliveryMinOrder` DECIMAL(10, 2) DEFAULT 199.00,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. RewardMilestones Table
CREATE TABLE IF NOT EXISTS `RewardMilestones` (
    `MilestoneID` INT AUTO_INCREMENT PRIMARY KEY,
    `MilestoneName` VARCHAR(100) NOT NULL,
    `TargetPoints` INT NOT NULL,
    `RewardType` VARCHAR(50) DEFAULT 'wallet_credit',
    `RewardValue` DECIMAL(10, 2) NOT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30. OrderETAAdjustments Table
CREATE TABLE IF NOT EXISTS `OrderETAAdjustments` (
    `AdjustmentID` INT AUTO_INCREMENT PRIMARY KEY,
    `OrderID` BIGINT NOT NULL,
    `OriginalETA` DATETIME NULL,
    `AdjustedETA` DATETIME NULL,
    `AdjustmentReason` VARCHAR(255) NULL,
    `InitiatorType` VARCHAR(20) DEFAULT 'ADMIN',
    `DriverID` INT NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 31. HomepageSections Table
CREATE TABLE IF NOT EXISTS `HomepageSections` (
    `HomeSectionID` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `ImageUrl` TEXT NULL,
    `StartDate` DATETIME NULL,
    `EndDate` DATETIME NULL,
    `DisplayOrder` INT DEFAULT 0,
    `Status` INT DEFAULT 1 COMMENT '0=Draft/Inactive, 1=Published, 2=Scheduled',
    `SectionType` VARCHAR(50) DEFAULT 'selected_products',
    `SystemKey` VARCHAR(50) NULL UNIQUE,
    `IsBuiltIn` TINYINT(1) DEFAULT 0,
    `ConfigurationJSON` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_hs_status_order` (`Status`, `DisplayOrder`),
    INDEX `idx_hs_system_key` (`SystemKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 32. HomeSectionProducts Table
CREATE TABLE IF NOT EXISTS `HomeSectionProducts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `HomeSectionID` INT NOT NULL,
    `ProductID` BIGINT NOT NULL,
    `DisplayOrder` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_hsp_section` (`HomeSectionID`),
    INDEX `idx_hsp_product` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 33. HomeSectionCategories Table
CREATE TABLE IF NOT EXISTS `HomeSectionCategories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `HomeSectionID` INT NOT NULL,
    `CategoryID` INT NOT NULL,
    `DisplayOrder` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_hsc_section` (`HomeSectionID`),
    INDEX `idx_hsc_category` (`CategoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 34. HomeSectionSubcategories Table
CREATE TABLE IF NOT EXISTS `HomeSectionSubcategories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `HomeSectionID` INT NOT NULL,
    `SubCategoryID` INT NOT NULL,
    `DisplayOrder` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_hss_section` (`HomeSectionID`),
    INDEX `idx_hss_subcategory` (`SubCategoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SYNTHETIC TEST SEED DATA (Non-Production, Isolated)
-- =============================================================================

-- Seed Admin User (Password is sha256 or bcrypt representation of 'admin123')
INSERT INTO `AdminUsers` (`AdminID`, `FirstName`, `LastName`, `EmailID`, `MobileNumber`, `Password`, `Role`, `Status`, `DutyStatus`)
VALUES 
(1, 'Super', 'Admin', 'admin@clikgett.com', '9999999991', '0192023a7bbd73250516f069df18b500', 1, 1, 'OFFLINE'),
(2, 'ClikGett', 'Admin', 'clikgett@admin.com', '9999999992', 'clikgett', 1, 1, 'OFFLINE'),
(16, 'Ravi', 'Kumar', 'deliveryboy1@clikgett.com', '9999999916', '0192023a7bbd73250516f069df18b500', 16, 1, 'ONLINE')
ON DUPLICATE KEY UPDATE `Status` = 1;

-- Seed Customer User
INSERT INTO `Users` (`UserID`, `FirstName`, `LastName`, `MobileNumber`, `EmailID`, `WalletAmount`, `Status`, `SignupCompleted`)
VALUES 
(1000523, 'LocalTest', 'Customer', '9999999999', 'customer@clikgett.local', 500.00, 1, 1)
ON DUPLICATE KEY UPDATE `Status` = 1;

-- Seed Core Categories
INSERT INTO `Categories` (`CategoryID`, `CategoryName`, `CategoryImage`, `Status`)
VALUES 
(1, 'Dairy & Breakfast', 'dairy.png', 1),
(2, 'Fruits & Vegetables', 'fruits.png', 1),
(3, 'Groceries & Staples', 'groceries.png', 1)
ON DUPLICATE KEY UPDATE `Status` = 1;

-- Seed SubCategories
INSERT INTO `SubCategories` (`SubCategoryID`, `CategoryID`, `SubCategoryName`, `DisplayOrder`, `Status`)
VALUES 
(1, 1, 'Milk & Cream', 1, 1),
(2, 1, 'Butter & Ghee', 2, 1),
(3, 2, 'Fresh Vegetables', 1, 1)
ON DUPLICATE KEY UPDATE `Status` = 1;

-- Seed Product & Variant
INSERT INTO `Products` (`ProductID`, `ProductName`, `Description`, `CategoryID`, `SubCategoryID`, `Status`, `Type`, `ImageUrl`, `ProductImages`)
VALUES 
(82, 'Full Cream Fresh Milk 1L', 'Pasteurized homogenized cow milk pouch', 1, 1, 1, 1, 'milk_1l.png', '["milk_1l.png"]'),
(83, 'Cow Fresh Milk 500ml', 'Pure farm fresh cow milk with balanced cream.', 1, 1, 1, 1, 'cow_milk_500ml.png', '["cow_milk_500ml.png"]'),
(84, 'Toned Fresh Milk 1L', 'Healthy toned pasteurized milk for daily wellness.', 1, 1, 1, 1, 'toned_milk_1l.png', '["toned_milk_1l.png"]'),
(85, 'Organic Buffalo Milk 1L', 'Rich and creamy pure buffalo milk pouch.', 1, 1, 1, 1, 'buffalo_milk_1l.png', '["buffalo_milk_1l.png"]'),
(86, 'Fresh Malai Paneer 200g', 'Soft and fresh malai paneer block for curry & snacks.', 1, 2, 1, 1, 'paneer_200g.png', '["paneer_200g.png"]'),
(87, 'Pure Cow Ghee 500ml', 'Traditional bilona method pure cow ghee.', 1, 2, 1, 1, 'cow_ghee_500ml.png', '["cow_ghee_500ml.png"]'),
(88, 'Salted Table Butter 100g', 'Delicious salted creamy butter block.', 1, 2, 1, 1, 'butter_100g.png', '["butter_100g.png"]'),
(89, 'Fresh Red Onions 1kg', 'Crisp pungent red onions sourced directly from farms.', 2, 3, 1, 1, 'onions_1kg.png', '["onions_1kg.png"]'),
(90, 'Farm Fresh Potatoes 1kg', 'Premium quality round golden potatoes.', 2, 3, 1, 1, 'potatoes_1kg.png', '["potatoes_1kg.png"]'),
(91, 'Organic Forest Honey 250g', 'Raw unprocessed multi-floral forest honey jar.', 3, NULL, 1, 1, 'honey_250g.png', '["honey_250g.png"]')
ON DUPLICATE KEY UPDATE `Status` = 1;

INSERT INTO `ProductVariants` (`VariantID`, `ProductID`, `metrictype`, `metricvalue`, `Price`, `OfferPrice`, `AvailableQty`, `maxQty`, `status`)
VALUES 
(1, 82, 'Litre', '1', 65.00, 60.00, 150, 10, 1),
(831, 83, 'ml', '500', 34.00, 30.00, 40, 10, 1),
(841, 84, 'L', '1', 58.00, 54.00, 35, 10, 1),
(851, 85, 'L', '1', 78.00, 72.00, 20, 10, 1),
(861, 86, 'g', '200', 95.00, 85.00, 25, 10, 1),
(871, 87, 'ml', '500', 350.00, 320.00, 15, 5, 1),
(881, 88, 'g', '100', 55.00, 50.00, 50, 10, 1),
(891, 89, 'kg', '1', 40.00, 35.00, 60, 10, 1),
(901, 90, 'kg', '1', 35.00, 30.00, 80, 10, 1),
(911, 91, 'g', '250', 180.00, 165.00, 10, 5, 1)
ON DUPLICATE KEY UPDATE `status` = 1;

-- Seed Warehouse Hub
INSERT INTO `Warehouses` (`WarehouseID`, `WarehouseName`, `Latitude`, `Longitude`, `Radius`, `Status`)
VALUES 
(1, 'Kurnool Central Warehouse', 15.82810000, 78.03730000, 20.00, 1)
ON DUPLICATE KEY UPDATE `Status` = 1;

-- Seed Address
INSERT INTO `Address` (`AddressID`, `UserID`, `Type`, `Address`, `FlatNo`, `Landmark`, `City`, `Latitude`, `Longitude`, `Status`)
VALUES 
(1, 1000523, 'Home', 'Opposite Municipal Park, Main Road', 'Flat 402, Sai Residency', 'Near Clock Tower', 'Kurnool', 15.82900000, 78.03800000, 1)
ON DUPLICATE KEY UPDATE `Status` = 1;

-- Seed Settings
INSERT INTO `Settings` (`SettingKey`, `SettingValue`, `Status`)
VALUES 
('StoreLatitude', '15.8281', 1),
('StoreLongitude', '78.0373', 1),
('Radius', '20', 1),
('Minordervalue_wallet', '399', 1),
('DeliveryFee', '25', 1),
('FreeDeliveryThreshold', '499', 1)
ON DUPLICATE KEY UPDATE `SettingValue` = VALUES(`SettingValue`);

INSERT INTO `AdminShopToggleSettings` (`SettingID`, `ShopOpen`, `CashbackMode`)
VALUES 
(1, 1, 'automatic')
ON DUPLICATE KEY UPDATE `ShopOpen` = 1;

-- 31. RecommendedProducts Table
CREATE TABLE IF NOT EXISTS `RecommendedProducts` (
    `RecProductID` INT AUTO_INCREMENT PRIMARY KEY,
    `ProductID` BIGINT NOT NULL,
    `Status` INT DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_rec_product` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 32. HomepageSections Table
CREATE TABLE IF NOT EXISTS `HomepageSections` (
    `HomeSectionID` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `ImageUrl` TEXT NULL,
    `StartDate` DATETIME NULL,
    `EndDate` DATETIME NULL,
    `DisplayOrder` INT DEFAULT 0,
    `Status` INT DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 33. HomeSectionProducts Table
CREATE TABLE IF NOT EXISTS `HomeSectionProducts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `HomeSectionID` INT NOT NULL,
    `ProductID` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_hs_section` (`HomeSectionID`),
    INDEX `idx_hs_product` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Banners
INSERT INTO `Banners` (`BannerID`, `BannerName`, `Description`, `BannerImage`, `ImageUrl`, `Status`, `DestinationType`, `DestinationID`)
VALUES 
(1, 'Super Milk & Breakfast Sale', 'Up to 25% off on morning dairy essentials', 'banner_dairy.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Banners/banner_dairy.png', 1, 'Category', 1),
(2, 'Crisp Farm Veggies & Fruits', 'Farm fresh, harvested daily, delivered in 10 mins', 'banner_veggies.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Banners/banner_veggies.png', 1, 'Category', 2),
(3, 'Tea Time Snacks & Beverages', 'Crunchy namkeens, cookies, and refreshing drinks', 'banner_snacks.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Banners/banner_snacks.png', 1, 'Category', 8)
ON DUPLICATE KEY UPDATE `Status` = 1, `BannerImage` = VALUES(`BannerImage`), `ImageUrl` = VALUES(`ImageUrl`), `BannerName` = VALUES(`BannerName`);

-- Seed Expanded Categories
INSERT INTO `Categories` (`CategoryID`, `CategoryName`, `CategoryImage`, `ImageUrl`, `Status`, `Priority`)
VALUES 
(1, 'Dairy & Breakfast', 'dairy.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/dairy.png', 1, 1),
(2, 'Fruits & Vegetables', 'fruits.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/fruits.png', 1, 2),
(3, 'Groceries & Staples', 'groceries.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/groceries.png', 1, 3),
(4, 'Atta, Rice & Dal', 'atta_rice_dal.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/atta_rice_dal.png', 1, 4),
(5, 'Oil, Ghee & Masala', 'oil_masala.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/oil_masala.png', 1, 5),
(6, 'Bakery & Biscuits', 'bakery_biscuits.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/bakery_biscuits.png', 1, 6),
(7, 'Dry Fruits & Cereals', 'dry_fruits.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/dry_fruits.png', 1, 7),
(8, 'Chips & Namkeen', 'chips_namkeen.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/chips_namkeen.png', 1, 8),
(9, 'Sweets & Chocolates', 'sweets_chocolates.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/sweets_chocolates.png', 1, 9),
(10, 'Drinks & Juices', 'drinks_juices.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/drinks_juices.png', 1, 10),
(11, 'Tea & Coffee', 'tea_coffee.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/tea_coffee.png', 1, 11),
(12, 'Instant Food & Noodles', 'instant_food.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/instant_food.png', 1, 12)
ON DUPLICATE KEY UPDATE `Status` = 1, `CategoryName` = VALUES(`CategoryName`), `CategoryImage` = VALUES(`CategoryImage`), `ImageUrl` = VALUES(`ImageUrl`), `Priority` = VALUES(`Priority`);

-- Seed Expanded SubCategories
INSERT INTO `SubCategories` (`SubCategoryID`, `CategoryID`, `SubCategoryName`, `DisplayOrder`, `Status`)
VALUES 
(1, 1, 'Milk & Cream', 1, 1),
(2, 1, 'Butter & Ghee', 2, 1),
(3, 2, 'Fresh Vegetables', 1, 1),
(4, 4, 'Atta & Flours', 1, 1),
(5, 4, 'Rice & Grains', 2, 1),
(6, 5, 'Cooking Oils', 1, 1),
(7, 8, 'Potato Chips & Crisps', 1, 1),
(8, 10, 'Fruit Juices & Cold Drinks', 1, 1),
(9, 11, 'Tea & Coffee Leaves', 1, 1),
(10, 12, 'Instant Noodles & Pasta', 1, 1)
ON DUPLICATE KEY UPDATE `Status` = 1, `SubCategoryName` = VALUES(`SubCategoryName`);

-- Seed Expanded Products
INSERT INTO `Products` (`ProductID`, `ProductName`, `Description`, `CategoryID`, `SubCategoryID`, `Status`, `Type`, `ImageUrl`, `ProductImages`)
VALUES 
(92, 'Aashirvaad Shudh Chakki Atta 5kg', '100% whole wheat chakki atta with natural fibers.', 4, 4, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/atta_5kg.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/atta_5kg.png"]'),
(93, 'Fortune Rozana Basmati Rice 1kg', 'Pristine fragrant aged basmati rice for daily meals.', 4, 5, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/basmati_1kg.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/basmati_1kg.png"]'),
(94, 'Tata Sampann Unpolished Toor Dal 1kg', 'Rich in protein unpolished toor dal grains.', 4, 5, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/toor_dal_1kg.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/toor_dal_1kg.png"]'),
(95, 'Fortune Sunlite Refined Sunflower Oil 1L', 'Light and healthy sunflower oil enriched with vitamins.', 5, 6, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/sunflower_oil_1l.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/sunflower_oil_1l.png"]'),
(96, 'Lay''s India''s Magic Masala Chips 50g', 'Spicy rippled potato chips with zesty Indian spices.', 8, 7, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/lays_masala.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/lays_masala.png"]'),
(97, 'Kurkure Masala Munch 85g', 'Crispy crunchy corn & rice puffs with rich spices.', 8, 7, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/kurkure_munch.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/kurkure_munch.png"]'),
(98, 'Real Activ 100% Orange Fruit Juice 1L', 'No added sugar pure refreshing orange juice carton.', 10, 8, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/orange_juice_1l.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/orange_juice_1l.png"]'),
(99, 'Thums Up Charged Cold Drink 750ml', 'Strong sparkling fizzy soft drink bottle.', 10, 8, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/thums_up_750ml.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/thums_up_750ml.png"]'),
(100, 'Taj Mahal Strong Leaf Tea 250g', 'Rich aroma premium crafted Assam tea blend.', 11, 9, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/taj_mahal_tea_250g.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/taj_mahal_tea_250g.png"]'),
(101, 'Maggi 2-Minute Masala Instant Noodles 280g', 'Classic Indian favorite instant noodles 4-pack.', 12, 10, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/maggi_4pack.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/maggi_4pack.png"]')
ON DUPLICATE KEY UPDATE `Status` = 1, `ProductName` = VALUES(`ProductName`);

-- Seed Product Variants
INSERT INTO `ProductVariants` (`VariantID`, `ProductID`, `metrictype`, `metricvalue`, `Price`, `OfferPrice`, `AvailableQty`, `maxQty`, `status`)
VALUES 
(921, 92, 'kg', '5', 260.00, 235.00, 45, 4, 1),
(931, 93, 'kg', '1', 110.00, 95.00, 60, 5, 1),
(941, 94, 'kg', '1', 165.00, 148.00, 50, 5, 1),
(951, 95, 'L', '1', 145.00, 130.00, 75, 6, 1),
(961, 96, 'g', '50', 20.00, 18.00, 120, 10, 1),
(971, 97, 'g', '85', 25.00, 22.00, 100, 10, 1),
(981, 98, 'L', '1', 135.00, 115.00, 40, 5, 1),
(991, 99, 'ml', '750', 45.00, 40.00, 80, 6, 1),
(1001, 100, 'g', '250', 170.00, 150.00, 50, 5, 1),
(1011, 101, 'g', '280', 56.00, 50.00, 150, 10, 1)
ON DUPLICATE KEY UPDATE `status` = 1, `Price` = VALUES(`Price`), `OfferPrice` = VALUES(`OfferPrice`), `AvailableQty` = VALUES(`AvailableQty`);

-- Seed Recommended Products
INSERT INTO `RecommendedProducts` (`ProductID`, `Status`)
VALUES (82, 1), (83, 1), (84, 1), (86, 1), (88, 1), (89, 1), (90, 1), (92, 1), (96, 1), (101, 1)
ON DUPLICATE KEY UPDATE `Status` = 1;

-- Seed HomepageSections (8 Authoritative Built-in Sections + 3 Curated Collections)
INSERT INTO `HomepageSections` (`HomeSectionID`, `Name`, `Description`, `ImageUrl`, `SectionType`, `SystemKey`, `IsBuiltIn`, `DisplayOrder`, `Status`, `ConfigurationJSON`)
VALUES 
(10, 'Promotional Banners', 'Special promotions, bank offers, and discount carousel', NULL, 'promotional_banner', 'hero_banners', 1, 1, 1, '{"theme":"mint","badgeText":"Offers"}'),
(11, 'Shop by Category', 'Explore curated grocery, snack, beverage and household categories', NULL, 'shop_by_category', 'shop_by_category', 1, 2, 1, '{"theme":"white","viewAllLabel":"View All Categories"}'),
(12, 'Bestsellers', 'Most loved items frequently bought by our customers', NULL, 'bestsellers', 'bestsellers', 1, 3, 1, '{"theme":"white","badgeText":"Top Seller"}'),
(13, 'Grocery & Kitchen', 'Fresh milk, daily vegetables, grains, and kitchen essentials', NULL, 'category_shelf', 'grocery_kitchen', 1, 4, 1, '{"theme":"mint","icon":"kitchen_rounded","viewAllLabel":"See all"}'),
(14, 'Snacks & Drinks', 'Crispy namkeen, cold beverages, chips and instant snacks', NULL, 'category_shelf', 'snacks_drinks', 1, 5, 1, '{"theme":"orange","icon":"fastfood_rounded","viewAllLabel":"See all"}'),
(15, 'Deals & Offers', 'Special markdown prices and limited-time flash discount offers', NULL, 'deals_and_offers', 'deals_offers', 1, 6, 1, '{"theme":"orange","badgeText":"Save Big"}'),
(16, 'Recommended for You', 'Personalized product recommendations based on shopping patterns', NULL, 'recommendations', 'recommended_for_you', 1, 7, 1, '{"theme":"lavender","badgeText":"For You"}'),
(17, 'Order Again', 'Quick one-tap repeat purchases from your recent order history', NULL, 'order_again', 'order_again', 1, 8, 1, '{"theme":"sky","badgeText":"Repeat"}'),
(1, 'Daily Fresh Essentials', 'Farm fresh vegetables and pure morning dairy', 'https://d3c9kvg5gaqz48.cloudfront.net/Sections/daily_fresh.png', 'selected_products', NULL, 0, 9, 1, NULL),
(2, 'Snacks & Evening Munchies', 'Crispy chips, refreshing beverages and teas', 'https://d3c9kvg5gaqz48.cloudfront.net/Sections/snacks_munchies.png', 'selected_products', NULL, 0, 10, 1, NULL),
(3, 'Kitchen & Cooking Staples', 'Pure grains, aromatic basmati, and nutritious dals', 'https://d3c9kvg5gaqz48.cloudfront.net/Sections/cooking_staples.png', 'selected_products', NULL, 0, 11, 1, NULL)
ON DUPLICATE KEY UPDATE 
  `Status` = 1, 
  `Name` = VALUES(`Name`), 
  `Description` = VALUES(`Description`),
  `SectionType` = VALUES(`SectionType`),
  `SystemKey` = VALUES(`SystemKey`),
  `IsBuiltIn` = VALUES(`IsBuiltIn`),
  `DisplayOrder` = VALUES(`DisplayOrder`),
  `ConfigurationJSON` = VALUES(`ConfigurationJSON`);

-- Seed HomeSectionCategories
INSERT INTO `HomeSectionCategories` (`HomeSectionID`, `CategoryID`, `DisplayOrder`)
VALUES
(13, 1, 1), (13, 2, 2), (13, 4, 3), (13, 5, 4), (13, 6, 5), (13, 7, 6),
(14, 8, 1), (14, 9, 2), (14, 10, 3), (14, 11, 4), (14, 12, 5);

-- Seed HomeSectionProducts
INSERT INTO `HomeSectionProducts` (`HomeSectionID`, `ProductID`, `DisplayOrder`)
VALUES 
(1, 82, 1), (1, 83, 2), (1, 86, 3), (1, 89, 4), (1, 90, 5),
(2, 96, 1), (2, 97, 2), (2, 98, 3), (2, 99, 4), (2, 101, 5),
(3, 92, 1), (3, 93, 2), (3, 94, 3), (3, 95, 4), (3, 87, 5);

-- Additional Local Feature & Admin Tables
CREATE TABLE IF NOT EXISTS `UserNotifications` (
    `NotificationID` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserID` BIGINT NOT NULL,
    `Title` VARCHAR(255) NOT NULL,
    `Message` TEXT NOT NULL,
    `Status` TINYINT DEFAULT 1,
    `Type` TINYINT DEFAULT 1,
    `IsRead` TINYINT DEFAULT 0,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_un_user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PhotoOrderRequests` (
    `RequestID` INT AUTO_INCREMENT PRIMARY KEY,
    `RequestCode` VARCHAR(32) NOT NULL UNIQUE,
    `UserID` INT NOT NULL,
    `ImageStoragePath` VARCHAR(500) NOT NULL,
    `CustomerNotes` TEXT NULL,
    `RequestStatus` VARCHAR(50) DEFAULT 'PENDING',
    `AdminReviewerID` INT NULL,
    `AdminNotes` TEXT NULL,
    `SubTotal` DECIMAL(10,2) DEFAULT 0.00,
    `DeliveryCharges` DECIMAL(10,2) DEFAULT 0.00,
    `Discount` DECIMAL(10,2) DEFAULT 0.00,
    `GrandTotal` DECIMAL(10,2) DEFAULT 0.00,
    `DeliveryAddressID` INT NULL,
    `DeliveryAddressSnapshot` TEXT NULL,
    `PaymentMethod` VARCHAR(20) DEFAULT 'COD',
    `CreatedOrderID` INT NULL,
    `ReviewedAt` DATETIME NULL,
    `ProposedAt` DATETIME NULL,
    `ConfirmedAt` DATETIME NULL,
    `ResolvedAt` DATETIME NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_por_user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PhotoOrderItems` (
    `PhotoOrderItemID` INT AUTO_INCREMENT PRIMARY KEY,
    `RequestID` INT NOT NULL,
    `ProductID` INT NOT NULL,
    `VariantID` INT NULL,
    `ItemName` VARCHAR(255) NOT NULL,
    `Quantity` INT DEFAULT 1,
    `UnitPrice` DECIMAL(10,2) DEFAULT 0.00,
    `LineTotal` DECIMAL(10,2) DEFAULT 0.00,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_poi_req` (`RequestID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CustomerEnquiries` (
    `EnquiryID` INT AUTO_INCREMENT PRIMARY KEY,
    `UserID` INT NOT NULL,
    `Name` VARCHAR(255),
    `MobileNumber` VARCHAR(20),
    `Subject` VARCHAR(255),
    `Description` TEXT NOT NULL,
    `Status` VARCHAR(50) DEFAULT 'Pending',
    `AdminNotes` TEXT,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_ce_user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ProductRequests` (
    `RequestID` INT AUTO_INCREMENT PRIMARY KEY,
    `UserID` INT NOT NULL,
    `CustomerName` VARCHAR(255),
    `MobileNumber` VARCHAR(20),
    `ProductName` VARCHAR(255) NOT NULL,
    `Brand` VARCHAR(100),
    `SizeOrQty` VARCHAR(100),
    `Description` TEXT,
    `ImagePath` VARCHAR(500),
    `Status` VARCHAR(50) DEFAULT 'Pending',
    `LinkedProductID` INT NULL,
    `AdminNotes` TEXT,
    `NotifiedAt` DATETIME NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_pr_user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Sales` (
    `SaleID` INT AUTO_INCREMENT PRIMARY KEY,
    `SaleName` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `DiscountType` VARCHAR(50) DEFAULT 'percentage',
    `DiscountValue` DECIMAL(10,2) DEFAULT 0.00,
    `StartDate` DATETIME NULL,
    `EndDate` DATETIME NULL,
    `Status` TINYINT DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SaleItems` (
    `SaleItemID` INT AUTO_INCREMENT PRIMARY KEY,
    `SaleID` INT NOT NULL,
    `ProductID` BIGINT NOT NULL,
    `CategoryID` INT NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_si_sale` (`SaleID`),
    INDEX `idx_si_prod` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Rewards` (
    `RewardID` INT AUTO_INCREMENT PRIMARY KEY,
    `RewardName` VARCHAR(100) NOT NULL,
    `RewardType` VARCHAR(50) NOT NULL,
    `TriggerType` VARCHAR(50) DEFAULT 'order_count',
    `TriggerValue` INT DEFAULT 0,
    `RewardValue` DECIMAL(10,2) DEFAULT 0.00,
    `Description` TEXT NULL,
    `Status` TINYINT DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_unlocks` (
    `UnlockID` INT AUTO_INCREMENT PRIMARY KEY,
    `ThresholdAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `ProductID` BIGINT NOT NULL,
    `VariantID` BIGINT NULL,
    `UnlockPrice` DECIMAL(10,2) DEFAULT 0.00,
    `Message` VARCHAR(255) NULL,
    `StartDate` DATETIME NULL,
    `EndDate` DATETIME NULL,
    `Status` TINYINT DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_pu_prod` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AbandonedCartLogs` (
    `LogID` INT AUTO_INCREMENT PRIMARY KEY,
    `CartID` BIGINT NOT NULL,
    `UserID` BIGINT NOT NULL,
    `TotalAmount` DECIMAL(10,2) DEFAULT 0.00,
    `Status` VARCHAR(50) DEFAULT 'active',
    `CartSnapshot` JSON NULL,
    `ReminderSentAt` DATETIME NULL,
    `ReminderCount` INT DEFAULT 0,
    `RecoveredAt` DATETIME NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_acl_cart` (`CartID`),
    INDEX `idx_acl_user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `OrderTimings` (
    `TimingID` INT AUTO_INCREMENT PRIMARY KEY,
    `StartTime` VARCHAR(50) NOT NULL,
    `EndTime` VARCHAR(50) NOT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SearchLogs` (
    `SearchID` INT AUTO_INCREMENT PRIMARY KEY,
    `Keyword` VARCHAR(255) NOT NULL,
    `UserID` INT NULL,
    `ResultCount` INT DEFAULT 0,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_searchlogs_kw` (`Keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `OrderETAAdjustments` (
    `AdjustmentID` INT AUTO_INCREMENT PRIMARY KEY,
    `OrderID` INT NOT NULL,
    `PreviousETA` DATETIME NULL,
    `NewETA` DATETIME NOT NULL,
    `AdjustmentMinutes` INT NOT NULL,
    `Reason` TEXT NULL,
    `AdminID` INT NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_eta_order` (`OrderID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CashbackPending` (
    `CashbackPendingID` INT AUTO_INCREMENT PRIMARY KEY,
    `OrderID` INT NOT NULL,
    `UserID` INT NOT NULL,
    `CashbackAmount` DECIMAL(10,2) NOT NULL,
    `Status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    `AdminID` INT NULL,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ApprovedAt` DATETIME NULL,
    INDEX `idx_cbp_user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Kits` (
    `KitID` INT AUTO_INCREMENT PRIMARY KEY,
    `KitName` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `ImageUrl` VARCHAR(255) DEFAULT 'NA',
    `Price` DECIMAL(10, 2) DEFAULT 0.00,
    `OfferPrice` DECIMAL(10, 2) DEFAULT 0.00,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `KitItems` (
    `KitItemID` INT AUTO_INCREMENT PRIMARY KEY,
    `KitID` INT NOT NULL,
    `ProductID` BIGINT NOT NULL,
    `VariantID` BIGINT NOT NULL,
    `Status` TINYINT(1) DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_kititems_kit` (`KitID`),
    INDEX `idx_kititems_product` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure MySQL native password authentication for legacy Node.js driver compatibility
ALTER USER IF EXISTS 'clikgett_user'@'%' IDENTIFIED WITH mysql_native_password BY 'clikgett_dev_password';
ALTER USER IF EXISTS 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'clikgett_root_dev';
FLUSH PRIVILEGES;
