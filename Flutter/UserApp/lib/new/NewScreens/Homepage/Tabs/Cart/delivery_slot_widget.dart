import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import '../../../../Constants/colors.dart';

class ScheduledSlotInfo {
  final bool isScheduled;
  final DateTime? scheduledDate;
  final String? slotLabel;
  final String? formattedScheduledDateTime; // start of the chosen day in UTC, e.g. "2026-10-06 18:30:00"

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
  int selectedDateIndex = 0; // 0 = Tomorrow, 1 = Day after tomorrow, 2 = 3 days later

  late List<DateTime> availableDates;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    availableDates = [
      DateTime(now.year, now.month, now.day + 1), // Tomorrow
      DateTime(now.year, now.month, now.day + 2), // Day after tomorrow
      DateTime(now.year, now.month, now.day + 3), // 3 days later
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
      // Only a day is chosen; the order is released for delivery from the start of that day
      // (IST midnight, sent as UTC like every other server time).
      final selectedDate = availableDates[selectedDateIndex];
      final dayStartUtc = DateTime(selectedDate.year, selectedDate.month, selectedDate.day).toUtc();

      widget.onSlotChanged(ScheduledSlotInfo(
        isScheduled: true,
        scheduledDate: selectedDate,
        slotLabel: DateFormat('EEE, d MMM').format(selectedDate),
        formattedScheduledDateTime: DateFormat('yyyy-MM-dd HH:mm:ss').format(dayStartUtc),
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
                    final dayLabel = index == 0
                        ? "Tomorrow"
                        : DateFormat('EEE, MMM d').format(date);

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          selectedDateIndex = index;
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
            const SizedBox(height: 8),
            Text(
              "Your order will be delivered during the day you pick.",
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
