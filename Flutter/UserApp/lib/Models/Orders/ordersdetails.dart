// To parse this JSON data, do
//
//     final ordersdetailsmodel = ordersdetailsmodelFromJson(jsonString);

import 'dart:convert';

Ordersdetailsmodel ordersdetailsmodelFromJson(String str) =>
    Ordersdetailsmodel.fromJson(json.decode(str));

String ordersdetailsmodelToJson(Ordersdetailsmodel data) =>
    json.encode(data.toJson());

class Ordersdetailsmodel {
  Ordersdetailsmodel({
    required this.status,
    required this.orders,
  });

  int status;
  Orders orders;

  factory Ordersdetailsmodel.fromJson(Map<String, dynamic> json) =>
      Ordersdetailsmodel(
        status: json["Status"],
        orders: Orders.fromJson(json["Orders"]),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Orders": orders.toJson(),
      };
}

class Orders {
  Orders({
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
    required this.orderitems,
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
  List<Orderitem> orderitems;

  factory Orders.fromJson(Map<String, dynamic> json) => Orders(
        orderId: json["OrderID"],
        cartId: json["CartID"],
        mobileNumber: json["MobileNumber"],
        userId: json["UserID"],
        promoCode: json["PromoCode"],
        subTotal: json["SubTotal"].toDouble(),
        discount: json["Discount"].toDouble(),
        taxAmount: json["TaxAmount"].toDouble(),
        promoAmount: json["PromoAmount"].toDouble(),
        deliverCharges: json["DeliverCharges"].toDouble(),
        grandTotal: json["GrandTotal"].toDouble(),
        paymentMethod: json["PaymentMethod"],
        address: json["Address"],
        flatNo: json["FlatNo"],
        city: json["City"],
        landMark: json["LandMark"],
        latitude: json["Latitude"].toDouble(),
        longitude: json["Longitude"].toDouble(),
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
        orderitems: List<Orderitem>.from(
            json["orderitems"].map((x) => Orderitem.fromJson(x))),
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
        "orderitems": List<dynamic>.from(orderitems.map((x) => x.toJson())),
      };
}

class Orderitem {
  Orderitem({
    required this.orderItemId,
    required this.orderId,
    required this.productName,
    required this.productId,
    required this.variantId,
    required this.metrictype,
    required this.metricvalue,
    required this.quantity,
    required this.price,
    required this.offerPrice,
    required this.imageUrl,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
  });

  int orderItemId;
  int orderId;
  String productName;
  int productId;
  int variantId;
  String metrictype;
  int metricvalue;
  int quantity;
  double price;
  double offerPrice;
  String imageUrl;
  int type;
  DateTime createdAt;
  DateTime updatedAt;

  factory Orderitem.fromJson(Map<String, dynamic> json) => Orderitem(
        orderItemId: json["OrderItemID"],
        orderId: json["OrderID"],
        productName: json["ProductName"],
        productId: json["ProductID"],
        variantId: json["VariantID"],
        metrictype: json["metrictype"],
        metricvalue: json["metricvalue"],
        quantity: json["Quantity"],
    price: json["Price"]?.toDouble() ?? 0.0,
    offerPrice: json["OfferPrice"]?.toDouble() ?? 0.0,
        imageUrl: json["ImageUrl"],
        type: json["Type"],
        createdAt: DateTime.parse(json["CreatedAt"]),
        updatedAt: DateTime.parse(json["UpdatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "OrderItemID": orderItemId,
        "OrderID": orderId,
        "ProductName": productName,
        "ProductID": productId,
        "VariantID": variantId,
        "metrictype": metrictype,
        "metricvalue": metricvalue,
        "Quantity": quantity,
        "Price": price ?? 0.0,
        "OfferPrice": offerPrice ?? 0.0,
        "ImageUrl": imageUrl,
        "Type": type,
        "CreatedAt": createdAt.toIso8601String(),
        "UpdatedAt": updatedAt.toIso8601String(),
      };
}
