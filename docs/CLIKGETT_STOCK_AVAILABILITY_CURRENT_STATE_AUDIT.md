# CLIKGETT CURRENT STATE AUDIT: STOCK, INVENTORY, CART, ORDER & AVAILABILITY SYSTEM

**Audit Date:** October 2026  
**Target Architecture:** Zepto / Blinkit Quick-Commerce Product Experience  
**Status:** READ-ONLY ARCHITECTURAL & CODE AUDIT COMPLETED (Zero database mutations, zero code changes)  

---

## Executive Summary

ClikGett currently operates on a **Single-Store, Global Variant Stock model**. 
Authoritative inventory is tracked solely via `ProductVariants.AvailableQty` in AWS RDS MySQL. 

While core building blocks exist (variant-level quantity, cart stock checks on add, instant deduction on order, customer cancellation restoration, and Admin stock editing), the system in its current state **diverges significantly from quick-commerce standards (Zepto/Blinkit)**:
1. **Overselling Vulnerability:** Checkout (`POST /api/orders/add_order`) does **NOT** validate stock, does not lock rows, and uses a blind non-atomic decrement (`AvailableQty = AvailableQty - Quantity`), allowing concurrent shoppers to drive stock into negative integers.
2. **Purchase Limit Disconnect:** `maxQty` is enforced only in the Flutter UI. The backend cart and order endpoints do not validate `maxQty`, and the database defaults `maxQty` to `0`, creating UI bugs.
3. **No Multi-Warehouse Inventory:** The `Warehouses` module contains only facility master data. There is no warehouse-to-stock mapping. All inventory is global.
4. **No Inventory Reservation:** Scheduled orders deduct stock immediately rather than reserving units, and there is no distinction between physical stock on hand and available-to-promise inventory.
5. **No Inventory Ledger/Audit:** Stock adjustments directly overwrite `AvailableQty` in place without transaction logs, timestamps, or actor tracking.

---

## 1. Current Inventory Architecture

ClikGett's current inventory architecture follows **Option A: Product -> Variant -> Global Stock**.

```
                        ┌────────────────────────┐
                        │        Products        │
                        │  (Catalog Master Only) │
                        └───────────┬────────────┘
                                    │ 1 : N
                                    ▼
                        ┌────────────────────────┐
                        │    ProductVariants     │
                        │  AvailableQty (GLOBAL) │
                        └───────────┬────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────────┐                       ┌─────────────────────────┐
│       Cart System       │                       │      Order System       │
│  Validates AvailableQty │                       │  Deducts AvailableQty   │
│   on addcart (partial)  │                       │   blindly on add_order  │
└─────────────────────────┘                       └─────────────────────────┘
```

- **Stock Level:** Strictly variant-level (`ProductVariants.AvailableQty`).
- **Physical vs Logical Location:** Entire platform assumes a single fulfillment center located at the coordinates in `AdminShopToggleSettings` (`Latitude`, `Longitude`).
- **Storage Layer:** AWS RDS MySQL table `ProductVariants`. No Redis, no in-memory cache, no message queue, no inventory ledger.

---

## 2. Product Stock

- **Storage Location:** Products do **NOT** have stock or quantity columns.
- **Table Inspection ([Products](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Products.js)):**
  - Columns: `ProductID`, `ProductName`, `Description`, `CategoryID`, `SubCategoryID`, `Status`, `Type`, `ImageUrl`, `CreatedAt`, `UpdatedAt`, `ProductImages`, `IsTransfered`.
  - There is no `TotalQty`, `Stock`, or `AvailableQty` on `Products`.
