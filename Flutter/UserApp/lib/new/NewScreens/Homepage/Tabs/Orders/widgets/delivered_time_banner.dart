import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const _green = Color(0xFF16A34A);
const _greenDark = Color(0xFF15803D);
const _ink = Color(0xFF0F172A);
const _orange = Color(0xFFF59E0B);
const _orangeDark = Color(0xFFEA580C);

/// Shown on a delivered order: "Delivered in just 8 mins!" when it arrived by the promised
/// time, or "Delivered in 32 mins · Sorry for the delay!" when it was late.
/// Returns nothing for scheduled orders or when the times are missing.
class DeliveredTimeBanner extends StatefulWidget {
  final DateTime? placedAt;
  final DateTime? deliveredAt;
  final DateTime? promisedBy;
  final bool scheduled;

  const DeliveredTimeBanner({
    super.key,
    required this.placedAt,
    required this.deliveredAt,
    required this.promisedBy,
    this.scheduled = false,
  });

  /// Minutes from order to delivery (at least 1), or null when unknown.
  int? get minutes {
    if (scheduled || placedAt == null || deliveredAt == null) return null;
    final m = deliveredAt!.difference(placedAt!).inSeconds / 60;
    if (m <= 0 || m > 24 * 60) return null;
    return math.max(1, m.round());
  }

  /// Late = delivered more than a minute after the promised time.
  bool get late => promisedBy != null && deliveredAt != null && deliveredAt!.isAfter(promisedBy!.add(const Duration(minutes: 1)));

  @override
  State<DeliveredTimeBanner> createState() => _DeliveredTimeBannerState();
}

class _DeliveredTimeBannerState extends State<DeliveredTimeBanner> with TickerProviderStateMixin {
  late final AnimationController _intro = AnimationController(vsync: this, duration: const Duration(milliseconds: 1300))..forward();
  late final AnimationController _loop = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat();

