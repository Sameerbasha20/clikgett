import 'dart:convert';
import 'dart:io';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/customer_requests_service.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class ProductRequestScreen extends StatefulWidget {
  final String? initialProductName;

  const ProductRequestScreen({
    Key? key,
    this.initialProductName,
  }) : super(key: key);

  @override
  State<ProductRequestScreen> createState() => _ProductRequestScreenState();
}

class _ProductRequestScreenState extends State<ProductRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  final TextEditingController _brandController = TextEditingController();
  final TextEditingController _sizeQtyController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  final ImagePicker _picker = ImagePicker();
  XFile? _selectedImage;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialProductName ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _brandController.dispose();
    _sizeQtyController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1600,
        maxHeight: 1600,
      );
      if (image != null) {
        setState(() {
          _selectedImage = image;
        });
      }
    } catch (e) {
      debugPrint("Error picking image: $e");
      customToast(message: "Failed to select image");
    }
  }

  void _showImagePickerSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 2.h, horizontal: 5.w),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                "Attach Product Photo",
                style: GoogleFonts.poppins(
                  fontSize: 16.5.sp,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 2.h),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Appprimary.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.camera_alt_rounded, color: Appprimary),
                ),
                title: Text(
                  "Take Picture",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w500),
                ),
                subtitle: const Text("Capture the packaging or product directly"),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Appprimary.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.photo_library_rounded, color: Appprimary),
                ),
                title: Text(
                  "Choose from Gallery",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w500),
                ),
                subtitle: const Text("Upload from your saved photos"),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final productName = _nameController.text.trim();
    final brand = _brandController.text.trim();
    final sizeOrQty = _sizeQtyController.text.trim();
    final description = _descriptionController.text.trim();

    String? base64Image;
    String? mimeType;

    if (_selectedImage != null) {
      try {
        final File file = File(_selectedImage!.path);
        final List<int> bytes = await file.readAsBytes();
        base64Image = base64Encode(bytes);

        final lowerPath = _selectedImage!.path.toLowerCase();
        if (lowerPath.endsWith('.png')) {
          mimeType = 'image/png';
        } else if (lowerPath.endsWith('.webp')) {
          mimeType = 'image/webp';
        } else {
          mimeType = 'image/jpeg';
        }
      } catch (e) {
        debugPrint("Error encoding image: $e");
        customToast(message: "Failed to read image file");
        return;
      }
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final res = await CustomerRequestsService.submitProductRequest(
        productName: productName,
        brand: brand.isNotEmpty ? brand : null,
        sizeOrQty: sizeOrQty.isNotEmpty ? sizeOrQty : null,
        description: description.isNotEmpty ? description : null,
        imageBase64: base64Image,
        mimeType: mimeType,
      );

      if (!mounted) return;

      setState(() {
        _isSubmitting = false;
      });

      if (res['Status'] == 1) {
        _showSuccessDialog(
          title: "Request Received!",
          message: res['Message'] ?? "We'll notify you as soon as this product is available.",
          isDuplicate: false,
        );
      } else if (res['Status'] == 2) {
        // Accidental duplicate detected
        _showSuccessDialog(
          title: "Already Requested",
          message: res['Message'] ?? "You already have a pending request for this product.",
          isDuplicate: true,
        );
      } else {
        customToast(message: res['Message'] ?? "Failed to submit request.");
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
      });
      customToast(message: "Network error. Please try again.");
    }
  }

  void _showSuccessDialog({
    required String title,
    required String message,
    required bool isDuplicate,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(
              isDuplicate ? Icons.info_outline_rounded : Icons.check_circle_rounded,
              color: isDuplicate ? Colors.orange : Colors.green,
              size: 28,
            ),
            const SizedBox(width: 10),
            Text(
              title,
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 17.sp),
            ),
          ],
        ),
        content: Text(
          message,
          style: GoogleFonts.poppins(fontSize: 14.sp, color: Colors.black87),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Appprimary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: Text(
              "Okay",
              style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        title: Text(
          "Request A Product",
          style: GoogleFonts.poppins(
            fontSize: 18.sp,
            fontWeight: FontWeight.w700,
            color: Colors.black,
          ),
        ),
        leading: IconButton(
          padding: EdgeInsets.zero,
          onPressed: () => Navigator.of(context).pop(),
          icon: Image.asset(
            backbutton,
            height: 4.5.h,
            width: 9.w,
            fit: BoxFit.contain,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 2.h),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Can't find what you need?",
                style: GoogleFonts.poppins(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 0.8.h),
              Text(
                "Tell us the product details or upload a photo. We'll procure it and notify you when it arrives in store!",
                style: GoogleFonts.poppins(
                  fontSize: 13.5.sp,
                  color: Colors.grey[600],
                  height: 1.4,
                ),
              ),
              SizedBox(height: 3.h),

              // Product Name (Required)
              Row(
                children: [
                  Text(
                    "Product Name",
                    style: GoogleFonts.poppins(
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w500,
                      color: Colors.black87,
                    ),
                  ),
                  const Text(" *", style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                ],
              ),
              SizedBox(height: 0.8.h),
              TextFormField(
                controller: _nameController,
                textInputAction: TextInputAction.next,
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return "Please enter the product name";
                  }
                  return null;
                },
                decoration: _inputDecoration("e.g. Amul Butter, Surf Excel, Organic Almonds"),
              ),
              SizedBox(height: 2.2.h),

              // Brand (Optional)
              Text(
                "Brand (Optional)",
                style: GoogleFonts.poppins(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 0.8.h),
              TextFormField(
                controller: _brandController,
                textInputAction: TextInputAction.next,
                decoration: _inputDecoration("e.g. Nestle, Britannia, Tata"),
              ),
              SizedBox(height: 2.2.h),

              // Size / Quantity / Pack (Optional)
              Text(
                "Size / Quantity / Variant (Optional)",
                style: GoogleFonts.poppins(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 0.8.h),
              TextFormField(
                controller: _sizeQtyController,
                textInputAction: TextInputAction.next,
                decoration: _inputDecoration("e.g. 500g, 1 Litre, Pack of 3"),
              ),
              SizedBox(height: 2.2.h),

              // Description / Notes (Optional)
              Text(
                "Additional Details / Description (Optional)",
                style: GoogleFonts.poppins(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 0.8.h),
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                minLines: 2,
                textInputAction: TextInputAction.done,
                decoration: _inputDecoration("Any specific flavour, color, or notes..."),
              ),
              SizedBox(height: 3.h),

              // Photo Section
              Text(
                "Attach Photo (Optional)",
                style: GoogleFonts.poppins(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 1.h),

              if (_selectedImage == null) ...[
                InkWell(
                  onTap: _showImagePickerSheet,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: double.infinity,
                    padding: EdgeInsets.symmetric(vertical: 2.5.h, horizontal: 4.w),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[300]!, style: BorderStyle.solid),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.add_a_photo_outlined, size: 28.sp, color: Appprimary),
                        SizedBox(height: 1.h),
                        Text(
                          "Tap to upload photo or take picture",
                          style: GoogleFonts.poppins(
                            fontSize: 13.5.sp,
                            fontWeight: FontWeight.w500,
                            color: Appprimary,
                          ),
                        ),
                        SizedBox(height: 0.4.h),
                        Text(
                          "Supports JPG, PNG up to 10MB",
                          style: GoogleFonts.poppins(
                            fontSize: 11.5.sp,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ] else ...[
                // Image Preview Card with Replace and Remove buttons
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Column(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.file(
                          File(_selectedImage!.path),
                          height: 22.h,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      SizedBox(height: 1.5.h),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          OutlinedButton.icon(
                            onPressed: _showImagePickerSheet,
                            icon: const Icon(Icons.refresh_rounded, size: 18, color: Appprimary),
                            label: Text(
                              "Replace",
                              style: GoogleFonts.poppins(color: Appprimary, fontSize: 13.5.sp),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Appprimary),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: () {
                              setState(() {
                                _selectedImage = null;
                              });
                            },
                            icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.red),
                            label: Text(
                              "Remove",
                              style: GoogleFonts.poppins(color: Colors.red, fontSize: 13.5.sp),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.red),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],

              SizedBox(height: 4.h),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 6.5.h,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitRequest,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Appprimary,
                    disabledBackgroundColor: Appprimary.withOpacity(0.6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 1,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          "Submit Request",
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              SizedBox(height: 2.h),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.poppins(color: Colors.grey[400], fontSize: 13.5.sp),
      filled: true,
      fillColor: Colors.grey[50],
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Appprimary, width: 1.5),
      ),
      contentPadding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.8.h),
    );
  }
}
