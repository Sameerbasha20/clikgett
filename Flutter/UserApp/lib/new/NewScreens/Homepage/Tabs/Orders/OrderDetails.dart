import 'dart:async';

import 'package:fav_app/Screens/Orders/post_delivery_dialog.dart';
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/Cart.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/widgets/view_receipt.dart';
import 'package:fav_app/new/NewScreens/Support/Support.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/new/Services/order_tracking_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

String _rs(double v) => '${Constants.rupee}${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';
String _time(DateTime? d) => d == null ? '' : DateFormat('h:mm a').format(d);
String _dateTime(DateTime? d) => d == null ? '' : DateFormat('d MMM, h:mm a').format(d);

/// Live order tracking: status, ETA, rider, delivery OTP, items and bill.
class OrderDetailsScreen extends StatefulWidget {
  const OrderDetailsScreen({super.key, this.isPastOrders = false, required this.orderNo});

  final bool isPastOrders;
  final int orderNo;

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> with WidgetsBindingObserver {
  TrackedOrder? _order;
  bool _loading = true;
  bool _busy = false;
  Timer? _poll;
  Timer? _tick;
  int _cancelLeft = 0;
  bool _feedbackChecked = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _poll?.cancel();
    _tick?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Only poll while the screen is visible.
    if (state == AppLifecycleState.resumed) {
      _load();
    } else if (state == AppLifecycleState.paused) {
      _poll?.cancel();
    }
  }

  Future<void> _load() async {
    final order = await OrderTrackingServices.fetch(widget.orderNo);
    if (!mounted) return;
    final previous = _order?.status;
    setState(() {
      _loading = false;
      if (order != null) _order = order;
    });
    if (order == null) return;

    if (previous != null && previous != order.status) {
      // Keep the home strip / orders list in step with this screen.
      Get.find<OrdersController>().getcurrentorder(context: context);
      if (OrderStatus.isCancelled(order.status)) Get.find<WalletController>().getWallet(context: context);
    }

    _startCancelCountdown(order.cancelSecondsLeft);
    _poll?.cancel();
    if (!OrderStatus.isFinal(order.status)) {
      _poll = Timer(const Duration(seconds: 15), _load);
    }
    if (order.status == OrderStatus.delivered) _maybeAskFeedback(order);
  }

