import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../old/Constants/text.dart';
import '../../Constants/colors.dart';
import '../../Constants/imageslist.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, String>> onboardingContent = [
    {
      "title": "Groceries delivered to your doorstep",
      "description":
          "Free delivery on orders over ₹ 499",
      "image": 'Assets/Images/Auth/onboardimgone.png',
      "buttonText": "Next"
    },
    {
      "title": "Browse  our wide range of products with ease and enjoy fast, hassle-free delivery!",
      "description":
          "",
      "image":
          'Assets/Images/Auth/onboardimgtwo.png', // Replace with your second image
      "buttonText": "Get Started"
    },
    // {
    //   "title": "Fresh Groceries, Delivered To Your Door",
    //   "description":
    //       "From Local Stores To Your Doorstep, Enjoy Seamless Shopping With Real-Time Tracking.",
    //   "image":
    //       'Assets/Images/Auth/snacksdrinks.png', // Replace with your third image
    //   "buttonText": "Get Started"
    // }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.2,
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Text(

                onboardingContent[_currentPage]['title']!,
                style: GoogleFonts.poppins(

                  color: tblack1c,
                  fontSize: 18.sp,
                  fontWeight: FontWeight.w500,

                ),
                maxLines: 2,  // Allow up to two lines
                overflow: TextOverflow.ellipsis, //
              ),
            ),
            // customText(
            //   text: onboardingContent[_currentPage]['title']!,
            //
            // ),
            SizedBox(
              height: 2.h,
            ),
            Text(
             onboardingContent[_currentPage]['description']!,
              style: GoogleFonts.poppins(
                color: tblack1c,

                fontSize: 16.sp,
                fontWeight: FontWeight.w400,
              ),
            ),

            // customText(
            //   color: tblack1c,
            //   fontSize: 16.sp,
            //   fontWeight: FontWeight.w400,
            // ),
            SizedBox(
              height: 5.h,
            ),
            Padding(
              padding: const EdgeInsets.only(left: 12, right: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  SmoothPageIndicator(
                    controller: _pageController,
                    count: 2,
                    effect: const ExpandingDotsEffect(
                      activeDotColor: yellow,
                      dotColor: Colors.grey,
                      dotHeight: 10,
                      dotWidth: 10,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      if (_currentPage < onboardingContent.length - 1) {
                        _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut);
                      } else {
                        // Navigate to another screen when 'Get Started' is tapped
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const Login(),
                          ),
                        );
                      }
                    },
                    child: _currentPage == onboardingContent.length - 1
                        ? Container(
                            padding: const EdgeInsets.symmetric(
                                vertical: 10, horizontal: 20),
                            decoration: BoxDecoration(
                              color: primary, // Green background color
                              borderRadius:
                                  BorderRadius.circular(25), // Rounded corners
                            ),
                            child: customText(
                              text: onboardingContent[_currentPage]
                                  ['buttonText']!,
                              fontSize: 18.sp,
                              color: Colors
                                  .white, // White text color for better contrast
                              fontWeight: FontWeight.w600,
                            ),
                          )
                        : customText(
                            text: onboardingContent[_currentPage]
                                ['buttonText']!,
                            fontSize: 18.sp,
                            color: primary,
                            fontWeight: FontWeight.w600,
                          ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Stack(
                children: [
                  // Keep the circle image fixed
                  Positioned(
                    right: -100,
                    bottom: -100,
                    child: Image.asset(
                      circle,
                      height: 50.h,
                      width: 50.h,
                    ),
                  ),
                  // PageView for onboarding content
                  PageView.builder(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    itemCount: onboardingContent.length,
                    itemBuilder: (context, index) {
                      return Align(
                        alignment: Alignment.bottomRight,
                        child: Image.asset(
                          onboardingContent[index]['image']!,
                          height: 30.h,
                          width: 30.h,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
