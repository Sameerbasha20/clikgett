import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/NewModel/sale_model.dart';
import 'package:fav_app/new/Services/Sale/sale_services.dart';
import 'package:fav_app/new/Services/storefront_services.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as homemodel;
import 'package:flutter/foundation.dart';
import 'package:geocoding/geocoding.dart';

import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../old/Models/Account/adresses.dart';
import '../../old/Services/Home/home_services.dart';
import '../../old/Services/common/network_check.dart';
import '../NewScreens/Widgets/customToast.dart';

class HomeController extends GetxController {
  /// Delivery time (minutes) for the selected location, from the admin's ETA rules.
  final RxnInt etaMinutes = RxnInt();
  final RxBool locationServiceable = true.obs;

  @override
  void onInit() {
    super.onInit();
    // Re-estimate delivery time whenever the selected location changes.
    everAll([latitude, longitude], (_) => refreshEta());
  }

  Future<void> refreshEta() async {
    final estimate = await StorefrontServices.deliveryEstimate(latitude.value, longitude.value);
    if (estimate == null) return;
    locationServiceable(estimate.serviceable);
    etaMinutes.value = estimate.etaMinutes;
  }

  var areaName = ''.obs; // Reactive variable to store area name
  var notificationsCount =
      0.obs; // Reactive variable to store notifications count

  // Function to fetch area name and update the reactive variable
  // void getAreaName(double latitude, double longitude) async {
  //   try {
  //     List<Placemark> placemarks = await placemarkFromCoordinates(latitude, longitude);
  //     if (placemarks.isNotEmpty) {
  //       areaName.value = placemarks[0].subLocality ?? 'Unknown area';  // Update area name
  //     } else {
  //       areaName.value = 'Unknown area';  // Fallback if no placemarks found
  //     }
  //   } catch (e) {
  //     areaName.value = 'Error fetching area';  // Handle errors
  //   }
  // }
  final RxInt _bannerIndex = 0.obs;
  final RxBool _isLoading = false.obs;

  RxBool get isLoading => _isLoading;

  RxInt get bannerIndex => _bannerIndex;
  RxList<Address> address = RxList();

  updateBannerIndex(int index) {
    _bannerIndex(index);
  }

  RxString selectedLocation = '...'.obs;
  RxString selectedarea = '...'.obs;
  RxString selectedAddress = '...'.obs;
  RxString city = '...'.obs;
  RxString addresstype = '...'.obs;
  var longitude = 0.0.obs;
  var latitude = 0.0.obs;

  updateLocationDropdown(String val) {
    selectedLocation(val);
    selectedarea(val);
    selectedAddress(val);
  }

  storeLocation(Address addresses, List<Address> address) async {
    final SharedPreferences pref = await SharedPreferences.getInstance();

    await pref.setString('AreaName', areaName.value); // Store area name
    await pref.setString(
        'Address', addresses.address); // Store the specific address

    await pref.setString('SelectedAddress', '${addresses.address}');
    await pref.setString('city', '${addresses.city}');
    await pref.setString('addresstype', '${addresses.type}');
    await pref.setDouble('longitude', addresses.longitude ?? 0.0);
    await pref.setDouble('latitude', addresses.latitude ?? 0.0);
    await pref.setInt('dropdownSelectedAdressId', addresses.addressId);

    // Retrieve stored locations
    getstoredLocation(address);
  }

  getstoredLocation(
    List<Address> address,
  ) async {
    final SharedPreferences pref = await SharedPreferences.getInstance();

    // print(
    //     "${pref.getString('SelectedAddress')}---------$address---------- 9999999999999999999999999999999999");
    // print();

    // Check if the selected address exists
    if (address.isEmpty) {
      selectedLocation('');
      city('Select Location');
    } else {
      // Filter the address list based on stored selected address ID
      var checkAddress = address.where((element) {
        var filterAddress =
            element.addressId == pref.getInt('dropdownSelectedAdressId');
        if (filterAddress) {
          pref.setString('AreaName', areaName.value); // Store area name
          pref.setString('Address', element.address);
          // pref.setDouble('longitude', element.longitude);
          pref.setDouble('latitude', element.latitude);
          // If the address ID is valid, update the selected address
          // pref.setString('SelectedAddress', '${pref.getString('AreaName')} ${element.address}');
          pref.setString('SelectedAddress', '${pref.getString('Address')}');
          pref.setString('city', '${pref.getString('city')}');
          pref.setString('addresstype', '${pref.getString('addresstype')}');
          pref.setDouble('longitude', pref.getDouble('longitude') ?? 0.0);
          pref.setDouble('latitude', pref.getDouble('latitude') ?? 0.0);
        }
        return filterAddress;
      }).toList();

      // Handle empty address case
      if (checkAddress.isEmpty) {
        pref.remove('SelectedAddress');
        pref.remove('city');
        pref.remove('addresstype');
      } else {
        pref.setString('AreaName', areaName.value);
        // Store area name
        selectedLocation(pref.getString('SelectedAddress') ?? '...');
        city(pref.getString('city') ?? '...');
        addresstype(pref.getString('addresstype') ?? '...');
        selectedarea(pref.getString('AreaName') ?? '...');
        longitude(pref.getDouble('longitude'));
        latitude(pref.getDouble('latitude'));
        selectedAddress(pref.getString('Address') ?? '...');

        final AdressController adressController = Get.find<AdressController>();
        adressController.storeSelectedAdress(
            pref.getInt('dropdownSelectedAdressId') ?? 0,
            pref.getDouble('longitude') ?? 0.0,
            pref.getDouble('latitude') ?? 0.0);
      }
    }
  }

  final RxInt _tabIndex = 0.obs;

  RxInt get tabIndex => _tabIndex;

  updateTabIndex(int index) {
    _tabIndex(index);
  }

  homemodel.HomeModel? homeModel;

  RxList<homemodel.Banner> banners = RxList();
  RxList<homemodel.SpecialCategory> categories = RxList();
  RxList<homemodel.BestItem> bestItems = RxList();
  RxList<homemodel.HomePageSectionProduct> homepagesectionList = RxList();
  RxList<SaleCampaign> activeSales = RxList<SaleCampaign>();

  Future<void> fetchActiveSales() async {
    try {
      final saleRes = await SaleServices.getActiveSales();
      if (saleRes != null && saleRes.status == 1 && saleRes.sales != null) {
        // Filter only campaigns that have active products
        final validSales = saleRes.sales!
            .where((s) => s.products != null && s.products!.isNotEmpty)
            .toList();
        activeSales(validSales);
      } else {
        activeSales.clear();
      }
    } catch (e) {
      debugPrint('HomeController: Error loading active sales: $e');
      activeSales.clear();
    }
  }

  Future<void> getHome({
    required context,
  }) async {
    Future.delayed(
      Duration.zero,
      () {
        _isLoading(true);
      },
    );

    // Concurrently fetch active sales
    fetchActiveSales();

    Network.networkCheck(context).then((value) => value != null
        ? {
            HomeServices.getHome().then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        homeModel = value,
                        notificationsCount.value =
                            homeModel!.Notifications ?? 0,
                        banners(homeModel?.banners),
                        categories(homeModel?.specialCategories),
                        bestItems(homeModel?.bestItems),
                        homepagesectionList(homeModel?.homePageSectionProducts),
                      }
                    else
                      {
                        customToast(message: value.message),
                      },
                    _isLoading(false)
                  }
                : {customToast(message: 'Error'), _isLoading(false)})
            //     .catchError((onError) {
            //   debugPrint(onError.toString());
            //   customToast(message: onError.toString());
            //   _isLoading(false);
            // })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }
}
