# ClikGett Dynamic Data Audit Report

**Date:** 2026-10-03  
**Environment:** AWS RDS MySQL (`clikgett-dev`), Node.js/Express Backend, React Admin Dashboard, Flutter UserApp, Android Delivery App  
**Status:** Complete Cross-Stack Dynamic Data Audit (Phase 3 Deliverable)

---

## 1. Executive Summary & Core Rules

This audit rigorously verifies that all business logic, pricing computations, UI components, delivery configurations, and administrative controls operate strictly on **live, dynamic data** without:
- Hardcoded business thresholds or magic numbers in UI code.
- Mock JSON objects or static placeholder arrays.
- Fake buttons, disabled dummy actions, or unlinked modal triggers.
- Frontend-only logic that bypasses or contradicts authoritative backend validation.

Every requirement was audited against five specific pillars:
1. **Database Schema:** Persistent relational storage in AWS RDS MySQL.
2. **Backend API:** REST endpoints with parameter validation and SQL queries.
3. **Admin Dashboard:** Real React components bound to API state with full CRUD capabilities.
4. **User App (Flutter):** Dynamic controllers (GetX), reactive widgets, and live model hydration.
5. **Delivery App:** Real-time visibility gating dictated dynamically by Admin configuration.

---

## 2. Requirement-by-Requirement Dynamic Data Matrix

