// To parse this JSON data, do
//
//     final subCategoriesModel = subCategoriesModelFromJson(jsonString);

import 'dart:convert';

SubCategoriesModel subCategoriesModelFromJson(String str) =>
    SubCategoriesModel.fromJson(json.decode(str));

String subCategoriesModelToJson(SubCategoriesModel data) =>
    json.encode(data.toJson());

class SubCategoriesModel {
  int? status;
  List<SubCategory>? subCategories;

  SubCategoriesModel({
    this.status,
    this.subCategories,
  });

  factory SubCategoriesModel.fromJson(Map<String, dynamic> json) =>
      SubCategoriesModel(
        status: json["Status"],
        subCategories: json["SubCategories"] == null
            ? []
            : List<SubCategory>.from(
                json["SubCategories"]!.map((x) => SubCategory.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "SubCategories": subCategories == null
            ? []
            : List<dynamic>.from(subCategories!.map((x) => x.toJson())),
      };
}

class SubCategory {
  int? subCategoryId;
  int? categoryId;
  String? subCategoryName;
  int? status;
  DateTime? createdAt;
  DateTime? updatedAt;

  SubCategory({
    this.subCategoryId,
    this.categoryId,
    this.subCategoryName,
    this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory SubCategory.fromJson(Map<String, dynamic> json) => SubCategory(
        subCategoryId: json["SubCategoryID"],
        categoryId: json["CategoryID"],
        subCategoryName: json["SubCategoryName"],
        status: json["Status"],
        createdAt: json["CreatedAt"] == null
            ? null
            : DateTime.parse(json["CreatedAt"]),
        updatedAt: json["UpdatedAt"] == null
            ? null
            : DateTime.parse(json["UpdatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "SubCategoryID": subCategoryId,
        "CategoryID": categoryId,
        "SubCategoryName": subCategoryName,
        "Status": status,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
      };
}
