// To parse this JSON data, do
//
//     final homeModel = homeModelFromJson(jsonString);

import 'dart:convert';

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
            : DateTime.parse(json["CreatedAt"]),
        updatedAt: json["UpdatedAt"] == null
            ? null
            : DateTime.parse(json["UpdatedAt"]),
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
            : DateTime.parse(json["CreatedAt"]),
        updatedAt: json["UpdatedAt"] == null
            ? null
            : DateTime.parse(json["UpdatedAt"]),
        productImages: json['ProductImages'] == null
            ? []
            : List<String>.from(json['ProductImages']),
        productVariants: json["ProductVariants"] == null
            ? []
            : List<ProductVariant>.from(json["ProductVariants"]!
                .map((x) => ProductVariant.fromJson(x))),
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
        price: json["Price"]?.toDouble() ?? 0.0,
        offerPrice: json["OfferPrice"]?.toDouble() ?? 0.0,
        status: json["Status"],
        createdAt: json["CreatedAt"] == null
            ? null
            : DateTime.parse(json["CreatedAt"]),
        updatedAt: json["UpdatedAt"] == null
            ? null
            : DateTime.parse(json["UpdatedAt"]),
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
