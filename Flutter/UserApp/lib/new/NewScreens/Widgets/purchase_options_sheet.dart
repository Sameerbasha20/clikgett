// ignore_for_file: non_constant_identifier_names

import 'package:fav_app/new/Constants/number_format.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Constants/stock_helper.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

/// Normalized data holder supporting both `homeModel.ProductVariant` and
/// `ProductVariant` without type casting conflicts.
class PurchaseVariantData {
  final dynamic originalObject;
  final int? variantId;
  final int? productId;
  final String? metrictype;
  final dynamic metricvalue;
  final int? availableQty;
  final int? maxQty;
  final double? price;
  final double? offerPrice;

  PurchaseVariantData({
    this.originalObject,
    this.variantId,
    this.productId,
    this.metrictype,
    this.metricvalue,
    this.availableQty,
    this.maxQty,
    this.price,
    this.offerPrice,
  });

  factory PurchaseVariantData.from(dynamic v) {
    if (v == null) return PurchaseVariantData();
    if (v is PurchaseVariantData) return v;

    double? parseDouble(dynamic val) {
      if (val == null) return null;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString());
    }

    int? parseInt(dynamic val) {
      if (val == null) return null;
      if (val is int) return val;
      return int.tryParse(val.toString());
    }

    return PurchaseVariantData(
      originalObject: v,
      variantId: parseInt(v.variantId),
      productId: parseInt(v.productId),
      metrictype: v.metrictype?.toString(),
      metricvalue: v.metricvalue,
      availableQty: parseInt(v.availableQty),
      maxQty: parseInt(v.maxQty),
      price: parseDouble(v.price),
      offerPrice: parseDouble(v.offerPrice),
    );
  }

  String get displayWeight {
    final mv = metricvalue?.toString() ?? '';
    final mt = metrictype ?? '';
    if (mv.isEmpty && mt.isEmpty) return '';
    return '$mv $mt'.trim();
  }
}

/// Displays a premium Buy 1 / Buy 2 purchase options bottom sheet.
///
/// Features:
/// - Side-by-side Buy 1 and Buy 2 cards.
/// - Dynamic variant switching (if multiple variants are supplied).
/// - Dynamic price calculation and promotional savings badge.
/// - Authoritative stock checking (disabled/badges for out of stock or max qty).
/// - Integrated directly with [CartController.updateQuantity].
///
/// Returns a [Map] with:
///   - `'added'`: bool
///   - `'quantity'`: int (1 or 2)
///   - `'variant'`: the active variant object
Future<Map<String, dynamic>?> showPurchaseOptionsSheet({
  required BuildContext context,
  required dynamic selectedVariant,
  List<dynamic>? variants,
  required List<String> productImages,
  required String productName,
  required int currentQuantityInCart,
  int? categoryId,
  int? subCategoryId,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _PurchaseOptionsSheet(
      initialVariant: selectedVariant,
      variants: variants,
      productImages: productImages,
      productName: productName,
      currentQuantityInCart: currentQuantityInCart,
      categoryId: categoryId,
      subCategoryId: subCategoryId,
    ),
  );
}

class _PurchaseOptionsSheet extends StatefulWidget {
  final dynamic initialVariant;
  final List<dynamic>? variants;
  final List<String> productImages;
  final String productName;
  final int currentQuantityInCart;
  final int? categoryId;
  final int? subCategoryId;

  const _PurchaseOptionsSheet({
    Key? key,
    required this.initialVariant,
    this.variants,
    required this.productImages,
    required this.productName,
    required this.currentQuantityInCart,
    this.categoryId,
    this.subCategoryId,
  }) : super(key: key);

  @override
  State<_PurchaseOptionsSheet> createState() => _PurchaseOptionsSheetState();
}

class _PurchaseOptionsSheetState extends State<_PurchaseOptionsSheet> {
  final CartController cartController = Get.find();

  late List<PurchaseVariantData> _variantList;
  late int _selectedIndex;

  bool _isAddingOne = false;
  bool _isAddingTwo = false;

