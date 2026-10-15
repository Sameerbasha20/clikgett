# CLIKGETT — DATABASE SCHEMA COMPARISON & INTEGRITY REPORT

**Date:** October 14, 2026  
**Source Engine:** MySQL 8.0 (AWS RDS `clikgett-dev` specification)  
**Local Engine:** MySQL 8.0 Community (`clikgett-mysql` container)  
**Status:** **100% REPLICATED & VERIFIED**  

---

## 1. Schema Replication Summary

The local Docker MySQL database replicates all 30 core operational tables discovered across the Express backend controllers, migrations, and test suites.

| Table Name | Primary Key | Key Columns | Casing Compatibility | Foreign Keys & Cascades |
| :--- | :--- | :--- | :---: | :--- |
| **`AdminUsers`** | `AdminID` (INT AI) | EmailID, MobileNumber, Password, Role, DutyStatus, 2FA | PascalCase | Referenced by Orders, Routes, Audits |
| **`Users`** | `UserID` (BIGINT AI) | FirstName, MobileNumber, EmailID, WalletAmount | PascalCase | Referenced by Carts, Orders, Address, Wallets |
| **`Categories`** | `CategoryID` (INT AI) | CategoryName, CategoryImage, Status | PascalCase | Referenced by SubCategories, Products |
| **`SubCategories`** | `SubCategoryID` (INT AI) | CategoryID, SubCategoryName, DisplayOrder, Status | PascalCase | `fk_subcat_category` ON DELETE CASCADE |
| **`Products`** | `ProductID` (BIGINT AI) | ProductName, CategoryID, SubCategoryID, Type, Status | PascalCase | Referenced by Variants, CartItems, OrderItems |
| **`ProductVariants`**| `VariantID` (BIGINT AI) | ProductID, metrictype, Price, OfferPrice, AvailableQty | PascalCase | `fk_variant_product` ON DELETE CASCADE |
| **`Address`** | `AddressID` (BIGINT AI) | UserID, Type, Address, FlatNo, Latitude, Longitude | PascalCase | `fk_address_user` ON DELETE CASCADE |
| **`Carts`** | `CartID` (BIGINT AI) | UserID, Status | PascalCase | Referenced by CartItems |
| **`CartItems`** | `CartItemID` (BIGINT AI) | CartID, ProductID, VariantID, Quantity, Price | PascalCase | `fk_cartitem_cart` ON DELETE CASCADE |
| **`Orders`** | `OrderID` (BIGINT AI) | UserID, OrderNumber, OrderStatus, DeliveryBoyID, FinalAmount | PascalCase | Referenced by OrderItems, Feedback |
| **`OrderItems`** | `OrderItemID` (BIGINT AI) | OrderID, ProductID, VariantID, Quantity, Price | PascalCase | `fk_orderitems_order` ON DELETE CASCADE |
| **`Banners`** | `BannerID` (INT AI) | BannerName, BannerImage, DestinationType, DestinationID | PascalCase | Independent |
| **`PromoCodes`** | `PromoCodeID` (INT AI) | PromoCode, DiscountType, DiscountValue, MinOrderAmount | PascalCase | Independent |
| **`Routes`** | `RouteID` (INT AI) | RouteName, DeliveryBoyID, Status | PascalCase | Referenced by Timing |
| **`Warehouses`** | `WarehouseID` (INT AI) | WarehouseName, Latitude, Longitude, Radius | PascalCase | Independent |
| **`Settings`** | `SettingID` (INT AI) | SettingKey, SettingValue, Status | PascalCase | Independent |
| **`AdminShopToggleSettings`** | `SettingID` (INT AI) | ShopOpen, CashbackMode, DeliveryRadiusKm | PascalCase | Independent |
| **`ProductNotify`** | `NotifyID` (BIGINT AI) | UserID, ProductID, Status | PascalCase | Independent |
| **`CustomerRequests`**| `RequestID` (BIGINT AI) | UserID, Subject, Message, Status, AdminResponse | PascalCase | Independent |
| **`PhotoOrders`** | `PhotoOrderID` (BIGINT AI)| UserID, PhotoUrl, Status, AdminNotes, EstimatedTotal | PascalCase | Referenced by Orders |
| **`DriverLocationPings`** | `PingID` (BIGINT AI) | DriverID, Latitude, Longitude, BatteryLevel | PascalCase | Independent |
| **`Feedback`** | `FeedbackID` (BIGINT AI) | OrderID, UserID, Rating, Comments | PascalCase | Independent |
| **`buy_more_config`** | `ID` (INT AI) | ProductID, VariantID, MinQuantity, MaxQuantity, Price | lowercase | Independent |
| **`product_restrictions`**| `ID` (INT AI) | ProductID, VariantID, CategoryID, RestrictionType | lowercase | Independent |
| **`cart_offers`** | `OfferID` (INT AI) | Title, MinCartValue, DiscountType, DiscountValue | lowercase | Independent |
| **`wallet_transactions`**| `TransactionID` (BIGINT AI)| UserID, Amount, Credited_Debited, ContentType | lowercase | `fk_wallet_user` ON DELETE CASCADE |
| **`cashback_rules`** | `RuleID` (BIGINT AI) | RuleName, CashbackAmount, MinimumOrderValue | lowercase | Referenced by cashback_transactions |
| **`MembershipPlans`** | `PlanID` (INT AI) | PlanName, DurationDays, Price, DiscountPercentage | PascalCase | Independent |
| **`RewardMilestones`**| `MilestoneID` (INT AI) | MilestoneName, TargetPoints, RewardType, RewardValue | PascalCase | Independent |
| **`OrderETAAdjustments`**| `AdjustmentID` (INT AI)| OrderID, OriginalETA, AdjustedETA, AdjustmentReason | PascalCase | Independent |

---

## 2. Table Casing & Compatibility Resolution

In Linux-based environments (including AWS RDS on Linux and Docker on Linux), MySQL table names are case-sensitive by default (`lower_case_table_names=0`).

- **Historical Bug in Codebase:** Controllers previously had mixed queries like `SELECT * FROM Adminusers` (lowercase `u`) while other controllers queried `AdminUsers`.
- **Replication Standard:** The local schema explicitly declares all tables with their canonical casing (`AdminUsers`, `Products`, `ProductVariants`, `Orders`, etc.).
- **Backend Aliasing:** Controllers have been updated to ensure table casing matches the canonical schema definitions.

---

## 3. Synthetic Seed Data Verification

The local MySQL container automatically initializes with synthetic testing entities:

- **Admin User:** `AdminID = 1`, `admin@clikgett.com`, Role = 1 (Super Admin).
- **Driver / Delivery Partner:** `AdminID = 16`, `deliveryboy1@clikgett.com`, Role = 16, DutyStatus = `ONLINE`.
- **Customer User:** `UserID = 1000523`, `9999999999`, WalletBalance = 500.00.
- **Product Entity:** `ProductID = 82` ("Full Cream Fresh Milk 1L"), with Variant 1 (Price 65.00, OfferPrice 60.00, Stock 150).
- **Warehouse Entity:** `WarehouseID = 1` ("Kurnool Central Warehouse", Lat 15.8281, Lng 78.0373, Radius 20km).
- **Address Entity:** `AddressID = 1`, linked to Customer 1000523 in Kurnool.
