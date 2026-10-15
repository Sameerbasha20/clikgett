// ignore_for_file: sort_child_properties_last, prefer_const_constructors
import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

Widget CartTileWidget({
  required BuildContext context,
  required bool isCombo,
  required String combo,
  required List<String> itemimage,
  required String item_name,
  required List<String> weight,
  required String item_price,
  required String item_OriginalPrice,
  required String discount,
  required String quantity,
  void Function()? increment,
  void Function()? decrement,
  bool isMultipleVarients = false,
  void Function()? onproductTap,
  void Function()? varientsTap,
  required Function() onTapRemoveItem,
}) {
  return Padding(
    padding: EdgeInsets.only(top: 1.h),
    child: GestureDetector(
      onTap: onproductTap,
      child: Container(
        // decoration: BoxDecoration(
        //     borderRadius: BorderRadius.circular(0.5.h),
        //     color: bg1,
        //     border: Border.all(color: bg1, width: 1.5)),
        // clipBehavior: Clip.antiAliasWithSaveLayer,
        padding: EdgeInsets.symmetric(vertical: 2.h, horizontal: 2.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // itemImage(
                //   context: context,
                //   image: itemimage,
                // ),
                // ItemImages(
                //   productImages:itemimage,
                // ),
                Padding(
                  padding: const EdgeInsets.only(right: 10),
                  // child: itemImage(context: context, image: itemimage),
                  child: itemImage(context: context, images: itemimage),
                ),
                Expanded(
                  // flex: 9,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(child: itemName(name: item_name)),
                          // removeItem(onTapremoveItem: onTapRemoveItem),
                        ],
                      ),
                      SizedBox(
                        height: 0.5.h,
                      ),
                      // isCombo
                      //     ? itemCombo(combo: combo)
                      //     : itemWeight(
                      //         isMultipleVarients: isMultipleVarients,
                      //         weight: weight,
                      //         onTapWeight: varientsTap),
                      SizedBox(
                        height: 0.5.h,
                      ),
                      itemPrice(
                          context: context,
                          price: item_price,
                          quantity: quantity,
                          decrement: decrement,
                          increment: increment,
                          OriginalPrice: item_OriginalPrice),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}

Widget itemImage(
    {required BuildContext context, required List<String> images}) {
  if (images.isEmpty) {
    return Image.asset(
      // Fallback placeholder image
      deletecartIcon,
      width: 25.w,

      height: 15.h,
    );
  }

  // Create a PageController
  final PageController pageController = PageController();
  // Keep track of the current page index
  final RxInt currentPage = 0.obs;

  return Column(
    children: [
      SizedBox(
        height: 8.h, // Adjust height as needed
        width: 30.w,
        child: PageView.builder(
          controller: pageController,
          itemCount: images.length,
          onPageChanged: (index) {
            currentPage.value = index; // Update the current page index
          },
          itemBuilder: (context, index) {
            // return Image.network(
            //   images[index],
            //   // width: 25.w, // Adjust width as needed
            //   // height: 15.h, // Adjust height as needed
            //   // fit: BoxFit.contain,
            // );
            return CustomNetworkImage(
              url: images[index],
              height: 15.h,
              width: 25.w,
              fit: BoxFit.contain,
            );
            //   CachedNetworkImage(
            //   imageUrl: images[index],
            //   width: 25.w, // Adjust width as needed
            //   height: 15.h, // Adjust height as needed
            //   fit: BoxFit.contain,
            //   // placeholder: (context, url) => CircularProgressIndicator(),
            //   errorWidget: (context, url, error) => Icon(Icons.error),
            // );
          },
        ),
      ),
      if (images.length > 1)
        Obx(() => Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(images.length, (index) {
                return Container(
                  margin: const EdgeInsets.symmetric(
                      horizontal: 4), // Space between dots
                  width: currentPage.value == index
                      ? 6
                      : 6, // Active dot size vs inactive
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: currentPage.value == index
                        ? primary
                        : Colors.grey, // Active dot color vs inactive
                  ),
                );
              }),
            )),
    ],
  );
}

Widget itemImages(
    {required BuildContext context, required List<String> images}) {
  print("listimages: $images");

  return images.isNotEmpty
      ? SizedBox(
          height: 15.h, // Adjust height as needed
          child: Column(
            children: [
              PageView.builder(
                itemCount: images.length,
                itemBuilder: (context, index) {
                  return CachedNetworkImage(
                    imageUrl: images[index],
                    width: 25.w, // Adjust width as needed
                    height: 15.h, // Adjust height as needed
                    fit: BoxFit.contain,
                    placeholder: (context, url) => CircularProgressIndicator(),
                    errorWidget: (context, url, error) => Icon(Icons.error),
                  );

                  // return Image.network(
                  //   images[index],
                  //   width: 25.w,  // Adjust width as needed
                  //   height: 15.h, // Adjust height as needed
                  //   fit: BoxFit.contain,
                  // );
                },
              ),
            ],
          ),
        )
      : Image.asset(
          'Assets/Images/fav_App_accounttab.png', // Fallback placeholder image
          width: 25.w,
          height: 15.h,
        );
}

class ItemImages extends StatefulWidget {
  final List<String> productImages;

  const ItemImages({Key? key, required this.productImages}) : super(key: key);

  @override
  _ItemImagesState createState() => _ItemImagesState();
}

class _ItemImagesState extends State<ItemImages> {
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
    return Container(
      width: 25.w,
      height: 10.h, // Specify height explicitly
      alignment: Alignment.center,
      child: widget.productImages.isNotEmpty
          ? Stack(
              alignment: Alignment.center,
              children: [
                PageView.builder(
                  controller: _pageController,
                  itemCount: widget.productImages.length,
                  onPageChanged: _onPageChanged,
                  itemBuilder: (context, index) {
                    return Container(
                      alignment: Alignment.center,
                      padding: const EdgeInsets.all(4.0),
                      child: Image.network(
                        widget.productImages[index],
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return const Text('Image Load Error');
                        },
                      ),
                    );
                  },
                ),
                if (widget.productImages.length > 1)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Row(
                      children: List.generate(
                        widget.productImages.length,
                        (index) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4.0),
                          width: 8.0,
                          height: 8.0,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _currentPage == index
                                ? Colors.blue
                                : Colors.grey,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            )
          : const Center(
              child: Text('No Images Available'),
            ),
    );
  }
}

Widget removeItem({required onTapremoveItem}) {
  return InkWell(
    child: ImageIcon(
      AssetImage(close2),
      color: black,
      size: 16.sp,
    ),
    onTap: onTapremoveItem,
  );
}
//
// Widget itemImage({required context, required image}) {
//   return Container(
//     alignment: Alignment.center,
//     margin: EdgeInsets.only(right: 15),
//     child: CustomNetworkImage(
//       url: image,
//       width: 25.w,
//       height: 8.h,
//       fit: BoxFit.contain,
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

Widget itemWeight(
    {required weight, required onTapWeight, bool isMultipleVarients = false}) {
  return isMultipleVarients == true
      ? FittedBox(
          child: InkWell(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text("${weight.first}",
                    style: customTextstyle(
                      fontSize: 14.sp,
                      color: ordersPrimaryColor.withOpacity(.6),
                      fontWeight: FontWeight.w600,
                    )),
                Icon(
                  Icons.keyboard_arrow_down,
                  size: 2.h,
                  color: green,
                ),
              ],
            ),
            onTap: onTapWeight,
          ),
        )
      : Text("${weight.first}",
          style: customTextstyle(
            fontSize: 14.sp,
            color: ordersPrimaryColor.withOpacity(.6),
            fontWeight: FontWeight.w600,
          ));
}

