package com.deliveryboy_clickget;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class NavigationActivity extends AppCompatActivity {
    String MobileNo, Latitude, Longitude, Address;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_navigation);
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(ContextCompat.getColor(this, R.color.clikgett_surface_bg));

        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        if (insetsController != null) {
            boolean isNight = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
            insetsController.setAppearanceLightStatusBars(!isNight);
        }

        View navRoot = findViewById(R.id.nav_root);
        if (navRoot != null) {
            ViewCompat.setOnApplyWindowInsetsListener(navRoot, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                return windowInsets;
            });
        }

        MobileNo = getIntent().getStringExtra("MobileNo");
        Latitude = getIntent().getStringExtra("Latitude");
        Longitude = getIntent().getStringExtra("Longitude");
        Address = getIntent().getStringExtra("Address");

        TextView navCoordsTxt = findViewById(R.id.nav_coords_txt);
        Button btnLaunchGmaps = findViewById(R.id.btn_launch_gmaps);
        Button btnCallCust = findViewById(R.id.btn_call_cust);
        Button btnBack = findViewById(R.id.btn_back);

        if (Latitude != null && Longitude != null && !Latitude.isEmpty() && !Longitude.isEmpty()) {
            navCoordsTxt.setText("Destination Coordinates: " + Latitude + ", " + Longitude);
        } else if (Address != null && !Address.isEmpty()) {
            navCoordsTxt.setText("Destination: " + Address);
        } else {
            navCoordsTxt.setText("Destination coordinates unavailable");
        }

        btnLaunchGmaps.setOnClickListener(v -> launchNavigation());

        btnCallCust.setOnClickListener(v -> {
            if (MobileNo != null && !MobileNo.isEmpty()) {
                startActivity(new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + MobileNo)));
            } else {
                Toast.makeText(this, "Customer phone number not available", Toast.LENGTH_SHORT).show();
            }
        });

        btnBack.setOnClickListener(v -> finish());
    }

    private void launchNavigation() {
        if (Latitude != null && Longitude != null && !Latitude.isEmpty() && !Longitude.isEmpty()) {
            try {
                Uri uri = Uri.parse("google.navigation:q=" + Latitude + "," + Longitude + "&mode=d");
                Intent mapIntent = new Intent(Intent.ACTION_VIEW, uri);
                mapIntent.setPackage("com.google.android.apps.maps");
                startActivity(mapIntent);
            } catch (Exception e1) {
                try {
                    Uri fallbackUri = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=" + Latitude + "," + Longitude);
                    startActivity(new Intent(Intent.ACTION_VIEW, fallbackUri));
                } catch (Exception e2) {
                    Toast.makeText(this, "No browser or map app found", Toast.LENGTH_SHORT).show();
                }
            }
        } else if (Address != null && !Address.isEmpty()) {
            Uri addrUri = Uri.parse("geo:0,0?q=" + Uri.encode(Address));
            startActivity(new Intent(Intent.ACTION_VIEW, addrUri));
        } else {
            Toast.makeText(this, "No valid destination found", Toast.LENGTH_SHORT).show();
        }
    }
}