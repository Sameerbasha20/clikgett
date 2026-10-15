import 'package:carousel_slider/carousel_slider.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/category_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/SubCategoryList.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as homeModel;
import 'package:flutter/material.dart';
import 'package:get/get.dart';

/// Section A — Promotional Hero Banner Carousel
/// Features:
/// - Swipeable carousel with auto-play for multiple banners
/// - High-resolution rounded banner cards (radius 14) with subtle drop shadows
/// - Polished pill page indicator dots
/// - Supports navigation to subcategory or category destinations
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
    if (banner.destinationType == 'subcategory' && banner.destinationId != null) {
      final categoryController = Get.find<CategoryController>();
      final catId = banner.parentCategoryId ?? banner.destinationId!;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SubCategoryList(
            categoryId: catId,
            categoryController: categoryController,
            scrollController: ScrollController(),
          ),
        ),
      );
    } else if (banner.destinationType == 'product' && banner.destinationId != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ItemDescription(id: banner.destinationId!, title: banner.bannerName ?? '', percent: 0),
        ),
      );
    } else if (banner.destinationType == 'category' && banner.destinationId != null) {
      final categoryController = Get.find<CategoryController>();
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SubCategoryList(
            categoryId: banner.destinationId!,
            categoryController: categoryController,
            scrollController: ScrollController(),
          ),
        ),
      );
    }
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
