import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:fav_app/new/NewScreens/Address/ManageAddress.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/CouponAndOffers/wallet.dart';
import 'package:fav_app/new/NewScreens/Homepage/SearchScreen.dart';
import 'package:fav_app/new/NewScreens/PhotoOrders/PhotoOrderUploadScreen.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

Future<bool> _requireLogin(BuildContext context, String reason) async {
  final token = await CommonServices.getToken();
  if (token.isNotEmpty) return true;
  if (!context.mounted) return false;
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please login to $reason')));
  Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
  return false;
}

/// Green brand header: delivery time for the selected address, the address
/// picker, wallet and profile shortcuts.
class StorefrontHeader extends StatelessWidget {
  final bool isLoggedIn;

  const StorefrontHeader({Key? key, required this.isLoggedIn}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final home = Get.find<HomeController>();
    final wallet = Get.find<WalletController>();

    return Container(
      color: primary,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 12, 12),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => _openAddressPicker(context),
                  child: Obx(() {
                    final eta = home.etaMinutes.value;
                    final serviceable = home.locationServiceable.value;
                    final headline = !serviceable
                        ? 'Not delivering here yet'
                        : (eta != null ? 'Delivery in $eta minutes' : 'Fast delivery');
                    final label = home.addresstype.value.trim();
                    final address = home.selectedLocation.value.trim();
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(headline,
                            style: GoogleFonts.poppins(
                                fontSize: 19, height: 1.1, fontWeight: FontWeight.w800, color: white)),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            Flexible(
                              child: Text.rich(
                                TextSpan(children: [
                                  if (label.isNotEmpty && label != '...')
                                    TextSpan(text: '${label.toUpperCase()} - ', style: const TextStyle(fontWeight: FontWeight.w700)),
                                  TextSpan(text: address.isNotEmpty && address != '...' ? address : 'Select delivery location'),
                                ]),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(fontSize: 12, color: white.withOpacity(0.92)),
                              ),
                            ),
                            const Icon(Icons.keyboard_arrow_down_rounded, color: white, size: 18),
                          ],
                        ),
                      ],
                    );
                  }),
                ),
              ),
              if (isLoggedIn) ...[
                const SizedBox(width: 8),
                _HeaderChip(
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => WalletScreen())),
                  child: Obx(() => Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.account_balance_wallet_outlined, size: 15, color: white),
                          const SizedBox(width: 4),
                          Text('₹${wallet.walletAmount.value.toStringAsFixed(0)}',
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: white)),
                        ],
                      )),
                ),
              ],
              // Profile is in the bottom navigation bar.
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openAddressPicker(BuildContext context) async {
    if (!await _requireLogin(context, 'choose a delivery address')) return;
    if (!context.mounted) return;
    await showDeliveryAddressPicker(context);
  }
}

/// Bottom sheet listing saved addresses. Picking one updates the header,
/// the cart and checkout together.
Future<void> showDeliveryAddressPicker(BuildContext context) async {
    final addressController = Get.find<AdressController>();
    final home = Get.find<HomeController>();
    final cart = Get.find<CartController>();
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.7),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text('Select delivery address',
                    style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: tColor)),
              ),
              Flexible(
                child: Obx(() {
                  final list = addressController.address;
                  if (list.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Text('You have no saved addresses yet.',
                          style: GoogleFonts.poppins(fontSize: 13, color: tColor3)),
                    );
                  }
                  return ListView.separated(
                    shrinkWrap: true,
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, indent: 56),
                    itemBuilder: (_, i) {
                      final a = list[i];
                      final selected = home.latitude.value == a.latitude && home.longitude.value == a.longitude;
                      return ListTile(
                        leading: Icon(
                          a.type.toLowerCase().contains('work') ? Icons.work_outline_rounded : Icons.home_outlined,
                          color: selected ? primary : grey70,
                        ),
                        title: Text(a.type.replaceAll(',', ' ').trim(),
                            style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: tColor)),
                        subtitle: Text(a.address,
                            maxLines: 2, overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
                        trailing: selected ? const Icon(Icons.check_circle_rounded, color: primary) : null,
                        onTap: () async {
                          Navigator.pop(ctx);
                          // Keep the header and checkout on the same address.
                          await addressController.storeSelectedAdress(a.addressId, a.longitude, a.latitude);
                          await home.storeLocation(a, list);
                          home.updateLocationDropdown(a.type.replaceAll(',', ''));
                          if (context.mounted) {
                            cart.getCart(context: context, longitude: home.longitude, latitude: home.latitude);
                          }
                        },
                      );
                    },
                  );
                }),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.add_location_alt_outlined, color: primary),
                title: Text('Add or manage addresses',
                    style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: primaryDark)),
                onTap: () {
                  Navigator.pop(ctx);
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => ManageAddress()));
                },
              ),
            ],
          ),
        ),
      ),
    );
}

