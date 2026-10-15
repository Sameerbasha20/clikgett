package com.deliveryboy_clickget;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Handler;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import android.view.Window;
import android.view.WindowManager;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.deliveryboy_clickget.Model.OrderListItems;
import com.deliveryboy_clickget.Model.SendotpDeo;
import com.deliveryboy_clickget.Model.UpdateStatusModel;
import com.deliveryboy_clickget.Utils.APIService;
import com.deliveryboy_clickget.Utils.CommonUtilities;
import com.deliveryboy_clickget.Utils.RetrofitClient;
import com.deliveryboy_clickget.Utils.VolleyHelper;
import com.ncorti.slidetoact.SlideToActView;


import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.MalformedURLException;
import java.net.URL;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import retrofit2.Call;
import retrofit2.Callback;

public class OrderDetailsActivity extends AppCompatActivity {
    private CountDownTimer countDownTimer;
    LinearLayout deleverdtime;
    TextView username_txt,setdeviverytime_txt, earnpoints_txt, setdeliverytime_txt, setorderid_txt, setorderamount_txt, setpaymentmethode_txt, setmobileno_txt, viewmap_txt, setaddress_txt;
    RecyclerView orders_list;
    FrameLayout callbackframe_lt;
    Button pickup_bt;
    Button arrived_btn;
    Button delivered_bt;
    String OrderID, token;
    ArrayList<OrderListItems> arrayListorderListItems = new ArrayList<>();
    ImageView back_img;
    TextView timer_OTP, dis_txt;

    int orderStatuss = 0;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_order_details);
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(ContextCompat.getColor(this, R.color.clikgett_card_surface));

        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        if (insetsController != null) {
            boolean isNight = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
            insetsController.setAppearanceLightStatusBars(!isNight);
        }

        View orderDetailsRoot = findViewById(R.id.order_details_root);
        if (orderDetailsRoot != null) {
            ViewCompat.setOnApplyWindowInsetsListener(orderDetailsRoot, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                return windowInsets;
            });
        }
        OrderID = getIntent().getStringExtra("OrderID");
        Log.d("OrderID", "" + OrderID);
        SharedPreferences pref = getApplicationContext().getSharedPreferences("MyPref", MODE_PRIVATE);
        SharedPreferences.Editor editor = pref.edit();
        token = pref.getString("token", null); // getting String
        back_img = findViewById(R.id.back_img);
        username_txt = findViewById(R.id.username_txt);
        deleverdtime = findViewById(R.id.deleverdtime);
        setdeviverytime_txt = findViewById(R.id.setdeviverytime_txt);
        earnpoints_txt = findViewById(R.id.earnpoints_txt);
        dis_txt = findViewById(R.id.dis_txt);
        setdeliverytime_txt = findViewById(R.id.setdeliverytime_txt);
        setorderid_txt = findViewById(R.id.setorderid_txt);
        setorderamount_txt = findViewById(R.id.setorderamount_txt);
        setpaymentmethode_txt = findViewById(R.id.setpaymentmethode_txt);
        setmobileno_txt = findViewById(R.id.setmobileno_txt);
        viewmap_txt = findViewById(R.id.viewmap_txt);
        setaddress_txt = findViewById(R.id.setaddress_txt);
        orders_list = findViewById(R.id.orders_list);
        callbackframe_lt = findViewById(R.id.callbackframe_lt);
