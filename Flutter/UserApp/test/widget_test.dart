import 'dart:async';

import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/clikgett_product_card.dart';
import 'package:fav_app/old/Models/Home/home_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

// Product card: flash-sale tag and bulk-price hint come from the product data.
BestItem _product({ProductDeal? deal, double? salePrice, List<BulkTier> tiers = const []}) => BestItem(
      productId: 1,
      productName: 'Test Oil 1 L',
      productImages: const [],
      productVariants: [
        ProductVariant(
          variantId: 10,
          productId: 1,
          metrictype: 'L',
          metricvalue: 1,
          availableQty: 20,
          maxQty: 5,
          price: 200,
          offerPrice: 179,
          salePrice: salePrice,
        ),
      ],
      deal: deal,
      bulkTiers: tiers,
    );

// Poppins is fetched at runtime and can't load under `flutter test`; the text
// still renders with the fallback font, so those load errors are dropped here.
Future<void> _pump(WidgetTester tester, BestItem product) async {
  await runZonedGuarded(
    () => tester.pumpWidget(MaterialApp(
      home: Scaffold(body: Center(child: SizedBox(width: 180, child: ClikgettProductCard(product: product, width: null)))),
    )),
    (error, stack) {
      if (!'$error'.contains('AssetManifest') && !'$error'.contains('google_fonts')) throw error;
    },
  );
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });
  setUp(() => Get.put(CartController()));
  tearDown(Get.reset);

  testWidgets('shows the sale price and a deal tag during a flash sale', (tester) async {
    final ends = DateTime.now().add(const Duration(days: 3));
    await _pump(tester, _product(deal: ProductDeal(name: 'Weekend sale', endsAt: ends), salePrice: 161));
    expect(find.textContaining('₹161'), findsWidgets);
    expect(find.textContaining('till'), findsOneWidget);
  });

  testWidgets('shows the bulk offer when there is no sale', (tester) async {
    await _pump(tester, _product(tiers: [BulkTier(minQuantity: 2, maxQuantity: 2, price: 356)]));
    expect(find.text('Buy 2 for ₹356'), findsOneWidget);
    expect(find.textContaining('₹179'), findsOneWidget);
  });

  testWidgets('ignores a bulk offer that is not cheaper', (tester) async {
    await _pump(tester, _product(tiers: [BulkTier(minQuantity: 2, maxQuantity: 2, price: 400)]));
    expect(find.textContaining('Buy 2'), findsNothing);
  });
}
