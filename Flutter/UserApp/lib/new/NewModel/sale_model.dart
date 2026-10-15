import 'dart:convert';

ActiveSaleResponse activeSaleResponseFromJson(String str) =>
    ActiveSaleResponse.fromJson(json.decode(str));

String activeSaleResponseToJson(ActiveSaleResponse data) =>
    json.encode(data.toJson());

class ActiveSaleResponse {
  final int? status;
  final String? message;
  final List<SaleCampaign>? sales;

  ActiveSaleResponse({
    this.status,
    this.message,
    this.sales,
  });

  factory ActiveSaleResponse.fromJson(Map<String, dynamic> json) =>
      ActiveSaleResponse(
        status: json["Status"],
        message: json["Message"],
        sales: json["Sales"] == null
            ? []
            : List<SaleCampaign>.from(
                json["Sales"]!.map((x) => SaleCampaign.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Message": message,
        "Sales": sales == null
            ? []
            : List<dynamic>.from(sales!.map((x) => x.toJson())),
      };
}

class SaleCampaign {
  final int? saleId;
  final String? saleName;
  final String? description;
  final String? discountType;
  final double? discountValue;
  final DateTime? startDate;
  final DateTime? endDate;
  final int? status;
  final List<SaleProduct>? products;

  SaleCampaign({
    this.saleId,
    this.saleName,
    this.description,
    this.discountType,
    this.discountValue,
    this.startDate,
    this.endDate,
    this.status,
    this.products,
  });

  factory SaleCampaign.fromJson(Map<String, dynamic> json) => SaleCampaign(
        saleId: json["SaleID"],
        saleName: json["SaleName"],
        description: json["Description"],
        discountType: json["DiscountType"],
        discountValue: json["DiscountValue"] != null
            ? double.tryParse(json["DiscountValue"].toString())
            : null,
        startDate: json["StartDate"] == null
            ? null
            : DateTime.tryParse(json["StartDate"].toString()),
        endDate: json["EndDate"] == null
            ? null
            : DateTime.tryParse(json["EndDate"].toString()),
        status: json["Status"],
        products: json["Products"] == null
            ? []
            : List<SaleProduct>.from(
                json["Products"]!.map((x) => SaleProduct.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "SaleID": saleId,
        "SaleName": saleName,
        "Description": description,
        "DiscountType": discountType,
        "DiscountValue": discountValue,
        "StartDate": startDate?.toIso8601String(),
        "EndDate": endDate?.toIso8601String(),
        "Status": status,
        "Products": products == null
            ? []
            : List<dynamic>.from(products!.map((x) => x.toJson())),
      };
}

class SaleProduct {
  final int? productId;
  final int? categoryId;
  final int? subCategoryId;
  final String? productName;
  final String? description;
  final int? type;
  final String? imageUrl;
  final int? status;
  final double? price;
  final double? offerPrice;
  final double? salePrice;
  final int? discountPercent;
  final double? saleDiscount;
  final List<String>? productImages;
  final List<SaleProductVariant>? productVariants;

  SaleProduct({
    this.productId,
    this.categoryId,
    this.subCategoryId,
    this.productName,
    this.description,
    this.type,
    this.imageUrl,
    this.status,
    this.price,
    this.offerPrice,
    this.salePrice,
    this.discountPercent,
    this.saleDiscount,
    this.productImages,
    this.productVariants,
  });

  factory SaleProduct.fromJson(Map<String, dynamic> json) => SaleProduct(
        productId: json["ProductID"],
        categoryId: json["CategoryID"],
        subCategoryId: json["SubCategoryID"],
        productName: json["ProductName"],
        description: json["Description"],
        type: json["Type"],
        imageUrl: json["ImageUrl"],
        status: json["Status"],
        price: json["Price"] != null
            ? double.tryParse(json["Price"].toString())
            : null,
        offerPrice: json["OfferPrice"] != null
            ? double.tryParse(json["OfferPrice"].toString())
            : null,
        salePrice: json["SalePrice"] != null
            ? double.tryParse(json["SalePrice"].toString())
            : null,
        discountPercent: json["DiscountPercent"] != null
            ? int.tryParse(json["DiscountPercent"].toString())
            : null,
        saleDiscount: json["SaleDiscount"] != null
            ? double.tryParse(json["SaleDiscount"].toString())
            : null,
        productImages: json["ProductImages"] == null
            ? []
            : List<String>.from(json["ProductImages"]!.map((x) => x.toString())),
        productVariants: json["ProductVariants"] == null
            ? []
            : List<SaleProductVariant>.from(json["ProductVariants"]!
                .map((x) => SaleProductVariant.fromJson(x))),
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
        "Price": price,
        "OfferPrice": offerPrice,
        "SalePrice": salePrice,
        "DiscountPercent": discountPercent,
        "SaleDiscount": saleDiscount,
        "ProductImages": productImages,
        "ProductVariants": productVariants == null
            ? []
            : List<dynamic>.from(productVariants!.map((x) => x.toJson())),
      };
}

class SaleProductVariant {
  final int? variantId;
  final int? productId;
  final String? metrictype;
  final dynamic metricvalue;
  final int? availableQty;
  final double? price;
  final double? offerPrice;
  final double? salePrice;
  final int? discountPercent;
  final double? saleDiscount;
  final int? maxQty;
  final int? status;

  SaleProductVariant({
    this.variantId,
    this.productId,
    this.metrictype,
    this.metricvalue,
    this.availableQty,
    this.price,
    this.offerPrice,
    this.salePrice,
    this.discountPercent,
    this.saleDiscount,
    this.maxQty,
    this.status,
  });

  factory SaleProductVariant.fromJson(Map<String, dynamic> json) =>
      SaleProductVariant(
        variantId: json["VariantID"],
        productId: json["ProductID"],
        metrictype: json["metrictype"],
        metricvalue: json["metricvalue"],
        availableQty: json["AvailableQty"] != null
            ? int.tryParse(json["AvailableQty"].toString())
            : 0,
        price: json["Price"] != null
            ? double.tryParse(json["Price"].toString())
            : 0.0,
        offerPrice: json["OfferPrice"] != null
            ? double.tryParse(json["OfferPrice"].toString())
            : 0.0,
        salePrice: json["SalePrice"] != null
            ? double.tryParse(json["SalePrice"].toString())
            : null,
        discountPercent: json["DiscountPercent"] != null
            ? int.tryParse(json["DiscountPercent"].toString())
            : null,
        saleDiscount: json["SaleDiscount"] != null
            ? double.tryParse(json["SaleDiscount"].toString())
            : null,
        maxQty: json["maxQty"] != null
            ? int.tryParse(json["maxQty"].toString())
            : 5,
        status: json["status"] ?? json["Status"],
      );

  Map<String, dynamic> toJson() => {
        "VariantID": variantId,
        "ProductID": productId,
        "metrictype": metrictype,
        "metricvalue": metricvalue,
        "AvailableQty": availableQty,
        "Price": price,
        "OfferPrice": offerPrice,
        "SalePrice": salePrice,
        "DiscountPercent": discountPercent,
        "SaleDiscount": saleDiscount,
        "maxQty": maxQty,
        "Status": status,
      };
}
