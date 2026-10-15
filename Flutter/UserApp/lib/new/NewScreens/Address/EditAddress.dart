import 'dart:ffi';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/NewScreens/Address/GoogleMapSearchPlacesApi.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/NewScreens/Widgets/textfieldWidget.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../old/Models/Account/adresses.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'dart:ui' as ui;
import 'dart:typed_data';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';

import '../../Constants/static_loader.dart';

class EditAddress extends StatefulWidget {
  final Address address;
  CameraPosition initialCameraPosition;
  String? add;
  String? city;
  final  lat;
  final lng;
   EditAddress({
    Key? key,
    required this.address,required this.initialCameraPosition, this. add, this.  lat, this.  lng, this. city
  }) : super(key: key);

  @override
  State<EditAddress> createState() => _EditAddressState();
}

class _EditAddressState extends State<EditAddress> {
  List<String?> flat = List.filled(1, '');
  List<String?> landmark = List.filled(1, '');
  FocusNode flatFocus = FocusNode();
  FocusNode landmarkFocus = FocusNode();
  TextEditingController flatController = TextEditingController();
  TextEditingController landmarkController = TextEditingController();
  bool isEditing = false; // To control the visibility of addressWidget
  TextEditingController locationController = TextEditingController(); // Text controller for the input field
  TextEditingController otherTypeController = TextEditingController(); // For "Other" type

  LatLng? selectedPosition;
  List<Placemark>? placemarks;
  Map<MarkerId, Marker> markers = <MarkerId, Marker>{};
  String type = 'Home';
  late GoogleMapController googleMapController;
  String? selectedLocation;
  String? city;
  @override
  void initState() {
    super.initState();
    flatController.text = widget.address.flatNo;
    landmarkController.text = widget.address.landmark;
    type = widget.address.type;
    if (type != "Home" && type != "Work") {
      otherTypeController.text = type; // Fill the controller with the type
    }
    lattitude = widget.address.latitude;
    longiitude = widget.address.longitude;
    initialCameraPosition =
        CameraPosition(target: LatLng(lattitude, longiitude), zoom: 14);

    getAdressFromlatLong(latLng: LatLng(lattitude, longiitude));
  }

  final AdressController adressController = Get.find();

  late CameraPosition initialCameraPosition;
  @override
  void dispose() {
    adressController.resetLoadingBtn();
    super.dispose();
  }

  final formkey = GlobalKey<FormState>();
  Future<Position> _determinePosition() async {
    Position position = await Geolocator.getCurrentPosition();

    return position;
  }

  double lattitude = 0;
  double longiitude = 0;

  var selectedPositions;

  Future<Void?> getAdressFromlatLong(
      {Position? position, LatLng? latLng}) async {
    if (latLng != null) {
      selectedPositions = LatLng(latLng.latitude, latLng.longitude);
    } else {
      selectedPositions = LatLng(position!.latitude, position.longitude);
    }

    List<Placemark> placemarks = await placemarkFromCoordinates(
        selectedPositions!.latitude, selectedPositions!.longitude);
    city = placemarks[0].administrativeArea;
    selectedLocation =
        "${placemarks[0].name!} ${placemarks[0].subLocality!} ${placemarks[0].locality!} ${placemarks[0].subAdministrativeArea!} ${placemarks[0].administrativeArea!} ${placemarks[0].postalCode!}";
    setState(() {});
  }

  List<Marker> locationmarkers = [];

  // AcountViewModel? acountViewModel;

