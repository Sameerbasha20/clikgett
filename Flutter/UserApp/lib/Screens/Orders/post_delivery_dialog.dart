import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/Screens/Orders/feeback.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

class PostDeliveryFeedbackDialog extends StatelessWidget {
  final int orderId;
  final double? orderTotal;
  final VoidCallback? onDismissed;
  final VoidCallback? onFeedbackSubmitted;

  const PostDeliveryFeedbackDialog({
    Key? key,
    required this.orderId,
    this.orderTotal,
    this.onDismissed,
    this.onFeedbackSubmitted,
  }) : super(key: key);

  static const String officialPlayStoreWebUrl =
      'https://play.google.com/store/apps/details?id=com.app.clikget&pli=1';
  static const String officialPlayStoreMarketUrl =
      'market://details?id=com.app.clikget';

  /// Helper key for persisting whether the dialog was shown for a given order
  static String getPromptStorageKey(int orderId) =>
      'post_delivery_prompt_shown_order_$orderId';

  /// Check if the prompt has already been shown/dismissed for this order
  static Future<bool> hasPromptBeenShown(int orderId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(getPromptStorageKey(orderId)) ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Mark the prompt as shown for this order
  static Future<void> markPromptAsShown(int orderId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(getPromptStorageKey(orderId), true);
    } catch (_) {}
  }

  /// Open Play Store listing with safe fallback
  static Future<void> launchPlayStoreListing() async {
    final Uri marketUri = Uri.parse(officialPlayStoreMarketUrl);
    final Uri webUri = Uri.parse(officialPlayStoreWebUrl);

    try {
      if (await canLaunchUrl(marketUri)) {
        await launchUrl(marketUri, mode: LaunchMode.externalApplication);
      } else if (await canLaunchUrl(webUri)) {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      } else {
        customToast(message: 'Could not open Google Play Store');
      }
    } catch (e) {
      try {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      } catch (_) {
        customToast(message: 'Could not open Google Play Store listing');
      }
    }
  }

  /// Show the dialog cleanly on top of the given context
  static Future<void> show(
    BuildContext context, {
    required int orderId,
    double? orderTotal,
    VoidCallback? onDismissed,
    VoidCallback? onFeedbackSubmitted,
  }) async {
    await markPromptAsShown(orderId);
    if (!context.mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PostDeliveryFeedbackDialog(
        orderId: orderId,
        orderTotal: orderTotal,
        onDismissed: onDismissed,
        onFeedbackSubmitted: onFeedbackSubmitted,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Drag handle
          Container(
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 20),

          // Header icon / badge
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFFE8F5E9),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFC8E6C9), width: 1.5),
            ),
            child: const Center(
              child: Icon(
                Icons.star_rounded,
                color: Color(0xFF2E7D32),
                size: 38,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Authoritative Heading
          const Text(
            'How was your experience?',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E293B),
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),

          // Supporting Text
          const Text(
            "We'd love to hear your feedback.",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 12),

          // Reward highlight badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.card_giftcard_rounded,
                    size: 16, color: Color(0xFFB45309)),
                SizedBox(width: 6),
                Flexible(
                  child: Text(
                    'In-app reviews are eligible for ClikGett wallet cashback!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF92400E),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Option A: Rate Us (In-App)
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.rate_review_rounded,
                  color: Colors.white, size: 20),
              label: const Text(
                'Rate Us',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () async {
                Navigator.pop(context); // close bottom sheet
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (ctx) => FeedBack(
                      userId: orderId,
                      orderId: orderId,
                    ),
                  ),
                );
                if (result == true && onFeedbackSubmitted != null) {
                  onFeedbackSubmitted!();
                }
              },
            ),
          ),
          const SizedBox(height: 12),

          // Option B: Rate Us on Play Store
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.storefront_rounded,
                  color: Color(0xFF334155), size: 19),
              label: const Text(
                'Rate Us on Play Store',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () {
                Navigator.pop(context);
                launchPlayStoreListing();
              },
            ),
          ),
          const SizedBox(height: 10),

          // Dismiss action
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              if (onDismissed != null) onDismissed!();
            },
            child: const Text(
              'Maybe Later',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Color(0xFF94A3B8),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
