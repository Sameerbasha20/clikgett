import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Screens/Account/accounttab.dart';
import 'package:fav_app/old/Screens/Categories/categoryTab.dart';
import 'package:fav_app/old/Screens/Drawer/drawer.dart';
import 'package:fav_app/old/Screens/HomePageTabs/homeTab.dart';
import 'package:fav_app/old/Screens/Notification/notifications_screen.dart';
import 'package:fav_app/old/Screens/Offers/offersTab.dart';
import 'package:fav_app/old/Screens/HomePageTabs/search_screen.dart';
import 'package:fav_app/old/Screens/Cart/cart_screen.dart';
import 'package:fav_app/old/Screens/Kits/kits_screen.dart';
import 'package:fav_app/old/ViewModels/Categories/categories_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/cart_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/home_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/tabs_view_model.dart';
import 'package:fav_app/old/ViewModels/Kits/kits_view_model.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../Constants/colors.dart';
// import 'package:badges/badges.dart';

class HomeScreen extends StatefulWidget {
  static final GlobalKey<ScaffoldState> globalKey = GlobalKey();
  HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // int currentTab = 0;
  CartViewModel? cartViewModel;

  TabsViewModel? tabsViewModel;
  final List<Widget> screens = [
    ChangeNotifierProvider<HomeViewModel>(
        create: (context) => HomeViewModel(), child: HomeTab()),
    ChangeNotifierProvider<CategoriesViewModel>(
      create: (context) => CategoriesViewModel(),
      child: CategoryTab(),
    ),
    ChangeNotifierProvider<KitsViewModel>(
        create: (context) => KitsViewModel(), child: KitsScreen()),
    OffersTab(),
    AccountTab()
  ];
  List<String> getList = [];

  storedataLocally() async {
    final SharedPreferences pref = await SharedPreferences.getInstance();

    getList = pref.getStringList('queryList')!;
  }

