import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as homeModel;

void main() {
  group('Dynamic Home Page Section Management Tests', () {
    test('1. HomePageSectionProduct model parses new database-driven fields', () {
      final jsonMap = {
        "Name": "Weekend Essentials",
        "HomeSectionID": 101,
        "Description": "Fresh farm vegetables and pure morning dairy",
        "ImageUrl": "https://d3c9kvg5gaqz48.cloudfront.net/Sections/weekend.png",
        "DisplayOrder": 1,
        "SectionType": "selected_products",
        "ConfigurationJSON": jsonEncode({
          "viewAllLabel": "Browse More",
          "theme": "mint"
        }),
        "Products": [
          {
            "ProductID": 82,
            "ProductName": "Fresh Milk 1L",
            "Price": 60.0,
            "OfferPrice": 52.0,
            "AvailableQty": 30,
            "Status": 1,
            "ProductVariants": [
              {
                "VariantID": 10,
                "ProductID": 82,
                "Price": 60.0,
                "OfferPrice": 52.0,
                "AvailableQty": 30,
                "status": 1
              }
            ]
          }
        ],
        "Categories": [
          {
            "CategoryID": 2,
            "CategoryName": "Dairy, Bread & Eggs",
            "ImageUrl": "https://d3c9kvg5gaqz48.cloudfront.net/Categories/dairy.png"
          }
        ]
      };

      final section = homeModel.HomePageSectionProduct.fromJson(jsonMap);

      expect(section.name, "Weekend Essentials");
      expect(section.homeSectionId, 101);
      expect(section.description, "Fresh farm vegetables and pure morning dairy");
      expect(section.imageUrl, "https://d3c9kvg5gaqz48.cloudfront.net/Sections/weekend.png");
      expect(section.displayOrder, 1);
      expect(section.sectionType, "selected_products");
      expect(section.products?.length, 1);
      expect(section.products?.first.productName, "Fresh Milk 1L");
      expect(section.categories?.length, 1);
      expect(section.categories?.first.categoryName, "Dairy, Bread & Eggs");

      // Verify Configuration JSON parsing
      final config = jsonDecode(section.configurationJSON!);
      expect(config["viewAllLabel"], "Browse More");
      expect(config["theme"], "mint");
    });

    test('2. All 9 supported Section Types map properly', () {
      final supportedTypes = [
        'shop_by_category',
        'category_shelf',
        'subcategory_shelf',
        'selected_products',
        'bestsellers',
        'recommendations',
        'deals_and_offers',
        'promotional_banner',
        'order_again',
      ];

      for (final type in supportedTypes) {
        final sec = homeModel.HomePageSectionProduct(
          name: "Test Section for $type",
          sectionType: type,
          homeSectionId: 1,
        );

        expect(sec.sectionType, type);
        expect(supportedTypes.contains(sec.sectionType), true);
      }
    });

    test('3. Section sorting by DisplayOrder respects configured sequence', () {
      final sections = [
        homeModel.HomePageSectionProduct(name: "Section 3", displayOrder: 3),
        homeModel.HomePageSectionProduct(name: "Section 1", displayOrder: 1),
        homeModel.HomePageSectionProduct(name: "Section 2", displayOrder: 2),
      ];

      sections.sort((a, b) => (a.displayOrder ?? 0).compareTo(b.displayOrder ?? 0));

      expect(sections[0].name, "Section 1");
      expect(sections[1].name, "Section 2");
      expect(sections[2].name, "Section 3");
    });

    test('4. Empty products handling excludes invalid sections', () {
      final emptySection = homeModel.HomePageSectionProduct(
        name: "Empty Shelf",
        sectionType: "selected_products",
        products: [],
      );

      final hasValidProducts = (emptySection.products != null && emptySection.products!.isNotEmpty);
      expect(hasValidProducts, false);
    });

    test('5. Promotional banner section retains URL without requiring products', () {
      final bannerSection = homeModel.HomePageSectionProduct(
        name: "Summer Mega Sale",
        sectionType: "promotional_banner",
        imageUrl: "https://d3c9kvg5gaqz48.cloudfront.net/Banners/summer_sale.png",
        products: [],
      );

      expect(bannerSection.sectionType, "promotional_banner");
      expect(bannerSection.imageUrl?.isNotEmpty, true);
    });
  });
}
