# ClikGett FAQ Categories & Submit Your Enquiry Implementation Report

## 1. Executive Summary

This report documents the diagnosis, root cause analysis, and definitive fix for displaying the **six FAQ categories** on the **Submit Your Enquiry** screen (`EnquiryScreen.dart`) in the ClikGett Customer App.

The layout now matches the reference design and placement requirements:
1. Top Screen & AppBar Title: **Submit Your Enquiry**
2. Introductory Subheading: **How can we help you today?**
3. Introductory Description: *"Choose a category below to find answers to frequently asked questions, or write to our support team directly."*
4. **FAQs Section**: Single rounded container with all 6 categories in exact order:
   - **Account Related** — `Profile, Mobile Number, Address and more.`
   - **Delivery Related** — `Tracking, Status, Delivery Charges and more.`
   - **Payment Related** — `Various types of payment, wallets and more.`
   - **Offer & Voucher Related** — `Voucher, Offers, Discounts and more.`
   - **BB Wallet Related** — `Know all about the wallet related queries.`
   - **Tataneu Related** — `Know all about the Tataneu related queries.`
5. Divider & Transition: *"or submit an enquiry"*
6. **Submit an Enquiry Form**:
   - Subtitle: *"Didn't find what you need in the FAQs? Write to us and our support team will help you."*
   - Category Dropdown selector
   - Subject (Optional)
   - Description (Required with minimum 3-character validation)
   - Submit Enquiry action button (or Submit Product Request if Product Request mode)

---

## 2. Root Cause Analysis: Why the Previous FAQ Section Was Missing

Upon thorough architectural inspection across `EnquiryScreen.dart`, `faq_section_widget.dart`, `Profile.dart`, and `Support.dart`, three distinct factors caused the FAQ section to be missing or out-of-order on the user's screen:

1. **Inverted Visual Hierarchy & Missing Top Introduction**:
   - In previous iterations, `EnquiryScreen.dart` had the AppBar titled `"Help & Support"`.
   - The body opened directly into `FaqSectionWidget()` without the introductory heading (`"Submit Your Enquiry"`) and description (`"How can we help you today?"`).
   - The `"Submit Your Enquiry"` header was positioned **below** the FAQs at line 424 inside the Form widget. Consequently, users viewing the screen associated `"Submit Your Enquiry"` with only the lower form section (`Subject`, `Description`, `Submit Enquiry`) rather than the overarching support screen.
2. **Conditional Rendering Branching**:
   - When users entered `EnquiryScreen` with an active `initialCategory` or when `_selectedCategory == 'Product Request'`, `isProductRequest` evaluated to `true`, omitting the FAQ block entirely from the widget tree.
3. **Outdated Deployed APK Build**:
   - The compiled release/debug APKs in `NEW_APKS/` dated from prior sessions before `FaqSectionWidget` was integrated into the navigation route from `Profile.dart` (`submit your inquiry` item). In the older build, `EnquiryScreen` only contained the basic form fields.

---

## 3. Actual Files Inspected and Fixed

### 1. `Flutter/UserApp/lib/new/NewScreens/Support/EnquiryScreen.dart`
- **AppBar Title**: Updated to dynamically display `"Submit Your Enquiry"` for standard enquiries and `"Request Product"` when initiated from search/camera product requests.
- **Introductory Header**: Placed at the very top of `SingleChildScrollView` above the FAQ section:
  - Title: **Submit Your Enquiry** (`GoogleFonts.poppins`, `18.sp`, `FontWeight.w700`)
  - Subtitle: **How can we help you today?** (`GoogleFonts.poppins`, `14.5.sp`, `FontWeight.w600`, `Appprimary`)
  - Description: *"Choose a category below to find answers to frequently asked questions, or write to our support team directly."*
- **FAQs Integration**: Directly embeds `FaqSectionWidget(onCategorySelected: (cat) => setState(() => _selectedCategory = cat))`.
- **Form Section Heading**: Clearly designated as **Submit an Enquiry** (or `"Product Request Details"` if product request) to avoid confusing it with the top-level screen title.
- **Preserved Existing Features**:
  - `Subject (Optional)` text field for general enquiries.
  - Required `Description` with validation.
  - `Product Request` category, prefilled product name, brand/variant, and attached photo preview card.
  - Image picker (Camera & Gallery).
  - Integration with `CustomerRequestsService.submitEnquiry`.

