import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fav_app/Services/common/intercepter.dart';
import 'package:fav_app/constants.dart';
import 'package:fav_app/new/Constants/colors.dart';

class MilestoneRewardCard extends StatefulWidget {
  const MilestoneRewardCard({Key? key}) : super(key: key);

  @override
  State<MilestoneRewardCard> createState() => _MilestoneRewardCardState();
}

class _MilestoneRewardCardState extends State<MilestoneRewardCard> {
  final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);
  bool _isLoading = true;
  int _totalOrders = 0;
  Map<String, dynamic>? _nextMilestone;
  List<dynamic> _milestones = [];

  @override
  void initState() {
    super.initState();
    _fetchMilestones();
  }

  Future<void> _fetchMilestones() async {
    try {
      final response = await _client.get(
        Uri.parse('${Constants.baseUrl}/rewards/myMilestones'),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['Status'] == 1 && mounted) {
          setState(() {
            _totalOrders = data['TotalDeliveredOrders'] ?? 0;
            _nextMilestone = data['NextMilestone'];
            _milestones = data['Milestones'] ?? [];
            _isLoading = false;
          });
          return;
        }
      }
    } catch (e) {
      debugPrint('Error fetching milestones: $e');
    }
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const SizedBox.shrink();
    }

    final target = _nextMilestone?['TriggerValue'] ?? 5;
    final remaining = _nextMilestone?['RemainingOrders'] ?? 5;
    final progressPct = (_nextMilestone?['ProgressPercentage'] ?? 0).toDouble();
    final milestoneName = _nextMilestone?['RewardName'] ?? 'Next Milestone';
    final rewardDesc = _nextMilestone?['Description'] ?? 'Complete orders to unlock rewards';

    final progress = (progressPct / 100.0).clamp(0.0, 1.0);
    const deep = Color(0xFF14532D);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Material(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => showMilestonesSheet(context, _milestones),
          child: Container(
            padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFBBF7D0)),
            ),
            child: Row(children: [
              // Progress ring with "8/10" in the middle.
              SizedBox(
                width: 52,
                height: 52,
                child: Stack(alignment: Alignment.center, children: [
                  SizedBox.expand(
                    child: CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 5,
                      strokeCap: StrokeCap.round,
                      backgroundColor: const Color(0xFFD1FAE5),
                      valueColor: const AlwaysStoppedAnimation<Color>(primary),
                    ),
                  ),
                  Text('$_totalOrders/$target',
                      style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: deep)),
                ]),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(
                    remaining > 0
                        ? '$remaining more order${remaining == 1 ? '' : 's'} to unlock'
                        : 'All rewards unlocked 🎉',
                    style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF15803D), fontWeight: FontWeight.w500),
                  ),
                  Text(
                    remaining > 0 ? rewardDesc : 'Thanks for shopping with us',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: deep, height: 1.3),
                  ),
                  const SizedBox(height: 2),
                  Text('$milestoneName · $_totalOrders orders completed',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                ]),
              ),
              const Icon(Icons.chevron_right_rounded, color: deep),
            ]),
          ),
        ),
      ),
    );
  }
}

/// All order milestones and which are unlocked.
void showMilestonesSheet(BuildContext context, List<dynamic> milestones) {
  showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    backgroundColor: Colors.white,
    builder: (ctx) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.stars_rounded, color: Colors.amber, size: 28),
                const SizedBox(width: 10),
                Text(
                  'Order Milestone Rewards',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Complete orders to unlock exclusive milestone rewards & cashback!',
              style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 18),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: milestones.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final item = milestones[index];
                  final bool isUnlocked = item['IsCompleted'] ?? false;
                  final target = item['TriggerValue'] ?? 0;
                  final rewardName = item['RewardName'] ?? 'Milestone';
                  final desc = item['Description'] ?? '';

                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isUnlocked ? const Color(0xFFF0FDF4) : const Color(0xFFF8F9FA),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isUnlocked ? const Color(0xFF86EFAC) : Colors.grey.shade300,
                        width: 1.2,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isUnlocked ? Colors.green.shade100 : Colors.grey.shade200,
                          ),
                          child: Icon(
                            isUnlocked ? Icons.check_circle_rounded : Icons.lock_clock_rounded,
                            color: isUnlocked ? Colors.green.shade700 : Colors.grey.shade600,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    rewardName,
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isUnlocked ? Colors.green.shade600 : Colors.grey.shade400,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      isUnlocked ? 'UNLOCKED' : '$target Orders',
                                      style: GoogleFonts.poppins(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                desc,
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: Colors.black54,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      );
    },
  );
}

