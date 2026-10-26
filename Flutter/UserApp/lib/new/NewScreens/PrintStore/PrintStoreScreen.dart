import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/PrintStore/PrintConfigureScreen.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/new/Services/print_store_service.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Print tab: upload PDFs or photos, choose copies / colour / orientation, and the
/// prints come with the next order (20 min on their own, +10 min with groceries).
class PrintStoreScreen extends StatefulWidget {
  const PrintStoreScreen({super.key});

  @override
  State<PrintStoreScreen> createState() => _PrintStoreScreenState();
}

class _PrintStoreScreenState extends State<PrintStoreScreen> {
  PrintConfig _config = const PrintConfig();
  bool _uploading = false;
  String _uploadNote = '';

  @override
  void initState() {
    super.initState();
    PrintStoreService.config(refresh: true).then((c) {
      if (mounted) setState(() => _config = c);
    });
  }

  String _rs(double v) => '₹${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

  /// Picks files and uploads them; the configure screen opens with the results.
  Future<void> pickAndUpload() async {
    final token = await CommonServices.getToken();
    if (!mounted) return;
    if (token.isEmpty) {
      customToast(message: 'Please login to print files');
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
      return;
    }
    if (!_config.enabled) {
      customToast(message: 'The print store is closed right now');
      return;
    }
    final picked = await FilePicker.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'jpg', 'jpeg', 'png'],
    );
    if (picked == null || picked.files.isEmpty || !mounted) return;
    final jobs = await uploadFiles(picked.files);
    if (jobs.isEmpty || !mounted) return;
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => PrintConfigureScreen(initialJobs: jobs, config: _config)));
  }

  Future<List<PrintJob>> uploadFiles(List<PlatformFile> files) async {
    setState(() => _uploading = true);
    final jobs = <PrintJob>[];
    for (var i = 0; i < files.length; i++) {
      final f = files[i];
      if (f.path == null) continue;
      setState(() => _uploadNote = 'Uploading ${i + 1} of ${files.length}: ${f.name}');
      final result = await PrintStoreService.upload(File(f.path!), f.name);
      if (result.ok) {
        jobs.add(result.value!);
      } else {
        customToast(message: result.error ?? 'Could not upload ${f.name}');
      }
    }
    if (mounted) setState(() => _uploading = false);
    return jobs;
  }

  @override
  Widget build(BuildContext context) {
    final home = Get.find<HomeController>();
    return WillPopScope(
      onWillPop: () async {
        home.updateTabIndex(0);
        return false;
      },
      child: Scaffold(
        backgroundColor: bg1,
        body: Stack(children: [
          ListView(
            padding: EdgeInsets.zero,
            children: [
              _hero(context),
              Transform.translate(offset: const Offset(0, -28), child: _documentsCard()),
              _howItWorks(),
              _deliveryNote(),
              const SizedBox(height: 120),
            ],
          ),
          if (_uploading)
            Positioned.fill(
              child: Container(
                color: Colors.black.withOpacity(0.35),
                alignment: Alignment.center,
                child: Container(
                  margin: const EdgeInsets.all(32),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: white, borderRadius: BorderRadius.circular(16)),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const CircularProgressIndicator(color: primary),
                    const SizedBox(height: 14),
                    Text(_uploadNote, textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13, color: tColor)),
                  ]),
                ),
              ),
            ),
        ]),
      ),
    );
  }

  Widget _hero(BuildContext context) => Container(
        width: double.infinity,
        padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 22, 20, 52),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFFF4C2), Color(0xFFFDF8E8)],
          ),
        ),
        child: Column(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(20)),
            child: Text('NEW', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w800, color: white, letterSpacing: 1)),
          ),
          const SizedBox(height: 10),
          Text('Print Store', style: GoogleFonts.poppins(fontSize: 32, fontWeight: FontWeight.w800, color: tColor, height: 1.1)),
          const SizedBox(height: 6),
          Text('ClikGett keeps your files secure at every step',
              textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13.5, color: tColor3)),
        ]),
      );

  Widget _documentsCard() => Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.fromLTRB(18, 18, 14, 18),
        decoration: BoxDecoration(
          color: white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: softCardShadow,
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Documents', style: GoogleFonts.poppins(fontSize: 19, fontWeight: FontWeight.w800, color: tColor)),
              const SizedBox(height: 8),
              _bullet('Price starting at ${_rs(_config.priceBW)}/page'),
              _bullet('Colour prints at ${_rs(_config.priceColor)}/page'),
              _bullet('Paper quality: ${_config.paperGsm} GSM'),
              _bullet('Single side prints · PDF, JPG, PNG'),
              const SizedBox(height: 14),
              SizedBox(
                height: 44,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primary,
                    foregroundColor: white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: _uploading ? null : pickAndUpload,
                  icon: const Icon(Icons.upload_file_rounded, size: 20),
                  label: Text('Upload Files', style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700)),
                ),
              ),
            ]),
          ),
          const SizedBox(width: 8),
          _paperStack(),
        ]),
      );

  Widget _bullet(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(children: [
          const Icon(Icons.auto_awesome, size: 13, color: grey70),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4))),
        ]),
      );

  /// A small stack of "pages" as the card's illustration.
  Widget _paperStack() => SizedBox(
        width: 92,
        height: 118,
        child: Stack(children: [
          Positioned(left: 0, top: 14, child: _page(const Color(0xFFE0F2FE), -0.12)),
          Positioned(left: 14, top: 6, child: _page(const Color(0xFFFFF7ED), 0.0)),
          Positioned(
            left: 26,
            top: 0,
            child: Container(
              width: 64,
              height: 88,
              decoration: BoxDecoration(
                color: white,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: cardBorder),
                boxShadow: softCardShadow,
              ),
              child: Column(children: [
                Container(
                  height: 18,
                  decoration: const BoxDecoration(
                    color: primary,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(6)),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(Icons.print_rounded, size: 12, color: white),
                ),
                const SizedBox(height: 6),
                for (var i = 0; i < 5; i++)
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                    height: 3,
                    color: const Color(0xFFE5E7EB),
                  ),
              ]),
            ),
          ),
        ]),
      );

  Widget _page(Color color, double angle) => Transform.rotate(
        angle: angle,
        child: Container(
          width: 60,
          height: 84,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(6), border: Border.all(color: cardBorder)),
        ),
      );

  Widget _howItWorks() => Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: white, borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('How it works', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: tColor)),
          const SizedBox(height: 10),
          _step(Icons.upload_file_rounded, 'Upload', 'PDFs or photos from your phone'),
          _step(Icons.tune_rounded, 'Choose', 'Copies, colour or B&W, portrait or landscape'),
          _step(Icons.delivery_dining_rounded, 'Get it delivered', 'Add groceries too, everything comes together'),
        ]),
      );

  Widget _step(IconData icon, String title, String subtitle) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(children: [
          Container(
            width: 38,
            height: 38,
            decoration: const BoxDecoration(color: primaryGhost, shape: BoxShape.circle),
            child: Icon(icon, size: 19, color: primaryDark),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w700, color: tColor)),
              Text(subtitle, style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
            ]),
          ),
        ]),
      );

  Widget _deliveryNote() => Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: primaryGhost, borderRadius: BorderRadius.circular(14)),
        child: Row(children: [
          const Icon(Icons.timer_outlined, color: primaryDark),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Prints alone arrive in about ${_config.printOnlyMinutes} minutes. '
              'With other items, your order takes ${_config.extraMinutesWithItems} minutes more.',
              style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4),
            ),
          ),
        ]),
      );
}
