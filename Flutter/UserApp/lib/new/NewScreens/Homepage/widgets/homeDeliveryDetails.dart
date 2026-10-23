import 'dart:async';

import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/OrderDetails.dart';
import 'package:fav_app/new/Services/order_tracking_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

/// Live order card above the bottom navigation on the home screen.
class DeliveryStatus extends StatefulWidget {
  final int indexss;
  const DeliveryStatus({super.key, required this.indexss});

  @override
  State<DeliveryStatus> createState() => _DeliveryStatusState();
}

class _DeliveryStatusState extends State<DeliveryStatus> with SingleTickerProviderStateMixin {
  final OrdersController ordersController = Get.find();
  Timer? _refreshTimer;
  late final AnimationController _ride =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 700))..repeat(reverse: true);

  @override
  void initState() {
    super.initState();
    // Status from the server every 20 s; the minutes left are recomputed on each rebuild.
    _refreshTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      if (mounted) ordersController.getcurrentorder(context: context);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _ride.dispose();
    super.dispose();
  }

  static const _steps = [
    OrderStatus.received,
    OrderStatus.packing,
    OrderStatus.assigned,
    OrderStatus.outForDelivery,
    OrderStatus.arrived,
  ];

  IconData _icon(int status, bool scheduled) {
    if (scheduled) return Icons.event_available_rounded;
    switch (status) {
      case OrderStatus.packing:
        return Icons.inventory_2_rounded;
      case OrderStatus.assigned:
        return Icons.person_pin_circle_rounded;
      case OrderStatus.outForDelivery:
        return Icons.delivery_dining_rounded;
      case OrderStatus.arrived:
        return Icons.home_rounded;
      default:
        return Icons.receipt_long_rounded;
    }
  }

  String _duration(Duration d) {
    final mins = d.inMinutes;
    if (mins < 60) return '$mins min';
    final h = mins ~/ 60, m = mins % 60;
    return m == 0 ? '$h hr' : '$h hr $m min';
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<OrdersController>(
        id: 'orders',
        builder: (_) {
          if (widget.indexss >= ordersController.orders.length) return const SizedBox.shrink();
          final order = ordersController.orders[widget.indexss];
          final status = order.orderStatus ?? OrderStatus.received;
          final scheduledAt = order.scheduleStatus == 'Scheduled' ? order.scheduledDateTime : null;
          final scheduled = scheduledAt != null && status == OrderStatus.received;
          final createdAt = order.createdAt ?? DateTime.now();
          final eta = order.estimateDateTime ?? createdAt.add(const Duration(minutes: 30));
          final left = eta.difference(DateTime.now());
          final late = !scheduled && left.isNegative;

          final String headline;
          if (scheduled) {
            headline = 'Scheduled for ${DateFormat('EEE, d MMM').format(scheduledAt)}';
          } else if (status == OrderStatus.arrived) {
            headline = 'Your delivery partner is here';
          } else if (late) {
            headline = 'Taking a little longer';
          } else {
            headline = 'Arriving in ${_duration(left + const Duration(seconds: 59))}';
          }

          final accent = late ? const Color(0xFFF59E0B) : primary;
          final stepIndex = _steps.indexOf(status);
          final progress = stepIndex < 0 ? 0.1 : (stepIndex + 1) / (_steps.length + 1);

          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {
              ordersController.getcurrentorder(context: context);
              Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => OrderDetailsScreen(isPastOrders: false, orderNo: order.orderId ?? 0)));
            },
            child: Container(
              margin: const EdgeInsets.fromLTRB(10, 4, 10, 4),
              padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
              decoration: BoxDecoration(
                color: white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: accent.withOpacity(0.35)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 2))],
              ),
              child: Row(children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(color: accent.withOpacity(0.12), shape: BoxShape.circle),
                  child: status == OrderStatus.outForDelivery && !scheduled
                      ? AnimatedBuilder(
                          animation: _ride,
                          builder: (_, child) => Transform.translate(offset: Offset(-2 + 4 * _ride.value, 0), child: child),
                          child: Icon(_icon(status, scheduled), color: accent, size: 24),
                        )
                      : Icon(_icon(status, scheduled), color: accent, size: 22),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(headline,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: tColor)),
                      Text('#${order.OrderSequence ?? order.orderId} · ${OrderStatus.title(status)}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(fontSize: 11.5, color: grey70)),
                      const SizedBox(height: 5),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 4,
                          color: accent,
                          backgroundColor: accent.withOpacity(0.15),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: grey70),
              ]),
            ),
          );
        });
  }
}
