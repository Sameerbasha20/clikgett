import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';
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

class _HomeMilestoneCardState extends State<HomeMilestoneCard> {
  final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);
  int _totalOrders = 0;
  Map<String, dynamic>? _next;
  List<dynamic> _milestones = [];

  static const _deep = Color(0xFF14532D);
  static const _gold = Color(0xFFF59E0B);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}/rewards/myMilestones'));
      if (response.statusCode != 200) return;
      final data = json.decode(response.body);
      if (data['Status'] == 1 && mounted) {
        setState(() {
          _totalOrders = data['TotalDeliveredOrders'] ?? 0;
          _next = data['NextMilestone'];
          _milestones = data['Milestones'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching milestones: $e');
    }
  }

  num _target(dynamic m) => num.tryParse('${m['TriggerValue']}') ?? 0;

  /// The scooter and a gift on the road; positions run from 0 (start) to 1 (last reward).
  Widget _road(double width) {
    const icon = 30.0;
    final last = _target(_milestones.last);
    final usable = width - icon;
    double at(num orders) => last <= 0 ? 0 : (orders / last).clamp(0.0, 1.0).toDouble() * usable;
    final position = at(_totalOrders);
    return SizedBox(
      height: 62,
      child: Stack(clipBehavior: Clip.none, children: [
        // The road, filled up to the scooter.
        Positioned(
          left: icon / 2,
          right: icon / 2,
          top: 24,
          child: Container(height: 8, decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(4))),
        ),
        Positioned(
          left: icon / 2,
          top: 24,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOut,
            height: 8,
            width: position,
            decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(4)),
          ),
        ),
        for (final m in _milestones)
          Positioned(
            left: at(_target(m)),
            top: 13,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(
                width: icon,
                height: icon,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: m['IsCompleted'] == true ? primary : white,
                  border: Border.all(color: m['IsCompleted'] == true ? primary : _gold, width: 2),
                ),
                child: Icon(m['IsCompleted'] == true ? Icons.check_rounded : Icons.card_giftcard_rounded,
                    size: 16, color: m['IsCompleted'] == true ? white : _gold),
              ),
              const SizedBox(height: 2),
              Text('${_target(m)}', style: GoogleFonts.poppins(fontSize: 10.5, fontWeight: FontWeight.w700, color: _deep)),
            ]),
          ),
        AnimatedPositioned(
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeOut,
          left: position + 3,
          top: -5,
          child: const Icon(Icons.delivery_dining_rounded, size: 24, color: _deep),
        ),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_milestones.isEmpty) return const SizedBox.shrink();
    final remaining = int.tryParse('${_next?['RemainingOrders'] ?? 0}') ?? 0;
    final reward = '${_next?['RewardName'] ?? 'your next reward'}';
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 4),
      child: Material(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => showMilestonesSheet(context, _milestones),
          child: Container(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFBBF7D0))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.stars_rounded, color: _gold, size: 20),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _next == null || remaining <= 0
                        ? 'All rewards unlocked. Thank you!'
                        : '$remaining more order${remaining == 1 ? '' : 's'} to unlock $reward',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: _deep),
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: _deep, size: 20),
              ]),
              const SizedBox(height: 14),
              LayoutBuilder(builder: (_, box) => _road(box.maxWidth)),
            ]),
          ),
        ),
      ),
    );
  }
}
