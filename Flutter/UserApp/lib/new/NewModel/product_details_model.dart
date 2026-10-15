// To parse this JSON data, do
//
//     final productDetailsModel = productDetailsModelFromJson(jsonString);

import 'dart:convert';

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
            : DateTime.parse(json["CreatedAt"]),
        updatedAt: json["UpdatedAt"] == null
            ? null
            : DateTime.parse(json["UpdatedAt"]),
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
  int? status;
  DateTime? createdAt;
  DateTime? updatedAt;

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
        price: json["Price"]?.toDouble() ?? 0.0, // Ensure price is never null
        offerPrice:
            json["OfferPrice"]?.toDouble() ?? 0.0, // Handle null offerPrice
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
