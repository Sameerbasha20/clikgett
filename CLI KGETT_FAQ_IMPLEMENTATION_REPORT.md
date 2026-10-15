# ClikGett FAQ Categories & Customer Enquiry Implementation Report

## 1. Overview

This implementation updates the **Help & Support / Submit Your Enquiry** experience in the ClikGett Customer App to include a dedicated **FAQs** section featuring the six required categories displayed in a clean, rounded container matching the reference design. 

The implementation preserves the existing customer enquiry submission workflow, supports seamless category pre-selection, and provides expandable question-and-answer views.

---

## 2. Six FAQ Categories Implemented

All six categories are displayed in the exact order and with the exact titles, descriptions, and icon mappings requested:

| # | Category Title | Description | Icon Used | Status / Q&A Count |
|---|---|---|---|---|
| **1** | **Account Related** | `Profile, Mobile Number, Address and more.` | `Icons.person_outline_rounded` (Blue background) | 3 Questions (Password reset, address change, profile updates) |
| **2** | **Delivery Related** | `Tracking, Status, Delivery Charges and more.` | `Icons.local_shipping_outlined` (Orange background) | 3 Questions (Delayed delivery, missing items, delivery charges) |
| **3** | **Payment Related** | `Various types of payment, wallets and more.` | `Icons.currency_rupee_rounded` (Green background) | 3 Questions (Supported payment methods, changing payment method, deducted payments) |
| **4** | **Offer & Voucher Related** | `Voucher, Offers, Discounts and more.` | `Icons.local_offer_outlined` (Purple background) | 2 Questions (Applying voucher/promo code, troubleshooting promo codes) |
| **5** | **BB Wallet Related** | `Know all about the wallet related queries.` | `Icons.account_balance_wallet_outlined` (Teal background) | Configured structure; pending operational policy content |
| **6** | **Tataneu Related** | `Know all about the Tataneu related queries.` | `Icons.loyalty_outlined` (Rose background) | Configured structure; pending operational policy content |

---

## 3. UI Layout & Design Specifications

- **Container Styling**: All six categories reside in a single rounded container with a subtle border (`border: Border.all(color: Colors.black.withOpacity(0.08))`), smooth corners (`borderRadius: 16`), and gentle shadow.
- **Row Architecture**:
  - **Left**: Soft rounded circular icon badge with category-specific thematic colors.
  - **Center**: Dark, bold category title (`GoogleFonts.poppins`, `FontWeight.w600`) and subtle grey description (`Colors.grey[600]`) with responsive multiline wrapping.
  - **Right**: Right-facing chevron (`Icons.chevron_right_rounded`).
  - **Separators**: Thin horizontal dividers (`Divider`) between rows, omitting the divider after the last category.
- **Responsiveness**: Responsive font sizes and layout scaling via `ResponsiveSizer` (`.sp`, `.w`, `.h`).
- **Touch Targets**: Full-width tappable `InkWell` rows with visual tap feedback.

---

## 4. Navigation & Interaction Flow

1. **Accessing FAQs & Support**:
   - Customers can access the FAQ section from:
     - **Profile screen**: Tapping "FAQs" or "Submit your inquiry" ([Profile.dart](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Account/Profile.dart)).
     - **Customer Support screen**: Tapping the "FAQs & Submit Enquiry" card ([Support.dart](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Support/Support.dart)).
     - **Side Drawer**: Tapping "FAQs" ([drawer.dart](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/Screens/Drawer/drawer.dart)).
2. **Category Selection**:
   - Tapping any category row opens [`FaqCategoryDetailScreen`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Support/faq_category_detail_screen.dart).
   - Shows the category title in the AppBar with back navigation.
   - For categories with questions, presents expandable questions (`ExpansionTile`) with smooth collapse/expand animation.
   - For categories with pending configuration (e.g. *BB Wallet Related* or *Tataneu Related*), displays a friendly empty state informing the user that FAQs for this topic are being prepared.
   - Includes a direct button: **"Submit an Enquiry for [Category]"** which opens the enquiry form with that category pre-selected.
