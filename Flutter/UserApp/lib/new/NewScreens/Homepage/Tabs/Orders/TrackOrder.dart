// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/Orders.dart';
import 'package:fav_app/new/NewScreens/Support/Support.dart';
import 'package:fav_app/new/NewScreens/Widgets/textfieldWidget.dart';
import 'package:flutter/material.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class TrackOrder extends StatefulWidget {
  const TrackOrder({super.key});

  @override
  State<TrackOrder> createState() => _TrackOrderState();
}

class _TrackOrderState extends State<TrackOrder> {
  TextEditingController cancelReason = TextEditingController();
  List<String> _cancel = List.filled(1, "");
  FocusNode cancelFocus = FocusNode();

  ScrollController scrollController = ScrollController();

  int status = 2;
  List orders = ["order", "delivery", "example", "example"];
  List<dynamic> trackOrderList = [
    {
      "Title": "Order Placed",
      "SubTitle": "We have recieved your order",
    },
    {
      "Title": "Order Processed",
      "SubTitle": "We are preparing your order",
    },
    {
      "Title": "Payment Confirmed",
      "SubTitle": "Awaiting Confirmation",
    },
    {
      "Title": "Ready to Pickup",
      "SubTitle": "Order Id: #012892",
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: Text("Track Order"),
          leading: IconButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                Navigator.of(context)
                    .push(MaterialPageRoute(builder: (context) => Orders()));
              },
              icon: Image.asset(
                backbutton,
                height: 5.h,
                width: 10.w,
                fit: BoxFit.cover,
              )),
          actions: [
            Padding(
              padding: EdgeInsets.only(right: 5.w),
              child: IconButton(
                  icon: ImageIcon(AssetImage(notify), size: 3.h),
                  onPressed: () {
                    Navigator.of(context).push(
                        MaterialPageRoute(builder: (context) => Support()));
                  }),
            ),
          ]),
      backgroundColor: bg,
      body: SingleChildScrollView(
        physics: BouncingScrollPhysics(),
        padding: EdgeInsets.all(5.w),
        child: Column(
          children: [
            dateWidget(orderID: 012982, date: "wed, 12 sep", total: 442),
            trackWidget(arrivalTime: "9 PM"),
            deliveryAddress(
                addressType: "Home",
                address:
                    "Anugraha Apartments, Flat NO-12, Near More Mega Store ,6-3-599/63/9, Mada Manzil, Banjara Hills, Hyderabad,"),
          ],
        ),
      ),
      bottomNavigationBar: BottomAppBar(
        padding: EdgeInsets.fromLTRB(5.w, 0, 5.w, 2.h),
        child: buttonWidget(
            textColor: primary,
            borderColor: primary,
            buttonColor: white,
            onTap: () {
              alertWidget();
            },
            context: context,
            borderRadius: 26,
            text: "Cancel order"),
      ),
    );
  }

  Widget dateWidget({orderID, date, total}) {
    return Padding(
      padding: EdgeInsets.only(top: 1.h, bottom: 3.h),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(
          "$date",
          style: customTextstyle(
              color: black.withOpacity(0.7), fontWeight: FontWeight.w600),
        ),
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            constantText(
                text: "Order Id:",
                textStyle: customTextstyle(
                    color: black.withOpacity(0.7), fontWeight: FontWeight.w600),
                children: [
                  TextSpan(
                    text: " #$orderID",
                    style: customTextstyle(fontWeight: FontWeight.w600),
                  )
                ]),
            constantText(
                text: "Amount:",
                textStyle: customTextstyle(
                    color: black.withOpacity(0.7), fontWeight: FontWeight.w600),
                children: [
                  TextSpan(
                    text: " ${Constants.rupee}$total",
                    style: robotocustomTextstyle(fontWeight: FontWeight.w600),
                  )
                ]),
          ],
        )
      ]),
    );
  }

  Widget trackWidget({arrivalTime}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        customText(
          text: "Arrival Time: $arrivalTime",
          fontSize: 18.sp,
          fontWeight: FontWeight.w600,
        ),
        SizedBox(height: 1.h),
        // orderTimeLine(),
        timeLinesOrder()
      ],
    );
  }

  Widget deliveryAddress({addressType, address}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        customText(
          text: "Delivery Address",
          fontSize: 18.sp,
          fontWeight: FontWeight.w600,
        ),
        SizedBox(
          height: 1.2.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            ImageIcon(
              AssetImage(homeIcon),
              color: primary,
              size: 2.h,
            ),
            SizedBox(
              width: 1.w,
            ),
            Text(
              "$addressType",
              style: customTextstyle(
                  color: primary, fontSize: 18.sp, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        SizedBox(
          height: 1.1.h,
        ),
        customText(
          text: "$address",
        ),
      ],
    );
  }

  Future alertWidget() {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            insetPadding: EdgeInsets.zero,
            contentPadding: EdgeInsets.all(1.h),
            content:
                cancelOrderWidget(State: setState, controller: cancelReason),
          );
        });
      },
    );
  }

  Widget cancelOrderWidget({required State, required controller}) {
    return Container(
      color: bg,
      height: 40.h,
      width: 100.w,
      padding: EdgeInsets.all(2.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: IconButton(
                onPressed: () {
                  Navigator.of(context).pop();
                },
                icon: ImageIcon(
                  AssetImage(close),
                  size: 3.h,
                )),
          ),
          customText(
            text: "Reason of cancellation",
            color: tColor,
            fontWeight: FontWeight.w600,
            fontSize: 20.sp,
          ),
          SizedBox(
            height: 6,
          ),
          textFieldWidget(
              context: context,
              hint: "",
              hinttext: "Type your reason......",
              controller: controller,
              holder: _cancel,
              currentFocus: cancelFocus,
              nextFocus: null,
              fillColor: bg1,
              minLines: 4,
              maxLines: 7,
              isadress: true,
              validation: false),
          SizedBox(
            height: 0.6.h,
          ),
          buttonWidget(
              width: 96.w,
              onTap: () {
                Navigator.of(context).pop();
              },
              context: context,
              text: "Submit"),
        ],
      ),
    );
  }

  Widget orderTimeLine() {
    return Container(
      decoration: BoxDecoration(color: white),
      margin: EdgeInsets.only(
        bottom: 3.h,
      ),
      padding: EdgeInsets.only(
        bottom: 3.h,
      ),
      child: Column(
        children: <Widget>[
          timelineRow(
              title: "Order Placed",
              subTile: "We have recieved your order",
              time: "10:10 pm",
              index: 1),
          timelineRow(
              title: "Order Processed",
              subTile: "We are preparing your order",
              time: "10:10 pm",
              index: 2),
          timelineRow(
              title: "Payment Confirmed",
              subTile: "Awaiting Confirmation",
              time: "10:12 pm",
              index: 3),
          timelineRow(
              title: "Ready to pickup",
              subTile: "Order Id: #012892",
              time: "10:12 pm",
              index: 4),
        ],
      ),
    );
  }

  Widget timeLinesOrder() {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 3.5.h),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(4, (index) => checkIconWidget(index)),
              )
              // Stack(
              //   clipBehavior: Clip.none,
              //   alignment: Alignment.topLeft,
              //   children: [
              //     SizedBox(
              //       height: 39.h,
              //     ),
              //  CustomPaint(
              //     size: Size(.5.w, 39.h),
              //     painter: DashedLineVerticalPainter(status, 4)),
              //     Positioned(
              //       left: -2.3.w,
              //       bottom: 0,
              //       top: 0,
              //       child: Column(
              //         mainAxisAlignment: MainAxisAlignment.spaceBetween,
              //         children:
              //             List.generate(4, (index) => checkIconWidget(index)),
              //       ),
              //     ),
              //   ],
              // ),
            ],
          ),
          Positioned(
            top: -1.8.h,
            right: 0,
            bottom: -1.8.h,
            left: 8.w,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(
                  trackOrderList.length, (index) => rowTimelineWidget(index)),
            ),
          ),
        ],
      ),
    );
  }

  Widget checkIconWidget(int index) {
    return Stack(
      alignment: Alignment.topCenter,
      children: [
        index >= 3
            ? Container()
            : CustomPaint(
                size: Size(.5.w, 11.h),
                painter: DashedLineVerticalPainter(index, status)),
        Container(
          padding: EdgeInsets.all(.9.w),
          decoration: BoxDecoration(
            color: status >= index ? green : bg3,
            // color: green,
            shape: BoxShape.circle,
          ),
          clipBehavior: Clip.antiAliasWithSaveLayer,
          child: ImageIcon(
            AssetImage(rightSymbol),
            color: white,
            size: 10,
          ),
        ),
      ],
    );
  }

  Widget rowTimelineWidget(int index) {
    return Row(
      mainAxisSize: MainAxisSize.max,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 7),
              child: Text(
                trackOrderList[index]['Title'],
                style: customTextstyle(fontSize: 17.sp),
              ),
            ),
            Text(trackOrderList[index]['SubTitle'],
                style: customTextstyle(
                    fontSize: 15.sp, color: black.withOpacity(0.80))),
          ],
        ),
        Text(
          '10:10 PM',
          style: customTextstyle(fontWeight: FontWeight.w600, color: green),
        )
      ],
    );
  }

  Widget timelineRow(
      {required String title,
      required String subTile,
      required String time,
      required int index}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: <Widget>[
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              Container(
                width: 5.w,
                height: 5.w,
                decoration: BoxDecoration(
                  color: status >= index ? green : bg3,
                  shape: BoxShape.circle,
                ),
                padding: EdgeInsets.all(0.4.h),
                clipBehavior: Clip.antiAliasWithSaveLayer,
                child: ImageIcon(
                  AssetImage(rightSymbol),
                  color: white,
                ),
              ),
              // index != 4
              //     ?
              // Container(
              //     width: 2,
              //     height: 10.h,
              //     decoration: BoxDecoration(
              //       color: status >= index ? green : bg3,
              //       shape: BoxShape.rectangle,
              //     ),
              //     child: Container(),
              //   )
              // CustomPaint(
              //     size: Size(2, 10.h), painter: DashedLineVerticalPainter())
              // : Container(),
            ],
          ),
        ),
        Expanded(
          flex: 20,
          child: Row(
            // mainAxisAlignment: MainAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                  flex: 3,
                  child: Padding(
                    padding: EdgeInsets.only(left: 2.w),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: customTextstyle(fontSize: 18.sp),
                        ),
                        SizedBox(
                          height: 0.5.h,
                        ),
                        Text(subTile,
                            style: customTextstyle(
                                fontSize: 14.sp,
                                color: black.withOpacity(0.80))),
                      ],
                    ),
                  )),
              Expanded(
                  flex: 1,
                  child: Text(
                    time,
                    style: customTextstyle(
                        fontWeight: FontWeight.w600, color: green),
                  )),
            ],
          ),
        ),
      ],
    );
  }
}

class DashedLineVerticalPainter extends CustomPainter {
  final int index;
  final int status;

  DashedLineVerticalPainter(this.index, this.status);
  @override
  void paint(Canvas canvas, Size size) {
    double dashHeight = 5, dashSpace = 3, startY = 0;
    final paint = Paint()
      ..color = index >= 2 ? bg3 : green
      ..strokeWidth = size.width;
    while (startY < size.height) {
      canvas.drawLine(Offset(0, startY), Offset(0, startY + dashHeight), paint);
      startY += dashHeight + dashSpace;
    }
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
