import 'dart:math' as math;

import 'package:fav_app/new/NewScreens/Deals/UnlockDealsScreen.dart';
import 'package:fav_app/new/Services/unlock_deals_service.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

const _deep = Color(0xFF14532D);
const _fresh = Color(0xFF16A34A);
const _lime = [Color(0xFFD9F99D), Color(0xFFFEF08A)];

String _rs(double v) => '₹${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

void _openDeals(BuildContext context) =>
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const UnlockDealsScreen()));

/// Product card chip: "🔒 ₹896  SHOP FOR ₹599", or "🔓 ₹896 UNLOCKED" once the cart is there.
/// Taps open the deals page.
class UnlockPriceChip extends StatelessWidget {
  final UnlockDeal deal;
  final bool unlocked;
  const UnlockPriceChip({super.key, required this.deal, required this.unlocked});

  /// The chip for this pack, or null when it has no unlock deal.
  static Widget? forVariant(int? variantId) {
    UnlockDealsStore.ensureLoaded();
    final deal = UnlockDealsStore.forVariant(variantId);
    if (deal == null) return null;
    final page = UnlockDealsStore.page.value;
    return UnlockPriceChip(deal: deal, unlocked: (page?.loggedIn ?? false) && deal.unlocked);
  }

  @override
  Widget build(BuildContext context) {
    final price = deal.unlockPrice <= 0 ? 'FREE' : _rs(deal.unlockPrice);
    return GestureDetector(
      onTap: () => _openDeals(context),
      child: Align(
        alignment: Alignment.centerLeft,
        child: _Shine(
          child: Container(
            padding: const EdgeInsets.only(left: 4, right: 6),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: unlocked ? const [Color(0xFFBBF7D0), Color(0xFFDCFCE7)] : _lime),
              borderRadius: BorderRadius.circular(5),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(unlocked ? Icons.lock_open_rounded : Icons.lock_rounded, size: 10.5, color: _deep),
              const SizedBox(width: 2),
              Text(price, style: GoogleFonts.poppins(fontSize: 10, height: 1.5, fontWeight: FontWeight.w800, color: _deep)),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  unlocked ? 'UNLOCKED' : 'SHOP FOR ${_rs(deal.threshold)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(fontSize: 8, height: 1.9, fontWeight: FontWeight.w700, color: _deep, letterSpacing: 0.2),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

/// Product page card: the unlock price, how much more the cart needs, and a progress bar.
class UnlockPriceCard extends StatelessWidget {
  final int? variantId;
  const UnlockPriceCard({super.key, required this.variantId});

  @override
  Widget build(BuildContext context) {
    UnlockDealsStore.ensureLoaded();
    return Obx(() {
      final page = UnlockDealsStore.page.value;
      final deal = UnlockDealsStore.forVariant(variantId);
      if (page == null || deal == null) return const SizedBox.shrink();
      final loggedIn = page.loggedIn;
      final unlocked = loggedIn && deal.unlocked;
      final price = deal.unlockPrice <= 0 ? 'FREE' : _rs(deal.unlockPrice);
      final String sub;
      if (unlocked) {
        sub = deal.dealLimit > 1 ? 'Add it now · deal price on up to ${deal.dealLimit} per order' : 'Add it now · deal price on 1 per order';
      } else if (!loggedIn) {
        sub = 'Shop for ${_rs(deal.threshold)} to unlock this price';
      } else {
        sub = 'Add ${_rs(deal.amountNeeded)} more of other items to unlock';
      }
      return Padding(
        padding: const EdgeInsets.only(top: 8),
        child: GestureDetector(
          onTap: () => _openDeals(context),
          child: _Shine(
            radius: 14,
            child: Container(
              padding: const EdgeInsets.fromLTRB(12, 10, 10, 10),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: unlocked ? const [Color(0xFFDCFCE7), Color(0xFFBBF7D0)] : const [Color(0xFFF7FEE7), Color(0xFFFEF9C3)]),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: unlocked ? const Color(0xFF86EFAC) : const Color(0xFFD9F99D)),
              ),
              child: Row(children: [
                _LockBadge(unlocked: unlocked),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text.rich(TextSpan(children: [
                      TextSpan(
                          text: unlocked ? 'Unlocked: ' : 'Get it for ',
                          style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: _deep)),
                      TextSpan(text: price, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w800, color: _fresh)),
                      if (deal.wasPrice > deal.unlockPrice)
                        TextSpan(
                            text: '  ${_rs(deal.wasPrice)}',
                            style: GoogleFonts.poppins(
                                fontSize: 11.5, color: const Color(0xFF64748B), decoration: TextDecoration.lineThrough)),
                    ])),
                    Text(sub, style: GoogleFonts.poppins(fontSize: 11.5, color: const Color(0xFF334155))),
                    if (loggedIn && !unlocked) ...[
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: deal.progress),
                          duration: const Duration(milliseconds: 800),
                          curve: Curves.easeOutCubic,
                          builder: (_, v, __) => LinearProgressIndicator(
                            value: v,
                            minHeight: 6,
                            backgroundColor: Colors.white,
                            color: _fresh,
                          ),
                        ),
                      ),
                    ],
                  ]),
                ),
                const Icon(Icons.chevron_right_rounded, color: _deep),
              ]),
            ),
          ),
        ),
      );
    });
  }
}

