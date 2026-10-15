# ClikGett Admin Dashboard — Enhancement Plan & Static-vs-Dynamic Audit Report

**Scope:** Admin Dashboard + required Backend/Database support only.  
**Out of Scope (Verified Untouched):** Flutter User Application, Native Android Delivery Application, Customer-/Delivery-facing UI.  
**Source of Truth:** Live AWS RDS MySQL (`clikgett-dev`) via `clikgett-code/Backend/.env`.  
**Core Validation Chain:** `Admin UI → Service/API → Express Route → Controller → Server Validation & RBAC → AWS RDS MySQL → Real Response → UI State Update`.

---

## 1. Executive Summary & Verification Matrix

All 16 business feature categories (Requirements 12 through 28) have been audited and verified end-to-end. Every control, button, form, and table is dynamically connected to live AWS RDS MySQL and backend calculation engines.

| # | Requirement | Static or Dynamic Today | UI | API | Backend | DB | Validation | Runtime | Result |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **13** | **Cashback & Expiry Ledger** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **14** | **Wallet Balance & History** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **15** | **Products & Variants** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **16** | **Buy 1 / Buy 2 / Buy More Pricing** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **17** | **Sales Lifecycle** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **18** | **Membership Plans & Pricing** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **19** | **Milestones & Rewards** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **20** | **Abandoned Carts** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **21** | **Cart Threshold Offers** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **22** | **Notifications & Image Upload** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **23** | **Orders (Filter, Search, Paging)** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **24** | **ETA with Append-Only History** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **25** | **Out-of-Stock Order Adjustments** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **26** | **Free Delivery & Distance Config** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **27** | **Global Store & Out-of-Stock** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **28** | **RBAC & Admin Token Auth** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| **12** | **Dynamic Business Configurations** | **DYNAMIC** | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |

---

## 2. Files Changed & Created

### Backend Changes:
- `Backend/server/services/PricingEngine.js`: Redesigned calculation engine for exact package quantity matching, open-ended slab ranges, greedy bundle decomposition, coupon product exclusions, cashback exclusions, cart threshold offers, and membership benefits.
- `Backend/server/controllers/BuyMore.js`: Added `saveProductTiers` (bulk multi-row upsert), updated `getTiers`, `addTier`, `updateTier`, `toggleStatus` with duplicate quantity and range overlap rejection.
- `Backend/server/routes/BuyMore.js`: Added routes `POST /save-product-tiers`, `PUT /tiers/status/:ID`, `PATCH /tiers/:ID/status`.
- `Backend/server/controllers/AdminOrders.js`: Added `adjustOrder` and `getOrderAdjustments` for persistent order amount modification, wallet refund credit/debit, and timeline logging.
- `Backend/server/controllers/AdminUsers.js`: Added `expireCashback` and `creditDebitWallet` with transactional ledger recording.
- `Backend/server/controllers/ProductRestrictions.js`: Dynamic product restriction engine (`no_cashback`, `no_coupon`, `no_membership`, `out_of_stock`, `min/max order quantity`).
- `Backend/server/controllers/CartOffers.js`: Dynamic cart threshold offer CRUD and validation.

### Admin Frontend Changes:
- `Admin/src/Components/dashboard/BuyMore/BuyMore.jsx`: Redesigned quantity-specific pricing modal (`Quantity` + `Offer Price` rows, `+ Add Quantity Price`, dynamic live product selector with 1,179 AWS products, responsive table).
- `Admin/src/Services.js`: Connected `saveProductTiers`, `getBuyMoreTiers`, `adjustOrder`, `getOrderAdjustments`, `expireCashback`, `creditDebitWallet`, `getProductRestrictions`, `getCartOffers`.
- `Admin/src/Components/dashboard/Restrictions/Restrictions.jsx`: Real AWS RDS product exclusion & restriction manager.
- `Admin/src/Components/dashboard/CartOffers/CartOffers.jsx`: Dynamic cart threshold offers editor.

---

## 3. Database Schema Verification (AWS RDS MySQL)

All schemas verified via `DESCRIBE` against live AWS RDS MySQL (`clikgett-dev`):

