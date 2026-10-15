import 'dart:io';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Support/EnquiryScreen.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class SearchProductRequestCard extends StatelessWidget {
  final String searchQuery;
  final VoidCallback? onClearSearch;

  const SearchProductRequestCard({
    Key? key,
    required this.searchQuery,
    this.onClearSearch,
  }) : super(key: key);

  void _navigateToManualRequest(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => EnquiryScreen(
          initialCategory: 'Product Request',
          initialProductName: searchQuery.trim(),
        ),
      ),
    );
  }

  Future<void> _handleImageSelection(BuildContext context, ImageSource source) async {
    try {
      final picker = ImagePicker();
      final XFile? pickedFile = await picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1600,
        maxHeight: 1600,
      );

      if (pickedFile == null) return; // User cancelled

      final file = File(pickedFile.path);
      if (!context.mounted) return;

      _showImagePreviewDialog(context, file);
    } catch (e) {
      customToast(message: "Could not open camera or gallery. You can still request manually.");
    }
  }

  void _showCameraPickerSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 2.h, horizontal: 4.w),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                "Request with Camera",
                style: GoogleFonts.poppins(
                  fontSize: 16.5.sp,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 0.5.h),
              Text(
                "Snap a photo of the product package or choose an existing photo",
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 12.sp,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(height: 2.h),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Appprimary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.camera_alt_rounded, color: Appprimary),
                ),
                title: Text(
                  "Take Photo",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                ),
                subtitle: const Text("Capture with device camera"),
                onTap: () {
                  Navigator.pop(ctx);
                  _handleImageSelection(context, ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.photo_library_rounded, color: Colors.blue),
                ),
                title: Text(
                  "Choose from Gallery",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                ),
                subtitle: const Text("Select image from your photos"),
                onTap: () {
                  Navigator.pop(ctx);
                  _handleImageSelection(context, ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showImagePreviewDialog(BuildContext context, File initialFile) {
    File currentFile = initialFile;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Row(
              children: [
                const Icon(Icons.preview_rounded, color: Appprimary, size: 24),
                const SizedBox(width: 8),
                Text(
                  "Product Photo Preview",
                  style: GoogleFonts.poppins(
                    fontSize: 15.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(
                    currentFile,
                    height: 25.h,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                SizedBox(height: 1.5.h),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    TextButton.icon(
                      onPressed: () async {
                        try {
                          final picker = ImagePicker();
                          final XFile? rePicked = await picker.pickImage(
                            source: ImageSource.camera,
                            imageQuality: 85,
                          );
                          if (rePicked != null) {
                            setDialogState(() {
                              currentFile = File(rePicked.path);
                            });
                          }
                        } catch (_) {}
                      },
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: Text(
                        "Replace",
                        style: GoogleFonts.poppins(fontSize: 12.sp),
                      ),
                    ),
                    TextButton.icon(
                      style: TextButton.styleFrom(foregroundColor: Colors.red),
                      onPressed: () {
                        Navigator.pop(dialogCtx);
                      },
                      icon: const Icon(Icons.delete_outline_rounded, size: 18),
                      label: Text(
                        "Remove",
                        style: GoogleFonts.poppins(fontSize: 12.sp),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogCtx),
                child: Text(
                  "Cancel",
                  style: GoogleFonts.poppins(color: Colors.grey[700]),
                ),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Appprimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                onPressed: () {
                  Navigator.pop(dialogCtx);
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => EnquiryScreen(
                        initialCategory: 'Product Request',
                        initialProductName: searchQuery.trim(),
                        initialImageFile: currentFile,
                      ),
                    ),
                  );
                },
                child: Text(
                  "Continue",
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 2.h, horizontal: 1.w),
      padding: EdgeInsets.all(4.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Appprimary.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.inventory_2_outlined,
              color: Appprimary,
              size: 26,
            ),
          ),
          SizedBox(height: 1.h),
          Text(
            "Can't find the product you're looking for?",
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 14.5.sp,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          SizedBox(height: 0.5.h),
          Text(
            "Tell us what you need, and we'll review your request.",
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 12.sp,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 2.h),

          // Two Action Buttons: Request Product & Request with Camera
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _navigateToManualRequest(context),
                  icon: const Icon(Icons.edit_note_rounded, size: 19),
                  label: Text(
                    "Request Product",
                    style: GoogleFonts.poppins(
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Appprimary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: EdgeInsets.symmetric(vertical: 1.2.h),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
              SizedBox(width: 2.5.w),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showCameraPickerSheet(context),
                  icon: const Icon(Icons.camera_alt_rounded, size: 18),
                  label: Text(
                    "Request with Camera",
                    style: GoogleFonts.poppins(
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Appprimary,
                    side: const BorderSide(color: Appprimary, width: 1.2),
                    padding: EdgeInsets.symmetric(vertical: 1.2.h),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ],
          ),

          if (onClearSearch != null) ...[
            SizedBox(height: 1.2.h),
            TextButton.icon(
              onPressed: onClearSearch,
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: Text(
                "Clear Search",
                style: GoogleFonts.poppins(
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[700],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
