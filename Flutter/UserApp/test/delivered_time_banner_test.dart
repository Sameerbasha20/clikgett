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
}
