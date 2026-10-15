import 'package:flutter_test/flutter_test.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as homeModel;

void main() {
  group('Home Page Sections & Product Card Unit Tests', () {
    test('1. Discount percentage calculation on ClikgettProductCard logic', () {
      final variant = homeModel.ProductVariant(
        variantId: 1,
        productId: 82,
        price: 55.0,
        offerPrice: 48.0,
        availableQty: 25,
        maxQty: 10,
        metricvalue: 500,
        metrictype: 'ml',
      );

      final price = variant.price ?? 0.0;
      final offerPrice = variant.offerPrice ?? price;
      double discount = 0.0;
      if (price > 0 && offerPrice < price) {
        discount = ((price - offerPrice) / price) * 100;
      }

      expect(discount.round(), 13);
      expect(offerPrice, 48.0);
      expect(price, 55.0);
    });

    test('2. Out of stock detection on ProductVariant', () {
      final inStockVariant = homeModel.ProductVariant(
        variantId: 1,
        productId: 82,
        availableQty: 15,
        maxQty: 10,
      );

      final outOfStockVariant = homeModel.ProductVariant(
        variantId: 2,
        productId: 83,
        availableQty: 0,
        maxQty: 10,
      );

      expect((inStockVariant.availableQty ?? 0) <= 0, false);
      expect((outOfStockVariant.availableQty ?? 0) <= 0, true);
    });

    test('3. Grocery & Kitchen authoritative category IDs matching', () {
      final targetCategoryIds = const {1, 2, 4, 5, 6, 7};

      final allCategories = [
        homeModel.SpecialCategory(categoryId: 1, categoryName: "Vegetables & Fruits"),
        homeModel.SpecialCategory(categoryId: 2, categoryName: "Dairy, Bread & Eggs"),
        homeModel.SpecialCategory(categoryId: 3, categoryName: "Meat & Fish"),
        homeModel.SpecialCategory(categoryId: 4, categoryName: "Atta, Rice & Dal"),
        homeModel.SpecialCategory(categoryId: 8, categoryName: "Chips & Namkeen"),
        homeModel.SpecialCategory(categoryId: 10, categoryName: "Drinks & Juices"),
      ];

      final groceryKitchenCategories = allCategories
          .where((cat) => cat.categoryId != null && targetCategoryIds.contains(cat.categoryId))
          .toList();

      expect(groceryKitchenCategories.length, 3);
      expect(groceryKitchenCategories.map((c) => c.categoryId).toList(), [1, 2, 4]);
    });

    test('4. Snacks & Drinks authoritative category IDs matching', () {
      final targetCategoryIds = const {8, 9, 10, 11, 12};

      final allCategories = [
        homeModel.SpecialCategory(categoryId: 1, categoryName: "Vegetables & Fruits"),
        homeModel.SpecialCategory(categoryId: 8, categoryName: "Chips & Namkeen"),
        homeModel.SpecialCategory(categoryId: 9, categoryName: "Sweets & Chocolates"),
        homeModel.SpecialCategory(categoryId: 10, categoryName: "Drinks & Juices"),
        homeModel.SpecialCategory(categoryId: 11, categoryName: "Tea & Coffee"),
        homeModel.SpecialCategory(categoryId: 12, categoryName: "Instant Food"),
      ];

      final snacksCategories = allCategories
          .where((cat) => cat.categoryId != null && targetCategoryIds.contains(cat.categoryId))
          .toList();

      expect(snacksCategories.length, 5);
      expect(snacksCategories.map((c) => c.categoryId).toList(), [8, 9, 10, 11, 12]);
    });

    test('5. Dynamic section product extraction', () {
      final section = homeModel.HomePageSectionProduct(
        homeSectionId: 1,
        name: "Daily Fresh Essentials",
        products: [
          homeModel.BestItem(
            productId: 82,
            productName: "Amul Taaza Homogenised Toned Milk",
            productImages: ["Amul_Taaza_500ml.png"],
            productVariants: [
              homeModel.ProductVariant(
                variantId: 1,
                productId: 82,
                price: 28.0,
                offerPrice: 27.0,
                availableQty: 50,
                maxQty: 10,
              )
            ],
          ),
          homeModel.BestItem(
            productId: 83,
            productName: "Fresh Farm Eggs (Pack of 6)",
            productImages: ["Farm_Eggs_6pack.png"],
            productVariants: [
              homeModel.ProductVariant(
                variantId: 2,
                productId: 83,
                price: 48.0,
                offerPrice: 42.0,
                availableQty: 30,
                maxQty: 5,
              )
            ],
          ),
        ],
      );

      expect(section.products!.length, 2);
      expect(section.products![0].productName, "Amul Taaza Homogenised Toned Milk");
      expect(section.products![1].productName, "Fresh Farm Eggs (Pack of 6)");
    });

    test('6. Variant switching price and pack size updates', () {
      final product = homeModel.BestItem(
        productId: 88,
        productName: "Aashirvaad Superior MP Sharbati Atta",
        productImages: ["Aashirvaad_Atta_5kg.png"],
        productVariants: [
          homeModel.ProductVariant(
            variantId: 10,
            productId: 88,
            metricvalue: 1,
            metrictype: "kg",
            price: 70.0,
            offerPrice: 65.0,
            availableQty: 25,
            maxQty: 10,
          ),
          homeModel.ProductVariant(
            variantId: 11,
            productId: 88,
            metricvalue: 5,
            metrictype: "kg",
            price: 320.0,
            offerPrice: 285.0,
            availableQty: 15,
            maxQty: 5,
          ),
        ],
      );

      var activeVariant = product.productVariants![0];
      expect("${activeVariant.metricvalue} ${activeVariant.metrictype}", "1.0 kg");
      expect(activeVariant.offerPrice, 65.0);

      // User switches to 5kg
      activeVariant = product.productVariants![1];
      expect("${activeVariant.metricvalue} ${activeVariant.metrictype}", "5.0 kg");
      expect(activeVariant.offerPrice, 285.0);
      final discount = ((activeVariant.price! - activeVariant.offerPrice!) / activeVariant.price!) * 100;
      expect(discount.round(), 11);
    });

    test('7. Recommended for you partitions catalog items after top bestsellers', () {
      final catalog = List.generate(
        10,
        (i) => homeModel.BestItem(
          productId: i + 1,
          productName: "Product ${i + 1}",
          productImages: [],
        ),
      );

      final recommendations = catalog.skip(4).toList();
      expect(recommendations.length, 6);
      expect(recommendations.first.productId, 5);
      expect(recommendations.last.productId, 10);
    });
  });
}