  var size;
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      if (cartViewModel != null) {
        cartViewModel!.getCart(context: context);
      }
    });
    storedataLocally();
  }

  final PageStorageBucket bucket = PageStorageBucket();
  @override
  Widget build(BuildContext context) {
    print(getList);
    print('getList');
    if (mounted) {
      tabsViewModel = context.watch<TabsViewModel>();
      cartViewModel = context.watch<CartViewModel>();
    }
    size = MediaQuery.of(context).size;
    return Scaffold(
      key: tabsViewModel!.tabsScreenkey,
      appBar: appbar(height: size.height, width: size.width),
      floatingActionButton: floatingButton(),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      drawer: DrawerScreen(),
      bottomNavigationBar:
          bottomNavigationBar(height: size.height, width: size.width),
      body: PageStorage(
          bucket: bucket, child: screens[tabsViewModel!.currentTab]),

      // body: screens[tabsViewModel!.currentTab],
    );
  }

  Widget floatingButton() {
    return FloatingActionButton(
      onPressed: () {
        tabsViewModel!.setCurrentTab(2);
      },
      tooltip: 'Increment',
      child: Image.asset(
        tabsViewModel!.currentTab == 2
            ? 'Assets/Images/combosSelecctedIcon.png'
            : 'Assets/Images/combosUnselectedIcon.png',
        height: size.height * .2,
        width: double.infinity,
        fit: BoxFit.cover,
      ),
      elevation: 0,
      backgroundColor: tTransperent,
    );
  }

  PreferredSizeWidget appbar({double? width, double? height}) {
    return AppBar(
      leadingWidth: 40,
      flexibleSpace: Container(
        decoration: BoxDecoration(gradient: LinearGradient(colors: lGColor)),
      ),
      backgroundColor: tTransperent,
      automaticallyImplyLeading: false,
      elevation: .5,
      title: Row(
        children: [
          Image.asset(
            'Assets/Images/fav_App_logo_homepage.png',
            height: height! * .02,
            width: width! * .1,
            fit: BoxFit.contain,
          ),
          Flexible(child: searchBar())
        ],
      ),
      actions: [
        Center(
          child: InkWell(
            onTap: () {
              Navigator.push(context,
                  MaterialPageRoute(builder: (context) => CartScreen()));
            },
            child: Badge(
              label: Text(
                "${cartViewModel == null ? 0 : cartViewModel!.cartModel == null ? 0 : cartViewModel!.cartModel!.cart == null ? 0 : cartViewModel!.cartModel!.cart!.cartItems == null ? 0 : cartViewModel!.cartModel!.cart!.cartItems!.length.toString()}",
                style: normalTextstyle(color: tWhite),
              ),
              child: Image.asset(
                'Assets/Images/fav_App_basket.png',
                height: height * .03,
                width: width * .06,
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
        const SizedBox(
          width: 10,
        ),
        Padding(
          padding: const EdgeInsets.only(right: 10, left: 10),
          child: InkWell(
            onTap: () {
              Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (context) => NotificationScreen()));
            },
            child: Container(
              child: Image.asset(
                'Assets/Images/fav_App_notification.png',
                height: height * .02,
                width: width * .05,
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
      ],
      titleSpacing: 1,
      leading: IconButton(
          padding: EdgeInsets.zero,
          onPressed: () {
            tabsViewModel!.tabsScreenkey.currentState!.openDrawer();
          },
          icon: Image.asset(
            'Assets/Images/fav_App_menu.png',
            height: height * .02,
            width: width * .1,
            fit: BoxFit.contain,
          )),
    );
  }

  Widget searchBar() {
    return InkWell(
      onTap: () {
        showSearch(context: context, delegate: SearchBarFunctionality(getList));
      },
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 20, vertical: 5),
        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(
            color: tWhite, borderRadius: BorderRadius.circular(50)),
        child: Row(children: [
          Expanded(
              flex: 8,
              child: Text(
                'Search',
                style: normalTextstyle(fontSize: 8, color: tGrey),
              )),
          const Expanded(
            flex: 1,
            child: Icon(
              Icons.search,
              color: tButtontextcolor,
            ),
          )
        ]),
      ),
    );
  }

  Widget bottomNavigationBar({double? height, double? width}) {
    return BottomAppBar(
      shape: CircularNotchedRectangle(),
      notchMargin: 0,
      child: Container(
        decoration:
            BoxDecoration(gradient: LinearGradient(colors: bottombarlGColor)),
        alignment: Alignment.center,
        height: height! * .07,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
                flex: 5, child: bottomTabsleft(height: height, width: width)),
            Expanded(
                flex: 5, child: bottomTabsright(height: height, width: width))
          ],
        ),
      ),
    );
  }

  Widget bottomTabsright({double? height, double? width}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        materialButtons(
          onPressed: () {
            // setState(() {
            //   currentTab = 2;
            // });
            tabsViewModel!.setCurrentTab(3);
          },
          children: [
            Center(
              child: Column(
                children: [
                  Image.asset(
                    tabsViewModel!.currentTab == 3
                        ? 'Assets/Images/fav_App_offertab_select.png'
                        : 'Assets/Images/fav_App_offertab.png',
                    height: height! * .03,
                    width: width! * .06,
                    fit: BoxFit.contain,
                    // color: currentTab == 4 ? tWhite : tTransperent,
                  ),
                  constantText(
                      text: 'Offers',
                      textStyle: headingStyle(
                          fontSize: 10,
                          color: tabsViewModel!.currentTab == 3
                              ? tWhite
                              : Colors.white60))
                ],
              ),
            )
          ],
        ),
        materialButtons(
            children: [
              Center(
                child: Column(
                  children: [
                    Image.asset(
                      tabsViewModel!.currentTab == 4
                          ? 'Assets/Images/fav_App_offer_selected.png'
                          : 'Assets/Images/fav_App_accounttab.png',
                      height: height * .03,
                      width: width * .06,
                      fit: BoxFit.contain,
                      // color: currentTab == 3 ? tWhite : tTransperent,
                    ),
                    constantText(
                        text: 'Account',
                        textStyle: headingStyle(
                            fontSize: 10,
                            color: tabsViewModel!.currentTab == 4
                                ? tWhite
                                : Colors.white60))
                  ],
                ),
              )
            ],
            onPressed: () {
              // setState(() {
              //   currentTab = 3;
              // });
              tabsViewModel!.setCurrentTab(4);
            }),
      ],
    );
  }

  Widget bottomTabsleft({double? height, double? width}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        materialButtons(
            onPressed: () {
              // setState(() {
              //   currentTab = 0;
              // });

              tabsViewModel!.setCurrentTab(0);
            },
            children: [
              Center(
                child: Column(
                  children: [
                    Image.asset(
                      tabsViewModel!.currentTab == 0
                          ? 'Assets/Images/fav_App_hometab.png'
                          : 'Assets/Images/fav_App_hometab_unselected.png',
                      height: height! * .03,
                      width: width! * .06,
                      fit: BoxFit.contain,
                      color: tabsViewModel!.currentTab == 0
                          ? tWhite
                          : Colors.white60,
                    ),
                    constantText(
                        text: 'Home',
                        textStyle: headingStyle(
                            fontSize: 10,
                            color: tabsViewModel!.currentTab == 0
                                ? tWhite
                                : Colors.white60))
                  ],
                ),
              )
            ]),
        materialButtons(
            onPressed: () {
              // setState(() {
              //   currentTab = 1;
              // });

              tabsViewModel!.setCurrentTab(1);
            },
            children: [
              Center(
                child: Column(
                  children: [
                    Image.asset(
                      tabsViewModel!.currentTab == 1
                          ? 'Assets/Images/fav_App_account_selected.png'
                          : 'Assets/Images/fav_App_categorytab.png',
                      height: height * .03,
                      width: width * .06,
                      fit: BoxFit.contain,
                      // color: currentTab == 1 ? tWhite : tTransperent,
                      color: tWhite,
                    ),
                    constantText(
                        text: 'Category',
                        textStyle: headingStyle(
                            fontSize: 10,
                            color: tabsViewModel!.currentTab == 1
                                ? tWhite
                                : Colors.white60))
                  ],
                ),
              )
            ]),
      ],
    );
  }

  Widget materialButtons(
      {required List<Widget> children, void Function()? onPressed}) {
    return MaterialButton(
      minWidth: 50,
      onPressed: onPressed,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: children,
      ),
    );
  }
}
