// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/NewModel/orderModel.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';

class DeliveredOrders extends StatefulWidget {
  const DeliveredOrders({super.key});

  @override
  State<DeliveredOrders> createState() => _DeliveredOrdersState();
}

class _DeliveredOrdersState extends State<DeliveredOrders> {
  List<OrderModel> deliveredList = [
    (OrderModel(
        image: fruitcombo1,
        itemsNames: "Watermelon, premium-Apple, Banana",
        type: "Combo of 3",
        orderid: "012892",
        total: 442,
        date: "11/08/22",
        status: "Delivered")),
    (OrderModel(
        image: fruitcombo2,
        itemsNames: "Cabbage, Bitter Guard, Cauliflower , Ladies finger",
        type: "Combo of 4",
        orderid: "012892",
        total: 442,
        date: "11/08/22",
        status: "Delivered")),
  ];

  @override
  initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      body: deliveredList.isEmpty
          ? emptyWidget()
          : ListView.builder(
              itemCount: deliveredList.length,
              physics: BouncingScrollPhysics(),
              padding: EdgeInsets.all(3.w),
              itemBuilder: (context, index) {
                return listTile(
                  image: deliveredList[index].image,
                  itemsNames: deliveredList[index].itemsNames,
                  type: deliveredList[index].type,
                  orderid: deliveredList[index].orderid,
                  total: deliveredList[index].total,
                  status: deliveredList[index].status,
                  date: deliveredList[index].date,
                  viewDetails: () {
                    // Navigator.of(context).push(MaterialPageRoute(
                    //     builder: (context) => OrderDetails()));
                  },
                );
              },
            ),
    );
  }

  Widget emptyWidget() {
    return Container(
      padding: EdgeInsets.all(7.w),
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(
            orderEmptyBanner,
            width: 80.w,
            height: 30.h,
            fit: BoxFit.contain,
          ),
          SizedBox(
            height: 1.h,
          ),
          Text(
            "No orders found",
            style:
                customTextstyle(fontSize: 24.sp, fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(5.w, 1.h, 5.w, 10.h),
            child: Text(
              "Looks like you haven’t made your order yet",
              style: customTextstyle(
                fontWeight: FontWeight.w400,
                color: black.withOpacity(0.70),
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget listTile(
      {required String image,
      required String itemsNames,
      required String type,
      required var orderid,
      required var total,
      required String status,
      required var date,
      required Function() viewDetails}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
                flex: 2,
                child: Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                      color: bg1, borderRadius: BorderRadius.circular(0.5.h)),
                  clipBehavior: Clip.antiAliasWithSaveLayer,
                  padding: EdgeInsets.all(0.5.h),
                  child: Image.asset(
                    image,
                    fit: BoxFit.contain,
                  ),
                )),
            SizedBox(
              width: 1.w,
            ),
            Expanded(
                flex: 7,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    customText(
                      text: itemsNames,
                    ),
                    SizedBox(
                      height: 0.5.h,
                    ),
                    customText(
                      text: type,
                      fontSize: 14.sp,
                      color: black.withOpacity(0.50),
                    ),
                  ],
                )),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            customText(
              text: "Order ID",
              fontWeight: FontWeight.w600,
              color: black.withOpacity(0.70),
            ),
            customText(
              text: "#${orderid}",
              fontWeight: FontWeight.w600,
            ),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            customText(
              text: "Total Product",
              fontWeight: FontWeight.w600,
              color: black.withOpacity(0.70),
            ),
            Text("${Constants.rupee} ${total}",
                style: robotocustomTextstyle(
                  fontWeight: FontWeight.w600,
                )),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            customText(
              text: "Status",
              fontWeight: FontWeight.w600,
              color: black.withOpacity(0.70),
            ),
            customText(
              text: status,
              color: green,
              fontWeight: FontWeight.w600,
            ),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            customText(
              text: "Delivered on",
              fontWeight: FontWeight.w600,
              color: black.withOpacity(0.70),
            ),
            customText(
              text: "${date}",
              fontWeight: FontWeight.w600,
            ),
          ],
        ),
        SizedBox(
          height: 1.h,
        ),
        InkWell(
          // ignore: sort_child_properties_last
          child: Align(
            alignment: Alignment.centerRight,
            child: Text(
              "View Details",
              style: customTextstyle(
                  color: primary,
                  fontWeight: FontWeight.w600,
                  textDecoration: TextDecoration.underline),
              textAlign: TextAlign.right,
            ),
          ),
          onTap: viewDetails,
        ),
        SizedBox(
          height: 1.h,
        ),
        Divider(
          thickness: 1.5,
          color: black.withOpacity(0.05),
        ),
        SizedBox(
          height: 3.h,
        ),
      ],
    );
  }
}
