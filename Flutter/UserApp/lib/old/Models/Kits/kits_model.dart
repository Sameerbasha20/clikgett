// To parse this JSON data, do
//
//     final kitsModel = kitsModelFromJson(jsonString);

import 'dart:convert';

KitsModel kitsModelFromJson(String str) => KitsModel.fromJson(json.decode(str));

String kitsModelToJson(KitsModel data) => json.encode(data.toJson());

class KitsModel {
  int? status;
  List<Product>? products;

  KitsModel({
    this.status,
    this.products,
  });

  factory KitsModel.fromJson(Map<String, dynamic> json) => KitsModel(
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
  int? kitId;
  String? kitName;
  String? description;
  String? imageUrl;
  List<String> productImages;

  int? status;
  int? availableQty;
  int? maxQty;
  double? price;
  double? offerPrice;
  int? type;
  DateTime? createdAt;
  DateTime? updatedAt;

  Product({
    this.kitId,
    this.kitName,
    this.description,
    this.imageUrl,
    required this.productImages,

    this.status,
    this.price,
    this.availableQty,
    this.maxQty,
    this.offerPrice,
    this.type,
    this.createdAt,
    this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        kitId: json["KitID"],
        kitName: json["KitName"],
        description: json["Description"],
        imageUrl: json["ImageUrl"],
    productImages: List<String>.from(json['ProductImages']),

    status: json["Status"],
        availableQty: json["AvailableQty"],
    maxQty: json["maxQty"],
    price: json["Price"]?.toDouble() ?? 0.0,
    offerPrice: json["OfferPrice"]?.toDouble() ?? 0.0,
        type: json["Type"],
        createdAt: json["CreatedAt"] == null
            ? null
            : DateTime.parse(json["CreatedAt"]),
        updatedAt: json["UpdatedAt"] == null
            ? null
            : DateTime.parse(json["UpdatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "KitID": kitId,
        "KitName": kitName,
        "Description": description,
        "ImageUrl": imageUrl,
    'ProductImages': productImages,

    "Status": status,
        "Price": price ?? 0.0,
        "OfferPrice": offerPrice ?? 0.0,
        "Type": type,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
      };
}
