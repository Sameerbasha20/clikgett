class CheckTimingResponse {
  final int status;
  final String message;

  /// "We open at 8:00 AM" while the store is closed, when the next opening is known.
  final String? opensAt;

  CheckTimingResponse({required this.status, required this.message, this.opensAt});

  factory CheckTimingResponse.fromJson(Map<String, dynamic> json) {
    return CheckTimingResponse(
      status: json['status'] is int ? json['status'] : int.tryParse('${json['status']}') ?? 1,
      message: json['message']?.toString() ?? '',
      opensAt: json['OpensAt']?.toString(),
    );
  }
}
