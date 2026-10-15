import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/Models/Orders/orders.dart';
import 'package:fav_app/Models/Orders/ordersdetails.dart';
import 'package:fav_app/Services/Orders/orders.dart';
import 'package:fav_app/Services/common/network_check.dart';
import 'package:flutter/cupertino.dart';

class OrdersViewModel extends ChangeNotifier {
  bool isLoading = false;

  CurrentOrderModel? currentOrderModel;
  Ordersdetailsmodel? ordersdetailsmodel;

  bool get _isLoading => isLoading;
  CurrentOrderModel? get _currentOrderModel => currentOrderModel;
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

  bool isVerifyingOtp = false;

  bool get _isVerifyingOtp => isVerifyingOtp;

  setIsVerifyingOtp(val) {
    isVerifyingOtp = val;
    notifyListeners();
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
