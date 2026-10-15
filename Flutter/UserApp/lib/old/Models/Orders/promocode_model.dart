class PromoCodeModel {
  int? status;
  String? message;
  // PromoCode? promoCode;
  double? discount;

  PromoCodeModel({this.status, this.message, this.discount});

  PromoCodeModel.fromJson(Map<String, dynamic> json) {
    status = json['Status'];
    message = json['Message'];
    discount = json['Discount']?.toDouble();
    // promoCode = json['PromoCode'] != null
    //     ? PromoCode.fromJson(json['PromoCode'])
    //     : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['Status'] = status;
    data['Message'] = message;
    data['discount'] = discount;
    // if (promoCode != null) {
    //   data['PromoCode'] = promoCode!.toJson();
    // }
    return data;
  }
}

class PromoCode {
  int? promoCodeId;
  String? promoCode;
  String? description;
  String? startDate;
  String? endDate;
  int? type;
  double? offerValue;
  double? maxDiscount;
  double? minOrderValue;
  int? status;
  String? createdAt;
  String? updatedAt;

  PromoCode(
      {this.promoCodeId,
      this.promoCode,
      this.description,
      this.startDate,
      this.endDate,
      this.minOrderValue,
      this.type,
      this.offerValue,
      this.maxDiscount,
      this.status,
      this.createdAt,
      this.updatedAt});

  PromoCode.fromJson(Map<String, dynamic> json) {
    promoCodeId = json['PromoCodeId'];
    promoCode = json['PromoCode'];
    description = json['Description'];
    startDate = json['StartDate'];
    endDate = json['EndDate'];
    type = json['Type'];
    offerValue = json['OfferValue']?.toDouble();
    minOrderValue = json['MinOrderValue']?.toDouble();
    maxDiscount = json['MaxDiscount']?.toDouble();
    status = json['Status'];
    createdAt = json['CreatedAt'];
    updatedAt = json['UpdatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['PromoCodeId'] = promoCodeId;
    data['PromoCode'] = promoCode;
    data['Description'] = description;
    data['StartDate'] = startDate;
    data['EndDate'] = endDate;
    data['Type'] = type;
    data['OfferValue'] = offerValue;
    data['MaxDiscount'] = maxDiscount;
    data['Status'] = status;
    data['CreatedAt'] = createdAt;
    data['UpdatedAt'] = updatedAt;
    return data;
  }
}
