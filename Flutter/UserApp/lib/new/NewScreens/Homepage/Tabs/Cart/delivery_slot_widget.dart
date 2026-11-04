import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import '../../../../Constants/colors.dart';

class ScheduledSlotInfo {
  final bool isScheduled;
  final DateTime? scheduledDate;
  final String? slotLabel;
  /// Start of the chosen time slot in UTC, e.g. "2026-10-06 04:30:00"; null until a slot is picked.
  final String? formattedScheduledDateTime;

  /// Schedule later is on but no time slot is picked yet: the order can't be placed.
  bool get needsSlot => isScheduled && formattedScheduledDateTime == null;

  ScheduledSlotInfo({
    required this.isScheduled,
    this.scheduledDate,
    this.slotLabel,
    this.formattedScheduledDateTime,
  });
}

class DeliverySlotWidget extends StatefulWidget {
  final Function(ScheduledSlotInfo slotInfo) onSlotChanged;

  const DeliverySlotWidget({
    Key? key,
    required this.onSlotChanged,
  }) : super(key: key);

  @override
  State<DeliverySlotWidget> createState() => _DeliverySlotWidgetState();
}

class _DeliverySlotWidgetState extends State<DeliverySlotWidget> {
  bool isScheduled = false;
  int selectedDateIndex = 0;
  int? selectedSlotHour; // start hour of the picked 2-hour slot

  late List<DateTime> availableDates;

  /// Two-hour delivery slots: 8-10 AM ... 8-10 PM (start hours).
  static const List<int> slotStartHours = [8, 10, 12, 14, 16, 18, 20];

  /// Slots on [day] that start at least an hour from now.
  List<int> _slotsFor(DateTime day) {
    final earliest = DateTime.now().add(const Duration(hours: 1));
    return slotStartHours.where((h) => DateTime(day.year, day.month, day.day, h).isAfter(earliest)).toList();
  }

  static String _hour(int h) {
    final h12 = h % 12 == 0 ? 12 : h % 12;
    return '$h12 ${h < 12 ? 'AM' : 'PM'}';
  }

  static String slotText(int h) => '${_hour(h)} - ${_hour(h + 2)}';

