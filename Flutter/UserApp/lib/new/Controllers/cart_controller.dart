import 'dart:async';
import 'package:fav_app/Models/Account/adresses.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/category_controller.dart';
import 'package:fav_app/new/Controllers/config_controller.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/Controllers/searchandrecomend_controller.dart';
import 'package:fav_app/new/NewModel/promocodes_model.dart';
import 'package:fav_app/new/NewModel/youmaylike_model.dart';
import 'package:fav_app/new/Services/print_store_service.dart';
import 'package:fav_app/old/Models/Home/cart_model.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lottie/lottie.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../old/Models/Orders/promocode_model.dart';
import '../../old/Services/Home/cart_services.dart';
import '../../old/Services/Orders/orders.dart';
import '../NewScreens/Widgets/customToast.dart';
import '../Services/common/network_check.dart';
import 'home_controller.dart';

class CartController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;
  CartModel? cartModel;
  Address? address;
  RxList<CartItem> cartItems = RxList();
  final RxString _ammount = ''.obs;
  RxString get ammount => _ammount;

  final RxString _totadisammount = ''.obs;
  RxString get totadisammount => _totadisammount;
  final RxString _totalAmmount = ''.obs;
  RxString get totalAmmount => _totalAmmount;
  final RxString _discountAmmount = ''.obs;
  RxString get discountAmmount => _discountAmmount;
  final RxInt _quantity = 0.obs;
  RxInt get quantity => _quantity;
  final RxInt _cartId = 0.obs;
  RxInt get cartId => _cartId;
  Cart? cart;
  RxBool isKitsItemsAvailableInCart = false.obs;
  RxList<String> deliveryInstructions = RxList();
  final RxList<int> _deliveryInstructionIndex = RxList();
  RxList<int> get deliveryInstructionIndex => _deliveryInstructionIndex;
  removeAvailableKititemsLength() {
    Future.delayed(Duration.zero, () {
      isKitsItemsAvailableInCart(false);
    });
  }

  updateDeliveryInsruction() {
    update(['delivery-instruction']);
  }

  expansionId() {
    update(['expansion']);
  }

  bool isExpansionChanged = false;

  updateExpansion(bool val) {
    isExpansionChanged = val;
    expansionId();
  }

  addInstructions({
    required String val,
    required int index,
  }) {
    deliveryInstructions.add(val);
    if (_deliveryInstructionIndex.contains(index)) {
      _deliveryInstructionIndex.remove(index);
    } else {
      _deliveryInstructionIndex.add(index);
    }

    updateDeliveryInsruction();
  }

  resetDeliveryInstructions() {
    Future.delayed(Duration.zero, () {
      _deliveryInstructionIndex.clear();
      deliveryInstructions.clear();
      isExpansionChanged = false;
      selectedOrderType = null;
      walletAmountUsed(0);
    });
  }

  /// Print-store files in the cart (they are not product lines).
  RxList<PrintJob> printJobs = RxList();

  Future<void> refreshPrints() async {
    printJobs(await PrintStoreService.cart());
  }

  Future getCart({
    required context,
    bool removeLoader = false,
    bool isTriggerYouMayLikeProducts = false,
    longitude,
    latitude,
  }) async {
    refreshPrints();
    if (!removeLoader) {
      Future.delayed(
        Duration.zero,
        () {
          _isLoading(true);
        },
      );
    }
    double filterAmount = 0;
    double disfilterAmount = 0;
    final CategoryController categoryController = Get.find();

    Network.networkCheck(context).then((value) async => value != null
        ? {
            await CartServices.getCart()
                .then((value) async => value != null
                    ? {
                        if (value.status == 1)
                          {
                            cartModel = value,
                            cart = cartModel?.cart,
                            if (cart?.DeliveryCharges != null)
                              Get.find<CartController>().updateDeliveryFee(
                                  deliveryFeeAmount: cart?.DeliveryCharges),
                            await Future.wait([
                              Future.microtask(() async {
                                if (cart?.cartId != null) {
                                  cartItems(cartModel?.cart?.cartItems);
                                  if (cartItems.isNotEmpty) {
                                    for (var i = 0; i < cartItems.length; i++) {
                                      filterAmount += cartItems[i].offerPrice! *
                                          cartItems[i].quantity!;
                                      disfilterAmount += cartItems[i].price! *
                                          cartItems[i].quantity!;
                                      _totadisammount(
                                          disfilterAmount.toString());
                                      _ammount(filterAmount.toString());
                                      getTotalAmmount(_ammount.value);
                                      addAndRemoveDeliveryFeeToCart();
                                      if (cartItems[i].kitId != 0) {
                                        isKitsItemsAvailableInCart(true);
                                      }
                                    }

                                    if (walletAmountUsed.value != 0) {
                                      addWallet(
                                          value:
                                              double.tryParse(_ammount.value) ??
                                                  0);
                                    }

                                    // print(getTotalAmmount);
                                    // print(_ammount);
                                    // print(
                                    //     'oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo');
                                    // if (couponBody != null) {
                                    //   validatePromo(
                                    //       isRemovemessage: true,
                                    //       context: context,
                                    //       body: couponBody);
                                    // }

                                    _cartId(cart?.cartId);
                                    _quantity(cartItems.length);
                                    productsApi(
                                        categoryController: categoryController,
                                        context: context);
                                    await categoryController
                                        .addCartItemsFromCart(cartItems);
                                    if (isTriggerYouMayLikeProducts) {
                                      await youmayLikeProducts(
                                          context: context,
                                          isRemoveLoader: true);
                                    }
                                  } else {
                                    removeValuesIfNoCart(categoryController);
                                    productsApi(
                                        categoryController: categoryController,
                                        context: context);
                                  }
                                } else {
                                  removeValuesIfNoCart(categoryController);
                                  productsApi(
                                      categoryController: categoryController,
                                      context: context);
                                }
                              })
                            ]),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {customToast(message: 'Error'), _isLoading(false)})
                .catchError((onError) {
              debugPrint('cart request failed: $onError');
              customToast(message: 'Could not reach the store. Please check your internet and try again.');
              _isLoading(false);
              return <dynamic>{};
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
    return cartItems;
  }

  getTotalAmmount(String val) {
    double ammount = 0.0;

    if (_discountAmmount.value != '') {
      ammount = double.parse(val) - double.parse(_discountAmmount.value);
    } else {
      ammount = double.parse(val);
    }

    _totalAmmount(ammount.toStringAsFixed(2));
  }

  String? selectedOrderType;
  RxDouble deliveryFee = RxDouble(0);

  void updateOrderType(String? val) {
    selectedOrderType = val;
  }

  void updateDeliveryFee({
    double? deliveryFeeAmount,
  }) {
    deliveryFee(deliveryFeeAmount);
  }

  void updateWalletUse({
    double? eligibleAmount,
  }) {
    walletAmountUsed(eligibleAmount);
  }

  RxDouble walletAmountUsed = RxDouble(0);

  void addWallet({bool isRemoveFee = false, required double value}) {
    double ammount = double.parse(_totalAmmount.value);

    print(ammount);
    print(value);
    print('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk');
    walletAmountUsed(value);
    if (isRemoveFee) {
      updateWalletUse(eligibleAmount: 0);
      _totalAmmount((ammount + value).toStringAsFixed(2));
    } else {
      updateWalletUse(eligibleAmount: value);
      _totalAmmount((ammount - value).toStringAsFixed(2));
    }

    if (double.parse(_totalAmmount.value).isNegative) {
      _totalAmmount('0');
    }
  }

  void addAndRemoveDeliveryFeeToCart({bool isRemoveFee = false}) {
    double ammount = 0.0;
    double discountAmount = 0.0;

    if (_discountAmmount.value != '') {
      discountAmount = double.parse(_discountAmmount.value);
    }
    if (_ammount.value != '') {
      ammount = double.parse(_ammount.value);
    }

    // using wallet amount for only reducing here
    if (selectedOrderType?.toLowerCase() != 'delivery'.toLowerCase() &&
        selectedOrderType == null) {
      deliveryFee(0);

      _totalAmmount(((ammount - discountAmount) - walletAmountUsed.value)
          .toStringAsFixed(2));
      if (double.parse(_totalAmmount.value).isNegative) {
        _totalAmmount('0');
      }
      return;
    }
    if (isRemoveFee) {
      print('lllllllllllllllllllllllllllll');
      deliveryFee(0);
      _totalAmmount(((ammount - discountAmount) - walletAmountUsed.value)
          .toStringAsFixed(2));
      if (double.parse(_totalAmmount.value).isNegative) {
        _totalAmmount('0');
      }
      return;
    }
    if (Get.find<CartController>().cart?.DeliveryCharges != null) {
      deliveryFee(Get.find<CartController>().cart?.DeliveryCharges);
    }

    if ((ammount - discountAmount) >
        Get.find<ConfigController>().freeDeliveryCartPrice.value) {
      _totalAmmount(((ammount - discountAmount) - walletAmountUsed.value)
          .toStringAsFixed(2));
    } else {
      _totalAmmount((((ammount - discountAmount) + deliveryFee.value) -
              walletAmountUsed.value)
          .toStringAsFixed(2));
    }
    if (double.parse(_totalAmmount.value).isNegative) {
      _totalAmmount('0');
    }
  }

  removeValuesIfNoCart(CategoryController categoryController) {
    cartItems.clear();
    _quantity(0);
    categoryController.removeQuantity();
  }

  int get totalCartItemCount {
    if (cartItems.isEmpty) return 0;
    int total = 0;
    for (var item in cartItems) {
      total += (item.quantity ?? 1);
    }
    return total;
  }

  void clearCart() {
    cartItems.clear();
    printJobs.clear();
    _quantity(0);
    _ammount('');
    _totadisammount('');
    _totalAmmount('');
    _discountAmmount('');
    cart = null;
    cartModel = null;
    try {
      if (Get.isRegistered<CategoryController>()) {
        Get.find<CategoryController>().removeQuantity();
      }
    } catch (_) {}
  }

  Future<bool> addCart({
    required context,
    required body,
    bool removeToast = false,
    bool isTriggerYouMayLikeProducts = false,
    bool isScreenFromHome = false,
  }) async {
    if (!removeToast) {
      _isLoading(true);
    }
    bool isAddedSuccessFully = false;
    await Network.networkCheck(context).then((onValue) async => onValue != null
        ? {
            await CartServices.addCart(body: body)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            if (!removeToast)
                              {
                                customToast(message: value.message),
                              },
                            getCart(
                                context: context,
                                removeLoader: removeToast,
                                isTriggerYouMayLikeProducts:
                                    isTriggerYouMayLikeProducts),
                            if (!isScreenFromHome)
                              {
                                Get.find<HomeController>()
                                    .getHome(context: context),
                              },
                            isAddedSuccessFully = true,
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {customToast(message: 'Error'), _isLoading(false)})
                .catchError((onError) {
              debugPrint('cart request failed: $onError');
              customToast(message: 'Could not reach the store. Please check your internet and try again.');
              _isLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
    return isAddedSuccessFully;
  }

  makeDeleteLoadersOnProducts({
    bool isThroughProducts = false,
    bool isThroughProductsDetails = false,
  }) {
    if (isThroughProducts == true) {
      productsDataLoader(true);
      if (isKitsItemsAvailableInCart.isTrue) {
        comboDataLoader(true);
      }
      if (searchListproductsDataLoader.isTrue) {
        searchListproductsDataLoader(true);
      }
    }

    if (isThroughProductsDetails == true) {
      if (isKitsItemsAvailableInCart.isTrue) {
        comboDescriptionLoader(true);
      } else {
        productsDetailsDataLoader(true);
      }
    }
  }

  deleteCart({
    required context,
    bool isThroughProducts = false,
    bool isThroughProductsDetails = false,
  }) async {
    makeDeleteLoadersOnProducts(
        isThroughProducts: isThroughProducts,
        isThroughProductsDetails: isThroughProductsDetails);
    final CategoryController categoryController = Get.find();
    await Network.networkCheck(context).then((onValue) async => onValue != null
        ? {
            await CartServices.deleteCart(id: cartId.value)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            customToast(message: value.message),
                            _quantity(0),
                            categoryController.removeQuantity(),
                            getCart(context: context),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                      }
                    : {
                        customToast(message: 'Error'),
                      })
                .catchError((onError) {
              debugPrint('cart request failed: $onError');
              customToast(message: 'Could not reach the store. Please check your internet and try again.');
            })
          }
        : {
            customToast(message: 'Network error'),
          });
  }

//call product Api for quantity update when data change in cart page
  productsApi({
    required CategoryController categoryController,
    required context,
  }) {
    if (productsDataLoader.isTrue) {
      categoryController.getProducts(
          context: context,
          categoryId: categoryController.categoryIDforsubcategory.value,
          subcategoryId: categoryController.subCatIDforsubcategory.value);
    }
    if (searchListproductsDataLoader.isTrue) {
      final SearchAndRecommendController searchController = Get.find();
      searchController.getsearchProducts(
          context: context, query: searchController.searchString.value);
    }
    if (productsDetailsDataLoader.isTrue) {
      categoryController.getProductsDetails(
          context: context,
          productId: categoryController.productIDforsubcategory.value);
    }
  }

//varient for remove quantity in products Tab
  RxInt storevarientId = 0.obs;

  clearVariantsId() {
    storevarientId(0);
  }

  Future<bool> deleteItemFromCart({
    required context,
    required productId,
    required variantId,
    bool removeToast = false,
    bool isThroughProducts = false,
    bool isFromCartScreen = false,
    bool isScreenFromHome = false,
    bool isThroughProductsDetails = false,
    bool isTriggerYouMayLikeProducts = false,
  }) async {
    bool success = false;
    makeDeleteLoadersOnProducts(
        isThroughProducts: isFromCartScreen == true ? isThroughProducts : false,
        isThroughProductsDetails:
            removeToast ? false : isThroughProductsDetails);
    await Network.networkCheck(context).then((onValue) async => onValue != null
        ? {
            await CartServices.deleteItemFromCart(
                    type: 1, productId: productId, variantId: variantId)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            if (!removeToast)
                              {
                                customToast(message: value.message),
                              },
                            success = true,
                            storevarientId(variantId),
                            getCart(
                                isTriggerYouMayLikeProducts:
                                    isTriggerYouMayLikeProducts,
                                context: context,
                                removeLoader: removeToast),
                            if (!isScreenFromHome)
                              {
                                Get.find<HomeController>()
                                    .getHome(context: context),
                              }
                          }
                        else
                          {
                            success = false,
                            customToast(message: value.message),
                          },
                      }
                    : {
                        success = false,
                        customToast(message: 'Error'),
                      })
                .catchError((onError) {
              debugPrint('cart request failed: $onError');
              customToast(message: 'Could not reach the store. Please check your internet and try again.');
              success = false;
            })
          }
        : {
            success = false,
            customToast(message: 'Network error'),
          });
    // });

    return success;
  }

  Future<bool> deleteKitFromCart({
    required context,
    required kitId,
    bool removeToast = false,
  }) async {
    bool success = false;
    await Network.networkCheck(context).then((onValue) async => onValue != null
        ? {
            await CartServices.deleteKitFromCart(type: 2, kitId: kitId)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            if (!removeToast)
                              {
                                customToast(message: value.message),
                              },
                            success = true,
                            getCart(
                                context: context, removeLoader: removeToast),
                          }
                        else
                          {
                            success = false,
                            customToast(message: value.message),
                          },
                      }
                    : {
                        success = false,
                        customToast(message: 'Error'),
                      })
                .catchError((onError) {
              debugPrint('cart request failed: $onError');
              customToast(message: 'Could not reach the store. Please check your internet and try again.');
              success = false;
            })
          }
        : {
            success = false,
            customToast(message: 'Network error'),
          });
    // });

    return success;
  }

  // based on this bool values we can updating the apis and refreshing the data.

  RxBool searchListproductsDataLoader = false.obs;
  RxBool productsDataLoader = false.obs;
  RxBool productsDetailsDataLoader = false.obs;
  RxBool comboDataLoader = false.obs;
  RxBool comboDescriptionLoader = false.obs;

  removeLoaders() {
    Future.delayed(
      Duration.zero,
      () {
        productsDetailsDataLoader(false);
        comboDataLoader(false);
        productsDataLoader(false);
        searchListproductsDataLoader(false);
        comboDescriptionLoader(false);
      },
    );
  }

  Future<bool> updateQuantity({
    int productId = 0,
    int variantId = 0,
    required int quantity,
    required context,
    bool removeToast = false,
    bool isFromProductsScreen = false,
    bool isFromCombodescriptionScreen = false,
    bool isFromComboScreen = false,
    bool isFromCartScreen = false,
    bool isFromSearchScreen = false,
    bool isThroughDescriptionScreen = false,
    bool isThroughProductsScreen = false,
    bool isScreenFromHome = false,
    int kitId = 0,
    int? categoryId,
    int? subCategoryId,
  }) async {
    if (isThroughDescriptionScreen == true) {
      productsDetailsDataLoader(isFromCartScreen);
      comboDescriptionLoader(isFromCombodescriptionScreen);
      comboDataLoader(isFromComboScreen);
      productsDataLoader(isFromProductsScreen);
    }
    if (isThroughProductsScreen == true) {
      productsDataLoader(isFromProductsScreen);

      comboDataLoader(isFromComboScreen);
    }

    if (isFromSearchScreen == true) {
      searchListproductsDataLoader(isFromSearchScreen);
    } else {
      searchListproductsDataLoader(false);
    }

    // Determine if this is a net quantity addition
    int previousQty = 0;
    final existingCartItem = cartItems.firstWhereOrNull(
      (item) =>
          item.productId == productId &&
          (variantId == 0 || item.variantId == variantId),
    );
    if (existingCartItem != null) {
      previousQty = existingCartItem.quantity ?? 0;
    }
    final bool isAddition = quantity > previousQty;

    // Resolve authoritative category / subcategory data
    int? resolvedCategoryId = categoryId;
    int? resolvedSubCategoryId = subCategoryId;

    if (resolvedCategoryId == null || resolvedCategoryId == 0) {
      if (existingCartItem != null) {
        resolvedCategoryId = existingCartItem.categoryId;
        resolvedSubCategoryId ??= existingCartItem.subCategoryId;
      }
    }

    if (resolvedCategoryId == null || resolvedCategoryId == 0) {
      if (Get.isRegistered<CategoryController>()) {
        final catController = Get.find<CategoryController>();
        final p = catController.products
            .firstWhereOrNull((item) => item.productId == productId);
        if (p != null) {
          resolvedCategoryId = p.categoryId;
          resolvedSubCategoryId ??= p.subCategoryId;
        } else if (catController.productsDetails?.productId == productId) {
          resolvedCategoryId = catController.productsDetails?.categoryId;
          resolvedSubCategoryId ??=
              catController.productsDetails?.subCategoryId;
        }
      }
    }

    bool isAddedSuccessfully = false;
    Map<String, dynamic> body = <String, dynamic>{};
    if (productId != 0) {
      body['ProductID'] = productId;
    }
    if (variantId != 0) {
      body['VariantID'] = variantId;
    }

    body['Quantity'] = quantity;
    body['Type'] = 1;
    if (kitId != 0) {
      body['KitID'] = kitId;
      body['Type'] = 2;
    }

    if (quantity == 0) {
      kitId != 0
          ? await deleteKitFromCart(
              context: context,
              kitId: kitId,
              removeToast: true,
            ).then((value) {
              if (value == true) {
                isAddedSuccessfully = value;
              }
            })
          : await deleteItemFromCart(
                  context: context,
                  isScreenFromHome: isScreenFromHome,
                  productId: productId,
                  variantId: variantId,
                  isThroughProducts: isThroughProductsScreen,
                  isThroughProductsDetails: isThroughDescriptionScreen,
                  removeToast: removeToast)
              .then((value) {
              if (value == true) {
                isAddedSuccessfully = value;
              }
            });
    } else {
      await addCart(
        context: context,
        isScreenFromHome: isScreenFromHome,
        body: body,
        isTriggerYouMayLikeProducts:
            isThroughDescriptionScreen || isFromCartScreen,
        removeToast: removeToast,
      ).then((value) async {
        if (value == true) {
          isAddedSuccessfully = value;

          // If category/subcategory was not resolved prior to addCart, attempt resolution from newly updated cart items
          if (resolvedCategoryId == null || resolvedCategoryId == 0) {
            final newlyFetched = cartItems.firstWhereOrNull(
              (item) =>
                  item.productId == productId &&
                  (variantId == 0 || item.variantId == variantId),
            );
            if (newlyFetched != null) {
              resolvedCategoryId = newlyFetched.categoryId;
              resolvedSubCategoryId ??= newlyFetched.subCategoryId;
            }
          }
        }
      });
    }

    return isAddedSuccessfully;
  }

  updateCoupon() {
    print(discount.toString() + _totalAmmount.value.toString());

    var ammount = (discount ?? 0) + double.parse(_totalAmmount.value);
    _totalAmmount(ammount.toStringAsFixed(2));
    _discountAmmount('');

    discount = 0;
    couponApplied(false);

    print("=-------------------------->" +
        ammount.toString() +
        discount.toString());
  }

  removeCouponse() {
    Future.delayed(
      Duration.zero,
      () {
        couponApplied(false);
        discount = null;
        couponCode = null;
        _discountAmmount('');
        couponBody = null;
        walletAmountUsed(0);
      },
    );
  }

  updatePromoUI() {
    update(['update-promo']);
  }

  RxBool setIsApplyingPromo = false.obs;
  RxBool couponApplied = false.obs;
  RxBool isPromoCodesLoading = false.obs;
  RxBool youmayLikeLoading = false.obs;
  PromoCodeListModel? promoCodeListModel;
  RxList<PromoCode> promocodeList = RxList();
  double? discount;

  String? couponCode;
  Map? couponBody;
  Future validatePromo({
    required context,
    required body,
    bool isFromCouponscreen = false,
    bool isRemovemessage = false,
  }) async {
    setIsApplyingPromo(true);

    double money = 0;
    if (_discountAmmount.value != '') {
      money = double.parse(_totalAmmount.value) +
          double.parse(_discountAmmount.value);
    } else {
      money = double.parse(_totalAmmount.value);
    }

    couponCode = body['PromoCode'];

    // double minumumOrder = 0;
    // double remainingAmount = 0;
    await Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.validatePromo(body: body)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            discount = value.discount,
                            if (discount != null)
                              {
                                // minumumOrder = response?.minOrderValue ?? 0,
                                // if (money >= minumumOrder)
                                //   {

                                //   }
                                // else
                                //   {
                                //     remainingAmount = money - minumumOrder,
                                //     customToast(
                                //         message:
                                //             'Add ₹ ${remainingAmount.toString().replaceAll('-', '')} More To Get This Offer')
                                //   }
                                couponBody = body,
                                couponApplied(true),
                                _discountAmmount(discount?.toStringAsFixed(2)),
                                _totalAmmount((money - (discount ?? 0))
                                    .toStringAsFixed(2)),

                                if (double.parse(_totalAmmount.value)
                                    .isNegative)
                                  {
                                    _totalAmmount(0.toString()),
                                  },
                                if (!isRemovemessage)
                                  {
                                    customToast(message: value.message),
                                  },

                                if (isFromCouponscreen)
                                  {
                                    Navigator.pop(context),
                                  },
                                showFullScreenCouponDialog(context),
                              }
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        setIsApplyingPromo(false)
                      }
                    : {
                        customToast(message: 'Error'),
                        setIsApplyingPromo(false)
                      })
                .catchError((onError) {
              debugPrint('cart request failed: $onError');
              customToast(message: 'Could not reach the store. Please check your internet and try again.');
              setIsApplyingPromo(false);
            })
          }
        : {customToast(message: 'Network error'), setIsApplyingPromo(false)});

    return discount;
  }

  void showFullScreenCouponDialog(BuildContext context) {
    showGeneralDialog(
      context: context,
      barrierDismissible: false, // disables tap outside to dismiss
      barrierLabel: "Coupon Success",
      pageBuilder: (_, __, ___) {
        return WillPopScope(
          onWillPop: () async => false, // disables Android back button
          child: Stack(
            children: [
              // Full screen confetti animation behind
              Positioned.fill(
                child: Lottie.asset(
                  'Assets/Images/Homepage/animation3.json',
                  fit: BoxFit.cover,
                  repeat: true,
                ),
              ),

              // Centered success content
              Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.95),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black12,
                        blurRadius: 20,
                      )
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle_rounded,
                          color: Colors.green, size: 60),
                      const SizedBox(height: 16),
                      const Text(
                        "Coupon Applied!",
                        style: TextStyle(
                          decoration: TextDecoration.none,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        "Your discount has been successfully applied.",
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.black87,
                          decoration: TextDecoration.none,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          Navigator.pop(context); // dismiss the dialog
                          Navigator.pop(
                              context); // your additional pop if needed
                        },
                        child: const Padding(
                          padding: EdgeInsets.symmetric(
                              horizontal: 16, vertical: 10),
                          child: Text("Awesome!",
                              style:
                                  TextStyle(fontSize: 16, color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> getCoupons({
    required context,
  }) async {
    Future.delayed(
      Duration.zero,
      () {
        isPromoCodesLoading(true);
      },
    );
    Network.networkCheck(context).then((value) => value != null
        ? {
            OrderServices.getActivepromoCodes()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            promoCodeListModel = value,
                            promocodeList(promoCodeListModel?.promoCodes),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        isPromoCodesLoading(false)
                      }
                    : {
                        customToast(message: 'Error'),
                        isPromoCodesLoading(false)
                      })
                .catchError((onError) {
              debugPrint(onError.toString());
              debugPrint('cart request failed: $onError');
              customToast(message: 'Could not reach the store. Please check your internet and try again.');
              isPromoCodesLoading(false);
            })
          }
        : {customToast(message: 'Network error'), isPromoCodesLoading(false)});
  }

  YouMayLikeModel? youMayLikeModel;
  RxList<Product> youmayLikeproductsList = RxList();
  Future<void> youmayLikeProducts(
      {required context, bool isRemoveLoader = false}) async {
    if (!isRemoveLoader) {
      Future.delayed(
        Duration.zero,
        () {
          youmayLikeLoading(true);
        },
      );
    }
    Network.networkCheck(context).then((value) => value != null
        ? {
            OrderServices.getYouMayLikeProducts()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            youMayLikeModel = value,
                            youmayLikeproductsList(youMayLikeModel?.products),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        youmayLikeLoading(false)
                      }
                    : {customToast(message: 'Error'), youmayLikeLoading(false)})
                .catchError((onError) {
              debugPrint(onError.toString());
              debugPrint('cart request failed: $onError');
              customToast(message: 'Could not reach the store. Please check your internet and try again.');
              youmayLikeLoading(false);
            })
          }
        : {customToast(message: 'Network error'), youmayLikeLoading(false)});
  }
}
