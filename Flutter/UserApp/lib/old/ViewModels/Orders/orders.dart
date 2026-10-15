import 'package:fav_app/old/Constants/toast.dart';
import 'package:fav_app/old/Models/Orders/orders.dart';
import 'package:fav_app/old/Models/Orders/ordersdetails.dart';
import 'package:fav_app/old/Models/Orders/promocode_model.dart';
import 'package:fav_app/old/Models/response_model.dart';
import 'package:fav_app/old/Services/Orders/orders.dart';
import 'package:fav_app/old/Services/common/network_check.dart';
import 'package:flutter/cupertino.dart';

class OrdersViewModel extends ChangeNotifier {
  bool isLoading = false;
  bool isCreatingOrder = false;

  CurrentOrderModel? currentOrderModel;
  Ordersdetailsmodel? ordersdetailsmodel;

  // PromoCodeModel? promoCodeModel;

  bool isVerifyingOtp = false;

  bool isApplyingPromo = false;
  bool get _isApplyingPromo => isApplyingPromo;

  bool get _isVerifyingOtp => isVerifyingOtp;

  bool get _isLoading => isLoading;
  CurrentOrderModel? get _currentOrderModel => currentOrderModel;
  bool get _isCreatingOrder => isCreatingOrder;
  // PromoCodeModel? get _promoCodeModel => promoCodeModel;

  setIsCreationOrder(val) {
    isCreatingOrder = val;
    notifyListeners();
  }

  Ordersdetailsmodel? get _ordersdetails => ordersdetailsmodel;

  setcurrentorderData(val) {
    currentOrderModel = val;
    notifyListeners();
  }

  setorderData(val) {
    ordersdetailsmodel = val;
    notifyListeners();
  }

  setLoading(val) {
    isLoading = val;
    notifyListeners();
  }

  setIsApplyingPromo(val) {
    isApplyingPromo = val;
    notifyListeners();
  }

  setIsVerifyingOtp(val) {
    isVerifyingOtp = val;
    notifyListeners();
  }

  Future validatePromo({required context, required body}) async {
    PromoCode? response;
    setIsApplyingPromo(true);
    await Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.validatePromo(body: body).then((value) =>
                value != null
                    ? {
                        if (value.status == 1)
                          {
                            response = value.promoCode,
                            customToast(message: value.message),
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
          }
        : {customToast(message: 'Network error'), setIsApplyingPromo(false)});

    return response;
  }

  Future createOrder({required context, required body}) async {
    ResponseModel? response;
    setIsCreationOrder(true);
    await Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.createOrder(body: body).then((value) => value !=
                    null
                ? {
                    response = value,
                    if (value.status == 1)
                      {
                        customToast(message: value.message),
                      }
                    else
                      {
                        customToast(message: value.message),
                      },
                    setIsCreationOrder(false)
                  }
                : {customToast(message: 'Error'), setIsCreationOrder(false)})
          }
        : {customToast(message: 'Network error'), setIsCreationOrder(false)});

    return response;
  }

  Future createOrderPayment({required context, required body}) async {
    var response;
    setIsCreationOrder(true);
    await Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.createOrderPayment(body: body).then((value) =>
                value != null
                    ? {
                        response = value,
                        if (value["Status"] == 1)
                          {
                            //
                          }
                        else
                          {
                            //
                          },
                        setIsCreationOrder(false)
                      }
                    : {
                        customToast(message: 'Error'),
                        setIsCreationOrder(false)
                      })
          }
        : {customToast(message: 'Network error'), setIsCreationOrder(false)});

    return response;
  }

  getcurrentorder({
    required context,
  }) async {
    setLoading(true);
    Network.networkCheck(context).then((value) => value != null
        ? {
            OrderServices.getcurrentorders().then((value) => value != null
                ? {
                    if (value.status == 1)
                      {setcurrentorderData(value), setLoading(false)}
                    else
                      {
                        customToast(message: value.message),
                      },
                    setLoading(false)
                  }
                : {customToast(message: 'Error'), setLoading(false)})
          }
        : {customToast(message: 'Network error'), setLoading(false)});
  }

  getpastorder({
    required context,
  }) async {
    setLoading(true);
    Network.networkCheck(context).then((value) => value != null
        ? {
            OrderServices.getpastorders().then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        setcurrentorderData(value),
                      }
                    else
                      {
                        customToast(message: value.message),
                      },
                    setLoading(false)
                  }
                : {customToast(message: 'Error'), setLoading(false)})
          }
        : {customToast(message: 'Network error'), setLoading(false)});
  }

  getordersDeatils({required context, required int id}) async {
    setLoading(true);
    Network.networkCheck(context).then((value) => value != null
        ? {
            OrderServices.getordersDetails(id).then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        setorderData(value),
                      }
                    else
                      {
                        customToast(message: value.message),
                      },
                    setLoading(false)
                  }
                : {customToast(message: 'Error'), setLoading(false)})
          }
        : {customToast(message: 'Network error'), setLoading(false)});
  }

  cancelOrders(context, body, orderid) async {
    setIsVerifyingOtp(true);

    Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.cancelOrders(body, orderid)
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
                        setIsVerifyingOtp(false),
                      }
                    : {
                        customToast(message: 'Error'),
                        setIsVerifyingOtp(false),
                      })
          }
        : {
            customToast(message: 'Network error'),
            setIsVerifyingOtp(false),
          });
  }

  sendfeedback(context, body) async {
    setIsVerifyingOtp(true);

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
                        setIsVerifyingOtp(false),
                      }
                    : {
                        customToast(message: 'Error'),
                        setIsVerifyingOtp(false),
                      })
          }
        : {
            customToast(message: 'Network error'),
            setIsVerifyingOtp(false),
          });
  }
}
