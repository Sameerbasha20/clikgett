// To parse this JSON data, do
//
//     final youMayLikeModel = youMayLikeModelFromJson(jsonString);

import 'dart:convert';

import 'product_details_model.dart';
import 'package:fav_app/new/Services/common/server_date.dart';

YouMayLikeModel youMayLikeModelFromJson(String str) =>
    YouMayLikeModel.fromJson(json.decode(str));

String youMayLikeModelToJson(YouMayLikeModel data) =>
    json.encode(data.toJson());

class YouMayLikeModel {
  int? status;
  List<Product>? products;

  YouMayLikeModel({
    this.status,
    this.products,
  });

  factory YouMayLikeModel.fromJson(Map<String, dynamic> json) =>
      YouMayLikeModel(
        status: json["Status"],
        products: json["Products"] == null
            ? []
            : List<Product>.from(
                json["Products"]!.map((x) => Product.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Products": products == null
            ? []
            : List<dynamic>.from(products!.map((x) => x.toJson())),
      };
}

class Product {
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

  Product({
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

  factory Product.fromJson(Map<String, dynamic> json) => Product(
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
