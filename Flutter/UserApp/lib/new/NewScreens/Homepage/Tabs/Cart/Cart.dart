// ignore_for_file: prefer_const_constructors, sized_box_for_whitespace
import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/Models/Home/TimingProvider.dart';
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/auth_controller.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/config_controller.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:fav_app/new/NewModel/DeliveryInstructionModel.dart';
import 'package:fav_app/new/NewScreens/Address/ManageAddress.dart';
import 'package:fav_app/new/NewScreens/Address/unsupported_location_screen.dart';
import '../../../../../old/Services/Account/adresses.dart';
import 'package:fav_app/new/NewScreens/CouponAndOffers/Coupon.dart';
import 'package:fav_app/new/NewScreens/CouponAndOffers/Offers.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Combo.dart/Combo.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Combo.dart/ComboDescription.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/HomeTab.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/dashedBorder.dart';
import 'package:fav_app/new/NewScreens/Widgets/CartWidget.dart';
import 'package:fav_app/new/NewScreens/Widgets/ItemTile.dart' as itemTile;
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/NewScreens/Widgets/textfieldWidget.dart';
// import 'package:fav_app/old/Screens/HomePageTabs/mainTab.dart';
import 'package:fav_app/old/Screens/Offers/offersTab.dart';
import 'package:flutter/material.dart';
import 'delivery_slot_widget.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../../Screens/Widgets/Sizes.dart';
import '../../../../../Services/common/common_services.dart';
import '../../../../../old/Models/Home/cart_model.dart';
import '../../../../Constants/network_image.dart';
import '../../../../Controllers/home_controller.dart';
import '../../../../NewModel/youmaylike_model.dart';
import '../../../Widgets/customToast.dart';

class Cart extends StatefulWidget {
  const Cart(
      {super.key,
      this.isFromHomeScreen = true,
      this.throughSearchScreen = false,
      this.throughDescriptionScreen = false,
      this.throughProductScreen = false});

  final bool isFromHomeScreen;
  final bool throughSearchScreen;
  final bool throughDescriptionScreen;
  final bool throughProductScreen;

  //throughDescriptionScreen is Used For uneccecory api call when dont involve the description screens it aplicable for kits and products both
  @override
  State<Cart> createState() => _CartState();
}

class _CartState extends State<Cart> {
  String? token;

  String selectedMethod = 'Select Payment Method'; // Initial selected method
  bool isExpanded = false;
  String selectedImageAsset = ''; // Path to the selected image
  double? _selectedTip; // Initially, no tip is selected
  TextEditingController _otherTipController = TextEditingController();
  TextEditingController _tipController = TextEditingController();

  ScrollController scrollController = ScrollController();
  final couponCode = TextEditingController();
  final List<String> _couponCode = List.filled(1, '');
  FocusNode couponFocus = FocusNode();
  String couponSuccess = "Yay..You Save ₹100 ";
  String selectedPayment = 'cash';
  ScheduledSlotInfo? _scheduledSlotInfo;

  List<DeliveryInstructionModel> deliveryInstructions = [
    (DeliveryInstructionModel(
        image: addressIcon,
        title: "No Contact Delivery",
        description: "Our delivery partner will leave  order at your door")),
    (DeliveryInstructionModel(
        image: bell,
        title: "Donot ring bell",
        description: "our delivery partner will not ring the bell")),
    (DeliveryInstructionModel(
        image: dogIcon,
        title: "Beware of Pets",
        description:
            "our delivery partner will be informed about presence of pets")),
  ];

  void _selectTip(dynamic tip) {
    setState(() {
      if (tip is int) {
        _selectedTip = double.tryParse(tip.toString());
        _otherTipController
            .clear(); // Clear the text field when selecting a predefined amount
      } else {
        _selectedTip = null; // No tip selected for 'Other'
      }
    });
  }

  Future retriveToken() async {
    final SharedPreferences pref = await SharedPreferences.getInstance();

    double? latitude = pref.getDouble('latitude'); // Get area name
    // address = pref.getString('Address') ?? '';
    await CommonServices.getToken().then((onValue) {
      token = onValue; // Store the token
      timingController.checkTiming(token!);
    });
  }

  @override
  initState() {
    super.initState();
    majorThing();
    Future.wait([
      adressController.getAdresses(context: context),
      cartController.youmayLikeProducts(context: context),
      configController.getConfig(context: context),
      walletController.getWallet(context: context),
      // cartController.getCart(context: context),
      cartController.getCart(
          context: context,
          longitude: homeController.longitude,
          latitude: homeController.latitude),

      retriveToken(),
    ]);
  }

  majorThing() async {
    couponCode.clear();
    cartController.updateCoupon();
    isUsedWallet = false;
    await Future.delayed(Duration.zero);
    walletController.updateUI();
    cartController.addWallet(value: 0.0, isRemoveFee: true);
// Clear the coupon code input field
    cartController.couponApplied.value = false; // Mark coupon as not applied
  }

  double? finalTotal;

  @override
  void dispose() {
    couponCode.clear();
    ordersController.clearOrderBodyData();
    cartController.removeCouponse();
    ordersController.clearRazorpay();
    cartController.removeAvailableKititemsLength();
    cartController.resetDeliveryInstructions();
    super.dispose();
  }

  final CartController cartController = Get.find();
  final ConfigController configController = Get.find();
  final TimingController timingController = Get.put(TimingController());

  final WalletController walletController = Get.find();
  final HomeController homeController = Get.find();
  final AdressController adressController = Get.find();
  final OrdersController ordersController = Get.find();
  int quantity = 0;

  bool isUsedWallet = false;


