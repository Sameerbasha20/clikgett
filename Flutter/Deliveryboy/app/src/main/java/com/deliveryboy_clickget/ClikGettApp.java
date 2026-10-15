package com.deliveryboy_clickget;

import android.app.Application;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

public class ClikGettApp extends Application {
    private static final String TAG = "ClikGettApp";

    @Override
    public void onCreate() {
        super.onCreate();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            Log.e(TAG, "UNCAUGHT RUNTIME EXCEPTION in thread " + thread.getName() + ": " + throwable.getMessage(), throwable);
            try {
                getSharedPreferences("CrashLog", MODE_PRIVATE)
                        .edit()
                        .putString("last_crash", throwable.getClass().getName() + ": " + throwable.getMessage())
                        .apply();
            } catch (Exception ignored) {}

            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    Toast.makeText(getApplicationContext(), "Warning: " + throwable.getMessage(), Toast.LENGTH_LONG).show();
                } catch (Exception ignored) {}
            });
        });
    }
}