  String _dayLabel(DateTime d) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final diff = DateTime(d.year, d.month, d.day).difference(today).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Tomorrow';
    return DateFormat('EEE, MMM d').format(d);
  }

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    availableDates = [
      if (_slotsFor(today).isNotEmpty) today, // later today, while slots remain
      DateTime(now.year, now.month, now.day + 1),
      DateTime(now.year, now.month, now.day + 2),
      DateTime(now.year, now.month, now.day + 3),
    ];
  }

  Future<void> _pickCustomDate() async {
    final now = DateTime.now();
    final firstAllowedDate = DateTime(now.year, now.month, now.day + 1);
    final lastAllowedDate = DateTime(now.year, now.month, now.day + 30); // Up to 30 days ahead

    DateTime initialDate = availableDates.isNotEmpty && selectedDateIndex < availableDates.length
        ? availableDates[selectedDateIndex]
        : firstAllowedDate;

    if (initialDate.isBefore(firstAllowedDate)) {
      initialDate = firstAllowedDate;
    }

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstAllowedDate,
      lastDate: lastAllowedDate,
      helpText: "SELECT DELIVERY DATE",
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: primary,
              onPrimary: Colors.white,
              onSurface: Colors.black87,
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                foregroundColor: primary,
              ),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        int existingIndex = availableDates.indexWhere(
          (d) => d.year == picked.year && d.month == picked.month && d.day == picked.day,
        );
        if (existingIndex != -1) {
          selectedDateIndex = existingIndex;
        } else {
          availableDates.add(picked);
          availableDates.sort((a, b) => a.compareTo(b));
          selectedDateIndex = availableDates.indexWhere(
            (d) => d.year == picked.year && d.month == picked.month && d.day == picked.day,
          );
        }
        selectedSlotHour = null;
      });
      _notifyChange();
    }
  }

  void _notifyChange() {
    if (!isScheduled) {
      widget.onSlotChanged(ScheduledSlotInfo(
        isScheduled: false,
        scheduledDate: null,
        slotLabel: null,
        formattedScheduledDateTime: null,
      ));
    } else {
      // The order is released to the riders at the start of the picked slot
      // (local time, sent as UTC like every other server time).
      final selectedDate = availableDates[selectedDateIndex];
      final hour = selectedSlotHour;
      if (hour == null || !_slotsFor(selectedDate).contains(hour)) {
        widget.onSlotChanged(ScheduledSlotInfo(isScheduled: true, scheduledDate: selectedDate));
        return;
      }
      final slotStartUtc = DateTime(selectedDate.year, selectedDate.month, selectedDate.day, hour).toUtc();

      widget.onSlotChanged(ScheduledSlotInfo(
        isScheduled: true,
        scheduledDate: selectedDate,
        slotLabel: '${_dayLabel(selectedDate)}, ${slotText(hour)}',
        formattedScheduledDateTime: DateFormat('yyyy-MM-dd HH:mm:ss').format(slotStartUtc),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.5.h),
      padding: EdgeInsets.all(3.5.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.access_time_filled, color: primary, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Delivery Schedule",
                      style: GoogleFonts.poppins(
                        fontSize: 15.sp,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    Text(
                      isScheduled
                          ? "Delivering on ${DateFormat('EEE, MMM d').format(availableDates[selectedDateIndex])}"
                          : "Express Delivery (Arriving in 15-30 mins)",
                      style: GoogleFonts.poppins(
                        fontSize: 12.sp,
                        color: isScheduled ? primary : Colors.grey.shade600,
                        fontWeight: isScheduled ? FontWeight.w500 : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Option Tabs: Deliver Now vs Schedule for Later
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      isScheduled = false;
                    });
                    _notifyChange();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: !isScheduled ? primary.withOpacity(0.1) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: !isScheduled ? primary : Colors.grey.shade300,
                        width: !isScheduled ? 1.8 : 1.0,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        "⚡ Deliver Now",
                        style: GoogleFonts.poppins(
                          fontSize: 13.sp,
                          fontWeight: !isScheduled ? FontWeight.w600 : FontWeight.w500,
                          color: !isScheduled ? primary : Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      isScheduled = true;
                    });
                    _notifyChange();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: isScheduled ? primary.withOpacity(0.1) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isScheduled ? primary : Colors.grey.shade300,
                        width: isScheduled ? 1.8 : 1.0,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        "📅 Schedule Later",
                        style: GoogleFonts.poppins(
                          fontSize: 13.sp,
                          fontWeight: isScheduled ? FontWeight.w600 : FontWeight.w500,
                          color: isScheduled ? primary : Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),

          // Expandable Scheduled Section
          if (isScheduled) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Select Delivery Day",
                  style: GoogleFonts.poppins(
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                GestureDetector(
                  onTap: _pickCustomDate,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: primary.withOpacity(0.4), width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.calendar_month_rounded, size: 14, color: primary),
                        const SizedBox(width: 4),
                        Text(
                          "Calendar",
                          style: GoogleFonts.poppins(
                            fontSize: 11.5.sp,
                            fontWeight: FontWeight.w600,
                            color: primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: [
                  ...List.generate(availableDates.length, (index) {
                    final date = availableDates[index];
                    final isSelected = selectedDateIndex == index;
                    final dayLabel = _dayLabel(date);

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          selectedDateIndex = index;
                          if (selectedSlotHour != null && !_slotsFor(date).contains(selectedSlotHour)) {
                            selectedSlotHour = null;
                          }
                        });
                        _notifyChange();
                      },
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? primary : Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isSelected ? primary : Colors.grey.shade300,
                            width: 1.2,
                          ),
                        ),
                        child: Text(
                          dayLabel,
                          style: GoogleFonts.poppins(
                            fontSize: 12.sp,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            color: isSelected ? Colors.white : Colors.black87,
                          ),
                        ),
                      ),
                    );
                  }),
                  GestureDetector(
                    onTap: _pickCustomDate,
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: primary,
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.edit_calendar_rounded, size: 15, color: primary),
                          const SizedBox(width: 4),
                          Text(
                            "+ Pick Date",
                            style: GoogleFonts.poppins(
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w600,
                              color: primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Text(
              "Select Time Slot",
              style: GoogleFonts.poppins(
                fontSize: 13.sp,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final h in _slotsFor(availableDates[selectedDateIndex]))
                  GestureDetector(
                    onTap: () {
                      setState(() => selectedSlotHour = h);
                      _notifyChange();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: selectedSlotHour == h ? primary : Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: selectedSlotHour == h ? primary : Colors.grey.shade300, width: 1.2),
                      ),
                      child: Text(
                        slotText(h),
                        style: GoogleFonts.poppins(
                          fontSize: 12.sp,
                          fontWeight: selectedSlotHour == h ? FontWeight.w600 : FontWeight.w500,
                          color: selectedSlotHour == h ? Colors.white : Colors.black87,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              selectedSlotHour == null
                  ? "Pick a time slot to place a scheduled order."
                  : "Your order will be delivered between ${slotText(selectedSlotHour!)}.",
              style: GoogleFonts.poppins(
                fontSize: 11.5.sp,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