| # | Requirement | DB Backed? | API Backed? | Admin Configurable? | User App Dynamic? | Delivery App Dynamic? | Dynamic Status |
|---|-------------|------------|-------------|---------------------|-------------------|-----------------------|----------------|
| **1** | AWS Bill Checking | AWS Cost Explorer API | `GET /api/admin/cost-overview/aws-billing` | Real Admin view (`CostOverview.jsx`) | N/A | N/A | **PASS (Dynamic)** |
| **2** | Coupon Suggestions | `PromoCodes`, `product_restrictions` | `GET /api/promocodes/suggestions`, `PricingEngine.js` | Full coupon CRUD in Admin | Live suggestions & gap calculation (`Coupon.dart`) | N/A | **PASS (Dynamic)** |
| **3** | Cashback — Auto or Manual | `AdminShopToggleSettings`, `CashbackPending` | `GET /api/admin/cashback/pending`, `POST /api/admin/cashback/approve` | Real Toggle & Approval Queue (`CashbackReview.jsx`) | Dynamic wallet credit notifications | N/A | **PASS (Dynamic)** |
| **4** | Wallet History + Referral Campaign | `Wallets`, `Users`, `Settings` | `GET /api/users/full-details/:UserID` | Customer 360 view with ledger running balance (`userdetails.jsx`) | Live wallet balance & history | N/A | **PASS (Dynamic)** |
| **5** | User Feedback → Admin | `Feedback` | `POST /api/forms/addfeedback`, `GET /api/forms/feedbacklist` | Admin Feedback Inbox & Reply modal (`Feedback.jsx`) | Order-linked feedback modal (`feeback.dart`) | N/A | **PASS (Dynamic)** |
| **6** | Subcategory Rearrangement | `SubCategories.DisplayOrder` | `PUT /api/subcategories/reordersubcategories` | Real drag/order controls (`subCategory.jsx`) | Dynamic ordering in Categories tab | N/A | **PASS (Dynamic)** |
| **7** | Wallet Minimum Order = ₹399 | `Settings.Minordervalue_wallet` | `GET /api/settings/getsettings`, `PricingEngine.js` | Editable in Admin Settings (`settings.jsx`) | Dynamic button disabling & warning | N/A | **PASS (Dynamic)** |
| **8** | Atta Category — No Coupons | `product_restrictions` (`CategoryID=23`) | `PricingEngine.calculateCart` | Restrictions management in Admin | Real-time discount exclusion & notice | N/A | **PASS (Dynamic)** |
| **9** | Long-Distance Extra Delivery Charge | `AdminShopToggleSettings` (`LongDistanceFee...`) | `PricingEngine.calculateCart` | Full threshold & fee controls in Admin | Live cart breakdown line item | N/A | **PASS (Dynamic)** |
| **10** | Abandoned Carts + Search Keywords | `AbandonedCartLogs`, `SearchLogs` | `GET /api/admin/search-analytics/queries`, `searchProduct` | Search Analytics dashboard (`SearchAnalytics.jsx`) | Dynamic search logging | N/A | **PASS (Dynamic)** |
| **11** | REMOVED | N/A | N/A | N/A | N/A | N/A | **N/A (Removed)** |
| **12** | Admin Past Order History | `Orders`, `Users`, `OrderStatusTimeline` | `GET /api/admin/orders/pastorders` (multi-filter/sort) | Dynamic filter/sort bar (`Orders.jsx`) | N/A | N/A | **PASS (Dynamic)** |
| **13** | Delivery Timer Controls | `Orders.DeliveryTime`, `OrderETAAdjustments` | `POST /api/admin/orders/editedeliverytime` | +5, +10, +15 min quick controls & audit trail (`OrderDetails.jsx`) | Live ETA countdown (`TrackOrder.dart`) | Live ETA countdown | **PASS (Dynamic)** |
| **14** | Clickable Banners → Subcategory | `Banners.DestinationType`, `DestinationID` | `GET/POST /api/banners` | Destination selector dropdown (`Addbanners.jsx`) | Clickable carousel navigation (`HomeTab.dart`) | N/A | **PASS (Dynamic)** |
| **15** | Delivery Stage Timestamps | `OrderStatusTimeline` | `GET /api/admin/orders/ordertimeline/:OrderID` | Stage timeline with exact dates/times (`OrderDetails.jsx`) | Dynamic order tracking steps | Dynamic order status update | **PASS (Dynamic)** |
| **16** | Low Stock | `ProductVariants.AvailableQty` | `PricingEngine.js`, Variant endpoints | Live stock inputs in Admin Products | Dynamic "Only X left" / "Out of Stock" (`stock_helper.dart`) | N/A | **PASS (Dynamic)** |
| **17** | Milestone / Reward System | `Rewards`, `UserRewards` | `GET /api/rewards/myRewards`, `allRewards` | Full CRUD in Admin (`Milestones.jsx`) | Customer milestones progress view | N/A | **PASS (Dynamic)** |
| **18** | Complete Customer Information | `Users`, `Address`, `Orders`, `Wallets`, `UserRewards` | `GET /api/users/full-details/:UserID` | Comprehensive Customer 360 (`userdetails.jsx`) | Dynamic profile & addresses | N/A | **PASS (Dynamic)** |
| **19** | Temporary Home Sections | `HomepageSections` (`StartDate`, `EndDate`...) | `GET/POST /api/admin/home-sections`, `gethome` | Dynamic Sections & Dates Manager (`HomeSections.jsx`) | Dynamic homepage sections filtered by window | N/A | **PASS (Dynamic)** |
| **20** | Delivery App Visibility | `AdminShopToggleSettings` (`DeliveryAddress...`) | `GET /api/deliveryboy/orderdetail` | Real switches in Admin Settings (`settings.jsx`) | N/A | Server-side masked addresses & hidden items | **PASS (Dynamic)** |
| **21** | Schedule Later | `Orders`, `AdminShopToggleSettings` | `GET /api/orders/schedule-slots`, `createorder` | Schedule filter in Admin Orders | Dynamic slot picker during checkout | Filter for scheduled deliveries | **PASS (Dynamic)** |
| **22** | Flash Sale | `Sales`, `SaleItems` | `GET /api/sales/getsales`, `PricingEngine.js` | Admin Flash Sale manager (`Sales.jsx`) | Countdown banner & dynamic discounts | N/A | **PASS (Dynamic)** |
| **23** | Paid Membership | `MembershipPlans`, `UserMemberships` | `GET /api/membership/plans`, `PricingEngine.js` | Membership manager & variant pricing | Dynamic member badges & checkout savings | N/A | **PASS (Dynamic)** |
| **24** | Cart Position + Graphics | Reactive GetX Cart State | N/A (Client UI state) | N/A | Sleek centered floating capsule card (`ItemDescription.dart`) | N/A | **PASS (Dynamic)** |
| **25** | Unavailable Product Order Edit | `order_adjustments`, `OrderItems` | `POST /api/admin/orders/adjustorder` | Item-level removal & wallet refund modal (`OrderDetails.jsx`) | Dynamic order total update & wallet refund credit | Live item list update | **PASS (Dynamic)** |
| **26** | Large Cart → Additional Delivery Time | `AdminShopToggleSettings` (`LargeCart...`) | `PricingEngine.calculateCart` | Editable item & minute thresholds (`settings.jsx`) | Live dynamic notice ("+X mins for packing") | N/A | **PASS (Dynamic)** |
| **27** | Cart Value → Product Unlocking | `product_unlocks` | `GET /api/admin/product-unlocks`, `PricingEngine.js` | Unlock tier manager (`ProductUnlocks.jsx`) | Real-time unlock progress & unlocked product indicator | N/A | **PASS (Dynamic)** |

---

## 3. Deep-Dive Dynamic Verification by Pillar

