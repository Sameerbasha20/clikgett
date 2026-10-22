// To parse this JSON data, do
//
//     final walletModel = walletModelFromJson(jsonString);

import 'dart:convert';

/// MySQL DECIMAL columns arrive as text ("750.000"); accept numbers or text.
double? _toDouble(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

WalletModel walletModelFromJson(String str) =>
    WalletModel.fromJson(json.decode(str));

String walletModelToJson(WalletModel data) => json.encode(data.toJson());

class WalletModel {
  int? status;
  List<Wallet>? wallets;
  double? walletAmount;

  WalletModel({
    this.status,
    this.wallets,
    this.walletAmount,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) => WalletModel(
        status: json["status"],
        wallets: json["Wallets"] == null
            ? []
            : List<Wallet>.from(
                json["Wallets"]!.map((x) => Wallet.fromJson(x))),
        walletAmount: _toDouble(json["WalletAmount"]),
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "Wallets": wallets == null
            ? []
            : List<dynamic>.from(wallets!.map((x) => x.toJson())),
        "WalletAmount": walletAmount,
      };
}

class Wallet {
  int? walletId;
  int? userId;
  double? amount;
  int? creditedDebited;
  int? contentType;
  String? description;
  // int? creditDebitType;
  DateTime? createdAt;
  DateTime? updatedAt;

  Wallet({
    this.walletId,
    this.userId,
    this.amount,
    this.creditedDebited,
    this.contentType,
    this.description,
    // this.creditDebitType,
    this.createdAt,
    this.updatedAt,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) => Wallet(
        walletId: json["WalletID"],
        userId: json["UserID"],
        contentType: json["ContentType"],
        amount: _toDouble(json["Amount"]),
        creditedDebited: json["Credited_Debited"],
        description: json["Description"],
        // creditDebitType: json["Credit_Debit_Type"],
        createdAt: json["CreatedAt"] == null
            ? null
            : DateTime.parse(json["CreatedAt"]),
        updatedAt: json["UpdatedAt"] == null
            ? null
            : DateTime.parse(json["UpdatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "WalletID": walletId,
        "UserID": userId,
        "ContentType": contentType,
        "Amount": amount,
        "Credited_Debited": creditedDebited,
        "Description": description,
        // "Credit_Debit_Type": creditDebitType,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
      };
}
