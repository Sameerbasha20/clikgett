import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:fav_app/Models/Home/TimingProvider.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:fav_app/new/NewScreens/Account/Profile.dart';
import 'package:fav_app/new/NewScreens/Address/ManageAddress.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/CouponAndOffers/wallet.dart';
import 'package:fav_app/new/NewScreens/Homepage/SearchScreen.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/Categories.dart' as categories;
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/SingleCategory.dart';
import 'package:fav_app/new/NewScreens/PhotoOrders/PhotoOrderUploadScreen.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Top header section for ClikGett Home:
/// - Prominent delivery time badge & truncated address selector
/// - Wallet balance shortcut and profile avatar
/// - Clean rounded search bar with animated hint words and camera action for photo ordering
/// - Horizontally scrollable category shortcuts directly beneath header
class HomeHeaderWidget extends StatelessWidget {
  final HomeController homeController;
  final AdressController adressController;
  final TimingController timingController;
  final WalletController walletController;
  final CartController cartController;

  const HomeHeaderWidget({
    Key? key,
    required this.homeController,
    required this.adressController,
    required this.timingController,
    required this.walletController,
    required this.cartController,
  }) : super(key: key);

  final List<List<Color>> glossyGradients = const [
    [Color(0xFFE8F5E9), Color(0xFFC8E6C9)], // Light green
    [Color(0xFFFFF3E0), Color(0xFFFFE0B2)], // Soft orange
    [Color(0xFFEDE7F6), Color(0xFFD1C4E9)], // Soft purple
    [Color(0xFFE1F5FE), Color(0xFFB3E5FC)], // Sky blue
    [Color(0xFFFCE4EC), Color(0xFFF8BBD0)], // Soft pink
    [Color(0xFFFFFDE7), Color(0xFFFFF9C4)], // Soft yellow
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFF4CAF50), // ClikGett light green
            Color(0xFF2E7D32), // ClikGett dark green
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Delivery & Actions Top Row
              _buildTopBar(context),
              const SizedBox(height: 10),

              // 2. Search Bar with Animated Hint & Camera Action
              _buildSearchBar(context),
              const SizedBox(height: 8),

              // 3. Store Status Warning if closed/unserviceable
              _buildStoreStatusWidget(),

