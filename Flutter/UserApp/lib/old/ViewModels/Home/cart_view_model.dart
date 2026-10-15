import 'package:fav_app/old/Constants/toast.dart';
import 'package:fav_app/old/Models/Home/cart_model.dart';
import 'package:fav_app/old/Services/Home/cart_services.dart';
import 'package:fav_app/old/Services/common/network_check.dart';
import 'package:flutter/cupertino.dart';

class CartViewModel extends ChangeNotifier {
  bool isLoadingCart = false;
  double subTotalAmount = 0;

  CartModel? cartModel;

  bool get _isLoading => isLoadingCart;
  CartModel? get _cartModel => cartModel;
  double? get _subTotalCAmount => subTotalAmount;

  setCartData(val) {
    cartModel = val;
    // debugPrint("cart:  ${cartModel!.toJson()}");
    if (cartModel != null) {
      if (cartModel!.cart != null) {
        if (cartModel!.cart!.cartItems != null) {
          double total = 0;
          for (int i = 0; i < cartModel!.cart!.cartItems!.length; i++) {
            total = total +
                (cartModel!.cart!.cartItems![i].offerPrice!.toDouble() *
                    cartModel!.cart!.cartItems![i].quantity!);
          }
          setsubTotalAmount(total);
        }
      }
    }
    notifyListeners();
  }

  setsubTotalAmount(val) {
    subTotalAmount = val;
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
    // Network.networkCheck(context).then((value) => value != null
    //     ? {
    //         CartServices.getCart().then((value) => value != null
    //             ? {
    //                 if (value.status == 1)
    //                   {
    //                     setCartData(value),
    //                   }
    //                 else
    //                   {
    //                     customToast(message: value.message),
    //                   },
    //                 setLoading(false)
    //               }
    //             : {customToast(message: 'Error'), setLoading(false)})
    //       }
    //     : {customToast(message: 'Network error'), setLoading(false)});
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
                    type: 1, productId: productId, variantId: variantId)
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
