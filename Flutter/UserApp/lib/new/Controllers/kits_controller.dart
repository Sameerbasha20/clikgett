import 'package:fav_app/new/NewModel/kits_details_model.dart' as kit;
import 'package:fav_app/old/Models/Kits/kits_model.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../old/Models/Home/cart_model.dart';
import '../../old/Services/Products/product_services.dart';
import '../../old/Services/common/network_check.dart';
import '../NewScreens/Widgets/customToast.dart';

class KitsController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;
  final RxBool _iskitDetailsLoading = false.obs;
  RxBool get iskitDetailsLoading => _iskitDetailsLoading;
  KitsModel? kitsModel;
  RxInt quantity = 0.obs;
  kit.KitsDetailsModel? kitsDetailsModel;
  RxList<kit.KitItem> kitItems = RxList();
  RxList<Product> products = RxList();
  updateQuantity() {
    for (var i = 0; i < cartItems.length; i++) {
      var item = cartItems[i];
      if (item.productId == kitsDetailsModel?.kits?.kitId) {
        quantity(item.quantity);
      }
    }
  }

  RxInt kitIDforsubcategory = 0.obs;

  quantityChange(bool add) {
    if (add) {
      quantity.value++;
    } else {
      if (quantity.value > 0) {
        quantity.value--;
      }
    }
  }

  removeQuantity() {
    Future.delayed(
      Duration.zero,
      () {
        quantity(0);
      },
    );
  }

  Future<void> getKitsData({
    required context,
  }) async {
    Future.delayed(
      Duration.zero,
      () {
        _isLoading(true);
      },
    );
    Network.networkCheck(context).then((value) => value != null
        ? {
            ProductServices.getKits()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            if (value.products != null)
                              {
                                kitsModel = value,
                                products(kitsModel?.products),
                              }
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {customToast(message: 'Error'), _isLoading(false)})
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }

  RxList<CartItem> cartItems = RxList();
  addCartItemsFromCart(List<CartItem> carts) {
    cartItems(carts);
  }

  getKitsDetailsById({required context, required int kitId}) async {
    Future.delayed(
      Duration.zero,
      () {
        _iskitDetailsLoading(true);
      },
    );
    Network.networkCheck(context).then((value) => value != null
        ? {
            ProductServices.getKitsDetails(kitId)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            if (value != null)
                              {
                                kitIDforsubcategory(kitId),
                                kitsDetailsModel = value,
                                kitItems(kitsDetailsModel?.kits?.kitItems),
                                updateQuantity(),
                              }
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _iskitDetailsLoading(false)
                      }
                    : {
                        customToast(message: 'Error'),
                        _iskitDetailsLoading(false)
                      })
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _iskitDetailsLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _iskitDetailsLoading(false)});
  }

  updateUI() {
    update(['radioButton']);
  }

  updateComboList() {
    update(['combo-list']);
  }

  updateBottomQuantity() {
    update(['update-bottom-quantity']);
  }
}
