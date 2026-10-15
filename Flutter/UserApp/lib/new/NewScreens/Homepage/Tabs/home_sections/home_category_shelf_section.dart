import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/Categories.dart' as categories;
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/SingleCategory.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Reusable curated category shelf for:
/// - Section D: Grocery & Kitchen
/// - Section E: Snacks & Drinks
/// Matches categories against authoritative catalog Category IDs.
class HomeCategoryShelfSection extends StatelessWidget {
  final HomeController homeController;
  final String title;
  final IconData icon;
  final Color iconBgColor;
  final Color iconColor;
  final Set<int> targetCategoryIds;

  const HomeCategoryShelfSection({
    Key? key,
    required this.homeController,
    required this.title,
    required this.icon,
    required this.iconBgColor,
    required this.iconColor,
    required this.targetCategoryIds,
  }) : super(key: key);

  static const List<Color> pastelColors = [
    Color(0xFFE8F5E9), // Mint green
    Color(0xFFFFF3E0), // Peach
    Color(0xFFEDE7F6), // Lavender
    Color(0xFFE1F5FE), // Sky blue
    Color(0xFFFCE4EC), // Blush pink
    Color(0xFFFFFDE7), // Soft lemon
  ];

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final allCats = homeController.categories;
      if (allCats.isEmpty) return const SizedBox.shrink();

      // Filter categories strictly by catalog ID
      final matchedCats = allCats
          .where((cat) => cat.categoryId != null && targetCategoryIds.contains(cat.categoryId))
          .toList();

      if (matchedCats.isEmpty) return const SizedBox.shrink();

      return Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(vertical: 10),
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
            // Header Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          color: iconBgColor,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Icon(
                          icon,
                          color: iconColor,
                          size: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        title,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1F2937),
                        ),
                      ),
                    ],
                  ),
                  InkWell(
                    borderRadius: BorderRadius.circular(6),
                    onTap: () => _navigateToAll(context),
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
            ),
            const SizedBox(height: 10),

            // Horizontal Carousel of Category Cards
            SizedBox(
              height: 110,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: matchedCats.length,
                itemBuilder: (ctx, index) {
                  final cat = matchedCats[index];
                  final bgColor = pastelColors[index % pastelColors.length];

                  return Container(
                    width: 88,
                    margin: const EdgeInsets.only(right: 10),
                    child: InkWell(
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
                            height: 68,
                            width: 88,
                            decoration: BoxDecoration(
                              color: bgColor,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.black.withOpacity(0.04), width: 1),
                            ),
                            child: Center(
                              child: CustomNetworkImage(
                                url: cat.imageUrl ?? '',
                                height: 50,
                                width: 50,
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
                              height: 1.15,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      );
    });
  }

  void _navigateToAll(BuildContext context) async {
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
