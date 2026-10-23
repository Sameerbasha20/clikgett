package com.deliveryboy_clickget.Utils;

import com.google.gson.Gson;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitClient {
    private static Retrofit retrofit = null;
    private static String retrofitBaseUrl = null;

    public static synchronized Retrofit getClient() {
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(100, TimeUnit.SECONDS)
                .readTimeout(100, TimeUnit.SECONDS).build();
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
