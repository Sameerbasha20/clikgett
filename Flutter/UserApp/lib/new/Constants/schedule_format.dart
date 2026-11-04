import 'package:intl/intl.dart';

/// When a scheduled order arrives: "Tue, 5 Nov, 10 AM - 12 PM" (2-hour slot starting at [at]).
/// Orders scheduled before time slots existed start at midnight and show the day only.
String scheduledWhen(DateTime at) {
  final day = DateFormat('EEE, d MMM').format(at);
  if (at.hour == 0 && at.minute == 0) return day;
  final end = at.add(const Duration(hours: 2));
  return '$day, ${DateFormat('h a').format(at)} - ${DateFormat('h a').format(end)}';
}
