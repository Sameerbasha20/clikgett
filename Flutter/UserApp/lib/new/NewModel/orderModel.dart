class OrderModel {
  String image;
  String itemsNames;
  String type;
  var orderid;
  var total;
  String status;
  var date;
  OrderModel(
      {required this.image,
      required this.itemsNames,
      required this.type,
      required this.orderid,
      required this.total,
      required this.date,
      required this.status});
}
