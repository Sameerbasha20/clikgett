# 07 — Database Audit

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

All queries were read-only `SELECT` statements against `information_schema` and the data of the **local** database `clikgett-dev` (Docker MySQL 8). Row counts are InnoDB estimates where noted. Values that could identify customers are not reproduced.

**Production comparison: BLOCKED.** The production RDS is reachable only from the AWS server, and reading it needs your approval for SSH access. The local schema is the target schema for the new backend; production still runs the old code (see `10_DOCKER_INFRASTRUCTURE_AUDIT.md`).

## 1. Schema summary

| Item | Count |
|---|---|
| Tables (InnoDB) | 91 |
| Views | 0 |
| Columns | 1,038 |
| Indexes | 198 |
| Foreign keys | 21 |
| Tables without a primary key | 0 |

Tables and approximate row counts:

`AbandonedCartLogs (647), Address (1492), AdminAuthAuditLogs (166), AdminShopToggleSettings (1), AdminUsers (21), AuthRefreshTokens (191), AvailabilityForms (0), Banners (5), CallBackForms (0), Cart (0), CartItems (5803), Carts (1849), CashbackPending (0), Categories (25), CustomerEnquiries (5), CustomerRequests (0), CustomerRewardSettings (0), DeliveryBoyLocationLogs (434), DeliveryBoyLocations (2), DeliveryBoyShifts (9), DeliveryETARules (0), DriverLocationPings (0), Feedback (7), FranchiseEnquiryForms (0), HomeSectionCategories (35), HomeSectionProducts (0), HomeSectionSubcategories (0), HomepageSections (10), KitItems (0), Kits (0), LoginOtps (2), MembershipPlans (2), NotifyProducts (6), OrderDelays (6), OrderETAAdjustments (9), OrderIssues (1), OrderItems (4508), OrderPayments (242), OrderStatusTimeline (225), OrderTimings (9), Orders (961), PhotoOrderItems (10), PhotoOrderRequests (17), PhotoOrderStatusTimeline (53), PhotoOrders (0), PrintJobs (37), ProductNotify (0), ProductPriceCompare (0), ProductRequests (7), ProductVariants (1234), Products (1050), PromoCodes (30), RecommendedProducts (63), ReferralAuditLogs (4), ReferralClaims (0), ReferralConfigurations (0), RewardMilestones (0), Rewards (0), Routes (0), SaleItems (1), Sales (3), SearchLogs (130), Settings (20), SubCategories (87), UserMemberships (0), UserNotifications (373028), UserRewards (0), Users (1930), Wallets (441), Warehouses (7), WelcomeOffer (1), abandoned_carts (0), buy_more_config (7), cart_offers (0), cashback_rules (0), cashback_transactions (0), customer_milestones (0), membership_product_prices (0), memberships (0), milestone_rewards (0), notification_media (0), order_adjustments (96), order_item_removals (2), order_timeline (0), product_restrictions (4), product_unlocks (3), sale_products (0), sales (0), scheduled_orders (0), wallet_expiry (0), wallet_transactions (0)`

Full column, type and default details can be regenerated with `Backend/scripts/checks/describe_all.js` (read-only).

## 2. Relationships

Foreign keys present (21):

| Child | Parent(s) |
|---|---|
| Address | Users |
| CartItems | Carts |
| OrderItems | Orders |
| SubCategories | Categories |
| ProductVariants | Products |
| membership_product_prices | memberships, Products |
| sale_products | sales, Products |
| order_timeline | Orders |
| order_adjustments | Orders |
| notification_media | UserNotifications |
| scheduled_orders | Users, Orders |
| wallet_expiry | Users |
| wallet_transactions | Users |
| abandoned_carts | Users |
| cashback_transactions | Users, Orders, cashback_rules |
| customer_milestones | Users |

**Missing foreign keys** on core relationships, where integrity is enforced only in code:
- `Orders.UserID → Users`;
- `Orders.DeliveryBoyID → AdminUsers`;
- `Products.CategoryID/SubCategoryID`;
- `Carts.UserID`;
- `Wallets.UserID`;
- `OrderStatusTimeline.OrderID`;
- `PhotoOrder*`;
- `HomeSection*`;
- `ProductPriceCompare.ProductID`.

Several of the tables that do have FKs (`sale_products`, `order_timeline`, `wallet_transactions`, `scheduled_orders`, `cashback_transactions`) are **unused** by the code (§4). The tables the code actually uses mostly have none.

## 3. Data integrity checks

