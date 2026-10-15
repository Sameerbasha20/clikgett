import 'package:fav_app/Models/Home/TimingProvider.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:shared_preferences/shared_preferences.dart';

// import '../../../../old/Models/Home/home_model.dart';
import '../../../../Constants/toast.dart';
import '../../../Constants/colors.dart';
import '../../../Constants/imageslist.dart';
import '../../../Constants/textStyles.dart';
import '../../../Controllers/cart_controller.dart';
import '../../../Controllers/kits_controller.dart';

// import '../../Widgets/ItemTile.dart';
import 'package:fav_app/new/NewScreens/Widgets/ItemHorizontalTile.dart'
    as items;

import '../../Widgets/ItemTile.dart';
import '../../Widgets/buttonWidget.dart';
import '../ItemDescription.dart';
import '../../../../old/Models/Home/home_model.dart' as homeModel;
import 'Combo.dart/Combo.dart';
import 'package:fav_app/new/NewModel/product_details_model.dart';
import 'package:fav_app/new/Constants/stock_helper.dart';
import 'package:fav_app/new/NewScreens/Widgets/purchase_options_sheet.dart';

class ItemsWidget extends StatefulWidget {
  const ItemsWidget({super.key, this.bestSellingItems});

  final homeModel.BestItem? bestSellingItems;

  @override
  State<ItemsWidget> createState() => _ItemsWidgetState();
}

class _ItemsWidgetState extends State<ItemsWidget> {
  homeModel.BestItem? bestSellingItems;
  late Products products;

  final CartController cartController = Get.find();
  double percent = 0;
  String? token;

  final TimingController timingController = Get.put(TimingController());

  Future retriveToken() async {
    await CommonServices.getToken().then((onValue) {
      token = onValue; // Store the token
      timingController.checkTiming(token!);
    });
    final SharedPreferences pref = await SharedPreferences.getInstance();
    double? latitude = pref.getDouble('latitude'); // Get area name
    // address = pref.getString('Address') ?? '';
    print("AreaName$latitude");
    // print("ddddddddd");
  }

  @override
  void initState() {
    super.initState();
    retriveToken();
    bestSellingItems = widget.bestSellingItems;
    products = Products(
        categoryId: bestSellingItems?.categoryId,
        createdAt: bestSellingItems?.createdAt,
        imageUrl: bestSellingItems?.imageUrl,
        productId: bestSellingItems?.productId,
        productName: bestSellingItems?.productName,
        productVariants: bestSellingItems?.productVariants
            ?.map((e) => ProductVariant(
                productId: e.productId,
                createdAt: e.createdAt,
                availableQty: e.availableQty,
                metrictype: e.metrictype,
                metricvalue: e.metricvalue,
                offerPrice: e.offerPrice,
                maxQty: e.maxQty,
                price: e.price,
                status: e.status,
                updatedAt: e.updatedAt,
                variantId: e.variantId))
            .toList(),
        updatedAt: bestSellingItems?.updatedAt,
        status: bestSellingItems?.status,
        subCategoryId: bestSellingItems?.subCategoryId,
        type: bestSellingItems?.type,
        productImages: []);

    bestSellingItems = widget.bestSellingItems;
    if (bestSellingItems?.productVariants != null) {
      if (bestSellingItems!.productVariants!.isNotEmpty) {
        // print({
        //   " My bestSellingItems":
        //       bestSellingItems?.productVariants?.first.toJson()
        // });
        var response = bestSellingItems?.productVariants?.first;
        selectedVarients = ProductVariant(
            status: response?.status,
            updatedAt: response?.updatedAt,
            variantId: response?.variantId,
            price: response?.price,
            offerPrice: response?.offerPrice,
            metricvalue: response?.metricvalue,
            metrictype: response?.metrictype,
            availableQty: response?.availableQty,
            maxQty: response?.maxQty,
            createdAt: response?.createdAt,
            productId: response?.productId);
      }
    }

    filterAndSetAddedQuantity();
  }

