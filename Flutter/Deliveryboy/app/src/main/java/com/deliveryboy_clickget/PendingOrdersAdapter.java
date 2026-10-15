package com.deliveryboy_clickget;

import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;


import com.deliveryboy_clickget.Model.OrderList;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class PendingOrdersAdapter extends RecyclerView.Adapter<PendingOrdersAdapter.MyViewHolder> {
    private List<OrderList> orderLists;
    Context context;

    public PendingOrdersAdapter(Context applicationContext, List<OrderList> orderLists) {
        this.context = applicationContext;
        this.orderLists = orderLists;
    }


    public class MyViewHolder extends RecyclerView.ViewHolder {
        public TextView userorderId, orderscount_txt,userName,orderdate,orderamount;
        RelativeLayout main_layt;
        CardView pendingorders_cardview;

        public MyViewHolder(View view) {
            super(view);
            orderdate=view.findViewById(R.id.orderdate);
            userName=view.findViewById(R.id.userName);
            userorderId=view.findViewById(R.id.userorderId);
            orderscount_txt=view.findViewById(R.id.orderscount_txt);
            orderamount=view.findViewById(R.id.orderamount);
            main_layt=view.findViewById(R.id.main_layt);
            pendingorders_cardview=view.findViewById(R.id.pendingorders_cardview);

        }
    }

    @Override
    public MyViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View itemView = LayoutInflater.from(parent.getContext()).inflate(R.layout.pending_orders_list, parent, false);
        return new MyViewHolder(itemView);
    }

    @Override
    public void onBindViewHolder(MyViewHolder holder, int position) {
//        String NoOfOrders = String.valueOf(orderLists.get(position).getNoOfOrders());
//        String RouteID = String.valueOf(orderLists.get(position).getRouteID());
//        holder.orderscount_txt.setText(NoOfOrders);
//        holder.routeid_number_txt.setText(RouteID);
//        holder.pendingorders_cardview.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
                Intent intent = new Intent(context, RouteIdActivity.class);
//                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//
//                intent.putExtra("RouteID", "" + orderLists.get(position).getRouteID());
//                context.startActivity(intent);
//            }
//        });
        String OrderId= String.valueOf(orderLists.get(position).getOrderSequence());
        String UserName= String.valueOf(orderLists.get(position).getUserName());
        String OrderDate= String.valueOf(orderLists.get(position).getCreatedAt());
        Log.d("OrderDate",""+OrderDate);
//        SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
//        SimpleDateFormat outputFormat = new SimpleDateFormat("dd-MM-yyyy");

        SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
        SimpleDateFormat outputFormat = new SimpleDateFormat("dd-MM-yyyy hh:mm a", Locale.getDefault()); // Added time in 12-hour format with AM/PM

// Set the input format to UTC timezone
        inputFormat.setTimeZone(TimeZone.getTimeZone("UTC"));

// Set the output format to IST timezone (UTC +5:30)
        outputFormat.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));

// Assuming OrderDate is the UTC date in string format
        Date date = null;
        try {
            // Parse the UTC date string
            date = inputFormat.parse(OrderDate);

            // Format the date to IST
            String formattedDate = outputFormat.format(date);

            // Set the formatted date to the TextView
            holder.orderdate.setText(formattedDate);
        } catch (ParseException parseException) {
            parseException.printStackTrace();
        }
        String Orderamount= orderLists.get(position).getGrandTotal();
        int maxLength = 25;

// Check if the length exceeds the max length
        if (UserName.length() > maxLength) {
            // Truncate and add ellipsis
            UserName = UserName.substring(0, maxLength - 3) + "...";
        }
        holder.userName.setText("Customer Name : "+UserName);
        holder.userorderId.setText("Order ID # "+OrderId);
        holder.orderamount.setText("₹"+Orderamount);
//        holder.routeid_number_txt.setText(RouteID);
        holder.pendingorders_cardview.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(context, OrderDetailsActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.putExtra("OrderID",""+orderLists.get(position).getOrderID());
                context.startActivity(intent);

            }
        });

    }

    @Override
    public int getItemCount() {
        return orderLists.size();
    }
}