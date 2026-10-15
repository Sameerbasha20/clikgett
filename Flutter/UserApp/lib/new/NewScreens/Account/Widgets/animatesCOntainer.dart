import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:shimmer/shimmer.dart';
import 'dart:math';

class AnimatedGradientBorderCard extends StatefulWidget {
  final VoidCallback onTap;
  const AnimatedGradientBorderCard({super.key, required this.onTap});

  @override
  State<AnimatedGradientBorderCard> createState() =>
      _AnimatedGradientBorderCardState();
}

class _AnimatedGradientBorderCardState extends State<AnimatedGradientBorderCard>
    with TickerProviderStateMixin {
  late AnimationController _borderController;
  late AnimationController _zoomController;
  late Animation<double> _zoomAnimation;
  bool showShimmer = false;

  final List<Color> colors = [
    Appprimary,
    white.withOpacity(0.05),
  ];

  @override
  void initState() {
    super.initState();

    // Border rotation animation
    _borderController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();

    // Zoom-in-out animation (scale)
    _zoomController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _zoomAnimation = Tween<double>(begin: 1.0, end: 1.03).animate(
      CurvedAnimation(parent: _zoomController, curve: Curves.easeInOut),
    );

    // Sequence: Zoom in, out, then stop
    _zoomController.forward().then((_) {
      _zoomController.reverse().then((_) {
        // setState(() => showShimmer = false);
      });
    });
  }

  @override
  void dispose() {
    _borderController.dispose();
    _zoomController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 1.h),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedBuilder(
          animation: _borderController,
          builder: (context, child) {
            return ScaleTransition(
              scale: _zoomAnimation,
              child: Container(
                decoration: BoxDecoration(
                  gradient: SweepGradient(
                    startAngle: 0.0,
                    endAngle: 2 * pi,
                    tileMode: TileMode.repeated,
                    colors: colors,
                    transform:
                        GradientRotation(2 * pi * _borderController.value),
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                padding: const EdgeInsets.all(2),
                child: Container(
                  decoration: BoxDecoration(
                    color: white,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 2.h),
                  child: Row(
                    children: [
                      _buildShimmeredCircleIcon(),
                      SizedBox(width: 4.w),
                      Expanded(child: _buildShimmeredText()),
                      Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 18,
                        color: primary.withOpacity(0.9),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildShimmeredCircleIcon() {
    Widget icon = CircleAvatar(
      radius: 22,
      backgroundColor: primary.withOpacity(0.15),
      child: Icon(
        Icons.card_giftcard_rounded,
        color: primary,
        size: 24,
      ),
    );

    return showShimmer
        ? Shimmer.fromColors(
            baseColor: primary.withOpacity(0.4),
            highlightColor: primary,
            child: icon,
          )
        : icon;
  }

  Widget _buildShimmeredText() {
    Widget textColumn = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Refer & Earn",
          style: customTextstyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.w600,
            color: primary,
          ),
        ),
        SizedBox(height: 0.5.h),
        Text(
          "Invite your friends and earn exciting rewards!",
          style: customTextstyle(
            fontSize: 13.sp,
            color: black.withOpacity(0.6),
          ),
        ),
      ],
    );

    return showShimmer
        ? Shimmer.fromColors(
            baseColor: primary.withOpacity(0.4),
            highlightColor: primary,
            child: textColumn,
          )
        : textColumn;
  }
}
