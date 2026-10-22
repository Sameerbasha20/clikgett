package com.deliveryboy_clickget;

import android.Manifest;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.Gravity;
import android.view.MenuItem;
import android.view.View;
import android.view.Window;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.appcompat.widget.SwitchCompat;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.fragment.app.FragmentManager;
import androidx.viewpager2.widget.ViewPager2;

import com.deliveryboy_clickget.Utils.CommonUtilities;
import com.deliveryboy_clickget.Utils.DepthPageTransformer;
import com.deliveryboy_clickget.Utils.Session;
import com.google.android.material.navigation.NavigationView;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.squareup.picasso.Picasso;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import de.hdodenhof.circleimageview.CircleImageView;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";
    private static final int PERMISSION_REQUEST_CODE = 101;

    DrawerLayout drawerLayout;
    NavigationView navigationView;
    ActionBarDrawerToggle toggle;
    TabLayout tabLayout;
    ViewPager2 viewPager;
    private MyOrdersFragmentAdapter adapter;

    // Operational UI elements
    SwitchCompat dutyStatusSwitch;
    TextView driverGreetingTxt, dutyStatusBadge, gpsStatusTxt, batteryStatusTxt, todayDeliveriesTxt;

    String token, AdminID, FirstName, LastName, ProfilePic;
    private final ExecutorService backgroundExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean isUpdatingSwitchProgrammatically = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);

        setContentView(R.layout.activity_main);

        try {
            SharedPreferences pref = getApplicationContext().getSharedPreferences("MyPref", MODE_PRIVATE);
            token = pref.getString("token", "");
            AdminID = pref.getString("AdminID", "");
            FirstName = pref.getString("FirstName", "");
            LastName = pref.getString("LastName", "");
            ProfilePic = pref.getString("ProfilePic", "NA");

            // UI Bindings
            tabLayout = findViewById(R.id.tab_layouts);
            viewPager = findViewById(R.id.view_pager);
            drawerLayout = findViewById(R.id.drawer_layout);
            navigationView = findViewById(R.id.nav_view);

            dutyStatusSwitch = findViewById(R.id.duty_status_switch);
            driverGreetingTxt = findViewById(R.id.driver_greeting_txt);
            dutyStatusBadge = findViewById(R.id.duty_status_badge);
            gpsStatusTxt = findViewById(R.id.gps_status_txt);
            batteryStatusTxt = findViewById(R.id.battery_status_txt);
            todayDeliveriesTxt = findViewById(R.id.today_deliveries_txt);

            if (driverGreetingTxt != null) {
                driverGreetingTxt.setText("Hello, " + (FirstName != null && !FirstName.isEmpty() ? FirstName : "Driver"));
            }
            updateBatteryDisplay();

            if (tabLayout != null && viewPager != null) {
                FragmentManager fragmentManager = getSupportFragmentManager();
                adapter = new MyOrdersFragmentAdapter(fragmentManager, getLifecycle());
                viewPager.setAdapter(adapter);
                try {
                    viewPager.setPageTransformer(new DepthPageTransformer());
                } catch (Exception e) {
                    Log.w(TAG, "PageTransformer warning: " + e.getMessage());
                }

                new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
                    if (position == 0) {
                        tab.setText("Pending Orders");
                    } else {
                        tab.setText("Past Orders");
                    }
                }).attach();
            }

            // Navigation drawer setup
            if (navigationView != null) {
                View headerview = navigationView.getHeaderView(0);
                if (headerview != null) {
                    CircleImageView nav_head_img = headerview.findViewById(R.id.nav_head_img);
                    TextView nav_head_nametxt = headerview.findViewById(R.id.nav_head_nametxt);

                    if (nav_head_img != null) {
                        if (ProfilePic == null || ProfilePic.trim().isEmpty() || ProfilePic.equalsIgnoreCase("NA") || ProfilePic.equalsIgnoreCase("null")) {
                            nav_head_img.setImageResource(R.mipmap.profile_icon_foreground);
                        } else {
                            try {
                                Picasso.get().load(ProfilePic)
                                        .placeholder(R.mipmap.profile_icon_foreground)
                                        .error(R.mipmap.profile_icon_foreground)
                                        .into(nav_head_img);
                            } catch (Exception e) {
                                Log.w(TAG, "Picasso failed: " + e.getMessage());
                                nav_head_img.setImageResource(R.mipmap.profile_icon_foreground);
                            }
                        }
                    }

                    if (nav_head_nametxt != null) {
                        String fullName = ((FirstName != null ? FirstName : "") + " " + (LastName != null ? LastName : "")).trim();
                        nav_head_nametxt.setText(fullName.isEmpty() ? "Driver Partner" : fullName);
                    }
                }

                navigationView.setNavigationItemSelectedListener(item -> {
                    if (item.getItemId() == R.id.status_item) {
                        Intent intent = new Intent(getApplicationContext(), StatusActivity.class);
                        startActivity(intent);
                    } else if (item.getItemId() == R.id.logout_item) {
                        showLogoutDialog();
                    }
                    return true;
                });
            }

            if (drawerLayout != null) {
                try {
                    toggle = new ActionBarDrawerToggle(this, drawerLayout, R.string.open_drawer, R.string.close_drawer);
                    drawerLayout.addDrawerListener(toggle);
                    toggle.syncState();
                } catch (Exception e) {
                    Log.w(TAG, "Toggle sync failed: " + e.getMessage());
                }
            }

            // Duty status switch listener
            if (dutyStatusSwitch != null) {
                dutyStatusSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
                    if (isUpdatingSwitchProgrammatically) return;

                    if (isChecked) {
                        checkPermissionsAndGoOnline();
                    } else {
                        updateDutyStatusOnServer("OFFLINE", false);
                    }
                });
            }

            // Fetch current duty status and permissions on start
            fetchDutyStatusFromServer();
            // Order pushes: register this device and ask for notification permission (Android 13+).
            RiderMessagingService.syncToken(getApplicationContext());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                    && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_CODE + 1);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate: " + e.getMessage(), e);
            Toast.makeText(this, "Welcome to ClikGett Operations", Toast.LENGTH_SHORT).show();
        }
    }

    private void updateBatteryDisplay() {
        if (batteryStatusTxt == null) return;
        try {
            BatteryManager bm = (BatteryManager) getSystemService(Context.BATTERY_SERVICE);
            if (bm != null) {
                int batLevel = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
                batteryStatusTxt.setText("Battery: " + batLevel + "%");
            } else {
                batteryStatusTxt.setText("Battery: --");
            }
        } catch (Exception e) {
            batteryStatusTxt.setText("Battery: --");
        }
    }

    private void checkPermissionsAndGoOnline() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            String[] permissions;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permissions = new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                        Manifest.permission.POST_NOTIFICATIONS
                };
            } else {
                permissions = new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                };
            }
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        } else {
            updateDutyStatusOnServer("ONLINE", false);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                updateDutyStatusOnServer("ONLINE", false);
            } else {
                Toast.makeText(this, "Location permission is required to go Online", Toast.LENGTH_LONG).show();
                setSwitchState(false);
            }
        }
    }

    private void fetchDutyStatusFromServer() {
        backgroundExecutor.execute(() -> {
            try {
                URL url = new URL(CommonUtilities.URL + "deliveryboy/duty-status");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);

                int code = conn.getResponseCode();
                if (code == 401) Session.expire(MainActivity.this);
                if (code == 200) {
                    BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                    br.close();

                    JSONObject respObj = new JSONObject(sb.toString());
                    if (respObj.optInt("Status") == 1 && respObj.has("Driver")) {
                        JSONObject driver = respObj.getJSONObject("Driver");
                        String status = driver.optString("DutyStatus", "OFFLINE");
                        int activeOrders = driver.optInt("ActiveOrdersCount", 0);
                        int todayOrders = driver.optInt("TodayDeliveriesCount", 0);

                        mainHandler.post(() -> {
                            boolean isOnline = "ONLINE".equalsIgnoreCase(status) || "ON_DELIVERY".equalsIgnoreCase(status);
                            setSwitchState(isOnline);
                            updateStatusUI(status, activeOrders, todayOrders);
                            if (isOnline) {
                                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                                    startLocationService();
                                } else {
                                    Log.w(TAG, "Driver online but location permission not yet granted; postponing service until permission granted.");
                                }
                            }
                        });
                    }
                }
                conn.disconnect();
            } catch (Exception e) {
                Log.w(TAG, "Error fetching duty status: " + e.getMessage());
            }
        });
    }

    private void updateDutyStatusOnServer(String targetStatus, boolean force) {
        backgroundExecutor.execute(() -> {
            try {
                URL url = new URL(CommonUtilities.URL + "deliveryboy/duty-status");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("PUT");
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                conn.setDoOutput(true);

                JSONObject body = new JSONObject();
                body.put("DutyStatus", targetStatus);
                if (force) body.put("forceOffline", true);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(body.toString().getBytes("UTF-8"));
                }

                int code = conn.getResponseCode();
                BufferedReader br = new BufferedReader(new InputStreamReader(code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
                br.close();

                JSONObject respObj = new JSONObject(sb.toString());
                mainHandler.post(() -> {
                    if (respObj.optInt("Status") == 1) {
                        boolean isOnline = "ONLINE".equalsIgnoreCase(targetStatus);
                        setSwitchState(isOnline);
                        updateStatusUI(targetStatus, -1, -1);

                        if (isOnline) {
                            startLocationService();
                            Toast.makeText(MainActivity.this, "You are now ONLINE for deliveries", Toast.LENGTH_SHORT).show();
                        } else {
                            stopLocationService();
                            Toast.makeText(MainActivity.this, "You are now OFFLINE", Toast.LENGTH_SHORT).show();
                        }
                    } else if (respObj.optBoolean("RequiresConfirmation", false)) {
                        // Driver has active deliveries in progress
                        new AlertDialog.Builder(MainActivity.this)
                                .setTitle("Active Deliveries in Progress")
                                .setMessage(respObj.optString("Message", "You have active deliveries."))
                                .setPositiveButton("Force Offline", (dialog, which) -> updateDutyStatusOnServer(targetStatus, true))
                                .setNegativeButton("Cancel", (dialog, which) -> setSwitchState(true))
                                .show();
                    } else {
                        Toast.makeText(MainActivity.this, respObj.optString("Message", "Failed to update status"), Toast.LENGTH_SHORT).show();
                        setSwitchState(!targetStatus.equalsIgnoreCase("ONLINE"));
                    }
                });
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Exception updating duty status: " + e.getMessage());
                mainHandler.post(() -> {
                    Toast.makeText(MainActivity.this, "Network error updating duty status", Toast.LENGTH_SHORT).show();
                    setSwitchState(!targetStatus.equalsIgnoreCase("ONLINE"));
                });
            }
        });
    }

    private void setSwitchState(boolean checked) {
        isUpdatingSwitchProgrammatically = true;
        dutyStatusSwitch.setChecked(checked);
        isUpdatingSwitchProgrammatically = false;
    }

    private void updateStatusUI(String status, int activeOrders, int todayOrders) {
        if ("ONLINE".equalsIgnoreCase(status)) {
            dutyStatusBadge.setText("● ONLINE");
            dutyStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.color_online));
            dutyStatusBadge.setBackgroundResource(R.drawable.bg_status_pill_online);
            gpsStatusTxt.setText("GPS: Active");
        } else if ("ON_DELIVERY".equalsIgnoreCase(status)) {
            dutyStatusBadge.setText("● ON DELIVERY");
            dutyStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.color_delivery));
            dutyStatusBadge.setBackgroundResource(R.drawable.bg_status_pill_online);
            gpsStatusTxt.setText("GPS: High Priority");
        } else {
            dutyStatusBadge.setText("○ OFFLINE");
            dutyStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.color_offline));
            dutyStatusBadge.setBackgroundResource(R.drawable.bg_status_pill_offline);
            gpsStatusTxt.setText("GPS: Standby");
        }

        if (todayOrders >= 0) {
            todayDeliveriesTxt.setText("Today: " + todayOrders + " orders");
        }
        updateBatteryDisplay();
    }

    private void startLocationService() {
        try {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "Cannot start LocationTrackingService: Location permissions not granted.");
                return;
            }
            Intent serviceIntent = new Intent(this, LocationTrackingService.class);
            serviceIntent.setAction(LocationTrackingService.ACTION_START);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Throwable t) {
            Log.e(TAG, "Exception starting LocationTrackingService: " + t.getMessage(), t);
        }
    }

    private void stopLocationService() {
        try {
            Intent serviceIntent = new Intent(this, LocationTrackingService.class);
            serviceIntent.setAction(LocationTrackingService.ACTION_STOP);
            startService(serviceIntent);
        } catch (Throwable t) {
            Log.e(TAG, "Exception stopping LocationTrackingService: " + t.getMessage(), t);
        }
    }

    private void showLogoutDialog() {
        new AlertDialog.Builder(MainActivity.this)
                .setMessage("Are you sure you want to log out?")
                .setPositiveButton("Yes", (dialog, which) -> {
                    stopLocationService();
                    updateDutyStatusOnServer("OFFLINE", true);
                    SharedPreferences pref = getApplicationContext().getSharedPreferences("MyPref", MODE_PRIVATE);
                    pref.edit().clear().apply();
                    PreferenceManager.getDefaultSharedPreferences(getApplicationContext()).edit().clear().apply();
                    pref.edit().putBoolean(CommonUtilities.USER_LOGIN_STATUS, false).apply();

                    Intent intent1 = new Intent(getApplicationContext(), SentotpActivity.class);
                    intent1.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent1);
                    finish();
                })
                .setNegativeButton("No", (dialog, which) -> dialog.dismiss())
                .show();
    }

    public void nav_hambrg_drawer(View view) {
        drawerLayout.openDrawer(Gravity.LEFT);
    }
}