// To parse this JSON data, do
//
//     final categoriesModel = categoriesModelFromJson(jsonString);

import 'dart:convert';

import '../Home/home_model.dart';

CategoriesModel categoriesModelFromJson(String str) =>
    CategoriesModel.fromJson(json.decode(str));

String categoriesModelToJson(CategoriesModel data) =>
    json.encode(data.toJson());

class CategoriesModel {
  int? status;
  List<SpecialCategory>? categories;

  CategoriesModel({
    this.status,
    this.categories,
  });

  factory CategoriesModel.fromJson(Map<String, dynamic> json) =>
      CategoriesModel(
        status: json["Status"],
        categories: json["Categories"] == null
            ? []
            : List<SpecialCategory>.from(
                json["Categories"]!.map((x) => SpecialCategory.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Categories": categories == null
            ? []
            : List<dynamic>.from(categories!.map((x) => x.toJson())),
      };
}

class Category {
  int? categoryId;
  String? categoryName;
  String? imageUrl;

  Category({
    this.categoryId,
    this.categoryName,
    this.imageUrl,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
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
