// ignore_for_file: sort_child_properties_last, unnecessary_null_in_if_null_operators
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';

import '../../../Constants/colors.dart';

Widget ItemTile({
  required BuildContext context,
  required String itemimage,
  required String item_name,
  required List<String> weight,
  required String item_price,
  required String item_OriginalPrice,
  required double discount,
  required Function()? onTap,
  required Function()? variantsTap,
  bool isMultipleVarients = false,
  double? width,
  double? height,
}) {
  return InkWell(
    child: Container(
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(0.4.h),
          color: white,
          border: Border.all(color: black.withOpacity(0.1), width: 2)),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      padding: EdgeInsets.all(0.5.h),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          discountWidget(context: context, discount: discount),
          itemImage(context: context, image: itemimage),
          itemName(name: item_name),
          itemWeight(
              weight: weight,
              onTap: variantsTap,
              isMultipleVarients: isMultipleVarients),
          itemPrice(
              onDecription: onTap!,
              onTap: () {},
              context: context,
              price: item_price,
              OriginalPrice: item_OriginalPrice),
        ],
      ),
    ),
    onTap: onTap,
  );
}

Widget discountWidget({required context, required double discount}) {
  return discount > 0
      ? Container(
          width: 18.w,
          decoration: BoxDecoration(
              color: primary, borderRadius: BorderRadius.circular(0.5.h)),
          clipBehavior: Clip.antiAliasWithSaveLayer,
          padding: EdgeInsets.all(0.5.h),
          alignment: Alignment.center,
          child: Text("${discount.round()}% OFF",
              style: customTextstyle(
                fontSize: 13.sp,
                color: white,
                fontWeight: FontWeight.w700,
              )),
        )
      : Container();
}

class itemImages extends StatefulWidget {
  final List<String> productImages;

  const itemImages({Key? key, required this.productImages}) : super(key: key);

  @override
  _ItemImagesState createState() => _ItemImagesState();
}

class _ItemImagesState extends State<itemImages> {
  late PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentPage = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: 7,
      child: Container(
        alignment: Alignment.center,
        child: widget.productImages.isNotEmpty
            // ?
            // Container(
            //         alignment: Alignment.center,
            //         padding: const EdgeInsets.all(4.0),
            //         child: CustomNetworkImage(
            //           url: widget.productImages[0],
            //           fit: BoxFit.contain,
            //           width: 25.w,
            //           height: 20.h,
            //         ),
            //       )
            ? Stack(
                alignment: Alignment.center, // Center all child widgets
                children: [
                  PageView.builder(
                    controller: _pageController,
                    itemCount: widget.productImages.length,
                    onPageChanged:
                        _onPageChanged, // Track the current page index
                    itemBuilder: (context, index) {
                      return Container(
                        alignment: Alignment.center,
                        padding: const EdgeInsets.all(4.0),
                        child: CustomNetworkImage(
                          url: widget.productImages[index],
                          fit: BoxFit.contain,
                          width: 25.w,
                          height: 20.h,
                        ),
                      );
                    },
                  ),
                  // Dots indicator positioned above and right
                  if (widget.productImages.length > 1)
                    Positioned(
                      top: 0, // Adjust vertical position (above the image)
                      right: 10, // Align dots to the right side
                      child: Row(
                        mainAxisSize:
                            MainAxisSize.min, // Let the Row take minimal width
                        mainAxisAlignment:
                            MainAxisAlignment.end, // Align dots to the right
                        children: List.generate(
                          widget.productImages.length,
                          (index) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4.0),
                            width: 6.0, // Set a fixed width for all dots
                            height: 6.0, // Set a fixed height for all dots
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _currentPage == index
                                  ? primary
                                  : Colors
                                      .grey, // Change the color based on the selected page
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              )
            : Container(
                alignment: Alignment.center,
                child: Text(
                    'No Images Available'), // Placeholder when no images are available
              ),
      ),
    );
  }
}

Widget itemImage({required context, required String image}) {
  return Expanded(
    flex: 9,
    child: Container(
      padding: EdgeInsets.all(0.5.h),
      alignment: Alignment.center,
      child: CustomNetworkImage(
        url: image,
        width: 20.w,
        height: 20.h,
        fit: BoxFit.contain, // Ensures the image fits inside the circle

        // fit: BoxFit.contain,
      ),
    ),
  );
}

Widget itemName({required String name}) {
  return Expanded(
    flex: 3,
    child: Padding(
      padding: const EdgeInsets.only(left: 3),
      child: customText(
        text: name,
        fontSize: 16.sp,
        maxLines: 2, // Allow text to span over 2 lines
        color: tColor,
        fontWeight: FontWeight.w600,
        overflow: TextOverflow
            .ellipsis, // This will show an ellipsis if the text overflows after 2 lines
      ),
    ),
  );
}

Widget itemWeight(
    {required weight,
    bool isMultipleVarients = false,
    void Function()? onTap}) {
  return Expanded(
    flex: 2,
    child: isMultipleVarients
        ? GestureDetector(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.only(left: 3),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text("${weight.first}",
                      style: customTextstyle(
                        fontSize: 13.sp,
                        color: tColor2,
                        fontWeight: FontWeight.w600,
                      )),
                  Icon(
                    Icons.keyboard_arrow_down,
                    color: green,
                    size: 2.h,
                  )
                ],
              ),
            ),
          )
        : Container(
            padding: const EdgeInsets.only(left: 3),
            alignment: Alignment.centerLeft,
            child: Text(
              "${weight.first}",
              style: customTextstyle(
                fontSize: 13.sp,
                color: tColor.withOpacity(0.7),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
  );
}

Widget itemPrice({
  required context,
  required price,
  required OriginalPrice,
  required void Function() onTap,
  required void Function() onDecription,
}) {
  return Expanded(
    flex: 5,
    child: Padding(
      padding: const EdgeInsets.only(left: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("${Constants.rupee}$price  ",
                    style: robotocustomTextstyle(
                      fontSize: 16.sp,
                      color: tColor,
                      fontWeight: FontWeight.w600,
                    )),
                Text("${Constants.rupee}$OriginalPrice",
                    style: robotocustomTextstyle(
                        fontSize: 13.sp,
                        color: tColor.withOpacity(0.5),
                        fontWeight: FontWeight.w600,
                        textDecoration: TextDecoration.lineThrough)),
              ],
            ),
          ),
          // FittedBox(
          //   child: buttonWidget(
          //     width: 3.w,
          //     height: 4.h,
          //     borderRadius: 0.5.h,
          //     onTap: onTap,
          //     context: context,
          //     borderColor: primary,
          //     buttonColor: primary, // Set the desired background color here
          //     borderWidth: 1.5,
          //     textColor: Colors.white,
          //     text: "Add",
          //   ),
          // ),
        ],
      ),
    ),
  );
}
