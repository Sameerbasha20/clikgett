import 'dart:math' as math;

import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Services/order_tracking_services.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

// Live order tracking: status hero, animated delivery route and a horizontal stepper.
// Animations stop when the phone has "remove animations" on.

const _deep = Color(0xFF14532D);
const _fresh = Color(0xFF16A34A);
const _mint = Color(0xFFDCFCE7);
const _orange = Color(0xFFF97316);

bool _calm(BuildContext context) => MediaQuery.maybeOf(context)?.disableAnimations ?? false;

String _hm(DateTime t) => DateFormat('h:mm a').format(t.toLocal());

/// Illustration for each step.
String _emoji(int status) {
  switch (status) {
    case OrderStatus.received:
      return '🧾';
    case OrderStatus.packing:
      return '📦';
    case OrderStatus.assigned:
      return '🧑‍🔧';
    case OrderStatus.outForDelivery:
      return '🛵';
    case OrderStatus.arrived:
      return '🏠';
    case OrderStatus.delivered:
      return '✅';
  }
  return '🛒';
}

String _heroSubtitle(int status) {
  switch (status) {
    case OrderStatus.received:
      return 'The store has your order';
    case OrderStatus.packing:
      return "We're preparing your items";
    case OrderStatus.assigned:
      return 'Your delivery partner is on the way to the store';
    case OrderStatus.outForDelivery:
      return 'Your order is on the way';
    case OrderStatus.arrived:
      return 'Your delivery partner is at your door';
    case OrderStatus.delivered:
      return 'Enjoy! Thanks for shopping with ClikGett';
  }
  return '';
}

// ======================================================================== hero

/// Big status card: bouncing illustration, title, step progress and arrival time.
class OrderHeroCard extends StatefulWidget {
  final TrackedOrder order;
  const OrderHeroCard({super.key, required this.order});

  @override
  State<OrderHeroCard> createState() => _OrderHeroCardState();
}

class _OrderHeroCardState extends State<OrderHeroCard> with SingleTickerProviderStateMixin {
  late final AnimationController _bob = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_calm(context)) {
      _bob.stop();
    } else if (!_bob.isAnimating) {
      _bob.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _bob.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final steps = OrderStatus.progress;
    final index = steps.indexOf(o.status);
    final step = index < 0 ? 1 : index + 1;
    final delivered = o.status == OrderStatus.delivered;
    final eta = o.estimate;
    final mins = o.etaMinutesLeft;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)]),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Row(children: [
        // Illustration with a soft halo, gently bobbing.
        AnimatedBuilder(
          animation: _bob,
          builder: (_, child) {
            final t = Curves.easeInOut.transform(_bob.value);
            return Transform.translate(offset: Offset(0, -4 * t), child: Transform.rotate(angle: (t - 0.5) * 0.06, child: child));
          },
          child: Container(
            width: 84,
            height: 84,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(colors: [Colors.white, _mint.withOpacity(0.9)]),
              boxShadow: [BoxShadow(color: _fresh.withOpacity(0.18), blurRadius: 18, offset: const Offset(0, 6))],
            ),
            alignment: Alignment.center,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 400),
              transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
              child: Text(_emoji(o.status), key: ValueKey(o.status), style: const TextStyle(fontSize: 44)),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(OrderStatus.title(o.status),
                style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w800, color: _deep, height: 1.2)),
            const SizedBox(height: 2),
            Text(_heroSubtitle(o.status), style: GoogleFonts.poppins(fontSize: 12.5, color: tColor3)),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: step / steps.length),
                    duration: Duration(milliseconds: _calm(context) ? 0 : 900),
                    curve: Curves.easeOutCubic,
                    builder: (_, v, __) => LinearProgressIndicator(
                      value: v,
                      minHeight: 9,
                      backgroundColor: Colors.white,
                      color: _fresh,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text('$step/${steps.length}', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w800, color: _deep)),
            ]),
            if (!delivered && eta != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.85), borderRadius: BorderRadius.circular(12)),
                child: Row(children: [
                  const Icon(Icons.schedule_rounded, size: 17, color: _fresh),
                  const SizedBox(width: 6),
                  Text('Arriving by ', style: GoogleFonts.poppins(fontSize: 12.5, color: tColor)),
                  Text(_hm(eta), style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w800, color: _orange)),
                  const Spacer(),
                  if (mins != null && mins > 0)
                    Text('~$mins min', style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
                ]),
              ),
            ],
            if (delivered && o.deliveredAt != null) ...[
              const SizedBox(height: 8),
              Text('Delivered at ${_hm(o.deliveredAt!)}',
                  style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w700, color: _fresh)),
            ],
          ]),
        ),
      ]),
    );
  }
}

