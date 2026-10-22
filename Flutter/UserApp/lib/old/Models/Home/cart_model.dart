// import '../../../new/NewModel/kits_details_model.dart';

// class CartModel {
//   int? status;
//   String? message;
//   Cart? cart;

//   CartModel({this.status, this.message, this.cart});

//   CartModel.fromJson(Map<String, dynamic> json) {
//     status = json['Status'];
//     message = json['Message'];
//     cart = json['Cart'] != null ? Cart.fromJson(json['Cart']) : null;
//   }

//   Map<String, dynamic> toJson() {
//     final Map<String, dynamic> data = <String, dynamic>{};
//     data['Status'] = status;
//     data['Message'] = message;
//     if (cart != null) {
//       data['Cart'] = cart!.toJson();
//     }
//     return data;
//   }
// }

// class Cart {
//   int? cartID;
//   int? userID;
//   int? isOrderLinked;
//   String? createdAt;
//   String? updatedAt;
//   List<CartItems>? cartItems;

//   Cart(
//       {this.cartID,
//       this.userID,
//       this.isOrderLinked,
//       this.createdAt,
//       this.updatedAt,
//       this.cartItems});

//   Cart.fromJson(Map<String, dynamic> json) {
//     cartID = json['CartID'];
//     userID = json['UserID'];
//     isOrderLinked = json['IsOrderLinked'];
//     createdAt = json['CreatedAt'];
//     updatedAt = json['UpdatedAt'];
//     if (json['CartItems'] != null) {
//       cartItems = <CartItems>[];
//       json['CartItems'].forEach((v) {
//         cartItems!.add(CartItems.fromJson(v));
//       });
//     }
//   }

//   Map<String, dynamic> toJson() {
//     final Map<String, dynamic> data = <String, dynamic>{};
//     data['CartID'] = cartID;
//     data['UserID'] = userID;
//     data['IsOrderLinked'] = isOrderLinked;
//     data['CreatedAt'] = createdAt;
//     data['UpdatedAt'] = updatedAt;
//     if (cartItems != null) {
//       data['CartItems'] = cartItems!.map((v) => v.toJson()).toList();
//     }
//     return data;
//   }
// }

// class CartItems {
//   int? type;
//   int? productID;
//   int? categoryID;
//   int? subCategoryID;
//   String? productName;
//   String? description;
//   String? imageUrl;
//   int? variantID;
//   int? quantity;
//   String? metrictype;
//   int? metricvalue;
//   int? availableQty;
//   double? price;
//   double? offerPrice;
//   int? status;
//   String? createdAt;
//   String? updatedAt;
//   List<KitItem>? kitItems;

//   CartItems(
//       {this.productID,
//       this.type,
//       this.categoryID,
//       this.subCategoryID,
//       this.productName,
//       this.description,
//       this.imageUrl,
//       this.variantID,
//       this.quantity,
//       this.kitItems,
//       this.metrictype,
//       this.metricvalue,
//       this.availableQty,
//       this.price,
//       this.offerPrice,
//       this.status,
//       this.createdAt,
//       this.updatedAt});

//   CartItems.fromJson(Map<String, dynamic> json) {
//     productID = json['ProductID'];
//     type = json['Type'];
//     categoryID = json['CategoryID'];
//     subCategoryID = json['SubCategoryID'];
//     productName = json['ProductName'];
//     description = json['Description'];
//     imageUrl = json['ImageUrl'];
//     variantID = json['VariantID'];
//     quantity = json['Quantity'];
//     metrictype = json['metrictype'];
//     metricvalue = json['metricvalue'];
//     availableQty = json['AvailableQty'];
//     price = json['Price'].toDouble();
//     offerPrice = json['OfferPrice'].toDouble();
//     status = json['Status'];
//     // kitItems = json["KitItems"] == null
//     //     ? []
//     //     : List<KitItem>.from(json["KitItems"]!.map((x) => KitItem.fromJson(x)));

//     if (json['KitItems'] != null) {
//       kitItems = <KitItem>[];
//       json['KitItems'].forEach((v) {
//         kitItems!.add(KitItem.fromJson(v));
//       });
//     }

//     createdAt = json['CreatedAt'];
//     updatedAt = json['UpdatedAt'];
//   }