  @override
  void dispose() {
    _intro.dispose();
    _loop.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mins = widget.minutes;
    if (mins == null) return const SizedBox.shrink();
    final late = widget.late;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: late ? const [Color(0xFFFFF7E6), Color(0xFFFDEBC8)] : const [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
        ),
        border: Border.all(color: late ? const Color(0xFFFCD9A0) : const Color(0xFFBBF7D0)),
      ),
      padding: const EdgeInsets.fromLTRB(10, 14, 14, 14),
      child: Row(children: [
        SizedBox(width: 104, height: 96, child: late ? _stopwatch(mins) : _scooter()),
        Container(width: 1, height: 80, margin: const EdgeInsets.symmetric(horizontal: 10), color: Colors.black.withValues(alpha: 0.08)),
        Expanded(child: late ? _lateText(mins) : _onTimeText(mins)),
      ]),
    );
  }

  Widget _chip() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(color: _green, borderRadius: BorderRadius.circular(20)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.check_rounded, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text('Delivered', style: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w700, color: Colors.white)),
        ]),
      );

  // ---------- On time ----------

  Widget _scooter() {
    final slide = CurvedAnimation(parent: _intro, curve: const Interval(0, 0.7, curve: Curves.easeOutBack));
    return AnimatedBuilder(
      animation: Listenable.merge([_intro, _loop]),
      builder: (_, __) {
        final bob = math.sin(_loop.value * math.pi * 2) * 2.5;
        final dx = (1 - slide.value) * -90;
        return Stack(clipBehavior: Clip.none, children: [
          // Speed lines behind the scooter.
          for (var i = 0; i < 3; i++)
            Positioned(
              left: 2 + dx + ((_loop.value * 18 + i * 6) % 18) * -1 + 6,
              top: 52.0 + i * 9,
              child: Opacity(
                opacity: 0.35 + 0.4 * ((i + _loop.value) % 1),
                child: Container(width: 18 - i * 3.0, height: 3, decoration: BoxDecoration(color: _orange, borderRadius: BorderRadius.circular(2))),
              ),
            ),
          Positioned(
            left: 18 + dx,
            top: 14 + bob,
            child: Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                boxShadow: [BoxShadow(color: _green.withValues(alpha: 0.25), blurRadius: 12, offset: const Offset(0, 4))],
              ),
              child: const Icon(Icons.delivery_dining_rounded, size: 50, color: _green),
            ),
          ),
          // House with a check, bouncing once the scooter arrives.
          Positioned(
            right: -4,
            bottom: 2,
            child: Transform.scale(
              scale: Curves.elasticOut.transform(((_intro.value - 0.55) / 0.45).clamp(0.0, 1.0)),
              child: Stack(clipBehavior: Clip.none, children: [
                const Icon(Icons.house_rounded, size: 30, color: Color(0xFFEF4444)),
                Positioned(
                  right: -4,
                  top: -8 - (math.sin(_loop.value * math.pi * 2).abs() * 3),
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: const BoxDecoration(shape: BoxShape.circle, color: _green),
                    child: const Icon(Icons.check_rounded, size: 12, color: Colors.white),
                  ),
                ),
              ]),
            ),
          ),
        ]);
      },
    );
  }

  Widget _onTimeText(int mins) {
    final pop = CurvedAnimation(parent: _intro, curve: const Interval(0.45, 1, curve: Curves.elasticOut));
    return Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
      _chip(),
      const SizedBox(height: 6),
      Text('Delivered in just', style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: _ink, height: 1.1)),
      const SizedBox(height: 4),
      ScaleTransition(
        scale: pop,
        alignment: Alignment.centerLeft,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 1),
          decoration: BoxDecoration(color: const Color(0xFFFDE047), borderRadius: BorderRadius.circular(10)),
          child: Text('$mins min${mins == 1 ? '' : 's'}!',
              style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: _greenDark, height: 1.2)),
        ),
      ),
      const SizedBox(height: 6),
      Text('Your groceries are at your doorstep.', style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF334155))),
    ]);
  }

  // ---------- Late ----------

  Widget _stopwatch(int mins) {
    final sweep = CurvedAnimation(parent: _intro, curve: const Interval(0, 0.85, curve: Curves.easeOutCubic));
    return AnimatedBuilder(
      animation: Listenable.merge([_intro, _loop]),
      builder: (_, __) {
        final shown = (mins * sweep.value).round();
        final tick = math.sin(_loop.value * math.pi * 2) * 0.05;
        return Stack(clipBehavior: Clip.none, children: [
          Positioned(
            left: 6,
            top: 2,
            child: Transform.rotate(
              angle: tick,
              child: SizedBox(
                width: 84,
                height: 92,
                child: CustomPaint(
                  painter: _StopwatchPainter(sweep.value),
                  child: Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Text('$shown', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: _ink, height: 1)),
                        Text('mins', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w700, fontStyle: FontStyle.italic, color: _ink, height: 1.1)),
                      ]),
                    ),
                  ),
                ),
              ),
            ),
          ),
          // The ClikGett box arriving at the corner.
          Positioned(
            right: -2,
            bottom: -2,
            child: Transform.translate(
              offset: Offset(0, (1 - Curves.easeOutBack.transform(((_intro.value - 0.4) / 0.6).clamp(0.0, 1.0))) * 30),
              child: Container(
                width: 34,
                height: 28,
                decoration: BoxDecoration(
                  color: const Color(0xFFFCD34D),
                  borderRadius: BorderRadius.circular(5),
                  border: Border.all(color: const Color(0xFFD97706)),
                ),
                child: const Icon(Icons.check_circle_rounded, size: 16, color: _green),
              ),
            ),
          ),
        ]);
      },
    );
  }

  Widget _lateText(int mins) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
      _chip(),
      const SizedBox(height: 6),
      Text('Delivered in $mins min${mins == 1 ? '' : 's'}',
          style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: _ink, height: 1.15)),
      const SizedBox(height: 6),
      AnimatedBuilder(
        animation: _loop,
        builder: (_, child) => Transform.scale(
          scale: 1 + math.sin(_loop.value * math.pi * 2) * 0.025,
          alignment: Alignment.centerLeft,
          child: child,
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
          decoration: BoxDecoration(color: const Color(0xFFFED7AA).withValues(alpha: 0.7), borderRadius: BorderRadius.circular(10)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.info_rounded, size: 16, color: _orangeDark),
            const SizedBox(width: 5),
            Text('Sorry for the delay!', style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w700, color: _orangeDark)),
          ]),
        ),
      ),
      const SizedBox(height: 6),
      Text('We appreciate your patience and thank you for shopping with ClikGett.',
          style: GoogleFonts.poppins(fontSize: 11.5, color: const Color(0xFF334155), height: 1.3)),
    ]);
  }
}

/// Orange stopwatch: crown, face, and an arc that fills as the minutes count up.
class _StopwatchPainter extends CustomPainter {
  final double t;
  _StopwatchPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    final r = size.width / 2 - 4;
    final c = Offset(size.width / 2, size.height - r - 4);
    // Crown and side button.
    final crown = Paint()..color = const Color(0xFFF59E0B);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(c.dx, c.dy - r - 7), width: 18, height: 8), const Radius.circular(3)), crown);
    canvas.drawRect(Rect.fromCenter(center: Offset(c.dx, c.dy - r - 2), width: 6, height: 6), crown);
    canvas.save();
    canvas.translate(c.dx, c.dy);
    canvas.rotate(math.pi / 4);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(0, -r - 3), width: 8, height: 7), const Radius.circular(2)), crown);
    canvas.restore();
    // Face.
    canvas.drawCircle(c, r, Paint()..color = const Color(0xFFFFFBEB));
    canvas.drawCircle(c, r, Paint()
      ..color = const Color(0xFFF59E0B)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6);
    // Ticks.
    final tickPaint = Paint()
      ..color = const Color(0xFFFDBA74)
      ..strokeWidth = 2;
    for (var i = 0; i < 12; i++) {
      final a = i * math.pi / 6;
      canvas.drawLine(c + Offset(math.cos(a), math.sin(a)) * (r - 9), c + Offset(math.cos(a), math.sin(a)) * (r - 5), tickPaint);
    }
    // Elapsed arc.
    canvas.drawArc(
      Rect.fromCircle(center: c, radius: r),
      -math.pi / 2,
      math.pi * 2 * t,
      false,
      Paint()
        ..color = const Color(0xFFEA580C)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _StopwatchPainter old) => old.t != t;
}
