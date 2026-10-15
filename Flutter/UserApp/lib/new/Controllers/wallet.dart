import 'package:fav_app/old/Services/Home/home_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../old/Services/common/network_check.dart';
import '../NewModel/wallet.dart';
import '../NewScreens/Widgets/customToast.dart';

class WalletController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;
  WalletModel? walletModel;
  RxDouble walletAmount = RxDouble(0);
  RxList<Wallet> walletList = RxList();

  void updateUI() {
    update(['update-wallet']);
  }

  Future getWallet({
    required context,
  }) async {
    Future.delayed(
      Duration.zero,
      () {
        _isLoading(true);
      },
    );
    Network.networkCheck(context).then((value) => value != null
        ? {
            HomeServices.getWallet()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            walletModel = value,
                            walletList(walletModel?.wallets),
                            walletAmount(walletModel?.walletAmount),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {
                        // customToast(message: 'Error'), _isLoading(false)
                      })
                .catchError((onError) {
              debugPrint(onError.toString());
              // customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }
}