/// Home screen version: a road from the first order to the last reward, with a scooter
/// at the customer's position and a gift at every reward.
class HomeMilestoneCard extends StatefulWidget {
  const HomeMilestoneCard({Key? key}) : super(key: key);

  @override
  State<HomeMilestoneCard> createState() => _HomeMilestoneCardState();
}

/// Home rewards card: the level reached, orders to the next reward, and a track with every
/// milestone. A milestone reached since the last visit plays a confetti burst once.
class _HomeMilestoneCardState extends State<HomeMilestoneCard> with TickerProviderStateMixin {
  final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);
  int _totalOrders = 0;
  Map<String, dynamic>? _next;
  List<dynamic> _milestones = [];
  Map<String, dynamic>? _justUnlocked;

  static const _gold = Color(0xFFF59E0B);
  static const _goldLight = Color(0xFFFDE68A);
  static const _seenKey = 'milestones_seen_completed';

  late final AnimationController _fill = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1300))
    ..repeat(reverse: true);
  late final AnimationController _burst = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400));

  @override
  void initState() {
    super.initState();
    _burst.addStatusListener((s) {
      if (s == AnimationStatus.completed && mounted) setState(() => _justUnlocked = null);
    });
    _load();
  }

  @override
  void dispose() {
    _fill.dispose();
    _pulse.dispose();
    _burst.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}/rewards/myMilestones'));
      if (response.statusCode != 200) return;
      final data = json.decode(response.body);
      if (data['Status'] != 1 || !mounted) return;
      final milestones = (data['Milestones'] as List?) ?? [];
      setState(() {
        _totalOrders = data['TotalDeliveredOrders'] ?? 0;
        _next = data['NextMilestone'];
        _milestones = milestones;
      });
      _fill.forward(from: 0);
      await _celebrateIfNew(milestones);
    } catch (e) {
      debugPrint('Error fetching milestones: $e');
    }
  }

  /// Confetti once for each milestone reached since the card was last shown.
  Future<void> _celebrateIfNew(List<dynamic> milestones) async {
    final done = milestones.where((m) => m['IsCompleted'] == true).toList();
    try {
      final prefs = await SharedPreferences.getInstance();
      final seen = prefs.getInt(_seenKey) ?? 0;
      await prefs.setInt(_seenKey, done.length);
      if (done.length > seen && mounted) {
        setState(() => _justUnlocked = Map<String, dynamic>.from(done.last));
        await Future.delayed(const Duration(milliseconds: 700));
        if (mounted) _burst.forward(from: 0);
      }
    } catch (_) {
      // No local storage: skip the celebration.
    }
  }

  num _target(dynamic m) => num.tryParse('${m['TriggerValue']}') ?? 0;

  String _rewardLine(Map<String, dynamic> m) {
    final value = num.tryParse('${m['RewardValue']}') ?? 0;
    switch ('${m['RewardType']}') {
      case 'wallet_cashback':
        return '₹${value.toStringAsFixed(0)} ClikGett Cash';
      case 'free_delivery':
        return 'Free delivery perks';
      default:
        return '${m['Description'] ?? m['RewardName'] ?? ''}';
    }
  }

  String get _level {
    final done = _milestones.where((m) => m['IsCompleted'] == true).toList();
    return done.isEmpty ? 'New shopper' : '${done.last['RewardName']}';
  }

  Widget _track(double width) {
    const node = 22.0;
    final last = _target(_milestones.last);
    final usable = width - node;
    double at(num orders) => last <= 0 ? 0 : (orders / last).clamp(0.0, 1.0).toDouble() * usable;
    final nextTarget = _next == null ? null : _target(_next);
    return SizedBox(
      height: 46,
      child: Stack(clipBehavior: Clip.none, children: [
        Positioned(
          left: node / 2,
          right: node / 2,
          top: 7,
          child: Container(height: 8, decoration: BoxDecoration(color: Colors.white.withOpacity(0.16), borderRadius: BorderRadius.circular(8))),
        ),
        AnimatedBuilder(
          animation: _fill,
          builder: (_, __) => Positioned(
            left: node / 2,
            top: 7,
            child: Container(
              height: 8,
              width: at(_totalOrders) * Curves.easeOutCubic.transform(_fill.value),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [_goldLight, _gold]),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [BoxShadow(color: _gold.withOpacity(0.55), blurRadius: 8)],
              ),
            ),
          ),
        ),
        for (final m in _milestones)
          Positioned(
            left: at(_target(m)),
            top: 0,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              _node(m, isNext: m['IsCompleted'] != true && _target(m) == nextTarget),
              const SizedBox(height: 4),
              Text('${_target(m)}',
                  style: GoogleFonts.poppins(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: m['IsCompleted'] == true ? _goldLight : Colors.white.withOpacity(0.75))),
            ]),
          ),
      ]),
    );
  }

  Widget _node(dynamic m, {required bool isNext}) {
    const size = 22.0;
    if (m['IsCompleted'] == true) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(colors: [_goldLight, _gold]),
          boxShadow: [BoxShadow(color: _gold.withOpacity(0.6), blurRadius: 8)],
        ),
        child: const Icon(Icons.check_rounded, size: 14, color: Color(0xFF78350F)),
      );
    }
    final dot = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isNext ? Colors.white : const Color(0xFF065F46),
        border: Border.all(color: isNext ? _goldLight : Colors.white.withOpacity(0.35), width: 2),
      ),
      child: Icon(Icons.card_giftcard_rounded, size: 12, color: isNext ? _gold : Colors.white.withOpacity(0.6)),
    );
    if (!isNext) return dot;
    return ScaleTransition(scale: Tween(begin: 0.92, end: 1.12).animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut)), child: dot);
  }

  Widget _giftBadge(bool allDone) {
    return AnimatedBuilder(
      animation: _pulse,
      builder: (_, child) => Transform.rotate(angle: allDone ? 0 : math.sin(_pulse.value * math.pi * 2) * 0.08, child: child),
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [_goldLight, _gold]),
          boxShadow: [BoxShadow(color: _gold.withOpacity(0.5), blurRadius: 16, spreadRadius: 1)],
        ),
        child: Icon(allDone ? Icons.emoji_events_rounded : Icons.redeem_rounded, color: const Color(0xFF78350F), size: 28),
      ),
    );
  }

  Widget _celebration() {
    final m = _justUnlocked;
    if (m == null) return const SizedBox.shrink();
    return Positioned.fill(
      child: IgnorePointer(
        child: AnimatedBuilder(
          animation: _burst,
          builder: (_, __) {
            final t = _burst.value;
            final fade = t < 0.8 ? 1.0 : (1 - (t - 0.8) / 0.2);
            final pop = Curves.elasticOut.transform((t / 0.45).clamp(0.0, 1.0));
            return Stack(children: [
              Positioned.fill(child: CustomPaint(painter: _ConfettiPainter(t))),
              if (t > 0)
                Center(
                  child: Opacity(
                    opacity: fade.clamp(0.0, 1.0),
                    child: Transform.scale(
                      scale: 0.4 + 0.6 * pop,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 18)],
                        ),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.celebration_rounded, color: _gold, size: 22),
                          const SizedBox(width: 8),
                          Text('${m['RewardName']} unlocked!',
                              style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w800, color: const Color(0xFF064E3B))),
                        ]),
                      ),
                    ),
                  ),
                ),
            ]);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_milestones.isEmpty) return const SizedBox.shrink();
    final remaining = int.tryParse('${_next?['RemainingOrders'] ?? 0}') ?? 0;
    final allDone = _next == null || remaining <= 0;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => showMilestonesSheet(context, _milestones),
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF064E3B), Color(0xFF047857), Color(0xFF0D9488)],
              ),
              boxShadow: [BoxShadow(color: const Color(0xFF047857).withOpacity(0.35), blurRadius: 18, offset: const Offset(0, 8))],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(children: [
                // Soft light circles for depth.
                Positioned(right: -30, top: -40, child: _glow(140)),
                Positioned(left: -40, bottom: -60, child: _glow(120)),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.14), borderRadius: BorderRadius.circular(20)),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.workspace_premium_rounded, size: 14, color: _goldLight),
                          const SizedBox(width: 4),
                          Text(_level.toUpperCase(),
                              style: GoogleFonts.poppins(fontSize: 10.5, letterSpacing: 0.6, fontWeight: FontWeight.w700, color: Colors.white)),
                        ]),
                      ),
                      const Spacer(),
                      Text('$_totalOrders orders', style: GoogleFonts.poppins(fontSize: 11.5, color: Colors.white.withOpacity(0.75))),
                      Icon(Icons.chevron_right_rounded, color: Colors.white.withOpacity(0.8), size: 20),
                    ]),
                    const SizedBox(height: 10),
                    Row(children: [
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(
                            allDone ? 'All rewards unlocked' : '$remaining order${remaining == 1 ? '' : 's'} away',
                            style: GoogleFonts.poppins(fontSize: 20, height: 1.15, fontWeight: FontWeight.w800, color: Colors.white),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            allDone ? 'Thank you for shopping with ClikGett' : '${_next?['RewardName'] ?? ''} · ${_rewardLine(_next!)}',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w500, color: _goldLight),
                          ),
                        ]),
                      ),
                      const SizedBox(width: 10),
                      _giftBadge(allDone),
                    ]),
                    const SizedBox(height: 16),
                    LayoutBuilder(builder: (_, box) => _track(box.maxWidth)),
                  ]),
                ),
                _celebration(),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  Widget _glow(double size) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.06)),
      );
}