| Check | Result | Severity |
|---|---|---|
| OrderItems without an Order | 0 | — |
| Orders whose user no longer exists | **5** | Medium (no FK) |
| Orders assigned to a non-existent rider | 0 | — |
| ProductVariants whose product no longer exists | **18** | Low-medium |
| Products without a valid Category or SubCategory | 0 / 0 | — |
| CartItems without a Cart (despite the FK) | **93** | Low (rows predate the FK or were inserted with checks off) |
| Address without a User | 0 | — |
| OrderItems whose product no longer exists | **2** | Low (history keeps name and price) |
| Duplicate mobile numbers in Users | 0 (`Users.MobileNumber` has a unique index) | — |
| Negative stock / negative wallet balances | 0 / 0 | — |
| Active products with no active variant | **7** | Low (invisible products) |
| Wallet balance ≠ ledger (`GET /api/admin-wallet-check?days=3650`) | **9 users mismatched**, `Healthy=false` | **High for finance**: the balance in `Users.WalletAmount` doesn't match the `Wallets` ledger |
| Money in floating-point columns | `Wallets.Amount`, `Orders.TipAmount`, `AdminShopToggleSettings.PricePerKm` are FLOAT/DOUBLE | Medium: rounding drift on ledger sums |
| Case-duplicate tables | `Sales` and `sales` both exist (on Linux MySQL these are different tables) | Low: confusing; `sales` is unused |
| Unbounded growth | `UserNotifications` ≈ 373,000 rows locally | Medium: needs a retention/cleanup job and an index review |

## 4. Tables not used by any runtime code (19)

`AvailabilityForms, CallBackForms, DriverLocationPings, FranchiseEnquiryForms, ProductNotify, RewardMilestones, Warehouses (7 rows), abandoned_carts, cashback_rules, cashback_transactions, customer_milestones, memberships, milestone_rewards, notification_media, order_timeline, sale_products, scheduled_orders, wallet_expiry, wallet_transactions`.

Method: no reference in `controllers/`, `services/`, `utils/`, `routes/` or `server.js`; migrations excluded. They look like earlier designs replaced by `AbandonedCartLogs`, `CashbackPending`, `Sales`/`SaleItems`, `OrderStatusTimeline`, `Wallets`, `MembershipPlans`/`UserMemberships`. Archive them, then drop them.

## 5. Indexes on hot columns

| Column | Index | Used by |
|---|---|---|
| Orders.UserID | ✔ | customer order lists, welcome offer |
| Orders.DeliveryBoyID | ✔ | rider lists |
| **Orders.OrderStatus** | ✘ | every admin list and dashboard filter |
| **Orders.CreatedAt** | ✘ | sorting, date filters, dashboards |
| OrderItems.OrderID | ✔ | |
| **OrderItems.ProductID** | ✘ | "previously bought", bestsellers, similar products |
| CartItems.CartID, Carts.UserID | ✔ | |
| ProductVariants.ProductID, Products.CategoryID, Products.SubCategoryID | ✔ | |
| **Products.Status** | ✘ | every customer product query (low cardinality; better as part of a composite) |
| **Wallets.UserID** | ✘ | wallet history, wallet check |
| **SearchLogs.UserID** | ✘ | search history |
| Users.MobileNumber | ✔ unique | login |
| UserNotifications.UserID, OrderStatusTimeline.OrderID, Address.UserID | ✔ | |

## 6. SQL review

| Pattern | Finding |
|---|---|
| Injection | No injectable path found:<br>• most queries use `?` placeholders or `pool.escape()`;<br>• dynamic `ORDER BY` uses allow-lists (`AdminOrders.js:62-70`, `AdminHomeSections.js:118-124`, `Products.js:95-106`);<br>• `LIMIT` values are `parseInt`-ed;<br>• the 13 places that paste `req.UserID` into SQL use the ID from the verified token (an integer from the database). |
| Unsafe string SQL | `controllers/Users.js:308` pastes JSON into a quoted SQL string (`updateproducts`, see 03 §4.1). |
| N+1 queries | Product lists load variants in one batched query (`CommonController.getvariantsForProducts`, `CommonController.js:633-646`). Kits (`kitsanditems`) and the old `getproductvariants` still query per row; they're used only by legacy endpoints. |
| Transactions / race conditions | Order placement claims the cart with a conditional `UPDATE … WHERE isOrderLinked = 1` (one request wins). Payments are consumed once (`consumePayment`). Rider assignment is safe under concurrent calls (suite Test 20). Welcome-offer step counting has no lock: two simultaneous orders could both get step 1 (low impact). |
| Ownership checks | Customer order reads filter by `UserID = req.UserID` (`Orders.js:109`). Rider order detail checks assignment (403). |
| Aggregation | Wallet ledger vs balance mismatch (§3) shows that some write path updates `Users.WalletAmount` without a matching `Wallets` row, or the reverse. Not traced to a specific path in this audit. |
