// ignore_for_file: prefer_const_constructors, non_constant_identifier_names

import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/category_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/SearchScreen.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/SubCategoryList.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../../../old/Models/Home/home_model.dart';
import '../../../../Constants/imageslist.dart';
import '../../../../Constants/network_image.dart';

class SingleCategory extends StatefulWidget {
  const SingleCategory(
      {super.key,
      required this.categories,
      this.isFromHomeScreen = false,
      this.subCategory = false,
      this.backtoCategories = false});

  final SpecialCategory categories;
  final bool? isFromHomeScreen;
  final bool? subCategory;
  final bool? backtoCategories;

  @override
  State<SingleCategory> createState() => _SingleCategoryState();
}

class _SingleCategoryState extends State<SingleCategory>
    with TickerProviderStateMixin {
  TabController? tabController;
  bool hasInitialTabBeenLoaded = false;

  final ScrollController scrollController = ScrollController();
  final CartController cartController = Get.find();
  final CategoryController categoryController = Get.find();
  final HomeController homeController = Get.find();

  @override
  void initState() {
    super.initState();
    hasInitialTabBeenLoaded = false;
    categoryController.clearSubCategories();
    categoryController.clearProducts();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await fetchCategory();
    });
  }

  Future<void> fetchCategory() async {
    await Future.wait([
      categoryController.getSubCategories(
        context: context,
        categoryId: widget.categories.categoryId,
      ),
      cartController.getCart(
        context: context,
        longitude: homeController.longitude,
        latitude: homeController.latitude,
      ),
    ]);

    if (!mounted) return;

    if (categoryController.subCategories.isNotEmpty) {
      _initTabController();
    }
  }

  void _initTabController() {
    if (!mounted) return;
    final length = categoryController.subCategories.length;
    if (length == 0) return;

    tabController?.dispose();
    tabController = TabController(
      length: length,
      vsync: this,
    );

    tabController!.addListener(() {
      if (!tabController!.indexIsChanging && hasInitialTabBeenLoaded) {
        callProductsWhenTabChange(tabController!.index, false);
      }
    });

    hasInitialTabBeenLoaded = true;

    callProductsWhenTabChange(0, false);

    if (mounted) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    categoryController.clearProducts();
    categoryController.clearSubCategories();
    cartController.clearVariantsId();
    cartController.removeLoaders();
    categoryController.removeLimitAndOffset();
    tabController?.dispose();
    tabController = null;
    scrollController.dispose();
    super.dispose();
  }

  callProductsWhenTabChange(int value, bool onTapAllow) {
    if (!mounted) return;

    categoryController.clearProducts();
    categoryController.clearProductspagination();
    categoryController.checkOffsetLimitExistornot(false);
    categoryController.updateOffset(offset: 0);

    categoryController.getProducts(
      storeOffsetIfItFromProducts: true,
      context: context,
      categoryId: widget.categories.categoryId ?? 0,
      subcategoryId: categoryController.subCategories[value].subCategoryId ?? 0,
    );

    categoryController.updateTab();
    categoryController.updateTabIndex(value);
  }

  void _handlePop() {
    if (widget.isFromHomeScreen == true || widget.subCategory == true) {
      Navigator.pop(context);
    } else {
      if (widget.backtoCategories == true) {
        Navigator.pop(context);
      } else {
        homeController.updateTabIndex(0);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        _handlePop();
        return false;
      },
      child: SafeArea(
        top: false,
        child: Obx(() {
          // If subcategories are still loading
          if (categoryController.isLoading.isTrue &&
              categoryController.subCategories.isEmpty) {
            return Scaffold(
              backgroundColor: bg,
              appBar: _buildAppBar(),
              body: const CustomLoader(),
            );
          }

          // If no subcategories exist
          if (categoryController.subCategories.isEmpty) {
            return Scaffold(
              backgroundColor: bg,
              appBar: _buildAppBar(),
              body: Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8.w),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Appprimary.withOpacity(0.08),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.category_outlined,
                          size: 48,
                          color: Appprimary,
                        ),
                      ),
                      SizedBox(height: 2.h),
                      Text(
                        "No Subcategories Found",
                        style: GoogleFonts.poppins(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      SizedBox(height: 1.h),
                      Text(
                        "Products for \"${widget.categories.categoryName ?? 'this category'}\" are currently being updated. Please check back shortly.",
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          fontSize: 12.sp,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      SizedBox(height: 3.h),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Appprimary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: EdgeInsets.symmetric(
                              horizontal: 6.w, vertical: 1.4.h),
                        ),
                        onPressed: _handlePop,
                        icon: const Icon(Icons.arrow_back_rounded, size: 18),
                        label: Text(
                          "Back to Categories",
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            fontSize: 13.sp,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }

          // Ensure TabController is in sync with subcategories safely outside build
          if (tabController == null ||
              tabController!.length != categoryController.subCategories.length) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted && categoryController.subCategories.isNotEmpty) {
                _initTabController();
              }
            });
            return Scaffold(
              backgroundColor: bg,
              appBar: _buildAppBar(),
              body: const CustomLoader(),
            );
          }

          return Scaffold(
            backgroundColor: bg,
            appBar: _buildAppBar(hasTabs: true),
            body: TabBarView(
              controller: tabController,
              physics: const BouncingScrollPhysics(
                parent: AlwaysScrollableScrollPhysics(),
              ),
              children: categoryController.subCategories.map((subCat) {
                return SubCategoryList(
                  categoryId: widget.categories.categoryId ?? 0,
                  scrollController: scrollController,
                  categoryController: categoryController,
                );
              }).toList(),
            ),
          );
        }),
      ),
    );
  }

  AppBar _buildAppBar({bool hasTabs = false}) {
    return AppBar(
      elevation: 0,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      centerTitle: false,
      title: Row(
        children: [
          if (widget.categories.imageUrl != null &&
              widget.categories.imageUrl!.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: 32,
                height: 32,
                color: const Color(0xFFF3F4F6),
                child: CustomNetworkImage(
                  url: widget.categories.imageUrl!,
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Text(
              widget.categories.categoryName ?? '',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700,
                fontSize: 16.5.sp,
                color: Colors.black87,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      leading: IconButton(
        padding: EdgeInsets.zero,
        onPressed: _handlePop,
        icon: Image.asset(
          backbutton,
          height: 5.h,
          width: 10.w,
          fit: BoxFit.cover,
        ),
      ),
      actions: [
        IconButton(
          tooltip: "Search Products",
          icon: const Icon(Icons.search_rounded, color: Colors.black87, size: 24),
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const SearchScreen()),
            );
          },
        ),
        SizedBox(width: 1.w),
      ],
      bottom: hasTabs && categoryController.subCategories.isNotEmpty
          ? PreferredSize(
              preferredSize: Size.fromHeight(6.h),
              child: Container(
                color: Colors.white,
                padding: EdgeInsets.symmetric(vertical: 0.8.h),
                child: GetBuilder<CategoryController>(
                  id: 'update-tab',
                  builder: (_) {
                    return SizedBox(
                      height: 4.2.h,
                      child: TabBar(
                        controller: tabController,
                        isScrollable: true,
                        tabAlignment: TabAlignment.start,
                        padding: EdgeInsets.symmetric(horizontal: 3.w),
                        labelPadding: EdgeInsets.symmetric(horizontal: 1.5.w),
                        indicator: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          color: Appprimary,
                          boxShadow: [
                            BoxShadow(
                              color: Appprimary.withOpacity(0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        indicatorSize: TabBarIndicatorSize.tab,
                        dividerColor: Colors.transparent,
                        labelColor: Colors.white,
                        unselectedLabelColor: Colors.grey.shade700,
                        tabs: categoryController.subCategories.map((e) {
                          return Tab(
                            height: 34,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 6),
                              alignment: Alignment.center,
                              child: Text(
                                e.subCategoryName ?? '',
                                style: GoogleFonts.poppins(
                                  fontSize: 12.5.sp,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    );
                  },
                ),
              ),
            )
          : null,
    );
  }
}
