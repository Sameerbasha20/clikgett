import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/category_controller.dart';
import 'package:fav_app/new/NewModel/product_details_model.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/NewScreens/Widgets/purchase_options_sheet.dart';

/// Similar Products horizontal recommendation section inspired by quick-commerce
/// UX (Blinkit style), fully integrated with ClikGett design system and live data.
class SimilarProductsWidget extends StatelessWidget {
  final int parentProductId;

  const SimilarProductsWidget({
    super.key,
    required this.parentProductId,
  });

  @override
  Widget build(BuildContext context) {
    final CategoryController categoryController = Get.find<CategoryController>();
    final CartController cartController = Get.find<CartController>();

    return Obx(() {
      // 1. Loading state: display shimmering/skeleton cards
      if (categoryController.isSimilarProductsLoading.isTrue) {
        return _buildLoadingSkeleton();
      }

      // 2. Empty state: graceful hidden state per specification
      final similarList = categoryController.similarProducts;
      if (similarList.isEmpty) {
        return const SizedBox.shrink();
      }

      // 3. Data-driven recommendation carousel
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2.0),
            child: Row(
              children: [
                Text(
                  'Similar products',
                  style: GoogleFonts.poppins(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: primaryLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${similarList.length}',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: primaryDark,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 258,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: similarList.length,
              separatorBuilder: (context, index) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final product = similarList[index];
                return _SimilarProductCard(
                  product: product,
                  parentProductId: parentProductId,
                  categoryController: categoryController,
                  cartController: cartController,
                );
              },
            ),
          ),
        ],
      );
    });
  }

  /// Shimmering skeleton loader for lightweight asynchronous loading
  Widget _buildLoadingSkeleton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Container(
          width: 140,
          height: 22,
          decoration: BoxDecoration(
            color: const Color(0xFFE2E8F0),
            borderRadius: BorderRadius.circular(6),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 258,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 3,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) => Container(
              width: 148,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: cardBorder, width: 1),
              ),
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 105,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: 100,
                    height: 14,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    width: 60,
                    height: 12,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const Spacer(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        width: 45,
                        height: 16,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      Container(
                        width: 55,
                        height: 28,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Individual product recommendation card with Blinkit styling, reactive cart state,
/// pack-size display, MRP strikethrough, discount badge, and seamless navigation.
class _SimilarProductCard extends StatefulWidget {
  final Products product;
  final int parentProductId;
  final CategoryController categoryController;
  final CartController cartController;

  const _SimilarProductCard({
    required this.product,
    required this.parentProductId,
    required this.categoryController,
    required this.cartController,
  });

  @override
  State<_SimilarProductCard> createState() => _SimilarProductCardState();
}

class _SimilarProductCardState extends State<_SimilarProductCard> {
  ProductVariant? selectedVariant;

  @override
  void initState() {
    super.initState();
    if (widget.product.productVariants != null &&
        widget.product.productVariants!.isNotEmpty) {
      selectedVariant = widget.product.productVariants!.first;
    }
  }

  @override
  Widget build(BuildContext context) {
    final variant = selectedVariant ??
        (widget.product.productVariants?.isNotEmpty == true
            ? widget.product.productVariants!.first
            : null);

    final double price = variant?.price ?? 0.0;
    final double offerPrice = (variant?.offerPrice != null && variant!.offerPrice! > 0)
        ? variant.offerPrice!
        : price;

    final double discountPercent = (price > 0 && offerPrice < price)
        ? ((price - offerPrice) / price * 100)
        : 0.0;

    final int availableQty = variant?.availableQty ?? 0;
    final int maxQty = variant?.maxQty ?? 99;
    final bool isOutOfStock = availableQty <= 0;

    final String imageUrl = widget.product.productImages.isNotEmpty
        ? widget.product.productImages.first
        : (widget.product.imageUrl ?? '');

    final String packSize = (variant != null &&
            variant.metricvalue != null &&
            variant.metrictype != null)
        ? '${variant.metricvalue} ${variant.metrictype}'
        : '';

    return InkWell(
      onTap: () => _navigateToProduct(discountPercent),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        width: 148,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: cardBorder, width: 1),
          boxShadow: softCardShadow,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top: Image area with discount & stock badges
            Stack(
              children: [
                Container(
                  height: 108,
                  width: double.infinity,
                  color: const Color(0xFFF8FAFC),
                  alignment: Alignment.center,
                  padding: const EdgeInsets.all(6),
                  child: imageUrl.isNotEmpty
                      ? CustomNetworkImage(
                          url: imageUrl,
                          fit: BoxFit.contain,
                          height: 96,
                          width: 96,
                        )
                      : const Icon(
                          Icons.image_outlined,
                          size: 40,
                          color: Color(0xFF94A3B8),
                        ),
                ),
                // Top-left discount badge
                if (discountPercent > 0)
                  Positioned(
                    top: 0,
                    left: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: const BoxDecoration(
                        color: primary,
                        borderRadius: BorderRadius.only(
                          bottomRight: Radius.circular(8),
                        ),
                      ),
                      child: Text(
                        '${discountPercent.round()}% OFF',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                // Out of stock overlay badge
                if (isOutOfStock)
                  Positioned(
                    bottom: 4,
                    left: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: redLight,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: red.withOpacity(0.3), width: 1),
                      ),
                      child: Text(
                        'Out of Stock',
                        style: GoogleFonts.poppins(
                          color: red,
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
              ],
            ),

            // Bottom: Product Details & Cart Actions
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Name
                  SizedBox(
                    height: 34,
                    child: Text(
                      widget.product.productName ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: tColor,
                        height: 1.25,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Pack size or Variant selector
                  if (widget.product.productVariants != null &&
                      widget.product.productVariants!.length > 1)
                    GestureDetector(
                      onTap: isOutOfStock ? null : () => _showVariantSelector(context),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              packSize,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: primaryDark,
                              ),
                            ),
                          ),
                          const Icon(
                            Icons.keyboard_arrow_down_rounded,
                            size: 14,
                            color: primaryDark,
                          ),
                        ],
                      ),
                    )
                  else
                    Text(
                      packSize,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: tColor3,
                      ),
                    ),
                  const SizedBox(height: 8),

                  // Price and ADD / Quantity Stepper
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Pricing Column
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '₹${offerPrice.toStringAsFixed(0)}',
                              style: GoogleFonts.poppins(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                color: tColor,
                              ),
                            ),
                            if (discountPercent > 0)
                              Text(
                                '₹${price.toStringAsFixed(0)}',
                                style: GoogleFonts.poppins(
                                  fontSize: 10,
                                  color: const Color(0xFF94A3B8),
                                  decoration: TextDecoration.lineThrough,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                          ],
                        ),
                      ),

                      // Reactive Cart Stepper / ADD Button
                      Obx(() {
                        final currentQty = _getCurrentQuantityInCart(variant);
                        return _buildCartAction(
                          currentQty: currentQty,
                          isOutOfStock: isOutOfStock,
                          availableQty: availableQty,
                          maxQty: maxQty,
                          variant: variant,
                        );
                      }),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Calculates real-time cart quantity for this variant
  int _getCurrentQuantityInCart(ProductVariant? variant) {
    if (variant == null) return 0;
    for (var item in widget.cartController.cartItems) {
      if (item.productId == widget.product.productId &&
          item.variantId == variant.variantId) {
        return item.quantity ?? 0;
      }
    }
    return 0;
  }

  /// Builds ADD button or quantity stepper
  Widget _buildCartAction({
    required int currentQty,
    required bool isOutOfStock,
    required int availableQty,
    required int maxQty,
    required ProductVariant? variant,
  }) {
    if (isOutOfStock) {
      return Container(
        height: 28,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(6),
        ),
        alignment: Alignment.center,
        child: Text(
          'Out',
          style: GoogleFonts.poppins(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF94A3B8),
          ),
        ),
      );
    }

    if (currentQty <= 0) {
      return InkWell(
        onTap: () => _handleAddTap(variant),
        borderRadius: BorderRadius.circular(6),
        child: Container(
          height: 28,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: primary, width: 1.2),
          ),
          alignment: Alignment.center,
          child: Text(
            'ADD',
            style: GoogleFonts.poppins(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: primary,
              letterSpacing: 0.2,
            ),
          ),
        ),
      );
    }

    // Active Stepper [-] Qty [+]
    return Container(
      height: 28,
      decoration: BoxDecoration(
        color: primary,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          InkWell(
            onTap: () => _updateQuantity(variant, currentQty - 1),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Icon(Icons.remove, size: 14, color: Colors.white),
            ),
          ),
          Text(
            '$currentQty',
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 11.5,
            ),
          ),
          InkWell(
            onTap: () {
              if (currentQty >= availableQty || currentQty >= maxQty) {
                customToast(message: 'Maximum quantity reached');
              } else {
                _updateQuantity(variant, currentQty + 1);
              }
            },
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Icon(Icons.add, size: 14, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  /// Handles initial ADD action (shows purchase options sheet if multi-variant, or adds directly)
  void _handleAddTap(ProductVariant? variant) {
    if (variant == null) return;

    if (widget.product.productVariants != null &&
        widget.product.productVariants!.length > 1) {
      _showVariantSelector(context);
    } else {
      _updateQuantity(variant, 1);
    }
  }

  /// Updates quantity in backend and reactive CartController
  Future<void> _updateQuantity(ProductVariant? variant, int newQty) async {
    if (variant == null) return;
    await widget.cartController.updateQuantity(
      productId: widget.product.productId ?? 0,
      variantId: variant.variantId ?? 0,
      quantity: newQty,
      isThroughProductsScreen: true,
      removeToast: true,
      categoryId: widget.product.categoryId,
      subCategoryId: widget.product.subCategoryId,
      context: context,
    );
  }

  /// Opens the purchase options sheet for selecting variants / quantities
  void _showVariantSelector(BuildContext context) {
    if (selectedVariant == null) return;

    showPurchaseOptionsSheet(
      context: context,
      selectedVariant: selectedVariant!,
      variants: widget.product.productVariants,
      productImages: widget.product.productImages,
      productName: widget.product.productName ?? '',
      currentQuantityInCart: _getCurrentQuantityInCart(selectedVariant),
      categoryId: widget.product.categoryId,
      subCategoryId: widget.product.subCategoryId,
    ).then((result) {
      if (result != null && result['added'] == true) {
        if (result['variant'] != null && result['variant'] is ProductVariant) {
          setState(() {
            selectedVariant = result['variant'] as ProductVariant;
          });
        }
      }
    });
  }

  /// Navigates to the selected product's details page and refreshes parent state upon returning
  void _navigateToProduct(double discountPercent) {
    Get.to(
      () => ItemDescription(
        id: widget.product.productId ?? 0,
        title: widget.product.productName ?? '',
        percent: discountPercent,
      ),
    )?.then((_) {
      if (!mounted) return;
      // Re-fetch parent product details and similar products upon popping back
      widget.categoryController.getProductsDetails(
        context: context,
        productId: widget.parentProductId,
      );
      widget.categoryController.getSimilarProducts(
        productId: widget.parentProductId,
      );
    });
  }
}
