// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Address/ManageAddress.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class UnsupportedLocationScreen extends StatelessWidget {
  final String? addressSummary;
  final double? distanceKm;
  final bool isFromCart;

  const UnsupportedLocationScreen({
    Key? key,
    this.addressSummary,
    this.distanceKm,
    this.isFromCart = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final HomeController homeController = Get.find<HomeController>();
    final displayAddress = addressSummary ??
        (homeController.selectedAddress.value.isNotEmpty &&
                homeController.selectedAddress.value != '...'
            ? homeController.selectedAddress.value
            : 'Selected delivery location');

    return WillPopScope(
      onWillPop: () async {
        Navigator.pop(context);
        return false;
      },
      child: Scaffold(
        backgroundColor: bg1,
        appBar: AppBar(
          backgroundColor: bg1,
          elevation: 0,
          leading: IconButton(
            padding: EdgeInsets.zero,
            onPressed: () {
              Navigator.pop(context);
            },
            icon: Image.asset(
              backbutton,
              height: 5.h,
              width: 10.w,
              fit: BoxFit.cover,
            ),
          ),
          centerTitle: true,
          title: Text(
            "Service Availability",
            style: customTextstyle(
              fontWeight: FontWeight.w600,
              fontSize: 18.sp,
              color: black,
            ),
          ),
        ),
        body: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                physics: BouncingScrollPhysics(),
                padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.h),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight - 4.h),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Column(
                        children: [
                          SizedBox(height: 2.h),
                          // Illustration using existing asset
                          Center(
                            child: Image.asset(
                              noserive,
                              width: 75.w,
                              height: 30.h,
                              fit: BoxFit.contain,
                            ),
                          ),
                          SizedBox(height: 3.h),

                          // Heading
                          Text(
                            "We don't serve your location yet",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              fontSize: 19.sp,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1E293B),
                              height: 1.3,
                            ),
                          ),
                          SizedBox(height: 1.5.h),

                          // Subtitle explanation
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 2.w),
                            child: Text(
                              "Sorry! ClikGett is not available at your selected address right now. We're working to expand our delivery service.",
                              textAlign: TextAlign.center,
                              style: GoogleFonts.poppins(
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w400,
                                color: Color(0xFF64748B),
                                height: 1.5,
                              ),
                            ),
                          ),
                          SizedBox(height: 3.h),

                          // Selected Address Card Summary
                          Container(
                            width: double.infinity,
                            padding: EdgeInsets.all(4.w),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: Color(0xFFE2E8F0),
                                width: 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 10,
                                  offset: Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Color(0xFFFFEBEE),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.location_off_rounded,
                                    color: Color(0xFFE53935),
                                    size: 20.sp,
                                  ),
                                ),
                                SizedBox(width: 3.w),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        "Selected Address",
                                        style: GoogleFonts.poppins(
                                          fontSize: 13.sp,
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF475569),
                                        ),
                                      ),
                                      SizedBox(height: 0.5.h),
                                      Text(
                                        displayAddress,
                                        maxLines: 3,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.poppins(
                                          fontSize: 14.sp,
                                          fontWeight: FontWeight.w500,
                                          color: Color(0xFF0F172A),
                                          height: 1.4,
                                        ),
                                      ),
                                      if (distanceKm != null && distanceKm! > 0) ...[
                                        SizedBox(height: 0.8.h),
                                        Container(
                                          padding: EdgeInsets.symmetric(
                                              horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: Color(0xFFF1F5F9),
                                            borderRadius:
                                                BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            "${distanceKm!.toStringAsFixed(1)} km away (Service radius: 20 km)",
                                            style: GoogleFonts.poppins(
                                              fontSize: 11.5.sp,
                                              color: Color(0xFF64748B),
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      // Actions
                      Padding(
                        padding: EdgeInsets.only(top: 3.h, bottom: 1.h),
                        child: Column(
                          children: [
                            // Change Location Button
                            buttonWidget(
                              context: context,
                              text: "Change Location",
                              buttonColor: Color(0xFF70B943),
                              textColor: Colors.white,
                              borderRadius: 12,
                              onTap: () async {
                                final picked = await Get.to(() => ManageAddress(
                                      isFromCartScreen: isFromCart,
                                    ));
                                // A new address was picked: go back to checkout with it.
                                if (picked != null && isFromCart) Get.back();
                              },
                            ),
                            SizedBox(height: 1.5.h),

                            // Back to Home Action
                            SizedBox(
                              width: double.infinity,
                              height: 48,
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide(
                                    color: Color(0xFFCBD5E1),
                                    width: 1.2,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  backgroundColor: Colors.white,
                                ),
                                onPressed: () {
                                  Get.offAll(() => Homepage());
                                },
                                child: Text(
                                  "Back to Home",
                                  style: GoogleFonts.poppins(
                                    fontSize: 15.sp,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF334155),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
