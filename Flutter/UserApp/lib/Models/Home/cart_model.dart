class CartModel {
  int? status;
  String? message;
  Cart? cart;

  CartModel({this.status, this.message, this.cart});

  CartModel.fromJson(Map<String, dynamic> json) {
    status = json['Status'];
    message = json['Message'];
    cart = json['Cart'] != null ? new Cart.fromJson(json['Cart']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['Status'] = this.status;
    data['Message'] = this.message;
    if (this.cart != null) {
      data['Cart'] = this.cart!.toJson();
    }
    return data;
  }
}

class Cart {
  int? cartID;
  int? userID;
  int? isOrderLinked;
  String? createdAt;
  String? updatedAt;
  List<CartItems>? cartItems;

  Cart(
      {this.cartID,
      this.userID,
      this.isOrderLinked,
      this.createdAt,
      this.updatedAt,
      this.cartItems});

  Cart.fromJson(Map<String, dynamic> json) {
    cartID = json['CartID'];
    userID = json['UserID'];
    isOrderLinked = json['IsOrderLinked'];
    createdAt = json['CreatedAt'];
    updatedAt = json['UpdatedAt'];
    if (json['CartItems'] != null) {
      cartItems = <CartItems>[];
      json['CartItems'].forEach((v) {
        cartItems!.add(new CartItems.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['CartID'] = this.cartID;
    data['UserID'] = this.userID;
    data['IsOrderLinked'] = this.isOrderLinked;
    data['CreatedAt'] = this.createdAt;
    data['UpdatedAt'] = this.updatedAt;
    if (this.cartItems != null) {
      data['CartItems'] = this.cartItems!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class CartItems {
  int? productID;
  int? categoryID;
  int? subCategoryID;
  String? productName;
  String? description;
  String? imageUrl;
  int? variantID;
  int? quantity;
  String? metrictype;
  double? metricvalue;
  int? availableQty;
  int? price;
  int? offerPrice;
  int? status;
  String? createdAt;
  String? updatedAt;

  CartItems(
      {this.productID,
      this.categoryID,
      this.subCategoryID,
      this.productName,
      this.description,
      this.imageUrl,
      this.variantID,
      this.quantity,
      this.metrictype,
      this.metricvalue,
      this.availableQty,
      this.price,
      this.offerPrice,
      this.status,
      this.createdAt,
      this.updatedAt});

  CartItems.fromJson(Map<String, dynamic> json) {
    productID = json['ProductID'];
    categoryID = json['CategoryID'];
    subCategoryID = json['SubCategoryID'];
    productName = json['ProductName'];
    description = json['Description'];
    imageUrl = json['ImageUrl'];
    variantID = json['VariantID'];
    quantity = json['Quantity'];
    metrictype = json['metrictype'];
    metricvalue = json['metricvalue'].toDouble() ?? 0.0;
    availableQty = json['AvailableQty'];
    price = json['Price'];
    offerPrice = json['OfferPrice'];
    status = json['Status'];
    createdAt = json['CreatedAt'];
    updatedAt = json['UpdatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['ProductID'] = this.productID;
    data['CategoryID'] = this.categoryID;
    data['SubCategoryID'] = this.subCategoryID;
    data['ProductName'] = this.productName;
    data['Description'] = this.description;
    data['ImageUrl'] = this.imageUrl;
    data['VariantID'] = this.variantID;
    data['Quantity'] = this.quantity;
    data['metrictype'] = this.metrictype;
    data['metricvalue'] = this.metricvalue;
    data['AvailableQty'] = this.availableQty;
    data['Price'] = this.price;
    data['OfferPrice'] = this.offerPrice;
    data['Status'] = this.status;
    data['CreatedAt'] = this.createdAt;
    data['UpdatedAt'] = this.updatedAt;
    return data;
  }
}