              // 4. Category Shortcut Pills
              _buildCategoryShortcuts(context),
              const SizedBox(height: 6),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Delivery Time & Address Selector
        Expanded(
          child: Obx(() {
            return PopupMenuButton<String>(
              offset: const Offset(0, 44),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              color: Colors.white,
              itemBuilder: (ctx) {
                List<PopupMenuEntry<String>> items = adressController.address
                    .map<PopupMenuEntry<String>>((str) {
                  return PopupMenuItem<String>(
                    value: str.type.replaceAll(",", ''),
                    onTap: () {
                      homeController.storeLocation(str, adressController.address);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            str.type.replaceAll(", ", " "),
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF1F2937),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            str.address,
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w400,
                              color: Colors.grey[600],
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList();

                items.add(const PopupMenuDivider());
                items.add(
                  PopupMenuItem<String>(
                    enabled: false,
                    value: 'manage',
                    child: GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => ManageAddress()),
                        );
                      },
                      child: Row(
                        children: [
                          const Icon(Icons.settings_outlined, size: 18, color: Color(0xFF2E7D32)),
                          const SizedBox(width: 8),
                          Text(
                            "Manage Addresses",
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF2E7D32),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );

                return items;
              },
              child: InkWell(
                onTap: adressController.address.isEmpty
                    ? () {
                        customToast(message: 'No Addresses Found, Create Address');
                        Navigator.push(context, MaterialPageRoute(builder: (_) => ManageAddress()));
                      }
                    : null,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Flash / Delivery pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.28),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.electric_bolt_rounded, size: 13, color: Color(0xFFFFEB3B)),
                          const SizedBox(width: 2),
                          Text(
                            "10 MINS",
                            style: GoogleFonts.poppins(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Truncated Address Info
                    Flexible(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            children: [
                              Text(
                                homeController.addresstype.value.isNotEmpty
                                    ? homeController.addresstype.value
                                    : "Delivery To",
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(width: 2),
                              const Icon(
                                Icons.keyboard_arrow_down_rounded,
                                size: 18,
                                color: Colors.white,
                              ),
                            ],
                          ),
                          Text(
                            homeController.selectedLocation.value.isNotEmpty
                                ? homeController.selectedLocation.value
                                : "Select Location",
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w400,
                              color: Colors.white.withOpacity(0.88),
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
              onSelected: (String v) {
                cartController.getCart(
                  context: context,
                  longitude: homeController.longitude,
                  latitude: homeController.latitude,
                );
                homeController.updateLocationDropdown(v);
              },
            );
          }),
        ),

        const SizedBox(width: 8),

        // Wallet Balance Indicator
        InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () async {
            final token = await CommonServices.getToken();
            if (token.isEmpty) {
              Fluttertoast.showToast(msg: "Please Login to view wallet!");
              Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
            } else {
              Navigator.push(context, MaterialPageRoute(builder: (_) => WalletScreen()));
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.24),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.25), width: 1),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFFB300),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.currency_rupee_rounded,
                    size: 10,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(width: 4),
                Obx(() => Text(
                      '₹${walletController.walletAmount.value.toInt()}',
                      style: GoogleFonts.poppins(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    )),
              ],
            ),
          ),
        ),

        const SizedBox(width: 8),

        // Profile Shortcut Avatar
        InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () async {
            final token = await CommonServices.getToken();
            if (token.isEmpty) {
              Fluttertoast.showToast(msg: "Please Login to view profile!");
              Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
            } else {
              Navigator.push(context, MaterialPageRoute(builder: (_) => Profile()));
            }
          },
          child: Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.24),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withOpacity(0.35), width: 1),
            ),
            child: const Icon(
              Icons.person_outline_rounded,
              color: Colors.white,
              size: 19,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
              onTap: () async {
                final token = await CommonServices.getToken();
                if (token.isEmpty) {
                  Fluttertoast.showToast(msg: "Please Login to search products!\nThanks.");
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
                } else {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => SearchScreen(isFromHomeScreen: true)),
                  );
                }
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                child: Row(
                  children: [
                    const Icon(
                      Icons.search_rounded,
                      color: Color(0xFF2E7D32),
                      size: 21,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "Search ",
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                    Expanded(
                      child: AnimatedTextKit(
                        repeatForever: true,
                        animatedTexts: [
                          TyperAnimatedText('"fresh milk"',
                              textStyle: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF111827),
                              )),
                          TyperAnimatedText('"daily vegetables"',
                              textStyle: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF111827),
                              )),
                          TyperAnimatedText('"chocolates & sweets"',
                              textStyle: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF111827),
                              )),
                          TyperAnimatedText('"atta, rice & oil"',
                              textStyle: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF111827),
                              )),
                          TyperAnimatedText('"chips & cool drinks"',
                              textStyle: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF111827),
                              )),
                        ],
                        isRepeatingAnimation: true,
                        pause: const Duration(milliseconds: 1600),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Camera Photo-Order Action
          InkWell(
            borderRadius: const BorderRadius.horizontal(right: Radius.circular(14)),
            onTap: () => Get.to(() => const PhotoOrderUploadScreen()),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              decoration: const BoxDecoration(
                border: Border(
                  left: BorderSide(color: Color(0xFFF3F4F6), width: 1),
                ),
              ),
              child: const Icon(
                Icons.camera_alt_rounded,
                color: Color(0xFF2E7D32),
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStoreStatusWidget() {
    return Obx(() {
      final status = timingController.timingResponse.value.status;
      final message = timingController.timingResponse.value.message;

      if (status != 0) return const SizedBox.shrink();

      String title = "We'll Be Back Shortly!";
      String imagePath = "Assets/Images/Homepage/unservice.png";

      if (message == "We're closed now") {
        title = "We are closed now";
        imagePath = "Assets/Images/Homepage/closed.png";
      }

      return Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 4),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: Appprimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "You can still add items and order when the store re-opens",
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: const Color(0xFF014605),
                      ),
                    ),
                  ],
                ),
              ),
              Image.asset(imagePath, height: 46, width: 60),
            ],
          ),
        ),
      );
    });
  }

  Widget _buildCategoryShortcuts(BuildContext context) {
    return Obx(() {
      if (homeController.categories.isEmpty) {
        return const SizedBox.shrink();
      }

      return Container(
        height: 84,
        padding: const EdgeInsets.only(top: 6),
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: homeController.categories.length + 1,
          itemBuilder: (ctx, index) {
            // First item: "All Categories"
            if (index == 0) {
              return GestureDetector(
                onTap: () async {
                  final token = await CommonServices.getToken();
                  if (token.isEmpty) {
                    Fluttertoast.showToast(msg: "Please Login to check out categories!\nThanks.");
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
                child: Container(
                  margin: const EdgeInsets.only(right: 10),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.grid_view_rounded,
                            color: Color(0xFF2E7D32),
                            size: 22,
                          ),
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        "All",
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            final cat = homeController.categories[index - 1];
            final gradientColors = glossyGradients[(index - 1) % glossyGradients.length];

            return GestureDetector(
              onTap: () async {
                final token = await CommonServices.getToken();
                if (token.isEmpty) {
                  Fluttertoast.showToast(msg: "Please Login to browse this category!\nThanks.");
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
                } else {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => SingleCategory(
                        categories: cat,
                        isFromHomeScreen: true,
                      ),
                    ),
                  );
                }
              },
              child: Container(
                margin: const EdgeInsets.only(right: 10),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: gradientColors,
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Center(
                        child: ClipOval(
                          child: CustomNetworkImage(
                            url: cat.imageUrl ?? '',
                            height: 32,
                            width: 32,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 5),
                    SizedBox(
                      width: 60,
                      child: Text(
                        cat.categoryName ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      );
    });
  }
}
