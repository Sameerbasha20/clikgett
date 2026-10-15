import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/old/Constants/button.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/toast.dart';
import 'package:fav_app/old/Screens/Widgets/appbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:get/get.dart';

class FeedBack extends StatefulWidget {
  const FeedBack({Key? key, this.userId}) : super(key: key);
  final dynamic userId;

  @override
  State<FeedBack> createState() => _FeedBackState();
}

class _FeedBackState extends State<FeedBack> {
  final TextEditingController _controller = TextEditingController();
  final OrdersController ordersController = Get.isRegistered<OrdersController>()
      ? Get.find<OrdersController>()
      : Get.put(OrdersController());
  double _rating = 5.0;

  @override
  Widget build(BuildContext context) {
    return Material(
      child: Scaffold(
        appBar: FavAppBar(context: context, title: 'Feedback'),
        body: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
                decoration: const BoxDecoration(color: tLightGrey),
                child: Column(
                  children: [
                    ratingWidget(),
                    const SizedBox(height: 15),
                    TextField(
                      controller: _controller,
                      maxLines: 4,
                      decoration: const InputDecoration(
                          hintText: 'Please write your feedback here (optional)...'),
                    ),
                  ],
                ),
              ),
              Expanded(child: Container()),
              buttonWidget(
                  text: 'Submit',
                  textColor: tWhite,
                  buttonColor: tGreen,
                  onTap: () {
                    Map<String, dynamic> body = <String, dynamic>{
                      'Rating': _rating.toInt(),
                      'FeedbackType': 'Order Experience',
                      'OrderID': widget.userId,
                    };
                    if (_controller.text.trim().isNotEmpty) {
                      body['Message'] = _controller.text.trim();
                    }
                    ordersController.sendfeedback(context, body);
                  })
            ],
          ),
        ),
      ),
    );
  }

  Widget ratingWidget() {
    return RatingBar.builder(
      initialRating: 5.0,
      minRating: 1,
      direction: Axis.horizontal,
      allowHalfRating: false,
      itemCount: 5,
      itemPadding: const EdgeInsets.symmetric(horizontal: 4.0),
      itemBuilder: (context, _) => const Icon(
        Icons.star_rounded,
        color: primaryColor,
        size: 36,
      ),
      onRatingUpdate: (rating) {
        setState(() {
          _rating = rating;
        });
      },
    );
  }
}
