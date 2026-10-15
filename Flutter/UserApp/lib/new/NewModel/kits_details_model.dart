// To parse this JSON data, do
//
//     final kitsDetailsModel = kitsDetailsModelFromJson(jsonString);

import 'dart:convert';

KitsDetailsModel kitsDetailsModelFromJson(String str) =>
    KitsDetailsModel.fromJson(json.decode(str));

String kitsDetailsModelToJson(KitsDetailsModel data) =>
    json.encode(data.toJson());

class KitsDetailsModel {
  int? status;
  Kits? kits;

  KitsDetailsModel({
    this.status,
    this.kits,
  });

  factory KitsDetailsModel.fromJson(Map<String, dynamic> json) =>
      KitsDetailsModel(
        status: json["Status"],
        kits: json["Kits"] == null ? null : Kits.fromJson(json["Kits"]),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Kits": kits?.toJson(),
      };
}

class Kits {
  int? kitId;
  String? kitName;
  String? description;
  String? imageUrl;
  int? status;
  int? availableQty;
  int? maxQty;
  double? price;
  double? offerPrice;
  int? type;
  DateTime? createdAt;
  DateTime? updatedAt;
  List<KitItem>? kitItems;

  Kits({
    this.kitId,
    this.kitName,
    this.description,
    this.imageUrl,
    this.status,
    this.price,
    this.offerPrice,
    this.type,
    this.availableQty,
    this.maxQty,
    this.createdAt,
    this.updatedAt,
    this.kitItems,
  });

  factory Kits.fromJson(Map<String, dynamic> json) => Kits(
        kitId: json["KitID"],
        kitName: json["KitName"],
        description: json["Description"],
        imageUrl: json["ImageUrl"],
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
        kitItems: json["KitItems"] == null
            ? []
            : List<KitItem>.from(
                json["KitItems"]!.map((x) => KitItem.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "KitID": kitId,
        "KitName": kitName,
        "Description": description,
        "ImageUrl": imageUrl,
        "Status": status,
        "Price": price ?? 0.0,
        "OfferPrice": offerPrice ?? 0.0,
        "Type": type,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
        "KitItems": kitItems == null
            ? []
            : List<dynamic>.from(kitItems!.map((x) => x.toJson())),
      };
}

class KitItem {
  int? kitItemId;
  int? kitId;
  int? productId;
  int? variantId;
  DateTime? createdAt;
  DateTime? updatedAt;
  String? productName;
  String? metrictype;
  dynamic metricvalue;
  double? price;
  double? offerPrice;
  int? availableQty;
  int? maxQty;
  String? imageUrl;

  KitItem({
    this.kitItemId,
    this.kitId,
    this.productId,
    this.variantId,
    this.createdAt,
    this.updatedAt,
    this.productName,
    this.metrictype,
    this.price,
    this.availableQty,
    this.maxQty,
    this.offerPrice,
    this.metricvalue,
    this.imageUrl,
  });

  factory KitItem.fromJson(Map<String, dynamic> json) => KitItem(
        kitItemId: json["KitItemID"],
        kitId: json["KitID"],
        productId: json["ProductID"],
        variantId: json["VariantID"],
        createdAt: json["CreatedAt"] == null
            ? null
            : DateTime.parse(json["CreatedAt"]),
        updatedAt: json["UpdatedAt"] == null
            ? null
            : DateTime.parse(json["UpdatedAt"]),
        productName: json["ProductName"],
        price: json["Price"]?.toDouble() ?? 0.0,
        offerPrice: json["OfferPrice"]?.toDouble() ?? 0.0,
        availableQty: json["AvailableQty"],
        maxQty: json["maxQty"],
        metrictype: json["metrictype"],
        metricvalue: json["metricvalue"],
        imageUrl: json["ImageUrl"],
      );

  Map<String, dynamic> toJson() => {
        "KitItemID": kitItemId,
        "KitID": kitId,
        "ProductID": productId,
        "VariantID": variantId,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
        "ProductName": productName,
        "metrictype": metrictype,
        "metricvalue": metricvalue,
        "ImageUrl": imageUrl,
      };
}
