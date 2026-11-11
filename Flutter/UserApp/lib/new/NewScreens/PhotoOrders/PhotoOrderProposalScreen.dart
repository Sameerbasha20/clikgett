import 'package:fav_app/new/Constants/skeletons.dart';
import 'package:fav_app/new/Constants/number_format.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Controllers/photo_orders_controller.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/OrderDetails.dart';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class PhotoOrderProposalScreen extends StatefulWidget {
  final int requestId;
  const PhotoOrderProposalScreen({Key? key, required this.requestId}) : super(key: key);

  @override
  State<PhotoOrderProposalScreen> createState() => _PhotoOrderProposalScreenState();
}

class _PhotoOrderProposalScreenState extends State<PhotoOrderProposalScreen> {
  String _token = '';
  // Opened from My Orders too, where the photo-orders screens haven't created it yet.
  final PhotoOrdersController controller =
      Get.isRegistered<PhotoOrdersController>() ? Get.find<PhotoOrdersController>() : Get.put(PhotoOrdersController());

  String selectedPaymentMethod = 'COD';
  bool isImageExpanded = false;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    // The photo is private: the image request needs the customer's token.
    CommonServices.getToken().then((t) {
      if (mounted) setState(() => _token = t);
    });
    controller.fetchDetail(widget.requestId);
    // Keep the tracker live while the store works on the list.
    _poll = Timer.periodic(const Duration(seconds: 15), (_) {
      final st = controller.currentDetail.value?.requestStatus;
      if (st == 'PENDING' || st == 'UNDER_REVIEW' || st == 'PROPOSAL_DRAFT') {
        controller.fetchDetail(widget.requestId, silent: true);
      }
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  void _showRejectDialog(BuildContext context) {
    final TextEditingController reasonCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Text(
          "Decline Proposal",
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16.sp),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Please provide an optional reason for declining this proposal:",
              style: GoogleFonts.poppins(fontSize: 13.sp, color: Colors.grey[700]),
            ),
            SizedBox(height: 1.5.h),
            TextField(
              controller: reasonCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: "e.g., Price too high, item missing, found elsewhere...",
                hintStyle: GoogleFonts.poppins(fontSize: 12.sp, color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            )
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text("Cancel", style: GoogleFonts.poppins(color: Colors.grey[600])),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await controller.rejectProposal(
                requestId: widget.requestId,
                reason: reasonCtrl.text.trim(),
              );
              if (success) {
                controller.fetchDetail(widget.requestId);
              }
            },
            child: Text("Decline", style: GoogleFonts.poppins(color: white)),
          )
        ],
      ),
    );
  }

  void _confirmCancel() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text("Cancel this request?", style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        content: Text("The store will stop preparing a proposal for this photo.", style: GoogleFonts.poppins(fontSize: 13.sp)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text("Keep it", style: GoogleFonts.poppins(color: Colors.grey[600])),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              Navigator.pop(ctx);
              controller.cancelRequest(widget.requestId);
            },
            child: Text("Cancel request", style: GoogleFonts.poppins(color: white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        elevation: 1,
        backgroundColor: white,
        title: Text(
          "Order Proposal",
          style: GoogleFonts.poppins(
            fontSize: 17.sp,
            fontWeight: FontWeight.w600,
            color: black,
          ),
        ),
        leading: IconButton(
          icon: Image.asset(backbutton, height: 4.h),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Obx(() {
        if (controller.isLoadingDetail.value) {
          return const Skeleton(kind: SkeletonKind.orderDetail);
        }

        final req = controller.currentDetail.value;
        if (req == null) {
          return const Center(child: Text("Failed to load proposal details"));
        }

        final isAwaiting = req.requestStatus == 'AWAITING_CUSTOMER_CONFIRMATION';
        final isCreated = req.requestStatus == 'ORDER_CREATED';
        final isDeclined = req.requestStatus == 'CUSTOMER_REJECTED' || req.requestStatus == 'CANCELLED';
        final isPending = req.requestStatus == 'PENDING' || req.requestStatus == 'UNDER_REVIEW' || req.requestStatus == 'PROPOSAL_DRAFT';

        final imageApiUrl = "${Constants.baseUrl}/photo-orders/image/${req.requestID}";

        return SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Where the photo order is, step by step.
              _PhotoOrderTracker(
                status: req.requestStatus ?? 'PENDING',
                orderId: req.createdOrderID,
                onTrackOrder: req.createdOrderID == null
                    ? null
                    : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderDetailsScreen(orderNo: req.createdOrderID!))),
              ),

              SizedBox(height: 2.h),

              // Expandable Photo Preview Card (typed-only requests have no photo)
              if ((req.imageStoragePath ?? '').isNotEmpty) Container(
                decoration: BoxDecoration(
                  color: white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.image, color: primary),
                      title: Text(
                        "Your Uploaded Photo",
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13.5.sp),
                      ),
                      trailing: IconButton(
                        icon: Icon(isImageExpanded ? Icons.expand_less : Icons.expand_more),
                        onPressed: () {
                          setState(() {
                            isImageExpanded = !isImageExpanded;
                          });
                        },
                      ),
                    ),
                    if (isImageExpanded && _token.isNotEmpty) ...[
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.h),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: CachedNetworkImage(
                            imageUrl: imageApiUrl,
                            httpHeaders: {'Authorization': 'bearer $_token'},
                            cacheKey: 'photo-order-${req.requestID}',
                            height: 30.h,
                            width: double.infinity,
                            fit: BoxFit.contain,
                            placeholder: (_, __) => Container(
                              height: 20.h,
                              color: Colors.grey.shade100,
                              child: const Center(child: CircularProgressIndicator(color: primary)),
                            ),
                            errorWidget: (_, __, ___) => Container(
                              height: 15.h,
                              color: Colors.grey.shade100,
                              child: const Center(child: Icon(Icons.broken_image, color: Colors.grey)),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              if ((req.typedItems ?? '').isNotEmpty) ...[
                SizedBox(height: 1.5.h),
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(3.w),
                  decoration: BoxDecoration(
                    color: white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Your Typed Items:",
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12.sp, color: Colors.grey[700]),
                      ),
                      SizedBox(height: 0.5.h),
                      Text(req.typedItems!, style: GoogleFonts.poppins(fontSize: 13.sp, color: black)),
                    ],
                  ),
                ),
              ],

              if (req.customerNotes != null && req.customerNotes!.isNotEmpty) ...[
                SizedBox(height: 1.5.h),
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(3.w),
                  decoration: BoxDecoration(
                    color: white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Your Shopping Instructions:",
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12.sp, color: Colors.grey[700]),
                      ),
                      SizedBox(height: 0.5.h),
                      Text(req.customerNotes!, style: GoogleFonts.poppins(fontSize: 13.sp, color: black)),
                    ],
                  ),
                ),
              ],

              if (req.adminNotes != null && req.adminNotes!.isNotEmpty) ...[
                SizedBox(height: 1.5.h),
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(3.w),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Store Team Notes:",
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12.sp, color: const Color(0xFF1D4ED8)),
                      ),
                      SizedBox(height: 0.5.h),
                      Text(req.adminNotes!, style: GoogleFonts.poppins(fontSize: 13.sp, color: black)),
                    ],
                  ),
                ),
              ],

              SizedBox(height: 2.5.h),

              // Proposed Items Table / List
              Text(
                "Proposed Products (${req.items?.length ?? 0} items)",
                style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14.5.sp, color: black),
              ),
              SizedBox(height: 1.h),

              if (req.items == null || req.items!.isEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(4.w),
                  decoration: BoxDecoration(
                    color: white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Center(
                    child: Text(
                      isPending
                          ? "Items and prices will show here once the store has checked your list."
                          : "No proposed items available.",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(fontSize: 13.sp, color: Colors.grey[600]),
                    ),
                  ),
                ),
                if (isPending) ...[
                  SizedBox(height: 1.5.h),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        padding: EdgeInsets.symmetric(vertical: 1.4.h),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.close_rounded),
                      label: Text("Cancel request", style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      onPressed: _confirmCancel,
                    ),
                  ),
                ],
              ] else ...[
                Container(
                  decoration: BoxDecoration(
                    color: white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: req.items!.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (ctx, i) {
                      final item = req.items![i];
                      final isAlt = item.availabilityStatus == 'ALTERNATIVE_SUGGESTED';

                      return Padding(
                        padding: EdgeInsets.all(3.w),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: primary.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.shopping_bag_outlined, color: primary, size: 22),
                            ),
                            SizedBox(width: 3.w),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.productName ?? '',
                                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13.5.sp),
                                  ),
                                  if (isAlt) ...[
                                    Container(
                                      margin: const EdgeInsets.only(top: 2),
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.amber.shade100,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        "Suggested Alternative",
                                        style: GoogleFonts.poppins(fontSize: 10.5.sp, color: Colors.amber.shade900, fontWeight: FontWeight.w600),
                                      ),
                                    )
                                  ],
                                  SizedBox(height: 0.5.h),
                                  Text(
                                    "Qty: ${item.quantity} × ${money(item.unitPrice ?? 0)}",
                                    style: GoogleFonts.poppins(fontSize: 12.sp, color: Colors.grey[700]),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              "${money(item.lineTotal ?? 0)}",
                              style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14.sp, color: black),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                )
              ],

              SizedBox(height: 2.5.h),

              // Price Summary Card
              if (req.items != null && req.items!.isNotEmpty) ...[
                Text(
                  "Order Summary",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14.5.sp, color: black),
                ),
                SizedBox(height: 1.h),
                Container(
                  padding: EdgeInsets.all(4.w),
                  decoration: BoxDecoration(
                    color: white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Subtotal", style: GoogleFonts.poppins(fontSize: 13.sp, color: Colors.grey[700])),
                          Text("${money(req.subTotal ?? 0)}", style: GoogleFonts.poppins(fontSize: 13.sp, fontWeight: FontWeight.w500)),
                        ],
                      ),
                      SizedBox(height: 1.h),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Delivery Charges", style: GoogleFonts.poppins(fontSize: 13.sp, color: Colors.grey[700])),
                          Text("${money(req.deliveryCharges ?? 0)}", style: GoogleFonts.poppins(fontSize: 13.sp, fontWeight: FontWeight.w500)),
                        ],
                      ),
                      if (req.discount != null && req.discount! > 0) ...[
                        SizedBox(height: 1.h),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("Discounts Applied", style: GoogleFonts.poppins(fontSize: 13.sp, color: Colors.green)),
                            Text("-${money(req.discount)}", style: GoogleFonts.poppins(fontSize: 13.sp, color: Colors.green, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ],
                      SizedBox(height: 1.5.h),
                      const Divider(height: 1),
                      SizedBox(height: 1.5.h),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Final Proposal Total", style: GoogleFonts.poppins(fontSize: 15.sp, fontWeight: FontWeight.w700)),
                          Text("${money(req.grandTotal ?? 0)}", style: GoogleFonts.poppins(fontSize: 16.sp, fontWeight: FontWeight.w700, color: primary)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],

              // Confirmation / Payment Selection Section
              if (isAwaiting) ...[
                SizedBox(height: 3.h),
                Text(
                  "Choose Payment Method",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14.sp, color: black),
                ),
                SizedBox(height: 1.h),
                Container(
                  decoration: BoxDecoration(
                    color: white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    children: [
                      RadioListTile<String>(
                        value: 'COD',
                        groupValue: selectedPaymentMethod,
                        activeColor: primary,
                        title: Text("Cash on Delivery (COD)", style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                        subtitle: const Text("Pay when your order arrives"),
                        onChanged: (val) {
                          setState(() {
                            selectedPaymentMethod = val!;
                          });
                        },
                      ),
                      const Divider(height: 1),
                      RadioListTile<String>(
                        value: 'ONLINE',
                        groupValue: selectedPaymentMethod,
                        activeColor: primary,
                        title: Text("Online Payment / UPI", style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                        subtitle: const Text("Pay securely with UPI or Cards"),
                        onChanged: (val) {
                          setState(() {
                            selectedPaymentMethod = val!;
                          });
                        },
                      ),
                    ],
                  ),
                ),

                SizedBox(height: 3.h),

                // Accept & Decline buttons
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.red),
                          padding: EdgeInsets.symmetric(vertical: 1.4.h),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => _showRejectDialog(context),
                        child: Text("Decline", style: GoogleFonts.poppins(color: Colors.red, fontWeight: FontWeight.w600)),
                      ),
                    ),
                    SizedBox(width: 3.w),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primary,
                          padding: EdgeInsets.symmetric(vertical: 1.4.h),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: controller.isConfirming.value
                            ? null
                            : () async {
                                final createdOrderId = await controller.confirmProposal(
                                  requestId: req.requestID ?? 0,
                                  paymentMethod: selectedPaymentMethod,
                                );
                                if (createdOrderId != null && createdOrderId > 0) {
                                  controller.fetchDetail(widget.requestId);
                                  Get.off(() => OrderDetailsScreen(orderNo: createdOrderId));
                                }
                              },
                        child: controller.isConfirming.value
                            ? const CircularProgressIndicator(color: white, strokeWidth: 2)
                            : Text(
                                "Accept & Place Order",
                                style: GoogleFonts.poppins(color: white, fontWeight: FontWeight.w700, fontSize: 14.sp),
                              ),
                      ),
                    ),
                  ],
                ),
              ],

              SizedBox(height: 4.h),
            ],
          ),
        );
      }),
    );
  }
}

