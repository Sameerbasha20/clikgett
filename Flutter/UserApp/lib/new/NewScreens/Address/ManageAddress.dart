// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Address/AddAddress.dart';
import 'package:fav_app/new/NewScreens/Address/EditAddress.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../old/Models/Account/adresses.dart';

const _leaf = Color(0xFF14532D);
const _fresh = Color(0xFF16A34A);
const _ink = Color(0xFF0F172A);
const _muted = Color(0xFF64748B);
const _screenBg = Color(0xFFF4F7F5);

/// Icon, colour and label for an address type (home / work / anything else).
class _AddressType {
  final IconData icon;
  final Color color;
  final String label;
  const _AddressType(this.icon, this.color, this.label);

  factory _AddressType.of(String type) {
    final t = type.trim().toLowerCase();
    if (t == 'home') return const _AddressType(Icons.home_rounded, _fresh, 'Home');
    if (t == 'work' || t == 'office') return const _AddressType(Icons.work_rounded, Color(0xFF2563EB), 'Work');
    final label = t.isEmpty ? 'Other' : t[0].toUpperCase() + t.substring(1);
    return _AddressType(Icons.location_on_rounded, const Color(0xFFEA580C), label);
  }
}

class ManageAddress extends StatefulWidget {
  const ManageAddress({super.key, this.isFromCartScreen = false});
  final bool? isFromCartScreen;
  @override
  State<ManageAddress> createState() => _ManageAddressState();
}

class _ManageAddressState extends State<ManageAddress> {
  bool isMapsOpened = false;
  final AdressController adressController = Get.find();
  final HomeController homeController = Get.find();

  /// Opened from checkout / photo order to choose where to deliver.
  bool get _picking => widget.isFromCartScreen == true;