  Future<Uint8List> getBytesFromAsset({String? path, int? width}) async {
    ByteData data = await rootBundle.load(path!);
    ui.Codec codec = await ui.instantiateImageCodec(data.buffer.asUint8List(),
        targetWidth: width);
    ui.FrameInfo fi = await codec.getNextFrame();
    return (await fi.image.toByteData(format: ui.ImageByteFormat.png))!
        .buffer
        .asUint8List();
  }
  void _updateCameraPosition(LatLng newPosition) {
    googleMapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(target: newPosition, zoom: 14.0),
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Edit Address",
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
      ),
      backgroundColor: bg,
      body: SafeArea(
        child: Form(
          key: formkey,
          child: Column(children: [
            Expanded(
              flex: 4,
              child: Stack(
                children: [
                  if(widget.add==null)...[
                    GoogleMap(
                      initialCameraPosition: initialCameraPosition,
                      compassEnabled: true,
                      myLocationButtonEnabled: true,
                      myLocationEnabled: true,
                      markers: markers.values.toSet(),
                      onMapCreated: (GoogleMapController controller) async {
                        googleMapController = controller;
                        final Uint8List customMarker = await getBytesFromAsset(
                            path: locationpin, //paste the custom image path
                            width: 100 // size of custom image as marker
                        );
                        final marker = Marker(
                          markerId: const MarkerId('place_name'),
                          position: LatLng(lattitude, longiitude),
                          icon: BitmapDescriptor.fromBytes(customMarker),
                          infoWindow: const InfoWindow(
                            title: 'title',
                            snippet: 'address',
                          ),
                        );

                        setState(() {
                          markers[const MarkerId('place_name')] = marker;
                        });
                        // Position position = await _determinePosition();

                        // getAdressFromlatLong(position: position);

                        // googleMapController.animateCamera(
                        //     CameraUpdate.newCameraPosition(CameraPosition(
                        //         target:
                        //             LatLng(position.latitude, position.longitude),
                        //         zoom: 14.4746)));

                        // locationmarkers.clear();
                        // final Uint8List customMarker = await getBytesFromAsset(
                        //     path: locationpin, //paste the custom image path
                        //     width: 100 // size of custom image as marker
                        //     );
                        // locationmarkers.add(Marker(
                        //     markerId: const MarkerId('place_name'),
                        //     position: LatLng(lattitude, longiitude),
                        //     icon: BitmapDescriptor.defaultMarker));
                      },
                      onTap: (pos) async {
                        final Uint8List customMarker = await getBytesFromAsset(
                            path: locationpin, //paste the custom image path
                            width: 100 // size of custom image as marker
                        );

                        var marker = Marker(
                          markerId: const MarkerId('place_name'),
                          position: pos,
                          icon: BitmapDescriptor.fromBytes(customMarker),
                          // icon: BitmapDescriptor.defaultMarkerWithHue(
                          //     BitmapDescriptor.hueGreen),
                          infoWindow: const InfoWindow(
                            snippet: 'You will get delivered here',
                          ),
                        );

                        setState(() {
                          markers[const MarkerId('place_name')] = marker;
                        });

                        selectedPosition = pos;
                        placemarks = await placemarkFromCoordinates(
                            selectedPosition!.latitude,
                            selectedPosition!.longitude);
                        if (placemarks!.isNotEmpty) {
                          city = placemarks![0].administrativeArea;
                          selectedLocation =
                          "${placemarks![0].name!} ${placemarks![0].subLocality!} ${placemarks![0].locality!} ${placemarks![0].subAdministrativeArea!} ${placemarks![0].administrativeArea!} ${placemarks![0].postalCode!}";
                          setState(() {});
                        }
                      },
                    )
                    ]
                  else...[
                    GoogleMap(
                      initialCameraPosition: widget.initialCameraPosition,
                      compassEnabled: true,
                      myLocationButtonEnabled: true,
                      myLocationEnabled: true,
                      markers: markers.values.toSet(),
                      onMapCreated: (GoogleMapController controller) async {
                        googleMapController = controller;

                        // Determine the current position
                        // Position position = await _determinePosition();

                        // Get address from coordinates
                        _updateCameraPosition(LatLng(widget.lat, widget.lng));
                        final Uint8List customMarker = await getBytesFromAsset(
                          path: locationpin, // Custom image path
                          width: 100,        // Marker size
                        );
                        var marker = Marker(
                          markerId: const MarkerId('place_name'),
                          position: LatLng(widget.lat, widget.lng),
                          icon: BitmapDescriptor.fromBytes(customMarker),
                          infoWindow: const InfoWindow(
                            snippet: 'You will get delivered here',
                          ),
                        );
                        selectedLocation =widget.add;
                        selectedPosition = LatLng(widget.lat, widget.lng);
                        city =widget.city;
                        // Add the new marker to the map
                        setState(() {
                          markers[const MarkerId('place_name')] = marker;
                        });

                        // await getAdressFromlatLong(position);
                        // placemarks = await placemarkFromCoordinates(
                        //   14.4425987,
                        //   79.96431249999999,
                        // );


                        setState(() {});
                      },




                    )

                  ]

,
                ],
              ),
            ),
            Expanded(
              flex: 6,
              child: SingleChildScrollView(
                padding: EdgeInsets.only(left: 3.w, top: 0.5.h, right: 3.w),
                child: Column(children: [
                  Row(
                    children: [
                      Expanded(flex: 12, child: Container()),
                      Expanded(
                        flex: 5,
                        child: buttonWidget(
                            onTap: () {
                              Navigator.push(
                                  context,  MaterialPageRoute(
                                  builder: (context) => PlacesSearchPage(editpage:"Edit",address:widget.address)));

                            },
                              // setState(() {
                              //   selectedLocation = ''; // Clear the selectedLocation
                              //   isEditing = !isEditing; // Toggle the visibility
                              //   isEditing = true; // Enable editing on first click
                              //
                              // }
                              // );                            },
                            context: context,
                            text: "Change",
                            borderColor: green,
                            buttonColor: white,
                            textColor: green,
                            width: 20.w,
                            height: 4.h,
                            fontSize: 16.sp,
                            borderRadius: 2.h),
                      ),
                    ],
                  ),
                  if (isEditing) addressTextFormField(),
                  if (!isEditing) addressWidget(), // Show addressWidget if visible

                  // addressWidget(),
                  textWidgets(),
                  addressTypeWidget(),
                  // if (type != "Home" || type != "Work")
                  //   Padding(
                  //     padding: const EdgeInsets.symmetric(vertical: 10),
                  //     child: TextFormField(
                  //       controller: otherTypeController,
                  //       decoration: const InputDecoration(
                  //         label: Text('Specify Other Address Type'),
                  //       ),
                  //     ),
                  //   ),
                  submitButton(),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }
  Widget addressTextFormField() {
    return TextFormField(
      controller: locationController,
      decoration: InputDecoration(
        labelText: 'Enter  Address',
        border: OutlineInputBorder(),
      ),
    );
  }
  Widget addressWidget() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 1,
          child: Container(
            alignment: Alignment.center,
            padding: EdgeInsets.all(0.5.h),
            child: ImageIcon(
              AssetImage(locationIcon),
              color: primary,
            ),
          ),
        ),
        Expanded(
          flex: 9,
          child: Text(
            selectedLocation ?? "",
            overflow: TextOverflow.ellipsis,
            maxLines: 2,
            style: customTextstyle(),
          ),
        ),
      ],
    );
  }

  Widget textWidgets() {
    return Padding(
      padding: EdgeInsets.only(top: 2.h, bottom: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          customText(
            text: "House/Flat/Block No",
            fontWeight: FontWeight.w500,
          ),
          SizedBox(
            height: 0.5.h,
          ),
          textFieldWidget(
              fillColor: bg1,
              textColor: ordersPrimaryColor,
              context: context,
              hint: "House/Flat/Block No",
              controller: flatController,
              onChanged: (p0) {
                if (p0 == ' ') {
                  flatController.clear();
                }
              },
              currentFocus: flatFocus,
              nextFocus: landmarkFocus,
              holder: flat,
              validation: true),
          SizedBox(
            height: 2.h,
          ),
          customText(
            text: "Landmark",
            fontWeight: FontWeight.w500,
          ),
          SizedBox(
            height: 0.5.h,
          ),
          textFieldWidget(
              fillColor: bg1,
              textColor: ordersPrimaryColor,
              context: context,
              hint: "Landmark",
              controller: landmarkController,
              currentFocus: landmarkFocus,

              onChanged: (p0) {
    if (p0 == null || p0.isEmpty) {
      customToast(message: 'Please enter Landmark');

    }else
                if (p0 == ' ') {
                  landmarkController.clear();
                }
              },
              nextFocus: null,
              holder: landmark,
              validation: true),
        ],
      ),
    );
  }

  Widget addressTypeWidget() {

    return Padding(
      padding: EdgeInsets.only(top: 1.h, bottom: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Save As',
            style: customTextstyle(color: black.withOpacity(0.7)),
          ),
          SizedBox(height: 1.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              // Home Radio
              Row(
                children: [
                  SizedBox(
                    width: 10.w,
                    height: 3.h,
                    child: Radio(
                      value: 'Home',
                      groupValue: type,
                      activeColor: green,
                      onChanged: (value) {
                        setState(() {
                          type = value.toString(); // Update type
                        });
                      },
                    ),
                  ),
                  customText(text: "Home", color: tColor3),
                ],
              ),
              // Work Radio
              Row(
                children: [
                  SizedBox(
                    width: 10.w,
                    height: 3.h,
                    child: Radio(
                      value: 'Work',
                      groupValue: type,
                      activeColor: green,
                      onChanged: (value) {
                        setState(() {
                          type = value.toString(); // Update type
                        });
                      },
                    ),
                  ),
                  customText(text: "Work", color: tColor3),
                ],
              ),
              // Other Radio
              Row(
                children: [
                  SizedBox(
                    width: 10.w,
                    height: 3.h,
                    child: Radio(
                      value: otherTypeController.text,
                      groupValue: type,
                      activeColor: green,
                      onChanged: (value) {
                        setState(() {
                          type = value.toString(); // Update type
                        });
                      },
                    ),
                  ),
                  customText(text: "Other", color: tColor3),
                ],
              ),
            ],
          ),
          // Show TextFormField when type is "Other"
          if (type != "Home" && type!="Work")
            Column(
              children: [

                Padding(
                  padding: EdgeInsets.only(top: 2.h),
                  child: textFieldWidget(
                    fillColor: bg1,
                    textColor: Colors.redAccent,
                    context: context,
                    hint: 'Enter details for $type', // Show type in the hint
                    controller: otherTypeController,
                    validation: true,
                    currentFocus: FocusNode(),
                    nextFocus: null,
                    holder: [otherTypeController.text],
    onChanged: (value) {

        // Update the type variable whenever the user enters a value
        if (value.isNotEmpty) {
          type = value; // Send the entered value to type
        }

    }// Display current input
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget submitButton() {
    return Obx(
      () => adressController.isLoading.isTrue
          ? const CustomLoader()
          : buttonWidget(
              context: context,
        onTap: () {

          if (formkey.currentState!.validate()) {
            var addressType = type;


            // Check if we're in editing mode
            if (isEditing) {
              // Validate the address when editing
              if (locationController.text.isEmpty) {
                customToast(message: 'Please enter the address');
              } else {
                // Proceed to update or save the address as needed
                Map<String, dynamic> body = <String, dynamic>{
                  'Address': locationController.text,
                  'Type': addressType,
                  // Add other necessary fields if needed
                };
                adressController.updateAdresses(
                  context: context,
                  id: widget.address.addressId,
                  body: body,
                );
              }
            } else {
              // Check if not in editing mode
              if (selectedLocation == null) {
                customToast(message: 'Please select an address');
              } else if (flatController.text.isEmpty) {
                customToast(message: 'Please enter House / Flat / Block No');
              } else if (landmarkController.text.isEmpty) {
                customToast(message: 'Please enter Landmark');
              } else {
                Map<String, dynamic> body = <String, dynamic>{
                  'Latitude': selectedPosition?.latitude,
                  'Longitude': selectedPosition?.longitude,
                  'Address': selectedLocation,
                  'City': city,
                  'FlatNo': flatController.text,
                  'Landmark': landmarkController.text,
                  'Type': addressType,
                };
                adressController.updateAdresses(
                  context: context,
                  id: widget.address.addressId,
                  body: body,
                );
              }
            }
          } else {
            // customToast(message: 'Form is not valid');
          }
        }
,
              text: 'Update Address',
            ),
    );
  }
}