// ======================================================================== route

/// Store → dashed road → home, with the scooter where the order really is.
class DeliveryRouteCard extends StatefulWidget {
  final TrackedOrder order;
  const DeliveryRouteCard({super.key, required this.order});

  @override
  State<DeliveryRouteCard> createState() => _DeliveryRouteCardState();
}

class _DeliveryRouteCardState extends State<DeliveryRouteCard> with SingleTickerProviderStateMixin {
  // Drives the bob of the scooter and the moving dashes on the road.
  late final AnimationController _tick = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_calm(context)) {
      _tick.stop();
    } else if (!_tick.isAnimating) {
      _tick.repeat();
    }
  }

  @override
  void dispose() {
    _tick.dispose();
    super.dispose();
  }

  /// 0 = at the store, 1 = at the door.
  double _position(TrackedOrder o) {
    switch (o.status) {
      case OrderStatus.received:
      case OrderStatus.packing:
        return 0.0;
      case OrderStatus.assigned:
        return 0.08;
      case OrderStatus.outForDelivery:
        // Without live GPS, move by time left (a typical run is ~15 min).
        final left = (o.etaMinutesLeft ?? 10).clamp(0, 15);
        return (0.18 + 0.72 * (1 - left / 15)).clamp(0.18, 0.9);
      case OrderStatus.arrived:
      case OrderStatus.delivered:
        return 1.0;
    }
    return 0.0;
  }

  static Offset _bezier(Size s, double t) {
    // Start at the store, bow upwards, end at the home.
    final p0 = Offset(s.width * 0.14, s.height * 0.62);
    final p1 = Offset(s.width * 0.50, s.height * 0.05);
    final p2 = Offset(s.width * 0.86, s.height * 0.62);
    final u = 1 - t;
    return Offset(
      u * u * p0.dx + 2 * u * t * p1.dx + t * t * p2.dx,
      u * u * p0.dy + 2 * u * t * p1.dy + t * t * p2.dy,
    );
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final moving = o.status == OrderStatus.outForDelivery || o.status == OrderStatus.assigned;
    final atDoor = o.status == OrderStatus.arrived || o.status == OrderStatus.delivered;
    final mins = o.etaMinutesLeft;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      height: 158,
      decoration: BoxDecoration(
        color: const Color(0xFFF3F6F4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardBorder),
      ),
      clipBehavior: Clip.antiAlias,
      child: LayoutBuilder(builder: (context, box) {
        final size = Size(box.maxWidth, box.maxHeight);
        return TweenAnimationBuilder<double>(
          tween: Tween(end: _position(o)),
          duration: Duration(milliseconds: _calm(context) ? 0 : 1400),
          curve: Curves.easeInOutCubic,
          builder: (context, t, _) {
            final rider = _bezier(size, t);
            return AnimatedBuilder(
              animation: _tick,
              builder: (context, _) {
                final phase = _tick.value;
                final bob = moving ? math.sin(phase * math.pi * 2) * 2.5 : 0.0;
                return Stack(children: [
                  Positioned.fill(child: CustomPaint(painter: _RoutePainter(progress: t, dashPhase: moving ? phase : 0))),
                  // Store
                  Positioned(
                    left: size.width * 0.14 - 30,
                    top: size.height * 0.62 - 54,
                    child: const _Place(emoji: '🏪', label: 'ClikGett Store'),
                  ),
                  // Home
                  Positioned(
                    left: size.width * 0.86 - 30,
                    top: size.height * 0.62 - 54,
                    child: _Place(emoji: '🏡', label: 'You', pin: !atDoor),
                  ),
                  // Scooter (emoji faces left, so mirror it to ride right).
                  if (o.status != OrderStatus.delivered)
                    Positioned(
                      left: rider.dx - 22,
                      top: rider.dy - 40 + bob,
                      child: Transform(
                        alignment: Alignment.center,
                        transform: Matrix4.identity()..scale(-1.0, 1.0),
                        child: const Text('🛵', style: TextStyle(fontSize: 34)),
                      ),
                    ),
                  if (moving && mins != null && mins > 0)
                    Positioned(
                      left: (rider.dx - 52).clamp(8.0, size.width - 112),
                      top: (rider.dy - 78).clamp(4.0, size.height),
                      child: _Bubble(text: 'Arriving in $mins min'),
                    ),
                  if (o.status == OrderStatus.packing || o.status == OrderStatus.received)
                    Positioned(
                      left: size.width * 0.5 - 70,
                      bottom: 10,
                      child: _Bubble(text: o.status == OrderStatus.packing ? 'Packing at the store' : 'Order received'),
                    ),
                ]);
              },
            );
          },
        );
      }),
    );
  }
}