/// Photo order progress: list received → checking items → prices ready → order placed.
class _PhotoOrderTracker extends StatelessWidget {
  final String status;
  final int? orderId;
  final VoidCallback? onTrackOrder;
  const _PhotoOrderTracker({required this.status, this.orderId, this.onTrackOrder});

  static const _icons = ['📝', '🔍', '🧾', '🛍️'];
  static const _labels = ['List received', 'Checking items', 'Prices ready', 'Order placed'];

  int get _step {
    switch (status) {
      case 'UNDER_REVIEW':
      case 'PROPOSAL_DRAFT':
        return 1;
      case 'AWAITING_CUSTOMER_CONFIRMATION':
        return 2;
      case 'ORDER_CREATED':
        return 3;
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final declined = status == 'CUSTOMER_REJECTED' || status == 'CANCELLED';
    final step = _step;
    final String title;
    final String body;
    if (declined) {
      title = status == 'CANCELLED' ? 'Request cancelled' : 'You declined the prices';
      body = 'No order was placed for this list.';
    } else if (step == 0) {
      title = 'We have your list';
      body = 'The store will check each item for stock and price. You will get a notification when prices are ready.';
    } else if (step == 1) {
      title = 'Checking your items';
      body = 'The store is matching your list with items in stock and adding today\'s prices.';
    } else if (step == 2) {
      title = 'Prices are ready';
      body = 'Review the items and total below, then confirm to place the order.';
    } else {
      title = 'Order placed${orderId != null ? ' · #$orderId' : ''}';
      body = 'Your items are on the way. Track the delivery for live updates.';
    }
    final accent = declined ? const Color(0xFFDC2626) : (step == 2 ? const Color(0xFFEA580C) : const Color(0xFF16A34A));
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accent.withOpacity(0.35)),
        boxShadow: [BoxShadow(color: accent.withOpacity(0.08), blurRadius: 14, offset: const Offset(0, 6))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A))),
        const SizedBox(height: 2),
        Text(body, style: GoogleFonts.poppins(fontSize: 12.5, color: const Color(0xFF475569), height: 1.4)),
        if (!declined) ...[
          const SizedBox(height: 14),
          Row(children: [
            for (var i = 0; i < _labels.length; i++) ...[
              if (i > 0)
                Expanded(
                  child: Container(
                    height: 3,
                    margin: const EdgeInsets.only(bottom: 32),
                    decoration: BoxDecoration(
                      color: i <= step ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              _dot(i, step),
            ],
          ]),
        ],
        if (onTrackOrder != null && step == 3) ...[
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onTrackOrder,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.delivery_dining_rounded),
              label: Text('Track delivery', style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ]),
    );
  }

  Widget _dot(int i, int step) {
    final done = i < step;
    final current = i == step;
    return SizedBox(
      width: 62,
      child: Column(children: [
        SizedBox(height: 38, child: Center(child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: current ? 38 : 32,
          height: current ? 38 : 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: done ? const Color(0xFF16A34A) : (current ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9)),
            border: Border.all(color: current ? const Color(0xFF16A34A) : Colors.transparent, width: 2),
          ),
          child: done
              ? const Icon(Icons.check_rounded, color: Colors.white, size: 18)
              : Text(_icons[i], style: TextStyle(fontSize: current ? 17 : 14)),
        ))),
        const SizedBox(height: 4),
        SizedBox(height: 28, child: Text(_labels[i],
            textAlign: TextAlign.center,
            maxLines: 2,
            style: GoogleFonts.poppins(
                fontSize: 10.5,
                height: 1.2,
                fontWeight: current ? FontWeight.w700 : FontWeight.w500,
                color: i <= step ? const Color(0xFF14532D) : const Color(0xFF94A3B8)))),
      ]),
    );
  }
}
