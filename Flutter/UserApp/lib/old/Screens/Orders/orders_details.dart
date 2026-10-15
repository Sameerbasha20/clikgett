import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/new/Constants/empty_data.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../new/Controllers/orders_controller.dart';
import '../../Constants/colors.dart';
import '../../Constants/text.dart';
import '../Widgets/appbar_widget.dart';

class OrdersDetails extends StatefulWidget {
  const OrdersDetails({Key? key, this.id, this.status, this.orderno})
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
    ordersController.getordersDeatils(context: context, id: widget.orderno);
  }

  final OrdersController ordersController = Get.find();

  @override
  void dispose() {
    ordersController.removeLoader();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      child: Scaffold(
        appBar: FavAppBar(
          context: context,
          title: ' sOrder Details',
        ),
        body: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15),
            child: GetBuilder<OrdersController>(
              id: 'update-orders',
              builder: (controller) => ordersController
                      .isorderDetailsLoading.isTrue
                  ? const CustomLoader()
                  : ordersController.ordersdetails == null
                      ? const EmptyDataWidget(
                          message: 'No Orders Details Found')
                      : Column(
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
                            paymentMethod(
                                constanttext: 'COD',
                                fontWeight: FontWeight.w500),
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
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      text(
                                          text: 'Cancellation Reason',
                                          fontSize: 18,
                                          fontWeight: FontWeight.w600),
                                      SizedBox(
                                        height:
                                            MediaQuery.of(context).size.height *
                                                .015,
                                      ),
                                      cancellationreason(),
                                    ],
                                  )
                                : Container(),
                            const SizedBox(
                              height: 50,
                            ),
                          ],
                        ),
            ),
          ),
        ),
      ),
    );
  }

  Widget paymentdetails() {
    return Container(
      decoration: BoxDecoration(border: Border.all(color: Colors.black12)),
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          titleWithValueWIdget(
              title: 'Subtotal',
              value:
                  "${ordersController.ordersdetailsmodel?.orders?.subTotal ?? ''}"),
          titleWithValueWIdget(
              title: 'Delivery Cost',
              value:
                  "${ordersController.ordersdetailsmodel?.orders!.deliverCharges == 0 ? 'Free' : ordersController.ordersdetailsmodel?.orders?.deliverCharges}"),
          // titleWithValueWIdget(
          //     title: 'Discount',
          //     value:
          //         "- ${Constants.rupee}  ${ordersViewModel?.ordersdetailsmodel?.orders.discount.toString() ?? ''}"),
          Visibility(
            visible:
                ordersController.ordersdetailsmodel?.orders?.promoAmount == 0
                    ? false
                    : true,
            child: titleWithValueWIdget(
                title: 'Promo code Discount',
                value:
                    "- ${Constants.rupee} ${ordersController.ordersdetailsmodel?.orders?.promoAmount.toString()}"),
          ),
          const Divider(),
          Padding(
            padding:
                const EdgeInsets.only(left: 20, top: 5, bottom: 10, right: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                text(text: 'Total', fontSize: 18),
                text(
                    text:
                        '₹ ${ordersController.ordersdetailsmodel?.orders?.grandTotal}',
                    color: tButtontextcolor),
              ],
            ),
          ),
        ],
      ),
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
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          text(
              text: constanttext ??
                  ordersController.ordersdetailsmodel?.orders?.flatNo ??
                  '',
              fontWeight: fontWeight ?? FontWeight.w400),
          text(
              text: constanttext ??
                  ordersController.ordersdetailsmodel?.orders?.landMark ??
                  '',
              fontWeight: fontWeight ?? FontWeight.w400),
          text(
              text: constanttext ??
                  ordersController.ordersdetailsmodel?.orders?.address ??
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
      padding: const EdgeInsets.all(20),
      child: text(
          text:
              ordersController.ordersdetailsmodel?.orders?.paymentMethod ?? '',
          fontWeight: fontWeight ?? FontWeight.w400),
    );
  }

  Widget cancellationreason({String? constanttext, FontWeight? fontWeight}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(border: Border.all(color: Colors.black12)),
      padding: const EdgeInsets.all(20),
      child: text(
          text: constanttext ??
              ordersController.ordersdetailsmodel?.orders?.cancellationReason ??
              '',
          fontWeight: fontWeight ?? FontWeight.w400),
    );
  }

  Widget ordersList() {
    return ordersController.ordersdetails?.orderitems == null
        ? Center(
            child: Text(
              'No records found',
              style: normalTextstyle(color: tGrey),
            ),
          )
        : ordersController.ordersdetails!.orderitems!.isEmpty
            ? Center(
                child: Text(
                  'No records found',
                  style: normalTextstyle(color: tGrey),
                ),
              )
            : ListView.builder(
                itemCount: ordersController.ordersdetails?.orderitems?.length,
                physics: const BouncingScrollPhysics(),
                shrinkWrap: true,
                itemBuilder: (BuildContext context, int index) {
                  var ordersDetails =
                      ordersController.ordersdetails?.orderitems?[index];
                  // var order = ordersViewModel?.ordersdetailsmodel;

                  return Container(
                    margin: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                        border: Border.all(color: Colors.black12)),
                    padding: const EdgeInsets.all(10),
                    child: Row(
                      children: [
                        Container(
                            decoration: BoxDecoration(
                                border: Border.all(color: Colors.black12)),
                            height: 100,
                            width: 100,
                            child: CachedNetworkImage(
                              imageUrl: ordersDetails?.imageUrl ?? '',
                              height: 100,
                              width: 100,
                              fit: BoxFit.fill,
                            )),
                        SizedBox(
                          width: MediaQuery.of(context).size.width * .05,
                        ),
                        Flexible(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              text(
                                  text: ordersDetails?.productName ?? '',
                                  color: tButtontextcolor),
                              const SizedBox(
                                height: 5,
                              ),
                              Row(
                                children: [
                                  text(text: '₹ ', color: Colors.black38),
                                  text(
                                      text: ordersDetails?.offerPrice
                                              .toString() ??
                                          ''),
                                ],
                              ),
                              const SizedBox(
                                height: 5,
                              ),
                              Row(
                                children: [
                                  text(
                                    text:
                                        '${ordersDetails?.metricvalue ?? ''}${ordersDetails?.metrictype ?? ''}',
                                  ),
                                  const SizedBox(
                                    width: 10,
                                  ),
                                  text(
                                    text:
                                        '${ordersDetails?.quantity ?? ''} X Qty',
                                  ),
                                ],
                              ),
                            ],
                          ),
                        )
                      ],
                    ),
                  );
                },
              );
  }
}
