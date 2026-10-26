import 'package:fav_app/Models/Home/TimingProvider.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:fav_app/new/NewScreens/Homepage/Storefront/category_grid.dart';
import 'package:fav_app/new/NewScreens/Homepage/Storefront/home_header.dart';
import 'package:fav_app/new/NewScreens/Homepage/Storefront/quick_actions_row.dart';
import 'package:fav_app/new/NewScreens/Homepage/Storefront/section_product_rail.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/flash_sale_section.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/home_hero_banner_carousel.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as home_model;
import 'package:fav_app/new/Services/storefront_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Home: delivery-time header, pinned search, then the sections the admin
/// configured in "Home Sections" (in that order).
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

  bool _isLoggedIn = false;

  /// "Previously bought" rail under the search bar (logged-in customers).
  List<home_model.BestItem> _previouslyBought = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final token = await CommonServices.getToken();
    _isLoggedIn = token.isNotEmpty;
    if (mounted) setState(() {});
    if (_isLoggedIn) {
      StorefrontServices.previouslyBought().then((list) {
        if (mounted) setState(() => _previouslyBought = list);
      });
      timingController.checkTiming(token);
      ordersController.getcurrentorder(context: context);
      ordersController.getpastorder(context: context);
      await Future.wait([
        adressController.getAdresses(context: context),
        homeController.getHome(context: context),
        homeController.fetchActiveSales(),
        profileController.getuserDetails(context: context),
        walletController.getWallet(context: context),
      ]);
      homeController.getstoredLocation(adressController.address);
      if (mounted) {
        await cartController.getCart(context: context, longitude: homeController.longitude, latitude: homeController.latitude);
      }
    } else {
      await Future.wait([homeController.getHome(context: context), homeController.fetchActiveSales()]);
    }
    homeController.refreshEta();
  }

  List<String> get _searchHints {
    final names = homeController.categories
        .map((c) => (c.categoryName ?? '').split(RegExp(r'[,&]')).first.trim())
        .where((n) => n.isNotEmpty)
        .toList();
    return names.take(6).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      body: Obx(() {
        if (homeController.isLoading.isTrue && homeController.homepagesectionList.isEmpty) {
          return Center(child: CustomLoader());
        }
        // The status bar keeps a green strip and the page scrolls below it, so the
        // pinned search bar stops under the status bar instead of behind it.
        return Column(children: [
          Container(color: primary, height: MediaQuery.of(context).padding.top),
          Expanded(
            child: MediaQuery.removePadding(
              context: context,
              removeTop: true,
              child: RefreshIndicator(
          color: primary,
          onRefresh: _load,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(child: StorefrontHeader(isLoggedIn: _isLoggedIn)),
              SliverPersistentHeader(pinned: true, delegate: StickySearchBarDelegate(hints: _searchHints)),
              SliverToBoxAdapter(child: _StoreClosedCard(timingController: timingController)),
              if (_previouslyBought.isNotEmpty)
                SliverToBoxAdapter(
                  child: SectionProductRail(
                    title: 'Previously bought',
                    subtitle: 'Your usuals, ready to add again',
                    products: _previouslyBought,
                  ),
                ),
              const SliverToBoxAdapter(child: QuickActionsRow()),
              SliverList(delegate: SliverChildListDelegate(_sections())),
              const SliverToBoxAdapter(child: SizedBox(height: 120)), // room for the floating cart bar
            ],
          ),
              ),
            ),
          ),
        ]);
      }),
    );
  }

  List<Widget> _sections() {
    final sections = homeController.homepagesectionList;
    if (sections.isEmpty) {
      // No sections configured: show real categories and best-sellers only.
      return [
        HomeHeroBannerCarousel(homeController: homeController),
        CategoryGrid(title: 'Shop by category', categories: homeController.categories),
        SectionProductRail(title: 'Bestsellers', products: homeController.bestItems),
      ];
    }
    return sections.map(_section).toList();
  }

  Widget _section(home_model.HomePageSectionProduct s) {
    final type = (s.sectionType ?? 'selected_products').toLowerCase();
    final name = (s.name ?? '').trim();
    final products = s.products ?? [];
    final categories = s.categories ?? [];

    switch (type) {
      case 'promotional_banner':
        return HomeHeroBannerCarousel(homeController: homeController);
      case 'shop_by_category':
        return CategoryGrid(title: name.isEmpty ? 'Shop by category' : name, categories: categories, maxTiles: 12);
      case 'category_shelf':
      case 'subcategory_shelf':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CategoryGrid(title: name, categories: categories, maxTiles: 8),
            SectionProductRail(
              title: 'Popular in $name',
              products: products,
              homeSectionId: s.homeSectionId,
            ),
          ],
        );
      case 'deals_and_offers':
        return Column(
          children: [
            if (homeController.activeSales.isNotEmpty) const FlashSaleSection(),
            SectionProductRail(title: name, subtitle: s.description, products: products, homeSectionId: s.homeSectionId),
          ],
        );
      default:
        return SectionProductRail(title: name, subtitle: s.description, products: products, homeSectionId: s.homeSectionId);
    }
  }
}

class _StoreClosedCard extends StatelessWidget {
  final TimingController timingController;

  const _StoreClosedCard({required this.timingController});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final res = timingController.timingResponse.value;
      if (res.status != 0) return const SizedBox.shrink();
      final closed = res.message == "We're closed now";
      return Container(
        margin: const EdgeInsets.fromLTRB(12, 10, 12, 0),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF7ED),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFFED7AA)),
        ),
        child: Row(
          children: [
            const Icon(Icons.storefront_outlined, color: amberWarning, size: 30),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(closed ? 'We are closed right now' : "We'll be back shortly",
                      style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: tColor)),
                  Text(
                      res.opensAt != null && res.opensAt!.isNotEmpty
                          ? '${res.opensAt}. You can add items now and order when we open.'
                          : 'You can still add items and place the order when we open.',
                      style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
                ],
              ),
            ),
          ],
        ),
      );
    });
  }
}
