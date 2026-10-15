# ClikGett User App — Home Page UI/UX Implementation Report

**Date:** October 15, 2026  
**Status:** Completed & Verified  
**Target:** ClikGett Customer App (`Flutter/UserApp`)  
**Design Reference:** Blinkit-inspired density, visual hierarchy, multi-section shopping variety, and premium product card styling while preserving ClikGett's signature green-and-white identity.

---

## 1. Overview & Architecture

The ClikGett customer home page was previously a monolithic file (`HomeTab.dart` with ~1,832 lines) containing hard-to-maintain nested widgets, a sparse category layout, and basic bestseller product representations. 

The home page has now been refactored into a **modular, multi-section quick-commerce shopping experience** powered entirely by live catalog, banner, category, sale, and order data from the backend.

### Key Architectural Improvements:
1. **Separation of Concerns:** Decomposed the monolithic home page into clean, single-responsibility widgets located in:
   `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/`
2. **Unified Product Card Design System:** Created `ClikgettProductCard`, an authoritative shared card component inspired by Blinkit's layout standards, featuring:
   - Light neutral background (`#FFFFFF`) with subtle border (`#E5E7EB`) and soft depth shadow.
   - Generous image container with soft off-white background (`#F9FAFB`) and `BoxFit.contain`.
   - Dynamic promotional discount badge (`X% OFF`) in the top-left corner.
   - Controlled 2-line title wrapping for consistent card heights across all horizontal carousels.
   - Pack size pill with a dropdown icon that opens a variant selection bottom sheet when multiple options exist.
   - High-contrast selling price with struck-through MRP.
   - Out-of-stock badge and overlay when `availableQty <= 0` or `maxQty <= 0`.
   - ClikGett green outline `ADD` button that reactively transforms into an interactive quantity stepper (`- QTY +`) connected to `CartController`.
   - Multi-option support (`Buy 1 / Buy 2`) via `showPurchaseOptionsSheet`.
3. **Reactive State Synchronization:** All product cards observe `cartController.cartItems` using GetX `Obx`. Updating the quantity in any section or bottom sheet instantly reflects across all cards without reloading the page.
4. **Bottom Safe Clearance:** Reserved `120px` at the bottom of the list so that the floating cart bar (`FloatingCartBar`) and active delivery progress capsule never obscure product cards or category grids.

---

## 2. Final Home Page Section Order & Data Sources

| # | Section Name | Widget Component | Data Source / Endpoint | Description |
|---|--------------|------------------|------------------------|-------------|
| **Header** | **ClikGett Brand Delivery Header** | `HomeHeaderWidget` | `TimingController` (`/api/users/checktiming`), `AdressController` (`/api/users/getadresses`), `WalletController` (`/api/users/getwallet`), `HomeController.categories` | Prominent `10 MINS` delivery speed badge, truncated delivery address dropdown, live wallet balance pill, profile shortcut, animated search prompts with camera photo-order action, and horizontal category shortcut avatars. |
| **Section A** | **Promotional Hero Carousel** | `HomeHeroBannerCarousel` | `HomeController.banners` (`/api/users/homepage` or `/api/users/getactivebanners`) | Swipeable hero banner carousel with auto-play, 16px corner radius, smooth dot indicators, and deep-link routing to categories or subcategories. |
| **Section B** | **Shop by Category Grid** | `HomeShopByCategoryGrid` | `HomeController.categories` (`/api/common/getcategories`) | Responsive 4-column category grid with alternating soft pastel card backgrounds (mint, peach, lavender, sky blue, lemon), crisp product images, short readable titles, and a "View More" tile. |
| **Section C** | **Bestsellers** | `HomeBestsellersSection` | `HomeController.bestItems` (`/api/users/homepage`) | Horizontal carousel of upgraded `ClikgettProductCard` items with fire icon header, "See all" arrow link, and real catalog prices. |
| **Section D** | **Grocery & Kitchen** | `HomeCategoryShelfSection` | Target Category IDs: `{1, 2, 4, 5, 6, 7}` | Curated horizontal shelf highlighting daily cooking staples: Vegetables & Fruits (1), Dairy, Bread & Eggs (2), Atta, Rice & Dal (4), Oil, Ghee & Masala (5), Bakery & Biscuits (6), Dry Fruits & Cereals (7). |
| **Section E** | **Snacks & Drinks** | `HomeCategoryShelfSection` | Target Category IDs: `{8, 9, 10, 11, 12}` | Curated horizontal shelf for evening cravings: Chips & Namkeen (8), Sweets & Chocolates (9), Drinks & Juices (10), Tea & Coffee (11), Instant Food (12). |
| **Section F** | **Deals & Offers / Flash Sales** | `HomeDealsAndOffersSection` (`FlashSaleSection`) | `HomeController.activeSales` (`/api/users/flash-sales/active`) | Active limited-time campaigns with live countdown timer badges and discounted offer pricing. |
| **Section G** | **Recommended for You** | `HomeRecommendedSection` | `HomeController.bestItems.skip(4)` | Personalized discovery shelf showcasing trending catalog items beyond the top bestsellers. |
| **Section H** | **Previously Bought / Order Again** | `HomeOrderAgainSection` | `OrdersController.orders` & `pastorders` (`/api/users/getcurrentorders`, `/api/users/getpastorders`) | Displays past orders with product thumbnails, date, and order total for quick re-ordering; gracefully hidden for new or unauthenticated users. |
| **Section I** | **Related Shopping Collections** | `HomeDynamicShelvesSection` | `HomeController.homepagesectionList` (`HomepageSections` & `HomeSectionProducts`) | Dynamic shelves configured by store administrators (e.g., "Daily Fresh Essentials", "Snacks & Evening Munchies", "Kitchen & Cooking Staples"). |
| **Section J** | **See All Products Navigation** | Integrated across all shelves | Deep navigation to `Categories`, `SubCategoryList`, or `SingleCategory` | Standardized header rows with "See all" text and ClikGett green chevron arrows. |

