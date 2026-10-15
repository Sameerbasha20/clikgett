// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/kits_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/Cart.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../../Constants/empty_data.dart';
import '../../../../Constants/static_loader.dart';
import '../../../Widgets/customToast.dart';

class ComboDescription extends StatefulWidget {
  const ComboDescription({super.key, required this.kitId});
  final int kitId;
  @override
  State<ComboDescription> createState() => _ComboDescriptionState();
}

class _ComboDescriptionState extends State<ComboDescription> {
  ScrollController scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    cartController.getCart(context: context).then((value) async {
      await kitsController.getKitsDetailsById(
        context: context,
        kitId: widget.kitId,
      );
    });
  }

  @override
  void dispose() {
    kitsController.removeQuantity();
    super.dispose();
  }

  final KitsController kitsController = Get.find();
  final CartController cartController = Get.find();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Description",
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
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(3.w),
          physics: BouncingScrollPhysics(),
          child: Obx(
            () => kitsController.iskitDetailsLoading.isTrue
                ? CustomLoader()
                : kitsController.kitItems.isEmpty
                    ? EmptyDataWidget(message: 'No Product Details Found')
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: [
                          comboImageWidget(),
                          comboNameWidget(),
                          ComboWidget(),
                          ComboPriceWidget(),
                          descrptionWidget(),
                          combolistItemsWidget(),
                        ],
                      ),
          ),
        ),
      ),
      bottomNavigationBar: BottomAppBar(
          padding: EdgeInsets.zero,
          child: Obx(
            () => cartController.quantity.value != 0
                ? bottomQuantityViewer(
                    cartController: cartController, context: context)
                : SizedBox(
                    height: 0,
                    width: 0,
                  ),
          )),
    );
  }

  Widget comboImageWidget() {
    return Container(
      alignment: Alignment.center,
      padding: EdgeInsets.only(bottom: 1.h),
      child: CustomNetworkImage(
        url: kitsController.kitsDetailsModel?.kits?.imageUrl ?? '',
        width: 70.w,
        height: 22.h,
        fit: BoxFit.contain,
      ),
    );
  }

  Widget comboNameWidget() {
    return customText(
      text: kitsController.kitsDetailsModel?.kits?.kitName ?? '',
      fontSize: 21.sp,
      color: tColor,
      fontWeight: FontWeight.w600,
    );
  }

  Widget ComboWidget() {
    return Padding(
      padding: EdgeInsets.only(top: 1.h, bottom: 1.h),
      child: customText(
        text: "Combo of ${kitsController.kitsDetailsModel?.kits?.kitName}",
        fontSize: 17.sp,
        color: ordersPrimaryColor.withOpacity(0.75),
      ),
    );
  }

  Widget ComboPriceWidget() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        constantText(
            text:
                "${Constants.rupee}${kitsController.kitsDetailsModel?.kits?.offerPrice ?? ''}  ",
            textStyle: robotocustomTextstyle(
              fontSize: 20.sp,
              color: tColor2,
              fontWeight: FontWeight.w600,
            ),
            children: [
              TextSpan(
                  text:
                      "${Constants.rupee}${kitsController.kitsDetailsModel?.kits?.price ?? ''}",
                  style: robotocustomTextstyle(
                      fontSize: 18.sp,
                      color: tColor.withOpacity(0.5),
                      fontWeight: FontWeight.w600,
                      textDecoration: TextDecoration.lineThrough)),
            ]),
        button(),
      ],
    );
  }

  Widget descrptionWidget() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 2.h,
        ),
        Text(
          "Description",
          style: customTextstyle(
              fontSize: 19.sp, color: tColor4, fontWeight: FontWeight.w600),
        ),
        SizedBox(
          height: 0.5.h,
        ),
        customText(
          text: kitsController.kitsDetailsModel?.kits?.description ?? '',
          color: ordersPrimaryColor.withOpacity(.6),
          fontWeight: FontWeight.w500,
        ),
      ],
    );
  }

  Widget bottomBar() {
    return SizedBox(
      height: 5.h,
      width: 90.w,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            flex: 6,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                ImageIcon(
                  AssetImage(cart2),
                  color: primary,
                ),
                Text(
                  "${kitsController.kitItems.length} Items",
                  style: customTextstyle(
                      color: black,
                      fontSize: 18.sp,
                      fontWeight: FontWeight.w600),
                ),
                Icon(
                  Icons.circle,
                  color: primary,
                  size: 2.w,
                ),
                Text(
                    "${Constants.rupee}${kitsController.kitsDetailsModel?.kits?.price}",
                    style: robotocustomTextstyle(
                      fontSize: 18.sp,
                      color: primary,
                      fontWeight: FontWeight.w600,
                    )),
              ],
            ),
          ),
          Expanded(
            flex: 7,
            child: Container(
              alignment: Alignment.centerRight,
              child: buttonWidget(
                  width: 1.w,
                  height: 4.h,
                  borderRadius: 0.5.h,
                  fontSize: 16.sp,
                  onTap: () {
                    Navigator.of(context).push(MaterialPageRoute(
                        builder: (context) => Cart(
                              throughDescriptionScreen: true,
                            )));
                  },
                  context: context,
                  text: "View Cart"),
            ),
          ),
        ],
      ),
    );
  }

  Widget button() {
    return SizedBox(
        height: 4.h,
        child: kitsController.quantity.value == 0
            ? buttonWidget(
                width: 1.w,
                height: 4.h,
                borderRadius: 0.5.h,
                onTap: () {
                  quantityAdd(
                    addOrRemove: true,
                  );
                },
                context: context,
                borderColor: primary,
                buttonColor: white,
                textColor: primary,
                borderWidth: 1.5,
                text: "Add")
            : Container(
                decoration: BoxDecoration(
                    border: Border.all(color: primary),
                    borderRadius: BorderRadius.circular(0.5.h)),
                child: Row(
                  children: [
                    IconButton(
                        onPressed: () {
                          quantityAdd(
                            addOrRemove: false,
                            isToastRemove: true,
                          );
                        },
                        icon: Icon(
                          Icons.remove,
                          color: primary,
                          size: 2.h,
                        )),
                    Text(kitsController.quantity.value.toString(),
                        style: robotocustomTextstyle(
                          color: primary,
                          fontWeight: FontWeight.w600,
                        )),
                    IconButton(
                        onPressed: () {
                          quantityAdd(
                            addOrRemove: true,
                            isToastRemove: true,
                          );
                        },
                        icon: Icon(
                          Icons.add,
                          color: primary,
                          size: 2.h,
                        )),
                  ],
                ),
              ));
  }

  Widget combolistItemsWidget() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 6.h,
        ),
        customText(
          text:
              "${kitsController.kitsDetailsModel?.kits?.kitItems?.length} Items in the Combo",
          fontSize: 18.sp,
          color: tColor4,
          fontWeight: FontWeight.w600,
        ),
        SizedBox(
          height: 1.h,
        ),
        kitsController.kitsDetailsModel?.kits?.kitItems == null
            ? EmptyDataWidget(message: 'No Items Found')
            : ListView.builder(
                itemCount:
                    kitsController.kitsDetailsModel?.kits?.kitItems?.length,
                controller: scrollController,
                padding: EdgeInsets.only(top: 15),
                shrinkWrap: true,
                itemBuilder: (context, index) {
                  var kitItem =
                      kitsController.kitsDetailsModel?.kits?.kitItems?[index];
                  return listTile(
                      context: context,
                      itemimage: kitItem?.imageUrl ?? '',
                      item_name: kitItem?.productName ?? '',
                      weight: [
                        '${kitItem?.metricvalue} ${kitItem?.metrictype}'
                      ],
                      item_price:
                          kitItem?.offerPrice?.toStringAsFixed(2) ?? '0',
                      item_OriginalPrice:
                          kitItem?.price?.toStringAsFixed(2) ?? '0');
                },
              ),
      ],
    );
  }

  Widget listTile({
    required BuildContext context,
    required String itemimage,
    required String item_name,
    required List<String> weight,
    required String item_price,
    required String item_OriginalPrice,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: 2.h),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              itemImage(itemimage),
              Expanded(
                flex: 9,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    itemName(item_name),
                    SizedBox(
                      height: 0.5.h,
                    ),
                    itemWeightWidget(weight.first),
                    SizedBox(
                      height: 0.5.h,
                    ),
                    itemPrice(context, item_price, item_OriginalPrice),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget itemImage(itemimage) {
    return Expanded(
      flex: 3,
      child: Container(
        padding: EdgeInsets.all(1.h),
        alignment: Alignment.center,
        child: CustomNetworkImage(
          url: itemimage,
          height: 8.h,
          width: 17.w,
        ),
      ),
    );
  }

  Widget itemName(item_name) {
    return Text("$item_name",
        style: customTextstyle(
          fontSize: 15.sp,
          color: tColor,
          fontWeight: FontWeight.w600,
        ));
  }

  Widget itemWeightWidget(weight) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Text('1 X $weight',
          style: customTextstyle(
              fontSize: 14.sp, fontWeight: FontWeight.w500, color: black)),
    );
  }

  quantityAdd({
    required bool addOrRemove,
    bool isToastRemove = false,
    bool moveLoaderForDataUpdateOnParentWidget = true,
  }) {
    if (kitsController.quantity.value <
            kitsController.kitsDetailsModel!.kits!.availableQty! ||
        addOrRemove == false) {
      kitsController.quantityChange(addOrRemove);
      cartController
          .updateQuantity(
              isFromProductsScreen: true,
              kitId: kitsController.kitsDetailsModel?.kits?.kitId ?? 0,
              quantity: kitsController.quantity.value,
              removeToast: isToastRemove,
              isThroughDescriptionScreen: true,
              isFromComboScreen: true,
              context: context)
          .then((value) {
        if (value == false) {
          if (addOrRemove) {
            kitsController.quantityChange(false);
          } else {
            kitsController.quantityChange(true);
          }
        }
      });
    } else {
      customToast(message: 'Quantity max limit reached');
    }
  }

  Widget itemPrice(context, item_price, item_OriginalPrice) {
    return constantText(
        text: "${Constants.rupee}$item_price  ",
        textStyle: robotocustomTextstyle(
          fontSize: 17.sp,
          color: tColor2,
          fontWeight: FontWeight.w600,
        ),
        children: [
          TextSpan(
              text: "${Constants.rupee}$item_OriginalPrice",
              style: robotocustomTextstyle(
                  fontSize: 14.sp,
                  color: tColor.withOpacity(0.5),
                  fontWeight: FontWeight.w600,
                  textDecoration: TextDecoration.lineThrough)),
        ]);
  }
}