//   Map<String, dynamic> toJson() {
//     final Map<String, dynamic> data = <String, dynamic>{};
//     data['ProductID'] = productID;
//     data['Type'] = type;
//     data['CategoryID'] = categoryID;
//     data['SubCategoryID'] = subCategoryID;
//     data['ProductName'] = productName;
//     data['Description'] = description;
//     data['ImageUrl'] = imageUrl;
//     data['VariantID'] = variantID;
//     data['Quantity'] = quantity;
//     data['metrictype'] = metrictype;
//     data['metricvalue'] = metricvalue;
//     data['AvailableQty'] = availableQty;
//     data['Price'] = price;
//     data['OfferPrice'] = offerPrice;
//     data['Status'] = status;
//     data['CreatedAt'] = createdAt;
//     data['UpdatedAt'] = updatedAt;

//     return data;
//   }
// }

// To parse this JSON data, do
//
//     final cartModel = cartModelFromJson(jsonString);

import 'dart:convert';

/// MySQL DECIMAL columns arrive as text ("750.000"); accept numbers or text.
double? _toDouble(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

CartModel cartModelFromJson(String str) => CartModel.fromJson(json.decode(str));

String cartModelToJson(CartModel data) => json.encode(data.toJson());

class CartModel {
  int? status;
  Cart? cart;
  String? message;

  CartModel({this.status, this.cart, this.message});

  factory CartModel.fromJson(Map<String, dynamic> json) => CartModel(
        status: json["Status"],
        message: json['Message'],
        cart: json["Cart"] == null ? null : Cart.fromJson(json["Cart"]),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Cart": cart?.toJson(),
      };
}

class Cart {
  int? cartId;
  double? DeliveryCharges;
  double? longDistanceFee;
  bool? isLongDistance;
  String? largeCartNotice;
  int? additionalDeliveryMinutes;
  var Distance;
  int? userId;
  int? isOrderLinked;
  DateTime? createdAt;
  DateTime? updatedAt;
  List<CartItem>? cartItems;
  List<ProductUnlockItem>? productUnlocks;

  Cart({
    this.cartId,
    this.DeliveryCharges,
    this.longDistanceFee,
    this.isLongDistance,
    this.largeCartNotice,
    this.additionalDeliveryMinutes,
    this.Distance,
    this.userId,
    this.isOrderLinked,
    this.createdAt,
    this.updatedAt,
    this.cartItems,
    this.productUnlocks,
  });

  factory Cart.fromJson(Map<String, dynamic> json) => Cart(
        cartId: json["CartID"],
        Distance: json["Distance"],
        userId: json["UserID"],
        DeliveryCharges: _toDouble(json["DeliveryCharges"]),
        longDistanceFee: _toDouble(json["LongDistanceFee"]) ?? 0.0,
        isLongDistance: json["IsLongDistance"] == true || json["IsLongDistance"] == 1,
        largeCartNotice: json["LargeCartNotice"],
        additionalDeliveryMinutes: json["AdditionalDeliveryMinutes"] != null ? int.tryParse(json["AdditionalDeliveryMinutes"].toString()) : 0,
        isOrderLinked: json["IsOrderLinked"],
        createdAt: json["CreatedAt"] == null
            ? null
            : DateTime.parse(json["CreatedAt"]),
        updatedAt: json["UpdatedAt"] == null
            ? null
            : DateTime.parse(json["UpdatedAt"]),
        cartItems: json["CartItems"] == null
            ? []
            : List<CartItem>.from(
                json["CartItems"]!.map((x) => CartItem.fromJson(x))),
        productUnlocks: json["ProductUnlocks"] == null
            ? []
            : List<ProductUnlockItem>.from(
                (json["ProductUnlocks"] as List).map((x) => ProductUnlockItem.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "CartID": cartId,
        "Distance": Distance,
        "UserID": userId,
        "DeliveryCharges": DeliveryCharges,
        "IsOrderLinked": isOrderLinked,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
        "CartItems": cartItems == null
            ? []
            : List<dynamic>.from(cartItems!.map((x) => x.toJson())),
      };
}

class CartItem {
  int? productId;
  int? type;
  String? productName;
  String? description;
  String? imageUrl;
  int? variantId;
  int? quantity;
  double? metricvalue;
  String? metrictype;
  double? price;
  double? offerPrice;
  int? kitId;
  int? categoryId;
  int? availableQty;
  int? maxQty;
  int? subCategoryId;
  List<String> productImages;
  List<KitItem>? kitItems;

  CartItem({
    this.productId,
    this.type,
    this.productName,
    this.description,
    this.imageUrl,
    this.variantId,
    this.quantity,
    this.metricvalue,
    this.metrictype,
    this.price,
    this.offerPrice,
    this.availableQty,
    this.maxQty,
    this.kitId,
    this.categoryId,
    this.subCategoryId,
    this.kitItems,
    required this.productImages,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        productId: json["ProductID"],
        type: json["Type"],
        productName: json["ProductName"],
        description: json["Description"],
        imageUrl: json["ImageUrl"],
        variantId: json["VariantID"],
        quantity: json["Quantity"],
        metricvalue: _toDouble(json["metricvalue"]) ?? 0.0,
        metrictype: json["metrictype"],
        price: _toDouble(json["Price"]) ?? 0.0,
        offerPrice: _toDouble(json["OfferPrice"]) ?? 0.0,
        kitId: json["KitID"],
        availableQty: json["AvailableQty"],
        productImages: List<String>.from(json['ProductImages']),
        maxQty: json["maxQty"],
        categoryId: json["CategoryID"],
        subCategoryId: json["SubCategoryID"],
        kitItems: json["KitItems"] == null
            ? []
            : List<KitItem>.from(
                json["KitItems"]!.map((x) => KitItem.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "ProductID": productId,
        "Type": type,
        "ProductName": productName,
        "Description": description,
        "ImageUrl": imageUrl,
        "VariantID": variantId,
        "Quantity": quantity,
        "metricvalue": metricvalue ?? 0.0,
        "maxQty": maxQty,
        "metrictype": metrictype,
        "Price": price ?? 0.0,
        "OfferPrice": offerPrice ?? 0.0,
        "KitID": kitId,
        'ProductImages': productImages,
        "CategoryID": categoryId,
        "SubCategoryID": subCategoryId,
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
  double? metricvalue;
  String? imageUrl;
  int? price;
  int? offerPrice;
  int? availableQty;

  KitItem({
    this.kitItemId,
    this.kitId,
    this.productId,
    this.variantId,
    this.createdAt,
    this.updatedAt,
    this.productName,
    this.metrictype,
    this.metricvalue,
    this.imageUrl,
    this.price,
    this.offerPrice,
    this.availableQty,
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
        metrictype: json["metrictype"],
        metricvalue: _toDouble(json["metricvalue"]),
        imageUrl: json["ImageUrl"],
        price: json["Price"],
        offerPrice: json["OfferPrice"],
        availableQty: json["AvailableQty"],
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
        "metricvalue": metricvalue ?? 0.0,
        "ImageUrl": imageUrl,
        "Price": price ?? 0.0,
        "OfferPrice": offerPrice ?? 0.0,
        "AvailableQty": availableQty,
      };
}

class ProductUnlockItem {
  final int? unlockId;
  final double? thresholdAmount;
  final int? productId;
  final int? variantId;
  final String productName;
  final dynamic productImages;
  final double price;
  final double offerPrice;
  final double unlockPrice;
  final String unit;
  final bool isUnlocked;
  final double amountNeeded;
  final String message;

  ProductUnlockItem({
    this.unlockId,
    this.thresholdAmount,
    this.productId,
    this.variantId,
    this.productName = '',
    this.productImages,
    this.price = 0.0,
    this.offerPrice = 0.0,
    this.unlockPrice = 0.0,
    this.unit = '',
    this.isUnlocked = false,
    this.amountNeeded = 0.0,
    this.message = '',
  });

  factory ProductUnlockItem.fromJson(Map<String, dynamic> json) {
    return ProductUnlockItem(
      unlockId: json["UnlockID"],
      thresholdAmount: _toDouble(json["ThresholdAmount"]) ?? null,
      productId: json["ProductID"],
      variantId: json["VariantID"],
      productName: json["ProductName"] ?? '',
      productImages: json["ProductImages"],
      price: _toDouble(json["Price"]) ?? 0.0,
      offerPrice: _toDouble(json["OfferPrice"]) ?? 0.0,
      unlockPrice: _toDouble(json["UnlockPrice"]) ?? 0.0,
      unit: json["Unit"] ?? '',
      isUnlocked: json["IsUnlocked"] == true || json["IsUnlocked"] == 1,
      amountNeeded: _toDouble(json["AmountNeeded"]) ?? 0.0,
      message: json["Message"] ?? '',
    );
  }
}