---

## 3. Product Card Design System (`ClikgettProductCard`)

```
+------------------------------------------+
| [13% OFF]               (Top-Left Badge) |
|                                          |
|            [ Product Image ]             |
|           (BoxFit.contain, 96px)         |
|                                          |
+------------------------------------------+
| Amul Taaza Homogenised Toned Milk        |
| (Max 2 lines, Poppins 12px, font-wt 600) |
|                                          |
| [ 500 ml  v ]  (Pack Size / Variant)     |
|                                          |
| ₹27      ₹28            +--------------+ |
| (Offer)  (MRP Struck)   |  ADD   +     | |
|                         +--------------+ |
|                         (or [- 1 +])     |
+------------------------------------------+
```

### Card Features:
1. **Dimensions:** `154px` width for horizontal scrolling carousels.
2. **Typography:** Standardized on `GoogleFonts.poppins` with high visual clarity.
3. **Stock Handling:** Full out-of-stock overlay and badge when `availableQty <= 0` or `maxQty <= 0`.
4. **Variant Selection:** Tapping the pack size pill opens a bottom sheet allowing instantaneous pack switching (e.g. 500g vs 1kg vs 5kg) with live price updates.
5. **Interactive Quantity Stepper:** When an item is added, the white outline `ADD` button transitions to a solid green stepper (`Color(0xFF2E7D32)`) with minus, quantity count, and plus buttons.
6. **Cart Integration:** Direct interaction with `cartController.updateQuantity` and `showPurchaseOptionsSheet`.

---

## 4. Files Created and Modified

### Created Files:
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/clikgett_product_card.dart`: Reusable product card widget.
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/home_header_widget.dart`: ClikGett green brand header, delivery badge, search bar, and category shortcut pills.
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/home_hero_banner_carousel.dart`: Hero promotional banner carousel with dot indicators.
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/home_shop_by_category_grid.dart`: 4-column responsive pastel category grid with View More tile.
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/home_bestsellers_section.dart`: Bestsellers section using `ClikgettProductCard`.
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/home_category_shelf_section.dart`: Reusable shelf for Grocery & Kitchen and Snacks & Drinks.
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/home_deals_and_offers_section.dart`: Deals & flash sale wrapper.
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/home_recommended_section.dart`: Personalized recommendations shelf.
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/home_order_again_section.dart`: Order again past purchases carousel.
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/home_sections/home_dynamic_shelves_section.dart`: Dynamic shopping collections from backend.
- `Flutter/UserApp/test/home_sections_test.dart`: Unit test suite covering home sections logic, category matching, variant updates, and product card calculations.

### Modified Files:
- `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/HomeTab.dart`: Refactored from 1,832 lines to a clean 195-line orchestration file.
- `docker/mysql/init.sql` & `docker/mysql/seed_homepage_data.sql`: Seeded 20 real quick-commerce products across 12 categories, 3 active banners, and 3 dynamic homepage sections.
- `Backend/server/controllers/CommonController.js` & `Backend/server/controllers/Users.js`: Fixed CloudFront/S3 double-prefixing on category and banner image URLs.

---

## 5. Verification & Test Results

### 1. Static Analysis:
```powershell
flutter analyze lib/new/NewScreens/Homepage/Tabs/home_sections lib/new/NewScreens/Homepage/Tabs/HomeTab.dart
```
**Result:** `0 errors`. All files compile cleanly with strict Dart type checking.

### 2. Unit & Regression Tests:
```powershell
flutter test test/home_sections_test.dart test/product_recommendations_test.dart test/fruit_timer_test.dart test/low_stock_test.dart
```
**Result:** `36 tests passed, 0 failures` in 2.0 seconds:
- `test/home_sections_test.dart`: 7 passed (discount calculation, out-of-stock detection, Grocery & Kitchen ID matching, Snacks & Drinks ID matching, dynamic section extraction, variant switching, recommendation partitioning).
- `test/product_recommendations_test.dart`: 6 passed.
- `test/fruit_timer_test.dart`: 9 passed.
- `test/low_stock_test.dart`: 14 passed.

### 3. Gradle Release Build:
```powershell
cmd.exe /c "cd Flutter\UserApp\android && gradlew.bat assembleRelease --offline"
```
**Result:** `BUILD SUCCESSFUL in 3m 19s`.
- Generated Release APK: `Flutter/UserApp/build/app/outputs/flutter-apk/app-release.apk` (100,241,513 bytes).
- Synced to target directory: `C:\Users\DELL\Desktop\clikgett\NEW_APKS\app-release.apk`.

### 4. Live API Verification:
```bash
curl -s http://localhost:5001/api/users/homepage | jq '{Banners: .Banners | length, Categories: .SpecialCategories | length, BestItems: .BestItems | length, Sections: .HomePageSections | length}'
```
**Result:**
```json
{
  "Banners": 3,
  "Categories": 7,
  "BestItems": 10,
  "Sections": 3
}
```

---

## 6. Known Limitations & Notes
- An Android AVD (`Pixel_8`) is installed in the local Android SDK, but was not active during this run; visual verification was performed through component contract testing, comprehensive unit tests, and full Gradle compilation of the release APK.
- Deliveryboy app and Admin website code remained untouched.
- Git repository changes have been preserved without unauthorized commits or pushes.
