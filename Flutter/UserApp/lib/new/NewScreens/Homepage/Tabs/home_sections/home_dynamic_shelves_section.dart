import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/Categories.dart' as categories;
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/clikgett_product_card.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Section I — Related Shopping Collections & Dynamic Database-Driven Shelves
/// Fully database-driven dispatcher that renders sections returned by
/// `/api/users/homepage` (`homeController.homepagesectionList`) according to their:
/// - DisplayOrder
/// - SectionType:
///   1. selected_products (curated product list)
///   2. category_shelf (products from category)
///   3. subcategory_shelf (products from subcategory)
///   4. shop_by_category (category grid)
///   5. bestsellers (high-demand items)
///   6. recommendations (algorithmically recommended)
///   7. deals_and_offers (sale items)
///   8. promotional_banner (marketing banner)
///   9. order_again (personalized purchase history)
class HomeDynamicShelvesSection extends StatelessWidget {
  final HomeController homeController;
  final dynamic singleSection;

  const HomeDynamicShelvesSection({
    Key? key,
    required this.homeController,
    this.singleSection,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (singleSection != null) {
      final section = singleSection;
      final type = (section.sectionType ?? 'selected_products').toLowerCase();

      // 1. Promotional Banner Type
      if (type == 'promotional_banner') {
        return _buildPromotionalBanner(context, section);
      }

      // 2. Shop by Category Grid Type
      if (type == 'shop_by_category') {
        return _buildCategoryGridSection(context, section);
      }

      // 3. Product Shelf Types
      final products = section.products ?? [];
      if (products.isEmpty) {
        return const SizedBox.shrink();
      }

      return _buildProductShelf(context, section, products, type);
    }

    return Obx(() {
      final sectionList = homeController.homepagesectionList;
      if (sectionList.isEmpty) {
        return const SizedBox.shrink();
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: sectionList.map((section) {
          final type = (section.sectionType ?? 'selected_products').toLowerCase();

          // 1. Promotional Banner Type
          if (type == 'promotional_banner') {
            return _buildPromotionalBanner(context, section);
          }

          // 2. Shop by Category Grid Type
          if (type == 'shop_by_category') {
            return _buildCategoryGridSection(context, section);
          }

          // 3. Product Shelf Types (selected_products, category_shelf, subcategory_shelf,
          //    bestsellers, recommendations, deals_and_offers, order_again)
          final products = section.products ?? [];
          if (products.isEmpty) {
            return const SizedBox.shrink();
          }

          return _buildProductShelf(context, section, products, type);
        }).toList(),
      );
    });
  }

  /// Builds a Product Shelf with themed header, icon, subtitle, "See all", and product carousel
  Widget _buildProductShelf(
    BuildContext context,
    dynamic section,
    List<dynamic> products,
    String type,
  ) {
    final String title = section.name?.isNotEmpty == true
        ? section.name!
        : 'Featured Collection';
    final String? subtitle = section.description?.isNotEmpty == true
        ? section.description
        : null;

    // Resolve Theme and View All from ConfigurationJSON
    Color bgColor = Colors.white;
    String viewAllLabel = "See all";
    try {
      if (section.configurationJSON != null && section.configurationJSON!.isNotEmpty) {
        final Map<String, dynamic> config = jsonDecode(section.configurationJSON!);
        if (config['viewAllLabel'] != null && config['viewAllLabel'].toString().isNotEmpty) {
          viewAllLabel = config['viewAllLabel'].toString();
        }
        final theme = config['theme']?.toString().toLowerCase();
        if (theme == 'mint') {
          bgColor = const Color(0xFFF1F8E9);
        } else if (theme == 'orange') {
          bgColor = const Color(0xFFFFF8E1);
        } else if (theme == 'lavender') {
          bgColor = const Color(0xFFF3E5F5);
        } else if (theme == 'sky') {
          bgColor = const Color(0xFFE1F5FE);
        }
      }
    } catch (_) {}

    // Resolve Icon and Accent Colors per SectionType
    IconData iconData = Icons.auto_awesome_rounded;
    Color iconColor = const Color(0xFF2E7D32);
    Color iconBgColor = const Color(0xFFE8F5E9);

    if (type == 'bestsellers') {
      iconData = Icons.local_fire_department_rounded;
      iconColor = const Color(0xFFE65100);
      iconBgColor = const Color(0xFFFFE0B2);
    } else if (type == 'deals_and_offers') {
      iconData = Icons.local_offer_rounded;
      iconColor = const Color(0xFFC2185B);
      iconBgColor = const Color(0xFFFCE4EC);
    } else if (type == 'recommendations') {
      iconData = Icons.star_rounded;
      iconColor = const Color(0xFFF57F17);
      iconBgColor = const Color(0xFFFFF9C4);
    } else if (type == 'order_again') {
      iconData = Icons.history_rounded;
      iconColor = const Color(0xFF00695C);
      iconBgColor = const Color(0xFFE0F2F1);
    } else if (type == 'category_shelf' || type == 'subcategory_shelf') {
      iconData = Icons.kitchen_rounded;
      iconColor = const Color(0xFF1565C0);
      iconBgColor = const Color(0xFFE3F2FD);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
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
          // Section Header Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          color: iconBgColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          iconData,
                          color: iconColor,
                          size: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF1F2937),
                              ),
                            ),
                            if (subtitle != null)
                              Text(
                                subtitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: const Color(0xFF6B7280),
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
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
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          viewAllLabel,
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
              itemCount: products.length,
              itemBuilder: (ctx, index) {
                return ClikgettProductCard(
                  product: products[index],
                  width: 154,
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  /// Builds a Category Grid Section for `shop_by_category` type
  Widget _buildCategoryGridSection(BuildContext context, dynamic section) {
    final List<dynamic> catList = (section.categories != null && section.categories!.isNotEmpty)
        ? section.categories!
        : homeController.categories;

    if (catList.isEmpty) return const SizedBox.shrink();

    final String title = section.name?.isNotEmpty == true
        ? section.name!
        : "Shop by Category";

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: const Color(0xFFE3F2FD),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.grid_view_rounded,
                  color: Color(0xFF1565C0),
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
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: catList.length > 8 ? 8 : catList.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.76,
            ),
            itemBuilder: (ctx, idx) {
              final cat = catList[idx];
              final imgUrl = cat.imageUrl ?? cat.categoryImage ?? "";
              final catName = cat.categoryName ?? "Category";

              return InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => categories.Categories(
                        isFromHome: true,
                        subCategory: true,
                      ),
                    ),
                  );
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  padding: const EdgeInsets.all(6),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Expanded(
                        child: imgUrl.isNotEmpty
                            ? CachedNetworkImage(
                                imageUrl: imgUrl,
                                fit: BoxFit.contain,
                                errorWidget: (_, __, ___) => const Icon(
                                  Icons.fastfood_rounded,
                                  color: Color(0xFF2E7D32),
                                  size: 28,
                                ),
                              )
                            : const Icon(
                                Icons.fastfood_rounded,
                                color: Color(0xFF2E7D32),
                                size: 28,
                              ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        catName,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1E293B),
                          height: 1.1,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  /// Builds a Promotional Campaign Banner
  Widget _buildPromotionalBanner(BuildContext context, dynamic section) {
    final String bannerUrl = section.imageUrl ?? "";
    if (bannerUrl.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: CachedNetworkImage(
          imageUrl: bannerUrl,
          fit: BoxFit.cover,
          width: double.infinity,
          height: 130,
          errorWidget: (_, __, ___) => const SizedBox.shrink(),
        ),
      ),
    );
  }
}
