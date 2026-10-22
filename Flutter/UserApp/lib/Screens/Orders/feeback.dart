import 'package:fav_app/Constants/button.dart';
import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/Screens/Widgets/appbar_widget.dart';
import 'package:fav_app/Services/Orders/orders.dart';
import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';

class FeedBack extends StatefulWidget {
  const FeedBack({Key? key, this.userId, this.orderId}) : super(key: key);
  final dynamic userId;
  final dynamic orderId;

  @override
  State<FeedBack> createState() => _FeedBackState();
}

class _FeedBackState extends State<FeedBack> {
  final TextEditingController _controller = TextEditingController();
  double _rating = 5.0;
  bool _isSubmitting = false;
  // Feedback cashback is once per customer; null until the server answers.
  bool? _rewardAvailable;

  @override
  void initState() {
    super.initState();
    _loadRewardEligibility();
  }

  Future<void> _loadRewardEligibility() async {
    try {
      final res = await OrderServices.feedbackEligibility(resolvedOrderId);
      final program = res?['rewardProgram'];
      if (!mounted) return;
      setState(() => _rewardAvailable = program is Map && program['enabled'] == true);
    } catch (_) {
      if (mounted) setState(() => _rewardAvailable = false);
    }
  }

  int get resolvedOrderId {
    final raw = widget.orderId ?? widget.userId;
    if (raw is int) return raw;
    if (raw is String) return int.tryParse(raw) ?? 0;
    return 0;
  }

  String get _ratingLabel {
    switch (_rating.toInt()) {
      case 5:
        return '⭐⭐⭐⭐⭐ Excellent Experience';
      case 4:
        return '⭐⭐⭐⭐ Good Experience';
      case 3:
        return '⭐⭐⭐ Average Experience';
      case 2:
        return '⭐⭐ Below Average';
      case 1:
        return '⭐ Poor Experience';
      default:
        return '${_rating.toInt()} / 5 Stars';
    }
  }

  Future<void> _handleSubmit() async {
    if (_isSubmitting) return;

    if (_rating < 1 || _rating > 5) {
      customToast(message: 'Please select a star rating between 1 and 5');
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final Map<String, dynamic> body = <String, dynamic>{
        'Rating': _rating.toInt(),
        'FeedbackType': 'Order Experience',
        'OrderID': resolvedOrderId,
      };

      if (_controller.text.trim().isNotEmpty) {
        body['Message'] = _controller.text.trim();
      }

      final response = await OrderServices.ordersfeedback(body);

      setState(() {
        _isSubmitting = false;
      });

      if (response != null && response.status == 1) {
        if (!mounted) return;
        _showSuccessConfirmation(
          response.message ??
              'Thank you! Your feedback has been received and may be reviewed by the ClikGett team.',
        );
      } else {
        final errorMsg =
            response?.message ?? 'Feedback recorded or already submitted';
        customToast(message: errorMsg);
        if (mounted) Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });
      customToast(message: 'Thank you for your feedback!');
      if (mounted) Navigator.pop(context, true);
    }
  }

  void _showSuccessConfirmation(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 28),
            SizedBox(width: 8),
            Text(
              'Feedback Submitted',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message,
              style: const TextStyle(fontSize: 14, color: Color(0xFF334155)),
            ),
            if (_rewardAvailable == true) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: const Text(
                '🎁 Our team reviews feedback for eligible cashback rewards. Approved rewards will be credited directly to your ClikGett wallet.',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF166534),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx); // close dialog
              if (mounted) Navigator.pop(context, true); // return to caller
            },
            child: const Text(
              'Done',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: Color(0xFF16A34A),
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      child: Scaffold(
        appBar: FavAppBar(context: context, title: 'Order Feedback'),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cashback / Reward Program info banner (only while the customer's one-time reward is unused)
              if (_rewardAvailable == true) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF86EFAC)),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.card_giftcard_rounded,
                      color: Color(0xFF16A34A),
                      size: 24,
                    ),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'ClikGett Feedback Reward Program',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF14532D),
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Share your honest feedback on this delivery. All reviews are evaluated by our team for wallet cashback rewards. Honest negative feedback is fully welcomed and equally eligible! One-time reward per customer.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF166534),
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              ],

              // Rating Card
              Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                decoration: BoxDecoration(
                  color: tLightGrey,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  children: [
                    if (resolvedOrderId > 0)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Text(
                          'Order #$resolvedOrderId',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ),
                    const Text(
                      'Rate your experience',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: tBlack,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _ratingLabel,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: primaryColor,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ratingWidget(),
                    const SizedBox(height: 20),
                    TextField(
                      controller: _controller,
                      maxLines: 4,
                      maxLength: 1000,
                      decoration: InputDecoration(
                        hintText:
                            'Share your honest feedback (e.g. delivery speed, item quality, packaging)...',
                        hintStyle: TextStyle(
                            color: Colors.grey.shade500, fontSize: 13),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide:
                              const BorderSide(color: primaryColor, width: 1.5),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),

              // Submit Button
              buttonWidget(
                text: _isSubmitting ? 'Submitting...' : 'Submit Feedback',
                textColor: tWhite,
                buttonColor: _isSubmitting ? Colors.grey : tGreen,
                onTap: _handleSubmit,
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget ratingWidget() {
    return RatingBar.builder(
      initialRating: _rating,
      minRating: 1,
      direction: Axis.horizontal,
      allowHalfRating: false,
      itemCount: 5,
      itemPadding: const EdgeInsets.symmetric(horizontal: 4.0),
      itemBuilder: (context, _) => const Icon(
        Icons.star_rounded,
        color: Colors.amber,
        size: 38,
      ),
      onRatingUpdate: (rating) {
        setState(() {
          _rating = rating;
        });
      },
    );
  }
}
