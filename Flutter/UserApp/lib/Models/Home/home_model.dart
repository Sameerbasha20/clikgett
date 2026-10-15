class HomeModel {
  int? status;
  List<Banners>? banners;
  List<Categories>? categories;
  List<Product>? bestItems;

  HomeModel({this.status, this.banners, this.categories, this.bestItems});

  HomeModel.fromJson(Map<String, dynamic> json) {
    status = json['Status'];
    if (json['Banners'] != null) {
      banners = <Banners>[];
      json['Banners'].forEach((v) {
        banners!.add(new Banners.fromJson(v));
      });
    }
    if (json['Categories'] != null) {
      categories = <Categories>[];
      json['Categories'].forEach((v) {
        categories!.add(new Categories.fromJson(v));
      });
    }
    if (json['BestItems'] != null) {
      bestItems = <Product>[];
      json['BestItems'].forEach((v) {
        bestItems!.add(new Product.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['Status'] = this.status;
    if (this.banners != null) {
      data['Banners'] = this.banners!.map((v) => v.toJson()).toList();
    }
    if (this.categories != null) {
      data['Categories'] = this.categories!.map((v) => v.toJson()).toList();
    }
    if (this.bestItems != null) {
      data['BestItems'] = this.bestItems!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Banners {
  int? bannerID;
  String? bannerName;
  String? description;
  String? imageUrl;
  int? status;
  String? createdAt;
  String? updatedAt;

  Banners(
      {this.bannerID,
      this.bannerName,
      this.description,
      this.imageUrl,
      this.status,
      this.createdAt,
      this.updatedAt});

  Banners.fromJson(Map<String, dynamic> json) {
    bannerID = json['BannerID'];
    bannerName = json['BannerName'];
    description = json['Description'];
    imageUrl = json['ImageUrl'];
    status = json['Status'];
    createdAt = json['CreatedAt'];
    updatedAt = json['UpdatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['BannerID'] = this.bannerID;
    data['BannerName'] = this.bannerName;
    data['Description'] = this.description;
    data['ImageUrl'] = this.imageUrl;
    data['Status'] = this.status;
    data['CreatedAt'] = this.createdAt;
    data['UpdatedAt'] = this.updatedAt;
    return data;
  }
}

class Categories {
  int? categoryID;
  String? categoryName;
  String? description;
  String? imageUrl;
  int? status;
  String? createdAt;
  String? updatedAt;

  Categories(
      {this.categoryID,
      this.categoryName,
      this.description,
      this.imageUrl,
      this.status,
      this.createdAt,
      this.updatedAt});

  Categories.fromJson(Map<String, dynamic> json) {
    categoryID = json['CategoryID'];
    categoryName = json['CategoryName'];
    description = json['Description'];
    imageUrl = json['ImageUrl'];
    status = json['Status'];
    createdAt = json['CreatedAt'];
    updatedAt = json['UpdatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['CategoryID'] = this.categoryID;
    data['CategoryName'] = this.categoryName;
    data['Description'] = this.description;
    data['ImageUrl'] = this.imageUrl;
    data['Status'] = this.status;
    data['CreatedAt'] = this.createdAt;
    data['UpdatedAt'] = this.updatedAt;
    return data;
  }
}

class Product {
  int? productID;
  int? categoryID;
  int? subCategoryID;
  String? productName;
  String? description;
  int? type;
  String? imageUrl;
  int? status;
  String? createdAt;
  String? updatedAt;
  List<ProductVariants>? productVariants;

  Product(
      {this.productID,
      this.categoryID,
      this.subCategoryID,
      this.productName,
      this.description,
      this.type,
      this.imageUrl,
      this.status,
      this.createdAt,
      this.updatedAt,
      this.productVariants});

  Product.fromJson(Map<String, dynamic> json) {
    productID = json['ProductID'];
    categoryID = json['CategoryID'];
    subCategoryID = json['SubCategoryID'];
    productName = json['ProductName'];
    description = json['Description'];
    type = json['Type'];
    imageUrl = json['ImageUrl'];
    status = json['Status'];
    createdAt = json['CreatedAt'];
    updatedAt = json['UpdatedAt'];
    if (json['ProductVariants'] != null) {
      productVariants = <ProductVariants>[];
      json['ProductVariants'].forEach((v) {
        productVariants!.add(new ProductVariants.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['ProductID'] = this.productID;
    data['CategoryID'] = this.categoryID;
    data['SubCategoryID'] = this.subCategoryID;
    data['ProductName'] = this.productName;
    data['Description'] = this.description;
    data['Type'] = this.type;
    data['ImageUrl'] = this.imageUrl;
    data['Status'] = this.status;
    data['CreatedAt'] = this.createdAt;
    data['UpdatedAt'] = this.updatedAt;
    if (this.productVariants != null) {
      data['ProductVariants'] =
          this.productVariants!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class ProductVariants {
  int? variantID;
  int? productID;
  String? metrictype;
  double? metricvalue;
  int? availableQty;
  int? price;
  int? offerPrice;
  int? status;
  String? createdAt;
  String? updatedAt;

  ProductVariants(
      {this.variantID,
      this.productID,
      this.metrictype,
      this.metricvalue,
      this.availableQty,
      this.price,
      this.offerPrice,
      this.status,
      this.createdAt,
      this.updatedAt});

  ProductVariants.fromJson(Map<String, dynamic> json) {
    variantID = json['VariantID'];
    productID = json['ProductID'];
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
    data['VariantID'] = this.variantID;
    data['ProductID'] = this.productID;
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
