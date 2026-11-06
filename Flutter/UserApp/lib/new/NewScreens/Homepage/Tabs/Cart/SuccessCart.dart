import 'dart:math' as math;

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/schedule_format.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/OrderDetails.dart';
import 'package:fav_app/new/Services/order_tracking_services.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../../Constants/colors.dart';

const _deep = Color(0xFF14532D);
const _fresh = Color(0xFF16A34A);
const _orange = Color(0xFFF97316);

String _rs(double v) => '${Constants.rupee}${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

/// Shown right after an order is placed: animated check with confetti, a summary of
/// the order (arrival time, amount, items, savings) and a button that opens live
/// tracking by itself after a few seconds unless the customer touches the screen.
class SuccessCart extends StatefulWidget {
  final int? orderId;
  const SuccessCart({super.key, required this.orderId});

  @override
  State<SuccessCart> createState() => _SuccessCartState();
}

class _SuccessCartState extends State<SuccessCart> with TickerProviderStateMixin {
  static const _autoOpen = Duration(seconds: 5);

  final HomeController homeController = Get.find();
  late final AnimationController _intro = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800));
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000));
  late final AnimationController _countdown = AnimationController(vsync: this, duration: _autoOpen);
  final List<_Confetti> _confetti = _Confetti.burst(36);

  TrackedOrder? _order;
  bool _autoStopped = false;
  bool _leaving = false;

  int get _orderId => widget.orderId ?? 0;

  @override
  void initState() {
    super.initState();
    HapticFeedback.mediumImpact();
    _countdown.addStatusListener((s) {
      if (s == AnimationStatus.completed) _track();
    });
    if (_orderId > 0) {
      OrderTrackingServices.fetch(_orderId).then((o) {
        if (mounted && o != null) setState(() => _order = o);
      });
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final calm = MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    if (calm) {
      _intro.value = 1;
      _pulse.stop();
    } else {
      if (_intro.value == 0) _intro.forward();
      if (!_pulse.isAnimating) _pulse.repeat();
    }
    if (_orderId > 0 && !_autoStopped && !_countdown.isAnimating && _countdown.value == 0) _countdown.forward();
  }

  @override
  void dispose() {
    _intro.dispose();
    _pulse.dispose();
    _countdown.dispose();
    super.dispose();
  }

  void _stopAuto() {
    if (_autoStopped || !_countdown.isAnimating) return;
    _countdown.stop();
    setState(() => _autoStopped = true);
  }

  void _track() {
    if (_leaving || !mounted) return;
    if (_orderId <= 0) return _home();
    _leaving = true;
    _countdown.stop();
    homeController.updateTabIndex(0);
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => OrderDetailsScreen(orderNo: _orderId)));
  }

  void _home() {
    if (_leaving || !mounted) return;
    _leaving = true;
    _countdown.stop();
    homeController.updateTabIndex(0);
    Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const Homepage()), (route) => false);
  }

  Animation<double> _step(double from, double to, [Curve curve = Curves.easeOutCubic]) =>
      CurvedAnimation(parent: _intro, curve: Interval(from, to, curve: curve));

  Widget _rise(double from, Widget child) {
    final a = _step(from, math.min(1, from + 0.35));
    return AnimatedBuilder(
      animation: a,
      builder: (_, c) => Opacity(opacity: a.value, child: Transform.translate(offset: Offset(0, 24 * (1 - a.value)), child: c)),
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    // ignore: deprecated_member_use
    return WillPopScope(
      onWillPop: () async {
        _home();
        return false;
      },
      child: Listener(
        onPointerDown: (_) => _stopAuto(),
        child: Scaffold(
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFFDCFCE7), Color(0xFFF0FDF4), Colors.white],
                stops: [0, 0.4, 0.75],
              ),
            ),
            child: SafeArea(
              child: Column(children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                    child: Column(children: [
                      SizedBox(height: 230, child: _badge()),
                      _rise(
                        0.35,
                        Column(children: [
                          Text('Order placed!',
                              style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.w800, color: _deep, height: 1.15)),
                          const SizedBox(height: 6),
                          if (_orderId > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFBBF7D0)),
                              ),
                              child: Text('Order #${_order?.number ?? _orderId}',
                                  style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600, color: _fresh)),
                            ),
                          const SizedBox(height: 10),
                          Text("Thank you for shopping with ClikGett.\nWe're getting your items ready.",
                              textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13.5, color: tColor3, height: 1.45)),
                        ]),
                      ),
                      const SizedBox(height: 22),
                      _rise(0.5, AnimatedSwitcher(duration: const Duration(milliseconds: 350), child: _order == null ? _summarySkeleton() : _summary(_order!))),
                    ]),
                  ),
                ),
                _rise(0.6, _buttons()),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------- badge

  Widget _badge() {
    final pop = _step(0.05, 0.45, Curves.elasticOut);
    final tick = _step(0.3, 0.6);
    final burst = _step(0.15, 1, Curves.easeOut);
    return AnimatedBuilder(
      animation: Listenable.merge([_intro, _pulse]),
      builder: (_, __) => Stack(alignment: Alignment.center, clipBehavior: Clip.none, children: [
        // Ripples spreading out from the badge.
        for (var i = 0; i < 2; i++)
          Builder(builder: (_) {
            final t = (_pulse.value + i * 0.5) % 1;
            return Opacity(
              opacity: (1 - t) * 0.5 * pop.value.clamp(0.0, 1.0),
              child: Container(
                width: 120 + 90 * t,
                height: 120 + 90 * t,
                decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: _fresh.withValues(alpha: 0.5), width: 2)),
              ),
            );
          }),
        Positioned.fill(child: CustomPaint(painter: _ConfettiPainter(_confetti, burst.value))),
        Transform.scale(
          scale: pop.value,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF34D399), _fresh]),
              boxShadow: [BoxShadow(color: _fresh.withValues(alpha: 0.35), blurRadius: 28, offset: const Offset(0, 12))],
            ),
            child: CustomPaint(painter: _CheckPainter(tick.value)),
          ),
        ),
      ]),
    );
  }

  // ---------------------------------------------------------------- summary

  Widget _summaryCard({required Widget child, Key? key}) => Container(
        key: key,
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: cardBorder),
          boxShadow: [BoxShadow(color: _deep.withValues(alpha: 0.06), blurRadius: 24, offset: const Offset(0, 10))],
        ),
        child: child,
      );

  Widget _summarySkeleton() {
    Widget bar(double w) => Container(width: w, height: 12, decoration: BoxDecoration(color: bg3, borderRadius: BorderRadius.circular(6)));
    return _summaryCard(
      key: const ValueKey('skeleton'),
      child: Column(children: [
        for (var i = 0; i < 2; i++) ...[
          if (i > 0) const Divider(height: 26, color: bg2),
          Row(children: [
            Container(width: 42, height: 42, decoration: BoxDecoration(color: bg3, borderRadius: BorderRadius.circular(12))),
            const SizedBox(width: 12),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [bar(150), const SizedBox(height: 8), bar(90)]),
          ]),
        ],
      ]),
    );
  }

  Widget _row(IconData icon, Color tint, Widget title, String subtitle, {Widget? trailing}) => Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(color: tint.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: tint, size: 22),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            title,
            const SizedBox(height: 2),
            Text(subtitle, style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
          ]),
        ),
        if (trailing != null) trailing,
      ]);

  Widget _summary(TrackedOrder o) {
    final strong = GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor);
    Widget when;
    String whenSub;
    if (o.scheduled && o.scheduledAt != null) {
      when = Text('Scheduled delivery', style: strong);
      whenSub = scheduledWhen(o.scheduledAt!);
    } else if (o.estimate != null) {
      when = Text.rich(TextSpan(children: [
        TextSpan(text: 'Arriving by ', style: strong.copyWith(fontWeight: FontWeight.w600)),
        TextSpan(text: DateFormat('h:mm a').format(o.estimate!), style: strong.copyWith(color: _orange, fontWeight: FontWeight.w800)),
      ]));
      final mins = o.etaMinutesLeft;
      whenSub = mins != null && mins > 0 ? 'In about $mins min' : 'Arriving shortly';
    } else {
      when = Text('Arriving soon', style: strong);
      whenSub = "We'll keep you posted at every step";
    }

    final cod = o.paymentMethod == 'COD' && !o.paid;
    final payTitle = o.grandTotal <= 0 ? 'Paid with ClikGett Cash' : cod ? 'Pay ${_rs(o.grandTotal)} on delivery' : 'Paid ${_rs(o.grandTotal)}';
    final paySub = o.grandTotal <= 0
        ? 'Nothing to pay at the door'
        : cod
            ? 'Cash or UPI to the delivery partner'
            : 'Paid online';
    final itemCount = o.items.fold<int>(0, (n, i) => n + i.quantity);

    return _summaryCard(
      key: const ValueKey('summary'),
      child: Column(children: [
        _row(o.scheduled ? Icons.event_available_rounded : Icons.schedule_rounded, _fresh, when, whenSub),
        const Divider(height: 26, color: bg2),
        _row(
          cod ? Icons.payments_outlined : Icons.verified_rounded,
          const Color(0xFF2563EB),
          Text(payTitle, style: strong),
          paySub,
          trailing: itemCount > 0
              ? Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: bg3, borderRadius: BorderRadius.circular(20)),
                  child: Text('$itemCount item${itemCount == 1 ? '' : 's'}',
                      style: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w600, color: tColor4)),
                )
              : null,
        ),
        if (o.savings > 0) ...[
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)]),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(children: [
              const Text('🎉', style: TextStyle(fontSize: 18)),
              const SizedBox(width: 8),
              Expanded(
                child: Text.rich(TextSpan(style: GoogleFonts.poppins(fontSize: 13, color: _deep, fontWeight: FontWeight.w600), children: [
                  const TextSpan(text: 'You saved '),
                  TextSpan(text: _rs(o.savings), style: const TextStyle(fontWeight: FontWeight.w800, color: _fresh)),
                  const TextSpan(text: ' on this order'),
                ])),
              ),
            ]),
          ),
        ],
      ]),
    );
  }

  // ---------------------------------------------------------------- buttons

  Widget _buttons() {
    final canTrack = _orderId > 0;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        if (canTrack)
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Material(
                color: _deep,
                child: InkWell(
                  onTap: _track,
                  child: Stack(children: [
                    // Fills left to right while the screen waits to open tracking.
                    AnimatedBuilder(
                      animation: _countdown,
                      builder: (_, __) => FractionallySizedBox(
                        widthFactor: _autoStopped ? 1 : _countdown.value,
                        heightFactor: 1,
                        child: Container(color: _fresh),
                      ),
                    ),
                    Center(
                      child: AnimatedBuilder(
                        animation: _countdown,
                        builder: (_, __) {
                          final left = (_autoOpen.inSeconds * (1 - _countdown.value)).ceil();
                          return Row(mainAxisSize: MainAxisSize.min, children: [
                            const Icon(Icons.delivery_dining_rounded, color: Colors.white, size: 22),
                            const SizedBox(width: 8),
                            Text(
                              _autoStopped || left <= 0 ? 'Track your order' : 'Track your order · ${left}s',
                              style: GoogleFonts.poppins(fontSize: 15.5, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                          ]);
                        },
                      ),
                    ),
                  ]),
                ),
              ),
            ),
          ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: TextButton(
            onPressed: _home,
            style: TextButton.styleFrom(
              foregroundColor: _deep,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFBBF7D0))),
              backgroundColor: Colors.white,
            ),
            child: Text('Continue shopping', style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w600)),
          ),
        ),
      ]),
    );
  }
}

