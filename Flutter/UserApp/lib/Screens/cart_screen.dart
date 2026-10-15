import 'package:fav_app/Constants/button.dart';
import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/Models/Account/adresses.dart';
import 'package:fav_app/Screens/Account/manage_address.dart';
import 'package:fav_app/Screens/Widgets/appbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../ViewModels/Home/cart_view_mocel.dart';

class CartScreen extends StatefulWidget {
  CartScreen({Key? key}) : super(key: key);

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  CartViewModel? cartViewModel;

  Address? selectedAddress;

  @override
  void initState() {
    // TODO: implement initState
    super.initState();

    WidgetsBinding.instance!.addPostFrameCallback((timeStamp) {
      if (cartViewModel != null) {
        cartViewModel!.getCart(context: context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      cartViewModel = context.watch<CartViewModel>();
    }
    return Material(
      child: Scaffold(
        backgroundColor: tWhite,
        appBar: FavAppBar(context: context, title: 'My Cart'),
        body: cartViewModel == null
            ? Container()
            : cartViewModel!.isLoadingCart == true
                ? const Center(
                    child: CircularProgressIndicator(color: primaryColor),
                  )
                : cartViewModel!.cartModel == null
                    ? emptyCartWidget()
                    : cartViewModel!.cartModel!.cart == null
                        ? emptyCartWidget()
                        : cartViewModel!.cartModel!.cart!.cartItems == null
                            ? emptyCartWidget()
                            : cartViewModel!.cartModel!.cart!.cartItems!.isEmpty
                                ? emptyCartWidget()
                                : cartNotEmptyWidget(),
      ),
    );
  }

  Widget cartNotEmptyWidget() {
    return SingleChildScrollView(
      child: Container(
        child: Column(
          children: [
            selectedAddress == null ? addAddressButton() : addressWidget(),
            const SizedBox(
              height: 10,
            ),
            itemsHeadingWidget(),
            // headingWidget(text: 'Promocode'),
            headingWidget(text: 'Payment Details'),
            Expanded(child: Container()),
            placeOrderButton()
          ],
        ),
      ),
    );
  }

  Widget headingWidget({required String text}) {
    return Container(
      alignment: Alignment.topLeft,
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Text(
        text,
        style: normalTextstyle(color: tBlack, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget itemsHeadingWidget() {
    return Container(
      alignment: Alignment.topLeft,
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: RichText(
        text: TextSpan(
            text: 'Your Cart ',
            style: normalTextstyle(color: tBlack, fontWeight: FontWeight.w600),
            children: [
              TextSpan(
                  text:
                      "${cartViewModel!.cartModel!.cart!.cartItems!.length} ${cartViewModel!.cartModel!.cart!.cartItems!.length == 1 ? 'Item' : 'Items'}",
                  style: normalTextstyle(fontWeight: FontWeight.w600)),
            ]),
      ),
    );
  }

  Widget addressWidget() {
    return Container(
      width: MediaQuery.of(context).size.width,
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      color: tLightGrey,
      child: Center(
        child: Row(
          children: [
            Expanded(
              flex: 7,
              child: addressTextWidget(),
            ),
            Expanded(
              flex: 3,
              child: changeAddressButton(),
            )
          ],
        ),
      ),
    );
  }

  Widget addressTextWidget() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
              text: TextSpan(
                  text: 'Deliver to: ',
                  style: normalTextstyle(
                      fontWeight: FontWeight.w600, color: tGrey),
                  children: [
                TextSpan(
                  text: selectedAddress!.type,
                  style: normalTextstyle(
                      fontWeight: FontWeight.w600, color: tBlack),
                )
              ])),
          const SizedBox(
            height: 10,
          ),
          Text(
            "${selectedAddress!.flatNo} ${selectedAddress!.landmark}",
            style: normalTextstyle(color: tBlack, fontSize: 14),
          ),
          Text(
            selectedAddress!.address,
            style: normalTextstyle(color: tBlack, fontSize: 14),
          )
        ],
      ),
    );
  }

  Widget changeAddressButton() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
      child: buttonWidget(
          onTap: () async {
            Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) =>
                            ManageAddress(toSelectAddress: true)))
                .then((value) => value != null
                    ? {
                        setState(() {
                          selectedAddress = value;
                        }),
                      }
                    : {});
          },
          text: ' Change ',
          height: 35,
          border: const Border(
              top: BorderSide(color: tGreen),
              bottom: BorderSide(color: tGreen),
              right: BorderSide(color: tGreen),
              left: BorderSide(color: tGreen)),
          textColor: tGreen,
          buttonColor: Colors.transparent),
    );
  }

  Widget addAddressButton() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 40),
      child: buttonWidget(
          onTap: () async {
            Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) =>
                            ManageAddress(toSelectAddress: true)))
                .then((value) => value != null
                    ? {
                        setState(() {
                          selectedAddress = value;
                        }),
                      }
                    : {});
          },
          text: 'ManAdd Address',
          border: const Border(
              top: BorderSide(color: tGreen),
              bottom: BorderSide(color: tGreen),
              right: BorderSide(color: tGreen),
              left: BorderSide(color: tGreen)),
          textColor: tGreen,
          buttonColor: Colors.transparent),
    );
  }

  Widget placeOrderButton() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
      child: buttonWidget(
          onTap: () async {},
          text: 'Place Order',
          textColor: tWhite,
          buttonColor: tGreen),
    );
  }

  Widget emptyCartWidget() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Image.asset(
            'Assets/Images/emptyCart.png',
            width: MediaQuery.of(context).size.width / 2,
          ),
          const SizedBox(
            height: 20,
          ),
          Text(
            'Your Basket is empty',
            style: normalTextstyle(color: primaryColor, fontSize: 30),
            textAlign: TextAlign.center,
          ),
          const SizedBox(
            height: 20,
          ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'Make your basket happy and add fruiuts, vegetables, cerals & grains',
              style: normalTextstyle(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          )
        ],
      ),
    );
  }
}
