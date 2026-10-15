-- Schema sync: additive changes to match the AWS RDS production schema.
-- Generated from a structure-only dump (no data). Safe to re-run.

CREATE TABLE IF NOT EXISTS `AvailabilityForms` (
  `FormID` int NOT NULL AUTO_INCREMENT,
  `UserID` int DEFAULT NULL,
  `CustomerName` varchar(100) NOT NULL,
  `MobileNumber` varchar(20) NOT NULL,
  `ProductName` varchar(255) NOT NULL,
  `Pincode` varchar(20) NOT NULL,
  `Status` enum('Pending','Reviewed','Available','Not Available') DEFAULT 'Pending',
  `Notes` text,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`FormID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `CallBackForms` (
  `FormID` int NOT NULL AUTO_INCREMENT,
  `UserID` int DEFAULT NULL,
  `FullName` varchar(100) NOT NULL,
  `MobileNumber` varchar(20) NOT NULL,
  `PreferredTime` varchar(100) DEFAULT NULL,
  `Subject` varchar(255) DEFAULT NULL,
  `Message` text,
  `Status` enum('Pending','In Progress','Completed','Cancelled') DEFAULT 'Pending',
  `Notes` text,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`FormID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Cart` (
  `CartID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CartID`),
  KEY `UserID` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `FranchiseEnquiryForms` (
  `FormID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(100) NOT NULL,
  `MobileNumber` varchar(20) NOT NULL,
  `EmailID` varchar(100) DEFAULT NULL,
  `City` varchar(100) NOT NULL,
  `State` varchar(100) DEFAULT NULL,
  `InvestmentRange` varchar(100) DEFAULT NULL,
  `Experience` text,
  `Message` text,
  `Status` enum('Pending','In Review','Contacted','Approved','Rejected') DEFAULT 'Pending',
  `Notes` text,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`FormID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `NotifyProducts` (
  `NotifyID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `ProductID` int NOT NULL,
  `VariantID` int DEFAULT NULL,
  `MobileNumber` varchar(20) DEFAULT NULL,
  `EmailID` varchar(100) DEFAULT NULL,
  `Status` varchar(50) DEFAULT 'Pending',
  `NotifiedAt` datetime DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`NotifyID`),
  KEY `idx_notify_prod` (`ProductID`,`Status`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `OrderPayments` (
  `OrderPaymentID` int NOT NULL AUTO_INCREMENT,
  `OrderReceiptID` int DEFAULT NULL,
  `UserID` int DEFAULT NULL,
  `OrderAmount` decimal(10,2) DEFAULT NULL,
  `OrderCurrency` varchar(10) DEFAULT NULL,
  `Notes` text,
  `PaymentCapture` int DEFAULT NULL,
  `RazorpayOrderID` varchar(255) DEFAULT NULL,
  `Type` int DEFAULT '1',
  PRIMARY KEY (`OrderPaymentID`)
) ENGINE=InnoDB AUTO_INCREMENT=243 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `OrderStatusTimeline` (
  `TimelineID` int NOT NULL AUTO_INCREMENT,
  `OrderID` int NOT NULL,
  `OrderStatus` int NOT NULL,
  `Notes` text,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TimelineID`),
  KEY `idx_timeline_order` (`OrderID`)
) ENGINE=InnoDB AUTO_INCREMENT=203 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `UserMemberships` (
  `UserMembershipID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `PlanID` int NOT NULL,
  `Price` decimal(10,2) NOT NULL,
  `StartDate` datetime NOT NULL,
  `EndDate` datetime NOT NULL,
  `RazorpayOrderID` varchar(255) NOT NULL,
  `PaymentTransactionID` varchar(255) DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserMembershipID`),
  UNIQUE KEY `RazorpayOrderID` (`RazorpayOrderID`),
  KEY `PlanID` (`PlanID`),
  KEY `idx_usermemberships_user` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `UserRewards` (
  `UserRewardID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `RewardID` int NOT NULL,
  `CurrentProgress` decimal(12,2) NOT NULL DEFAULT '0.00',
  `IsCompleted` tinyint(1) NOT NULL DEFAULT '0',
  `IsClaimed` tinyint(1) NOT NULL DEFAULT '0',
  `CompletedAt` timestamp NULL DEFAULT NULL,
  `ClaimedAt` timestamp NULL DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserRewardID`),
  UNIQUE KEY `uk_user_reward` (`UserID`,`RewardID`),
  KEY `RewardID` (`RewardID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Wallets` (
  `WalletID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Amount` double NOT NULL,
  `Credited_Debited` tinyint(1) NOT NULL,
  `ContentType` tinyint(1) NOT NULL,
  `ContentID` int NOT NULL,
  `Description` varchar(200) NOT NULL DEFAULT 'NA',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ExpiryDate` datetime DEFAULT NULL,
  `IsExpired` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`WalletID`)
) ENGINE=InnoDB AUTO_INCREMENT=500 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `order_item_removals` (
  `RemovalID` int NOT NULL AUTO_INCREMENT,
  `OrderID` int NOT NULL,
  `OrderItemID` int DEFAULT NULL,
  `ProductID` int NOT NULL,
  `VariantID` int DEFAULT NULL,
  `ProductName` varchar(255) NOT NULL,
  `Quantity` int NOT NULL,
  `UnitPrice` decimal(10,2) NOT NULL DEFAULT '0.00',
  `RefundAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `RefundStatus` varchar(50) DEFAULT 'NOT_APPLICABLE',
  `Reason` varchar(100) NOT NULL,
  `Description` text NOT NULL,
  `AdminID` int DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RemovalID`),
  KEY `idx_order_id` (`OrderID`),
  KEY `idx_created_at` (`CreatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AbandonedCartLogs` ADD COLUMN `ItemCount` int DEFAULT 0 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AbandonedCartLogs' AND column_name = 'ItemCount');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `ShopStatus` tinyint DEFAULT 1', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'ShopStatus');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `CreatedAt` timestamp DEFAULT CURRENT_TIMESTAMP', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'CreatedAt');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `UpdatedAt` timestamp DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'UpdatedAt');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `Latitude` double DEFAULT 0', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'Latitude');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `Longitude` double DEFAULT 0', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'Longitude');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `PricePerKm` double DEFAULT 0', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'PricePerKm');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `MinCartValue` decimal(10,2) DEFAULT 0.00 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'MinCartValue');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `CashbackExpiryDays` int DEFAULT 30 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'CashbackExpiryDays');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `CouponExpiryDays` int DEFAULT 15 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'CouponExpiryDays');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `DeliveryRadiusKm` decimal(10,2) DEFAULT 20.00 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'DeliveryRadiusKm');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `BaseDeliveryCharge` decimal(10,2) DEFAULT 25.00 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'BaseDeliveryCharge');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `MembershipEnabled` tinyint(1) DEFAULT 0 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'MembershipEnabled');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `RewardsEnabled` tinyint(1) DEFAULT 0 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'RewardsEnabled');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `SalesEnabled` tinyint(1) DEFAULT 0 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'SalesEnabled');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `NotificationsEnabled` tinyint(1) DEFAULT 1 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'NotificationsEnabled');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `CashbackEnabled` tinyint(1) DEFAULT 0 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'CashbackEnabled');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `CashbackPercentage` decimal(5,2) DEFAULT 0.00 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'CashbackPercentage');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `CashbackMaxAmount` decimal(10,2) DEFAULT 0.00 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'CashbackMaxAmount');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `SchedulingEnabled` tinyint(1) DEFAULT 0 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'SchedulingEnabled');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `MaximumScheduleDays` int DEFAULT 7 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'MaximumScheduleDays');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `MinimumScheduleHours` int DEFAULT 2 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'MinimumScheduleHours');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `DeliverySlotInterval` int DEFAULT 30 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'DeliverySlotInterval');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `FeedbackEnabled` tinyint(1) DEFAULT 1 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'FeedbackEnabled');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `AbandonedCartEnabled` tinyint(1) DEFAULT 0 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'AbandonedCartEnabled');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `AbandonedCartTimeoutMinutes` int DEFAULT 60 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'AbandonedCartTimeoutMinutes');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `AbandonedCartReminderHours` int DEFAULT 24 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'AbandonedCartReminderHours');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminShopToggleSettings` ADD COLUMN `AbandonedCartExpirationDays` int DEFAULT 7 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminShopToggleSettings' AND column_name = 'AbandonedCartExpirationDays');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminUsers` ADD COLUMN `OTP` varchar(45) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminUsers' AND column_name = 'OTP');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminUsers` ADD COLUMN `OTPSent` int DEFAULT 0', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminUsers' AND column_name = 'OTPSent');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminUsers` ADD COLUMN `ProfilePic` varchar(45) DEFAULT ''NA''', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminUsers' AND column_name = 'ProfilePic');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminUsers` ADD COLUMN `DeliveryPoints` double DEFAULT 0', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminUsers' AND column_name = 'DeliveryPoints');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `AdminUsers` ADD COLUMN `WarehouseID` int NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'AdminUsers' AND column_name = 'WarehouseID');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `CartItems` ADD COLUMN `Type` int NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'CartItems' AND column_name = 'Type');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Categories` ADD COLUMN `Description` varchar(45) DEFAULT ''NA''', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Categories' AND column_name = 'Description');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `CustomerEnquiries` ADD COLUMN `ImagePath` varchar(500) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'CustomerEnquiries' AND column_name = 'ImagePath');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `CustomerEnquiries` ADD COLUMN `ProductName` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'CustomerEnquiries' AND column_name = 'ProductName');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `CustomerEnquiries` ADD COLUMN `Category` varchar(100) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'CustomerEnquiries' AND column_name = 'Category');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Feedback` ADD COLUMN `Message` text NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Feedback' AND column_name = 'Message');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Feedback` ADD COLUMN `Category` varchar(50) DEFAULT ''general''', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Feedback' AND column_name = 'Category');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Feedback` ADD COLUMN `Status` varchar(20) DEFAULT ''open''', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Feedback' AND column_name = 'Status');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Feedback` ADD COLUMN `UpdatedAt` timestamp DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Feedback' AND column_name = 'UpdatedAt');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `KitItems` ADD COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'KitItems' AND column_name = 'created_at');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Kits` ADD COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Kits' AND column_name = 'created_at');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Kits` ADD COLUMN `AvailableQty` int NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Kits' AND column_name = 'AvailableQty');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `MembershipPlans` ADD COLUMN `FreeDelivery` tinyint(1) DEFAULT 0 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'MembershipPlans' AND column_name = 'FreeDelivery');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `MembershipPlans` ADD COLUMN `ExtraCashbackPercentage` decimal(5,2) DEFAULT 0.00 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'MembershipPlans' AND column_name = 'ExtraCashbackPercentage');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `MembershipPlans` ADD COLUMN `ExclusiveCoupons` tinyint(1) DEFAULT 0 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'MembershipPlans' AND column_name = 'ExclusiveCoupons');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `MembershipPlans` ADD COLUMN `PriorityCustomer` tinyint(1) DEFAULT 0 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'MembershipPlans' AND column_name = 'PriorityCustomer');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderETAAdjustments` ADD COLUMN `PreviousETA` datetime NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderETAAdjustments' AND column_name = 'PreviousETA');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderETAAdjustments` ADD COLUMN `NewETA` datetime NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderETAAdjustments' AND column_name = 'NewETA');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderETAAdjustments` ADD COLUMN `AdjustmentMinutes` int NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderETAAdjustments' AND column_name = 'AdjustmentMinutes');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderETAAdjustments` ADD COLUMN `Reason` text NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderETAAdjustments' AND column_name = 'Reason');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderETAAdjustments` ADD COLUMN `AdminID` int NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderETAAdjustments' AND column_name = 'AdminID');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderItems` ADD COLUMN `metrictype` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderItems' AND column_name = 'metrictype');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderItems` ADD COLUMN `metricvalue` decimal(6,3) DEFAULT 0.000 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderItems' AND column_name = 'metricvalue');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderItems` ADD COLUMN `ProductName` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderItems' AND column_name = 'ProductName');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderItems` ADD COLUMN `ImageUrl` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderItems' AND column_name = 'ImageUrl');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderItems` ADD COLUMN `Type` int NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderItems' AND column_name = 'Type');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `OrderItems` ADD COLUMN `KitItems` json NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'OrderItems' AND column_name = 'KitItems');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `City` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'City');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `CartID` int NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'CartID');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `PromoCode` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'PromoCode');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `TaxAmount` decimal(10,2) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'TaxAmount');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `PromoAmount` decimal(10,2) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'PromoAmount');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `DeliverCharges` decimal(10,2) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'DeliverCharges');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `FlatNo` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'FlatNo');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `LandMark` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'LandMark');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `PaymentTransactionID` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'PaymentTransactionID');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `RazorpayOrderID` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'RazorpayOrderID');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `Discount` decimal(10,2) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'Discount');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `DeliveryInstructions` json NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'DeliveryInstructions');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `OTP` varchar(45) DEFAULT ''NA''', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'OTP');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `OrderType` varchar(45) DEFAULT ''Delivery'' NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'OrderType');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `InvoiceFile` varchar(300) DEFAULT ''NA''', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'InvoiceFile');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `TipAmount` float DEFAULT 0', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'TipAmount');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Orders` ADD COLUMN `TotalItemQuantity` int DEFAULT 0', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Orders' AND column_name = 'TotalItemQuantity');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `ProductVariants` ADD COLUMN `ExpiryDate` date NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ProductVariants' AND column_name = 'ExpiryDate');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `ProductVariants` ADD COLUMN `Buy2Price` decimal(10,2) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ProductVariants' AND column_name = 'Buy2Price');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `PromoCodes` ADD COLUMN `Description` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'PromoCodes' AND column_name = 'Description');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `PromoCodes` ADD COLUMN `Type` tinyint(1) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'PromoCodes' AND column_name = 'Type');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `PromoCodes` ADD COLUMN `OfferValue` decimal(10,2) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'PromoCodes' AND column_name = 'OfferValue');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `PromoCodes` ADD COLUMN `MinOrderValue` double DEFAULT 100 NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'PromoCodes' AND column_name = 'MinOrderValue');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `PromoCodes` ADD COLUMN `Is_Secret` tinyint(1) DEFAULT 0', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'PromoCodes' AND column_name = 'Is_Secret');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `RecommendedProducts` ADD COLUMN `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL on update CURRENT_TIMESTAMP', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'RecommendedProducts' AND column_name = 'UpdatedAt');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Routes` ADD COLUMN `OrderIDs` json NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Routes' AND column_name = 'OrderIDs');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Routes` ADD COLUMN `Name` varchar(255) DEFAULT ''NA''', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Routes' AND column_name = 'Name');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Routes` ADD COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Routes' AND column_name = 'updated_at');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `SubCategories` ADD COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'SubCategories' AND column_name = 'created_at');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Users` ADD COLUMN `FCMToken` varchar(255) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Users' AND column_name = 'FCMToken');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Users` ADD COLUMN `OTP` varchar(45) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Users' AND column_name = 'OTP');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Users` ADD COLUMN `profilePic` varchar(45) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Users' AND column_name = 'profilePic');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Users` ADD COLUMN `ReferredBy` varchar(45) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Users' AND column_name = 'ReferredBy');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Users` ADD COLUMN `MyReferralCode` varchar(45) DEFAULT ''NA'' NOT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Users' AND column_name = 'MyReferralCode');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Users` ADD COLUMN `NotificationLastSeen` datetime NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Users' AND column_name = 'NotificationLastSeen');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Users` ADD COLUMN `UserStatsu` int DEFAULT 0', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Users' AND column_name = 'UserStatsu');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Warehouses` ADD COLUMN `Address` text NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Warehouses' AND column_name = 'Address');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Warehouses` ADD COLUMN `City` varchar(100) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Warehouses' AND column_name = 'City');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Warehouses` ADD COLUMN `Pincode` varchar(20) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Warehouses' AND column_name = 'Pincode');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Warehouses` ADD COLUMN `ContactPerson` varchar(100) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Warehouses' AND column_name = 'ContactPerson');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `Warehouses` ADD COLUMN `ContactNumber` varchar(20) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Warehouses' AND column_name = 'ContactNumber');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `membership_product_prices` ADD COLUMN `PlanID` int NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'membership_product_prices' AND column_name = 'PlanID');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `membership_product_prices` ADD COLUMN `VariantID` int NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'membership_product_prices' AND column_name = 'VariantID');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `membership_product_prices` ADD COLUMN `Status` tinyint DEFAULT 1', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'membership_product_prices' AND column_name = 'Status');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `membership_product_prices` ADD COLUMN `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'membership_product_prices' AND column_name = 'CreatedAt');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `order_adjustments` ADD COLUMN `PreviousAmount` decimal(10,2) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_adjustments' AND column_name = 'PreviousAmount');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `order_adjustments` ADD COLUMN `NewAmount` decimal(10,2) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_adjustments' AND column_name = 'NewAmount');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `order_adjustments` ADD COLUMN `DifferenceAmount` decimal(10,2) NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_adjustments' AND column_name = 'DifferenceAmount');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `order_adjustments` ADD COLUMN `AdjustmentType` varchar(50) DEFAULT ''manual''', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_adjustments' AND column_name = 'AdjustmentType');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `order_adjustments` ADD COLUMN `Reason` text NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_adjustments' AND column_name = 'Reason');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `order_adjustments` ADD COLUMN `AdminID` int NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_adjustments' AND column_name = 'AdminID');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `order_adjustments` ADD COLUMN `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_adjustments' AND column_name = 'UpdatedAt');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Production keys Settings by `ID` (code uses WHERE ID=?); older local schemas used `SettingID`.
SET @s = (SELECT IF(SUM(column_name = 'SettingID') = 1 AND SUM(column_name = 'ID') = 0, 'ALTER TABLE `Settings` RENAME COLUMN `SettingID` TO `ID`', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Settings');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Local-only column (production PromoCodes uses OfferValue). Give it a default so
-- inserts written against the production schema (e.g. win-back coupons) succeed.
SET @s = (SELECT IF(COUNT(*) = 1, 'ALTER TABLE `PromoCodes` MODIFY COLUMN `DiscountValue` decimal(10,2) NOT NULL DEFAULT 0', 'SELECT 1') FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'PromoCodes' AND column_name = 'DiscountValue');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
