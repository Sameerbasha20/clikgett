import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/NewScreens/Address/AddAddress.dart';
import 'package:fav_app/new/NewScreens/Address/EditAddress.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:google_places_flutter/google_places_flutter.dart';
import 'package:google_places_flutter/model/prediction.dart';

import '../../../old/Models/Account/adresses.dart';


class PlacesSearchPage extends StatefulWidget {
  String? editpage;
  final Address address;
   PlacesSearchPage({super.key, required this.editpage, required this. address});

  @override
  State<PlacesSearchPage> createState() => _PlacesSearchPageState();
}

class _PlacesSearchPageState extends State<PlacesSearchPage> {
  final TextEditingController _controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
          title: const Text("Search Address"),
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Container(
              height: 45.0, // Set the height as per your design
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12.0), // Set the border radius
                border: Border.all(
                  color: Colors.grey, // Set the border color
                  width: 1.0, // Set the border width
                ),
              ),
              child: GooglePlaceAutoCompleteTextField(
                textEditingController: _controller,
                googleAPIKey: Constants.googlePlacesKey,
                inputDecoration: const InputDecoration(
                  hintText: "Search for a place",
                  border: InputBorder.none, // Remove default border as we are using a custom one
                  contentPadding: EdgeInsets.symmetric(vertical: 13.0, horizontal: 10.0), // Adjust padding inside the text field
                ),
                debounceTime: 800, // Delay before searching
                countries: const ["in"], // Restrict to specific countries
                isLatLngRequired: true, // Require latitude and longitude
                getPlaceDetailWithLatLng: (Prediction? prediction) async {
                  if (prediction != null) {
                    final lat = double.tryParse(prediction.lat ?? "0");
                    final lng = double.tryParse(prediction.lng ?? "0");
                    final description = prediction.description;

                    if (lat != null && lng != null) {
                      try {
                        // Fetch placemark from coordinates
                        List<Placemark> placemarks =
                        await placemarkFromCoordinates(lat, lng);

                        if (placemarks.isNotEmpty) {
                          // Get the city name
                          String? city = placemarks[0].administrativeArea;

                          debugPrint("City: $city");

                          final cameraPosition = CameraPosition(
                            bearing: 0.0,
                            target: LatLng(lat, lng),
                            tilt: 0.0,
                            zoom: 20.0,
                          );
                          if (widget.editpage == "new") {
                            Navigator.pop(context); // Remove the current screen
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                builder: (_) => AddAddress(
                                  add: description,
                                  initialCameraPosition: cameraPosition,
                                  lat: lat,
                                  lng: lng,
                                  city: city,
                                ),
                              ),
                            );
                          } else if (widget.editpage == "Edit") {
                            Navigator.pop(context); // Remove the current screen
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                builder: (_) => EditAddress(
                                  address: widget.address,
                                  add: description,
                                  initialCameraPosition: cameraPosition,
                                  lat: lat,
                                  lng: lng,
                                  city: city,
                                ),
                              ),
                            );
                          }
                        }
                      } catch (e) {
                        // Handle any exceptions
                      }
                    }
                  }
                },
                itemClick: (Prediction? prediction) {
                  if (prediction != null) {
                    _controller.text = prediction.description!;
                    _controller.selection = TextSelection.fromPosition(
                      TextPosition(offset: prediction.description!.length),
                    );
                  }
                },
              ),
            ),
          ]
,
        ),
      ),
    );
  }
}
