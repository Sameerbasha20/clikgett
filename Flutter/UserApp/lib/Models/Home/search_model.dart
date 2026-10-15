// To parse this JSON data, do
//
//     final searchModel = searchModelFromJson(jsonString);

import 'dart:convert';

SearchModel searchModelFromJson(String str) =>
    SearchModel.fromJson(json.decode(str));

String searchModelToJson(SearchModel data) => json.encode(data.toJson());

class SearchModel {
  SearchModel({
    required this.status,
    required this.products,
  });

  int status;
  List<Product> products;

  factory SearchModel.fromJson(Map<String, dynamic> json) => SearchModel(
        status: json["Status"],
        products: List<Product>.from(
            json["Products"].map((x) => Product.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Products": List<dynamic>.from(products.map((x) => x.toJson())),
      };
}

class Product {
  Product({
    required this.productId,
    required this.categoryId,
    required this.subCategoryId,
    required this.productName,
    required this.description,
    required this.type,
    required this.imageUrl,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.productVariants,
  });

  int productId;
  int categoryId;
  int subCategoryId;
  String productName;
  String description;
  int type;
  String imageUrl;
  int status;
  DateTime createdAt;
  DateTime updatedAt;
  List<ProductVariant> productVariants;

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        productId: json["ProductID"],
        categoryId: json["CategoryID"],
        subCategoryId: json["SubCategoryID"],
        productName: json["ProductName"],
        description: json["Description"],
        type: json["Type"],
        imageUrl: json["ImageUrl"],
        status: json["Status"],
        createdAt: DateTime.parse(json["CreatedAt"]),
        updatedAt: DateTime.parse(json["UpdatedAt"]),
        productVariants: List<ProductVariant>.from(
            json["ProductVariants"].map((x) => ProductVariant.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "ProductID": productId,
        "CategoryID": categoryId,
        "SubCategoryID": subCategoryId,
        "ProductName": productName,
        "Description": description,
        "Type": type,
        "ImageUrl": imageUrl,
        "Status": status,
        "CreatedAt": createdAt.toIso8601String(),
        "UpdatedAt": updatedAt.toIso8601String(),
        "ProductVariants":
            List<dynamic>.from(productVariants.map((x) => x.toJson())),
      };
}

class ProductVariant {
  ProductVariant({
    required this.variantId,
    required this.productId,
    required this.metrictype,
    required this.metricvalue,
    required this.availableQty,
    required this.price,
    required this.offerPrice,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  int variantId;
  int productId;
  String metrictype;
  int metricvalue;
  int availableQty;
  double price;
  double offerPrice;
  int status;
  DateTime createdAt;
  DateTime updatedAt;

  factory ProductVariant.fromJson(Map<String, dynamic> json) => ProductVariant(
        variantId: json["VariantID"],
        productId: json["ProductID"],
        metrictype: json["metrictype"],
        metricvalue: json["metricvalue"],
        availableQty: json["AvailableQty"],
        price: json["Price"]?.toDouble() ?? 0.0,
        // Ensure price is never null
        offerPrice: json["OfferPrice"]?.toDouble() ?? 0.0,
        // Handle null offerPrice
        status: json["Status"],
        createdAt: DateTime.parse(json["CreatedAt"]),
        updatedAt: DateTime.parse(json["UpdatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "VariantID": variantId,
        "ProductID": productId,
        "metrictype": metrictype,
        "metricvalue": metricvalue,
        "AvailableQty": availableQty,
        "Price": price ?? 0.0, // Ensure price is never null
        "OfferPrice": offerPrice ?? 0.0,
        "Status": status,
        "CreatedAt": createdAt.toIso8601String(),
        "UpdatedAt": updatedAt.toIso8601String(),
      };
}
