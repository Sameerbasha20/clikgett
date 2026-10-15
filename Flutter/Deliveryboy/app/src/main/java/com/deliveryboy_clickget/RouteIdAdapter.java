package com.deliveryboy_clickget;

import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;

import com.deliveryboy_clickget.Model.RouteByOrderList;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

public class RouteIdAdapter extends RecyclerView.Adapter<RouteIdAdapter.ViewHolder> {
    Context context;
    List<RouteByOrderList> routeByOrderLists;

    public RouteIdAdapter(Context applicationContext, List<RouteByOrderList> routeByOrderLists) {
        this.context = applicationContext;
        this.routeByOrderLists = routeByOrderLists;
    }

    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        LayoutInflater layoutInflater = LayoutInflater.from(parent.getContext());
        View listItem = layoutInflater.inflate(R.layout.routeidlistdata, parent, false);
        ViewHolder viewHolder = new ViewHolder(listItem);
        return viewHolder;
    }

    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        holder.username_txt.setText(routeByOrderLists.get(position).getUserName());
        String orderdate = String.valueOf(routeByOrderLists.get(position).getCreatedAt());
        int OrderStatus = routeByOrderLists.get(position).getOrderStatus();
        if (OrderStatus == 2) {
            holder.orderstatus_txt.setVisibility(View.GONE);
        } else if (OrderStatus == 1) {
            holder.orderstatus_txt.setVisibility(View.VISIBLE);
            holder.orderstatus_txt.setText("DELIVERED");
        } else if (OrderStatus == 3) {
            holder.orderstatus_txt.setVisibility(View.VISIBLE);
            holder.orderstatus_txt.setText("Admin cancel order");
        } else if (OrderStatus == 4) {
            holder.orderstatus_txt.setVisibility(View.VISIBLE);
            holder.orderstatus_txt.setText("Canceled by use");

        } else if (OrderStatus == 6) {
            holder.orderstatus_txt.setVisibility(View.VISIBLE);
            holder.orderstatus_txt.setText("Delivery boy reject order");
        }
        SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        SimpleDateFormat outputFormat = new SimpleDateFormat("dd-MM-yyyy");
        Date date = null;
        try {
            date = inputFormat.parse(orderdate);
            String formattedDate = outputFormat.format(date);
            holder.orderdate_txt.setText(formattedDate);
        } catch (ParseException parseException) {
            parseException.printStackTrace();
        }
        String OrderID = String.valueOf(routeByOrderLists.get(position).getOrderID());
        String orderAmount = String.valueOf(routeByOrderLists.get(position).getGrandTotal());
        holder.routeid_number_txt.setText(OrderID);
        holder.orderamount.setText(orderAmount);
        holder.paymrntmode_txt.setText(routeByOrderLists.get(position).getPaymentMethod());
        holder.loaction_txt.setText(routeByOrderLists.get(position).getAddress());
        holder.main_cardview.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(context, OrderDetailsActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.putExtra("OrderID", "" + routeByOrderLists.get(position).getOrderID());
                context.startActivity(intent);
            }
        });
    }

    @Override
    public int getItemCount() {
        return routeByOrderLists.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {

        public TextView loaction_txt, orderstatus_txt, paymrntmode_txt, orderamount, routeid_number_txt, orderdate_txt, username_txt;
        CardView main_cardview;

        public ViewHolder(View itemView) {
            super(itemView);
            this.orderstatus_txt = (TextView) itemView.findViewById(R.id.orderstatus_txt);
            this.loaction_txt = (TextView) itemView.findViewById(R.id.loaction_txt);
            this.paymrntmode_txt = (TextView) itemView.findViewById(R.id.paymrntmode_txt);
            this.orderamount = (TextView) itemView.findViewById(R.id.orderamount);
            this.routeid_number_txt = (TextView) itemView.findViewById(R.id.routeid_number_txt);
            this.orderdate_txt = (TextView) itemView.findViewById(R.id.orderdate_txt);
            this.username_txt = (TextView) itemView.findViewById(R.id.username_txt);
            this.main_cardview = itemView.findViewById(R.id.main_cardview);
        }
    }
}
