import 'package:flutter/material.dart';

class TabsViewModel extends ChangeNotifier {
  int currentTab = 0;
  final GlobalKey<ScaffoldState> tabsScreenkey = GlobalKey();

  int get _currentTab => currentTab;
  GlobalKey<ScaffoldState> get _tabsScreenKey => tabsScreenkey;

  setCurrentTab(int val) {
    currentTab = val;
    notifyListeners();
  }
}
