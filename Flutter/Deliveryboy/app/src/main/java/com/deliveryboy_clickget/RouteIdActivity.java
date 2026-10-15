package com.deliveryboy_clickget;

import android.app.ProgressDialog;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
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
import androidx.recyclerview.widget.DefaultItemAnimator;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;


import com.deliveryboy_clickget.Model.RouteByOrderList;
import com.deliveryboy_clickget.Model.RouteByOrderOrder;
import com.deliveryboy_clickget.Model.RouteByOrderdeatails;
import com.deliveryboy_clickget.Utils.APIService;
import com.deliveryboy_clickget.Utils.RetrofitClient;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RouteIdActivity extends AppCompatActivity {
    RecyclerView routeid_list;
    ImageView back_img;
    String RouteID, token;
    TextView routeid_txt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        setContentView(R.layout.activity_route_id);

        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(ContextCompat.getColor(this, R.color.clikgett_card_surface));

        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        if (insetsController != null) {
            boolean isNight = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
            insetsController.setAppearanceLightStatusBars(!isNight);
        }

        View routeIdRoot = findViewById(R.id.route_id_root);
        if (routeIdRoot != null) {
            ViewCompat.setOnApplyWindowInsetsListener(routeIdRoot, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                return windowInsets;
            });
        }
        RouteID = getIntent().getStringExtra("RouteID");
        SharedPreferences pref = getApplicationContext().getSharedPreferences("MyPref", MODE_PRIVATE);
        SharedPreferences.Editor editor = pref.edit();
        token = pref.getString("token", null); // getting String
        Log.d("RouteID", RouteID);
        routeid_list = findViewById(R.id.routeid_list);
        routeid_txt = findViewById(R.id.routeid_txt);
        routeid_txt.setText("#" + RouteID);
        back_img = findViewById(R.id.back_img);
        back_img.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                finish();
            }
        });
    }

    @Override
    protected void onResume() {
        if (InternetConnection.checkConnection(getApplicationContext())) {
            getRoutesDeliveryboyDetail();
        } else {
            Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
        }
        super.onResume();
    }

    private void getRoutesDeliveryboyDetail() {
        ProgressDialog progressDialog = new ProgressDialog(RouteIdActivity.this);
        progressDialog.setMessage("Loading ...");
        progressDialog.setCancelable(false);
        progressDialog.show();
        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Call<RouteByOrderdeatails> call = apiService.getroutesdeliveryboydetail(RouteID, "Bearer " + token);
        call.enqueue(new Callback<RouteByOrderdeatails>() {
            @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
            @Override
            public void onResponse(Call<RouteByOrderdeatails> call, Response<RouteByOrderdeatails> response) {
                RouteByOrderdeatails routeByOrderdeatails = response.body();
                if (response.code() == 200) {
                    if (routeByOrderdeatails.getStatus() == 1) {
                        List<RouteByOrderOrder> routeByOrderOrders = routeByOrderdeatails.getOrders();
                        for (int i = 0; i < routeByOrderOrders.size(); i++) {
                            List<RouteByOrderList> routeByOrderLists = routeByOrderOrders.get(i).getOrders();
                            {
                                RouteIdAdapter adapter = new RouteIdAdapter(getApplicationContext(), routeByOrderLists);
                                RecyclerView.LayoutManager mLayoutManager = new LinearLayoutManager(getApplicationContext());
                                routeid_list.setLayoutManager(mLayoutManager);
                                routeid_list.setItemAnimator(new DefaultItemAnimator());
                                routeid_list.setAdapter(adapter);
                                progressDialog.dismiss();
                            }
                        }
                    }
                } else if (response.code() == 400) {
                    progressDialog.dismiss();

                } else if (response.code() == 401) {
                    progressDialog.dismiss();
                }
            }

            @Override
            public void onFailure(Call<RouteByOrderdeatails> call, Throwable t) {
                progressDialog.dismiss();
                Toast.makeText(RouteIdActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();

            }
        });

    }
}