/// Confetti bursting from the centre and falling; [t] runs 0 → 1.
class _ConfettiPainter extends CustomPainter {
  final double t;
  _ConfettiPainter(this.t);

  static const _colors = [Color(0xFFFDE68A), Color(0xFFF59E0B), Colors.white, Color(0xFF6EE7B7), Color(0xFFF472B6), Color(0xFF60A5FA)];
  static final List<List<double>> _pieces = () {
    final r = math.Random(7);
    return List.generate(46, (_) => [r.nextDouble() * math.pi * 2, 0.45 + r.nextDouble() * 0.75, r.nextDouble() * 6, r.nextDouble() * 6]);
  }();

  @override
  void paint(Canvas canvas, Size size) {
    if (t <= 0 || t >= 1) return;
    final centre = Offset(size.width / 2, size.height / 2);
    final reach = size.width * 0.55;
    final opacity = t < 0.7 ? 1.0 : (1 - (t - 0.7) / 0.3);
    final burst = Curves.easeOutCubic.transform(t);
    for (var i = 0; i < _pieces.length; i++) {
      final p = _pieces[i];
      final dx = math.cos(p[0]) * p[1] * reach * burst;
      final dy = math.sin(p[0]) * p[1] * reach * 0.55 * burst + 90 * t * t; // gravity
      final paint = Paint()..color = _colors[i % _colors.length].withOpacity(opacity.clamp(0.0, 1.0));
      canvas.save();
      canvas.translate(centre.dx + dx, centre.dy + dy);
      canvas.rotate(p[2] + t * p[3] * 4);
      canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(-4, -2, 8, 4), const Radius.circular(1.5)), paint);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter old) => old.t != t;
}
