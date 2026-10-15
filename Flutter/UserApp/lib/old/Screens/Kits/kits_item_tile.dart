import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/ViewModels/Home/cart_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/product_view_model.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class KitsItemTile extends StatefulWidget {
  dynamic product;
  CartViewModel? cartViewModel;

  KitsItemTile({
    Key? key,
    required this.product,
    required this.cartViewModel,
  }) : super(key: key);

  @override
  State<KitsItemTile> createState() =>
      // ignore: no_logic_in_create_state
      _KitsItemTileState(product: product, cartViewModel: cartViewModel);
}

class _KitsItemTileState extends State<KitsItemTile> {
  dynamic product;
  CartViewModel? cartViewModel;
  ProductViewModel? productViewModel;

  _KitsItemTileState({
    Key? key,
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
          productViewModel!.selectedCategory = product.productVariants![0];
        }

        if (productViewModel!.cartViewModel != null) {
          cartViewModel!.addListener(() async {
            if (cartViewModel != null) {
              await productViewModel!.setCartViewModel(cartViewModel);
            }
            productViewModel!.loadCart();
          });
        }

        //
        if (product.productVariants!.isNotEmpty) {
          productViewModel!.selectedCategory = product.productVariants![0];
          productViewModel!.loadCart();
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      productViewModel = context.watch<ProductViewModel>();
    }
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 5),
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: tLightGrey)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: ImageWidget(),
          ),
          Expanded(flex: 6, child: bodyWidget())
        ],
      ),
    );
  }

  Widget bodyWidget() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Text(
              product.productName ?? 'Product',
              overflow: TextOverflow.ellipsis,
              style: normalTextstyle(
                  fontSize: 14, fontWeight: FontWeight.w600, color: tBlack),
            ),
            Text(
              product.description ?? '',
              overflow: TextOverflow.ellipsis,
              style: normalTextstyle(fontSize: 14, color: tGrey),
            ),
            const SizedBox(
              height: 5,
            ),
            priceWidget(),
            const SizedBox(
              height: 5,
            ),
            productViewModel!.quantity == 0 ? addButton() : quantityButton()
          ]),
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
        width: 100,
        decoration: BoxDecoration(
            border: Border.all(
              color: tGreen,
            ),
            color: tGreen,
            borderRadius: BorderRadius.circular(3)),
        alignment: Alignment.center,
        child: Text(
          'Add To Cart',
          style: normalTextstyle(color: tWhite, fontSize: 14),
        ),
      ),
    );
  }

  Widget quantityButton() {
    return Container(
      height: 25,
      // width: 100,
      decoration: BoxDecoration(
          border: Border.all(
            color: tGreen,
          ),
          color: tGreen,
          borderRadius: BorderRadius.circular(3)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          InkWell(
            onTap: () {
              setState(() {
                productViewModel!.decreaseQunatity(context: context);
              });
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
            width: 50,
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(vertical: 5),
            color: tWhite,
            child: Text(
              productViewModel!.quantity.toString(),
              style: normalTextstyle(color: tGreen, fontSize: 14),
            ),
          ),
          InkWell(
            onTap: () {
              setState(() {
                productViewModel!.addQunatity(context: context);
              });
            },
            child: Container(
              child: const Icon(
                Icons.add,
                color: tWhite,
                size: 20,
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget priceWidget() {
    return productViewModel!.selectedCategory == null
        ? Container()
        : RichText(
            text: TextSpan(
                text: '₹' +
                    productViewModel!.selectedCategory!.offerPrice!.toString() +
                    " ",
                style: normalTextstyle(color: tBlack, fontSize: 12),
                children: [
                  TextSpan(
                      text:
                          productViewModel!.selectedCategory!.price.toString(),
                      style: normalTextstyle(
                          decoration: TextDecoration.lineThrough,
                          color: tGrey,
                          fontSize: 10)),
                  TextSpan(
                      text:
                          ' ₹${productViewModel!.selectedCategory!.price! - productViewModel!.selectedCategory!.offerPrice!} off',
                      style: normalTextstyle(fontSize: 12, color: tGreen)),
                ]),
          );
  }

  Widget ImageWidget() {
    return Stack(
      children: [
        Container(
          width: double.maxFinite,
          child: ClipRRect(
            borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(15), bottomLeft: Radius.circular(15)),
            child: product.imageUrl != 'NA'
                ? CachedNetworkImage(
                    imageUrl: product.imageUrl!,
                    fit: BoxFit.cover,
                    height: MediaQuery.of(context).size.height / 7,
                  )
                : Image.asset(
                    'Assets/Images/apple.png',
                    fit: BoxFit.cover,
                    height: MediaQuery.of(context).size.height / 7,
                  ),
          ),
        ),
        // Positioned(top: 0, left: 20, child: offerPerTag()),
      ],
    );
  }

  Widget offerPerTag() {
    return productViewModel!.selectedCategory == null
        ? Container()
        : Container(
            decoration: const BoxDecoration(
              color: tGreen,
            ),
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 3),
            child: Text(
              "${((productViewModel!.selectedCategory!.price! - productViewModel!.selectedCategory!.offerPrice!) % (productViewModel!.selectedCategory!.price! * 100)).toStringAsFixed(0)}\nOFF",
              style: normalTextstyle(color: tWhite, fontSize: 12),
              textAlign: TextAlign.center,
            ),
          );
    // : Container(
    //     child: Expanded(
    //       child: Icon(
    //         Icons.bookmark,
    //         color: tGreen,
    //         semanticLabel:
    //             "${((productViewModel!.selectedCategory!.price! - productViewModel!.selectedCategory!.offerPrice!) % (productViewModel!.selectedCategory!.price! * 100)).toStringAsFixed(0)}\nOFF",
    //       ),
    //     ),
    //   );
  }
}
