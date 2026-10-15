import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

/// Helper class to evaluate variant-level stock states for ClikGett UserApp.
class StockHelper {
  /// Evaluates stock status for a given variant's available quantity.
  ///
  /// Low-stock rules:
  /// - IF [availableQty] >= 10: Returns null (no message).
  /// - IF [availableQty] >= 1 AND [availableQty] < 10: Returns "Only X left".
  /// - IF [availableQty] == 0: Returns "Out of Stock".
  /// - IF [availableQty] is null or negative (< 0): Returns null (safe fallback).
  static String? getStockMessage(int? availableQty) {
    if (availableQty == null || availableQty < 0) {
      return null;
    }
    if (availableQty == 0) {
      return "Out of Stock";
    }
    if (availableQty < 10) {
      return "Only $availableQty left";
    }
    return null;
  }

  /// Returns true only if stock is between 1 and 9 (inclusive).
  static bool isLowStock(int? availableQty) {
    if (availableQty == null || availableQty < 1) {
      return false;
    }
    return availableQty < 10;
  }

  /// Returns true if stock is 0 or less.
  static bool isOutOfStock(int? availableQty) {
    if (availableQty == null) return false;
    return availableQty <= 0;
  }
}

/// Reusable Low Stock Badge Widget following the ClikGett design system.
class LowStockBadge extends StatelessWidget {
  final int? availableQty;
  final bool isCompact;

  const LowStockBadge({
    Key? key,
    required this.availableQty,
    this.isCompact = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (!StockHelper.isLowStock(availableQty)) {
      return const SizedBox.shrink();
    }

    final message = StockHelper.getStockMessage(availableQty);
    if (message == null) return const SizedBox.shrink();

    if (isCompact) {
      return Padding(
        padding: const EdgeInsets.only(top: 2),
        child: Text(
          message,
          style: TextStyle(
            fontSize: 12.sp,
            color: const Color(0xFFE65100),
            fontWeight: FontWeight.w700,
          ),
        ),
      );
    }

    return Padding(
      padding: EdgeInsets.only(top: 0.8.h, bottom: 0.4.h),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 2.2.w, vertical: 0.4.h),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF3E0),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: const Color(0xFFFFB74D), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              Icons.access_time_filled_rounded,
              size: 1.6.h,
              color: const Color(0xFFE65100),
            ),
            SizedBox(width: 1.2.w),
            Text(
              message,
              style: TextStyle(
                fontSize: 13.5.sp,
                color: const Color(0xFFE65100),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Variant Stock Text Widget for variant selectors and bottomsheets.
/// Displays "Out of Stock" (red) or "Only X left" (orange) or empty if stock >= 10.
class StockStatusText extends StatelessWidget {
  final int? availableQty;
  final double? fontSize;

  const StockStatusText({
    Key? key,
    required this.availableQty,
    this.fontSize,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final message = StockHelper.getStockMessage(availableQty);
    if (message == null) return const SizedBox.shrink();

    final isOut = StockHelper.isOutOfStock(availableQty);
    return Text(
      message,
      style: TextStyle(
        fontSize: fontSize ?? 13.sp,
        color: isOut ? Colors.red : const Color(0xFFE65100),
        fontWeight: FontWeight.w700,
      ),
    );
  }
}
