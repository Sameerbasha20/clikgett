// To parse this JSON data, do
//
//     final ordersdetailsmodel = ordersdetailsmodelFromJson(jsonString);

import 'dart:convert';
import 'package:fav_app/new/Services/common/server_date.dart';

/// MySQL DECIMAL columns arrive as text ("750.000"); accept numbers or text.
double? _toDouble(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

Ordersdetailsmodel ordersdetailsmodelFromJson(String str) =>
    Ordersdetailsmodel.fromJson(json.decode(str));

String ordersdetailsmodelToJson(Ordersdetailsmodel data) =>
    json.encode(data.toJson());

class Ordersdetailsmodel {
  int? status;
  Orders? orders;

  Ordersdetailsmodel({
    this.status,
    this.orders,
  });

  factory Ordersdetailsmodel.fromJson(Map<String, dynamic> json) =>
      Ordersdetailsmodel(
        status: json["Status"],
        orders: json["Orders"] == null ? null : Orders.fromJson(json["Orders"]),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Orders": orders?.toJson(),
      };
}

class Orders {
  int? orderId;
  int? cartId;
  String? mobileNumber;
  String? OrderSequence;
  int? userId;
  String? promoCode;
  double? tipAmount;
  double? subTotal;
  double? discount;
  double? taxAmount;
  double? promoAmount;
  double? deliverCharges;
  double? grandTotal;
  String? paymentMethod;
  String? address;
  String? flatNo;
  String? city;
  String? oTP;
  String? landMark;
  double? latitude;
  double? longitude;
  double? walletAmount;
  int? paymentStatus;
  String? paymentTransactionId;
  int? orderStatus;
  var Distance;
  String? razorpayOrderId;
  String? cancellationReason;
  DateTime? deliveredDatetime;
  DateTime? estimateDateTime;
  int? deliveryBoyId;
  int? isAssigned;
  DateTime? createdAt;
  DateTime? updatedAt;
  List<dynamic>? deliveryInstructions;
  List<Orderitem>? orderitems;
  String? userName;
  String? orderType;
  String? orderInvoice;

  DateTime? deliveredCancelleddatetime;
  String? scheduleStatus;
  DateTime? scheduledDateTime;
  int? totalItemQuantity;
  int? orderSizeBufferMinutes;
  int? totalDelayMinutes;
  String? delayStatus;
  String? latestDelayReason;
  String? latestDelayRemarks;
  String? latestDelayReasonText;
  DateTime? delayUpdatedAt;
  List<RemovedOrderItem>? removedItems;

  Orders({
    this.orderId,
    this.cartId,
    this.mobileNumber,
    this.OrderSequence,
    this.userId,
    this.promoCode,
    this.Distance,
    this.tipAmount,
    this.subTotal,
    this.discount,
    this.taxAmount,
    this.promoAmount,
    this.deliverCharges,
    this.grandTotal,
    this.paymentMethod,
    this.address,
    this.flatNo,
    this.city,
    this.landMark,
    this.latitude,
    this.oTP,
    this.walletAmount,
    this.longitude,
    this.paymentStatus,
    this.orderType,
    this.orderInvoice,
    this.paymentTransactionId,
    this.orderStatus,
    this.razorpayOrderId,
    this.cancellationReason,
    this.deliveredDatetime,
    this.estimateDateTime,
    this.deliveryBoyId,
    this.isAssigned,
    this.createdAt,
    this.updatedAt,
    this.deliveryInstructions,
    this.orderitems,
    this.userName,
    this.deliveredCancelleddatetime,
    this.scheduleStatus,
    this.scheduledDateTime,
    this.totalItemQuantity,
    this.orderSizeBufferMinutes,
    this.totalDelayMinutes,
    this.delayStatus,
    this.latestDelayReason,
    this.latestDelayRemarks,
    this.latestDelayReasonText,
    this.delayUpdatedAt,
    this.removedItems,
  });

  factory Orders.fromJson(Map<String, dynamic> json) => Orders(
        orderId: json["OrderID"],
        cartId: json["CartID"],
        mobileNumber: json["MobileNumber"],
        userId: json["UserID"],
        promoCode: json["PromoCode"],
        OrderSequence: json["OrderSequence"],
        Distance: json["Distance"],
        tipAmount: _toDouble(json["TipAmount"]),
        subTotal: _toDouble(json["SubTotal"]),
        discount: _toDouble(json["Discount"]),
        taxAmount: _toDouble(json["TaxAmount"]),
        promoAmount: _toDouble(json["PromoAmount"]),
        deliverCharges: _toDouble(json["DeliverCharges"]),
        grandTotal: _toDouble(json["GrandTotal"]),
        walletAmount: _toDouble(json["WalletAmount"]),
        paymentMethod: json["PaymentMethod"],
        oTP: json["OTP"],
        address: json["Address"],
        flatNo: json["FlatNo"],
        city: json["City"],
        orderType: json["OrderType"],
        orderInvoice: json["InvoiceFile"],
        landMark: json["LandMark"],
        latitude: _toDouble(json["Latitude"]),
        longitude: _toDouble(json["Longitude"]),
        paymentStatus: json["PaymentStatus"],
        paymentTransactionId: json["PaymentTransactionID"],
        orderStatus: json["OrderStatus"],
        razorpayOrderId: json["RazorpayOrderID"],
        cancellationReason: json["CancellationReason"],
        deliveredDatetime: json["Delivered_datetime"] == null
            ? null
            : serverDate(json["Delivered_datetime"])!,
        estimateDateTime: json["EstimateDateTime"] == null
            ? null
            : serverDate(json["EstimateDateTime"])!,
        deliveryBoyId: json["DeliveryBoyID"],
        isAssigned: json["IsAssigned"],
        createdAt: json["CreatedAt"] == null
            ? null
            : serverDate(json["CreatedAt"])!,
        updatedAt: json["UpdatedAt"] == null
            ? null
            : serverDate(json["UpdatedAt"])!,
        deliveryInstructions: json["DeliveryInstructions"] == null
            ? []
            : List<dynamic>.from(json["DeliveryInstructions"]!.map((x) => x)),
        orderitems: json["orderitems"] == null
            ? []
            : List<Orderitem>.from(
                json["orderitems"]!.map((x) => Orderitem.fromJson(x))),
        userName: json["UserName"],
        deliveredCancelleddatetime: json["Delivered_Cancelled_datetime"] == null
            ? null
            : serverDate(json["Delivered_Cancelled_datetime"])!,
        scheduleStatus: json["ScheduleStatus"],
        scheduledDateTime: json["ScheduledDateTime"] == null
            ? null
            : serverDate(json["ScheduledDateTime"]),
        totalItemQuantity: json["TotalItemQuantity"] != null ? int.tryParse(json["TotalItemQuantity"].toString()) : null,
        orderSizeBufferMinutes: json["OrderSizeBufferMinutes"] != null ? int.tryParse(json["OrderSizeBufferMinutes"].toString()) : null,
        totalDelayMinutes: json["TotalDelayMinutes"] != null ? int.tryParse(json["TotalDelayMinutes"].toString()) : 0,
        delayStatus: json["DelayStatus"]?.toString(),
        latestDelayReason: (json["LatestDelayReason"] ?? json["latestDelayReason"])?.toString(),
        latestDelayRemarks: (json["LatestDelayRemarks"] ?? json["latestDelayRemarks"])?.toString(),
        latestDelayReasonText: (json["LatestDelayReasonText"] ?? json["latestDelayReasonText"])?.toString(),
        delayUpdatedAt: (json["DelayUpdatedAt"] ?? json["delayUpdatedAt"]) == null
            ? null
            : serverDate(json["DelayUpdatedAt"] ?? json["delayUpdatedAt"]),
        removedItems: (json["RemovedItems"] ?? json["removedItems"]) == null
            ? []
            : List<RemovedOrderItem>.from(
                (json["RemovedItems"] ?? json["removedItems"])!.map((x) => RemovedOrderItem.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "OrderID": orderId,
        "CartID": cartId,
        "Distance": Distance,
        "MobileNumber": mobileNumber,
        "OrderSequence": OrderSequence,
        "UserID": userId,
        "PromoCode": promoCode,
        "TipAmount": tipAmount,
        "SubTotal": subTotal,
        "OrderType": orderType,
        "InvoiceFile": orderInvoice,
        "WalletAmount": walletAmount,
        "Discount": discount,
        "TaxAmount": taxAmount,
        "PromoAmount": promoAmount,
        "DeliverCharges": deliverCharges,
        "GrandTotal": grandTotal,
        "PaymentMethod": paymentMethod,
        "Address": address,
        "FlatNo": flatNo,
        "City": city,
        "OTP": oTP,
        "LandMark": landMark,
        "Latitude": latitude,
        "Longitude": longitude,
        "PaymentStatus": paymentStatus,
        "PaymentTransactionID": paymentTransactionId,
        "OrderStatus": orderStatus,
        "RazorpayOrderID": razorpayOrderId,
        "CancellationReason": cancellationReason,
        "Delivered_datetime": deliveredDatetime,
        "EstimateDateTime": estimateDateTime?.toIso8601String(),
        "TotalDelayMinutes": totalDelayMinutes,
        "DelayStatus": delayStatus,
        "LatestDelayReason": latestDelayReason,
        "LatestDelayRemarks": latestDelayRemarks,
        "LatestDelayReasonText": latestDelayReasonText,
        "DelayUpdatedAt": delayUpdatedAt?.toIso8601String(),
        "ScheduleStatus": scheduleStatus,
        "ScheduledDateTime": scheduledDateTime?.toIso8601String(),
        "DeliveryBoyID": deliveryBoyId,
        "IsAssigned": isAssigned,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
        "DeliveryInstructions": deliveryInstructions == null
            ? []
            : List<dynamic>.from(deliveryInstructions!.map((x) => x)),
        "orderitems": orderitems == null
            ? []
            : List<dynamic>.from(orderitems!.map((x) => x.toJson())),
        "RemovedItems": removedItems == null
            ? []
            : List<dynamic>.from(removedItems!.map((x) => x.toJson())),
        "UserName": userName,
      };
}

class Orderitem {
  int? orderItemId;
  int? orderId;
  String? productName;
  int? productId;
  int? variantId;
  String? metrictype;
  double? metricvalue;
  int? quantity;
  double? price;
  double? offerPrice;
  String? imageUrl;
  int? type;
  List<dynamic>? kitItems;
  DateTime? createdAt;
  DateTime? updatedAt;
  List<String> productImages;

  Orderitem({
    this.orderItemId,
    this.orderId,
    this.productName,
    this.productId,
    this.variantId,
    this.metrictype,
    this.metricvalue,
    this.quantity,
    this.price,
    this.offerPrice,
    this.imageUrl,
    this.type,
    this.kitItems,
    this.createdAt,
    this.updatedAt,
    required this.productImages,
  });

  factory Orderitem.fromJson(Map<String, dynamic> json) => Orderitem(
        orderItemId: json["OrderItemID"],
        orderId: json["OrderID"],
        productName: json["ProductName"],
        productId: json["ProductID"],
        variantId: json["VariantID"],
        metrictype: json["metrictype"],
        metricvalue: _toDouble(json["metricvalue"]) ?? 0.0,
        quantity: json["Quantity"],
        price: _toDouble(json["Price"]) ?? 0.0,
        productImages: List<String>.from(json['ProductImages']),
        offerPrice: _toDouble(json["OfferPrice"]) ?? 0.0,
        imageUrl: json["ImageUrl"],
        type: json["Type"],
        kitItems: json["KitItems"] == null
            ? []
            : List<dynamic>.from(json["KitItems"]!.map((x) => x)),
        createdAt: json["CreatedAt"] == null
            ? null
            : serverDate(json["CreatedAt"])!,
        updatedAt: json["UpdatedAt"] == null
            ? null
            : serverDate(json["UpdatedAt"])!,
      );

  Map<String, dynamic> toJson() => {
        "OrderItemID": orderItemId,
        "OrderID": orderId,
        "ProductName": productName,
        "ProductID": productId,
        "VariantID": variantId,
        "metrictype": metrictype,
        "metricvalue": metricvalue ?? 0.0,
        "Quantity": quantity,
        "Price": price ?? 0.0,
        "ImageUrl": imageUrl,
        "OfferPrice": offerPrice ?? 0.0,
        "Type": type,
        "KitItems":
            kitItems == null ? [] : List<dynamic>.from(kitItems!.map((x) => x)),
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
      };
}

class RemovedOrderItem {
  int? removalId;
  int? orderId;
  int? productId;
  String? productName;
  int? quantity;
  String? reason;
  DateTime? createdAt;

  RemovedOrderItem({
    this.removalId,
    this.orderId,
    this.productId,
    this.productName,
    this.quantity,
    this.reason,
    this.createdAt,
  });

  factory RemovedOrderItem.fromJson(Map<String, dynamic> json) => RemovedOrderItem(
        removalId: json["RemovalID"] != null ? int.tryParse(json["RemovalID"].toString()) : null,
        orderId: json["OrderID"] != null ? int.tryParse(json["OrderID"].toString()) : null,
        productId: json["ProductID"] != null ? int.tryParse(json["ProductID"].toString()) : null,
        productName: json["ProductName"]?.toString(),
        quantity: json["Quantity"] != null ? int.tryParse(json["Quantity"].toString()) : null,
        reason: json["Reason"]?.toString(),
        createdAt: json["CreatedAt"] == null
            ? null
            : serverDate(json["CreatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "RemovalID": removalId,
        "OrderID": orderId,
        "ProductID": productId,
        "ProductName": productName,
        "Quantity": quantity,
        "Reason": reason,
        "CreatedAt": createdAt?.toIso8601String(),
      };
}
