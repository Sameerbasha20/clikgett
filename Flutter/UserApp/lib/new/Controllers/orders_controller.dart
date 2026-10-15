import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/config_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/old/Models/Orders/orders.dart';
import 'package:fav_app/old/Models/Orders/ordersdetails.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../old/Models/Account/adresses.dart';
import '../../old/Models/Home/cart_model.dart';
import '../../old/Services/Orders/orders.dart';
import '../../old/Services/common/network_check.dart';
import '../Constants/Constants.dart';
import '../NewScreens/Homepage/Tabs/Cart/SuccessCart.dart';
import '../NewScreens/Widgets/customToast.dart';

class OrdersController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;
  final RxBool _isPaymentLoading = false.obs;
  RxBool get isPaymentLoading => _isPaymentLoading;
  RxList<CartItem> cartItems = RxList();
  Cart? cart;
  Map<dynamic, dynamic> orderItemBody = <dynamic, dynamic>{};
  Map<dynamic, dynamic> adressBody = <dynamic, dynamic>{};
  Map<dynamic, dynamic> totalMoneyBody = <dynamic, dynamic>{};
  Map<dynamic, dynamic> razorpayBody = <dynamic, dynamic>{};
  Map<dynamic, dynamic> orderBody = <dynamic, dynamic>{};

  fetchMoneyForOrder(Map<dynamic, dynamic> val) {
    totalMoneyBody = val;
  }

  updateOrdersTab() {
    update(['orders']);
  }

  fetchRazorpay(Map<String, dynamic> val) {
    razorpayBody.addAll(val);
  }

  fetchAdress(List<Address> val, int selectedAdressId) {
    if (val.isNotEmpty) {
      Map<String, dynamic> body = <String, dynamic>{};
      for (var i = 0; i < val.length; i++) {
        var adress = val[i];
        if (adress.addressId == selectedAdressId) {
          body['Address'] = adress.address;
          body['FlatNo'] = adress.flatNo;
          body['City'] = adress.city;
          body['LandMark'] = adress.landmark;
          if (adress.latitude != '') {
            body['Latitude'] = adress.latitude;
          }
          if (adress.longitude != '') {
            body['Longitude'] = adress.longitude;
          }
        }
      }
      adressBody = body;
    }
  }

  fetchCart(Cart? value, context, latitude, longitude) {
    cart = value;
    if (cart != null) {
      Map<String, dynamic> body = <String, dynamic>{};
      List<CartItem> cartItems = cart?.cartItems ?? [];

      body['CartID'] = cart?.cartId;

      body['OrderItems'] = cartItems.toList();

      body['Test'] = cartItems.first.kitItems;

      orderItemBody = body;
    }
  }

  callCreateApi({context, bool isPaymentTypecod = true}) async {
    try {
      orderBody = {
        ...adressBody,
        ...razorpayBody,
        ...totalMoneyBody,
        ...orderItemBody,
      };
      print(orderBody);
      await Get.find<ConfigController>()
          .validateCart(context: context, body: orderBody)
          .then((value) {
        if (value == false) {
          return;
        }
        if (isPaymentTypecod) {
          createOrder(context: context, body: orderBody);
        } else {
          Get.find<OrdersController>()
              .createOrderPayment(context: context, body: orderBody);
        }
      });
    } catch (e) {}
  }

  clearOrderBodyData() {
    Future.delayed(Duration.zero, () {
      orderBody.clear();
      orderItemBody.clear();
      adressBody.clear();
      totalMoneyBody.clear();
      razorpayBody.clear();
    });
  }

  Future<void> createOrder({required context, required body}) async {
    _isPaymentLoading(true);
    final CartController cartController = Get.find();
    final HomeController homeController = Get.find();

    await Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.createOrder(body: body)
                .then((value) => value != null
                    ? {
                        // Print the response for debugging

                        if (value.status == 1)
                          {
                            customToast(message: value.message),

                            // Navigate to SuccessCart and pass the orderID
                            Navigator.of(context).push(MaterialPageRoute(
                                builder: (context) =>
                                    SuccessCart(orderId: value.orderID ?? 0))),

                            cartController.getCart(
                                context: context,
                                longitude: homeController.longitude,
                                latitude: homeController.latitude),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isPaymentLoading(false)
                      }
                    : {customToast(message: 'Error'), _isPaymentLoading(false)})
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isPaymentLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isPaymentLoading(false)});
  }

  CurrentOrderModel? currentOrderModel;
  RxList<Order> orders = RxList();
  CurrentOrderModel? pastOrderModel;
  RxList<Order> pastorders = RxList();
  getcurrentorder({
    required context,
  }) async {
    _isLoading(true);
    Network.networkCheck(context).then((value) => value != null
        ? {
            OrderServices.getcurrentorders()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            currentOrderModel = value,
                            orders(currentOrderModel?.orders),
                            _isLoading(false),
                            updateOrdersTab(),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {customToast(message: 'Error'), _isLoading(false)})
                .catchError((onError) {
              // debugPrint(onError.toString());
              // customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }

  getpastorder({
    required context,
  }) async {
    Future.delayed(
      Duration.zero,
      () => _isLoading(true),
    );
    Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.getpastorders()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            pastOrderModel = value,
                            pastorders(pastOrderModel?.orders),
                            _isLoading(false),
                            updateOrdersTab(),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {customToast(message: 'Error'), _isLoading(false)})
                .catchError((onError) {
              // debugPrint(onError.toString());
              // customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }

  RxMap<String, dynamic> storeContext = <String, dynamic>{}.obs;
  updateContext(Map<String, dynamic> body) {
    storeContext(body);
  }

  clearContext() {
    storeContext.clear();
  }

  Future createOrderPayment({required context, required body}) async {
    _isPaymentLoading(true);
    Map<String, dynamic> bodypayment = <String, dynamic>{};
    await Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.createOrderPayment(body: body)
                .then((value) async => value != null
                    ? {
                        if (value["Status"] == 1)
                          {
                            bodypayment['RazorpayOrderID'] =
                                value['RazorpayOrderID'],
                            fetchRazorpay(bodypayment),
                            await callPayment(
                                orderId: value['RazorpayOrderID'],
                                amount: double.parse(body['OrderAmount'])),
                          }
                        else
                          {
                            customToast(message: value['Message']),
                          },
                        _isPaymentLoading(false)
                      }
                    : {customToast(message: 'Error'), _isPaymentLoading(false)})
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isPaymentLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isPaymentLoading(false)});
  }

  Future reOrder({required context, required body}) async {
    _isPaymentLoading(true);
    await Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.reOrder(body: body)
                .then((value) async => value != null
                    ? {
                        if (value["Status"] == 1)
                          {
                            customToast(message: value['Message']),
                          }
                        else
                          {
                            customToast(message: value['Message']),
                          },
                        _isPaymentLoading(false)
                      }
                    : {customToast(message: 'Error'), _isPaymentLoading(false)})
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isPaymentLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isPaymentLoading(false)});
  }

  Razorpay? _razorpay;
  callPayment({
    required String orderId,
    required double amount,
  }) async {
    _razorpay = Razorpay();
    final ProfileController profileController = Get.find();

    var options = {
      'key': Constants.razorPayKey,
      'retry': {'enabled': true, 'max_count': 1},
      'amount': (100 * amount),
      'order_id': orderId,
      'timeout': 300,
      'prefill': {
        'contact': profileController.users?.mobileNumber,
        'email': profileController.users?.emailId,
      },
    };
    try {
      _razorpay?.open(options);
    } catch (e) {
      print(e.toString());
    }
    _razorpay?.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);

    _razorpay?.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
  }

  _handlePaymentError(PaymentFailureResponse response) {
    customToast(message: response.message ?? '');
    debugPrint('\n\n ${response.message}  \n\n');
    _isPaymentLoading(false);
  }

  clearRazorpay() {
    _razorpay?.clear();
    _isPaymentLoading(false);
    clearContext();
  }

  _handlePaymentSuccess(PaymentSuccessResponse response) {
    Map<String, dynamic> bodypayment = <String, dynamic>{};

    bodypayment['razorpay_payment_id'] = response.paymentId;
    bodypayment['razorpay_signature'] = response.signature;
    fetchRazorpay(bodypayment);

    callCreateApi(context: storeContext['Context'], isPaymentTypecod: true);
    _isPaymentLoading(false);
  }

  final RxBool _isorderDetailsLoading = false.obs;
  RxBool get isorderDetailsLoading => _isorderDetailsLoading;
  removeLoader() {
    Future.delayed(
      Duration.zero,
      () => _isorderDetailsLoading(false),
    );
  }

  updateOrders() {
    update(['update-orders']);
  }

  Ordersdetailsmodel? ordersdetailsmodel;
  Orders? ordersdetails;

  clearOrderDetails() {
    ordersdetails = null;
  }

  getordersDeatils({required context, required int id}) async {
    _isorderDetailsLoading(true);
    Network.networkCheck(context).then((value) => value != null
        ? {
            OrderServices.getordersDetails(id)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            ordersdetailsmodel = value,
                            ordersdetails = ordersdetailsmodel?.orders,
                            updateOrders(),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isorderDetailsLoading(false)
                      }
                    : {
                        customToast(message: 'Error'),
                        _isorderDetailsLoading(false)
                      })
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isorderDetailsLoading(false);
            })
          }
        : {
            customToast(message: 'Network error'),
            _isorderDetailsLoading(false)
          });
  }

  cancelOrders(context, body, orderid) async {
    _isLoading(true);

    Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.cancelOrders(body, orderid)
                .then((value) async => value != null
                    ? {
                        if (value.status == 1)
                          {
                            getcurrentorder(context: context),
                            // getpastorder(context: context),
                            customToast(message: value.message),
                            Navigator.pop(context, true)
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false),
                      }
                    : {
                        customToast(message: 'Error'),
                        _isLoading(false),
                      })
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {
            customToast(message: 'Network error'),
            _isLoading(false),
          });
  }

  sendfeedback(context, body) async {
    _isLoading(true);

    Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.ordersfeedback(body)
                .then((value) async => value != null
                    ? {
                        if (value.status == 1)
                          {
                            customToast(message: value.message),
                            Navigator.pop(context, true)
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false),
                      }
                    : {
                        customToast(message: 'Error'),
                        _isLoading(false),
                      })
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {
            customToast(message: 'Network error'),
            _isLoading(false),
          });
  }
}
