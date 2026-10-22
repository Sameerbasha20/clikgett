import 'package:fav_app/new/Services/order_tracking_services.dart';
// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/OrderDetails.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lottie/lottie.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../../../old/Models/Orders/orders.dart';

class CurrentOrders extends StatefulWidget {
  const CurrentOrders({super.key});

  @override
  State<CurrentOrders> createState() => _CurrentOrdersState();
}

class _CurrentOrdersState extends State<CurrentOrders> {
  @override
  initState() {
    super.initState();
    ordersController.getcurrentorder(context: context);
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
              : ordersController.orders.isEmpty
                  ? emptyWidget()
                  : RefreshIndicator(
                      onRefresh: () async {
                        await ordersController.getcurrentorder(
                            context: context);
                      },
                      child: ListView.builder(
                        itemCount: ordersController.orders.length,
                        physics: const BouncingScrollPhysics(),
                        padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.5.h),
                        itemBuilder: (context, index) {
                          var orders = ordersController.orders[index];
                          return ordersBody(orders: orders, context: context);
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
            "No orders found",
            style:
                GoogleFonts.poppins(fontSize: 18.sp, fontWeight: FontWeight.w600, color: tColor),
            textAlign: TextAlign.center,
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(5.w, 1.h, 5.w, 10.h),
            child: Text(
              "Looks like you haven’t made your order yet",
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
      required Function() trackOrder}) {
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
                    child: CustomNetworkImage(url: image))),
            SizedBox(
              width: 1.w,
            ),
            Expanded(
                flex: 7,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      itemsNames,
                      style: GoogleFonts.poppins(fontSize: 14),
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
            Text("${Constants.rupee} $total",
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
              color: primary,
              fontWeight: FontWeight.w600,
            ),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        InkWell(
          child: Text(
            "Track My Order",
            style: customTextstyle(
                color: green,
                fontWeight: FontWeight.w600,
                textDecoration: TextDecoration.underline),
            textAlign: TextAlign.left,
          ),
          onTap: trackOrder,
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

Widget ordersBody(
    {bool isPast = false, required Order orders, required context}) {
  String statusText = getOrderStatusText(orders.orderStatus ?? 0);
  Color statusColor = tColor2;

  if (orders.orderStatus == 1) {
    statusColor = primary;
    statusText = 'Delivered on ${DateFormat("dd MMM, hh:mm a").format(orders.deliveredCancelleddatetime ?? DateTime.now())}';
  } else if (orders.orderStatus == OrderStatus.packing || orders.orderStatus == OrderStatus.assigned) {
    statusColor = Colors.orange.shade700;
  } else if (orders.orderStatus == OrderStatus.outForDelivery || orders.orderStatus == OrderStatus.arrived) {
    statusColor = Colors.blue.shade700;
  } else if (OrderStatus.isCancelled(orders.orderStatus ?? 0)) {
    statusColor = Colors.red.shade600;
    statusText = 'Cancelled on ${DateFormat("dd MMM, hh:mm a").format(orders.deliveredCancelleddatetime ?? DateTime.now())}';
  }

  return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => OrderDetailsScreen(
                      isPastOrders: isPast,
                      orderNo: orders.orderId ?? 0,
                    )));
      },
      child: Container(
        margin: EdgeInsets.only(bottom: 1.5.h),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: cardBorder, width: 1),
          boxShadow: softCardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order ID + Grand Total
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Order #${orders.OrderSequence}',
                    style: GoogleFonts.poppins(
                      fontSize: 13.5.sp,
                      fontWeight: FontWeight.w600,
                      color: tColor,
                    ),
                  ),
                ),
                Text(
                  '₹${orders.grandTotal?.toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                    fontSize: 16.5.sp,
                    fontWeight: FontWeight.w700,
                    color: tColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Thumbnail | Status Text | Status Icon / Animation
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    height: 60,
                    width: 60,
                    decoration: BoxDecoration(
                      color: Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: cardBorder, width: 0.8),
                    ),
                    padding: const EdgeInsets.all(4),
                    child: CustomNetworkImage(
                      url: orders.productImages.isNotEmpty ? (orders.productImages.first ?? '') : '',
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Center: Status Text
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        statusText,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(
                          fontSize: 13.5.sp,
                          fontWeight: FontWeight.w500,
                          color: statusColor,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Tap to view details",
                        style: GoogleFonts.poppins(
                          fontSize: 12.sp,
                          color: tColor3,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),

                // Right: Status Icon / Lottie
                orders.orderStatus == 1
                    ? Icon(Icons.check_circle_rounded,
                        color: primary, size: 28)
                    : OrderStatus.isCancelled(orders.orderStatus ?? 0)
                        ? Icon(Icons.cancel_rounded,
                            color: Colors.red.shade600, size: 28)
                        : Lottie.asset(
                            'Assets/Images/Homepage/newBike.json',
                            width: 48,
                            height: 48,
                            fit: BoxFit.cover,
                          ),
              ],
            ),
          ],
        ),
      ));
}

String getOrderStatusText(int status) => OrderStatus.message(status);
