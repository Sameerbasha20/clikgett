class CheckTimingResponse {
  final int status;
  final String message;

  CheckTimingResponse({required this.status, required this.message});

  factory CheckTimingResponse.fromJson(Map<String, dynamic> json) {
    return CheckTimingResponse(
      status: json['status'],
      message: json['message'],
    );
  }
}