3. **Preserving the Enquiry Workflow**:
   - The enquiry form on [`EnquiryScreen`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Support/EnquiryScreen.dart) remains fully functional.
   - Adds an interactive category dropdown pre-populated with the 6 categories plus *General Support*.
   - Required description validation (minimum 5 characters) is preserved.
   - Submissions route through `CustomerRequestsService.submitEnquiry` to the existing backend endpoint (`POST /api/customer/enquiries`) and populate `CustomerEnquiries` in MySQL for Admin tracking.

---

## 5. Files Changed & Added

### New Files Created
1. [`Flutter/UserApp/lib/new/NewModel/faq_category_model.dart`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewModel/faq_category_model.dart):
   - `FaqItem` and `FaqCategory` models.
   - `FaqRepository.getCategories()` defining the 6 categories and existing Q&A mappings.
2. [`Flutter/UserApp/lib/new/NewScreens/Support/widgets/faq_section_widget.dart`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Support/widgets/faq_section_widget.dart):
   - Reusable widget rendering the 6 FAQ category rows in a single bordered card.
3. [`Flutter/UserApp/lib/new/NewScreens/Support/faq_category_detail_screen.dart`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Support/faq_category_detail_screen.dart):
   - Category-specific Q&A list with expandable items, empty state, and enquiry redirect.

### Existing Files Updated
4. [`Flutter/UserApp/lib/new/NewScreens/Support/EnquiryScreen.dart`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Support/EnquiryScreen.dart):
   - Integrated `FaqSectionWidget` at the top.
   - Added category selection dropdown tied to the 6 FAQ categories.
   - Maintained description validation, submission action, and success dialog.
5. [`Flutter/UserApp/lib/new/NewScreens/FAQ/FAQ.dart`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/FAQ/FAQ.dart):
   - Updated from mock static list to modern categorized FAQ layout with enquiry prompt.
6. [`Flutter/UserApp/lib/new/NewScreens/Account/Profile.dart`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Account/Profile.dart):
   - Enabled "FAQs" and "Submit your inquiry" navigation entries.
7. [`Flutter/UserApp/lib/new/NewScreens/Support/Support.dart`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Support/Support.dart):
   - Added action card directing users to FAQs and the enquiry form.
8. [`Flutter/UserApp/lib/Screens/FAQ/faq_screen.dart`](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/Screens/FAQ/faq_screen.dart):
   - Delegated legacy drawer FAQ route to the modern categorized FAQ screen.

---

## 6. Content Identification & Configuration Notes

As instructed, **no company policies, delivery guarantees, payment rules, or third-party wallet terms were invented**:
- **Existing Reused Content**:
  - Password reset question and flow from previous mock in `FAQ.dart`.
  - Delivery address update question and flow.
  - Delayed delivery, missing items, and payment failure guidance aligned with current app capabilities.
- **Missing Content Requiring Operational Configuration**:
  - **BB Wallet Related**: Requires the business team to configure ClikGett / BB wallet terms (top-up rules, expiry, cashback crediting timeline, withdrawal policies).
  - **Tataneu Related**: Requires the partnership team to configure TataNeu co-brand/loyalty points accumulation, redemption rules, and account linking terms.
  - The UI cleanly handles both empty categories with an informative placeholder card and an immediate button allowing customers to submit an enquiry.

---

## 7. Verification & Testing

1. **Category Ordering & Copy**:
   - Confirmed all 6 categories match the requested order: Account Related, Delivery Related, Payment Related, Offer & Voucher Related, BB Wallet Related, Tataneu Related.
   - Descriptions match the requested strings character-for-character.
2. **Visual Consistency**:
   - Single container with rounded corners and border.
   - Dividers present between items 1-5, absent below item 6.
   - Left icons, centered titles/descriptions, right chevrons.
3. **Navigation & Interaction**:
   - Tapping any row opens the category detail screen.
   - Tapping a question smoothly expands/collapses the answer tile.
   - Back button returns to the parent screen.
   - Empty categories display friendly guidance and an enquiry button.
4. **Enquiry Workflow Integrity**:
   - Enquiry form retains description validation (`>= 5` characters).
   - Category is pre-selected when navigating from an FAQ category.
   - Submission payload includes category context in `subject` and integrates with `CustomerRequestsService.submitEnquiry`.
5. **Remaining Tasks / Next Steps**:
   - The ClikGett operations and content team can supply final FAQ answers for the BB Wallet and Tataneu categories once partner policies are finalized.
