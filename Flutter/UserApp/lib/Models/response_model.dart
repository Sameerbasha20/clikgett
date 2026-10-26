class ResponseModel {
  int? status;
  String? message;
  /// Machine-readable reason, e.g. USER_NOT_FOUND / USER_EXISTS on OTP requests.
  String? code;

  ResponseModel({this.status, this.message});

  ResponseModel.fromJson(Map<String, dynamic> json) {
    status = json['Status'];
    message = json['Message'];
    code = json['Code'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['Status'] = status;
    data['Message'] = message;
    return data;
  }
}
