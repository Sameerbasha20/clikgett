import 'package:carousel_slider/carousel_slider.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/CouponAndOffers/Offers.dart';
import 'package:fav_app/new/NewScreens/Homepage/Storefront/quick_actions_row.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/SingleCategory.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as homeModel;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Section A — Promotional Hero Banner Carousel
/// Features:
/// - Swipeable carousel with auto-play for multiple banners
/// - High-resolution rounded banner cards (radius 14) with subtle drop shadows
/// - Polished pill page indicator dots
/// - A tap opens what the admin chose for the banner (product, category,
///   subcategory, offers, bulk deals), or the banner itself in full
class HomeHeroBannerCarousel extends StatefulWidget {
  final HomeController homeController;

  const HomeHeroBannerCarousel({
    Key? key,
    required this.homeController,
  }) : super(key: key);

  @override
  State<HomeHeroBannerCarousel> createState() => _HomeHeroBannerCarouselState();
}

class _HomeHeroBannerCarouselState extends State<HomeHeroBannerCarousel> {
  int _currentIndex = 0;

  void _onBannerTap(BuildContext context, homeModel.Banner banner) {
    final id = banner.destinationId;
    final type = banner.destinationType ?? 'none';
    Widget screen;
    if (type == 'product' && id != null) {
      screen = ItemDescription(id: id, title: banner.bannerName ?? '', percent: 0);
    } else if (type == 'category' && id != null) {
      screen = SingleCategory(categories: homeModel.SpecialCategory(categoryId: id, categoryName: banner.bannerName ?? ''));
    } else if (type == 'subcategory' && id != null && banner.parentCategoryId != null) {
      screen = SingleCategory(
        categories: homeModel.SpecialCategory(categoryId: banner.parentCategoryId, categoryName: banner.bannerName ?? ''),
        initialSubCategoryId: id,
      );
    } else if (type == 'offers') {
      screen = const Offers();
    } else if (type == 'bulk_deals') {
      screen = const BulkDealsScreen();
    } else {
      screen = BannerDetailScreen(banner: banner);
    }
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final banners = widget.homeController.banners;
      if (banners.isEmpty) {
        return const SizedBox.shrink();
      }

      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Column(
          children: [
            CarouselSlider.builder(
              itemCount: banners.length,
              itemBuilder: (ctx, index, _) {
                final banner = banners[index];
                return GestureDetector(
                  onTap: () => _onBannerTap(context, banner),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: CustomNetworkImage(
                          url: banner.imageUrl ?? '',
                          height: 140,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                );
              },
              options: CarouselOptions(
                height: 140,
                viewportFraction: 0.94,
                autoPlay: banners.length > 1,
                autoPlayInterval: const Duration(seconds: 4),
                autoPlayAnimationDuration: const Duration(milliseconds: 600),
                enableInfiniteScroll: banners.length > 1,
                scrollPhysics: banners.length > 1
                    ? const AlwaysScrollableScrollPhysics()
                    : const NeverScrollableScrollPhysics(),
                onPageChanged: (index, _) {
                  setState(() {
                    _currentIndex = index;
                  });
                },
              ),
            ),

            // Carousel Dots Indicator
            if (banners.length > 1) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  banners.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: _currentIndex == index ? 18 : 6,
                    height: 6,
                    margin: const EdgeInsets.symmetric(horizontal: 2.5),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(3),
                      color: _currentIndex == index
                          ? const Color(0xFF2E7D32)
                          : const Color(0xFFD1D5DB),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      );
    });
  }
}

/// A banner with no link: the full image and its description.
class BannerDetailScreen extends StatelessWidget {
  final homeModel.Banner banner;

  const BannerDetailScreen({super.key, required this.banner});

  @override
  Widget build(BuildContext context) {
    final description = (banner.description ?? '').trim();
    final hasDescription = description.isNotEmpty && description != 'NA';
    return Scaffold(
      backgroundColor: white,
      appBar: AppBar(
        backgroundColor: white,
        foregroundColor: tColor,
        elevation: 0.5,
        title: Text((banner.bannerName ?? 'Offer').trim(), style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AspectRatio(
              aspectRatio: 2.4,
              child: CustomNetworkImage(url: banner.imageUrl ?? '', width: double.infinity, fit: BoxFit.cover),
            ),
          ),
          const SizedBox(height: 18),
          Text((banner.bannerName ?? '').trim(), style: GoogleFonts.poppins(fontSize: 19, fontWeight: FontWeight.w700, color: tColor)),
          if (hasDescription) ...[
            const SizedBox(height: 6),
            Text(description, style: GoogleFonts.poppins(fontSize: 14, height: 1.5, color: tColor3)),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: SizedBox(
          height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: primary,
              foregroundColor: white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Start shopping', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
          ),
        ),
      ),
    );
  }
}