  void _startCancelCountdown(int seconds) {
    _tick?.cancel();
    _cancelLeft = seconds;
    if (seconds <= 0) return;
    _tick = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _cancelLeft = _cancelLeft > 0 ? _cancelLeft - 1 : 0);
      if (_cancelLeft <= 0) t.cancel();
    });
  }

  Future<void> _maybeAskFeedback(TrackedOrder order) async {
    if (_feedbackChecked) return;
    _feedbackChecked = true;
    if (await PostDeliveryFeedbackDialog.hasPromptBeenShown(order.orderId) || !mounted) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _rate(order);
    });
  }

  void _rate(TrackedOrder order) {
    PostDeliveryFeedbackDialog.show(context, orderId: order.orderId, orderTotal: order.grandTotal);
  }

  // ---------------------------------------------------------------- actions

  Future<void> _call(String phone) async {
    final uri = Uri(scheme: 'tel', path: phone.replaceAll(' ', ''));
    if (!await launchUrl(uri)) customToast(message: 'Could not open the dialer');
  }

  void _openHelp() {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const Support()));
  }

  Future<void> _cancel(TrackedOrder order) async {
    final reason = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        const reasons = ['Ordered by mistake', 'Want to change items', 'Delivery is taking too long', 'Found a better price', 'Other'];
        return SafeArea(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
              child: Text('Why are you cancelling?', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: tColor)),
            ),
            for (final r in reasons)
              ListTile(
                title: Text(r, style: GoogleFonts.poppins(fontSize: 14, color: tColor4)),
                trailing: const Icon(Icons.chevron_right_rounded, color: grey70),
                onTap: () => Navigator.pop(ctx, r),
              ),
          ]),
        );
      },
    );
    if (reason == null || !mounted) return;
    setState(() => _busy = true);
    final result = await OrderTrackingServices.cancel(order.orderId, reason);
    if (!mounted) return;
    setState(() => _busy = false);
    customToast(message: result.ok ? 'Order cancelled' : result.message);
    await _load();
    if (mounted) {
      Get.find<OrdersController>().getcurrentorder(context: context);
      Get.find<WalletController>().getWallet(context: context);
    }
  }

  Future<void> _reorder(TrackedOrder order) async {
    setState(() => _busy = true);
    final result = await OrderTrackingServices.reorder(order.orderId);
    if (!mounted) return;
    setState(() => _busy = false);
    if (!result.ok) {
      customToast(message: result.message);
      return;
    }
    final home = Get.find<HomeController>();
    await Get.find<CartController>().getCart(context: context, longitude: home.longitude, latitude: home.latitude);
    if (!mounted) return;
    customToast(message: result.message.isNotEmpty ? result.message : 'Items added to your cart');
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const Cart(isFromHomeScreen: false)));
  }

  Future<void> _openInvoice(TrackedOrder order) async {
    String base = Constants.baseUrl;
    if (base.endsWith('/api')) base = base.substring(0, base.length - 4);
    // The PDF viewer cannot send headers, so the owner's token goes in the query.
    final token = await CommonServices.getToken();
    final url = Uri.parse('$base/api/orders/invoice/${order.orderId}')
        .replace(queryParameters: token.isNotEmpty ? {'token': token} : null)
        .toString();
    if (!mounted) return;
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => InAppPdfViewerPage(pdfUrl: url, orderId: order.orderId)));
  }

  // ---------------------------------------------------------------- build

  @override
  Widget build(BuildContext context) {
    final order = _order;
    return Scaffold(
      backgroundColor: bg1,
      appBar: AppBar(
        backgroundColor: white,
        foregroundColor: tColor,
        elevation: 0.5,
        titleSpacing: 0,
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(order == null ? 'Order details' : 'Order #${order.number}',
              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
          if (order?.createdAt != null)
            Text('Placed ${_dateTime(order!.createdAt)}', style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
        ]),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: TextButton.icon(
              onPressed: _openHelp,
              style: TextButton.styleFrom(
                foregroundColor: primaryDark,
                backgroundColor: primaryGhost,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                shape: const StadiumBorder(),
              ),
              icon: const Icon(Icons.support_agent_rounded, size: 18),
              label: Text('Help', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: primary))
          : order == null
              ? _errorState()
              : RefreshIndicator(
                  color: primary,
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
                    children: [
                      _statusCard(order),
                      _paymentCard(order),
                      if (order.status == OrderStatus.arrived && order.otp != null) _otpCard(order),
                      if (order.riderName != null && [OrderStatus.assigned, OrderStatus.outForDelivery, OrderStatus.arrived].contains(order.status))
                        _riderCard(order),
                      if (_cancelLeft > 0) _cancelCard(order),
                      _timelineCard(order),
                      _itemsCard(order),
                      _billCard(order),
                      _addressCard(order),
                      _actions(order),
                    ],
                  ),
                ),
    );
  }

  Widget _card({required Widget child, EdgeInsets padding = const EdgeInsets.all(14), Color? color}) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: padding,
        decoration: BoxDecoration(
          color: color ?? white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: cardBorder),
        ),
        child: child,
      );

  Widget _title(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(text, style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor)),
      );

  Widget _errorState() => Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.receipt_long_outlined, size: 48, color: grey70),
          const SizedBox(height: 10),
          Text('Could not load this order', style: GoogleFonts.poppins(fontSize: 14, color: tColor3)),
          TextButton(
            onPressed: () {
              setState(() => _loading = true);
              _load();
            },
            child: const Text('Retry'),
          ),
        ]),
      );

  Widget _statusCard(TrackedOrder o) {
    final cancelled = OrderStatus.isCancelled(o.status);
    final delivered = o.status == OrderStatus.delivered;
    String subtitle;
    if (delivered) {
      subtitle = 'Delivered ${_dateTime(o.deliveredAt ?? o.reachedAt(OrderStatus.delivered))}';
    } else if (cancelled) {
      subtitle = o.status == OrderStatus.cancelledByStore
          ? 'The store could not complete this order.${o.cancellationReason != null ? ' Reason: ${o.cancellationReason}' : ''}'
          : 'You cancelled this order.';
    } else if (o.scheduled && o.scheduledAt != null && o.status == OrderStatus.received) {
      subtitle = 'Scheduled for ${DateFormat('EEE, d MMM').format(o.scheduledAt!)}';
    } else if (o.etaMinutesLeft != null && o.etaMinutesLeft! > 0) {
      subtitle = 'Arriving in about ${o.etaMinutesLeft} min · by ${_time(o.estimate)}';
    } else if (o.status == OrderStatus.arrived) {
      subtitle = 'Your delivery partner is at your location';
    } else {
      subtitle = 'Arriving shortly';
    }
    final color = cancelled ? red : primaryDark;
    final refund = cancelled && (o.paid || o.walletUsed > 0) ? _refundText(o) : null;
    return _card(
      color: cancelled ? redLight : primaryGhost,
      child: Row(children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(color: white, shape: BoxShape.circle, border: Border.all(color: color.withOpacity(0.3))),
          child: Icon(
            cancelled
                ? Icons.cancel_outlined
                : delivered
                    ? Icons.check_circle_rounded
                    : o.status == OrderStatus.packing
                        ? Icons.inventory_2_outlined
                        : Icons.delivery_dining_rounded,
            color: color,
            size: 26,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(OrderStatus.title(o.status), style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w800, color: tColor)),
            const SizedBox(height: 2),
            Text(subtitle, style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4)),
            if (refund != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(refund, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: primaryDark)),
              ),
          ]),
        ),
      ]),
    );
  }

  String _refundText(TrackedOrder o) {
    final parts = <String>[];
    if (o.walletUsed > 0) parts.add('${_rs(o.walletUsed)} returned to your wallet');
    if (o.paid && o.paymentMethod == 'ONLINE') {
      final online = o.grandTotal;
      final s = (o.refundStatus ?? '').toUpperCase();
      parts.add(s == 'INITIATED' || s == 'PROCESSED'
          ? '${_rs(online)} refund started to your original payment method (3–5 working days)'
          : '${_rs(online)} will be refunded to your original payment method');
    }
    return parts.join('. ');
  }

  Widget _otpCard(TrackedOrder o) => _card(
        child: Row(children: [
          const Icon(Icons.lock_outline_rounded, color: primaryDark),
          const SizedBox(width: 10),
          Expanded(
            child: Text('Share this OTP with your delivery partner to receive the order',
                style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4)),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(10)),
            child: Text(o.otp!,
                style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w800, color: white, letterSpacing: 3)),
          ),
        ]),
      );

  Widget _riderCard(TrackedOrder o) => _card(
        child: Row(children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(color: bg3, shape: BoxShape.circle),
            child: const Icon(Icons.person_rounded, color: tColor3),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(o.riderName!, style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor)),
              Text('Your delivery partner', style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
            ]),
          ),
          if (o.riderPhone != null)
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: primaryDark,
                side: const BorderSide(color: primary),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () => _call(o.riderPhone!),
              icon: const Icon(Icons.call_rounded, size: 18),
              label: const Text('Call'),
            ),
        ]),
      );

  Widget _cancelCard(TrackedOrder o) {
    final left = '${_cancelLeft ~/ 60}:${(_cancelLeft % 60).toString().padLeft(2, '0')}';
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(10, 8, 8, 8),
      decoration: BoxDecoration(
        color: white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: cardBorder),
      ),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(color: redLight, borderRadius: BorderRadius.circular(20)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.timer_outlined, size: 14, color: red),
            const SizedBox(width: 4),
            Text(left, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: red)),
          ]),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text('Free cancellation', style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4)),
        ),
        SizedBox(
          height: 32,
          child: OutlinedButton(
            onPressed: _busy ? null : () => _cancel(o),
            style: OutlinedButton.styleFrom(
              foregroundColor: red,
              side: BorderSide(color: red.withOpacity(0.45)),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              shape: const StadiumBorder(),
              visualDensity: VisualDensity.compact,
            ),
            child: Text('Cancel', style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600)),
          ),
        ),
      ]),
    );
  }

  /// How this order is paid, with what is still due.
  Widget _paymentCard(TrackedOrder o) {
    final delivered = o.status == OrderStatus.delivered;
    final cancelled = OrderStatus.isCancelled(o.status);
    IconData icon;
    String title, note, badge;
    Color accent;
    if (o.paymentMethod == 'ONLINE') {
      icon = Icons.credit_card_rounded;
      if (o.paid) {
        title = 'Paid ${_rs(o.grandTotal)} online';
        note = 'Nothing to pay at delivery';
        badge = 'PAID';
        accent = primaryDark;
      } else {
        title = 'Online payment pending';
        note = 'We will confirm once the payment goes through';
        badge = 'PENDING';
        accent = const Color(0xFFD97706);
      }
    } else if (o.paymentMethod == 'WALLET') {
      icon = Icons.account_balance_wallet_rounded;
      title = 'Paid ${_rs(o.walletUsed > 0 ? o.walletUsed : o.grandTotal)} from wallet';
      note = 'Nothing to pay at delivery';
      badge = 'PAID';
      accent = primaryDark;
    } else {
      icon = Icons.payments_rounded;
      title = delivered ? 'Paid ${_rs(o.grandTotal)} on delivery' : 'Pay ${_rs(o.grandTotal)} on delivery';
      note = delivered ? 'Cash / UPI' : 'Cash or UPI to the delivery partner';
      badge = delivered ? 'PAID' : 'PAY ON DELIVERY';
      accent = delivered ? primaryDark : const Color(0xFF2563EB);
    }
    if (cancelled) {
      note = 'Order cancelled';
      badge = 'CANCELLED';
      accent = tColor3;
    }
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: cardBorder),
      ),
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(color: accent.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: accent, size: 22),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: tColor)),
            Text(note, style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
          ]),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: accent.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
          child: Text(badge, style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w700, color: accent, letterSpacing: 0.3)),
        ),
      ]),
    );
  }

  Widget _timelineCard(TrackedOrder o) {
    final List<int> steps;
    if (OrderStatus.isCancelled(o.status)) {
      steps = [
        ...OrderStatus.progress.where((s) => s != OrderStatus.delivered && o.reachedAt(s) != null),
        o.status,
      ];
    } else {
      steps = OrderStatus.progress;
    }
    final currentIndex = steps.indexOf(o.status);
    return _card(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _title('Order status'),
        for (var i = 0; i < steps.length; i++)
          _step(
            title: OrderStatus.title(steps[i]),
            time: o.reachedAt(steps[i]),
            done: currentIndex >= 0 ? i <= currentIndex : false,
            current: i == currentIndex,
            last: i == steps.length - 1,
            error: OrderStatus.isCancelled(steps[i]),
          ),
      ]),
    );
  }

  Widget _step({required String title, DateTime? time, required bool done, required bool current, required bool last, bool error = false}) {
    final color = error ? red : (done ? primary : bg2);
    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SizedBox(
          width: 22,
          child: Column(children: [
            Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: done ? color : white,
                shape: BoxShape.circle,
                border: Border.all(color: color, width: 2),
              ),
              child: done ? Icon(error ? Icons.close_rounded : Icons.check_rounded, size: 10, color: white) : null,
            ),
            if (!last) Expanded(child: Container(width: 2, color: done ? color : bg2)),
          ]),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Row(children: [
              Expanded(
                child: Text(title,
                    style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: current ? FontWeight.w700 : FontWeight.w500,
                        color: done ? tColor : grey70)),
              ),
              if (done && time != null) Text(_time(time), style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
            ]),
          ),
        ),
      ]),
    );
  }

  Widget _itemsCard(TrackedOrder o) => _card(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _title([
            if (o.items.isNotEmpty) '${o.items.length} item${o.items.length == 1 ? '' : 's'}',
            if (o.printJobs.isNotEmpty) '${o.printJobs.length} print${o.printJobs.length == 1 ? '' : 's'}',
          ].join(' · ')),
          for (final job in o.printJobs)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(color: bg3, borderRadius: BorderRadius.circular(8), border: Border.all(color: cardBorder)),
                  child: Icon(job.isPdf ? Icons.picture_as_pdf_rounded : Icons.image_outlined,
                      color: job.isPdf ? const Color(0xFFDC2626) : primaryDark, size: 22),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Print: ${job.fileName}',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: tColor)),
                    Text(job.summary, style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
                  ]),
                ),
                Text(_rs(job.lineTotal), style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: tColor)),
              ]),
            ),
          for (final item in o.items)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(children: [
                Container(
                  width: 46,
                  height: 46,
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(color: bg3, borderRadius: BorderRadius.circular(8), border: Border.all(color: cardBorder)),
                  child: item.imageUrl.isNotEmpty
                      ? CustomNetworkImage(url: item.imageUrl, fit: BoxFit.contain)
                      : const Icon(Icons.image_outlined, color: grey70, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(item.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: tColor)),
                    Text('${item.unit.isNotEmpty ? '${item.unit} · ' : ''}Qty ${item.quantity}',
                        style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
                  ]),
                ),
                Text(_rs(item.offerPrice * item.quantity),
                    style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: tColor)),
              ]),
            ),
          if (o.removedItems.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(10)),
              child: Text('Removed by the store (out of stock): ${o.removedItems.join(', ')}',
                  style: GoogleFonts.poppins(fontSize: 12, color: tColor4)),
            ),
        ]),
      );

  Widget _billCard(TrackedOrder o) {
    final String paymentLine;
    if (o.paymentMethod == 'ONLINE') {
      paymentLine = o.paid ? 'Paid online' : 'Online payment pending';
    } else if (o.paymentMethod == 'WALLET') {
      paymentLine = 'Paid from wallet';
    } else {
      paymentLine = o.status == OrderStatus.delivered ? 'Paid on delivery' : 'Pay on delivery (cash / UPI)';
    }
    return _card(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _title('Bill details'),
        _row('Items total', _rs(o.subTotal)),
        if (o.discount > 0) _row('Discount${o.promoCode != null ? ' (${o.promoCode})' : ''}', '-${_rs(o.discount)}', green: true),
        _row('Delivery fee', o.deliveryFee <= 0 ? 'FREE' : _rs(o.deliveryFee), green: o.deliveryFee <= 0),
        if (o.tip > 0) _row('Delivery partner tip', _rs(o.tip)),
        if (o.walletUsed > 0) _row('Paid from wallet', '-${_rs(o.walletUsed)}', green: true),
        const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider(height: 1, color: cardBorder)),
        _row(o.paymentMethod == 'COD' && o.status != OrderStatus.delivered ? 'To pay' : 'Total', _rs(o.grandTotal), bold: true),
        const SizedBox(height: 6),
        Row(children: [
          const Icon(Icons.payments_outlined, size: 16, color: tColor3),
          const SizedBox(width: 6),
          Text(paymentLine, style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
        ]),
      ]),
    );
  }

  Widget _row(String label, String value, {bool green = false, bool bold = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(children: [
          Expanded(
            child: Text(label,
                style: GoogleFonts.poppins(fontSize: bold ? 14.5 : 13, fontWeight: bold ? FontWeight.w700 : FontWeight.w400, color: bold ? tColor : tColor4)),
          ),
          Text(value,
              style: GoogleFonts.poppins(
                  fontSize: bold ? 15 : 13, fontWeight: bold ? FontWeight.w800 : FontWeight.w600, color: green ? primaryDark : tColor)),
        ]),
      );

  Widget _addressCard(TrackedOrder o) => _card(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _title('Delivery address'),
          Text(o.address.isNotEmpty ? o.address : '—', style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4)),
          if (o.instructions.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(spacing: 6, runSpacing: 6, children: [
              for (final i in o.instructions)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: bg3, borderRadius: BorderRadius.circular(20)),
                  child: Text(i, style: GoogleFonts.poppins(fontSize: 11.5, color: tColor4)),
                ),
            ]),
          ],
        ]),
      );

  Widget _actions(TrackedOrder o) {
    final finalStatus = OrderStatus.isFinal(o.status);
    return Column(children: [
      if (finalStatus)
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: primary,
              foregroundColor: white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: _busy ? null : () => _reorder(o),
            icon: const Icon(Icons.replay_rounded),
            label: Text('Order again', style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
          ),
        ),
      const SizedBox(height: 8),
      Row(children: [
        if (!OrderStatus.isCancelled(o.status))
          Expanded(
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(foregroundColor: tColor4, side: const BorderSide(color: cardBorder)),
              onPressed: () => _openInvoice(o),
              icon: const Icon(Icons.receipt_long_outlined, size: 18),
              label: const Text('Invoice'),
            ),
          ),
        if (o.status == OrderStatus.delivered) ...[
          const SizedBox(width: 8),
          Expanded(
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(foregroundColor: tColor4, side: const BorderSide(color: cardBorder)),
              onPressed: () => _rate(o),
              icon: const Icon(Icons.star_outline_rounded, size: 18),
              label: const Text('Rate order'),
            ),
          ),
        ],
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(foregroundColor: tColor4, side: const BorderSide(color: cardBorder)),
            onPressed: _openHelp,
            icon: const Icon(Icons.support_agent_rounded, size: 18),
            label: const Text('Help'),
          ),
        ),
      ]),
    ]);
  }
}
