package com.deliveryboy_clickget;

import android.app.ProgressDialog;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;


import com.deliveryboy_clickget.Model.OrderStatusModel;
import com.deliveryboy_clickget.Model.OrdersStatus;
import com.deliveryboy_clickget.Utils.APIService;
import com.deliveryboy_clickget.Utils.RetrofitClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StatusActivity extends AppCompatActivity {
    ImageView back_img;
    TextView total_orders_txt, earningamount_txt;
    String token;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        setContentView(R.layout.activity_status);

        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(ContextCompat.getColor(this, R.color.clikgett_card_surface));

        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        if (insetsController != null) {
            boolean isNight = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
            insetsController.setAppearanceLightStatusBars(!isNight);
        }

        View mainLayt = findViewById(R.id.main_layt);
        if (mainLayt != null) {
            ViewCompat.setOnApplyWindowInsetsListener(mainLayt, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                return windowInsets;
            });
        }
        SharedPreferences pref = getApplicationContext().getSharedPreferences("MyPref", MODE_PRIVATE);
        SharedPreferences.Editor editor = pref.edit();
        token = pref.getString("token", null); // getting String
        back_img = findViewById(R.id.back_img);
        total_orders_txt = findViewById(R.id.total_orders_txt);
        earningamount_txt = findViewById(R.id.earningamount_txt);
        back_img.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                finish();
            }
        });
        getStatusDeatails();
    }

    private void getStatusDeatails() {
        ProgressDialog progressDialog = new ProgressDialog(StatusActivity.this);
        progressDialog.setMessage("Loading ...");
        progressDialog.setCancelable(false);
        progressDialog.show();
        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Call<OrderStatusModel> call = apiService.getstatus("Bearer " + token);
        call.enqueue(new Callback<OrderStatusModel>() {
            @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
            @Override
            public void onResponse(Call<OrderStatusModel> call, Response<OrderStatusModel> response) {
                OrderStatusModel orderStatusModel = response.body();
                if (response.code() == 200) {
                    if (orderStatusModel.getStatus() == 1) {

                        OrdersStatus ordersStatus = orderStatusModel.getOrdersStatus();
                        String DeliveredCount = String.valueOf(ordersStatus.getDeliveredCount());
                        String Earnings = String.valueOf(ordersStatus.getEarnings());
                        total_orders_txt.setText(DeliveredCount);
                        earningamount_txt.setText(Earnings);
                        progressDialog.dismiss();
                    }
                } else if (response.code() == 400) {
                    progressDialog.dismiss();

                } else if (response.code() == 401) {
                    progressDialog.dismiss();
                }
            }

            @Override
            public void onFailure(Call<OrderStatusModel> call, Throwable t) {
                progressDialog.dismiss();
                Toast.makeText(StatusActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}