import 'dart:ffi';
import 'dart:typed_data';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/NewScreens/Address/GoogleMapSearchPlacesApi.dart';
import 'package:fav_app/new/NewScreens/Address/SaerchAddress.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/NewScreens/Widgets/textfieldWidget.dart';
import 'package:fav_app/old/Models/Account/adresses.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'dart:ui' as ui;
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';

class AddAddress extends StatefulWidget {
  CameraPosition initialCameraPosition;
  String? add;
  String? city;
  final  lat;
  final lng;
  AddAddress({Key? key, required this.initialCameraPosition, this. add, this.  lat, this.  lng, this. city}) : super(key: key);

  @override
  State<AddAddress> createState() => _AddAddressState();
}

class _AddAddressState extends State<AddAddress> {
  List<String?> flat = List.filled(1, '');
  List<String?> landmark = List.filled(1, '');
  FocusNode flatFocus = FocusNode();
  FocusNode landmarkFocus = FocusNode();
  TextEditingController flatController = TextEditingController();
  TextEditingController landmarkController = TextEditingController();
  TextEditingController otherTypeController = TextEditingController();

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
  }

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

  Future<Void?> getAdressFromlatLong(Position position) async {
    selectedPosition = LatLng(position.latitude, position.longitude);

    List<Placemark> placemarks = await placemarkFromCoordinates(
        selectedPosition!.latitude, selectedPosition!.longitude);
    city = placemarks[0].subLocality;

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

  final AdressController adressController = Get.find();

  @override
  Widget build(BuildContext context) {
    Address address;
    if (mounted) {
      // acountViewModel = context.watch<AcountViewModel>();
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Address",
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
                      initialCameraPosition: widget.initialCameraPosition,
                      compassEnabled: true,
                      myLocationButtonEnabled: true,
                      myLocationEnabled: true,
                      markers: markers.values.toSet(),
                      onMapCreated: (GoogleMapController controller) async {
                        googleMapController = controller;

                        // Determine the current position
                        Position position = await _determinePosition();

                        // Get address from coordinates
                        _updateCameraPosition(LatLng(position.latitude, position.longitude));

                        await getAdressFromlatLong(position);

                        // Move the camera to the user's location
                        // googleMapController.animateCamera(
                        //   CameraUpdate.newCameraPosition(
                        //     CameraPosition(
                        //       target: LatLng(position.latitude, position.longitude),
                        //       zoom: 14.4746,
                        //     ),
                        //   ),
                        // );


                        // Clear previous markers and add a marker at the user's location
                        locationmarkers.clear();
                        locationmarkers.add(
                          Marker(
                            markerId: const MarkerId('currentLocation'),
                            position: LatLng(position.latitude, position.longitude),
                            icon: BitmapDescriptor.defaultMarker,
                          ),
                        );

                        setState(() {});
                      },
                      onTap: (pos) async {
                        final Uint8List customMarker = await getBytesFromAsset(
                          path: locationpin, // Custom image path
                          width: 100,        // Marker size
                        );

                        var marker = Marker(
                          markerId: const MarkerId('place_name'),
                          position: pos,
                          icon: BitmapDescriptor.fromBytes(customMarker),
                          infoWindow: const InfoWindow(
                            snippet: 'You will get delivered here',
                          ),
                        );

                        // Add the new marker to the map
                        setState(() {
                          markers[const MarkerId('place_name')] = marker;
                        });

                        // Update the selected position and fetch address details
                        selectedPosition = pos;
                        placemarks = await placemarkFromCoordinates(
                          selectedPosition!.latitude,
                          selectedPosition!.longitude,
                        );

                        if (placemarks!.isNotEmpty) {
                          debugPrint(placemarks![0].toString());
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

                ],
              ),
            ),
            Expanded(
              flex: 6,
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
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
                                  builder: (context) => Saerchaddress(editpage: "new")));
                            },
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
                  addressWidget(),
                  textWidgets(),
                  addressTypeWidget(),
                  submitButton(),
                ]),
              ),
            )
          ]),
        ),
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
              currentFocus: flatFocus,
              onChanged: (p0) {
                if (p0 == ' ') {
                  flatController.clear();
                }
              },
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
          SizedBox(
            height: 1.h,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
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
                          type = value.toString();
                        });
                      },
                    ),
                  ),
                  customText(
                    text: "Home",
                    color: tColor3,
                  ),
                ],
              ),
              SizedBox(
                width: 2.w,
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
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
                          type = value.toString();
                        });
                      },
                    ),
                  ),
                  customText(
                    text: "Work",
                    color: tColor3,
                  ),
                ],
              ),
              SizedBox(
                width: 2.w,
              ),
              Row(
                children: [
                  SizedBox(
                    width: 10.w,
                    height: 3.h,
                    child: Radio(
                      value: 'Other',
                      groupValue: type,
                      activeColor: green,
                      onChanged: (value) {
                        setState(() {
                          type = value.toString();
                        });
                      },
                    ),
                  ),
                  customText(
                    text: "Other",
                    color: tColor3,
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: 20,),
          if (type == 'Other')
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 1.h,
                ),
                customText(
                  text: "Other Name",
                  fontWeight: FontWeight.w500,
                ),
                SizedBox(
                  height: 1.5.h,
                ),
                textFieldWidget(
                  fillColor: bg1,
                  textColor: ordersPrimaryColor,
                  context: context,
                  hint: "Other Name",
                  controller: otherTypeController,
                  validation: true,
                  currentFocus: FocusNode(),
                  nextFocus: null,
                  holder: [otherTypeController.text],
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
                  var adressType = type;
                  if (selectedLocation == null) {
                    customToast(message: 'Please select address');
                  } else if (flatController.text.isEmpty) {
                    customToast(
                        message: 'please Enter House / Flat / Block No');
                  } else if (landmarkController.text.isEmpty) {
                    customToast(message: 'please Enter Landmark');
                  } else {
                    Map<String, dynamic> body = <String, dynamic>{};
                    body['Latitude'] = selectedPosition?.latitude;
                    body['Longitude'] = selectedPosition?.longitude;
                    body['Address'] = selectedLocation;
                    body['City'] = city;
                    body['FlatNo'] = flatController.text;
                    body['Landmark'] = landmarkController.text;
                    body['Type']= type == 'Other' ? otherTypeController.text : adressType;
                    adressController.addAdresses(context: context, body: body);
                  }
                }
              },
        borderRadius: 25,
              text: 'Save Address',
            ),
    );
  }
}
