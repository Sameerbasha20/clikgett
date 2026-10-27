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

// ClikGett greens.
const _deep = Color(0xFF14532D);
const _fresh = Color(0xFF16A34A);
const _mint = Color(0xFFDCFCE7);
const _gold = Color(0xFFFACC15);

String _rs(double v) => '₹${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';
String _dealLabel(double price) => price <= 0 ? 'FREE' : _rs(price);

/// "Unlock deals": products the admin picked at a special price (FREE, ₹1, ₹9...).
/// They all open together once the rest of the cart reaches one value set by the admin.
class UnlockDealsScreen extends StatefulWidget {
  const UnlockDealsScreen({super.key});

  @override
  State<UnlockDealsScreen> createState() => _UnlockDealsScreenState();
}

class _UnlockDealsScreenState extends State<UnlockDealsScreen> {
  final CartController cart = Get.find<CartController>();
  UnlockDealsPage? _page;
  bool _loading = true;
  double? _filter; // null = all prices
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
      if (page != null) _page = page;
      if (_filter != null && !_prices.contains(_filter)) _filter = null;
    });
  }

  List<double> get _prices {
    final set = <double>{for (final d in _page?.deals ?? <UnlockDeal>[]) d.unlockPrice};
    return set.toList()..sort();
  }

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
    if (qty > d.dealLimit) customToast(message: 'Deal price is for ${d.dealLimit} per order; extra ones are at the normal price');
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
    final page = _page;
    final deals = (page?.deals ?? <UnlockDeal>[]).where((d) => _filter == null || d.unlockPrice == _filter).toList()
      ..sort((a, b) => (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0));
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7F5),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: _fresh))
          : RefreshIndicator(
              color: _fresh,
              onRefresh: _load,
              child: CustomScrollView(slivers: [
                SliverToBoxAdapter(child: _header(page)),
                if (page == null || page.deals.isEmpty)
                  SliverFillRemaining(hasScrollBody: false, child: _empty())
                else ...[
                  if (_prices.length > 1) SliverToBoxAdapter(child: _filters()),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(12, 6, 12, 24),
                    sliver: SliverGrid(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        mainAxisExtent: 268 * MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.3),
                      ),
                      delegate: SliverChildBuilderDelegate((_, i) => _card(deals[i], page), childCount: deals.length),
                    ),
                  ),
                ],
              ]),
            ),
      bottomNavigationBar: _bottomBar(),
    );
  }

  // ---------------------------------------------------------------- header

  Widget _header(UnlockDealsPage? page) {
    final top = MediaQuery.of(context).padding.top;
    final cheapest = _prices.isEmpty ? null : _prices.first;
    return Container(
      padding: EdgeInsets.fromLTRB(6, top + 4, 16, 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [_deep, _fresh]),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Stack(children: [
        Positioned(right: -10, top: 0, child: Icon(Icons.lock_open_rounded, size: 120, color: Colors.white.withOpacity(0.07))),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: white, size: 20),
            onPressed: () => Navigator.of(context).pop(),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(color: _gold, borderRadius: BorderRadius.circular(20)),
                child: Text('🔓 UNLOCK DEALS',
                    style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w800, color: _deep, letterSpacing: 0.5)),
              ),
              const SizedBox(height: 8),
              Text(cheapest == null ? 'Special prices' : 'Items from ${_dealLabel(cheapest)}!',
                  style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.w800, color: white, height: 1.15)),
              const SizedBox(height: 2),
              Text(
                page == null || page.threshold <= 0
                    ? 'Grow your cart to unlock'
                    : 'All deals open when your cart reaches ${_rs(page.threshold)}',
                style: GoogleFonts.poppins(fontSize: 13.5, color: white.withOpacity(0.88)),
              ),
              if (page != null && page.deals.isNotEmpty) ...[
                const SizedBox(height: 16),
                _progressPanel(page),
              ],
            ]),
          ),
        ]),
      ]),
    );
  }

  Widget _progressPanel(UnlockDealsPage page) {
    final String title;
    final String sub;
    if (!page.loggedIn) {
      title = 'Login to unlock';
      sub = 'Add ${_rs(page.threshold)} of items to your cart';
    } else if (page.unlocked) {
      title = '🎉 Deals unlocked!';
      sub = 'Add your deals below before checkout';
    } else {
      title = 'Add ${_rs(page.amountNeeded)} more';
      sub = 'Cart ${_rs(page.cartValue)} of ${_rs(page.threshold)} · deal items don\'t count';
    }
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.14),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(0.25)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(page.unlocked ? Icons.lock_open_rounded : Icons.lock_rounded, color: _gold, size: 22),
          const SizedBox(width: 8),
          Expanded(child: Text(title, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w800, color: white))),
        ]),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: page.loggedIn ? page.progress : 0,
            minHeight: 9,
            backgroundColor: Colors.white.withOpacity(0.22),
            color: _gold,
          ),
        ),
        const SizedBox(height: 6),
        Text(sub, style: GoogleFonts.poppins(fontSize: 12, color: white.withOpacity(0.85))),
      ]),
    );
  }

  Widget _filters() {
    Widget chip(String label, double? value) {
      final on = _filter == value;
      return Padding(
        padding: const EdgeInsets.only(right: 8),
        child: ChoiceChip(
          label: Text(label),
          selected: on,
          onSelected: (_) => setState(() => _filter = value),
          showCheckmark: false,
          labelStyle: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: on ? white : _deep),
          selectedColor: _fresh,
          backgroundColor: white,
          side: BorderSide(color: on ? _fresh : const Color(0xFFBBF7D0)),
          shape: const StadiumBorder(),
        ),
      );
    }

    return SizedBox(
      height: 54,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
        children: [
          chip('All deals', null),
          for (final p in _prices) chip(p <= 0 ? 'FREE' : '${_rs(p)} items', p),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------- cards

  Widget _card(UnlockDeal d, UnlockDealsPage page) {
    final qty = _qtyInCart(d);
    final open = d.unlocked || page.unlocked;
    return Container(
      decoration: BoxDecoration(
        color: white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: open ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: Stack(children: [
            Positioned.fill(
              child: Container(
                color: const Color(0xFFF7FAF8),
                padding: const EdgeInsets.all(14),
                child: Opacity(
                  opacity: d.inStock ? (open ? 1 : 0.55) : 0.35,
                  child: d.imageUrl.isNotEmpty
                      ? CustomNetworkImage(url: d.imageUrl, fit: BoxFit.contain)
                      : const Icon(Icons.image_outlined, color: grey70, size: 40),
                ),
              ),
            ),
            // Deal price ribbon.
            Positioned(
              left: 0,
              top: 10,
              child: Container(
                padding: const EdgeInsets.fromLTRB(10, 4, 12, 4),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [_deep, _fresh]),
                  borderRadius: BorderRadius.horizontal(right: Radius.circular(20)),
                ),
                child: Text(_dealLabel(d.unlockPrice),
                    style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w800, color: white, height: 1.1)),
              ),
            ),
            if (!open && d.inStock)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: _deep.withOpacity(0.85), shape: BoxShape.circle),
                  child: const Icon(Icons.lock_rounded, color: white, size: 16),
                ),
              ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(
              height: 34 * MediaQuery.textScalerOf(context).scale(1),
              child: Text(d.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600, color: tColor, height: 1.3)),
            ),
            const SizedBox(height: 2),
            Row(children: [
              if (d.unit.isNotEmpty)
                Flexible(
                  child: Text(d.unit,
                      maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontSize: 11, color: tColor3)),
                ),
              if (d.wasPrice > d.unlockPrice) ...[
                const SizedBox(width: 6),
                Text(_rs(d.wasPrice),
                    style: GoogleFonts.poppins(fontSize: 11, color: grey70, decoration: TextDecoration.lineThrough)),
              ],
            ]),
            const SizedBox(height: 8),
            SizedBox(height: 36, width: double.infinity, child: _button(d, qty, open)),
            const SizedBox(height: 4),
            Text('Limit ${d.dealLimit} per order',
                textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 10, color: grey70)),
          ]),
        ),
      ]),
    );
  }

  Widget _button(UnlockDeal d, int qty, bool open) {
    if (!d.inStock) {
      return Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
        child: Text('Out of stock', style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600, color: grey70)),
      );
    }
    if (!open) {
      return Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(color: _mint, borderRadius: BorderRadius.circular(10)),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.lock_rounded, size: 14, color: _deep),
          const SizedBox(width: 4),
          Text('Add ${_rs(d.amountNeeded)} more',
              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: _deep)),
        ]),
      );
    }
    if (_busy.contains(d.unlockId)) {
      return Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(color: _fresh, borderRadius: BorderRadius.circular(10)),
        child: const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: white)),
      );
    }
    if (qty <= 0) {
      return ElevatedButton(
        onPressed: () => _setQty(d, 1),
        style: ElevatedButton.styleFrom(
          backgroundColor: _fresh,
          elevation: 0,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        child: Text('ADD', style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w800, color: white)),
      );
    }
    return Container(
      decoration: BoxDecoration(color: _fresh, borderRadius: BorderRadius.circular(10)),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        IconButton(
          visualDensity: VisualDensity.compact,
          onPressed: () => _setQty(d, qty - 1),
          icon: const Icon(Icons.remove_rounded, color: white, size: 18),
        ),
        Text('$qty', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w800, color: white)),
        IconButton(
          visualDensity: VisualDensity.compact,
          onPressed: () => _setQty(d, qty + 1),
          icon: const Icon(Icons.add_rounded, color: white, size: 18),
        ),
      ]),
    );
  }

  Widget _empty() => Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 110,
            height: 110,
            decoration: const BoxDecoration(color: _mint, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: const Text('🎁', style: TextStyle(fontSize: 50)),
          ),
          const SizedBox(height: 16),
          Text('No deals right now', style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700, color: tColor)),
          const SizedBox(height: 4),
          Text('New FREE and ₹1 deals are added often. Check back soon!',
              textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13, color: tColor3)),
        ]),
      );

  // ---------------------------------------------------------------- bottom bar

  Widget? _bottomBar() {
    final page = _page;
    if (page == null || page.deals.isEmpty) return null;
    return Obx(() {
      final items = cart.totalCartItemCount + cart.printJobs.length;
      final message = !page.loggedIn
          ? 'Login to unlock deals'
          : page.unlocked
              ? 'Deals unlocked 🎉'
              : 'Add ${_rs(page.amountNeeded)} more to unlock';
      return SafeArea(
        top: false,
        child: Container(
          margin: const EdgeInsets.fromLTRB(12, 6, 12, 10),
          padding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_deep, _fresh]),
            borderRadius: BorderRadius.circular(16),
            boxShadow: softElevatedShadow,
          ),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                Text(message, style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: white)),
                if (page.loggedIn && !page.unlocked)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: page.progress,
                        minHeight: 5,
                        backgroundColor: Colors.white.withOpacity(0.25),
                        color: _gold,
                      ),
                    ),
                  ),
              ]),
            ),
            const SizedBox(width: 10),
            if (!page.loggedIn)
              TextButton(
                onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login())),
                style: TextButton.styleFrom(backgroundColor: white, foregroundColor: _deep, shape: const StadiumBorder()),
                child: Text('Login', style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
              )
            else if (items > 0)
              TextButton(
                onPressed: () async {
                  await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const Cart(isFromHomeScreen: false)));
                  _load();
                },
                style: TextButton.styleFrom(backgroundColor: white, foregroundColor: _deep, shape: const StadiumBorder()),
                child: Text('Cart · $items', style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
              )
            else
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                style: TextButton.styleFrom(backgroundColor: white, foregroundColor: _deep, shape: const StadiumBorder()),
                child: Text('Shop', style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
              ),
          ]),
        ),
      );
    });
  }
}