class _Place extends StatelessWidget {
  final String emoji;
  final String label;
  final bool pin;
  const _Place({required this.emoji, required this.label, this.pin = false});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 60,
      child: Column(children: [
        if (pin) const Icon(Icons.location_on_rounded, color: Color(0xFFEF4444), size: 18) else const SizedBox(height: 18),
        Text(emoji, style: const TextStyle(fontSize: 30, height: 1.1)),
        const SizedBox(height: 22),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: white,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 6, offset: const Offset(0, 2))],
          ),
          child: Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(fontSize: 9.5, fontWeight: FontWeight.w600, color: tColor)),
        ),
      ]),
    );
  }
}

class _Bubble extends StatelessWidget {
  final String text;
  const _Bubble({required this.text});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: Text(text, style: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w700, color: tColor)),
      );
}

/// Light "map": soft blocks and streets, plus the dashed road (done part solid green).
class _RoutePainter extends CustomPainter {
  final double progress;
  final double dashPhase;
  _RoutePainter({required this.progress, required this.dashPhase});

  @override
  void paint(Canvas canvas, Size size) {
    final street = Paint()
      ..color = Colors.white
      ..strokeWidth = 7
      ..strokeCap = StrokeCap.round;
    for (final y in [0.25, 0.85]) {
      canvas.drawLine(Offset(0, size.height * y), Offset(size.width, size.height * (y + 0.06)), street);
    }
    for (final x in [0.3, 0.68]) {
      canvas.drawLine(Offset(size.width * x, 0), Offset(size.width * (x - 0.05), size.height), street);
    }
    final park = Paint()..color = const Color(0xFFDDEFE2);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.36, size.height * 0.5, 54, 34), const Radius.circular(8)), park);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.72, size.height * 0.05, 46, 30), const Radius.circular(8)), park);

    final path = Path();
    const steps = 60;
    for (var i = 0; i <= steps; i++) {
      final p = _DeliveryRouteCardState._bezier(size, i / steps);
      i == 0 ? path.moveTo(p.dx, p.dy) : path.lineTo(p.dx, p.dy);
    }
    final metric = path.computeMetrics().first;
    final doneLength = metric.length * progress;

    // Travelled part: solid.
    if (doneLength > 0) {
      canvas.drawPath(
        metric.extractPath(0, doneLength),
        Paint()
          ..color = _fresh
          ..strokeWidth = 4
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round,
      );
    }
    // Remaining part: dashes that drift towards home.
    const dash = 9.0, gap = 7.0;
    final dashPaint = Paint()
      ..color = _fresh.withOpacity(0.55)
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    var d = doneLength + dashPhase * (dash + gap);
    while (d < metric.length) {
      canvas.drawPath(metric.extractPath(d, math.min(d + dash, metric.length)), dashPaint);
      d += dash + gap;
    }
    // Start and end dots.
    for (final t in [0.0, 1.0]) {
      final p = _DeliveryRouteCardState._bezier(size, t);
      canvas.drawCircle(p, 7, Paint()..color = white);
      canvas.drawCircle(p, 7, Paint()
        ..color = _fresh
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3);
    }
  }

  @override
  bool shouldRepaint(_RoutePainter old) => old.progress != progress || old.dashPhase != dashPhase;
}

// ======================================================================== stepper

/// Six steps across: done (green check), current (pulsing), next (grey).
class OrderStepper extends StatefulWidget {
  final TrackedOrder order;
  const OrderStepper({super.key, required this.order});

  @override
  State<OrderStepper> createState() => _OrderStepperState();
}

