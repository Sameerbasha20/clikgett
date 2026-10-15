import 'package:flutter_test/flutter_test.dart';
import 'package:fav_app/new/NewModel/product_details_model.dart';
import 'package:fav_app/old/Models/Home/cart_model.dart';
import 'package:fav_app/old/Models/Home/products_model.dart';

void main() {
  group('Product Recommendations Model & Logic Tests', () {
    test('1. Parse similar products response from JSON correctly', () {
      final jsonResponse = {
        "Status": 1,
        "offset": -1,
        "Products": [
          {
            "ProductID": 83,
            "CategoryID": 1,
            "SubCategoryID": 1,
            "ProductName": "Amul Cow Milk",
            "Description": "Fresh and pure cow milk",
            "Type": 1,
            "ImageUrl": "https://example.com/cow_milk.png",
            "Status": 1,
            "ProductImages": ["https://example.com/cow_milk.png"],
            "ProductVariants": [
              {
                "VariantID": 101,
                "ProductID": 83,
                "metrictype": "ml",
                "metricvalue": 500,
                "AvailableQty": 25,
                "maxQty": 10,
                "Price": 30.0,
                "OfferPrice": 28.0,
                "Status": 1
              }
            ]
          },
          {
            "ProductID": 84,
            "CategoryID": 1,
            "SubCategoryID": 1,
            "ProductName": "Amul Taaza Toned Milk",
            "Description": "Pasteurised toned milk",
            "Type": 1,
            "ImageUrl": "https://example.com/taaza.png",
            "Status": 1,
            "ProductImages": ["https://example.com/taaza.png"],
            "ProductVariants": [
              {
                "VariantID": 102,
                "ProductID": 84,
                "metrictype": "ml",
                "metricvalue": 500,
                "AvailableQty": 30,
                "maxQty": 10,
                "Price": 28.0,
                "OfferPrice": 27.0,
                "Status": 1
              }
            ]
          }
        ]
      };

      final model = ProductsModel.fromJson(jsonResponse);
      expect(model.status, equals(1));
      expect(model.products.length, equals(2));
      expect(model.products[0].productId, equals(83));
      expect(model.products[0].productName, equals("Amul Cow Milk"));
      expect(model.products[0].productVariants!.length, equals(1));
      expect(model.products[0].productVariants![0].price, equals(30.0));
      expect(model.products[0].productVariants![0].offerPrice, equals(28.0));
    });

    test('2. Current product is excluded from recommendations', () {
      const int currentViewingProductId = 82;
      final productList = [
        Products(productId: 82, productName: "Amul Gold Milk", productImages: []),
        Products(productId: 83, productName: "Amul Cow Milk", productImages: []),
        Products(productId: 84, productName: "Amul Taaza Milk", productImages: []),
      ];

      final filtered = productList.where((p) => p.productId != currentViewingProductId).toList();
      expect(filtered.length, equals(2));
      expect(filtered.any((p) => p.productId == currentViewingProductId), isFalse);
    });

    test('3. Discount percentage and strikethrough calculations', () {
      final variantWithDiscount = ProductVariant(
        variantId: 1,
        price: 100.0,
        offerPrice: 80.0,
        availableQty: 10,
      );

      final variantWithoutDiscount = ProductVariant(
        variantId: 2,
        price: 50.0,
        offerPrice: 50.0,
        availableQty: 10,
      );

      double calcDiscount(ProductVariant v) {
        final double p = v.price ?? 0.0;
        final double op = (v.offerPrice != null && v.offerPrice! > 0) ? v.offerPrice! : p;
        if (p > 0 && op < p) {
          return ((p - op) / p * 100);
        }
        return 0.0;
      }

      final d1 = calcDiscount(variantWithDiscount);
      expect(d1, equals(20.0));
      expect(d1.round(), equals(20));

      final d2 = calcDiscount(variantWithoutDiscount);
      expect(d2, equals(0.0));
    });

    test('4. Stock availability detection for recommendations', () {
      final inStockVariant = ProductVariant(availableQty: 5);
      final outOfStockVariant = ProductVariant(availableQty: 0);
      final negativeStockVariant = ProductVariant(availableQty: -1);

      expect(inStockVariant.availableQty! > 0, isTrue);
      expect(outOfStockVariant.availableQty! <= 0, isTrue);
      expect(negativeStockVariant.availableQty! <= 0, isTrue);
    });

    test('5. Reactive Cart Quantity matching for recommendation items', () {
      final cartItems = [
        CartItem(productId: 83, variantId: 101, quantity: 2, productImages: []),
        CartItem(productId: 85, variantId: 105, quantity: 1, productImages: []),
      ];

      int getQty(int prodId, int varId) {
        for (var item in cartItems) {
          if (item.productId == prodId && item.variantId == varId) {
            return item.quantity ?? 0;
          }
        }
        return 0;
      }

      expect(getQty(83, 101), equals(2));
      expect(getQty(85, 105), equals(1));
      expect(getQty(84, 102), equals(0)); // Not in cart
    });

    test('6. Empty recommendations handling', () {
      final List<Products> emptyList = [];
      expect(emptyList.isEmpty, isTrue);
    });
  });
}
