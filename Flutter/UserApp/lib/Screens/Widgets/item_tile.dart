// ignore_for_file: prefer_typing_uninitialized_variables

import 'package:flutter/material.dart';

import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/Constants/toast.dart';

import '../../Models/Home/search_model.dart';

class ItemTile extends StatefulWidget {
  Product product;
  ItemTile({
    Key? key,
    required this.product,
    this.productname,
    this.price,
    this.offerPrice,
    this.percentage,
    this.metricvalue,
    this.metricType,
    this.availableQuantity,
    this.profilePic,
  }) : super(key: key);

  final productname;
  final price;
  final offerPrice;
  final percentage;
  final metricvalue;
  final metricType;
  final availableQuantity;
  final profilePic;

  @override
  State<ItemTile> createState() => _ItemTileState();
}

class _ItemTileState extends State<ItemTile> {
  List<String> categories = [];
  String? selectedCategory;
  int quantity = 0;

  // CartViewModel? cartViewModel;
  // Product product;
  // ProductViewModel? productViewModel;

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    categories = ['${widget.metricvalue} ${widget.metricType}'];
    if (categories.isNotEmpty) {
      selectedCategory = categories[0];
    }
    // WidgetsBinding.instance!.addPostFrameCallback((timeStamp) {
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

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
            widget.productname,
            style: normalTextstyle(),
          ),
          const SizedBox(
            height: 10,
          ),
          RichText(
            text: TextSpan(
                text: '₹${widget.offerPrice.toString()}',
                style: normalTextstyle(
                  color: tBlack,
                ),
                children: [
                  TextSpan(
                      text: '₹${widget.price.toString()}',
                      style: normalTextstyle(
                          decoration: TextDecoration.lineThrough,
                          color: tGrey,
                          fontSize: 12)),
                  TextSpan(
                      text: ' ₹${widget.percentage.toString()} off',
                      style: normalTextstyle(fontSize: 14, color: tGreen)),
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
              quantity == 0 ? addButton() : quantityButton()
            ],
          )
        ],
      ),
    );
  }

  Widget categoriesWidget() {
    return DropdownButtonHideUnderline(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 5),
        decoration: BoxDecoration(
            border: Border.all(color: tBlack),
            borderRadius: BorderRadius.circular(5)),
        child: DropdownButton(
            isDense: true,
            elevation: 0,
            icon: Icon(Icons.keyboard_arrow_down_sharp),
            hint: Text('Age'),
            value: selectedCategory,
            items: categories.map((String val) {
              return DropdownMenuItem<String>(
                  value: val,
                  child: Text(
                    val.toString(),
                    style: TextStyle(color: tBlack),
                  ));
            }).toList(),
            onChanged: (String? value) {
              setState(() {
                selectedCategory = value;
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
          child: Image.network(
            widget.profilePic,
            fit: BoxFit.cover,
            height: 80,
            width: 80,
          ),
        ));
  }

  Widget quantityButton() {
    return Container(
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
                quantity--;
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
              quantity.toString(),
              style: normalTextstyle(color: tGreen),
            ),
          ),
          InkWell(
            onTap: () {
              setState(() {
                if (quantity > widget.availableQuantity) {
                  customToast(message: 'No More Quantity Available');
                } else {
                  quantity++;
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
          quantity = 1;
        });
      },
      child: Container(
        decoration: BoxDecoration(
            border: Border.all(
              color: tGreen,
            ),
            borderRadius: BorderRadius.circular(3)),
        child: Row(children: [
          Container(
            padding: EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
