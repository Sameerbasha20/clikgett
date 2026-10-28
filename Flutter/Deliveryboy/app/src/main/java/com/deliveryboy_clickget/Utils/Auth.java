package com.deliveryboy_clickget.Utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Looper;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * The rider's saved login. The login token lasts an hour; {@link #freshToken} swaps
 * the refresh token for a new pair a few minutes before it runs out, so the API
 * client, Retrofit, the duty switch and the location service always send a working
 * token. Logins saved by older app versions (no refresh token) work as before.
 *
 * freshToken may make a network call: call it on a background thread. On the main
 * thread it returns the saved token without renewing.
 */
public final class Auth {

    private static final String TAG = "Auth";
    private static final String PREF = "MyPref";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_REFRESH = "refreshToken";
    private static final String KEY_EXPIRES_AT = "tokenExpiresAt";
    /** Renew this long before the token runs out. */
    private static final long RENEW_BEFORE_MS = 5 * 60 * 1000;

    private static Context app;

    private Auth() {
    }

    /** Called once from ClikGettApp so Retrofit can reach the saved login. */
    public static void init(Context context) {
        app = context.getApplicationContext();
    }

    private static SharedPreferences prefs(Context context) {
        return (context != null ? context.getApplicationContext() : app).getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    /** Saves a login from the server: token, refresh token and its lifetime in seconds. */
    public static void saveSession(Context context, String token, String refreshToken, Integer expiresIn) {
        SharedPreferences.Editor e = prefs(context).edit().putString(KEY_TOKEN, token != null ? token : "");
        if (refreshToken != null && !refreshToken.isEmpty() && expiresIn != null && expiresIn > 0) {
            // Measured on this phone's clock, so a wrong phone time doesn't matter.
            e.putString(KEY_REFRESH, refreshToken).putLong(KEY_EXPIRES_AT, System.currentTimeMillis() + expiresIn * 1000L);
        } else {
            e.remove(KEY_REFRESH).remove(KEY_EXPIRES_AT);
        }
        e.commit();
    }

    public static String freshToken() {
        return freshToken(app);
    }

    /** A working login token ("" when logged out). */
    public static synchronized String freshToken(Context context) {
        SharedPreferences p = prefs(context);
        String token = p.getString(KEY_TOKEN, "");
        if (token.isEmpty() || p.getString(KEY_REFRESH, "").isEmpty()) return token;
        if (System.currentTimeMillis() < p.getLong(KEY_EXPIRES_AT, 0) - RENEW_BEFORE_MS) return token;
        if (Looper.myLooper() == Looper.getMainLooper()) return token;
        return refresh(context);
    }

    /**
     * For a 401: true if only the login token had run out and a new one was saved
     * (so the rider stays logged in; the next request works).
     */
    public static synchronized boolean recoverFromExpired(Context context, JSONObject body) {
        if (body == null || !"Token expired".equals(body.optString("Message"))) return false;
        SharedPreferences p = prefs(context);
        if (p.getString(KEY_REFRESH, "").isEmpty() || Looper.myLooper() == Looper.getMainLooper()) return false;
        String before = p.getString(KEY_TOKEN, "");
        String after = refresh(context);
        return !after.isEmpty() && !after.equals(before);
    }

    private static String refresh(Context context) {
        SharedPreferences p = prefs(context);
        String current = p.getString(KEY_TOKEN, "");
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(CommonUtilities.URL + "auth/refresh").openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            try (OutputStream os = conn.getOutputStream()) {
                os.write(new JSONObject().put("RefreshToken", p.getString(KEY_REFRESH, ""))
                        .toString().getBytes(StandardCharsets.UTF_8));
            }
            int code = conn.getResponseCode();
            JSONObject body = read(code >= 200 && code < 400 ? conn.getInputStream() : conn.getErrorStream());
            if (code == 200 && body.optInt("Status") == 1) {
                String token = body.optString("token", "");
                saveSession(context, token, body.optString("RefreshToken", ""), body.optInt("ExpiresIn", 0));
                return token;
            }
            if (code == 401) {
                // The login was ended on the server (logged out elsewhere, removed, or expired).
                Session.expire(context != null ? context : app);
                return "";
            }
        } catch (Exception e) {
            Log.w(TAG, "Session refresh failed: " + e.getMessage());
        } finally {
            if (conn != null) conn.disconnect();
        }
        // Offline or server trouble: keep the current token and try again next time.
        return current;
    }

    /** Ends this login on the server too; call on a background thread before clearing saved data. */
    public static void logoutOnServer(Context context) {
        String refresh = prefs(context).getString(KEY_REFRESH, "");
        if (refresh.isEmpty()) return;
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(CommonUtilities.URL + "auth/logout").openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            try (OutputStream os = conn.getOutputStream()) {
                os.write(new JSONObject().put("RefreshToken", refresh).toString().getBytes(StandardCharsets.UTF_8));
            }
            conn.getResponseCode();
        } catch (Exception ignored) {
            // Logging out on the phone still works; the refresh token expires on its own.
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static JSONObject read(InputStream in) {
        if (in == null) return new JSONObject();
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            return new JSONObject(sb.toString());
        } catch (Exception e) {
            return new JSONObject();
        }
    }
}
