import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/Cart.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/new/Services/unlock_deals_service.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

// ClikGett greens: deep leaf header, fresh green tabs, lime highlights.
const _deep = Color(0xFF14532D);
const _violet = Color(0xFF15803D); // tab strip
const _accent = Color(0xFF16A34A);
const _tabIdle = Color(0xFF22C55E);
const _lime = Color(0xFFDCFCE7);

String _rs(double v) => '₹${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

/// "Unlock deals": products at a special price once the cart reaches a set value.
/// Tabs by deal price (₹9 / ₹29 / ₹49 items...), each card shows how close the cart is.
class UnlockDealsScreen extends StatefulWidget {
  const UnlockDealsScreen({super.key});

  @override
  State<UnlockDealsScreen> createState() => _UnlockDealsScreenState();
}

class _UnlockDealsScreenState extends State<UnlockDealsScreen> {
  final CartController cart = Get.find<CartController>();
  UnlockDealsPage? _page;
  bool _loading = true;
  double? _tier;
  final Set<int> _busy = {};
  Worker? _cartWatch;

  @override
  void initState() {
    super.initState();
    _load();
    // Adding anything to the cart (here or elsewhere) changes what is unlocked.
    _cartWatch = ever(cart.cartItems, (_) => _load());
  }

  @override
  void dispose() {
    _cartWatch?.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final page = await UnlockDealsService.load();
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (page == null) return;
      _page = page;
      final tiers = _tiers;
      if (_tier == null || !tiers.contains(_tier)) _tier = tiers.isEmpty ? null : tiers.first;
    });
  }

  List<double> get _tiers {
    final set = <double>{for (final d in _page?.deals ?? <UnlockDeal>[]) d.unlockPrice};
    return set.toList()..sort();
  }

  String _tierLabel(double price) => price <= 0 ? 'FREE' : _rs(price);

  Future<void> _setQty(UnlockDeal d, int qty) async {
    final token = await CommonServices.getToken();
    if (!mounted) return;
    if (token.isEmpty) {
      customToast(message: 'Please login to add items');
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
      return;
    }
    if (qty > d.maxQty && d.maxQty > 0) {
      customToast(message: 'Only ${d.maxQty} available');
      return;
    }
    setState(() => _busy.add(d.unlockId));
    await cart.updateQuantity(
      productId: d.productId,
      variantId: d.variantId,
      quantity: qty,
      removeToast: true,
      isScreenFromHome: true,
      categoryId: d.categoryId,
      subCategoryId: d.subCategoryId,
      context: context,
    );
    if (!mounted) return;
    setState(() => _busy.remove(d.unlockId));
    _load();
  }

  int _qtyInCart(UnlockDeal d) {
    final item = cart.cartItems.firstWhereOrNull((c) => c.productId == d.productId && c.variantId == d.variantId);
    return item?.quantity ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final deals = (_page?.deals ?? <UnlockDeal>[]).where((d) => d.unlockPrice == _tier).toList();
    return Scaffold(
      backgroundColor: white,
      body: Column(children: [
        _header(context),
        if (_tiers.length > 1) _tabs(),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: _accent))
              : (_page == null || _page!.deals.isEmpty)
                  ? _empty()
                  : RefreshIndicator(
                      color: _accent,
                      onRefresh: _load,
                      child: LayoutBuilder(builder: (context, box) {
                        // Each cell is the square image plus the fixed text block below it,
                        // so cards sit tight with no stretched gaps.
                        const side = 12.0, gap = 10.0;
                        final cellWidth = (box.maxWidth - side * 2 - gap * 2) / 3;
                        final textScale = MediaQuery.textScalerOf(context).scale(1);
                        return GridView.builder(
                          padding: const EdgeInsets.fromLTRB(side, 14, side, 24),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            mainAxisSpacing: 16,
                            crossAxisSpacing: gap,
                            mainAxisExtent: cellWidth + _textBlockHeight * textScale + 4,
                          ),
                          itemCount: deals.length,
                          itemBuilder: (_, i) => _card(deals[i]),
                        );
                      }),
                    ),
        ),
      ]),
      bottomNavigationBar: _bottomBar(),
    );
  }

  Widget _header(BuildContext context) {
    final cheapest = _tiers.isEmpty ? null : _tiers.first;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(8, MediaQuery.of(context).padding.top + 4, 16, 18),
      decoration: const BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [_deep, _violet]),
      ),
      child: Column(children: [
        Align(
          alignment: Alignment.centerLeft,
          child: IconButton(
            icon: const Icon(Icons.arrow_back_rounded, color: white),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        const Text('🥬 🍅 🥕', style: TextStyle(fontSize: 22)),
        const SizedBox(height: 2),
        Text(cheapest == null ? 'Unlock deals' : 'Items from ${_tierLabel(cheapest)}!',
            style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: white)),
        const SizedBox(height: 4),
        Text('Unlock special prices as your cart grows',
            style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w500, color: white.withOpacity(0.9))),
      ]),
    );
  }

  Widget _tabs() => Container(
        color: _violet,
        height: 56,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.only(left: 8),
          children: [
            for (final t in _tiers)
              GestureDetector(
                onTap: () => setState(() => _tier = t),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.only(right: 6, top: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: t == _tier ? white : _tabIdle,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  ),
                  child: Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: t == _tier ? _accent : white, borderRadius: BorderRadius.circular(6)),
                      child: Text(_tierLabel(t),
                          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w800, color: t == _tier ? white : _accent)),
                    ),
                    const SizedBox(width: 6),
                    Text('Items',
                        style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: t == _tier ? tColor : white)),
                  ]),
                ),
              ),
          ],
        ),
      );

  /// Height of everything under the image in [_card] at normal text size.
  static const double _textBlockHeight = 160;

  Widget _card(UnlockDeal d) {
    final qty = _qtyInCart(d);
    final busy = _busy.contains(d.unlockId);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      AspectRatio(
        aspectRatio: 1,
        child: Stack(children: [
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(color: bg1, borderRadius: BorderRadius.circular(12)),
              clipBehavior: Clip.antiAlias,
              padding: const EdgeInsets.all(8),
              child: Opacity(
                opacity: d.inStock ? 1 : 0.4,
                child: d.imageUrl.isNotEmpty
                    ? CustomNetworkImage(url: d.imageUrl, fit: BoxFit.contain)
                    : const Icon(Icons.image_outlined, color: grey70),
              ),
            ),
          ),
          Positioned(top: 4, right: 4, child: _addButton(d, qty, busy)),
        ]),
      ),
      const SizedBox(height: 6),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 3),
        decoration: BoxDecoration(color: bg1, borderRadius: BorderRadius.circular(6)),
        child:
            Text(d.unit.isEmpty ? '1 unit' : d.unit, textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 11, color: tColor3)),
      ),
      const SizedBox(height: 6),
      // Two lines are always reserved for the name, so every card lines up.
      SizedBox(
        height: 32 * MediaQuery.textScalerOf(context).scale(1),
        child: Text(d.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600, color: tColor4, height: 1.25)),
      ),
      const SizedBox(height: 8),
      ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(
          value: d.progress,
          minHeight: 5,
          backgroundColor: _lime,
          color: _accent,
        ),
      ),
      const SizedBox(height: 5),
      Text('Limit ${d.dealLimit} per order', style: GoogleFonts.poppins(fontSize: 10, color: grey70)),
      if (!d.inStock)
        Text('Out of stock', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: red))
      else if (d.unlocked)
        Text('🎉 Offer Unlocked!\nClaim your deal',
            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: _accent, height: 1.3))
      else
        Text('Add ${_rs(d.amountNeeded)} more\nto unlock',
            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: tColor3, height: 1.3)),
      const SizedBox(height: 4),
      Row(children: [
        Text(d.unlockPrice <= 0 ? 'FREE' : _rs(d.unlockPrice),
            style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w800, color: tColor)),
        const SizedBox(width: 4),
        if (d.wasPrice > d.unlockPrice)
          Text(_rs(d.wasPrice), style: GoogleFonts.poppins(fontSize: 11.5, color: grey70, decoration: TextDecoration.lineThrough)),
      ]),
    ]);
  }

  Widget _addButton(UnlockDeal d, int qty, bool busy) {
    if (!d.inStock) return const SizedBox.shrink();
    final box = BoxDecoration(
      color: white,
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: const Color(0xFFBBF7D0)),
      boxShadow: softCardShadow,
    );
    if (busy) {
      return Container(
        width: 38,
        height: 38,
        decoration: box,
        padding: const EdgeInsets.all(10),
        child: const CircularProgressIndicator(strokeWidth: 2, color: _accent),
      );
    }
    if (qty <= 0) {
      return InkWell(
        onTap: () => _setQty(d, 1),
        child: Container(width: 38, height: 38, decoration: box, child: const Icon(Icons.add_rounded, color: _accent, size: 26)),
      );
    }
    return Container(
      height: 34,
      decoration: BoxDecoration(color: _accent, borderRadius: BorderRadius.circular(10)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        InkWell(
            onTap: () => _setQty(d, qty - 1),
            child: const Padding(padding: EdgeInsets.all(6), child: Icon(Icons.remove_rounded, color: white, size: 16))),
        Text('$qty', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: white)),
        InkWell(
            onTap: () => _setQty(d, qty + 1),
            child: const Padding(padding: EdgeInsets.all(6), child: Icon(Icons.add_rounded, color: white, size: 16))),
      ]),
    );
  }

  Widget _empty() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.lock_open_rounded, size: 56, color: grey70),
            const SizedBox(height: 10),
            Text('No unlock deals right now', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: tColor)),
            Text('Check back soon for special prices.', style: GoogleFonts.poppins(fontSize: 13, color: tColor3)),
          ]),
        ),
      );

  Widget? _bottomBar() {
    final page = _page;
    if (page == null || page.deals.isEmpty) return null;
    return Obx(() {
      final items = cart.totalCartItemCount + cart.printJobs.length;
      final next = page.nextAmountNeeded;
      final message = !page.loggedIn
          ? 'Login to unlock special prices'
          : next == null
              ? 'All deals unlocked! 🎉'
              : 'Add ${_rs(next)} more to unlock ${page.nextUnlockPrice != null ? '${_tierLabel(page.nextUnlockPrice!)} deals' : 'more deals'}';
      return SafeArea(
        top: false,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            margin: const EdgeInsets.fromLTRB(12, 6, 12, 10),
            padding: const EdgeInsets.fromLTRB(16, 12, 10, 12),
            constraints: const BoxConstraints(minHeight: 56),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [_deep, _accent]),
              borderRadius: BorderRadius.circular(16),
              boxShadow: softElevatedShadow,
            ),
            child: Row(children: [
              Expanded(
                child: Text(message, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: white)),
              ),
              if (items > 0)
                InkWell(
                  onTap: () async {
                    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const Cart(isFromHomeScreen: false)));
                    _load();
                  },
                  child: Row(children: [
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text('CART', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w800, color: white)),
                      Text('$items ITEM${items == 1 ? '' : 'S'}',
                          style: GoogleFonts.poppins(fontSize: 10.5, color: white.withOpacity(0.85))),
                    ]),
                    const Icon(Icons.chevron_right_rounded, color: white),
                  ]),
                ),
            ]),
          ),
        ]),
      );
    });
  }
}
