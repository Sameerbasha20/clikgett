// ignore_for_file: sort_child_properties_last, non_constant_identifier_names
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/material.dart';
import 'package:get/get_rx/src/rx_types/rx_types.dart';
import 'package:get/get_state_manager/src/rx_flutter/rx_obx_widget.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/new/Constants/stock_helper.dart';

Widget ItemHorizontalTile({
  required BuildContext context,
  required String itemimage,
  required String item_name,
  required List<String> weight,
  required String item_price,
  required String item_OriginalPrice,
  required int quantity,
  required String discount,
  bool isMultipleVarients = false,
  required Function() onTapWeight,
  required Function() onTapImage,
  void Function()? increment,
  void Function()? decrement,
  required void Function() onTap,
  required List<String> item_images,
  int? maxquantity,
  int? availableQty,
}) {
  final bool isOutOfStock =
      (maxquantity == 0 || (availableQty != null && availableQty <= 0));
  final double discountVal = double.tryParse(discount) ?? 0;

  return Material(
    color: Colors.transparent,
    child: InkWell(
      onTap: onTapImage,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: white,
          border: Border.all(color: cardBorder, width: 1),
          boxShadow: softCardShadow,
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(10.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Product Image
                  GestureDetector(
                    onTap: onTapImage,
                    child: Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: itemImage(context: context, images: item_images),
                    ),
                  ),

                  // Product Details
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        itemName(name: item_name),
                        const SizedBox(height: 4),
                        itemWeight(
                          weight: weight,
                          onTapWeight: onTapWeight,
                          isMultipleVarients: isMultipleVarients,
                        ),
                        const SizedBox(height: 8),
                        itemPrice(
                          maxquantity: maxquantity,
                          availableQty: availableQty,
                          onTap: onTap,
                          context: context,
                          quantity: quantity,
                          decrement: decrement,
                          increment: increment,
                          price: item_price,
                          OriginalPrice: item_OriginalPrice,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Top-left Discount Badge
            if (discountVal > 0)
              Positioned(
                top: 0,
                left: 0,
                child: discountWidget(
                  context: context,
                  discount: discountVal,
                ),
              ),

            // Out of stock overlay banner (subtle, non-destructive)
            if (isOutOfStock)
              Positioned(
                bottom: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: redLight,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: red.withOpacity(0.3), width: 1),
                  ),
                  child: Text(
                    'Out of Stock',
                    style: customTextstyle(
                      textDecoration: TextDecoration.none,
                      fontSize: 11.sp,
                      color: red,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    ),
  );
}

Widget discountWidget({required context, required double discount}) {
  if (discount <= 0) return const SizedBox.shrink();
  return Container(
    decoration: const BoxDecoration(
      color: primary,
      borderRadius: BorderRadius.only(
        topLeft: Radius.circular(13),
        bottomRight: Radius.circular(10),
      ),
    ),
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    alignment: Alignment.center,
    child: Text(
      "${discount.round()}% OFF",
      style: customTextstyle(
        fontSize: 11.5.sp,
        color: white,
        fontWeight: FontWeight.w700,
      ),
    ),
  );
}

Widget itemImage({
  required BuildContext context,
  required List<String> images,
}) {
  if (images.isEmpty) {
    return Container(
      width: 26.w,
      height: 12.h,
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Center(
        child: Image.asset(
          'Assets/Images/fav_App_accounttab.png',
          width: 40,
          height: 40,
          color: Colors.grey.shade400,
        ),
      ),
    );
  }

  if (images.length == 1) {
    return Container(
      width: 26.w,
      height: 12.h,
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.all(6),
      child: CustomNetworkImage(
        url: images[0],
        fit: BoxFit.contain,
        width: 24.w,
        height: 11.h,
      ),
    );
  }

  final PageController pageController = PageController();
  final RxInt currentPage = 0.obs;

  return SizedBox(
    width: 26.w,
    height: 13.h,
    child: Column(
      children: [
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
            ),
            padding: const EdgeInsets.all(6),
            child: PageView.builder(
              controller: pageController,
              itemCount: images.length,
              onPageChanged: (index) {
                currentPage.value = index;
              },
              itemBuilder: (context, index) {
                return CustomNetworkImage(
                  url: images[index],
                  fit: BoxFit.contain,
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 4),
        Obx(
          () => Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(images.length, (index) {
              final bool isSelected = currentPage.value == index;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 2),
                width: isSelected ? 10 : 5,
                height: 4,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  color: isSelected ? primary : const Color(0xFFCBD5E1),
                ),
              );
            }),
          ),
        ),
      ],
    ),
  );
}

class ImagePageView extends StatefulWidget {
  final List<String> images;
  final int index;

  ImagePageView({Key? key, required this.images, required this.index})
      : super(key: ValueKey(index));

  @override
  _ImagePageViewState createState() => _ImagePageViewState();
}

