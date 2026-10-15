package com.deliveryboy_clickget;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;

import android.annotation.SuppressLint;
import android.app.ProgressDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.preference.PreferenceManager;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.deliveryboy_clickget.Model.SendotpDeo;
import com.deliveryboy_clickget.Model.Verifyotp;
import com.deliveryboy_clickget.Utils.APIService;
import com.deliveryboy_clickget.Utils.CommonUtilities;
import com.deliveryboy_clickget.Utils.RetrofitClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class VerifyOtpActivity extends AppCompatActivity {
    String mobileNumber, enterdOtp;
    TextView getmobilenum_txt;
    EditText et_otpInd0, et_otpInd1, et_otpInd2, et_otpInd3;
    Button verifyotp_btn;
    TextView timer_OTP;
    SharedPreferences sharedPreferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        setContentView(R.layout.activity_verify_otp);
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        mobileNumber = getIntent().getStringExtra("MobileNumber");
        if (mobileNumber == null || mobileNumber.trim().isEmpty()) {
            SharedPreferences pref = getSharedPreferences("MyPref", MODE_PRIVATE);
            mobileNumber = pref.getString("MobileNumber", "");
        }

        getmobilenum_txt = findViewById(R.id.getmobilenum_txt);
        if (getmobilenum_txt != null && mobileNumber != null) {
            getmobilenum_txt.setText(mobileNumber);
        }
        verifyotp_btn = findViewById(R.id.verifyotp_btn);
        timer_OTP = findViewById(R.id.otp_screen_coundowntimer);
        et_otpInd0 = (EditText) findViewById(R.id.et_Value1);
        et_otpInd1 = (EditText) findViewById(R.id.et_Value2);
        et_otpInd2 = (EditText) findViewById(R.id.et_Value3);
        et_otpInd3 = (EditText) findViewById(R.id.et_Value4);
        verifyotp_btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                enterdOtp = null;
                String ind0 = et_otpInd0 != null ? et_otpInd0.getText().toString().trim() : "";
                String ind1 = et_otpInd1 != null ? et_otpInd1.getText().toString().trim() : "";
                String ind2 = et_otpInd2 != null ? et_otpInd2.getText().toString().trim() : "";
                String ind3 = et_otpInd3 != null ? et_otpInd3.getText().toString().trim() : "";

                if (ind0.isEmpty() || ind1.isEmpty() || ind2.isEmpty() || ind3.isEmpty()) {
                    Toast.makeText(VerifyOtpActivity.this, "Please enter complete 4-digit OTP", Toast.LENGTH_SHORT).show();
                    return;
                }
                if (!CommonUtilities.isNetworkConnectionAvailable(VerifyOtpActivity.this)) {
                    Toast.makeText(VerifyOtpActivity.this, "" + getString(R.string.str_no_network), Toast.LENGTH_SHORT).show();
                    return;
                }
                enterdOtp = ind0 + ind1 + ind2 + ind3;
                System.out.println("ENTERED OTP >>> " + enterdOtp);
                VerifyLoginOTP(enterdOtp, mobileNumber);
            }
        });
        et_otpInd0.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (count == 1) {
                    et_otpInd1.requestFocus();
                } else {
                    et_otpInd0.requestFocus();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {
            }

        });
        et_otpInd1.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (count == 1) {
                    et_otpInd2.requestFocus();
                } else {
                    et_otpInd0.requestFocus();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {

            }
        });

        et_otpInd1.setOnKeyListener(new View.OnKeyListener() {
            @Override
            public boolean onKey(View v, int keyCode, KeyEvent event) {
                if (keyCode == KeyEvent.KEYCODE_DEL) {
                    if (et_otpInd1.getText().toString().length() == 0) {
                        et_otpInd0.requestFocus();
                    }
                }
                return false;
            }
        });
        et_otpInd2.setOnKeyListener(new View.OnKeyListener() {
            @Override
            public boolean onKey(View v, int keyCode, KeyEvent event) {
                if (keyCode == KeyEvent.KEYCODE_DEL) {
                    if (et_otpInd2.getText().toString().length() == 0) {
                        et_otpInd1.requestFocus();
                    }
                }
                return false;
            }
        });
        et_otpInd3.setOnKeyListener(new View.OnKeyListener() {
            @Override
            public boolean onKey(View v, int keyCode, KeyEvent event) {
                if (keyCode == KeyEvent.KEYCODE_DEL) {
                    if (et_otpInd3.getText().toString().length() == 0) {
                        et_otpInd2.requestFocus();
                    }
                }
                return false;
            }
        });

        et_otpInd2.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (count == 1) {
                    et_otpInd3.requestFocus();
                } else {
                    et_otpInd1.requestFocus();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {

            }
        });
        et_otpInd3.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (count == 0) {
                    et_otpInd2.requestFocus();
                }

            }

            @Override
            public void afterTextChanged(Editable s) {

            }
        });
        reverseTimer();
    }

    private void reverseTimer() {
        new CountDownTimer(30000, 1000) {
            @SuppressLint("SetTextI18n")
            public void onTick(long millisUntilFinished) {
                long timer = millisUntilFinished / 1000;
                String valueTimer = String.valueOf(timer);
                timer_OTP.setText(valueTimer);
                timer_OTP.setClickable(false);
            }

            public void onFinish() {
                timer_OTP.setText(" Resend ");
                timer_OTP.setClickable(true);
                timer_OTP.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        if (CommonUtilities.isNetworkConnectionAvailable(VerifyOtpActivity.this)) {
                            reverseTimer2();
                            if (InternetConnection.checkConnection(getApplicationContext())) {
                                sendOtp(mobileNumber);
                            } else {
                                Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
                            }
                            timer_OTP.setClickable(false);
                        } else {
                            Toast.makeText(VerifyOtpActivity.this, "" + getString(R.string.str_no_network), Toast.LENGTH_SHORT).show();
                        }
                    }
                });
            }

        }.start();
    }

    private void sendOtp(String mobileNumber) {
        ProgressDialog progressDialog = new ProgressDialog(VerifyOtpActivity.this);
        progressDialog.setMessage("Loading ...");
        progressDialog.setCancelable(false);
        progressDialog.show();
        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Call<SendotpDeo> call = apiService.sentotp(mobileNumber);
        call.enqueue(new Callback<SendotpDeo>() {
            @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
            @Override
            public void onResponse(Call<SendotpDeo> call, Response<SendotpDeo> response) {
                SendotpDeo loginDeo = response.body();
                Log.d("suresh", "" + response);
                if (response.code() == 200) {
                    if (loginDeo.getStatus() == 1) {
                        progressDialog.dismiss();
                        Toast.makeText(VerifyOtpActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
                    } else {
                        progressDialog.dismiss();
                        Toast.makeText(VerifyOtpActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                } else {
                    progressDialog.dismiss();
                }
            }

            @Override
            public void onFailure(Call<SendotpDeo> call, Throwable t) {
                progressDialog.dismiss();
                Toast.makeText(VerifyOtpActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void reverseTimer2() {
        new CountDownTimer(30000, 1000) {
            @SuppressLint("SetTextI18n")
            public void onTick(long millisUntilFinished) {
                long timer = millisUntilFinished / 1000;
                String valueTimer = String.valueOf(timer);
                timer_OTP.setText(valueTimer);
                timer_OTP.setClickable(false);
            }

            public void onFinish() {
                timer_OTP.setText(" Resend ");
                timer_OTP.setClickable(true);
                timer_OTP.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        timer_OTP.setOnClickListener(new View.OnClickListener() {
                            @Override
                            public void onClick(View v) {
                                if (CommonUtilities.isNetworkConnectionAvailable(VerifyOtpActivity.this)) {
                                    reverseTimer();
                                    sendOtp(mobileNumber);
                                } else {
                                    Toast.makeText(VerifyOtpActivity.this, "" + getString(R.string.str_no_network), Toast.LENGTH_SHORT).show();
                                }
                            }
                        });
                    }
                });
            }
        }.start();
    }

    private void VerifyLoginOTP(String enterdOtp, String mobileNumber) {
        if (mobileNumber == null) mobileNumber = "";
        if (enterdOtp == null) enterdOtp = "";

        final ProgressDialog progressDialog = new ProgressDialog(VerifyOtpActivity.this);
        progressDialog.setMessage("Loading ...");
        progressDialog.setCancelable(false);
        try {
            if (!isFinishing() && !isDestroyed()) {
                progressDialog.show();
            }
        } catch (Exception ignored) {}

        try {
            APIService apiService = RetrofitClient.getClient().create(APIService.class);
            Call<Verifyotp> call = apiService.loginotpverify(mobileNumber, enterdOtp);
            final String finalMobileNumber = mobileNumber;
            call.enqueue(new Callback<Verifyotp>() {
                @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
                @Override
                public void onResponse(Call<Verifyotp> call, Response<Verifyotp> response) {
                    try {
                        if (progressDialog.isShowing() && !isFinishing() && !isDestroyed()) {
                            progressDialog.dismiss();
                        }
                    } catch (Exception ignored) {}

                    try {
                        Verifyotp loginDeo = response != null ? response.body() : null;
                        if (response != null && response.code() == 200 && loginDeo != null) {
                            if (loginDeo.getStatus() != null && loginDeo.getStatus() == 1) {
                                sharedPreferences.edit().putBoolean(CommonUtilities.USER_LOGIN_STATUS, true).apply();
                                SharedPreferences pref = getApplicationContext().getSharedPreferences("MyPref", MODE_PRIVATE);
                                SharedPreferences.Editor editor = pref.edit();
                                editor.putString("token", loginDeo.getToken() != null ? loginDeo.getToken() : "");
                                editor.putString("MobileNumber", finalMobileNumber);

                                if (loginDeo.getUserDetails() != null) {
                                    editor.putString("AdminID", String.valueOf(loginDeo.getUserDetails().getAdminID() != null ? loginDeo.getUserDetails().getAdminID() : ""));
                                    editor.putString("FirstName", loginDeo.getUserDetails().getFirstName() != null ? loginDeo.getUserDetails().getFirstName() : "");
                                    editor.putString("LastName", loginDeo.getUserDetails().getLastName() != null ? loginDeo.getUserDetails().getLastName() : "");
                                    String pic = loginDeo.getUserDetails().getProfilePic();
                                    editor.putString("ProfilePic", (pic != null && !pic.isEmpty() && !pic.equalsIgnoreCase("null")) ? pic : "NA");
                                    editor.putString("Role", String.valueOf(loginDeo.getUserDetails().getRole() != null ? loginDeo.getUserDetails().getRole() : "2"));
                                } else {
                                    editor.putString("AdminID", "");
                                    editor.putString("FirstName", "Driver");
                                    editor.putString("LastName", "");
                                    editor.putString("ProfilePic", "NA");
                                    editor.putString("Role", "2");
                                }
                                editor.apply();

                                try {
                                    Intent intent = new Intent(VerifyOtpActivity.this, MainActivity.class);
                                    intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                                    startActivity(intent);
                                    finish();
                                } catch (Exception intentEx) {
                                    Log.e("VerifyOtp", "Error launching MainActivity: " + intentEx.getMessage(), intentEx);
                                    Toast.makeText(getApplicationContext(), "Launch error: " + intentEx.getMessage(), Toast.LENGTH_LONG).show();
                                }

                                Toast.makeText(VerifyOtpActivity.this, loginDeo.getMessage() != null ? loginDeo.getMessage() : "Login Successful", Toast.LENGTH_SHORT).show();
                            } else {
                                String msg = (loginDeo != null && loginDeo.getMessage() != null) ? loginDeo.getMessage() : "Verification Failed";
                                Toast.makeText(VerifyOtpActivity.this, msg, Toast.LENGTH_SHORT).show();
                            }
                        } else if (response != null && response.code() == 400) {
                            Toast.makeText(getApplicationContext(), "OTP Verification Failed", Toast.LENGTH_LONG).show();
                        } else {
                            int code = response != null ? response.code() : 500;
                            Toast.makeText(getApplicationContext(), "Error: Server response " + code, Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception e) {
                        Log.e("VerifyOtp", "Error processing response: " + e.getMessage(), e);
                        Toast.makeText(getApplicationContext(), "Error verifying OTP: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<Verifyotp> call, Throwable t) {
                    try {
                        if (progressDialog.isShowing() && !isFinishing() && !isDestroyed()) {
                            progressDialog.dismiss();
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(getApplicationContext(), "Network Error: " + (t != null ? t.getMessage() : ""), Toast.LENGTH_LONG).show();
                }
            });
        } catch (Throwable t) {
            try {
                if (progressDialog.isShowing() && !isFinishing() && !isDestroyed()) {
                    progressDialog.dismiss();
                }
            } catch (Exception ignored) {}
            Log.e("VerifyOtp", "Fatal error initiating OTP verification: " + t.getMessage(), t);
            Toast.makeText(getApplicationContext(), "Verification failed: " + t.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}