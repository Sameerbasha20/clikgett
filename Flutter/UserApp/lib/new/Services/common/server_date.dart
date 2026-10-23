/// Server timestamps are UTC ("2026-10-23T06:53:48.000Z"). This returns them in the
/// phone's local time, IST for our customers, so screens show Indian time and
/// countdowns stay exact. Date-time strings without a zone are UTC too; plain dates
/// ("2026-10-25") are kept as calendar dates.
DateTime? serverDate(dynamic v) {
  if (v == null) return null;
  if (v is DateTime) return v.toLocal();
  var s = '$v'.trim();
  if (s.isEmpty || s == 'NA' || s == 'null') return null;
  if (!s.contains('T') && s.contains(' ')) s = s.replaceFirst(' ', 'T');
  final hasZone = s.endsWith('Z') || RegExp(r'[+-]\d\d:?\d\d$').hasMatch(s);
  if (s.contains('T') && !hasZone) s = '${s}Z';
  return DateTime.tryParse(s)?.toLocal();
}
