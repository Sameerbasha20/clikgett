// To parse this JSON data, do
//
//     final notificationsModel = notificationsModelFromJson(jsonString);

import 'dart:convert';

// NotificationsModel notificationsModelFromJson(String str) =>
//     NotificationsModel.fromJson(json.decode(str));

// String notificationsModelToJson(NotificationsModel data) =>
//     json.encode(data.toJson());

// class NotificationsModel {
//   NotificationsModel({
//     required this.status,
//     required this.notifications,
//   });

//   int status;
//   List<Notification> notifications;

//   factory NotificationsModel.fromJson(Map<String, dynamic> json) =>
//       NotificationsModel(
//         status: json["status"],
//         notifications: List<Notification>.from(
//             json["Notifications"].map((x) => Notification.fromJson(x))),
//       );

//   Map<String, dynamic> toJson() => {
//         "status": status,
//         "Notifications":
//             List<dynamic>.from(notifications.map((x) => x.toJson())),
//       };
// }
// To parse this JSON data, do
//
//     final notificationsModel = notificationsModelFromJson(jsonString);

import 'dart:convert';
import 'package:fav_app/new/Services/common/server_date.dart';

NotificationsModel notificationsModelFromJson(String str) =>
    NotificationsModel.fromJson(json.decode(str));

String notificationsModelToJson(NotificationsModel data) =>
    json.encode(data.toJson());

class NotificationsModel {
  NotificationsModel({
    this.status,
    this.message,
    this.notifications,
  });

  int? status;
  String? message;
  List<Notification>? notifications;

  factory NotificationsModel.fromJson(Map<String, dynamic> json) =>
      NotificationsModel(
        status: json["Status"],
        message: json["Message"],
        notifications: json["Notifications"] == null
            ? []
            : List<Notification>.from(
                json["Notifications"]!.map((x) => Notification.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "Status": status,
        "Message": message,
        "Notifications": notifications == null
            ? []
            : List<dynamic>.from(notifications!.map((x) => x.toJson())),
      };
}

class Notification {
  Notification({
    this.notificationID,
    this.userId,
    this.title,
    this.type,
    this.message,
    this.status,
    this.createdAt,
    this.updatedAt,
    this.isRead,
    this.imageUrl,
  });

  int? notificationID;
  int? userId;
  String? title;
  int? type;
  String? message;
  int? status;
  int? isRead;
  DateTime? createdAt;
  DateTime? updatedAt;
  String? imageUrl;

  factory Notification.fromJson(Map<String, dynamic> json) => Notification(
        notificationID: json["NotificationID"],
        userId: json["UserID"],
        title: json["Title"],
        type: json["Type"],
        message: json["Message"],
        status: json["Status"],
        isRead: json["IsRead"],
        createdAt: json["CreatedAt"] == null
            ? null
            : serverDate(json["CreatedAt"])!,
        updatedAt: json["UpdatedAt"] == null
            ? null
            : serverDate(json["UpdatedAt"])!,
        imageUrl: json["ImageUrl"],
      );

  Map<String, dynamic> toJson() => {
        "NotificationID": notificationID,
        "UserID": userId,
        "Title": title,
        "Type": type,
        "Message": message,
        "Status": status,
        "CreatedAt": createdAt?.toIso8601String(),
        "UpdatedAt": updatedAt?.toIso8601String(),
        "ImageUrl": imageUrl,
      };
}


// class Notification {
//   Notification({
//     required this.uid,
//     required this.userId,
//     required this.title,
//     required this.type,
//     required this.message,
//     required this.status,
//     required this.createdAt,
//     required this.updatedAt,
//   });

//   int uid;
//   int userId;
//   String title;
//   int type;
//   String message;
//   int status;
//   DateTime createdAt;
//   DateTime updatedAt;

//   factory Notification.fromJson(Map<String, dynamic> json) => Notification(
//         uid: json["UID"],
//         userId: json["UserID"],
//         title: json["Title"],
//         type: json["Type"],
//         message: json["Message"],
//         status: json["Status"],
//         createdAt: serverDate(json["CreatedAt"])!,
//         updatedAt: serverDate(json["UpdatedAt"])!,
//       );

//   Map<String, dynamic> toJson() => {
//         "UID": uid,
//         "UserID": userId,
//         "Title": title,
//         "Type": type,
//         "Message": message,
//         "Status": status,
//         "CreatedAt": createdAt.toIso8601String(),
//         "UpdatedAt": updatedAt.toIso8601String(),
//       };
// }
