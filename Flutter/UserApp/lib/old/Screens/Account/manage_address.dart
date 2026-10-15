import 'dart:async';

import 'package:fav_app/old/Constants/button.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Constants/toast.dart';
import 'package:fav_app/old/Screens/Account/edit_location.dart';
import 'package:fav_app/old/Screens/Account/pick_location_widget.dart';
import 'package:fav_app/old/Screens/Widgets/appbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';

import '../../ViewModels/Account/adresses.dart';

class ManageAddress extends StatefulWidget {
  bool toSelectAddress;
  ManageAddress({Key? key, this.toSelectAddress = false}) : super(key: key);

  @override
  State<ManageAddress> createState() => _ManageAddressState();
}

class _ManageAddressState extends State<ManageAddress> {
  var addressList = [
    {
      'Type': 1,
      "address":
          'Anugraha Apartments, Flat NO-12, Near More Mega Store ,6-3-599/63/9, Mada Manzil, Banjara Hills, Hyderabad,'
    },
    {
      'Type': 2,
      "address":
          'Anugraha Apartments, Flat NO-12, Near More Mega Store ,6-3-599/63/9, Mada Manzil, Banjara Hills, Hyderabad,'
    },
    {
      'Type': 3,
      "address":
          'Anugraha Apartments, Flat NO-12, Near More Mega Store ,6-3-599/63/9, Mada Manzil, Banjara Hills, Hyderabad,'
    }
  ];

  refresh() {
    setState(() {});
  }

  AcountViewModel? acountViewModel;
  var adress;
  var flatno;
  var landmark;
  var city;
  var lattitude;
  var longitude;
  var adressId;

  int isEdit = 0;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      if (acountViewModel != null) {
        acountViewModel!.getAdresses(context: context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      acountViewModel = context.watch<AcountViewModel>();
    }
    return Material(
      child: Scaffold(
        backgroundColor: tWhite,
        appBar: FavAppBar(context: context, title: 'Manage Address'),
        body: acountViewModel?.isLoading == true
            ? const Center(
                child: CircularProgressIndicator(),
              )
            : acountViewModel?.adressesModel?.address == null
                ? Center(
                    child: Text(
                      'Error Loading Data',
                      style: normalTextstyle(color: tGrey),
                    ),
                  )
                : ListView.builder(
                    itemCount: acountViewModel?.adressesModel?.address.length,
                    itemBuilder: (context, index) {
                      adress = acountViewModel
                          ?.adressesModel?.address[index].address;
                      landmark = acountViewModel
                          ?.adressesModel?.address[index].landmark;
                      flatno =
                          acountViewModel?.adressesModel?.address[index].flatNo;
                      city =
                          acountViewModel?.adressesModel?.address[index].city;
                      lattitude = acountViewModel
                          ?.adressesModel?.address[index].latitude;
                      longitude = acountViewModel
                          ?.adressesModel?.address[index].longitude;
                      adressId = acountViewModel
                          ?.adressesModel?.address[index].addressId;
                      print(adress);
                      print(landmark);
                      print(city);
                      print(flatno);
                      print(adressId);
                      return addressTile(index: index);
                    }),
        bottomNavigationBar: addNewButton(),
      ),
    );
  }