class _HeaderChip extends StatelessWidget {
  final Widget child;
  final VoidCallback onTap;
  final bool circular;

  const _HeaderChip({required this.child, required this.onTap, this.circular = false});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        height: 34,
        width: circular ? 34 : null,
        padding: circular ? EdgeInsets.zero : const EdgeInsets.symmetric(horizontal: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.16),
          borderRadius: BorderRadius.circular(20),
        ),
        child: child,
      ),
    );
  }
}

/// Search bar that stays pinned at the top while the home page scrolls.
class StickySearchBarDelegate extends SliverPersistentHeaderDelegate {
  final List<String> hints;

  StickySearchBarDelegate({required this.hints});

  static const double _height = 64;

  @override
  double get minExtent => _height;
  @override
  double get maxExtent => _height;

  @override
  bool shouldRebuild(covariant StickySearchBarDelegate oldDelegate) => oldDelegate.hints.join() != hints.join();

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final shownHints = hints.isEmpty ? ['groceries'] : hints;
    return Container(
      color: overlapsContent || shrinkOffset > 0 ? white : primary,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
      child: Material(
        color: white,
        elevation: overlapsContent || shrinkOffset > 0 ? 0 : 2,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: cardBorder),
          ),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const SearchScreen(isFromHomeScreen: true)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Row(
                      children: [
                        const Icon(Icons.search_rounded, color: tColor3, size: 22),
                        const SizedBox(width: 8),
                        Text('Search ', style: GoogleFonts.poppins(fontSize: 13.5, color: grey70)),
                        Expanded(
                          // IgnorePointer: the animation has its own tap handler, which swallowed
                          // taps on the search bar while the hint was moving.
                          child: IgnorePointer(
                            child: AnimatedTextKit(
                              key: ValueKey(shownHints.join('|')),
                              repeatForever: true,
                              pause: const Duration(milliseconds: 1400),
                              animatedTexts: shownHints
                                  .map((h) => RotateAnimatedText('"$h"',
                                      // Hints sit right after "Search", not centred in the bar.
                                      alignment: Alignment.centerLeft,
                                      textStyle: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w600, color: tColor4)))
                                  .toList(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              // Camera: snap a shopping list (or a product) and the store packs it.
              Container(width: 1, height: 26, color: cardBorder),
              InkWell(
                borderRadius: const BorderRadius.horizontal(right: Radius.circular(12)),
                onTap: () async {
                  if (!await _requireLogin(context, 'order with a photo')) return;
                  if (!context.mounted) return;
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PhotoOrderUploadScreen()));
                },
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 6, 14, 6),
                  child: Stack(clipBehavior: Clip.none, children: [
                    const Icon(Icons.photo_camera_outlined, color: primaryDark, size: 24),
                    Positioned(
                      right: -12,
                      top: -9,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(color: red, borderRadius: BorderRadius.circular(6)),
                        child: Text('NEW', style: GoogleFonts.poppins(fontSize: 7.5, fontWeight: FontWeight.w800, color: white)),
                      ),
                    ),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
