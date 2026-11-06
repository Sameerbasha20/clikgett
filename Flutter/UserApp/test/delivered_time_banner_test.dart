import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/widgets/delivered_time_banner.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final placed = DateTime(2026, 11, 4, 10, 0);

  test('on time: delivered before the promised time', () {
    final b = DeliveredTimeBanner(placedAt: placed, deliveredAt: placed.add(const Duration(minutes: 8)), promisedBy: placed.add(const Duration(minutes: 20)));
    expect(b.minutes, 8);
    expect(b.late, isFalse);
  });

  test('late: delivered after the promised time', () {
    final b = DeliveredTimeBanner(placedAt: placed, deliveredAt: placed.add(const Duration(minutes: 32)), promisedBy: placed.add(const Duration(minutes: 20)));
    expect(b.minutes, 32);
    expect(b.late, isTrue);
  });

  test('a minute of grace still counts as on time', () {
    final b = DeliveredTimeBanner(placedAt: placed, deliveredAt: placed.add(const Duration(minutes: 20, seconds: 40)), promisedBy: placed.add(const Duration(minutes: 20)));
    expect(b.late, isFalse);
  });

  test('scheduled or missing times show nothing', () {
    expect(DeliveredTimeBanner(placedAt: placed, deliveredAt: placed.add(const Duration(minutes: 30)), promisedBy: null, scheduled: true).minutes, isNull);
    expect(DeliveredTimeBanner(placedAt: null, deliveredAt: placed, promisedBy: null).minutes, isNull);
    expect(DeliveredTimeBanner(placedAt: placed, deliveredAt: placed.subtract(const Duration(minutes: 1)), promisedBy: null).minutes, isNull);
  });

  test('a delivery that took days is still shown, as late', () {
    final b = DeliveredTimeBanner(placedAt: placed, deliveredAt: placed.add(const Duration(days: 4, hours: 23)), promisedBy: placed.add(const Duration(minutes: 20)));
    expect(b.minutes, isNotNull);
    expect(b.late, isTrue);
    expect(DeliveredTimeBanner.durationText(b.minutes!), '5 days');
  });

  test('without a promised time, over 30 minutes counts as late', () {
    expect(DeliveredTimeBanner(placedAt: placed, deliveredAt: placed.add(const Duration(minutes: 45)), promisedBy: null).late, isTrue);
    expect(DeliveredTimeBanner(placedAt: placed, deliveredAt: placed.add(const Duration(minutes: 12)), promisedBy: null).late, isFalse);
  });

  test('durations read naturally', () {
    expect(DeliveredTimeBanner.durationText(1), '1 min');
    expect(DeliveredTimeBanner.durationText(32), '32 mins');
    expect(DeliveredTimeBanner.durationText(60), '1 hr');
    expect(DeliveredTimeBanner.durationText(75), '1 hr 15 mins');
    expect(DeliveredTimeBanner.durationText(150), '2 hrs 30 mins');
  });
}
