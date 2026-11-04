import 'package:fav_app/new/Services/promotions_service.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const _deep = Color(0xFF064E3B);
const _teal = Color(0xFF0F766E);
const _mint = Color(0xFFECFDF5);
const _gold = Color(0xFFF59E0B);
const _goldLight = Color(0xFFFDE68A);
const _ink = Color(0xFF065F46);

String _rs(double v) => '₹${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';
String _ordinal(int n) {
  if (n % 100 >= 11 && n % 100 <= 13) return '${n}th';
  return '$n${['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][n % 10]}';
}

/// Home card: "Welcome offer for you!" with ₹ off the 1st, 2nd, 3rd... order.
/// Orders already placed are ticked; the next one pulses. Hidden when the offer is off
/// or the customer has used every step.
class WelcomeOfferCard extends StatefulWidget {
  const WelcomeOfferCard({super.key});

  @override
  State<WelcomeOfferCard> createState() => WelcomeOfferCardState();
}

class WelcomeOfferCardState extends State<WelcomeOfferCard> with TickerProviderStateMixin {
  WelcomeOfferInfo? _offer;
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))
    ..repeat(reverse: true);
  late final AnimationController _fill = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));

  @override
  void initState() {
    super.initState();
    reload();
  }

  /// Called by the home screen on pull-to-refresh.
  Future<void> reload() async {
    final offer = await PromotionsService.welcome();
    if (!mounted) return;
    setState(() => _offer = offer);
    _fill.forward(from: 0);
  }

  @override
  void dispose() {
    _pulse.dispose();
    _fill.dispose();
    super.dispose();
  }

  void _showTerms(WelcomeOfferInfo o) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(18))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Welcome offer · terms', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          for (final line in [
            for (var i = 0; i < o.steps.length; i++) '${_rs(o.steps[i])} off your ${_ordinal(i + 1)} order.',
            'Applies by itself at checkout when your items total is ${_rs(o.minOrderValue)} or more.',
            'Cancelled orders don\'t count; you get that discount again on your next order.',
            'Cannot be exchanged for cash. ClikGett may change or end the offer.',
          ])
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('•  '),
                Expanded(child: Text(line, style: GoogleFonts.poppins(fontSize: 13, color: Colors.black87))),
              ]),
            ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final o = _offer;
    if (o == null || !o.active || o.steps.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [_deep, _teal]),
          boxShadow: [BoxShadow(color: _teal.withValues(alpha: 0.3), blurRadius: 14, offset: const Offset(0, 6))],
        ),
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(o.title, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w800, color: _goldLight)),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(color: _mint, borderRadius: BorderRadius.circular(14)),
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
            child: LayoutBuilder(builder: (_, box) {
              final n = o.steps.length;
              final stepWidth = n <= 4 ? box.maxWidth / n : 88.0;
              final track = _track(o, stepWidth);
              return n <= 4 ? track : SingleChildScrollView(scrollDirection: Axis.horizontal, child: track);
            }),
          ),
          const SizedBox(height: 8),
          Center(
            child: GestureDetector(
              onTap: () => _showTerms(o),
              child: Text.rich(TextSpan(children: [
                TextSpan(text: 'Shop for ${_rs(o.minOrderValue)} or more  •  '),
                const TextSpan(text: 'T&C', style: TextStyle(decoration: TextDecoration.underline)),
              ]), style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _track(WelcomeOfferInfo o, double stepWidth) {
    final n = o.steps.length;
    final done = o.ordersPlaced.clamp(0, n);
    const node = 38.0;
    return SizedBox(
      width: stepWidth * n,
      child: Stack(children: [
        // Line through the nodes; the gold part grows up to the next order.
        if (n > 1)
          Positioned(
            left: stepWidth / 2,
            right: stepWidth / 2,
            top: 20 + node / 2 - 3,
            child: Container(height: 6, decoration: BoxDecoration(color: _goldLight, borderRadius: BorderRadius.circular(4))),
          ),
        if (n > 1 && done > 0)
          AnimatedBuilder(
            animation: _fill,
            builder: (_, __) => Positioned(
              left: stepWidth / 2,
              top: 20 + node / 2 - 3,
              child: Container(
                height: 6,
                width: stepWidth * (done.clamp(0, n - 1)) * Curves.easeOutCubic.transform(_fill.value),
                decoration: BoxDecoration(color: _gold, borderRadius: BorderRadius.circular(4)),
              ),
            ),
          ),
        Row(children: [
          for (var i = 0; i < n; i++)
            SizedBox(
              width: stepWidth,
              child: Column(children: [
                SizedBox(
                  height: 20,
                  child: Text('${_ordinal(i + 1)} order',
                      style: GoogleFonts.poppins(fontSize: 12, color: _ink, fontWeight: i == done ? FontWeight.w700 : FontWeight.w500)),
                ),
                _node(i, done, node),
                const SizedBox(height: 6),
                Text(i < done ? 'Used' : '${_rs(o.steps[i])} Off',
                    style: GoogleFonts.poppins(
                        fontSize: 15, fontWeight: FontWeight.w800, color: i < done ? _ink.withValues(alpha: 0.5) : _ink)),
              ]),
            ),
        ]),
      ]),
    );
  }

  Widget _node(int i, int done, double size) {
    if (i < done) {
      return Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(shape: BoxShape.circle, color: _ink),
        child: const Icon(Icons.check_rounded, color: _goldLight, size: 20),
      );
    }
    final next = i == done;
    final circle = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: next
            ? const LinearGradient(colors: [_teal, _deep])
            : const LinearGradient(colors: [_goldLight, Color(0xFFFCD34D)]),
        border: Border.all(color: _gold, width: 2),
        boxShadow: next ? [BoxShadow(color: _gold.withValues(alpha: 0.6), blurRadius: 10)] : null,
      ),
      child: Icon(next ? Icons.local_offer_rounded : Icons.percent_rounded, size: 18, color: next ? _goldLight : const Color(0xFF92400E)),
    );
    if (!next) return circle;
    return ScaleTransition(
      scale: Tween(begin: 0.92, end: 1.1).animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut)),
      child: circle,
    );
  }
}
