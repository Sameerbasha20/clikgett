package com.deliveryboy_clickget;

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

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;

import com.deliveryboy_clickget.Model.LoginDeo;
import com.deliveryboy_clickget.Utils.APIService;
import com.deliveryboy_clickget.Utils.CommonUtilities;
import com.deliveryboy_clickget.Utils.RetrofitClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;


public class LoginActivity extends AppCompatActivity {
    Button login_bt;
    EditText emaiid_edt, password_edt;
    String EmailId, Password;
    SharedPreferences sharedPreferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        setContentView(R.layout.activity_login);

        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        login_bt = findViewById(R.id.login_bt);
        emaiid_edt = findViewById(R.id.emaiid_edt);
        password_edt = findViewById(R.id.password_edt);
        login_bt.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                EmailId = emaiid_edt.getText().toString();
                Password = password_edt.getText().toString();
                if (EmailId.isEmpty()) {
                    emaiid_edt.setError("Enter Email Id");
                    return;
                }
                if (Password.isEmpty()) {
                    password_edt.setError("Enter Password");
                } else {
                    callVollyServiceToLogin(EmailId, Password);
                }
            }
        });
    }

    private void callVollyServiceToLogin(String emailId, String password) {
        ProgressDialog progressDialog = new ProgressDialog(LoginActivity.this);
        progressDialog.setMessage("Loading ...");
        progressDialog.setCancelable(false);
        progressDialog.show();
        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Call<LoginDeo> call = apiService.loginverify(emailId, password);
        Log.d("connect", call.request().toString());
        call.enqueue(new Callback<LoginDeo>() {
            @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
            @Override
            public void onResponse(Call<LoginDeo> call, Response<LoginDeo> response) {
                LoginDeo loginDeo = response.body();
                Log.d("suresh", "" + response);
                if (response.code() == 200) {
                    if (loginDeo.getStatus() == 1) {
                        progressDialog.dismiss();
                        sharedPreferences.edit().putBoolean(CommonUtilities.USER_LOGIN_STATUS, true).commit();

                        SharedPreferences pref = getApplicationContext().getSharedPreferences("MyPref", MODE_PRIVATE);
                        SharedPreferences.Editor editor = pref.edit();
                        editor.putString("token", loginDeo.getToken());
                        editor.putString("AdminID", String.valueOf(loginDeo.getUserDetails().getAdminID()));
                        editor.putString("FirstName", String.valueOf(loginDeo.getUserDetails().getFirstName()));
                        editor.putString("LastName", String.valueOf(loginDeo.getUserDetails().getLastName()));
                        editor.putString("ProfilePic", String.valueOf(loginDeo.getUserDetails().getProfilePic()));
                        editor.putString("Role", String.valueOf(loginDeo.getUserDetails().getRole()));
                        editor.apply();
                        Intent intent = new Intent(getApplicationContext(), MainActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                        Toast.makeText(LoginActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
                    } else {
                        progressDialog.dismiss();
                        Toast.makeText(LoginActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();

                    }

                } else {
                    progressDialog.dismiss();
//                    Toast.makeText(LoginActivity.this, ""+loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<LoginDeo> call, Throwable t) {
                progressDialog.dismiss();
                Toast.makeText(getApplicationContext(), t.getMessage(), Toast.LENGTH_LONG).show();

            }
        });

    }
}