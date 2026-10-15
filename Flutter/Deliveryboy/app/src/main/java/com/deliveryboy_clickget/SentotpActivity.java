package com.deliveryboy_clickget;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;

import android.app.ProgressDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import com.deliveryboy_clickget.Model.SendotpDeo;
import com.deliveryboy_clickget.Utils.APIService;
import com.deliveryboy_clickget.Utils.RetrofitClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SentotpActivity extends AppCompatActivity {
EditText phonenumber_edt;
Button sentotp_bt;
    SharedPreferences sharedPreferences;

    final String MobilePattern = "^(?:(?:\\+|0{0,2})91(\\s*[\\-]\\s*)?|[0]?)?[6789]\\d{9}$";
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        setContentView(R.layout.activity_sentotp);
        sharedPreferences  = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());

        phonenumber_edt= findViewById(R.id.phonenumber_edt);
        sentotp_bt= findViewById(R.id.sentotp_bt);
        sentotp_bt.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (phonenumber_edt.getText().toString().trim().isEmpty()|| !phonenumber_edt.getText().toString().trim().matches(MobilePattern)){
                    Toast.makeText(getApplicationContext(),"Please Enter Mobile Number",Toast.LENGTH_LONG).show();
                }else {
                    if (InternetConnection.checkConnection(getApplicationContext())) {
                        SendOtp(phonenumber_edt.getText().toString());

                    } else {
                        Toast.makeText(getApplicationContext(),"No Internet Connection",Toast.LENGTH_LONG).show();
                    }
                }
            }
        });

    }

    private void SendOtp(String mobileNumber) {
        ProgressDialog progressDialog = new ProgressDialog(SentotpActivity.this);
        progressDialog.setMessage("Loading ...");
        progressDialog.setCancelable(false);
        try {
            progressDialog.show();
        } catch (Exception ignored) {}

        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Call<SendotpDeo> call = apiService.sentotp(mobileNumber);
        call.enqueue(new Callback<SendotpDeo>() {
            @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
            @Override
            public void onResponse(Call<SendotpDeo> call, Response<SendotpDeo> response) {
                try {
                    if (progressDialog.isShowing()) {
                        progressDialog.dismiss();
                    }
                } catch (Exception ignored) {}

                try {
                    SendotpDeo loginDeo = response.body();
                    if (response.code() == 200 && loginDeo != null) {
                        if (loginDeo.getStatus() != null && loginDeo.getStatus() == 1) {
                            SharedPreferences pref = getSharedPreferences("MyPref", MODE_PRIVATE);
                            pref.edit().putString("MobileNumber", mobileNumber).apply();
                            Intent intent = new Intent(getApplicationContext(), VerifyOtpActivity.class);
                            intent.putExtra("MobileNumber", "" + mobileNumber);
                            startActivity(intent);
                            Toast.makeText(SentotpActivity.this, loginDeo.getMessage() != null ? loginDeo.getMessage() : "OTP sent", Toast.LENGTH_SHORT).show();
                        } else {
                            String msg = loginDeo.getMessage() != null ? loginDeo.getMessage() : "Failed to send OTP";
                            Toast.makeText(SentotpActivity.this, msg, Toast.LENGTH_SHORT).show();
                        }
                    } else {
                        Toast.makeText(SentotpActivity.this, "Server error: " + response.code(), Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    Log.e("Sentotp", "Error processing OTP response: " + e.getMessage(), e);
                    Toast.makeText(SentotpActivity.this, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<SendotpDeo> call, Throwable t) {
                try {
                    if (progressDialog.isShowing()) {
                        progressDialog.dismiss();
                    }
                } catch (Exception ignored) {}
                Toast.makeText(SentotpActivity.this, t != null ? t.getMessage() : "Network error", Toast.LENGTH_LONG).show();
            }
        });
    }
}