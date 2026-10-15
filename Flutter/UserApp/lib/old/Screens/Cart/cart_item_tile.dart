import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/ViewModels/Home/cart_product_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/cart_view_model.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class CartItemTile extends StatefulWidget {
  dynamic item;
  CartViewModel? cartViewModel;

  CartItemTile({Key? key, required this.cartViewModel, required this.item})
      : super(key: key);

  @override
  State<CartItemTile> createState() =>
      _CartItemTileState(item: item, cartViewModel: cartViewModel);
}

class _CartItemTileState extends State<CartItemTile> {
  dynamic item;
  CartViewModel? cartViewModel;
  CartProductViewModel? cartProductViewModel;

  _CartItemTileState(
      {Key? key, required this.cartViewModel, required this.item});

  @override
  void initState() {
    // TODO: implement initState
    super.initState();

    //
    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      if (cartProductViewModel != null) {
        cartProductViewModel!.setProduct(item);
        cartProductViewModel!.setCartViewModel(cartViewModel);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      cartProductViewModel = context.watch<CartProductViewModel>();
    }
    return Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        padding: EdgeInsets.symmetric(horizontal: 5, vertical: 5),
        decoration: BoxDecoration(
            border: Border.all(color: tLightGrey),
            borderRadius: BorderRadius.circular(5)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Expanded(
                flex: 3,
                child: Card(
                    child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: CachedNetworkImage(
                    imageUrl: item.imageUrl!,
                    fit: BoxFit.fill,
                    height: 80,
                    width: 80,
                  ),
                ))),
            Expanded(
                flex: 8,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item.productName ?? '',
                        style: normalTextstyle(),
                      ),
                      const SizedBox(
                        height: 10,
                      ),
                      RichText(
                        text: TextSpan(
                            text: '₹ ${item.offerPrice} ',
                            style: normalTextstyle(
                              color: tBlack,
                            ),
                            children: [
                              TextSpan(
                                  text: item.price.toString(),
                                  style: normalTextstyle(
                                      decoration: TextDecoration.lineThrough,
                                      color: tGrey,
                                      fontSize: 12)),
                              TextSpan(
                                  text:
                                      ' ₹${item.price! - item.offerPrice!} off',
                                  style: normalTextstyle(
                                      fontSize: 14, color: tGreen)),
                            ]),
                      ),
                      const SizedBox(
                        height: 10,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: [
                          categoriesWidget(),
                          const SizedBox(
                            width: 10,
                          ),
                          quantityButton()
                        ],
                      )
                    ],
                  ),
                ))
          ],
        ));
  }

  Widget categoriesWidget() {
    return Container(
      height: 25,
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(3),
          border: Border.all(color: tGrey)),
      padding: const EdgeInsets.symmetric(horizontal: 15),
      alignment: Alignment.center,
      child: Text("${item.metricvalue.toString()} ${item.metrictype}"),
    );
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
        child: Row(children: [
          InkWell(
            onTap: () {
              if (item.quantity == 1) {
                cartProductViewModel!.deleteItemFromCart(context: context);
              } else {
                cartProductViewModel!
                    .addtoCart(context: context, quantity: item.quantity! - 1);
              }
            },
            child: Container(
              child: const Icon(
                Icons.remove,
                color: tWhite,
                size: 20,
              ),
            ),
          ),
          Container(
            width: 30,
            alignment: Alignment.center,
            padding: EdgeInsets.symmetric(vertical: 5),
            color: tWhite,
            child: Text(
              item.quantity.toString(),
              style: normalTextstyle(color: tGreen, fontSize: 12),
            ),
          ),
          InkWell(
            onTap: () {
              cartProductViewModel!
                  .addtoCart(context: context, quantity: item.quantity! + 1);
            },
            child: Container(
              child: const Icon(
                Icons.add,
                color: tWhite,
                size: 20,
              ),
            ),
          )
        ]));
  }
}
