// ignore_for_file: prefer_const_constructors
import 'package:coupon_uikit/coupon_uikit.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import '../../../old/Models/Orders/promocode_model.dart';
import '../../Constants/empty_data.dart';
import '../../Constants/static_loader.dart';
import '../../Controllers/cart_controller.dart';
import '../Widgets/customToast.dart';

class Offers extends StatefulWidget {
  final bool hideCopyIcon;

  String? subtotal, tip; // Add a parameter to control the IconButton visibility
  Offers({Key? key, this.hideCopyIcon = false, this.subtotal, this.tip})
      : super(key: key); // Default is false

  @override
  State<Offers> createState() => _OffersState();
}

class _OffersState extends State<Offers> {
  @override
  void initState() {
    super.initState();
    cartController.getCoupons(context: context);
  }

  final CartController cartController = Get.find();

  final TextEditingController _couponController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text(
            "Offers",
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
            ),
          ),
          surfaceTintColor: bg,
        ),
        backgroundColor: Color(0xFFFBFBFB),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8.0),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade400),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _couponController,
                        decoration: const InputDecoration(
                          hintText: "Enter secret coupon",
                          border: InputBorder.none,
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                        backgroundColor: Appprimary,
                      ),
                      onPressed: () {
                        final coupon = _couponController.text.trim();
                        if (coupon.isNotEmpty) {
                          Map<String, dynamic> body = <String, dynamic>{};
                          body['PromoCode'] = _couponController.text.trim();
                          body['TipAmount'] = widget.tip;

                          body['SubTotal'] = widget.subtotal;
                          // double.parse(controller.ammount.value);

                          // print("===========?" +controller.ammount.value );

                          cartController.validatePromo(
                              context: context, body: body);

                          // widget.onApply?.call(coupon);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text("Please enter a coupon")),
                          );
                        }
                      },
                      child: const Text(
                        "Apply",
                        style: TextStyle(
                            color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(
              height: 5,
            ),
            Expanded(
              child: Obx(
                () => cartController.isPromoCodesLoading.isTrue
                    ? CustomLoader()
                    : cartController.promocodeList.isEmpty
                        ? EmptyDataWidget(message: 'No Coupons Found')
                        : ListView.separated(
                            itemCount: cartController.promocodeList.length,
                            physics: BouncingScrollPhysics(),
                            itemBuilder: (context, index) {
                              var coupon = cartController.promocodeList[index];
                              return couponTile(coupon);
                            },
                            separatorBuilder:
                                (BuildContext context, int index) {
                              return SizedBox(
                                height: 5,
                              );
                            },
                          ),
              ),
            ),
          ],
        ));
  }

  Widget couponTile(PromoCode coupon) {
    const Color primaryColor = Color(0xfff1e3d3);
    const Color secondaryColor = Color(0xffd88c9a);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 3),
      child: CouponCard(
        // height: 120,
        backgroundColor: const Color.fromARGB(255, 229, 255, 241),
        curveAxis: Axis.vertical,
        curveRadius: 30.0,
        firstChild: Container(
          decoration: const BoxDecoration(
            color: Appprimary,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      customText(
                        text: coupon.type == 1
                            ? "${coupon.offerValue?.toStringAsFixed(0)}%"
                            : '₹${coupon.offerValue?.toStringAsFixed(0)}',

                        // '23%',

                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                      customText(
                        text: 'OFF',
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ],
                  ),
                ),
              ),
              // Divider(color: Colors.white54, height: 0),
              // Expanded(
              //   child: Center(
              //     child: Text(
              //       'WINTER IS\nHERE',
              //       textAlign: TextAlign.center,
              //       style: TextStyle(
              //         color: Colors.white,
              //         fontSize: 12,
              //         fontWeight: FontWeight.bold,
              //       ),
              //     ),
              //   ),
              // ),
            ],
          ),
        ),
        secondChild: Container(
          width: double.maxFinite,
          padding: const EdgeInsets.symmetric(horizontal: 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Coupon Code',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Colors.black54,
                ),
              ),
              // SizedBox(height: 4),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${coupon.promoCode}',
                      textAlign: TextAlign.start,
                      style: TextStyle(
                        fontSize: 24,
                        color: Appprimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  if (!widget.hideCopyIcon)
                    GestureDetector(
                        onTap: () {
                          Map<String, dynamic> body = <String, dynamic>{};
                          body['PromoCode'] = coupon.promoCode;
                          body['TipAmount'] = widget.tip;

                          body['SubTotal'] = widget.subtotal;
                          // double.parse(controller.ammount.value);

                          // print("===========?" +controller.ammount.value );

                          cartController.validatePromo(
                              context: context, body: body);

                          // Future.delayed(Duration(milliseconds: 300));
                          // Navigator.pop(context);
                        },
                        child: customText(
                          text: "Apply",
                          fontSize: 0.17.sp,
                          color: Appprimary,
                          fontWeight: FontWeight.w600,
                        )
                        // IconButton(
                        //     onPressed: () async {
                        //       Clipboard.setData(
                        //               ClipboardData(text: coupon.promoCode ?? ''))
                        //           .then((value) {
                        //         customToast(
                        //             message: '${coupon.promoCode} Copied');

                        //         // Pass the selected coupon code back to the cart page
                        //         Navigator.of(context).pop(coupon.promoCode);
                        //       });
                        //     },
                        //     icon: ImageIcon(
                        //       AssetImage(copy),
                        //       size: 3.h,
                        //       color: primary,
                        //     )),
                        ),
                ],
              ),
              // SizedBox(height: 1.h),
              // Spacer(),
              customText(
                text: coupon.description!.replaceAll("\n", ""),
                textAlign: TextAlign.start,
                fontSize: 11,
                color: Colors.black45,
              ),
            ],
          ),
        ),
      ),
    );
    // CouponCard(firstChild: Container() secondChild: null,);
    // Container(
    //   margin: EdgeInsets.symmetric(horizontal: 3.5.w),
    //   width: double.infinity,
    //   decoration: BoxDecoration(
    //       image:
    //           DecorationImage(image: AssetImage(offerBg), fit: BoxFit.cover)),
    //   clipBehavior: Clip.antiAliasWithSaveLayer,
    //   alignment: Alignment.center,
    //   child: Padding(
    //     padding: EdgeInsets.only(left: 7.w, right: 5.w, top: 1.h, bottom: 1.h),
    //     child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    //       Row(
    //         children: [
    //           ImageIcon(
    //             AssetImage(offerIcon),
    //             color: primary,
    //           ),
    //           SizedBox(
    //             width: 2.w,
    //           ),
    //           Text(
    // coupon.type == 1
    //     ? "${coupon.offerValue?.toStringAsFixed(0)}%  OFF"
    // : '${coupon.offerValue?.toStringAsFixed(0)} RS OFF',
    //             style: customTextstyle(
    //                 color: primary,
    //                 fontSize: 18.sp,
    //                 fontWeight: FontWeight.w600),
    //           ),
    //         ],
    //       ),
    //       Padding(
    //         padding: EdgeInsets.symmetric(vertical: 2.h),
    //         child: customText(
    //           text: coupon.description ?? '',
    //         ),
    //       ),
    //       Row(
    //         mainAxisAlignment: MainAxisAlignment.spaceBetween,
    //         children: [
    //           Container(
    //             width: 35.w,
    //             height: 7.h,
    //             alignment: Alignment.center,
    //             decoration: BoxDecoration(
    //                 image: DecorationImage(image: AssetImage(couponCodebg))),
    //             clipBehavior: Clip.antiAliasWithSaveLayer,
    //             padding: EdgeInsets.all(1.h),
    //             child: FittedBox(
    //               child: Text(coupon.promoCode ?? '',
    //                   style: segoecustomTextstyle(
    //                     fontSize: 18.sp,
    //                     fontWeight: FontWeight.w700,
    //                     color: black,
    //                   )),
    //             ),
    //           ),
    //           // Conditional check to show or hide the IconButton
    // if (!widget.hideCopyIcon)
    //   GestureDetector(
    //     child: IconButton(
    //         onPressed: () async {
    //           Clipboard.setData(
    //                   ClipboardData(text: coupon.promoCode ?? ''))
    //               .then((value) {
    //             customToast(message: '${coupon.promoCode} Copied');

    //             // Pass the selected coupon code back to the cart page
    //             Navigator.of(context).pop(coupon.promoCode);
    //           });
    //         },
    //         icon: ImageIcon(
    //           AssetImage(copy),
    //           size: 3.h,
    //           color: primary,
    //         )),
    //   ),
    //         ],
    //       )
    //     ]),
    //   ),
    // );
  }
}
