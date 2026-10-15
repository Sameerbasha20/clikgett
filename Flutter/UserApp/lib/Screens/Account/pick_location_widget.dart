import 'dart:ffi';

import 'package:fav_app/Constants/button.dart';
import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/ViewModels/Account/adresses.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';

class PickLocationWidget extends StatefulWidget {
  CameraPosition initialCameraPosition;
  PickLocationWidget({Key? key, required this.initialCameraPosition})
      : super(key: key);

  @override
  State<PickLocationWidget> createState() => _PickLocationWidgetState();
}

class _PickLocationWidgetState extends State<PickLocationWidget> {
  List<String?> flat = List.filled(1, '');
  List<String?> landmark = List.filled(1, '');
  FocusNode flatFocus = FocusNode();
  FocusNode landmarkFocus = FocusNode();
  TextEditingController flatController = TextEditingController();
  TextEditingController landmarkController = TextEditingController();

  LatLng? selectedPosition;
  List<Placemark>? placemarks;
  Map<MarkerId, Marker> markers = <MarkerId, Marker>{};
  int type = 1;
  late GoogleMapController googleMapController;

  String? selectedLocation;
  String? city;
  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    // TODO: implement dispose
    super.dispose();
  }

  Future<Position> _determinePosition() async {
    Position position = await Geolocator.getCurrentPosition();

    return position;
  }

  Future<Void?> getAdressFromlatLong(Position position) async {
    setState(() {
      selectedPosition = LatLng(position.latitude, position.longitude);
    });
    List<Placemark> placemarks = await placemarkFromCoordinates(
        selectedPosition!.latitude, selectedPosition!.longitude);
    city = placemarks[0].subAdministrativeArea;
    selectedLocation =
        "${placemarks[0].name!} ${placemarks[0].locality!}${placemarks[0].subLocality!} ${placemarks[0].subAdministrativeArea!} ${placemarks[0].administrativeArea!} ${placemarks[0].postalCode!}";
  }

  List<Marker> locationmarkers = [];

  AcountViewModel? acountViewModel;

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      acountViewModel = context.watch<AcountViewModel>();
    }
    return Material(
      child: Scaffold(
        body: SafeArea(
          child: Column(children: [
            Expanded(
              flex: 5,
              child: Stack(
                children: [
                  GoogleMap(
                    initialCameraPosition: widget.initialCameraPosition,
                    compassEnabled: true,
                    myLocationButtonEnabled: true,
                    myLocationEnabled: true,
                    markers: markers.values.toSet(),
                    onMapCreated: (GoogleMapController controller) async {
                      googleMapController = controller;
                      Position position = await _determinePosition();

                      getAdressFromlatLong(position);

                      googleMapController.animateCamera(
                          CameraUpdate.newCameraPosition(CameraPosition(
                              target:
                                  LatLng(position.latitude, position.longitude),
                              zoom: 14.4746)));

                      locationmarkers.clear();

                      locationmarkers.add(Marker(
                          markerId: const MarkerId('currentLocation'),
                          position:
                              LatLng(position.latitude, position.longitude),
                          icon: BitmapDescriptor.defaultMarker));

                      setState(() {});
                    },
                    onTap: (pos) async {
                      // print(pos);

                      var marker = Marker(
                        markerId: const MarkerId('place_name'),
                        position: pos,
                        icon: BitmapDescriptor.defaultMarkerWithHue(
                            BitmapDescriptor.hueGreen),
                        infoWindow: const InfoWindow(
                          snippet: 'You will get delivered here',
                        ),
                      );

                      setState(() {
                        markers[MarkerId('place_name')] = marker;
                      });

                      selectedPosition = pos;
                      placemarks = await placemarkFromCoordinates(
                          selectedPosition!.latitude,
                          selectedPosition!.longitude);
                      if (placemarks!.isNotEmpty) {
                        debugPrint(placemarks![0].toString());
                        city = placemarks![0].subAdministrativeArea;
                        selectedLocation =
                            "${placemarks![0].name!} ${placemarks![0].locality!} ${placemarks![0].subLocality!} ${placemarks![0].subAdministrativeArea!} ${placemarks![0].administrativeArea!} ${placemarks![0].postalCode!}";
                        setState(() {});
                      }
                    },
                  ),
                  Align(
                    alignment: Alignment.topLeft,
                    child: IconButton(
                        onPressed: () {
                          Navigator.pop(context);
                        },
                        icon: const Icon(
                          Icons.arrow_back_ios_new,
                          color: tGrey,
                        )),
                  ),
                ],
              ),
            ),
            Expanded(
              flex: 5,
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                color: tWhite,
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      addressWidget(),
                      TextFormField(
                        controller: flatController,
                        focusNode: flatFocus,
                        onFieldSubmitted: (v) {
                          _fieldFocusChange(context, flatFocus, landmarkFocus);
                        },
                        decoration: const InputDecoration(
                          label: Text('House / Flat / Block No.'),
                        ),
                      ),
                      TextFormField(
                        controller: landmarkController,
                        focusNode: landmarkFocus,
                        onFieldSubmitted: (v) {
                          _fieldFocusChange(context, landmarkFocus, null);
                        },
                        decoration: const InputDecoration(
                          label: Text('Landmark'),
                        ),
                      ),
                      const SizedBox(
                        height: 10,
                      ),
                      Text(
                        'Save As',
                        style: normalTextstyle(color: tGrey),
                      ),
                      const SizedBox(
                        height: 10,
                      ),
                      addressTypeWidget(),
                      Expanded(child: Container()),
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
        const Expanded(
          flex: 1,
          child: Icon(
            Icons.location_on,
            color: primaryColor,
          ),
        ),
        Expanded(
          flex: 9,
          child: Text(
            selectedLocation ?? "",
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
            style: normalTextstyle(
                color: tBlack, fontSize: 18, fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }

  _fieldFocusChange(
    BuildContext context,
    FocusNode? nextFocus,
    FocusNode? currentFocus,
  ) {
    currentFocus!.unfocus();
    FocusScope.of(context).requestFocus(nextFocus);
  }

  Widget addressTypeWidget() {
    return Container(
        child: Row(
      children: [
        addressTypeTile(
            icon: Icons.home,
            title: 'Home',
            val: 1,
            isSelected: type == 1 ? true : false),
        const SizedBox(
          width: 15,
        ),
        addressTypeTile(
            icon: Icons.work,
            title: 'Work',
            val: 2,
            isSelected: type == 2 ? true : false),
        const SizedBox(
          width: 15,
        ),
        addressTypeTile(
            icon: Icons.location_on,
            title: 'Others',
            val: 3,
            isSelected: type == 3 ? true : false),
      ],
    ));
  }

  Widget addressTypeTile(
      {IconData? icon, String? title, bool? isSelected, int? val}) {
    return InkWell(
      onTap: () {
        setState(() {
          type = val!;
        });
      },
      child: Ink(
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 5, vertical: 5),
          // color: Colors.red,
          decoration: BoxDecoration(
              border: Border(
                  bottom: BorderSide(
            color: isSelected! == true ? primaryColor : tGrey,
          ))),
          child: Row(
            children: [
              Icon(
                icon!,
                color: tGrey,
              ),
              const SizedBox(
                width: 5,
              ),
              Text(
                title!,
                style: normalTextstyle(fontSize: 15, color: tGrey),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget submitButton() {
    return SizedBox(
        width: double.maxFinite,
        child: buttonWidget(
          onTap: () {
            var adressType = type == 1
                ? 'Home'
                : type == 2
                    ? 'Work'
                    : type == 3
                        ? 'Other'
                        : 'null';
            print(adressType);
            if (selectedLocation == null) {
              customToast(message: 'Please select address');
            } else if (flatController.text.isEmpty) {
              customToast(message: 'please Enter House / Flat / Block No');
            } else if (landmarkController.text.isEmpty) {
              customToast(message: 'please Enter Landmark');
            } else {
              Map<String, dynamic> body = Map<String, dynamic>();
              body['Latitude'] = selectedPosition?.latitude;
              body['Longitude'] = selectedPosition?.latitude;
              body['Address'] = selectedLocation;
              body['City'] = city;
              body['FlatNo'] = flatController.text;
              body['Landmark'] = landmarkController.text;
              body['Type'] = adressType;
              acountViewModel?.addAdresses(context: context, body: body);
            }
          },
          textColor: tWhite,
          buttonColor: tGreen,
          text: 'Select Address',
          // style: normalTextstyle(
          //     color: tWhite, fontWeight: FontWeight.w600, fontSize: 16),
        ));
  }
}
