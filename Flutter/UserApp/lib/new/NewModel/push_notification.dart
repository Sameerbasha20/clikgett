// To parse this JSON data, do
//
//     final pushNotificationsModel = pushNotificationsModelFromJson(jsonString);

import 'dart:convert';

PushNotificationsModel pushNotificationsModelFromJson(String str) =>
    PushNotificationsModel.fromJson(json.decode(str));

String pushNotificationsModelToJson(PushNotificationsModel data) =>
    json.encode(data.toJson());

class PushNotificationsModel {
  String? body;
  String? title;

  PushNotificationsModel({
    this.body,
    this.title,
  });

  factory PushNotificationsModel.fromJson(Map<String, dynamic> json) =>
      PushNotificationsModel(
        body: json["body"],
        title: json["title"],
      );

  Map<String, dynamic> toJson() => {
        "body": body,
        "title": title,
      };
}
