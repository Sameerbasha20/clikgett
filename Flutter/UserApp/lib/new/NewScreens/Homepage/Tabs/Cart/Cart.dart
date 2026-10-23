import 'dart:async';

import 'package:fav_app/Models/Home/TimingProvider.dart';
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:fav_app/new/NewScreens/Address/ManageAddress.dart';
import 'package:fav_app/new/NewScreens/Address/unsupported_location_screen.dart';
import 'package:fav_app/new/NewScreens/Homepage/Storefront/home_header.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/SuccessCart.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/delivery_slot_widget.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/clikgett_product_card.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/account_services.dart';
import 'package:fav_app/new/Services/checkout_services.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/new/Services/storefront_services.dart';
import 'package:fav_app/old/Models/Account/adresses.dart';
import 'package:fav_app/old/Models/Home/home_model.dart';
import 'package:fav_app/old/Services/Account/adresses.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

/// Checkout. Every amount on this screen comes from the server bill
/// (/carts/bill), which is also what the order is charged.
class Cart extends StatefulWidget {
  const Cart(
      {super.key,
      this.isFromHomeScreen = true,
      this.throughSearchScreen = false,
      this.throughDescriptionScreen = false,
      this.throughProductScreen = false});

  final bool isFromHomeScreen;
  final bool throughSearchScreen;
  final bool throughDescriptionScreen;
  final bool throughProductScreen;

  @override
  State<Cart> createState() => _CartState();
}

const _instructionOptions = [
  _Instruction(Icons.door_front_door_outlined, 'No contact delivery', 'Leave the order at my door'),
  _Instruction(Icons.notifications_off_outlined, "Don't ring the bell", 'Call or knock instead'),
  _Instruction(Icons.pets_outlined, 'Beware of pets', 'There are pets at home'),
];

class _Instruction {
  final IconData icon;
  final String title;
  final String subtitle;
  const _Instruction(this.icon, this.title, this.subtitle);
}

String _rs(double v) => '${Constants.rupee}${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

class _CartState extends State<Cart> {
  final CartController cartController = Get.find();
  final AdressController addressController = Get.find();
  final HomeController homeController = Get.find();
  final WalletController walletController = Get.find();
  final OrdersController ordersController = Get.find();
  final TimingController timingController = Get.put(TimingController());

  CheckoutBill? _bill;
  bool _loading = true;
  bool _refreshing = false;
  bool _placing = false;
  String? _promoCode;
  int _tip = 0;
  bool _useWallet = false;
  String _payment = 'COD';
  final Set<String> _instructions = {};
  ScheduledSlotInfo? _slot;
  List<BestItem> _suggestions = [];

  Timer? _debounce;
  int _requestId = 0;
  final List<Worker> _workers = [];
  Razorpay? _razorpay;
  Map<String, dynamic>? _pendingOrderBody;

  @override
  void initState() {
    super.initState();
    _workers.add(ever(cartController.cartItems, (_) => _scheduleRefresh()));
    _workers.add(ever(addressController.selectedAdressId, (_) => _scheduleRefresh()));
    _init();
  }

  Future<void> _init() async {
    final token = await CommonServices.getToken();
    timingController.checkTiming(token);
    await Future.wait([
      addressController.getAdresses(context: context),
      walletController.getWallet(context: context),
    ]);
    if (!mounted) return;
    await _refreshBill();
    _loadSuggestions();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    for (final w in _workers) {
      w.dispose();
    }
    _razorpay?.clear();
    super.dispose();
  }

  Address? get _address {
    final list = addressController.address;
    final id = addressController.selectedAdressId.value;
    for (final a in list) {
      if (a.addressId == id) return a;
    }
    return null;
  }

