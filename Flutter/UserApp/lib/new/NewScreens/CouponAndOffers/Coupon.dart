// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/empty_data.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Services/common/CommonFunctions.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import '../../../old/Models/Orders/promocode_model.dart';

class Coupon extends StatefulWidget {
  const Coupon({super.key});

  @override
  State<Coupon> createState() => _CouponState();
}

class _CouponState extends State<Coupon> {
  @override
  void initState() {
    super.initState();
    cartController.getCoupons(context: context);
  }

  final CartController cartController = Get.find();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text(
            "Apply Coupon",
            style: customTextstyle(fontWeight: FontWeight.w600, fontSize: 20),
          ),
          leading: IconButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                Navigator.of(context).pop();
              },
              icon: Image.asset(
                backbutton,
                height: 5.h,
                width: 10.w,
                fit: BoxFit.cover,
              )),
        ),
        backgroundColor: bg,
        body: Obx(
          () => cartController.isPromoCodesLoading.isTrue
              ? CustomLoader()
              : cartController.promocodeList.isEmpty
                  ? EmptyDataWidget(message: 'No Coupons Found')
                  : ListView.builder(
                      itemCount: cartController.promocodeList.length,
                      physics: BouncingScrollPhysics(),
                      itemBuilder: (context, index) {
                        var coupon = cartController.promocodeList[index];
                        return couponTile(coupon);
                      },
                    ),
        ));
  }

  Widget couponTile(PromoCode coupon) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 3.5.w),
      width: double.infinity,
      decoration: BoxDecoration(
          image: DecorationImage(
        image: AssetImage(couponbg),
      )),
      padding: EdgeInsets.all(5.w),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      alignment: Alignment.center,
      child: Padding(
        padding: EdgeInsets.only(left: 5.w, right: 5.w, top: 1.h, bottom: 1.h),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(
            children: [
              ImageIcon(
                AssetImage(offerIcon),
                color: primary,
              ),
              SizedBox(
                width: 2.w,
              ),
              Text(
                coupon.type == 1
                    ? "${coupon.offerValue?.toStringAsFixed(0)}%  OFF"
                    : '${coupon.offerValue?.toStringAsFixed(0)} RS OFF',
                style: customTextstyle(
                    color: primary,
                    fontSize: 21.sp,
                    fontWeight: FontWeight.w600),
              ),
            ],
          ),
          Padding(
            padding: EdgeInsets.symmetric(vertical: 1.h),
            child: customText(
              text: coupon.description ?? '',
            ),
          ),
          Builder(builder: (context) {
            final cartVal = double.tryParse(cartController.ammount.value) ?? 0.0;
            final minOrder = coupon.minOrderValue ?? 0.0;
            final isLocked = minOrder > 0 && cartVal < minOrder;
            final needed = (minOrder - cartVal).toStringAsFixed(0);

            return Container(
              margin: EdgeInsets.only(bottom: 1.5.h),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isLocked ? Colors.orange.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                children: [
                  Icon(
                    isLocked ? Icons.lock_clock_outlined : Icons.check_circle_outline_rounded,
                    size: 16,
                    color: isLocked ? Colors.deepOrange : Colors.green,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      isLocked
                          ? "Add ${Constants.rupee}$needed more to unlock this coupon"
                          : "Coupon Unlocked! Ready to apply",
                      style: customTextstyle(
                        fontSize: 13.sp,
                        color: isLocked ? Colors.deepOrange : Colors.green[800],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 35.w,
                height: 7.h,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                    image: DecorationImage(image: AssetImage(couponCodebg))),
                clipBehavior: Clip.antiAliasWithSaveLayer,
                padding: EdgeInsets.all(1.h),
                child: FittedBox(
                  child: Text(coupon.promoCode ?? '',
                      style: segoecustomTextstyle(
                        fontSize: 18.sp,
                        fontWeight: FontWeight.w700,
                        color: black,
                      )),
                ),
              ),
              Builder(builder: (context) {
                final cartVal = double.tryParse(cartController.ammount.value) ?? 0.0;
                final minOrder = coupon.minOrderValue ?? 0.0;
                final isLocked = minOrder > 0 && cartVal < minOrder;

                return GestureDetector(
                  child: TextButton(
                      onPressed: () async {
                        if (isLocked) {
                          final needed = (minOrder - cartVal).toStringAsFixed(0);
                          customToast(message: "Add ${Constants.rupee}$needed more to unlock this coupon");
                          return;
                        }
                        CommonFunctions.copyText(
                                text: coupon.promoCode, applied: true)
                            .then((value) {
                          Map<String, dynamic> body = <String, dynamic>{};
                          body['PromoCode'] = coupon.promoCode;
                          body['SubTotal'] = double.parse(
                              Get.find<CartController>().ammount.value);
                          cartController.validatePromo(
                              isFromCouponscreen: true,
                              context: context,
                              body: body);
                        });
                      },
                      child: Text(
                        "Apply",
                        style: customTextstyle(
                            fontSize: 18.sp,
                            fontWeight: FontWeight.w700,
                            color: isLocked ? Colors.grey : tColor2),
                      )),
                );
              })
            ],
          )
        ]),
      ),
    );
  }
}
