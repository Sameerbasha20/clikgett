package com.deliveryboy_clickget;

import static android.content.Context.MODE_PRIVATE;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.deliveryboy_clickget.Model.OrderList;
import com.deliveryboy_clickget.Model.OrdersListDeo;
import com.deliveryboy_clickget.Utils.APIService;
import com.deliveryboy_clickget.Utils.Session;
import com.deliveryboy_clickget.Utils.RetrofitClient;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * The rider's active orders. Refreshes every 20 seconds while visible and
 * immediately when an order push arrives.
 */
public class CurrentOrdersFragment extends Fragment {

    private static final long POLL_MS = 20_000L;

    private String token;
    private RecyclerView list;
    private TextView emptyTxt;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Set<Integer> knownOrderIds = new HashSet<>();
    private boolean firstLoad = true;
    private boolean loading = false;

    private final Runnable poll = new Runnable() {
        @Override
        public void run() {
            load();
            handler.postDelayed(this, POLL_MS);
        }
    };

    private final BroadcastReceiver ordersChanged = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            load();
        }
    };

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_current_orders, container, false);
        list = view.findViewById(R.id.currentorders_list);
        emptyTxt = view.findViewById(R.id.norecords_txt);
        list.setLayoutManager(new LinearLayoutManager(getContext()));
        SharedPreferences pref = requireContext().getSharedPreferences("MyPref", MODE_PRIVATE);
        token = pref.getString("token", "");
        return view;
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    @Override
    public void onResume() {
        super.onResume();
        IntentFilter filter = new IntentFilter(RiderMessagingService.ACTION_ORDERS_CHANGED);
        if (Build.VERSION.SDK_INT >= 33) {
            requireContext().registerReceiver(ordersChanged, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            requireContext().registerReceiver(ordersChanged, filter);
        }
        handler.removeCallbacks(poll);
        handler.post(poll);
    }

    @Override
    public void onPause() {
        super.onPause();
        handler.removeCallbacks(poll);
        try {
            requireContext().unregisterReceiver(ordersChanged);
        } catch (Exception ignored) {
        }
    }

    private void load() {
        if (loading || !isAdded() || getContext() == null) return;
        if (!InternetConnection.checkConnection(getContext())) {
            if (firstLoad) Toast.makeText(getContext(), "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }
        loading = true;
        APIService api = RetrofitClient.getClient().create(APIService.class);
        api.getcurrentorders("Bearer " + token).enqueue(new Callback<OrdersListDeo>() {
            @Override
            public void onResponse(Call<OrdersListDeo> call, Response<OrdersListDeo> response) {
                loading = false;
                if (!isAdded()) return;
                if (response.code() == 401) {
                    Session.expire(requireContext());
                    return;
                }
                OrdersListDeo body = response.body();
                List<OrderList> orders = body != null && body.getStatus() != null && body.getStatus() == 1 ? body.getOrders() : null;
                show(orders);
            }

            @Override
            public void onFailure(Call<OrdersListDeo> call, Throwable t) {
                loading = false;
                Log.w("CurrentOrders", "load failed: " + (t != null ? t.getMessage() : ""));
            }
        });
    }

    private void show(List<OrderList> orders) {
        boolean empty = orders == null || orders.isEmpty();
        list.setVisibility(empty ? View.GONE : View.VISIBLE);
        emptyTxt.setVisibility(empty ? View.VISIBLE : View.GONE);
        if (empty) {
            knownOrderIds.clear();
            firstLoad = false;
            return;
        }
        int newOrders = 0;
        Set<Integer> ids = new HashSet<>();
        for (OrderList o : orders) {
            if (o.getOrderID() == null) continue;
            ids.add(o.getOrderID());
            if (!firstLoad && !knownOrderIds.contains(o.getOrderID())) newOrders++;
        }
        knownOrderIds.clear();
        knownOrderIds.addAll(ids);
        if (newOrders > 0 && getContext() != null) {
            Toast.makeText(getContext(), newOrders == 1 ? "New order assigned to you" : newOrders + " new orders assigned to you", Toast.LENGTH_LONG).show();
        }
        firstLoad = false;
        list.setAdapter(new PendingOrdersAdapter(getContext(), orders));
    }
}
