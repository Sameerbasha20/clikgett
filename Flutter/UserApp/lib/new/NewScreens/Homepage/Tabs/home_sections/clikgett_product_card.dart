import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as homeModel;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// The one product card used across Home, Categories, Search and similar-product
/// rails. One tap on ADD puts a single unit in the cart; the button then turns into
/// a -/+ stepper. Products with several pack sizes get a size picker.
class ClikgettProductCard extends StatefulWidget {
  final homeModel.BestItem product;

  /// Fixed width for horizontal rails; null fills the available width (grids).
  final double? width;
  final VoidCallback? onTap;

  const ClikgettProductCard({
    Key? key,
    required this.product,
    this.width = 156,
    this.onTap,
  }) : super(key: key);

  /// Builds a card from the backend's product JSON (Products row + ProductVariants).
  factory ClikgettProductCard.fromJson(Map<String, dynamic> json, {Key? key, double? width = 156, VoidCallback? onTap}) =>
      ClikgettProductCard(key: key, product: homeModel.BestItem.fromJson(json), width: width, onTap: onTap);

  @override
  State<ClikgettProductCard> createState() => _ClikgettProductCardState();
}

class _ClikgettProductCardState extends State<ClikgettProductCard> {
  final CartController cartController = Get.find<CartController>();
  homeModel.ProductVariant? selectedVariant;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final variants = widget.product.productVariants ?? [];
    // Prefer the first in-stock pack size.
    selectedVariant = variants.firstWhereOrNull((v) => (v.availableQty ?? 0) > 0) ?? (variants.isEmpty ? null : variants.first);
  }

  double get _sellingPrice => selectedVariant?.offerPrice ?? selectedVariant?.price ?? 0.0;
  double get _mrp => selectedVariant?.price ?? _sellingPrice;

  int get _discountPercent {
    if (_mrp > 0 && _sellingPrice < _mrp) return (((_mrp - _sellingPrice) / _mrp) * 100).round();
    return 0;
  }

  bool get _isOutOfStock {
    if (selectedVariant == null) return true;
    return (selectedVariant!.availableQty ?? 0) <= 0 || (selectedVariant!.maxQty ?? 0) <= 0;
  }

  int get _maxAllowed {
    final avail = selectedVariant?.availableQty ?? 0;
    final maxQ = selectedVariant?.maxQty ?? avail;
    return avail < maxQ ? avail : maxQ;
  }

  String get _packSize => "${_fmt(selectedVariant?.metricvalue)} ${selectedVariant?.metrictype ?? ''}".trim();

  static String _fmt(double? v) {
    if (v == null) return '';
    return v == v.roundToDouble() ? v.toInt().toString() : v.toString();
  }

  Future<bool> _ensureLoggedIn() async {
    final token = await CommonServices.getToken();
    if (token.isNotEmpty) return true;
    if (!mounted) return false;
    customToast(message: 'Please login to add items to your cart');
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
    return false;
  }

  Future<void> _setQuantity(int qty) async {
    if (_busy || selectedVariant == null) return;
    if (!await _ensureLoggedIn()) return;
    if (qty > _maxAllowed) {
      customToast(message: 'Only $_maxAllowed available');
      return;
    }
    setState(() => _busy = true);
    await cartController.updateQuantity(
      isScreenFromHome: true,
      productId: widget.product.productId ?? 0,
      variantId: selectedVariant!.variantId ?? 0,
      quantity: qty,
      isThroughProductsScreen: true,
      removeToast: true,
      categoryId: widget.product.categoryId,
      subCategoryId: widget.product.subCategoryId,
      context: context,
    );
    if (mounted) setState(() => _busy = false);
  }

  void _openDetails() {
    if (widget.onTap != null) return widget.onTap!();
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ItemDescription(
        id: widget.product.productId ?? 0,
        title: widget.product.productName ?? '',
        percent: _discountPercent.toDouble(),
      ),
    ));
  }

  void _openVariantPicker() {
    final variants = widget.product.productVariants ?? [];
    if (variants.length <= 1) return;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.product.productName ?? '',
                  maxLines: 2, overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: tColor)),
              const SizedBox(height: 4),
              Text('Choose a pack size', style: GoogleFonts.poppins(fontSize: 12, color: grey70)),
              const SizedBox(height: 8),
              ...variants.map((v) {
                final selected = v.variantId == selectedVariant?.variantId;
                final out = (v.availableQty ?? 0) <= 0;
                final sell = v.offerPrice ?? v.price ?? 0;
                final mrp = v.price ?? sell;
                return InkWell(
                  onTap: out
                      ? null
                      : () {
                          setState(() => selectedVariant = v);
                          Navigator.pop(ctx);
                        },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      color: selected ? primaryLight : white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: selected ? primary : cardBorder, width: selected ? 1.5 : 1),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text("${_fmt(v.metricvalue)} ${v.metrictype ?? ''}".trim(),
                              style: GoogleFonts.poppins(
                                  fontSize: 14, fontWeight: FontWeight.w600, color: out ? grey70 : tColor)),
                        ),
                        if (out)
                          Text('Out of stock', style: GoogleFonts.poppins(fontSize: 12, color: red))
                        else ...[
                          if (sell < mrp)
                            Text("₹${mrp.toStringAsFixed(0)}",
                                style: GoogleFonts.poppins(
                                    fontSize: 12, color: grey70, decoration: TextDecoration.lineThrough)),
                          const SizedBox(width: 6),
                          Text("₹${sell.toStringAsFixed(0)}",
                              style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: tColor)),
                        ],
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final images = product.productImages;
    final imageUrl = (images.isNotEmpty ? images.first : product.imageUrl) ?? '';
    final hasVariants = (product.productVariants?.length ?? 0) > 1;
    final buy2 = selectedVariant?.buy2Price;
    final showBuy2 = buy2 != null && buy2 > 0 && buy2 < _sellingPrice && !_isOutOfStock;

    return Container(
      width: widget.width,
      margin: widget.width == null ? EdgeInsets.zero : const EdgeInsets.only(right: 10, bottom: 4),
      decoration: BoxDecoration(
        color: white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cardBorder),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: _openDetails,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  Container(
                    height: 110,
                    width: double.infinity,
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: bg1,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(11)),
                    ),
                    child: Center(
                      child: Opacity(
                        opacity: _isOutOfStock ? 0.45 : 1,
                        child: CustomNetworkImage(url: imageUrl, height: 94, width: 94, fit: BoxFit.contain),
                      ),
                    ),
                  ),
                  if (_discountPercent > 0 && !_isOutOfStock)
                    Positioned(
                      top: 0,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: const BoxDecoration(
                          color: Color(0xFF2563EB),
                          borderRadius: BorderRadius.vertical(bottom: Radius.circular(6)),
                        ),
                        child: Text("$_discountPercent%\nOFF",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                                color: white, fontSize: 9, height: 1.1, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  if (_isOutOfStock)
                    Positioned(
                      bottom: 6,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: tColor5, borderRadius: BorderRadius.circular(6)),
                          child: Text('Out of stock',
                              style: GoogleFonts.poppins(color: white, fontSize: 10, fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(9, 8, 9, 9),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      height: 34,
                      child: Text(product.productName ?? '',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(
                              fontSize: 12, fontWeight: FontWeight.w600, color: tColor, height: 1.25)),
                    ),
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: hasVariants ? _openVariantPicker : null,
                      child: Container(
                        padding: hasVariants ? const EdgeInsets.symmetric(horizontal: 6, vertical: 2) : EdgeInsets.zero,
                        decoration: hasVariants
                            ? BoxDecoration(
                                color: bg3,
                                borderRadius: BorderRadius.circular(4),
                              )
                            : null,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_packSize.isNotEmpty ? _packSize : '1 unit',
                                style: GoogleFonts.poppins(fontSize: 11, color: grey70)),
                            if (hasVariants)
                              const Icon(Icons.keyboard_arrow_down_rounded, size: 14, color: grey70),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(
                      height: 16,
                      child: showBuy2
                          ? Text("Buy 2 @ ₹${buy2.toStringAsFixed(0)} each",
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600, color: primaryDark))
                          : null,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text("₹${_sellingPrice.toStringAsFixed(0)}",
                                  style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w700, color: tColor)),
                              if (_sellingPrice < _mrp)
                                Text("₹${_mrp.toStringAsFixed(0)}",
                                    style: GoogleFonts.poppins(
                                        fontSize: 10.5, color: grey70, decoration: TextDecoration.lineThrough)),
                            ],
                          ),
                        ),
                        Obx(() {
                          final item = cartController.cartItems.firstWhereOrNull(
                            (c) => c.productId == product.productId && c.variantId == selectedVariant?.variantId,
                          );
                          return _CartButton(
                            quantity: item?.quantity ?? 0,
                            disabled: _isOutOfStock,
                            busy: _busy,
                            onAdd: () => _setQuantity(1),
                            onIncrement: (q) => _setQuantity(q + 1),
                            onDecrement: (q) => _setQuantity(q - 1),
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

/// ADD button that turns into a -/+ stepper once the item is in the cart.
class _CartButton extends StatelessWidget {
  final int quantity;
  final bool disabled;
  final bool busy;
  final VoidCallback onAdd;
  final ValueChanged<int> onIncrement;
  final ValueChanged<int> onDecrement;

  const _CartButton({
    required this.quantity,
    required this.disabled,
    required this.busy,
    required this.onAdd,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    const height = 32.0;
    if (disabled) {
      return Container(
        height: height,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(color: bg3, borderRadius: BorderRadius.circular(8)),
        child: Text('ADD', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: grey70)),
      );
    }
    if (quantity <= 0) {
      return InkWell(
        onTap: busy ? null : onAdd,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          height: height,
          width: 64,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: primaryGhost,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: primary, width: 1.3),
          ),
          child: busy
              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: primary))
              : Text('ADD', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: primaryDark)),
        ),
      );
    }
    return Container(
      height: height,
      width: 72,
      decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(8)),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: busy ? null : () => onDecrement(quantity),
              child: const Icon(Icons.remove_rounded, size: 16, color: white),
            ),
          ),
          busy
              ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: white))
              : Text('$quantity', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: white)),
          Expanded(
            child: InkWell(
              onTap: busy ? null : () => onIncrement(quantity),
              child: const Icon(Icons.add_rounded, size: 16, color: white),
            ),
          ),
        ],
      ),
    );
  }
}
