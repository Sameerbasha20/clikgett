import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/ViewModels/Home/cart_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/product_view_model.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class GridItemTile extends StatefulWidget {
  dynamic product;
  CartViewModel? cartViewModel;
  GridItemTile({
    Key? key,
    required this.product,
    required this.cartViewModel,
  }) : super(key: key);

  @override
  State<GridItemTile> createState() =>
      _GridItemTileState(product: product, cartViewModel: cartViewModel);
}

class _GridItemTileState extends State<GridItemTile> {
  // List<String> categories = ['1 Kg', '2 Kg'];
  // String? selectedCategory;
  // int quantity = 0;

  dynamic product;
  CartViewModel? cartViewModel;

  ProductViewModel? productViewModel;

  _GridItemTileState({
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
  void dispose() {
    // TODO: implement dispose
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      productViewModel = context.watch<ProductViewModel>();
    }
    return Container(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Expanded(flex: 4, child: imageWidget()),
            Expanded(flex: 7, child: bodyWidget())
          ],
        ));
  }

  Widget bodyWidget() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 3.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            product.productName ?? 'Product',
            overflow: TextOverflow.ellipsis,
            style: normalTextstyle(fontSize: 14),
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
        height: 20,
        padding: const EdgeInsets.symmetric(horizontal: 2),
        decoration: BoxDecoration(
            border: Border.all(color: tBlack),
            borderRadius: BorderRadius.circular(5)),
        child: DropdownButton<dynamic>(
            isDense: true,
            elevation: 0,
            icon: const Icon(
              Icons.keyboard_arrow_down_sharp,
              size: 15,
            ),
            hint: Text('Variant'),
            style: normalTextstyle(fontSize: 12, color: tBlack),
            value: productViewModel!.selectedCategory,
            items: product.productVariants!.map((dynamic val) {
              return DropdownMenuItem<dynamic>(
                  value: val,
                  child:
                      Text("${val.metricvalue.toString()} ${val.metrictype}"));
            }).toList(),
            onChanged: (dynamic? value) {
              setState(() {
                // selectedCategory = value;
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
            )
          : Image.asset(
              'Assets/Images/apple.png',
              fit: BoxFit.fill,
              // height: MediaQuery.of(context).size.width / 6,
              // width: MediaQuery.of(context).size.width / 6,
            ),
    ));
  }

  Widget quantityButton() {
    return Container(
      height: 20,
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
                productViewModel!.decreaseQunatity(context: context);
              });
            },
            child: Container(
              child: const Icon(Icons.remove, color: tWhite, size: 15),
            ),
          ),
          Container(
            height: 20,
            width: 20,
            alignment: Alignment.center,
            // padding: EdgeInsets.symmetric(horizontal: 5),
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
          productViewModel!.setQunatity(1);
          productViewModel!.addtoCart(context: context);
        });
      },
      child: Container(
        height: 20,
        decoration: BoxDecoration(
            border: Border.all(
              color: tGreen,
            ),
            borderRadius: BorderRadius.circular(3)),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(
              horizontal: 5,
            ),
            height: 20,
            color: tGreen,
            child: Text(
              'ADD',
              style: normalTextstyle(color: tWhite, fontSize: 14),
            ),
          ),
          const Icon(
            Icons.add,
            color: tGreen,
            size: 10,
          )
        ]),
      ),
    );
  }
}
