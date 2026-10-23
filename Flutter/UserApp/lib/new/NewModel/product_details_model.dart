// To parse this JSON data, do
//
//     final productDetailsModel = productDetailsModelFromJson(jsonString);

import 'dart:convert';
import 'package:fav_app/new/Services/common/server_date.dart';

/// MySQL DECIMAL columns arrive as text ("750.000"); accept numbers or text.
double? _toDouble(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

ProductDetailsModel productDetailsModelFromJson(String str) =>
    ProductDetailsModel.fromJson(json.decode(str));

String productDetailsModelToJson(ProductDetailsModel data) =>
    json.encode(data.toJson());

class ProductDetailsModel {
  int? status;
  Products? products;

  ProductDetailsModel({
    this.status,
    this.products,
  });

  factory ProductDetailsModel.fromJson(Map<String, dynamic> json) =>
      ProductDetailsModel(
        status: json["Status"],
        products: json["Products"] == null
            ? null
            : Products.fromJson(json["Products"]),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Products": products?.toJson(),
      };
}

class Products {
  int? productId;
  int? categoryId;
  int? subCategoryId;
  String? productName;
  String? description;
  int? type;
  String? imageUrl;
  int? status;
  DateTime? createdAt;
  DateTime? updatedAt;
  List<ProductVariant>? productVariants;
  List<String> productImages;

  Products({
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

  factory Products.fromJson(Map<String, dynamic> json) => Products(
        productId: json["ProductID"],
        categoryId: json["CategoryID"],
        subCategoryId: json["SubCategoryID"],
        productName: json["ProductName"],
        description: json["Description"],
        type: json["Type"],
        imageUrl: json["ImageUrl"],
        status: json["Status"],
        createdAt: json["CreatedAt"] == null
            ? null
            : serverDate(json["CreatedAt"])!,
        updatedAt: json["UpdatedAt"] == null
            ? null
            : serverDate(json["UpdatedAt"])!,
        productImages: List<String>.from(json['ProductImages']),
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
        "Description": description,
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

class ProductVariant {
  int? variantId;
  int? productId;
  String? metrictype;
  String? ExpiryDate;
  dynamic metricvalue;
  int? availableQty;
  int? maxQty;
  double? price;
  double? offerPrice;
  /// Flash-sale price (only sent while a sale runs and it's lower than offerPrice).
  double? salePrice;
  /// The signed-in member's price (only sent when it's lower than offerPrice).
  double? memberPrice;
  int? status;
  DateTime? createdAt;
  DateTime? updatedAt;

  /// Unit price the cart charges: the lowest of offer, sale and member price.
  double get sellingPrice {
    double best = offerPrice ?? price ?? 0;
    for (final p in [salePrice, memberPrice]) {
      if (p != null && p > 0 && p < best) best = p;
    }
    return best;
  }

  ProductVariant({
    this.variantId,
    this.productId,
    this.metrictype,
    this.ExpiryDate,
    this.metricvalue,
    this.availableQty,
    this.maxQty,
    this.price,
    this.offerPrice,
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
        ExpiryDate: json["ExpiryDate"],
        metricvalue: json["metricvalue"],
        availableQty: json["AvailableQty"],
        maxQty: json["maxQty"],
        price: _toDouble(json["Price"]) ?? 0.0, // Ensure price is never null
        offerPrice:
            _toDouble(json["OfferPrice"]) ?? 0.0, // Handle null offerPrice
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
        "ExpiryDate": ExpiryDate,
        "metricvalue": metricvalue,
        "AvailableQty": availableQty,
        "maxQty": maxQty,
        "Price": price ?? 0.0, // Ensure price is never null
        "OfferPrice": offerPrice ?? 0.0,
        "Status": status,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
      };
}
