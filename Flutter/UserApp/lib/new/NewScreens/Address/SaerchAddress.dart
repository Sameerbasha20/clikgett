import 'package:fav_app/new/NewScreens/Address/AddAddress.dart';
import 'package:fav_app/new/NewScreens/location/locationaccess.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:google_places_flutter/google_places_flutter.dart';
import 'package:google_places_flutter/model/prediction.dart';

class Saerchaddress extends StatefulWidget {
  String? editpage;

  Saerchaddress({super.key, required this.editpage});

  @override
  State<Saerchaddress> createState() => _PlacesSearchPageState();
}

class _PlacesSearchPageState extends State<Saerchaddress> {
  final TextEditingController _controller = TextEditingController();

  @override
  void initState() {
    print(widget.editpage);
    print("KKKKKKKK");
    super.initState();
  }

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
            GooglePlaceAutoCompleteTextField(
              textEditingController: _controller,
              googleAPIKey: "AIzaSyBOpDNV4tKa_jCSFuwV1IdFa1WXsB0PguA",
              inputDecoration: const InputDecoration(
                hintText: "Search for a place",
                border: OutlineInputBorder(),
              ),
              debounceTime: 800,
              // Delay before searching
              countries: const ["in"],
              // Restrict to specific countries
              isLatLngRequired: true,
              // Require latitude and longitude
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
                        } else if (widget.editpage == "AddFristTime") {
                          // Navigator.pop(context); // Remove the current screen
                          // Navigator.pushReplacement(
                          //   context,
                          //   MaterialPageRoute(
                          //     builder: (_) => EditAddress(
                          //         address:  widget.address
                          //     ),
                          //   ),
                          // );
                          Navigator.pop(context); // Remove the current screen
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (_) => LocationPickerPage(
                                add: description,
                                initialCameraPosition: cameraPosition,
                                lat: lat,
                                lng: lng,
                                city: city,
                              ),
                            ),
                          );
                        }

                        // Navigate to AddAddress and pass the data

                        // Navigator.pop(context);
                      } else {}
                    } catch (e) {}
                  } else {}
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
          ],
        ),
      ),
    );
  }
}
