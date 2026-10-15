import 'package:fav_app/Models/Home/search_model.dart';
import 'package:flutter/cupertino.dart';

class SearchViewModel extends ChangeNotifier {
  bool isLoading = false;

  SearchModel? searchModel;

  bool get _isLoading => isLoading;
  SearchModel? get _searchModel => searchModel;

  setCartData(val) {
    searchModel = val;
    notifyListeners();
  }

  setLoading(val) {
    isLoading = val;
    notifyListeners();
  }

  // getSearch({required context, required String query}) async {
  //   setLoading(true);
  //   Network.networkCheck(context).then((value) => value != null
  //       ? {
  //           SearchServices.getCart(query).then((value) => value != null
  //               ? {
  //                   if (value.status == 1)
  //                     {
  //                       setCartData(value),
  //                     }
  //                   else
  //                     {
  //                       customToast(message: value.message),
  //                     },
  //                   setLoading(false)
  //                 }
  //               : {customToast(message: 'Error'), setLoading(false)})
  //         }
  //       : {customToast(message: 'Network error'), setLoading(false)});
  // }
}
