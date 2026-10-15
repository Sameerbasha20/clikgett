import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Controllers/photo_orders_controller.dart';
import 'package:fav_app/new/NewScreens/PhotoOrders/PhotoOrderProposalScreen.dart';
import 'package:fav_app/new/NewScreens/PhotoOrders/PhotoOrderUploadScreen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class PhotoOrdersListScreen extends StatefulWidget {
  const PhotoOrdersListScreen({Key? key}) : super(key: key);

  @override
  State<PhotoOrdersListScreen> createState() => _PhotoOrdersListScreenState();
}

class _PhotoOrdersListScreenState extends State<PhotoOrdersListScreen> {
  final PhotoOrdersController controller = Get.put(PhotoOrdersController());

  @override
  void initState() {
    super.initState();
    controller.fetchMyPhotoOrders();
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'PENDING':
        return Colors.orange;
      case 'UNDER_REVIEW':
      case 'PROPOSAL_DRAFT':
        return Colors.blue;
      case 'AWAITING_CUSTOMER_CONFIRMATION':
        return Colors.deepPurple;
      case 'ORDER_CREATED':
        return Colors.green;
      case 'CUSTOMER_REJECTED':
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatStatusLabel(String? status) {
    switch (status) {
      case 'PENDING':
        return 'Pending Review';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'PROPOSAL_DRAFT':
        return 'Preparing Proposal';
      case 'AWAITING_CUSTOMER_CONFIRMATION':
        return 'Proposal Ready! Tap to Review';
      case 'ORDER_CREATED':
        return 'Order Placed';
      case 'CUSTOMER_REJECTED':
        return 'Proposal Declined';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        elevation: 1,
        backgroundColor: white,
        title: Text(
          "My Photo Orders",
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
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: primary,
        icon: const Icon(Icons.add_a_photo, color: white),
        label: Text(
          "New Request",
          style: GoogleFonts.poppins(color: white, fontWeight: FontWeight.w600),
        ),
        onPressed: () => Get.to(() => const PhotoOrderUploadScreen()),
      ),
      body: Obx(() {
        if (controller.isLoadingOrders.value) {
          return const Center(child: CircularProgressIndicator(color: primary));
        }

        if (controller.myPhotoOrders.isEmpty) {
          return RefreshIndicator(
            onRefresh: () => controller.fetchMyPhotoOrders(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: 70.h,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.photo_library_outlined, size: 70, color: Colors.grey.shade400),
                      SizedBox(height: 2.h),
                      Text(
                        "No Photo Orders Yet",
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          fontSize: 16.sp,
                          color: black,
                        ),
                      ),
                      SizedBox(height: 1.h),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10.w),
                        child: Text(
                          "Snap a photo of your shopping list or items to have our store team prepare your order!",
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(fontSize: 13.sp, color: Colors.grey[600]),
                        ),
                      ),
                      SizedBox(height: 3.h),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 1.2.h),
                        ),
                        onPressed: () => Get.to(() => const PhotoOrderUploadScreen()),
                        icon: const Icon(Icons.camera_alt, color: white),
                        label: Text(
                          "Upload First Photo",
                          style: GoogleFonts.poppins(color: white, fontWeight: FontWeight.w600),
                        ),
                      )
                    ],
                  ),
                ),
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => controller.fetchMyPhotoOrders(),
          child: ListView.separated(
            padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
            itemCount: controller.myPhotoOrders.length,
            separatorBuilder: (_, __) => SizedBox(height: 1.5.h),
            itemBuilder: (ctx, index) {
              final item = controller.myPhotoOrders[index];
              final statusColor = _getStatusColor(item.requestStatus);
              final isReady = item.requestStatus == 'AWAITING_CUSTOMER_CONFIRMATION';

              return InkWell(
                onTap: () {
                  Get.to(() => PhotoOrderProposalScreen(requestId: item.requestID ?? 0));
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: EdgeInsets.all(3.5.w),
                  decoration: BoxDecoration(
                    color: white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isReady ? primary.withOpacity(0.5) : Colors.grey.shade200,
                      width: isReady ? 1.5 : 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      )
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            item.requestCode ?? '',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700,
                              fontSize: 14.sp,
                              color: black,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _formatStatusLabel(item.requestStatus),
                              style: GoogleFonts.poppins(
                                fontSize: 11.5.sp,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (item.customerNotes != null && item.customerNotes!.isNotEmpty) ...[
                        SizedBox(height: 1.h),
                        Text(
                          item.customerNotes!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(fontSize: 12.sp, color: Colors.grey[700]),
                        ),
                      ],
                      SizedBox(height: 1.5.h),
                      const Divider(height: 1),
                      SizedBox(height: 1.h),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "${item.itemCount ?? 0} items prepared",
                            style: GoogleFonts.poppins(fontSize: 12.5.sp, color: Colors.grey[600]),
                          ),
                          Text(
                            (item.grandTotal != null && item.grandTotal! > 0)
                                ? "₹${item.grandTotal!.toStringAsFixed(2)}"
                                : "Price Pending",
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700,
                              fontSize: 14.sp,
                              color: (item.grandTotal != null && item.grandTotal! > 0) ? primary : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                      if (isReady) ...[
                        SizedBox(height: 1.5.h),
                        Container(
                          width: double.infinity,
                          padding: EdgeInsets.symmetric(vertical: 0.8.h),
                          decoration: BoxDecoration(
                            color: primary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            "Review Proposal & Confirm Order",
                            style: GoogleFonts.poppins(
                              color: white,
                              fontWeight: FontWeight.w600,
                              fontSize: 12.5.sp,
                            ),
                          ),
                        )
                      ]
                    ],
                  ),
                ),
              );
            },
          ),
        );
      }),
    );
  }
}
