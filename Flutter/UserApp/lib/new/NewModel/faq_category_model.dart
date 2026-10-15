import 'package:flutter/material.dart';

/// Single FAQ question and answer item
class FaqItem {
  final String question;
  final String answer;

  const FaqItem({
    required this.question,
    required this.answer,
  });
}

/// FAQ category holding metadata and associated Q&A items
class FaqCategory {
  final String id;
  final String title;
  final String description;
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final List<FaqItem> questions;

  const FaqCategory({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    this.questions = const [],
  });
}

/// Central FAQ Repository providing the 6 required categories
/// and reusing existing repository questions without inventing business policies.
class FaqRepository {
  static List<FaqCategory> getCategories() {
    return [
      // 1. Account Related
      FaqCategory(
        id: 'account_related',
        title: 'Account Related',
        description: 'Profile, Mobile Number, Address and more.',
        icon: Icons.person_outline_rounded,
        iconColor: const Color(0xFF1976D2),
        iconBgColor: const Color(0xFFE3F2FD),
        questions: const [
          FaqItem(
            question: 'How do I reset my password?',
            answer:
                'On the Login screen, tap "Forgot Password" and enter your registered mobile number/email to receive a verification OTP or reset instructions.',
          ),
          FaqItem(
            question: 'How do I change my delivery address?',
            answer:
                'Go to your Profile tab and select "Manage Address". You can add new addresses, update existing locations, or set your primary delivery destination.',
          ),
          FaqItem(
            question: 'How do I update my profile details or mobile number?',
            answer:
                'Navigate to Profile > Edit Profile to update your name, email, and personal preferences. To update your registered mobile number, please contact support.',
          ),
        ],
      ),

      // 2. Delivery Related
      FaqCategory(
        id: 'delivery_related',
        title: 'Delivery Related',
        description: 'Tracking, Status, Delivery Charges and more.',
        icon: Icons.local_shipping_outlined,
        iconColor: const Color(0xFFE65100),
        iconBgColor: const Color(0xFFFFF3E0),
        questions: const [
          FaqItem(
            question: 'My order has not been delivered yet',
            answer:
                'You can check real-time order status and live delivery partner tracking under the Orders tab. If delivery is delayed beyond the estimated time, please submit an enquiry below.',
          ),
          FaqItem(
            question: 'My order came with missing or damaged items',
            answer:
                'Please check your order receipt under Order Details. If an item is missing or damaged, report it via the Enquiry form below and our team will resolve it promptly.',
          ),
          FaqItem(
            question: 'What are the delivery charges?',
            answer:
                'Delivery charges depend on your delivery location and order total. The exact delivery fee is transparently displayed on the checkout screen before placing your order.',
          ),
        ],
      ),

      // 3. Payment Related
      FaqCategory(
        id: 'payment_related',
        title: 'Payment Related',
        description: 'Various types of payment, wallets and more.',
        icon: Icons.currency_rupee_rounded,
        iconColor: const Color(0xFF2E7D32),
        iconBgColor: const Color(0xFFE8F5E9),
        questions: const [
          FaqItem(
            question: 'What payment methods are supported?',
            answer:
                'ClikGett supports Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Net Banking, Debit/Credit Cards, and ClikGett Wallet balance.',
          ),
          FaqItem(
            question: 'How do I change my payment method?',
            answer:
                'You can select or change your preferred payment method during the checkout step before confirming your order.',
          ),
          FaqItem(
            question: 'My payment was deducted but order was not placed',
            answer:
                'If money was debited but the order failed, the bank usually reverses the transaction within 3-5 business days. You can submit an enquiry with your payment reference for quick assistance.',
          ),
        ],
      ),

      // 4. Offer & Voucher Related
      FaqCategory(
        id: 'offer_voucher_related',
        title: 'Offer & Voucher Related',
        description: 'Voucher, Offers, Discounts and more.',
        icon: Icons.local_offer_outlined,
        iconColor: const Color(0xFF7B1FA2),
        iconBgColor: const Color(0xFFF3E5F5),
        questions: const [
          FaqItem(
            question: 'How do I apply a discount coupon or voucher?',
            answer:
                'On the Cart screen, navigate to "Apply Promo Code" and enter your coupon code or select from the list of available active offers.',
          ),
          FaqItem(
            question: 'Why is my promo code not working?',
            answer:
                'Promo codes may have minimum order value requirements, user-specific eligibility, or expiry dates. Please review the terms associated with the specific voucher.',
          ),
        ],
      ),

      // 5. BB Wallet Related
      // Note: Kept clean without inventing specific third-party rules.
      FaqCategory(
        id: 'bb_wallet_related',
        title: 'BB Wallet Related',
        description: 'Know all about the wallet related queries.',
        icon: Icons.account_balance_wallet_outlined,
        iconColor: const Color(0xFF00796B),
        iconBgColor: const Color(0xFFE0F2F1),
        questions: const [], // Pending operations configuration
      ),

      // 6. Tataneu Related
      // Note: Kept clean without inventing specific brand partner rules.
      FaqCategory(
        id: 'tataneu_related',
        title: 'Tataneu Related',
        description: 'Know all about the Tataneu related queries.',
        icon: Icons.loyalty_outlined,
        iconColor: const Color(0xFFC2185B),
        iconBgColor: const Color(0xFFFFEBEE),
        questions: const [], // Pending operations configuration
      ),
    ];
  }
}