- **Product-Level Availability:** Product availability is controlled via `Products.Status` (`1 = Active`, `2 = Inactive/Disabled`).
  - When `Status = 2`, the product is omitted from catalog queries ([Products.js:L37](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Products.js#L37)).
  - Product-level stock does not exist; it is aggregated on the fly from its variants.

---

## 3. Variant Stock

- **Storage Location:** [`ProductVariants.AvailableQty`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/AdminProducts.js#L351) (`int`, `NOT NULL`).
- **Authoritative Status:** `AvailableQty` is the **only** column in the entire database representing stock on hand.
- **Variant Status:** Controlled via `ProductVariants.status` (`1 = Active`, `2 = Inactive`).
  - In [`CommonController.getproductvariants`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js#L541), only variants where `status = 1` are fetched. Inactive variants are completely hidden from customer queries.
- **Out-of-Stock Variants:**
  - Variants where `status = 1` and `AvailableQty = 0` **are returned** by the backend API.
  - In catalog queries ([Products.js:L39](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Products.js#L39)), SQL sorting moves products with `AvailableQty = 0` to the bottom:
    ```sql
    ORDER BY CASE WHEN pv.AvailableQty = 0 THEN 1 ELSE 0 END,
    CONCAT(p.ProductName, '', pv.AvailableQty) ASC
    ```

---

## 4. Cart Stock Validation

Inspection of [`Backend/server/controllers/Carts.js`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Carts.js):

### When adding a product (`POST /api/carts/addcart`):
- **Backend check exists:** [Carts.js:L235-L239](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Carts.js#L235-L239):
  ```javascript
  getproduct_availablestock = await getproductstock(body.VariantID, body.ProductID);
  if (body.Quantity > getproduct_availablestock) {
      return resp.json({ 'Status': 0, 'Message': 'limited Quantity available, you cant add more than ' + getproduct_availablestock + ' of this item' });
  }
  ```
- If `AvailableQty = 0`, adding is rejected with `"limited Quantity available, you cant add more than 0 of this item"`.

### When increasing quantity:
- The same `addcart` endpoint handles quantity updates. It retrieves `getproduct_availablestock` and verifies that the new requested quantity `<= AvailableQty`.
- If requested quantity exceeds stock, the update is blocked.

### Gaps in Cart Validation:
1. **No Cart Drift Check:** If user adds 5 units when 5 are available, and another user buys them, `POST /api/carts/mycart` (`getcartbyyserid`) calculates prices via `PricingEngine.calculateCart` but **does not check if items are still in stock or notify the customer**.
2. **Missing `maxQty` Backend Check:** `addcart` does **not** check `body.Quantity <= variant.maxQty`. Customers can add quantities far above `maxQty` using direct API calls.

---

## 5. Order Stock Deduction

Inspection of [`Backend/server/controllers/Orders.js`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Orders.js):

### Stock Deduction Flow:
- Endpoint: `POST /api/orders/add_order`
- Stock is deducted **immediately upon order insertion** at line 288:
  ```javascript
  decreasevariantsQuantity = await decvariantsQuantity(body.OrderItems);
  ```
- **Deduction Function ([Orders.js:L565-L584](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Orders.js#L565-L584)):**
  ```javascript
  function decvariantsQuantity(items) {
      return new Promise(function (resolve, reject) {
          for (var j = 0; j < items.length; j++) {
              query = "update ProductVariants set AvailableQty=AvailableQty-" + items[j]['Quantity'] + 
                      " where ProductID=" + items[j]['ProductID'] + " and VariantID=" + items[j]['VariantID'];
              pool.query(query, function (err, results, fields) { ... });
          }
          resolve(1);
      });
  }
  ```

### Critical Findings:
1. **Zero Stock Check at Checkout:** `add_order` has **no stock verification** prior to creating the order. It assumes the Flutter app called `POST /api/carts/validate_cart`.
2. **No Atomic Floor Check:** The SQL query does not contain `WHERE AvailableQty >= Quantity`. If `AvailableQty` is 1 and 3 are ordered, `AvailableQty` becomes `-2`.
3. **Broken Promise / Race Condition:** `resolve(1)` is executed synchronously outside the asynchronous `pool.query` loop callbacks. The route proceeds before database updates complete.
4. **No Database Transaction:** Order insertion, item insertion, stock deduction, and wallet debit are separate queries without `START TRANSACTION` / `COMMIT` / `ROLLBACK`.

---

## 6. Cancellation / Restoration

| Order Event | Order Status | Stock Deducted? | Stock Restored? | When? | Responsible Function / File |
|---|---|---|---|---|---|
| **Order Placed** | `8` (Dispatched/New) | **YES** | N/A | Immediately on `add_order` | [`decvariantsQuantity`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Orders.js#L565) in `Orders.js` |
| **Customer Cancelled** (< 2 mins) | `4` (Cancelled) | Previously | **YES** | Immediately on cancel | [`cancelorderuser` / `incvariantsQuantity`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Orders.js#L409) in `Orders.js` |
| **Admin Cancelled** | `4` (Cancelled) | Previously | **YES** | Immediately on status update | [`updatestatus` / `incvariantsQuantity`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/AdminOrders.js#L137) in `AdminOrders.js` |
| **Admin Rejected** | `3` (Rejected) | Previously | **YES** | Immediately on status update | [`updatestatus` / `incvariantsQuantity`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/AdminOrders.js#L137) in `AdminOrders.js` |
| **Payment Failed** | N/A (Razorpay drop) | **NO** | N/A | Order not created | N/A |
| **Order Returned** | `6` (Returned) | Previously | **NO (BROKEN)** | Never restored | Missing in `AdminOrders.js` and `DeliveryBoy.js` |
| **Order Refunded** | `6` / custom | Previously | **NO** | Never restored | Missing |

---

## 7. Scheduled Orders

ClikGett's schema contains `ScheduledDateTime` and `ScheduleStatus` on the `Orders` table, but the operational implementation is incomplete:

- **Stock Reservation:** **DOES NOT EXIST.** There is no `ReservedQty`, `HoldQty`, or inventory reservation table.
- **When is Stock Deducted:** Stock is deducted **immediately** upon order placement (even if scheduled 5 days in advance) via `decvariantsQuantity`.
- **Can Scheduled Orders Oversell?** **YES.** Because stock is depleted immediately from current inventory, items meant for today's orders can be consumed by scheduled orders, and conversely, future cancellations can disrupt inventory forecasting.
- **Reserved vs Available Quantity:** The system does **not** distinguish between physical stock on hand and available-to-promise inventory.

---

## 8. Warehouse System

- **Inventory Model:** Strictly **Option A: Global Stock**.
- **Existing `Warehouses` Module:**
  - Table: `Warehouses` (`WarehouseID`, `WarehouseName`, `Address`, `City`, `Pincode`, `ContactPerson`, `ContactNumber`, `Latitude`, `Longitude`, `Status`).
  - Controller: [`Backend/server/controllers/Warehouses.js`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Warehouses.js).
  - Scope: Facility master data CRUD only.
- **Warehouse-to-Product Mapping:** **DOES NOT EXIST.** There is no `WarehouseStock` or `WarehouseProducts` table.
- **Location-Based Allocation:** **DOES NOT EXIST.** Distance and delivery pricing are computed against a single central store coordinate stored in `AdminShopToggleSettings` (`Latitude`, `Longitude`). Customers cannot be routed to the nearest warehouse.

---

## 9. Customer Product API

Inspection of customer endpoints in [`Backend/server/controllers/Products.js`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Products.js):

- **Endpoints:**
  - `GET /api/products/list?CategoryID=...&SubCategoryID=...`
  - `GET /api/products/detail/:ProductID`
  - `GET /api/products/search/:SearchString`
- **Response Structure (Verified Live):**
  - `AvailableQty`: **EXISTS** inside `ProductVariants[i].AvailableQty`.
  - `Stock`: **NOT INCLUDED** at root level.
  - `Availability`: **NOT INCLUDED**.
  - `OutOfStock`: **NOT INCLUDED** (no boolean flag returned).
  - `Status`: **EXISTS** (`Products.Status` and `ProductVariants[i].status`).
- **Filtering Behavior:**
  - Active products with `AvailableQty = 0` **are returned** by the backend.
  - Inactive products (`Status != 1`) and inactive variants (`status != 1`) **are filtered out**.

---

## 10. Product Availability

The system distinguishes between availability states as follows:

| State | Product Status | Variant Status | AvailableQty | Store Open/Closed | Customer App Visibility & Behavior |
|---|---|---|---|---|---|
| **Active In Stock** | `1` | `1` | `> 0` | Open (`1`) | Visible, purchasable, "Add" button active. |
| **Out of Stock** | `1` | `1` | `0` | Open (`1`) | Visible at bottom of list, 70% black overlay with "Out of Stock" text. Add button disabled. |
| **Product Disabled** | `2` | Any | Any | Any | **Hidden.** Entire product excluded from all customer queries. |
| **Variant Disabled** | `1` | `2` | Any | Any | **Hidden.** Specific variant excluded from variant selector. |
| **Store Closed** | `1` | `1` | `> 0` | Closed (`0`) | Browsable, but checkout button blocked with "We're closed now" modal. |

---

## 11. Maximum Purchase Quantity (`maxQty`)

- **Database Column:** `ProductVariants.maxQty` (`int`, `DEFAULT 0`).
- **Customer Frontend Behavior ([ItemHorizontalTile.dart:L471](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Widgets/ItemHorizontalTile.dart#L471)):**
  - Flutter inspects `maxQty`. If `maxQty == 0`, the button renders **"Out Of Stock"** even if `AvailableQty > 0`.
  - When incrementing, Flutter blocks `quantity >= maxQty` with toast: `"Maximum quantity reached"`.
- **Backend Enforcement:** **NONE.**
  - `Carts.js` (`addcart`) and `Orders.js` (`add_order`) do not check `maxQty`.
  - A user can bypass the UI and add/purchase any quantity up to `AvailableQty`.
- **Reorder Bug ([Orders.js:L841](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Orders.js#L841)):**
  ```sql
  WHERE oi.OrderID = ? AND pv.AvailableQty > 0 AND oi.Quantity < pv.maxQty
  ```
  If `maxQty` is `0` (the DB default), `oi.Quantity < 0` is always false, causing reorder to fail for all default items.

---

## 12. Overselling / Concurrency

**Overselling Scenario:**
Suppose `AvailableQty = 1` for Variant #802.
- Customer A places order for 1.
- Customer B places order for 1 at the same millisecond.

**Current System Behavior:**
1. **No Row Locking:** Neither `SELECT ... FOR UPDATE` nor optimistic locking (`version` column) is used.
2. **No Atomic Conditional Update:** The query is:
   ```sql
   UPDATE ProductVariants SET AvailableQty = AvailableQty - 1 WHERE VariantID = 802;
   ```
   It lacks `AND AvailableQty >= 1`.
3. **Result:** Both transactions succeed. Customer A gets 1, Customer B gets 1, and `AvailableQty` becomes `-1`. **Overselling occurs.**

---

## 13. Existing Admin Stock UI

- **Location:** Admin Dashboard -> Products (`/products`) -> Product Row -> Edit -> **Stock Tab** in `UnifiedProductEditorModal.jsx`.
- **Features in Admin UI:**
  - Displays table of all variants for the product.
  - Shows current `AvailableQty` for each variant.
  - Allows inline number editing.
  - On save, triggers `PUT /api/adminproducts/variant/update/:VariantID` with `{ AvailableQty: newQty }`.
- **Persistence:** **Confirmed.** Directly updates `ProductVariants.AvailableQty` in AWS RDS MySQL.
- **Audit/History:** No adjustment reason, no user tracking, no timestamped audit log.

---

## 14. Existing Database Tables

| Table Name | Role in Inventory / Orders | Key Fields Relevant to Stock |
|---|---|---|
| `Products` | Catalog Master | `ProductID`, `ProductName`, `Status`, `CategoryID` |
| `ProductVariants` | Authoritative Stock & Pricing | `VariantID`, `ProductID`, `AvailableQty`, `maxQty`, `status`, `Price`, `OfferPrice` |
| `Carts` | Active User Cart Session | `CartID`, `UserID`, `isOrderLinked` |
| `CartItems` | Cart Item Rows | `CartItemID`, `CartID`, `ProductID`, `VariantID`, `Quantity`, `Price` |
| `Orders` | Order Header | `OrderID`, `UserID`, `OrderStatus`, `ScheduledDateTime`, `ScheduleStatus`, `GrandTotal` |
| `OrderItems` | Ordered Line Items | `OrderItemID`, `OrderID`, `ProductID`, `VariantID`, `Quantity`, `Price` |
| `Warehouses` | Facility Master Data (Independent) | `WarehouseID`, `WarehouseName`, `City`, `Latitude`, `Longitude`, `Status` |
| `AdminShopToggleSettings` | Global Store Config | `ShopStatus`, `Latitude`, `Longitude`, `DeliveryRadiusKm`, `PricePerKm` |
| `OrderTimings` | Operating Hours | `TimingID`, `StartTime`, `EndTime`, `Status` |
| `NotifyProducts` | Back-in-Stock Notification Queue | `NotifyID`, `UserID`, `ProductID`, `VariantID`, `MobileNumber`, `Status`, `NotifiedAt` |

---

## 15. Existing APIs

| Endpoint | Method | Role | Stock Logic Checked / Executed |
|---|---|---|---|
| `/api/products/list` | `GET` | Catalog Listing | Filters `p.Status=1` & `pv.status=1`. Sorts `AvailableQty=0` to end. |
| `/api/products/detail/:id` | `GET` | Product Details | Returns product and variants with `AvailableQty` and `maxQty`. |
| `/api/carts/addcart` | `POST` | Add/Update Cart Item | Checks `requestedQty <= AvailableQty`. Blocks if `AvailableQty = 0`. |
| `/api/carts/mycart` | `POST` | Cart Calculation | Computes prices via `PricingEngine`. Does **not** re-verify stock. |
| `/api/carts/validate_cart` | `POST` | Pre-checkout Validation | Loops items and verifies `Quantity <= AvailableQty`. |
| `/api/orders/add_order` | `POST` | Order Placement | **Zero stock validation.** Decrements `AvailableQty` blindly. |
| `/api/orders/cancelorderuser/:id` | `POST` | User Cancel Order | Restores stock (`AvailableQty + Quantity`) if canceled within 2 mins. |
| `/api/adminorders/updatestatus/:id` | `PUT` | Admin Order Status | Restores stock if status is set to `4` (Cancelled) or `3` (Rejected). |
| `/api/adminproducts/variant/update/:id` | `PUT` | Admin Variant Edit | Updates `AvailableQty` and `maxQty` directly in database. |
| `/api/adminusers/triggernotifyproduct/:id` | `POST` | Admin Stock Alert | Dispatches push notification to users in `NotifyProducts` queue. |

---

## 16. Existing Customer Behavior

1. **Browsing:** Customers can see out-of-stock items, which are greyed out with a black overlay and moved to the end of the category feed.
2. **Add to Cart:** Customers cannot add an out-of-stock item via the standard UI; the "Add" button is replaced by "Out of Stock".
3. **Cart Staling:** If an item goes out of stock while sitting in a user's cart, the user is not warned until checkout pre-validation (`validate_cart`).
4. **Checkout:** If `validate_cart` passes, the order goes through. If a race condition occurs, the order still succeeds and inventory goes negative.
5. **Back-in-Stock Notifications:** Customers cannot subscribe to alerts in the Flutter app (no "Notify Me" button), although Admin has the queue backend ready.

---

## 17. Feature-by-Feature Status Matrix

| # | Zepto / Blinkit Quick-Commerce Requirement | Status | Current Reality in ClikGett |
|---|---|---|---|
| 1 | **Variant-level inventory** | **EXISTS** | Stored in `ProductVariants.AvailableQty`. Authoritative across catalog. |
| 2 | **Out-of-stock state** | **PARTIAL** | UI displays overlay and sorts to bottom, but no API boolean or status flag. |
| 3 | **Low-stock state** ("Only X left") | **NOT IMPLEMENTED** | No threshold logic, no customer badges, no admin alerts. |
| 4 | **Maximum purchase quantity** | **PARTIAL** | DB column `maxQty` exists and Flutter checks it, but backend endpoints ignore it. Default `0` creates bugs. |
| 5 | **Stock validation during cart** | **PARTIAL** | Checked on `addcart`, but `mycart` does not detect stale or depleted stock. |
| 6 | **Stock validation during checkout** | **NOT IMPLEMENTED** | `add_order` performs zero stock checks before creating orders. |
| 7 | **Stock deduction** | **PARTIAL** | Decrements on order placement, but is non-atomic and lacks `AvailableQty >= Quantity` floor check. |
| 8 | **Stock restoration** | **PARTIAL** | Restores on cancellation/rejection, but missing for returns, refunds, and payment timeouts. |
| 9 | **Scheduled-order reservation** | **NOT IMPLEMENTED** | No reservation engine or hold buffer. Stock deducted immediately upon scheduling. |
| 10 | **Warehouse-level inventory** | **NOT IMPLEMENTED** | `Warehouses` table has no inventory links. All stock is global. |
| 11 | **Location-based availability** | **NOT IMPLEMENTED** | Single store origin (`AdminShopToggleSettings`). No dark store / nearest warehouse routing. |
| 12 | **Product manual availability toggle** | **EXISTS** | Admin can toggle `Products.Status` and `ProductVariants.status` (1/2) to instantly show/hide. |
| 13 | **Notify Me / back-in-stock** | **PARTIAL** | Table `NotifyProducts` and Admin queue exist, but no UI in Flutter customer app. |
| 14 | **Inventory history** | **NOT IMPLEMENTED** | No ledger, transaction log, or historical stock movement records. |
| 15 | **Inventory adjustment audit** | **NOT IMPLEMENTED** | Stock edits overwrite values directly with no user/reason tracking. |

---

## 18. Recommended Next Decisions

Before implementing any quick-commerce inventory logic, the following **business and architecture decisions** must be approved:

### Decision 1: Single Fulfillment Center vs. Multi-Dark-Store Architecture
- **Option 1A (Single Store / Blinkit Hub):** Continue with single fulfillment center model where `ProductVariants.AvailableQty` remains global. Fastest path to Zepto-level cart/checkout stability.
- **Option 1B (Multi-Warehouse / Dark Store):** Migrate to `WarehouseVariants` (`WarehouseID`, `VariantID`, `AvailableQty`) with geolocation-based warehouse assignment at app launch.

### Decision 2: Concurrency & Atomic Deduction Strategy
- **Option 2A (Atomic SQL Conditional):**
  ```sql
  UPDATE ProductVariants SET AvailableQty = AvailableQty - ? 
  WHERE VariantID = ? AND AvailableQty >= ?
  ```
  If `affectedRows === 0`, throw OutOfStock error and abort order. Lightweight and requires no extra infrastructure.
- **Option 2B (Database Transactions + Row Locking):** Wrap order placement in `START TRANSACTION ... SELECT FOR UPDATE ... COMMIT`. Strongest consistency, but requires careful timeout management.

### Decision 3: Purchase Limit (`maxQty`) Business Rule
- Currently, `ProductVariants.maxQty` defaults to `0`, which Flutter mistakenly interprets as out-of-stock on the Add button.
- Decision needed:
  1. Should `maxQty = 0` mean "Unlimited / No Limit" or should default be `10`?
  2. Should `maxQty` be strictly enforced in backend `Carts.js` and `Orders.js`?

### Decision 4: Cart Drift & Out-of-Stock Handling at Checkout
- When a customer opens their cart and an item became out-of-stock while browsing:
  - **Option 4A (Hard Block):** Block checkout entirely until customer removes the out-of-stock item.
  - **Option 4B (Auto-Adjust / Zepto Style):** Automatically adjust quantity to whatever stock is remaining (or remove item) and show a banner: *"Quantity of X adjusted to 2 due to limited availability"*.

### Decision 5: Scheduled Orders Inventory Policy
- Should scheduled orders:
  - **Option 5A (Immediate Hold):** Reserve stock immediately out of current inventory (requires adding `ReservedQty`).
  - **Option 5B (Batch Allocation):** Do not reserve now; allocate stock from the warehouse batch 2 hours before the scheduled delivery slot.

### Decision 6: Inventory Audit & Logging
- Should we introduce a lightweight `inventory_logs` table (`VariantID`, `OldQty`, `NewQty`, `ChangeType` [Order, Cancellation, AdminEdit, Restock], `AdminID`, `OrderID`, `CreatedAt`) to ensure complete inventory accountability?

---

*End of Current State Audit. Ready for review.*
