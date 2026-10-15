import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/kits_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/NewScreens/Widgets/purchase_options_sheet.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as homeModel;
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Premium Blinkit-inspired product card tailored with ClikGett's green & white identity.
/// Features:
/// - Light neutral card background with subtle border and restrained shadow.
/// - Generous image area with contain fit inside a soft off-white container.
/// - Prominent discount badge (e.g. "X% OFF") in the top corner.
/// - Controlled 2-line product title with clean typography.
/// - Pack size formatting with variant selector dropdown trigger when multiple variants exist.
/// - Selling price in high contrast with struck-through MRP.
/// - Authoritative out-of-stock badge / overlay.
/// - Outlined ClikGett green ADD button that transforms into an interactive quantity stepper.
/// - Integrated with [CartController] and [showPurchaseOptionsSheet].
class ClikgettProductCard extends StatefulWidget {
  final homeModel.BestItem product;
  final double? width;
  final VoidCallback? onTap;

  const ClikgettProductCard({
    Key? key,
    required this.product,
    this.width = 156,
    this.onTap,
  }) : super(key: key);

  @override
  State<ClikgettProductCard> createState() => _ClikgettProductCardState();
}

class _ClikgettProductCardState extends State<ClikgettProductCard> {
  final CartController cartController = Get.find<CartController>();
  homeModel.ProductVariant? selectedVariant;
  String? token;

  @override
  void initState() {
    super.initState();
    _initSelectedVariant();
    _loadToken();
  }

  void _initSelectedVariant() {
    if (widget.product.productVariants != null &&
        widget.product.productVariants!.isNotEmpty) {
      selectedVariant = widget.product.productVariants!.first;
    }
  }

  Future<void> _loadToken() async {
    token = await CommonServices.getToken();
  }

  /// Calculates discount percentage for the active variant.
  double get _discountPercent {
    if (selectedVariant == null) return 0.0;
    final price = selectedVariant!.price ?? 0.0;
    final offerPrice = selectedVariant!.offerPrice ?? price;
    if (price > 0 && offerPrice < price) {
      return ((price - offerPrice) / price) * 100;
    }
    return 0.0;
  }

  /// Checks if the active variant is out of stock.
  bool get _isOutOfStock {
    if (selectedVariant == null) return true;
    final available = selectedVariant!.availableQty ?? 0;
    final maxQty = selectedVariant!.maxQty ?? 0;
    return available <= 0 || maxQty <= 0;
  }

