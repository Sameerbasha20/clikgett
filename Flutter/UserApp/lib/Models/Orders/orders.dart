// To parse this JSON data, do
//
//     final currentOrderModel = currentOrderModelFromJson(jsonString);

import 'dart:convert';

/// MySQL DECIMAL columns arrive as text ("750.000"); accept numbers or text.
double? _toDouble(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

CurrentOrderModel currentOrderModelFromJson(String str) =>
    CurrentOrderModel.fromJson(json.decode(str));

String currentOrderModelToJson(CurrentOrderModel data) =>
    json.encode(data.toJson());

class CurrentOrderModel {
  CurrentOrderModel({
    required this.status,
    required this.orders,
  });

  int status;
  List<Order> orders;

  factory CurrentOrderModel.fromJson(Map<String, dynamic> json) =>
      CurrentOrderModel(
        status: json["Status"],
        orders: List<Order>.from(json["Orders"].map((x) => Order.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Orders": List<dynamic>.from(orders.map((x) => x.toJson())),
      };
}

class Order {
  Order({
    required this.orderId,
    required this.cartId,
    required this.mobileNumber,
    required this.userId,
    required this.promoCode,
    required this.subTotal,
    required this.discount,
    required this.taxAmount,
    required this.promoAmount,
    required this.deliverCharges,
    required this.grandTotal,
    required this.paymentMethod,
    required this.address,
    required this.flatNo,
    required this.city,
    required this.landMark,
    required this.latitude,
    required this.longitude,
    required this.paymentStatus,
    required this.paymentTransactionId,
    required this.orderStatus,
    required this.deliveryBoyId,
    required this.razorpayOrderId,
    required this.cancellationReason,
    required this.deliveredDatetime,
    required this.estimateDateTime,
    required this.createdAt,
    required this.updatedAt,
  });

  int orderId;
  int cartId;
  String mobileNumber;
  int userId;
  String promoCode;
  double subTotal;
  double discount;
  double taxAmount;
  double promoAmount;
  double deliverCharges;
  double grandTotal;
  String paymentMethod;
  String address;
  String flatNo;
  String city;
  String landMark;
  double latitude;
  double longitude;
  int paymentStatus;
  String paymentTransactionId;
  int orderStatus;
  int deliveryBoyId;
  String razorpayOrderId;
  String cancellationReason;
  String deliveredDatetime;
  String estimateDateTime;
  DateTime createdAt;
  DateTime updatedAt;

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        orderId: json["OrderID"],
        cartId: json["CartID"],
        mobileNumber: json["MobileNumber"],
        userId: json["UserID"],
        promoCode: json["PromoCode"],
        subTotal: (_toDouble(json["SubTotal"]) ?? 0),
        discount: (_toDouble(json["Discount"]) ?? 0),
        taxAmount: (_toDouble(json["TaxAmount"]) ?? 0),
        promoAmount: (_toDouble(json["PromoAmount"]) ?? 0),
        deliverCharges: (_toDouble(json["DeliverCharges"]) ?? 0),
        grandTotal: (_toDouble(json["GrandTotal"]) ?? 0),
        paymentMethod: json["PaymentMethod"],
        address: json["Address"],
        flatNo: json["FlatNo"],
        city: json["City"],
        landMark: json["LandMark"],
        latitude: (_toDouble(json["Latitude"]) ?? 0),
        longitude: (_toDouble(json["Longitude"]) ?? 0),
        paymentStatus: json["PaymentStatus"],
        paymentTransactionId: json["PaymentTransactionID"],
        orderStatus: json["OrderStatus"],
        deliveryBoyId: json["DeliveryBoyID"],
        razorpayOrderId: json["RazorpayOrderID"],
        cancellationReason: json["CancellationReason"],
        deliveredDatetime: json["Delivered_datetime"],
        estimateDateTime: json["EstimateDateTime"],
        createdAt: DateTime.parse(json["CreatedAt"]),
        updatedAt: DateTime.parse(json["UpdatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "OrderID": orderId,
        "CartID": cartId,
        "MobileNumber": mobileNumber,
        "UserID": userId,
        "PromoCode": promoCode,
        "SubTotal": subTotal,
        "Discount": discount,
        "TaxAmount": taxAmount,
        "PromoAmount": promoAmount,
        "DeliverCharges": deliverCharges,
        "GrandTotal": grandTotal,
        "PaymentMethod": paymentMethod,
        "Address": address,
        "FlatNo": flatNo,
        "City": city,
        "LandMark": landMark,
        "Latitude": latitude,
        "Longitude": longitude,
        "PaymentStatus": paymentStatus,
        "PaymentTransactionID": paymentTransactionId,
        "OrderStatus": orderStatus,
        "DeliveryBoyID": deliveryBoyId,
        "RazorpayOrderID": razorpayOrderId,
        "CancellationReason": cancellationReason,
        "Delivered_datetime": deliveredDatetime,
        "EstimateDateTime": estimateDateTime,
        "CreatedAt": createdAt.toIso8601String(),
        "UpdatedAt": updatedAt.toIso8601String(),
      };
}
