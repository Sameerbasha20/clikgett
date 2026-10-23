// To parse this JSON data, do
//
//     final homeModel = homeModelFromJson(jsonString);

import 'dart:convert';
import 'package:fav_app/new/Services/common/server_date.dart';

/// MySQL DECIMAL columns arrive as text ("750.000"); accept numbers or text.
double? _toDouble(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

HomeModel homeModelFromJson(String str) => HomeModel.fromJson(json.decode(str));

String homeModelToJson(HomeModel data) => json.encode(data.toJson());

class HomeModel {
  int? status;
  int? Notifications;
  List<Banner>? banners;
  List<SpecialCategory>? specialCategories;
  List<BestItem>? bestItems;
  List<HomePageSectionProduct>? homePageSectionProducts;

  HomeModel({
    this.status,
    this.Notifications,
    this.banners,
    this.specialCategories,
    this.bestItems,
    this.homePageSectionProducts,
  });

  factory HomeModel.fromJson(Map<String, dynamic> json) => HomeModel(
        status: json["Status"],
        Notifications: json["Notifications"],
        banners: json["Banners"] == null
            ? []
            : List<Banner>.from(
                json["Banners"]!.map((x) => Banner.fromJson(x))),
        specialCategories: json["SpecialCategories"] == null
            ? []
            : List<SpecialCategory>.from(json["SpecialCategories"]!
                .map((x) => SpecialCategory.fromJson(x))),
        bestItems: json["BestItems"] == null
            ? []
            : List<BestItem>.from(
                json["BestItems"]!.map((x) => BestItem.fromJson(x))),
        homePageSectionProducts: json["HomePageSectionProducts"] == null
            ? []
            : List<HomePageSectionProduct>.from(json["HomePageSectionProducts"]!
                .map((x) => HomePageSectionProduct.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Banners": banners == null
            ? []
            : List<dynamic>.from(banners!.map((x) => x.toJson())),
        "SpecialCategories": specialCategories == null
            ? []
            : List<dynamic>.from(specialCategories!.map((x) => x.toJson())),
        "BestItems": bestItems == null
            ? []
            : List<dynamic>.from(bestItems!.map((x) => x.toJson())),
        "HomePageSectionProducts": homePageSectionProducts == null
            ? []
            : List<dynamic>.from(
                homePageSectionProducts!.map((x) => x.toJson())),
      };
}

class Banner {
  int? bannerId;
  String? bannerName;
  String? description;
  String? imageUrl;
  int? status;
  String? destinationType;
  int? destinationId;
  int? parentCategoryId;
  DateTime? createdAt;
  DateTime? updatedAt;

  Banner({
    this.bannerId,
    this.bannerName,
    this.description,
    this.imageUrl,
    this.status,
    this.destinationType,
    this.destinationId,
    this.parentCategoryId,
    this.createdAt,
    this.updatedAt,
  });

  factory Banner.fromJson(Map<String, dynamic> json) => Banner(
        bannerId: json["BannerID"],
        bannerName: json["BannerName"],
        description: json["Description"],
        imageUrl: json["ImageUrl"],
        status: json["Status"],
        destinationType: json["DestinationType"],
        destinationId: json["DestinationID"] != null
            ? int.tryParse(json["DestinationID"].toString())
            : null,
        parentCategoryId: json["ParentCategoryID"] != null
            ? int.tryParse(json["ParentCategoryID"].toString())
            : null,
        createdAt: json["CreatedAt"] == null
            ? null
            : serverDate(json["CreatedAt"])!,
        updatedAt: json["UpdatedAt"] == null
            ? null
            : serverDate(json["UpdatedAt"])!,
      );

  Map<String, dynamic> toJson() => {
        "BannerID": bannerId,
        "BannerName": bannerName,
        "Description": description,
        "ImageUrl": imageUrl,
        "Status": status,
        "DestinationType": destinationType,
        "DestinationID": destinationId,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
      };
}

class BestItem {
  int? productId;
  int? categoryId;
  int? subCategoryId;
  String? productName;
  Description? description;
  int? type;
  String? imageUrl;
  int? status;
  DateTime? createdAt;
  DateTime? updatedAt;
  List<ProductVariant>? productVariants;
  List<String> productImages;

  /// Running flash sale (null when none). Prices are on each variant's salePrice.
  ProductDeal? deal;

  /// Bulk prices: "Buy 2 for ₹356" bundles or "Buy 5+ @ ₹X each" slabs.
  List<BulkTier> bulkTiers;

  /// Cheapest membership price for this product (shown to everyone as "₹X with Gold").
  /// The signed-in member's own price is on each variant's memberPrice.
  MemberOffer? memberOffer;

  BestItem({
    this.productId,
    this.categoryId,
    this.subCategoryId,
    this.productName,
    this.description,
    this.type,
    this.imageUrl,
    this.status,
    this.createdAt,
    this.updatedAt,
    this.productVariants,
    required this.productImages,
    this.deal,
    this.bulkTiers = const [],
    this.memberOffer,
  });

  factory BestItem.fromJson(Map<String, dynamic> json) => BestItem(
        productId: json["ProductID"],
        categoryId: json["CategoryID"],
        subCategoryId: json["SubCategoryID"],
        productName: json["ProductName"],
        description: descriptionValues.map[json["Description"]],
        type: json["Type"],
        imageUrl: json["ImageUrl"],
        status: json["Status"],
        createdAt: json["CreatedAt"] == null
            ? null
            : serverDate(json["CreatedAt"])!,
        updatedAt: json["UpdatedAt"] == null
            ? null
            : serverDate(json["UpdatedAt"])!,
        productImages: json['ProductImages'] == null
            ? []
            : List<String>.from(json['ProductImages']),
        productVariants: json["ProductVariants"] == null
            ? []
            : List<ProductVariant>.from(json["ProductVariants"]!
                .map((x) => ProductVariant.fromJson(x))),
        deal: json["Deal"] is Map ? ProductDeal.fromJson(Map<String, dynamic>.from(json["Deal"])) : null,
        bulkTiers: json["BulkTiers"] is List
            ? (json["BulkTiers"] as List).whereType<Map>().map((t) => BulkTier.fromJson(Map<String, dynamic>.from(t))).toList()
            : const [],
        memberOffer: json["MemberOffer"] is Map ? MemberOffer.fromJson(Map<String, dynamic>.from(json["MemberOffer"])) : null,
      );

  Map<String, dynamic> toJson() => {
        "ProductID": productId,
        "CategoryID": categoryId,
        "SubCategoryID": subCategoryId,
        "ProductName": productName,
        "Description": descriptionValues.reverse[description],
        "Type": type,
        "ImageUrl": imageUrl,
        "Status": status,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
        'ProductImages': productImages,
        "ProductVariants": productVariants == null
            ? []
            : List<dynamic>.from(productVariants!.map((x) => x.toJson())),
      };
}

enum Description { NA, THE_400650_G }

final descriptionValues =
    EnumValues({"NA": Description.NA, "400~650g": Description.THE_400650_G});

class ProductVariant {
  int? variantId;
  int? productId;
  String? metrictype;
  double? metricvalue;
  int? availableQty;
  int? maxQty;
  double? price;
  double? offerPrice;
  /// Per-unit price when buying 2 or more (null when there is no buy-more deal).
  double? buy2Price;

  /// Flash-sale unit price, only when a sale is running and it's lower than offerPrice.
  double? salePrice;

  /// The signed-in member's price for this pack (null for non-members or no member price).
  double? memberPrice;
  int? status;
  DateTime? createdAt;
  DateTime? updatedAt;

  ProductVariant({
    this.variantId,
    this.productId,
    this.metrictype,
    this.metricvalue,
    this.availableQty,
    this.maxQty,
    this.price,
    this.offerPrice,
    this.buy2Price,
    this.salePrice,
    this.memberPrice,
    this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) => ProductVariant(
        variantId: json["VariantID"],
        productId: json["ProductID"],
        metrictype: json["metrictype"],
        metricvalue: json["metricvalue"] == null
            ? 0.0
            : (json["metricvalue"] is num
                ? (json["metricvalue"] as num).toDouble()
                : (double.tryParse(json["metricvalue"].toString()) ?? 0.0)),
        availableQty: json["AvailableQty"],
        maxQty: json["maxQty"],
        price: _toDouble(json["Price"]) ?? 0.0,
        offerPrice: _toDouble(json["OfferPrice"]) ?? 0.0,
        buy2Price: json["Buy2Price"] is num ? (json["Buy2Price"] as num).toDouble() : double.tryParse('${json["Buy2Price"] ?? ''}'),
        salePrice: _toDouble(json["SalePrice"]),
        memberPrice: _toDouble(json["MemberPrice"]),
        status: json["Status"],
        createdAt: json["CreatedAt"] == null
            ? null
            : serverDate(json["CreatedAt"])!,
        updatedAt: json["UpdatedAt"] == null
            ? null
            : serverDate(json["UpdatedAt"])!,
      );

  Map<String, dynamic> toJson() => {
        "VariantID": variantId,
        "ProductID": productId,
        "metrictype": metrictype,
        "metricvalue": metricvalue,
        "AvailableQty": availableQty,
        "maxQty": maxQty,
        "Price": price ?? 0.0,
        "OfferPrice": offerPrice ?? 0.0,
        "Buy2Price": buy2Price,
        "Status": status,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
      };
}

class HomePageSectionProduct {
  String? name;
  int? homeSectionId;
  String? description;
  String? imageUrl;
  int? displayOrder;
  String? sectionType;
  String? systemKey;
  bool? isBuiltIn;
  String? configurationJSON;
  List<BestItem>? products;
  List<SpecialCategory>? categories;

  HomePageSectionProduct({
    this.name,
    this.homeSectionId,
    this.description,
    this.imageUrl,
    this.displayOrder,
    this.sectionType,
    this.systemKey,
    this.isBuiltIn,
    this.configurationJSON,
    this.products,
    this.categories,
  });

  factory HomePageSectionProduct.fromJson(Map<String, dynamic> json) =>
      HomePageSectionProduct(
        name: json["Name"],
        homeSectionId: json["HomeSectionID"],
        description: json["Description"],
        imageUrl: json["ImageUrl"],
        displayOrder: json["DisplayOrder"],
        sectionType: json["SectionType"] ?? "selected_products",
        systemKey: json["SystemKey"],
        isBuiltIn: json["IsBuiltIn"] == 1 || json["IsBuiltIn"] == true,
        configurationJSON: json["ConfigurationJSON"] is String
            ? json["ConfigurationJSON"]
            : (json["ConfigurationJSON"] != null ? json["ConfigurationJSON"].toString() : null),
        products: json["Products"] == null
            ? []
            : List<BestItem>.from(
                json["Products"]!.map((x) => BestItem.fromJson(x))),
        categories: json["Categories"] == null
            ? []
            : List<SpecialCategory>.from(
                json["Categories"]!.map((x) => SpecialCategory.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Name": name,
        "HomeSectionID": homeSectionId,
        "Description": description,
        "ImageUrl": imageUrl,
        "DisplayOrder": displayOrder,
        "SectionType": sectionType,
        "SystemKey": systemKey,
        "IsBuiltIn": isBuiltIn == true ? 1 : 0,
        "ConfigurationJSON": configurationJSON,
        "Products": products == null
            ? []
            : List<dynamic>.from(products!.map((x) => x.toJson())),
        "Categories": categories == null
            ? []
            : List<dynamic>.from(categories!.map((x) => x.toJson())),
      };
}

class SpecialCategory {
  int? categoryId;
  String? categoryName;
  String? imageUrl;

  SpecialCategory({
    this.categoryId,
    this.categoryName,
    this.imageUrl,
  });

  factory SpecialCategory.fromJson(Map<String, dynamic> json) =>
      SpecialCategory(
        categoryId: json["CategoryID"],
        categoryName: json["CategoryName"],
        imageUrl: json["ImageUrl"],
      );

  Map<String, dynamic> toJson() => {
        "CategoryID": categoryId,
        "CategoryName": categoryName,
        "ImageUrl": imageUrl,
      };
}

class EnumValues<T> {
  Map<String, T> map;
  late Map<T, String> reverseMap;

  EnumValues(this.map);

  Map<T, String> get reverse {
    reverseMap = map.map((k, v) => MapEntry(v, k));
    return reverseMap;
  }
}


class MemberOffer {
  final String planName;
  final double price;

  MemberOffer({required this.planName, required this.price});

  factory MemberOffer.fromJson(Map<String, dynamic> j) => MemberOffer(
        planName: '${j["PlanName"] ?? 'Members'}',
        price: _toDouble(j["Price"]) ?? 0,
      );
}

/// Unit price the cart charges (server PricingEngine): the lower of the running flash-sale
/// price and the member's price when they apply, otherwise the offer price.
double sellingPriceOf(BestItem product, ProductVariant? v) {
  if (v == null) return 0;
  double price = v.offerPrice ?? v.price ?? 0;
  final sale = v.salePrice;
  if (product.deal != null && sale != null && sale < price) price = sale;
  final member = v.memberPrice;
  if (member != null && member > 0 && member < price) price = member;
  return price;
}

class ProductDeal {
  final String name;
  final DateTime? endsAt;

  ProductDeal({required this.name, this.endsAt});

  factory ProductDeal.fromJson(Map<String, dynamic> j) => ProductDeal(
        name: '${j["SaleName"] ?? ''}',
        endsAt: serverDate(j["EndDate"]),
      );
}

class BulkTier {
  final int? variantId;
  final int minQuantity;
  final int? maxQuantity;
  final double price;

  BulkTier({this.variantId, required this.minQuantity, this.maxQuantity, required this.price});

  /// Bundle (exact quantity, price is the total) vs slab (price per item).
  bool get isBundle => maxQuantity != null && maxQuantity == minQuantity;
  double get unitPrice => isBundle && minQuantity > 0 ? price / minQuantity : price;

  factory BulkTier.fromJson(Map<String, dynamic> j) => BulkTier(
        variantId: j["VariantID"] is num && (j["VariantID"] as num) > 0 ? (j["VariantID"] as num).toInt() : null,
        minQuantity: j["MinQuantity"] is num ? (j["MinQuantity"] as num).toInt() : int.tryParse('${j["MinQuantity"]}') ?? 0,
        maxQuantity: j["MaxQuantity"] is num ? (j["MaxQuantity"] as num).toInt() : int.tryParse('${j["MaxQuantity"] ?? ''}'),
        price: _toDouble(j["Price"]) ?? 0,
      );
}
