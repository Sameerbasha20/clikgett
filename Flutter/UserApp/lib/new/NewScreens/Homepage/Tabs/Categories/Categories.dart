// ignore_for_file: non_constant_identifier_names, prefer_const_constructors

import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/empty_data.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/SingleCategory.dart';
import 'package:fav_app/new/NewScreens/Support/widgets/search_product_request_card.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import '../../../../../old/Models/Home/home_model.dart';
import '../../../../Constants/imageslist.dart';
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
  final TextEditingController searchController = TextEditingController();
  final FocusNode searchFocusNode = FocusNode();
  String searchQuery = '';

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  @override
  void dispose() {
    searchController.dispose();
    searchFocusNode.dispose();
    scrollController.dispose();
    super.dispose();
  }

  fetchData() async {
    await categoryController.getCategories(
        context: context, isfromHome: true, categoryId: 0);
  }

  final HomeController homeController = Get.find();
  final CategoryController categoryController = Get.find();

  List<SpecialCategory> get filteredCategories {
    if (searchQuery.trim().isEmpty) {
      return categoryController.categories;
    }
    final q = searchQuery.trim().toLowerCase();
    return categoryController.categories.where((cat) {
      final name = (cat.categoryName ?? '').toLowerCase();
      return name.contains(q);
    }).toList();
  }

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
          title: Text(
            "Categories",
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 18.5.sp,
              color: tColor,
            ),
          ),
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
            // Modern Search Bar
            Container(
              color: Colors.white,
              padding: EdgeInsets.fromLTRB(4.w, 0.5.h, 4.w, 1.5.h),
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: searchQuery.isNotEmpty
                        ? Appprimary.withOpacity(0.6)
                        : Colors.transparent,
                    width: 1.2,
                  ),
                ),
                child: TextField(
                  controller: searchController,
                  focusNode: searchFocusNode,
                  onChanged: (val) {
                    setState(() {
                      searchQuery = val;
                    });
                  },
                  style: GoogleFonts.poppins(
                    fontSize: 13.5.sp,
                    color: Colors.black87,
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: InputDecoration(
                    hintText: "Search categories...",
                    hintStyle: GoogleFonts.poppins(
                      color: Colors.grey.shade500,
                      fontSize: 13.5.sp,
                      fontWeight: FontWeight.normal,
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      color: Appprimary,
                      size: 22,
                    ),
                    suffixIcon: searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(
                              Icons.cancel_rounded,
                              color: Colors.grey,
                              size: 20,
                            ),
                            onPressed: () {
                              searchController.clear();
                              setState(() {
                                searchQuery = '';
                              });
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      vertical: 11,
                      horizontal: 8,
                    ),
                  ),
                ),
              ),
            ),

            // Category Count & Active Filter Indicator (if searching)
            if (searchQuery.trim().isNotEmpty)
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 0.8.h),
                color: const Color(0xFFFAF5FF),
                child: Row(
                  children: [
                    Icon(Icons.filter_list_rounded,
                        size: 16, color: Appprimary),
                    SizedBox(width: 2.w),
                    Expanded(
                      child: Text(
                        "Found ${filteredCategories.length} categories matching \"$searchQuery\"",
                        style: GoogleFonts.poppins(
                          fontSize: 11.5.sp,
                          color: Colors.black87,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

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
          return const CustomLoader();
        }

        if (categoryController.categories.isEmpty) {
          return const EmptyDataWidget(message: 'No Categories Found');
        }

        final displayCategories = filteredCategories;

        if (displayCategories.isEmpty) {
          return Center(
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 2.h),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.search_off_rounded,
                        size: 42,
                        color: Colors.grey.shade400,
                      ),
                    ),
                    SizedBox(height: 1.5.h),
                    Text(
                      "No Categories Found",
                      style: GoogleFonts.poppins(
                        fontSize: 15.sp,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    SizedBox(height: 0.8.h),
                    Text(
                      "We couldn't find any category matching \"$searchQuery\". Try checking the spelling or browse all categories.",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontSize: 12.sp,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    SizedBox(height: 1.5.h),
                    SearchProductRequestCard(
                      searchQuery: searchQuery,
                      onClearSearch: () {
                        searchController.clear();
                        setState(() {
                          searchQuery = '';
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),
          );
        }

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
