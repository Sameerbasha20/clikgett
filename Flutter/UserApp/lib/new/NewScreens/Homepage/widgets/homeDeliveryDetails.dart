import 'dart:async';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/OrderDetails.dart';
import 'package:fav_app/new/NewScreens/Homepage/widgets/analogedTimer.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lottie/lottie.dart';
import 'package:slide_countdown/slide_countdown.dart';

class DeliveryStatus extends StatefulWidget {
  int indexss;
  DeliveryStatus({super.key, required this.indexss});

  @override
  State<DeliveryStatus> createState() => _DeliveryStatusState();
}

class _DeliveryStatusState extends State<DeliveryStatus> {
  final OrdersController ordersController = Get.find();
  Timer? _dashboardRefreshTimer;

  @override
  void initState() {
    super.initState();
    _dashboardRefreshTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      if (mounted) {
        ordersController.getcurrentorder(context: context);
      }
    });
  }

  @override
  void dispose() {
    _dashboardRefreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<OrdersController>(
        id: 'orders',
        builder: (controller) {
          final order = ordersController.orders[widget.indexss];
          final createdAt = DateTime.tryParse(order.createdAt?.toString() ?? '') ?? DateTime.now();
          final endTime = order.estimateDateTime ?? createdAt.add(const Duration(minutes: 30));
          final remainingDuration = endTime.difference(DateTime.now());
          final isDelayed = DateTime.now().isAfter(endTime);

          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {
              print(order.orderStatus);
              ordersController.getcurrentorder(context: context);
              Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => OrderDetailsScreen(
                            isPastOrders: false,
                            orderNo: order.orderId ?? 0,
                          )));
            },
            child: Container(
              height: 80,
              width: double.infinity,
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: !isDelayed
                    ? LinearGradient(
                        colors: [
                          Color(0xFFa8e063), // Light green
                          Color(0xFF56ab2f), // Darker green
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : LinearGradient(
                        colors: [
                          Color(0xFFFADA7A), // Amber/Yellow
                          Color(0xFFFFA725), // Orange
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Stack(
                children: [
                  Row(
                    children: [
                      if (!isDelayed) ...[
                        Container(
                          height: 40,
                          width: 40,
                          child: LiveAnalogCountdownClock(
                            duration: remainingDuration > Duration.zero
                                ? remainingDuration
                                : Duration.zero,
                            color: bg,
                            onDone: () {},
                          ),
                        ),
                        SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            "${'#${order.OrderSequence}'}\n${_getOrderStatusText(order.orderStatus!)}",
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ] else ...[
                        Container(
                          decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              color: Colors.white),
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Text(
                              '${DateTime.now().difference(endTime).inMinutes}\nMin',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.redAccent,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                        SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            "${'#${order.OrderSequence}'}\n${_getOrderStatusText(order.orderStatus!)}",
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Transform.scale(
                      scale: 1.5,
                      child: ClipRRect(
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(30),
                            bottomLeft: Radius.circular(30),
                            // topRight: Radius.circular(16),
                          ),
                          child: Lottie.asset(
                              'Assets/Images/Homepage/newBike.json')),
                      // 'Assets/Images/Homepage/animation.json'),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
  }

  String _getOrderStatusText(int status) {
    switch (status) {
      case 1:
        return "🎉 Order delivered. Thank you for choosing ClikGett";
      case 2:
        return "📦 Your items are being packed.";
      case 3:
        return "Shipment Created.";
      case 4:
        return "Order Cancelled.";
      case 5:
        return "🛵 Your order is en route.";
      case 6:
        return "Order Returned.";
      case 7:
        return "📍Arrived at your location and will\nhand over your order at your doorstep.";
      case 8:
        return "🕒 Order received — we’ll confirm\nand start packing soon.";
      default:
        return "Status Unknown.";
    }
  }
}
