class LoginModel {
  int? status;
  UserData? userData;
  String? message;
  String? token;
  // Short login token + refresh token (sent when the app asks with X-Auth-Refresh).
  String? refreshToken;
  int? expiresIn;

  LoginModel({this.status, this.userData, this.message, this.token, this.refreshToken, this.expiresIn});

  LoginModel.fromJson(Map<String, dynamic> json) {
    status = json['Status'];
    userData =
        json['userData'] != null ? UserData.fromJson(json['userData']) : null;
    message = json['Message'];
    token = json['token'];
    refreshToken = json['RefreshToken'];
    expiresIn = (json['ExpiresIn'] as num?)?.toInt();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['Status'] = status;
    if (userData != null) {
      data['userData'] = userData!.toJson();
    }
    data['Message'] = message;
    data['token'] = token;
    return data;
  }
}

class UserData {
  int? userID;
  String? firstName;
  String? profilePic;

  UserData({this.userID, this.firstName, this.profilePic});

  UserData.fromJson(Map<String, dynamic> json) {
    userID = json['UserID'];
    firstName = json['FirstName'];
    profilePic = json['profilePic'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['UserID'] = userID;
    data['FirstName'] = firstName;
    data['profilePic'] = profilePic;
    return data;
  }
}
