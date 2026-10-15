// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/empty_data.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/kits_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Combo.dart/ComboDescription.dart';
import 'package:fav_app/new/NewScreens/Widgets/ComboTileWidget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../../../old/Models/Kits/kits_model.dart';
import '../../../../Constants/textStyles.dart';
import '../../../../Controllers/home_controller.dart';
import '../../../Widgets/customToast.dart';

class Combo extends StatefulWidget {
  const Combo({super.key});

  @override
  State<Combo> createState() => _ComboState();
}

class _ComboState extends State<Combo> {
  @override
  initState() {
    super.initState();
    Future.wait([
      kitsController.getKitsData(context: context),
      cartController.getCart(context: context),
    ]);
  }

  @override
  void dispose() {
    cartController.removeLoaders();
    super.dispose();
  }

  final HomeController homeController = Get.find();
  final KitsController kitsController = Get.find();
  final CartController cartController = Get.find();

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        homeController.updateTabIndex(0);
        return false;
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            "Kits/Combos",
            style: customTextstyle(fontWeight: FontWeight.w600, fontSize: 20),
          ),
          leading: IconButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                homeController.updateTabIndex(0);
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
          () => kitsController.isLoading.isTrue
              ? CustomLoader()
              : kitsController.products.isEmpty
                  ? EmptyDataWidget(message: 'No Products Found')
                  : Stack(
                      alignment: Alignment.bottomCenter,
                      children: [
                        Padding(
                          padding: EdgeInsets.only(
                              bottom: cartController.quantity.value != 0
                                  ? 12.h
                                  : 0),
                          child: ListView.builder(
                            itemCount: kitsController.products.length,
                            physics: BouncingScrollPhysics(),
                            padding: EdgeInsets.all(3.w),
                            itemBuilder: (context, index) {
                              var products = kitsController.products[index];
                              return ComboWidgets(
                                products: products,
                              );
                            },
                          ),
                        ),
                        cartController.quantity.value != 0
                            ? bottomQuantityViewer(
                                throughProductsScreen: true,
                                cartController: cartController,
                                context: context)
                            : Container()
                      ],
                    ),
        ),
      ),
    );
  }
}

class ComboWidgets extends StatefulWidget {
  const ComboWidgets({super.key, required this.products});
  final Product products;
  @override
  State<ComboWidgets> createState() => _ComboWidgetsState();
}

class _ComboWidgetsState extends State<ComboWidgets> {
  double percent = 0;

  @override
  void initState() {
    super.initState();
    products = widget.products;
    filterAndFetchQuantity();
    updatePercentage();
  }

  final CartController cartController = Get.find();

  filterAndFetchQuantity() async {
    if (cartController.cartItems.isNotEmpty) {
      for (var i = 0; i < cartController.cartItems.length; i++) {
        var cartItems = cartController.cartItems[i];
        if (cartItems.productId == products.kitId) {
          quantity = cartItems.quantity ?? 0;
        }
      }
    } else {
      quantity = 0;
    }
  }

  updatePercentage() {
    if (products.price != null) {
      percent = discountCalculate(products.price!, products.offerPrice!);
    }
  }

  int initialSelectedIndex = 0;
  int quantity = 0;
  late Product products;
  final KitsController kitsController = Get.find();
  @override
  Widget build(BuildContext context) {
    return GetBuilder<KitsController>(
      id: 'combo-list',
      builder: (_) {
        return Padding(
          padding: EdgeInsets.only(bottom: 1.h),
          child: ComboTilewidget(
            addBTN: () {
              quantityAdd(addOrRemove: true);
            },
            context: context,
            multipleProductVarients: false,
            itemimage: products.imageUrl ?? '',
            item_name: products.kitName ?? '',
            combo: products.kitName ?? '',
            onTap: () {},
            quantityContainer: quantity != 0 ? quantityAdded() : null,
            item_price: products.offerPrice?.toStringAsFixed(2) ?? '',
            item_OriginalPrice: products.price?.toStringAsFixed(2) ?? '',
            discount: percent.toStringAsFixed(2),
            onTapWidget: () {
              Navigator.of(context).push(MaterialPageRoute(
                  builder: (context) => ComboDescription(
                        kitId: products.kitId ?? 0,
                      )));
            },
          ),
        );
      },
    );
  }

  Widget quantityAdded() {
    return Container(
      height: 4.h,
      margin: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
          border: Border.all(color: primary, width: 1.5),
          borderRadius: BorderRadius.circular(0.5.h)),
      child: Row(
        children: [
          InkWell(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Icon(
                Icons.remove,
                color: primary,
                size: 2.h,
              ),
            ),
            onTap: () {
              quantityAdd(addOrRemove: false, isToastRemove: true);
            },
          ),
          Text(quantity.toString(),
              style: robotocustomTextstyle(
                color: primary,
                fontWeight: FontWeight.w600,
              )),
          InkWell(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Icon(
                Icons.add,
                color: primary,
                size: 2.h,
              ),
            ),
            onTap: () {
              quantityAdd(addOrRemove: true, isToastRemove: true);
            },
          )
        ],
      ),
    );
  }

  quantityAdd({required bool addOrRemove, bool isToastRemove = false}) {
    int availableQty = products.availableQty ?? 0;
    if (quantity < availableQty || addOrRemove == false) {
      if (addOrRemove) {
        quantity++;
      } else {
        if (quantity > 0) {
          quantity--;
        }
      }
      cartController
          .updateQuantity(
              kitId: products.kitId ?? 0,
              isThroughProductsScreen: true,
              quantity: quantity,
              removeToast: isToastRemove,
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
      customToast(message: 'Quantity max limit reached');
    }
  }
}

discountCalculate(
  double oldPrice,
  double newPrice,
) {
  double res = 0;
  res = (oldPrice - newPrice) / oldPrice * 100;

  return res;
}