  void _scheduleRefresh() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), _refreshBill);
  }

  Future<void> _refreshBill() async {
    final id = ++_requestId;
    if (mounted) setState(() => _refreshing = true);
    final a = _address;
    final bill = await CheckoutServices.bill(
      promoCode: _promoCode,
      latitude: a?.latitude ?? homeController.latitude.value,
      longitude: a?.longitude ?? homeController.longitude.value,
      tip: _tip,
      useWallet: _useWallet,
    );
    if (!mounted || id != _requestId) return;
    setState(() {
      _loading = false;
      _refreshing = false;
      if (bill == null) return;
      // A coupon that no longer applies (cart changed) is dropped with a note.
      if (_promoCode != null && bill.promoCode == null) {
        customToast(message: bill.couponMessage ?? 'Coupon removed');
        _promoCode = null;
      }
      if (_useWallet && bill.walletUsable <= 0) _useWallet = false;
      _bill = bill;
    });
    _loadSuggestions();
  }

  String _suggestionsKey = '';

  /// Products similar to what's in the cart (same subcategory/category), falling back
  /// to general recommendations. Reloaded only when the set of cart products changes.
  Future<void> _loadSuggestions() async {
    final inCart = cartController.cartItems.map((e) => e.productId).whereType<int>().toSet();
    final key = (inCart.toList()..sort()).join(',');
    if (key == _suggestionsKey) return;
    _suggestionsKey = key;
    final lists = await Future.wait(inCart.take(3).map(StorefrontServices.similarProducts));
    var products = <BestItem>[];
    final seen = <int?>{};
    // Interleave so each cart item contributes its closest matches first.
    for (var i = 0; i < 12; i++) {
      for (final list in lists) {
        if (i < list.length && !inCart.contains(list[i].productId) && seen.add(list[i].productId)) products.add(list[i]);
      }
    }
    if (products.isEmpty) {
      products = (await StorefrontServices.recommendedProducts()).where((p) => !inCart.contains(p.productId)).toList();
    }
    if (!mounted || key != _suggestionsKey) return;
    setState(() => _suggestions = products.take(12).toList());
  }

  Future<void> _setQuantity(BillItem item, int qty) async {
    // Going down is always allowed, even while above the stock left.
    if (qty > item.quantity && qty > item.limit && item.limit > 0) {
      customToast(message: 'Only ${item.limit} available');
      return;
    }
    await cartController.updateQuantity(
      productId: item.productId,
      variantId: item.variantId,
      quantity: qty,
      isFromCartScreen: true,
      removeToast: true,
      context: context,
    );
  }

  // ---------------------------------------------------------------- build

  @override
  Widget build(BuildContext context) {
    final bill = _bill;
    return Scaffold(
      backgroundColor: bg1,
      appBar: AppBar(
        backgroundColor: white,
        foregroundColor: tColor,
        elevation: 0.5,
        titleSpacing: 0,
        title: Text('Checkout', style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700)),
        actions: [
          if (bill != null && bill.items.isNotEmpty)
            TextButton.icon(
              onPressed: _placing ? null : () => _confirmClearCart(bill),
              icon: const Icon(Icons.delete_sweep_outlined, size: 20, color: red),
              label: Text('Clear cart', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: red)),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: Size.fromHeight((bill != null && bill.totalSavings > 0 && bill.items.isNotEmpty ? 34 : 0) + 2),
          child: Column(children: [
            if (bill != null && bill.totalSavings > 0 && bill.items.isNotEmpty)
              Container(
                height: 34,
                width: double.infinity,
                alignment: Alignment.center,
                color: const Color(0xFFE6F6EC),
                child: Text.rich(
                  TextSpan(children: [
                    const TextSpan(text: 'Yay! You saved '),
                    TextSpan(text: _rs(bill.totalSavings), style: const TextStyle(fontWeight: FontWeight.w800)),
                    const TextSpan(text: ' on this order'),
                  ]),
                  style: GoogleFonts.poppins(fontSize: 13, color: primaryDark),
                ),
              ),
            SizedBox(
              height: 2,
              child: _refreshing && !_loading
                  ? const LinearProgressIndicator(minHeight: 2, color: primary, backgroundColor: primaryGhost)
                  : null,
            ),
          ]),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: primary))
          : bill == null
              ? _errorState()
              : bill.items.isEmpty
                  ? _emptyState()
                  : RefreshIndicator(
                      color: primary,
                      onRefresh: _refreshBill,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
                        children: [
                          _storeStatus(),
                          _deliveryHeader(bill),
                          _itemsCard(bill),
                          if (!bill.minOrderMet) _minOrderBanner(bill),
                          _freeDeliveryCard(bill),
                          _unlocksCard(bill),
                          if (_suggestions.isNotEmpty) _suggestionsRail(),
                          _couponCard(bill),
                          _walletCard(bill),
                          _tipCard(bill),
                          _instructionsCard(),
                          _card(
                            child: DeliverySlotWidget(onSlotChanged: (slot) => setState(() => _slot = slot)),
                            padding: EdgeInsets.zero,
                          ),
                          _billCard(bill),
                          _policyNote(),
                        ],
                      ),
                    ),
      bottomNavigationBar: bill == null || bill.items.isEmpty ? null : _checkoutBar(bill),
    );
  }

  Widget _card({required Widget child, EdgeInsets padding = const EdgeInsets.all(14)}) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: padding,
        decoration: BoxDecoration(
          color: white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: cardBorder),
        ),
        child: child,
      );

  Widget _title(String text, {IconData? icon}) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(children: [
          if (icon != null) ...[Icon(icon, size: 19, color: primaryDark), const SizedBox(width: 8)],
          Expanded(child: Text(text, style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor))),
        ]),
      );

  Widget _emptyState() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.shopping_basket_outlined, size: 64, color: grey70),
            const SizedBox(height: 12),
            Text('Your cart is empty', style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700, color: tColor)),
            const SizedBox(height: 4),
            Text('Add items from the store to place an order.',
                textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13, color: tColor3)),
            const SizedBox(height: 18),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: primary, foregroundColor: white, elevation: 0),
              onPressed: () {
                homeController.updateTabIndex(0);
                Navigator.of(context).popUntil((r) => r.isFirst);
              },
              child: const Text('Start shopping'),
            ),
          ]),
        ),
      );

  Widget _errorState() => Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.wifi_off_rounded, size: 48, color: grey70),
          const SizedBox(height: 10),
          Text('Could not load your cart', style: GoogleFonts.poppins(fontSize: 14, color: tColor3)),
          TextButton(
            onPressed: () {
              setState(() => _loading = true);
              _refreshBill();
            },
            child: const Text('Retry'),
          ),
        ]),
      );

  Widget _storeStatus() => Obx(() {
        final t = timingController.timingResponse.value;
        if (t.status != 0 || t.message.isEmpty) return const SizedBox.shrink();
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: redLight, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            const Icon(Icons.storefront_outlined, color: red),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                  t.opensAt != null && t.opensAt!.isNotEmpty
                      ? '${t.message}. ${t.opensAt}. Your cart is saved.'
                      : '${t.message}. You can keep your cart and order when the store opens.',
                  style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4)),
            ),
          ]),
        );
      });

  Widget _deliveryHeader(CheckoutBill bill) {
    final eta = bill.etaMinutes ?? homeController.etaMinutes.value;
    final scheduled = _slot != null && _slot!.isScheduled;
    return _card(
      child: Row(children: [
        Container(
          width: 40,
          height: 40,
          decoration: const BoxDecoration(color: primaryGhost, shape: BoxShape.circle),
          child: const Icon(Icons.timer_outlined, color: primaryDark),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              scheduled ? 'Scheduled: ${_slot!.slotLabel ?? ''}' : (eta != null ? 'Delivery in $eta minutes' : 'Fast delivery'),
              style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: tColor),
            ),
            Text('${bill.itemCount} item${bill.itemCount == 1 ? '' : 's'} in this order',
                style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
            if (bill.largeCartNotice != null && !scheduled)
              Text(bill.largeCartNotice!, style: GoogleFonts.poppins(fontSize: 11.5, color: amberWarning)),
          ]),
        ),
      ]),
    );
  }

  Widget _itemsCard(CheckoutBill bill) {
    final problems = bill.stockProblems.length;
    return Column(children: [
      if (problems > 0)
        Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: redLight, borderRadius: BorderRadius.circular(12), border: Border.all(color: red.withOpacity(0.35))),
          child: Row(children: [
            const Icon(Icons.remove_shopping_cart_outlined, color: red),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                  problems == 1
                      ? '1 item in your cart is out of stock. Remove it or change the quantity to place your order.'
                      : '$problems items in your cart are out of stock. Remove them or change the quantity to place your order.',
                  style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600, color: _darkRed)),
            ),
          ]),
        ),
      _card(
        padding: const EdgeInsets.fromLTRB(14, 6, 14, 6),
        child: Column(
          children: [
            for (var i = 0; i < bill.items.length; i++) ...[
              if (i > 0) const Divider(height: 1, color: cardBorder),
              _itemRow(bill.items[i]),
            ],
          ],
        ),
      ),
    ]);
  }

  static const Color _darkRed = Color(0xFFB91C1C);

  Widget _itemRow(BillItem item) {
    final showMrp = item.mrp > item.unitPrice && !item.outOfStock;
    final problem = item.stockProblem;
    Widget image = item.imageUrl.isNotEmpty
        ? CustomNetworkImage(url: item.imageUrl, fit: BoxFit.contain)
        : const Icon(Icons.image_outlined, color: grey70);
    if (item.outOfStock) image = Opacity(opacity: 0.4, child: image);
    final row = Padding(
      padding: EdgeInsets.symmetric(vertical: 10, horizontal: problem ? 8 : 0),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 56,
          height: 56,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
              color: bg3, borderRadius: BorderRadius.circular(10), border: Border.all(color: problem ? red.withOpacity(0.5) : cardBorder)),
          child: image,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: tColor, height: 1.25)),
            if (item.unit.isNotEmpty) Text(item.unit, style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
            if (item.appliedRule != null && !problem)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(item.appliedRule!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: primaryDark)),
              ),
            if (problem) ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: red, borderRadius: BorderRadius.circular(6)),
                child: Text(item.outOfStock ? 'Out of stock' : 'Only ${item.availableQty} left',
                    style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w700, color: white)),
              ),
              const SizedBox(height: 4),
              GestureDetector(
                onTap: () => _setQuantity(item, item.outOfStock ? 0 : item.limit),
                child: Text(item.outOfStock ? 'Remove from cart' : 'Change to ${item.limit}',
                    style: GoogleFonts.poppins(
                        fontSize: 12, fontWeight: FontWeight.w700, color: _darkRed, decoration: TextDecoration.underline)),
              ),
            ],
          ]),
        ),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          _Stepper(
            quantity: item.quantity,
            canAdd: !problem && (item.limit <= 0 || item.quantity < item.limit),
            onChanged: (q) => _setQuantity(item, q),
          ),
          const SizedBox(height: 6),
          Text(_rs(item.lineTotal),
              style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: item.outOfStock ? grey70 : tColor,
                  decoration: item.outOfStock ? TextDecoration.lineThrough : null)),
          if (showMrp)
            Text(_rs(item.mrp * item.quantity),
                style: GoogleFonts.poppins(fontSize: 11, color: grey70, decoration: TextDecoration.lineThrough)),
        ]),
      ]),
    );
    if (!problem) return row;
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
          color: redLight, borderRadius: BorderRadius.circular(12), border: Border.all(color: red.withOpacity(0.6), width: 1.2)),
      child: row,
    );
  }

  Widget _minOrderBanner(CheckoutBill bill) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          const Icon(Icons.info_outline_rounded, color: amberWarning),
          const SizedBox(width: 10),
          Expanded(
            child: Text('Minimum order is ${_rs(bill.minOrderValue)}. Add ${_rs(bill.amountForMinOrder)} more to place your order.',
                style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4)),
          ),
        ]),
      );

  Widget _freeDeliveryCard(CheckoutBill bill) {
    if (bill.freeDeliveryThreshold <= 0) return const SizedBox.shrink();
    final done = bill.freeDelivery;
    final progress = done ? 1.0 : (bill.itemsTotal / bill.freeDeliveryThreshold).clamp(0.0, 1.0);
    return _card(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(done ? Icons.local_shipping_rounded : Icons.local_shipping_outlined, color: primaryDark, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              done ? 'Yay! You get FREE delivery' : 'Add ${_rs(bill.amountForFreeDelivery)} more for FREE delivery',
              style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: tColor),
            ),
          ),
        ]),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(value: progress.toDouble(), minHeight: 6, color: primary, backgroundColor: primaryGhost),
        ),
      ]),
    );
  }

  Widget _unlocksCard(CheckoutBill bill) {
    if (bill.unlocks.isEmpty) return const SizedBox.shrink();
    final inCart = bill.items.map((i) => i.productId).toSet();
    final unlocked = bill.unlocks.where((u) => u.unlocked && !inCart.contains(u.productId)).toList();
    final locked = bill.unlocks.where((u) => !u.unlocked).toList()..sort((a, b) => a.threshold.compareTo(b.threshold));
    if (unlocked.isEmpty && locked.isEmpty) return const SizedBox.shrink();
    return _card(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _title('Special prices for you', icon: Icons.lock_open_rounded),
        for (final u in unlocked)
          _unlockRow(u, trailing: TextButton(
            onPressed: () => cartController.updateQuantity(
              productId: u.productId,
              variantId: u.variantId ?? 0,
              quantity: 1,
              isFromCartScreen: true,
              removeToast: true,
              context: context,
            ),
            child: const Text('ADD'),
          )),
        if (locked.isNotEmpty)
          _unlockRow(locked.first,
              subtitle: 'Add ${_rs(locked.first.amountNeeded)} more to unlock',
              trailing: const Icon(Icons.lock_outline_rounded, color: grey70, size: 20)),
      ]),
    );
  }

  Widget _unlockRow(BillUnlock u, {String? subtitle, required Widget trailing}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${u.name}${u.unit.isNotEmpty ? ' · ${u.unit}' : ''}',
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: tColor)),
              Text.rich(TextSpan(children: [
                TextSpan(text: _rs(u.unlockPrice), style: const TextStyle(fontWeight: FontWeight.w700, color: primaryDark)),
                if (u.price > u.unlockPrice)
                  TextSpan(text: '  ${_rs(u.price)}', style: const TextStyle(color: grey70, decoration: TextDecoration.lineThrough)),
                if (subtitle != null) TextSpan(text: '  ·  $subtitle', style: const TextStyle(color: tColor3)),
              ]), style: GoogleFonts.poppins(fontSize: 12)),
            ]),
          ),
          trailing,
        ]),
      );

  Widget _suggestionsRail() => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
            child: Text('Similar to your items', style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor)),
          ),
          SizedBox(
            height: 262,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _suggestions.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) => ClikgettProductCard(key: ValueKey('sug-${_suggestions[i].productId}'), product: _suggestions[i]),
            ),
          ),
        ]),
      );

  // ---------------------------------------------------------------- coupon

  Widget _couponCard(CheckoutBill bill) {
    final applied = bill.promoCode != null;
    return _card(
      child: InkWell(
        onTap: () => _openCouponSheet(bill),
        child: Row(children: [
          Icon(Icons.local_offer_outlined, color: applied ? primaryDark : tColor3),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(applied ? "'${bill.promoCode}' applied" : 'Apply coupon',
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: tColor)),
              Text(
                applied
                    ? 'You save ${_rs(bill.couponDiscount)}'
                    : bill.applicableCoupons.isNotEmpty
                        ? '${bill.applicableCoupons.length} coupon${bill.applicableCoupons.length == 1 ? '' : 's'} available'
                        : 'See offers',
                style: GoogleFonts.poppins(fontSize: 12, color: applied ? primaryDark : tColor3),
              ),
            ]),
          ),
          if (applied)
            TextButton(
              onPressed: () {
                _promoCode = null;
                _refreshBill();
              },
              child: const Text('Remove', style: TextStyle(color: red)),
            )
          else
            const Icon(Icons.chevron_right_rounded, color: grey70),
        ]),
      ),
    );
  }

  Future<void> _applyCoupon(String code) async {
    final clean = code.trim().toUpperCase();
    if (clean.isEmpty) return;
    final a = _address;
    final bill = await CheckoutServices.bill(
      promoCode: clean,
      latitude: a?.latitude ?? homeController.latitude.value,
      longitude: a?.longitude ?? homeController.longitude.value,
      tip: _tip,
      useWallet: _useWallet,
    );
    if (!mounted) return;
    if (bill == null) {
      customToast(message: 'Could not check the coupon. Try again.');
      return;
    }
    if (bill.promoCode == null) {
      customToast(message: bill.couponMessage ?? 'This coupon cannot be applied');
      return;
    }
    Navigator.of(context).pop();
    setState(() {
      _promoCode = clean;
      _bill = bill;
    });
    customToast(message: 'Coupon applied. You save ${_rs(bill.couponDiscount)}');
  }

  void _openCouponSheet(CheckoutBill bill) {
    final controller = TextEditingController();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.75),
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              Text('Coupons', style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700, color: tColor)),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      hintText: 'Enter coupon code',
                      isDense: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: primary)),
                    ),
                    onSubmitted: _applyCoupon,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: primary, foregroundColor: white, elevation: 0),
                  onPressed: () => _applyCoupon(controller.text),
                  child: const Text('Apply'),
                ),
              ]),
              if (bill.applicableCoupons.isNotEmpty) ...[
                const SizedBox(height: 18),
                Text('Available for this order', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: tColor4)),
                for (final c in bill.applicableCoupons) _couponTile(c, onApply: () => _applyCoupon(c.code)),
              ],
              if (bill.suggestedCoupons.isNotEmpty) ...[
                const SizedBox(height: 18),
                Text('Add more to unlock', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: tColor4)),
                for (final c in bill.suggestedCoupons) _couponTile(c),
              ],
              if (bill.applicableCoupons.isEmpty && bill.suggestedCoupons.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 18),
                  child: Text('No coupons right now.', style: GoogleFonts.poppins(fontSize: 13, color: tColor3)),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _couponTile(BillCoupon c, {VoidCallback? onApply}) => Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: onApply != null ? primary.withOpacity(0.4) : cardBorder),
          color: onApply != null ? primaryGhost : bg3,
        ),
        child: Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.code, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w800, color: tColor, letterSpacing: 0.5)),
              if (c.description.isNotEmpty) Text(c.description, style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
              Text(
                onApply != null ? 'On orders above ${_rs(c.minOrderValue)}' : 'Add ${_rs(c.amountNeeded)} more to use this',
                style: GoogleFonts.poppins(fontSize: 11.5, color: onApply != null ? primaryDark : amberWarning),
              ),
            ]),
          ),
          if (onApply != null) TextButton(onPressed: onApply, child: const Text('APPLY')),
        ]),
      );

  // ---------------------------------------------------------------- wallet / tip / instructions

  Widget _walletCard(CheckoutBill bill) {
    if (bill.walletBalance <= 0) return const SizedBox.shrink();
    final canUse = bill.walletUsable > 0;
    final smallOrderCap = bill.walletUsable < bill.walletBalance &&
        bill.toPay + bill.walletApplied < bill.minOrderForFullWallet &&
        bill.smallOrderWalletCap > 0;
    return _card(
      child: Row(children: [
        const Icon(Icons.account_balance_wallet_outlined, color: primaryDark),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Use wallet balance', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: tColor)),
            Text(
              !canUse
                  ? 'Balance ${_rs(bill.walletBalance)} · not usable on this order'
                  : smallOrderCap
                      ? 'Use ${_rs(bill.walletUsable)} of ${_rs(bill.walletBalance)} (full balance on orders above ${_rs(bill.minOrderForFullWallet)})'
                      : 'Use ${_rs(bill.walletUsable)} of your ${_rs(bill.walletBalance)} balance',
              style: GoogleFonts.poppins(fontSize: 12, color: tColor3),
            ),
          ]),
        ),
        Switch.adaptive(
          value: _useWallet,
          activeColor: primary,
          onChanged: canUse
              ? (v) {
                  setState(() => _useWallet = v);
                  _refreshBill();
                }
              : null,
        ),
      ]),
    );
  }

  Widget _tipCard(CheckoutBill bill) {
    final presets = bill.tipPresets.isEmpty ? const [10, 20, 30, 50] : bill.tipPresets;
    final custom = _tip > 0 && !presets.contains(_tip);
    return _card(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _title('Tip your delivery partner', icon: Icons.volunteer_activism_outlined),
        Text('The full tip goes to the person delivering your order.',
            style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
        const SizedBox(height: 10),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final t in presets) _chip(_rs(t.toDouble()), _tip == t, () => _setTip(_tip == t ? 0 : t)),
          _chip(custom ? 'Custom ${_rs(_tip.toDouble())}' : 'Custom', custom, _customTip),
        ]),
      ]),
    );
  }

  void _setTip(int tip) {
    setState(() => _tip = tip);
    _refreshBill();
  }

  /// Empties the whole cart in one go (for carts that piled up over time).
  Future<void> _confirmClearCart(CheckoutBill bill) async {
    final count = bill.items.length;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear cart?'),
        content: Text(count == 1 ? 'Remove the item from your cart?' : 'Remove all $count items from your cart?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep items')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Clear cart', style: TextStyle(color: red)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    await cartController.deleteCart(context: context);
    if (mounted) homeController.getHome(context: context);
  }

  Future<void> _customTip() async {
    final controller = TextEditingController(text: _tip > 0 ? '$_tip' : '');
    final value = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Custom tip'),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(prefixText: '₹ ', hintText: 'Amount'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, 0), child: const Text('No tip')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, int.tryParse(controller.text.trim()) ?? 0),
            child: const Text('Add tip'),
          ),
        ],
      ),
    );
    if (value == null) return;
    if (value > 1000) {
      customToast(message: 'Tip can be at most ₹1000');
      return;
    }
    _setTip(value < 0 ? 0 : value);
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? primaryGhost : white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: selected ? primary : cardBorder, width: selected ? 1.4 : 1),
          ),
          child: Text(label,
              style: GoogleFonts.poppins(
                  fontSize: 13, fontWeight: selected ? FontWeight.w700 : FontWeight.w500, color: selected ? primaryDark : tColor4)),
        ),
      );

  bool _instructionsOpen = false;

  /// One row until tapped, so the checkout stays short.
  Widget _instructionsCard() => _card(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          InkWell(
            onTap: () => setState(() => _instructionsOpen = !_instructionsOpen),
            child: Row(children: [
              const Icon(Icons.assignment_outlined, size: 19, color: primaryDark),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _instructions.isEmpty ? 'Add delivery instructions' : 'Delivery instructions · ${_instructions.length} selected',
                  style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor),
                ),
              ),
              Icon(_instructionsOpen ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded, color: grey70),
            ]),
          ),
          if (_instructionsOpen) const SizedBox(height: 10),
          if (_instructionsOpen) SizedBox(
            height: 92,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _instructionOptions.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final o = _instructionOptions[i];
                final selected = _instructions.contains(o.title);
                return InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => setState(() => selected ? _instructions.remove(o.title) : _instructions.add(o.title)),
                  child: Container(
                    width: 132,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: selected ? primaryGhost : white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: selected ? primary : cardBorder, width: selected ? 1.4 : 1),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Icon(o.icon, size: 20, color: selected ? primaryDark : tColor3),
                      const SizedBox(height: 4),
                      Text(o.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: tColor)),
                      Text(o.subtitle,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(fontSize: 10.5, color: tColor3, height: 1.2)),
                    ]),
                  ),
                );
              },
            ),
          ),
        ]),
      );

  // ---------------------------------------------------------------- bill

  Widget _billCard(CheckoutBill bill) => _card(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _title('Bill details', icon: Icons.receipt_long_outlined),
          _billRow('Items total', _rs(bill.itemsTotal), strike: bill.mrpTotal > bill.itemsTotal ? _rs(bill.mrpTotal) : null),
          if (bill.couponDiscount > 0) _billRow('Coupon (${bill.promoCode})', '-${_rs(bill.couponDiscount)}', green: true),
          if (bill.cartOfferDiscount > 0)
            _billRow((bill.cartOfferName ?? '').isNotEmpty ? bill.cartOfferName! : 'Cart offer', '-${_rs(bill.cartOfferDiscount)}', green: true),
          _billRow('Delivery fee', bill.deliveryFee <= 0 ? 'FREE' : _rs(bill.deliveryFee),
              green: bill.deliveryFee <= 0,
              strike: bill.freeDeliverySavings > 0 ? _rs(bill.freeDeliverySavings + bill.deliveryFee) : null),
          if (bill.tip > 0) _billRow('Delivery partner tip', _rs(bill.tip.toDouble())),
          if (bill.walletApplied > 0) _billRow('Paid from wallet', '-${_rs(bill.walletApplied)}', green: true),
          const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider(height: 1, color: cardBorder)),
          _billRow('To pay', _rs(bill.toPay), bold: true,
              strike: bill.totalSavings > 0 ? _rs(bill.toPay + bill.totalSavings) : null),
          if (bill.cashbackEarned > 0)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text('You will get ${_rs(bill.cashbackEarned)} cashback in your wallet after delivery.',
                  style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
            ),
        ]),
      );

  /// "Savings on this order" breakdown (Blinkit style).
  Widget _billRow(String label, String value, {String? strike, bool green = false, bool bold = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(children: [
          Expanded(
            child: Text(label,
                style: GoogleFonts.poppins(fontSize: bold ? 14.5 : 13, fontWeight: bold ? FontWeight.w700 : FontWeight.w400, color: bold ? tColor : tColor4)),
          ),
          if (strike != null)
            Padding(
              padding: const EdgeInsets.only(right: 6),
              child: Text(strike, style: GoogleFonts.poppins(fontSize: 12, color: grey70, decoration: TextDecoration.lineThrough)),
            ),
          Text(value,
              style: GoogleFonts.poppins(
                  fontSize: bold ? 15 : 13,
                  fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
                  color: green ? primaryDark : tColor)),
        ]),
      );

  Widget _policyNote() => Padding(
        padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
        child: Text(
          'You can cancel within 2 minutes of placing the order. After that, cancellation is not possible once the store starts packing.',
          style: GoogleFonts.poppins(fontSize: 11.5, color: grey70),
        ),
      );

  // ---------------------------------------------------------------- checkout bar

  Widget _checkoutBar(CheckoutBill bill) {
    return Container(
      decoration: const BoxDecoration(
        color: white,
        border: Border(top: BorderSide(color: cardBorder)),
        boxShadow: softElevatedShadow,
      ),
      child: SafeArea(
        top: false,
        child: Obx(() {
          final address = _address;
          final storeClosed = timingController.timingResponse.value.status == 0 &&
              timingController.timingResponse.value.message.isNotEmpty;
          return Column(mainAxisSize: MainAxisSize.min, children: [
            InkWell(
              onTap: _chooseAddress,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 10, 8, 6),
                child: Row(children: [
                  const Icon(Icons.location_on_outlined, color: primaryDark, size: 22),
                  const SizedBox(width: 8),
                  Expanded(
                    child: address == null
                        ? Text('Select a delivery address',
                            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: red))
                        : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('Delivering to ${address.type.replaceAll(',', ' ').trim()}',
                                style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: tColor)),
                            Text([address.flatNo, address.address].where((s) => s.trim().isNotEmpty).join(', '),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
                          ]),
                  ),
                  Text(address == null ? 'Select' : 'Change',
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: primaryDark)),
                ]),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 4, 12, 10),
              child: Row(children: [
                if (bill.toPay > 0)
                  InkWell(
                    onTap: _choosePayment,
                    child: Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                        Row(children: [
                          Text('PAY USING', style: GoogleFonts.poppins(fontSize: 10.5, color: tColor3, fontWeight: FontWeight.w600)),
                          const Icon(Icons.arrow_drop_up_rounded, size: 18, color: tColor3),
                        ]),
                        Text(_payment == 'ONLINE' ? 'UPI / Card' : 'Cash on delivery',
                            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: tColor)),
                      ]),
                    ),
                  ),
                Expanded(child: _placeButton(bill, address, storeClosed)),
              ]),
            ),
          ]);
        }),
      ),
    );
  }

  Widget _placeButton(CheckoutBill bill, Address? address, bool storeClosed) {
    String label;
    VoidCallback? onTap;
    if (storeClosed) {
      label = 'Store is closed';
    } else if (address == null) {
      label = 'Select address';
      onTap = _chooseAddress;
    } else if (bill.stockProblems.isNotEmpty) {
      label = 'Remove out-of-stock items';
    } else if (!bill.minOrderMet) {
      label = 'Add ${_rs(bill.amountForMinOrder)} more';
    } else if (bill.toPay <= 0) {
      label = 'Place order · Paid by wallet';
      onTap = _placeOrder;
    } else {
      label = _payment == 'ONLINE' ? 'Pay ${_rs(bill.toPay)}' : 'Place order · ${_rs(bill.toPay)}';
      onTap = _placeOrder;
    }
    return SizedBox(
      height: 50,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: white,
          disabledBackgroundColor: bg2,
          disabledForegroundColor: tColor3,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: _placing || _refreshing ? null : onTap,
        child: _placing
            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: white))
            : Text(label, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700)),
      ),
    );
  }

  Future<void> _chooseAddress() async {
    if (addressController.address.isEmpty) {
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ManageAddress()));
      if (mounted) await addressController.getAdresses(context: context);
    } else {
      await showDeliveryAddressPicker(context);
    }
    _scheduleRefresh();
  }

  void _choosePayment() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('Choose payment method', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: tColor)),
          ),
          _paymentTile(ctx, 'COD', Icons.payments_outlined, 'Cash on delivery', 'Pay cash or UPI to the delivery partner'),
          _paymentTile(ctx, 'ONLINE', Icons.account_balance_outlined, 'Pay online', 'UPI, cards, net banking (Razorpay)'),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  Widget _paymentTile(BuildContext ctx, String value, IconData icon, String title, String subtitle) => ListTile(
        leading: Icon(icon, color: primaryDark),
        title: Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: tColor)),
        subtitle: Text(subtitle, style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
        trailing: Icon(_payment == value ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
            color: _payment == value ? primary : grey70),
        onTap: () {
          setState(() => _payment = value);
          Navigator.pop(ctx);
        },
      );

  // ---------------------------------------------------------------- place order

  Future<void> _placeOrder() async {
    final bill = _bill;
    final address = _address;
    if (bill == null || address == null || _placing) return;
    setState(() => _placing = true);
    try {
      final token = await CommonServices.getToken();
      await timingController.checkTiming(token);
      final timing = timingController.timingResponse.value;
      if (timing.status == 0) {
        customToast(message: timing.message.isNotEmpty ? timing.message : 'The store is closed right now');
        return;
      }

      final service = await AdresseServices.checkServiceabilityApi(latitude: address.latitude, longitude: address.longitude);
      if (service != null && service['IsServiceable'] == false) {
        if (!mounted) return;
        Get.to(() => UnsupportedLocationScreen(
              addressSummary: address.address,
              distanceKm: double.tryParse('${service['DistanceKm'] ?? ''}'),
              isFromCart: true,
            ));
        return;
      }

      final method = bill.toPay <= 0 ? 'WALLET' : _payment;
      final body = <String, dynamic>{
        'Address': address.address,
        'FlatNo': address.flatNo,
        'City': address.city,
        'LandMark': address.landmark,
        'Latitude': address.latitude,
        'Longitude': address.longitude,
        'PaymentMethod': method,
        if (_promoCode != null) 'PromoCode': _promoCode,
        'TipAmount': _tip,
        'WalletAmount': _useWallet ? bill.walletApplied : 0,
        'DeliveryInstructions': _instructions.toList(),
        'OrderType': 'Delivery',
        'ScheduleStatus': _slot != null && _slot!.isScheduled ? 'Scheduled' : 'Immediate',
        if (_slot != null && _slot!.isScheduled) 'ScheduledDateTime': _slot!.formattedScheduledDateTime,
        'username': Get.find<ProfileController>().users?.firstName ?? '',
      };

      if (method == 'ONLINE') {
        await _startOnlinePayment(body);
      } else {
        await _submitOrder(body);
      }
    } finally {
      if (mounted && _pendingOrderBody == null) setState(() => _placing = false);
    }
  }

  Future<void> _submitOrder(Map<String, dynamic> body) async {
    final result = await CheckoutServices.placeOrder(body);
    if (!mounted) return;
    if (!result.ok) {
      customToast(message: result.message);
      _refreshBill();
      return;
    }
    cartController.clearCart();
    cartController.getCart(context: context, longitude: homeController.longitude, latitude: homeController.latitude);
    ordersController.getcurrentorder(context: context);
    walletController.getWallet(context: context);
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => SuccessCart(orderId: result.orderId ?? 0)));
  }

  Future<void> _startOnlinePayment(Map<String, dynamic> body) async {
    final payment = await CheckoutServices.createPayment(body);
    if (!mounted) return;
    final orderId = payment.data['RazorpayOrderID'];
    if (!payment.ok || orderId == null) {
      customToast(message: payment.message);
      return;
    }
    final amount = (payment.data['OrderAmount'] is num) ? (payment.data['OrderAmount'] as num).toDouble() : _bill!.toPay;
    _pendingOrderBody = {...body, 'RazorpayOrderID': orderId};
    _razorpay?.clear();
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, (_) {});
    final profile = Get.find<ProfileController>().users;
    final key = await AccountServices.razorpayKey();
    try {
      _razorpay!.open({
        'key': key,
        'amount': (amount * 100).round(),
        'order_id': orderId,
        'name': 'ClikGett',
        'description': 'Order payment',
        'timeout': 300,
        'retry': {'enabled': true, 'max_count': 1},
        'prefill': {'contact': profile?.mobileNumber, 'email': profile?.emailId},
      });
    } catch (e) {
      _pendingOrderBody = null;
      customToast(message: 'Could not open the payment page');
    }
  }

  Future<void> _onPaymentSuccess(PaymentSuccessResponse response) async {
    final body = _pendingOrderBody;
    _pendingOrderBody = null;
    if (body == null) return;
    if (mounted) setState(() => _placing = true);
    await _submitOrder({
      ...body,
      'razorpay_payment_id': response.paymentId,
      'razorpay_signature': response.signature,
    });
    if (mounted) setState(() => _placing = false);
  }

  void _onPaymentError(PaymentFailureResponse response) {
    _pendingOrderBody = null;
    if (!mounted) return;
    setState(() => _placing = false);
    customToast(message: 'Payment was not completed. No money was taken for this order.');
  }
}

class _Stepper extends StatelessWidget {
  final int quantity;
  final bool canAdd;
  final ValueChanged<int> onChanged;

  const _Stepper({required this.quantity, required this.canAdd, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 32,
      decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        _btn(Icons.remove_rounded, () => onChanged(quantity - 1)),
        SizedBox(
          width: 24,
          child: Text('$quantity',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w700, color: white)),
        ),
        _btn(Icons.add_rounded, canAdd ? () => onChanged(quantity + 1) : null),
      ]),
    );
  }

  Widget _btn(IconData icon, VoidCallback? onTap) => InkWell(
        onTap: onTap,
        child: SizedBox(width: 30, height: 32, child: Icon(icon, size: 17, color: onTap == null ? white.withOpacity(0.5) : white)),
      );
}
