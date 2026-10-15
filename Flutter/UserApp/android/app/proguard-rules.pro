# ---------------------------
# General
# ---------------------------
-keepattributes *Annotation*

# ---------------------------
# Gson (Make sure package is correct)
# Replace with your actual package path
-keep class com.app.clikget.models.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-dontwarn com.google.gson.**

# --- Smart Auth Plugin (Google Credentials API) ---
-keep class com.google.android.gms.auth.api.credentials.HintRequest { *; }
-keep class com.google.android.gms.auth.api.credentials.HintRequest$Builder { *; }
-dontwarn com.google.android.gms.**

# ---------------------------
# Retrofit
-keep class retrofit2.** { *; }
-keep class com.squareup.okhttp3.** { *; }
-dontwarn retrofit2.**

# ---------------------------
# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# ---------------------------
# Razorpay
-dontwarn com.razorpay.**
-keep class com.razorpay.** { *; }
-keepclasseswithmembers class * {
    public void onPayment*(...);
}
-optimizations !method/inlining/
