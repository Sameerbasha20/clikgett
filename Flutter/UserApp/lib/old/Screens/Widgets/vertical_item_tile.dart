import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/ViewModels/Home/cart_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/product_view_model.dart';

class VerticalItemTile extends StatefulWidget {
  dynamic product;
  CartViewModel? cartViewModel;

  VerticalItemTile({
    Key? key,
    required this.product,
    required this.cartViewModel,
  }) : super(key: key);

  @override
  State<VerticalItemTile> createState() =>
      _VerticalItemTileState(product: product, cartViewModel: cartViewModel);
}

class _VerticalItemTileState extends State<VerticalItemTile> {
  // List<String> categories = ['1 Kg', '2 Kg'];
  // ProductVariants? selectedCategory;
  // int quantity = 0;
  dynamic product;
  CartViewModel? cartViewModel;

  ProductViewModel? productViewModel;

  _VerticalItemTileState({
    required this.product,
    required this.cartViewModel,
  });

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      if (productViewModel != null) {
        productViewModel!.setProduct(product);
        productViewModel!.setCartViewModel(cartViewModel);
        if (product.productVariants!.isNotEmpty) {
          // selectedCategory = categories[0];
          productViewModel!.selectedCategory = product.productVariants![0];
          // productViewModel!.loadCart();
        }

        if (productViewModel!.cartViewModel != null) {
          // productViewModel!.loadCart();

          cartViewModel!.addListener(() async {
            // debugPrint(
            //     " add listner ${productViewModel!.cartViewModel!.cartModel}");
            // loadCart();
            if (cartViewModel != null) {
              await productViewModel!.setCartViewModel(cartViewModel);
            }
            productViewModel!.loadCart();

            // loadCart();
            print('\n\n fff\n\n');
          });
        }

        //
        if (product.productVariants!.isNotEmpty) {
          // selectedCategory = categories[0];
          productViewModel!.selectedCategory = product.productVariants![0];
          productViewModel!.loadCart();
        }
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  // loadCart() {
  //   if (cartViewModel != null) {
  //     if (cartViewModel!.cartModel != null) {
  //       if (cartViewModel!.cartModel!.cart != null) {
  //         if (cartViewModel!.cartModel!.cart!.cartItems != null) {
  //           int i = 0;
  //           for (i = 0;
  //               i < cartViewModel!.cartModel!.cart!.cartItems!.length;
  //               i++) {
  //             if (product.productID ==
  //                 cartViewModel!.cartModel!.cart!.cartItems![i].productID) {
  //               // quantity =
  //               //     cartViewModel!.cartModel!.cart!.cartItems![i].quantity ?? 0;
  //               debugPrint(
  //                   "${cartViewModel!.cartModel!.cart!.cartItems![i].quantity}");
  //               productViewModel!.setQunatity(
  //                   cartViewModel!.cartModel!.cart!.cartItems![i].quantity ??
  //                       0);
  //               break;
  //             }
  //           }
  //           if (i == cartViewModel!.cartModel!.cart!.cartItems!.length) {
  //             productViewModel!.setQunatity(0);
  //           }
  //         } else {
  //           productViewModel!.setQunatity(0);
  //         }
  //       } else {
  //         productViewModel!.setQunatity(0);
  //       }
  //     } else {
  //       productViewModel!.setQunatity(0);
  //     }
  //   } else {
  //     productViewModel!.setQunatity(0);
  //   }
  //   setState(() {});
  // }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      productViewModel = context.watch<ProductViewModel>();
      // cartViewModel = context.watch<CartViewModel>();
      // WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      //   if (productViewModel != null) {
      //     productViewModel!.setProduct(product);
      //     productViewModel!.setCartViewModel(cartViewModel);
      //     if (product.productVariants!.isNotEmpty) {
      //       // selectedCategory = categories[0];
      //       productViewModel!.selectedCategory = product.productVariants![0];
      //       productViewModel!.loadCart();
      //     }

      //     if (productViewModel!.cartViewModel != null) {
      //       productViewModel!.loadCart();

      //       // productViewModel!.cartViewModel!.addListener(() {
      //       //   // debugPrint(
      //       //   //     " add listner ${productViewModel!.cartViewModel!.cartModel}");
      //       //   // loadCart();
      //       //   productViewModel!.loadCart();
      //       // });
      //     }

      //     //
      //     if (product.productVariants!.isNotEmpty) {
      //       // selectedCategory = categories[0];
      //       productViewModel!.selectedCategory = product.productVariants![0];
      //       productViewModel!.loadCart();
      //     }
      //   }
      // });
    }

