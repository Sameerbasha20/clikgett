// To parse this JSON data, do
//
//     final adressesModel = adressesModelFromJson(jsonString);

import 'dart:convert';

/// MySQL DECIMAL columns arrive as text ("750.000"); accept numbers or text.
double? _toDouble(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

AdressesModel adressesModelFromJson(String str) =>
    AdressesModel.fromJson(json.decode(str));

String adressesModelToJson(AdressesModel data) => json.encode(data.toJson());

class AdressesModel {
  AdressesModel({
    required this.status,
    required this.address,
  });

  int status;
  List<Address> address;

  factory AdressesModel.fromJson(Map<String, dynamic> json) => AdressesModel(
        status: json["Status"],
        address:
            List<Address>.from(json["Address"].map((x) => Address.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Address": List<dynamic>.from(address.map((x) => x.toJson())),
      };
}

class Address {
  Address({
    required this.addressId,
    required this.userId,
    required this.city,
    required this.latitude,
    required this.longitude,
    required this.address,
    required this.flatNo,
    required this.landmark,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
  });

  int addressId;
  int userId;
  String city;
  double latitude;
  double longitude;
  String address;
  String flatNo;
  String landmark;
  String type;
  DateTime createdAt;
  DateTime updatedAt;

  factory Address.fromJson(Map<String, dynamic> json) => Address(
        addressId: json["AddressID"],
        userId: json["UserID"],
        city: json["City"],
        latitude: (_toDouble(json["Latitude"]) ?? 0),
        longitude: (_toDouble(json["Longitude"]) ?? 0),
        address: json["Address"],
        flatNo: json["FlatNo"],
        landmark: json["Landmark"],
        type: json["Type"],
        createdAt: DateTime.parse(json["CreatedAt"]),
        updatedAt: DateTime.parse(json["UpdatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "AddressID": addressId,
        "UserID": userId,
        "City": city,
        "Latitude": latitude,
        "Longitude": longitude,
        "Address": address,
        "FlatNo": flatNo,
        "Landmark": landmark,
        "CreatedAt": createdAt.toIso8601String(),
        "UpdatedAt": updatedAt.toIso8601String(),
      };
}
