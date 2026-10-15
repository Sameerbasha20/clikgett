import 'package:fav_app/Models/Home/home_model.dart';
import 'package:fav_app/ViewModels/Home/cart_view_mocel.dart';
import 'package:flutter/cupertino.dart';

class ProductViewModel extends ChangeNotifier {
  ProductVariants? selectedCategory;
  int quantity = 0;
  Product? product;
  CartViewModel? cartViewModel;

  ProductVariants? get _selectedCategory => selectedCategory;
  int get _quantity => quantity;
  Product? get _product => product;
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
            for (int i = 0;
                i < cartViewModel!.cartModel!.cart!.cartItems!.length;
                i++) {
              if (product!.productID ==
                  cartViewModel!.cartModel!.cart!.cartItems![i].productID) {
                setQunatity(
                    cartViewModel!.cartModel!.cart!.cartItems![i].quantity);
                // quantity =
                //     cartViewModel!.cartModel!.cart!.cartItems![i].quantity ?? 0;

                break;
              }
            }
          }
        }
      }
    }
    // setState(() {});
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
                  // quantity++;
                }
            });
  }
}