  @override
  void initState() {
    super.initState();
    final rawList = (widget.variants != null && widget.variants!.isNotEmpty)
        ? widget.variants!
        : [widget.initialVariant];

    _variantList = rawList.map((v) => PurchaseVariantData.from(v)).toList();

    // Determine initial index
    final initialData = PurchaseVariantData.from(widget.initialVariant);
    final matchIndex = _variantList.indexWhere(
      (v) => v.variantId != null && v.variantId == initialData.variantId,
    );
    _selectedIndex = matchIndex >= 0 ? matchIndex : 0;
  }

  PurchaseVariantData get _activeVariant => _variantList[_selectedIndex];

  double get _unitPrice => _activeVariant.offerPrice ?? 0.0;
  double get _originalPrice => _activeVariant.price ?? 0.0;
  int get _availableQty => _activeVariant.availableQty ?? 0;
  int get _maxQty => _activeVariant.maxQty ?? 999;

  /// Authoritative cart quantity for the actively selected variant
  int get _currentCartQty {
    try {
      final activeVid = _activeVariant.variantId;
      final activePid = _activeVariant.productId;
      if (activeVid == null) return widget.currentQuantityInCart;

      for (var item in cartController.cartItems) {
        if (item.productId == activePid && item.variantId == activeVid) {
          return item.quantity ?? 0;
        }
      }
    } catch (_) {}
    return 0;
  }

  double get _savingsPerUnit =>
      (_originalPrice > _unitPrice) ? (_originalPrice - _unitPrice) : 0.0;
  bool get _hasStandardDiscount => _savingsPerUnit > 0.0;
  double get _savingsForTwo => _savingsPerUnit * 2;

  bool _canAdd(int qty) {
    if (_availableQty <= 0) return false;
    final newTotal = _currentCartQty + qty;
    if (newTotal > _availableQty) return false;
    if (newTotal > _maxQty) return false;
    return true;
  }

  Future<void> _addToCart({required int qty}) async {
    if (_isAddingOne || _isAddingTwo) return;

    if (!_canAdd(qty)) {
      if (_availableQty <= 0) {
        customToast(message: 'This item is out of stock');
      } else if (qty == 2 && (_availableQty - _currentCartQty) < 2) {
        customToast(message: 'Only ${_availableQty - _currentCartQty} available in stock');
      } else {
        customToast(message: 'Maximum quantity reached');
      }
      return;
    }

    setState(() {
      if (qty == 1) {
        _isAddingOne = true;
      } else {
        _isAddingTwo = true;
      }
    });

    final newQty = _currentCartQty + qty;
    final success = await cartController.updateQuantity(
      productId: _activeVariant.productId ?? 0,
      variantId: _activeVariant.variantId ?? 0,
      quantity: newQty,
      isThroughProductsScreen: true,
      removeToast: false,
      isScreenFromHome: false,
      categoryId: widget.categoryId,
      subCategoryId: widget.subCategoryId,
      context: context,
    );

    if (mounted) {
      if (success) {
        Navigator.of(context).pop({
          'added': true,
          'quantity': qty,
          'variant': _activeVariant.originalObject,
        });
      } else {
        setState(() {
          _isAddingOne = false;
          _isAddingTwo = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 2.h,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildHandle(),
          _buildHeader(),
          if (_variantList.length > 1) ...[
            _buildVariantSelector(),
            SizedBox(height: 1.h),
          ],
          _buildStockInfo(),
          SizedBox(height: 1.2.h),
          _buildCards(),
          SizedBox(height: 1.5.h),
        ],
      ),
    );
  }

  Widget _buildHandle() {
    return Padding(
      padding: EdgeInsets.only(top: 1.2.h, bottom: 0.6.h),
      child: Container(
        width: 10.w,
        height: 4,
        decoration: BoxDecoration(
          color: Colors.grey[300],
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 0.5.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                customText(
                  text: 'Choose Quantity',
                  fontSize: 17.sp,
                  fontWeight: FontWeight.w700,
                  color: tColor,
                ),
                const SizedBox(height: 2),
                customText(
                  text: widget.productName,
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w500,
                  color: tColor.withOpacity(0.55),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => Navigator.of(context).pop(null),
            child: Container(
              width: 8.w,
              height: 8.w,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.close, size: 2.2.h, color: tColor3),
            ),
          ),
        ],
      ),
    );
  }

