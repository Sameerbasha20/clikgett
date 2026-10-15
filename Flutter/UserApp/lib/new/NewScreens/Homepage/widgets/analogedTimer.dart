import 'dart:async';
import 'package:flutter/material.dart';
import 'dart:math';

class LiveAnalogCountdownClock extends StatefulWidget {
  final Duration duration;
  final double size;
  final Color color;
  final VoidCallback? onDone;

  const LiveAnalogCountdownClock({
    Key? key,
    required this.duration,
    this.size = 120,
    this.color = Colors.blue,
    this.onDone,
  }) : super(key: key);

  @override
  State<LiveAnalogCountdownClock> createState() =>
      _LiveAnalogCountdownClockState();
}

class _LiveAnalogCountdownClockState extends State<LiveAnalogCountdownClock> {
  late Duration _remaining;
  late Timer _timer;
  late DateTime _endTime;

  @override
  void initState() {
    super.initState();
    _remaining = widget.duration;
    _endTime = DateTime.now().add(_remaining);
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(Duration(seconds: 1), (_) {
      final now = DateTime.now();
      final newRemaining = _endTime.difference(now);
      if (newRemaining.isNegative) {
        _timer.cancel();
        setState(() => _remaining = Duration.zero);
        widget.onDone?.call();
      } else {
        setState(() => _remaining = newRemaining);
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final totalSeconds = widget.duration.inSeconds;
    final remainingSeconds = _remaining.inSeconds;
    final fakeNow =
        DateTime(2000, 1, 1, 0, remainingSeconds ~/ 60, remainingSeconds % 60);

    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: CustomPaint(
        painter: _AnalogHandsPainter(
          time: fakeNow,
          color: widget.color,
        ),
      ),
    );
  }
}

class _AnalogHandsPainter extends CustomPainter {
  final DateTime time;
  final Color color;

  _AnalogHandsPainter({required this.time, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.width / 2;

    final tickPaint = Paint()
      ..color = color.withOpacity(0.7)
      ..strokeWidth = 1;

    final handPaint = Paint()
      ..color = color
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 2;

    // Draw ticks
    for (int i = 0; i < 60; i++) {
      final angle = 2 * pi * i / 60;
      final p1 = Offset(
        center.dx + radius * cos(angle),
        center.dy + radius * sin(angle),
      );
      final p2 = Offset(
        center.dx + (radius - 5) * cos(angle),
        center.dy + (radius - 5) * sin(angle),
      );
      canvas.drawLine(p1, p2, tickPaint);
    }

    // Draw minute hand
    final minuteAngle = (pi / 30) * time.minute + (pi / 1800) * time.second;
    final minuteHand = Offset(
      center.dx + (radius - 15) * cos(minuteAngle - pi / 2),
      center.dy + (radius - 15) * sin(minuteAngle - pi / 2),
    );
    canvas.drawLine(center, minuteHand, handPaint..strokeWidth = 4);

    // Draw second hand (always ticking using current system time)
    final now = DateTime.now();
    final seconds = now.second + now.millisecond / 1000.0;
    final secondAngle = (pi / 30) * seconds;
    final secondHand = Offset(
      center.dx + (radius - 10) * cos(secondAngle - pi / 2),
      center.dy + (radius - 10) * sin(secondAngle - pi / 2),
    );
    canvas.drawLine(
        center,
        secondHand,
        handPaint
          ..strokeWidth = 2
          ..color = Colors.red);

    // Center dot
    canvas.drawCircle(center, 4, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _AnalogHandsPainter oldDelegate) => true;
}
