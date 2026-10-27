import 'package:fav_app/new/Constants/number_format.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewModel/sale_model.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class FlashSaleSection extends StatelessWidget {
  const FlashSaleSection({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final HomeController homeController = Get.find<HomeController>();

    return Obx(() {
      final activeSales = homeController.activeSales;
      // Requirement 8: If there is no active sale or empty products, hide section entirely.
      if (activeSales.isEmpty) {
        return const SizedBox.shrink();
      }

      // Requirement 4: Support multiple active campaigns if present
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: activeSales.map((campaign) {
          final products = campaign.products ?? [];
          if (products.isEmpty) {
            return const SizedBox.shrink();
          }
          return _buildCampaignSection(context, campaign, products);
        }).toList(),
      );
    });
  }

  Widget _buildCampaignSection(
    BuildContext context,
    SaleCampaign campaign,
    List<SaleProduct> products,
  ) {
    final String title = campaign.saleName?.isNotEmpty == true
        ? campaign.saleName!
        : '🔥 Flash Sale';
    final String subtitle = campaign.description?.isNotEmpty == true
        ? campaign.description!
        : 'Limited-time offers';

    final String discountBadgeText = campaign.discountType == 'percentage'
        ? '${campaign.discountValue?.round() ?? 0}% OFF'
        : 'FLAT ₹${campaign.discountValue?.round() ?? 0} OFF';

    return Container(
      margin: EdgeInsets.only(bottom: 2.h),
      padding: EdgeInsets.symmetric(vertical: 1.5.h),
      decoration: BoxDecoration(
        color: white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Section
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 4.w),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            '🔥',
                            style: TextStyle(fontSize: 18),
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              title,
                              style: GoogleFonts.montserrat(
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF1B1B1B),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFF5722), Color(0xFFFF9800)],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              discountBadgeText,
                              style: GoogleFonts.montserrat(
                                fontSize: 10.sp,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        subtitle,
                        style: GoogleFonts.montserrat(
                          fontSize: 12.sp,
                          color: const Color(0xFF757575),
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 1.5.h),

          // Horizontal Scrolling Products List
          SizedBox(
            height: 25.h,
            child: ListView.separated(
              padding: EdgeInsets.symmetric(horizontal: 4.w),
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: products.length,
              separatorBuilder: (context, index) => SizedBox(width: 3.w),
              itemBuilder: (context, index) {
                final product = products[index];
                return _buildSaleProductCard(context, product, campaign);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSaleProductCard(
    BuildContext context,
    SaleProduct product,
    SaleCampaign campaign,
  ) {
    final primaryVariant = (product.productVariants != null &&
            product.productVariants!.isNotEmpty)
        ? product.productVariants!.first
        : null;

    final double originalPrice = (primaryVariant?.price ?? product.price) ?? 0.0;
    final double offerPrice =
        (primaryVariant?.offerPrice ?? product.offerPrice) ?? originalPrice;
    final double salePrice =
        (primaryVariant?.salePrice ?? product.salePrice) ?? offerPrice;

    final int discountPercent = shelfDiscountPercent(originalPrice, salePrice);

    final bool isOutOfStock = (primaryVariant?.availableQty ?? 0) <= 0;

    final String weight = primaryVariant != null &&
            primaryVariant.metricvalue != null &&
            primaryVariant.metrictype != null
        ? packSize(primaryVariant.metricvalue, primaryVariant.metrictype)
        : '';

    return GestureDetector(
      onTap: () {
        // Tap product -> existing product detail page
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ItemDescription(
              id: product.productId ?? 0,
              title: product.productName ?? '',
              percent: discountPercent.toDouble(),
            ),
          ),
        );
      },
      child: Container(
        width: 40.w,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: const Color(0xFFE0E0E0),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product Image
                Expanded(
                  flex: 5,
                  child: Container(
                    width: double.infinity,
                    color: const Color(0xFFFAFAFA),
                    padding: const EdgeInsets.all(8),
                    child: Center(
                      child: product.imageUrl != null &&
                              product.imageUrl!.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: product.imageUrl!,
                              fit: BoxFit.contain,
                              placeholder: (context, url) => const Center(
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Color(0xFF4CAF50),
                                    ),
                                  ),
                                ),
                              ),
                              errorWidget: (context, url, error) => const Icon(
                                Icons.image_not_supported_outlined,
                                color: Colors.grey,
                                size: 36,
                              ),
                            )
                          : const Icon(
                              Icons.shopping_bag_outlined,
                              color: Colors.grey,
                              size: 36,
                            ),
                    ),
                  ),
                ),

                // Product Details
                Expanded(
                  flex: 5,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8.0,
                      vertical: 6.0,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              product.productName ?? '',
                              style: GoogleFonts.montserrat(
                                fontSize: 13.sp,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF212121),
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (weight.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                weight,
                                style: GoogleFonts.montserrat(
                                  fontSize: 11.sp,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ],
                        ),

                        // Price Row
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              shelfPrice(salePrice),
                              style: GoogleFonts.montserrat(
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF2E7D32),
                              ),
                            ),
                            if (discountPercent > 0) ...[
                              const SizedBox(width: 5),
                              Text(
                                shelfPrice(originalPrice),
                                style: GoogleFonts.montserrat(
                                  fontSize: 11.sp,
                                  fontWeight: FontWeight.w500,
                                  decoration: TextDecoration.lineThrough,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Top-left Sale Discount Badge
            if (discountPercent > 0)
              Positioned(
                top: 6,
                left: 6,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD32F2F),
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 3,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Text(
                    '$discountPercent% OFF',
                    style: GoogleFonts.montserrat(
                      fontSize: 10.sp,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),

            // Out-of-Stock Overlay
            if (isOutOfStock)
              Positioned.fill(
                child: Container(
                  color: Colors.white.withOpacity(0.7),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.75),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Out of Stock',
                        style: GoogleFonts.montserrat(
                          color: Colors.white,
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
