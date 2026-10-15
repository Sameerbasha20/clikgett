import 'package:fav_app/Constants/button.dart';
import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/Screens/Widgets/appbar_widget.dart';
import 'package:fav_app/ViewModels/Orders/orders.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class CancelOrder extends StatefulWidget {
  CancelOrder({Key? key, this.orderid}) : super(key: key);
  final orderid;

  @override
  State<CancelOrder> createState() => _CancelOrderState();
}

class _CancelOrderState extends State<CancelOrder> {
  OrdersViewModel? ordersViewModel;
  TextEditingController _controller = TextEditingController();
  @override
  Widget build(BuildContext context) {
    if (mounted) {
      ordersViewModel = context.watch<OrdersViewModel>();
    }
    return Material(
      child: Scaffold(
        appBar: FavAppBar(context: context, title: 'Reason for Cancelling'),
        body: Container(
          padding: EdgeInsets.symmetric(horizontal: 40, vertical: 20),
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
                      Map<String, dynamic> body = Map<String, dynamic>();
                      body['CancellationReason'] = _controller.text;
                      await ordersViewModel?.cancelOrders(
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
