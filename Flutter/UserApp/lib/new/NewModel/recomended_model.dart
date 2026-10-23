// To parse this JSON data, do
//
//     final recomendedModel = recomendedModelFromJson(jsonString);

import 'dart:convert';
import 'package:fav_app/new/Services/common/server_date.dart';

/// MySQL DECIMAL columns arrive as text ("750.000"); accept numbers or text.
double? _toDouble(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

RecomendedModel recomendedModelFromJson(String str) =>
    RecomendedModel.fromJson(json.decode(str));

String recomendedModelToJson(RecomendedModel data) =>
    json.encode(data.toJson());

class RecomendedModel {
  int? status;
  List<BestItem>? bestItems;

  RecomendedModel({
    this.status,
    this.bestItems,
  });

  factory RecomendedModel.fromJson(Map<String, dynamic> json) =>
      RecomendedModel(
        status: json["Status"],
        bestItems: json["BestItems"] == null
            ? []
            : List<BestItem>.from(
                json["BestItems"]!.map((x) => BestItem.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "BestItems": bestItems == null
            ? []
            : List<dynamic>.from(bestItems!.map((x) => x.toJson())),
      };
}

class BestItem {
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
  });

  factory BestItem.fromJson(Map<String, dynamic> json) => BestItem(
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
        "ProductVariants": productVariants == null
            ? []
            : List<dynamic>.from(productVariants!.map((x) => x.toJson())),
      };
}

class ProductVariant {
  int? variantId;
  int? productId;
  String? metrictype;
  dynamic? metricvalue;
  int? availableQty;
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
        metricvalue: json["metricvalue"],
        availableQty: json["AvailableQty"],
        price: _toDouble(json["Price"]) ?? 0.0,
        offerPrice: _toDouble(json["OfferPrice"]) ?? 0.0,
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
        "Price": price ?? 0.0,
        "OfferPrice": offerPrice ?? 0.0,
        "Status": status,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
      };
}