//        pickup_bt = findViewById(R.id.pickup_bt);
//        arrived_btn = findViewById(R.id.arrived_btns);
//        delivered_bt = findViewById(R.id.delivered_bt);

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
            getorderDetails();
        } else {
            Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
        }
        super.onResume();
    }

    private void getorderDetails() {
        URL getAllOrdersURL = null;
        final ProgressDialog progressDialog;
        progressDialog = new ProgressDialog(OrderDetailsActivity.this);
        progressDialog.setMessage("Loading Riders...");
        progressDialog.setCancelable(false);
        progressDialog.show();
        JSONObject postDataParams = new JSONObject();
        try {
            getAllOrdersURL = new URL(CommonUtilities.URL + "deliveryboy/orderdetail?OrderID=" + OrderID);
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
        System.out.println("Url===" + getAllOrdersURL);
        JsonObjectRequest volleyJsonReques = new JsonObjectRequest(Request.Method.GET,
                getAllOrdersURL.toString(), postDataParams, new Response.Listener<JSONObject>() {
            @Override
            public void onResponse(JSONObject response) {
                System.out.println("VOLLEY RESPONSE >>>gerRiders " + response.toString());
                processResponse(response);
                progressDialog.dismiss();
            }
        }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {

                System.out.println("VOLLEY RESPONSE >>>getRiders error" + error.toString());
                progressDialog.dismiss();

            }
        }) {
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> params = new HashMap<String, String>();
                params.put("Authorization", "Bearer " + token);
                Log.d("Params>>>>>", params.toString());

                return params;
            }
        };
        VolleyHelper.getInstance(OrderDetailsActivity.this).addToRequestQueue(volleyJsonReques);
    }

    private void processResponse(JSONObject response) {
        SlideToActView pickupSlideButton = findViewById(R.id.pickup_bt);
        SlideToActView arrivedSlideButton = findViewById(R.id.arrived_btns);
        SlideToActView deliveredSlideButton = findViewById(R.id.delivered_bt);

        if (response != null) {

            try {
                if (response.getInt("Status") == 1) {


                    JSONObject jsonObject = response.getJSONObject("Orders");
                    JSONArray jsonArray = jsonObject.getJSONArray("orderitems");
//                    int OrderStatus = response.getInt("OrderStatus");
                    Log.d("OrderStatus", "" + response);
                    arrayListorderListItems.clear();
                    for (int i = 0; i < jsonArray.length(); i++) {
                        JSONObject jsonObject1 = jsonArray.getJSONObject(i);
                        OrderListItems orderListItems = new OrderListItems();
                        orderListItems.setProductName(jsonObject1.getString("ProductName"));
                        orderListItems.setMetrictype(jsonObject1.getString("metrictype"));
                        orderListItems.setQty(Double.parseDouble(jsonObject1.getString("Quantity")));
                        orderListItems.setImageUrl(jsonObject1.getString("ImageUrl"));
                        orderListItems.setPrice(Double.parseDouble(jsonObject1.getString("Price")));
                        orderListItems.setOfferPrice(Double.parseDouble(jsonObject1.getString("OfferPrice")));
                        orderListItems.setMetricvalue(Double.parseDouble(jsonObject1.getString("metricvalue")));
                        List<String> productImages = new ArrayList<>();
                        JSONArray productImagesArray = jsonObject1.getJSONArray("ProductImages");
                        for (int j = 0; j < productImagesArray.length(); j++) {
                            productImages.add(productImagesArray.getString(j));
                        }
                        orderListItems.setProductImages(productImages);
                        arrayListorderListItems.add(orderListItems);
                    }
                    orders_list.setLayoutManager(new LinearLayoutManager(this));
                    orders_list.setHasFixedSize(true);

                    OrderListItemsAdapter adapter = new OrderListItemsAdapter(getApplicationContext(), arrayListorderListItems);
                    orders_list.setAdapter(adapter);
                    String OrderSequence = jsonObject.getString("OrderSequence");
                    String orderId = jsonObject.getString("OrderID");
                    int UserID = jsonObject.getInt("UserID");
                    String MobileNumber = jsonObject.getString("MobileNumber");
                    String UserName = jsonObject.getString("UserName");
                    String EstimateDateTime = jsonObject.getString("EstimateDateTime");
                    String CreatedAtTime = jsonObject.getString("CreatedAt");
                    String DeliveredTime = jsonObject.getString("deliveredDateTime");

                    String Deliveredendtime = jsonObject.getString("Delivered_Cancelled_datetime");
                    Log.d("Deliveredendtime", "" + Deliveredendtime);
                    Log.d("CreatedAt ", "" + jsonObject.getString("deliveredDateTime"));

                    String GrandTotal = jsonObject.getString("GrandTotal");
                    String PaymentMethod = jsonObject.getString("PaymentMethod");
                    String Address = jsonObject.getString("Address");
                    String FlatNo = jsonObject.getString("FlatNo");
                    String Distance = jsonObject.getString("Distance");
                    String LandMark = jsonObject.getString("LandMark");
                    int OrderStatus = jsonObject.getInt("OrderStatus");
                    int DeliveryPoints = jsonObject.getInt("DeliveryPoints");
//                    String createdAts = jsonObject.getString("CreatedAt");


//                    orderStatuss = response.getInt("OrderStatus");

                    Log.d("UserNameOrderStatus", "" + orderStatuss);


                    Log.d("DeliveryPoints", "" + DeliveryPoints);
                    Log.d("Deliveredendtime", "" + Deliveredendtime);
//                    if (!"0000-00-00 00:00:00".equals(Deliveredendtime)) {
//                        SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
//                        SimpleDateFormat outputFormat = new SimpleDateFormat("dd-MM-yyyy");
//                        deleverdtime.setVisibility(View.VISIBLE);
//                        Date date = null;
//                        try {
//                            date = inputFormat.parse(Deliveredendtime);
//                            String deliveredDate = outputFormat.format(date);
//                            Log.d("DeliveredDate", "" + deliveredDate);
//                            setdeviverytime_txt.setText(deliveredDate);
//                        } catch (ParseException parseException) {
//                            parseException.printStackTrace();
//                        }
//                    }
                    if (
                            !"0000-00-00 00:00:00".equals(DeliveredTime) && OrderStatus == 1 ) {
//                         SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
//                        SimpleDateFormat outputFormat = new SimpleDateFormat("dd-MM-yyyy hh:mm a", Locale.getDefault()); // Added time in 12-hour format with AM/PM

// Set the input format to UTC timezone
//                        inputFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
//
//// Set the output format to IST timezone (UTC +5:30)
//                        outputFormat.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));

// Assuming OrderDate is the UTC date in string format
                        Date date = null;
                        deleverdtime.setVisibility(View.VISIBLE);
//                        try {
//                            // Parse the UTC date string
////                            inputFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
////                            outputFormat.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
////
//                            date = inputFormat.parse(Deliveredendtime);
////
////                            // Format the date to IST
////                            String formattedDate = outputFormat.format(date);
////
////                            formattedDate = outputFormat.format(date);
//
//
////                            System.out.println(formattedDate);
//                            setdeviverytime_txt.setText(DeliveredTime);
//                        } catch (ParseException parseException) {
//                            parseException.printStackTrace();
//                        }
                        setdeviverytime_txt.setText(DeliveredTime);


//                        try {
//                            Date date = inputFormat.parse(Deliveredendtime);
//                            String deliveredDateTime = outputFormat.format(date);
//                            setdeviverytime_txt.setText(deliveredDateTime);
//                        } catch (ParseException parseException) {
//                            parseException.printStackTrace();
//                        }
                    }
                    else {
                        deleverdtime.setVisibility(View.GONE);
                    }

//                    Log.d("statussssssssss", String.valueOf(OrderStatus));


                    if (DeliveryPoints == 0) {
                        earnpoints_txt.setVisibility(View.GONE);
                    } else {
                        earnpoints_txt.setVisibility(View.VISIBLE);
                        earnpoints_txt.setText("Earnings for this order = " + DeliveryPoints + " rs");
                    }
                    if (OrderStatus == 2) {
                        pickupSlideButton.setVisibility(View.VISIBLE); // ✅ This works

//                        pickup_bt.setVisibility(View.VISIBLE);
                    } else if (OrderStatus == 5) {
                        System.out.println("Im herebhjasvchavscgvajchva");
                        arrivedSlideButton.setVisibility(View.VISIBLE);

                    } else if (OrderStatus == 7) {
                        deliveredSlideButton.setVisibility(View.VISIBLE);

//                        delivered_bt.setVisibility(View.VISIBLE);
                    } else {
                        Log.d("OrderStatus", "No buttons visible for this status: " + OrderStatus);
                    }
//                    if (OrderStatus == 2 || OrderStatus == 5) {
//                        delivered_bt.setVisibility(View.VISIBLE);
//                    } else if (OrderStatus == 1 || OrderStatus == 4) {
//                        Log.d("OrderStatus", "Setting visibility to GONE for OrderStatus == 1");
//                        delivered_bt.setVisibility(View.GONE);
//                    } else {
//                        Log.d("OrderStatus", "Other OrderStatus, visibility might not be set");
//                    }


//                    setaddress_txt.setText(FlatNo+",  "+LandMark+",  "+Address);
                    String fullAddress = FlatNo + ", " + LandMark + ", " + Address;
                    int maxLength = 35;

// Check if the length exceeds the max length
//                    if (fullAddress.length() > maxLength) {
//                        // Truncate and add ellipsis
//                        fullAddress = fullAddress.substring(0, maxLength - 3) + "...";
//                    }

// Set the truncated text to the TextView
                    setaddress_txt.setText(fullAddress);

                    setmobileno_txt.setText(MobileNumber);
                    setpaymentmethode_txt.setText(PaymentMethod);
                    dis_txt.setText("Distance Travel : " + Distance + " km");
                    setorderamount_txt.setText("₹" + GrandTotal);
                    setorderid_txt.setText("#" + OrderSequence);
                    username_txt.setText(UserName);

                    callbackframe_lt.setOnClickListener(new View.OnClickListener() {
                        @Override
                        public void onClick(View view) {
                            String phone = MobileNumber;
                            Intent intent = new Intent(Intent.ACTION_DIAL, Uri.fromParts("tel", phone, null));
                            startActivity(intent);
                        }
                    });

                    Button btnReportDelay = findViewById(R.id.btn_report_delay);
                    Button btnReportIssue = findViewById(R.id.btn_report_issue);
                    if (btnReportDelay != null) {
                        btnReportDelay.setOnClickListener(new View.OnClickListener() {
                            @Override
                            public void onClick(View v) {
                                showReportDelayDialog(orderId);
                            }
                        });
                    }
                    if (btnReportIssue != null) {
                        btnReportIssue.setOnClickListener(new View.OnClickListener() {
                            @Override
                            public void onClick(View v) {
                                showReportIssueDialog(orderId);
                            }
                        });
                    }
//                    delivered_bt.setOnClickListener(new View.OnClickListener() {
//                        @Override
//                        public void onClick(View view) {
//                            // custom dialog
//                            int status = 1;
//                            final AlertDialog.Builder alertDialog = new AlertDialog.Builder(view.getRootView().getContext())
//                                    .setMessage("Are you sure you want to mark as Delivered")
//                                    .setCancelable(false)
//                                    .setPositiveButton("Yes", new DialogInterface
//                                            .OnClickListener() {
//                                        @Override
//                                        public void onClick(DialogInterface dialog, int which) {
//
//                                            AlertDialog.Builder builder = new AlertDialog.Builder(getApplicationContext());
//                                            LayoutInflater inflater = getLayoutInflater();
//                                            View dialogView = inflater.inflate(R.layout.activity_verify_otp, null);
//                                            AlertDialog alertDialog1 = builder.create();
//                                            alertDialog1.show();
//
////                                            if (InternetConnection.checkConnection(getApplicationContext())) {
////                                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
////                                                Call<UpdateStatusModel> call = apiService.updatestatus(OrderID, "Bearer " + token, status);
////                                                Log.d("response.code", "" + call.toString());
////                                                Log.d("response.code", call.request().toString());
////
////                                                call.enqueue(new Callback<UpdateStatusModel>() {
////                                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
////                                                    @Override
////                                                    public void onResponse(Call<UpdateStatusModel> call, retrofit2.Response<UpdateStatusModel> response) {
////                                                        UpdateStatusModel deleteAddresModel = response.body();
////                                                        Log.d("response.code", "" + response.code());
////                                                        if (response.code() == 200) {
////                                                            if (deleteAddresModel.getStatus() == 1) {
////                                                                finish();
////                                                                Toast.makeText(getApplicationContext(), deleteAddresModel.getMessage(), Toast.LENGTH_LONG).show();
////
////                                                            }
////
////
////                                                        } else if (response.code() == 400) {
////
////                                                        } else if (response.code() == 401) {
////
////                                                        }
////
////
////                                                    }
////
////                                                    @Override
////                                                    public void onFailure(Call<UpdateStatusModel> call, Throwable t) {
////
////                                                        Toast.makeText(getApplicationContext(), t.getMessage(), Toast.LENGTH_LONG).show();
////
////                                                    }
////                                                });
////                                            } else {
////                                                Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
////                                            }
////
//                                        }
//                                    });
//                            alertDialog.setNegativeButton("No", new DialogInterface.OnClickListener() {
//                                @Override
//                                public void onClick(DialogInterface dialog, int which) {
//                                    dialog.cancel();
//                                }
//                            });
//
//
//                            AlertDialog alert = alertDialog.create();
//                            alert.show();
//                        }
//                    });


                    pickupSlideButton.setOnSlideCompleteListener(new SlideToActView.OnSlideCompleteListener() {
                        @Override
                        public void onSlideComplete(SlideToActView view) {
                            updateOrderStatusDirectly(orderId, 5);

                            // Optional: reset the slider after a short delay
                            new Handler().postDelayed(() -> view.resetSlider(), 1000);
                        }

                        private void updateOrderStatusDirectly(String orderID, int status) {
                            ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
                            progressDialog.setMessage("Updating status...");
                            progressDialog.setCancelable(false);
                            progressDialog.show();

                            if (InternetConnection.checkConnection(getApplicationContext())) {
                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
                                Call<UpdateStatusModel> call = apiService.updatestatus(orderId, "Bearer " + token, status, UserID);

                                call.enqueue(new Callback<UpdateStatusModel>() {
                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
                                    @Override
                                    public void onResponse(Call<UpdateStatusModel> call, retrofit2.Response<UpdateStatusModel> response) {
                                        progressDialog.dismiss();
                                        UpdateStatusModel updateStatusModel = response.body();
                                        Log.d("UpdateStatus", "Response code: " + response.code());

                                        if (response.code() == 200) {
                                            if (updateStatusModel != null && updateStatusModel.getStatus() == 1) {
                                                Toast.makeText(getApplicationContext(), updateStatusModel.getMessage(), Toast.LENGTH_LONG).show();
                                                getorderDetails();
                                            } else {
                                                Toast.makeText(getApplicationContext(), "Failed to update status", Toast.LENGTH_LONG).show();
                                            }
                                        } else if (response.code() == 400) {
                                            Toast.makeText(getApplicationContext(), "Bad request", Toast.LENGTH_LONG).show();
                                        } else if (response.code() == 401) {
                                            Toast.makeText(getApplicationContext(), "Unauthorized", Toast.LENGTH_LONG).show();
                                        }
                                    }

                                    @Override
                                    public void onFailure(Call<UpdateStatusModel> call, Throwable t) {
                                        progressDialog.dismiss();
                                        Toast.makeText(getApplicationContext(), t.getMessage(), Toast.LENGTH_LONG).show();
                                    }
                                });
                            } else {
                                progressDialog.dismiss();
                                Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
                            }
                        }
                    });

//===============================================PICK UP BTN ONCLIK===================//
//                    pickup_bt.setOnClickListener(new View.OnClickListener() {
//                        @Override
//                        public void onClick(View v) {
//                            updateOrderStatusDirectly(orderId, 5);
//                        }
//
//                        private void updateOrderStatusDirectly(String orderID, int status) {
//                            ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
//                            progressDialog.setMessage("Updating status...");
//                            progressDialog.setCancelable(false);
//                            progressDialog.show();
//
//                            if (InternetConnection.checkConnection(getApplicationContext())) {
//                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
//                                Call<UpdateStatusModel> call = apiService.updatestatus(orderId, "Bearer " + token, status, UserID);
//
//                                call.enqueue(new Callback<UpdateStatusModel>() {
//                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
//                                    @Override
//                                    public void onResponse(Call<UpdateStatusModel> call, retrofit2.Response<UpdateStatusModel> response) {
//                                        progressDialog.dismiss();
//                                        UpdateStatusModel updateStatusModel = response.body();
//                                        Log.d("UpdateStatus", "Response code: " + response.code());
//
//                                        if (response.code() == 200) {
//                                            if (updateStatusModel != null && updateStatusModel.getStatus() == 1) {
//                                                Toast.makeText(getApplicationContext(), updateStatusModel.getMessage(), Toast.LENGTH_LONG).show();
//                                                getorderDetails();
////                                                finish();
//                                            } else {
//                                                Toast.makeText(getApplicationContext(), "Failed to update status", Toast.LENGTH_LONG).show();
//                                            }
//                                        } else if (response.code() == 400) {
//                                            Toast.makeText(getApplicationContext(), "Bad request", Toast.LENGTH_LONG).show();
//                                        } else if (response.code() == 401) {
//                                            Toast.makeText(getApplicationContext(), "Unauthorized", Toast.LENGTH_LONG).show();
//                                        }
//                                    }
//
//                                    @Override
//                                    public void onFailure(Call<UpdateStatusModel> call, Throwable t) {
//                                        progressDialog.dismiss();
//                                        Toast.makeText(getApplicationContext(), t.getMessage(), Toast.LENGTH_LONG).show();
//                                    }
//                                });
//                            } else {
//                                progressDialog.dismiss();
//                                Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
//                            }
//                        }
//                    });


                    ///////////////////////----------ARRIVED BTN____----------------------------///
//                    arrived_btn.setOnClickListener(new View.OnClickListener() {
//                        @Override
//                        public void onClick(View v) {
//                            updateOrderStatusDirectly(orderId, 7);
//                        }
//
//                        private void updateOrderStatusDirectly(String orderID, int status) {
//                            ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
//                            progressDialog.setMessage("Updating status...");
//                            progressDialog.setCancelable(false);
//                            progressDialog.show();
//
//                            if (InternetConnection.checkConnection(getApplicationContext())) {
//                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
//                                Call<UpdateStatusModel> call = apiService.updatestatus(orderId, "Bearer " + token, status, UserID);
//
//                                call.enqueue(new Callback<UpdateStatusModel>() {
//                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
//                                    @Override
//                                    public void onResponse(Call<UpdateStatusModel> call, retrofit2.Response<UpdateStatusModel> response) {
//                                        progressDialog.dismiss();
//                                        UpdateStatusModel updateStatusModel = response.body();
//                                        Log.d("UpdateStatus", "Response code: " + response.code());
//
//                                        if (response.code() == 200) {
//                                            if (updateStatusModel != null && updateStatusModel.getStatus() == 1) {
//                                                Toast.makeText(getApplicationContext(), updateStatusModel.getMessage(), Toast.LENGTH_LONG).show();
//                                                sendOtp(orderID);
//                                                getorderDetails();
////                                                finish();
//                                            } else {
//                                                Toast.makeText(getApplicationContext(), "Failed to update status", Toast.LENGTH_LONG).show();
//                                            }
//                                        } else if (response.code() == 400) {
//                                            Toast.makeText(getApplicationContext(), "Bad request", Toast.LENGTH_LONG).show();
//                                        } else if (response.code() == 401) {
//                                            Toast.makeText(getApplicationContext(), "Unauthorized", Toast.LENGTH_LONG).show();
//                                        }
//                                    }
//
//                                    @Override
//                                    public void onFailure(Call<UpdateStatusModel> call, Throwable t) {
//                                        progressDialog.dismiss();
//                                        Toast.makeText(getApplicationContext(), t.getMessage(), Toast.LENGTH_LONG).show();
//                                    }
//                                });
//                            } else {
//                                progressDialog.dismiss();
//                                Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
//                            }
//                        }
//
//                        private void sendOtp(String orderId) {
//                            {
//                                ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
//                                progressDialog.setMessage("Loading ...");
//                                progressDialog.setCancelable(false);
//                                progressDialog.show();
//                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
//                                Call<SendotpDeo> call = apiService.sentotpuser(orderId, "Bearer " + token);
//                                call.enqueue(new Callback<SendotpDeo>() {
//                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
//                                    @Override
//                                    public void onResponse(Call<SendotpDeo> call, retrofit2.Response<SendotpDeo> response) {
//                                        SendotpDeo loginDeo = response.body();
//                                        Log.d("suresh", "" + response);
//                                        if (response.code() == 200) {
//                                            if (loginDeo.getStatus() == 1) {
//                                                progressDialog.dismiss();
//                                                Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
////                                                showCustomDialog();
//                                            } else {
//                                                progressDialog.dismiss();
//                                                Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//
//                                            }
//
//                                        } else {
//                                            progressDialog.dismiss();
////                    Toast.makeText(SentotpActivity.this, ""+loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//
//                                        }
//
//                                    }
//
//
//                                    @Override
//                                    public void onFailure(Call<SendotpDeo> call, Throwable t) {
//                                        progressDialog.dismiss();
//                                        Toast.makeText(OrderDetailsActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();
//
//                                    }
//                                });
//
//                            }
//                        }
//                    });

                    arrivedSlideButton.setOnSlideCompleteListener(new SlideToActView.OnSlideCompleteListener() {
                        @Override
                        public void onSlideComplete(SlideToActView view) {
                            updateOrderStatusDirectly(orderId, 7);

                            // Optional: reset slider
                            new Handler().postDelayed(() -> view.resetSlider(), 1000);
                        }

                        private void updateOrderStatusDirectly(String orderID, int status) {
                            ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
                            progressDialog.setMessage("Updating status...");
                            progressDialog.setCancelable(false);
                            progressDialog.show();

                            if (InternetConnection.checkConnection(getApplicationContext())) {
                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
                                Call<UpdateStatusModel> call = apiService.updatestatus(orderId, "Bearer " + token, status, UserID);

                                call.enqueue(new Callback<UpdateStatusModel>() {
                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
                                    @Override
                                    public void onResponse(Call<UpdateStatusModel> call, retrofit2.Response<UpdateStatusModel> response) {
                                        progressDialog.dismiss();
                                        UpdateStatusModel updateStatusModel = response.body();
                                        Log.d("UpdateStatus", "Response code: " + response.code());

                                        if (response.code() == 200) {
                                            if (updateStatusModel != null && updateStatusModel.getStatus() == 1) {
                                                Toast.makeText(getApplicationContext(), updateStatusModel.getMessage(), Toast.LENGTH_LONG).show();
                                                sendOtp(orderID);
                                                getorderDetails();
                                            } else {
                                                Toast.makeText(getApplicationContext(), "Failed to update status", Toast.LENGTH_LONG).show();
                                            }
                                        } else if (response.code() == 400) {
                                            Toast.makeText(getApplicationContext(), "Bad request", Toast.LENGTH_LONG).show();
                                        } else if (response.code() == 401) {
                                            Toast.makeText(getApplicationContext(), "Unauthorized", Toast.LENGTH_LONG).show();
                                        }
                                    }

                                    @Override
                                    public void onFailure(Call<UpdateStatusModel> call, Throwable t) {
                                        progressDialog.dismiss();
                                        Toast.makeText(getApplicationContext(), t.getMessage(), Toast.LENGTH_LONG).show();
                                    }
                                });
                            } else {
                                progressDialog.dismiss();
                                Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
                            }
                        }

                        private void sendOtp(String orderId) {
                            ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
                            progressDialog.setMessage("Loading ...");
                            progressDialog.setCancelable(false);
                            progressDialog.show();

                            APIService apiService = RetrofitClient.getClient().create(APIService.class);
                            Call<SendotpDeo> call = apiService.sentotpuser(orderId, "Bearer " + token);
                            call.enqueue(new Callback<SendotpDeo>() {
                                @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
                                @Override
                                public void onResponse(Call<SendotpDeo> call, retrofit2.Response<SendotpDeo> response) {
                                    progressDialog.dismiss();
                                    SendotpDeo loginDeo = response.body();
                                    if (response.code() == 200 && loginDeo != null) {
                                        Toast.makeText(OrderDetailsActivity.this, loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
                                        arrivedSlideButton.setVisibility(View.GONE);
                                    } else {
                                        Toast.makeText(OrderDetailsActivity.this, "Failed to send OTP", Toast.LENGTH_SHORT).show();
                                    }
                                }

                                @Override
                                public void onFailure(Call<SendotpDeo> call, Throwable t) {
                                    progressDialog.dismiss();
                                    Toast.makeText(OrderDetailsActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();
                                }
                            });
                        }
                    });

                    deliveredSlideButton.setOnSlideCompleteListener(new SlideToActView.OnSlideCompleteListener() {
                        @Override
                        public void onSlideComplete(SlideToActView view) {
                            AlertDialog.Builder alertDialog = new AlertDialog.Builder(view.getContext())
                                    .setMessage("Are you sure you want to mark as Delivered")
                                    .setCancelable(false)
                                    .setPositiveButton("Yes", new DialogInterface.OnClickListener() {
                                        @Override
                                        public void onClick(DialogInterface dialog, int which) {
                                            // Create and show the custom dialog

                                            showCustomDialog();
//
//                                            sendOtp(orderId);

                                        }
                                    })
                                    .setNegativeButton("No", new DialogInterface.OnClickListener() {
                                        @Override
                                        public void onClick(DialogInterface dialog, int which) {
                                            dialog.cancel();

                                        }
                                    });

                            AlertDialog alert = alertDialog.create();
                            alert.show();
                            // Optional: reset the slider after a short delay
                            new Handler().postDelayed(() -> view.resetSlider(), 1000);
                        }

                        private void resendsendOtp(String orderId) {
                            {
                                ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
                                progressDialog.setMessage("Loading ...");
                                progressDialog.setCancelable(false);
                                progressDialog.show();
                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
                                Call<SendotpDeo> call = apiService.sentotpuser(orderId, "Bearer " + token);
                                call.enqueue(new Callback<SendotpDeo>() {
                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
                                    @Override
                                    public void onResponse(Call<SendotpDeo> call, retrofit2.Response<SendotpDeo> response) {
                                        SendotpDeo loginDeo = response.body();
                                        Log.d("suresh", "" + response);
                                        if (response.code() == 200) {
                                            if (loginDeo.getStatus() == 1) {
                                                progressDialog.dismiss();
                                                Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();

                                            } else {
                                                progressDialog.dismiss();
                                                Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();

                                            }

                                        } else {
                                            progressDialog.dismiss();
//                    Toast.makeText(SentotpActivity.this, ""+loginDeo.getMessage(), Toast.LENGTH_SHORT).show();

                                        }

                                    }


                                    @Override
                                    public void onFailure(Call<SendotpDeo> call, Throwable t) {
                                        progressDialog.dismiss();
                                        Toast.makeText(OrderDetailsActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();

                                    }
                                });

                            }
                        }

//                        private void sendOtp(String orderId) {
//                            {
//                                ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
//                                progressDialog.setMessage("Loading ...");
//                                progressDialog.setCancelable(false);
//                                progressDialog.show();
//                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
//                                Call<SendotpDeo> call = apiService.sentotpuser(orderId, "Bearer " + token);
//                                call.enqueue(new Callback<SendotpDeo>() {
//                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
//                                    @Override
//                                    public void onResponse(Call<SendotpDeo> call, retrofit2.Response<SendotpDeo> response) {
//                                        SendotpDeo loginDeo = response.body();
//                                        Log.d("suresh", "" + response);
//                                        if (response.code() == 200) {
//                                            if (loginDeo.getStatus() == 1) {
//                                                progressDialog.dismiss();
////                                                Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//                                                showCustomDialog();
//                                            } else {
//                                                progressDialog.dismiss();
//                                                Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//
//                                            }
//
//                                        } else {
//                                            progressDialog.dismiss();
////                    Toast.makeText(SentotpActivity.this, ""+loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//
//                                        }
//
//                                    }
//
//
//                                    @Override
//                                    public void onFailure(Call<SendotpDeo> call, Throwable t) {
//                                        progressDialog.dismiss();
//                                        Toast.makeText(OrderDetailsActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();
//
//                                    }
//                                });
//
//                            }
//                        }

                        private void showCustomDialog() {
                            AlertDialog.Builder builder = new AlertDialog.Builder(OrderDetailsActivity.this);
                            LayoutInflater inflater = LayoutInflater.from(OrderDetailsActivity.this);
                            View dialogView = inflater.inflate(R.layout.activity_verify_otp_user, null);
                            builder.setView(dialogView);
                            builder.setCancelable(false);

                            TextView getmobilenum_txt = dialogView.findViewById(R.id.getmobilenum_txt);
                            ImageView back_img = dialogView.findViewById(R.id.back_img);

                            Button verifyotp_btn = dialogView.findViewById(R.id.verifyotp_btn);
                            timer_OTP = dialogView.findViewById(R.id.otp_screen_coundowntimer);
                            EditText et_otpInd0 = dialogView.findViewById(R.id.et_Value1);
                            EditText et_otpInd1 = dialogView.findViewById(R.id.et_Value2);
                            EditText et_otpInd2 = dialogView.findViewById(R.id.et_Value3);
                            EditText et_otpInd3 = dialogView.findViewById(R.id.et_Value4);
                            verifyotp_btn.setOnClickListener(new View.OnClickListener() {
                                @Override
                                public void onClick(View view) {
                                    String enterdOtp = null;
                                    String ind0 = et_otpInd0.getText().toString().trim();
                                    String ind1 = et_otpInd1.getText().toString().trim();
                                    String ind2 = et_otpInd2.getText().toString().trim();
                                    String ind3 = et_otpInd3.getText().toString().trim();
                                    if (ind0.isEmpty() && ind1.isEmpty() && ind2.isEmpty() && ind3.isEmpty()) {
                                        Toast.makeText(OrderDetailsActivity.this, "Please enter OTP", Toast.LENGTH_SHORT).show();
                                    } else if (ind0 != null && ind1 != null && ind2 != null && ind3 != null) {
                                        if (CommonUtilities.isNetworkConnectionAvailable(OrderDetailsActivity.this)) {
                                            enterdOtp = ind0 + ind1 + ind2 + ind3;
                                            System.out.println("ENTERED OTP >>> " + enterdOtp);
                                            VerifyLoginOTP(enterdOtp, OrderID);
                                        } else {
                                            Toast.makeText(OrderDetailsActivity.this, "" + getString(R.string.str_no_network), Toast.LENGTH_SHORT).show();
                                        }
                                    }
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
                            getmobilenum_txt.setText(MobileNumber);
                            AlertDialog customDialog = builder.create();
                            back_img.setOnClickListener(new View.OnClickListener() {
                                @Override
                                public void onClick(View view) {

                                    if (countDownTimer != null) {
                                        countDownTimer.cancel();
                                        countDownTimer = null;
                                    }
                                    customDialog.dismiss();
                                    timer_OTP.setText("Resend");
                                    timer_OTP.setClickable(true);

                                }
                            });
                            customDialog.show();
                        }

                        private void reverseTimer() {
                            countDownTimer = new CountDownTimer(30000, 1000) {
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
                                            if (CommonUtilities.isNetworkConnectionAvailable(OrderDetailsActivity.this)) {
                                                reverseTimer2();
                                                if (InternetConnection.checkConnection(getApplicationContext())) {
                                                    resendsendOtp(orderId);
                                                } else {
                                                    Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
                                                }
                                                timer_OTP.setClickable(false);
                                            } else {
                                                Toast.makeText(OrderDetailsActivity.this, "" + getString(R.string.str_no_network), Toast.LENGTH_SHORT).show();
                                            }
                                        }
                                    });
                                }

                            }.start();

                        }

                        private void reverseTimer2() {
                            countDownTimer = new CountDownTimer(30000, 1000) {
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
                                                    if (CommonUtilities.isNetworkConnectionAvailable(OrderDetailsActivity.this)) {
                                                        reverseTimer();
                                                        resendsendOtp(orderId);
                                                    } else {
                                                        Toast.makeText(OrderDetailsActivity.this, "" + getString(R.string.str_no_network), Toast.LENGTH_SHORT).show();
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            }.start();
                        }

                        private void VerifyLoginOTP(String enterdOtp, String orderID) {
                            ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
                            progressDialog.setMessage("Loading ...");
                            progressDialog.setCancelable(false);
                            progressDialog.show();
                            APIService apiService = RetrofitClient.getClient().create(APIService.class);
                            Call<SendotpDeo> call = apiService.verifyotp_order(orderId, enterdOtp, "Bearer " + token);
                            call.enqueue(new Callback<SendotpDeo>() {
                                @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
                                @Override
                                public void onResponse(Call<SendotpDeo> call, retrofit2.Response<SendotpDeo> response) {
                                    SendotpDeo loginDeo = response.body();
                                    Log.d("suresh", "" + response);
                                    if (response.code() == 200) {
                                        if (loginDeo.getStatus() == 1) {
                                            progressDialog.dismiss();
                                            Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();


                                            int status = 1;

                                            if (InternetConnection.checkConnection(getApplicationContext())) {
                                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
                                                Call<UpdateStatusModel> call1 = apiService.updatestatus(OrderID, "Bearer " + token, status, UserID);


                                                call1.enqueue(new Callback<UpdateStatusModel>() {
                                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
                                                    @Override
                                                    public void onResponse(Call<UpdateStatusModel> call, retrofit2.Response<UpdateStatusModel> response) {
                                                        UpdateStatusModel deleteAddresModel = response.body();
                                                        Log.d("response.code", "" + response.code());
                                                        if (response.code() == 200) {
                                                            if (deleteAddresModel.getStatus() == 1) {
                                                                Toast.makeText(getApplicationContext(), deleteAddresModel.getMessage(), Toast.LENGTH_LONG).show();
                                                                finish();

                                                            }


                                                        } else if (response.code() == 400) {

                                                        } else if (response.code() == 401) {

                                                        }


                                                    }

                                                    @Override
                                                    public void onFailure(Call<UpdateStatusModel> call, Throwable t) {

                                                        Toast.makeText(getApplicationContext(), t.getMessage(), Toast.LENGTH_LONG).show();

                                                    }
                                                });
                                            } else {
                                                Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
                                            }
                                        } else {
                                            progressDialog.dismiss();
                                            Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();

                                        }

                                    } else {
                                        progressDialog.dismiss();
//                    Toast.makeText(SentotpActivity.this, ""+loginDeo.getMessage(), Toast.LENGTH_SHORT).show();

                                    }

                                }


                                @Override
                                public void onFailure(Call<SendotpDeo> call, Throwable t) {
                                    progressDialog.dismiss();
                                    Toast.makeText(OrderDetailsActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();

                                }
                            });

                        }


                    });


                    ////////////-----------DELIVERED BTN===============///----
//                    delivered_bt.setOnClickListener(new View.OnClickListener() {
//                        @Override
//                        public void onClick(View view) {
//                            // First AlertDialog to confirm marking as delivered
//                            AlertDialog.Builder alertDialog = new AlertDialog.Builder(view.getContext())
//                                    .setMessage("Are you sure you want to mark as Delivered")
//                                    .setCancelable(false)
//                                    .setPositiveButton("Yes", new DialogInterface.OnClickListener() {
//                                        @Override
//                                        public void onClick(DialogInterface dialog, int which) {
//                                            // Create and show the custom dialog
//
//                                            showCustomDialog();
////
////                                            sendOtp(orderId);
//
//                                        }
//                                    })
//                                    .setNegativeButton("No", new DialogInterface.OnClickListener() {
//                                        @Override
//                                        public void onClick(DialogInterface dialog, int which) {
//                                            dialog.cancel();
//
//                                        }
//                                    });
//
//                            AlertDialog alert = alertDialog.create();
//                            alert.show();
//                        }
//
//                        private void resendsendOtp(String orderId) {
//                            {
//                                ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
//                                progressDialog.setMessage("Loading ...");
//                                progressDialog.setCancelable(false);
//                                progressDialog.show();
//                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
//                                Call<SendotpDeo> call = apiService.sentotpuser(orderId, "Bearer " + token);
//                                call.enqueue(new Callback<SendotpDeo>() {
//                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
//                                    @Override
//                                    public void onResponse(Call<SendotpDeo> call, retrofit2.Response<SendotpDeo> response) {
//                                        SendotpDeo loginDeo = response.body();
//                                        Log.d("suresh", "" + response);
//                                        if (response.code() == 200) {
//                                            if (loginDeo.getStatus() == 1) {
//                                                progressDialog.dismiss();
//                                                Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//
//                                            } else {
//                                                progressDialog.dismiss();
//                                                Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//
//                                            }
//
//                                        } else {
//                                            progressDialog.dismiss();
////                    Toast.makeText(SentotpActivity.this, ""+loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//
//                                        }
//
//                                    }
//
//
//                                    @Override
//                                    public void onFailure(Call<SendotpDeo> call, Throwable t) {
//                                        progressDialog.dismiss();
//                                        Toast.makeText(OrderDetailsActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();
//
//                                    }
//                                });
//
//                            }
//                        }
//
////                        private void sendOtp(String orderId) {
////                            {
////                                ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
////                                progressDialog.setMessage("Loading ...");
////                                progressDialog.setCancelable(false);
////                                progressDialog.show();
////                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
////                                Call<SendotpDeo> call = apiService.sentotpuser(orderId, "Bearer " + token);
////                                call.enqueue(new Callback<SendotpDeo>() {
////                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
////                                    @Override
////                                    public void onResponse(Call<SendotpDeo> call, retrofit2.Response<SendotpDeo> response) {
////                                        SendotpDeo loginDeo = response.body();
////                                        Log.d("suresh", "" + response);
////                                        if (response.code() == 200) {
////                                            if (loginDeo.getStatus() == 1) {
////                                                progressDialog.dismiss();
//////                                                Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
////                                                showCustomDialog();
////                                            } else {
////                                                progressDialog.dismiss();
////                                                Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
////
////                                            }
////
////                                        } else {
////                                            progressDialog.dismiss();
//////                    Toast.makeText(SentotpActivity.this, ""+loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
////
////                                        }
////
////                                    }
////
////
////                                    @Override
////                                    public void onFailure(Call<SendotpDeo> call, Throwable t) {
////                                        progressDialog.dismiss();
////                                        Toast.makeText(OrderDetailsActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();
////
////                                    }
////                                });
////
////                            }
////                        }
//
//                        private void showCustomDialog() {
//                            AlertDialog.Builder builder = new AlertDialog.Builder(OrderDetailsActivity.this);
//                            LayoutInflater inflater = LayoutInflater.from(OrderDetailsActivity.this);
//                            View dialogView = inflater.inflate(R.layout.activity_verify_otp_user, null);
//                            builder.setView(dialogView);
//                            builder.setCancelable(false);
//
//                            TextView getmobilenum_txt = dialogView.findViewById(R.id.getmobilenum_txt);
//                            ImageView back_img = dialogView.findViewById(R.id.back_img);
//
//                            Button verifyotp_btn = dialogView.findViewById(R.id.verifyotp_btn);
//                            timer_OTP = dialogView.findViewById(R.id.otp_screen_coundowntimer);
//                            EditText et_otpInd0 = dialogView.findViewById(R.id.et_Value1);
//                            EditText et_otpInd1 = dialogView.findViewById(R.id.et_Value2);
//                            EditText et_otpInd2 = dialogView.findViewById(R.id.et_Value3);
//                            EditText et_otpInd3 = dialogView.findViewById(R.id.et_Value4);
//                            verifyotp_btn.setOnClickListener(new View.OnClickListener() {
//                                @Override
//                                public void onClick(View view) {
//                                    String enterdOtp = null;
//                                    String ind0 = et_otpInd0.getText().toString().trim();
//                                    String ind1 = et_otpInd1.getText().toString().trim();
//                                    String ind2 = et_otpInd2.getText().toString().trim();
//                                    String ind3 = et_otpInd3.getText().toString().trim();
//                                    if (ind0.isEmpty() && ind1.isEmpty() && ind2.isEmpty() && ind3.isEmpty()) {
//                                        Toast.makeText(OrderDetailsActivity.this, "Please enter OTP", Toast.LENGTH_SHORT).show();
//                                    } else if (ind0 != null && ind1 != null && ind2 != null && ind3 != null) {
//                                        if (CommonUtilities.isNetworkConnectionAvailable(OrderDetailsActivity.this)) {
//                                            enterdOtp = ind0 + ind1 + ind2 + ind3;
//                                            System.out.println("ENTERED OTP >>> " + enterdOtp);
//                                            VerifyLoginOTP(enterdOtp, OrderID);
//                                        } else {
//                                            Toast.makeText(OrderDetailsActivity.this, "" + getString(R.string.str_no_network), Toast.LENGTH_SHORT).show();
//                                        }
//                                    }
//                                }
//                            });
//                            et_otpInd0.addTextChangedListener(new TextWatcher() {
//                                @Override
//                                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
//
//                                }
//
//                                @Override
//                                public void onTextChanged(CharSequence s, int start, int before, int count) {
//                                    if (count == 1) {
//                                        et_otpInd1.requestFocus();
//                                    } else {
//                                        et_otpInd0.requestFocus();
//                                    }
//                                }
//
//                                @Override
//                                public void afterTextChanged(Editable s) {
//                                }
//
//                            });
//                            et_otpInd1.addTextChangedListener(new TextWatcher() {
//                                @Override
//                                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
//
//                                }
//
//                                @Override
//                                public void onTextChanged(CharSequence s, int start, int before, int count) {
//                                    if (count == 1) {
//                                        et_otpInd2.requestFocus();
//                                    } else {
//                                        et_otpInd0.requestFocus();
//                                    }
//                                }
//
//                                @Override
//                                public void afterTextChanged(Editable s) {
//
//                                }
//                            });
//
//                            et_otpInd1.setOnKeyListener(new View.OnKeyListener() {
//                                @Override
//                                public boolean onKey(View v, int keyCode, KeyEvent event) {
//                                    if (keyCode == KeyEvent.KEYCODE_DEL) {
//                                        if (et_otpInd1.getText().toString().length() == 0) {
//                                            et_otpInd0.requestFocus();
//                                        }
//                                    }
//                                    return false;
//                                }
//                            });
//                            et_otpInd2.setOnKeyListener(new View.OnKeyListener() {
//                                @Override
//                                public boolean onKey(View v, int keyCode, KeyEvent event) {
//                                    if (keyCode == KeyEvent.KEYCODE_DEL) {
//                                        if (et_otpInd2.getText().toString().length() == 0) {
//                                            et_otpInd1.requestFocus();
//                                        }
//                                    }
//                                    return false;
//                                }
//                            });
//                            et_otpInd3.setOnKeyListener(new View.OnKeyListener() {
//                                @Override
//                                public boolean onKey(View v, int keyCode, KeyEvent event) {
//                                    if (keyCode == KeyEvent.KEYCODE_DEL) {
//                                        if (et_otpInd3.getText().toString().length() == 0) {
//                                            et_otpInd2.requestFocus();
//                                        }
//                                    }
//                                    return false;
//                                }
//                            });
//
//                            et_otpInd2.addTextChangedListener(new TextWatcher() {
//                                @Override
//                                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
//
//                                }
//
//                                @Override
//                                public void onTextChanged(CharSequence s, int start, int before, int count) {
//                                    if (count == 1) {
//                                        et_otpInd3.requestFocus();
//                                    } else {
//                                        et_otpInd1.requestFocus();
//                                    }
//                                }
//
//                                @Override
//                                public void afterTextChanged(Editable s) {
//
//                                }
//                            });
//                            et_otpInd3.addTextChangedListener(new TextWatcher() {
//                                @Override
//                                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
//
//                                }
//
//                                @Override
//                                public void onTextChanged(CharSequence s, int start, int before, int count) {
//                                    if (count == 0) {
//                                        et_otpInd2.requestFocus();
//                                    }
//
//                                }
//
//                                @Override
//                                public void afterTextChanged(Editable s) {
//
//                                }
//                            });
//                            reverseTimer();
//                            getmobilenum_txt.setText(MobileNumber);
//                            AlertDialog customDialog = builder.create();
//                            back_img.setOnClickListener(new View.OnClickListener() {
//                                @Override
//                                public void onClick(View view) {
//
//                                    if (countDownTimer != null) {
//                                        countDownTimer.cancel();
//                                        countDownTimer = null;
//                                    }
//                                    customDialog.dismiss();
//                                    timer_OTP.setText("Resend");
//                                    timer_OTP.setClickable(true);
//
//                                }
//                            });
//                            customDialog.show();
//                        }
//
//                        private void reverseTimer() {
//                            countDownTimer = new CountDownTimer(30000, 1000) {
//                                @SuppressLint("SetTextI18n")
//                                public void onTick(long millisUntilFinished) {
//                                    long timer = millisUntilFinished / 1000;
//                                    String valueTimer = String.valueOf(timer);
//                                    timer_OTP.setText(valueTimer);
//                                    timer_OTP.setClickable(false);
//                                }
//
//                                public void onFinish() {
//                                    timer_OTP.setText(" Resend ");
//                                    timer_OTP.setClickable(true);
//                                    timer_OTP.setOnClickListener(new View.OnClickListener() {
//                                        @Override
//                                        public void onClick(View v) {
//                                            if (CommonUtilities.isNetworkConnectionAvailable(OrderDetailsActivity.this)) {
//                                                reverseTimer2();
//                                                if (InternetConnection.checkConnection(getApplicationContext())) {
//                                                    resendsendOtp(orderId);
//                                                } else {
//                                                    Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
//                                                }
//                                                timer_OTP.setClickable(false);
//                                            } else {
//                                                Toast.makeText(OrderDetailsActivity.this, "" + getString(R.string.str_no_network), Toast.LENGTH_SHORT).show();
//                                            }
//                                        }
//                                    });
//                                }
//
//                            }.start();
//
//                        }
//
//                        private void reverseTimer2() {
//                            countDownTimer = new CountDownTimer(30000, 1000) {
//                                @SuppressLint("SetTextI18n")
//                                public void onTick(long millisUntilFinished) {
//                                    long timer = millisUntilFinished / 1000;
//                                    String valueTimer = String.valueOf(timer);
//                                    timer_OTP.setText(valueTimer);
//                                    timer_OTP.setClickable(false);
//                                }
//
//                                public void onFinish() {
//                                    timer_OTP.setText(" Resend ");
//                                    timer_OTP.setClickable(true);
//                                    timer_OTP.setOnClickListener(new View.OnClickListener() {
//                                        @Override
//                                        public void onClick(View v) {
//                                            timer_OTP.setOnClickListener(new View.OnClickListener() {
//                                                @Override
//                                                public void onClick(View v) {
//                                                    if (CommonUtilities.isNetworkConnectionAvailable(OrderDetailsActivity.this)) {
//                                                        reverseTimer();
//                                                        resendsendOtp(orderId);
//                                                    } else {
//                                                        Toast.makeText(OrderDetailsActivity.this, "" + getString(R.string.str_no_network), Toast.LENGTH_SHORT).show();
//                                                    }
//                                                }
//                                            });
//                                        }
//                                    });
//                                }
//                            }.start();
//                        }
//
//                        private void VerifyLoginOTP(String enterdOtp, String orderID) {
//                            ProgressDialog progressDialog = new ProgressDialog(OrderDetailsActivity.this);
//                            progressDialog.setMessage("Loading ...");
//                            progressDialog.setCancelable(false);
//                            progressDialog.show();
//                            APIService apiService = RetrofitClient.getClient().create(APIService.class);
//                            Call<SendotpDeo> call = apiService.verifyotp_order(orderId, enterdOtp, "Bearer " + token);
//                            call.enqueue(new Callback<SendotpDeo>() {
//                                @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
//                                @Override
//                                public void onResponse(Call<SendotpDeo> call, retrofit2.Response<SendotpDeo> response) {
//                                    SendotpDeo loginDeo = response.body();
//                                    Log.d("suresh", "" + response);
//                                    if (response.code() == 200) {
//                                        if (loginDeo.getStatus() == 1) {
//                                            progressDialog.dismiss();
//                                            Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//
//
//                                            int status = 1;
//
//                                            if (InternetConnection.checkConnection(getApplicationContext())) {
//                                                APIService apiService = RetrofitClient.getClient().create(APIService.class);
//                                                Call<UpdateStatusModel> call1 = apiService.updatestatus(OrderID, "Bearer " + token, status, UserID);
//
//
//                                                call1.enqueue(new Callback<UpdateStatusModel>() {
//                                                    @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
//                                                    @Override
//                                                    public void onResponse(Call<UpdateStatusModel> call, retrofit2.Response<UpdateStatusModel> response) {
//                                                        UpdateStatusModel deleteAddresModel = response.body();
//                                                        Log.d("response.code", "" + response.code());
//                                                        if (response.code() == 200) {
//                                                            if (deleteAddresModel.getStatus() == 1) {
//                                                                Toast.makeText(getApplicationContext(), deleteAddresModel.getMessage(), Toast.LENGTH_LONG).show();
//                                                                finish();
//
//                                                            }
//
//
//                                                        } else if (response.code() == 400) {
//
//                                                        } else if (response.code() == 401) {
//
//                                                        }
//
//
//                                                    }
//
//                                                    @Override
//                                                    public void onFailure(Call<UpdateStatusModel> call, Throwable t) {
//
//                                                        Toast.makeText(getApplicationContext(), t.getMessage(), Toast.LENGTH_LONG).show();
//
//                                                    }
//                                                });
//                                            } else {
//                                                Toast.makeText(getApplicationContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
//                                            }
//                                        } else {
//                                            progressDialog.dismiss();
//                                            Toast.makeText(OrderDetailsActivity.this, "" + loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//
//                                        }
//
//                                    } else {
//                                        progressDialog.dismiss();
////                    Toast.makeText(SentotpActivity.this, ""+loginDeo.getMessage(), Toast.LENGTH_SHORT).show();
//
//                                    }
//
//                                }
//
//
//                                @Override
//                                public void onFailure(Call<SendotpDeo> call, Throwable t) {
//                                    progressDialog.dismiss();
//                                    Toast.makeText(OrderDetailsActivity.this, t.getMessage(), Toast.LENGTH_LONG).show();
//
//                                }
//                            });
//
//                        }
//
//
//
//
//                    });


                    viewmap_txt.setOnClickListener(new View.OnClickListener() {
                        @Override
                        public void onClick(View view) {
                            try {
                                String lat = jsonObject.optString("Latitude", "").trim();
                                String lng = jsonObject.optString("Longitude", "").trim();
                                if (!lat.isEmpty() && !lng.isEmpty() && !lat.equalsIgnoreCase("null") && !lng.equalsIgnoreCase("null")) {
                                    Uri uri = Uri.parse("google.navigation:q=" + lat + "," + lng + "&mode=d");
                                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                                    intent.setPackage("com.google.android.apps.maps");
                                    try {
                                        startActivity(intent);
                                    } catch (Exception e1) {
                                        Uri fallbackUri = Uri.parse("geo:" + lat + "," + lng + "?q=" + lat + "," + lng + "(Customer)");
                                        Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, fallbackUri);
                                        try {
                                            startActivity(fallbackIntent);
                                        } catch (Exception e2) {
                                            Uri webUri = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng);
                                            startActivity(new Intent(Intent.ACTION_VIEW, webUri));
                                        }
                                    }
                                } else {
                                    String addr = jsonObject.optString("Address", "");
                                    if (!addr.isEmpty()) {
                                        Uri addrUri = Uri.parse("geo:0,0?q=" + Uri.encode(addr));
                                        startActivity(new Intent(Intent.ACTION_VIEW, addrUri));
                                    } else {
                                        Toast.makeText(OrderDetailsActivity.this, "Delivery destination coordinates not available", Toast.LENGTH_SHORT).show();
                                    }
                                }
                            } catch (Exception e) {
                                Toast.makeText(OrderDetailsActivity.this, "Error opening navigation: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                            }
                        }
                    });


//                    deleverdtime.setVisibility(View.VISIBLE);

                    SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
                    SimpleDateFormat outputFormat = new SimpleDateFormat("dd-MM-yyyy hh:mm a", Locale.getDefault()); // Added time in 12-hour format with AM/PM

// Set the input format to UTC timezone
//                    inputFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
//
//// Set the output format to IST timezone (UTC +5:30)
//                    outputFormat.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));

// Assuming OrderDate is the UTC date in string format
                    Date date = null;
                    try {
                        // Parse the UTC date string
                        inputFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
                        outputFormat.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));



                        // Format the date to IST
                        date = inputFormat.parse(EstimateDateTime);
                        String formattedDate = outputFormat.format(date);


                        formattedDate = outputFormat.format(date);

                        System.out.println(date);

                        // Set the formatted date to the TextView
                        setdeliverytime_txt.setText(CreatedAtTime);
                    } catch (ParseException parseException) {
                        parseException.printStackTrace();
                    }

//                    try {
//                        Date date = inputFormat.parse(EstimateDateTime);
//                        String deliveredDateTime = outputFormat.format(date);
//                        Log.d("DeliveredDateTime", deliveredDateTime);
//                        setdeliverytime_txt.setText(deliveredDateTime);
//                    } catch (ParseException parseException) {
//                        parseException.printStackTrace();
//                    }
//                    SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
//                    SimpleDateFormat outputFormat = new SimpleDateFormat("dd-MM-yyyy");
//
//                    Date date = null;
//                    try {
//                        date = inputFormat.parse(EstimateDateTime);
//                        String formattedDate = outputFormat.format(date);
//                        setdeliverytime_txt.setText(formattedDate);
//                    } catch (ParseException parseException) {
//                        parseException.printStackTrace();
//                    }
                }
            } catch (JSONException e) {
            }
        }
    }

    private void showReportDelayDialog(String orderId) {
        String[] reasonsDisplay = {
                "Heavy traffic",
                "Weather conditions",
                "Restaurant or store preparation delay",
                "Order not ready for pickup",
                "Difficulty locating the customer",
                "Vehicle issue",
                "Other"
        };
        String[] reasonsCode = {
                "HEAVY_TRAFFIC",
                "WEATHER_CONDITIONS",
                "STORE_PREPARATION_DELAY",
                "ORDER_NOT_READY",
                "DIFFICULTY_LOCATING_CUSTOMER",
                "VEHICLE_ISSUE",
                "OTHER"
        };
        final int[] selectedReasonIndex = {0};

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Report Delivery Delay (Order #" + orderId + ")");
        builder.setSingleChoiceItems(reasonsDisplay, 0, (dialog, which) -> selectedReasonIndex[0] = which);

        builder.setPositiveButton("Next", (dialog, which) -> {
            String selectedCode = reasonsCode[selectedReasonIndex[0]];
            if ("OTHER".equals(selectedCode)) {
                showDelayNotesDialog(orderId, selectedCode, true);
            } else {
                showDelayDurationPicker(orderId, selectedCode, "");
            }
        });
        builder.setNegativeButton("Cancel", (dialog, which) -> dialog.dismiss());
        builder.show();
    }

    private void showDelayNotesDialog(String orderId, String reasonCode, boolean isMandatory) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle(isMandatory ? "Explain Delay (Required)" : "Explanatory Notes (Optional)");

        final EditText input = new EditText(this);
        input.setHint(isMandatory ? "Enter meaningful explanation for 'Other'..." : "Enter notes (optional)...");
        input.setLines(3);
        int paddingPx = (int) (16 * getResources().getDisplayMetrics().density);
        input.setPadding(paddingPx, paddingPx, paddingPx, paddingPx);
        builder.setView(input);

        builder.setPositiveButton("Next", (dialog, which) -> {
            String remarks = input.getText().toString().trim();
            if (isMandatory && remarks.length() < 5) {
                Toast.makeText(this, "Please provide a meaningful explanation (at least 5 characters)", Toast.LENGTH_SHORT).show();
                showDelayNotesDialog(orderId, reasonCode, true);
                return;
            }
            showDelayDurationPicker(orderId, reasonCode, remarks);
        });
        builder.setNegativeButton("Back", (dialog, which) -> showReportDelayDialog(orderId));
        builder.show();
    }

    private void showDelayDurationPicker(String orderId, String reasonCode, String remarks) {
        String[] durations = {
                "+5 Minutes",
                "+10 Minutes",
                "+15 Minutes",
                "+20 Minutes",
                "+30 Minutes",
                "+45 Minutes",
                "+60 Minutes"
        };
        int[] minutes = {5, 10, 15, 20, 30, 45, 60};
        final int[] selectedDurationIndex = {1}; // Default +10 min

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Select Additional Time Needed");
        builder.setSingleChoiceItems(durations, 1, (dialog, which) -> selectedDurationIndex[0] = which);

        builder.setPositiveButton("Submit Delay", (dialog, which) -> {
            submitDelayReport(orderId, reasonCode, minutes[selectedDurationIndex[0]], remarks != null ? remarks : "");
        });
        builder.setNegativeButton("Back", (dialog, which) -> {
            if ("OTHER".equals(reasonCode)) {
                showDelayNotesDialog(orderId, reasonCode, true);
            } else {
                showReportDelayDialog(orderId);
            }
        });
        builder.show();
    }

    private void submitDelayReport(String orderId, String reason, int requestedMinutes, String remarks) {
        ProgressDialog progressDialog = new ProgressDialog(this);
        progressDialog.setMessage("Submitting delay report to operations...");
        progressDialog.setCancelable(false);
        progressDialog.show();

        new Thread(() -> {
            try {
                URL url = new URL(CommonUtilities.URL + "deliveryboy/orders/report-delay");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setDoOutput(true);

                JSONObject body = new JSONObject();
                body.put("OrderID", Integer.parseInt(orderId));
                body.put("Reason", reason);
                body.put("RequestedMinutes", requestedMinutes);
                body.put("Remarks", remarks);

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
                runOnUiThread(() -> {
                    progressDialog.dismiss();
                    if (respObj.optInt("Status") == 1) {
                        Toast.makeText(OrderDetailsActivity.this, "Delay of +" + requestedMinutes + "m reported to operations team", Toast.LENGTH_LONG).show();
                        getorderDetails();
                    } else {
                        Toast.makeText(OrderDetailsActivity.this, respObj.optString("Message", "Failed to report delay"), Toast.LENGTH_LONG).show();
                    }
                });
                conn.disconnect();
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressDialog.dismiss();
                    Toast.makeText(OrderDetailsActivity.this, "Network error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

    private void showReportIssueDialog(String orderId) {
        String[] issuesDisplay = {
                "Vehicle Breakdown (Flat tire/Engine)",
                "Customer Unreachable (Phone not answering)",
                "Wrong Delivery Address / Pin",
                "Road Block / Inaccessible Area",
                "Store / Restaurant Problem",
                "Other Operational Emergency"
        };
        String[] issuesCode = {
                "VEHICLE_BREAKDOWN",
                "CUSTOMER_UNREACHABLE",
                "WRONG_ADDRESS",
                "ROAD_BLOCK",
                "RESTAURANT_PROBLEM",
                "OTHER"
        };
        final int[] selectedIndex = {0};

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Report Issue (Order #" + orderId + ")");
        builder.setSingleChoiceItems(issuesDisplay, 0, (dialog, which) -> selectedIndex[0] = which);

        builder.setPositiveButton("Report to Dispatcher", (dialog, which) -> {
            submitIssueReport(orderId, issuesCode[selectedIndex[0]], "");
        });
        builder.setNegativeButton("Cancel", (dialog, which) -> dialog.dismiss());
        builder.show();
    }

    private void submitIssueReport(String orderId, String issueType, String description) {
        ProgressDialog progressDialog = new ProgressDialog(this);
        progressDialog.setMessage("Reporting incident to operations...");
        progressDialog.setCancelable(false);
        progressDialog.show();

        new Thread(() -> {
            try {
                URL url = new URL(CommonUtilities.URL + "deliveryboy/orders/report-issue");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setDoOutput(true);

                JSONObject body = new JSONObject();
                body.put("OrderID", Integer.parseInt(orderId));
                body.put("IssueType", issueType);
                body.put("Description", description);

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
                runOnUiThread(() -> {
                    progressDialog.dismiss();
                    if (respObj.optInt("Status") == 1) {
                        Toast.makeText(OrderDetailsActivity.this, "Incident reported. Operations dispatcher notified.", Toast.LENGTH_LONG).show();
                    } else {
                        Toast.makeText(OrderDetailsActivity.this, respObj.optString("Message", "Failed to report issue"), Toast.LENGTH_LONG).show();
                    }
                });
                conn.disconnect();
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressDialog.dismiss();
                    Toast.makeText(OrderDetailsActivity.this, "Network error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

}
