package com.deliveryboy_clickget;

import android.app.Activity;
import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.deliveryboy_clickget.Utils.Auth;
import com.deliveryboy_clickget.Utils.BackendDiscovery;

public class ClikGettApp extends Application {
    private static final String TAG = "ClikGettApp";

    /** Channel for order pushes; the backend sends with channelId "orders". */
    public static final String ORDERS_CHANNEL_ID = "orders";

    @Override
    public void onCreate() {
        super.onCreate();
        Auth.init(this);
        // Last backend address found on the Wi-Fi, also used by services started without the splash screen.
        BackendDiscovery.loadSaved(this);
        createOrdersChannel();
        keepScreensClearOfSystemBars();

        // Record the last crash for support, then let Android handle it as usual
        // (swallowing it would leave the app frozen in a broken state).
        final Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            Log.e(TAG, "Uncaught exception in " + thread.getName(), throwable);
            try {
                getSharedPreferences("CrashLog", MODE_PRIVATE)
                        .edit()
                        .putString("last_crash", throwable.getClass().getName() + ": " + throwable.getMessage())
                        .commit();
            } catch (Exception ignored) {
            }
            if (previous != null) previous.uncaughtException(thread, throwable);
        });
    }

    /**
     * Android 16 ignores windowOptOutEdgeToEdgeEnforcement for apps targeting API 36, so
     * every screen would draw under the status/navigation bars and keyboard. Padding each
     * screen's content by those insets keeps the existing layouts as they were.
     */
    private void keepScreensClearOfSystemBars() {
        if (Build.VERSION.SDK_INT < 35) return;
        registerActivityLifecycleCallbacks(new ActivityLifecycleCallbacks() {
            @Override
            public void onActivityStarted(Activity activity) {
                View content = activity.findViewById(android.R.id.content);
                if (content == null) return;
                ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
                    Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
                    Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
                    v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
                    return WindowInsetsCompat.CONSUMED;
                });
                ViewCompat.requestApplyInsets(content);
            }

            @Override public void onActivityCreated(Activity activity, Bundle savedInstanceState) { }
            @Override public void onActivityResumed(Activity activity) { }
            @Override public void onActivityPaused(Activity activity) { }
            @Override public void onActivityStopped(Activity activity) { }
            @Override public void onActivitySaveInstanceState(Activity activity, Bundle outState) { }
            @Override public void onActivityDestroyed(Activity activity) { }
        });
    }

    private void createOrdersChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(ORDERS_CHANNEL_ID, "New orders", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("New, cancelled and reassigned orders");
        channel.enableVibration(true);
        channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) manager.createNotificationChannel(channel);
    }
}
