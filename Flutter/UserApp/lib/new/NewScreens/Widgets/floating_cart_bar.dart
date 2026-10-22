import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/Cart.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Blinkit-style "View cart" pill: a compact, centred green capsule with the
/// latest products' thumbnails, "View cart" and the item count. Hidden when the
/// cart is empty; place it floating over the page (e.g. Positioned bottom: 12).
class FloatingCartBar extends StatelessWidget {
  final EdgeInsetsGeometry? margin;

  const FloatingCartBar({Key? key, this.margin}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<CartController>()) return const SizedBox.shrink();
    final CartController cart = Get.find<CartController>();

    return Obx(() {
      final items = cart.cartItems.toList();
      final count = cart.totalCartItemCount;
      final visible = items.isNotEmpty && count > 0;
      return AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        transitionBuilder: (child, anim) => SlideTransition(
          position: Tween(begin: const Offset(0, 0.6), end: Offset.zero).animate(anim),
          child: FadeTransition(opacity: anim, child: child),
        ),
        child: visible
            ? Center(key: const ValueKey('cart-pill'), child: _pill(context, items, count))
            : const SizedBox.shrink(key: ValueKey('no-cart')),
      );
    });
  }

  /// Thumbnails of the most recently added products (up to 3).
  List<String> _thumbs(List<dynamic> items) {
    final urls = <String>[];
    for (final item in items.reversed) {
      String url = '${item.imageUrl ?? ''}'.trim();
      if (url.isEmpty || url == 'NA') {
        final images = item.productImages;
        if (images is List && images.isNotEmpty) url = '${images.first}'.trim();
      }
      if (url.startsWith('http') && !urls.contains(url)) urls.add(url);
      if (urls.length == 3) break;
    }
    return urls;
  }

  Widget _pill(BuildContext context, List<dynamic> items, int count) {
    final thumbs = _thumbs(items);
    const size = 38.0;
    const overlap = 22.0;
    final stackWidth = thumbs.isEmpty ? size : size + (thumbs.length - 1) * overlap;

    return Padding(
      padding: margin ?? const EdgeInsets.only(bottom: 4),
      child: Material(
        color: primary,
        elevation: 6,
        shadowColor: primary.withOpacity(0.45),
        shape: const StadiumBorder(),
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const Cart(isFromHomeScreen: false)),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 7, 10, 7),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: stackWidth,
                  height: size,
                  child: thumbs.isEmpty
                      ? _circle(child: const Icon(Icons.shopping_bag_rounded, size: 20, color: primaryDark))
                      : Stack(children: [
                          for (var i = thumbs.length - 1; i >= 0; i--)
                            Positioned(
                              left: i * overlap,
                              child: _circle(
                                child: CachedNetworkImage(
                                  imageUrl: thumbs[i],
                                  fit: BoxFit.contain,
                                  errorWidget: (_, __, ___) =>
                                      const Icon(Icons.shopping_bag_rounded, size: 18, color: primaryDark),
                                ),
                              ),
                            ),
                        ]),
                ),
                const SizedBox(width: 10),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('View cart',
                        style: GoogleFonts.poppins(fontSize: 15.5, fontWeight: FontWeight.w700, color: white, height: 1.1)),
                    Text('$count ${count == 1 ? 'item' : 'items'}',
                        style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: white.withOpacity(0.9), height: 1.2)),
                  ],
                ),
                const SizedBox(width: 14),
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(color: Colors.black.withOpacity(0.14), shape: BoxShape.circle),
                  child: const Icon(Icons.chevron_right_rounded, color: white, size: 22),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _circle({required Widget child}) => Container(
        width: 38,
        height: 38,
        padding: const EdgeInsets.all(4),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: white,
          shape: BoxShape.circle,
          border: Border.all(color: primary, width: 2),
        ),
        child: ClipOval(child: child),
      );
}
