import 'package:fav_app/new/Constants/number_format.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/CurrentOrders.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';

import '../../../../Constants/static_loader.dart';
import '../../../../Controllers/orders_controller.dart';

class CancelledOrders extends StatefulWidget {
  const CancelledOrders({super.key});

  @override
  State<CancelledOrders> createState() => _CancelledOrdersState();
}

class _CancelledOrdersState extends State<CancelledOrders> {
  @override
  initState() {
    super.initState();
    ordersController.getpastorder(context: context);
  }

  final OrdersController ordersController = Get.find();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        backgroundColor: bg1,
        body: GetBuilder<OrdersController>(
          id: 'orders',
          builder: (controller) => ordersController.isLoading.isTrue
              ? CustomLoader()
              : ordersController.pastorders.isEmpty
                  ? emptyWidget()
                  : RefreshIndicator(
                      backgroundColor: white,
                      color: primary,
                      onRefresh: () async {
                        await ordersController.getpastorder(context: context);
                      },
                      child: ListView.builder(
                        itemCount: ordersController.pastorders.length,
                        physics: const BouncingScrollPhysics(),
                        padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.5.h),
                        itemBuilder: (context, index) {
                          var orders = ordersController.pastorders[index];
                          return ordersBody(
                              orders: orders, isPast: true, context: context);
                        },
                      ),
                    ),
        ));
  }

  Widget emptyWidget() {
    return Container(
      padding: EdgeInsets.all(7.w),
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(
            orderEmptyBanner,
            width: 80.w,
            height: 30.h,
            fit: BoxFit.contain,
          ),
          SizedBox(
            height: 1.h,
          ),
          Text(
            "No past orders found",
            style:
                GoogleFonts.poppins(fontSize: 18.sp, fontWeight: FontWeight.w600, color: tColor),
            textAlign: TextAlign.center,
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(5.w, 1.h, 5.w, 10.h),
            child: Text(
              "Looks like you haven’t made any orders in the past",
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w400,
                fontSize: 14.sp,
                color: tColor3,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget listTile(
      {required String image,
      required String itemsNames,
      required String type,
      required var orderid,
      required var total,
      required String status,
      required var date}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
                flex: 2,
                child: Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                      color: bg1, borderRadius: BorderRadius.circular(0.5.h)),
                  clipBehavior: Clip.antiAliasWithSaveLayer,
                  padding: EdgeInsets.all(0.5.h),
                  child: Image.asset(
                    image,
                    fit: BoxFit.contain,
                  ),
                )),
            SizedBox(
              width: 1.w,
            ),
            Expanded(
                flex: 7,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    customText(
                      text: itemsNames,
                    ),
                    SizedBox(
                      height: 0.5.h,
                    ),
                    customText(
                      text: type,
                      fontSize: 14.sp,
                      color: black.withOpacity(0.50),
                    ),
                  ],
                )),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            customText(
              text: "Order ID",
              fontWeight: FontWeight.w600,
              color: black.withOpacity(0.70),
            ),
            customText(
              text: "#$orderid",
              fontWeight: FontWeight.w600,
            ),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            customText(
              text: "Total Product",
              fontWeight: FontWeight.w600,
              color: black.withOpacity(0.70),
            ),
            Text(money(total),
                style: robotocustomTextstyle(
                  fontWeight: FontWeight.w600,
                )),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            customText(
              text: "Status",
              fontWeight: FontWeight.w600,
              color: black.withOpacity(0.70),
            ),
            customText(
              text: status,
              color: red,
              fontWeight: FontWeight.w600,
            ),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            customText(
              text: "Cancelled on",
              fontWeight: FontWeight.w600,
              color: black.withOpacity(0.70),
            ),
            customText(
              text: "$date",
              fontWeight: FontWeight.w600,
            ),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        Divider(
          thickness: 1.5,
          color: black.withOpacity(0.05),
        ),
        SizedBox(
          height: 3.h,
        ),
      ],
    );
  }
}