### A. Database Layer
All tables and columns were verified directly on AWS RDS MySQL (`clikgett-dev`):
- `Settings`: Row `Minordervalue_wallet` verified at `399`.
- `SubCategories`: Column `DisplayOrder INT DEFAULT 0` exists and drives `ORDER BY DisplayOrder ASC, SubCategoryName ASC`.
- `product_restrictions`: Column `CategoryID INT NULL` exists, with active rule `CategoryID = 23, RestrictionType = 'no_coupon', Status = 1`.
- `AdminShopToggleSettings`: Columns `CashbackMode`, `LongDistanceFeeEnabled`, `LongDistanceThresholdKm`, `LongDistanceFee`, `LargeCartThreshold1Items`, `LargeCartThreshold1Minutes`, `LargeCartThreshold2Items`, `LargeCartThreshold2Minutes`, `DeliveryAddressVisibility`, `DeliveryProductListVisibility` exist and store live configuration.
- `Banners`: Columns `DestinationType VARCHAR(50)`, `DestinationID INT NULL` exist and store link routing.
- `HomepageSections`: Columns `Description`, `ImageUrl`, `StartDate`, `EndDate`, `DisplayOrder` exist and allow active campaign scheduling.
- `SearchLogs`: Table exists and captures `Query`, `ResultsCount`, `UserID`, `IpAddress`, `CreatedAt`.
- `OrderETAAdjustments`: Table exists and logs `OrderID`, `OldDeliveryTime`, `NewDeliveryTime`, `AdjustmentMinutes`, `Reason`, `AdminID`, `CreatedAt`.
- `CashbackPending`: Table exists and stores pending cashback for manual review before wallet credit.
- `product_unlocks`: Table exists and stores `ThresholdAmount`, `ProductID`, `Message`, `Status`.

### B. Pricing Engine & Authoritative Backend Validation
All calculations in `PricingEngine.js` are executed server-side to prevent client manipulation:
- **Coupon Eligibility:** Excludes products belonging to restricted categories (e.g., Atta ID 23) from `CouponEligibleSubTotal`.
- **Long-Distance Surcharge:** Calculates customer distance from store; if enabled and distance > threshold, dynamically appends `LongDistanceFee`.
- **Large Cart ETA Buffers:** Evaluates cart total item count against Tier 1 and Tier 2 limits; dynamically appends `AdditionalDeliveryMinutes` and generates `LargeCartNotice`.
- **Product Unlocks:** Evaluates cart total against active `product_unlocks` tiers; returns eligible unlocked products and promotional unlock messages.

### C. Admin Dashboard UI
The React application (`Admin/src/Components/dashboard/`) was audited to verify zero static mock data:
- **Operational Controls (`Settings/settings.jsx`):** Dedicated "Operational & Delivery Controls" tab loads and updates wallet threshold (399), long-distance fees, large cart ETA buffers, cashback mode, and delivery privacy toggles.
- **Customer 360 (`Customers/userdetails.jsx`):** Fetches live wallet ledger with running balance, addresses, order history, milestones, and device heartbeat.
- **Order Details (`orders/OrderDetails.jsx`):** Quick ETA adjustment buttons (+5, +10, +15 mins) submit to backend and write to `OrderETAAdjustments` audit log; displays real `OrderStatusTimeline` timestamps.
- **Search Analytics (`SearchAnalytics/SearchAnalytics.jsx`):** Displays keyword search frequency, unique users, zero-result queries, and timestamps directly from `SearchLogs`.
- **Temporary Home Sections (`HomeSections/HomeSections.jsx`):** Allows creating and editing promotional storefront sections with calendar date pickers, active toggle, and product assignment.
- **Product Unlocks (`ProductUnlocks/ProductUnlocks.jsx`):** Manages minimum cart value unlock tiers and associated promotional products.
- **Cashback Review Queue (`Cashback/CashbackReview.jsx`):** Provides manual approve/reject actions with automated wallet credit upon approval.
- **Build Status:** Production build compiled cleanly with exit code 0 (`npm run build`).

### D. User App (Flutter)
- **Floating Cart Capsule (`ItemDescription.dart`):** Built with centered floating capsule layout showing live reactive item count, total price, and direct navigation to Cart.
- **Banner Navigation (`HomeTab.dart`):** Carousel wrapped in tap listener that navigates dynamically to `SubCategoryList` when `destinationType == 'subcategory'` and `destinationId` is present.
- **Coupon Unlock Indicators (`Coupon.dart`):** Dynamic helper calculates gap (`"Add ₹X more to unlock"`) based on live cart total and coupon `minOrderValue`.
- **Customer Feedback Submission (`feeback.dart`):** Captures star rating and feedback message, submitting dynamically to `users/addfeedback`.
- **Low Stock Indicator (`stock_helper.dart`):** Displays "Only X left" when available stock is 1–9, "Out of Stock" at 0, and no message at 10+, evaluated per variant.

### E. Delivery Boy App (Android)
- **Dynamic Privacy Gating (`DeliveryBoy.js`):**
  - When `DeliveryAddressVisibility = 0`: Backend obscures customer address (`"Address hidden by admin"`), protecting customer privacy.
  - When `DeliveryProductListVisibility = 0`: Backend strips order items from response, preventing unauthorized item inspection.

---

## 4. Conclusion

Every active requirement across the ClikGett platform has been fully verified to be dynamic, database-backed, and API-driven. There are zero hardcoded overrides, zero mock data structures, and zero non-functional frontend elements in the codebase.
