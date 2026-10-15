import 'package:fav_app/Models/Home/TimingProvider.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/dialogue_box.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/kits_controller.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/home_bestsellers_section.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/home_category_shelf_section.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/home_deals_and_offers_section.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/home_dynamic_shelves_section.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/home_header_widget.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/home_hero_banner_carousel.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/home_order_again_section.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/home_recommended_section.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/home_shop_by_category_grid.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Redesigned ClikGett Home Screen
/// Inspires from Blinkit's layout, card density, and multi-section richness
/// while preserving ClikGett's signature green-and-white identity.
class Home extends StatefulWidget {
  const Home({Key? key}) : super(key: key);

  @override
  State<Home> createState() => _HomeTabState();
}

class _HomeTabState extends State<Home> {
  final HomeController homeController = Get.find<HomeController>();
  final ProfileController profileController = Get.find<ProfileController>();
  final AdressController adressController = Get.find<AdressController>();
  final TimingController timingController = Get.put(TimingController());
  final WalletController walletController = Get.find<WalletController>();
  final CartController cartController = Get.find<CartController>();
  final OrdersController ordersController = Get.find<OrdersController>();
  final KitsController kitsController = Get.find<KitsController>();

  String? token;

  @override
  void initState() {
    super.initState();
    _initData();
  }

  Future<void> _initData() async {
    token = await CommonServices.getToken();
    if (token != null && token!.isNotEmpty) {
      await _fetchUserData();
      timingController.checkTiming(token!);
    } else {
      await Future.wait<void>([
        homeController.getHome(context: context),
        homeController.fetchActiveSales(),
      ]);
    }

    final SharedPreferences pref = await SharedPreferences.getInstance();
    final double? latitude = pref.getDouble('latitude');
    debugPrint("Init Location Lat: $latitude");
  }

  Future<void> _fetchUserData() async {
    ordersController.getcurrentorder(context: context);
    ordersController.getpastorder(context: context);

    await Future.wait([
      adressController.getAdresses(context: context),
      homeController.getHome(context: context),
      homeController.fetchActiveSales(),
      Future(() => homeController.getstoredLocation(adressController.address)),
      profileController.getuserDetails(context: context),
      walletController.getWallet(context: context),
      cartController.getCart(
        context: context,
        longitude: homeController.longitude,
        latitude: homeController.latitude,
      ),
    ]);
  }

  Future<void> _onRefresh() async {
    token = await CommonServices.getToken();
    if (token != null && token!.isNotEmpty) {
      await _fetchUserData();
    } else {
      await Future.wait([
        homeController.getHome(context: context),
        homeController.fetchActiveSales(),
      ]);
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        logOutDialogue(context);
        return false;
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF4F5F7),
        body: Obx(() {
          if (homeController.isLoading.isTrue) {
            return Center(
              child: SizedBox(
                height: MediaQuery.of(context).size.height * 0.8,
                child: CustomLoader(),
              ),
            );
          }

          return RefreshIndicator(
            backgroundColor: Colors.white,
            color: Appprimary,
            onRefresh: _onRefresh,
            child: ListView(
              padding: EdgeInsets.zero,
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                // 1. ClikGett Green Brand Header & Category Shortcuts
                HomeHeaderWidget(
                  homeController: homeController,
                  adressController: adressController,
                  timingController: timingController,
                  walletController: walletController,
                  cartController: cartController,
                ),

                // 2. Synchronized Home Sections (driven by Admin configuration & order)
                ..._buildHomepageSections(),

                // 3. Safe area clearance so floating cart bar never obscures product cards
                const SizedBox(height: 120),
              ],
            ),
          );
        }),
      ),
    );
  }

  List<Widget> _buildHomepageSections() {
    final sections = homeController.homepagesectionList;

    // Fallback if dynamic sections list is empty (e.g. offline, initial load, or error)
    if (sections.isEmpty) {
      return [
        HomeHeroBannerCarousel(homeController: homeController),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeShopByCategoryGrid(homeController: homeController),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeBestsellersSection(homeController: homeController),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeCategoryShelfSection(
            homeController: homeController,
            title: "Grocery & Kitchen",
            icon: Icons.kitchen_rounded,
            iconBgColor: const Color(0xFFE8F5E9),
            iconColor: const Color(0xFF2E7D32),
            targetCategoryIds: const {1, 2, 4, 5, 6, 7},
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeCategoryShelfSection(
            homeController: homeController,
            title: "Snacks & Drinks",
            icon: Icons.fastfood_rounded,
            iconBgColor: const Color(0xFFFFF3E0),
            iconColor: const Color(0xFFE65100),
            targetCategoryIds: const {8, 9, 10, 11, 12},
          ),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: HomeDealsAndOffersSection(),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeRecommendedSection(homeController: homeController),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeOrderAgainSection(ordersController: ordersController),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeDynamicShelvesSection(homeController: homeController),
        ),
      ];
    }

    final List<Widget> widgets = [];

    for (final section in sections) {
      final key = section.systemKey?.toLowerCase();
      final type = (section.sectionType ?? 'selected_products').toLowerCase();

      if (key == 'hero_banners' || (type == 'promotional_banner' && (homeController.banners.isNotEmpty || (section.imageUrl != null && section.imageUrl!.isNotEmpty)))) {
        widgets.add(HomeHeroBannerCarousel(homeController: homeController));
      } else if (key == 'shop_by_category' || type == 'shop_by_category') {
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeShopByCategoryGrid(homeController: homeController),
        ));
      } else if (key == 'bestsellers' || type == 'bestsellers') {
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeBestsellersSection(homeController: homeController),
        ));
      } else if (key == 'grocery_kitchen') {
        final catIds = (section.categories != null && section.categories!.isNotEmpty)
            ? section.categories!.map((c) => c.categoryId ?? 0).where((id) => id > 0).toSet()
            : const {1, 2, 4, 5, 6, 7};
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeCategoryShelfSection(
            homeController: homeController,
            title: section.name?.isNotEmpty == true ? section.name! : "Grocery & Kitchen",
            icon: Icons.kitchen_rounded,
            iconBgColor: const Color(0xFFE8F5E9),
            iconColor: const Color(0xFF2E7D32),
            targetCategoryIds: catIds,
          ),
        ));
      } else if (key == 'snacks_drinks') {
        final catIds = (section.categories != null && section.categories!.isNotEmpty)
            ? section.categories!.map((c) => c.categoryId ?? 0).where((id) => id > 0).toSet()
            : const {8, 9, 10, 11, 12};
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeCategoryShelfSection(
            homeController: homeController,
            title: section.name?.isNotEmpty == true ? section.name! : "Snacks & Drinks",
            icon: Icons.fastfood_rounded,
            iconBgColor: const Color(0xFFFFF3E0),
            iconColor: const Color(0xFFE65100),
            targetCategoryIds: catIds,
          ),
        ));
      } else if (key == 'deals_offers' || type == 'deals_and_offers') {
        widgets.add(const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: HomeDealsAndOffersSection(),
        ));
      } else if (key == 'recommended_for_you' || type == 'recommendations') {
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeRecommendedSection(homeController: homeController),
        ));
      } else if (key == 'order_again' || type == 'order_again') {
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeOrderAgainSection(ordersController: ordersController),
        ));
      } else {
        // Custom Curated Shelves & other category/subcategory dynamic shelves
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: HomeDynamicShelvesSection(
            homeController: homeController,
            singleSection: section,
          ),
        ));
      }
    }

    return widgets;
  }
}