  Widget addressTile({required int index}) {
    return InkWell(
      onTap: widget.toSelectAddress == true
          ? () {
              Timer(const Duration(seconds: 1), () {
                Navigator.pop(
                    context, acountViewModel?.adressesModel?.address[index]);
              });
            }
          : null,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: const BoxDecoration(color: tLightWhite),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 1,
              child: Icon(
                acountViewModel?.adressesModel?.address[index].type == 'Home'
                    ? Icons.home
                    : acountViewModel?.adressesModel?.address[index].type ==
                            'Work'
                        ? Icons.work
                        : Icons.location_on,
                color: primaryColor,
              ),
            ),
            Expanded(
              flex: 8,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                      acountViewModel?.adressesModel?.address[index].type ?? '',
                      style: normalTextstyle(color: tGrey)),
                  const SizedBox(
                    height: 10,
                  ),
                  Column(
                    children: [
                      Row(
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(right: 5),
                            child: Text(
                                acountViewModel?.adressesModel?.address[index]
                                        .flatNo ??
                                    '',
                                overflow: TextOverflow.ellipsis,
                                maxLines: 2,
                                style: normalTextstyle(
                                    color: tGrey, fontSize: 14)),
                          ),
                          Text(
                              acountViewModel?.adressesModel?.address[index]
                                      .landmark ??
                                  '',
                              overflow: TextOverflow.ellipsis,
                              maxLines: 2,
                              style:
                                  normalTextstyle(color: tGrey, fontSize: 14)),
                        ],
                      ),
                      Text(
                          acountViewModel
                                  ?.adressesModel?.address[index].address ??
                              '',
                          style: normalTextstyle(color: tGrey, fontSize: 14)),
                    ],
                  ),
                  const SizedBox(
                    height: 10,
                  ),
                  Row(
                    children: [
                      TextButton(
                          onPressed: () {
                            checkLocation(context, index);
                          },
                          child: Text('Edit',
                              style: normalTextstyle(color: primaryColor))),
                      const SizedBox(
                        width: 20,
                      ),
                      TextButton(
                          onPressed: () {
                            acountViewModel
                                ?.deleteAdresses(
                                    context: context,
                                    adressId: acountViewModel!.adressesModel!
                                        .address[index].addressId)
                                .then((value) {
                              setState(() {
                                acountViewModel!.getAdresses(context: context);
                              });
                            });
                          },
                          child: Text('Delete',
                              style: normalTextstyle(color: primaryColor)))
                    ],
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool isMapsOpened = false;
  Widget addNewButton() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
      child: buttonWidget(
          onTap: () async {
            if (isMapsOpened == false) {
              isMapsOpened = true;
              await pickLocation(context: context, iseditpage: 1);
              isMapsOpened = false;
            }
          },
          text: 'Add New Address',
          textColor: tWhite,
          buttonColor: primaryColor),
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
          return Future.error('Location permissions are denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        customToast(
            message: 'Location permissions are denied, Turn on in Settings');
        return Future.error(
            'Location permissions are permanently denied, we cannot request permissions.');
      }
      await Geolocator.getCurrentPosition().then((value) =>
          {print(value), position = LatLng(value.latitude, value.longitude)});
    }

    await Navigator.push(
        context,
        MaterialPageRoute(
            builder: (context) => PickLocationWidget(
                  initialCameraPosition: CameraPosition(
                      target: selectedPosition ?? position!, zoom: 20.0),
                ))).then((value) => value != null
        ? {
            value == true
                ? setState(() {
                    acountViewModel?.getAdresses(context: context);
                  })
                : null
          }
        : {
            value == true
                ? setState(() {
                    acountViewModel?.getAdresses(context: context);
                  })
                : null
          });
  }

  Future checkLocation(context, int index) async {
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
            builder: (_) => EditLocation(
                  type: acountViewModel?.adressesModel?.address[index].type,
                  adress:
                      acountViewModel?.adressesModel?.address[index].address,
                  flatno: acountViewModel?.adressesModel?.address[index].flatNo,
                  landmark:
                      acountViewModel?.adressesModel?.address[index].landmark,
                  city: acountViewModel?.adressesModel?.address[index].city,
                  lattitude:
                      acountViewModel?.adressesModel?.address[index].latitude,
                  id: acountViewModel?.adressesModel?.address[index].addressId,
                  logitude:
                      acountViewModel?.adressesModel?.address[index].longitude,
                ))).then((value) {
      value == true
          ? setState(() {
              acountViewModel?.getAdresses(context: context);
            })
          : null;
    });
  }
}
