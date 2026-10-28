package com.deliveryboy_clickget.Utils;

import com.google.gson.Gson;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitClient {
    private static Retrofit retrofit = null;
    private static String retrofitBaseUrl = null;

    public static synchronized Retrofit getClient() {
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(100, TimeUnit.SECONDS)
                .readTimeout(100, TimeUnit.SECONDS)
                .addInterceptor(chain -> {
                    // Asks login for a short token + refresh token, and swaps the token the
                    // screens pass for a renewed one (this runs off the main thread).
                    Request.Builder b = chain.request().newBuilder().header("X-Auth-Refresh", "1");
                    if (chain.request().header("Authorization") != null) {
                        b.header("Authorization", "Bearer " + Auth.freshToken());
                    }
                    return chain.proceed(b.build());
                })
                .build();
        // Rebuilt when BackendDiscovery has moved the API to another address.
        if (retrofit == null || !CommonUtilities.URL.equals(retrofitBaseUrl)) {
            retrofitBaseUrl = CommonUtilities.URL;
            retrofit = new Retrofit.Builder()
                    .baseUrl(CommonUtilities.URL).client(client)
                    .addConverterFactory(GsonConverterFactory.create(new Gson()))
                    .build();


        }
        return retrofit;
    }

}
