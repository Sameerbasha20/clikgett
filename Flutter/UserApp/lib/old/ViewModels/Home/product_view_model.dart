import 'package:fav_app/old/ViewModels/Home/cart_view_model.dart';
import 'package:flutter/cupertino.dart';

class ProductViewModel extends ChangeNotifier {
  dynamic? selectedCategory;
  int quantity = 0;
  dynamic? product;
  CartViewModel? cartViewModel;

  dynamic? get _selectedCategory => selectedCategory;
  int get _quantity => quantity;
  dynamic? get _product => product;
  CartViewModel? get _cartViewModel => cartViewModel;

  setCartViewModel(val) {
    cartViewModel = val;

    notifyListeners();
  }

  setProduct(val) {
    product = val;
    notifyListeners();
  }

  setSelectedCategory(val) {
    selectedCategory = val;
    notifyListeners();
    loadCart();
  }

  setQunatity(val) {
    quantity = val;
    notifyListeners();
  }

  addQunatity({required context}) {
    quantity++;

    notifyListeners();
    addtoCart(context: context);
  }

  decreaseQunatity({required context}) async {
    quantity--;
    notifyListeners();

    if (quantity == 0) {
      await deleteItemFromCart(
          context: context,
          productId: selectedCategory!.productID,
          variantId: selectedCategory!.variantID);

      // loadCart();
    } else {
      addtoCart(context: context);
    }
  }

  loadCart() {
    if (cartViewModel != null) {
      if (cartViewModel!.cartModel != null) {
        if (cartViewModel!.cartModel!.cart != null) {
          if (cartViewModel!.cartModel!.cart!.cartItems != null) {
            int i = 0;
            for (i = 0;
                i < cartViewModel!.cartModel!.cart!.cartItems!.length;
                i++) {
              if (product!.productID ==
                      cartViewModel!.cartModel!.cart!.cartItems![i].productId &&
                  selectedCategory!.variantID ==
                      cartViewModel!.cartModel!.cart!.cartItems![i].productId) {
                setQunatity(
                    cartViewModel!.cartModel!.cart!.cartItems![i].quantity);
                // quantity =
                //     cartViewModel!.cartModel!.cart!.cartItems![i].quantity ?? 0;

                break;
              }
            }
            if (i == cartViewModel!.cartModel!.cart!.cartItems!.length) {
              setQunatity(0);
            }
          } else {
            setQunatity(0);
          }
        } else {
          setQunatity(0);
        }
      } else {
        setQunatity(0);
      }
    } else {
      setQunatity(0);
    }
    notifyListeners();
  }

  addtoCart({required context}) {
    Map<String, dynamic> body = Map<String, dynamic>();
    body['ProductID'] = selectedCategory!.productID;
    body['VariantID'] = selectedCategory!.variantID;
    body['Quantity'] = quantity;

    cartViewModel!.addCart(context: context, body: body).then((value) => {
          if (value == true)
            {
              //
            }
          else
            {
              // if failed
              setQunatity(quantity--),
              // quantity--;
            }
        });
  }

  deleteItemFromCart({
    required context,
    required dynamic productId,
    required dynamic variantId,
  }) {
    cartViewModel!
        .deleteItemFromCart(
            context: context, variantId: variantId, productId: productId)
        .then((value) => {
              if (value == true)
                {
                  //
                  debugPrint("$quantity")
                }
              else
                {
                  // if failed
                  setQunatity(quantity++),
                  // addQunatity(context: context),
                  // quantity++;
                }
            });
  }
}
