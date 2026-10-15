// ignore_for_file: sort_child_properties_last
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

Widget ComboTilewidget({
  required BuildContext context,
  required String itemimage,
  required String item_name,
  required String combo,
  required String item_price,
  required String item_OriginalPrice,
  required String discount,
  required bool multipleProductVarients,
  void Function()? onTap,
  Widget? quantityContainer,
  required void Function() addBTN,
  required Function() onTapWidget,
}) {
  return InkWell(
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(0.5.h),
                color: bg1,
                border: Border.all(color: black.withOpacity(0.1), width: 1.5)),
            clipBehavior: Clip.antiAliasWithSaveLayer,
            padding: EdgeInsets.symmetric(vertical: 2.5.h),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: EdgeInsets.only(top: 1.h, left: 2.w, right: 2.w),
                  child: Row(
                    children: [
                      Padding(
                        padding: EdgeInsets.only(right: 4.w),
                        child: CustomNetworkImage(
                          url: itemimage,
                          width: 20.w,
                          height: 20.w,
                        ),
                      ),
                      Expanded(
                        flex: 10,
                        child: Stack(
                          alignment: Alignment.bottomRight,
                          clipBehavior: Clip.none,
                          children: [
                            Column(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                itemName(name: item_name),
                                SizedBox(
                                  height: 1.5.h,
                                ),
                                itemCombo(combo: combo),
                                SizedBox(
                                  height: 1.5.h,
                                ),
                                itemPrice(
                                    addBTN: addBTN,
                                    context: context,
                                    price: item_price,
                                    quantityContainer: quantityContainer,
                                    multipleProductVarients:
                                        multipleProductVarients,
                                    onTap: onTap,
                                    OriginalPrice: item_OriginalPrice),
                              ],
                            ),
                            Positioned(
                              bottom: -20,
                              child: quantityContainer ??
                                  buttonWidget(
                                      width: 1.7.w,
                                      height: 4.h,
                                      borderRadius: 0.5.h,
                                      onTap: addBTN,
                                      context: context,
                                      borderColor: primary,
                                      borderWidth: 1.5,
                                      buttonColor: white,
                                      textColor: primary,
                                      fontSize: 13,
                                      text: "Add"),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            top: 8,
            left: 8,
            child: double.parse(discount) > 0
                ? discountWidget(context: context, discount: discount)
                : Container(),
          )
        ],
      ),
      onTap: onTapWidget);
}

Widget discountWidget({required context, required discount}) {
  return Container(
    // width: 20.w,
    decoration: BoxDecoration(
        color: primary, borderRadius: BorderRadius.circular(0.5.h)),
    clipBehavior: Clip.antiAliasWithSaveLayer,
    padding: EdgeInsets.all(0.5.h),
    alignment: Alignment.center,
    child: Text("$discount% OFF",
        style: customTextstyle(
          fontSize: 13.sp,
          color: white,
          fontWeight: FontWeight.w700,
        )),
  );
}

// Widget itemImage({required context, required image}) {
//   return Expanded(
//     flex: 4,
//     child: Container(
//       padding: EdgeInsets.all(0.5.h),
//       alignment: Alignment.center,
//       child: CustomNetworkImage(
//         url: image,
//         width: 20.w,
//         height: 20.w,
//         // fit: BoxFit.,
//       ),
//     ),
//   );
// }

Widget itemName({required name}) {
  return Text("$name",
      style: customTextstyle(
        fontSize: 16.sp,
        color: tColor,
        fontWeight: FontWeight.w600,
      ));
}

Widget itemCombo({required combo}) {
  return Text("combo of $combo",
      style: customTextstyle(
        fontSize: 14.sp,
        color: tColor.withOpacity(0.75),
      ));
}

Widget itemPrice({
  required context,
  required price,
  required bool multipleProductVarients,
  required OriginalPrice,
  void Function()? onTap,
  Widget? quantityContainer,
  required void Function() addBTN,
}) {
  return Row(
    crossAxisAlignment: CrossAxisAlignment.center,
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Row(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          constantText(
              text: "${Constants.rupee}$price  ",
              textStyle: robotocustomTextstyle(
                fontSize: 18.sp,
                color: tColor,
                fontWeight: FontWeight.w600,
              ),
              children: [
                TextSpan(
                    text: "${Constants.rupee}$OriginalPrice",
                    style: robotocustomTextstyle(
                      fontSize: 14.sp,
                      color: tColor.withOpacity(0.5),
                      fontWeight: FontWeight.w600,
                      textDecoration: TextDecoration.lineThrough,
                    )),
              ]),
          multipleProductVarients
              ? GestureDetector(
                  onTap: onTap,
                  child: Icon(
                    Icons.expand_more,
                    size: 2.h,
                  ),
                )
              : Container()
        ],
      ),
    ],
  );
}
