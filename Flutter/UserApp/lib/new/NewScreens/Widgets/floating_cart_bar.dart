import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/Cart.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Reusable Floating "View Cart" Capsule for ClikGett Customer App.
/// Automatically reacts to [CartController] state:
/// - Hidden when cart is empty (0 items)
/// - Slides/fades into view when products exist in cart
/// - Shows item thumbnail, "View cart", item count ("1 item" / "3 items"), and total price
/// - Tapping smoothly navigates to CartScreen
class FloatingCartBar extends StatelessWidget {
  final EdgeInsetsGeometry? margin;

  const FloatingCartBar({Key? key, this.margin}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<CartController>()) {
      return const SizedBox.shrink();
    }

    final CartController cartController = Get.find<CartController>();

    return Obx(() {
      final items = cartController.cartItems;
      final int itemCount = cartController.totalCartItemCount;
      final bool hasItems = items.isNotEmpty && itemCount > 0;

      return AnimatedCrossFade(
        duration: const Duration(milliseconds: 280),
        firstCurve: Curves.easeInOut,
        secondCurve: Curves.easeInOut,
        sizeCurve: Curves.easeInOut,
        crossFadeState:
            hasItems ? CrossFadeState.showSecond : CrossFadeState.showFirst,
        firstChild: const SizedBox(
          width: double.infinity,
          height: 0,
        ),
        secondChild: hasItems
            ? _buildCapsule(context, cartController, items, itemCount)
            : const SizedBox(
                width: double.infinity,
                height: 0,
              ),
      );
    });
  }

  Widget _buildCapsule(
    BuildContext context,
    CartController cartController,
    List<dynamic> items,
    int itemCount,
  ) {
    // Extract thumbnail from last or first cart item
    String? thumbUrl;
    if (items.isNotEmpty) {
      final lastItem = items.last;
      if (lastItem.imageUrl != null &&
          lastItem.imageUrl.toString().trim().isNotEmpty) {
        thumbUrl = lastItem.imageUrl.toString().trim();
      } else if (lastItem.productImages != null &&
          lastItem.productImages is List &&
          (lastItem.productImages as List).isNotEmpty) {
        thumbUrl = (lastItem.productImages as List).first.toString().trim();
      }
    }

    // Amount text
    String amountStr = '';
    final rawAmount = cartController.ammount.value.isNotEmpty
        ? cartController.ammount.value
        : cartController.totalAmmount.value;
    final double? parsedAmount = double.tryParse(rawAmount);
    if (parsedAmount != null && parsedAmount > 0) {
      amountStr = '₹${parsedAmount.toStringAsFixed(0)} • ';
    }

    final String itemText =
        '$amountStr$itemCount ${itemCount == 1 ? 'item' : 'items'}';

    return SafeArea(
      top: false,
      bottom: false,
      child: Container(
        margin: margin ??
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(30),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => Cart(isFromHomeScreen: false),
                ),
              );
            },
            child: Ink(
              height: 56,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    primary,
                    primaryDark,
                  ],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: primary.withOpacity(0.35),
                    blurRadius: 12,
                    spreadRadius: 1,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: Colors.black.withOpacity(0.10),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Product Thumbnail or shopping icon
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: thumbUrl != null && thumbUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: thumbUrl,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => const Center(
                              child: SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Color(0xFF2E7D32),
                                ),
                              ),
                            ),
                            errorWidget: (_, __, ___) => const Icon(
                              Icons.shopping_bag_rounded,
                              size: 22,
                              color: Color(0xFF2E7D32),
                            ),
                          )
                        : const Icon(
                            Icons.shopping_bag_rounded,
                            size: 22,
                            color: Color(0xFF2E7D32),
                          ),
                  ),

                  const SizedBox(width: 12),

                  // Texts: "View cart" + count/amount
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'View cart',
                          style: GoogleFonts.montserrat(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          itemText,
                          style: GoogleFonts.montserrat(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withOpacity(0.92),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Forward action pill / chevron
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 14,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
