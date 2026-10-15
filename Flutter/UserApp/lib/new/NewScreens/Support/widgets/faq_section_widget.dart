import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewModel/faq_category_model.dart';
import 'package:fav_app/new/NewScreens/Support/faq_category_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

/// Reusable FAQ section displaying the 6 FAQ categories in a single rounded container
/// matching the exact layout and hierarchy of the reference design.
class FaqSectionWidget extends StatelessWidget {
  final ValueChanged<String>? onCategorySelected;

  const FaqSectionWidget({Key? key, this.onCategorySelected}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final categories = FaqRepository.getCategories();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Heading "FAQs"
        Padding(
          padding: EdgeInsets.symmetric(vertical: 1.h),
          child: Text(
            "FAQs",
            style: GoogleFonts.poppins(
              fontSize: 17.sp,
              fontWeight: FontWeight.w700,
              color: Colors.black87,
            ),
          ),
        ),

        // Single rounded container holding all 6 categories
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.black.withOpacity(0.08),
              width: 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Column(
              children: List.generate(categories.length, (index) {
                final category = categories[index];
                final isLast = index == categories.length - 1;

                return Column(
                  children: [
                    _buildCategoryRow(context, category),
                    if (!isLast)
                      Divider(
                        height: 1,
                        thickness: 0.8,
                        color: Colors.black.withOpacity(0.06),
                        indent: 17.w, // Aligns divider under text content
                        endIndent: 4.w,
                      ),
                  ],
                );
              }),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryRow(BuildContext context, FaqCategory category) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => FaqCategoryDetailScreen(category: category),
            ),
          );
          if (result != null && result is String && onCategorySelected != null) {
            onCategorySelected!(result);
          }
        },
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.8.h),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Icon on the left
              Container(
                width: 10.5.w,
                height: 10.5.w,
                decoration: BoxDecoration(
                  color: category.iconBgColor,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(
                    category.icon,
                    color: category.iconColor,
                    size: 21,
                  ),
                ),
              ),
              SizedBox(width: 3.5.w),

              // Category title and description in the center
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category.title,
                      style: GoogleFonts.poppins(
                        fontSize: 14.5.sp,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      category.description,
                      style: GoogleFonts.poppins(
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w400,
                        color: Colors.grey[600],
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              SizedBox(width: 2.w),

              // Right-facing chevron
              Icon(
                Icons.chevron_right_rounded,
                color: Colors.grey[400],
                size: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