Widget itemCombo({required combo}) {
  return Text("combo of $combo",
      style: customTextstyle(
        fontSize: 14.sp,
        color: ordersPrimaryColor.withOpacity(0.75),
      ));
}

Widget itemPrice({
  required context,
  required price,
  required OriginalPrice,
  required String quantity,
  void Function()? increment,
  void Function()? decrement,
}) {
  return Row(
    crossAxisAlignment: CrossAxisAlignment.center,
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Flexible(
        child: constantText(
          text: "${Constants.rupee}$price  ",
          textStyle: robotocustomTextstyle(
            fontSize: 16.sp,
            color: Color(0xff707070),
            fontWeight: FontWeight.w600,
          ),
          // children: [
          //   TextSpan(
          //       text: "${Constants.rupee}$OriginalPrice",
          //       style: robotocustomTextstyle(
          //           fontSize: 14.sp,
          //           color: tColor.withOpacity(0.5),
          //           fontWeight: FontWeight.w600,
          //           textDecoration: TextDecoration.lineThrough)),
          // ]
        ),
      ),
      Container(
        decoration: BoxDecoration(
            border: Border.all(color: Color(0xffF5F5F5)),
            color: Color(0xffF5F5F5),
            borderRadius: BorderRadius.circular(1.9.h)),
        child: Row(
          children: [
            InkWell(
              onTap: decrement,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 7),
                child: Icon(
                  Icons.remove,
                  color: Color(0xff030401),
                  size: 3.h,
                ),
              ),
            ),
            Text(quantity,
                style: robotocustomTextstyle(
                  color: Color(0xff030401),
                  fontWeight: FontWeight.w600,
                )),
            InkWell(
              onTap: increment,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 7),
                child: Icon(
                  Icons.add,
                  color: Color(0xff030401),
                  size: 3.h,
                ),
              ),
            )
          ],
        ),
      )
    ],
  );
}
