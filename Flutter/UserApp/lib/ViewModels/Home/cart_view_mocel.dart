import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/Models/Home/cart_model.dart';
import 'package:fav_app/Services/Home/cart_services.dart';
import 'package:fav_app/Services/common/network_check.dart';
import 'package:flutter/cupertino.dart';

class CartViewModel extends ChangeNotifier {
  bool isLoadingCart = false;

  CartModel? cartModel;

  bool get _isLoading => isLoadingCart;
  CartModel? get _cartModel => cartModel;

  setCartData(val) {
    cartModel = val;
    debugPrint("cart:  ${cartModel!.toJson()}");
    notifyListeners();
  }

  setLoading(val) {
    isLoadingCart = val;
    notifyListeners();
  }

  getCart({
    required context,
  }) async {
    setLoading(true);
    // Timer(Duration(seconds: 2), () {
    Network.networkCheck(context).then((value) => value != null
        ? {
            CartServices.getCart().then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        setCartData(value),
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
    // });
  }

  Future<bool> addCart({required context, required body}) async {
    bool success = false;
    setLoading(true);
    // Timer(Duration(seconds: 2), () {
    await Network.networkCheck(context).then((onValue) async => onValue != null
        ? {
            await CartServices.addCart(body: body).then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        customToast(message: value.message),
                        success = true,
                        getCart(context: context),
                      }
                    else
                      {
                        success = false,
                        customToast(message: value.message),
                      },
                    setLoading(false)
                  }
                : {
                    success = false,
                    customToast(message: 'Error'),
                    setLoading(false)
                  })
          }
        : {
            success = false,
            customToast(message: 'Network error'),
            setLoading(false)
          });
    // });

    return success;
  }

  Future<bool> deleteItemFromCart(
      {required context, required productId, required variantId}) async {
    bool success = false;
    setLoading(true);
    // Timer(Duration(seconds: 2), () {
    await Network.networkCheck(context).then((onValue) async => onValue != null
        ? {
            await CartServices.deleteItemFromCart(
                    productId: productId, variantId: variantId)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            customToast(message: value.message),
                            success = true,
                            getCart(context: context),
                          }
                        else
                          {
                            success = false,
                            customToast(message: value.message),
                          },
                        setLoading(false)
                      }
                    : {
                        success = false,
                        customToast(message: 'Error'),
                        setLoading(false)
                      })
          }
        : {
            success = false,
            customToast(message: 'Network error'),
            setLoading(false)
          });
    // });

    return success;
  }
}
