package com.deliveryboy_clickget;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.util.Log;

public class ClikGettApp extends Application {
    private static final String TAG = "ClikGettApp";

    /** Channel for order pushes; the backend sends with channelId "orders". */
    public static final String ORDERS_CHANNEL_ID = "orders";

    @Override
    public void onCreate() {
        super.onCreate();
        createOrdersChannel();

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
