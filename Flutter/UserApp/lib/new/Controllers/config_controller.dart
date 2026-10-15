import 'dart:convert';

import 'package:fav_app/Services/Home/cart_services.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewModel/config.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../old/Services/common/network_check.dart';
import '../NewScreens/Widgets/customToast.dart';

class ConfigController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;

  RxList<Setting> configList = RxList();
  ConfigModel? configModel;

  RxDouble freeDeliveryCartPrice = RxDouble(0);
  RxDouble deliveryFee = RxDouble(0);
  RxDouble minWalletAmount = RxDouble(0);
  RxDouble minCartAmount = RxDouble(0);
  RxString referFee = RxString('0');

  RxList<String> deliveryTypesList = RxList();

  void updateOrderType() {
    update(['update-order-type']);
  }

  RxList<String> setDeliveryTypes({String? value}) {
    if (value == null) {
      return RxList();
    }
    return RxList<String>.from(jsonDecode(value));
  }

  bool isCheckMinAmount({required double grandTotal}) {
    bool isMinAmountExceeded = false;
    double minValue = 0;
    for (var element in configList) {
      if (element.settingKey == 'MinOrderValue') {
        if (element.settingValue != null) {
          double minAmount = double.parse(element.settingValue ?? '0');
          minValue = minAmount;
          isMinAmountExceeded = grandTotal >= minAmount;
        }
      }
    }

    if (!isMinAmountExceeded) {
      customToast(message: "Minumum order value should be ₹$minValue");
    }

    return isMinAmountExceeded;
  }

  Future getConfig({
    required context,
  }) async {
    deliveryTypesList.clear();
    Future.delayed(
      Duration.zero,
      () {
        _isLoading(true);
      },
    );
    print('nnnnnnnnnnnnnnnnnnnnnnnnn');
    // print(latitude);

    Network.networkCheck(context).then((value) => value != null
        ? {
            CartServices.getConfig()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            configModel = value,
                            configList(configModel?.settings),
                            if (configList.isNotEmpty)
                              {
                                for (var element in configList)
                                  {
                                    if (element.settingKey?.toLowerCase() ==
                                        'DeliveryTypes'.toLowerCase())
                                      {
                                        deliveryTypesList = setDeliveryTypes(
                                            value: element.settingValue),
                                      },
                                    if (element.settingKey?.toLowerCase() ==
                                        'ReferAmount'.toLowerCase())
                                      {
                                        referFee(element.settingValue),
                                      },
                                    if (element.settingKey?.toLowerCase() ==
                                        'DeliveryCharges'.toLowerCase())
                                      {
                                        if (element.settingValue != null)
                                          {
                                            print("${deliveryFee}"),
                                            deliveryFee(double.parse(
                                                element.settingValue ?? '0')),
                                            print(
                                                "ddddddddddddddddddddddddddddddd${deliveryFee}"),
                                            // Get.find<CartController>()
                                            //     .updateDeliveryFee(
                                            //         deliveryFeeAmount:
                                            //             deliveryFee.value)
                                          }
                                      },
                                    if (element.settingKey?.toLowerCase() ==
                                        'FreeDelivery_CartAmount'.toLowerCase())
                                      {
                                        if (element.settingValue != null)
                                          {
                                            freeDeliveryCartPrice(double.parse(
                                                element.settingValue ?? '0')),
                                          }
                                      },
                                    if (element.settingKey?.toLowerCase() ==
                                        'MinUseOfWallet'.toLowerCase())
                                      {
                                        if (element.settingValue != null)
                                          {
                                            minWalletAmount(double.parse(
                                                element.settingValue ?? '0')),
                                          }
                                      },
                                    if (element.settingKey?.toLowerCase() ==
                                        'Minordervalue_wallet'.toLowerCase())
                                      {
                                        if (element.settingValue != null)
                                          {
                                            minCartAmount(double.parse(
                                                element.settingValue ?? '0')),
                                          }
                                      },
                                  }
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
              return <dynamic>{};
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }

  Future<bool> validateCart({
    required context,
    required Map body,
  }) async {
    print(body);
    bool isPlaceOrder = false;
    await Network.networkCheck(context).then((value) async => value != null
        ? {
            await CartServices.validateCart(body: body)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            isPlaceOrder = true,
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {
                        customToast(message: 'Error'),
                        _isLoading(false),
                      })
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isLoading(false);
              isPlaceOrder = false;
              return <dynamic>{};
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});

    return isPlaceOrder;
  }
}
