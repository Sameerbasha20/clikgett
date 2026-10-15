// ignore_for_file: prefer_typing_uninitialized_variables
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Constants/toast.dart';
import 'package:provider/provider.dart';
import '../../ViewModels/Home/cart_view_model.dart';
import '../../ViewModels/Home/product_view_model.dart';

class SearchItemTile extends StatefulWidget {
  dynamic product;
  CartViewModel? cartViewModel;

  SearchItemTile({
    Key? key,
    required this.product,
    required this.cartViewModel,
  }) : super(key: key);

  @override
  State<SearchItemTile> createState() =>
      // ignore: no_logic_in_create_state
      _ItemTileState(product: product, cartViewModel: cartViewModel);
}

class _ItemTileState extends State<SearchItemTile> {
  dynamic product;
  CartViewModel? cartViewModel;
  ProductViewModel? productViewModel;

  _ItemTileState({required this.product, required this.cartViewModel});
  // List<String> categories = [];
  // String? selectedCategory;
  // int quantity = 0;

  // CartViewModel? cartViewModel;
  // Product product;
  // ProductViewModel? productViewModel;

  // @override
  // void initState() {
  //   // TODO: implement initState
  //   super.initState();
  //   categories = ['${widget.metricvalue} ${widget.metricType}'];
  //   if (categories.isNotEmpty) {
  //     selectedCategory = categories[0];
  //   }
  // }

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

            print('\n\n fff\n\n');
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
            Expanded(flex: 3, child: imageWidget()),
            Expanded(flex: 8, child: bodyWidget())
          ],
        ));
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
            product.productName ?? "",
            style: normalTextstyle(),
          ),
          const SizedBox(
            height: 10,
          ),
          productViewModel!.selectedCategory == null
              ? Container()
              : RichText(
                  text: TextSpan(
                      text:
                          '₹${productViewModel!.selectedCategory!.offerPrice.toString()}',
                      style: normalTextstyle(
                        color: tBlack,
                      ),
                      children: [
                        TextSpan(
                            text:
                                '₹${productViewModel!.selectedCategory!.price.toString()}',
                            style: normalTextstyle(
                                decoration: TextDecoration.lineThrough,
                                color: tGrey,
                                fontSize: 12)),
                        TextSpan(
                            text:
                                ' ₹${productViewModel!.selectedCategory!.price! - productViewModel!.selectedCategory!.offerPrice!} off',
                            style:
                                normalTextstyle(fontSize: 14, color: tGreen)),
                      ]),
                ),
          const SizedBox(
            height: 10,
          ),
          Row(
            children: [
              categoriesWidget(),
              const SizedBox(
                width: 10,
              ),
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
        padding: const EdgeInsets.symmetric(vertical: 1, horizontal: 5),
        decoration: BoxDecoration(
            border: Border.all(color: tBlack),
            borderRadius: BorderRadius.circular(5)),
        child: DropdownButton(
            isDense: true,
            elevation: 0,
            icon: Icon(Icons.keyboard_arrow_down_sharp),
            hint: Text('Variant'),
            value: productViewModel!.selectedCategory,
            items: product.productVariants!.map((dynamic val) {
              return DropdownMenuItem<dynamic>(
                  value: val,
                  child: Text(
                    "${val.metricvalue.toString()} ${val.metrictype}",
                    style: TextStyle(color: tBlack),
                  ));
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
    return Container(
        margin: EdgeInsets.all(4),
        decoration: BoxDecoration(border: Border.all(color: Colors.black12)),
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: CachedNetworkImage(
            imageUrl: product.imageUrl ?? "",
            fit: BoxFit.cover,
            height: 80,
            width: 80,
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
                // quantity--;
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
            padding: EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            color: tWhite,
            child: Text(
              productViewModel!.quantity.toString(),
              style: normalTextstyle(color: tGreen),
            ),
          ),
          InkWell(
            onTap: () {
              setState(() {
                if (productViewModel!.quantity >
                    productViewModel!.selectedCategory!.availableQty!) {
                  customToast(message: 'No More Quantity Available');
                } else {
                  productViewModel!.addQunatity(context: context);
                }
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
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(
              horizontal: 10,
            ),
            color: tGreen,
            child: Text(
              'ADD',
              style: normalTextstyle(color: tWhite),
            ),
          ),
          const Icon(
            Icons.add,
            color: tGreen,
            size: 20,
          )
        ]),
      ),
    );
  }
}
