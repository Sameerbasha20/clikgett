import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/Categories.dart' as categories;
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/SingleCategory.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as homeModel;
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Section B — Shop by Category Grid
/// Features:
/// - Distinct section header with "See all" arrow link.
/// - Responsive 4-column grid with soft pastel tinted card backgrounds.
/// - Consistent image area, subtle borders, readable category names.
/// - "View More" tile for navigating to full categories view.
class HomeShopByCategoryGrid extends StatelessWidget {
  final HomeController homeController;

  const HomeShopByCategoryGrid({
    Key? key,
    required this.homeController,
  }) : super(key: key);

  static const List<Color> pastelColors = [
    Color(0xFFE8F5E9), // Mint green
    Color(0xFFFFF3E0), // Peach
    Color(0xFFEDE7F6), // Lavender
    Color(0xFFE1F5FE), // Sky blue
    Color(0xFFFCE4EC), // Blush pink
    Color(0xFFFFFDE7), // Soft lemon
    Color(0xFFE0F2F1), // Soft teal
    Color(0xFFF3E5F5), // Soft orchid
  ];

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final categoryList = homeController.categories;
      if (categoryList.isEmpty) {
        return const SizedBox.shrink();
      }

      // Display up to 7 categories + 1 "View More" tile in a 4-column grid (or all if <= 8)
      final int displayCount = categoryList.length > 7 ? 7 : categoryList.length;

      return Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  "Shop by Category",
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1F2937),
                  ),
                ),
                InkWell(
                  borderRadius: BorderRadius.circular(6),
                  onTap: () => _navigateToAllCategories(context),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          "See all",
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF2E7D32),
                          ),
                        ),
                        const SizedBox(width: 3),
                        const Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 11,
                          color: Color(0xFF2E7D32),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // 4-Column Grid
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: EdgeInsets.zero,
              itemCount: displayCount + 1, // +1 for "View More" tile
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                crossAxisSpacing: 8,
                mainAxisSpacing: 10,
                childAspectRatio: 0.78,
              ),
              itemBuilder: (ctx, index) {
                if (index == displayCount) {
                  return _buildViewMoreTile(context);
                }

                final cat = categoryList[index];
                final bgColor = pastelColors[index % pastelColors.length];
                return _buildCategoryTile(context, cat, bgColor);
              },
            ),
          ],
        ),
      );
    });
  }

  Widget _buildCategoryTile(BuildContext context, homeModel.SpecialCategory cat, Color bgColor) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () async {
        final token = await CommonServices.getToken();
        if (token.isEmpty) {
          Fluttertoast.showToast(msg: "Please Login to browse this category!\nThanks.");
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
        } else {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => SingleCategory(
                categories: cat,
                isFromHomeScreen: true,
              ),
            ),
          );
        }
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 64,
            width: double.infinity,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.black.withOpacity(0.04), width: 1),
            ),
            child: Center(
              child: CustomNetworkImage(
                url: cat.imageUrl ?? '',
                height: 48,
                width: 48,
                fit: BoxFit.contain,
              ),
            ),
          ),
          const SizedBox(height: 5),
          Text(
            cat.categoryName ?? '',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF374151),
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViewMoreTile(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => _navigateToAllCategories(context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 64,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFFE8F5E9),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF2E7D32).withOpacity(0.2), width: 1),
            ),
            child: const Center(
              child: Icon(
                Icons.grid_view_rounded,
                color: Color(0xFF2E7D32),
                size: 26,
              ),
            ),
          ),
          const SizedBox(height: 5),
          Text(
            "View More",
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF2E7D32),
            ),
          ),
        ],
      ),
    );
  }

  void _navigateToAllCategories(BuildContext context) async {
    final token = await CommonServices.getToken();
    if (token.isEmpty) {
      Fluttertoast.showToast(msg: "Please Login to browse all categories!\nThanks.");
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => categories.Categories(
            isFromHome: true,
            subCategory: true,
          ),
        ),
      );
    }
  }
}
