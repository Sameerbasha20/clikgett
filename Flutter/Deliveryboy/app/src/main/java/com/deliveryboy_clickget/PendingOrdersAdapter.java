package com.deliveryboy_clickget;

import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.deliveryboy_clickget.Model.OrderList;
import com.google.android.material.card.MaterialCardView;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

/** Order cards on the rider's home screen (current and past). */
public class PendingOrdersAdapter extends RecyclerView.Adapter<PendingOrdersAdapter.MyViewHolder> {
    private static final TimeZone IST = TimeZone.getTimeZone("Asia/Kolkata");

    private final List<OrderList> orderLists;
    private final Context context;

    public PendingOrdersAdapter(Context applicationContext, List<OrderList> orderLists) {
        this.context = applicationContext;
        this.orderLists = orderLists;
    }

    public static class MyViewHolder extends RecyclerView.ViewHolder {
        final TextView userorderId, statusTxt, userName, orderdate, orderamount, addressTxt;
        final View statusStrip, addressRow;
        final MaterialCardView card;

        public MyViewHolder(View view) {
            super(view);
            orderdate = view.findViewById(R.id.orderdate);
            userName = view.findViewById(R.id.userName);
            userorderId = view.findViewById(R.id.userorderId);
            statusTxt = view.findViewById(R.id.orderscount_txt);
            orderamount = view.findViewById(R.id.orderamount);
            addressTxt = view.findViewById(R.id.address_txt);
            addressRow = view.findViewById(R.id.address_row);
            statusStrip = view.findViewById(R.id.status_strip);
            card = view.findViewById(R.id.pendingorders_cardview);
        }
    }

    @Override
    public MyViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View itemView = LayoutInflater.from(parent.getContext()).inflate(R.layout.pending_orders_list, parent, false);
        return new MyViewHolder(itemView);
    }

    @Override
    public void onBindViewHolder(MyViewHolder holder, int position) {
        OrderList order = orderLists.get(position);
        Integer st = order.getOrderStatus();
        boolean finished = st != null && (st == 1 || st == 3 || st == 4 || st == 6);

        holder.userorderId.setText("Order #" + order.getOrderSequence());
        String name = order.getUserName() == null || "null".equals(order.getUserName()) ? "Customer" : order.getUserName().trim();
        holder.userName.setText(name);
        holder.orderdate.setText(formatTime(order.getCreatedAt()));

        String address = joinAddress(order.getFlatNo(), order.getAddress(), order.getLandMark());
        holder.addressRow.setVisibility(address.isEmpty() ? View.GONE : View.VISIBLE);
        holder.addressTxt.setText(address);

        // Status pill and strip colour
        int fg;
        int bg;
        if (st != null && (st == 3 || st == 4 || st == 6)) {
            fg = R.color.color_danger;
            bg = R.color.color_danger_bg;
        } else if (st != null && st == 1) {
            fg = R.color.color_offline;
            bg = R.color.color_offline_bg;
        } else if (st != null && (st == 5 || st == 7)) {
            fg = R.color.color_delivery;
            bg = R.color.color_delivery_bg;
        } else {
            fg = R.color.clikgett_green_dark;
            bg = R.color.clikgett_green_light;
        }
        holder.statusTxt.setText(stepLabel(st));
        holder.statusTxt.setTextColor(ContextCompat.getColor(context, fg));
        holder.statusTxt.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(context, bg)));
        holder.statusStrip.setBackgroundColor(ContextCompat.getColor(context, fg));

        // Money: what the rider collects, or that it is prepaid. A cash order is
        // marked paid once delivered, so the payment method decides, not the status.
        boolean prepaid = !"COD".equalsIgnoreCase(String.valueOf(order.getPaymentMethod()));
        String amount = rupees(order.getGrandTotal());
        if (prepaid) {
            holder.orderamount.setText(finished ? "Prepaid · " + amount : "Prepaid · nothing to collect");
            holder.orderamount.setTextColor(ContextCompat.getColor(context, R.color.clikgett_green_dark));
            holder.orderamount.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(context, R.color.checked_row_bg)));
        } else {
            holder.orderamount.setText(finished ? "Cash · " + amount : "Collect " + amount);
            holder.orderamount.setTextColor(ContextCompat.getColor(context, R.color.amber_text));
            holder.orderamount.setBackgroundTintList(null);
        }

        holder.card.setOnClickListener(view -> {
            Intent intent = new Intent(context, OrderDetailsActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.putExtra("OrderID", "" + order.getOrderID());
            context.startActivity(intent);
        });
    }

    private static String stepLabel(Integer status) {
        if (status == null) return "Order";
        switch (status) {
            case 8: return "New · store has it";
            case 9: return "Being packed";
            case 2: return "Ready to pick up";
            case 5: return "On the way";
            case 7: return "Arrived · get OTP";
            case 1: return "Delivered";
            case 3:
            case 4: return "Cancelled";
            case 6: return "Returned";
            default: return "Order";
        }
    }

    /** "5:42 PM" today, "18 Oct, 5:42 PM" otherwise, in IST. */
    private static String formatTime(String utc) {
        if (utc == null) return "";
        SimpleDateFormat in = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.ENGLISH);
        in.setTimeZone(TimeZone.getTimeZone("UTC"));
        try {
            Date date = in.parse(utc);
            Calendar then = Calendar.getInstance(IST);
            then.setTime(date);
            Calendar now = Calendar.getInstance(IST);
            boolean today = then.get(Calendar.YEAR) == now.get(Calendar.YEAR)
                    && then.get(Calendar.DAY_OF_YEAR) == now.get(Calendar.DAY_OF_YEAR);
            SimpleDateFormat out = new SimpleDateFormat(today ? "h:mm a" : "d MMM, h:mm a", Locale.ENGLISH);
            out.setTimeZone(IST);
            return out.format(date);
        } catch (ParseException e) {
            return "";
        }
    }

    private static String joinAddress(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part == null) continue;
            String p = part.trim();
            if (p.isEmpty() || "NA".equalsIgnoreCase(p) || "null".equalsIgnoreCase(p)) continue;
            if (sb.length() > 0) sb.append(", ");
            sb.append(p);
        }
        return sb.toString();
    }

    private static String rupees(String value) {
        try {
            double v = Double.parseDouble(value);
            return v == Math.rint(v) ? String.format(Locale.ENGLISH, "₹%,d", (long) v) : String.format(Locale.ENGLISH, "₹%,.2f", v);
        } catch (Exception e) {
            return "₹" + value;
        }
    }

    @Override
    public int getItemCount() {
        return orderLists.size();
    }
}
