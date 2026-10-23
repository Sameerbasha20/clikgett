// To parse this JSON data, do
//
//     final configModel = configModelFromJson(jsonString);

import 'dart:convert';
import 'package:fav_app/new/Services/common/server_date.dart';

ConfigModel configModelFromJson(String str) =>
    ConfigModel.fromJson(json.decode(str));

String configModelToJson(ConfigModel data) => json.encode(data.toJson());

class ConfigModel {
  int? status;
  List<Setting>? settings;

  ConfigModel({
    this.status,
    this.settings,
  });

  factory ConfigModel.fromJson(Map<String, dynamic> json) => ConfigModel(
        status: json["Status"],
        settings: json["Settings"] == null
            ? []
            : List<Setting>.from(
                json["Settings"]!.map((x) => Setting.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Settings": settings == null
            ? []
            : List<dynamic>.from(settings!.map((x) => x.toJson())),
      };
}

class Setting {
  int? id;
  String? settingKey;
  String? settingValue;
  DateTime? createdAt;
  String? imageUrl;

  Setting({
    this.id,
    this.settingKey,
    this.settingValue,
    this.createdAt,
    this.imageUrl,
  });

  factory Setting.fromJson(Map<String, dynamic> json) => Setting(
        id: json["ID"],
        settingKey: json["SettingKey"],
        settingValue: json["SettingValue"],
        createdAt: json["CreatedAt"] == null
            ? null
            : serverDate(json["CreatedAt"])!,
        imageUrl: json["ImageUrl"],
      );

  Map<String, dynamic> toJson() => {
        "ID": id,
        "SettingKey": settingKey,
        "SettingValue": settingValue,
        "CreatedAt": createdAt?.toIso8601String(),
        "ImageUrl": imageUrl,
      };
}
