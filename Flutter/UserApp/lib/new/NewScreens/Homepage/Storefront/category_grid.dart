import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/NewScreens/Homepage/Storefront/section_product_rail.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/SingleCategory.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as home_model;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Blinkit-style grid of category tiles (4 per row). Tapping opens the category.
class CategoryGrid extends StatelessWidget {
  final String? title;
  final List<home_model.SpecialCategory> categories;

  /// Show at most this many tiles (null = all).
  final int? maxTiles;

  const CategoryGrid({Key? key, required this.categories, this.title, this.maxTiles}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();
    final shown = maxTiles == null ? categories : categories.take(maxTiles!).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) SectionHeader(title: title!),
        GridView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 10,
            crossAxisSpacing: 8,
            mainAxisExtent: 112,
          ),
          itemCount: shown.length,
          itemBuilder: (_, i) => _CategoryTile(category: shown[i]),
        ),
      ],
    );
  }
}

class _CategoryTile extends StatelessWidget {
  final home_model.SpecialCategory category;

  const _CategoryTile({required this.category});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => SingleCategory(categories: category, isFromHomeScreen: true),
      )),
      child: Column(
        children: [
          Container(
            height: 76,
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6F1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: CustomNetworkImage(url: category.imageUrl ?? '', fit: BoxFit.contain),
          ),
          const SizedBox(height: 5),
          Text(
            (category.categoryName ?? '').trim(),
            maxLines: 2,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.poppins(fontSize: 10.5, height: 1.2, fontWeight: FontWeight.w600, color: tColor4),
          ),
        ],
      ),
    );
  }
}
