import 'package:fav_app/old/Constants/button.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Constants/toast.dart';
import 'package:fav_app/old/Models/Account/adresses.dart';
import 'package:fav_app/old/Screens/Account/manage_address.dart';
import 'package:fav_app/old/Screens/Cart/order_success_screen.dart';
import 'package:fav_app/old/Screens/Widgets/appbar_widget.dart';
import 'package:fav_app/old/ViewModels/Home/cart_product_view_model.dart';
import 'package:fav_app/old/ViewModels/Orders/orders.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../ViewModels/Home/cart_view_model.dart';
import 'cart_item_tile.dart';

class CartScreen extends StatefulWidget {
  CartScreen({Key? key}) : super(key: key);

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  CartViewModel? cartViewModel;
  OrdersViewModel? ordersViewModel;

  Address? selectedAddress;
  ValueNotifier<double> total = ValueNotifier(0);
  ValueNotifier<double> deliveryCost = ValueNotifier(0);
  // ValueNotifier<double> discount = ValueNotifier(0);
  ValueNotifier<double> promocodeAmount = ValueNotifier(0);

  // PromoCode? promoCode;
  double? discount;
  TextEditingController promoCodeController = TextEditingController();

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    // initializeRazorpPay();
    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      if (cartViewModel != null) {
        cartViewModel!.getCart(context: context);

        cartViewModel!.addListener(() {
          calculateTotal();
        });
      }
    });
  }

  calculateTotal() {
    total.value = cartViewModel!.subTotalAmount +
        deliveryCost.value -
        // discount.value -
        promocodeAmount.value;
  }

  applyPromo() {
    // if (promoCode != null) {
    //   if (promoCode!.type == 1) {
    //     // percentage
    //     double tempDiscount = (promoCode!.offerValue! * total.value) / 100;
    //     if (tempDiscount > promoCode!.maxDiscount!) {
    //       promocodeAmount.value = promoCode!.maxDiscount!.toDouble();
    //     } else {
    //       promocodeAmount.value = tempDiscount;
    //     }
    //   } else {
    //     promocodeAmount.value = promoCode!.offerValue!.toDouble();
    //   }
    // } else {
    //   promocodeAmount.value = 0;
    // }
    if (discount != null) {
      promocodeAmount.value = discount ?? 0;
    }

    calculateTotal();
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      cartViewModel = context.watch<CartViewModel>();
      ordersViewModel = context.watch<OrdersViewModel>();
    }
    return Material(
      child: Scaffold(
        backgroundColor: tWhite,
        appBar: FavAppBar(context: context, title: 'My Cart'),
        body: cartViewModel == null
            ? Container()
            : cartViewModel!.isLoadingCart == true ||
                    ordersViewModel!.isCreatingOrder == true
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
        // height: MediaQuery.of(context).size.height,
        child: Column(
          children: [
            selectedAddress == null ? addAddressButton() : addressWidget(),
            const SizedBox(
              height: 10,
            ),
            itemsHeadingWidget(),
            listOfItemsWidget(),
            headingWidget(text: 'Promo code'),
            discount == null ? promoCodeTextFieldWidget() : promoCodeWidget(),
            headingWidget(text: 'Payment Details'),
            pricesWidget(),
            placeOrderButton()
          ],
        ),
      ),
    );
  }

  Widget promoCodeWidget() {
    return Container(
      // decoration: BoxDecoration(border: Border.all(color: tLightGrey)),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(children: [
        Expanded(
          flex: 2,
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 10,
            ),
            child: Image.asset(
              'Assets/Images/coupon.png',
              height: 25,
              width: 25,
            ),
          ),
        ),
        Expanded(
          flex: 6,
          child: Text(
            "Yah.. You Save ${Constants.rupee} ${promocodeAmount.value}",
            style: normalTextstyle(
                color: tBlack, fontSize: 18, fontWeight: FontWeight.w700),
          ),
        ),
        Expanded(
          flex: 2,
          child: IconButton(
              onPressed: () {
                setState(() {
                  discount = null;
                });
                applyPromo();
              },
              icon: const Icon(
                Icons.cancel,
                color: tGreen,
              )),
        )
      ]),
    );
  }

  Widget promoCodeTextFieldWidget() {
    return ordersViewModel!.isApplyingPromo == true
        ? const CircularProgressIndicator(color: primaryColor)
        : Container(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: TextFormField(
              controller: promoCodeController,
              decoration: InputDecoration(
                border: const OutlineInputBorder(
                    borderSide: BorderSide(color: tLightGrey)),
                focusedBorder: const OutlineInputBorder(
                    borderSide: BorderSide(color: primaryColor)),
                hintText: 'Enter Promo code',
                prefixIcon: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                  ),
                  child: Image.asset(
                    'Assets/Images/coupon.png',
                    height: 25,
                    width: 25,
                  ),
                ),
                suffix: InkWell(
                  onTap: () {
                    if (promoCodeController.text.isNotEmpty) {
                      WidgetsBinding.instance.focusManager.primaryFocus
                          ?.unfocus();

                      Map<String, dynamic> body = <String, dynamic>{};
                      body['PromoCode'] = promoCodeController.text;
                      body['SubTotal'] = cartViewModel?.subTotalAmount;
                      ordersViewModel!
                          .validatePromo(context: context, body: body)
                          .then((value) => value != null
                              ? {
                                  promoCodeController.text = '',
                                  setState(() {
                                    discount = value;
                                  }),
                                  applyPromo()
                                }
                              : {});
                    } else {
                      customToast(message: "Please add Promo code");
                    }
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    child: Text(
                      'Apply',
                      style: normalTextstyle(
                          fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ),
            ),
          );
  }

  Widget listOfItemsWidget() {
    return Container(
        child: ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: cartViewModel!.cartModel!.cart!.cartItems!.length,
            itemBuilder: (context, index) {
              return ChangeNotifierProvider(
                create: (_) => CartProductViewModel(),
                child: CartItemTile(
                    cartViewModel: cartViewModel,
                    item: cartViewModel!.cartModel!.cart!.cartItems![index]),
              );
            }));
  }

  Widget pricesWidget() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
      decoration: BoxDecoration(
          border: Border.all(color: tGrey),
          borderRadius: BorderRadius.circular(5)),
      child: Column(children: [
        titleWithValueWIdget(
            title: 'SubTotal',
            value: "${Constants.rupee} ${cartViewModel!.subTotalAmount}"),
        ValueListenableBuilder(
          valueListenable: deliveryCost,
          builder: (BuildContext context, dynamic value, Widget? child) {
            return titleWithValueWIdget(
                title: 'Delivery Cost',
                value: deliveryCost.value == 0
                    ? "Free"
                    : "${Constants.rupee} deliveryCost.value");
          },
        ),
        // ValueListenableBuilder(
        //   valueListenable: discount,
        //   builder: (BuildContext context, dynamic value, Widget? child) {
        //     return titleWithValueWIdget(
        //         title: 'Discount',
        //         value: "- ${Constants.rupee} ${discount.value}");
        //   },
        // ),
        ValueListenableBuilder(
          valueListenable: promocodeAmount,
          builder: (BuildContext context, dynamic value, Widget? child) {
            return titleWithValueWIdget(
                title: 'Promo code Discount',
                value: "- ${Constants.rupee} ${promocodeAmount.value}");
          },
        ),
        const Divider(
          color: tGrey,
          thickness: 1,
        ),
        ValueListenableBuilder(
          valueListenable: total,
          builder: (BuildContext context, dynamic value, Widget? child) {
            return titleWithValueWIdget(
                title: 'Total',
                value: "${Constants.rupee} ${total.value}",
                valueColor: primaryColor);
          },
        ),
      ]),
    );
  }

  Widget titleWithValueWIdget({
    String? title,
    String? value,
    Color? titleColor,
    Color? valueColor,
  }) {
    return Container(
        padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title ?? "",
              style: normalTextstyle(color: titleColor ?? tBlack),
            ),
            Text(
              value ?? "",
              style: normalTextstyle(color: valueColor ?? tBlack),
            ),
          ],
        ));
  }

  Widget headingWidget({required String text}) {
    return Container(
      alignment: Alignment.topLeft,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Text(
        text,
        style: normalTextstyle(color: tBlack, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget itemsHeadingWidget() {
    return Container(
      alignment: Alignment.topLeft,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
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
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
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
      padding: const EdgeInsets.symmetric(horizontal: 20),
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
          text: 'Add Address',
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
          onTap: () async {
            print("selectedAddress$selectedAddress");
            if (selectedAddress == null) {
              customToast(message: 'Please select Address');
            } else {
              showPaymentSelectionPopup();
            }
          },
          text: 'Place Order',
          textColor: tWhite,
          buttonColor: tGreen),
    );
  }

  ValueNotifier<String>? selectedPaymentType = ValueNotifier('');

  showPaymentSelectionPopup() {
    return showModalBottomSheet(
        context: context,
        isDismissible: false,
        builder: (context) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: ValueListenableBuilder(
              valueListenable: selectedPaymentType!,
              builder: (BuildContext context, dynamic value, Widget? child) {
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: double.maxFinite,
                      alignment: Alignment.centerRight,
                      child: IconButton(
                        icon: const Icon(Icons.cancel),
                        onPressed: () {
                          Navigator.pop(context);
                        },
                      ),
                    ),
                    Container(
                        width: double.maxFinite,
                        child: Text(
                          'Select Payment Method',
                          style: normalTextstyle(
                              fontWeight: FontWeight.w600, color: tBlack),
                        )),
                    const SizedBox(
                      height: 20,
                    ),
                    Container(
                      decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(5),
                          border: Border.all(color: tLightGrey)),
                      child: InkWell(
                        onTap: () {
                          selectedPaymentType!.value = 'COD';
                        },
                        child: ListTile(
                          leading: Radio<String>(
                            fillColor: MaterialStateProperty.all(tGreen),
                            value: 'COD',
                            groupValue: selectedPaymentType!.value,
                            onChanged: (value) {
                              selectedPaymentType!.value = value!;
                            },
                          ),
                          title: Text(
                            'Cash On Delivery',
                            style: normalTextstyle(color: tBlack),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(
                      height: 10,
                    ),
                    Container(
                      decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(5),
                          border: Border.all(color: tLightGrey)),
                      child: InkWell(
                        onTap: () {
                          selectedPaymentType!.value = 'ONLINE';
                        },
                        child: ListTile(
                          leading: Radio<String>(
                            fillColor: MaterialStateProperty.all(tGreen),
                            value: 'ONLINE',
                            groupValue: selectedPaymentType!.value,
                            onChanged: (value) {
                              selectedPaymentType!.value = value!;
                            },
                          ),
                          title: Text(
                            'Pay Online Now',
                            style: normalTextstyle(color: tBlack),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(
                      height: 20,
                    ),
                    proceedButton()
                  ],
                );
              },
            ),
          );
        }).then((value) => value != null
        ? {
            if (selectedPaymentType!.value == 'COD')
              {
                createOrder(),
              }
            else
              {
                // make payment
                initializeRazorpPay(),
                makeOnlinePayment(),
              }
          }
        : {});
  }

  Widget proceedButton() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
      child: buttonWidget(
          onTap: () async {
            if (selectedPaymentType!.value == '') {
              customToast(message: 'Select Payment Type');
            } else {
              Navigator.pop(context, true);
            }
          },
          text: 'Proceed',
          textColor: tWhite,
          buttonColor: tGreen),
    );
  }

  makeOnlinePayment() {
    Map<String, dynamic> body = <String, dynamic>{};
    body['OrderAmount'] = cartViewModel!.subTotalAmount;
    ordersViewModel!.createOrderPayment(context: context, body: body).then(
        (value) => value != null
            ? {makePaymentViaRazorpay(orderId: value['RazorpayOrderID'])}
            : {});
  }

  makePaymentViaRazorpay({required orderId}) {
    var options = {
      'key': Constants.razorPayKey,
      'order_id': orderId,
      'currency': 'INR',
      // "theme": {"color": },
      'amount': (100 * cartViewModel!.subTotalAmount).toStringAsFixed(2),
      'name': appname,
      'external': {
        'wallets': ['paytm']
      }
    };

    try {
      _razorpay.open(options);
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  createOrder({String? PaymentTransactionID, String? RazorpayOrderID}) {
    Map<String, dynamic> body = <String, dynamic>{};
    List cartItems = [];
    for (int i = 0;
        i < cartViewModel!.cartModel!.cart!.cartItems!.length;
        i++) {
      cartItems.add(cartViewModel!.cartModel!.cart!.cartItems![i].toJson());
    }

    body['CartID'] = cartViewModel!.cartModel!.cart!.cartId;
    body['SubTotal'] = cartViewModel!.subTotalAmount;
    if (discount != null) {
      // body['PromoCode'] = promoCode!.promoCode;
      body['PromoAmount'] = promocodeAmount.value;
    } else {
      body['PromoAmount'] = promocodeAmount.value;
    }
    // body['Discount'] = discount.value;
    body['TaxAmount'] = 0;
    body['DeliverCharges'] = deliveryCost.value;
    body['GrandTotal'] = total.value;
    body['Address'] = selectedAddress!.address;
    body['FlatNo'] = selectedAddress!.flatNo;
    body['City'] = selectedAddress!.city;
    body['LandMark'] = selectedAddress!.landmark;
    if (selectedAddress!.latitude != '') {
      body['Latitude'] = selectedAddress!.latitude;
    }
    if (selectedAddress!.longitude != '') {
      body['Longitude'] = selectedAddress!.longitude;
    }
    body['DeliveryMethod'] = selectedPaymentType!.value;
    body['PaymentMethod'] = selectedPaymentType!.value;
    if (selectedPaymentType!.value == 'ONLINE') {
      if (PaymentTransactionID != null) {
        body['PaymentTransactionID'] = PaymentTransactionID;
      }
      if (RazorpayOrderID != null) {
        body['RazorpayOrderID'] = RazorpayOrderID;
      }
    }

    body['OrderItems'] = cartItems;

    debugPrint("$body");
    ordersViewModel!
        .createOrder(context: context, body: body)
        .then((value) => value != null
            ? {
                if (value.status == 1)
                  {
                    cartViewModel!.getCart(context: context),
                    Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                            builder: (context) => OrderSuccessScreen()))
                    // .then((value) => {Navigator.pop(context)})
                  }
                else
                  {}
              }
            : {});
  }

  Widget emptyCartWidget() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
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
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'Make your basket happy and add fruits, vegetables, cerals & grains',
              style: normalTextstyle(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          )
        ],
      ),
    );
  }

  late Razorpay _razorpay;

  initializeRazorpPay() {
    _razorpay = Razorpay();

    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    debugPrint('----------');
    debugPrint('---success---');
    debugPrint(
        "'paymentId': ${response.paymentId},'signature': ${response.signature}, 'order_id': ${response.orderId}");
    debugPrint('----------');
    debugPrint("$response");
    var razorPayDetails = {
      'paymentId': response.paymentId,
      'signature': response.signature,
      'orderId': response.orderId
    };

    createOrder(
        RazorpayOrderID: response.orderId,
        PaymentTransactionID: response.paymentId);
    customToast(
      message: "SUCCESS: " + response.paymentId!,
    );
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    print("ERROR: " + response.code.toString() + " - " + response.message!);
    customToast(
      message: "ERROR: " + response.code.toString() + " - " + response.message!,
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    customToast(
      message: "EXTERNAL_WALLET: " + response.walletName!,
    );
  }
}
