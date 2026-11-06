import 'dart:math' as math;

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const _deep = Color(0xFF14532D);
const _fresh = Color(0xFF16A34A);
const _ink = Color(0xFF0F172A);

String _rs(double v) => '${Constants.rupee}${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

/// ClikGett Cash balance: green card with drifting waves, a wallet with popping coins,
/// the amount counting up, and two tiles explaining how the cash is used.
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
      child: Column(children: [
        _balance(),
        const SizedBox(height: 10),
        _features(context),
      ]),
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

  Widget _features(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: IntrinsicHeight(
        child: Row(children: [
          Expanded(
            child: _FeatureTile(
              icon: Icons.touch_app_rounded,
              top: 'One-Tap',
              bottom: 'Payment',
              tint: _fresh,
              dark: _deep,
              bg: const [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
              onTap: () => _explain(context, '👆', 'One-tap payment',
                  'Use your ClikGett Cash at checkout with one tap. No UPI app, no card, no waiting. If your cash covers the order, there is nothing to pay at the door.'),
            ),
          ),
          Container(width: 1, margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 10), color: const Color(0xFFCBD5E1)),
          Expanded(
            child: _FeatureTile(
              icon: Icons.currency_exchange_rounded,
              top: 'Instant',
              bottom: 'Refund',
              tint: const Color(0xFFEA580C),
              dark: const Color(0xFF9A3412),
              bg: const [Color(0xFFFFF7ED), Color(0xFFFFEDD5)],
              onTap: () => _explain(context, '⚡', 'Instant refunds',
                  'When an order is cancelled or an item is removed, the money comes back to your ClikGett Cash straight away, ready for your next order.'),
            ),
          ),
        ]),
      ),
    );
  }

  void _explain(BuildContext context, String emoji, String title, String body) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 18),
            Text(emoji, style: const TextStyle(fontSize: 40)),
            const SizedBox(height: 8),
            Text(title, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: _ink)),
            const SizedBox(height: 6),
            Text(body, textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13.5, color: const Color(0xFF475569), height: 1.5)),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _fresh,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text('Got it', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  final IconData icon;
  final String top;
  final String bottom;
  final Color tint;
  final Color dark;
  final List<Color> bg;
  final VoidCallback onTap;
  const _FeatureTile(
      {required this.icon, required this.top, required this.bottom, required this.tint, required this.dark, required this.bg, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.fromLTRB(10, 12, 8, 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: bg),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: tint.withValues(alpha: 0.25)),
          ),
          child: Row(children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [tint.withValues(alpha: 0.85), tint]),
                boxShadow: [BoxShadow(color: tint.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))],
              ),
              child: Icon(icon, color: Colors.white, size: 21),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(top, style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w600, color: _ink, height: 1.15)),
                  Text(bottom, style: GoogleFonts.poppins(fontSize: 15.5, fontWeight: FontWeight.w800, color: dark, height: 1.15)),
                ]),
              ),
            ),
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.8), shape: BoxShape.circle),
              child: Icon(Icons.chevron_right_rounded, size: 18, color: dark),
            ),
          ]),
        ),
      ),
    );
  }
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