  /// Modern variant selector pills when multiple variants are available
  Widget _buildVariantSelector() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 0.8.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          customText(
            text: 'Select Option',
            fontSize: 12.sp,
            fontWeight: FontWeight.w600,
            color: tColor.withOpacity(0.6),
          ),
          SizedBox(height: 0.8.h),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: List.generate(_variantList.length, (index) {
                final v = _variantList[index];
                final isSelected = index == _selectedIndex;
                final bool isOut = (v.availableQty ?? 0) <= 0;

                return GestureDetector(
                  onTap: () {
                    if (_isAddingOne || _isAddingTwo) return;
                    setState(() {
                      _selectedIndex = index;
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    margin: EdgeInsets.only(right: 2.5.w),
                    padding: EdgeInsets.symmetric(
                      horizontal: 3.5.w,
                      vertical: 0.8.h,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? primary.withOpacity(0.08)
                          : (isOut ? Colors.grey[100] : Colors.white),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected
                            ? primary
                            : (isOut ? Colors.grey[300]! : Colors.grey[300]!),
                        width: isSelected ? 1.8 : 1.0,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        customText(
                          text: v.displayWeight.isNotEmpty
                              ? v.displayWeight
                              : 'Option ${index + 1}',
                          fontSize: 13.sp,
                          fontWeight:
                              isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected
                              ? primary
                              : (isOut ? Colors.grey[400]! : tColor),
                        ),
                        SizedBox(width: 1.5.w),
                        customText(
                          text: shelfPrice(v.offerPrice ?? 0),
                          fontSize: 12.sp,
                          fontWeight:
                              isSelected ? FontWeight.w700 : FontWeight.w600,
                          color: isSelected
                              ? primary
                              : (isOut ? Colors.grey[400]! : tColor3),
                        ),
                        if (isOut) ...[
                          SizedBox(width: 1.w),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 1,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.red[50],
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Out',
                              style: TextStyle(
                                fontSize: 9.sp,
                                color: Colors.red[600],
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStockInfo() {
    if (!StockHelper.isLowStock(_availableQty) &&
        !StockHelper.isOutOfStock(_availableQty)) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 5.w),
      child: Align(
        alignment: Alignment.centerLeft,
        child: StockStatusText(availableQty: _availableQty, fontSize: 13.sp),
      ),
    );
  }

  Widget _buildCards() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 4.w),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: _buildBuy1Card()),
            SizedBox(width: 3.w),
            Expanded(child: _buildBuy2Card()),
          ],
        ),
      ),
    );
  }

  Widget _buildBuy1Card() {
    final bool outOfStock = _availableQty <= 0;
    final bool maxReached = _currentCartQty >= _maxQty ||
        (_availableQty > 0 && _currentCartQty >= _availableQty);
    final bool canAdd = _canAdd(1) && !_isAddingOne && !_isAddingTwo;

    String buttonLabel = 'Add 1';
    if (outOfStock) {
      buttonLabel = 'Out of Stock';
    } else if (maxReached) {
      buttonLabel = 'Max Reached';
    }

    final subtitle = _activeVariant.displayWeight.isNotEmpty
        ? '1 × ${_activeVariant.displayWeight}'
        : '1 item';

    return _PurchaseCard(
      title: 'Buy 1',
      subtitle: subtitle,
      imageChild: _SingleProductImage(
        images: widget.productImages,
        size: 15.w,
      ),
      priceWidget: _PriceBlock(
        offerPrice: _unitPrice,
        originalPrice: _originalPrice,
      ),
      badgeWidget: null,
      actionButton: _ActionButton(
        label: buttonLabel,
        isLoading: _isAddingOne,
        enabled: canAdd,
        outOfStock: outOfStock || maxReached,
        outOfStockLabel: buttonLabel,
        onTap: () => _addToCart(qty: 1),
      ),
    );
  }

