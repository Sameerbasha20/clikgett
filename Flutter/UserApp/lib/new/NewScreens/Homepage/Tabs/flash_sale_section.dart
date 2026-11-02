import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewModel/sale_model.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/clikgett_product_card.dart';
import 'package:fav_app/old/Models/Home/home_model.dart';
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

    final items = products
        .where((p) => p.raw != null)
        .map((p) => BestItem.fromJson(p.raw!))
        .toList();
    if (items.isEmpty) return const SizedBox.shrink();

    final String discountBadgeText = campaign.discountType == 'percentage'
        ? '${campaign.discountValue?.round() ?? 0}% OFF MRP'
        : '₹${campaign.discountValue?.round() ?? 0} OFF MRP';

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

          // Same card as the rest of the store: photo, sale price, ADD button.
          SizedBox(
            height: ClikgettProductCard.heightFor(context) + 4,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              itemBuilder: (_, i) => ClikgettProductCard(
                key: ValueKey('sale-${campaign.saleId}-${items[i].productId}'),
                product: items[i],
                width: 150,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
