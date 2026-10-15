// To parse this JSON data, do
//
//     final currentOrderModel = currentOrderModelFromJson(jsonString);

import 'dart:convert';

CurrentOrderModel currentOrderModelFromJson(String str) =>
    CurrentOrderModel.fromJson(json.decode(str));

String currentOrderModelToJson(CurrentOrderModel data) =>
    json.encode(data.toJson());

class CurrentOrderModel {
  int? status;
  List<Order>? orders;

  CurrentOrderModel({
    this.status,
    this.orders,
  });

  factory CurrentOrderModel.fromJson(Map<String, dynamic> json) =>
      CurrentOrderModel(
        status: json["Status"],
        orders: json["Orders"] == null
            ? []
            : List<Order>.from(json["Orders"]!.map((x) => Order.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Orders": orders == null
            ? []
            : List<dynamic>.from(orders!.map((x) => x.toJson())),
      };
}

class Order {
  int? orderId;
  String? OrderSequence;
  int? cartId;
  int? userId;
  int? orderStatus;
  double? grandTotal;
  String? imageUrl;
  DateTime? createdAt;
  DateTime? deliveredCancelleddatetime;
  DateTime? estimateDateTime;
  int? totalDelayMinutes;
  int? orderSizeBufferMinutes;
  String? scheduleStatus;
  DateTime? scheduledDateTime;
  List<String> productImages;

  Order({
    this.orderId,
    this.OrderSequence,
    this.cartId,
    this.userId,
    this.grandTotal,
    this.orderStatus,
    this.imageUrl,
    this.deliveredCancelleddatetime,
    this.estimateDateTime,
    this.totalDelayMinutes,
    this.orderSizeBufferMinutes,
    this.scheduleStatus,
    this.scheduledDateTime,
    this.createdAt,
    required this.productImages,
  });

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        orderId: json["OrderID"],
        OrderSequence: json["OrderSequence"],
        cartId: json["CartID"],
        userId: json["UserID"],
        orderStatus: json["OrderStatus"],
        grandTotal: json["GrandTotal"]?.toDouble(),
        productImages: List<String>.from(json['ProductImages'] ?? []),
        imageUrl: json["ImageUrl"],
        createdAt: json["CreatedAt"] == null
            ? null
            : DateTime.parse(json["CreatedAt"]),
        deliveredCancelleddatetime: json["Delivered_Cancelled_datetime"] == null
            ? null
            : DateTime.parse(json["Delivered_Cancelled_datetime"]),
        estimateDateTime: json["EstimateDateTime"] == null
            ? null
            : DateTime.tryParse(json["EstimateDateTime"].toString()),
        totalDelayMinutes: json["TotalDelayMinutes"] != null
            ? int.tryParse(json["TotalDelayMinutes"].toString())
            : 0,
        orderSizeBufferMinutes: json["OrderSizeBufferMinutes"] != null
            ? int.tryParse(json["OrderSizeBufferMinutes"].toString())
            : 0,
        scheduleStatus: json["ScheduleStatus"],
        scheduledDateTime: json["ScheduledDateTime"] == null
            ? null
            : DateTime.tryParse(json["ScheduledDateTime"].toString()),
      );

  Map<String, dynamic> toJson() => {
        "OrderSequence": OrderSequence,
        "OrderID": orderId,
        "CartID": cartId,
        "UserID": userId,
        "GrandTotal": grandTotal,
        "ImageUrl": imageUrl,
        'ProductImages': productImages,
        "ScheduleStatus": scheduleStatus,
        "ScheduledDateTime": scheduledDateTime?.toIso8601String(),
        "CreatedAt": createdAt?.toIso8601String(),
      };
}
