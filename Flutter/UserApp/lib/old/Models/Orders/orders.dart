// To parse this JSON data, do
//
//     final currentOrderModel = currentOrderModelFromJson(jsonString);

import 'dart:convert';
import 'package:fav_app/new/Services/common/server_date.dart';

/// MySQL DECIMAL columns arrive as text ("750.000"); accept numbers or text.
double? _toDouble(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

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
        grandTotal: _toDouble(json["GrandTotal"]),
        productImages: List<String>.from(json['ProductImages'] ?? []),
        imageUrl: json["ImageUrl"],
        createdAt: json["CreatedAt"] == null
            ? null
            : serverDate(json["CreatedAt"])!,
        deliveredCancelleddatetime: json["Delivered_Cancelled_datetime"] == null
            ? null
            : serverDate(json["Delivered_Cancelled_datetime"])!,
        estimateDateTime: json["EstimateDateTime"] == null
            ? null
            : serverDate(json["EstimateDateTime"]),
        totalDelayMinutes: json["TotalDelayMinutes"] != null
            ? int.tryParse(json["TotalDelayMinutes"].toString())
            : 0,
        orderSizeBufferMinutes: json["OrderSizeBufferMinutes"] != null
            ? int.tryParse(json["OrderSizeBufferMinutes"].toString())
            : 0,
        scheduleStatus: json["ScheduleStatus"],
        scheduledDateTime: json["ScheduledDateTime"] == null
            ? null
            : serverDate(json["ScheduledDateTime"]),
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
