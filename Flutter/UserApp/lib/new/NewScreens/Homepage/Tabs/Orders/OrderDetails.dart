// ignore_for_file: prefer_const_constructors
import 'dart:async';
import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/CurrentOrders.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/dashedBorder.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/widgets/view_receipt.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:flutter/material.dart';
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:shimmer/shimmer.dart';
import 'package:slide_countdown/slide_countdown.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../../../../../Services/common/common_services.dart';
import '../../../../Constants/empty_data.dart';
import '../../../../Constants/static_loader.dart';
import '../../../../Controllers/orders_controller.dart';
import 'package:fav_app/Screens/Orders/feeback.dart';
import 'package:fav_app/Screens/Orders/post_delivery_dialog.dart';
import 'package:fav_app/old/Services/Orders/orders.dart';

class OrderDetailsScreen extends StatefulWidget {
  const OrderDetailsScreen(
      {super.key, this.isPastOrders = false, required this.orderNo});

  final bool isPastOrders;
  final int orderNo;

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: false); // set repeat(false) if you want it once
    ordersController.getordersDeatils(context: context, id: widget.orderNo);
    // getCancelOrder();
    startCheckingTime();
  }

  Future<void> getCancelOrder() async {
    await CommonServices.getToken().then((onValue) {
      String token = onValue; // Store the token
    });
  }

  int? statuscode;

  bool _checkedPostDeliveryPrompt = false;

  void _checkAndShowPostDeliveryPopup() {
    if (_checkedPostDeliveryPrompt) return;
    final order = ordersController.ordersdetails;
    if (order != null && order.orderStatus == 1) {
      _checkedPostDeliveryPrompt = true;
      final orderId = order.orderId ?? widget.orderNo;
      PostDeliveryFeedbackDialog.hasPromptBeenShown(orderId).then((shown) {
        if (!shown && mounted) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              PostDeliveryFeedbackDialog.show(
                context,
                orderId: orderId,
                orderTotal: double.tryParse(order.grandTotal?.toString() ?? '0'),
                onFeedbackSubmitted: () {
                  if (mounted) {
                    ordersController.getordersDeatils(
                        context: context, id: widget.orderNo);
                  }
                },
              );
            }
          });
        }
      });
    }
  }

  Future<void> _openReceipt(BuildContext context) async {
    final order = ordersController.ordersdetails;
    if (order == null) return;

    final orderId = order.orderId ?? widget.orderNo;
    String invoiceUrl = order.orderInvoice ?? '';

    if (invoiceUrl.isEmpty || !invoiceUrl.startsWith('http')) {
      String base = Constants.baseUrl;
      if (base.endsWith('/api')) {
        base = base.substring(0, base.length - 4);
      }
      invoiceUrl = "$base/api/orders/invoice/$orderId";
    }

    // The invoice endpoint requires the order owner's token; the PDF viewer
    // cannot send headers, so it goes in the query string.
    if (invoiceUrl.contains('/orders/invoice/')) {
      final token = await CommonServices.getToken();
      if (token.isNotEmpty) {
        invoiceUrl = Uri.parse(invoiceUrl).replace(queryParameters: {
          ...Uri.parse(invoiceUrl).queryParameters,
          'token': token,
        }).toString();
      }
    }
    if (!context.mounted) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => InAppPdfViewerPage(
          pdfUrl: invoiceUrl,
          orderId: orderId,
        ),
      ),
    );
  }

  final TextEditingController cancelController = TextEditingController();

  final OrdersController ordersController = Get.find();
  final formkey = GlobalKey<FormState>();

  bool isTimeDifferenceExceeded = false;
  Timer? timer; // Timer reference
  Timer? etaRefreshTimer;

  void startEtaPolling() {
    etaRefreshTimer?.cancel();
    etaRefreshTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      final order = ordersController.ordersdetails;
      if (order != null && ![1, 4].contains(order.orderStatus)) {
        OrderServices.getordersDetails(widget.orderNo).then((res) {
          if (res != null && res.status == 1 && mounted) {
            ordersController.ordersdetailsmodel = res;
            ordersController.ordersdetails = res.orders;
            ordersController.updateOrders();
          }
        }).catchError((_) {});
      }
    });
  }

  void startCheckingTime() {
    startEtaPolling();
    timer = Timer.periodic(Duration(seconds: 1), (timer) {
      isDifferenceMoreThanTwoMinutes(ordersController.ordersdetails?.createdAt);
    });
  }

  void isDifferenceMoreThanTwoMinutes(DateTime? createdAt) {
    if (createdAt == null) {
      return;
    }
    // Calculate the difference between the two DateTime objects
    Duration difference = DateTime.now().difference(createdAt);

    // Check if the difference in minutes is greater than 2
    // If the difference is more than 2 minutes, update the condition and stop the timer
    if (difference.inSeconds > 120 && !isTimeDifferenceExceeded) {
      isTimeDifferenceExceeded = true; // Trigger UI refresh
      timer?.cancel(); // Stop the timer
      setState(() {});
    }
    // return difference.inMinutes > 2;
  }

  bool isTimeDifferenceFound(DateTime? createdAt) {
    if (createdAt == null) {
      return true;
    }
    // Calculate the difference between the two DateTime objects
    Duration difference = DateTime.now().difference(createdAt);

    // Check if the difference in minutes is greater than 2
    // If the difference is more than 2 minutes, update the condition and stop the timer

    return difference.inSeconds > 120;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      OrderServices.getordersDetails(widget.orderNo).then((res) {
        if (res != null && res.status == 1 && mounted) {
          ordersController.ordersdetailsmodel = res;
          ordersController.ordersdetails = res.orders;
          ordersController.updateOrders();
        }
      }).catchError((_) {});
    }
  }

  String _formatNaturalRemainingDuration(Duration duration) {
    if (duration.isNegative || duration.inSeconds <= 0) {
      return "0 minutes";
    }
    final totalMinutes = duration.inMinutes;
    final hours = totalMinutes ~/ 60;
    final mins = totalMinutes % 60;

    if (hours == 0) {
      return "$mins minute${mins == 1 ? '' : 's'}";
    } else if (mins == 0) {
      return "$hours hour${hours == 1 ? '' : 's'}";
    } else {
      return "$hours hour${hours == 1 ? '' : 's'} $mins minute${mins == 1 ? '' : 's'}";
    }
  }

  String _getFriendlyDelayReason(dynamic order) {
    if (order.latestDelayReasonText != null &&
        order.latestDelayReasonText!.trim().isNotEmpty) {
      return order.latestDelayReasonText!;
    }
    final raw = order.latestDelayReason ?? '';
    switch (raw.toUpperCase()) {
      case 'HEAVY_TRAFFIC':
        return 'heavy traffic';
      case 'WEATHER_CONDITIONS':
      case 'HEAVY_RAIN':
        return 'weather conditions';
      case 'STORE_PREPARATION_DELAY':
      case 'RESTAURANT_DELAY':
        return 'store preparation delay';
      case 'ORDER_NOT_READY':
      case 'ORDER_ISSUE':
        return 'order not ready for pickup';
      case 'DIFFICULTY_LOCATING_CUSTOMER':
      case 'CUSTOMER_LOCATION_ISSUE':
        return 'difficulty locating your address';
      case 'VEHICLE_ISSUE':
        return 'delivery vehicle issue';
      case 'ROAD_BLOCK':
        return 'road block or diversion';
      case 'APP_NETWORK_ISSUE':
        return 'network connectivity issue';
      case 'OTHER':
        return (order.latestDelayRemarks != null &&
                order.latestDelayRemarks!.trim().isNotEmpty)
            ? order.latestDelayRemarks!.trim()
            : 'operational delay';
      default:
        if (order.latestDelayRemarks != null &&
            order.latestDelayRemarks!.trim().isNotEmpty) {
          return order.latestDelayRemarks!.trim();
        }
        return raw.isNotEmpty
            ? raw.replaceAll('_', ' ').toLowerCase()
            : 'operational delay';
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    ordersController.removeLoader();
    ordersController.clearOrderDetails();
    timer?.cancel();
    etaRefreshTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        surfaceTintColor: Colors.transparent,
        backgroundColor: white,
        elevation: 0,
        centerTitle: false,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: cardBorder,
            height: 1,
          ),
        ),
        title: Text(
          "Order Details",
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            fontSize: 17.5.sp,
            color: tColor,
          ),
        ),
        leading: IconButton(
          padding: EdgeInsets.zero,
          onPressed: () {
            Navigator.of(context).pop();
          },
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: tColor,
          ),
        ),
        actions: [
          GetBuilder<OrdersController>(
            builder: (controller) {
              final order = ordersController.ordersdetails;
              if (order == null) return const SizedBox.shrink();

              return Padding(
                padding: const EdgeInsets.only(right: 14),
                child: Center(
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => _openReceipt(context),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: primaryLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: primary.withOpacity(0.2)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.receipt_long_rounded, size: 16, color: primary),
                            const SizedBox(width: 4),
                            Text(
                              'Receipt',
                              style: GoogleFonts.poppins(
                                color: primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 13.sp,
                              ),
                            ),
                            const SizedBox(width: 3),
                            const Icon(
                              Icons.download_rounded,
                              size: 15,
                              color: primary,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      backgroundColor: bg1,
      body: RefreshIndicator(
        backgroundColor: white,
        color: Appprimary,
        onRefresh: () async {
          await ordersController.getordersDeatils(
              context: context, id: widget.orderNo);
        },
        child: GetBuilder<OrdersController>(
          id: 'update-orders',
          builder: (controller) {
            if (ordersController.isorderDetailsLoading.isTrue) {
              return const CustomLoader();
            }
            if (ordersController.ordersdetails == null ||
                ordersController.ordersdetails?.orderId == null) {
              return const EmptyDataWidget(message: 'No Orders Details Found');
            }
            _checkAndShowPostDeliveryPopup();
            return SingleChildScrollView(
              // padding: EdgeInsets.all(5.w),
              physics: const BouncingScrollPhysics(),
              child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (ordersController.ordersdetails?.scheduleStatus == 'Scheduled')
                                Container(
                                  margin: EdgeInsets.all(3.w),
                                  padding: EdgeInsets.all(3.5.w),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF0FDF4),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFF86EFAC), width: 1.2),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF22C55E).withOpacity(0.15),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.event_available, color: Color(0xFF16A34A), size: 22),
                                      ),
                                      SizedBox(width: 3.w),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              "Scheduled Delivery Order",
                                              style: GoogleFonts.poppins(
                                                fontSize: 14.5.sp,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF15803D),
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              ordersController.ordersdetails?.scheduledDateTime != null
                                                  ? "Arriving on ${DateFormat('EEE, MMM d, yyyy • hh:mm a').format(ordersController.ordersdetails!.scheduledDateTime!)}"
                                                  : "Scheduled for Future Delivery",
                                              style: GoogleFonts.poppins(
                                                fontSize: 12.5.sp,
                                                fontWeight: FontWeight.w500,
                                                color: const Color(0xFF166534),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              // Dynamic Delivery ETA Banner (Zepto / Blinkit style)
                              Builder(
                                builder: (context) {
                                  final order = ordersController.ordersdetails;
                                  if (order == null) return const SizedBox.shrink();
                                  
                                  // Don't show ETA for delivered (1) or cancelled (3, 4, 6)
                                  if (order.orderStatus == 1 || order.orderStatus == 3 || order.orderStatus == 4 || order.orderStatus == 6) {
                                    return const SizedBox.shrink();
                                  }

                                  // Calculate total items
                                  int totalItems = order.totalItemQuantity ?? 0;
                                  if (totalItems == 0 && order.orderitems != null) {
                                    totalItems = order.orderitems!.fold(0, (sum, item) => sum + (item.quantity ?? 1));
                                  }
                                  if (totalItems == 0) totalItems = 1;

                                  // Calculate buffer and delay minutes
                                  int bufferMinutes = order.orderSizeBufferMinutes ?? (totalItems <= 10 ? 0 : (((totalItems - 10) / 10.0).ceil() * 10));
                                  int delayMinutes = order.totalDelayMinutes ?? 0;
                                  
                                  // Base delivery is 30 mins, combined with buffer and cumulative adjustments
                                  int totalETAMinutes = 30 + bufferMinutes + delayMinutes;
                                  if (order.estimateDateTime != null && order.createdAt != null) {
                                    final diff = order.estimateDateTime!.difference(order.createdAt!).inMinutes;
                                    if (diff > 0) {
                                      totalETAMinutes = diff;
                                    }
                                  }
                                  String etaDisplay = "$totalETAMinutes mins";

                                  return Container(
                                    margin: EdgeInsets.fromLTRB(3.w, 1.h, 3.w, 0.5.h),
                                    padding: EdgeInsets.all(4.w),
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [Color(0xFFF0FDF4), Color(0xFFE8F5E9)],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: const Color(0xFFA7F3D0), width: 1.2),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.02),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF16A34A).withOpacity(0.12),
                                                shape: BoxShape.circle,
                                              ),
                                              child: const Text("🛵", style: TextStyle(fontSize: 22)),
                                            ),
                                            SizedBox(width: 3.w),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    "Estimated Delivery",
                                                    style: GoogleFonts.poppins(
                                                      fontSize: 12.sp,
                                                      fontWeight: FontWeight.w500,
                                                      color: const Color(0xFF166534),
                                                    ),
                                                  ),
                                                  Text(
                                                    etaDisplay,
                                                    style: GoogleFonts.poppins(
                                                      fontSize: 20.sp,
                                                      fontWeight: FontWeight.w800,
                                                      color: const Color(0xFF15803D),
                                                      letterSpacing: -0.5,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            if (order.estimateDateTime != null)
                                              Container(
                                                padding: EdgeInsets.symmetric(horizontal: 2.5.w, vertical: 0.8.h),
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  borderRadius: BorderRadius.circular(8),
                                                  border: Border.all(color: const Color(0xFF86EFAC)),
                                                ),
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.end,
                                                  children: [
                                                    Text(
                                                      "By",
                                                      style: GoogleFonts.poppins(fontSize: 10.sp, color: Colors.grey.shade600),
                                                    ),
                                                    Text(
                                                      DateFormat('hh:mm a').format(order.estimateDateTime!),
                                                      style: GoogleFonts.poppins(
                                                        fontSize: 12.sp,
                                                        fontWeight: FontWeight.w700,
                                                        color: const Color(0xFF166534),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                          ],
                                        ),
                                        if (delayMinutes > 0) ...[
                                          SizedBox(height: 1.h),
                                          Container(
                                            padding: EdgeInsets.symmetric(horizontal: 2.5.w, vertical: 0.8.h),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFFFBEB),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: const Color(0xFFFDE68A)),
                                            ),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.access_time_filled, size: 16, color: Color(0xFFD97706)),
                                                SizedBox(width: 2.w),
                                                Expanded(
                                                  child: Text(
                                                    "Delivery extended by +$delayMinutes mins due to route conditions",
                                                    style: GoogleFonts.poppins(
                                                      fontSize: 11.sp,
                                                      fontWeight: FontWeight.w600,
                                                      color: const Color(0xFFB45309),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                        if (bufferMinutes > 0) ...[
                                          SizedBox(height: 1.2.h),
                                          Container(
                                            padding: EdgeInsets.symmetric(horizontal: 2.5.w, vertical: 0.8.h),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFEF3C7),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: const Color(0xFFFDE68A)),
                                            ),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.info_outline, size: 16, color: Color(0xFFB45309)),
                                                SizedBox(width: 2.w),
                                                Expanded(
                                                  child: Text(
                                                    "$totalItems items in your order • +$bufferMinutes mins preparation buffer added",
                                                    style: GoogleFonts.poppins(
                                                      fontSize: 11.sp,
                                                      fontWeight: FontWeight.w500,
                                                      color: const Color(0xFF92400E),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ] else ...[
                                          SizedBox(height: 0.6.h),
                                          Text(
                                            "$totalItems item${totalItems > 1 ? 's' : ''} in your order • Standard 30 min delivery",
                                            style: GoogleFonts.poppins(
                                              fontSize: 11.sp,
                                              color: const Color(0xFF166534).withOpacity(0.8),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  );
                                },
                              ),
                              Container(
                                margin: EdgeInsets.fromLTRB(3.w, 1.h, 3.w, 1.h),
                                padding: EdgeInsets.all(3.5.w),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: Appprimary.withOpacity(0.25),
                                    width: 1.2,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.03),
                                      blurRadius: 8,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(9),
                                      decoration: BoxDecoration(
                                        color: Appprimary.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(
                                        Icons.receipt_long_rounded,
                                        color: Appprimary,
                                        size: 24,
                                      ),
                                    ),
                                    SizedBox(width: 3.w),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            "Transaction Receipt",
                                            style: GoogleFonts.poppins(
                                              fontSize: 13.5.sp,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.black87,
                                            ),
                                          ),
                                          Text(
                                            "Download official order receipt & invoice",
                                            style: GoogleFonts.poppins(
                                              fontSize: 11.5.sp,
                                              color: Colors.grey.shade600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Appprimary,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 10, vertical: 6),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        elevation: 0,
                                      ),
                                      onPressed: () => _openReceipt(context),
                                      icon: const Icon(Icons.download_rounded, size: 15),
                                      label: Text(
                                        "Download",
                                        style: GoogleFonts.poppins(
                                          fontSize: 11.5.sp,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                width: double.infinity,
                                color: white,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Padding(
                                      padding: EdgeInsets.all(3.w),
                                      child: customText(
                                        text: "Delivery OTP",
                                        fontSize: 0.018.sp,
                                        color: black,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    // SizedBox(
                                    //   height: 6,
                                    // ),
                                    Divider(
                                      height: 0.01.h,
                                    ),

                                    // SizedBox(height: 1.h),
                                    Padding(
                                      padding: EdgeInsets.all(3.w),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: InkWell(
                                              onTap: () {
                                                print(ordersController
                                                        .ordersdetails
                                                        ?.orderInvoice ??
                                                    "");
                                                // final jsonString = jsonEncode(
                                                //     ordersController
                                                //         .ordersdetails.invoice);
                                                // final pattern = RegExp(
                                                //     '.{1,800}'); // Split into chunks of 800 chars
                                                // pattern
                                                //     .allMatches(jsonString)
                                                //     .forEach((match) =>
                                                //         print(match.group(0)));
                                              },
                                              child: customText(
                                                text:
                                                    "Check Your Items.\nSharing OTP = Order Final - No Refund/Replacement",
                                                fontSize: 16.sp,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.black,
                                              ),
                                            ),
                                          ),
                                          // SizedBox(
                                          //   width: 1.w,
                                          // ),
                                          // Image.asset(
                                          //   'Assets/Images/clickgetBag.png',
                                          //   height: 60,
                                          // )
                                        ],
                                      ),
                                    ),

                                    ordersController
                                                .ordersdetails!.oTP!.isEmpty ||
                                            ordersController.ordersdetails!.oTP!
                                                    .length ==
                                                2
                                        ? SizedBox()
                                        : Padding(
                                            padding: EdgeInsets.symmetric(
                                                horizontal: 3.w),
                                            child: Container(
                                              height: 50,
                                              width: double.infinity,
                                              child: ListView.builder(
                                                itemCount: ordersController
                                                    .ordersdetails!.oTP!.length,
                                                scrollDirection:
                                                    Axis.horizontal,
                                                shrinkWrap: true,
                                                physics:
                                                    NeverScrollableScrollPhysics(),
                                                itemBuilder: (context, index) {
                                                  return Align(
                                                    child: Container(
                                                      // Decoration(),
                                                      height: 50,
                                                      width: 50,
                                                      margin: EdgeInsets.symmetric(
                                                          horizontal:
                                                              4), // spacing between boxes
                                                      padding:
                                                          EdgeInsets.all(12),
                                                      decoration: BoxDecoration(
                                                        // border: Border.all(color: Colors.grey.shade400),
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(8),
                                                        color: Appprimary,
                                                      ),
                                                      alignment:
                                                          Alignment.center,
                                                      child: customText(
                                                        text: ordersController
                                                            .ordersdetails!
                                                            .oTP![index],
                                                        fontSize: 19,
                                                        color: Colors.white,
                                                        fontWeight:
                                                            FontWeight.w700,
                                                        // display one character
                                                      ),
                                                    ),
                                                  );
                                                },
                                              ),
                                            ),
                                          ),
                                    SizedBox(height: 1.h),
                                  ],
                                ),
                              ),
                              ordersController.ordersdetails!.orderStatus != 1
                                  ? SizedBox()
                                  : SizedBox(
                                      height: 10,
                                    ),

                              ordersController.ordersdetails!.orderStatus != 1
                                  ? const SizedBox()
                                  : GestureDetector(
                                      onTap: () {
                                        PostDeliveryFeedbackDialog.show(
                                          context,
                                          orderId: widget.orderNo,
                                          orderTotal: double.tryParse(ordersController.ordersdetails?.grandTotal?.toString() ?? '0'),
                                          onFeedbackSubmitted: () {
                                            if (mounted) {
                                              ordersController.getordersDeatils(
                                                  context: context, id: widget.orderNo);
                                            }
                                          },
                                        );
                                      },
                                      child: Container(
                                        height: 60,
                                        width: double.infinity,
                                        color: white,
                                        child: Row(
                                          children: [
                                            SizedBox(
                                              width: 8,
                                            ),
                                            Container(
                                                height: 40,
                                                width: 40,
                                                decoration: BoxDecoration(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                  color: Color(0xFFF6F6F6),
                                                ),
                                                child: AnimatedBuilder(
                                                  animation: _controller,
                                                  builder: (_, __) {
                                                    return ShaderMask(
                                                      shaderCallback:
                                                          (Rect bounds) {
                                                        return LinearGradient(
                                                          colors: const [
                                                            Color(0xFFFFD700),
                                                            Colors.white,
                                                            Color(0xFFFFD700),
                                                          ],
                                                          stops: [
                                                            (_controller.value -
                                                                    0.2)
                                                                .clamp(0.0, 1.0),
                                                            _controller.value
                                                                .clamp(0.0, 1.0),
                                                            (_controller.value +
                                                                    0.2)
                                                                .clamp(0.0, 1.0),
                                                          ],
                                                          begin:
                                                              Alignment.topLeft,
                                                          end: Alignment
                                                              .bottomRight,
                                                        ).createShader(bounds);
                                                      },
                                                      child: const Icon(
                                                        Icons.star_rounded,
                                                        size: 29,
                                                        color: Colors.white,
                                                      ),
                                                    );
                                                  },
                                                )),
                                            SizedBox(
                                              width: 10,
                                            ),
                                            Expanded(
                                              child: customText(
                                                text:
                                                    "Your feedback means a lot to us.",
                                                fontWeight: FontWeight.w600,
                                                fontSize: 13,
                                              ),
                                            ),
                                            SizedBox(
                                              width: 10,
                                            ),
                                            Container(
                                              decoration: BoxDecoration(
                                                  borderRadius:
                                                      BorderRadius.circular(7),
                                                  border: Border.all(
                                                      color: Appprimary,
                                                      width: 1),
                                                  color: Appprimary.withOpacity(
                                                      0.05)),
                                              child: Padding(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 8.0,
                                                        vertical: 5),
                                                child: customText(
                                                  text: "Rate Us",
                                                  fontWeight: FontWeight.w600,
                                                  color: Appprimary,
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ),
                                            SizedBox(
                                              width: 10,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                              SizedBox(
                                height: 10,
                              ),

                              Container(
                                width: double.infinity,
                                color: white,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Padding(
                                      padding: EdgeInsets.all(3.w),
                                      child: InkWell(
                                        onTap: () {
                                          print(ordersController.ordersdetails!
                                              .deliveredCancelleddatetime);
                                          print(ordersController
                                              .ordersdetails!.createdAt);
                                        },
                                        child: customText(
                                          text: "Order Status",
                                          fontSize: 0.022.sp,
                                          color: black,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                    // SizedBox(
                                    //   height: 6,
                                    // ),
                                    Divider(
                                      height: 0.01.h,
                                    ),

                                    // SizedBox(height: 1.h),
                                    //                                   Padding(
                                    //                                     padding: EdgeInsets.all(3.w),
                                    //                                     child: Builder(builder: (context) {
                                    //                                       final deliveredTime = ordersController
                                    //                                           .ordersdetails!
                                    //                                           .deliveredCancelleddatetime;

                                    // // Step 1: Check if it's not the default "invalid" time
                                    //                                       final isValidTime = deliveredTime !=
                                    //                                           DateTime.parse(
                                    //                                               "-0001-11-30 00:00:00.000");

                                    // // Step 2: Check if only time part is not 00:00:00.000
                                    //                                       final isTimeNotZero =
                                    //                                           !(deliveredTime!.hour == 0 &&
                                    //                                               deliveredTime.minute == 0 &&
                                    //                                               deliveredTime.second == 0 &&
                                    //                                               deliveredTime.millisecond == 0);

                                    //                                       if (isValidTime && isTimeNotZero) {
                                    //                                         // Show delivery status container
                                    //                                         return buildOrderStatusBox(
                                    //                                             ordersController);
                                    //                                       }
                                    //                                       // Don't show anything (or show default placeholder)
                                    //                                       return GetBuilder<OrdersController>(
                                    //                                         builder: (controller) {
                                    //                                           final orderDetails =
                                    //                                               controller.ordersdetails;

                                    //                                           if (orderDetails == null ||
                                    //                                               orderDetails.createdAt == null) {
                                    //                                             return const SizedBox();
                                    //                                           }

                                    //                                           final createdAt = DateTime.parse(
                                    //                                               orderDetails.createdAt
                                    //                                                   .toString());
                                    //                                           final endTime = createdAt
                                    //                                               .add(Duration(minutes: 31));
                                    //                                           final remainingDuration = endTime
                                    //                                               .difference(DateTime.now());

                                    //                                           return remainingDuration.isNegative
                                    //                                               ? Container(
                                    //                                                   decoration: BoxDecoration(
                                    //                                                     borderRadius:
                                    //                                                         BorderRadius.circular(
                                    //                                                             10),
                                    //                                                     color: Color(
                                    //                                                         0xFFFFF3E0), // soft orange
                                    //                                                   ),
                                    //                                                   padding: EdgeInsets.symmetric(
                                    //                                                       horizontal: 10,
                                    //                                                       vertical: 8),
                                    //                                                   child: Column(
                                    //                                                     crossAxisAlignment:
                                    //                                                         CrossAxisAlignment
                                    //                                                             .start,
                                    //                                                     children: [
                                    //                                                       customText(
                                    //                                                         text:
                                    //                                                             "Apologies for the Delay",
                                    //                                                         fontSize: 14,
                                    //                                                         color: Color(
                                    //                                                             0xFFE65100), // deep orange
                                    //                                                         fontWeight:
                                    //                                                             FontWeight.bold,
                                    //                                                       ),
                                    //                                                       SizedBox(height: 6),
                                    //                                                       customText(
                                    //                                                         text:
                                    //                                                             "Your order is taking longer than expected. We're working on it.",
                                    //                                                         fontSize: 12,
                                    //                                                         color: Color(
                                    //                                                             0xFF6D4C41), // soft brown
                                    //                                                       ),
                                    //                                                     ],
                                    //                                                   ),
                                    //                                                 )
                                    //                                               : Column(
                                    //                                                   mainAxisAlignment:
                                    //                                                       MainAxisAlignment.center,
                                    //                                                   crossAxisAlignment:
                                    //                                                       CrossAxisAlignment.start,
                                    //                                                   children: [
                                    //                                                     Text(
                                    //                                                       "Arriving in",
                                    //                                                       style:
                                    //                                                           GoogleFonts.poppins(
                                    //                                                               fontWeight:
                                    //                                                                   FontWeight
                                    //                                                                       .w600,
                                    //                                                               fontSize: 18.sp,
                                    //                                                               color: Color(
                                    //                                                                   0xff212529)),
                                    //                                                     ),
                                    //                                                     SizedBox(
                                    //                                                       height: 2,
                                    //                                                     ),
                                    //                                                     Container(
                                    //                                                       child:
                                    //                                                           SlideCountdownSeparated(
                                    //                                                         duration:
                                    //                                                             remainingDuration, // Hide hours
                                    //                                                         separatorType:
                                    //                                                             SeparatorType.title,

                                    //                                                         durationTitle:
                                    //                                                             DurationTitle(
                                    //                                                                 days: "",
                                    //                                                                 hours: "",
                                    //                                                                 minutes: 'min',
                                    //                                                                 seconds: ""),
                                    //                                                         separator: 'Min',
                                    //                                                         shouldShowDays:
                                    //                                                             (duration) => false,
                                    //                                                         shouldShowHours:
                                    //                                                             (duration) => false,
                                    //                                                         shouldShowMinutes:
                                    //                                                             (duration) => true,
                                    //                                                         shouldShowSeconds:
                                    //                                                             (duration) => false,
                                    //                                                         padding: EdgeInsets
                                    //                                                             .symmetric(
                                    //                                                                 horizontal: 6,
                                    //                                                                 vertical: 2),
                                    //                                                         decoration:
                                    //                                                             BoxDecoration(
                                    //                                                           // color:
                                    //                                                           //     Colors.grey[200],
                                    //                                                           borderRadius:
                                    //                                                               BorderRadius
                                    //                                                                   .circular(6),
                                    //                                                         ),
                                    //                                                         style:
                                    //                                                             GoogleFonts.poppins(
                                    //                                                           fontSize: 25,
                                    //                                                           color: Appprimary,
                                    //                                                           fontWeight:
                                    //                                                               FontWeight.bold,
                                    //                                                         ),
                                    //                                                         separatorPadding:
                                    //                                                             EdgeInsets.only(
                                    //                                                                 top: 4),
                                    //                                                         separatorStyle:
                                    //                                                             GoogleFonts.poppins(
                                    //                                                           fontSize: 18,
                                    //                                                           color: Appprimary,
                                    //                                                           fontWeight:
                                    //                                                               FontWeight.bold,
                                    //                                                         ),
                                    //                                                       ),
                                    //                                                     ),
                                    //                                                     SizedBox(
                                    //                                                       height: 1.h,
                                    //                                                     ),
                                    //                                                     Text(
                                    //                                                       '${getOrderStatusText(orderDetails.orderStatus!)}',
                                    //                                                       style:
                                    //                                                           GoogleFonts.poppins(
                                    //                                                               fontSize: 16,
                                    //                                                               color: black,
                                    //                                                               fontWeight:
                                    //                                                                   FontWeight
                                    //                                                                       .w400),
                                    //                                                     )
                                    //                                                     // customText(
                                    //                                                     //   text:
                                    //                                                     //       '${getOrderStatusText(orderDetails.orderStatus!)}',
                                    //                                                     //   fontSize: 0.28,
                                    //                                                     //   fontWeight:
                                    //                                                     //       FontWeight.w600,
                                    //                                                     //   color: Colors.orange[700],
                                    //                                                     // ),
                                    //                                                   ],
                                    //                                                 );
                                    //                                         },
                                    //                                       );
                                    //                                     }
                                    //                                         // return ordersController.ordersdetails!.deliveredCancelleddatetime != DateTime.parse("-0001-11-30 00:00:00.000")?  buildOrderStatusBox(ordersController):

                                    //                                         ),
                                    //                                   ),

                                    Padding(
                                      padding: EdgeInsets.all(3.w),
                                      child: Builder(
                                        builder: (context) {
                                          final orderDetails =
                                              ordersController.ordersdetails;

                                          if (orderDetails == null ||
                                              orderDetails.createdAt == null) {
                                            return const SizedBox();
                                          }

// 1. Created time (always local)
                                          final createdAt =
                                              orderDetails.createdAt!.toLocal();

// 2. Timer logic (fixed 30 min delivery window from createdAt)
                                          final expectedDeliveryDuration =
                                              const Duration(minutes: 30);
                                          final endTime = createdAt
                                              .add(expectedDeliveryDuration);

// 3. Now and remaining time
                                          final now = DateTime.now();
                                          final remainingDuration =
                                              endTime.difference(now);
                                          final minutesPassed = now
                                              .difference(createdAt)
                                              .inMinutes;

                                          final deliveredAtStr = orderDetails
                                              .deliveredCancelleddatetime
                                              ?.toString();
                                          final DateTime? deliveredAt =
                                              (deliveredAtStr != null &&
                                                      deliveredAtStr.isNotEmpty)
                                                  ? DateTime.tryParse(
                                                          deliveredAtStr)
                                                      ?.toLocal()
                                                  : null;

                                          // 🟢 STATUS 7: Arrived
                                          if (orderDetails.orderStatus == 7) {
                                            return buildStatusBox(
                                              title:
                                                  "Your Order Has Arrived 🎉",
                                              message:
                                                  "📍Arrived at your location and will hand over your order at your doorstep.",
                                              // "Thanks for shopping with us. Hope you enjoy your order!",
                                              bgColor: const Color(0xFFE8F5E9),
                                              titleColor:
                                                  const Color(0xFF2E7D32),
                                              msgColor: const Color(0xFF388E3C),
                                              arrivedIn: "",
                                            );
                                          }

                                          if (orderDetails.orderStatus == 4) {
                                            return buildStatusBox(
                                              title: "Order Cancelled",
                                              message: ordersController
                                                      .ordersdetails!
                                                      .cancellationReason!
                                                      .contains(
                                                          "Admin Cancelled the order")
                                                  ? "Order cancelled by ClikGett.\nWe apologise. (Refund will be processed if already paid.)"
                                                  : "Order cancelled as per your request.",
                                              // ordersController
                                              //     .ordersdetails!
                                              //     .cancellationReason!,
                                              bgColor: const Color.fromARGB(
                                                  255, 245, 232, 232),
                                              titleColor: const Color.fromARGB(
                                                  255, 255, 51, 0),
                                              msgColor: const Color.fromARGB(
                                                  255, 255, 51, 0),
                                              //  const Color(0xFF388E3C),
                                              arrivedIn: "",
                                            );
                                          }

                                          // 🔴 STATUS 1: Delivered – Show Time Taken
                                          if (orderDetails.orderStatus == 1 &&
                                              deliveredAt != null &&
                                              deliveredAt.isAfter(createdAt)) {
                                            // final updatedAt = orderDetails
                                            //     .updatedAt!
                                            //     .toLocal();
                                            // final deliveryDuration =
                                            //     updatedAt.difference(createdAt);
                                            // final totalMinutes =
                                            //     deliveryDuration.inMinutes;
                                            // final hours = totalMinutes ~/ 60;
                                            // final minutes = totalMinutes % 60;

                                            // final arrivedIn = (hours > 0 &&
                                            //         minutes > 0)
                                            //     ? "$hours hr${hours > 1 ? 's' : ''} $minutes min${minutes > 1 ? 's' : ''}"
                                            //     : (hours > 0)
                                            //         ? "$hours hr${hours > 1 ? 's' : ''}"
                                            //         : "$minutes min${minutes > 1 ? 's' : ''}";
                                            // ✅ Always convert from UTC to local
                                            final createdAt = orderDetails
                                                .createdAt!
                                                .toLocal();

                                            final updatedAt = (orderDetails
                                                            .orderStatus ==
                                                        1 &&
                                                    orderDetails
                                                            .deliveredCancelleddatetime !=
                                                        null)
                                                ? orderDetails.updatedAt!
                                                    .toLocal() // fallback to something earlier
                                                : orderDetails.updatedAt!
                                                    .toLocal(); // else regular updatedAt

                                            final deliveryDuration =
                                                updatedAt.difference(createdAt);
                                            // final totalMinutes =
                                            //     deliveryDuration.inMinutes;
                                            // final hours = totalMinutes ~/ 60;
                                            // final minutes = totalMinutes % 60;

                                            // final arrivedIn = (hours > 0 &&
                                            //         minutes > 0)
                                            //     ? "$hours hr${hours > 1 ? 's' : ''} $minutes min${minutes > 1 ? 's' : ''}"
                                            //     : (hours > 0)
                                            //         ? "$hours hr${hours > 1 ? 's' : ''}"
                                            //         : "$minutes min${minutes > 1 ? 's' : ''}";

                                            final totalMinutes =
                                                deliveryDuration.inMinutes;
                                            final hours = totalMinutes ~/ 60;
                                            final minutes = totalMinutes % 60;

                                            final arrivedIn = hours > 0 &&
                                                    minutes > 0
                                                ? "$hours hr${hours > 1 ? 's' : ''} $minutes min${minutes > 1 ? 's' : ''}"
                                                : hours > 0
                                                    ? "$hours hr${hours > 1 ? 's' : ''}"
                                                    : "$minutes min${minutes > 1 ? 's' : ''}";

                                            //minutesPassed

                                            if (totalMinutes
                                                // int.parse(arrivedIn
                                                //       .replaceAll(" min", "")
                                                //       .replaceAll("s", ""))
                                                <=
                                                30) {
                                              return InkWell(
                                                onTap: () {
                                                  print(
                                                      "📦 createdAt: ${orderDetails.createdAt}");
                                                  print(
                                                      "✅ updatedAt: ${orderDetails.updatedAt}");
                                                  print(
                                                      "📍 deliveredCancelleddatetime: ${orderDetails.deliveredCancelleddatetime}");
                                                  print(
                                                      "📌 orderStatus: ${orderDetails.orderStatus}");
                                                },
                                                child: buildStatusBox(
                                                  title:
                                                      "WoHoo! On Time Delivery 🎉",
                                                  message:
                                                      "🎉 Order delivered. Thank you for choosing ClikGett",
                                                  bgColor:
                                                      const Color(0xFFE8F5E9),
                                                  titleColor:
                                                      const Color(0xFF2E7D32),
                                                  msgColor:
                                                      const Color(0xFF388E3C),
                                                  arrivedIn: arrivedIn,
                                                ),
                                              );
                                            } else if (totalMinutes
                                                // int.parse(arrivedIn
                                                //       .replaceAll(" min", "")
                                                //       .replaceAll("s", ""))
                                                <=
                                                41) {
                                              return buildStatusBox(
                                                title:
                                                    "Order Slightly Delayed ⏳",
                                                message:
                                                    "Due to high demand, your order took a bit longer.",
                                                bgColor:
                                                    const Color(0xFFFFFDE7),
                                                titleColor:
                                                    const Color(0xFFF9A825),
                                                msgColor:
                                                    const Color(0xFFF57F17),
                                                arrivedIn: arrivedIn,
                                              );
                                            } else {
                                              return buildStatusBox(
                                                title: "We Regret the Delay 🙏",
                                                message:
                                                    "We’re sorry about the timing. We’ll improve. Thank you for your patience.",
                                                bgColor:
                                                    const Color(0xFFFFEBEE),
                                                titleColor:
                                                    const Color(0xFFC62828),
                                                msgColor:
                                                    const Color(0xFFD32F2F),
                                                arrivedIn: arrivedIn,
                                              );
                                            }
                                          }

// 🟡 STATUS 2,3,5,6,8: Show Timer or Wait Message (if too delayed)
                                          if ([2, 3, 5, 6, 8].contains(
                                              orderDetails.orderStatus)) {
                                            final now = DateTime.now();
                                            final deliveryDuration =
                                                now.difference(createdAt);
                                            final totalMinutes =
                                                deliveryDuration.inMinutes;

                                            // If order is delayed more than 41 minutes
                                            if (minutesPassed > 41) {
                                              return buildStatusBox(
                                                title: "Waiting for Update ⏳",
                                                message:
                                                    "Your order is taking longer than expected. We are tracking it closely.",
                                                bgColor:
                                                    const Color(0xFFFFFDE7),
                                                titleColor:
                                                    const Color(0xFF6D4C41),
                                                msgColor:
                                                    const Color(0xFF5D4037),
                                                arrivedIn: "",
                                              );
                                            } else if (remainingDuration
                                                .isNegative) {
                                              return buildStatusBox(
                                                title:
                                                    "Waiting for delivery update ⏳",
                                                message:
                                                    "Your order should have arrived. We're checking with our team.",
                                                bgColor:
                                                    const Color(0xFFFFF3E0),
                                                titleColor:
                                                    const Color(0xFFF57C00),
                                                msgColor:
                                                    const Color(0xFFE65100),
                                                arrivedIn: "",
                                              );
                                            } else {
                                              return Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    "Arriving in",
                                                    style: GoogleFonts.poppins(
                                                      fontWeight:
                                                          FontWeight.w600,
                                                      fontSize: 18.sp,
                                                      color: const Color(
                                                          0xff212529),
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  SlideCountdownSeparated(
                                                    duration: remainingDuration,
                                                    separatorType:
                                                        SeparatorType.title,
                                                    durationTitle:
                                                        DurationTitle(
                                                      days: "",
                                                      hours: "",
                                                      minutes: "Min",
                                                      seconds: "",
                                                    ),
                                                    separator: 'Min',
                                                    shouldShowDays: (_) =>
                                                        false,
                                                    shouldShowHours: (_) =>
                                                        false,
                                                    shouldShowMinutes: (_) =>
                                                        true,
                                                    shouldShowSeconds: (_) =>
                                                        false,
                                                    padding: const EdgeInsets
                                                        .symmetric(
                                                        horizontal: 6,
                                                        vertical: 2),
                                                    decoration: BoxDecoration(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              6),
                                                    ),
                                                    style: GoogleFonts.poppins(
                                                      fontSize: 25,
                                                      color: Appprimary,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                    separatorPadding:
                                                        const EdgeInsets.only(
                                                            top: 4),
                                                    separatorStyle:
                                                        GoogleFonts.poppins(
                                                      fontSize: 18,
                                                      color: Appprimary,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  Text(
                                                    getOrderStatusText(
                                                        orderDetails
                                                                .orderStatus ??
                                                            0),
                                                    style: GoogleFonts.poppins(
                                                      fontSize: 16,
                                                      color: black,
                                                      fontWeight:
                                                          FontWeight.w400,
                                                    ),
                                                  ),
                                                ],
                                              );
                                            }

                                            // If time is already up and order not delivered
                                            // if (remainingDuration.isNegative) {
                                            //   return buildStatusBox(
                                            //     title:
                                            //         "Waiting for delivery update ⏳",
                                            //     message:
                                            //         "Your order should have arrived. We're checking with our team.",
                                            //     bgColor:
                                            //         const Color(0xFFFFF3E0),
                                            //     titleColor:
                                            //         const Color(0xFFF57C00),
                                            //     msgColor:
                                            //         const Color(0xFFE65100),
                                            //     arrivedIn: "",
                                            //   );
                                            // }

                                            // Otherwise, show actual countdown
                                            // return Column(
                                            //   crossAxisAlignment:
                                            //       CrossAxisAlignment.start,
                                            //   children: [
                                            //     Text(
                                            //       "Arriving in",
                                            //       style: GoogleFonts.poppins(
                                            //         fontWeight: FontWeight.w600,
                                            //         fontSize: 18.sp,
                                            //         color:
                                            //             const Color(0xff212529),
                                            //       ),
                                            //     ),
                                            //     const SizedBox(height: 2),
                                            //     SlideCountdownSeparated(
                                            //       duration: remainingDuration,
                                            //       separatorType:
                                            //           SeparatorType.title,
                                            //       durationTitle: DurationTitle(
                                            //         days: "",
                                            //         hours: "",
                                            //         minutes: "Min",
                                            //         seconds: "",
                                            //       ),
                                            //       separator: 'Min',
                                            //       shouldShowDays: (_) => false,
                                            //       shouldShowHours: (_) => false,
                                            //       shouldShowMinutes: (_) =>
                                            //           true,
                                            //       shouldShowSeconds: (_) =>
                                            //           false,
                                            //       padding: const EdgeInsets
                                            //           .symmetric(
                                            //           horizontal: 6,
                                            //           vertical: 2),
                                            //       decoration: BoxDecoration(
                                            //         borderRadius:
                                            //             BorderRadius.circular(
                                            //                 6),
                                            //       ),
                                            //       style: GoogleFonts.poppins(
                                            //         fontSize: 25,
                                            //         color: Appprimary,
                                            //         fontWeight: FontWeight.bold,
                                            //       ),
                                            //       separatorPadding:
                                            //           const EdgeInsets.only(
                                            //               top: 4),
                                            //       separatorStyle:
                                            //           GoogleFonts.poppins(
                                            //         fontSize: 18,
                                            //         color: Appprimary,
                                            //         fontWeight: FontWeight.bold,
                                            //       ),
                                            //     ),
                                            //     SizedBox(height: 1.h),
                                            //     Text(
                                            //       getOrderStatusText(
                                            //           orderDetails
                                            //                   .orderStatus ??
                                            //               0),
                                            //       style: GoogleFonts.poppins(
                                            //         fontSize: 16,
                                            //         color: black,
                                            //         fontWeight: FontWeight.w400,
                                            //       ),
                                            //     ),
                                            //   ],
                                            // );
                                          }

                                          // 🟤 PAST TIMER BUT STATUS NOT ARRIVED (possible fallback)
                                          if (remainingDuration.isNegative) {
                                            return buildStatusBox(
                                              title:
                                                  "Waiting for delivery update ⏳",
                                              message:
                                                  "Your order should have arrived. We're checking with our team.",
                                              bgColor: const Color(0xFFFFF3E0),
                                              titleColor:
                                                  const Color(0xFFF57C00),
                                              msgColor: const Color(0xFFE65100),
                                              arrivedIn: "",
                                            );
                                          }

                                          return const SizedBox(); // Default fallback

//                                       padding: EdgeInsets.all(3.w),
//                                       child: Builder(
//                                         builder: (context) {
//                                           final orderDetails =
//                                               ordersController.ordersdetails;

//                                           if (orderDetails == null ||
//                                               orderDetails.createdAt == null) {
//                                             return const SizedBox();
//                                           }

//                                           // Handle only if orderStatus == 1
//                                           if (orderDetails.orderStatus == 4) {
//                                             return buildOtherStatusBox(
//                                                 orderDetails.orderStatus ?? 0);
//                                           }

//                                           if (orderDetails.orderStatus == 1) {
//                                             final createdAt = orderDetails
//                                                 .createdAt!
//                                                 .toLocal();
//                                             final deliveredAts = orderDetails
//                                                 .deliveredCancelleddatetime
//                                                 ?.toString()
//                                                 ?.replaceAll("Z", "");
//                                             final DateTime? deliveredAt =
//                                                 (deliveredAts != null &&
//                                                         deliveredAts.isNotEmpty)
//                                                     ? DateTime.tryParse(
//                                                         deliveredAts)
//                                                     : null;

//                                             final isDelivered = deliveredAt !=
//                                                     null &&
//                                                 deliveredAt.year > 2000 &&
//                                                 deliveredAt.isAfter(createdAt);

//                                             if (isDelivered) {
//                                               final deliveryDuration =
//                                                   deliveredAt
//                                                       .difference(createdAt);
//                                               final totalMinutes =
//                                                   deliveryDuration.inMinutes;
//                                               final hours = totalMinutes ~/ 60;
//                                               final minutes = totalMinutes % 60;

//                                               final arrivedIn = (hours > 0 &&
//                                                       minutes > 0)
//                                                   ? "$hours hr${hours > 1 ? 's' : ''} $minutes min${minutes > 1 ? 's' : ''}"
//                                                   : (hours > 0)
//                                                       ? "$hours hr${hours > 1 ? 's' : ''}"
//                                                       : "$minutes min${minutes > 1 ? 's' : ''}";

//                                               if (totalMinutes <= 30) {
//                                                 return InkWell(
//                                                   onTap: () {
//                                                     print(orderDetails
//                                                         .orderStatus);
//                                                   },
//                                                   child: buildStatusBox(
//                                                     title:
//                                                         "WoHoo! On Time Delivery 🎉",
//                                                     message:
//                                                         "Your order arrived right on time. Thanks for shopping with us!",
//                                                     bgColor:
//                                                         const Color(0xFFE8F5E9),
//                                                     titleColor:
//                                                         const Color(0xFF2E7D32),
//                                                     msgColor:
//                                                         const Color(0xFF388E3C),
//                                                     arrivedIn: arrivedIn,
//                                                   ),
//                                                 );
//                                               } else if (totalMinutes <= 41) {
//                                                 return buildStatusBox(
//                                                   title:
//                                                       "Order Slightly Delayed ⏳",
//                                                   message:
//                                                       "Due to high demand, your order took a bit longer.",
//                                                   bgColor:
//                                                       const Color(0xFFFFFDE7),
//                                                   titleColor:
//                                                       const Color(0xFFF9A825),
//                                                   msgColor:
//                                                       const Color(0xFFF57F17),
//                                                   arrivedIn: arrivedIn,
//                                                 );
//                                               } else {
//                                                 return InkWell(
//                                                   onTap: () {
//                                                     print(orderDetails
//                                                         .deliveredCancelleddatetime);
//                                                     print(createdAt);
//                                                   },
//                                                   child: buildStatusBox(
//                                                     title:
//                                                         "We Regret the Delay 🙏",
//                                                     message:
//                                                         "We’re sorry about the timing. We’ll improve. Thank you for your patience.",
//                                                     bgColor:
//                                                         const Color(0xFFFFEBEE),
//                                                     titleColor:
//                                                         const Color(0xFFC62828),
//                                                     msgColor:
//                                                         const Color(0xFFD32F2F),
//                                                     arrivedIn: arrivedIn,
//                                                   ),
//                                                 );
//                                               }
//                                             }
//                                           }

//                                           final createdAt =
//                                               orderDetails.createdAt!.toLocal();
//                                           final deliveredAts = orderDetails
//                                               .deliveredCancelleddatetime
//                                               ?.toString()
//                                               ?.replaceAll("Z", "");
//                                           final DateTime? deliveredAt =
//                                               (deliveredAts != null &&
//                                                       deliveredAts.isNotEmpty)
//                                                   ? DateTime.tryParse(
//                                                       deliveredAts)
//                                                   : null;

// // 🟢 Step 1: Handle status codes directly
//                                           if (orderDetails.orderStatus == 7) {
//                                             return InkWell(
//                                               onTap: () {
//                                                 print(orderDetails.orderStatus);
//                                               },
//                                               child: buildStatusBox(
//                                                 title:
//                                                     "Your Order Has Arrived 🎉",
//                                                 message:
//                                                     "Thanks for shopping with us. Hope you enjoy your order!",
//                                                 bgColor:
//                                                     const Color(0xFFE8F5E9),
//                                                 titleColor:
//                                                     const Color(0xFF2E7D32),
//                                                 msgColor:
//                                                     const Color(0xFF388E3C),
//                                                 arrivedIn: "",
//                                               ),
//                                             );
//                                           }

//                                           if (orderDetails.orderStatus == 1) {
//                                             return buildStatusBox(
//                                               title: "Order Cancelled ❌",
//                                               message:
//                                                   "Your order was cancelled. If this is a mistake, please contact support.",
//                                               bgColor: const Color(0xFFFFEBEE),
//                                               titleColor:
//                                                   const Color(0xFFD32F2F),
//                                               msgColor: const Color(0xFFC62828),
//                                               arrivedIn: "",
//                                             );
//                                           }

// // 🟠 Step 2: For other statuses, show countdown
//                                           final endTime = (deliveredAt !=
//                                                       null &&
//                                                   deliveredAt.year > 2000)
//                                               ? deliveredAt
//                                               : createdAt.add(
//                                                   const Duration(minutes: 31));

//                                           final remainingDuration = endTime
//                                               .difference(DateTime.now());

//                                           if (remainingDuration.isNegative) {
//                                             if (deliveredAt != null &&
//                                                 deliveredAt.year > 2000 &&
//                                                 deliveredAt
//                                                     .isBefore(DateTime.now())) {
//                                               return InkWell(
//                                                 onTap: () {
//                                                   print(
//                                                       orderDetails.orderStatus);
//                                                 },
//                                                 child: buildStatusBox(
//                                                   title:
//                                                       "Your Order Has Arrived 🎉",
//                                                   message:
//                                                       "Thanks for shopping with us. Hope you enjoy your order!",
//                                                   bgColor:
//                                                       const Color(0xFFE8F5E9),
//                                                   titleColor:
//                                                       const Color(0xFF2E7D32),
//                                                   msgColor:
//                                                       const Color(0xFF388E3C),
//                                                   arrivedIn: "",
//                                                 ),
//                                               );
//                                             } else {
//                                               return buildStatusBox(
//                                                 title:
//                                                     "Waiting for delivery update ⏳",
//                                                 message:
//                                                     "Your order should have arrived. We're checking with our team.",
//                                                 bgColor:
//                                                     const Color(0xFFFFF3E0),
//                                                 titleColor:
//                                                     const Color(0xFFF57C00),
//                                                 msgColor:
//                                                     const Color(0xFFE65100),
//                                                 arrivedIn: "",
//                                               );
//                                             }
//                                           }

//                                         // ✅ If timer is still running, you can now show countdown widget here
//                                         // return buildCountdownBox(remainingDuration); // <-- You’ll need to define this

//                                           return Column(
//                                             crossAxisAlignment:
//                                                 CrossAxisAlignment.start,
//                                             children: [
//                                               Text(
//                                                 "Arriving in",
//                                                 style: GoogleFonts.poppins(
//                                                   fontWeight: FontWeight.w600,
//                                                   fontSize: 18.sp,
//                                                   color:
//                                                       const Color(0xff212529),
//                                                 ),
//                                               ),
//                                               SizedBox(height: 2),
//                                               SlideCountdownSeparated(
//                                                 duration: remainingDuration,
//                                                 separatorType:
//                                                     SeparatorType.title,
//                                                 durationTitle: DurationTitle(
//                                                   days: "",
//                                                   hours: "",
//                                                   minutes: "Min",
//                                                   seconds: "",
//                                                 ),
//                                                 separator: 'Min',
//                                                 shouldShowDays: (_) => false,
//                                                 shouldShowHours: (_) => false,
//                                                 shouldShowMinutes: (_) => true,
//                                                 shouldShowSeconds: (_) => false,
//                                                 padding: EdgeInsets.symmetric(
//                                                     horizontal: 6, vertical: 2),
//                                                 decoration: BoxDecoration(
//                                                     borderRadius:
//                                                         BorderRadius.circular(
//                                                             6)),
//                                                 style: GoogleFonts.poppins(
//                                                   fontSize: 25,
//                                                   color: Appprimary,
//                                                   fontWeight: FontWeight.bold,
//                                                 ),
//                                                 separatorPadding:
//                                                     const EdgeInsets.only(
//                                                         top: 4),
//                                                 separatorStyle:
//                                                     GoogleFonts.poppins(
//                                                   fontSize: 18,
//                                                   color: Appprimary,
//                                                   fontWeight: FontWeight.bold,
//                                                 ),
//                                               ),
//                                               SizedBox(height: 1.h),
//                                               Text(
//                                                 '${getOrderStatusText(orderDetails.orderStatus ?? 6)}',
//                                                 style: GoogleFonts.poppins(
//                                                   fontSize: 16,
//                                                   color: black,
//                                                   fontWeight: FontWeight.w400,
//                                                 ),
//                                               ),
//                                             ],
//                                           );
                                          // final createdAt =
                                          //     orderDetails.createdAt!.toLocal();

                                          // final deliveredAts = orderDetails
                                          //     .deliveredCancelleddatetime
                                          //     ?.toString()
                                          //     ?.replaceAll("Z", "");
                                          // final DateTime? deliveredAt =
                                          //     (deliveredAts != null &&
                                          //             deliveredAts.isNotEmpty)
                                          //         ? DateTime.tryParse(
                                          //             deliveredAts)
                                          //         : null;

                                          // final isDelivered =
                                          //     deliveredAt != null &&
                                          //         deliveredAt.year > 2000 &&
                                          //         deliveredAt.isAfter(createdAt);

                                          // if (isDelivered) {
                                          //   final deliveryDuration =
                                          //       deliveredAt.difference(createdAt);
                                          //   final totalMinutes =
                                          //       deliveryDuration.inMinutes;
                                          //   final hours = totalMinutes ~/ 60;
                                          //   final minutes = totalMinutes % 60;

                                          //   final arrivedIn = (hours > 0 &&
                                          //           minutes > 0)
                                          //       ? "$hours hr${hours > 1 ? 's' : ''} $minutes min${minutes > 1 ? 's' : ''}"
                                          //       : (hours > 0)
                                          //           ? "$hours hr${hours > 1 ? 's' : ''}"
                                          //           : "$minutes min${minutes > 1 ? 's' : ''}";

                                          //   if (totalMinutes <= 30) {
                                          //     return InkWell(
                                          //       onTap: () {
                                          //         print(orderDetails.orderStatus);
                                          //       },
                                          //       child: buildStatusBox(
                                          //         title:
                                          //             "WoHoo! On Time Delivery 🎉",
                                          //         message:
                                          //             "Your order arrived right on time. Thanks for shopping with us!",
                                          //         bgColor:
                                          //             const Color(0xFFE8F5E9),
                                          //         titleColor:
                                          //             const Color(0xFF2E7D32),
                                          //         msgColor:
                                          //             const Color(0xFF388E3C),
                                          //         arrivedIn: arrivedIn,
                                          //       ),
                                          //     );
                                          //   } else if (totalMinutes <= 41) {
                                          //     return buildStatusBox(
                                          //       title: "Order Slightly Delayed ⏳",
                                          //       message:
                                          //           "Due to high demand, your order took a bit longer.",
                                          //       bgColor: const Color(0xFFFFFDE7),
                                          //       titleColor:
                                          //           const Color(0xFFF9A825),
                                          //       msgColor: const Color(0xFFF57F17),
                                          //       arrivedIn: arrivedIn,
                                          //     );
                                          //   } else {
                                          //     return InkWell(
                                          //       onTap: () {
                                          //         print(orderDetails
                                          //             .deliveredCancelleddatetime);
                                          //         print(createdAt);
                                          //       },
                                          //       child: buildStatusBox(
                                          //         title: "We Regret the Delay 🙏",
                                          //         message:
                                          //             "We’re sorry about the timing. We’ll improve. Thank you for your patience.",
                                          //         bgColor:
                                          //             const Color(0xFFFFEBEE),
                                          //         titleColor:
                                          //             const Color(0xFFC62828),
                                          //         msgColor:
                                          //             const Color(0xFFD32F2F),
                                          //         arrivedIn: arrivedIn,
                                          //       ),
                                          //     );
                                          //   }
                                          // }

                                          // // Still not delivered: show countdown timer
                                          // final endTime = createdAt
                                          //     .add(const Duration(minutes: 31));
                                          // final remainingDuration =
                                          //     endTime.difference(DateTime.now());

                                          // if (remainingDuration.isNegative) {
                                          //   return buildStatusBox(
                                          //     title:
                                          //         "Waiting for delivery update ⏳",
                                          //     message:
                                          //         "Your order should have arrived. We're checking with our team.",
                                          //     bgColor: const Color(0xFFFFF3E0),
                                          //     titleColor: const Color(0xFFF57C00),
                                          //     msgColor: const Color(0xFFE65100),
                                          //     arrivedIn: "",
                                          //   );
                                          // }

                                          // return Column(
                                          //   crossAxisAlignment:
                                          //       CrossAxisAlignment.start,
                                          //   children: [
                                          //     Text(
                                          //       "Arriving in",
                                          //       style: GoogleFonts.poppins(
                                          //         fontWeight: FontWeight.w600,
                                          //         fontSize: 18.sp,
                                          //         color: const Color(0xff212529),
                                          //       ),
                                          //     ),
                                          //     SizedBox(height: 2),
                                          //     SlideCountdownSeparated(
                                          //       duration: remainingDuration,
                                          //       separatorType:
                                          //           SeparatorType.title,
                                          //       durationTitle: DurationTitle(
                                          //         days: "",
                                          //         hours: "",
                                          //         minutes: "Min",
                                          //         seconds: "",
                                          //       ),
                                          //       separator: 'Min',
                                          //       shouldShowDays: (_) => false,
                                          //       shouldShowHours: (_) => false,
                                          //       shouldShowMinutes: (_) => true,
                                          //       shouldShowSeconds: (_) => false,
                                          //       padding: EdgeInsets.symmetric(
                                          //           horizontal: 6, vertical: 2),
                                          //       decoration: BoxDecoration(
                                          //         borderRadius:
                                          //             BorderRadius.circular(6),
                                          //       ),
                                          //       style: GoogleFonts.poppins(
                                          //         fontSize: 25,
                                          //         color: Appprimary,
                                          //         fontWeight: FontWeight.bold,
                                          //       ),
                                          //       separatorPadding:
                                          //           const EdgeInsets.only(top: 4),
                                          //       separatorStyle:
                                          //           GoogleFonts.poppins(
                                          //         fontSize: 18,
                                          //         color: Appprimary,
                                          //         fontWeight: FontWeight.bold,
                                          //       ),
                                          //     ),
                                          //     SizedBox(height: 1.h),
                                          //     Text(
                                          //       '${getOrderStatusText(orderDetails.orderStatus ?? 6)}',
                                          //       style: GoogleFonts.poppins(
                                          //         fontSize: 16,
                                          //         color: black,
                                          //         fontWeight: FontWeight.w400,
                                          //       ),
                                          //     ),
                                          //   ],
                                          // );

                                          // For other order statuses
                                        },
                                      ),
                                    ),

                                    SizedBox(height: 1.h),
                                  ],
                                ),
                              ),

                              SizedBox(
                                height: 10,
                              ),

                              Container(
                                padding: EdgeInsets.all(3.w),
                                width: double.infinity,
                                color: Colors.white,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Text(
                                    //   (() {
                                    //     final status = ordersController
                                    //         .ordersdetails?.orderStatus;
                                    //     final time =
                                    //         DateFormat("EEE, dd MMM''yy, hh:mm a")
                                    //             .format(
                                    //       ordersController.ordersdetails!
                                    //           .deliveredCancelleddatetime!,
                                    //     );

                                    //     if (status == 3) {
                                    //       return "Cancelled By Admin on $time";
                                    //     } else if (status == 4) {
                                    //       return "Cancelled By User on $time";
                                    //     } else if (status == 6) {
                                    //       return "Rejected Delivery Boy on $time";
                                    //     } else if (status == 1) {
                                    //       return "Delivered on $time";
                                    //     } else if (status == 5) {
                                    //       return "Picked Up on $time";
                                    //     } else {
                                    //       return "Arrived at $time";
                                    //     }
                                    //   })(),
                                    //   style: GoogleFonts.poppins(
                                    //     fontSize: 12,
                                    //     fontWeight: FontWeight.w600,
                                    //     color:
                                    //         (ordersController.ordersdetails
                                    //                         ?.orderStatus ==
                                    //                     3 ||
                                    //                 ordersController.ordersdetails
                                    //                         ?.orderStatus ==
                                    //                     4 ||
                                    //                 ordersController.ordersdetails
                                    //                         ?.orderStatus ==
                                    //                     6)
                                    //             ? Colors.red
                                    //             : Colors.green,
                                    //   ),
                                    // ),

                                    // // Text(
                                    // //   "Arrived at " +
                                    // //       DateFormat('hh:mm a').format(
                                    // //           ordersController.ordersdetails!
                                    // //               .deliveredCancelleddatetime!),
                                    // //   style: GoogleFonts.poppins(
                                    // //     fontSize: 12,
                                    // //     fontWeight: FontWeight.w300,
                                    // //     color: Colors.black26,
                                    // //   ),
                                    // // ),
                                    // SizedBox(
                                    //   height: 7,
                                    // ),
                                    Text(
                                      "${ordersController.ordersdetails?.orderitems?.length} Items in this order",
                                      style: GoogleFonts.poppins(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black,
                                      ),
                                    ),
                                    SizedBox(
                                      height: 7,
                                    ),
                                    ListView.builder(
                                      itemBuilder: (context, index) {
                                        var order = ordersController
                                            .ordersdetails?.orderitems?[index];
                                        return Padding(
                                          padding: const EdgeInsets.only(
                                              bottom: 12.0),
                                          child: Container(
                                            child: Row(
                                              children: [
                                                Container(
                                                  height: 56,
                                                  width: 56,
                                                  decoration: BoxDecoration(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              10),
                                                      color: white,
                                                      border: Border.all(
                                                          color: Colors.grey
                                                              .withOpacity(
                                                                  0.09))),
                                                  child: Padding(
                                                    padding:
                                                        const EdgeInsets.all(
                                                            2.0),
                                                    child: CachedNetworkImage(
                                                      imageUrl:
                                                          order!.productImages[
                                                                  0] ??
                                                              '',
                                                      progressIndicatorBuilder:
                                                          (context, url,
                                                              progress) {
                                                        return Padding(
                                                          padding:
                                                              const EdgeInsets
                                                                  .all(8.0),
                                                          child:
                                                              CircularProgressIndicator(),
                                                        );
                                                      },
                                                    ),
                                                  ),
                                                ),
                                                SizedBox(
                                                  width: 10,
                                                ),
                                                Expanded(
                                                    child: Column(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.start,
                                                  children: [
                                                    customText(
                                                      text: order.productName ??
                                                          "",
                                                      fontSize: 0.012.sp,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                      color: Colors.black,
                                                    ),
                                                    SizedBox(
                                                      height: 5,
                                                    ),
                                                    Row(
                                                      children: [
                                                        customText(
                                                          text: order?.type == 1
                                                              ? '${order?.metricvalue} ${order?.metrictype}'
                                                              : 'Combo Of ${order?.kitItems?.length}',
                                                          fontSize: 0.012.sp,
                                                          fontWeight:
                                                              FontWeight.w400,
                                                          color: Colors.black,
                                                        ),
                                                        Expanded(
                                                          child: customText(
                                                            text:
                                                                " x ${order.quantity}",
                                                            fontSize: 0.012.sp,
                                                            fontWeight:
                                                                FontWeight.w400,
                                                            color: Colors.black,
                                                          ),
                                                        ),
                                                        customText(
                                                          text:
                                                              "${Constants.rupee}${int.parse(order.price!.round().toString())}",
                                                          fontSize: 0.012.sp,
                                                          fontWeight:
                                                              FontWeight.w400,
                                                          color: Colors.black,
                                                          extrafontStyle: TextStyle(
                                                              decoration:
                                                                  TextDecoration
                                                                      .lineThrough),
                                                        ),
                                                        SizedBox(
                                                          width: 5,
                                                        ),
                                                        customText(
                                                          text:
                                                              "${Constants.rupee}${int.parse(order.offerPrice!.round().toString())}",
                                                          fontSize: 0.015.sp,
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          color: Colors.black,
                                                        ),
                                                      ],
                                                    )
                                                    // Text()
                                                  ],
                                                ))
                                              ],
                                            ),
                                          ),
                                        );
                                      },
                                      itemCount: ordersController
                                          .ordersdetails?.orderitems?.length,
                                      shrinkWrap: true,
                                      physics: NeverScrollableScrollPhysics(),
                                    ),
                                    if (ordersController.ordersdetails?.removedItems != null &&
                                        ordersController.ordersdetails!.removedItems!.isNotEmpty) ...[
                                      Divider(color: Colors.grey.withOpacity(0.2), height: 24),
                                      Row(
                                        children: [
                                          Icon(Icons.remove_shopping_cart, size: 14, color: Colors.red[700]),
                                          SizedBox(width: 6),
                                          Text(
                                            "Removed Items",
                                            style: GoogleFonts.poppins(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.red[700],
                                            ),
                                          ),
                                        ],
                                      ),
                                      SizedBox(height: 8),
                                      ListView.builder(
                                        itemBuilder: (context, index) {
                                          var rem = ordersController
                                              .ordersdetails?.removedItems?[index];
                                          return Container(
                                            margin: const EdgeInsets.only(bottom: 8.0),
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                            decoration: BoxDecoration(
                                              color: Colors.red.withOpacity(0.04),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: Colors.red.withOpacity(0.15)),
                                            ),
                                            child: Row(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        "${rem?.productName ?? 'Item'} (x${rem?.quantity ?? 1})",
                                                        style: GoogleFonts.poppins(
                                                          fontSize: 12,
                                                          fontWeight: FontWeight.w500,
                                                          color: Colors.black87,
                                                        ),
                                                      ),
                                                      if (rem?.reason != null && rem!.reason!.isNotEmpty)
                                                        Text(
                                                          "Reason: ${rem?.reason}",
                                                          style: GoogleFonts.poppins(
                                                            fontSize: 11,
                                                            fontWeight: FontWeight.w400,
                                                            color: Colors.red[600],
                                                          ),
                                                        ),
                                                    ],
                                                  ),
                                                ),
                                                Container(
                                                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: Colors.red.withOpacity(0.1),
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: Text(
                                                    "Removed",
                                                    style: GoogleFonts.poppins(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.w600,
                                                      color: Colors.red[700],
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          );
                                        },
                                        itemCount: ordersController
                                            .ordersdetails?.removedItems?.length ?? 0,
                                        shrinkWrap: true,
                                        physics: NeverScrollableScrollPhysics(),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              SizedBox(
                                height: 10,
                              ),
                              Container(
                                width: double.infinity,
                                color: white,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Padding(
                                      padding: EdgeInsets.all(3.w),
                                      child: customText(
                                        text: "Bill Details",
                                        fontSize: 0.018.sp,
                                        color: black,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    // SizedBox(
                                    //   height: 6,
                                    // ),
                                    Divider(
                                      height: 0.01.h,
                                    ),

                                    Column(
                                      children: [
                                        Container(
                                          padding: EdgeInsets.all(3.w),
                                          child: Column(
                                            children: [
                                              Row(
                                                children: [
                                                  Expanded(
                                                    child: customText(
                                                      text: "MRP",
                                                      fontSize: 0.016.sp,
                                                      color: black,
                                                      fontWeight:
                                                          FontWeight.w500,
                                                    ),
                                                  ),
                                                  customText(
                                                    text:
                                                        "${Constants.rupee}${ordersController.ordersdetails?.subTotal!.round()}",
                                                    fontSize: 0.016.sp,
                                                    color: black,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ],
                                              ),
                                              SizedBox(
                                                height: 1.h,
                                              ),
                                              Row(
                                                children: [
                                                  Expanded(
                                                    child: customText(
                                                      text: "Tip",
                                                      fontSize: 0.016.sp,
                                                      color: black,
                                                      fontWeight:
                                                          FontWeight.w500,
                                                    ),
                                                  ),
                                                  customText(
                                                    text:
                                                        "+${Constants.rupee}${(ordersController.ordersdetails?.tipAmount!.round() ?? 0)}",
                                                    fontSize: 0.016.sp,
                                                    color: green,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ],
                                              ),
                                              SizedBox(
                                                height: 1.h,
                                              ),
                                              Row(
                                                children: [
                                                  Expanded(
                                                    child: customText(
                                                      text: "Wallet Used",
                                                      fontSize: 0.016.sp,
                                                      color: black,
                                                      fontWeight:
                                                          FontWeight.w500,
                                                    ),
                                                  ),
                                                  customText(
                                                    text:
                                                        "-${Constants.rupee}${ordersController.ordersdetails?.walletAmount!.round() ?? '0.00'}",
                                                    fontSize: 0.016.sp,
                                                    color: black,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ],
                                              ),
                                              SizedBox(
                                                height: 1.h,
                                              ),
                                              Row(
                                                children: [
                                                  Expanded(
                                                    child: customText(
                                                      text: "Delivery Charges",
                                                      fontSize: 0.016.sp,
                                                      color: black,
                                                      fontWeight:
                                                          FontWeight.w500,
                                                    ),
                                                  ),
                                                  customText(
                                                    text: ordersController
                                                                .ordersdetails
                                                                ?.deliverCharges ==
                                                            0
                                                        ? "Free"
                                                        : "+${Constants.rupee}${ordersController.ordersdetails?.deliverCharges?.round()}",
                                                    fontSize: 0.016.sp,
                                                    color: green,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ],
                                              ),
                                              SizedBox(
                                                height: 1.h,
                                              ),
                                              Row(
                                                children: [
                                                  Expanded(
                                                    child: customText(
                                                      text: "Coupon Discount",
                                                      fontSize: 0.016.sp,
                                                      color: black,
                                                      fontWeight:
                                                          FontWeight.w500,
                                                    ),
                                                  ),
                                                  customText(
                                                    text:
                                                        "-${Constants.rupee}${ordersController.ordersdetails?.discount!.round() ?? '0.00'}",
                                                    fontSize: 0.016.sp,
                                                    color: black,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                        CustomPaint(
                                          size: Size(double.infinity,
                                              1), // width and height
                                          painter: DashedLinePainter(
                                            color: Colors.grey,
                                            dashWidth: 5,
                                            dashSpace: 3,
                                          ),
                                        ),
                                        Container(
                                          padding: EdgeInsets.all(3.w),
                                          child: Row(
                                            children: [
                                              Expanded(
                                                child: customText(
                                                  text: "Order total",
                                                  fontSize: 0.016.sp,
                                                  color: black,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                              customText(
                                                text:
                                                    "${Constants.rupee}${ordersController.ordersdetails?.grandTotal!.round() ?? '0.00'}",
                                                fontSize: 0.016.sp,
                                                color: black,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    )
                                  ],
                                ),
                              ),
                              SizedBox(
                                height: 10,
                              ),
                              Container(
                                width: double.infinity,
                                color: white,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Padding(
                                      padding: EdgeInsets.all(3.w),
                                      child: InkWell(
                                        child: customText(
                                          text: "Order Details",
                                          fontSize: 0.018.sp,
                                          color: black,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    // SizedBox(
                                    //   height: 6,
                                    // ),
                                    Divider(
                                      height: 0.01.h,
                                    ),

                                    Column(
                                      children: [
                                        Container(
                                          padding: EdgeInsets.all(3.w),
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              customText(
                                                text: "Order id",
                                                fontSize: 0.016.sp,
                                                color: black.withOpacity(0.5),
                                                fontWeight: FontWeight.w500,
                                              ),
                                              SizedBox(
                                                height: 0.7.h,
                                              ),
                                              customText(
                                                text:
                                                    "#${ordersController.ordersdetails?.OrderSequence ?? ""}",
                                                fontSize: 0.016.sp,
                                                color: black,
                                                fontWeight: FontWeight.w500,
                                              ),
                                              SizedBox(
                                                height: 1.h,
                                              ),
                                              customText(
                                                text: "Payment",
                                                fontSize: 0.016.sp,
                                                color: black.withOpacity(0.5),
                                                fontWeight: FontWeight.w500,
                                              ),
                                              SizedBox(
                                                height: 0.7.h,
                                              ),
                                              customText(
                                                text: ordersController
                                                            .ordersdetails
                                                            ?.paymentMethod ==
                                                        "COD"
                                                    ? "Cash on delivery"
                                                    : "Paid online",
                                                fontSize: 0.016.sp,
                                                color: black,
                                                fontWeight: FontWeight.w500,
                                              ),
                                              // Row(
                                              //   children: [
                                              //     Expanded(
                                              //       child: customText(
                                              //         text: "Tip",
                                              //         fontSize: 0.016.sp,
                                              //         color: black,
                                              //         fontWeight: FontWeight.w500,
                                              //       ),
                                              //     ),
                                              //     customText(
                                              //       text:
                                              //           "+${Constants.rupee}${(ordersController.ordersdetails?.tipAmount!.round() ?? 0)}",
                                              //       fontSize: 0.016.sp,
                                              //       color: green,
                                              //       fontWeight: FontWeight.w500,
                                              //     ),
                                              //   ],
                                              // ),
                                              SizedBox(
                                                height: 1.h,
                                              ),
                                              customText(
                                                text: "Deliver To",
                                                fontSize: 0.016.sp,
                                                color: black.withOpacity(0.5),
                                                fontWeight: FontWeight.w500,
                                              ),
                                              SizedBox(
                                                height: 0.7.h,
                                              ),
                                              customText(
                                                text:
                                                    "${ordersController.ordersdetails!.userName ?? ""}, ${ordersController.ordersdetails!.address ?? ""}, ${ordersController.ordersdetails!.flatNo ?? ""}, ${ordersController.ordersdetails!.mobileNumber ?? ""}",
                                                fontSize: 0.016.sp,
                                                color: black,
                                                fontWeight: FontWeight.w500,
                                              ),
                                              SizedBox(
                                                height: 1.h,
                                              ),
                                              customText(
                                                text: "Order Placed",
                                                fontSize: 0.016.sp,
                                                color: black.withOpacity(0.5),
                                                fontWeight: FontWeight.w500,
                                              ),
                                              SizedBox(
                                                height: 0.7.h,
                                              ),
                                              customText(
                                                text:
                                                    "placed On ${formatUtcToLocal(ordersController.ordersdetails!.createdAt.toString())}",
                                                // "${ordersController.ordersdetails!.createdAt ?? ""}",
                                                fontSize: 0.016.sp,
                                                color: black,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    )
                                  ],
                                ),
                              ),
                              SizedBox(
                                height: 10,
                              ),

                              // ordersController.ordersdetails?.orderStatus ==
                              //             3 ||
                              //         ordersController
                              //                 .ordersdetails?.orderStatus ==
                              //             4
                              //     ? SizedBox(
                              //         height: 10,
                              //       )
                              //     : SizedBox(),
                              // ordersController.ordersdetails?.orderStatus ==
                              //             3 ||
                              //         ordersController
                              //                 .ordersdetails?.orderStatus ==
                              //             4
                              //     ? Container(
                              //         width: double.infinity,
                              //         color: white,
                              //         child: Column(
                              //           crossAxisAlignment:
                              //               CrossAxisAlignment.start,
                              //           children: [
                              //             Padding(
                              //               padding: EdgeInsets.all(3.w),
                              //               child: customText(
                              //                 text: "Cancellation Reason",
                              //                 fontSize: 0.018.sp,
                              //                 color: black,
                              //                 fontWeight: FontWeight.w600,
                              //               ),
                              //             ),
                              //             // SizedBox(
                              //             //   height: 6,
                              //             // ),
                              //             Divider(
                              //               height: 0.01.h,
                              //             ),

                              //             Padding(
                              //               padding: EdgeInsets.all(3.0.w),
                              //               child: customText(
                              //                 text: ordersController
                              //                         .ordersdetails
                              //                         ?.cancellationReason ??
                              //                     '',
                              //                 fontSize: 0.016.sp,
                              //                 color: black.withOpacity(0.5),
                              //                 fontWeight: FontWeight.w400,
                              //               ),
                              //             ),
                              //             SizedBox(height: 1.h),
                              //           ],
                              //         ),
                              //       )
                              //     : Container(),
                              // orderID(
                              //     orderid: ordersController
                              //         .ordersdetails?.OrderSequence,
                              //     total:
                              //         ordersController.ordersdetails?.grandTotal,
                              //     date: DateFormat('dd/MM/yy').format(
                              //         ordersController
                              //             .ordersdetails!.createdAt!)),
                              // Column(
                              //   crossAxisAlignment: CrossAxisAlignment.start,
                              //   children: [
                              //     Padding(
                              //       padding: EdgeInsets.only(top: 1.h),
                              //       child: Text(
                              //         "Shipment Details",
                              //         style: GoogleFonts.poppins(
                              //             fontSize: 18.sp,
                              //             fontWeight: FontWeight.w600,
                              //             color: Color(0xff212529)),
                              //       ),
                              //     ),
                              //     SizedBox(
                              //       height: 0.5.h,
                              //     ),
                              //     Divider(
                              //       color: black.withOpacity(0.05),
                              //       thickness: 1.5,
                              //     ),
                              //     ListView.builder(
                              //       shrinkWrap: true,
                              //       physics: NeverScrollableScrollPhysics(),
                              //       padding: EdgeInsets.only(bottom: 2.h),
                              //       itemCount: ordersController
                              //           .ordersdetails?.orderitems?.length,
                              //       itemBuilder:
                              //           (BuildContext context, int index) {
                              //         var order = ordersController
                              //             .ordersdetails?.orderitems?[index];
                              //         return shipmentWidget(
                              //             image: order?.productImages ?? '',
                              //             itemsNames: order?.productName ?? '',
                              //             total: order?.offerPrice,
                              //             qunatity: order?.quantity,
                              //             metricTypeAndValue: order?.type == 1
                              //                 ? '${order?.metricvalue} ${order?.metrictype}'
                              //                 : 'Combo Of ${order?.kitItems?.length}');
                              //       },
                              //     ),
                              //     customText(
                              //       text: DateFormat('dd MMMM yyyy / hh:mm a')
                              //           .format(ordersController
                              //               .ordersdetails!.createdAt!),
                              //       fontWeight: FontWeight.w600,
                              //       color: Color(0XFF212529),
                              //     ),
                              //     // Text(ordersController.ordersdetails!.createdAt.toString()),
                              //     widget.isPastOrders
                              //         ? Padding(
                              //             padding: EdgeInsets.only(
                              //                 top: 0.h, bottom: 1.5.h),
                              //             child: Row(
                              //               children: [
                              //                 Padding(
                              //                   padding: const EdgeInsets.only(
                              //                       right: 5),
                              //                   child: Image.asset(
                              //                     deliveredIconIcon,
                              //                     height: 3.h,
                              //                     width: 8.w,
                              //                   ),
                              //                 ),
                              //                 customText(
                              //                   text: ordersController
                              //                               .ordersdetails
                              //                               ?.orderStatus ==
                              //                           1
                              //                       ? 'Delivered on '
                              //                       : ordersController
                              //                                   .ordersdetails
                              //                                   ?.orderStatus ==
                              //                               3
                              //                           ? 'Cancelled By Admin on '
                              //                           : ordersController
                              //                                       .ordersdetails
                              //                                       ?.orderStatus ==
                              //                                   4
                              //                               ? 'Cancelled By User on '
                              //                               : ordersController
                              //                                           .ordersdetails
                              //                                           ?.orderStatus ==
                              //                                       6
                              //                                   ? 'Rejected Delivery Boy on '
                              //                                   : '',
                              //                   fontWeight: FontWeight.w600,
                              //                   color: Color(0XFF009245),
                              //                 ),
                              //                 customText(
                              //                   text: DateFormat('dd/MM/yyyy')
                              //                       .format(ordersController
                              //                           .ordersdetails!
                              //                           .deliveredCancelleddatetime!),
                              //                   fontWeight: FontWeight.w600,
                              //                   color: Color(0XFF212529),
                              //                 ),
                              //               ],
                              //             ),
                              //           )
                              //         : Container(),
                              //   ],
                              // ),
                              // paymentWidget(
                              //     paymentType: ordersController
                              //         .ordersdetails?.paymentMethod),
                              // Divider(
                              //   color: black.withOpacity(0.05),
                              //   thickness: 1.5,
                              // ),
                              // shippingAddress(
                              //     userName:
                              //         ordersController.ordersdetails?.userName,
                              //     address:
                              //         '${ordersController.ordersdetails?.flatNo} ${ordersController.ordersdetails?.landMark} ${ordersController.ordersdetails?.address}'),
                              // Divider(
                              //   color: black.withOpacity(0.05),
                              //   thickness: 1.5,
                              // ),
                              // orderType(
                              //     orderType: ordersController
                              //         .ordersdetails?.orderStatus),
                              // Divider(
                              //   color: black.withOpacity(0.05),
                              //   thickness: 1.5,
                              // ),
                              // deliveryDistance(
                              //     Distance: ordersController.ordersdetails?.Distance.toString() ?? ''),
                              // deliveryOtp(
                              //     otp: ordersController.ordersdetails?.oTP ?? ''),
                              // Divider(
                              //   color: black.withOpacity(0.05),
                              //   thickness: 1.5,
                              // ),
                              // orderSummary(
                              //     orderType:
                              //         ordersController.ordersdetails?.orderType ??
                              //             '',
                              //     TipAmount: (ordersController
                              //                 .ordersdetails?.tipAmount !=
                              //             null)
                              //         ? ordersController.ordersdetails!.tipAmount!
                              //         : 0.0,
                              //     OriginalTotal: ordersController
                              //         .ordersdetails?.subTotal
                              //         ?.toStringAsFixed(2),
                              //     walletAmount:
                              //         ordersController.ordersdetails?.walletAmount ??
                              //             0,
                              //     // packing: 40.00,
                              //     delivery: ordersController
                              //                 .ordersdetails?.deliverCharges ==
                              //             0
                              //         ? 'Free'
                              //         : ordersController
                              //             .ordersdetails?.deliverCharges
                              //             ?.toStringAsFixed(2),
                              //     coupon:
                              //         ordersController.ordersdetails?.discount,
                              //     total: ordersController.ordersdetails?.grandTotal
                              //         ?.toStringAsFixed(2)),
                              // ordersController.ordersdetails?.orderStatus == 3 ||
                              //         ordersController
                              //                 .ordersdetails?.orderStatus ==
                              //             4
                              //     ? cancellationReson()
                              //     : Container(),
                            ],
                          ),
                        );
          },
        ),
      ),
      // bottomNavigationBar: GetBuilder<OrdersController>(
      //   id: 'update-orders',
      //   builder: (controller) => BottomAppBar(
      //         padding: EdgeInsets.fromLTRB(5.w, 0, 5.w, 2.h), child: bottomBar()),
      // ),

      bottomNavigationBar: GetBuilder<OrdersController>(
        id: 'update-orders',
        builder: (controller) => BottomAppBar(
          padding: EdgeInsets.fromLTRB(5.w, 0, 5.w, 2.h),
          child: InkWell(
              onTap: () {
                print(ordersController.ordersdetails!.orderStatus);
              },
              child: Align(child: SizedBox(height: 50, child: bottomBar()))),
        ),
      ),
    );
  }

  Future cancelBottomsheet() {
    return showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (BuildContext context) {
          return Padding(
            padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 4.h),
              child: Form(
                key: formkey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        customText(
                          text: "Reason of Cancellation",
                          fontWeight: FontWeight.w600,
                          fontSize: 18.sp,
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.pop(context);
                          },
                          child: Image.asset(
                            removeIcon,
                            height: 3.h,
                          ),
                        ),
                      ],
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(vertical: 3.h),
                      child: TextFormField(
                        maxLines: 5,
                        controller: cancelController,
                        validator: (value) {
                          if (value!.isEmpty) {
                            return 'Cancellation Reason Required';
                          }
                          return null;
                        },
                        autofocus: true,
                        onChanged: (value) {
                          if (value == ' ') {
                            cancelController.clear();
                          }
                        },
                        textInputAction: TextInputAction.done,
                        decoration: InputDecoration(
                            fillColor: bg1,
                            filled: true,
                            border: InputBorder.none,
                            hintStyle: customTextstyle(
                                color: ordersPrimaryColor.withOpacity(.4),
                                fontWeight: FontWeight.w600),
                            errorBorder: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            disabledBorder: InputBorder.none,
                            focusedErrorBorder: InputBorder.none,
                            hintText: 'Type Your Reason......'),
                      ),
                    ),
                    buttonWidget(
                        borderRadius: 25,
                        onTap: () {
                          if (formkey.currentState!.validate()) {
                            Navigator.pop(context, cancelController.text);
                          }
                        },
                        context: context,
                        text: 'Submit',
                        width: double.infinity)
                  ],
                ),
              ),
            ),
          );
        });
  }

  Widget cancellationReson() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        customText(
          text: "Cancellation Reason",
          fontWeight: FontWeight.w600,
          fontSize: 18.sp,
        ),
        Divider(
          color: black.withOpacity(0.05),
          thickness: 1.5,
        ),
        customText(
            text: ordersController.ordersdetails?.cancellationReason ?? '')
      ],
    );
  }

  Widget orderID({orderid, total, date}) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "Order ID",
              style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w500,
                  color: ordersPrimaryColor.withOpacity(.6),
                  fontSize: 16.sp),
            ),
            Text(
              "#$orderid",
              style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  color: Color(0xff212529),
                  fontSize: 16.sp),
            ),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "Total Amount",
              style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w500,
                  color: ordersPrimaryColor.withOpacity(.6),
                  fontSize: 16.sp),
            ),
            Text(
              "${Constants.rupee}$total",
              style: robotocustomTextstyle(
                  fontWeight: FontWeight.w600,
                  color: Color(0xff212529),
                  fontSize: 16.sp),
            )
          ],
        ),
        Column(
          children: [
            SizedBox(
              height: 1.h,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Placed on",
                  style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w500,
                      color: ordersPrimaryColor.withOpacity(.6),
                      fontSize: 16.sp),
                ),
                Text(
                  "$date",
                  style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      color: Color(0xff212529),
                      fontSize: 16.sp),
                )
              ],
            ),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
      ],
    );
  }

  Widget shipmentWidget({
    image, // Ensure that image is a List of Strings
    itemsNames,
    type,
    total,
    qunatity,
    metricTypeAndValue,
  }) {
    final currentPage = Rx<int>(0); // Rx to track the current page

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Column(
              children: [
                SizedBox(
                  height: 8.h, // Adjust height as needed
                  width: 30.w,
                  child: PageView.builder(
                    controller: PageController(),
                    itemCount: image.length,
                    onPageChanged: (index) {
                      currentPage.value =
                          index; // Update the current page index
                    },
                    itemBuilder: (context, index) {
                      // return Image.network(
                      //   image[index],
                      //   fit: BoxFit.contain,
                      // );
                      return CustomNetworkImage(
                        url: image[index],
                        height: 15.h,
                        width: 25.w,
                        fit: BoxFit.contain,
                      );
                      //   CachedNetworkImage(
                      //   imageUrl: image[index],
                      //   width: 25.w, // Adjust width as needed
                      //   height: 15.h, // Adjust height as needed
                      //   fit: BoxFit.contain,
                      //   placeholder: (context, url) => CircularProgressIndicator(),
                      //   errorWidget: (context, url, error) => Icon(Icons.error),
                      // );
                    },
                  ),
                ),
                if (image.length > 1)
                  Obx(() => Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(image.length, (index) {
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            // Space between dots
                            width: currentPage.value == index ? 12 : 8,
                            // Active dot size vs inactive
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: currentPage.value == index
                                  ? Colors.blue // Primary color
                                  : Colors.grey, // Inactive color
                            ),
                          );
                        }),
                      )),
              ],
            ),
            SizedBox(
              width: 2.w,
            ),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 5),
                    child: customText(
                      text: itemsNames,
                      color: ordersPrimaryColor,
                    ),
                  ),
                  SizedBox(
                    height: 0.5.h,
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(right: 5),
                            child: Text(metricTypeAndValue,
                                style: robotocustomTextstyle(
                                  fontWeight: FontWeight.w500,
                                )),
                          ),
                          Text("X $qunatity",
                              style: robotocustomTextstyle(
                                fontWeight: FontWeight.w500,
                              )),
                        ],
                      ),
                      Text("${Constants.rupee}$total",
                          style: robotocustomTextstyle(
                            fontWeight: FontWeight.w700,
                          )),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget paymentWidget({paymentType}) {
    print("paymentType$paymentType");
    return Padding(
      padding: EdgeInsets.only(bottom: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Padding(
          //   padding: const EdgeInsets.only(bottom: 8),
          //   child:
          //   Text(
          //     "Payment Information",
          //     style: GoogleFonts.poppins(
          //         fontWeight: FontWeight.w600,
          //         fontSize: 18.sp,
          //         color: Color(0xff212529)),
          //   ),
          // ),
          Divider(
            color: black.withOpacity(0.05),
            thickness: 1.5,
          ),
          SizedBox(
            height: 1.h,
          ),
          Text(
            "Payment Method",
            style: GoogleFonts.poppins(
              fontSize: 17.sp,
              color: ordersPrimaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(
            height: 1.h,
          ),
          Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 10),
                child: Image.asset(
                  paymentmethod,
                  height: 2.h,
                  width: 6.w,
                ),
              ),
              paymentType == "COD"
                  ? Text(
                      "Cash On Delivery",
                      style: GoogleFonts.poppins(
                        fontSize: 16.sp,
                        color: Color(0xff212529).withOpacity(0.45),
                        fontWeight: FontWeight.w400,
                      ),
                    )
                  : Text(
                      "Pay Online",
                      style: GoogleFonts.poppins(
                        fontSize: 16.sp,
                        color: Color(0xff212529).withOpacity(0.45),
                        fontWeight: FontWeight.w400,
                      ),
                    )
            ],
          ),
        ],
      ),
    );
  }

  Widget shippingAddress({userName, address}) {
    return Padding(
      padding: EdgeInsets.only(top: .5.h, bottom: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 5),
            child: Text(
              "Shipping Address",
              style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 18.sp,
                  color: Color(0xff212529)),
            ),
          ),
          SizedBox(
            height: 1.h,
          ),
          // Divider(
          //   color: Colors.transparent,
          //   thickness: 1.5,
          // ),
          Text(
            "$userName",
            style: GoogleFonts.poppins(
              fontSize: 18.sp,
              color: ordersPrimaryColor.withOpacity(.6),
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(
            height: 1.h,
          ),
          Text(
            "$address",
            style: GoogleFonts.poppins(
              fontSize: 15.sp,
              fontWeight: FontWeight.w500,
              color: ordersPrimaryColor.withOpacity(.6),
            ),
          ),
        ],
      ),
    );
  }

  Widget orderType({required int? orderType}) {
    return Padding(
      padding: EdgeInsets.only(top: .5.h, bottom: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 5),
            child: Text(
              "Order Status",
              style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 18.sp,
                  color: Color(0xff212529)),
            ),
          ),
          SizedBox(
            height: 1.h,
          ),
          // customText(
          //   text: ordersController.ordersdetails?.orderStatus == 1
          //       ? 'Delivered'
          //       : ordersController.ordersdetails?.orderStatus == 2
          //           ? 'Packing '
          //           : ordersController.ordersdetails?.orderStatus == 5
          //               ? 'Processing'
          //               : ordersController.ordersdetails?.orderStatus == 4
          //                   ? 'Cancelled'
          //                   : ordersController.ordersdetails?.orderStatus == 6
          //                       ? 'Rejected Delivery Boy '
          //                       : '',
          //   fontWeight: FontWeight.w600,
          //   color: Color(0XFF009245),
          // ),
          //   SizedBox(
          //   height: 1.h,
          // ),

          Builder(builder: (context) {
            final deliveredTime =
                ordersController.ordersdetails!.deliveredCancelleddatetime;

// Step 1: Check if it's not the default "invalid" time
            final isValidTime =
                deliveredTime != DateTime.parse("-0001-11-30 00:00:00.000");

// Step 2: Check if only time part is not 00:00:00.000
            final isTimeNotZero = !(deliveredTime!.hour == 0 &&
                deliveredTime.minute == 0 &&
                deliveredTime.second == 0 &&
                deliveredTime.millisecond == 0);

            if (isValidTime && isTimeNotZero) {
              // Show delivery status container
              return buildOrderStatusBox(ordersController);
            }
            // Don't show anything (or show default placeholder)
            return GetBuilder<OrdersController>(
              builder: (controller) {
                final orderDetails = controller.ordersdetails;

                if (orderDetails == null) {
                  return const SizedBox();
                }

                // Determine authoritative effective ETA
                final DateTime effectiveEta = orderDetails.estimateDateTime ??
                    (orderDetails.createdAt != null
                        ? DateTime.parse(orderDetails.createdAt.toString())
                            .add(Duration(minutes: 30))
                        : DateTime.now().add(Duration(minutes: 25)));

                final remainingDuration = effectiveEta.difference(DateTime.now());
                final bool isOverdue = remainingDuration.isNegative;
                final bool isDelayed = (orderDetails.totalDelayMinutes != null &&
                        orderDetails.totalDelayMinutes! > 0) ||
                    orderDetails.delayStatus == 'REPORTED' ||
                    (orderDetails.latestDelayReason != null &&
                        orderDetails.latestDelayReason!.isNotEmpty);

                final String delayReason = _getFriendlyDelayReason(orderDetails);
                final String etaTimeFormatted =
                    DateFormat('hh:mm a').format(effectiveEta);
                final String remainingText =
                    _formatNaturalRemainingDuration(remainingDuration);

                if (isOverdue) {
                  return Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: Color(0xFFFFF3E0), // Soft warm amber
                      border: Border.all(color: Color(0xFFFFB74D), width: 1.2),
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.warning_amber_rounded,
                                color: Color(0xFFE65100), size: 20),
                            SizedBox(width: 8),
                            Text(
                              isDelayed ? "Delivery delayed" : "Apologies for the Delay",
                              style: GoogleFonts.poppins(
                                fontSize: 15.sp,
                                color: Color(0xFFE65100),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 8),
                        Text(
                          isDelayed
                              ? "Your delivery is taking longer than expected due to $delayReason."
                              : "Your delivery is running late. We are working to get it to you as soon as possible.",
                          style: GoogleFonts.poppins(
                            fontSize: 13.5.sp,
                            color: Color(0xFF5D4037),
                            height: 1.4,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: 8),
                        Row(
                          children: [
                            Text(
                              "Updated estimated arrival: ",
                              style: GoogleFonts.poppins(
                                fontSize: 13.sp,
                                color: Color(0xFF795548),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              etaTimeFormatted,
                              style: GoogleFonts.poppins(
                                fontSize: 13.5.sp,
                                color: Color(0xFFD84315),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }

                // If not overdue, but rider reported delay
                if (isDelayed) {
                  return Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: Color(0xFFFFF8E1), // Warm amber background
                      border: Border.all(color: Color(0xFFFFD54F), width: 1.2),
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.schedule_rounded,
                                color: Color(0xFFF57F17), size: 20),
                            SizedBox(width: 8),
                            Text(
                              "Delivery delayed",
                              style: GoogleFonts.poppins(
                                fontSize: 15.sp,
                                color: Color(0xFFE65100),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Spacer(),
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Color(0xFFFFECB3),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                "+${orderDetails.totalDelayMinutes ?? 0}m",
                                style: GoogleFonts.poppins(
                                  fontSize: 11.sp,
                                  color: Color(0xFFB78103),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 8),
                        Text(
                          "Your delivery is taking longer than expected due to $delayReason.",
                          style: GoogleFonts.poppins(
                            fontSize: 13.5.sp,
                            color: Color(0xFF5D4037),
                            height: 1.4,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        if (orderDetails.latestDelayRemarks != null &&
                            orderDetails.latestDelayRemarks!.trim().isNotEmpty &&
                            orderDetails.latestDelayReason == 'OTHER') ...[
                          SizedBox(height: 4),
                          Text(
                            "Note: ${orderDetails.latestDelayRemarks!.trim()}",
                            style: GoogleFonts.poppins(
                              fontSize: 12.sp,
                              color: Color(0xFF6D4C41),
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                        SizedBox(height: 8),
                        Row(
                          children: [
                            Text(
                              "Updated estimated arrival: ",
                              style: GoogleFonts.poppins(
                                fontSize: 13.sp,
                                color: Color(0xFF795548),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              etaTimeFormatted,
                              style: GoogleFonts.poppins(
                                fontSize: 13.5.sp,
                                color: Color(0xFFD84315),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 6),
                        Row(
                          children: [
                            Text(
                              "Time remaining: ",
                              style: GoogleFonts.poppins(
                                fontSize: 12.sp,
                                color: Color(0xFF8D6E63),
                              ),
                            ),
                            Text(
                              remainingText,
                              style: GoogleFonts.poppins(
                                fontSize: 12.5.sp,
                                color: Color(0xFF4E342E),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 10),
                        SlideCountdownSeparated(
                          decoration: BoxDecoration(
                            color: Color(0xFFE65100),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          duration: remainingDuration,
                        ),
                      ],
                    ),
                  );
                }

                // Normal on-time delivery
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(bottom: 5),
                      child: Row(
                        children: [
                          Text(
                            "Will be Delivered in",
                            style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w600,
                                fontSize: 18.sp,
                                color: Color(0xff212529)),
                          ),
                          Spacer(),
                          Text(
                            "ETA: $etaTimeFormatted",
                            style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w500,
                                fontSize: 13.sp,
                                color: Color(0xff6C757D)),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      "Approx. $remainingText remaining",
                      style: GoogleFonts.poppins(
                          fontSize: 12.sp,
                          color: Color(0xff6C757D),
                          fontWeight: FontWeight.w400),
                    ),
                    SizedBox(height: 1.h),
                    Container(
                      height: 40,
                      child: SlideCountdownSeparated(
                        decoration: BoxDecoration(
                          color: Appprimary,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        duration: remainingDuration,
                      ),
                    ),
                  ],
                );
              },
            );
          }
              // return ordersController.ordersdetails!.deliveredCancelleddatetime != DateTime.parse("-0001-11-30 00:00:00.000")?  buildOrderStatusBox(ordersController):

              ),
          SizedBox(
            height: 1.h,
          ),
          //  Divider(
          //           color: black.withOpacity(0.05),
          //           thickness: 1.5,
          //         ),
          // customText(
          //   text: "Packing",
          //   fontWeight: FontWeight.w500,
          //   color: ordersPrimaryColor.withOpacity(.6),
          // ),
        ],
      ),
    );
  }

  Widget buildOrderStatusBox(OrdersController ordersController) {
    final orderStatus = ordersController.ordersdetails?.orderStatus;
    final deliveredCancelled =
        ordersController.ordersdetails?.deliveredCancelleddatetime;
    final createdAt = ordersController.ordersdetails?.createdAt;

    // Step 1: Handle Cancelled/Rejected Orders First
    String? cancelText;
    if (orderStatus == 3) {
      cancelText = 'Cancelled by Admin on ';
    } else if (orderStatus == 4) {
      cancelText = 'Cancelled by User on ';
    } else if (orderStatus == 6) {
      cancelText = 'Rejected by Delivery Boy on ';
    }

    if (cancelText != null) {
      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Color(0xFFFFEBEE), // light red
          // boxShadow: [
          //   BoxShadow(
          //     color: Colors.redAccent.withOpacity(0.3),
          //     blurRadius: 6,
          //     offset: Offset(0, 3),
          //   ),
          // ],
        ),
        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Icon(Icons.cancel, color: Colors.red, size: 18),
            SizedBox(width: 6),
            Expanded(
              child: customText(
                text:
                    "$cancelText ${deliveredCancelled != null ? DateFormat.yMMMd().add_jm().format(deliveredCancelled) : ''}",
                fontSize: 13,
                color: Colors.red.shade800,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    // Step 2: If not cancelled and delivery time is available, compare times
    if (deliveredCancelled != null && createdAt != null) {
      final duration = deliveredCancelled.difference(createdAt).inMinutes;

      if (duration <= 30) {
        // Delivered on time
        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: Color(0xFFD0F8CE),
            // boxShadow: [
            //   BoxShadow(
            //     color: Colors.greenAccent.withOpacity(0.3),
            //     blurRadius: 6,
            //     offset: Offset(0, 3),
            //   ),
            // ],
          ),
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.check_circle, color: Color(0xFF1B5E20), size: 18),
                  SizedBox(width: 6),
                  customText(
                    text: "Delivered on Time 🎉",
                    fontSize: 14,
                    color: Color(0xFF1B5E20),
                    fontWeight: FontWeight.bold,
                  ),
                ],
              ),
              SizedBox(height: 6),
              customText(
                text: "Your order arrived right on time. Enjoy!",
                fontSize: 12,
                color: Color(0xFF2E7D32),
              ),
            ],
          ),
        );
      } else {
        // Delivered late
        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: Color(0xFFFFF3E0), // Soft peachy-orange background
            // boxShadow: [
            //   BoxShadow(
            //     color:
            //         Color(0xFFFFAB40).withOpacity(0.25), // Warm orange shadow
            //     blurRadius: 8,
            //     offset: Offset(0, 4),
            //   ),
            // ],
          ),
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.access_time, color: Color(0xFFE65100), size: 18),
                  SizedBox(width: 6),
                  customText(
                    text: "Delivered a bit late ⏱️",
                    fontSize: 14,
                    color: Color(0xFFE65100), // Deep orange
                    fontWeight: FontWeight.bold,
                  ),
                ],
              ),
              SizedBox(height: 6),
              customText(
                text:
                    "Delivery was slightly delayed. We're improving for future orders.",
                fontSize: 12,
                color: Color(0xFFFB8C00), // Softer orange
              ),
            ],
          ),
        );
      }
    }

    return SizedBox(); // No message to show
  }

  Widget deliveryDistance({required String Distance}) {
    if (Distance == '' || Distance == 'NA') {
      return Container();
    }
    return Padding(
      padding: EdgeInsets.only(top: .5.h, bottom: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 5),
            child: customText(
              text: "Delivery Boy Distance",
              fontWeight: FontWeight.w600,
              fontSize: 18.sp,
            ),
          ),
          Divider(
            color: black.withOpacity(0.05),
            thickness: 1.5,
          ),
          customText(
            text: "$Distance km",
            fontWeight: FontWeight.w500,
            color: ordersPrimaryColor.withOpacity(.6),
          ),
        ],
      ),
    );
  }

  Widget deliveryOtp({required String otp}) {
    if (otp == '' || otp == 'NA') {
      return Container();
    }
    return Padding(
      padding: EdgeInsets.only(top: .5.h, bottom: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 5),
            child: customText(
              text: "Delivery OTP",
              fontWeight: FontWeight.w600,
              fontSize: 18.sp,
            ),
          ),
          SizedBox(height: 1.h),
          Row(
            children: [
              Expanded(
                child: customText(
                  text:
                      "Check Your Items.\nSharing OTP = Order Final - No Refund/Replacement",
                  fontSize: 16.sp,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              Image.asset(
                'Assets/Images/clickgetBag.png',
                height: 60,
              )
            ],
          ),
          SizedBox(height: 1.h),

          Container(
            height: 50,
            width: double.infinity,
            child: ListView.builder(
              itemCount: otp.length,
              scrollDirection: Axis.horizontal,
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              itemBuilder: (context, index) {
                return Align(
                  child: Container(
                    // Decoration(),
                    height: 50,
                    width: 50,
                    margin: EdgeInsets.symmetric(
                        horizontal: 4), // spacing between boxes
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      // border: Border.all(color: Colors.grey.shade400),
                      borderRadius: BorderRadius.circular(8),
                      color: Appprimary,
                    ),
                    alignment: Alignment.center,
                    child: customText(
                      text: otp[index],
                      fontSize: 19,
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      // display one character
                    ),
                  ),
                );
              },
            ),
          )

          // customText(
          //   text: otp,
          //   fontWeight: FontWeight.w500,
          //   color: ordersPrimaryColor.withOpacity(.6),
          // ),
        ],
      ),
    );
  }

  Widget orderSummary({
    OriginalTotal,
    packing,
    delivery,
    coupon,
    total,
    required String orderType,
    required double walletAmount,
    TipAmount,
  }) {
    print("TipAmount is${TipAmount}");

    return Padding(
      padding: EdgeInsets.only(top: 2.h, bottom: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Order Summary",
              style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 18.sp,
                  color: Color(0xff212529))),
          Divider(
            color: black.withOpacity(0.05),
            thickness: 1.5,
          ),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Items:",
                style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w500,
                    fontSize: 16.sp,
                    color: Color(0xff212529).withOpacity(.6)),
              ),
              Text("₹$OriginalTotal",
                  style: robotocustomTextstyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 16.sp,
                      color: Color(0xff212529))),
            ],
          ),
          Divider(
            color: black.withOpacity(0.05),
            thickness: 1.5,
          ),
          if (TipAmount > 0)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Tip:",
                    style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w500,
                        fontSize: 16.sp,
                        color: Color(0xff212529).withOpacity(.6))),
                Text("${Constants.rupee}$TipAmount",
                    style: robotocustomTextstyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16.sp,
                        color: Color(0xff212529))),
              ],
            ),
          // Row(
          //   mainAxisAlignment: MainAxisAlignment.spaceBetween,
          //   children: [
          //     customText(
          //       text: "Postage & Packing:",
          //       fontWeight: FontWeight.w600,
          //     ),
          //     Text("${Constants.rupee}$packing",
          //         style: robotocustomTextstyle(
          //           fontWeight: FontWeight.w600,
          //         )),
          //   ],
          // ),
          // SizedBox(
          //   height: 1.h,
          // ),
          if (orderType.toLowerCase() == 'delivery'.toLowerCase()) ...[
            SizedBox(
              height: 1.h,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Delivery Charges:",
                    style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w500,
                        fontSize: 16.sp,
                        color: Color(0xff212529).withOpacity(.6))),
                delivery.toString().toLowerCase() == 'free'
                    ? Text("${Constants.rupee}$delivery",
                        style: robotocustomTextstyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16.sp,
                            color: Color(0xff212529)))
                    : Text("${Constants.rupee}$delivery",
                        style: robotocustomTextstyle(
                          color: Color(0xff212529),
                          fontWeight: FontWeight.w600,
                        )),
              ],
            ),
          ],

          coupon == 0
              ? Container()
              : Column(
                  children: [
                    SizedBox(
                      height: 1.h,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("Coupon Applied",
                            style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w500,
                                fontSize: 16.sp,
                                color: Color(0xff212529).withOpacity(.6))),
                        Text("-${Constants.rupee}$coupon",
                            style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w600,
                                fontSize: 16.sp,
                                color: Color(0xff009245))),
                      ],
                    ),
                  ],
                ),

          walletAmount == 0
              ? Container()
              : Column(
                  children: [
                    SizedBox(
                      height: 1.h,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        customText(
                          text: "Wallet Amount Used",
                          fontWeight: FontWeight.w600,
                        ),
                        Text("-${Constants.rupee}$walletAmount",
                            style: robotocustomTextstyle(
                              color: Color(0xff212529),
                              fontWeight: FontWeight.w600,
                            )),
                      ],
                    ),
                  ],
                ),

          SizedBox(
            height: 1.h,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Order Total",
                  style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w500,
                      fontSize: 16.sp,
                      color: Color(0xff212529).withOpacity(.6))),
              Text("${Constants.rupee}$total",
                  style: robotocustomTextstyle(
                    color: Color(0xff212529),
                    fontWeight: FontWeight.w600,
                  )),
            ],
          ),
        ],
      ),
    );
  }

  Widget bottomBar() {
    bool isPast = widget.isPastOrders;

    // Check if conditions should show the bar or not
    if (!isPast) {
      if (isTimeDifferenceExceeded) {
        return SizedBox.shrink();
      }
      if (isTimeDifferenceFound(ordersController.ordersdetails?.createdAt)) {
        return SizedBox.shrink();
      }
    }

    int orderstatus = ordersController.ordersdetails?.orderStatus ?? 0;

    return (orderstatus == 1 || orderstatus == 8)
        ? Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            // Keep column to the minimum required height
            children: [
              Expanded(
                child: buttonWidget(
                  width: 100.w,
                  textColor: isPast ? white : black,
                  buttonColor: !isPast ? white : primary,
                  borderColor: primary,
                  borderRadius: 25,
                  borderWidth: 2,
                  onTap: () {
                    if (orderstatus == 1) {
                      Map<String, dynamic> body = <String, dynamic>{};
                      body['OrderID'] = widget.orderNo;
                      ordersController.reOrder(context: context, body: body);
                    } else if (orderstatus == 8) {
                      cancelBottomsheet().then((value) {
                        if (value != null) {
                          Map<String, dynamic> body = <String, dynamic>{};
                          body['CancellationReason'] = value;
                          ordersController.cancelOrders(
                              context, body, widget.orderNo);
                        }
                      });
                    }
                  },
                  context: context,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  text: isPast ? "Re-Order" : "Cancel Order",
                ),
              ),
              if (orderstatus ==
                  2) // Display additional text only if orderstatus is 2
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: customText(
                    text: "You can cancel this order within 2 mins",
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
            ],
          )
        : SizedBox.shrink(); // Return empty space if orderstatus is not 1 or 2
  }

  Widget buildStatusBox({
    required String title,
    required String message,
    required Color bgColor,
    required Color titleColor,
    required Color msgColor,
    required String arrivedIn,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(10),
          ),
          padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              customText(
                text: title,
                fontSize: 14,
                color: titleColor,
                fontWeight: FontWeight.bold,
              ),
              SizedBox(height: 6),
              customText(
                text: message,
                fontSize: 12,
                color: msgColor,
              ),
            ],
          ),
        ),
        arrivedIn == ""
            ? SizedBox()
            : SizedBox(
                height: 1.h,
              ),
        arrivedIn == ""
            ? SizedBox()
            : customText(
                text: "Arrived In",
                fontSize: 14,
                color: black,
              ),
        arrivedIn == ""
            ? SizedBox()
            : SizedBox(
                height: 0.h,
              ),
        arrivedIn == ""
            ? SizedBox()
            : Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Builder(builder: (context) {
                    return customText(
                      text: "$arrivedIn",
                      fontSize: 20,
                      color: Appprimary,
                      fontWeight: FontWeight.w700,
                    );
                  }),
                ],
              )
      ],
    );
  }
}

