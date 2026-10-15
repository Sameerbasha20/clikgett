import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/Categories.dart' as categories;
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/clikgett_product_card.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Section G — Recommended for You
/// Features:
/// - Recommends popular or trending catalog products
/// - Horizontal product carousel with ClikgettProductCard
/// - Gracefully adapts when item counts vary
class HomeRecommendedSection extends StatelessWidget {
  final HomeController homeController;

  const HomeRecommendedSection({
    Key? key,
    required this.homeController,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final allItems = homeController.bestItems;
      if (allItems.length <= 4) {
        return const SizedBox.shrink();
      }

      // Take a distinct slice for recommendations (e.g. products after top 4)
      final recommendedProducts = allItems.skip(4).toList();
      if (recommendedProducts.isEmpty) {
        return const SizedBox.shrink();
      }

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
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEDE7F6),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Icon(
                          Icons.thumb_up_alt_rounded,
                          color: Color(0xFF673AB7),
                          size: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "Recommended for You",
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
                    onTap: () async {
                      final token = await CommonServices.getToken();
                      if (token.isEmpty) {
                        Fluttertoast.showToast(msg: "Please Login to browse all items!\nThanks.");
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
                    },
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

            // Horizontal Carousel of ClikgettProductCard
            SizedBox(
              height: 250,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: recommendedProducts.length,
                itemBuilder: (ctx, index) {
                  return ClikgettProductCard(
                    product: recommendedProducts[index],
                    width: 154,
                  );
                },
              ),
            ),
          ],
        ),
      );
    });
  }
}
