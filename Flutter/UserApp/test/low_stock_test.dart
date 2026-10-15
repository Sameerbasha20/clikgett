import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/new/Constants/stock_helper.dart';
import 'package:fav_app/new/NewModel/product_details_model.dart';

void main() {
  group('Low-Stock Rule Tests', () {
    test('CASE 1: AvailableQty = 20 -> No low-stock message', () {
      expect(StockHelper.getStockMessage(20), isNull);
      expect(StockHelper.isLowStock(20), isFalse);
      expect(StockHelper.isOutOfStock(20), isFalse);
    });

    test('CASE 2: AvailableQty = 10 -> No low-stock message', () {
      expect(StockHelper.getStockMessage(10), isNull);
      expect(StockHelper.isLowStock(10), isFalse);
      expect(StockHelper.isOutOfStock(10), isFalse);
    });

    test('CASE 3: AvailableQty = 9 -> "Only 9 left"', () {
      expect(StockHelper.getStockMessage(9), equals('Only 9 left'));
      expect(StockHelper.isLowStock(9), isTrue);
      expect(StockHelper.isOutOfStock(9), isFalse);
    });

    test('CASE 4: AvailableQty = 5 -> "Only 5 left"', () {
      expect(StockHelper.getStockMessage(5), equals('Only 5 left'));
      expect(StockHelper.isLowStock(5), isTrue);
      expect(StockHelper.isOutOfStock(5), isFalse);
    });

    test('CASE 5: AvailableQty = 1 -> "Only 1 left"', () {
      expect(StockHelper.getStockMessage(1), equals('Only 1 left'));
      expect(StockHelper.isLowStock(1), isTrue);
      expect(StockHelper.isOutOfStock(1), isFalse);
    });

    test('CASE 6: AvailableQty = 0 -> "Out of Stock" (never "Only 0 left")', () {
      expect(StockHelper.getStockMessage(0), equals('Out of Stock'));
      expect(StockHelper.isLowStock(0), isFalse);
      expect(StockHelper.isOutOfStock(0), isTrue);
      expect(StockHelper.getStockMessage(0), isNot(contains('Only 0 left')));
    });

    test('CASE 7: Multiple variants evaluated independently', () {
      final variantA = ProductVariant(variantId: 1, metricvalue: 500, metrictype: 'ml', availableQty: 20);
      final variantB = ProductVariant(variantId: 2, metricvalue: 1, metrictype: 'L', availableQty: 6);
      final variantC = ProductVariant(variantId: 3, metricvalue: 2, metrictype: 'L', availableQty: 0);

      expect(StockHelper.getStockMessage(variantA.availableQty), isNull);
      expect(StockHelper.getStockMessage(variantB.availableQty), equals('Only 6 left'));
      expect(StockHelper.getStockMessage(variantC.availableQty), equals('Out of Stock'));
    });

    test('CASE 8: Change selected variant A -> B -> C -> A sequence', () {
      final variants = [
        ProductVariant(variantId: 1, availableQty: 20),
        ProductVariant(variantId: 2, availableQty: 6),
        ProductVariant(variantId: 3, availableQty: 0),
      ];

      // Select A
      var selected = variants[0];
      expect(StockHelper.getStockMessage(selected.availableQty), isNull);

      // Select B
      selected = variants[1];
      expect(StockHelper.getStockMessage(selected.availableQty), equals('Only 6 left'));

      // Select C
      selected = variants[2];
      expect(StockHelper.getStockMessage(selected.availableQty), equals('Out of Stock'));

      // Back to A
      selected = variants[0];
      expect(StockHelper.getStockMessage(selected.availableQty), isNull);
    });

    test('Null and malformed stock handling', () {
      expect(StockHelper.getStockMessage(null), isNull);
      expect(StockHelper.isLowStock(null), isFalse);
      expect(StockHelper.getStockMessage(-1), isNull);
      expect(StockHelper.isLowStock(-1), isFalse);
    });
  });

  group('Low-Stock Widget Tests', () {
    testWidgets('LowStockBadge renders "Only 4 left" when stock = 4', (tester) async {
      await tester.pumpWidget(
        ResponsiveSizer(
          builder: (context, orientation, screenType) {
            return const MaterialApp(
              home: Scaffold(
                body: LowStockBadge(availableQty: 4),
              ),
            );
          },
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Only 4 left'), findsOneWidget);
    });

    testWidgets('LowStockBadge renders nothing when stock >= 10', (tester) async {
      await tester.pumpWidget(
        ResponsiveSizer(
          builder: (context, orientation, screenType) {
            return const MaterialApp(
              home: Scaffold(
                body: LowStockBadge(availableQty: 15),
              ),
            );
          },
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('left'), findsNothing);
      expect(find.textContaining('Out of Stock'), findsNothing);
    });

    testWidgets('StockStatusText renders "Out of Stock" for 0 stock and "Only 3 left" for 3 stock', (tester) async {
      await tester.pumpWidget(
        ResponsiveSizer(
          builder: (context, orientation, screenType) {
            return const MaterialApp(
              home: Scaffold(
                body: Column(
                  children: [
                    StockStatusText(availableQty: 0),
                    StockStatusText(availableQty: 3),
                    StockStatusText(availableQty: 12),
                  ],
                ),
              ),
            );
          },
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Out of Stock'), findsOneWidget);
      expect(find.text('Only 3 left'), findsOneWidget);
      expect(find.textContaining('12'), findsNothing);
    });
  });
}
