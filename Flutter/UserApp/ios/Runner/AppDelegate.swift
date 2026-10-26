import UIKit
import Flutter
import Firebase
import GoogleMaps
@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    FirebaseApp.configure()
    // GMS_API_KEY build setting -> Info.plist GMSApiKey (kept out of git).
    GMSServices.provideAPIKey(Bundle.main.object(forInfoDictionaryKey: "GMSApiKey") as? String ?? "")
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
