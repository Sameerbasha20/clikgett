import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewScreens/Deals/UnlockDealsScreen.dart';
import 'package:fav_app/new/Services/unlock_deals_service.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

const _deep = Color(0xFF14532D);
const _fresh = Color(0xFF16A34A);
const _gold = Color(0xFFFACC15);

String _rs(double v) => '₹${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

/// Home banner for unlock deals: what's on offer, how close the cart is, one tap to the deals.
/// Hidden when there are no deals in stock.
class UnlockDealsBanner extends StatefulWidget {
  /// compact: a slim strip for the home screen; tapping it opens the deals page.
  final bool compact;
  const UnlockDealsBanner({super.key, this.compact = false});

  @override
  State<UnlockDealsBanner> createState() => _UnlockDealsBannerState();
}

class _UnlockDealsBannerState extends State<UnlockDealsBanner> {
  UnlockDealsPage? _page;
  Worker? _cartWatch;

  @override
  void initState() {
    super.initState();
    _load();
    if (Get.isRegistered<CartController>()) {
      _cartWatch = ever(Get.find<CartController>().cartItems, (_) => _load());
    }
  }

  @override
  void dispose() {
    _cartWatch?.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final page = await UnlockDealsService.load();
    if (mounted && page != null) setState(() => _page = page);
  }

  @override
  Widget build(BuildContext context) {
    final page = _page;
    final deals = page?.available ?? const <UnlockDeal>[];
    if (page == null || deals.isEmpty) return const SizedBox.shrink();

    final cheapest = deals.map((d) => d.unlockPrice).reduce((a, b) => a < b ? a : b);
    final title = cheapest <= 0 ? 'FREE items unlocked for you' : 'Items from ${_rs(cheapest)}';
    final String status;
    if (!page.loggedIn) {
      status = 'Shop for ${_rs(page.threshold)} to unlock';
    } else if (page.unlocked) {
      status = '🎉 Unlocked! Add them to your cart';
    } else {
      status = 'Add ${_rs(page.amountNeeded)} more to unlock';
    }

    if (widget.compact) return _compact(page, deals, cheapest, title, status);
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () async {
            await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const UnlockDealsScreen()));
            _load();
          },
          child: Ink(
            decoration: BoxDecoration(
              gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [_deep, _fresh]),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: _fresh.withOpacity(0.35), blurRadius: 14, offset: const Offset(0, 6))],
            ),
            child: Stack(children: [
              Positioned(right: -14, bottom: -18, child: Icon(Icons.lock_open_rounded, size: 110, color: Colors.white.withOpacity(0.06))),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: _gold, borderRadius: BorderRadius.circular(20)),
                      child: Text('🔓 UNLOCK DEALS',
                          style: GoogleFonts.poppins(fontSize: 10.5, fontWeight: FontWeight.w800, color: _deep, letterSpacing: 0.4)),
                    ),
                    const Spacer(),
                    Text('${deals.length} deal${deals.length == 1 ? '' : 's'}',
                        style: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w600, color: white.withOpacity(0.85))),
                  ]),
                  const SizedBox(height: 8),
                  Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(cheapest <= 0 && !page.unlocked ? 'Get items for FREE' : title,
                            style: GoogleFonts.poppins(fontSize: 19, fontWeight: FontWeight.w800, color: white, height: 1.15)),
                        const SizedBox(height: 2),
                        Text(status, style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600, color: _gold)),
                      ]),
                    ),
                    const SizedBox(width: 8),
                    _thumbs(deals),
                  ]),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: page.loggedIn ? page.progress : 0,
                          minHeight: 7,
                          backgroundColor: Colors.white.withOpacity(0.22),
                          color: _gold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: white, borderRadius: BorderRadius.circular(20)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Text('View deals', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: _deep)),
                        const Icon(Icons.chevron_right_rounded, size: 18, color: _deep),
                      ]),
                    ),
                  ]),
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Future<void> _open() async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const UnlockDealsScreen()));
    _load();
  }

  /// Home strip: lock icon, "Items from ₹1", how close the cart is, a thin progress bar.
  Widget _compact(UnlockDealsPage page, List<UnlockDeal> deals, double cheapest, String title, String status) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: _open,
          child: Ink(
            height: 48,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              gradient: const LinearGradient(colors: [_deep, _fresh]),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Row(children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: const BoxDecoration(color: _gold, shape: BoxShape.circle),
                  child: Icon(page.unlocked ? Icons.lock_open_rounded : Icons.lock_rounded, size: 16, color: _deep),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text.rich(
                      TextSpan(children: [
                        TextSpan(
                            text: cheapest <= 0 && !page.unlocked ? 'Get items for FREE' : title,
                            style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w800, color: white)),
                        TextSpan(
                            text: '  ·  $status',
                            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: _gold)),
                      ]),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 5),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: page.loggedIn ? page.progress : 0,
                        minHeight: 4,
                        backgroundColor: Colors.white.withOpacity(0.22),
                        color: _gold,
                      ),
                    ),
                  ]),
                ),
                const SizedBox(width: 8),
                Text('${deals.length}', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: white)),
                Icon(Icons.chevron_right_rounded, color: white.withOpacity(0.85), size: 22),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  /// Up to three deal images, overlapping.
  Widget _thumbs(List<UnlockDeal> deals) {
    final shown = deals.where((d) => d.imageUrl.isNotEmpty).take(3).toList();
    if (shown.isEmpty) return const SizedBox.shrink();
    const size = 52.0, step = 34.0;
    return SizedBox(
      width: size + step * (shown.length - 1),
      height: size,
      child: Stack(children: [
        for (var i = 0; i < shown.length; i++)
          Positioned(
            left: step * i,
            child: Container(
              width: size,
              height: size,
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: white,
                shape: BoxShape.circle,
                border: Border.all(color: _gold, width: 2),
              ),
              child: ClipOval(child: CustomNetworkImage(url: shown[i].imageUrl, fit: BoxFit.contain)),
            ),
          ),
      ]),
    );
  }
}
