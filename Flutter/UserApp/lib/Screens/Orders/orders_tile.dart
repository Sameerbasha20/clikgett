import 'package:fav_app/Constants/button.dart';
import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/Screens/Orders/cancel_order.dart';
import 'package:fav_app/Screens/Orders/feeback.dart';
import 'package:fav_app/Screens/Orders/post_delivery_dialog.dart';
import 'package:fav_app/Screens/Orders/orders_details.dart';
import 'package:flutter/material.dart';

class OrdersTile extends StatefulWidget {
  int status;
  final orderno;
  final orderStatus;
  final estimateddeliveryTime;
  final grandtotal;
  final id;
  final userId;

  OrdersTile(
      {Key? key,
      this.status = 1,
      this.orderno,
      this.orderStatus,
      this.estimateddeliveryTime,
      this.grandtotal,
      this.id,
      this.userId})
      : super(key: key);

  @override
  State<OrdersTile> createState() => _OrdersTileState(status: status);
}

class _OrdersTileState extends State<OrdersTile> {
  int status;
  _OrdersTileState({Key? key, this.status = 1});

  @override
  Widget build(BuildContext context) {
    print(widget.id);
    print(widget.orderno);
    print('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    return Material(
      child: InkWell(
        onTap: () {
          print(widget.id);
          print(widget.orderno);
          print('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
          Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => OrdersDetails(
                        orderno: widget.orderno,
                        status: widget.status,
                        id: widget.id,
                      )));
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(5), color: tLightGrey),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              orderIdWidget(),
              const SizedBox(
                height: 10,
              ),
              titleAndContent(
                  'Status : ',
                  widget.orderStatus == 1
                      ? 'Delivery Agent Assigned'
                      : widget.orderStatus == 2
                          ? 'Pending'
                          : widget.orderStatus == 3
                              ? 'Order Cancelled by Admin'
                              : widget.orderStatus == 4
                                  ? 'Order Cancelled By User'
                                  : 'Delivered Successfully'),
              titleAndContent(
                  status == 1
                      ? 'Estimated Delivery Time : '
                      : 'Delivery Time : ',
                  '${widget.estimateddeliveryTime}, '),
              const SizedBox(
                height: 10,
              ),
              optionsWidget(),
            ],
          ),
        ),
      ),
    );
  }

  Widget orderIdWidget() {
    return Card(
      color: Colors.grey[300],
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        child: Row(
          children: [
            Text(
              'Order No ',
              style: normalTextstyle(color: tBlack),
            ),
            Text(
              widget.orderno.toString(),
              style: normalTextstyle(color: tGrey),
            ),
            Expanded(child: Container()),
            Text(
              '₹ ${double.parse(widget.grandtotal.toString()).toStringAsFixed(2)}',
              style: normalTextstyle(color: tBlack),
            ),
          ],
        ),
      ),
    );
  }

  Widget titleAndContent(String title, String content) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 3),
      child: RichText(
          text: TextSpan(
              text: title,
              style: normalTextstyle(color: tBlack, fontSize: 14),
              children: [
            TextSpan(
                text: content,
                style: normalTextstyle(color: tGrey, fontSize: 14))
          ])),
    );
  }

  Widget optionsWidget() {
    return Container(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          buttonWidget(

              width: MediaQuery.of(context).size.width / 4,
              height: 35,
              fontSize: 14,
              text: status == 1 ? 'Cancel Order' : 'Reorder',
              onTap: () {
                if (status == 1) {
                  Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => CancelOrder(
                                orderid: widget.orderno,
                              )));
                }
              },
              textColor: tWhite,
              buttonColor: Colors.grey[400],
              borderRadius: BorderRadius.circular(100)),
          const SizedBox(
            width: 5,
          ),
          buttonWidget(
              width: MediaQuery.of(context).size.width / 4,
              height: 35,
              fontSize: 14,
              text: status == 1 ? 'Rate Order' : 'Track Order',
              onTap: () {
                if (status == 1) {
                  final orderId = int.tryParse(widget.id?.toString() ??
                          widget.orderno?.toString() ??
                          '0') ??
                      0;
                  if (orderId > 0) {
                    PostDeliveryFeedbackDialog.show(
                      context,
                      orderId: orderId,
                    );
                  }
                }
              },
              textColor: tWhite,
              buttonColor: status == 1 ? tGreen : primaryColor,
              borderRadius: BorderRadius.circular(100)),
        ],
      ),
    );
  }
}