class _ImagePageViewState extends State<ImagePageView> {
  late PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(keepPage: true);
    _pageController.addListener(() {
      if (mounted) {
        setState(() {
          _currentPage = _pageController.page!.round();
        });
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) {
      return Container(
        height: 12.h,
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Center(
          child: Icon(Icons.shopping_bag_outlined, color: Colors.grey),
        ),
      );
    }

    if (widget.images.length == 1) {
      return Container(
        height: 12.h,
        alignment: Alignment.center,
        padding: const EdgeInsets.all(4),
        child: CustomNetworkImage(
          url: widget.images[0],
          fit: BoxFit.contain,
        ),
      );
    }

    return Column(
      children: [
        SizedBox(
          height: 11.h,
          child: PageView.builder(
            key: PageStorageKey(widget.index),
            controller: _pageController,
            itemCount: widget.images.length,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.all(4),
                child: CustomNetworkImage(
                  url: widget.images[index],
                  fit: BoxFit.contain,
                ),
              );
            },
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(widget.images.length, (index) {
            final bool isSelected = _currentPage == index;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 2.0),
              width: isSelected ? 10.0 : 4.0,
              height: 4.0,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(2),
                color: isSelected ? primary : const Color(0xFFCBD5E1),
              ),
            );
          }),
        ),
      ],
    );
  }
}

Widget itemName({required dynamic name}) {
  return Text(
    "$name",
    style: customTextstyle(
      fontSize: 14.5.sp,
      color: tColor,
      fontWeight: FontWeight.w600,
    ),
    maxLines: 2,
    overflow: TextOverflow.ellipsis,
  );
}

Widget itemWeight({
  required dynamic weight,
  required void Function() onTapWeight,
  bool isMultipleVarients = false,
}) {
  final String label = (weight is List && weight.isNotEmpty)
      ? "${weight.first}"
      : "$weight";

  if (isMultipleVarients) {
    return InkWell(
      onTap: onTapWeight,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: primaryLight,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: primary.withOpacity(0.25), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: customTextstyle(
                fontSize: 12.sp,
                color: primaryDark,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 2),
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 16,
              color: primaryDark,
            ),
          ],
        ),
      ),
    );
  }

  return Text(
    label,
    style: customTextstyle(
      fontSize: 12.5.sp,
      color: tColor3,
      fontWeight: FontWeight.w500,
    ),
  );
}

Widget itemPrice({
  required BuildContext context,
  required dynamic price,
  required dynamic OriginalPrice,
  void Function()? increment,
  void Function()? decrement,
  required int quantity,
  required void Function() onTap,
  int? availableQty,
  int? varientID,
  required int? maxquantity,
}) {
  final bool isOutOfStock =
      (maxquantity == 0 || (availableQty != null && availableQty == 0));

  return Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    crossAxisAlignment: CrossAxisAlignment.end,
    children: [
      // Price column
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  "${Constants.rupee}$price",
                  style: robotocustomTextstyle(
                    fontSize: 16.sp,
                    color: tColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (OriginalPrice != null &&
                    OriginalPrice.toString().trim().isNotEmpty &&
                    OriginalPrice.toString() != price.toString()) ...[
                  const SizedBox(width: 4),
                  Text(
                    "${Constants.rupee}$OriginalPrice",
                    style: robotocustomTextstyle(
                      fontSize: 12.5.sp,
                      color: tColor3.withOpacity(0.65),
                      fontWeight: FontWeight.w500,
                      textDecoration: TextDecoration.lineThrough,
                    ),
                  ),
                ],
              ],
            ),
            if (StockHelper.isLowStock(availableQty))
              Padding(
                padding: const EdgeInsets.only(top: 2.0),
                child: LowStockBadge(
                  availableQty: availableQty,
                  isCompact: true,
                ),
              ),
          ],
        ),
      ),

      // Action: Add Button / Stepper / Out of Stock
      if (isOutOfStock)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFCBD5E1), width: 1),
          ),
          child: Text(
            "Unavailable",
            style: customTextstyle(
              fontSize: 11.5.sp,
              color: const Color(0xFF94A3B8),
              fontWeight: FontWeight.w600,
            ),
          ),
        )
      else if (quantity == 0)
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            height: 32,
            constraints: const BoxConstraints(minWidth: 70),
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: primary, width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: primary.withOpacity(0.12),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "ADD",
                  style: customTextstyle(
                    fontSize: 13.sp,
                    color: primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.add,
                  color: primary,
                  size: 14,
                ),
              ],
            ),
          ),
        )
      else
        Container(
          height: 32,
          decoration: BoxDecoration(
            color: primary,
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: primary.withOpacity(0.25),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              InkWell(
                onTap: decrement,
                borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Icon(
                    Icons.remove,
                    color: white,
                    size: 16,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Text(
                  quantity.toString(),
                  style: robotocustomTextstyle(
                    fontSize: 13.5.sp,
                    color: white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              InkWell(
                onTap: increment,
                borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Icon(
                    Icons.add,
                    color: white,
                    size: 16,
                  ),
                ),
              ),
            ],
          ),
        ),
    ],
  );
}
