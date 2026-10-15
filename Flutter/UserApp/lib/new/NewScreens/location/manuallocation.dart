import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../Constants/imageslist.dart';
import 'locationaccess.dart';

class LocationSearchScreen extends StatefulWidget {
  const LocationSearchScreen({super.key});

  @override
  _LocationSearchScreenState createState() => _LocationSearchScreenState();
}

class _LocationSearchScreenState extends State<LocationSearchScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _locationController = TextEditingController();

  // Dummy data for recent searches (replace with actual API data)
  final List<Map<String, String>> _recentSearches = [
    {'title': 'KPHB', 'subtitle': 'Hyderabad, KPHB Colony'},
    {'title': 'Madhapur', 'subtitle': 'Hyderabad, Madhapur'},
    {'title': 'Banjara Hills', 'subtitle': 'Hyderabad, Banjara Hills'},
    // Add more items or fetch from API
  ];

  // Dummy data for saved addresses (replace with actual API data)
  final List<Map<String, String>> _savedAddresses = [
    {
      'title': 'Office',
      'address': 'Block-B, Floor-2, NO-512, KPHB, Hyderabad',
      'icon': 'work'
    },
    {
      'title': 'Home',
      'address': 'Galaxy Apartment, 12th Floor, Flat No-121',
      'icon': 'home'
    },
    {
      'title': 'Gym',
      'address': 'Fitness Hub, 3rd Floor, Road No-1',
      'icon': 'gym'
    },
    // Add more items or fetch from API
  ];

  @override
  void dispose() {
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: Image.asset(
            arrowback,
            height: 4.h,
          ),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.only(top: 20.0, left: 20, right: 20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  children: [
                    customText(
                      text: "Search for location",
                      // textAlign: TextAlign.center,
                      color: const Color(0xFF030401),
                      fontSize: 20.sp,
                      fontWeight: FontWeight.w600,
                    ),
                    const SizedBox(height: 20),

                    // TextFormField for Location Search
                    TextFormField(
                      controller: _locationController,
                      decoration: InputDecoration(
                        hintText: 'Enter Location',
                        prefixIcon: Transform.scale(
                          scale: 0.6,
                          child: Image.asset(
                            searchicon,
                            height: 2,
                          ),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8.0),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: greyf5,
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a location';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),
                    GestureDetector(
                      onTap: () {
                        // Implement your logic to use current location
                      },
                      child: Row(
                        children: [
                          const Icon(Icons.my_location, color: Colors.black),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () {
                              Navigator.of(context).push(MaterialPageRoute(
                                  builder: (context) =>
                                       LocationPickerPage()));
                            },
                            child: customText(
                              text: "Use Current Location",
                              textAlign: TextAlign.center,
                              color: const Color(0xFF030401),
                              fontSize: 16.sp,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 15),
                    const Divider(
                      color: Color(0xffddddddd),
                      thickness: 1,
                    ), // Default divider
                    const SizedBox(height: 15),
                    customText(
                      text: 'Recent Searches',
                      // textAlign: TextAlign.center,
                      color: const Color(0xFF030401),
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w600,
                    ),
                    const SizedBox(height: 16),

                    // ListView Builder for recent searches
                    ListView.builder(
                      shrinkWrap: true, // Necessary for nested scroll
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _recentSearches.length,
                      itemBuilder: (context, index) {
                        return _buildRecentSearch(
                          _recentSearches[index]['title']!,
                          _recentSearches[index]['subtitle']!,
                        );
                      },
                    ),
                    const SizedBox(height: 15),
                    const Divider(
                      color: Color(0xffddddddd),
                      thickness: 1,
                    ), // Default divider
                    const SizedBox(height: 15),
                    customText(
                      text: 'Saved Address',
                      color: tblack1c,
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w600,
                    ),
                    const SizedBox(height: 16),

                    // ListView Builder for saved addresses
                    ListView.builder(
                      shrinkWrap: true, // Necessary for nested scroll
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _savedAddresses.length,
                      itemBuilder: (context, index) {
                        return _buildSavedAddress(
                          _savedAddresses[index]['icon'] == 'work'
                              ? Icons.work
                              : _savedAddresses[index]['icon'] == 'home'
                                  ? Icons.home
                                  : Icons.fitness_center,
                          _savedAddresses[index]['title']!,
                          _savedAddresses[index]['address']!,
                        );
                      },
                    ),
                  ],
                ),
              ),
              buttonWidget(
                onTap: () {
                  if (_formKey.currentState!.validate()) {
                    // Perform the location search or navigation
                    print('Location: ${_locationController.text}');
                  }
                },
                context: context,
                borderRadius: 50,
                text: "Confirm Location",
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecentSearch(String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start, // Align the children to the top
        children: [
          const Padding(
            padding: EdgeInsets.only(
                top: 4), // Add some padding to push the icon upwards
            child: Icon(Icons.history, color: Colors.black),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              customText(
                text: title,
                textAlign: TextAlign.center,
                color: tblack1c,
                fontSize: 17.sp,
                fontWeight: FontWeight.w500,
              ),
              customText(
                text: subtitle,
                textAlign: TextAlign.center,
                color: grey70,
                fontSize: 15.sp,
                fontWeight: FontWeight.w400,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSavedAddress(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start, // Align the children to the top
        children: [
          Padding(
            padding: const EdgeInsets.only(
                top: 4), // Add some padding to push the icon upwards
            child: Icon(icon, color: Colors.black),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              customText(
                text: title,
                textAlign: TextAlign.center,
                color: tblack1c,
                fontSize: 17.sp,
                fontWeight: FontWeight.w500,
              ),
              customText(
                text: subtitle,
                textAlign: TextAlign.center,
                color: grey70,
                fontSize: 15.sp,
                fontWeight: FontWeight.w400,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
