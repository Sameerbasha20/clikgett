import 'dart:io';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/photo_orders_controller.dart';
import 'package:fav_app/new/NewScreens/Address/ManageAddress.dart';
import 'package:fav_app/new/NewScreens/PhotoOrders/PhotoOrdersListScreen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

/// Order by photo: the customer adds a photo of their list, types the items, or both;
/// the store matches them to the catalogue and sends a priced proposal to confirm.
class PhotoOrderUploadScreen extends StatefulWidget {
  const PhotoOrderUploadScreen({Key? key}) : super(key: key);

  @override
  State<PhotoOrderUploadScreen> createState() => _PhotoOrderUploadScreenState();
}

class _PhotoOrderUploadScreenState extends State<PhotoOrderUploadScreen> {
  final PhotoOrdersController photoController = Get.put(PhotoOrdersController());
  final AdressController addressController = Get.find();

  static const _blue = Color(0xFF2563EB);
  static const _blueBg = Color(0xFFEFF6FF);
  static const _orange = Color(0xFFEA8A0C);
  static const _orangeBg = Color(0xFFFFF7ED);
  static const _darkGreen = Color(0xFF166534);

  dynamic selectedAddress;

  @override
  void initState() {
    super.initState();
    // Default to currently selected address if available
    if (addressController.address.isNotEmpty) {
      final selectedId = addressController.selectedAdressId.value;
      selectedAddress = addressController.address.firstWhereOrNull(
            (a) => a.addressId == selectedId,
          ) ??
          addressController.address.first;
    }
  }

  TextStyle _font(double size, {FontWeight weight = FontWeight.w400, Color color = tColor, double? height}) =>
      GoogleFonts.poppins(fontSize: size, fontWeight: weight, color: color, height: height);

  // ---------------------------------------------------------------- actions

