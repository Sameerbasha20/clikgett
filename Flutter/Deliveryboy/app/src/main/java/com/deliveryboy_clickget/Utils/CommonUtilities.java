package com.deliveryboy_clickget.Utils;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

import com.deliveryboy_clickget.BuildConfig;

public class CommonUtilities {
//    public static final String URL = "http://13.233.251.89:3000/api/";
    // Set at build time with -PapiBaseUrl=... (see app/build.gradle).
    public static final String URL = BuildConfig.API_BASE_URL;
//    public static final String URL = "https://api.clikgett.com/api/";

//    public static final String URL = "http://13.235.33.113:3001/api/";

    public static final String S3_IDPOOL_ID = "ap-south-1:5720874e-1243-467c-8ff2-040ee76ffe78";
    public static String USER_LOGIN_STATUS = "USER_LOGIN_STATUS";
    public static boolean isNetworkConnectionAvailable(Context context)
    {
        ConnectivityManager cm = (ConnectivityManager)context.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info       = cm.getActiveNetworkInfo();
        if (info == null) return false;
        NetworkInfo.State network   = info.getState();
        return (network == NetworkInfo.State.CONNECTED || network == NetworkInfo.State.CONNECTING);
    }

}

