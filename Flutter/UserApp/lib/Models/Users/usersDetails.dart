// To parse this JSON data, do
//
//     final userDetailsModel = userDetailsModelFromJson(jsonString);

import 'dart:convert';

UserDetailsModel userDetailsModelFromJson(String str) =>
    UserDetailsModel.fromJson(json.decode(str));

String userDetailsModelToJson(UserDetailsModel data) =>
    json.encode(data.toJson());

class UserDetailsModel {
  UserDetailsModel({
    required this.status,
    required this.users,
  });

  int status;
  Users users;

  factory UserDetailsModel.fromJson(Map<String, dynamic> json) =>
      UserDetailsModel(
        status: json["status"],
        users: Users.fromJson(json["Users"]),
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "Users": users.toJson(),
      };
}

class Users {
  Users({
    required this.userId,
    required this.mobileNumber,
    required this.emailId,
    required this.firstName,
    required this.lastName,
    required this.fcmToken,
    required this.otp,
    required this.userStatus,
    required this.profilePic,
    required this.createdAt,
    required this.updatedAt,
  });

  int userId;
  String mobileNumber;
  String emailId;
  String firstName;
  String lastName;
  String fcmToken;
  String otp;
  int userStatus;
  String profilePic;
  DateTime createdAt;
  DateTime updatedAt;

  factory Users.fromJson(Map<String, dynamic> json) => Users(
        userId: json["UserID"],
        mobileNumber: json["MobileNumber"],
        emailId: json["EmailID"],
        firstName: json["FirstName"],
        lastName: json["LastName"],
        fcmToken: json["FcmToken"],
        otp: json["OTP"],
        userStatus: json["UserStatus"],
        profilePic: json["ProfilePic"],
        createdAt: DateTime.parse(json["CreatedAt"]),
        updatedAt: DateTime.parse(json["UpdatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "UserID": userId,
        "MobileNumber": mobileNumber,
        "EmailID": emailId,
        "FirstName": firstName,
        "LastName": lastName,
        "FcmToken": fcmToken,
        "OTP": otp,
        "UserStatus": userStatus,
        "ProfilePic": profilePic,
        "CreatedAt": createdAt.toIso8601String(),
        "UpdatedAt": updatedAt.toIso8601String(),
      };
}