  Widget productUnlocksWidget() {
    final unlocks = cartController.cart?.productUnlocks;
    if (unlocks == null || unlocks.isEmpty) {
      return const SizedBox.shrink();
    }

    // Check if any unlock rule is currently unlocked
    final unlockedRules = unlocks.where((u) => u.isUnlocked).toList();
    final lockedRules = unlocks.where((u) => !u.isUnlocked).toList();

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.5.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. UNLOCKED STATE
          if (unlockedRules.isNotEmpty)
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(4.w),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF86EFAC), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16A34A).withOpacity(0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Text("🎁", style: TextStyle(fontSize: 18)),
                      ),
                      SizedBox(width: 2.5.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Special Products Unlocked",
                              style: customTextstyle(
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF166534),
                              ),
                            ),
                            Text(
                              "Exclusive reward for cart total above ₹1000",
                              style: customTextstyle(
                                fontSize: 12.sp,
                                color: const Color(0xFF15803D),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16A34A),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          "UNLOCKED",
                          style: customTextstyle(
                            fontSize: 10.sp,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 1.5.h),
                  ...unlockedRules.map((u) {
                    String imgUrl = '';
                    if (u.productImages != null) {
                      if (u.productImages is List && (u.productImages as List).isNotEmpty) {
                        imgUrl = (u.productImages as List)[0].toString();
                      } else if (u.productImages is String) {
                        imgUrl = u.productImages.toString();
                      }
                      if (imgUrl.isNotEmpty && !imgUrl.startsWith('http')) {
                        imgUrl = "https://d3c9kvg5gaqz48.cloudfront.net/Products/" + imgUrl;
                      }
                    }

                    return Container(
                      margin: EdgeInsets.only(bottom: 1.h),
                      padding: EdgeInsets.all(3.w),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFBBF7D0)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: imgUrl.isNotEmpty
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(
                                      imgUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(Icons.card_giftcard, color: Colors.green),
                                    ),
                                  )
                                : const Icon(Icons.card_giftcard, color: Colors.green),
                          ),
                          SizedBox(width: 3.w),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  u.productName,
                                  style: customTextstyle(
                                    fontSize: 14.5.sp,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black87,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                SizedBox(height: 0.3.h),
                                Row(
                                  children: [
                                    if (u.price > u.unlockPrice) ...[
                                      Text(
                                        "MRP ₹${u.price.toStringAsFixed(0)}",
                                        style: TextStyle(
                                          fontSize: 12.sp,
                                          color: Colors.grey.shade500,
                                          decoration: TextDecoration.lineThrough,
                                        ),
                                      ),
                                      SizedBox(width: 2.w),
                                    ],
                                    Text(
                                      "₹${u.unlockPrice.toStringAsFixed(0)}",
                                      style: customTextstyle(
                                        fontSize: 16.sp,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF16A34A),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF16A34A),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              elevation: 0,
                            ),
                            onPressed: () {
                              if (u.productId != null) {
                                cartController.updateQuantity(
                                  context: context,
                                  productId: u.productId!,
                                  variantId: u.variantId ?? 0,
                                  quantity: 1,
                                  isFromCartScreen: true,
                                );
                              }
                            },
                            child: Text(
                              "ADD",
                              style: customTextstyle(
                                fontSize: 13.sp,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),

          // 2. LOCKED STATE
          if (lockedRules.isNotEmpty)
            ...lockedRules.map((u) {
              final needed = u.amountNeeded;
              return Container(
                width: double.infinity,
                margin: EdgeInsets.only(top: unlockedRules.isNotEmpty ? 1.h : 0),
                padding: EdgeInsets.all(4.w),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFDE68A), width: 1.2),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Text("🎁", style: TextStyle(fontSize: 18)),
                    ),
                    SizedBox(width: 3.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Unlock Special Products",
                            style: customTextstyle(
                              fontSize: 15.sp,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF92400E),
                            ),
                          ),
                          SizedBox(height: 0.3.h),
                          Text(
                            "Add ₹${needed.toStringAsFixed(0)} more to unlock discounted products",
                            style: customTextstyle(
                              fontSize: 12.5.sp,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFFB45309),
                            ),
                          ),
                          if (u.productName.isNotEmpty) ...[
                            SizedBox(height: 0.2.h),
                            Text(
                              "Unlock ${u.productName} at just ₹${u.unlockPrice.toStringAsFixed(0)}!",
                              style: customTextstyle(
                                fontSize: 11.5.sp,
                                color: Colors.grey.shade700,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const Icon(Icons.lock_outline, color: Color(0xFFD97706), size: 22),
                  ],
                ),
              );
            }).toList(),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => WillPopScope(
        onWillPop: () async {
          if (widget.isFromHomeScreen) {
            Get.to(Homepage());
            // homeController.updateTabIndex(0);
          } else {
            Navigator.pop(context);
          }

          return false;
        },
        child: Scaffold(
          appBar: AppBar(
            surfaceTintColor: Colors.transparent,
            backgroundColor: white,
            elevation: 0,
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Container(
                color: cardBorder,
                height: 1,
              ),
            ),
            title: Text(
              "Cart",
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                fontSize: 18.5.sp,
                color: tColor,
              ),
            ),
            leading: IconButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                if (widget.isFromHomeScreen) {
                  Get.to(Homepage());
                } else {
                  Navigator.pop(context);
                }
              },
              icon: Icon(
                Icons.arrow_back_ios_new_rounded,
                size: 20,
                color: tColor,
              ),
            ),
          ),
          backgroundColor: bg1,
          // backgroundColor: bg,
          body: cartController.isLoading.isTrue
              ? CustomLoader()
              : cartController.cartItems.isEmpty ||
                      cartController.cart?.cartId == null
                  ? emptyCartData()
                  : SingleChildScrollView(
                      physics: BouncingScrollPhysics(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          productUnlocksWidget(),
                          Container(
                              width: double.infinity,
                              decoration: BoxDecoration(color: white),
                              child: Column(
                                children: [
                                  Padding(
                                    padding: EdgeInsets.only(
                                        top: 3.w, right: 3.w, left: 3.w),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: customText(
                                            text: "Items in your cart",
                                            fontSize: 0.019.sp,
                                            color: black,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        GestureDetector(
                                          onTap: () {
                                            cartDeleteAlert().then((value) {
                                              if (value == true) {
                                                cartController.deleteCart(
                                                    context: context,
                                                    isThroughProducts: widget
                                                        .throughProductScreen,
                                                    isThroughProductsDetails: widget
                                                        .throughDescriptionScreen);
                                              }
                                            });
                                          },
                                          child: Container(
                                            decoration: BoxDecoration(
                                                borderRadius:
                                                    BorderRadius.circular(5),
                                                color: Colors.green
                                                    .withOpacity(0.03),
                                                border: Border.all(
                                                    color: Colors.green)),
                                            child: Padding(
                                              padding:
                                                  const EdgeInsets.all(5.0),
                                              child: customText(
                                                text: "Clear All",
                                                fontSize: 11.sp,
                                                color: Colors.green,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Divider(),
                                  ListView.builder(
                                    shrinkWrap: true,
                                    physics: NeverScrollableScrollPhysics(),
                                    itemBuilder: (context, index) {
                                      var order =
                                          cartController.cartItems[index];
                                      return GestureDetector(
                                        onTap: () {
                                          // double percent = 0;
                                          // if (order.price != null) {
                                          //   percent = (order.price! -
                                          //           order.offerPrice!) /
                                          //       order.price! *
                                          //       100;
                                          // }

                                          // Navigator.push(
                                          //     context,
                                          //     MaterialPageRoute(
                                          //         builder: (_) => order.type ==
                                          //                 1
                                          //             ? ItemDescription(
                                          //                 title: order
                                          //                         .productName ??
                                          //                     '',
                                          //                 id: order.productId ??
                                          //                     0,
                                          //                 percent: percent,
                                          //               )
                                          //             : ComboDescription(
                                          //                 kitId: order.kitId ??
                                          //                     0)));
                                        },
                                        child: Container(
                                          padding: EdgeInsets.only(
                                              top: 3.w, left: 3.w, right: 3.w),
                                          child: Row(
                                            children: [
                                              Container(
                                                height: 56,
                                                width: 56,
                                                decoration: BoxDecoration(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            10),
                                                    color: white,
                                                    border: Border.all(
                                                        color: Colors.grey
                                                            .withOpacity(
                                                                0.09))),
                                                child: Padding(
                                                  padding:
                                                      const EdgeInsets.all(2.0),
                                                  child: CachedNetworkImage(
                                                    imageUrl: order!
                                                            .productImages[0] ??
                                                        '',
                                                    progressIndicatorBuilder:
                                                        (context, url,
                                                            progress) {
                                                      return Padding(
                                                        padding:
                                                            const EdgeInsets
                                                                .all(8.0),
                                                        child:
                                                            CircularProgressIndicator(),
                                                      );
                                                    },
                                                  ),
                                                ),
                                              ),
                                              SizedBox(
                                                width: 10,
                                              ),
                                              Expanded(
                                                  child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  customText(
                                                    text:
                                                        order.productName ?? "",
                                                    fontSize: 0.012.sp,
                                                    fontWeight: FontWeight.w600,
                                                    color: Colors.black,
                                                  ),
                                                  SizedBox(
                                                    height: 5,
                                                  ),
                                                  Row(
                                                    children: [
                                                      // customText(
                                                      //   text: order?.type == 1
                                                      //       ? '${order?.metricvalue} ${order?.metrictype}'
                                                      //       : 'Combo Of ${order?.kitItems?.length}',
                                                      //   fontSize: 0.012.sp,
                                                      //   fontWeight:
                                                      //       FontWeight.w400,
                                                      //   color: Colors.black,
                                                      // ),
                                                      // Expanded(
                                                      //   child: customText(
                                                      //     text:
                                                      //         " x ${order.quantity}",
                                                      //     fontSize: 0.012.sp,
                                                      //     fontWeight:
                                                      //         FontWeight.w400,
                                                      //     color: Colors.black,
                                                      //   ),
                                                      // ),
                                                      customText(
                                                        text:
                                                            "${Constants.rupee}${int.parse(order.price!.round().toString())}",
                                                        fontSize: 0.012.sp,
                                                        fontWeight:
                                                            FontWeight.w400,
                                                        color: Colors.black,
                                                        extrafontStyle: TextStyle(
                                                            decoration:
                                                                TextDecoration
                                                                    .lineThrough),
                                                      ),
                                                      SizedBox(
                                                        width: 5,
                                                      ),
                                                      Expanded(
                                                        child: customText(
                                                          text:
                                                              "${Constants.rupee}${int.parse(order.offerPrice!.round().toString())}",
                                                          fontSize: 0.015.sp,
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          color: Colors.black,
                                                        ),
                                                      ),
                                                      Container(
                                                        decoration:
                                                            BoxDecoration(
                                                          borderRadius:
                                                              BorderRadius
                                                                  .circular(5),
                                                          color: Colors
                                                              .green.shade700,
                                                        ),
                                                        child: Row(
                                                          children: [
                                                            GestureDetector(
                                                              onTap: () async {
                                                                couponCode
                                                                    .clear();
                                                                cartController
                                                                    .updateCoupon();
                                                                isUsedWallet =
                                                                    false;
                                                                await Future
                                                                    .delayed(
                                                                        Duration
                                                                            .zero);
                                                                walletController
                                                                    .updateUI();
                                                                cartController
                                                                    .addWallet(
                                                                        value:
                                                                            0.0,
                                                                        isRemoveFee:
                                                                            true);
// Clear the coupon code input field
                                                                cartController
                                                                        .couponApplied
                                                                        .value =
                                                                    false; // Mark coupon as not applied
                                                                quantityAdd(
                                                                    addOrRemove:
                                                                        false,
                                                                    cart:
                                                                        order);

                                                                adressController
                                                                    .getAdresses(
                                                                        context:
                                                                            context);
                                                                cartController
                                                                    .youmayLikeProducts(
                                                                        context:
                                                                            context);
                                                                configController
                                                                    .getConfig(
                                                                        context:
                                                                            context);
                                                                walletController
                                                                    .getWallet(
                                                                        context:
                                                                            context);
                                                                // cartController.getCart(context: context),
                                                                cartController.getCart(
                                                                    context:
                                                                        context,
                                                                    longitude:
                                                                        homeController
                                                                            .longitude,
                                                                    latitude:
                                                                        homeController
                                                                            .latitude);
                                                              },
                                                              child: Container(
                                                                child: Padding(
                                                                  padding:
                                                                      const EdgeInsets
                                                                          .all(
                                                                          2.0),
                                                                  child: Icon(
                                                                    Icons
                                                                        .remove,
                                                                    color: bg,
                                                                    size: 20,
                                                                  ),
                                                                ),
                                                              ),
                                                            ),
                                                            SizedBox(
                                                              width: 4,
                                                            ),
                                                            customText(
                                                              text:
                                                                  "${order.quantity}",
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w700,
                                                              color: white,
                                                            ),
                                                            SizedBox(
                                                              width: 4,
                                                            ),
                                                            GestureDetector(
                                                              onTap: () {
                                                                couponCode
                                                                    .clear();
                                                                cartController
                                                                    .updateCoupon();
                                                                cartController
                                                                        .couponApplied
                                                                        .value =
                                                                    false; // Mark coupon as not applied

                                                                quantityAdd(
                                                                    addOrRemove:
                                                                        true,
                                                                    cart:
                                                                        order);
                                                              },
                                                              child: Container(
                                                                child: Padding(
                                                                  padding:
                                                                      const EdgeInsets
                                                                          .all(
                                                                          2.0),
                                                                  child: Icon(
                                                                    Icons.add,
                                                                    color: bg,
                                                                    size: 20,
                                                                  ),
                                                                ),
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ),

                                                      SizedBox(
                                                        width: 5,
                                                      ),
                                                    ],
                                                  )
                                                  // Text()
                                                ],
                                              ))
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                    itemCount: cartController.cartItems.length,
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(8.0),
                                    child: GestureDetector(
                                      onTap: () {
                                        if (widget.isFromHomeScreen) {
                                          homeController.updateTabIndex(0);
                                        } else {
                                          Navigator.pop(context);
                                        }
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.all(8.0),
                                        child: Row(
                                          children: [
                                            Icon(
                                              Icons.add,
                                              size: 12,
                                              color: Appprimary,
                                            ),
                                            SizedBox(
                                              width: 5,
                                            ),
                                            customText(
                                              text: "Add Items",
                                              fontSize: 13.sp,
                                              color: Appprimary,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  )
                                ],
                              )),

                          // address.isNotEmpty ? Container() : addressButton(),
                          // Container(
                          //   alignment: Alignment.center,
                          //   decoration: BoxDecoration(
                          //       color: Colors.orangeAccent,
                          //       borderRadius: BorderRadius.circular(7)),
                          //   padding: EdgeInsets.symmetric(
                          //       vertical: 13, horizontal: 15),
                          //   child: customText(
                          //     text:
                          //         'Enjoy Free Delivery on Orders Above ₹${configController.freeDeliveryCartPrice.toStringAsFixed(0)}!',
                          //     // color: white,
                          //     fontWeight: FontWeight.w600,
                          //     textAlign: TextAlign.center,
                          //     fontSize: 16.sp,
                          //   ),
                          // ),
                          // deliveryAddress(
                          //     address: homeController.selectedLocation.value),

                          // Divider(
                          //   thickness: 1,
                          // ),

                          // Row(
                          //   children: [
                          //     Expanded(
                          //       child: customText(
                          //         text: "Items in your Cart",
                          //         fontSize: 17.sp,
                          //         fontWeight: FontWeight.w600,
                          //       ),
                          //     ),
                          //     cartController.cartItems.isEmpty ||
                          //             cartController.cart?.cartId == null
                          //         ? Container()
                          //         : GestureDetector(
                          //             onTap: () {
                          //               cartDeleteAlert().then((value) {
                          //                 if (value == true) {
                          //                   cartController.deleteCart(
                          //                       context: context,
                          //                       isThroughProducts:
                          //                           widget.throughProductScreen,
                          //                       isThroughProductsDetails: widget
                          //                           .throughDescriptionScreen);
                          //                 }
                          //               });
                          //             },
                          //             child: Row(
                          //               crossAxisAlignment:
                          //                   CrossAxisAlignment.end,
                          //               mainAxisAlignment:
                          //                   MainAxisAlignment.end,
                          //               children: [
                          //                 Container(
                          //                   height: 30,
                          //                   decoration: BoxDecoration(
                          //                       color: Color(0xffE1E1E1),
                          //                       borderRadius: BorderRadius.all(
                          //                           Radius.circular(16))),
                          //                   margin: EdgeInsets.only(
                          //                       top: 13, bottom: 13, right: 15),
                          //                   padding: EdgeInsets.symmetric(
                          //                       horizontal: 8, vertical: 1),
                          //                   child: Center(
                          //                       child: Text(
                          //                     'Clear All',
                          //                     textAlign: TextAlign.center,
                          //                     style: GoogleFonts.montserrat(
                          //                         fontSize: 14.0,
                          //                         color: Color(0Xff030401),
                          //                         fontWeight: FontWeight.w600),
                          //                   )),
                          //                 ),
                          //               ],
                          //             ),
                          //           ),
                          //   ],
                          // ),
                          // SizedBox(
                          //   height: 4,
                          // ),

                          // cartItems(),
                          // Padding(
                          //   padding: const EdgeInsets.all(10.0),
                          //   child: GestureDetector(
                          //     onTap: () {
                          //       homeController.updateTabIndex(0);
                          //     },
                          //     child: Row(
                          //       mainAxisAlignment: MainAxisAlignment.end,
                          //       children: [
                          //         TextButton(
                          //           onPressed: () {
                          //             if (widget.isFromHomeScreen) {
                          //               homeController.updateTabIndex(0);
                          //             } else {
                          //               Navigator.pop(context);
                          //             }
                          //           },
                          //           style: TextButton.styleFrom(
                          //             backgroundColor: primary,
                          //             padding: EdgeInsets.symmetric(
                          //                 horizontal: 3, vertical: 8),
                          //             shape: RoundedRectangleBorder(
                          //               borderRadius: BorderRadius.circular(5),
                          //             ),
                          //           ),
                          //           child: Row(
                          //             mainAxisSize: MainAxisSize.min,
                          //             children: [
                          //               Icon(
                          //                 Icons.add,
                          //                 color: Colors.white,
                          //                 size: 16, // Adjust size if needed
                          //               ),
                          //               Text(
                          //                 "Add Items",
                          //                 style: GoogleFonts.montserrat(
                          //                   color: Colors.white,
                          //                   fontSize: 16,
                          //                 ),
                          //               ),
                          //             ],
                          //           ),
                          //         ),
                          //       ],
                          //     ),
                          //   ),
                          // ),
                          // Divider(
                          //   thickness: 1,
                          // ),
                          // ClipRRect(
                          //   borderRadius: BorderRadius.circular(8.0),
                          //   child: Theme(
                          //     data: ThemeData(
                          //       dividerColor: Colors.transparent, // Removes dividers
                          //     ),
                          //     child: ExpansionTile(
                          //       title: CartCustomText(
                          //         text: selectedMethod,
                          //         color: Color(0xFF030401),
                          //         fontSize: 0.020,
                          //         fontWeight: FontWeight.w700,
                          //         leadingWidget: selectedImageAsset.isNotEmpty
                          //             ? Image.asset(selectedImageAsset,
                          //             height: 24, width: 24)
                          //             : null,
                          //       ),
                          //       trailing: Icon(
                          //         isExpanded ? Icons.arrow_drop_up : Icons.arrow_drop_down,
                          //         color: Colors.black,
                          //       ),
                          //       backgroundColor: Colors.white,
                          //       collapsedBackgroundColor: Colors.white,
                          //       // Ensure background color is consistent
                          //       childrenPadding: EdgeInsets.zero,
                          //       onExpansionChanged: (bool expanded) {
                          //         setState(() {
                          //           isExpanded = expanded;
                          //         });
                          //       },
                          //       children: <Widget>[
                          //         paymentMethodTile('Debit/Credit Card', debitcard),
                          //         paymentMethodTile('UPI', upi),
                          //         paymentMethodTile('Paypal', paypal),
                          //         paymentMethodTile('Cash', cash),
                          //       ],
                          //     ),
                          //   ),
                          // ),
                          // Divider(
                          //   thickness: 1,
                          // ),
                          SizedBox(
                            height: 10,
                          ),

                          // suggestIemsWidget(),
                          Container(
                              decoration: BoxDecoration(
                                color: bg,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: EdgeInsets.only(
                                        top: 3.w, right: 3.w, left: 3.w),
                                    child: customText(
                                      text: "Apply Coupon",
                                      fontSize: 0.019.sp,
                                      color: black,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Divider(),
                                  couponWidget(),
                                ],
                              )),
                          walletController.walletModel?.walletAmount == 0
                              ? SizedBox()
                              : SizedBox(
                                  height: 10,
                                ),

                          walletController.walletModel?.walletAmount == 0
                              ? SizedBox()
                              : Container(
                                  decoration: BoxDecoration(color: bg),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Padding(
                                        padding: EdgeInsets.only(
                                            top: 3.0.w, left: 3.w, right: 3.w),
                                        child: customText(
                                          text: "ClikGett Cash",
                                          fontSize: 0.019.sp,
                                          color: black,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Divider(),
                                      Obx(
                                        () => walletController.walletModel ==
                                                null
                                            ? Container()
                                            : configController.minWalletAmount
                                                            .value !=
                                                        0 &&
                                                    walletController.walletModel
                                                            ?.walletAmount !=
                                                        0
                                                ? Padding(
                                                    padding:
                                                        const EdgeInsets.only(
                                                            bottom: 10),
                                                    child: InkWell(
                                                      onTap: () {
                                                        FocusManager.instance
                                                            .primaryFocus
                                                            ?.unfocus();
                                                        if (double.parse(cartController
                                                                    .totalAmmount
                                                                    .value) >=
                                                                configController
                                                                    .minCartAmount
                                                                    .value ||
                                                            isUsedWallet) {
                                                          isUsedWallet =
                                                              !isUsedWallet;

                                                          if (isUsedWallet) {
                                                            cartController
                                                                .addWallet(
                                                                    value:
                                                                        getEligibleAmount());
                                                          } else {
                                                            cartController
                                                                .addWallet(
                                                                    value:
                                                                        getEligibleAmount(),
                                                                    isRemoveFee:
                                                                        true);
                                                          }
                                                          walletController
                                                              .updateUI();
                                                          setState(() {});
                                                          return;
                                                        }
                                                        customToast(
                                                            message:
                                                                'Wallet money can be used on orders of ₹${configController.minCartAmount.value} or more.');
                                                      },
                                                      child: Row(
                                                        children: [
                                                          IgnorePointer(
                                                            child: GetBuilder<
                                                                WalletController>(
                                                              id: 'update-wallet',
                                                              builder:
                                                                  (controller) =>
                                                                      Checkbox(
                                                                value:
                                                                    isUsedWallet,
                                                                activeColor:
                                                                    primary,
                                                                onChanged:
                                                                    (value) {},
                                                              ),
                                                            ),
                                                          ),
                                                          Column(
                                                            crossAxisAlignment:
                                                                CrossAxisAlignment
                                                                    .start,
                                                            children: [
                                                              customText(
                                                                text:
                                                                    "Available Wallet Amount ₹${walletController.walletModel?.walletAmount}",
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w600,
                                                                fontSize: 16.sp,
                                                              ),
                                                            ],
                                                          )
                                                        ],
                                                      ),
                                                    ),
                                                  )
                                                : Container(),
                                      ),
                                    ],
                                  ),
                                ),
                          SizedBox(
                            height: 10,
                          ),
                          Container(
                            width: double.infinity,
                            color: bg,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: EdgeInsets.only(
                                      top: 3.0.w, left: 3.w, right: 3.w),
                                  child: customText(
                                    text: "Delivery Boy Tip",
                                    fontSize: 0.019.sp,
                                    color: black,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Divider(),
                                // Icon(
                                //   Icons.volunteer_activism_outlined,
                                //   color: Appprimary,
                                //   size: 46,
                                //   weight: 0.04,
                                // ),
                                Padding(
                                  padding: const EdgeInsets.all(8.0),
                                  child: TextFormField(
                                    controller: _otherTipController,
                                    keyboardType: TextInputType.number,
                                    textInputAction: Platform.isIOS
                                        ? TextInputAction.done
                                        : TextInputAction.none,
                                    // This will prevent the "Done" button
                                    decoration: InputDecoration(
                                      counterText: "",
                                      suffixIcon: _otherTipController.text != ""
                                          ? GestureDetector(
                                              onTap: () {
                                                double enteredTip =
                                                    double.tryParse(
                                                            _otherTipController
                                                                .text) ??
                                                        0.0;
                                                setState(() {
                                                  _selectedTip = enteredTip;
                                                });
                                                FocusManager
                                                    .instance.primaryFocus
                                                    ?.unfocus();
                                              },
                                              child: Icon(
                                                Icons.check_circle,
                                                color: Appprimary,
                                              ),
                                            )
                                          : SizedBox(),
                                      filled: true,
                                      fillColor: Color(0xffF5F5F5),
                                      border: OutlineInputBorder(
                                        borderSide: BorderSide.none,
                                      ),
                                      prefixIcon: Icon(Icons.currency_rupee),
                                      hintText: "Enter Tip Amount",
                                      hintStyle: GoogleFonts.montserrat(
                                        color: Color(
                                            0xff555555), // Hint text style
                                      ),
                                    ),
                                    onChanged: (val) {
                                      setState(() {});
                                    },
                                    style: GoogleFonts.montserrat(
                                      fontSize:
                                          16, // Adjust font size for entered text
                                      color: Color(
                                          0xff333333), // Text color for user input
                                    ),

                                    // onSubmitted: (value) {
                                    // int enteredTip = int.tryParse(value) ?? 0;
                                    // setState(() {
                                    //   _selectedTip = enteredTip;
                                    // });
                                    // },
                                    maxLength: 5,
                                    inputFormatters: [
                                      FilteringTextInputFormatter.allow(
                                          RegExp(r'^\d+\.?\d{0,2}')),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // SizedBox(
                          //   height: 16,
                          // ),
                          // TextField(
                          //   controller: _otherTipController,
                          //   keyboardType: TextInputType.number,
                          //   textInputAction: TextInputAction.none,
                          //   // This will prevent the "Done" button
                          //   decoration: InputDecoration(
                          //     filled: true,
                          //     fillColor: Color(0xffF5F5F5),
                          //     border: OutlineInputBorder(
                          //       borderSide: BorderSide.none,
                          //     ),
                          //     prefixIcon: Icon(Icons.currency_rupee),
                          //     hintText: "Enter Tip Amount",
                          //     hintStyle: GoogleFonts.montserrat(
                          //       color: Color(0xff555555),
                          //     ),
                          //   ),
                          //   onSubmitted: (value) {
                          //     int enteredTip = int.tryParse(value) ?? 0;
                          //     setState(() {
                          //       _selectedTip = enteredTip;
                          //     });
                          //   },
                          // ),

                          // SizedBox(height: 20),
                          // Row(
                          //   mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          //   children: [
                          //     _buildTipButton(10),
                          //     _buildTipButton(20),
                          //     _buildTipButton(30),
                          //     _buildTipButton('Other'),
                          //   ],
                          // ),
                          SizedBox(
                            height: 10,
                          ),
                          // if (_selectedTip ==
                          //     null) // Show text field if 'Other' is selected
                          //   //               Padding(
                          //   //               padding: const EdgeInsets.all(16.0),
                          //   //           child:
                          //   //           TextField(
                          //   //             controller: _otherTipController,
                          //   //             keyboardType: TextInputType.number,
                          //   //             onSubmitted: (value) {
                          //   //               int enteredTip = int.tryParse(value) ?? 0;
                          //   //               setState(() {
                          //   //                 _selectedTip = enteredTip;
                          //   //               });
                          //   //             },
                          //   //             decoration: InputDecoration(
                          //   //               prefixIcon: Icon(
                          //   //                 Icons.currency_rupee,
                          //   //                 color: Colors.black,
                          //   //                 size: 25,
                          //   //               ),
                          //   //               hintText: 'Enter Tip Amount',
                          //   //               hintStyle: TextStyle(color: Color(0xff959595)),
                          //   //               enabledBorder: UnderlineInputBorder(
                          //   //                 borderSide: BorderSide(color: Color(0xff26A860)),
                          //   //               ),
                          //   //               focusedBorder: UnderlineInputBorder(
                          //   //                 borderSide: BorderSide(color: Color(0xff26A860), width: 2),
                          //   //               ),
                          //   //             ),
                          //   //           )
                          //   // ,
                          //   //
                          //   //         )

                          //   Divider(
                          //     thickness: 1,
                          //   ),
                          // Padding(
                          //   padding:
                          //   const EdgeInsets.only(top: 10, bottom: 10),
                          //   child: customText(
                          //     text: "Order Type",
                          //     fontWeight: FontWeight.w600,
                          //     fontSize: 18.sp,
                          //   ),
                          // ),
                          // GestureDetector(
                          //   onTap: () {
                          //     if (configController
                          //         .deliveryTypesList.isEmpty) {
                          //       customToast(message: 'No OrderTypes Found');
                          //       return;
                          //     }
                          //   },
                          //   child: DropdownButtonFormField(
                          //     decoration: InputDecoration(
                          //       isDense: true,
                          //       contentPadding: EdgeInsets.symmetric(
                          //           vertical: 10, horizontal: 10),
                          //       border: inputBorderWidget(),
                          //       errorBorder: inputBorderWidget(),
                          //       enabledBorder: inputBorderWidget(),
                          //       focusedBorder: inputBorderWidget(),
                          //       disabledBorder: inputBorderWidget(),
                          //       focusedErrorBorder: inputBorderWidget(),
                          //     ),
                          //     hint: Text('Please Select Order Type'),
                          //     items:
                          //     configController.deliveryTypesList.map((e) {
                          //       return DropdownMenuItem<String>(
                          //         value: e,
                          //         child: Text(e),
                          //       );
                          //     }).toList(),
                          //     onChanged: (value) {
                          //       cartController
                          //           .updateOrderType(value.toString());
                          //       configController.updateOrderType();
                          //       cartController.addAndRemoveDeliveryFeeToCart(
                          //           isRemoveFee: cartController
                          //               .selectedOrderType
                          //               ?.toLowerCase() !=
                          //               'delivery'.toLowerCase());
                          //     },
                          //   ),
                          // ),

                          Container(
                            decoration: BoxDecoration(color: bg),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: EdgeInsets.only(
                                      top: 3.0.w, left: 3.w, right: 3.w),
                                  child: customText(
                                    text: "Bill Details",
                                    fontSize: 0.019.sp,
                                    color: black,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Divider(),
                                Padding(
                                  padding: EdgeInsets.all(3.0.w),
                                  child: Column(
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: customText(
                                              text: 'Sub Total',
                                              fontSize: 0.028.sp,
                                              color: black,
                                            ),
                                          ),
                                          customText(
                                            text:
                                                '${Constants.rupee}${cartController.totadisammount}',
                                            fontSize: 0.028.sp,
                                            color: black.withOpacity(0.4),
                                            decoration:
                                                TextDecoration.lineThrough,
                                          ),
                                          SizedBox(
                                            width: 4,
                                          ),
                                          customText(
                                            text:
                                                '${Constants.rupee}${double.parse(cartController.ammount.value).toStringAsFixed(2)}',
                                            fontSize: 0.28.sp,
                                            color: black,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ],
                                      ),
                                      SizedBox(height: 1.h),
                                      if (_otherTipController.text.isNotEmpty)
                                        Row(
                                          children: [
                                            Expanded(
                                              child: customText(
                                                text: 'Tip',
                                                fontSize: 0.028.sp,
                                                color: black,
                                              ),
                                            ),
                                            // customText(
                                            //   text:
                                            //       '${Constants.rupee}${cartController.totadisammount}',
                                            //   fontSize: 0.028.sp,
                                            //   color: black.withOpacity(0.4),
                                            //   decoration:
                                            //       TextDecoration.lineThrough,
                                            // ),
                                            // SizedBox(
                                            //   width: 4,
                                            // ),
                                            customText(
                                              text: '+${Constants.rupee}${_selectedTip != null ? _selectedTip!.toDouble() // Predefined tip, convert int to double
                                                  : double.tryParse(_otherTipController.text) ?? 0.0}',
                                              fontSize: 0.28.sp,
                                              color: black,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ],
                                        ),
                                      SizedBox(height: 1.h),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: customText(
                                              text: "Delivery Cost",
                                              fontSize: 0.028.sp,
                                              color: black,
                                            ),
                                          ),
                                          customText(
                                            text: (cartController.cart
                                                            ?.DeliveryCharges ??
                                                        0) >
                                                    0
                                                ? "+ ₹${cartController.cart?.DeliveryCharges}"
                                                : "Free Delivery Applied", // Show cost or "Free Delivery"

                                            fontSize: 0.28.sp,
                                            color: black,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ],
                                      ),
                                      SizedBox(height: 1.h),
                                       if ((cartController.cart?.longDistanceFee ?? 0) > 0) ...[
                                         SizedBox(height: 1.h),
                                         Row(
                                           mainAxisAlignment:
                                               MainAxisAlignment.spaceBetween,
                                           children: [
                                             Expanded(
                                               child: Row(
                                                 children: [
                                                   Icon(Icons.directions_bike, size: 16, color: Colors.deepOrange),
                                                   SizedBox(width: 4),
                                                   customText(
                                                     text: "Long Distance Fee",
                                                     fontSize: 0.028.sp,
                                                     color: black,
                                                   ),
                                                 ],
                                               ),
                                             ),
                                             customText(
                                                text: "+ \u20B9${cartController.cart?.longDistanceFee}",
                                               fontSize: 0.28.sp,
                                               color: Colors.deepOrange,
                                               fontWeight: FontWeight.w600,
                                             ),
                                           ],
                                         ),
                                       ],
                                       if (cartController.cart?.largeCartNotice != null && (cartController.cart?.largeCartNotice?.isNotEmpty ?? false)) ...[
                                         SizedBox(height: 1.h),
                                         Container(
                                           padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                           decoration: BoxDecoration(
                                             color: Colors.amber.shade50,
                                             borderRadius: BorderRadius.circular(6),
                                             border: Border.all(color: Colors.amber.shade300),
                                           ),
                                           child: Row(
                                             children: [
                                               Icon(Icons.access_time_filled, size: 16, color: Colors.amber.shade900),
                                               SizedBox(width: 6),
                                               Expanded(
                                                 child: customText(
                                                    text: "${cartController.cart?.largeCartNotice}",
                                                   fontSize: 0.025.sp,
                                                   color: Colors.brown.shade900,
                                                   fontWeight: FontWeight.w500,
                                                 ),
                                               ),
                                             ],
                                           ),
                                         ),
                                       ],

                                      cartController.couponApplied.isTrue
                                          ? Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Expanded(
                                                  child: customText(
                                                    text: "Discount",
                                                    fontSize: 0.028.sp,
                                                    color: black,
                                                  ),
                                                ),
                                                customText(
                                                  text:
                                                      "- ${Constants.rupee}${cartController.discount!.toStringAsFixed(2)}",
                                                  fontSize: 0.28.sp,
                                                  color: black,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ],
                                            )
                                          : Container(),

                                      SizedBox(height: 1.h),
                                      // Wallet Amount Section
                                      isUsedWallet
                                          ? GestureDetector(
                                              onTap: () {
                                                customToast(
                                                    message: getEligibleAmount(
                                                            isDisplayingEligibleAmount:
                                                                true)
                                                        .toString());
                                              },
                                              child: Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment
                                                        .spaceBetween,
                                                children: [
                                                  customText(
                                                    text: "Wallet Amount Used",
                                                    fontSize: 0.028.sp,
                                                    color: black,
                                                  ),
                                                  customText(
                                                    text:
                                                        "- ${Constants.rupee}${getEligibleAmount(isDisplayingEligibleAmount: true)}",
                                                    fontSize: 0.28.sp,
                                                    color: black,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ],
                                              ),
                                            )
                                          : Container(),
                                    ],
                                  ),
                                ),
                                CustomPaint(
                                  size: Size(
                                      double.infinity, 1), // width and height
                                  painter: DashedLinePainter(
                                    color: Colors.grey,
                                    dashWidth: 5,
                                    dashSpace: 3,
                                  ),
                                ),
                                Padding(
                                  padding: EdgeInsets.only(
                                      top: 3.w,
                                      right: 3.w,
                                      left: 3.w,
                                      bottom: 3.w),
                                  child: Row(children: [
                                    Expanded(
                                      child: customText(
                                        text: "Total",
                                        fontSize: 16.sp,
                                        color: black,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    Builder(
                                      builder: (context) {
                                        double totalValue = double.tryParse(
                                                cartController
                                                    .totalAmmount.value) ??
                                            0.0;
                                        double tipAmount = double.tryParse(
                                                _otherTipController.text
                                                    .trim()) ??
                                            0.0;

                                        double walletAmountUsed = cartController
                                            .walletAmountUsed.value;
                                        double? delivery = cartController
                                                .cart?.DeliveryCharges ??
                                            0.0;

                                        finalTotal =
                                            totalValue + tipAmount + delivery;

                                        print(totalValue);
                                        print(tipAmount);
                                        print(delivery);
                                        print(
                                            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

                                        return customText(
                                          text:
                                              "${Constants.rupee}${finalTotal!.toStringAsFixed(2)}",
                                          fontSize: 16
                                              .sp, // Or 14.sp depending on design
                                          color: green,
                                          fontWeight: FontWeight.w600,
                                          overflow: TextOverflow.ellipsis,
                                        );
                                      },
                                    ),
                                  ]),
                                )
                              ],
                            ),
                          ),

                          DeliverySlotWidget(
                            onSlotChanged: (slotInfo) {
                              setState(() {
                                _scheduledSlotInfo = slotInfo;
                              });
                            },
                          ),

                          // orderSummary(
                          //   totalItems: cartController.quantity,
                          //   subtotal: cartController.ammount,
                          //   totaldiscount: cartController.totadisammount,
                          //   delivery: cartController.cart?.DeliveryCharges,
                          //   // double.parse(cartController.ammount.value != ''
                          //   //                 ? cartController.ammount.value
                          //   //                 : '0') >
                          //   //         configController
                          //   //             .freeDeliveryCartPrice.value
                          //   //     ? 'Free'
                          //   //     : configController.deliveryFee
                          //   //         .toStringAsFixed(0),
                          //   discount: cartController.discount,
                          //   total: cartController.totalAmmount,
                          //   tipAmount: _selectedTip != null
                          //       ? _selectedTip!
                          //           .toDouble() // Predefined tip, convert int to double
                          //       : double.tryParse(_otherTipController.text) ??
                          //           0.0,
                          // ),

                          // deliveryInstructionsWidget(),
                          // paymentWidget(),
                        ],
                      ),
                    ),
          bottomNavigationBar: cartController.cartItems.isEmpty ||
                  cartController.cart?.cartId == null
              ? const SizedBox.shrink()
              : timingController.timingResponse.value.status == 0
                  ? buildStoreStatusWidget()
                  : Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        GestureDetector(
                          onTap: () async {
                            couponCode.clear();
                            cartController.updateCoupon();
                            isUsedWallet = false;
                            await Future.delayed(Duration.zero);
                            walletController.updateUI();
                            cartController.addWallet(
                                value: 0.0, isRemoveFee: true);
// Clear the coupon code input field
                            cartController.couponApplied.value =
                                false; // Mark coupon as not applied

                            adressController.getAdresses(context: context);
                            cartController.youmayLikeProducts(context: context);
                            configController.getConfig(context: context);
                            walletController.getWallet(context: context);
                            // cartController.getCart(context: context),
                            cartController.getCart(
                                context: context,
                                longitude: homeController.longitude,
                                latitude: homeController.latitude);
                            Get.to(() => ManageAddress(
                                  isFromCartScreen: true,
                                ));
                          },
                          child: Container(
                            height: 60,
                            decoration: BoxDecoration(
                                borderRadius: BorderRadius.vertical(
                                  top: Radius.circular(5),
                                ),
                                color: Color(0xFFFBFBFB)),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 10,
                                ),
                                Image.asset(
                                  'Assets/Images/Homepage/location2.png',
                                  height: 25,
                                  width: 25,
                                ),
                                SizedBox(
                                  width: 10,
                                ),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      customText(
                                        text: "Delivery Address",
                                        fontSize: 16.sp,
                                        fontWeight: FontWeight.w700,
                                      ),
                                      RichText(
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        text: TextSpan(
                                          children: [
                                            TextSpan(
                                              text:
                                                  "${homeController.addresstype}",
                                              style: GoogleFonts.poppins(
                                                fontSize: 13.sp,
                                                color: Colors
                                                    .black, // you can customize color
                                                fontWeight:
                                                    FontWeight.bold, // optional
                                              ),
                                            ),
                                            TextSpan(
                                              text:
                                                  " - ${homeController.selectedAddress}",
                                              style: TextStyle(
                                                fontSize: 13.sp,
                                                color: Colors.grey
                                                    .shade700, // different color for address
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      )
                                    ],
                                  ),
                                ),
                                SizedBox(
                                  width: 5,
                                ),
                                Container(
                                  decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(5),
                                      color: Colors.green.withOpacity(0.03),
                                      border: Border.all(color: Colors.green)),
                                  child: Padding(
                                    padding: const EdgeInsets.all(5.0),
                                    child: customText(
                                      text: "Change",
                                      fontSize: 11.sp,
                                      color: Colors.green,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                SizedBox(
                                  width: 5,
                                ),
                              ],
                            ),
                          ),
                        ),
                        Container(
                          height: 75,
                          padding: EdgeInsets.fromLTRB(5.w, 10, 5.w, 20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            // boxShadow: [
                            //   BoxShadow(
                            //     color: Colors.black12,
                            //     blurRadius: 8,
                            //     offset: Offset(0, -2),
                            //   ),
                            // ],
                          ),
                          child: Obx(() {
                            if (timingController.timingResponse.value.status !=
                                    0 &&
                                ordersController.isPaymentLoading.isTrue) {
                              return const Center(
                                  child: CircularProgressIndicator.adaptive());
                            }

                            // if (timingController.timingResponse.value.status == 0) {
                            //   return buildStoreStatusWidget();
                            // }

                            return Row(
                              children: [
                                Expanded(
                                  child: SizedBox(
                                    height: 50,
                                    child: ElevatedButton(
                                      onPressed: () async {
                                        retriveToken();
                                        if (timingController
                                                .timingResponse.value.status ==
                                            0) {
                                          customToast(
                                              message: timingController
                                                  .timingResponse
                                                  .value
                                                  .message);
                                          return;
                                        }

                                        if (homeController
                                            .selectedLocation.value.isEmpty) {
                                          customToast(
                                              message:
                                                  'Please Select Delivery Address');
                                          return;
                                        }

                                        // Authoritative serviceability validation before proceeding to checkout
                                        final double lat = homeController.latitude.value;
                                        final double lng = homeController.longitude.value;
                                        if (lat != 0.0 && lng != 0.0) {
                                          try {
                                            final serviceCheck = await AdresseServices.checkServiceabilityApi(
                                              latitude: lat,
                                              longitude: lng,
                                            );
                                            if (serviceCheck != null && serviceCheck['IsServiceable'] == false) {
                                              Get.to(() => UnsupportedLocationScreen(
                                                    addressSummary: homeController.selectedAddress.value,
                                                    distanceKm: serviceCheck['DistanceKm'] != null
                                                        ? double.tryParse(serviceCheck['DistanceKm'].toString())
                                                        : null,
                                                    isFromCart: true,
                                                  ));
                                              return;
                                            }
                                          } catch (e) {
                                            // Fallback: network error check
                                            debugPrint("Serviceability check error: $e");
                                          }
                                        }

                                        FocusManager.instance.primaryFocus
                                            ?.unfocus();
                                        bottomSheet().then((value) async {
                                          if (value != null) {
                                            if (!configController
                                                .isCheckMinAmount(
                                                    grandTotal: double.parse(
                                                        cartController
                                                            .totalAmmount
                                                            .value))) {
                                              return;
                                            }

                                            var paymentType = value;
                                            if (value == 'cash') {
                                              paymentType = 'COD';
                                              createOrderBody(paymentType);
                                            } else {
                                              paymentType = 'ONLINE';
                                              Map<String, dynamic> body = {
                                                'OrderAmount': finalTotal
                                                        ?.toStringAsFixed(2) ??
                                                    '0.00'
                                              };
                                              ordersController.updateContext(
                                                  {'Context': context});
                                              createOrderBody(paymentType,
                                                  body: body);
                                            }
                                          }
                                        });
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: primary,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(26),
                                        ),
                                      ),
                                      child: Text(
                                        'Place Order',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 18.sp,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Container(
                                  height: 50,
                                  width: 50,
                                  decoration: BoxDecoration(
                                    border: Border.all(color: primary),
                                    borderRadius: BorderRadius.circular(26),
                                  ),
                                  child: IconButton(
                                    icon: Icon(Icons.home, color: primary),
                                    onPressed: () {
                                      // homeController.updateTabIndex(0);
                                      Navigator.pushAndRemoveUntil(
                                          context,
                                          MaterialPageRoute(
                                              builder: (context) => Homepage()),
                                          (context) => false);
                                    },
                                  ),
                                ),
                              ],
                            );
                          }),
                        ),
                      ],
                    ),
        ),
      ),
    );
  }

  Widget buildStoreStatusWidget() {
    final status = timingController.timingResponse.value.status;
    final message = timingController.timingResponse.value.message;

    if (status != 0) return SizedBox(); // Store is open, show nothing

    String title = '';
    String imagePath = '';

    if (message == "We're not available now") {
      title = "We'll Be Back Shortly!";
      imagePath = "Assets/Images/Homepage/unservice.png";
    } else if (message == "We're closed now") {
      title = "We are closed now";
      imagePath = "Assets/Images/Homepage/closed.png";
    } else {
      return SizedBox();
    }

    return Container(
      height: 100,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          // colors: [
          //   Color(0xFF4CAF50), // Light green
          //   Color(0xFF2E7D32), // Dark green
          // ],
          colors: [
            Color(0xFFEDFFB2),
            Color(0xFFEDFFB2),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 8, top: 10),
        child: Row(
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        color: Appprimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "You can still add items and\norder when the store re-opens",
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: Color(0xFF014605),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Image.asset(imagePath, height: 100, width: 120),
            const SizedBox(width: 10),
          ],
        ),
      ),
    );
  }

  // double getEligibleAmount({bool isDisplayingEligibleAmount = false}) {
  //   double walletAmount = walletController.walletModel?.walletAmount ?? 0;
  //   double minUsedAmount = configController.minWalletAmount.value;
  //   double deliveryFeeAmount = cartController.deliveryFee.value;
  //   double minCartAmount = configController.minCartAmount.value;
  //   double discountAmount = cartController.discount ?? 0;
  //   double subTotal = double.parse(cartController.ammount.value);
  //   double totalCartAmount = (subTotal + deliveryFeeAmount) - discountAmount;

  //   if (walletAmount >= minUsedAmount) {
  //     if (isDisplayingEligibleAmount) {
  //       if (totalCartAmount <= minUsedAmount) {
  //         return totalCartAmount;
  //       }
  //     }
  //     autoSetWallet(
  //         totalCartAmount: totalCartAmount,
  //         minCartAmount: minCartAmount,
  //         eligibleValue: minUsedAmount);
  //     return minUsedAmount;
  //   }

  //   autoSetWallet(
  //       totalCartAmount: totalCartAmount,
  //       minCartAmount: minCartAmount,
  //       eligibleValue: walletAmount);
  //   return walletAmount;
  // }

  double getEligibleAmount({bool isDisplayingEligibleAmount = false}) {
    double walletAmount = walletController.walletModel?.walletAmount ?? 0;
    double minUsedAmount = configController.minWalletAmount.value;
    double deliveryFeeAmount = cartController.deliveryFee.value;
    double minCartAmount = configController.minCartAmount.value;
    double discountAmount = cartController.discount ?? 0;
    double subTotal = double.parse(cartController.ammount.value);
    double totalCartAmount = (subTotal + deliveryFeeAmount) - discountAmount;

    if (walletAmount >= minUsedAmount) {
      if (isDisplayingEligibleAmount && totalCartAmount <= minUsedAmount) {
        return totalCartAmount;
      }
      print(minCartAmount);
      if (totalCartAmount >= minCartAmount) {
        // Cart is eligible for full wallet usage (up to cart amount or wallet balance)
        double maxUsableWallet =
            totalCartAmount > walletAmount ? walletAmount : totalCartAmount;

        autoSetWallet(
          totalCartAmount: totalCartAmount,
          minCartAmount: minCartAmount,
          eligibleValue: maxUsableWallet,
        );
        return maxUsableWallet;
      } else {
        // Cart is too small, return just minimum allowed wallet use
        autoSetWallet(
          totalCartAmount: totalCartAmount,
          minCartAmount: minCartAmount,
          eligibleValue: minUsedAmount,
        );
        return minUsedAmount;
      }
    }

    // Wallet has less than minimum allowed balance
    autoSetWallet(
      totalCartAmount: totalCartAmount,
      minCartAmount: minCartAmount,
      eligibleValue: walletAmount,
    );
    return walletAmount;
  }

  void autoSetWallet({
    required double totalCartAmount,
    required double minCartAmount,
    required double eligibleValue,
  }) async {
    if (isUsedWallet) {
      if (totalCartAmount < minCartAmount) {
        isUsedWallet = false;
        await Future.delayed(Duration.zero);
        walletController.updateUI();
        cartController.addWallet(value: eligibleValue, isRemoveFee: true);
      }
    }
  }

  createOrderBody(String paymentType, {Map? body}) async {
    print(cartController.cart?.Distance);
    print("DISSSSSSS");
    Map<dynamic, dynamic> moneyBody = {};

    moneyBody['TipAmount'] =
        _otherTipController.text.isEmpty ? 0 : _otherTipController.text;
    moneyBody['SubTotal'] = cartController.ammount.value;
    if (cartController.discount != null) {
      moneyBody['PromoCode'] = cartController.couponCode;
      moneyBody['PromoAmount'] = cartController.discount;
    }
    if (cartController.discountAmmount.value != '') {
      moneyBody['Discount'] = cartController.discountAmmount.value;
    }
    moneyBody['WalletAmount'] = isUsedWallet ? getEligibleAmount() : 0;

    // if (isUsedWallet == true) {
    //   moneyBody['WalletAmount'] = isUsedWallet ? getEligibleAmount() : 0;
    // }
    if (cartController.deliveryInstructions.isNotEmpty) {
      moneyBody['DeliveryInstructions'] =
          cartController.deliveryInstructions.toSet().toList();
    }

    // moneyBody['TaxAmount'] = 0;
    moneyBody['OrderType'] = cartController.selectedOrderType;
    moneyBody['DeliverCharges'] = cartController.cart?.DeliveryCharges;
    moneyBody['Distance'] = cartController.cart?.Distance;

    if (_scheduledSlotInfo != null && _scheduledSlotInfo!.isScheduled) {
      moneyBody['ScheduleStatus'] = 'Scheduled';
      moneyBody['ScheduledDateTime'] =
          _scheduledSlotInfo!.formattedScheduledDateTime;
    } else {
      moneyBody['ScheduleStatus'] = 'Immediate';
    }

    // if (cartController.selectedOrderType?.toLowerCase() ==
    //     'delivery'.toLowerCase()) {
    //   moneyBody['DeliverCharges'] = double.parse(
    //               cartController.ammount.value != ''
    //                   ? cartController.ammount.value
    //                   : '0') >
    //           configController.freeDeliveryCartPrice.value
    //       ? 'Free'
    //       : configController.deliveryFee.toStringAsFixed(0);
    // } else {
    //   moneyBody['DeliverCharges'] = 0;
    // }
    // moneyBody['DeliverCharges'] = configController.deliveryFee.value == 0
    //     ? 'Free'
    //     : configController.deliveryFee.value.toStringAsFixed(0);
    moneyBody['GrandTotal'] = finalTotal;
    moneyBody['PaymentMethod'] = paymentType;
    moneyBody['username'] = "${Get.find<ProfileController>().users?.firstName}";
    // "${Get.find<ProfileController>().users?.firstName} ${Get.find<ProfileController>().users?.lastName}";
    if (body != null) {
      moneyBody.addAll(body);
    }

    ordersController.fetchAdress(
        adressController.address, adressController.selectedAdressId.value);
    ordersController.fetchMoneyForOrder(moneyBody);
    ordersController.fetchCart(
        cartController.cart,
        context,
        adressController.address.first.latitude,
        adressController.address.first.longitude);

    ordersController.callCreateApi(
        context: context,
        isPaymentTypecod: paymentType == 'COD' ? true : false);
  }

  Future cartDeleteAlert() {
    return showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text('Delete Cart',
                    style: GoogleFonts.outfit(
                        color: Color(0xff1C1C1C),
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w500)),
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 2.h),
                  child: Text('Are You Sure, You Want To Delete Cart ??',
                      style: GoogleFonts.outfit(
                          color: Color(0xff707070),
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w400)),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SizedBox(
                      width: 1,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        SizedBox(
                          width: 1,
                        ),
                        SizedBox(
                          width: 25.w, // Set your desired width here
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor:
                                  Colors.white, // No background color
                              side: BorderSide(
                                  color: primary,
                                  width: 1.0), // Black border with width
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                    5), // Rectangular shape with slight rounding
                              ),
                              padding: EdgeInsets.symmetric(
                                  vertical: 12), // Padding for button height
                            ),
                            onPressed: () async {
                              Navigator.pop(context, true);
                            },
                            child: Text(
                              "Yes",
                              style: GoogleFonts.poppins(
                                  color: primary,
                                  fontSize: 16,
                                  fontWeight:
                                      FontWeight.w600), // White text color
                            ),
                          ),
                        ),
                        SizedBox(
                          width: 5.w,
                        ),
                        SizedBox(
                          width: 25.w, // Set your desired width here
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primary, // No background color
                              side: BorderSide(
                                  color: primary,
                                  width: 1.0), // Black border with width
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                    5), // Rectangular shape with slight rounding
                              ),
                              padding: EdgeInsets.symmetric(
                                  vertical: 12), // Padding for button height
                            ),
                            onPressed: () async {
                              Navigator.pop(context, false);
                            },
                            child: Text(
                              "No",
                              style: GoogleFonts.poppins(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight:
                                      FontWeight.w600), // White text color
                            ),
                          ),
                        ),
                        SizedBox(
                          width: 1,
                        ),
                      ],
                    ),

                    // ElevatedButton(
                    //     onPressed: () async {
                    //       Navigator.pop(context, true);
                    //     },
                    //     child: Text("Yes")),
                    // SizedBox(
                    //   width: 1,
                    // ),
                    // ElevatedButton(
                    //     onPressed: () {
                    //       Navigator.pop(context);
                    //     },
                    //     child: Text("No")),
                    SizedBox(
                      width: 1,
                    ),
                  ],
                )

                // Row(
                //   children: [
                //     Flexible(
                //         child: buttonWidget(
                //             onTap: () {
                //               Navigator.pop(context, true);
                //             },
                //             context: context,
                //             text: 'Yes')),
                //     SizedBox(
                //       width: 10,
                //     ),
                //     Flexible(
                //         child: buttonWidget(
                //             onTap: () {
                //               Navigator.pop(context, false);
                //             },
                //             context: context,
                //             text: 'No',
                //             buttonColor: white,
                //             borderColor: black,
                //             textColor: black)),
                //   ],
                // )
              ],
            ),
          );
        });
      },
    );
  }

  Widget addressButton() {
    return FittedBox(
      child: iconbuttonWidget(
          context: context,
          width: 40.w,
          textColor: green,
          buttonColor: white,
          borderColor: green,
          text: "Add Address",
          onTap: () {},
          icon: Icon(
            Icons.add,
            color: green,
            size: 3.h,
          )),
    );
  }

  Widget cartItems() {
    return ListView.builder(
      itemCount: cartController.cartItems.length,
      shrinkWrap: true,
      padding: EdgeInsets.zero,
      controller: scrollController,
      itemBuilder: (context, index) {
        var cart = cartController.cartItems[index];
        double percent = 0;
        if (cart.price != null) {
          percent = (cart.price! - cart.offerPrice!) / cart.price! * 100;
        }
        return CartTileWidget(
          context: context,
          onproductTap: () {
            Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => cart.type == 1
                        ? ItemDescription(
                            title: cart.productName ?? '',
                            id: cart.productId ?? 0,
                            percent: percent,
                          )
                        : ComboDescription(kitId: cart.kitId ?? 0)));
          },
          itemimage: cart.productImages ?? [],
          item_name: cart.productName ?? '',
          combo: cart.kitItems?.length.toString() ?? '',
          isCombo: cart.kitId != 0 ? true : false,
          quantity: cart.quantity.toString(),
          decrement: () {
            couponCode.clear();
            cartController.updateCoupon();
// Clear the coupon code input field
            cartController.couponApplied.value =
                false; // Mark coupon as not applied
            quantityAdd(addOrRemove: false, cart: cart);
          },
          increment: () {
            couponCode.clear();
            cartController.updateCoupon();
            cartController.couponApplied.value =
                false; // Mark coupon as not applied

            quantityAdd(addOrRemove: true, cart: cart);
          },
          weight: ['${cart.metricvalue} ${cart.metrictype}'],
          item_price: cart.offerPrice.toString(),
          item_OriginalPrice: cart.price.toString(),
          discount: percent.toString(),
          onTapRemoveItem: () {
            couponCode.clear();
            cartController.updateCoupon();
            cartController.couponApplied.value =
                false; // Mark coupon as not applied

            // couponCode.clear();
            cartController.deleteItemFromCart(
                context: context,
                isFromCartScreen: true,
                isThroughProducts: widget.throughProductScreen,
                isThroughProductsDetails: widget.throughDescriptionScreen,
                removeToast: true,
                productId: cart.productId ?? 0,
                variantId: cart.variantId ?? 0);
          },
        );
      },
    );
  }

  quantityAdd(
      {required bool addOrRemove,
      bool isToastRemove = true,
      required CartItem cart}) {
    quantity = cart.quantity ?? 0;

    // if (addOrRemove) {
    //   quantity++;
    // } else {
    //   if (quantity > 0) {
    //     quantity--;
    //   }
    // }

    int maxQty = cart.maxQty ?? 0;
    int availableQantity = cart.availableQty ?? 0;
    // if(availableQantity<maxQty){
    //   customToast(message: 'Quantity not available ');
    //
    // }else{
    if (quantity < availableQantity || addOrRemove == false) {
      if (addOrRemove) {
        if (quantity < availableQantity && quantity < maxQty) {
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
      cartController
          .updateQuantity(
              productId: cart.productId ?? 0,
              variantId: cart.variantId ?? 0,
              kitId: cart.type == 1 ? 0 : cart.kitId ?? 0,
              quantity: quantity,
              isFromCartScreen: true,
              isFromProductsScreen: widget.throughSearchScreen ? false : true,
              isFromSearchScreen: widget.throughSearchScreen ? true : false,
              isFromCombodescriptionScreen: cart.type == 2 ? true : false,
              isFromComboScreen: cart.type == 2 ? true : false,
              removeToast: isToastRemove,
              isThroughDescriptionScreen: widget.throughDescriptionScreen,
              isThroughProductsScreen: widget.throughProductScreen,
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
    } else {
      customToast(message: 'Quantity not available');
      // }
    }
  }

  Future bottomSheet() {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(8.0),
          child: StatefulBuilder(
            builder: (context, setState) {
              return Container(
                decoration: BoxDecoration(
                    color: bg, borderRadius: BorderRadius.circular(20)),
                padding: EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            "Select Payment Method",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.close),
                          onPressed: () => Navigator.pop(context),
                        )
                      ],
                    ),
                    SizedBox(height: 16),
                    Row(
                      children: [
                        // Cash on Delivery
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                selectedPayment = 'cash';
                              });
                            },
                            child: Container(
                              padding: EdgeInsets.symmetric(vertical: 20),
                              decoration: BoxDecoration(
                                color: selectedPayment == 'cash'
                                    ? Color(0xFFE6FFF2)
                                    : Colors.white,
                                border: Border.all(
                                  color: selectedPayment == 'cash'
                                      ? Colors.green
                                      : Colors.grey.shade300,
                                  width: selectedPayment == 'cash' ? 2 : 1,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Image.asset(
                                    "Assets/Images/Homepage/cash.png",
                                    height: 40,
                                  ),
                                  // Text(
                                  //   Constants.rupee,
                                  //   style: GoogleFonts.poppins(
                                  //     fontSize: 26,
                                  //     fontWeight: FontWeight.w600,
                                  //     color: selectedPayment == 'cash'
                                  //         ? Colors.green
                                  //         : Colors.grey,
                                  //   ),
                                  // ),
                                  // Icon(Icons.attach_money,
                                  //     color: Colors.green, size: 36),
                                  SizedBox(height: 8),
                                  customText(
                                    text: "Cash On Delivery",
                                    textAlign: TextAlign.center,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: 16),
                        // Pay Online
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                selectedPayment = 'online';
                              });
                            },
                            child: Container(
                              padding: EdgeInsets.symmetric(vertical: 20),
                              decoration: BoxDecoration(
                                color: selectedPayment == 'online'
                                    ? Color(0xFF3F51B5)
                                    : Colors.white,
                                border: Border.all(
                                  color: selectedPayment == 'online'
                                      ? Color(0xFF3F51B5)
                                      : Colors.grey.shade300,
                                  width: selectedPayment == 'online' ? 2 : 1,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Image.asset(
                                    "Assets/Images/Homepage/online.png",
                                    height: 40,
                                  ),
                                  // Icon(Icons.credit_card,
                                  //     color: selectedPayment == 'online'
                                  //         ? Colors.white
                                  //         : Colors.black54,
                                  //     size: 36),
                                  SizedBox(height: 8),
                                  Text(
                                    "Pay Online",
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: selectedPayment == 'online'
                                          ? Colors.white
                                          : Colors.black,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 24),
                    Obx(() => ordersController.isPaymentLoading.isTrue
                        ? CustomLoader()
                        : SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () {
                                retriveToken();
                                if (timingController
                                        .timingResponse.value.status ==
                                    0) {
                                  customToast(
                                      message: timingController
                                          .timingResponse.value.message);
                                } else if (timingController
                                        .timingResponse.value.status ==
                                    1) {
                                  Navigator.pop(context, selectedPayment);
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                padding: EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(26),
                                ),
                                backgroundColor: Colors.green,
                              ),
                              child: Text(
                                "Proceed",
                                style: TextStyle(
                                  fontSize: 16,
                                  color: bg,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          )),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget suggestIemsWidget() {
    return cartController.youmayLikeLoading.isTrue
        ? CustomLoader()
        : cartController.youmayLikeproductsList.isEmpty
            ? Container()
            : Container(
                padding: EdgeInsets.only(top: 3.h, bottom: 3.h),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    customText(
                      text: "You May Like It",
                      fontSize: 18.sp,
                      fontWeight: FontWeight.w600,
                    ),
                    SizedBox(
                      height: 2.h,
                    ),
                    SizedBox(
                      height: 29.h,
                      child: ListView.builder(
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        itemCount: cartController.youmayLikeproductsList.length,
                        scrollDirection: Axis.horizontal,
                        physics: BouncingScrollPhysics(),
                        itemBuilder: (context, index) {
                          var products =
                              cartController.youmayLikeproductsList[index];
                          return itemDetails(products);
                        },
                      ),
                    ),
                  ],
                ),
              );
  }

  Widget itemDetails(Product products) {
    double discount = 0;
    if (products.productVariants != null) {
      var varient = products.productVariants?.first;
      discount = discountCalculate(varient!.price!, varient.offerPrice!);
    }
    return InkWell(
      onTap: () {
        Get.to(() => ItemDescription(
              id: products.productId ?? 0,
              title: products.productName ?? '',
              percent: discount,
            ));
        // Navigator.push(
        //     context,
        //     MaterialPageRoute(
        //         builder: (_) => ItemDescription(
        //               title: products.productName ?? '',
        //               id: products.productId ?? 0,
        //               percent: discount,
        //             )));
      },
      child: Stack(
        alignment: Alignment.topLeft,
        children: [
          Container(
            width: 45.w,
            margin: EdgeInsets.only(right: 12),
            padding: EdgeInsets.symmetric(horizontal: 7),
            decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(1.h),
                color: white,
                border: Border.all(color: black.withOpacity(0.1), width: 2)),
            clipBehavior: Clip.antiAliasWithSaveLayer,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Flexible(
                  child: Container(
                    alignment: Alignment.center,
                    child: CustomNetworkImage(
                      url: products.imageUrl ?? '',
                      width: 25.w,
                      height: 25.w,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: customText(
                    text: products.productName ?? '',
                    color: tColor,
                    fontSize: 12,
                    maxLines: 1,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                products.productVariants!.length > 1
                    ? GestureDetector(
                        onTap: () {},
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                                '${products.productVariants!.first.metricvalue} ${products.productVariants!.first.metrictype}',
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
                      )
                    : Container(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          "${products.productVariants!.first.metricvalue} ${products.productVariants!.first.metrictype}",
                          style: customTextstyle(
                            fontSize: 13.sp,
                            color: ordersPrimaryColor.withOpacity(0.6),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 5),
                          child: Text(
                              '₹${products.productVariants?.first.offerPrice?.toStringAsFixed(2) ?? ''}',
                              style: robotocustomTextstyle(
                                fontSize: 16.sp,
                                color: tColor,
                                fontWeight: FontWeight.w600,
                              )),
                        ),
                        Text(
                            '₹${products.productVariants?.first.price?.toStringAsFixed(2) ?? ''}',
                            style: robotocustomTextstyle(
                                fontSize: 13.sp,
                                color: tColor.withOpacity(0.5),
                                fontWeight: FontWeight.w600,
                                textDecoration: TextDecoration.lineThrough)),
                      ],
                    ),
                    // Padding(
                    //   padding: const EdgeInsets.only(top: 10),
                    //   child: buttonWidget(
                    //       width: 5.w,
                    //       height: 4.h,
                    //       borderRadius: 0.5.h,
                    //       onTap: () {
                    //         Navigator.push(
                    //             context,
                    //             MaterialPageRoute(
                    //                 builder: (_) => ItemDescription(
                    //                     title: products.productName ?? '',
                    //                     id: products.productId ?? 0)));
                    //       },
                    //       context: context,
                    //       borderColor: primary,
                    //       buttonColor: white,
                    //       borderWidth: 1.6,
                    //       textColor: primary,
                    //       fontSize: 13.sp,
                    //       text: "Add"),
                    // )
                  ],
                ),
                SizedBox(
                  height: 5,
                )
              ],
            ),
          ),
          Positioned(
              top: 6,
              left: 6,
              child: itemTile.discountWidget(
                  context: context, discount: discount)),
        ],
      ),
    );
  }

  final TextEditingController _couponController = TextEditingController();

  Widget couponWidget() {
    return Column(
      children: [
        GetBuilder<CartController>(
          id: 'update-promo',
          builder: (controller) => Row(
            children: [
              SizedBox(
                width: 10,
              ),
              if (cartController.couponApplied.isFalse) ...[
                // Expanded(
                //   child: Container(
                //     height: 50,
                //     decoration:
                //         BoxDecoration(borderRadius: BorderRadius.circular(10)),
                //     child: TextField(
                //       controller: couponCode,
                //       textAlign: TextAlign.left,
                //       decoration: InputDecoration(
                //         suffixIcon: GestureDetector(
                //             onTap: () async {
                // final selectedCoupon = await Navigator.push(
                //   context,
                //   MaterialPageRoute(
                //       builder: (context) => Offers()),
                // );

                //               if (selectedCoupon != null) {
                //                 couponCode.text = selectedCoupon;
                //                 cartController.updatePromoUI();
                //               }
                //             },
                //             child: Icon(Icons.sell)),
                //         filled: true,
                //         fillColor: Color(0xffF5F5F5),
                //         border: OutlineInputBorder(
                //           borderSide: BorderSide.none,
                //         ),
                //         hintText: 'Apply Coupon Code',
                //         hintStyle: GoogleFonts.montserrat(
                //           color: Color(0xff555555),
                //         ),
                //       ),
                //       onChanged: (p0) {
                //         if (p0.isNotEmpty) {
                //           cartController.updatePromoUI();
                //         }
                //       },
                //     ),
                //   ),
                // ),
                SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      double subTotal = 0.0;
//                         print("Initial SubTotal: $subTotal");

                      for (var item in cartController.cartItems) {
                        if (item.categoryId != 3) {
                          // Multiply price by quantity for each item
                          subTotal += (item.offerPrice ?? 0.0) *
                              (item.quantity ??
                                  1); // Ensure quantity is accounted for
                        }
                        print("Updated SubTotal: $subTotal");
                      }
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => Offers(
                                  tip: _otherTipController.text.isNotEmpty
                                      ? _otherTipController.text
                                      : "0",
                                  subtotal: subTotal.toString(),
                                )),
                      );
                    },
                    child: Padding(
                      padding: EdgeInsets.only(top: 3.0.w, bottom: 3.w),
                      child: Row(
                        children: [
                          Icon(
                            Icons.local_activity,
                            color: Appprimary,
                          ),
                          SizedBox(width: 10),
                          Expanded(
                              child: customText(
                            text: "Available Coupon",
                            fontSize: 16.sp,
                            color: black,
                            fontWeight: FontWeight.w600,
                          )),
                          Icon(
                            Icons.arrow_forward_ios,
                            color: black,
                            size: 14,
                          )
                        ],
                      ),
                    ),
                  ),
                ),
//                 Container(
//                   height: 40,
//                   child: ElevatedButton(
//                     style: ElevatedButton.styleFrom(
//                       backgroundColor: Colors.white,
//                       foregroundColor: Colors.black,
//                       side: BorderSide(color: primary),
//                       shape: RoundedRectangleBorder(
//                         borderRadius: BorderRadius.circular(10),
//                       ),
//                     ),
//                     onPressed: () {
//                       if (!couponCode.text.isEmpty) {
//                         // Show a message if the TextField is empty
//                         // ScaffoldMessenger.of(context).showSnackBar(
//                         //   SnackBar(
//                         //     content: Text('Please enter a coupon code.'),
//                         //     backgroundColor: Colors.red,
//                         //   ),
//                         // );
//                         customToast(message: 'Please enter a coupon code');
//                       } else {
//                         double subTotal = 0.0;
// //                         print("Initial SubTotal: $subTotal");

//                         for (var item in cartController.cartItems) {
//                           if (item.categoryId != 3) {
//                             // Multiply price by quantity for each item
//                             subTotal += (item.offerPrice ?? 0.0) *
//                                 (item.quantity ??
//                                     1); // Ensure quantity is accounted for
//                           }
//                           print("Updated SubTotal: $subTotal");
//                         }
                // Navigator.push(
                //   context,
                //   MaterialPageRoute(
                //       builder: (context) => Offers(
                //             tip: _otherTipController.text.isNotEmpty
                //                 ? _otherTipController.text
                //                 : "0",
                //             subtotal: subTotal.toString(),
                //           )),
                // );

//                         // Apply the coupon code
// // Apply the coupon code
// //                         WidgetsBinding.instance.focusManager.primaryFocus
// //                             ?.unfocus();

// // // Calculate subtotal excluding categoryId 3

// //                         Map<String, dynamic> body = <String, dynamic>{};
// //                         body['PromoCode'] = couponCode.text;
//                         // body['TipAmount'] = _otherTipController.text.isNotEmpty
//                         //     ? _otherTipController.text
//                         //     : "0"; // Handle empty tip amounts
// //                         body['SubTotal'] = subTotal; // Use the correct subtotal

// //                         print("Final SubTotal Sent: $subTotal");

// // // Check the request payload before sending
// //                         print("Request Payload:");
// //                         print("Promo Code: ${couponCode.text}");
// //                         print(
// //                             "Tip Amount: ${_otherTipController.text.isNotEmpty ? _otherTipController.text : "0"}");
// //                         print("SubTotal: $subTotal");

// //                         cartController.validatePromo(
// //                             context: context, body: body);

// // // Debug: Check if validatePromo is called and the data passed
// //                         print("Promo Code: ${couponCode.text}");
// //                         print("Tip Amount: ${_otherTipController.text}");
// //                         print("SubTotal: $subTotal");
//                       }
//                       // Apply the coupon code
//                       //                     WidgetsBinding.instance.focusManager.primaryFocus
//                       //                         ?.unfocus();

//                       //                         // print(cartController.cartItems)

//                       //                          // Calculate subtotal excluding categoryID 3
//                       // double subTotal = 0.0;
//                       // print(subTotal);
//                       // for (var item in cartController.cartItems) {
//                       //   if (item.categoryId != 3) {

//                       //     subTotal += item.offerPrice ?? 0.0; // Adjust based on your item model
//                       //   }
//                       //    print("==============> $subTotal <=======================" );
//                       // }

//                       // Map<String, dynamic> body = <String, dynamic>{};
//                       // body['PromoCode'] = couponCode.text;
//                       // body['TipAmount'] = _otherTipController.text;

//                       // body['SubTotal'] =
//                       // subTotal;
//                       //     // double.parse(controller.ammount.value);

//                       //     print("===========?" +controller.ammount.value );

//                       // cartController.validatePromo(
//                       //     context: context, body: body);
//                       //                   }
//                     },
//                     child: customText(
//                       text: "Apply",
//                       textAlign: TextAlign.center,
//                       color: primary,
//                       fontSize: 0.016,
//                       fontWeight: FontWeight.w600,
//                     ),
//                   ),
//                 ),
                SizedBox(
                  width: 10,
                ),
              ] else ...[
                Expanded(
                  child: Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                    decoration: BoxDecoration(
                      color: Color(0xFFF5F5F5), // Background color
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text:
                                    'Yay..You Save ₹${cartController.discountAmmount.toString()}',
                                style: GoogleFonts.poppins(
                                  textStyle: TextStyle(
                                    fontSize: 15,
                                    color: Color(0xFFCE3737),
                                    // Red color for savings
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            couponCode.clear(); // Clear the TextField
                            setState(() {
                              cartController.updateCoupon();
                            });
                            // adressController.getAdresses(context: context);
                            // cartController.youmayLikeProducts(
                            //     context: context);
                            // configController.getConfig(context: context);
                            // walletController.getWallet(context: context);
                            // cartController.getCart(context: context),
                            // cartController.getCart(
                            //     context: context,
                            //     longitude: homeController.longitude,
                            //     latitude: homeController.latitude);
                            // });
                          },
                          child: Icon(
                            Icons.close,
                            color: Color(
                                0xFF555555), // Grey color for the close icon
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        SizedBox(
          height: 1.h,
        )
        // Padding(
        //   padding: EdgeInsets.all(3.0.w),
        //   child: customText(
        //     text:
        //         "*Coupon codes won’t apply to items in the Oil and Ghee category. Discounts will be calculated based only on the rest of your cart.",
        //     fontSize: 0.013.sp,
        //     fontWeight: FontWeight.w500,
        //     color: Colors.red.withOpacity(0.4),
        //   ),
        // )
      ],
    );
  }

  Widget orderSummary(
      {totalItems,
      subtotal,
      delivery,
      total,
      discount,
      required double tipAmount,
      totaldiscount}) {
    // Ensure the total is converted to double from RxString
    double totalValue = double.tryParse(total.value) ??
        0.0; // Extract the value and convert to double
    // double deliveryamount = double.tryParse(delivery) ?? 0.0; // Extract the value and convert to double
    finalTotal = totalValue + tipAmount + delivery;
    print("totaamounmee:${finalTotal}");
    print("subtotal:${discount}");
    print("delivery:${delivery}");

    return Padding(
      padding: EdgeInsets.only(top: 3.h, bottom: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          customText(
            text: "Bill Details",
            fontWeight: FontWeight.w600,
            fontSize: 18.sp,
          ),
          SizedBox(height: 0.6.h),

          SizedBox(height: 1.h),

          // Subtotal Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              customText(
                text: "Subtotal",
                color: Color(0xff707070),
              ),
              Row(
                children: [
                  constantText(
                    // text: "${Constants.rupee}$totaldiscount",
                    text:
                        "${Constants.rupee}${double.parse(totaldiscount.value).toStringAsFixed(2)}",

                    textStyle: robotocustomTextstyle(
                      fontSize: 14.sp,
                      color: tColor.withOpacity(0.5),
                      fontWeight: FontWeight.w600,
                      textDecoration: TextDecoration.lineThrough,
                    ),
                  ),
                  SizedBox(
                    width: 10,
                  ),
                  constantText(
                    text:
                        "${Constants.rupee}${double.parse(subtotal.value).toStringAsFixed(2)}",
                    textStyle: robotocustomTextstyle(
                      fontSize: 18.sp,
                      color: tColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),

          SizedBox(height: 1.h),

          // Tip Amount Row (below Subtotal)
          if (tipAmount > 0) // Only show if tipAmount is greater than 0
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                customText(
                  text: "Tip",
                  color: Color(0xff707070),
                ),
                Text("+ ${Constants.rupee}${tipAmount.toStringAsFixed(2)}",
                    style: robotocustomTextstyle(
                      fontWeight: FontWeight.w600,
                    )),
              ],
            ),

          if (tipAmount > 0) SizedBox(height: 1.h),

          // Delivery Cost Section
          // GetBuilder<ConfigController>(
          //   id: 'update-order-type',
          //   builder: (controller) =>
          //       cartController.selectedOrderType?.toLowerCase() ==
          //               'delivery'.toLowerCase()
          //           ?
          Column(
            children: [
              SizedBox(height: 1.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  customText(
                    text: "Delivery Cost",
                    color: tColor,
                  ),
                  Text(
                    delivery > 0
                        ? "+ ₹$delivery"
                        : "Free Delivery Applied", // Show cost or "Free Delivery"
                    style: robotocustomTextstyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Discount Section
          cartController.couponApplied.isTrue
              ? Column(
                  children: [
                    SizedBox(height: 1.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        customText(
                          text: "Discount",
                          color: tColor,
                        ),
                        Text("- ${Constants.rupee}$discount",
                            style: robotocustomTextstyle(
                              fontWeight: FontWeight.w600,
                            )),
                      ],
                    ),
                  ],
                )
              : Container(),

          // Wallet Amount Section
          isUsedWallet
              ? Column(
                  children: [
                    SizedBox(height: 1.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        customText(
                          text: "Wallet Amount Used",
                          color: tColor,
                        ),
                        Text(
                            "- ${Constants.rupee}${getEligibleAmount(isDisplayingEligibleAmount: true)}",
                            style: robotocustomTextstyle(
                              fontWeight: FontWeight.w600,
                            )),
                      ],
                    ),
                  ],
                )
              : Container(),

          SizedBox(height: 1.h),
          Divider(color: black, thickness: 1),
          SizedBox(height: 5),

          // Total Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              customText(
                text: "Total",
                fontWeight: FontWeight.w600,
                fontSize: 18.sp,
                color: Color(0xff707070),
              ),
              Text("${Constants.rupee}${finalTotal?.toStringAsFixed(2)}",
                  style: robotocustomTextstyle(
                    fontSize: 17.sp,
                    color: primary,
                    fontWeight: FontWeight.w600,
                  )),
            ],
          ),
        ],
      ),
    );
  }

  OutlineInputBorder inputBorderWidget() {
    return OutlineInputBorder(
        borderSide: BorderSide(color: Color(0XFFA5A6A2), width: .82));
  }

  Widget deliveryAddress({address, lattute}) {
    print('dsdssdsds$lattute');

    return Padding(
      padding: EdgeInsets.only(bottom: 0.h, top: 2.h),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: GetBuilder<CartController>(
          id: 'expansion',
          builder: (_) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Left Side: Map Icon and Delivery Address Title
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined, // Map location icon
                          color: Colors.black,
                          size: 20.sp,
                        ),
                        SizedBox(width: 2.w), // Space between icon and text
                        customText(
                          text: "Delivery Address",
                          fontSize: 18.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ],
                    ),

                    // Right Side: Right Arrow Icon for navigation
                    GestureDetector(
                      onTap: () {
                        Get.to(() => ManageAddress(
                              isFromCartScreen: true,
                            ));
                      },
                      child: Icon(
                        Icons.arrow_forward_ios, // Right arrow icon
                        color: Colors.black,
                        size: 18.sp,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 1.h),

                // Full Address Details
                customText(
                  text: "$address",
                  fontSize: 14,
                  color: ordersPrimaryColor.withOpacity(0.6),
                ),
                SizedBox(height: 1.h),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget deliveryInstructionsWidget() {
    return Container(
      width: 90.w,
      height: 20.h,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          customText(
            text: "Delivery Instructions",
            fontSize: 18.sp,
            fontWeight: FontWeight.w600,
          ),
          SizedBox(
            height: 1.h,
          ),
          Expanded(
            flex: 1,
            child: GetBuilder<CartController>(
              id: 'delivery-instruction',
              builder: (_) {
                return ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: BouncingScrollPhysics(),
                  itemCount: deliveryInstructions.length,
                  itemBuilder: (context, index) {
                    var instruction = deliveryInstructions[index].title;
                    return GestureDetector(
                      onTap: () {
                        cartController.addInstructions(
                            val: instruction, index: index);
                      },
                      child: Padding(
                        padding: EdgeInsets.only(right: 2.w),
                        child: Container(
                          width: 60.w,
                          decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(1.h),
                              border: Border.all(
                                  color: cartController.deliveryInstructionIndex
                                          .contains(index)
                                      ? Colors.blue
                                      : black,
                                  width: cartController.deliveryInstructionIndex
                                          .contains(index)
                                      ? 2
                                      : 1)),
                          clipBehavior: Clip.antiAliasWithSaveLayer,
                          padding: EdgeInsets.all(1.h),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              ImageIcon(
                                AssetImage(deliveryInstructions[index].image),
                                color: black,
                                size: 4.h,
                              ),
                              customText(
                                text: deliveryInstructions[index].title,
                                fontSize: 18.sp,
                                fontWeight: FontWeight.w600,
                              ),
                              customText(
                                text: deliveryInstructions[index].description,
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w400,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget paymentWidget() {
    return Padding(
      padding: EdgeInsets.only(top: 2.h, bottom: 2.h),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
            tilePadding: EdgeInsets.zero,
            iconColor: black,
            collapsedIconColor: black,
            leading: ImageIcon(
              AssetImage(cashIcon),
              color: green,
              size: 3.h,
            ),
            title: customText(
              text: "Payment Method",
              fontSize: 18.sp,
              fontWeight: FontWeight.w600,
            ),
            expandedCrossAxisAlignment: CrossAxisAlignment.start,
            children: [paymentTile()]),
      ),
    );
  }

  Widget paymentTile() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      customText(
        text: "Select Payment Method",
        fontSize: 18.sp,
        fontWeight: FontWeight.w600,
      ),
      SizedBox(
        height: 1.h,
      ),
      Row(
        children: [
          SizedBox(
            width: 2.w,
          ),
          Container(
            height: 3.5.h,
            width: 5.w,
            child: Radio<String>(
              activeColor: green,
              value: "cash",
              groupValue: selectedPayment,
              onChanged: (value) {
                setState(() {
                  selectedPayment = value.toString();
                  print("\nSelected Payment: $selectedPayment");
                });
              },
            ),
          ),
          SizedBox(
            width: 4.w,
          ),
          customText(
            text: "Cash On Delivery",
            fontSize: 18.sp,
          )
        ],
      ),
      SizedBox(
        height: 1.h,
      ),
      Row(
        children: [
          SizedBox(
            width: 2.w,
          ),
          Container(
            height: 3.5.h,
            width: 5.w,
            child: Radio<String>(
              activeColor: green,
              value: "online",
              groupValue: selectedPayment,
              onChanged: (value) {
                setState(() {
                  selectedPayment = value.toString();
                  print("\nSelected Payment: $selectedPayment");
                });
              },
            ),
          ),
          SizedBox(
            width: 4.w,
          ),
          customText(
            text: "Pay online",
            fontSize: 18.sp,
          )
        ],
      ),
      SizedBox(
        height: 1.h,
      ),
    ]);
  }

  Container emptyCartData() {
    return Container(
      width: 100.w,
      height: 100.h,
      padding: EdgeInsets.all(7.w),
      alignment: Alignment.center,
      child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Image(
              image: AssetImage(
                cart,
              ),
              width: 80.w,
              height: 18.h,
              fit: BoxFit.contain,
            ),
            SizedBox(
              height: 2.h,
            ),
            customText(
              text: "Your Basket is Empty",
              fontSize: 21.sp,
              fontWeight: FontWeight.w600,
              textAlign: TextAlign.center,
            ),
            SizedBox(
              height: 1.h,
            ),
            customText(
              text: "Let’s fill up the basket and get it delivered!",
              fontWeight: FontWeight.w500,
              color: ordersPrimaryColor.withOpacity(0.6),
              textAlign: TextAlign.center,
            ),
            SizedBox(
              height: 4.h,
            ),
            buttonWidget(
              onTap: () {
                homeController.updateTabIndex(0);
                Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => Homepage()),
                    (route) => false);
              },
              context: context,
              borderRadius: 25,
              text: "Let’s Do Shopping",
            ),
          ]),
    );
  }

  Widget paymentMethodTile(String method, String assetPath) {
    bool isSelected = selectedMethod == method;

    return GestureDetector(
      onTap: () {
        setState(() {
          selectedMethod = method;
          isExpanded = false;
          selectedImageAsset = assetPath; // Update selected image asset
// Collapse the tile after selection
        });
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8.0),
          border: Border.all(
            color: isSelected ? Colors.green : Colors.transparent,
            width: 2.0,
          ),
        ),
        padding: EdgeInsets.symmetric(vertical: 10.0, horizontal: 16.0),
        child: Row(
          children: [
            Image.asset(assetPath, height: 24, width: 24),
            SizedBox(width: 16.0),
            Expanded(
                child: customText(
              text: method,
              color: isSelected ? Color(0xff70B943) : Color(0xFF030401),
              // Change color based on selection
              fontSize: 0.017,
              fontWeight: FontWeight.w500,
            )),
            if (isSelected) Icon(Icons.check_circle, color: Colors.green),
          ],
        ),
      ),
    );
  }

  Widget _buildTipButton(dynamic tip) {
    bool isSelected =
        _selectedTip == tip || (tip == 'Other' && _selectedTip == null);

    return GestureDetector(
      onTap: () {
        _selectTip(tip);
      },
      child: Container(
          padding: EdgeInsets.symmetric(vertical: 10, horizontal: 20),
          decoration: BoxDecoration(
            color: isSelected ? Color(0xffF9CF09) : null,
            borderRadius: BorderRadius.circular(8),
            border: isSelected
                ? Border.all(color: Color(0xffF9CF09), width: 1)
                : Border.all(color: Color(0xffDDDDDD), width: 1),
          ),
          child: customText(
            text: tip is int ? '₹$tip' : tip,
            color: Color(0xFF030401),
            fontSize: 0.016,
            fontWeight: FontWeight.w500,
          )),
    );
  }
}

class CartCustomText extends StatelessWidget {
  const CartCustomText({
    Key? key,
    required this.text,
    this.color,
    this.fontSize,
    this.maxLines,
    this.decorationColor,
    this.fontWeight,
    this.overflow,
    this.decoration,
    this.textAlign,
    this.fontStyle = FontStyle.normal,
    this.leadingWidget, // Initialize the leading widget parameter
// Default to normal font style
  }) : super(key: key);

  final String text;
  final Color? color;
  final Color? decorationColor;
  final double? fontSize;
  final int? maxLines;
  final FontWeight? fontWeight;
  final TextOverflow? overflow;
  final TextAlign? textAlign;
  final TextDecoration? decoration;
  final FontStyle fontStyle;
  final Widget? leadingWidget; // Optional leading widget (image/icon)
// Parameter for font style (italic or normal)

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (leadingWidget != null) ...[
          leadingWidget!,
          SizedBox(width: 8), // Space between icon/image and text
        ],
        Padding(
          padding: const EdgeInsets.only(left: 20.0),
          child: Text(
            text,
            textAlign: textAlign,
            overflow: overflow,
            maxLines: maxLines,
            style: TextStyle(color: primary),
            // style: customTextstyle(
            //   color: Colors.blue,
            //   fontWeight: fontWeight,
            //   fontSize: fontSize,
            //   // decorationColor: decorationColor,
            //   // fontStyle: fontStyle,
            //   // // Apply font style here
            //   // decoration: decoration,
            // ),
          ),
        ),
      ],
    );
  }
}

// TextStyle customeTextstyle({
//   Color? color,
//   TextDecoration? decoration,
//   double? fontSize,
//   Color? decorationColor,
//   FontWeight? fontWeight,
//   String? fontFamily,
//   FontStyle? fontStyle, // Add this parameter to accept font style
// }) {
//   // double textSize =
//   // fontSize != null ? fontSize * Sizes.height : Sizes.height * .02;
//
//   return GoogleFonts.montserrat(
//     color: Colors.white,
//     // Default to a white color if not provided
//     fontSize: textSize,
//     fontWeight: fontWeight ?? FontWeight.w500,
//     // Default to FontWeight.w500
//     decorationColor: decorationColor,
//     decoration: decoration,
//     fontStyle: fontStyle, // Apply the passed fontStyle (italic or normal)
//   );
// }
