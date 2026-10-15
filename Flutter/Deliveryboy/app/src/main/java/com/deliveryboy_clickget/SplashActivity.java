package com.deliveryboy_clickget;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.preference.PreferenceManager;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageView;

import androidx.appcompat.app.AppCompatActivity;

import com.deliveryboy_clickget.Utils.CommonUtilities;

public class SplashActivity extends AppCompatActivity {
    SharedPreferences sharedPreferences;
    ImageView middle_icon;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        this.getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        setContentView(R.layout.activity_splash);

        middle_icon = findViewById(R.id.middle_icon);
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());

        // Load the logo animation
        Animation logoAnim = AnimationUtils.loadAnimation(this, R.anim.logo_animation);

        // Start the logo animation
        middle_icon.startAnimation(logoAnim);

        // Delayed action after the animation (5 seconds in this case)
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!sharedPreferences.getBoolean(CommonUtilities.USER_LOGIN_STATUS, false)) {
                    Intent loginIntent = new Intent(getApplicationContext(), SentotpActivity.class);
                    startActivity(loginIntent);
                    finish();
                } else {
                    Intent loginIntent = new Intent(getApplicationContext(), MainActivity.class);
                    startActivity(loginIntent);
                    finish();
                }
            }
        }, 5000);  // 5 seconds delay (animation duration included)
    }
}
