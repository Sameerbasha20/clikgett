import 'package:fav_app/old/ViewModels/Home/cart_view_model.dart';
import 'package:flutter/cupertino.dart';

class CartProductViewModel extends ChangeNotifier {
  dynamic? product;
  dynamic? get _product => product;
  CartViewModel? cartViewModel;

  setProduct(val) {
    product = val;
    notifyListeners();
  }

  setCartViewModel(val) {
    cartViewModel = val;

    notifyListeners();
  }

  addtoCart({required context, required quantity}) {
    Map<String, dynamic> body = Map<String, dynamic>();
    body['ProductID'] = product!.productID;
    body['VariantID'] = product!.variantID;
    body['Quantity'] = quantity;

    cartViewModel!.addCart(context: context, body: body).then((value) => {
          if (value == true)
            {
              //
              cartViewModel!.getCart(context: context),
            }
          else
            {
              // if failed
              // setQunatity(quantity--),
              // quantity--;
            }
        });
  }

  deleteItemFromCart({
    required context,
    // required dynamic productId,
    // required dynamic variantId,
  }) {
    cartViewModel!
        .deleteItemFromCart(
            context: context,
            variantId: product!.variantID,
            productId: product!.productID)
        .then((value) => {
              if (value == true)
                {
                  //
                  cartViewModel!.getCart(context: context),
                }
              else
                {
                  // if failed
                  // setQunatity(quantity++),
                  // addQunatity(context: context),
                  // quantity++;
                }
            });
  }
}
