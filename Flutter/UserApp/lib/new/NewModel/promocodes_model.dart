// To parse this JSON data, do
//
//     final promoCodeListModel = promoCodeListModelFromJson(jsonString);

import 'dart:convert';

import '../../old/Models/Orders/promocode_model.dart';

PromoCodeListModel promoCodeListModelFromJson(String str) =>
    PromoCodeListModel.fromJson(json.decode(str));

String promoCodeListModelToJson(PromoCodeListModel data) =>
    json.encode(data.toJson());

class PromoCodeListModel {
  int? status;
  List<PromoCode>? promoCodes;

  PromoCodeListModel({
    this.status,
    this.promoCodes,
  });

  factory PromoCodeListModel.fromJson(Map<String, dynamic> json) =>
      PromoCodeListModel(
        status: json["status"],
        promoCodes: json["PromoCodes"] == null
            ? []
            : List<PromoCode>.from(
                json["PromoCodes"]!.map((x) => PromoCode.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "PromoCodes": promoCodes == null
            ? []
            : List<dynamic>.from(promoCodes!.map((x) => x.toJson())),
      };
}

// class PromoCode {
//   int? promoCodeId;
//   String? promoCode;
//   String? description;
//   DateTime? startDate;
//   DateTime? endDate;
//   int? type;
//   int? offerValue;
//   int? maxDiscount;
//   int? status;
//   DateTime? createdAt;
//   DateTime? updatedAt;

//   PromoCode({
//     this.promoCodeId,
//     this.promoCode,
//     this.description,
//     this.startDate,
//     this.endDate,
//     this.type,
//     this.offerValue,
//     this.maxDiscount,
//     this.status,
//     this.createdAt,
//     this.updatedAt,
//   });

//   factory PromoCode.fromJson(Map<String, dynamic> json) => PromoCode(
//         promoCodeId: json["PromoCodeId"],
//         promoCode: json["PromoCode"],
//         description: json["Description"],
//         startDate: json["StartDate"] == null
//             ? null
//             : serverDate(json["StartDate"])!,
//         endDate:
//             json["EndDate"] == null ? null : serverDate(json["EndDate"])!,
//         type: json["Type"],
//         offerValue: json["OfferValue"],
//         maxDiscount: json["MaxDiscount"],
//         status: json["Status"],
//         createdAt: json["CreatedAt"] == null
//             ? null
//             : serverDate(json["CreatedAt"])!,
//         updatedAt: json["UpdatedAt"] == null
//             ? null
//             : serverDate(json["UpdatedAt"])!,
//       );

//   Map<String, dynamic> toJson() => {
//         "PromoCodeId": promoCodeId,
//         "PromoCode": promoCode,
//         "Description": description,
//         "StartDate": startDate?.toIso8601String(),
//         "EndDate": endDate?.toIso8601String(),
//         "Type": type,
//         "OfferValue": offerValue,
//         "MaxDiscount": maxDiscount,
//         "Status": status,
//         "CreatedAt": createdAt?.toIso8601String(),
//         "UpdatedAt": updatedAt?.toIso8601String(),
//       };
// }