  /// Opens the variant selection bottom sheet when multiple options exist.
  void _openVariantSelector(BuildContext context) {
    final variants = widget.product.productVariants;
    if (variants == null || variants.length <= 1) return;

    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      backgroundColor: Colors.white,
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Select Pack Size",
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1F2937),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                Text(
                  widget.product.productName ?? '',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: Colors.grey[600],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: variants.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (_, index) {
                      final v = variants[index];
                      final isSelected = v.variantId == selectedVariant?.variantId;
                      final vPrice = v.price ?? 0.0;
                      final vOffer = v.offerPrice ?? vPrice;
                      final isOut = (v.availableQty ?? 0) <= 0;

                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                        onTap: () {
                          setState(() {
                            selectedVariant = v;
                          });
                          Navigator.pop(ctx);
                        },
                        leading: Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSelected ? const Color(0xFF2E7D32) : Colors.grey[400]!,
                              width: 2,
                            ),
                          ),
                          child: isSelected
                              ? const Center(
                                  child: CircleAvatar(
                                    radius: 5,
                                    backgroundColor: Color(0xFF2E7D32),
                                  ),
                                )
                              : null,
                        ),
                        title: Row(
                          children: [
                            Text(
                              "${v.metricvalue ?? ''} ${v.metrictype ?? ''}".trim(),
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                color: const Color(0xFF1F2937),
                              ),
                            ),
                            if (isOut)
                              Container(
                                margin: const EdgeInsets.only(left: 8),
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.red[50],
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  "Out of stock",
                                  style: GoogleFonts.poppins(
                                    fontSize: 10,
                                    color: Colors.red[700],
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              "₹${vOffer.toStringAsFixed(0)}",
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF111827),
                              ),
                            ),
                            if (vOffer < vPrice) ...[
                              const SizedBox(width: 6),
                              Text(
                                "₹${vPrice.toStringAsFixed(0)}",
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  decoration: TextDecoration.lineThrough,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Triggers purchase options sheet or direct cart addition.
  Future<void> _handleInitialAdd(BuildContext context) async {
    token ??= await CommonServices.getToken();
    if (token == null || token!.isEmpty) {
      Fluttertoast.showToast(msg: "Please Login to add items to cart!");
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
      return;
    }

    if (selectedVariant == null) return;

    final result = await showPurchaseOptionsSheet(
      context: context,
      selectedVariant: selectedVariant!,
      variants: widget.product.productVariants,
      productImages: widget.product.productImages,
      productName: widget.product.productName ?? '',
      currentQuantityInCart: 0,
      categoryId: widget.product.categoryId,
      subCategoryId: widget.product.subCategoryId,
    );

    if (result != null && result['added'] == true) {
      final KitsController kits = Get.find<KitsController>();
      kits.updateComboList();
    }
  }

  /// Handles incrementing or decrementing quantity in cart.
  Future<void> _updateQuantity(BuildContext context, int newQty) async {
    token ??= await CommonServices.getToken();
    if (token == null || token!.isEmpty) {
      Fluttertoast.showToast(msg: "Please Login to update cart!");
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
      return;
    }

    if (selectedVariant == null) return;

    final maxQ = selectedVariant!.maxQty ?? 999;
    final availQ = selectedVariant!.availableQty ?? 0;

    if (newQty > availQ || newQty > maxQ) {
      customToast(message: 'Maximum available quantity reached');
      return;
    }

    await cartController.updateQuantity(
      isScreenFromHome: true,
      productId: widget.product.productId ?? 0,
      variantId: selectedVariant!.variantId ?? 0,
      quantity: newQty,
      isThroughProductsScreen: true,
      removeToast: true,
      categoryId: widget.product.categoryId,
      subCategoryId: widget.product.subCategoryId,
      context: context,
    );

    final KitsController kits = Get.find<KitsController>();
    kits.updateComboList();
  }

  @override
  Widget build(BuildContext context) {
    final discount = _discountPercent;
    final isOut = _isOutOfStock;
    final hasVariants = (widget.product.productVariants?.length ?? 0) > 1;

    final String imageUrl = (widget.product.productImages.isNotEmpty
        ? widget.product.productImages.first
        : widget.product.imageUrl) ?? '';

    final packSizeText = "${selectedVariant?.metricvalue ?? ''} ${selectedVariant?.metrictype ?? ''}".trim();
    final sellingPrice = selectedVariant?.offerPrice ?? selectedVariant?.price ?? 0.0;
    final originalPrice = selectedVariant?.price ?? sellingPrice;

    return Container(
      width: widget.width,
      margin: const EdgeInsets.only(right: 10, bottom: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: widget.onTap ??
              () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ItemDescription(
                      id: widget.product.productId ?? 0,
                      title: widget.product.productName ?? '',
                      percent: discount,
                    ),
                  ),
                );
              },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Image Container with Badges
              Stack(
                children: [
                  Container(
                    height: 112,
                    width: double.infinity,
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.vertical(top: Radius.circular(13)),
                    ),
                    child: Center(
                      child: CustomNetworkImage(
                        url: imageUrl,
                        height: 96,
                        width: 96,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),

                  // Discount Badge (Top-left)
                  if (discount > 0 && !isOut)
                    Positioned(
                      top: 6,
                      left: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF2E7D32), Color(0xFF43A047)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(6),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF2E7D32).withOpacity(0.3),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Text(
                          "${discount.round()}% OFF",
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 9.5,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                    ),

                  // Out of Stock Badge Overlay
                  if (isOut)
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.45),
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                        ),
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.red[600],
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              "Out of Stock",
                              style: GoogleFonts.poppins(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),

              // Product Info & Action Section
              Padding(
                padding: const EdgeInsets.all(9),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product Title (controlled 2 lines)
                    SizedBox(
                      height: 34,
                      child: Text(
                        widget.product.productName ?? '',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1F2937),
                          height: 1.25,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),

                    // Pack Size / Variant Selector
                    InkWell(
                      onTap: hasVariants ? () => _openVariantSelector(context) : null,
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: hasVariants ? 6 : 0,
                          vertical: hasVariants ? 2 : 0,
                        ),
                        decoration: hasVariants
                            ? BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: const Color(0xFFE5E7EB)),
                              )
                            : null,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              packSizeText.isNotEmpty ? packSizeText : 'Standard',
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF6B7280),
                              ),
                            ),
                            if (hasVariants) ...[
                              const SizedBox(width: 2),
                              const Icon(
                                Icons.keyboard_arrow_down_rounded,
                                size: 14,
                                color: Color(0xFF6B7280),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Price & Action Button Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Price column
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                "₹${sellingPrice.toStringAsFixed(0)}",
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF111827),
                                ),
                              ),
                              if (sellingPrice < originalPrice)
                                Text(
                                  "₹${originalPrice.toStringAsFixed(0)}",
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w400,
                                    decoration: TextDecoration.lineThrough,
                                    color: const Color(0xFF9CA3AF),
                                  ),
                                ),
                            ],
                          ),
                        ),

                        // Green Add / Quantity Stepper Button
                        Obx(() {
                          final currentVariantId = selectedVariant?.variantId;
                          final cartItem = cartController.cartItems.firstWhereOrNull(
                            (c) =>
                                c.productId == widget.product.productId &&
                                c.variantId == currentVariantId,
                          );
                          final qty = cartItem?.quantity ?? 0;

                          if (isOut) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: const Color(0xFFE5E7EB),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                "ADD",
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF9CA3AF),
                                ),
                              ),
                            );
                          }

                          if (qty <= 0) {
                            return InkWell(
                              onTap: () => _handleInitialAdd(context),
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: const Color(0xFF2E7D32),
                                    width: 1.5,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF2E7D32).withOpacity(0.12),
                                      blurRadius: 4,
                                      offset: const Offset(0, 1),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      "ADD",
                                      style: GoogleFonts.poppins(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF2E7D32),
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    const SizedBox(width: 2),
                                    const Icon(
                                      Icons.add_rounded,
                                      size: 14,
                                      color: Color(0xFF2E7D32),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }

                          // Interactive Stepper
                          return Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFF2E7D32),
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF2E7D32).withOpacity(0.25),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                InkWell(
                                  onTap: () => _updateQuantity(context, qty - 1),
                                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)),
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                    child: Icon(
                                      Icons.remove_rounded,
                                      size: 15,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 4),
                                  child: Text(
                                    "$qty",
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                InkWell(
                                  onTap: () => _updateQuantity(context, qty + 1),
                                  borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                    child: Icon(
                                      Icons.add_rounded,
                                      size: 15,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
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
      ),
    );
  }
}