    return InkWell(
      // onTap: () {},
      child: Container(
          margin: const EdgeInsets.all(5.0),
          width: MediaQuery.of(context).size.width / 3,
          // height: MediaQuery.of(context).size.height / 4,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [imageWidget(), bodyWidget()],
          )),
    );
  }

  Widget bodyWidget() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            // 'Apple - Red Delicious, Premium',
            product.productName ?? 'Product',
            overflow: TextOverflow.ellipsis,
            style: normalTextstyle(fontSize: 12),
          ),
          const SizedBox(
            height: 10,
          ),
          productViewModel!.selectedCategory == null
              ? Container()
              : RichText(
                  text: TextSpan(
                      text: '₹' +
                          productViewModel!.selectedCategory!.offerPrice!
                              .toString() +
                          " ",
                      style: normalTextstyle(color: tBlack, fontSize: 12),
                      children: [
                        TextSpan(
                            text: productViewModel!.selectedCategory!.price
                                .toString(),
                            style: normalTextstyle(
                                decoration: TextDecoration.lineThrough,
                                color: tGrey,
                                fontSize: 10)),
                        TextSpan(
                            text:
                                ' ₹${productViewModel!.selectedCategory!.price! - productViewModel!.selectedCategory!.offerPrice!} off',
                            style:
                                normalTextstyle(fontSize: 12, color: tGreen)),
                      ]),
                ),
          const SizedBox(
            height: 10,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              categoriesWidget(),
              productViewModel!.quantity == 0 ? addButton() : quantityButton()
            ],
          )
        ],
      ),
    );
  }

  Widget categoriesWidget() {
    return DropdownButtonHideUnderline(
      child: Container(
        height: 25,
        padding: const EdgeInsets.symmetric(horizontal: 1),
        decoration: BoxDecoration(
            border: Border.all(color: tBlack),
            borderRadius: BorderRadius.circular(3)),
        child: DropdownButton<dynamic>(
            isDense: true,
            elevation: 0,
            icon: const Icon(
              Icons.arrow_drop_down_rounded,
              size: 12,
            ),
            hint: Text('Variant'),
            value: productViewModel!.selectedCategory,
            style: normalTextstyle(fontSize: 12, color: tBlack),
            items: product.productVariants!.map((dynamic val) {
              return DropdownMenuItem<dynamic>(
                  value: val,
                  child:
                      Text("${val.metricvalue.toString()} ${val.metrictype}"));
            }).toList(),
            onChanged: (dynamic? value) {
              setState(() {
                // productViewModel!.selectedCategory = value;
                productViewModel!.setSelectedCategory(value);
              });
            }),
      ),
    );
  }

  Widget imageWidget() {
    return Card(
        child: Padding(
      padding: const EdgeInsets.all(8.0),
      child: product.imageUrl != 'NA'
          ? CachedNetworkImage(
              imageUrl: product.imageUrl!,
              fit: BoxFit.fill,
              height: MediaQuery.of(context).size.width / 3.5,
              width: MediaQuery.of(context).size.width / 3.5,
            )
          : Image.asset(
              'Assets/Images/apple.png',
              fit: BoxFit.fill,
              height: MediaQuery.of(context).size.width / 3.5,
              width: MediaQuery.of(context).size.width / 3.5,
            ),
    ));
  }

  Widget quantityButton() {
    return Container(
      height: 25,
      decoration: BoxDecoration(
          border: Border.all(
            color: tGreen,
          ),
          color: tGreen,
          borderRadius: BorderRadius.circular(3)),
      child: Row(
        children: [
          InkWell(
            onTap: () {
              setState(() {
                // productViewModel!
                //     .setQunatity(productViewModel!.quantity--)
                //     .then((value) => {
                //           if (productViewModel!.quantity == 0)
                //             {
                //               productViewModel!.deleteItemFromCart(
                //                   context: context,
                //                   productId: productViewModel!
                //                       .selectedCategory!.productID,
                //                   variantId: productViewModel!
                //                       .selectedCategory!.variantID),
                //             }
                //           else
                //             {
                //               productViewModel!.addtoCart(context: context),
                //             }
                //         });
                // quantity--;
                productViewModel!.decreaseQunatity(context: context);
              });
            },
            child: Container(
              child: const Icon(
                Icons.remove,
                color: tWhite,
                size: 15,
              ),
            ),
          ),
          Container(
            width: 25,
            alignment: Alignment.center,
            padding: EdgeInsets.symmetric(vertical: 5),
            color: tWhite,
            child: Text(
              productViewModel!.quantity.toString(),
              style: normalTextstyle(color: tGreen, fontSize: 12),
            ),
          ),
          InkWell(
            onTap: () {
              setState(() {
                // productViewModel!
                //     .setQunatity(productViewModel!.quantity + 1)
                //     .then((value) => {
                //           debugPrint("${productViewModel!.quantity}"),
                //           productViewModel!.addtoCart(context: context),
                //         });
                // quantity++;
                productViewModel!.addQunatity(context: context);
              });
            },
            child: Container(
              child: const Icon(
                Icons.add,
                color: tWhite,
                size: 15,
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget addButton() {
    return InkWell(
      onTap: () {
        setState(() {
          // quantity = 1;
          productViewModel!.setQunatity(1);
          productViewModel!.addtoCart(context: context);
        });
      },
      child: Container(
        height: 25,
        decoration: BoxDecoration(
            border: Border.all(
              color: tGreen,
            ),
            borderRadius: BorderRadius.circular(3)),
        child: Row(children: [
          Container(
            height: 25,
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(
              horizontal: 10,
            ),
            color: tGreen,
            child: Text(
              'ADD',
              style: normalTextstyle(color: tWhite, fontSize: 12),
            ),
          ),
          const Icon(
            Icons.add,
            color: tGreen,
            size: 15,
          )
        ]),
      ),
    );
  }
}
