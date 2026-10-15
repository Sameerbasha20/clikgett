import 'dart:io';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/photo_orders_controller.dart';
import 'package:fav_app/new/NewScreens/Address/ManageAddress.dart';
import 'package:fav_app/new/NewScreens/PhotoOrders/PhotoOrdersListScreen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class PhotoOrderUploadScreen extends StatefulWidget {
  const PhotoOrderUploadScreen({Key? key}) : super(key: key);

  @override
  State<PhotoOrderUploadScreen> createState() => _PhotoOrderUploadScreenState();
}

class _PhotoOrderUploadScreenState extends State<PhotoOrderUploadScreen> {
  final PhotoOrdersController photoController = Get.put(PhotoOrdersController());
  final AdressController addressController = Get.find();

  dynamic selectedAddress;

  @override
  void initState() {
    super.initState();
    // Default to currently selected address if available
    if (addressController.address.isNotEmpty) {
      final selectedId = addressController.selectedAdressId.value;
      selectedAddress = addressController.address.firstWhereOrNull(
        (a) => a.addressId == selectedId,
      ) ?? addressController.address.first;
    }
  }

  void _showImagePickerSheet(BuildContext context) {
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
                "Upload Photo or Shopping List",
                style: GoogleFonts.poppins(
                  fontSize: 17.sp,
                  fontWeight: FontWeight.w600,
                  color: black,
                ),
              ),
              SizedBox(height: 2.h),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.camera_alt, color: primary),
                ),
                title: Text(
                  "Take a Photo (Camera)",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w500),
                ),
                subtitle: const Text("Capture handwritten list or item package"),
                onTap: () {
                  Navigator.pop(ctx);
                  photoController.pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.photo_library, color: Colors.blue),
                ),
                title: Text(
                  "Choose from Gallery",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w500),
                ),
                subtitle: const Text("Pick an existing image from phone"),
                onTap: () {
                  Navigator.pop(ctx);
                  photoController.pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showSuccessDialog(String requestCode, int requestId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle, color: Colors.green, size: 54),
            ),
            SizedBox(height: 2.h),
            Text(
              "Request Submitted!",
              style: GoogleFonts.poppins(
                fontSize: 18.sp,
                fontWeight: FontWeight.w700,
                color: black,
              ),
            ),
            SizedBox(height: 1.h),
            Text(
              "Reference Code: $requestCode",
              style: GoogleFonts.poppins(
                fontSize: 15.sp,
                fontWeight: FontWeight.w600,
                color: primary,
              ),
            ),
            SizedBox(height: 1.h),
            Text(
              "Our store team is preparing your matching items. You will receive a notification once the proposal is ready for your confirmation!",
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 13.sp, color: Colors.grey[700]),
            ),
            SizedBox(height: 3.h),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: primary,
                minimumSize: Size(double.infinity, 5.h),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                Get.off(() => const PhotoOrdersListScreen());
              },
              child: Text(
                "Track Request Status",
                style: GoogleFonts.poppins(color: white, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        elevation: 1,
        backgroundColor: white,
        title: Text(
          "Order by Photo",
          style: GoogleFonts.poppins(
            fontSize: 17.sp,
            fontWeight: FontWeight.w600,
            color: black,
          ),
        ),
        leading: IconButton(
          icon: Image.asset(backbutton, height: 4.h),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.history, color: primary),
            tooltip: "My Photo Orders",
            onPressed: () => Get.to(() => const PhotoOrdersListScreen()),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // How it works card
            Container(
              padding: EdgeInsets.all(3.w),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: primary.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.photo_camera_back, color: primary, size: 28),
                  ),
                  SizedBox(width: 3.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Quick & Easy Shopping",
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            fontSize: 14.sp,
                            color: const Color(0xFF166534),
                          ),
                        ),
                        Text(
                          "Upload a photo of your list. We match catalog items and send a priced proposal for your approval before checkout!",
                          style: GoogleFonts.poppins(fontSize: 12.sp, color: const Color(0xFF15803D)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 2.5.h),

            // Image Preview or Picker
            Text(
              "Photo / Shopping List *",
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14.sp, color: black),
            ),
            SizedBox(height: 1.h),

            Obx(() {
              final img = photoController.pickedImage.value;
              if (img == null) {
                return InkWell(
                  onTap: () => _showImagePickerSheet(context),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: double.infinity,
                    height: 24.h,
                    decoration: BoxDecoration(
                      color: white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: primary.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.add_a_photo, size: 32, color: primary),
                        ),
                        SizedBox(height: 1.5.h),
                        Text(
                          "Tap to Take Photo or Upload Image",
                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14.sp, color: black),
                        ),
                        Text(
                          "Supports JPG, PNG, WEBP (Max 10MB)",
                          style: GoogleFonts.poppins(fontSize: 12.sp, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                );
              }

              // Image is selected: Show Preview with action controls
              return Container(
                decoration: BoxDecoration(
                  color: white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))
                  ],
                ),
                child: Column(
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                      child: Image.file(
                        File(img.path),
                        width: double.infinity,
                        height: 28.h,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.2.h),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          TextButton.icon(
                            onPressed: () => _showImagePickerSheet(context),
                            icon: const Icon(Icons.refresh, size: 18, color: primary),
                            label: Text("Replace", style: GoogleFonts.poppins(color: primary, fontWeight: FontWeight.w600)),
                          ),
                          const VerticalDivider(),
                          TextButton.icon(
                            onPressed: () => photoController.clearImage(),
                            icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                            label: Text("Remove", style: GoogleFonts.poppins(color: Colors.red, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                    )
                  ],
                ),
              );
            }),

            SizedBox(height: 2.5.h),

            // Instructions text field
            Text(
              "Specific Instructions (Optional)",
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14.sp, color: black),
            ),
            SizedBox(height: 1.h),
            TextField(
              controller: photoController.notesController,
              maxLines: 4,
              decoration: InputDecoration(
                filled: true,
                fillColor: white,
                hintText: "e.g., Preferred brand (Amul, Aashirvaad), acceptable pack sizes, or specific notes for alternatives...",
                hintStyle: GoogleFonts.poppins(fontSize: 12.5.sp, color: Colors.grey),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: primary, width: 1.5),
                ),
              ),
            ),

            SizedBox(height: 2.5.h),

            // Delivery Address Selection Card
            Text(
              "Delivery Address",
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14.sp, color: black),
            ),
            SizedBox(height: 1.h),
            Container(
              padding: EdgeInsets.all(3.w),
              decoration: BoxDecoration(
                color: white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_on, color: primary, size: 26),
                  SizedBox(width: 3.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          selectedAddress != null
                              ? "${selectedAddress.flatNo ?? ''} ${selectedAddress.landmark ?? ''}"
                              : "No address selected",
                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13.sp),
                        ),
                        Text(
                          selectedAddress != null ? (selectedAddress.address ?? '') : "Tap to pick a delivery address",
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(fontSize: 11.5.sp, color: Colors.grey[700]),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const ManageAddress(isFromCartScreen: true)),
                      );
                      if (addressController.address.isNotEmpty) {
                        final selectedId = addressController.selectedAdressId.value;
                        setState(() {
                          selectedAddress = addressController.address.firstWhereOrNull(
                            (a) => a.addressId == selectedId,
                          ) ?? addressController.address.first;
                        });
                      }
                    },
                    child: Text(
                      selectedAddress != null ? "Change" : "Select",
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: primary),
                    ),
                  )
                ],
              ),
            ),

            SizedBox(height: 4.h),

            // Submit Button
            Obx(() {
              final loading = photoController.isUploading.value;
              return ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: primary,
                  minimumSize: Size(double.infinity, 6.h),
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: loading
                    ? null
                    : () async {
                        final res = await photoController.submitRequest(
                          context: context,
                          deliveryAddressID: selectedAddress?.addressId,
                          deliveryAddressSnapshot: selectedAddress != null
                              ? {
                                  'Address': selectedAddress.address,
                                  'FlatNo': selectedAddress.flatNo,
                                  'LandMark': selectedAddress.landmark,
                                  'Latitude': selectedAddress.latitude,
                                  'Longitude': selectedAddress.longitude,
                                }
                              : null,
                        );
                        if (res != null && res['Status'] == 1) {
                          _showSuccessDialog(res['RequestCode'] ?? '', res['RequestID'] ?? 0);
                        }
                      },
                child: loading
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: white, strokeWidth: 2),
                          ),
                          SizedBox(width: 3.w),
                          Text(
                            "Uploading Image...",
                            style: GoogleFonts.poppins(color: white, fontWeight: FontWeight.w600, fontSize: 15.sp),
                          )
                        ],
                      )
                    : Text(
                        "Submit Photo Order",
                        style: GoogleFonts.poppins(color: white, fontWeight: FontWeight.w600, fontSize: 15.sp),
                      ),
              );
            }),
            SizedBox(height: 2.h),
          ],
        ),
      ),
    );
  }
}
