import 'dart:ffi';

import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';

import '../../Constants/button.dart';
import '../../Constants/colors.dart';
import '../../Constants/text.dart';
import '../../Constants/toast.dart';
import '../../ViewModels/Account/adresses.dart';

class EditLocation extends StatefulWidget {
  final adress;
  final flatno;
  final landmark;
  final city;
  final lattitude;
  final logitude;
  final id;
  final type;
  EditLocation({
    Key? key,
    this.adress,
    this.flatno,
    this.landmark,
    this.city,
    this.lattitude,
    this.logitude,
    this.id,
    this.type,
  }) : super(key: key);

  @override
  State<EditLocation> createState() => _EditLocationState();
}

class _EditLocationState extends State<EditLocation> {
  List<String?> flat = List.filled(1, '');
  List<String?> landmark = List.filled(1, '');
  FocusNode flatFocus = FocusNode();
  FocusNode landmarkFocus = FocusNode();
  TextEditingController flatController = TextEditingController();
  TextEditingController landmarkController = TextEditingController();

  LatLng? selectedPosition;
  List<Placemark>? placemarks;
  Map<MarkerId, Marker> markers = <MarkerId, Marker>{};
  int? type;
  late GoogleMapController googleMapController;

  String? selectedLocation;
  String? city;
  @override
  void initState() {
    super.initState();
    flatController.text = widget.flatno;
    landmarkController.text = widget.landmark;
    type = widget.type == 'Home'
        ? 1
        : widget.type == 'Work'
            ? 2
            : widget.type == 'Others'
                ? 3
                : 3;
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<Position> _determinePosition() async {
    Position position = await Geolocator.getCurrentPosition();

    return position;
  }

  var selectedPositions;

  Future<Void?> getAdressFromlatLong(Position position) async {
    setState(() {
      selectedPositions = LatLng(position.latitude, position.longitude);
    });
    List<Placemark> placemarks = await placemarkFromCoordinates(
        selectedPositions!.latitude, selectedPositions!.longitude);
    city = placemarks[0].subAdministrativeArea;
    selectedPositions =
        "${placemarks[0].name!} ${placemarks[0].locality!}${placemarks[0].subLocality!} ${placemarks[0].subAdministrativeArea!} ${placemarks[0].administrativeArea!} ${placemarks[0].postalCode!}";
  }

  List<Marker> locationmarkers = [];

  AcountViewModel? acountViewModel;
  static const CameraPosition initialCameraPosition = CameraPosition(
      target: LatLng(37.42796133580664, -122.085749655962), zoom: 14);

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
                    initialCameraPosition: initialCameraPosition,
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
            selectedLocation == null ? widget.adress : selectedLocation ?? '',
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

            if (flatController.text.isEmpty) {
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
              acountViewModel?.updateAdresses(
                context: context,
                id: widget.id,
                body: body,
              );
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
