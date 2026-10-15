import 'package:fav_app/old/Constants/button.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Screens/Orders/orders_screen.dart';
import 'package:fav_app/old/Screens/Widgets/appbar_widget.dart';
import 'package:flutter/material.dart';

class OrderSuccessScreen extends StatefulWidget {
  OrderSuccessScreen({Key? key}) : super(key: key);

  @override
  State<OrderSuccessScreen> createState() => _OrderSuccessScreenState();
}

class _OrderSuccessScreenState extends State<OrderSuccessScreen> {
  @override
  Widget build(BuildContext context) {
    return Material(
      child: Scaffold(
        backgroundColor: tWhite,
        appBar: FavAppBar(context: context, title: 'Confirmation'),
        body: SuccessWidget(),
      ),
    );
  }

  Widget SuccessWidget() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Image.asset(
            'Assets/Images/orderSuccess.png',
            width: MediaQuery.of(context).size.width / 2,
          ),
          const SizedBox(
            height: 20,
          ),
          Text(
            'Thank you for \nyour order.',
            style: normalTextstyle(color: primaryColor, fontSize: 30),
            textAlign: TextAlign.center,
          ),
          const SizedBox(
            height: 20,
          ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'you can track the delivery in the “Orders” section.',
              style: normalTextstyle(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(
            height: 20,
          ),
          ordersButton()
        ],
      ),
    );
  }

  Widget ordersButton() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
      child: buttonWidget(
          onTap: () async {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => OrdersScreen()),
            );
          },
          text: 'View Order',
          textColor: tWhite,
          buttonColor: primaryColor),
    );
  }
}
