package com.deliveryboy_clickget.Utils;

import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.preference.PreferenceManager;
import android.widget.Toast;

import com.deliveryboy_clickget.LocationTrackingService;
import com.deliveryboy_clickget.SentotpActivity;

/**
 * Ends the rider's session when the server rejects the saved token (expired,
 * signed by another server, or the rider was removed) and opens the login
 * screen. Safe to call from any thread and from several failing calls at once.
 */
public final class Session {

    private static final long DEBOUNCE_MS = 5000;
    private static long lastExpiredAt = 0;

    private Session() {
    }

    public static void expire(Context context) {
        final Context app = context.getApplicationContext();
        new Handler(Looper.getMainLooper()).post(() -> {
            long now = System.currentTimeMillis();
            if (now - lastExpiredAt < DEBOUNCE_MS) return;
            if (Api.token(app).isEmpty()) return;
            lastExpiredAt = now;

            try {
                Intent stop = new Intent(app, LocationTrackingService.class);
                stop.setAction(LocationTrackingService.ACTION_STOP);
                app.startService(stop);
            } catch (Exception ignored) {
                // The service may not be running, or the app is in the background.
            }
            app.getSharedPreferences("MyPref", Context.MODE_PRIVATE).edit().clear().apply();
            PreferenceManager.getDefaultSharedPreferences(app).edit().clear().apply();

            Toast.makeText(app, "Your session has ended. Please log in again.", Toast.LENGTH_LONG).show();
            Intent login = new Intent(app, SentotpActivity.class);
            login.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            app.startActivity(login);
        });
    }
}
