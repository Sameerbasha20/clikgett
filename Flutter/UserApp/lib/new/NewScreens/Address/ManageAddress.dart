// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Address/AddAddress.dart';
import 'package:fav_app/new/NewScreens/Address/EditAddress.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/Cart.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../old/Models/Account/adresses.dart';

class ManageAddress extends StatefulWidget {
  const ManageAddress({super.key, this.isFromCartScreen = false});
  final bool? isFromCartScreen;
  @override
  State<ManageAddress> createState() => _ManageAddressState();
}

class _ManageAddressState extends State<ManageAddress> {
  String selectedAddress = 'home';
  bool isMapsOpened = false;
  final AdressController adressController = Get.find();
  @override
  void initState() {
    super.initState();
    adressController.getAdresses(context: context);
  }

  final HomeController homeController = Get.find();
  @override
  Widget build(BuildContext context) {
    return Obx(
      () => adressController.address.isEmpty
          ? emptyWidget()
          : Scaffold(
              appBar: AppBar(
                elevation: 0,
                backgroundColor: Colors.white,
                surfaceTintColor: Colors.transparent,
                title: Text(
                  "Manage Addresses",
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    fontSize: 17,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                leading: IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(
                    Icons.arrow_back_ios_new_rounded,
                    color: Color(0xFF0F172A),
                    size: 20,
                  ),
                ),
              ),
              backgroundColor: const Color(0xFFF8FAFC),
              body: adressController.isLoading.isTrue
                  ? const CustomLoader()
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.5.h),
                      itemCount: adressController.address.length,
                      itemBuilder: (context, index) {
                        var address = adressController.address[index];
                        return addressTile(address: address, index: index);
                      },
                    ),
              bottomNavigationBar: Container(
                padding: EdgeInsets.fromLTRB(5.w, 10, 5.w, MediaQuery.of(context).padding.bottom + 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: cardBorder, width: 1)),
                  boxShadow: softElevatedShadow,
                ),
                child: GetBuilder<AdressController>(
                  id: 'update-address',
                  builder: (controller) => isMapsOpened
                      ? const Center(
                          child: CircularProgressIndicator.adaptive(),
                        )
                      : InkWell(
                          onTap: () async {
                            if (isMapsOpened == false) {
                              isMapsOpened = true;
                              Get.find<AdressController>().updateUI();
                              await pickLocation(context: context, iseditpage: 1);
                              isMapsOpened = false;
                              Get.find<AdressController>().updateUI();
                            }
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            height: 48,
                            decoration: BoxDecoration(
                              color: primary,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: primary.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.add_rounded, color: Colors.white, size: 22),
                                const SizedBox(width: 8),
                                Text(
                                  "Add New Address",
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                ),
              ),
            ),
    );
  }

  Widget addressTile({required Address address, required int index}) {
    return GetBuilder<AdressController>(
      id: 'update-radiobtn',
      builder: (controller) {
        final bool isSelected =
            adressController.selectedAdressId.value == address.addressId;
        final String typeStr = address.type.trim().toLowerCase();

        IconData typeIcon = Icons.location_on_rounded;
        if (typeStr == 'home') {
          typeIcon = Icons.home_rounded;
        } else if (typeStr == 'work') {
          typeIcon = Icons.work_rounded;
        }

        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                adressController.storeSelectedAdress(
                    address.addressId, address.longitude, address.latitude);
                homeController.storeLocation(
                  address,
                  adressController.address,
                );
                if (widget.isFromCartScreen == true) {
                  Get.to(() => Cart(isFromHomeScreen: true));
                }
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? primary : cardBorder,
                    width: isSelected ? 1.8 : 1,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: primary.withOpacity(0.12),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : softCardShadow,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Radio indicator
                    Padding(
                      padding: const EdgeInsets.only(top: 2, right: 12),
                      child: Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isSelected ? primary : const Color(0xFFCBD5E1),
                            width: 2,
                          ),
                        ),
                        child: isSelected
                            ? Center(
                                child: Container(
                                  width: 10,
                                  height: 10,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: primary,
                                  ),
                                ),
                              )
                            : null,
                      ),
                    ),

                    // Address Information
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isSelected ? primaryLight : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      typeIcon,
                                      size: 14,
                                      color: isSelected ? primaryDark : const Color(0xFF475569),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      address.type.toUpperCase(),
                                      style: GoogleFonts.poppins(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: isSelected ? primaryDark : const Color(0xFF475569),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (isSelected) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: primaryLight,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: primary.withOpacity(0.3), width: 1),
                                  ),
                                  child: Text(
                                    "ACTIVE",
                                    style: GoogleFonts.poppins(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w700,
                                      color: primaryDark,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (address.flatNo.isNotEmpty)
                            Text(
                              address.flatNo,
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          if (address.landmark.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 2.0),
                              child: Text(
                                address.landmark,
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: const Color(0xFF475569),
                                ),
                              ),
                            ),
                          Padding(
                            padding: const EdgeInsets.only(top: 2.0),
                            child: Text(
                              address.address,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              InkWell(
                                onTap: () => checkLocation(context, index, address),
                                borderRadius: BorderRadius.circular(6),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: cardBorder, width: 1),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.edit_outlined, size: 14, color: primary),
                                      const SizedBox(width: 4),
                                      Text(
                                        "Edit",
                                        style: GoogleFonts.poppins(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w600,
                                          color: primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              if (adressController.address.length > 1) ...[
                                const SizedBox(width: 10),
                                InkWell(
                                  onTap: () {
                                    alertDialogue().then((value) {
                                      if (value == true) {
                                        adressController.deleteAdresses(
                                          context: context,
                                          adressId: address.addressId,
                                        );
                                      }
                                    });
                                  },
                                  borderRadius: BorderRadius.circular(6),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: redLight,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: red.withOpacity(0.3), width: 1),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.delete_outline_rounded, size: 14, color: red),
                                        const SizedBox(width: 4),
                                        Text(
                                          "Delete",
                                          style: GoogleFonts.poppins(
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w600,
                                            color: red,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Future alertDialogue() {
    return showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text('Delete Address',
                    style: GoogleFonts.outfit(
                        color: Color(0xff1C1C1C),
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w500)),
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 2.h),
                  child: Text('Are You Sure, You Want To Delete Address ??',
                      style: GoogleFonts.outfit(
                          color: Color(0xff707070),
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w400)),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SizedBox(
                      width: 1,
                    ),
                    SizedBox(
                      width: 100, // Set your desired width here
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white, // No background color
                          side: BorderSide(
                              color: primary,
                              width: 1.0), // Black border with width
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                                5), // Rectangular shape with slight rounding
                          ),
                          padding: EdgeInsets.symmetric(
                              vertical: 12), // Padding for button height
                        ),
                        onPressed: () async {
                          Navigator.pop(context, true);
                        },
                        child: Text(
                          "Yes",
                          style: GoogleFonts.poppins(
                              color: primary,
                              fontSize: 16,
                              fontWeight: FontWeight.w600), // White text color
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 1,
                    ),
                    SizedBox(
                      width: 100, // Set your desired width here
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primary, // No background color
                          side: BorderSide(
                              color: primary,
                              width: 1.0), // Black border with width
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                                5), // Rectangular shape with slight rounding
                          ),
                          padding: EdgeInsets.symmetric(
                              vertical: 12), // Padding for button height
                        ),
                        onPressed: () async {
                          Navigator.pop(context, false);
                        },
                        child: Text(
                          "No",
                          style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600), // White text color
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 1,
                    ),
                  ],
                )

                // Row(
                //   children: [
                //     Flexible(
                //         child: buttonWidget(
                //             onTap: () {
                //               Navigator.pop(context, true);
                //             },
                //             context: context,
                //             text: 'Yes')),
                //     SizedBox(
                //       width: 10,
                //     ),
                //     Flexible(
                //         child: buttonWidget(
                //             onTap: () {
                //               Navigator.pop(context, false);
                //             },
                //             context: context,
                //             text: 'No',
                //             buttonColor: white,
                //             borderColor: black,
                //             textColor: black)),
                //   ],
                // )
              ],
            ),
          );
        });
      },
    );
  }

  Widget emptyWidget() {
    return Scaffold(
        appBar: AppBar(
          title: Text(
            "Manage Address",
            style: customTextstyle(fontWeight: FontWeight.w600, fontSize: 20),
          ),
          leading: IconButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                Navigator.of(context).pop();
              },
              icon: Image.asset(
                backbutton,
                height: 5.h,
                width: 10.w,
                fit: BoxFit.cover,
              )),
          backgroundColor: bg,
        ),
        backgroundColor: bg,
        body: SafeArea(
          child: Container(
            padding: EdgeInsets.all(5.w),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Image(
                  image: AssetImage(emptyAddressBanner),
                  width: 80.w,
                  height: 30.h,
                  fit: BoxFit.contain,
                ),
                SizedBox(
                  height: 2.h,
                ),
                customText(
                  text: "Waiting for your address",
                  fontSize: 20.sp,
                  fontWeight: FontWeight.w600,
                  textAlign: TextAlign.center,
                ),
                SizedBox(
                  height: 1.h,
                ),
                Padding(
                  padding: EdgeInsets.only(left: 3.w, right: 3.w),
                  child: customText(
                    text: "Let Us Pack Something Special For\nYou",
                    textAlign: TextAlign.center,
                    fontWeight: FontWeight.w500,
                    color: ordersPrimaryColor.withOpacity(.6),
                  ),
                ),
                SizedBox(
                  height: 5.h,
                ),
                GetBuilder<AdressController>(
                  id: 'update-address',
                  builder: (controller) => isMapsOpened
                      ? Center(
                          child: CircularProgressIndicator.adaptive(),
                        )
                      : iconbuttonWidget(
                          context: context,
                          icon: Padding(
                            padding: EdgeInsets.all(0.6.h),
                            child: ImageIcon(AssetImage(plusSymbol)),
                          ),
                          text: "Add Address",
                          onTap: () async {
                            if (isMapsOpened == false) {
                              isMapsOpened = true;
                              controller.updateUI();
                              await pickLocation(
                                  context: context, iseditpage: 1);
                              isMapsOpened = false;
                              controller.updateUI();
                            }
                          },
                        ),
                ),
                SizedBox(
                  height: 10.h,
                )
              ],
            ),
          ),
        ));
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
