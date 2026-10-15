import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../Constants/colors.dart';
import '../../Constants/text.dart';
import '../../ViewModels/Orders/orders.dart';
import '../Widgets/appbar_widget.dart';

class OrdersDetails extends StatefulWidget {
  OrdersDetails({Key? key, this.id, this.status, this.orderno})
      : super(key: key);
  final id;
  final status;
  final orderno;
  @override
  State<OrdersDetails> createState() => _OrdersDetailsState();
}

class _OrdersDetailsState extends State<OrdersDetails> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance!.addPostFrameCallback((timeStamp) {
      if (ordersViewModel != null) {
        ordersViewModel!.getordersDeatils(context: context, id: widget.orderno);
      }
    });
  }

  OrdersViewModel? ordersViewModel;
  @override
  Widget build(BuildContext context) {
    if (mounted) {
      ordersViewModel = context.watch<OrdersViewModel>();
    }

    // print(ordersViewModel?.ordersdetailsmodel?.orders.orderId);
    // print(ordersViewModel?.ordersdetailsmodel?.orders.address);

    return Material(
      child: Scaffold(
        appBar: FavAppBar(
          context: context,
          title: ' Order Details',
        ),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: text(
                      text: 'Item List',
                      fontSize: 18,
                      fontWeight: FontWeight.w600),
                ),
                ordersList(),
                SizedBox(
                  height: MediaQuery.of(context).size.height * .035,
                ),
                text(
                    text: 'Delivery Address',
                    fontSize: 18,
                    fontWeight: FontWeight.w600),
                SizedBox(
                  height: MediaQuery.of(context).size.height * .015,
                ),
                adress(),
                SizedBox(
                  height: MediaQuery.of(context).size.height * .02,
                ),
                text(
                    text: 'Payment Method',
                    fontSize: 18,
                    fontWeight: FontWeight.w600),
                SizedBox(
                  height: MediaQuery.of(context).size.height * .015,
                ),
                paymentMethod(constanttext: 'COD', fontWeight: FontWeight.w500),
                SizedBox(
                  height: MediaQuery.of(context).size.height * .035,
                ),
                text(
                    text: 'Payment Details',
                    fontSize: 18,
                    fontWeight: FontWeight.w600),
                SizedBox(
                  height: MediaQuery.of(context).size.height * .015,
                ),
                paymentdetails(),
                SizedBox(
                  height: MediaQuery.of(context).size.height * .02,
                ),
                widget.status == 2
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          text(
                              text: 'Cancellation Reason',
                              fontSize: 18,
                              fontWeight: FontWeight.w600),
                          SizedBox(
                            height: MediaQuery.of(context).size.height * .015,
                          ),
                          cancellationreason(),
                        ],
                      )
                    : Container(),
                SizedBox(
                  height: 50,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget paymentdetails() {
    return Container(
      decoration: BoxDecoration(border: Border.all(color: Colors.black12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding:
                const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    text(text: 'Subtotal'),
                    SizedBox(
                      height: 5,
                    ),
                    text(text: 'Delivery Cost'),
                    SizedBox(
                      height: 5,
                    ),
                    text(text: 'Discount'),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      children: [
                        text(text: '₹ ', color: Colors.black38),
                        text(
                            text:
                                '${ordersViewModel?.ordersdetailsmodel?.orders.subTotal ?? ''}'),
                      ],
                    ),
                    SizedBox(
                      height: 5,
                    ),
                    text(
                        text:
                            '${ordersViewModel?.ordersdetailsmodel?.orders.deliverCharges == 0 ? 'Free' : ordersViewModel?.ordersdetailsmodel?.orders.deliverCharges}'),
                    SizedBox(
                      height: 5,
                    ),
                    Row(
                      children: [
                        text(text: '-'),
                        text(text: '₹ ', color: Colors.black38),
                        text(
                            text: ordersViewModel
                                    ?.ordersdetailsmodel?.orders.discount
                                    .toString() ??
                                ''),
                      ],
                    ),
                  ],
                )
              ],
            ),
          ),
          Divider(),
          Padding(
            padding:
                const EdgeInsets.only(left: 20, top: 5, bottom: 10, right: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                text(text: 'Total', fontSize: 18),
                text(
                    text:
                        '₹ ${ordersViewModel?.ordersdetailsmodel?.orders.grandTotal}',
                    color: tButtontextcolor),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget text(
      {String? text, Color? color, double? fontSize, FontWeight? fontWeight}) {
    return Text(
      text!,
      style: normalTextstyle(
          fontSize: fontSize ?? 15,
          color: color ?? tBlack,
          fontWeight: fontWeight),
    );
  }

  Widget adress({String? constanttext, FontWeight? fontWeight}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(border: Border.all(color: Colors.black12)),
      padding: EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          text(
              text: constanttext ??
                  ordersViewModel?.ordersdetailsmodel?.orders.flatNo ??
                  '',
              fontWeight: fontWeight ?? FontWeight.w400),
          text(
              text: constanttext ??
                  ordersViewModel?.ordersdetailsmodel?.orders.landMark ??
                  '',
              fontWeight: fontWeight ?? FontWeight.w400),
          text(
              text: constanttext ??
                  ordersViewModel?.ordersdetailsmodel?.orders.address ??
                  '',
              fontWeight: fontWeight ?? FontWeight.w400),
        ],
      ),
    );
  }

  Widget paymentMethod({String? constanttext, FontWeight? fontWeight}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(border: Border.all(color: Colors.black12)),
      padding: EdgeInsets.all(20),
      child: text(
          text: constanttext ??
              ordersViewModel?.ordersdetailsmodel?.orders.paymentMethod ??
              '',
          fontWeight: fontWeight ?? FontWeight.w400),
    );
  }

  Widget cancellationreason({String? constanttext, FontWeight? fontWeight}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(border: Border.all(color: Colors.black12)),
      padding: EdgeInsets.all(20),
      child: text(
          text: constanttext ??
              ordersViewModel?.ordersdetailsmodel?.orders.cancellationReason ??
              '',
          fontWeight: fontWeight ?? FontWeight.w400),
    );
  }

  Widget ordersList() {
    return ordersViewModel?.isLoading == true
        ? const Center(
            child: CircularProgressIndicator(),
          )
        : ordersViewModel?.ordersdetailsmodel?.orders == null
            ? Center(
                child: Text(
                  'No records found',
                  style: normalTextstyle(color: tGrey),
                ),
              )
            : ordersViewModel!.ordersdetailsmodel!.orders.orderitems.isEmpty
                ? Center(
                    child: Text(
                      'No records found',
                      style: normalTextstyle(color: tGrey),
                    ),
                  )
                : ListView.builder(
                    itemCount: ordersViewModel!
                        .ordersdetailsmodel!.orders.orderitems.length,
                    physics: BouncingScrollPhysics(),
                    shrinkWrap: true,
                    itemBuilder: (BuildContext context, int index) {
                      var ordersDetails =
                          ordersViewModel?.ordersdetailsmodel?.orders;
                      var order = ordersViewModel?.ordersdetailsmodel;

                      return Container(
                        margin: EdgeInsets.all(7),
                        decoration: BoxDecoration(
                            border: Border.all(color: Colors.black12)),
                        padding: EdgeInsets.all(10),
                        child: Row(
                          children: [
                            Container(
                                decoration: BoxDecoration(
                                    border: Border.all(color: Colors.black12)),
                                height: 100,
                                width: 100,
                                child: Image.network(
                                  ordersDetails?.orderitems[0].imageUrl ?? '',
                                  height: 100,
                                  width: 100,
                                  fit: BoxFit.contain,
                                )),
                            SizedBox(
                              width: MediaQuery.of(context).size.width * .05,
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                text(
                                    text: ordersDetails
                                            ?.orderitems[0].productName ??
                                        '',
                                    color: tButtontextcolor),
                                SizedBox(
                                  height: 5,
                                ),
                                Row(
                                  children: [
                                    text(text: '₹ ', color: Colors.black38),
                                    text(
                                        text: ordersDetails
                                                ?.orderitems[0].offerPrice
                                                .toString() ??
                                            ''),
                                  ],
                                ),
                                SizedBox(
                                  height: 5,
                                ),
                                Row(
                                  children: [
                                    text(
                                      text:
                                          '${ordersDetails?.orderitems[0].metricvalue ?? ''}${ordersDetails?.orderitems[0].metrictype ?? ''}',
                                    ),
                                    SizedBox(
                                      width: 10,
                                    ),
                                    text(
                                      text:
                                          '${ordersDetails?.orderitems[0].quantity ?? ''} X Qty',
                                    ),
                                  ],
                                ),
                              ],
                            )
                          ],
                        ),
                      );
                    },
                  );
  }
}
