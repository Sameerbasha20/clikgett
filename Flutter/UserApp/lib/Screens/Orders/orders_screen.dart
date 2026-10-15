import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/Screens/Orders/current_orders.dart';
import 'package:fav_app/Screens/Orders/past_orders.dart';
import 'package:fav_app/Screens/Widgets/appbar_widget.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

class OrdersScreen extends StatefulWidget {
  OrdersScreen({Key? key}) : super(key: key);

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
    with TickerProviderStateMixin {
  TabController? tabController;

  @override
  void initState() {
    super.initState();
    tabController = TabController(length: 2, vsync: this, initialIndex: 0);
  }

  @override
  void dispose() {
    super.dispose();
    tabController!.dispose();
  }

  @override
  Widget build(BuildContext context) {
    var size = MediaQuery.of(context).size;

    return Material(
      color: tWhite,
      child: Scaffold(
        backgroundColor: tWhite,
        appBar: FavAppBar(context: context, title: "Orders"),
        body: tab(height: size.height, width: size.width),
      ),
    );
  }

  Widget tab({double? height, double? width}) {
    return NestedScrollView(
      scrollDirection: Axis.vertical,
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        SliverAppBar(
          automaticallyImplyLeading: false,
          floating: true,
          pinned: true,
          backgroundColor: tWhite,
          elevation: 0,
          toolbarHeight: 0,
          bottom: PreferredSize(
            preferredSize: Size.fromHeight(kToolbarHeight),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30),
              child: Card(
                color: Color(0XFFDBCA9E),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30)),
                elevation: 0,
                child: TabBar(
                    indicatorSize: TabBarIndicatorSize.tab,
                    indicatorWeight: 0,
                    indicatorPadding:
                        const EdgeInsets.symmetric(horizontal: 5, vertical: 5),
                    indicator: const BoxDecoration(
                        borderRadius: BorderRadius.all(Radius.circular(15)),
                        color: tWhite),
                    labelColor: tWhite,
                    unselectedLabelColor: tBlack,
                    controller: tabController,
                    labelStyle: normalTextstyle(
                        fontWeight: FontWeight.bold, fontSize: 15),
                    unselectedLabelStyle: normalTextstyle(
                        fontWeight: FontWeight.w100, fontSize: 15),
                    physics: const NeverScrollableScrollPhysics(),
                    // indicatorColor: tRedColor,
                    // isScrollable: true,
                    dragStartBehavior: DragStartBehavior.start,
                    tabs: [
                      Tab(
                        child: Container(
                          width: double.infinity,
                          height: height! * .04,
                          child: Center(
                              child: Text(
                            'Current orders',
                            style: normalTextstyle(),
                          )),
                        ),
                      ),
                      Tab(
                        child: Container(
                          width: double.infinity,
                          height: height * .04,
                          child: Center(
                              child: Text(
                            'Past Orders',
                            style: normalTextstyle(),
                          )),
                        ),
                      ),
                    ]),
              ),
            ),
          ),
        ),
      ],
      body: TabBarView(
        physics: const BouncingScrollPhysics(),
        controller: tabController,
        children: [CurrentOrdersScreen(), PastOrdersScreen()],
      ),
    );
  }
}