// ---------------------------------------------------------------- painters

class _CheckPainter extends CustomPainter {
  final double t;
  _CheckPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    if (t <= 0) return;
    final w = size.width;
    final path = Path()
      ..moveTo(w * 0.29, w * 0.52)
      ..lineTo(w * 0.44, w * 0.66)
      ..lineTo(w * 0.72, w * 0.37);
    final metric = path.computeMetrics().first;
    canvas.drawPath(
      metric.extractPath(0, metric.length * t),
      Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = w * 0.085
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(covariant _CheckPainter old) => old.t != t;
}

class _Confetti {
  final double angle;
  final double speed;
  final double spin;
  final double size;
  final Color color;
  final bool round;
  const _Confetti(this.angle, this.speed, this.spin, this.size, this.color, this.round);

  static const _colors = [Color(0xFF16A34A), Color(0xFFF59E0B), Color(0xFFEF4444), Color(0xFF3B82F6), Color(0xFFFDE047), Color(0xFFA855F7)];

  static List<_Confetti> burst(int n) {
    final r = math.Random();
    return List.generate(n, (i) {
      return _Confetti(
        (i / n) * math.pi * 2 + r.nextDouble() * 0.3,
        110 + r.nextDouble() * 70,
        (r.nextDouble() - 0.5) * 12,
        5 + r.nextDouble() * 5,
        _colors[i % _colors.length],
        i % 3 == 0,
      );
    });
  }
}

/// Pieces fly out from the badge, fall a little and fade.
class _ConfettiPainter extends CustomPainter {
  final List<_Confetti> pieces;
  final double t;
  _ConfettiPainter(this.pieces, this.t);

  @override
  void paint(Canvas canvas, Size size) {
    if (t <= 0 || t >= 1) return;
    final c = size.center(Offset.zero);
    final fade = t < 0.7 ? 1.0 : (1 - (t - 0.7) / 0.3);
    for (final p in pieces) {
      final d = p.speed * Curves.easeOutCubic.transform(t);
      final pos = c + Offset(math.cos(p.angle) * d, math.sin(p.angle) * d + 60 * t * t);
      final paint = Paint()..color = p.color.withValues(alpha: fade.clamp(0.0, 1.0));
      canvas.save();
      canvas.translate(pos.dx, pos.dy);
      canvas.rotate(p.spin * t);
      if (p.round) {
        canvas.drawCircle(Offset.zero, p.size / 2, paint);
      } else {
        canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 0.45), const Radius.circular(1.5)), paint);
      }
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter old) => old.t != t;
}
