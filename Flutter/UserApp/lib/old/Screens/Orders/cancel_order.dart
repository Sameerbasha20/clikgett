import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/old/Constants/button.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Constants/toast.dart';
import 'package:fav_app/old/Screens/Widgets/appbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class CancelOrder extends StatefulWidget {
  CancelOrder({Key? key, this.orderid}) : super(key: key);
  final orderid;

  @override
  State<CancelOrder> createState() => _CancelOrderState();
}

class _CancelOrderState extends State<CancelOrder> {
  final TextEditingController _controller = TextEditingController();
  final OrdersController ordersController = Get.find();
  @override
  Widget build(BuildContext context) {
    return Material(
      child: Scaffold(
        appBar: FavAppBar(context: context, title: 'Reason for Cancelling'),
        body: Container(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Reason for Cancelling & confirm cancelation ?',
                style: normalTextstyle(
                  color: tBlack,
                ),
              ),
              TextField(
                controller: _controller,
                onChanged: (value) {
                  if (value == ' ') {
                    _controller.clear();
                  }
                },
                decoration: const InputDecoration(
                    hintText: 'Please write your reason here'),
              ),
              Expanded(child: Container()),
              buttonWidget(
                  text: 'Submit',
                  textColor: tWhite,
                  buttonColor: tGreen,
                  onTap: () async {
                    if (_controller.text.isEmpty) {
                      customToast(message: 'Please enter Reason');
                    } else {
                      // customToast(message: 'Order Cancelled Succesfully');
                      // Navigator.pop(context);
                      Map<String, dynamic> body = <String, dynamic>{};
                      body['CancellationReason'] = _controller.text;
                      await ordersController.cancelOrders(
                          context, body, widget.orderid);
                    }
                  })
            ],
          ),
        ),
      ),
    );
  }
}
