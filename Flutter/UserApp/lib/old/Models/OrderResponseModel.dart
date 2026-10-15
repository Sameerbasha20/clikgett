class OrderResponseModel {
  final int status;
  final String message;
  final int? orderID; // Nullable to handle cases where orderID might not be present

  OrderResponseModel({required this.status, required this.message, this.orderID});

  // Factory constructor to map JSON response to the ResponseModel
  factory OrderResponseModel.fromJson(Map<String, dynamic> json) {
    return OrderResponseModel(
      status: json['Status'],     // Mapping status from JSON
      message: json['Message'],   // Mapping message from JSON
      orderID: json['OrderID'],   // Mapping orderID from JSON
    );
  }
}