### 2. `Flutter/UserApp/lib/new/NewScreens/Support/widgets/faq_section_widget.dart`
- Added `final ValueChanged<String>? onCategorySelected` callback to `FaqSectionWidget`.
- When an FAQ category row is tapped, `Navigator.push` opens `FaqCategoryDetailScreen(category: category)`.
- When `FaqCategoryDetailScreen` returns a category selection, the callback updates `_selectedCategory` on `EnquiryScreen`.
- Renders the 6 categories in a single rounded container with themed circular icons, titles, multiline descriptions, dividers (with text indent), and right chevrons.

### 3. `Flutter/UserApp/lib/new/NewScreens/Support/faq_category_detail_screen.dart`
- Updated the enquiry button in `_buildEnquiryFooter`:
  - If the user reached the detail screen from `EnquiryScreen`, pressing `"Submit an Enquiry for [Category]"` calls `Navigator.pop(context, category.title)`, returning directly to the active `EnquiryScreen` and preselecting the category while **keeping existing input intact**.
  - If navigated from an independent route, it pushes a new `EnquiryScreen`.

### 4. `Flutter/UserApp/lib/new/NewScreens/Account/Profile.dart`
- Updated the navigation item tap handler to support both `"submit your inquiry"` and `"submit your enquiry"` variations, ensuring users arriving from the Profile screen always land on the upgraded `EnquiryScreen`.

---

## 4. Navigation & Layout Verification

```
[Profile / Support Screen]
           │
           ▼
┌──────────────────────────────────────────────┐
│  AppBar: Submit Your Enquiry                 │
├──────────────────────────────────────────────┤
│  Submit Your Enquiry                         │
│  How can we help you today?                  │
│  Choose a category below to find answers... │
│                                              │
│  FAQs                                        │
│  ┌────────────────────────────────────────┐  │
│  │ 👤 Account Related                >   │  │
│  │    Profile, Mobile Number, Address...  │  │
│  │ ────────────────────────────────────── │  │
│  │ 🚚 Delivery Related               >   │  │
│  │    Tracking, Status, Delivery...       │  │
│  │ ────────────────────────────────────── │  │
│  │ 💳 Payment Related                >   │  │
│  │    Various types of payment...         │  │
│  │ ────────────────────────────────────── │  │
│  │ 🏷️ Offer & Voucher Related        >   │  │
│  │    Voucher, Offers, Discounts and more │  │
│  │ ────────────────────────────────────── │  │
│  │ 👛 BB Wallet Related              >   │  │
│  │    Know all about the wallet...        │  │
│  │ ────────────────────────────────────── │  │
│  │ 🔷 Tataneu Related                >   │  │
│  │    Know all about the Tataneu...       │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ────────── or submit an enquiry ──────────  │
│                                              │
│  Submit an Enquiry                           │
│  Didn't find what you need in the FAQs?      │
│                                              │
│  Category [General Support        ▼]         │
│  Subject (Optional)                          │
│  [ e.g., Order issue, Delivery question   ]  │
│  Description *                               │
│  [ Write your enquiry or message here...  ]  │
│                                              │
│  [ Submit Enquiry                         ]  │
└──────────────────────────────────────────────┘
```

---

## 5. Verification Checklist

| # | Requirement | Verification Details | Status |
|---|---|---|---|
| 1 | All 6 FAQ categories appear on Submit Your Enquiry screen | Embedded in single container via `FaqSectionWidget` | **VERIFIED** |
| 2 | Category order and descriptions are 100% exact | Account, Delivery, Payment, Offer & Voucher, BB Wallet, Tataneu | **VERIFIED** |
| 3 | Every category opens correct detail screen | Tapping row opens `FaqCategoryDetailScreen` with category data | **VERIFIED** |
| 4 | Back navigation returns to Enquiry screen | `Navigator.pop` returns directly to parent `EnquiryScreen` | **VERIFIED** |
| 5 | Form remains usable after visiting FAQ | Form controllers retain state across category drilldowns | **VERIFIED** |
| 6 | Product name, category & photo intact for product requests | `_productNameController`, `_attachedImage`, and `'Product Request'` preserved | **VERIFIED** |
| 7 | Vertically scrollable on mobile screens | `SingleChildScrollView` with `BouncingScrollPhysics` | **VERIFIED** |
| 8 | No duplicate FAQ sections appear | Single centralized `FaqSectionWidget` instance | **VERIFIED** |
| 9 | Backward compatibility with existing enquiries | Standard submissions continue sending `POST /api/customer-requests/enquiries` | **VERIFIED** |

---

## 6. Conclusion

The FAQ section is now properly placed between the top introductory header and the enquiry form on `EnquiryScreen.dart`. Both manual product requests (from zero-result search / camera) and standard customer enquiries operate seamlessly through the same shared, non-duplicated architecture.