/// Lock that wiggles now and then; pops open once unlocked.
class _LockBadge extends StatefulWidget {
  final bool unlocked;
  const _LockBadge({required this.unlocked});

  @override
  State<_LockBadge> createState() => _LockBadgeState();
}

class _LockBadgeState extends State<_LockBadge> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.maybeOf(context)?.disableAnimations ?? false) {
      _c.stop();
    } else if (!_c.isAnimating) {
      _c.repeat();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
        boxShadow: [BoxShadow(color: _fresh.withValues(alpha: 0.2), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 450),
        transitionBuilder: (c, a) => ScaleTransition(scale: CurvedAnimation(parent: a, curve: Curves.elasticOut), child: c),
        child: widget.unlocked
            ? const Icon(Icons.lock_open_rounded, key: ValueKey('open'), color: _fresh, size: 22)
            : AnimatedBuilder(
                key: const ValueKey('locked'),
                animation: _c,
                builder: (_, child) {
                  // A short shake in the first fifth of each cycle.
                  final t = _c.value < 0.2 ? _c.value / 0.2 : 0.0;
                  return Transform.rotate(angle: math.sin(t * math.pi * 4) * 0.25 * (1 - t), child: child);
                },
                child: const Icon(Icons.lock_rounded, color: _deep, size: 21),
              ),
      ),
    );
  }
}

/// A soft light sweep across the child every few seconds.
class _Shine extends StatefulWidget {
  final Widget child;
  final double radius;
  const _Shine({required this.child, this.radius = 5});

  @override
  State<_Shine> createState() => _ShineState();
}

class _ShineState extends State<_Shine> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 3000));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.maybeOf(context)?.disableAnimations ?? false) {
      _c.stop();
    } else if (!_c.isAnimating) {
      _c.repeat();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      child: widget.child,
      builder: (_, child) {
        // Sweep during the first third of the cycle, then rest.
        // The tree keeps the same shape every frame so the child's own animations never restart.
        final t = (_c.value / 0.35).clamp(0.0, 1.0);
        final idle = t >= 1 || t <= 0;
        return ClipRRect(
          borderRadius: BorderRadius.circular(widget.radius),
          child: Stack(children: [
            child!,
            Positioned.fill(
              child: IgnorePointer(
                child: idle ? const SizedBox.shrink() : FractionalTranslation(
                  translation: Offset(-1 + 2 * t, 0),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [
                        Colors.white.withValues(alpha: 0),
                        Colors.white.withValues(alpha: 0.55),
                        Colors.white.withValues(alpha: 0),
                      ], stops: const [0.3, 0.5, 0.7]),
                    ),
                  ),
                ),
              ),
            ),
          ]),
        );
      },
    );
  }
}
