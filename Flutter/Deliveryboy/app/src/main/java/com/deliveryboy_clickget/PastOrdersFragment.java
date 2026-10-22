package com.deliveryboy_clickget;

import static android.content.Context.MODE_PRIVATE;

import android.app.ProgressDialog;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.DefaultItemAnimator;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;


import com.deliveryboy_clickget.Model.OrderList;
import com.deliveryboy_clickget.Model.OrdersListDeo;
import com.deliveryboy_clickget.Utils.APIService;
import com.deliveryboy_clickget.Utils.Session;
import com.deliveryboy_clickget.Utils.RetrofitClient;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class PastOrdersFragment extends Fragment {
    String token, Type;
    RecyclerView currentorders_list;
    TextView norecords_txt;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_current_orders, container, false);
        currentorders_list = view.findViewById(R.id.currentorders_list);
        norecords_txt = view.findViewById(R.id.norecords_txt);
        if (getActivity() != null) {
            SharedPreferences pref = getActivity().getSharedPreferences("MyPref", MODE_PRIVATE);
            token = pref.getString("token", "");
        } else if (getContext() != null) {
            SharedPreferences pref = getContext().getSharedPreferences("MyPref", MODE_PRIVATE);
            token = pref.getString("token", "");
        }
        return view;
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getContext() != null && InternetConnection.checkConnection(getContext())) {
            getCurrentOrders();
        } else if (getContext() != null) {
            Toast.makeText(getContext(), "No Internet Connection", Toast.LENGTH_LONG).show();
        }
    }
    private void getCurrentOrders() {

        ProgressDialog progressDialog = new ProgressDialog(getActivity());
        progressDialog.setMessage("Loading ...");
        progressDialog.setCancelable(false);
        try {
            progressDialog.show();
        } catch (Exception ignored) {}

        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Call<OrdersListDeo> call = apiService.getpastorders("Bearer " + token);
        call.enqueue(new Callback<OrdersListDeo>() {
            @RequiresApi(api = Build.VERSION_CODES.GINGERBREAD)
            @Override
            public void onResponse(Call<OrdersListDeo> call, Response<OrdersListDeo> response) {
                try {
                    if (progressDialog.isShowing() && getActivity() != null && !getActivity().isFinishing()) {
                        progressDialog.dismiss();
                    }
                } catch (Exception ignored) {}

                if (response.code() == 401 && getContext() != null) {
                    Session.expire(getContext());
                    return;
                }
                try {
                    OrdersListDeo ordersListDeo = response.body();
                    if (response.code() == 200 && ordersListDeo != null) {
                        if (ordersListDeo.getStatus() != null && ordersListDeo.getStatus() == 1 && ordersListDeo.getOrders() != null) {
                            List<OrderList> orderLists = ordersListDeo.getOrders();
                            if (orderLists.isEmpty() || getContext() == null) {
                                currentorders_list.setVisibility(View.GONE);
                                norecords_txt.setVisibility(View.VISIBLE);
                            } else {
                                PendingOrdersAdapter adapter = new PendingOrdersAdapter(getContext(), orderLists);
                                RecyclerView.LayoutManager mLayoutManager = new LinearLayoutManager(getContext());
                                currentorders_list.setLayoutManager(mLayoutManager);
                                currentorders_list.setItemAnimator(new DefaultItemAnimator());
                                currentorders_list.setAdapter(adapter);
                                currentorders_list.setVisibility(View.VISIBLE);
                                norecords_txt.setVisibility(View.GONE);
                            }
                        } else {
                            currentorders_list.setVisibility(View.GONE);
                            norecords_txt.setVisibility(View.VISIBLE);
                        }
                    } else {
                        currentorders_list.setVisibility(View.GONE);
                        norecords_txt.setVisibility(View.VISIBLE);
                    }
                } catch (Exception e) {
                    Log.e("PastOrders", "Error parsing past orders: " + e.getMessage(), e);
                    if (currentorders_list != null) currentorders_list.setVisibility(View.GONE);
                    if (norecords_txt != null) norecords_txt.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<OrdersListDeo> call, Throwable t) {
                try {
                    if (progressDialog.isShowing() && getActivity() != null && !getActivity().isFinishing()) {
                        progressDialog.dismiss();
                    }
                } catch (Exception ignored) {}

                if (currentorders_list != null) currentorders_list.setVisibility(View.GONE);
                if (norecords_txt != null) norecords_txt.setVisibility(View.VISIBLE);
                if (getContext() != null) {
                    Toast.makeText(getContext(), t != null ? t.getMessage() : "Network error", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }



}
