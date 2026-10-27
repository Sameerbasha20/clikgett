import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdfx/pdfx.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/new/Constants/colors.dart';

/// Invoice preview: the PDF is downloaded once and drawn by the phone's own
/// PDF renderer, so it works without a web viewer and the customer's token
/// never leaves our server. Download saves the same file.
class InAppPdfViewerPage extends StatefulWidget {
  final String pdfUrl;
  final int? orderId;

  const InAppPdfViewerPage({
    Key? key,
    required this.pdfUrl,
    this.orderId,
  }) : super(key: key);

  @override
  State<InAppPdfViewerPage> createState() => _InAppPdfViewerPageState();
}

class _InAppPdfViewerPageState extends State<InAppPdfViewerPage> {
  Uint8List? _bytes;
  PdfControllerPinch? _pdf;
  bool _loading = true;
  bool _failed = false;
  bool _saving = false;
  int _page = 1;
  int _pages = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _pdf?.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final res = await Dio().get<List<int>>(widget.pdfUrl, options: Options(responseType: ResponseType.bytes));
      final data = Uint8List.fromList(res.data ?? const []);
      // A JSON error (expired login, missing order) is not a PDF.
      final isPdf = data.length > 4 && String.fromCharCodes(data.sublist(0, 4)) == '%PDF';
      if (!isPdf) throw Exception('Not a PDF');
      _pdf?.dispose();
      final controller = PdfControllerPinch(document: PdfDocument.openData(data));
      if (!mounted) return;
      setState(() {
        _bytes = data;
        _pdf = controller;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _failed = true;
      });
    }
  }

  String get _fileName {
    final seq = widget.orderId != null ? widget.orderId.toString().padLeft(4, '0') : 'invoice';
    return 'Receipt_ORD_$seq.pdf';
  }

  Future<void> _download() async {
    if (_bytes == null) return;
    setState(() => _saving = true);
    try {
      Directory? dir;
      if (Platform.isAndroid) dir = await getExternalStorageDirectory();
      dir ??= await getApplicationDocumentsDirectory();
      await File('${dir.path}/$_fileName').writeAsBytes(_bytes!, flush: true);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: const Color(0xFF16A34A),
        content: Text('Receipt saved as $_fileName', style: GoogleFonts.poppins(color: Colors.white, fontSize: 13)),
        action: SnackBarAction(label: 'OPEN', textColor: Colors.white, onPressed: _openInBrowser),
      ));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: Colors.red.shade700,
        content: Text('Could not save the receipt. Try opening it in the browser.',
            style: GoogleFonts.poppins(color: Colors.white, fontSize: 13)),
        action: SnackBarAction(label: 'BROWSER', textColor: Colors.white, onPressed: _openInBrowser),
      ));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _openInBrowser() async {
    try {
      await launchUrl(Uri.parse(widget.pdfUrl), mode: LaunchMode.externalApplication);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open the receipt')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.black87),
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Invoice', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 16.5.sp, color: Colors.black87)),
          if (widget.orderId != null)
            Text('Order #${widget.orderId}', style: GoogleFonts.poppins(fontSize: 12.sp, color: Colors.grey.shade600)),
        ]),
        actions: [
          IconButton(
            tooltip: 'Open in browser',
            icon: const Icon(Icons.open_in_new_rounded, color: Colors.black87),
            onPressed: _openInBrowser,
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: EdgeInsets.fromLTRB(5.w, 1.2.h, 5.w, 1.2.h),
          decoration: BoxDecoration(color: Colors.white, boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -3)),
          ]),
          child: SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Appprimary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: Colors.grey.shade300,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: _bytes == null || _saving ? null : _download,
              icon: _saving
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.file_download_outlined, size: 20),
              label: Text(_saving ? 'Saving...' : 'Download PDF',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14.sp)),
            ),
          ),
        ),
      ),
      body: _loading
          ? Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                CircularProgressIndicator(color: Appprimary),
                const SizedBox(height: 14),
                Text('Preparing your invoice...', style: GoogleFonts.poppins(fontSize: 13.sp, color: Colors.grey.shade700)),
              ]),
            )
          : _failed
              ? _errorView()
              : Stack(children: [
                  PdfViewPinch(
                    controller: _pdf!,
                    padding: 12,
                    backgroundDecoration: const BoxDecoration(color: Color(0xFFF1F5F9)),
                    onDocumentLoaded: (doc) => setState(() => _pages = doc.pagesCount),
                    onPageChanged: (page) => setState(() => _page = page),
                  ),
                  if (_pages > 1)
                    Positioned(
                      bottom: 14,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(color: Colors.black.withOpacity(0.65), borderRadius: BorderRadius.circular(20)),
                          child: Text('Page $_page of $_pages',
                              style: GoogleFonts.poppins(color: Colors.white, fontSize: 11.5.sp, fontWeight: FontWeight.w500)),
                        ),
                      ),
                    ),
                ]),
    );
  }

  Widget _errorView() {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 8.w),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(color: Appprimary.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(Icons.receipt_long_rounded, size: 40, color: Appprimary),
          ),
          SizedBox(height: 2.h),
          Text("Couldn't load the invoice",
              style: GoogleFonts.poppins(fontSize: 15.sp, fontWeight: FontWeight.w700, color: Colors.black87)),
          SizedBox(height: 0.8.h),
          Text('Check your internet connection and try again.',
              textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 12.5.sp, color: Colors.grey.shade600)),
          SizedBox(height: 2.5.h),
          Row(mainAxisSize: MainAxisSize.min, children: [
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Appprimary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: Text('Try again', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
            ),
            const SizedBox(width: 10),
            OutlinedButton(
              style: OutlinedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              onPressed: _openInBrowser,
              child: Text('Open in browser', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: Colors.black87)),
            ),
          ]),
        ]),
      ),
    );
  }
}
