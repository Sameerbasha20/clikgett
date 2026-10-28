package com.deliveryboy_clickget;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.location.Location;
import android.os.BatteryManager;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.deliveryboy_clickget.Utils.Auth;
import com.deliveryboy_clickget.Utils.CommonUtilities;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LocationTrackingService extends Service {
    private static final String TAG = "LocationTrackingService";
    public static final String CHANNEL_ID = "clikgett_delivery_tracking_channel";
    private static final int NOTIFICATION_ID = 2001;

    public static final String ACTION_START = "ACTION_START_TRACKING";
    public static final String ACTION_STOP = "ACTION_STOP_TRACKING";
    public static final String ACTION_SET_ORDER = "ACTION_SET_ACTIVE_ORDER";
    public static final String EXTRA_ORDER_ID = "EXTRA_ORDER_ID";

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private final ExecutorService networkExecutor = Executors.newSingleThreadExecutor();

    private Integer activeOrderId = null;
    private boolean isTracking = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) return;
                for (Location location : locationResult.getLocations()) {
                    if (location != null) {
                        handleNewLocation(location);
                    }
                }
            }
        };
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_START.equals(action)) {
                startForegroundTracking();
            } else if (ACTION_STOP.equals(action)) {
                stopForegroundTracking();
            } else if (ACTION_SET_ORDER.equals(action)) {
                int orderId = intent.getIntExtra(EXTRA_ORDER_ID, 0);
                activeOrderId = orderId > 0 ? orderId : null;
                updateLocationRequestInterval();
            }
        }
        return START_STICKY;
    }

    private void startForegroundTracking() {
        if (isTracking) return;
        try {
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED &&
                androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "Cannot start foreground tracking: Location permissions not granted");
                stopSelf();
                return;
            }

            Notification notification = buildNotification("ClikGett Rider Online", "Live location telematics active");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
            isTracking = true;
            requestLocationUpdates();
            Log.d(TAG, "Foreground location tracking started.");
        } catch (Throwable t) {
            Log.e(TAG, "SecurityException or error starting foreground tracking: " + t.getMessage(), t);
            isTracking = false;
            stopSelf();
        }
    }

    private void stopForegroundTracking() {
        isTracking = false;
        try {
            if (fusedLocationClient != null && locationCallback != null) {
                fusedLocationClient.removeLocationUpdates(locationCallback);
            }
            stopForeground(true);
            stopSelf();
            Log.d(TAG, "Foreground location tracking stopped.");
        } catch (Throwable t) {
            Log.e(TAG, "Error stopping foreground tracking: " + t.getMessage(), t);
        }
    }

    @SuppressLint("MissingPermission")
    private void requestLocationUpdates() {
        if (fusedLocationClient == null) return;
        if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED &&
            androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "Missing permission for location updates");
            return;
        }
        try {
            long interval = activeOrderId != null ? 10000L : 30000L;
            long fastestInterval = activeOrderId != null ? 5000L : 15000L;
            float minDistance = activeOrderId != null ? 5f : 15f;

            LocationRequest locationRequest = LocationRequest.create()
                    .setInterval(interval)
                    .setFastestInterval(fastestInterval)
                    .setSmallestDisplacement(minDistance)
                    .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper());
        } catch (Exception e) {
            Log.e(TAG, "Error requesting location updates: " + e.getMessage());
        }
    }

    private void updateLocationRequestInterval() {
        if (!isTracking) return;
        if (fusedLocationClient != null && locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
            requestLocationUpdates();
        }
    }

    private void handleNewLocation(Location location) {
        int batteryLevel = getBatteryLevel();
        boolean isCharging = isDeviceCharging();

        JSONObject payload = new JSONObject();
        try {
            payload.put("latitude", location.getLatitude());
            payload.put("longitude", location.getLongitude());
            payload.put("accuracy", location.getAccuracy());
            payload.put("speed", location.getSpeed());
            payload.put("heading", location.getBearing());
            payload.put("batteryLevel", batteryLevel);
            payload.put("isCharging", isCharging);
            if (activeOrderId != null) {
                payload.put("activeOrderId", activeOrderId);
            } else {
                payload.put("activeOrderId", JSONObject.NULL);
            }
            payload.put("timestamp", System.currentTimeMillis());
        } catch (Exception e) {
            Log.e(TAG, "Error building location JSON: " + e.getMessage());
            return;
        }

        networkExecutor.execute(() -> sendLocationPing(payload));
    }

    private void sendLocationPing(JSONObject payload) {
        String token = Auth.freshToken(this);
        if (token.isEmpty()) {
            queueLocationOffline(payload);
            return;
        }

        try {
            String endpointUrl = CommonUtilities.URL + "deliveryboy/location/ping";
            URL url = new URL(endpointUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setDoOutput(true);

            byte[] outputBytes = payload.toString().getBytes("UTF-8");
            try (OutputStream os = conn.getOutputStream()) {
                os.write(outputBytes);
                os.flush();
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200 || responseCode == 201) {
                Log.d(TAG, "Location ping transmitted successfully.");
                flushOfflineQueue(token);
            } else {
                Log.w(TAG, "Location ping failed with HTTP code: " + responseCode);
                queueLocationOffline(payload);
            }
            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "Network exception sending location ping: " + e.getMessage());
            queueLocationOffline(payload);
        }
    }

    private void queueLocationOffline(JSONObject payload) {
        try {
            SharedPreferences queuePref = getSharedPreferences("OfflineLocationQueue", MODE_PRIVATE);
            String existingQueueStr = queuePref.getString("queue", "[]");
            JSONArray queueArray = new JSONArray(existingQueueStr);

            // Cap offline queue at 50 points to prevent storage growth
            if (queueArray.length() >= 50) {
                queueArray.remove(0);
            }
            queueArray.put(payload);
            queuePref.edit().putString("queue", queueArray.toString()).apply();
            Log.d(TAG, "Location queued offline. Queue count: " + queueArray.length());
        } catch (Exception e) {
            Log.e(TAG, "Error queueing offline location: " + e.getMessage());
        }
    }

    private void flushOfflineQueue(String token) {
        try {
            SharedPreferences queuePref = getSharedPreferences("OfflineLocationQueue", MODE_PRIVATE);
            String existingQueueStr = queuePref.getString("queue", "[]");
            JSONArray queueArray = new JSONArray(existingQueueStr);
            if (queueArray.length() == 0) return;

            Log.d(TAG, "Flushing " + queueArray.length() + " offline locations...");
            for (int i = 0; i < queueArray.length(); i++) {
                JSONObject item = queueArray.getJSONObject(i);
                URL url = new URL(CommonUtilities.URL + "deliveryboy/location/ping");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setConnectTimeout(3000);
                conn.setReadTimeout(3000);
                conn.setDoOutput(true);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(item.toString().getBytes("UTF-8"));
                    os.flush();
                }
                conn.getResponseCode();
                conn.disconnect();
            }

            queuePref.edit().putString("queue", "[]").apply();
            Log.d(TAG, "Offline queue cleared.");
        } catch (Exception e) {
            Log.w(TAG, "Offline queue flush partially failed: " + e.getMessage());
        }
    }

    private int getBatteryLevel() {
        try {
            BatteryManager bm = (BatteryManager) getSystemService(BATTERY_SERVICE);
            return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
        } catch (Exception e) {
            return -1;
        }
    }

    private boolean isDeviceCharging() {
        try {
            IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, filter);
            if (batteryStatus == null) return false;
            int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            return status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL;
        } catch (Exception e) {
            return false;
        }
    }

    private Notification buildNotification(String title, String content) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(content)
                .setSmallIcon(R.mipmap.app_icon)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "ClikGett Delivery Operations",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows persistent status while driver telematics is active.");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForegroundTracking();
        networkExecutor.shutdown();
    }
}
