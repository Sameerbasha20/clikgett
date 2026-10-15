// To parse this JSON data, do
//
//     final notificationsModel = notificationsModelFromJson(jsonString);

import 'dart:convert';

NotificationsModel notificationsModelFromJson(String str) =>
    NotificationsModel.fromJson(json.decode(str));

String notificationsModelToJson(NotificationsModel data) =>
    json.encode(data.toJson());

class NotificationsModel {
  NotificationsModel({
    required this.status,
    required this.notifications,
  });

  int status;
  List<Notification> notifications;

  factory NotificationsModel.fromJson(Map<String, dynamic> json) =>
      NotificationsModel(
        status: json["status"],
        notifications: List<Notification>.from(
            json["Notifications"].map((x) => Notification.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "Notifications":
            List<dynamic>.from(notifications.map((x) => x.toJson())),
      };
}

class Notification {
  Notification({
    required this.uid,
    required this.userId,
    required this.title,
    required this.type,
    required this.message,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  int uid;
  int userId;
  String title;
  int type;
  String message;
  int status;
  DateTime createdAt;
  DateTime updatedAt;

  factory Notification.fromJson(Map<String, dynamic> json) => Notification(
        uid: json["UID"],
        userId: json["UserID"],
        title: json["Title"],
        type: json["Type"],
        message: json["Message"],
        status: json["Status"],
        createdAt: DateTime.parse(json["CreatedAt"]),
        updatedAt: DateTime.parse(json["UpdatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "UID": uid,
        "UserID": userId,
        "Title": title,
        "Type": type,
        "Message": message,
        "Status": status,
        "CreatedAt": createdAt.toIso8601String(),
        "UpdatedAt": updatedAt.toIso8601String(),
      };
}
