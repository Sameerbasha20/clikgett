import 'dart:math' as math;

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const _deep = Color(0xFF14532D);
const _fresh = Color(0xFF16A34A);
const _ink = Color(0xFF0F172A);

String _rs(double v) => '${Constants.rupee}${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

/// ClikGett Cash balance: green card with drifting waves, a wallet with popping coins,
/// and the amount counting up.
class WalletBalanceCard extends StatefulWidget {
  final double balance;
  const WalletBalanceCard({super.key, required this.balance});

  @override
  State<WalletBalanceCard> createState() => _WalletBalanceCardState();
}

class _WalletBalanceCardState extends State<WalletBalanceCard> with SingleTickerProviderStateMixin {
  late final AnimationController _loop = AnimationController(vsync: this, duration: const Duration(seconds: 6));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.maybeOf(context)?.disableAnimations ?? false) {
      _loop.stop();
    } else if (!_loop.isAnimating) {
      _loop.repeat();
    }
  }

  @override
  void dispose() {
    _loop.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: _balance(),
    );
  }

  Widget _balance() {
    return Container(
      height: 170,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF14532D), Color(0xFF15803D), Color(0xFF22C55E)],
        ),
        boxShadow: [BoxShadow(color: _fresh.withValues(alpha: 0.3), blurRadius: 22, offset: const Offset(0, 10))],
      ),
      child: AnimatedBuilder(
        animation: _loop,
        builder: (_, __) {
          final t = _loop.value;
          return Stack(children: [
            Positioned.fill(child: CustomPaint(painter: _WavesPainter(t))),
            // Wallet with coins, gently floating.
            Positioned(
              left: 14,
              top: 50 + math.sin(t * math.pi * 2) * 4,
              child: _Wallet(t: t),
            ),
            Positioned.fill(
              left: 96,
              right: 16,
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  _sparkle(t, mirror: false),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text('Available Balance',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                  const SizedBox(width: 8),
                  _sparkle(t, mirror: true),
                ]),
                const SizedBox(height: 12),
                Container(
                  constraints: const BoxConstraints(minWidth: 130),
                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 14, offset: const Offset(0, 6))],
                  ),
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: widget.balance),
                    duration: const Duration(milliseconds: 900),
                    curve: Curves.easeOutCubic,
                    builder: (_, v, __) => FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(_rs(v == widget.balance ? v : v.roundToDouble()),
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(fontSize: 32, fontWeight: FontWeight.w800, color: _ink, height: 1.2)),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text('ClikGett Cash', style: GoogleFonts.poppins(fontSize: 11.5, color: Colors.white.withValues(alpha: 0.8))),
              ]),
            ),
          ]);
        },
      ),
    );
  }

  /// Two yellow dashes that flicker beside the title.
  Widget _sparkle(double t, {required bool mirror}) {
    final glow = 0.5 + 0.5 * math.sin((t * 4 + (mirror ? 0.5 : 0)) * math.pi * 2);
    return Transform(
      alignment: Alignment.center,
      transform: Matrix4.identity()..scale(mirror ? -1.0 : 1.0, 1.0),
      child: Opacity(
        opacity: 0.45 + 0.55 * glow,
        child: SizedBox(
          width: 16,
          height: 18,
          child: Stack(children: [
            Positioned(left: 2, top: 2, child: Transform.rotate(angle: -0.6, child: _dash(8 + 3 * glow))),
            Positioned(left: 4, bottom: 2, child: Transform.rotate(angle: 0.4, child: _dash(7 + 2 * glow))),
          ]),
        ),
      ),
    );
  }

  Widget _dash(double h) => Container(
      width: 3.5, height: h, decoration: BoxDecoration(color: const Color(0xFFFACC15), borderRadius: BorderRadius.circular(2)));
}

/// White wallet with a clasp and two gold ₹ coins bobbing out of it.
class _Wallet extends StatelessWidget {
  final double t;
  const _Wallet({required this.t});

  @override
  Widget build(BuildContext context) {
    Widget coin(double phase) {
      final lift = math.max(0.0, math.sin((t * 2 + phase) * math.pi * 2)) * 6;
      return Transform.translate(
        offset: Offset(0, -lift),
        child: Container(
          width: 26,
          height: 26,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFFDE047), Color(0xFFEAB308)]),
            border: Border.all(color: const Color(0xFFCA8A04), width: 1.2),
          ),
          child: Text('₹', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w800, color: const Color(0xFF854D0E))),
        ),
      );
    }

    return SizedBox(
      width: 76,
      height: 74,
      child: Stack(clipBehavior: Clip.none, children: [
        Positioned(left: 8, top: 0, child: coin(0)),
        Positioned(left: 28, top: -6, child: coin(0.35)),
        Positioned(
          left: 0,
          top: 16,
          child: Container(
            width: 70,
            height: 54,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Colors.white, Color(0xFFDCFCE7)]),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 12, offset: const Offset(0, 6))],
            ),
          ),
        ),
        // Clasp.
        Positioned(
          right: -2,
          top: 32,
          child: Container(
            width: 24,
            height: 20,
            decoration: BoxDecoration(color: _fresh, borderRadius: BorderRadius.circular(7)),
            alignment: Alignment.center,
            child: Container(width: 7, height: 7, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
          ),
        ),
      ]),
    );
  }
}

/// Two soft waves drifting along the bottom of the card.
class _WavesPainter extends CustomPainter {
  final double t;
  _WavesPainter(this.t);

  Path _wave(Size s, double base, double amp, double phase) {
    final p = Path()..moveTo(0, s.height);
    for (double x = 0; x <= s.width; x += 6) {
      p.lineTo(x, base + math.sin((x / s.width * 2 * math.pi) + phase) * amp);
    }
    return p
      ..lineTo(s.width, s.height)
      ..close();
  }

  @override
  void paint(Canvas canvas, Size size) {
    final a = t * 2 * math.pi;
    canvas.drawPath(_wave(size, size.height * 0.72, 10, a), Paint()..color = Colors.white.withValues(alpha: 0.08));
    canvas.drawPath(_wave(size, size.height * 0.8, 8, -a + 1.5), Paint()..color = const Color(0xFF4ADE80).withValues(alpha: 0.18));
    // Soft glow in the top-right corner.
    canvas.drawCircle(Offset(size.width * 0.92, size.height * 0.05), size.height * 0.55,
        Paint()..color = Colors.white.withValues(alpha: 0.07));
  }

  @override
  bool shouldRepaint(covariant _WavesPainter old) => old.t != t;
}