String formatUtcToLocal(String utcTime) {
  print(utcTime);
  DateTime dateTime =
      DateTime.parse(utcTime).toLocal(); // Convert to local time
  return DateFormat("EEE, dd MMM''yy, hh:mm a").format(dateTime);
}

Widget buildOtherStatusBox(int status) {
  String title;
  String message;
  Color bgColor;
  Color titleColor;
  Color msgColor;

  switch (status) {
    case 2:
      title = "Packing in Progress 📦";
      message = "Your order is being packed carefully.";
      bgColor = const Color(0xFFE3F2FD); // Light Blue
      titleColor = const Color(0xFF1565C0);
      msgColor = const Color(0xFF0D47A1);
      break;
    case 3:
      title = "Shipment Created 🚚";
      message = "Your shipment is prepared and ready to dispatch.";
      bgColor = const Color(0xFFE8F5E9); // Light Green
      titleColor = const Color(0xFF2E7D32);
      msgColor = const Color(0xFF1B5E20);
      break;
    case 4:
      title = "Order Cancelled ❌";
      message = "This order has been cancelled as per request.";
      bgColor = const Color(0xFFFFEBEE); // Light Red
      titleColor = const Color(0xFFC62828);
      msgColor = const Color(0xFFB71C1C);
      break;
    case 5:
      title = "Picked Up 🏃‍♂️";
      message = "The order has been picked up by delivery partner.";
      bgColor = const Color(0xFFFFF3E0); // Light Orange
      titleColor = const Color(0xFFEF6C00);
      msgColor = const Color(0xFFE65100);
      break;
    case 6:
      title = "Returned 🔄";
      message = "This order has been returned back.";
      bgColor = const Color(0xFFF3E5F5); // Light Purple
      titleColor = const Color(0xFF8E24AA);
      msgColor = const Color(0xFF6A1B9A);
      break;
    default:
      title = "Unknown Status 🤷‍♂️";
      message = "We are unable to find the current status.";
      bgColor = Colors.grey[300]!;
      titleColor = Colors.black87;
      msgColor = Colors.black54;
  }

  return Container(
    width: double.infinity,
    padding: const EdgeInsets.all(16),
    margin: const EdgeInsets.symmetric(vertical: 8),
    decoration: BoxDecoration(
      color: bgColor,
      borderRadius: BorderRadius.circular(12),
      boxShadow: [
        BoxShadow(
          color: Colors.black12,
          blurRadius: 4,
          offset: Offset(2, 2),
        )
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: titleColor,
          ),
        ),
        SizedBox(height: 8),
        Text(
          message,
          style: GoogleFonts.poppins(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: msgColor,
          ),
        ),
      ],
    ),
  );
}