  @override
  void initState() {
    super.initState();
    adressController.getAdresses(context: context);
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final addresses = adressController.address;
      final selectedId = adressController.selectedAdressId.value;
      Address? active;
      for (final a in addresses) {
        if (a.addressId == selectedId) active = a;
      }
      return Scaffold(
        backgroundColor: _screenBg,
        body: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: _header(active)),
            if (adressController.isLoading.isTrue && addresses.isEmpty)
              const SliverFillRemaining(hasScrollBody: false, child: CustomLoader())
            else if (addresses.isEmpty)
              SliverFillRemaining(hasScrollBody: false, child: _emptyState())
            else ...[
              SliverToBoxAdapter(child: _addTile()),
              SliverToBoxAdapter(child: _sectionLabel('SAVED ADDRESSES', addresses.length)),
              SliverPadding(
                padding: EdgeInsets.fromLTRB(16, 0, 16, MediaQuery.of(context).padding.bottom + 24),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => addressTile(address: addresses[index], index: index),
                    childCount: addresses.length,
                  ),
                ),
              ),
            ],
          ],
        ),
      );
    });
  }

  // ---------------------------------------------------------------- header

  Widget _header(Address? active) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      padding: EdgeInsets.fromLTRB(8, top + 6, 16, 22),
      decoration: const BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [_leaf, _fresh]),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Stack(children: [
        // Soft decorative pins in the corner.
        Positioned(
          right: -6,
          top: 4,
          child: Icon(Icons.location_on_rounded, size: 96, color: Colors.white.withOpacity(0.07)),
        ),
        Positioned(
          right: 70,
          top: 46,
          child: Icon(Icons.location_on_rounded, size: 40, color: Colors.white.withOpacity(0.08)),
        ),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                _picking ? 'Where should we deliver?' : 'Your addresses',
                style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white, height: 1.2),
              ),
              const SizedBox(height: 4),
              Text(
                _picking ? 'Tap an address to deliver there' : 'Save the places you order to most',
                style: GoogleFonts.poppins(fontSize: 13.5, color: Colors.white.withOpacity(0.85)),
              ),
              if (active != null) ...[
                const SizedBox(height: 16),
                _deliveringTo(active),
              ],
            ]),
          ),
        ]),
      ]),
    );
  }

  Widget _deliveringTo(Address address) {
    final type = _AddressType.of(address.type);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.14),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.22)),
      ),
      child: Row(children: [
        Container(
          width: 38,
          height: 38,
          decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
          child: Icon(type.icon, color: _fresh, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('DELIVERING TO · ${type.label.toUpperCase()}',
                style: GoogleFonts.poppins(
                    fontSize: 10.5, letterSpacing: 0.6, fontWeight: FontWeight.w700, color: Colors.white.withOpacity(0.8))),
            Text(
              _oneLine(address),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w600, color: Colors.white),
            ),
          ]),
        ),
      ]),
    );
  }

  // ---------------------------------------------------------------- add / list

  Future<void> _addAddress() async {
    if (isMapsOpened) return;
    isMapsOpened = true;
    adressController.updateUI();
    try {
      await pickLocation(context: context, iseditpage: 1);
    } catch (_) {
      // pickLocation already told the user (location off / permission denied).
    }
    isMapsOpened = false;
    adressController.updateUI();
  }

  Widget _addTile() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 6),
      child: GetBuilder<AdressController>(
        id: 'update-address',
        builder: (controller) => Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: _addAddress,
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: primary.withOpacity(0.35), width: 1.4),
              ),
              child: Row(children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(color: primaryLight, borderRadius: BorderRadius.circular(14)),
                  child: isMapsOpened
                      ? const Padding(
                          padding: EdgeInsets.all(13),
                          child: CircularProgressIndicator(strokeWidth: 2.4, color: primary),
                        )
                      : const Icon(Icons.add_location_alt_rounded, color: primaryDark),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Add a new address',
                        style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: primaryDark)),
                    Text('Use your current location or pick on the map',
                        style: GoogleFonts.poppins(fontSize: 12, color: _muted)),
                  ]),
                ),
                const Icon(Icons.chevron_right_rounded, color: primaryDark),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionLabel(String text, int count) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
      child: Row(children: [
        Text(text, style: GoogleFonts.poppins(fontSize: 12, letterSpacing: 0.8, fontWeight: FontWeight.w700, color: _muted)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
          decoration: BoxDecoration(color: cardBorder, borderRadius: BorderRadius.circular(20)),
          child: Text('$count', style: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w700, color: _muted)),
        ),
      ]),
    );
  }

  String _oneLine(Address a) =>
      [a.flatNo, a.landmark, a.address].where((s) => s.trim().isNotEmpty).join(', ');

  void _select(Address address) {
    adressController.storeSelectedAdress(address.addressId, address.longitude, address.latitude);
    homeController.storeLocation(address, adressController.address);
    // Opened to pick an address (checkout, photo order): return the choice to
    // that screen instead of jumping to the checkout page.
    if (_picking) Navigator.of(context).pop(address);
  }

  Widget addressTile({required Address address, required int index}) {
    final isSelected = adressController.selectedAdressId.value == address.addressId;
    final type = _AddressType.of(address.type);
    final details = [address.landmark, address.address].where((s) => s.trim().isNotEmpty).join(', ');

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => _select(address),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isSelected ? primary : Colors.transparent, width: 1.6),
              boxShadow: [
                BoxShadow(
                  color: (isSelected ? primary : _ink).withOpacity(isSelected ? 0.14 : 0.06),
                  blurRadius: isSelected ? 16 : 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(color: type.color.withOpacity(0.12), borderRadius: BorderRadius.circular(14)),
                    child: Icon(type.icon, color: type.color),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Wrap(spacing: 8, runSpacing: 4, crossAxisAlignment: WrapCrossAlignment.center, children: [
                        Text(type.label, style: GoogleFonts.poppins(fontSize: 15.5, fontWeight: FontWeight.w700, color: _ink)),
                        if (isSelected)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: primaryLight, borderRadius: BorderRadius.circular(20)),
                            child: Row(mainAxisSize: MainAxisSize.min, children: [
                              const Icon(Icons.check_circle_rounded, size: 13, color: primaryDark),
                              const SizedBox(width: 4),
                              Text('Delivering here',
                                  style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w700, color: primaryDark)),
                            ]),
                          ),
                      ]),
                      if (address.flatNo.trim().isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(address.flatNo,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w600, color: _ink)),
                      ],
                      if (details.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(details,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.poppins(fontSize: 12.5, color: _muted, height: 1.4)),
                      ],
                    ]),
                  ),
                  const SizedBox(width: 8),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                      key: ValueKey(isSelected),
                      color: isSelected ? primary : const Color(0xFFCBD5E1),
                    ),
                  ),
                ]),
              ),
              Container(height: 1, color: const Color(0xFFF1F5F9)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                child: Row(children: [
                  _action(Icons.edit_outlined, 'Edit', primaryDark, () => checkLocation(context, index, address)),
                  if (adressController.address.length > 1)
                    _action(Icons.delete_outline_rounded, 'Delete', red, () async {
                      final yes = await alertDialogue(address);
                      if (yes == true && mounted) {
                        adressController.deleteAdresses(context: context, adressId: address.addressId);
                      }
                    }),
                  const Spacer(),
                  if (!isSelected)
                    TextButton(
                      onPressed: () => _select(address),
                      style: TextButton.styleFrom(foregroundColor: primaryDark),
                      child: Text('Deliver here →', style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w700)),
                    ),
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _action(IconData icon, String label, Color color, VoidCallback onTap) {
    return TextButton.icon(
      onPressed: onTap,
      style: TextButton.styleFrom(foregroundColor: color, padding: const EdgeInsets.symmetric(horizontal: 10)),
      icon: Icon(icon, size: 17),
      label: Text(label, style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600)),
    );
  }

  Future<bool?> alertDialogue(Address address) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        contentPadding: const EdgeInsets.fromLTRB(22, 24, 22, 8),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(color: redLight, shape: BoxShape.circle),
            child: const Icon(Icons.delete_outline_rounded, color: red, size: 28),
          ),
          const SizedBox(height: 14),
          Text('Delete this address?', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: _ink)),
          const SizedBox(height: 6),
          Text(_oneLine(address),
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(fontSize: 13, color: _muted)),
        ]),
        actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        actions: [
          Row(children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context, false),
                style: OutlinedButton.styleFrom(
                  foregroundColor: _ink,
                  side: const BorderSide(color: cardBorder),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('Keep it', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: red,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('Delete', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: Colors.white)),
              ),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _emptyState() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(32, 24, 32, 48),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          width: 130,
          height: 130,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(colors: [primaryLight, primary.withOpacity(0.25)]),
          ),
          alignment: Alignment.center,
          child: const Text('🏠', style: TextStyle(fontSize: 58)),
        ),
        const SizedBox(height: 22),
        Text('No saved addresses yet',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(fontSize: 19, fontWeight: FontWeight.w700, color: _ink)),
        const SizedBox(height: 6),
        Text('Add your home, work or any place you order to.\nIt only takes a few seconds.',
            textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13.5, color: _muted, height: 1.45)),
        const SizedBox(height: 26),
        GetBuilder<AdressController>(
          id: 'update-address',
          builder: (controller) => SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: isMapsOpened ? null : _addAddress,
              style: ElevatedButton.styleFrom(
                backgroundColor: primary,
                disabledBackgroundColor: primary.withOpacity(0.6),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: isMapsOpened
                  ? const SizedBox(
                      width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white))
                  : const Icon(Icons.my_location_rounded, color: Colors.white),
              label: Text('Add your first address',
                  style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ),
        ),
      ]),
    );
  }

  Future pickLocation(
      {required context,
      LatLng? selectedPosition,
      required int iseditpage}) async {
    LatLng? position;

    if (selectedPosition == null) {
      LocationPermission? permission;
      bool? serviceEnabled;
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Location services are not enabled don't continue
        // accessing the position and request users of the
        // App to enable the location services.

        customToast(message: 'Please turn on Location');
        isMapsOpened = false;
        Get.find<AdressController>().updateUI();
        return Future.error('Location services are disabled.');
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          // Permissions are denied, next time you could try
          // requesting permissions again (this is also where
          // Android's shouldShowRequestPermissionRationale
          // returned true. According to Android guidelines
          // your App should show an explanatory UI now.
          customToast(
              message: 'Location permissions are denied, Turn on in Settings');
          isMapsOpened = false;
          Get.find<AdressController>().updateUI();
          return Future.error('Location permissions are denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        customToast(
            message: 'Location permissions are denied, Turn on in Settings');
        isMapsOpened = false;
        Get.find<AdressController>().updateUI();
        return Future.error(
            'Location permissions are permanently denied, we cannot request permissions.');
      }
      await Geolocator.getCurrentPosition().then((value) =>
          {print(value), position = LatLng(value.latitude, value.longitude)});
    }

    await Navigator.push(
        context,
        MaterialPageRoute(
            builder: (context) => AddAddress(
                  initialCameraPosition: CameraPosition(
                      target: selectedPosition ?? position!, zoom: 20.0),
                )));
  }

  Future checkLocation(context, int index, Address address) async {
    LocationPermission? permission;
    bool? serviceEnabled;
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      customToast(message: 'Please turn on Location');
      return Future.error('Location services are disabled.');
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return Future.error('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return Future.error(
          'Location permissions are permanently denied, we cannot request permissions.');
    }

    await Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => EditAddress(
                  address: address,
                  initialCameraPosition: CameraPosition(
                    bearing: 0.0,
                    target: LatLng(0.0, 0.0),
                    tilt: 0.0,
                    zoom: 20.0,
                  ),

                  // type: acountViewModel?.adressesModel?.address[index].type,
                  // adress:
                  //     acountViewModel?.adressesModel?.address[index].address,
                  // flatno: acountViewModel?.adressesModel?.address[index].flatNo,
                  // landmark:
                  //     acountViewModel?.adressesModel?.address[index].landmark,
                  // city: acountViewModel?.adressesModel?.address[index].city,
                  // lattitude:
                  //     acountViewModel?.adressesModel?.address[index].latitude,
                  // id: acountViewModel?.adressesModel?.address[index].addressId,
                  // logitude:
                  //     acountViewModel?.adressesModel?.address[index].longitude,
                )));
  }
}