  filterAndSetAddedQuantity() {
    int foundQty = 0;
    if (cartController.cartItems.isNotEmpty) {
      for (var i = 0; i < cartController.cartItems.length; i++) {
        var item = cartController.cartItems[i];
        if (products.productVariants != null) {
          for (var j = 0; j < products.productVariants!.length; j++) {
            var variants = products.productVariants?[j];
            if (variants?.variantId == item.variantId &&
                item.productId == products.productId) {
              selectedVarients = variants;
              foundQty = item.quantity ?? 0;
            }
          }
        }
      }
    }
    quantity = foundQty;
  }

  final KitsController kitsController = Get.find();
  homeModel.ProductVariant? selectedvarients;
  ProductVariant? selectedVarients;
  int initialSelectedIndex = 0;
  int quantity = 0;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      filterAndSetAddedQuantity();
      return Padding(
        padding: EdgeInsets.only(right: 3.w),
        child: Container(
          width: 43.w,
          alignment: Alignment.center,
          decoration: const BoxDecoration(),
          clipBehavior: Clip.antiAliasWithSaveLayer,
          child: sellingItemWidget(
            bestSellingItems: bestSellingItems,
            onTap: () {
              token == "" || token == null
                  ? Fluttertoast.showToast(
                      msg: "Please Login to chectout this section!\nThanks.",
                    )
                  : null;
              token == "" || token == null
                  ? Navigator.of(context)
                      .push(MaterialPageRoute(builder: (context) => Login()))
                  : Navigator.of(context).push(MaterialPageRoute(
                      builder: (context) => ItemDescription(
                            id: bestSellingItems?.productId ?? 0,
                            title: bestSellingItems?.productName ?? '',
                            percent: percent,
                          )));
            },
          ),
        ),
      );
    });
  }

  Widget sellingItemWidget({
    required void Function() onTap,
    homeModel.BestItem? bestSellingItems,
  }) {
    // print({"YoubestSellingItems": bestSellingItems?.toJson()});

    homeModel.ProductVariant? product;
    if (bestSellingItems?.productVariants != null) {
      if (bestSellingItems!.productVariants!.isNotEmpty) {
        product = bestSellingItems.productVariants?.first;
        if (product?.price != null) {
          percent =
              (product!.price! - product.offerPrice!) / product.price! * 100;
        }
      }
    }
    // product = bestSellingItems?.productVariants?[0];
    bool isOutOfStock =
        selectedVarients!.availableQty! <= 0; // Check if out of stock

    return InkWell(
      onTap: onTap,
      child: GetBuilder<KitsController>(
        id: 'combo-list',
        builder: (_) {
          return Container(
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
                    padding: EdgeInsets.only(top: .5.h),
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 1.3.w),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          discountWidget(context: context, discount: percent),
                          // percent >= 0
                          //     ?itemsdiscountWidget(context: context, discount: percent)
                          //     : Container(padding: EdgeInsets.all(0.5.h)),
                          // itemImage(
                          //     context: context,
                          //     image: bestSellingItems?.imageUrl ?? ''),
                          itemImages(
                            productImages:
                                bestSellingItems?.productImages ?? [],
                          ),

                          itemName(name: bestSellingItems?.productName ?? ''),
                          SizedBox(
                            height: 4,
                          ),
                          itemWeight(
                            weight: [
                              "${selectedVarients?.metricvalue}"
                                  "${selectedVarients?.metrictype}"
                            ],
                            isMultipleVarients:
                                bestSellingItems!.productVariants!.length >= 2
                                    ? true
                                    : false,
                            onTap: () {
                              bottomsheet(bestSellingItems, context,
                                      selectedvarients, initialSelectedIndex)
                                  .then((value) {
                                if (value != null) {
                                  selectedvarients = value['productVariant'];
                                  if (selectedvarients != null) {
                                    selectedVarients = ProductVariant.fromJson(
                                        selectedvarients!.toJson());
                                  }

                                  initialSelectedIndex = value['Index'];
                                  quantity = 0;

                                  percent = discountCalculate(
                                      selectedvarients!.price!,
                                      selectedvarients!.offerPrice!);
                                  var checkValuesExistOrnot =
                                      filterQuantityAfterBottomsheet(
                                          selectedVarients);
                                  print(checkValuesExistOrnot);
                                  print('ssssssssssssssssssssssssssssssssss');
                                  if (!checkValuesExistOrnot) {
                                    quantityAdd(addOrRemove: true);
                                  }
                                  kitsController.updateComboList();
                                }
                              });
                            },
                          ),
                          items.itemPrice(
                              context: context,
                              quantity: quantity,
                              availableQty: selectedVarients?.availableQty,
                              maxquantity: selectedVarients?.maxQty ??
                                  bestSellingItems.productVariants?.first.maxQty,
                              decrement: () {
                                token == "" || token == null
                                    ? Fluttertoast.showToast(
                                        msg:
                                            "Please Login to chectout this section!\nThanks.",
                                      )
                                    : null;
                                token == "" || token == null
                                    ? Navigator.of(context).push(
                                        MaterialPageRoute(
                                            builder: (context) => Login()))
                                    : quantityAdd(
                                        addOrRemove: false,
                                        isToastRemove: true);
                              },
                              increment: () {
                                token == "" || token == null
                                    ? Fluttertoast.showToast(
                                        msg:
                                            "Please Login to chectout this section!\nThanks.",
                                      )
                                    : null;
                                token == "" || token == null
                                    ? Navigator.of(context).push(
                                        MaterialPageRoute(
                                            builder: (context) => Login()))
                                    : quantityAdd(
                                        addOrRemove: true, isToastRemove: true);
                              },
                              onTap: () {
                                token == "" || token == null
                                    ? Fluttertoast.showToast(
                                        msg:
                                            "Please Login to chectout this section!\nThanks.",
                                      )
                                    : null;
                                if (token == "" || token == null) {
                                  Navigator.of(context).push(
                                      MaterialPageRoute(
                                          builder: (context) => Login()));
                                } else {
                                  // Show Buy 1 / Buy 2 purchase options sheet
                                  _showPurchaseOptions(context);
                                }
                              },
                              price: selectedVarients?.offerPrice,
                              OriginalPrice: selectedVarients?.price)

                          // itemPrice(
                          //     onDecription: onTap,
                          //     context: context,
                          //     price: selectedvarients?.offerPrice,
                          //     onTap: () {
                          //       quantityAdd(addOrRemove: true);
                          //
                          //     },
                          //     decrement: () {
                          //       quantityAdd(
                          //           addOrRemove: false,
                          //           isToastRemove: true);
                          //     },
                          //     increment: () {
                          //       quantityAdd(
                          //           addOrRemove: true,
                          //           isToastRemove: true);
                          //     },
                          //
                          //
                          //
                          //     OriginalPrice: selectedvarients?.price),
                          ,
                          SizedBox(
                            height: 10,
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Positioned(
                  //   top: 6,
                  //   left: 6,
                  //   child: discountWidget(context: context, discount: percent),
                  // ),
                  // Overlay for Out of Stock
                  if (isOutOfStock)
                    Container(
                      color: Colors.black.withOpacity(0.5), // Black overlay
                      child: Center(
                        child: customText(
                          text: 'Out of Stock',
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 18,
                        ),
                      ),
                    ),
                ],
              ));
        },
      ),
    );
  }

  quantityAdd({required bool addOrRemove, bool isToastRemove = false}) {
    selectedVarients ??= products.productVariants?.first;
    print("mysurya${products.productVariants?.first.availableQty}");
    // if(selectedVarients!.availableQty!<selectedVarients!.maxQty!){
    //   customToast(message: 'Quantity not available ');
    //
    // }else{
    if (quantity < selectedVarients!.availableQty! || addOrRemove == false) {
      //   if ((selectedVarients?.maxQty != null && quantity < selectedVarients!.maxQty!) || addOrRemove == false) {
      // final maxQty = selectedVarients?.maxQty;
      // final availableQty = selectedVarients?.availableQty;
      // if ((selectedVarients?.maxQty != null &&  maxQty! < availableQty! && quantity < selectedVarients!.maxQty!) || addOrRemove == false) {

      if (addOrRemove) {
        if (quantity < selectedVarients!.availableQty! &&
            quantity < selectedVarients!.maxQty!) {
          quantity++;
        } else {
          customToast(message: 'Maximum quantity reached');
        }
      } else {
        // Decrease quantity but ensure it's above 0
        if (quantity > 0) {
          quantity--;
        }
      }
      //   quantity++;
      // } else {
      //   if (quantity > 0) {
      //     quantity--;
      //   }
      // }
      cartController
          .updateQuantity(
              isScreenFromHome: true,
              productId: selectedVarients?.productId ?? 0,
              variantId: selectedVarients?.variantId ?? 0,
              quantity: quantity,
              isThroughProductsScreen: true,
              removeToast: isToastRemove,
              categoryId: products.categoryId,
              subCategoryId: products.subCategoryId,
              context: context)
          .then((value) {
        if (value == false) {
          if (addOrRemove) {
            quantity--;
          } else {
            quantity++;
          }
        }
      });

      kitsController.updateComboList();
    } else {
      customToast(message: 'Quantity not available');
    }
    // }
  }

  /// Shows the Buy 1 / Buy 2 purchase options sheet.
  /// Called when the user taps the "Add" button for the first time (qty == 0).
  void _showPurchaseOptions(BuildContext context) {
    selectedVarients ??= products.productVariants?.first;
    if (selectedVarients == null) return;

    showPurchaseOptionsSheet(
      context: context,
      selectedVariant: selectedVarients!,
      variants: products.productVariants,
      productImages: products.productImages,
      productName: products.productName ?? '',
      currentQuantityInCart: quantity,
    ).then((result) {
      if (result != null && result['added'] == true) {
        if (result['variant'] != null &&
            result['variant'] is ProductVariant) {
          selectedVarients = result['variant'] as ProductVariant;
        }
        // Re-sync quantity from cart after successful add
        filterAndSetAddedQuantity();
        kitsController.updateComboList();
        setState(() {});
      }
    });
  }

  Future bottomsheet(homeModel.BestItem products, context,
      homeModel.ProductVariant? selectedvarients, int initialSelectedIndex) {
    final KitsController kitsController = Get.find();
    selectedvarients ??= products.productVariants?.first;
    // print(products.productVariants?.length);
    return showModalBottomSheet<void>(
        context: context,
        builder: (BuildContext context) {
          return Stack(
            alignment: Alignment.bottomCenter,
            children: [
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 2.5.h),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GestureDetector(
                      onTap: () {
                        Navigator.pop(context);
                      },
                      child: Padding(
                        padding: EdgeInsets.only(top: 2.5.h),
                        child: Align(
                          alignment: Alignment.topRight,
                          child: Image.asset(
                            removeIcon,
                            height: 3.h,
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(vertical: 2.h),
                      child: Text(
                        'Select A Quantity',
                        style: customTextstyle(
                            fontSize: 18.sp,
                            color: black,
                            fontWeight: FontWeight.w500),
                      ),
                    ),
                    Text(
                      products.productName ?? '',
                      style: customTextstyle(
                          fontSize: 18.sp,
                          color: black.withOpacity(.5),
                          fontWeight: FontWeight.w600),
                    ),
                    Padding(
                      padding: EdgeInsets.only(top: 3.h),
                      child: Text(
                        'Choose Variant',
                        style: customTextstyle(
                            fontSize: 18.sp,
                            color: black,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                    Flexible(
                      child: ListView.builder(
                        itemCount: products.productVariants?.length,
                        physics: const BouncingScrollPhysics(),
                        padding: EdgeInsets.only(bottom: 16.h),
                        shrinkWrap: true,
                        itemBuilder: (BuildContext context, int index) {
                          var varients = products.productVariants?[index];
                          return GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: () {
                              selectedvarients = varients;
                              kitsController.updateUI();
                              initialSelectedIndex = index;
                            },
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 1.2.h),
                              child: Row(
                                children: [
                                  GetBuilder<KitsController>(
                                    id: 'radioButton',
                                    builder: (_) {
                                      return Container(
                                        margin: EdgeInsets.only(right: 3.w),
                                        padding: const EdgeInsets.all(3),
                                        decoration: BoxDecoration(
                                            border: Border.all(
                                                color: green, width: 2),
                                            shape: BoxShape.circle),
                                        child: CircleAvatar(
                                          radius: 5,
                                          backgroundColor: selectedvarients
                                                          ?.variantId ==
                                                      varients?.variantId ||
                                                  initialSelectedIndex == index
                                              ? green
                                              : white,
                                        ),
                                      );
                                    },
                                  ),
                                  Text(
                                    '${varients?.metricvalue} ${varients?.metrictype}',
                                    style: customTextstyle(
                                        fontSize: 18.sp,
                                        color: black,
                                        fontWeight: FontWeight.w600),
                                  ),
                                  Padding(
                                    padding: EdgeInsets.only(left: 3.w),
                                    child: Row(
                                      children: [
                                        Padding(
                                          padding: EdgeInsets.only(right: 2.w),
                                          child: Text(
                                            '₹${varients?.offerPrice}',
                                            style: customTextstyle(
                                                fontSize: 17.sp,
                                                color: black,
                                                fontWeight: FontWeight.w600),
                                          ),
                                        ),
                                        Text(
                                          '₹${varients?.price}',
                                          style: customTextstyle(
                                              fontSize: 16.sp,
                                              color: tColor.withOpacity(.5),
                                              textDecoration:
                                                  TextDecoration.lineThrough,
                                              fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Spacer(),
                                  StockStatusText(
                                    availableQty: varients?.availableQty,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 100.w,
                height: 15.h,
                padding: EdgeInsets.symmetric(horizontal: 2.5.h),
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  border: Border(top: BorderSide(color: cardBorder, width: 1)),
                  boxShadow: softElevatedShadow,
                  color: white,
                ),
                child: GetBuilder<KitsController>(
                  id: 'radioButton',
                  builder: (_) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: Text(
                            '${selectedvarients?.metricvalue} ${selectedvarients?.metrictype}',
                            style: customTextstyle(
                                fontSize: 16.sp,
                                color: green,
                                fontWeight: FontWeight.w600),
                          ),
                        ),
                        Divider(
                          thickness: 1,
                          color: black.withOpacity(.2),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Image.asset(
                                  deletecartIcon,
                                  height: 2.5.h,
                                ),
                                Padding(
                                  padding:
                                      EdgeInsets.symmetric(horizontal: 2.w),
                                  child: Text(
                                    'Item Total',
                                    style: customTextstyle(
                                        fontSize: 16.sp,
                                        color: green,
                                        fontWeight: FontWeight.w600),
                                  ),
                                ),
                                Padding(
                                  padding: EdgeInsets.only(right: 2.w),
                                  child: const CircleAvatar(
                                    radius: 2,
                                    backgroundColor: primary,
                                  ),
                                ),
                                Text(
                                  '₹${selectedvarients?.offerPrice}',
                                  style: customTextstyle(
                                      fontSize: 16.sp,
                                      color: primary,
                                      fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            buttonWidget(
                                height: 4.5.h,
                                width: 9.w,
                                fontSize: 13,
                                onTap: () {
                                  Navigator.pop(context, {
                                    "productVariant": selectedvarients,
                                    "Index": initialSelectedIndex,
                                  });
                                },
                                context: context,
                                text: 'Add To Cart')
                          ],
                        )
                      ],
                    );
                  },
                ),
              ),
            ],
          );
        });
  }

  bool filterQuantityAfterBottomsheet(ProductVariant? selectedVarients) {
    bool isValueFound = false;
    for (var i = 0; i < cartController.cartItems.length; i++) {
      var item = cartController.cartItems[i];

      if (item.productId == products.productId) {
        if (products.productVariants?.length != null) {
          var variants = selectedVarients;
          if (variants?.variantId == item.variantId) {
            isValueFound = true;
            quantity = item.quantity ?? 0;
          }
        }
      }
    }
    return isValueFound;
  }
}
