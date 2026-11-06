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
/// Without a promised time, anything over [lateAfterMinutes] counts as late.
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

  static const lateAfterMinutes = 30;

  /// "32 mins", "1 hr 15 mins", "5 days".
  static String durationText(int mins) => _duration(mins).text;

  /// Minutes from order to delivery (at least 1), or null when unknown.
  int? get minutes {
    if (scheduled || placedAt == null || deliveredAt == null) return null;
    final m = deliveredAt!.difference(placedAt!).inSeconds / 60;
    if (m <= 0) return null;
    return math.max(1, m.round());
  }

  /// Late = delivered more than a minute after the promised time.
  bool get late {
    final m = minutes;
    if (m == null) return false;
    if (promisedBy == null) return m > lateAfterMinutes;
    return deliveredAt!.isAfter(promisedBy!.add(const Duration(minutes: 1)));
  }

  @override
  State<DeliveredTimeBanner> createState() => _DeliveredTimeBannerState();
}

/// Big number and unit for the stopwatch face, plus the sentence form.
class _Duration {
  final int value;
  final String unit;
  final String text;
  const _Duration(this.value, this.unit, this.text);
}

_Duration _duration(int mins) {
  String plural(int n, String w) => '$n $w${n == 1 ? '' : 's'}';
  if (mins < 60) return _Duration(mins, mins == 1 ? 'min' : 'mins', plural(mins, 'min'));
  if (mins < 24 * 60) {
    final h = mins ~/ 60, m = mins % 60;
    return _Duration(h, h == 1 ? 'hr' : 'hrs', m == 0 ? plural(h, 'hr') : '${plural(h, 'hr')} ${plural(m, 'min')}');
  }
  final d = (mins / (24 * 60)).round();
  return _Duration(d, d == 1 ? 'day' : 'days', plural(d, 'day'));
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
    final enter = CurvedAnimation(parent: _intro, curve: const Interval(0, 0.35, curve: Curves.easeOutCubic));
    final card = Container(
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
      child: Stack(clipBehavior: Clip.none, children: [
        if (late) Positioned(right: -2, top: -6, child: _twinkles()),
        Row(children: [
          SizedBox(width: 104, height: 96, child: late ? _stopwatch(mins) : _scooter()),
          Container(width: 1, height: 80, margin: const EdgeInsets.symmetric(horizontal: 10), color: Colors.black.withValues(alpha: 0.08)),
          Expanded(child: late ? _lateText(mins) : _onTimeText(mins)),
        ]),
      ]),
    );
    return AnimatedBuilder(
      animation: enter,
      child: card,
      builder: (_, child) => Opacity(
        opacity: enter.value,
        child: Transform.translate(offset: Offset(0, 18 * (1 - enter.value)), child: child),
      ),
    );
  }

  /// Fades and slides a line of text in, one after another.
  Widget _rise(double from, Widget child) {
    final a = CurvedAnimation(parent: _intro, curve: Interval(from, math.min(1.0, from + 0.3), curve: Curves.easeOutCubic));
    return AnimatedBuilder(
      animation: a,
      child: child,
      builder: (_, c) => Opacity(opacity: a.value, child: Transform.translate(offset: Offset(14 * (1 - a.value), 0), child: c)),
    );
  }

  /// Three yellow dashes in the corner that flicker in turn.
  Widget _twinkles() {
    return AnimatedBuilder(
      animation: _loop,
      builder: (_, __) => SizedBox(
        width: 30,
        height: 30,
        child: Stack(children: [
          for (var i = 0; i < 3; i++)
            Builder(builder: (_) {
              final phase = (_loop.value + i / 3) % 1;
              final glow = math.sin(phase * math.pi);
              return Positioned(
                left: 6 + i * 7.0,
                top: 14 - i * 6.0,
                child: Opacity(
                  opacity: 0.35 + 0.65 * glow,
                  child: Transform.rotate(
                    angle: -0.9 + i * 0.6,
                    child: Container(
                      width: 4,
                      height: 9 + 4 * glow,
                      decoration: BoxDecoration(color: const Color(0xFFFBBF24), borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                ),
              );
            }),
        ]),
      ),
    );
  }

  Widget _chip() => FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(color: _green, borderRadius: BorderRadius.circular(20)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.check_rounded, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text('Delivered', style: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w700, color: Colors.white)),
        ]),
      ));

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
        final d = _duration(mins);
        final shown = (d.value * sweep.value).round();
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
                  painter: _StopwatchPainter(sweep.value, hand: _intro.value >= 1 ? _loop.value : sweep.value),
                  child: Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Text('$shown', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: _ink, height: 1)),
                        Text(d.unit, style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w700, fontStyle: FontStyle.italic, color: _ink, height: 1.1)),
                      ]),
                    ),
                  ),
                ),
              ),
            ),
          ),
          // Orange sparks bursting from the stopwatch, as if it's ringing.
          for (var i = 0; i < 4; i++)
            Builder(builder: (_) {
              final phase = (_loop.value * 1.5 + i * 0.25) % 1;
              final a = -math.pi * 0.95 + i * 0.3 + (i > 1 ? math.pi * 0.55 : 0);
              final r = 46 + 8 * phase;
              return Positioned(
                left: 48 + math.cos(a) * r - 2,
                top: 56 + math.sin(a) * r - 5,
                child: Opacity(
                  opacity: ((1 - phase) * sweep.value).clamp(0.0, 1.0),
                  child: Transform.rotate(
                    angle: a + math.pi / 2,
                    child: Container(width: 3.5, height: 9, decoration: BoxDecoration(color: _orangeDark, borderRadius: BorderRadius.circular(2))),
                  ),
                ),
              );
            }),
          // The ClikGett box arriving at the corner, then hopping.
          Positioned(
            right: -2,
            bottom: -2,
            child: Transform.translate(
              offset: Offset(
                  0,
                  (1 - Curves.easeOutBack.transform(((_intro.value - 0.4) / 0.6).clamp(0.0, 1.0))) * 30 -
                      (_intro.value >= 1 ? math.max(0.0, math.sin(_loop.value * math.pi * 2)) * 4 : 0)),
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
      _rise(0.15, _chip()),
      const SizedBox(height: 6),
      _rise(0.25, Text('Delivered in ${_duration(mins).text}',
          style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: _ink, height: 1.15))),
      const SizedBox(height: 6),
      _rise(0.4, FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: AnimatedBuilder(
        animation: _loop,
        builder: (_, child) => Transform.scale(
          scale: 1 + math.sin(_loop.value * math.pi * 2) * 0.04,
          alignment: Alignment.centerLeft,
          child: Stack(children: [
            child!,
            // Light sweeping across the pill.
            Positioned.fill(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: FractionalTranslation(
                  translation: Offset(-1.2 + 2.4 * _loop.value, 0),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [
                        Colors.white.withValues(alpha: 0),
                        Colors.white.withValues(alpha: 0.6),
                        Colors.white.withValues(alpha: 0),
                      ], stops: const [0.35, 0.5, 0.65]),
                    ),
                  ),
                ),
              ),
            ),
          ]),
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
      ))),
      const SizedBox(height: 6),
      _rise(0.55, Text('We appreciate your patience and thank you for shopping with ClikGett.',
          style: GoogleFonts.poppins(fontSize: 11.5, color: const Color(0xFF334155), height: 1.3))),
    ]);
  }
}

/// Orange stopwatch: crown, face, and an arc that fills as the minutes count up.
class _StopwatchPainter extends CustomPainter {
  final double t;
  final double hand;
  _StopwatchPainter(this.t, {this.hand = 0});

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
    // Second hand, drawn faintly behind the numbers.
    final a = -math.pi / 2 + hand * math.pi * 2;
    final handPaint = Paint()
      ..color = const Color(0xFFEA580C).withValues(alpha: 0.35)
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(c, c + Offset(math.cos(a), math.sin(a)) * (r - 12), handPaint);
    canvas.drawCircle(c, 3, handPaint);
  }

  @override
  bool shouldRepaint(covariant _StopwatchPainter old) => old.t != t || old.hand != hand;
}
