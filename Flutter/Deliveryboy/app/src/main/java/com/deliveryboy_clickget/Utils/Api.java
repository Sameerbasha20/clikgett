package com.deliveryboy_clickget.Utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Small JSON client for the rider API. Requests run on a background thread and
 * the callback runs on the main thread. Every response is a JSONObject; network
 * failures come back as {"Status":0,"Message":...}.
 */
public final class Api {

    public interface Callback {
        void onResult(JSONObject response);
    }

    private static final ExecutorService EXECUTOR = Executors.newFixedThreadPool(3);
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private Api() {
    }

    public static String token(Context context) {
        SharedPreferences pref = context.getApplicationContext().getSharedPreferences("MyPref", Context.MODE_PRIVATE);
        return pref.getString("token", "");
    }

    public static void get(Context context, String path, Callback callback) {
        request(context, "GET", path, null, callback);
    }

    public static void post(Context context, String path, JSONObject body, Callback callback) {
        request(context, "POST", path, body, callback);
    }

    public static void put(Context context, String path, JSONObject body, Callback callback) {
        request(context, "PUT", path, body, callback);
    }

    private static void request(Context context, String method, String path, JSONObject body, Callback callback) {
        final String token = token(context);
        EXECUTOR.execute(() -> {
            JSONObject result;
            HttpURLConnection conn = null;
            try {
                conn = (HttpURLConnection) new URL(CommonUtilities.URL + path).openConnection();
                conn.setRequestMethod(method);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(15000);
                conn.setRequestProperty("Accept", "application/json");
                if (token != null && !token.isEmpty()) conn.setRequestProperty("Authorization", "Bearer " + token);
                if (body != null) {
                    conn.setDoOutput(true);
                    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(body.toString().getBytes(StandardCharsets.UTF_8));
                    }
                }
                int code = conn.getResponseCode();
                InputStream in = code >= 200 && code < 400 ? conn.getInputStream() : conn.getErrorStream();
                StringBuilder sb = new StringBuilder();
                if (in != null) {
                    try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = br.readLine()) != null) sb.append(line);
                    }
                }
                result = sb.length() > 0 ? new JSONObject(sb.toString()) : new JSONObject();
                if (!result.has("Status")) result.put("Status", code >= 200 && code < 300 ? 1 : 0);
                if (code == 401) {
                    if (!result.has("Message")) result.put("Message", "Please log in again");
                    Session.expire(context);
                }
                result.put("HttpStatus", code);
            } catch (Exception e) {
                result = new JSONObject();
                try {
                    result.put("Status", 0);
                    result.put("Message", "Could not reach the server. Check your internet.");
                    result.put("HttpStatus", 0);
                } catch (Exception ignored) {
                }
            } finally {
                if (conn != null) conn.disconnect();
            }
            final JSONObject response = result;
            MAIN.post(() -> callback.onResult(response));
        });
    }
}