class _OrderStepperState extends State<OrderStepper> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1300));

  static const _labels = {
    OrderStatus.received: 'Order\nplaced',
    OrderStatus.packing: 'Packing\nyour order',
    OrderStatus.assigned: 'Partner\nassigned',
    OrderStatus.outForDelivery: 'Out for\ndelivery',
    OrderStatus.arrived: 'At your\ndoorstep',
    OrderStatus.delivered: 'Delivered',
  };

  static const _icons = {
    OrderStatus.received: Icons.receipt_long_rounded,
    OrderStatus.packing: Icons.inventory_2_rounded,
    OrderStatus.assigned: Icons.person_rounded,
    OrderStatus.outForDelivery: Icons.delivery_dining_rounded,
    OrderStatus.arrived: Icons.home_rounded,
    OrderStatus.delivered: Icons.check_rounded,
  };

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_calm(context)) {
      _pulse.stop();
    } else if (!_pulse.isAnimating) {
      _pulse.repeat();
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final steps = OrderStatus.progress;
    final current = steps.indexOf(o.status);
    final finished = o.status == OrderStatus.delivered;

    return Column(children: [
      // Circles and connectors.
      SizedBox(
        height: 46,
        child: LayoutBuilder(builder: (context, box) {
          final slot = box.maxWidth / steps.length;
          return Stack(alignment: Alignment.centerLeft, children: [
            // Grey track, then the green part animating in.
            Positioned(
              left: slot / 2,
              right: slot / 2,
              child: Container(height: 4, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2))),
            ),
            Positioned(
              left: slot / 2,
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: current <= 0 ? 0 : slot * current),
                duration: Duration(milliseconds: _calm(context) ? 0 : 900),
                curve: Curves.easeOutCubic,
                builder: (_, w, __) => Container(height: 4, width: w, decoration: BoxDecoration(color: _fresh, borderRadius: BorderRadius.circular(2))),
              ),
            ),
            Row(children: [
              for (var i = 0; i < steps.length; i++)
                SizedBox(width: slot, child: Center(child: _dot(steps[i], i, current, finished))),
            ]),
          ]);
        }),
      ),
      const SizedBox(height: 6),
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        for (var i = 0; i < steps.length; i++)
          Expanded(
            child: Column(children: [
              Text(_labels[steps[i]]!,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 10.5,
                    height: 1.25,
                    fontWeight: i == current ? FontWeight.w700 : FontWeight.w500,
                    color: i == current ? _deep : (i < current ? tColor : grey70),
                  )),
              if (i < current || (i == current && finished))
                Text(o.reachedAt(steps[i]) != null ? _hm(o.reachedAt(steps[i])!) : '',
                    style: GoogleFonts.poppins(fontSize: 9.5, color: tColor3))
              else if (i == current)
                Text('In progress', style: GoogleFonts.poppins(fontSize: 9.5, fontWeight: FontWeight.w600, color: _fresh)),
            ]),
          ),
      ]),
    ]);
  }

  Widget _dot(int status, int i, int current, bool finished) {
    final done = i < current || (finished && i == current);
    final isCurrent = i == current && !finished;
    if (done) {
      return Container(
        width: 30,
        height: 30,
        decoration: const BoxDecoration(color: _fresh, shape: BoxShape.circle),
        child: const Icon(Icons.check_rounded, color: white, size: 18),
      );
    }
    if (isCurrent) {
      return AnimatedBuilder(
        animation: _pulse,
        builder: (_, child) {
          final v = _pulse.value;
          return Stack(alignment: Alignment.center, children: [
            // Expanding ring.
            Container(
              width: 34 + 12 * v,
              height: 34 + 12 * v,
              decoration: BoxDecoration(shape: BoxShape.circle, color: _fresh.withOpacity(0.28 * (1 - v))),
            ),
            child!,
          ]);
        },
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(colors: [_fresh, _deep]),
            boxShadow: [BoxShadow(color: _fresh.withOpacity(0.4), blurRadius: 10)],
          ),
          child: Icon(_icons[status], color: white, size: 19),
        ),
      );
    }
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(color: white, shape: BoxShape.circle, border: Border.all(color: const Color(0xFFE2E8F0), width: 2)),
      child: Icon(_icons[status], color: const Color(0xFF94A3B8), size: 16),
    );
  }
}