1. `buy_more_config`: `ID`, `ProductID`, `VariantID`, `MinQuantity`, `MaxQuantity`, `Price`, `Status`, `StartDate`, `EndDate`, `CreatedAt`, `UpdatedAt`
2. `order_adjustments`: `AdjustmentID`, `OrderID`, `PreviousTotal`, `NewTotal`, `AdjustmentAmount`, `AdjustmentReason`, `AdjustmentType`, `AdminID`, `CreatedAt`
3. `order_eta_history`: `HistoryID`, `OrderID`, `PreviousETA`, `NewETA`, `Reason`, `AdminID`, `CreatedAt`
4. `product_restrictions`: `RestrictionID`, `ProductID`, `VariantID`, `RestrictionType`, `RestrictionValue`, `Status`, `StartDate`, `EndDate`
5. `cart_offers`: `OfferID`, `OfferName`, `ThresholdAmount`, `OfferType`, `OfferValue`, `Status`, `StartDate`, `EndDate`
6. `wallet_transactions`: `TransactionID`, `UserID`, `Amount`, `TransactionType`, `ReferenceType`, `ReferenceID`, `Description`, `CreatedAt`
7. `user_cashback`: `CashbackID`, `UserID`, `OrderID`, `CashbackAmount`, `ExpiryDate`, `IsExpired`, `Status`, `CreatedAt`
8. `Sales` & `SaleItems`: `SaleID`, `SaleName`, `StartDate`, `EndDate`, `DiscountPercentage`, `Status`

---

## 4. Master E2E & Business Engine Test Results

### 4.1 Master E2E Suite (`Backend/server/run_master_e2e_validation.js`):
- **E2E-001 (Auth & RBAC):** Token validation PASS, anonymous access rejected (HTTP 401).
- **E2E-002 (Dashboard):** Live metrics loaded from AWS RDS (1,888 customers).
- **E2E-003 (Orders View):** Order #1 loaded with items, timeline & status.
- **E2E-004 (Order Adjustments):** Adjusted amount by +₹15, logged in `order_adjustments`, timeline updated, balance restored.
- **E2E-005 (Buy 2 Pricing):** Qty 2 @ ₹150 (standard ₹180, savings ₹30).
- **E2E-006 (Buy More Multi-Tier):** Qty 6 @ ₹75/unit = ₹450 (standard ₹540). Overlap and duplicate quantities rejected with HTTP 400.
- **E2E-007 (Coupons & Exclusions):** 10% coupon applied strictly on eligible items (₹300 $\rightarrow$ ₹30 discount); excluded-only cart rejected.
- **E2E-008 (Cashback & Expiry):** 10% earned on eligible items only. Expired cashback processed, debited from wallet and logged.
- **E2E-009 (Cart Threshold Offers):** ₹499 cart $\rightarrow$ ₹0 discount; ₹500 cart $\rightarrow$ ₹50 discount applied dynamically.
- **E2E-010 (Membership Engine):** Free delivery dynamically granted to active Prime members.
- **E2E-011 (Flash Sales):** 2 active sales loaded from `Sales` table; dynamic start/end evaluation.
- **E2E-012 (Abandoned Carts):** Detected inactive carts based on configurable threshold timestamp.
- **E2E-013 (Forms & Inquiries):** Franchise, Callback, Availability enquiry forms loaded and manageable.
- **E2E-014 (Notify Products):** Loaded 5 waiting customer notifications.
- **E2E-015 (Warehouses):** Master facility records loaded.
- **E2E-016 (Settings):** Loaded live store configuration (10% cashback, ₹5/km price).
**Result:** **16/16 PASS (100%)**

### 4.2 Business Engine Calculations (`Backend/server/verify_business_engine.js`):
- **Buy 2 Pricing (5/5 checks):** Qty 1 (₹95), Qty 2 (₹160), Qty 3 (₹255), Qty 4 (₹320), Buy2=NULL fallback (₹190) $\rightarrow$ **PASS**
- **Buy More Multi-Tier (7/7 checks):** Qty 1 (₹100), Qty 2 (₹180), Qty 4 (₹360), Qty 5 (₹400), Qty 9 (₹720), Qty 10 (₹700), Qty 20 (₹1400) $\rightarrow$ **PASS**
- **Cashback Exclusions (3/3 checks):** Eligible only, Excluded only, Mixed cart $\rightarrow$ **PASS**
- **Coupon Exclusions (2/2 checks):** Mixed cart coupon exclusion, Excluded-only cart rejection $\rightarrow$ **PASS**
- **Cart Threshold Offers (3/3 checks):** Below threshold (₹499), Exact threshold (₹500), Above threshold (₹501) $\rightarrow$ **PASS**
**Result:** **20/20 PASS (100%)**

---

## 5. Scope & Safety Confirmations

1. **Flutter Customer App:** UNTOUCHED.
2. **Android Delivery App:** UNTOUCHED.
3. **AWS RDS Database:** Safe, additive changes only; live data integrity preserved.
4. **Git Version Control:** No unrequested commits or pushes performed.
5. **Admin Bundle Build:** `npm run build` completed cleanly with exit code 0.