  void _typeItems() {
    final ctrl = photoController.typedItemsController;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Type your groceries', style: _font(17, weight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('One item per line. Add brand, size and quantity if you know them.', style: _font(12.5, color: tColor3)),
          const SizedBox(height: 12),
          TextField(
            controller: ctrl,
            autofocus: true,
            maxLines: 8,
            minLines: 5,
            maxLength: 2000,
            textCapitalization: TextCapitalization.sentences,
            style: _font(14),
            decoration: _inputDecoration('Aashirvaad atta 5 kg\nAmul butter 100 g × 2\nTomatoes 1 kg'),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: primary,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                photoController.typedItems.value = ctrl.text.trim();
                Navigator.pop(ctx);
              },
              child: Text('Save items', style: _font(15, weight: FontWeight.w600, color: white)),
            ),
          ),
        ]),
      ),
    );
  }

  void _clearTypedItems() {
    photoController.typedItemsController.clear();
    photoController.typedItems.value = '';
  }

  Future<void> _changeAddress() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const ManageAddress(isFromCartScreen: true)),
    );
    if (addressController.address.isNotEmpty) {
      final selectedId = addressController.selectedAdressId.value;
      setState(() {
        selectedAddress = addressController.address.firstWhereOrNull(
              (a) => a.addressId == selectedId,
            ) ??
            addressController.address.first;
      });
    }
  }

  Future<void> _submit() async {
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
      _showSuccessDialog(res['RequestCode'] ?? '');
    }
  }

  void _showSuccessDialog(String requestCode) {
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
              decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), shape: BoxShape.circle),
              child: const Icon(Icons.check_circle, color: Colors.green, size: 54),
            ),
            const SizedBox(height: 16),
            Text('Request Submitted!', style: _font(18, weight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text('Reference Code: $requestCode', style: _font(14, weight: FontWeight.w600, color: primary)),
            const SizedBox(height: 8),
            Text(
              'Our store team is matching your items. You will get a notification when the price proposal is ready for you to confirm.',
              textAlign: TextAlign.center,
              style: _font(13, color: tColor3),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: primary,
                minimumSize: const Size(double.infinity, 46),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                Get.off(() => const PhotoOrdersListScreen());
              },
              child: Text('Track Request Status', style: _font(14, weight: FontWeight.w600, color: white)),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------- build

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: white,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: white,
        surfaceTintColor: white,
        centerTitle: true,
        title: Text('Order by Photo', style: _font(18, weight: FontWeight.w700)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: tColor),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded, color: primary),
            tooltip: 'My Photo Orders',
            onPressed: () => Get.to(() => const PhotoOrdersListScreen()),
          )
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _hero(),
              const SizedBox(height: 20),
              _step(1, 'Add your items', 'Upload a photo, type the items, or do both.'),
              const SizedBox(height: 12),
              _sourceCards(),
              _picked(),
              const SizedBox(height: 12),
              _tips(),
              const SizedBox(height: 20),
              _step(2, 'Specific Instructions (Optional)', 'Add any preferences, brand names, pack sizes, or special notes.'),
              const SizedBox(height: 10),
              _instructions(),
              const SizedBox(height: 20),
              _step(3, 'Delivery Address', null),
              const SizedBox(height: 10),
              _address(),
              const SizedBox(height: 20),
              _submitButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _hero() => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)]),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFBBF7D0)),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
          _illustration(),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Just upload your shopping list', style: _font(18, weight: FontWeight.w800, color: _darkGreen, height: 1.2)),
              const SizedBox(height: 6),
              Text("We'll match the items from our catalog and send you a price proposal before delivery.",
                  style: _font(12, color: tColor4, height: 1.35)),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(color: white.withOpacity(0.75), borderRadius: BorderRadius.circular(10)),
                child: Row(children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: const BoxDecoration(color: primary, shape: BoxShape.circle),
                    child: const Icon(Icons.call_rounded, color: white, size: 16),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text('We may call you for further clarifications on your order before dispatch.',
                        style: _font(11, color: tColor4, height: 1.3)),
                  ),
                ]),
              ),
            ]),
          ),
        ]),
      );

  /// A phone showing a ticked list, with a basket in front.
  Widget _illustration() => SizedBox(
        width: 92,
        height: 112,
        child: Stack(clipBehavior: Clip.none, children: [
          Positioned(
            left: 14,
            top: 0,
            child: Container(
              width: 62,
              height: 100,
              padding: const EdgeInsets.fromLTRB(6, 10, 6, 6),
              decoration: BoxDecoration(
                color: white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: tColor5, width: 3),
                boxShadow: softCardShadow,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(
                  3,
                  (_) => Row(children: [
                    const Icon(Icons.check_box_rounded, color: primary, size: 13),
                    const SizedBox(width: 3),
                    Expanded(child: Container(height: 4, decoration: BoxDecoration(color: bg2, borderRadius: BorderRadius.circular(2)))),
                  ]),
                ),
              ),
            ),
          ),
          Positioned(
            left: 0,
            bottom: 0,
            child: Container(
              width: 50,
              height: 34,
              decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(10), boxShadow: softCardShadow),
              child: const Icon(Icons.shopping_basket_rounded, color: white, size: 22),
            ),
          ),
          const Positioned(right: 0, top: 4, child: Icon(Icons.auto_awesome_rounded, color: primary, size: 16)),
        ]),
      );

  Widget _step(int n, String title, String? subtitle) => Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 26,
          height: 26,
          alignment: Alignment.center,
          decoration: const BoxDecoration(color: primary, shape: BoxShape.circle),
          child: Text('$n', style: _font(13, weight: FontWeight.w700, color: white)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: _font(15.5, weight: FontWeight.w700)),
            if (subtitle != null) Text(subtitle, style: _font(11.5, color: grey70)),
          ]),
        ),
      ]);

  Widget _sourceCards() => IntrinsicHeight(
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Expanded(
            child: _sourceCard(
              color: primary,
              bgColor: primaryGhost,
              icon: Icons.photo_camera_rounded,
              title: 'Take Photo',
              text: 'Click a photo of your shopping list',
              button: 'Take Photo',
              buttonIcon: Icons.photo_camera_rounded,
              filled: true,
              onTap: () => photoController.pickImage(ImageSource.camera),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _sourceCard(
              color: _blue,
              bgColor: _blueBg,
              icon: Icons.image_rounded,
              title: 'Choose from Gallery',
              text: 'Upload an image from your phone',
              button: 'Gallery',
              buttonIcon: Icons.image_outlined,
              onTap: () => photoController.pickImage(ImageSource.gallery),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _sourceCard(
              color: _orange,
              bgColor: _orangeBg,
              icon: Icons.description_rounded,
              title: 'Type your groceries',
              text: 'Manually enter the items you need',
              button: 'Type Items',
              buttonIcon: Icons.edit_rounded,
              onTap: _typeItems,
            ),
          ),
        ]),
      );

  Widget _sourceCard({
    required Color color,
    required Color bgColor,
    required IconData icon,
    required String title,
    required String text,
    required String button,
    required IconData buttonIcon,
    required VoidCallback onTap,
    bool filled = false,
  }) =>
      Material(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.fromLTRB(8, 12, 8, 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: color.withOpacity(0.35)),
            ),
            child: Column(children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: color.withOpacity(0.14), shape: BoxShape.circle),
                child: Icon(icon, color: color, size: 26),
              ),
              const SizedBox(height: 8),
              Text(title, textAlign: TextAlign.center, style: _font(12.5, weight: FontWeight.w700, height: 1.2)),
              const SizedBox(height: 4),
              Text(text, textAlign: TextAlign.center, style: _font(10.5, color: grey70, height: 1.25)),
              const Spacer(),
              const SizedBox(height: 8),
              Container(
                height: 34,
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: filled ? color : white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: color),
                ),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(buttonIcon, size: 15, color: filled ? white : color),
                    const SizedBox(width: 4),
                    Text(button, style: _font(12, weight: FontWeight.w600, color: filled ? white : color)),
                  ]),
                ),
              ),
            ]),
          ),
        ),
      );

  /// What the customer has added so far: the photo and/or the typed list.
  Widget _picked() => Obx(() {
        final img = photoController.pickedImage.value;
        final typed = photoController.typedItems.value;
        if (img == null && typed.isEmpty) return const SizedBox.shrink();
        return Column(children: [
          if (img != null)
            Container(
              margin: const EdgeInsets.only(top: 12),
              decoration: BoxDecoration(
                color: white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: cardBorder),
              ),
              child: Row(children: [
                ClipRRect(
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
                  child: Image.file(File(img.path), width: 84, height: 84, fit: BoxFit.cover),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      const Icon(Icons.check_circle_rounded, color: primary, size: 16),
                      const SizedBox(width: 4),
                      Text('Photo added', style: _font(13, weight: FontWeight.w600)),
                    ]),
                    Row(children: [
                      TextButton(
                        onPressed: () => photoController.pickImage(ImageSource.gallery),
                        child: Text('Replace', style: _font(12.5, weight: FontWeight.w600, color: primary)),
                      ),
                      TextButton(
                        onPressed: photoController.clearImage,
                        child: Text('Remove', style: _font(12.5, weight: FontWeight.w600, color: red)),
                      ),
                    ]),
                  ]),
                ),
              ]),
            ),
          if (typed.isNotEmpty)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(top: 12),
              padding: const EdgeInsets.fromLTRB(12, 10, 4, 4),
              decoration: BoxDecoration(
                color: _orangeBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _orange.withOpacity(0.35)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Icon(Icons.check_circle_rounded, color: primary, size: 16),
                  const SizedBox(width: 4),
                  Text('Your typed list', style: _font(13, weight: FontWeight.w600)),
                ]),
                const SizedBox(height: 4),
                Text(typed, maxLines: 6, overflow: TextOverflow.ellipsis, style: _font(12.5, color: tColor4, height: 1.4)),
                Row(children: [
                  TextButton(
                    onPressed: _typeItems,
                    child: Text('Edit', style: _font(12.5, weight: FontWeight.w600, color: _orange)),
                  ),
                  TextButton(
                    onPressed: _clearTypedItems,
                    child: Text('Remove', style: _font(12.5, weight: FontWeight.w600, color: red)),
                  ),
                ]),
              ]),
            ),
        ]);
      });

  Widget _tips() => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFBEB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Icon(Icons.lightbulb_rounded, color: amberWarning, size: 26),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Tips for better results', style: _font(12.5, weight: FontWeight.w700, color: const Color(0xFF92400E))),
              const SizedBox(height: 6),
              Wrap(spacing: 12, runSpacing: 6, children: [
                _tip('Take a clear photo'),
                _tip('Include all items'),
                _tip('Mention brand or size (if needed)'),
              ]),
            ]),
          ),
        ]),
      );

  Widget _tip(String text) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 16,
          height: 16,
          decoration: const BoxDecoration(color: amberWarning, shape: BoxShape.circle),
          child: const Icon(Icons.check_rounded, color: white, size: 12),
        ),
        const SizedBox(width: 5),
        Text(text, style: _font(11.5, color: const Color(0xFF78350F))),
      ]);

  InputDecoration _inputDecoration(String hint) => InputDecoration(
        filled: true,
        fillColor: white,
        hintText: hint,
        hintStyle: _font(12.5, color: Colors.grey),
        contentPadding: const EdgeInsets.all(12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: cardBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: cardBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: primary, width: 1.5)),
      );

  Widget _instructions() => TextField(
        controller: photoController.notesController,
        maxLines: 3,
        minLines: 3,
        maxLength: 500,
        style: _font(13.5),
        decoration: _inputDecoration('E.g., Preferred brand (Amul, Aashirvaad), pack size, alternatives, or any other notes...').copyWith(
          prefixIcon: const Padding(
            padding: EdgeInsets.only(bottom: 36),
            child: Icon(Icons.edit_rounded, color: grey70, size: 18),
          ),
        ),
      );

  Widget _address() => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: cardBorder),
        ),
        child: Row(children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: primary.withOpacity(0.12), shape: BoxShape.circle),
            child: const Icon(Icons.location_on_rounded, color: primary, size: 26),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                selectedAddress != null
                    ? '${selectedAddress.flatNo ?? ''} ${selectedAddress.landmark ?? ''}'.trim()
                    : 'No address selected',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: _font(13.5, weight: FontWeight.w700),
              ),
              Text(
                selectedAddress != null ? (selectedAddress.address ?? '') : 'Tap Select to pick a delivery address',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: _font(11.5, color: grey70),
              ),
            ]),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              backgroundColor: primaryGhost,
              side: const BorderSide(color: primary),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            onPressed: _changeAddress,
            child: Text(selectedAddress != null ? 'Change' : 'Select', style: _font(13, weight: FontWeight.w600, color: primaryDark)),
          ),
        ]),
      );

  Widget _submitButton() => Obx(() {
        final loading = photoController.isUploading.value;
        return SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: primary,
              disabledBackgroundColor: primary.withOpacity(0.6),
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: loading ? null : _submit,
            child: loading
                ? Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: white, strokeWidth: 2)),
                    const SizedBox(width: 12),
                    Text('Sending...', style: _font(15, weight: FontWeight.w600, color: white)),
                  ])
                : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('Submit Photo Order', style: _font(16, weight: FontWeight.w700, color: white)),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward_rounded, color: white),
                  ]),
          ),
        );
      });
}
