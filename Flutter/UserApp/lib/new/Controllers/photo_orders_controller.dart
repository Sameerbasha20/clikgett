import 'dart:convert';
import 'dart:io';
import 'package:fav_app/new/NewModel/photo_order_model.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/photo_orders_service.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

class PhotoOrdersController extends GetxController {
  final ImagePicker _picker = ImagePicker();

  var pickedImage = Rx<XFile?>(null);
  var isUploading = false.obs;
  var isLoadingOrders = false.obs;
  var isLoadingDetail = false.obs;
  var isConfirming = false.obs;

  var myPhotoOrders = <PhotoOrderModel>[].obs;
  var currentDetail = Rx<PhotoOrderModel?>(null);

  final TextEditingController notesController = TextEditingController();
  /// The shopping list typed in instead of (or as well as) a photo.
  final TextEditingController typedItemsController = TextEditingController();
  var typedItems = ''.obs;

  /// Pick image from camera or gallery
  Future<void> pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
      );
      if (image != null) {
        pickedImage.value = image;
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
      customToast(message: 'Error selecting image');
    }
  }

  /// Remove picked image
  void clearImage() {
    pickedImage.value = null;
  }

  /// Submit photo order request
  Future<Map<String, dynamic>?> submitRequest({
    required BuildContext context,
    int? deliveryAddressID,
    Map<String, dynamic>? deliveryAddressSnapshot,
  }) async {
    final typed = typedItemsController.text.trim();
    if (pickedImage.value == null && typed.isEmpty) {
      customToast(message: 'Add a photo of your list or type your items');
      return null;
    }

    try {
      isUploading.value = true;

      String? base64Image;
      String mimeType = 'image/jpeg';
      if (pickedImage.value != null) {
        final File file = File(pickedImage.value!.path);
        final List<int> bytes = await file.readAsBytes();
        base64Image = base64Encode(bytes);
        if (pickedImage.value!.path.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        } else if (pickedImage.value!.path.toLowerCase().endsWith('.webp')) {
          mimeType = 'image/webp';
        }
      }

      final res = await PhotoOrdersService.submitPhotoOrder(
        imageBase64: base64Image,
        mimeType: mimeType,
        typedItems: typed,
        customerNotes: notesController.text.trim(),
        deliveryAddressID: deliveryAddressID,
        deliveryAddressSnapshot: deliveryAddressSnapshot,
      );

      isUploading.value = false;

      if (res['Status'] == 1) {
        customToast(message: 'Photo order submitted successfully!');
        clearImage();
        notesController.clear();
        typedItemsController.clear();
        typedItems.value = '';
        fetchMyPhotoOrders();
        return res;
      } else {
        customToast(message: res['Message'] ?? 'Failed to submit request');
        return null;
      }
    } catch (e) {
      isUploading.value = false;
      debugPrint('Error uploading photo order: $e');
      customToast(message: 'Could not send your order. Please try again.');
      return null;
    }
  }

  /// Fetch user's photo order requests
  Future<void> fetchMyPhotoOrders() async {
    try {
      isLoadingOrders.value = true;
      final orders = await PhotoOrdersService.getMyPhotoOrders();
      myPhotoOrders.assignAll(orders);
      isLoadingOrders.value = false;
    } catch (e) {
      isLoadingOrders.value = false;
      debugPrint('Error fetching photo orders: $e');
    }
  }

  /// Fetch single request detail
  Future<void> fetchDetail(int requestId) async {
    try {
      isLoadingDetail.value = true;
      // Don't show the previously opened request if this one fails to load.
      if (currentDetail.value?.requestID != requestId) currentDetail.value = null;
      final detail = await PhotoOrdersService.getPhotoOrderDetail(requestId);
      currentDetail.value = detail;
      isLoadingDetail.value = false;
    } catch (e) {
      isLoadingDetail.value = false;
      debugPrint('Error fetching detail: $e');
    }
  }

  /// Confirm & accept proposal
  Future<int?> confirmProposal({
    required int requestId,
    String paymentMethod = 'COD',
    int? addressId,
  }) async {
    try {
      isConfirming.value = true;
      final res = await PhotoOrdersService.confirmProposal(
        requestId: requestId,
        paymentMethod: paymentMethod,
        addressId: addressId,
      );
      isConfirming.value = false;

      if (res['Status'] == 1) {
        customToast(message: res['Message'] ?? 'Order placed successfully!');
        fetchMyPhotoOrders();
        return res['OrderID'] != null ? int.tryParse(res['OrderID'].toString()) : 1;
      } else {
        customToast(message: res['Message'] ?? 'Error confirming proposal');
        return null;
      }
    } catch (e) {
      isConfirming.value = false;
      debugPrint('Error confirming proposal: $e');
      customToast(message: 'Error confirming proposal');
      return null;
    }
  }

  /// Reject proposal
  Future<bool> rejectProposal({
    required int requestId,
    String? reason,
  }) async {
    try {
      final res = await PhotoOrdersService.rejectProposal(
        requestId: requestId,
        rejectionReason: reason,
      );

      if (res['Status'] == 1) {
        customToast(message: 'Proposal declined');
        fetchDetail(requestId);
        fetchMyPhotoOrders();
        return true;
      } else {
        customToast(message: res['Message'] ?? 'Error rejecting proposal');
        return false;
      }
    } catch (e) {
      debugPrint('Error rejecting proposal: $e');
      customToast(message: 'Error declining proposal');
      return false;
    }
  }

  /// Cancel a request that is still waiting for the store
  Future<bool> cancelRequest(int requestId) async {
    try {
      final res = await PhotoOrdersService.cancelRequest(requestId: requestId);
      customToast(message: res['Message'] ?? (res['Status'] == 1 ? 'Photo order cancelled' : 'Could not cancel'));
      if (res['Status'] == 1) {
        fetchDetail(requestId);
        fetchMyPhotoOrders();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error cancelling photo order: $e');
      customToast(message: 'Could not cancel. Please try again.');
      return false;
    }
  }

  @override
  void onClose() {
    notesController.dispose();
    typedItemsController.dispose();
    super.onClose();
  }
}
