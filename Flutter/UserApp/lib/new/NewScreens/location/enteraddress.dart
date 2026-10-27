import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class Confirmlocation extends StatefulWidget {
  const Confirmlocation({super.key});

  @override
  State<Confirmlocation> createState() => _ConfirmlocationState();
}

class _ConfirmlocationState extends State<Confirmlocation> {
  final TextEditingController houseController = TextEditingController();
  final TextEditingController floorController = TextEditingController();
  final TextEditingController apartmentController = TextEditingController();
  final TextEditingController landmarkController = TextEditingController();
  final TextEditingController contactNumberController = TextEditingController();

  String selectedAddressType = 'Home'; // default address type

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            // Handle back button press
          },
        ),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            customText(
              text: "Search for location",
              textAlign: TextAlign.center,
              color: const Color(0xFF030401),
              fontSize: 0.025,
              fontWeight: FontWeight.w700,
            ),
            const SizedBox(height: 16.0),

            // Map placeholder (you should replace it with the actual map widget you're using)
            Container(
              height: 200,
              color: Colors.grey[300],
              child: const Center(
                child: Text('Map Placeholder'),
              ),
            ),
            const SizedBox(height: 16.0),

            // Location title
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    customText(
                      text: "Manjeera Trinity",
                      textAlign: TextAlign.center,
                      color: const Color(0xff030401),
                      fontSize: 0.023,
                      fontWeight: FontWeight.w700,
                    ),
                    customText(
                      text: "Hyderabad, KPHB Colony",
                      textAlign: TextAlign.center,
                      color: const Color(0xff676A6C),
                      fontSize: 0.018,
                      fontWeight: FontWeight.w500,
                    ),
                  ],
                ),
                ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      side:
                      const BorderSide(color: Colors.black), // Border color
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    onPressed: () {
                      // Handle change location action
                    },
                    child: customText(
                      text: "Change",
                      textAlign: TextAlign.center,
                      color: const Color(0xff030401),
                      fontSize: 0.016,
                      fontWeight: FontWeight.w500,
                    )),
              ],
            ),
            const SizedBox(height: 16.0),

            // Form fields
            _buildTextField(
                controller: houseController, label: 'House / Flat number'),
            _buildTextField(controller: floorController, label: 'Floor number'),
            _buildTextField(
                controller: apartmentController, label: 'Apartment / Building'),
            _buildTextField(controller: landmarkController, label: 'Land mark'),
            _buildTextField(
                controller: contactNumberController,
                label: 'Contact Number',
                keyboardType: TextInputType.phone),
            const SizedBox(height: 16.0),

            // Address type
            customText(
              text: "Address type",
              textAlign: TextAlign.center,
              color: const Color(0xff030401),
              fontSize: 0.020,
              fontWeight: FontWeight.w600,
            ),
            const SizedBox(height: 8.0),
            Row(
              children: [
                _buildAddressTypeButton(
                    context, 'Home', selectedAddressType == 'Home'),
                const SizedBox(width: 8.0),
                _buildAddressTypeButton(
                    context, 'Office', selectedAddressType == 'Office'),
                const SizedBox(width: 8.0),
                _buildAddressTypeButton(
                    context, 'Others', selectedAddressType == 'Others'),
              ],
            ),
            const SizedBox(height: 16.0),

            // Confirm and Cancel buttons
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: buttonWidget(
                    onTap: () {
                      // Capture the user input here
                      final userLocationData = {
                        'house': houseController.text,
                        'floor': floorController.text,
                        'apartment': apartmentController.text,
                        'landmark': landmarkController.text,
                        'contactNumber': contactNumberController.text,
                        'addressType': selectedAddressType,
                      };

                      // Send userLocationData to backend (you can add your backend logic here)

                      // Navigate to a new screen (assuming a screen called `NewScreen` exists)
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                            builder: (context) => const Homepage()),
                        (route) => false,
                      );
                    },
                    context: context,
                    borderRadius: 50,
                    text: "Confirm Location",
                  ),
                ),
                SizedBox(
                  height: 1.5.h,
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: buttonWidget(
                    onTap: () {
                      // Handle cancel action
                    },
                    context: context,
                    borderRadius: 50,
                    text: "Cancel",
                    buttonColor: white,
                    textColor: primary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        customText(
          text: label,
          textAlign: TextAlign.center,
          color: const Color(0xff000000),
          fontSize: 0.020,
          fontWeight: FontWeight.w600,
        ),
        const SizedBox(height: 8.0),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16.0),
      ],
    );
  }

  Widget _buildAddressTypeButton(
      BuildContext context, String label, bool selected) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: selected ? const Color(0xffCAE97C) : Colors.white,
        foregroundColor: Colors.black,
        side: selected
            ? null
            : const BorderSide(color: Colors.black), // Border color
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      onPressed: () {
        setState(() {
          selectedAddressType = label; // Update the selected address type
        });
      },
      child: customText(
        text: label,
        textAlign: TextAlign.center,
        color: const Color(0xff030401),
        fontSize: 0.016,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}