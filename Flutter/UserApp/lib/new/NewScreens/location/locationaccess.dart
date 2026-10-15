import 'dart:convert';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:http/http.dart' as http; // Import the correct http package
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../Constants/toast.dart';
import '../../../Services/common/common_services.dart';
import '../../../constants.dart';
import '../../../old/Constants/text.dart';
import 'package:fav_app/new/NewScreens/Widgets/textfieldWidget.dart';
import '../../Constants/colors.dart';
import '../Address/SaerchAddress.dart';

class LocationPickerPage extends StatefulWidget {
  CameraPosition? initialCameraPosition;
  String? add;
  String? city;
  final lat;
  final lng;

  LocationPickerPage(
      {Key? key,
      this.initialCameraPosition,
      this.add,
      this.lat,
      this.lng,
      this.city})
      : super(key: key);

  @override
  _LocationPickerPageState createState() => _LocationPickerPageState();
}

class _LocationPickerPageState extends State<LocationPickerPage>
    with WidgetsBindingObserver {
  GoogleMapController? mapController;
  LatLng? _currentPosition;
  String _address = 'Loading address...';
  String _city = 'Loading city...';
  String? token; // Store the token
  List<String?> flat = List.filled(1, '');
  List<String?> landmark = List.filled(1, '');
  FocusNode flatFocus = FocusNode();
  FocusNode landmarkFocus = FocusNode();
  TextEditingController flatController = TextEditingController();
  TextEditingController landmarkController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this); // Add observer
    print(widget.add);
print("MMMMMMMMMMMMMMMMMMMMMM");
    CommonServices.getToken().then((onValue) {
      token = onValue; // Store the token
    });

    _getCurrentLocation();
  }

  @override
  void dispose() {
    // Remove the observer when the widget is disposed
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Fetch current location and address
  Future<void> _getCurrentLocation() async {
    LocationPermission permission;

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      // Request permission if denied
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _showPermissionDialog(
            "Location permissions are denied. Please allow to access.");
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      // This means the user has permanently denied location permissions.
      _showPermissionDialog(
          "Location permissions are permanently denied. Please go to settings to enable them.");
      return;
    }

    // When permission is granted, get the current location
    Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
    setState(() {
      if (widget.lat != null && widget.lng != null) {
        _currentPosition = LatLng(widget.lat, widget.lng);
      }else{
        _currentPosition = LatLng(position.latitude, position.longitude);

      }
    });
    if (widget.lat != null && widget.lng != null) {
      await _getAddressFromLatLng(widget.lat, widget.lng);

    }else{
      await _getAddressFromLatLng(position.latitude, position.longitude);

    }
    // Fetch address from coordinates using the position
  }

  void _showPermissionDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false, // Prevent dismissing dialog by tapping outside
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text("Permission Required"),
          content: Text(message),
        );
      },
    );
  }

  Future<void> _getAddressFromLatLng(double latitude, double longitude) async {
    try {
      List<Placemark> placemarks =
          await placemarkFromCoordinates(latitude, longitude);
      Placemark place = placemarks[0];

      setState(() {
        // Combine fields to create a detailed address
        String areaName = place.subLocality ?? 'Unknown Area';
        String locality = place.locality ?? 'Unknown Locality';
        String country = place.country ?? 'Unknown Country';

        // Concatenating all the information to form the full address
        _address = '$areaName, $locality, $country';
        _city = locality;
      });
    } catch (e) {
      setState(() {
        _address = 'Address not available';
        _city = 'City not available';
      });
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    mapController = controller;
  }

  // When confirm button is pressed
  void _confirmLocation() {
    if (flatController.text.isEmpty) {
      customToast(message: 'please Enter House / Flat / Block No');
    } else if (landmarkController.text.isEmpty) {
      customToast(message: 'please Enter Landmark');
    } else if (_currentPosition != null && token != null) {
      // Print the latitude and longitude
      print("Latitude: ${_currentPosition!.latitude}");
      print("Longitude: ${_currentPosition!.longitude}");

      // Print the city and address
      print("City: $_city");
      print("Address: $_address");

      addAddress(_currentPosition!.latitude, _currentPosition!.longitude, _city,
          _address, token!, flatController.text, landmarkController.text);
    } else {
      // If the position or token is null, show a message
      print("Location or token is not available yet.");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          _currentPosition == null
              ? const Center(child: CircularProgressIndicator())
              : GoogleMap(
                  onMapCreated: _onMapCreated,
                  initialCameraPosition: CameraPosition(
                    target: _currentPosition!,
                    zoom: 15.0,
                  ),
                  markers: {
                    Marker(
                      markerId: const MarkerId('currentLocation'),
                      position: _currentPosition!,
                    ),
                  },
                  circles: {
                    Circle(
                      circleId: const CircleId("radius"),
                      center: _currentPosition!,
                      radius: 100,
                      // 100 meter radius
                      fillColor: Colors.yellow.withOpacity(0.5),
                      strokeColor: Colors.yellow,
                    ),
                  },
                ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 10.0,
                    spreadRadius: 0.5,
                  )
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(flex: 12, child: Container()),
                      Expanded(
                        flex: 5,
                        child: buttonWidget(
                            onTap: () {
                              Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (context) => Saerchaddress(
                                          editpage: "AddFristTime")));
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
                  Row(
                    children: [
                      const Icon(Icons.location_pin, color: Colors.green),
                      const SizedBox(width: 8),
                      Expanded(
                        child: customText(
                          text: _address,
                          fontWeight: FontWeight.w500,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.location_city, color: Colors.blue),
                      const SizedBox(width: 8),
                      Expanded(
                          child: customText(
                        text: _city,
                        fontWeight: FontWeight.w500,
                        fontSize: 15,
                      )
                          // Text(
                          //   _city,
                          //   style: const TextStyle(fontSize: 16),
                          // // ),
                          ),
                    ],
                  ),
                  textWidgets(),
                  const SizedBox(height: 16),
                  buttonWidget(
                    onTap: _confirmLocation,
                    context: context,
                    borderRadius: 26,
                    text: "Confirm Location",
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> addAddress(double latitude, double longitude, String city,
      String address, String token, String faltno, String landmark) async {
    try {
      final String apiUrl = '${Constants.baseUrl}/address/addaddress';

      Map<String, dynamic> requestBody = {
        "Latitude": latitude,
        "Longitude": longitude,
        "City": city,
        "FlatNo": faltno,
        "Landmark": landmark,
        "Address": address,
        "Type": "Home",
      };
      print('Request Body: ${requestBody}');

      http.Response response = await http.post(
        Uri.parse(apiUrl),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(requestBody),
      );

      print('Response Status Code: ${response.statusCode}');
      print('Response Body: ${response.body}');

      var data = jsonDecode(response.body);
      int status = data['Status'];
      if (status == 1) {
        Navigator.of(context)
            .push(MaterialPageRoute(builder: (context) => const Homepage()));

        print('Address added successfully');
      } else {
        customToast(message: data['Message']);

        print('Failed to add address: ${data['Message']}');
      }
    } catch (e) {
      print('Exception during API call: $e');
    }
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
}
