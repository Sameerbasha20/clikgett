import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/Cart.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/print_store_service.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// Choose copies (per file), colour and orientation, then add the prints to the cart.
class PrintConfigureScreen extends StatefulWidget {
  final List<PrintJob> initialJobs;
  final PrintConfig config;

  const PrintConfigureScreen({super.key, required this.initialJobs, required this.config});

  @override
  State<PrintConfigureScreen> createState() => _PrintConfigureScreenState();
}

class _PrintConfigureScreenState extends State<PrintConfigureScreen> {
  late final List<PrintJob> _jobs = [...widget.initialJobs];
  late final Map<int, int> _copies = {for (final j in widget.initialJobs) j.id: 1};
  bool _color = false;
  bool _landscape = false;
  bool _busy = false;
  String _busyNote = '';
  int _page = 0;

  PrintConfig get _cfg => widget.config;

  int get _printedPages => _jobs.fold(0, (n, j) => n + j.pages * (_copies[j.id] ?? 1));
  double get _total => _printedPages * _cfg.priceFor(_color);

  String _rs(double v) => '₹${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

  Future<void> _addFiles() async {
    final picked = await FilePicker.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'jpg', 'jpeg', 'png'],
    );
    if (picked == null || picked.files.isEmpty || !mounted) return;
    setState(() => _busy = true);
    for (var i = 0; i < picked.files.length; i++) {
      final f = picked.files[i];
      if (f.path == null) continue;
      setState(() => _busyNote = 'Uploading ${i + 1} of ${picked.files.length}: ${f.name}');
      final result = await PrintStoreService.upload(File(f.path!), f.name);
      if (!mounted) return;
      if (result.ok) {
        setState(() {
          _jobs.add(result.value!);
          _copies[result.value!.id] = 1;
        });
      } else {
        customToast(message: result.error ?? 'Could not upload ${f.name}');
      }
    }
    if (mounted) setState(() => _busy = false);
  }

  void _removeFile(PrintJob job) {
    setState(() {
      _jobs.remove(job);
      _copies.remove(job.id);
      if (_page >= _jobs.length) _page = _jobs.isEmpty ? 0 : _jobs.length - 1;
    });
    if (_jobs.isEmpty) Navigator.of(context).pop();
  }

  Future<void> _addToCart() async {
    if (_jobs.isEmpty || _busy) return;
    setState(() {
      _busy = true;
      _busyNote = 'Adding to cart';
    });
    final result = await PrintStoreService.addToCart([
      for (final j in _jobs)
        {
          'PrintJobID': j.id,
          'Copies': _copies[j.id] ?? 1,
          'ColorMode': _color ? 'COLOR' : 'BW',
          'Orientation': _landscape ? 'LANDSCAPE' : 'PORTRAIT',
        }
    ]);
    if (!mounted) return;
    setState(() => _busy = false);
    if (!result.ok) {
      customToast(message: result.error ?? 'Could not add to cart');
      return;
    }
    await Get.find<CartController>().refreshPrints();
    customToast(message: 'Prints added to your cart');
    if (!mounted) return;
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const Cart(isFromHomeScreen: false)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg1,
      appBar: AppBar(
        backgroundColor: bg1,
        foregroundColor: tColor,
        elevation: 0,
        title: Text('Print settings', style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: primaryDark,
                backgroundColor: primaryGhost,
                side: const BorderSide(color: primary),
                shape: const StadiumBorder(),
              ),
              onPressed: _busy ? null : _addFiles,
              icon: const Icon(Icons.note_add_outlined, size: 18),
              label: Text('Add files', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
      body: Stack(children: [
        ListView(
          padding: const EdgeInsets.fromLTRB(14, 4, 14, 20),
          children: [
            _preview(),
            const SizedBox(height: 14),
            _copiesCard(),
            const SizedBox(height: 12),
            _optionsCard(),
          ],
        ),
        if (_busy)
          Positioned.fill(
            child: Container(
              color: Colors.black.withOpacity(0.3),
              alignment: Alignment.center,
              child: Container(
                margin: const EdgeInsets.all(32),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: white, borderRadius: BorderRadius.circular(16)),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const CircularProgressIndicator(color: primary),
                  const SizedBox(height: 14),
                  Text(_busyNote, textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13, color: tColor)),
                ]),
              ),
            ),
          ),
      ]),
      bottomNavigationBar: _bottomBar(),
    );
  }

  /// Swipeable preview of each file, shaped like the chosen paper.
  Widget _preview() {
    return SizedBox(
      height: 300,
      child: PageView.builder(
        itemCount: _jobs.length,
        onPageChanged: (i) => setState(() => _page = i),
        controller: PageController(viewportFraction: _jobs.length > 1 ? 0.82 : 1, initialPage: _page),
        itemBuilder: (_, i) {
          final job = _jobs[i];
          return Center(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 6),
              width: _landscape ? 290 : 210,
              height: _landscape ? 205 : 290,
              decoration: BoxDecoration(
                color: white,
                border: Border.all(color: cardBorder),
                boxShadow: softCardShadow,
              ),
              child: Stack(children: [
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: job.isPdf
                        ? Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                            const Icon(Icons.picture_as_pdf_rounded, size: 56, color: Color(0xFFDC2626)),
                            const SizedBox(height: 8),
                            Text(job.fileName,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600, color: tColor)),
                            Text('${job.pages} page${job.pages == 1 ? '' : 's'}',
                                style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
                          ])
                        : ColorFiltered(
                            colorFilter: _color
                                ? const ColorFilter.mode(Colors.transparent, BlendMode.dst)
                                : const ColorFilter.matrix([
                                    0.2126, 0.7152, 0.0722, 0, 0,
                                    0.2126, 0.7152, 0.0722, 0, 0,
                                    0.2126, 0.7152, 0.0722, 0, 0,
                                    0, 0, 0, 1, 0,
                                  ]),
                            child: CustomNetworkImage(url: job.fileUrl, fit: BoxFit.contain),
                          ),
                  ),
                ),
                Positioned(
                  top: 6,
                  right: 6,
                  child: InkWell(
                    onTap: () => _removeFile(job),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(color: white, shape: BoxShape.circle, border: Border.all(color: cardBorder)),
                      child: const Icon(Icons.close_rounded, size: 16, color: tColor),
                    ),
                  ),
                ),
              ]),
            ),
          );
        },
      ),
    );
  }

  Widget _copiesCard() => Container(
        padding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
        decoration: BoxDecoration(color: white, borderRadius: BorderRadius.circular(14), border: Border.all(color: cardBorder)),
        child: Column(children: [
          for (var i = 0; i < _jobs.length; i++) ...[
            if (i > 0) const Divider(height: 1, color: cardBorder),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(_jobs.length == 1 ? 'Number of copies' : _jobs[i].fileName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: tColor)),
                    Text('File ${i + 1} (${_jobs[i].pages} page${_jobs[i].pages == 1 ? '' : 's'})',
                        style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
                  ]),
                ),
                _stepper(_jobs[i]),
              ]),
            ),
          ],
        ]),
      );

  Widget _stepper(PrintJob job) {
    final copies = _copies[job.id] ?? 1;
    return Container(
      height: 36,
      decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(10)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        IconButton(
          visualDensity: VisualDensity.compact,
          icon: const Icon(Icons.remove_rounded, color: white, size: 18),
          onPressed: copies <= 1 ? null : () => setState(() => _copies[job.id] = copies - 1),
        ),
        Text('$copies', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: white)),
        IconButton(
          visualDensity: VisualDensity.compact,
          icon: const Icon(Icons.add_rounded, color: white, size: 18),
          onPressed: copies >= _cfg.maxCopies ? null : () => setState(() => _copies[job.id] = copies + 1),
        ),
      ]),
    );
  }

  Widget _optionsCard() => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: white, borderRadius: BorderRadius.circular(14), border: Border.all(color: cardBorder)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Choose print colour', style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor)),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(
              child: _option(
                selected: _color,
                icon: const _ColorDots(color: true),
                title: 'Coloured',
                subtitle: '${_rs(_cfg.priceColor)}/page',
                onTap: () => setState(() => _color = true),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _option(
                selected: !_color,
                icon: const _ColorDots(color: false),
                title: 'B & W',
                subtitle: '${_rs(_cfg.priceBW)}/page',
                onTap: () => setState(() => _color = false),
              ),
            ),
          ]),
          const SizedBox(height: 16),
          Text('Choose print orientation', style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor)),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(
              child: _option(
                selected: !_landscape,
                icon: const Icon(Icons.crop_portrait_rounded, color: Color(0xFF2563EB), size: 26),
                title: 'Portrait',
                subtitle: '8.3 x 11.7 in',
                onTap: () => setState(() => _landscape = false),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _option(
                selected: _landscape,
                icon: const Icon(Icons.crop_landscape_rounded, color: Color(0xFF2563EB), size: 26),
                title: 'Landscape',
                subtitle: '11.7 x 8.3 in',
                onTap: () => setState(() => _landscape = true),
              ),
            ),
          ]),
        ]),
      );

  Widget _option({
    required bool selected,
    required Widget icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) =>
      InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          decoration: BoxDecoration(
            color: selected ? primaryGhost : white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: selected ? primary : cardBorder, width: selected ? 1.5 : 1),
          ),
          child: Row(children: [
            icon,
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w600, color: tColor)),
                Text(subtitle, style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
              ]),
            ),
          ]),
        ),
      );

  Widget _bottomBar() => Container(
        decoration: const BoxDecoration(color: white, border: Border(top: BorderSide(color: cardBorder))),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            child: Row(children: [
              Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Total $_printedPages page${_printedPages == 1 ? '' : 's'}',
                    style: GoogleFonts.poppins(fontSize: 12.5, color: tColor3)),
                Text(_rs(_total), style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w800, color: tColor)),
              ]),
              const SizedBox(width: 16),
              Expanded(
                child: SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primary,
                      foregroundColor: white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _jobs.isEmpty || _busy ? null : _addToCart,
                    child: Text('Add to cart', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ),
              ),
            ]),
          ),
        ),
      );
}

/// Overlapping ink dots: three colours, or grey for black & white.
class _ColorDots extends StatelessWidget {
  final bool color;
  const _ColorDots({required this.color});

  @override
  Widget build(BuildContext context) {
    final colors = color
        ? const [Color(0xFFFACC15), Color(0xFFEF4444), Color(0xFF3B82F6)]
        : const [Color(0xFFD1D5DB), Color(0xFF6B7280), Color(0xFF111827)];
    return SizedBox(
      width: 34,
      height: 26,
      child: Stack(children: [
        Positioned(left: 4, top: 0, child: _dot(colors[0])),
        Positioned(left: 0, top: 10, child: _dot(colors[1])),
        Positioned(left: 14, top: 10, child: _dot(colors[2])),
      ]),
    );
  }

  Widget _dot(Color c) => Container(width: 16, height: 16, decoration: BoxDecoration(color: c.withOpacity(0.85), shape: BoxShape.circle));
}
