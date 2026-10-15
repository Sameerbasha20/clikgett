import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/NewModel/faq_category_model.dart';
import 'package:fav_app/new/NewScreens/Support/EnquiryScreen.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class FaqCategoryDetailScreen extends StatelessWidget {
  final FaqCategory category;

  const FaqCategoryDetailScreen({
    Key? key,
    required this.category,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final hasQuestions = category.questions.isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        title: Text(
          category.title,
          style: GoogleFonts.poppins(
            fontSize: 17.5.sp,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        leading: IconButton(
          padding: EdgeInsets.zero,
          onPressed: () => Navigator.of(context).pop(),
          icon: Image.asset(
            backbutton,
            height: 4.5.h,
            width: 9.w,
            fit: BoxFit.contain,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 4.5.w, vertical: 2.h),
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Category Summary Header Card
            _buildHeaderCard(),
            SizedBox(height: 2.5.h),

            // Section Header
            Text(
              "Frequently Asked Questions",
              style: GoogleFonts.poppins(
                fontSize: 15.5.sp,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: 1.2.h),

            // Questions List or Empty State
            if (hasQuestions)
              _buildQuestionsList(context)
            else
              _buildEmptyState(context),

            SizedBox(height: 3.h),

            // Bottom Enquiry Prompt
            _buildEnquiryFooter(context),
            SizedBox(height: 2.h),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(4.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black.withOpacity(0.06), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 13.w,
            height: 13.w,
            decoration: BoxDecoration(
              color: category.iconBgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(
              category.icon,
              color: category.iconColor,
              size: 24,
            ),
          ),
          SizedBox(width: 3.5.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  category.title,
                  style: GoogleFonts.poppins(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  category.description,
                  style: GoogleFonts.poppins(
                    fontSize: 12.5.sp,
                    color: Colors.grey[600],
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionsList(BuildContext context) {
    return Column(
      children: List.generate(category.questions.length, (index) {
        final item = category.questions[index];
        return Container(
          margin: EdgeInsets.only(bottom: 1.2.h),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.black.withOpacity(0.06), width: 1),
          ),
          child: Theme(
            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
              tilePadding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 0.5.h),
              childrenPadding: EdgeInsets.fromLTRB(4.w, 0, 4.w, 2.h),
              iconColor: Appprimary,
              collapsedIconColor: Colors.grey[600],
              title: Text(
                item.question,
                style: GoogleFonts.poppins(
                  fontSize: 14.5.sp,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    item.answer,
                    style: GoogleFonts.poppins(
                      fontSize: 13.5.sp,
                      color: Colors.grey[700],
                      height: 1.45,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 3.5.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black.withOpacity(0.06), width: 1),
      ),
      child: Column(
        children: [
          Container(
            width: 14.w,
            height: 14.w,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.help_outline_rounded,
              color: Colors.grey[500],
              size: 28,
            ),
          ),
          SizedBox(height: 2.h),
          Text(
            "FAQ Articles Coming Soon",
            style: GoogleFonts.poppins(
              fontSize: 15.5.sp,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          SizedBox(height: 1.h),
          Text(
            "Frequently asked questions for this category are currently being prepared. If you have an enquiry regarding ${category.title}, submit it below and we will help you promptly.",
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 13.sp,
              color: Colors.grey[600],
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnquiryFooter(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(4.w),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Appprimary.withOpacity(0.08),
            Appprimary.withOpacity(0.03),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Appprimary.withOpacity(0.2), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.support_agent_rounded, color: Appprimary, size: 22),
              SizedBox(width: 2.w),
              Text(
                "Didn't find your answer?",
                style: GoogleFonts.poppins(
                  fontSize: 14.5.sp,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          SizedBox(height: 0.8.h),
          Text(
            "Submit your enquiry directly to our customer support team for personal assistance.",
            style: GoogleFonts.poppins(
              fontSize: 12.5.sp,
              color: Colors.grey[700],
              height: 1.35,
            ),
          ),
          SizedBox(height: 1.8.h),
          SizedBox(
            width: double.infinity,
            height: 5.5.h,
            child: ElevatedButton(
              onPressed: () {
                if (Navigator.canPop(context)) {
                  Navigator.pop(context, category.title);
                } else {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => EnquiryScreen(initialCategory: category.title),
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Appprimary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: Text(
                "Submit an Enquiry for ${category.title}",
                style: GoogleFonts.poppins(
                  fontSize: 13.5.sp,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
