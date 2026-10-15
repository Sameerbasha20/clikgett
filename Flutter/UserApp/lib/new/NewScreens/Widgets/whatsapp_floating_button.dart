import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:url_launcher/url_launcher.dart';

/// Reusable Floating WhatsApp Enquiry Button for ClikGett Customer App.
/// Provides deep-linking into WhatsApp with graceful web fallback and safe-area awareness.
class WhatsAppFloatingButton extends StatelessWidget {
  /// Optional order ID to provide contextual inquiry (e.g. Order #1234)
  final int? orderId;

  /// Optional custom message override
  final String? customMessage;

  /// Custom bottom offset to prevent covering bottom navigation or checkout bars
  final double? bottomPadding;

  /// Custom right offset
  final double? rightPadding;

  const WhatsAppFloatingButton({
    Key? key,
    this.orderId,
    this.customMessage,
    this.bottomPadding,
    this.rightPadding,
  }) : super(key: key);

  /// Launches WhatsApp via deep link or web fallback
  static Future<void> launchWhatsAppEnquiry({
    int? orderId,
    String? customMessage,
  }) async {
    final String cleanPhone =
        Constants.whatsAppNumber.replaceAll(RegExp(r'[^0-9]'), '');
    final String message = customMessage ?? "how may we help u";

    final String encodedMsg = Uri.encodeComponent(message);
    final Uri deepLinkUri =
        Uri.parse("whatsapp://send?phone=$cleanPhone&text=$encodedMsg");
    final Uri webFallbackUri =
        Uri.parse("https://wa.me/$cleanPhone?text=$encodedMsg");

    try {
      bool opened = false;

      // Try primary WhatsApp deep link
      if (await canLaunchUrl(deepLinkUri)) {
        try {
          opened = await launchUrl(
            deepLinkUri,
            mode: LaunchMode.externalApplication,
          );
        } catch (_) {
          opened = false;
        }
      }

      // If deep link did not open, try official wa.me web link in external browser
      if (!opened) {
        if (await canLaunchUrl(webFallbackUri)) {
          opened = await launchUrl(
            webFallbackUri,
            mode: LaunchMode.externalApplication,
          );
        }
      }

      if (!opened) {
        customToast(
          message: "WhatsApp is not available. Call support at +91 94296 90261",
        );
      }
    } catch (e) {
      // Graceful fallback: attempt web launch or notify without crashing
      try {
        await launchUrl(webFallbackUri, mode: LaunchMode.externalApplication);
      } catch (_) {
        customToast(
          message: "WhatsApp is not available. Call support at +91 94296 90261",
        );
      }
    }
  }

  // Pure SVG string of the official WhatsApp brand icon
  static const String _whatsAppSvg = '''
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M16 2C8.268 2 2 8.268 2 16c0 2.766.793 5.347 2.164 7.525L2.5 30l6.702-1.63A13.916 13.916 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm-1.89 20.35c-.417.027-.927-.08-1.503-.31-.58-.23-1.464-.698-2.52-1.754-1.056-1.056-1.524-1.94-1.754-2.52-.23-.576-.337-1.086-.31-1.503.04-.633.327-1.077.587-1.336.26-.26.545-.375.727-.375.183 0 .365.008.523.016.173.008.388-.066.608.463.235.565.8 1.956.87 2.1.07.143.118.31.023.498-.094.19-.142.308-.284.475-.142.167-.3.372-.428.5-.143.143-.292.3-.126.586.167.285.74 1.218 1.587 1.972 1.088.97 2.006 1.272 2.291 1.415.286.143.452.12.618-.07.167-.192.713-.832.903-1.118.19-.285.38-.238.642-.143.262.095 1.664.785 1.95 1.07.285.286.475.428.546.547.072.12.072.69-.166 1.356-.237.665-1.38 1.307-1.928 1.35z" fill="white"/>
</svg>
''';

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(
        bottom: bottomPadding ?? 0.0,
        right: rightPadding ?? 0.0,
      ),
      child: Tooltip(
        message: "Chat with ClikGett on WhatsApp",
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => launchWhatsAppEnquiry(
              orderId: orderId,
              customMessage: customMessage,
            ),
            borderRadius: BorderRadius.circular(28),
            splashColor: Colors.white24,
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFF25D366), // Official WhatsApp Green
                    Color(0xFF1EBE5D),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF25D366).withOpacity(0.4),
                    blurRadius: 10,
                    spreadRadius: 1,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: Colors.black.withOpacity(0.12),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(12),
              child: SvgPicture.string(
                _whatsAppSvg,
                width: 28,
                height: 28,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
