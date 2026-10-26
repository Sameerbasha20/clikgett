// To parse this JSON data, do
//
//     final userDetailsModel = userDetailsModelFromJson(jsonString);

import 'dart:convert';
import 'package:fav_app/new/Services/common/server_date.dart';

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
    this.emailId,
    required this.firstName,
    required this.lastName,
    this.myReferralCode,
    // required this.fcmToken,
    required this.otp,
    required this.userStatus,
    required this.profilePic,
    required this.createdAt,
    required this.updatedAt,
  });

  dynamic userId;
  String mobileNumber;
  String? emailId;
  String firstName;
  String lastName;
  String? myReferralCode;
  // String fcmToken;
  String otp;
  dynamic userStatus;
  String profilePic;
  DateTime createdAt;
  DateTime updatedAt;

  factory Users.fromJson(Map<String, dynamic> json) => Users(
        userId: json["UserID"],
        mobileNumber: '${json["MobileNumber"] ?? ''}',
        emailId: json["EmailID"],
        firstName: _text(json["FirstName"]),
        myReferralCode: json["MyReferralCode"],
        lastName: _text(json["LastName"]),
        // fcmToken: json["FcmToken"],
        // The server clears the OTP after login, so it is usually null.
        otp: '${json["OTP"] ?? ''}',
        userStatus: json["UserStatus"],
        profilePic: '${json["ProfilePic"] ?? ''}',
        createdAt: serverDate(json["CreatedAt"]) ?? DateTime.now(),
        updatedAt: serverDate(json["UpdatedAt"]) ?? DateTime.now(),
      );

  /// Names come back as "NA" when the customer left them empty.
  static String _text(dynamic v) {
    final t = '${v ?? ''}'.trim();
    return t == 'NA' ? '' : t;
  }

  Map<String, dynamic> toJson() => {
        "UserID": userId,
        "MobileNumber": mobileNumber,
        "EmailID": emailId,
        "FirstName": firstName,
        "LastName": lastName,
        "MyReferralCode": myReferralCode,
        // "FcmToken": fcmToken,
        "OTP": otp,
        // "UserStatus": userStatus,
        "ProfilePic": profilePic,
        "CreatedAt": createdAt.toIso8601String(),
        "UpdatedAt": updatedAt.toIso8601String(),
      };
}
