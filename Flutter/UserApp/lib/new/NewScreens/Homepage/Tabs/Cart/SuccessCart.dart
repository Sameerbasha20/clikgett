import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/OrderDetails.dart';
import 'package:fav_app/old/Constants/customMediaQuery.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../../Constants/colors.dart';
import '../Orders/Orders.dart';

class SuccessCart extends StatefulWidget {
  int? orderId;
  SuccessCart({super.key, required this.orderId});
  @override
  State<SuccessCart> createState() => _SuccessCartState();
}

class _SuccessCartState extends State<SuccessCart> {
  @override
  void initState() {
    super.initState();

    print(widget.orderId);
    print("orderIde");

    Future.delayed(const Duration(seconds: 3), () {
      // Navigate to your desired screen, for example Homepage:
      homeController.updateTabIndex(0);
      Navigator.of(context).push(MaterialPageRoute(
        builder: (context) =>
            OrderDetailsScreen(orderNo: widget.orderId!), // Pass orderId here
      ));
    });
  }

  final HomeController homeController = Get.find();
  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        homeController.updateTabIndex(0);
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const Homepage()),
          (route) => false,
        );
        return false;
      },
      child: Scaffold(
          body: SafeArea(
        child: Container(
          width: customWidth(context: context, width: 1),
          height: customHeight(context: context, height: 1),
          color: bg,
          alignment: Alignment.center,
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 100.0),
                child: Image(
                  image: const AssetImage(
                    "Assets/Images/Homepage/cart/confirmation.png",
                  ),
                  width: customWidth(context: context, width: 0.8),
                  height: customHeight(context: context, height: 0.3),
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(
                height: 30,
              ),
              customText(
                text: "Thank you for your order.",
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
              const SizedBox(
                height: 10,
              ),
              SizedBox(
                width: 250,
                child: customText(
                  text: "You can track your order in the 'My Orders' section.",
                  fontWeight: FontWeight.w400,
                  color: black.withOpacity(0.70),
                  fontSize: 15,
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(
                height: 30,
              ),
//               TextButton(
//                   onPressed: () {
//                     homeController.updateTabIndex(1);
//                     // Navigator.pushAndRemoveUntil(
//                     //     context,
//                     //     MaterialPageRoute(builder: (_) => const Homepage()),
//                     //     (route) => false);
//                     Navigator.of(context).push(MaterialPageRoute(
//                       builder: (context) => OrderDetailsScreen(orderNo: widget.orderId!), // Pass orderId here
// ));
//                   },
//                   child: Text(
//                     "View Order",
//                     style: customTextstyle(
//                         fontWeight: FontWeight.w600,
//                         color: green,
//                         textDecoration: TextDecoration.underline),
//                   )),
              const SizedBox(
                height: 10,
              ),
              Spacer(),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    side: BorderSide(color: Appprimary),
                    // Border color
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(26),
                    ),
                  ),
                  onPressed: () {
                    homeController.updateTabIndex(0);
                    Navigator.of(context).pushReplacement(MaterialPageRoute(
                      builder: (context) => OrderDetailsScreen(
                          orderNo: widget.orderId!), // Pass orderId here
                    ));
                  },
                  child: customText(
                    text: "Track your order",
                    textAlign: TextAlign.center,
                    color: Appprimary,
                    // Text color
                    fontSize: 20.h,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              SizedBox(
                height: 15,
              ),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Color(0xFF26A860), // Set background color
                    side: BorderSide(
                        color:
                            Colors.transparent), // Remove the outlined border
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(26),
                    ),
                  ),
                  onPressed: () {
                    homeController.updateTabIndex(0);
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (_) => const Homepage()),
                      (route) => false,
                    );
                  },
                  child: customText(
                    text: "Go to Home",
                    textAlign: TextAlign.center,
                    color: Colors.white, // Text color set to white
                    fontSize: 20.h,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              SizedBox(
                height: 15,
              ),
            ],
          ),
        ),
      )),
    );
  }
}
