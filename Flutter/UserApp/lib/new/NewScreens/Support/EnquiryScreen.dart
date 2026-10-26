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

class EnquiryScreen extends StatefulWidget {
  final String? initialCategory;
  final String? initialProductName;
  final File? initialImageFile;

  const EnquiryScreen({
    Key? key,
    this.initialCategory,
    this.initialProductName,
    this.initialImageFile,
  }) : super(key: key);

  @override
  State<EnquiryScreen> createState() => _EnquiryScreenState();
}

class _EnquiryScreenState extends State<EnquiryScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _subjectController = TextEditingController();
  late final TextEditingController _productNameController;
  final TextEditingController _brandVariantController = TextEditingController();

  final ImagePicker _picker = ImagePicker();
  /// Photos to send: up to 3 for an enquiry, 1 for a product request.
  final List<File> _attachedImages = [];
  bool _isSubmitting = false;

  int get _maxPhotos => _selectedCategory == 'Product Request' ? 1 : 3;

  /// Opened from "Request with Camera": the photo is already attached.
  bool get _fromCamera => widget.initialImageFile != null;

  late String _selectedCategory;
  final List<String> _categories = [
    'Product Request',
    'General Support',
    'Account Related',
    'Delivery Related',
    'Payment Related',
    'Offer & Voucher Related',
    'Wallet Related',
  ];

  @override
  void initState() {
    super.initState();
    _productNameController =
        TextEditingController(text: widget.initialProductName ?? '');
    if (widget.initialImageFile != null) _attachedImages.add(widget.initialImageFile!);

    if (widget.initialCategory != null &&
        _categories.contains(widget.initialCategory)) {
      _selectedCategory = widget.initialCategory!;
    } else if (widget.initialProductName != null ||
        widget.initialImageFile != null) {
      _selectedCategory = 'Product Request';
    } else {
      _selectedCategory = 'General Support';
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _subjectController.dispose();
    _productNameController.dispose();
    _brandVariantController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? picked = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1600,
        maxHeight: 1600,
      );
      if (picked != null) {
        setState(() {
          if (_attachedImages.length >= _maxPhotos) _attachedImages.removeLast();
          _attachedImages.add(File(picked.path));
        });
      }
    } catch (e) {
      customToast(message: "Unable to access camera or gallery");
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
          padding: EdgeInsets.symmetric(vertical: 2.h, horizontal: 4.w),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _maxPhotos > 1 ? "Add a photo (${_attachedImages.length + 1} of $_maxPhotos)" : "Attach Product Photo",
                style: GoogleFonts.poppins(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 1.5.h),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Appprimary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child:
                      const Icon(Icons.camera_alt_rounded, color: Appprimary),
                ),
                title: Text(
                  "Take Photo (Camera)",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w500),
                ),
                subtitle:
                    const Text("Capture the product package or handwritten note"),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.photo_library_rounded,
                      color: Colors.blue),
                ),
                title: Text(
                  "Choose from Gallery",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w500),
                ),
                subtitle: const Text("Select an existing image from gallery"),
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

  Future<void> _submitEnquiry() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final isProductRequest = _selectedCategory == 'Product Request';
    final productName = _productNameController.text.trim();
    final brandVariant = _brandVariantController.text.trim();
    final description = _descriptionController.text.trim();
    final customSubject = _subjectController.text.trim();

    final fullSubject = isProductRequest
        ? '[Product Request] $productName'
        : (customSubject.isNotEmpty
            ? '[$_selectedCategory] $customSubject'
            : '[$_selectedCategory] Support Request');

    final images = <Map<String, String>>[];
    for (final file in _attachedImages.take(_maxPhotos)) {
      if (!await file.exists()) continue;
      try {
        final pathLower = file.path.toLowerCase();
        images.add({
          'imageBase64': base64Encode(await file.readAsBytes()),
          'mimeType': pathLower.endsWith('.png')
              ? 'image/png'
              : (pathLower.endsWith('.webp') ? 'image/webp' : 'image/jpeg'),
        });
      } catch (e) {
        customToast(message: "Failed to read a photo. Please try again.");
        return;
      }
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final res = await CustomerRequestsService.submitEnquiry(
        description: description,
        subject: fullSubject,
        category: _selectedCategory,
        productName: isProductRequest ? productName : null,
        brand: isProductRequest && brandVariant.isNotEmpty ? brandVariant : null,
        sizeOrQty:
            isProductRequest && brandVariant.isNotEmpty ? brandVariant : null,
        images: images,
      );

      if (!mounted) return;

      setState(() {
        _isSubmitting = false;
      });

      if (res['Status'] == 1 || res['Status'] == 2) {
        _showSuccessDialog(
          isProductRequest ? "Product Request Received" : "Enquiry Submitted",
          res['Message'] ??
              (isProductRequest
                  ? "Thank you for letting us know! Our procurement team will review your request and check availability."
                  : "Your enquiry has been submitted successfully."),
        );
      } else {
        customToast(
            message: res['Message'] ??
                'Failed to submit enquiry. Please try again.');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
      });
      customToast(
          message: 'Network error. Please check your connection and try again.');
    }
  }

  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.check_circle_rounded,
                color: Colors.green, size: 28),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600, fontSize: 16.sp),
              ),
            ),
          ],
        ),
        content: Text(
          message,
          style: GoogleFonts.poppins(fontSize: 13.5.sp, color: Colors.black87),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Appprimary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.pop(ctx); // Close dialog
              Navigator.pop(context); // Go back from EnquiryScreen
            },
            child: Text(
              "Done",
              style: GoogleFonts.poppins(
                  color: Colors.white, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isProductRequest = _selectedCategory == 'Product Request';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        title: Text(
          isProductRequest ? "Request Product" : "Submit Your Enquiry",
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
        padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 1.5.h),
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Standard Enquiry Header & FAQs
            if (!isProductRequest) ...[
              Text(
                "Submit Your Enquiry",
                style: GoogleFonts.poppins(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.w700,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 0.6.h),
              Text(
                "How can we help you today?",
                style: GoogleFonts.poppins(
                  fontSize: 14.5.sp,
                  fontWeight: FontWeight.w600,
                  color: Appprimary,
                ),
              ),
              SizedBox(height: 0.4.h),
              Text(
                "Tell us what went wrong or what you need. You can follow our reply under Profile > My requests.",
                style: GoogleFonts.poppins(fontSize: 12.5.sp, color: Colors.grey[600], height: 1.4),
              ),
              SizedBox(height: 2.5.h),
            ],

            // Product Request Banner
            if (isProductRequest) ...[
              Container(
                padding: EdgeInsets.all(4.w),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Appprimary.withOpacity(0.08),
                      Colors.teal.shade50.withOpacity(0.5),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Appprimary.withOpacity(0.2)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Appprimary.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.add_shopping_cart_rounded,
                          color: Appprimary, size: 24),
                    ),
                    SizedBox(width: 3.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Can't find what you need?",
                            style: GoogleFonts.poppins(
                              fontSize: 14.5.sp,
                              fontWeight: FontWeight.w600,
                              color: Appprimary,
                            ),
                          ),
                          SizedBox(height: 0.4.h),
                          Text(
                            "Tell us the product name, variant, or attach a photo. Our team will review your request and check availability.",
                            style: GoogleFonts.poppins(
                              fontSize: 12.sp,
                              color: Colors.black87,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 2.5.h),
            ],

            // Form
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // "Request with Camera": say what happened so this doesn't look like the plain form.
                  if (_fromCamera && isProductRequest)
                    Container(
                      width: double.infinity,
                      margin: EdgeInsets.only(bottom: 2.h),
                      padding: EdgeInsets.all(3.w),
                      decoration: BoxDecoration(
                        color: Appprimary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Appprimary.withOpacity(0.3)),
                      ),
                      child: Row(children: [
                        const Icon(Icons.photo_camera_rounded, color: Appprimary),
                        SizedBox(width: 3.w),
                        Expanded(
                          child: Text(
                            "Your photo is attached. Just add the product name and a short note, then send.",
                            style: GoogleFonts.poppins(fontSize: 12.5.sp, color: Colors.black87),
                          ),
                        ),
                      ]),
                    ),
                  Text(
                    isProductRequest
                        ? "Product Request Details"
                        : "Submit an Enquiry",
                    style: GoogleFonts.poppins(
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
                  ),
                  SizedBox(height: 0.8.h),
                  Text(
                    isProductRequest
                        ? "Fill in as much detail as you can so we can source the exact product."
                        : "Didn't find what you need in the FAQs? Write to us and our support team will help you.",
                    style: GoogleFonts.poppins(
                      fontSize: 13.sp,
                      color: Colors.grey[600],
                      height: 1.4,
                    ),
                  ),
                  SizedBox(height: 2.5.h),

                  // Category Selector
                  Text(
                    "Select Category",
                    style: GoogleFonts.poppins(
                      fontSize: 13.5.sp,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  SizedBox(height: 0.8.h),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 4.w),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[300]!),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedCategory,
                        isExpanded: true,
                        icon: const Icon(Icons.keyboard_arrow_down_rounded),
                        items: _categories.map((cat) {
                          return DropdownMenuItem<String>(
                            value: cat,
                            child: Row(
                              children: [
                                if (cat == 'Product Request')
                                  Padding(
                                    padding: EdgeInsets.only(right: 2.w),
                                    child: const Icon(
                                      Icons.shopping_bag_outlined,
                                      size: 18,
                                      color: Appprimary,
                                    ),
                                  ),
                                Text(
                                  cat,
                                  style: GoogleFonts.poppins(
                                    fontSize: 13.5.sp,
                                    color: cat == 'Product Request'
                                        ? Appprimary
                                        : Colors.black87,
                                    fontWeight: cat == 'Product Request'
                                        ? FontWeight.w600
                                        : FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (newVal) {
                          if (newVal != null) {
                            setState(() {
                              _selectedCategory = newVal;
                            });
                          }
                        },
                      ),
                    ),
                  ),
                  SizedBox(height: 2.h),

                  // Fields specific to Product Request
                  if (isProductRequest) ...[
                    // Product Name Field (Prefilled from search query)
                    Row(
                      children: [
                        Text(
                          "Product Name",
                          style: GoogleFonts.poppins(
                            fontSize: 13.5.sp,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                        const Text(" *",
                            style: TextStyle(
                                color: Colors.red,
                                fontWeight: FontWeight.bold)),
                      ],
                    ),
                    SizedBox(height: 0.8.h),
                    TextFormField(
                      controller: _productNameController,
                      textInputAction: TextInputAction.next,
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return "Please enter the product name";
                        }
                        if (val.trim().length < 2) {
                          return "Product name must be at least 2 characters";
                        }
                        return null;
                      },
                      decoration: InputDecoration(
                        hintText: "e.g., Oily Skin Face Wash, Fortune Oil",
                        hintStyle: GoogleFonts.poppins(
                            color: Colors.grey[400], fontSize: 13.5.sp),
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
                          borderSide:
                              const BorderSide(color: Appprimary, width: 1.5),
                        ),
                        contentPadding: EdgeInsets.symmetric(
                            horizontal: 4.w, vertical: 1.8.h),
                      ),
                    ),
                    SizedBox(height: 2.h),

                    // Brand, Size or Variant (Optional)
                    Text(
                      "Brand, Size or Variant (Optional)",
                      style: GoogleFonts.poppins(
                        fontSize: 13.5.sp,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    SizedBox(height: 0.8.h),
                    TextFormField(
                      controller: _brandVariantController,
                      textInputAction: TextInputAction.next,
                      decoration: InputDecoration(
                        hintText: "e.g., Brand name, 500g, 1L, Pack of 2",
                        hintStyle: GoogleFonts.poppins(
                            color: Colors.grey[400], fontSize: 13.5.sp),
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
                          borderSide:
                              const BorderSide(color: Appprimary, width: 1.5),
                        ),
                        contentPadding: EdgeInsets.symmetric(
                            horizontal: 4.w, vertical: 1.8.h),
                      ),
                    ),
                    SizedBox(height: 2.h),
                  ] else ...[
                    // Subject Field for Standard Enquiries
                    Text(
                      "Subject *",
                      style: GoogleFonts.poppins(
                        fontSize: 13.5.sp,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    SizedBox(height: 0.8.h),
                    TextFormField(
                      controller: _subjectController,
                      textInputAction: TextInputAction.next,
                      maxLength: 80,
                      validator: (val) => (val ?? '').trim().length < 4
                          ? "Add a short subject (e.g. Missing item in order #1202)"
                          : null,
                      decoration: InputDecoration(
                        counterText: '',
                        hintText:
                            "e.g., Order issue, Delivery question, App feedback",
                        hintStyle: GoogleFonts.poppins(
                            color: Colors.grey[400], fontSize: 13.5.sp),
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
                          borderSide:
                              const BorderSide(color: Appprimary, width: 1.5),
                        ),
                        contentPadding: EdgeInsets.symmetric(
                            horizontal: 4.w, vertical: 1.8.h),
                      ),
                    ),
                    SizedBox(height: 2.h),
                  ],

                  // Description Field
                  Row(
                    children: [
                      Text(
                        isProductRequest
                            ? "Product Description & Notes"
                            : "Description",
                        style: GoogleFonts.poppins(
                          fontSize: 13.5.sp,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const Text(" *",
                          style: TextStyle(
                              color: Colors.red, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  SizedBox(height: 0.8.h),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: isProductRequest ? 3 : 5,
                    minLines: 3,
                    textInputAction: TextInputAction.done,
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) {
                        return isProductRequest
                            ? "Please enter brief details about what you need"
                            : "Please enter your enquiry details";
                      }
                      if (val.trim().length < 3) {
                        return "Description should be at least 3 characters";
                      }
                      return null;
                    },
                    decoration: InputDecoration(
                      hintText: isProductRequest
                          ? "Any specific packaging, preferred store, or why you're looking for this product..."
                          : "Write your enquiry or message in detail here...",
                      hintStyle: GoogleFonts.poppins(
                          color: Colors.grey[400], fontSize: 13.5.sp),
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
                        borderSide:
                            const BorderSide(color: Appprimary, width: 1.5),
                      ),
                      contentPadding: EdgeInsets.all(4.w),
                    ),
                  ),
                  SizedBox(height: 2.5.h),

                  // Photo Attachment Section (Prominent for Product Requests)
                  Text(
                    isProductRequest
                        ? "Product Photo (Optional)"
                        : "Attachment (Optional)",
                    style: GoogleFonts.poppins(
                      fontSize: 13.5.sp,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  SizedBox(height: 0.8.h),

                  if (_maxPhotos > 1)
                    Padding(
                      padding: EdgeInsets.only(bottom: 0.8.h),
                      child: Text("Up to $_maxPhotos photos, e.g. the damaged item and the bill",
                          style: GoogleFonts.poppins(fontSize: 11.5.sp, color: Colors.grey[600])),
                    ),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      for (var i = 0; i < _attachedImages.length; i++)
                        Stack(clipBehavior: Clip.none, children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.file(_attachedImages[i], width: 86, height: 86, fit: BoxFit.cover),
                          ),
                          Positioned(
                            top: -8,
                            right: -8,
                            child: InkWell(
                              onTap: () => setState(() => _attachedImages.removeAt(i)),
                              child: Container(
                                padding: const EdgeInsets.all(3),
                                decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                                child: const Icon(Icons.close_rounded, size: 14, color: Colors.white),
                              ),
                            ),
                          ),
                        ]),
                      if (_attachedImages.length < _maxPhotos)
                        InkWell(
                          onTap: _showImagePickerSheet,
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            width: 86,
                            height: 86,
                            decoration: BoxDecoration(
                              color: Colors.grey[50],
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: isProductRequest ? Appprimary.withOpacity(0.5) : Colors.grey[300]!),
                            ),
                            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                              Icon(Icons.add_a_photo_outlined, color: isProductRequest ? Appprimary : Colors.grey[600]),
                              const SizedBox(height: 4),
                              Text(_attachedImages.isEmpty ? "Add photo" : "Add more",
                                  style: GoogleFonts.poppins(fontSize: 11.sp, color: Colors.grey[700])),
                            ]),
                          ),
                        ),
                    ],
                  ),

                  SizedBox(height: 3.h),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 6.2.h,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitEnquiry,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Appprimary,
                        disabledBackgroundColor: Appprimary.withOpacity(0.6),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 0,
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              isProductRequest
                                  ? "Submit Product Request"
                                  : "Submit Enquiry",
                              style: GoogleFonts.poppins(
                                color: Colors.white,
                                fontSize: 15.sp,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                  SizedBox(height: 2.h),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
