import 'dart:io';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/new/Constants/colors.dart';

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
  bool isDownloading = false;
  bool isPdfLoading = true;
  bool loadFailed = false;

  Future<void> _downloadPdf() async {
    setState(() {
      isDownloading = true;
    });

    try {
      Directory? dir;

      if (Platform.isAndroid) {
        dir = await getExternalStorageDirectory();
        // Fallback to downloads or application docs if external is null
        dir ??= await getApplicationDocumentsDirectory();
      } else if (Platform.isIOS) {
        dir = await getApplicationDocumentsDirectory();
      }

      if (dir == null) throw Exception('Storage directory not accessible.');

      final orderSeq = widget.orderId != null
          ? widget.orderId.toString().padLeft(4, '0')
          : 'invoice';
      final fileName = 'Receipt_ORD_$orderSeq.pdf';
      final savePath = '${dir.path}/$fileName';

      await Dio().download(widget.pdfUrl, savePath);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF16A34A),
          content: Text(
            'Receipt downloaded successfully!\nSaved to: $fileName',
            style: GoogleFonts.poppins(color: Colors.white, fontSize: 13),
          ),
          duration: const Duration(seconds: 4),
          action: SnackBarAction(
            label: 'OPEN',
            textColor: Colors.white,
            onPressed: _openInBrowser,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red.shade700,
          content: Text(
            'Download failed: $e. You can open in browser instead.',
            style: GoogleFonts.poppins(color: Colors.white, fontSize: 13),
          ),
          action: SnackBarAction(
            label: 'BROWSER',
            textColor: Colors.white,
            onPressed: _openInBrowser,
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          isDownloading = false;
        });
      }
    }
  }

  Future<void> _openInBrowser() async {
    try {
      final uri = Uri.parse(widget.pdfUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(uri);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open URL: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewerUrl =
        'https://docs.google.com/gview?embedded=true&url=${widget.pdfUrl}';

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        title: Text(
          "Transaction Receipt",
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            fontSize: 16.sp,
            color: Colors.black87,
          ),
        ),
        actions: [
          IconButton(
            tooltip: "Download PDF Receipt",
            icon: isDownloading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Appprimary,
                      strokeWidth: 2,
                    ),
                  )
                : Icon(Icons.download_rounded, color: Appprimary),
            onPressed: isDownloading ? null : _downloadPdf,
          ),
          IconButton(
            tooltip: "Open in Browser",
            icon: const Icon(Icons.open_in_browser_rounded, color: Colors.black87),
            onPressed: _openInBrowser,
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 1.5.h),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Appprimary,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(vertical: 1.3.h),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: isDownloading ? null : _downloadPdf,
                icon: isDownloading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.file_download_outlined, size: 20),
                label: Text(
                  isDownloading ? "Downloading..." : "Download Receipt PDF",
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5.sp,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      body: Stack(
        children: [
          InAppWebView(
            initialUrlRequest: URLRequest(url: WebUri(viewerUrl)),
            initialOptions: InAppWebViewGroupOptions(
              crossPlatform: InAppWebViewOptions(
                javaScriptEnabled: true,
                useShouldOverrideUrlLoading: true,
              ),
            ),
            onLoadStop: (controller, url) {
              if (mounted) {
                setState(() {
                  isPdfLoading = false;
                });
              }
            },
            onLoadError: (controller, url, code, message) {
              if (mounted) {
                setState(() {
                  isPdfLoading = false;
                  loadFailed = true;
                });
              }
            },
          ),
          if (isPdfLoading)
            Center(
              child: CircularProgressIndicator(color: Appprimary),
            ),
          if (loadFailed)
            Center(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 6.w),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.receipt_long_rounded,
                        size: 56, color: Appprimary),
                    SizedBox(height: 2.h),
                    Text(
                      "Official Transaction Receipt",
                      style: GoogleFonts.poppins(
                        fontSize: 15.sp,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    SizedBox(height: 1.h),
                    Text(
                      "Receipt is ready for download. Tap the button below to download or view it in your browser.",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontSize: 12.sp,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    SizedBox(height: 2.5.h),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Appprimary,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(
                            horizontal: 6.w, vertical: 1.2.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: _downloadPdf,
                      icon: const Icon(Icons.download_rounded, size: 18),
                      label: Text(
                        "Download Receipt",
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          fontSize: 13.sp,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
