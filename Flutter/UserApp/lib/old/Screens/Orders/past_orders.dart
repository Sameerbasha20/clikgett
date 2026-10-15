import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../new/Controllers/orders_controller.dart';

class PastOrdersScreen extends StatefulWidget {
  PastOrdersScreen({Key? key}) : super(key: key);

  @override
  State<PastOrdersScreen> createState() => _PastOrdersScreenState();
}

class _PastOrdersScreenState extends State<PastOrdersScreen> {
  @override
  void initState() {
    super.initState();
    ordersController.getpastorder(context: context);
  }

  final OrdersController ordersController = Get.find();

  @override
  Widget build(BuildContext context) {
    return Material(
        // child: GetBuilder<OrdersController>(
        //   id: 'orders',
        //   builder: (controller) => ordersController.isLoading.isTrue
        //       ? const CustomLoader()
        //       : ordersController.pastorders.isEmpty
        //           ? Center(
        //               child: Text(
        //                 'No records found',
        //                 style: normalTextstyle(color: tGrey),
        //               ),
        //             )
        //           : ListView.builder(
        //               itemCount: ordersController.pastorders.length,
        //               physics: const BouncingScrollPhysics(),
        //               itemBuilder: (context, index) {
        //                 var pastOrders = ordersController.pastorders[index];
        //                 return OrdersTile(
        //                   userId: pastOrders.userId,
        //                   id: pastOrders.orderId,
        //                   status: 2,
        //                   estimateddeliveryTime: pastOrders.estimateDateTime,
        //                   grandtotal: pastOrders.grandTotal,
        //                   orderStatus: pastOrders.orderStatus,
        //                   orderno: pastOrders.orderId,
        //                 );
        //               }),
        // ),

        );
  }
}
