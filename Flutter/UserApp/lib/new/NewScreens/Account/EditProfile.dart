import 'package:fav_app/new/Constants/validators.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/NewScreens/Account/account_widgets.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/account_services.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../old/Models/Users/usersDetails.dart';
import '../../../old/constants.dart';

const _deep = Color(0xFF14532D);
const _fresh = Color(0xFF16A34A);

/// Edit profile: name, mobile (read-only), email and birthday (set once).
class EditProfile extends StatefulWidget {
  const EditProfile({super.key, required this.users, required this.profileController});
  final ProfileController profileController;
  final Users? users;

  @override
  State<EditProfile> createState() => _EditProfileState();
}

class _EditProfileState extends State<EditProfile> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _name = TextEditingController();
  final TextEditingController _mobile = TextEditingController();
  final TextEditingController _email = TextEditingController();
  late final ProfileController profileController = widget.profileController;

  AccountSummary? _summary;
  bool _savingBirthday = false;

  @override
  void initState() {
    super.initState();
    final user = widget.users;
    _name.text = user?.firstName ?? '';
    _mobile.text = user?.mobileNumber ?? '';
    if (user?.emailId != null && user?.emailId != 'NA') _email.text = user!.emailId!;
    _name.addListener(() => setState(() {}));
    _loadSummary();
  }

  Future<void> _loadSummary() async {
    final s = await AccountServices.summary();
    if (mounted && s != null) setState(() => _summary = s);
  }

  @override
  void dispose() {
    profileController.resetLoadingBtn();
    _name.dispose();
    _mobile.dispose();
    _email.dispose();
    super.dispose();
  }

  String get _initials {
    final parts = _name.text.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '🙂';
    return parts.take(2).map((p) => p[0].toUpperCase()).join();
  }

  // ---------------------------------------------------------------- actions

  void _save() {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    final email = _email.text.trim();
    if (email.isNotEmpty && !Constants().regex.hasMatch(email)) {
      customToast(message: 'Please enter a valid email');
      return;
    }
    final body = <String, dynamic>{
      'FirstName': _name.text.trim(),
      'LastName': widget.users?.lastName ?? '',
      'MobileNumber': _mobile.text,
      if (email.isNotEmpty) 'EmailID': email,
    };
    profileController.updateUser(context: context, body: body, isUpdateUser: true);
  }

  /// The birthday is set once: pick, confirm, save. After that it only shows.
  Future<void> _pickBirthday() async {
    if (_summary?.dateOfBirth != null) {
      customToast(message: 'Your birthday is saved and cannot be changed. Contact support if it is wrong.');
      return;
    }
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 25, now.month, now.day),
      firstDate: DateTime(now.year - 100),
      lastDate: DateTime(now.year - 5, now.month, now.day),
      initialEntryMode: DatePickerEntryMode.calendarOnly,
      helpText: 'SELECT YOUR BIRTHDAY',
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(colorScheme: Theme.of(ctx).colorScheme.copyWith(primary: _fresh)),
        child: child!,
      ),
    );
    if (picked == null || !mounted) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Save your birthday?', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 18)),
        content: Text('${DateFormat('d MMMM yyyy').format(picked)}\n\nYou cannot change it later, so please check it is correct.',
            style: GoogleFonts.poppins(fontSize: 14, color: tColor4)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Change')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: _fresh),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _savingBirthday = true);
    final result = await AccountServices.setBirthday(DateFormat('yyyy-MM-dd').format(picked));
    if (!mounted) return;
    setState(() => _savingBirthday = false);
    customToast(message: result.ok ? 'Birthday saved 🎂' : result.message);
    _loadSummary();
  }

  // ---------------------------------------------------------------- build

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: bg1,
        body: Form(
          key: _formKey,
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(child: _header()),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    Transform.translate(
                      offset: const Offset(0, -28),
                      child: Container(
                        padding: const EdgeInsets.fromLTRB(16, 18, 16, 6),
                        decoration: BoxDecoration(
                          color: white,
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: [BoxShadow(color: _deep.withValues(alpha: 0.07), blurRadius: 24, offset: const Offset(0, 10))],
                        ),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          _label('Your name'),
                          _field(
                            controller: _name,
                            icon: Icons.person_outline_rounded,
                            hint: 'Enter your name',
                            capitalization: TextCapitalization.words,
                            formatters: [LengthLimitingTextInputFormatter(25)],
                            validator: (v) => V.name(v),
                          ),
                          _label('Mobile number'),
                          _field(
                            controller: _mobile,
                            icon: Icons.phone_iphone_rounded,
                            readOnly: true,
                            prefixText: '+91  ',
                            suffix: _verifiedChip(),
                          ),
                          _label('Email', optional: true),
                          _field(
                            controller: _email,
                            icon: Icons.mail_outline_rounded,
                            hint: 'name@example.com',
                            keyboard: TextInputType.emailAddress,
                            validator: (v) => V.email(v),
                          ),
                          _label('Birthday'),
                          _birthdayTile(),
                          const SizedBox(height: 12),
                        ]),
                      ),
                    ),
                  ]),
                ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: SafeArea(
          minimum: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Obx(() {
            final busy = profileController.isLoading.isTrue;
            return SizedBox(
              height: 54,
              child: ElevatedButton(
                onPressed: busy ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _fresh,
                  disabledBackgroundColor: _fresh.withValues(alpha: 0.6),
                  foregroundColor: white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: busy
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: white))
                    : Text('Save changes', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _header() {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      padding: EdgeInsets.fromLTRB(8, top + 6, 16, 48),
      decoration: const BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF15803D), Color(0xFF22C55E)]),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Column(children: [
        Row(children: [
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: white, size: 20),
            style: IconButton.styleFrom(backgroundColor: white.withValues(alpha: 0.18)),
          ),
          Expanded(
            child: Text('Edit profile',
                textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: white)),
          ),
          const SizedBox(width: 48),
        ]),
        const SizedBox(height: 14),
        // Avatar with a soft ring; the initials follow the name as it is typed.
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(shape: BoxShape.circle, color: white.withValues(alpha: 0.25)),
          child: Container(
            width: 92,
            height: 92,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: white,
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 18, offset: const Offset(0, 8))],
            ),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
              child: Text(_initials,
                  key: ValueKey(_initials), style: GoogleFonts.poppins(fontSize: 34, fontWeight: FontWeight.w800, color: _fresh)),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(_name.text.trim().isEmpty ? 'Your name' : _name.text.trim(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: white)),
        if (_mobile.text.isNotEmpty)
          Text('+91 ${_mobile.text}', style: GoogleFonts.poppins(fontSize: 13, color: white.withValues(alpha: 0.85))),
      ]),
    );
  }

  Widget _label(String text, {bool optional = false}) => Padding(
        padding: const EdgeInsets.only(top: 10, bottom: 6, left: 2),
        child: Row(children: [
          Text(text, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: tColor)),
          if (optional) Text('  (optional)', style: GoogleFonts.poppins(fontSize: 12, color: grey70)),
        ]),
      );

  Widget _field({
    required TextEditingController controller,
    required IconData icon,
    String? hint,
    bool readOnly = false,
    String? prefixText,
    Widget? suffix,
    TextInputType? keyboard,
    TextCapitalization capitalization = TextCapitalization.none,
    List<TextInputFormatter>? formatters,
    String? Function(String?)? validator,
  }) {
    OutlineInputBorder border(Color c, [double w = 1]) =>
        OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: c, width: w));
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      keyboardType: keyboard,
      textCapitalization: capitalization,
      inputFormatters: formatters,
      validator: validator,
      style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w500, color: readOnly ? tColor3 : tColor),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.poppins(fontSize: 14, color: grey70.withValues(alpha: 0.7)),
        prefixIcon: Icon(icon, color: readOnly ? grey70 : _fresh, size: 21),
        prefixText: prefixText,
        prefixStyle: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w500, color: tColor3),
        suffixIcon: suffix,
        filled: true,
        fillColor: readOnly ? bg3 : const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        enabledBorder: border(cardBorder),
        focusedBorder: border(_fresh, 1.6),
        errorBorder: border(red),
        focusedErrorBorder: border(red, 1.6),
      ),
    );
  }

  Widget _verifiedChip() => Padding(
        padding: const EdgeInsets.only(right: 10),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: primaryGhost, borderRadius: BorderRadius.circular(20)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.verified_rounded, size: 14, color: _fresh),
              const SizedBox(width: 3),
              Text('Verified', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: _fresh)),
            ]),
          ),
        ]),
      );

  Widget _birthdayTile() {
    final dob = _summary?.dateOfBirth;
    final reward = _summary?.birthdayReward ?? 0;
    final saved = dob != null;
    final String title;
    final String sub;
    if (saved) {
      title = DateFormat('d MMMM yyyy').format(dob);
      sub = reward > 0 ? '🎁 ${rupees(reward)} gift on your birthday' : 'Saved · cannot be changed';
    } else {
      title = 'Add your birthday';
      sub = reward > 0 ? 'Get ${rupees(reward)} ClikGett Cash on your birthday' : 'Get a surprise on your birthday';
    }
    return Material(
      color: saved ? bg3 : const Color(0xFFFFFBEB),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: _savingBirthday ? null : _pickBirthday,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: saved ? cardBorder : const Color(0xFFFCD34D)),
          ),
          child: Row(children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: white, borderRadius: BorderRadius.circular(12)),
              alignment: Alignment.center,
              child: const Text('🎂', style: TextStyle(fontSize: 22)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title,
                    style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w600, color: saved ? tColor : const Color(0xFF92400E))),
                Text(sub, style: GoogleFonts.poppins(fontSize: 12, color: saved ? tColor3 : const Color(0xFFB45309))),
              ]),
            ),
            if (_savingBirthday)
              const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.2, color: _fresh))
            else
              Icon(saved ? Icons.lock_outline_rounded : Icons.add_circle_rounded, color: saved ? grey70 : const Color(0xFFF59E0B)),
          ]),
        ),
      ),
    );
  }
}
