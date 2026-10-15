class LoginModel {
  int? status;
  UserData? userData;
  String? message;
  String? token;

  LoginModel({this.status, this.userData, this.message, this.token});

  LoginModel.fromJson(Map<String, dynamic> json) {
    status = json['Status'];
    userData = json['userData'] != null
        ? new UserData.fromJson(json['userData'])
        : null;
    message = json['Message'];
    token = json['token'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['Status'] = this.status;
    if (this.userData != null) {
      data['userData'] = this.userData!.toJson();
    }
    data['Message'] = this.message;
    data['token'] = this.token;
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
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['UserID'] = this.userID;
    data['FirstName'] = this.firstName;
    data['profilePic'] = this.profilePic;
    return data;
  }
}
