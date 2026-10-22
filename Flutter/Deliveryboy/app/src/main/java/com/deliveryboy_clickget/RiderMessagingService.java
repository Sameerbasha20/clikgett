package com.deliveryboy_clickget;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.deliveryboy_clickget.Utils.Api;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONObject;

import java.util.Map;

/**
 * Order pushes from the backend (assigned / cancelled / reassigned). Shows a
 * notification that opens the order and tells open screens to refresh.
 */
public class RiderMessagingService extends FirebaseMessagingService {

    /** Broadcast sent (inside the app only) whenever the rider's orders change. */
    public static final String ACTION_ORDERS_CHANGED = "com.deliveryboy_clickget.ORDERS_CHANGED";

    @Override
    public void onNewToken(@NonNull String token) {
        registerToken(getApplicationContext(), token);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        Map<String, String> data = message.getData();
        String title = data.get("title");
        String body = data.get("body");
        if (message.getNotification() != null) {
            if (title == null) title = message.getNotification().getTitle();
            if (body == null) body = message.getNotification().getBody();
        }
        String orderId = data.get("orderId");
        String type = data.get("type");

        sendBroadcast(new Intent(ACTION_ORDERS_CHANGED).setPackage(getPackageName()));

        Intent open;
        if (orderId != null && !"cancelled".equals(type) && !"unassigned".equals(type)) {
            open = new Intent(this, OrderDetailsActivity.class).putExtra("OrderID", orderId);
        } else {
            open = new Intent(this, MainActivity.class);
        }
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pending = PendingIntent.getActivity(this, orderId != null ? orderId.hashCode() : 0, open, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, ClikGettApp.ORDERS_CHANNEL_ID)
                .setSmallIcon(R.mipmap.app_icon)
                .setContentTitle(title != null ? title : "Order update")
                .setContentText(body != null ? body : "Open the app to see your orders.")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setAutoCancel(true)
                .setContentIntent(pending);
        try {
            NotificationManagerCompat.from(this).notify(orderId != null ? orderId.hashCode() : (int) System.currentTimeMillis(), builder.build());
        } catch (SecurityException ignored) {
            // Notification permission not granted; the list still refreshes.
        }
    }

    /** Sends the device's push token to the backend (only once logged in). */
    public static void registerToken(Context context, String token) {
        if (token == null || token.isEmpty()) return;
        SharedPreferences pref = context.getSharedPreferences("MyPref", Context.MODE_PRIVATE);
        pref.edit().putString("fcm_token", token).apply();
        if (Api.token(context).isEmpty()) return;
        try {
            JSONObject body = new JSONObject().put("FCMToken", token);
            Api.post(context, "deliveryboy/fcmtoken", body, response -> {
            });
        } catch (Exception ignored) {
        }
    }

    /** Fetches the current token and registers it; call after login / app start. */
    public static void syncToken(Context context) {
        try {
            FirebaseMessaging.getInstance().getToken().addOnSuccessListener(token -> registerToken(context, token));
        } catch (Exception ignored) {
            // Firebase not available on this device.
        }
    }
}