  Widget _buildBuy2Card() {
    final bool outOfStock = _availableQty <= 0;
    final int remainingStock = _availableQty - _currentCartQty;
    final bool onlyOneLeft = remainingStock == 1;
    final bool maxReached =
        remainingStock < 2 && !onlyOneLeft && !outOfStock;
    final bool canAdd = _canAdd(2) && !_isAddingOne && !_isAddingTwo;

    String buttonLabel = 'Add 2';
    if (outOfStock) {
      buttonLabel = 'Out of Stock';
    } else if (onlyOneLeft) {
      buttonLabel = 'Only 1 left';
    } else if (maxReached) {
      buttonLabel = 'Max Reached';
    }

    Widget? badge;
    if (_hasStandardDiscount && _savingsForTwo > 0) {
      badge = _SavingsBadge(savings: _savingsForTwo);
    }

    final subtitle = _activeVariant.displayWeight.isNotEmpty
        ? '2 × ${_activeVariant.displayWeight}'
        : '2 items';

    return _PurchaseCard(
      title: 'Buy 2',
      subtitle: subtitle,
      imageChild: _DoubleProductImage(
        images: widget.productImages,
        size: 15.w,
      ),
      priceWidget: _PriceBlock(
        offerPrice: _unitPrice * 2,
        originalPrice: _originalPrice > 0 ? _originalPrice * 2 : 0,
      ),
      badgeWidget: badge,
      actionButton: _ActionButton(
        label: buttonLabel,
        isLoading: _isAddingTwo,
        enabled: canAdd,
        outOfStock: outOfStock || onlyOneLeft || maxReached,
        outOfStockLabel: buttonLabel,
        onTap: () => _addToCart(qty: 2),
      ),
    );
  }
}

// ══════════════════════════════════════════════
// Card layout widget
// ══════════════════════════════════════════════

class _PurchaseCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget imageChild;
  final Widget priceWidget;
  final Widget? badgeWidget;
  final Widget actionButton;

  const _PurchaseCard({
    Key? key,
    required this.title,
    required this.subtitle,
    required this.imageChild,
    required this.priceWidget,
    required this.badgeWidget,
    required this.actionButton,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primary.withOpacity(0.25), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: primary.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header strip
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(vertical: 0.9.h),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    primary.withOpacity(0.12),
                    primary.withOpacity(0.06),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                children: [
                  customText(
                    text: title,
                    fontSize: 15.sp,
                    fontWeight: FontWeight.w700,
                    color: primary,
                  ),
                  const SizedBox(height: 1),
                  customText(
                    text: subtitle,
                    fontSize: 11.sp,
                    fontWeight: FontWeight.w500,
                    color: primary.withOpacity(0.70),
                  ),
                ],
              ),
            ),

            Padding(
              padding: EdgeInsets.symmetric(horizontal: 2.5.w, vertical: 1.4.h),
              child: Column(
                children: [
                  imageChild,
                  SizedBox(height: 1.h),
                  if (badgeWidget != null) ...[
                    badgeWidget!,
                    SizedBox(height: 0.6.h),
                  ] else ...[
                    SizedBox(height: 2.2.h),
                  ],
                  priceWidget,
                  SizedBox(height: 1.2.h),
                  actionButton,
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════
// Image sub-widgets
// ══════════════════════════════════════════════

class _SingleProductImage extends StatelessWidget {
  final List<String> images;
  final double size;

  const _SingleProductImage({
    Key? key,
    required this.images,
    required this.size,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (images.isEmpty) return _imageFallback(size);
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: CustomNetworkImage(
        url: images.first,
        width: size,
        height: size,
        fit: BoxFit.contain,
      ),
    );
  }
}

class _DoubleProductImage extends StatelessWidget {
  final List<String> images;
  final double size;

  const _DoubleProductImage({
    Key? key,
    required this.images,
    required this.size,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (images.isEmpty) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _imageFallback(size * 0.82),
          SizedBox(width: 2.w),
          _imageFallback(size * 0.82),
        ],
      );
    }
    final double s = size * 0.85;
    final double offset = s * 0.32;
    return SizedBox(
      height: s,
      width: s + offset,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            right: 0,
            child: Opacity(
              opacity: 0.85,
              child: _imgWidget(images.first, s * 0.92),
            ),
          ),
          Positioned(
            left: 0,
            child: _imgWidget(images.first, s),
          ),
        ],
      ),
    );
  }

  Widget _imgWidget(String url, double s) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 4,
              offset: const Offset(1, 1),
            ),
          ],
        ),
        child: CustomNetworkImage(
          url: url,
          width: s,
          height: s,
          fit: BoxFit.contain,
        ),
      ),
    );
  }
}

