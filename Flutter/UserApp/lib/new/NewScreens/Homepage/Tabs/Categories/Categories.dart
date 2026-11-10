// ignore_for_file: non_constant_identifier_names, prefer_const_constructors

import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/empty_data.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/SingleCategory.dart';
import 'package:fav_app/new/NewScreens/Homepage/SearchScreen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import '../../../../../old/Models/Home/home_model.dart';
import '../../../../Constants/network_image.dart';
import '../../../../Controllers/category_controller.dart';
import '../../../../Controllers/home_controller.dart';

class Categories extends StatefulWidget {
  const Categories(
      {super.key,
      this.isFromHome = false,
      this.subCategory = false,
      this.backtoCategory = false});
  final bool? isFromHome;
  final bool? subCategory;
  final bool? backtoCategory;

  @override
  State<Categories> createState() => _CategoriesState();
}

class _CategoriesState extends State<Categories> {
  final ScrollController scrollController = ScrollController();

  // One search everywhere: products (by name or other names) and categories.
  void _openSearch() =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SearchScreen()));

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  @override
  void dispose() {
    scrollController.dispose();
    super.dispose();
  }

  fetchData() async {
    await categoryController.getCategories(
        context: context, isfromHome: true, categoryId: 0);
  }

  final HomeController homeController = Get.find();
  final CategoryController categoryController = Get.find();

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (widget.isFromHome == true) {
          Navigator.pop(context);
        } else {
          homeController.updateTabIndex(0);
        }
        return false;
      },
      child: Scaffold(
        backgroundColor: bg1,
        appBar: AppBar(
          elevation: 0,
          backgroundColor: white,
          surfaceTintColor: Colors.transparent,
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(
              color: cardBorder,
              height: 1,
            ),
          ),
          titleSpacing: 0,
          title: Text(
            "Categories",
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 18.5.sp,
              color: tColor,
            ),
          ),
          actions: [
            IconButton(
              tooltip: 'Search products',
              onPressed: _openSearch,
              icon: Container(
                padding: const EdgeInsets.all(7),
                decoration: const BoxDecoration(color: primaryGhost, shape: BoxShape.circle),
                child: const Icon(Icons.search_rounded, size: 20, color: primaryDark),
              ),
            ),
            const SizedBox(width: 6),
          ],
          leading: IconButton(
            padding: EdgeInsets.zero,
            onPressed: () {
              if (widget.isFromHome == true) {
                Navigator.pop(context);
              } else {
                homeController.updateTabIndex(0);
              }
            },
            icon: Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 20,
              color: tColor,
            ),
          ),
        ),
        body: Column(
          children: [
            // Categories Grid / Loader
            Expanded(
              child: RefreshIndicator(
                color: Appprimary,
                backgroundColor: white,
                onRefresh: () async {
                  await fetchData();
                },
                child: CategoriesWidget(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget CategoriesWidget() {
    return Obx(
      () {
        if (categoryController.isCategoryLoading.isTrue) {
          return const CustomLoader(kind: SkeletonKind.categories);
        }

        if (categoryController.categories.isEmpty) {
          return const EmptyDataWidget(message: 'No Categories Found');
        }

        final displayCategories = categoryController.categories;

        return GridView.builder(
          physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics()),
          // Bottom room for the floating "View cart" pill.
          padding: EdgeInsets.fromLTRB(3.w, 1.2.h, 3.w, 90),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 1.2.h,
            crossAxisSpacing: 2.5.w,
            childAspectRatio: 0.82,
          ),
          itemCount: displayCategories.length,
          itemBuilder: (context, index) {
            var categories = displayCategories[index];
            return categoryListWidget(index, categories);
          },
        );
      },
    );
  }

  Widget categoryListWidget(int index, SpecialCategory categories) {
    String imageUrl = categories.imageUrl ?? '';

    return Container(
      decoration: BoxDecoration(
        color: white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder, width: 1),
        boxShadow: softCardShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.of(context).push(MaterialPageRoute(
              builder: (context) => SingleCategory(
                categories: categories,
                subCategory: widget.subCategory,
                backtoCategories: widget.backtoCategory,
              ),
            ));
          },
          child: Padding(
            padding: EdgeInsets.all(2.w),
            child: Column(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: double.infinity,
                      color: const Color(0xFFF9FAFB),
                      child: CustomNetworkImage(
                        url: imageUrl,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
                SizedBox(height: 0.8.h),
                Text(
                  categories.categoryName ?? '',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 12.sp,
                    fontWeight: FontWeight.w600,
                    color: tColor,
                    height: 1.2,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 0.4.h),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