Widget _imageFallback(double size) {
  return Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: Colors.grey[100],
      borderRadius: BorderRadius.circular(10),
    ),
    child: Icon(
      Icons.image_not_supported_outlined,
      color: Colors.grey[400],
      size: size * 0.45,
    ),
  );
}

// ══════════════════════════════════════════════
// Price block
// ══════════════════════════════════════════════

class _PriceBlock extends StatelessWidget {
  final double offerPrice;
  final double originalPrice;

  const _PriceBlock({
    Key? key,
    required this.offerPrice,
    required this.originalPrice,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final bool hasDiscount = shelfHasDiscount(originalPrice, offerPrice);
    return Column(
      children: [
        customText(
          text: shelfPrice(offerPrice),
          fontSize: 16.sp,
          fontWeight: FontWeight.w800,
          color: tColor,
        ),
        if (hasDiscount)
          Text(
            shelfPrice(originalPrice),
            style: TextStyle(
              fontSize: 12.sp,
              color: tColor3,
              fontWeight: FontWeight.w500,
              decoration: TextDecoration.lineThrough,
              decorationColor: tColor3,
            ),
          )
        else
          SizedBox(height: 12.sp * 1.2),
      ],
    );
  }
}

// ══════════════════════════════════════════════
// Savings badge (Buy 2 only, shown when discount exists)
// ══════════════════════════════════════════════

class _SavingsBadge extends StatelessWidget {
  final double savings;

  const _SavingsBadge({Key? key, required this.savings}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 2.w, vertical: 0.4.h),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5E9),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: primary.withOpacity(0.4), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.local_offer_rounded, size: 1.5.h, color: primary),
          SizedBox(width: 1.w),
          customText(
            text: 'Save ${money(savings)}',
            fontSize: 11.sp,
            fontWeight: FontWeight.w700,
            color: primary,
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════
// Action button
// ══════════════════════════════════════════════

class _ActionButton extends StatelessWidget {
  final String label;
  final bool isLoading;
  final bool enabled;
  final bool outOfStock;
  final String outOfStockLabel;
  final VoidCallback onTap;

  const _ActionButton({
    Key? key,
    required this.label,
    required this.isLoading,
    required this.enabled,
    required this.outOfStock,
    required this.onTap,
    this.outOfStockLabel = 'Out of Stock',
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (outOfStock) {
      return Container(
        width: double.infinity,
        padding: EdgeInsets.symmetric(vertical: 1.1.h),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey[300]!, width: 1),
        ),
        alignment: Alignment.center,
        child: customText(
          text: outOfStockLabel,
          fontSize: 12.sp,
          fontWeight: FontWeight.w600,
          color: Colors.red[400]!,
        ),
      );
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: enabled ? onTap : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: EdgeInsets.symmetric(vertical: 1.1.h),
          decoration: BoxDecoration(
            gradient: enabled
                ? const LinearGradient(
                    colors: [Color(0xFF26A860), Color(0xFF1A8C4E)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            color: enabled ? null : Colors.grey[300],
            borderRadius: BorderRadius.circular(10),
            boxShadow: enabled
                ? [
                    BoxShadow(
                      color: primary.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: isLoading
              ? SizedBox(
                  height: 2.h,
                  width: 2.h,
                  child: const CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : customText(
                  text: label,
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
        ),
      ),
    );
  }
}
