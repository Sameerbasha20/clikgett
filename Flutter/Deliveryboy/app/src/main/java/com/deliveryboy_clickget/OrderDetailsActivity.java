package com.deliveryboy_clickget;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.ProgressDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.location.Location;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.InputFilter;
import android.text.InputType;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ImageView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.deliveryboy_clickget.Utils.Api;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;

import org.json.JSONArray;
import org.json.JSONObject;

import com.squareup.picasso.Picasso;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * One order for the rider: who and where, what to collect, the items, and a
 * single button for the next step:
 *   assigned (2) -> "Picked up" -> out for delivery (5)
 *   out for delivery (5) -> "Arrived" -> arrived (7, the customer gets the OTP)
 *   arrived (7) -> "Enter OTP & deliver" -> delivered (1)
 */
public class OrderDetailsActivity extends AppCompatActivity {

    private static final int STATUS_DELIVERED = 1;
    private static final int STATUS_ASSIGNED = 2;
    private static final int STATUS_CANCELLED_STORE = 3;
    private static final int STATUS_CANCELLED_CUSTOMER = 4;
    private static final int STATUS_OUT = 5;
    private static final int STATUS_RETURNED = 6;
    private static final int STATUS_ARRIVED = 7;

    private String orderId;
    private JSONObject order;
    private int status = -1;

    private SwipeRefreshLayout swipe;
    private TextView titleTxt, subtitleTxt, chipTxt, bannerTxt, collectTxt, paymentLabelTxt, paymentDetailTxt,
            customerInitialTxt, customerNameTxt, customerPhoneTxt, addressTxt, instructionsTxt,
            itemsTitleTxt, itemsHintTxt, itemsProgressTxt, stepHintTxt;
    private LinearLayout itemsContainer, actionBar, problemRow, stepsContainer, instructionsBox;
    private MaterialCardView paymentCard, itemsCard;
    private ImageView paymentIcon;
    private Button callBtn, navigateBtn;
    private MaterialButton actionBtn;
    /** Items the rider has ticked while checking the bag, by OrderItemID; kept per order. */
    private final Set<String> checkedItems = new HashSet<>();
    private int itemLines = 0;
    private FusedLocationProviderClient locationClient;

    private final BroadcastReceiver ordersChanged = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            load();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_order_details);
        orderId = getIntent().getStringExtra("OrderID");
        locationClient = LocationServices.getFusedLocationProviderClient(this);

        swipe = findViewById(R.id.swipe_refresh);
        titleTxt = findViewById(R.id.order_title_txt);
        subtitleTxt = findViewById(R.id.order_subtitle_txt);
        stepsContainer = findViewById(R.id.steps_container);
        paymentCard = findViewById(R.id.payment_card);
        paymentIcon = findViewById(R.id.payment_icon);
        paymentLabelTxt = findViewById(R.id.payment_label_txt);
        customerInitialTxt = findViewById(R.id.customer_initial_txt);
        customerPhoneTxt = findViewById(R.id.customer_phone_txt);
        instructionsBox = findViewById(R.id.instructions_box);
        itemsHintTxt = findViewById(R.id.items_hint_txt);
        itemsProgressTxt = findViewById(R.id.items_progress_txt);
        chipTxt = findViewById(R.id.status_chip_txt);
        bannerTxt = findViewById(R.id.banner_txt);
        collectTxt = findViewById(R.id.collect_txt);
        paymentDetailTxt = findViewById(R.id.payment_detail_txt);
        customerNameTxt = findViewById(R.id.customer_name_txt);
        addressTxt = findViewById(R.id.address_txt);
        instructionsTxt = findViewById(R.id.instructions_txt);
        itemsTitleTxt = findViewById(R.id.items_title_txt);
        itemsContainer = findViewById(R.id.items_container);
        itemsCard = findViewById(R.id.items_card);
        actionBar = findViewById(R.id.action_bar);
        problemRow = findViewById(R.id.problem_row);
        stepHintTxt = findViewById(R.id.step_hint_txt);
        callBtn = findViewById(R.id.call_btn);
        navigateBtn = findViewById(R.id.navigate_btn);
        actionBtn = findViewById(R.id.action_btn);

        findViewById(R.id.back_img).setOnClickListener(v -> finish());
        swipe.setColorSchemeResources(R.color.clikgett_green_primary);
        swipe.setOnRefreshListener(this::load);
        callBtn.setOnClickListener(v -> callCustomer());
        navigateBtn.setOnClickListener(v -> navigate());
        actionBtn.setOnClickListener(v -> onAction());
        findViewById(R.id.delay_btn).setOnClickListener(v -> reportDelay());
        findViewById(R.id.issue_btn).setOnClickListener(v -> reportIssue());

        titleTxt.setText(orderId != null ? "Order #" + pad(orderId) : "Order");
        checkedItems.addAll(checksPref().getStringSet(checksKey(), new HashSet<>()));
        renderSteps(-1);
    }

    private SharedPreferences checksPref() {
        return getSharedPreferences("ItemChecks", MODE_PRIVATE);
    }

    private String checksKey() {
        return "order_" + orderId;
    }

    private void saveChecks() {
        checksPref().edit().putStringSet(checksKey(), new HashSet<>(checkedItems)).apply();
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    @Override
    protected void onResume() {
        super.onResume();
        IntentFilter filter = new IntentFilter(RiderMessagingService.ACTION_ORDERS_CHANGED);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(ordersChanged, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(ordersChanged, filter);
        }
        load();
    }

    @Override
    protected void onPause() {
        super.onPause();
        try {
            unregisterReceiver(ordersChanged);
        } catch (Exception ignored) {
        }
    }

    // ------------------------------------------------------------------ data

    private void load() {
        if (orderId == null) {
            finish();
            return;
        }
        swipe.setRefreshing(true);
        Api.get(this, "deliveryboy/orderdetail?OrderID=" + orderId, response -> {
            swipe.setRefreshing(false);
            if (response.optInt("Status") != 1 || response.optJSONObject("Orders") == null) {
                Toast.makeText(this, response.optString("Message", "Could not load the order"), Toast.LENGTH_LONG).show();
                if (response.optInt("HttpStatus") == 403) {
                    // Reassigned or cancelled away from this rider.
                    finish();
                }
                return;
            }
            order = response.optJSONObject("Orders");
            render();
        });
    }

    private void render() {
        status = order.optInt("OrderStatus", -1);
        titleTxt.setText("Order #" + order.optString("OrderSequence", pad(orderId)));
        chipTxt.setText(statusLabel(status));

        boolean finished = status == STATUS_DELIVERED || status == STATUS_CANCELLED_STORE
                || status == STATUS_CANCELLED_CUSTOMER || status == STATUS_RETURNED;
        if (status == STATUS_CANCELLED_STORE || status == STATUS_CANCELLED_CUSTOMER) {
            bannerTxt.setVisibility(View.VISIBLE);
            bannerTxt.setText("This order was cancelled. Do not deliver it. Return the items to the store.");
        } else if (status == STATUS_DELIVERED) {
            bannerTxt.setVisibility(View.VISIBLE);
            bannerTxt.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.color_online_bg));
            bannerTxt.setTextColor(ContextCompat.getColor(this, R.color.clikgett_green_dark));
            bannerTxt.setText("Delivered. Thank you!");
        } else {
            bannerTxt.setVisibility(View.GONE);
        }

        // Payment: what the rider collects, or how it was paid.
        // A cash order is marked paid once delivered, so "COD" decides cash, not PaymentStatus.
        String method = order.optString("PaymentMethod", "COD").toUpperCase(Locale.ROOT);
        double grandTotal = order.optDouble("GrandTotal", 0);
        double tip = order.optDouble("TipAmount", 0);
        boolean cancelled = status == STATUS_CANCELLED_STORE || status == STATUS_CANCELLED_CUSTOMER || status == STATUS_RETURNED;
        boolean cashOrder = "COD".equals(method) && grandTotal > 0;
        boolean collectCash = cashOrder && !finished;
        boolean amber = collectCash;
        int accent = ContextCompat.getColor(this, cancelled ? R.color.color_offline : amber ? R.color.amber_text : R.color.clikgett_green_dark);
        paymentCard.setCardBackgroundColor(ContextCompat.getColor(this, cancelled ? R.color.color_offline_bg : amber ? R.color.amber_bg : R.color.checked_row_bg));
        paymentCard.setStrokeColor(ContextCompat.getColor(this, cancelled ? R.color.clikgett_card_stroke : amber ? R.color.amber_stroke : R.color.green_stroke));
        paymentIcon.setBackgroundTintList(ColorStateList.valueOf(accent));
        paymentIcon.setImageResource(cashOrder || cancelled ? R.drawable.ic_baseline_currency_rupee_24 : R.drawable.ic_check_small);
        paymentLabelTxt.setTextColor(accent);
        String tipText = tip > 0 ? " · includes " + rupees(tip) + " tip" : "";
        if (cancelled) {
            paymentLabelTxt.setText("ORDER CANCELLED");
            collectTxt.setText("Nothing to collect");
            paymentDetailTxt.setText("Order total was " + rupees(grandTotal));
        } else if (collectCash) {
            paymentLabelTxt.setText("COLLECT ON DELIVERY");
            collectTxt.setText(rupees(grandTotal));
            paymentDetailTxt.setText("Cash or UPI" + tipText);
        } else if (cashOrder) {
            paymentLabelTxt.setText("COLLECTED IN CASH / UPI");
            collectTxt.setText(rupees(grandTotal));
            paymentDetailTxt.setText("Paid on delivery" + tipText);
        } else {
            paymentLabelTxt.setText("WALLET".equals(method) || grandTotal == 0 ? "PAID FROM WALLET" : "PAID ONLINE");
            collectTxt.setText(rupees(grandTotal > 0 ? grandTotal : order.optDouble("WalletAmount", 0)));
            paymentDetailTxt.setText(finished ? "Paid before delivery" + tipText : "Nothing to collect · just hand over the order");
        }
        renderBill(method, cashOrder, collectCash, cancelled);

        // Customer & address
        String name = order.optString("UserName", "").trim();
        if (name.isEmpty() || "null".equals(name)) name = "Customer";
        customerNameTxt.setText(name);
        customerInitialTxt.setText(name.substring(0, 1).toUpperCase(Locale.ROOT));
        String phone = order.optString("MobileNumber", "");
        customerPhoneTxt.setText(phone.length() >= 10
                ? "+91 " + phone.substring(phone.length() - 10, phone.length() - 5) + " " + phone.substring(phone.length() - 5)
                : "Customer");
        callBtn.setVisibility(phone.isEmpty() || finished ? View.GONE : View.VISIBLE);

        StringBuilder address = new StringBuilder();
        appendPart(address, order.optString("FlatNo"));
        appendPart(address, order.optString("Address"));
        appendPart(address, order.optString("LandMark"));
        addressTxt.setText(address.length() > 0 ? address.toString() : "Address not available");
        boolean hasLocation = !order.isNull("Latitude") && !order.optString("Latitude").isEmpty();
        navigateBtn.setVisibility(hasLocation && !finished ? View.VISIBLE : View.GONE);

        String instructions = joinInstructions(order.opt("DeliveryInstructions"));
        instructionsBox.setVisibility(instructions.isEmpty() ? View.GONE : View.VISIBLE);
        instructionsTxt.setText(instructions);

        // Items
        itemsContainer.removeAllViews();
        JSONArray items = order.optJSONArray("orderitems");
        itemLines = 0;
        int count = 0;
        if (items == null || items.length() == 0) {
            itemsCard.setVisibility(order.optInt("DeliveryProductListVisibility", 1) == 0 ? View.GONE : View.VISIBLE);
            itemsTitleTxt.setText("Items");
            itemsHintTxt.setText("The item list is not available for this order.");
        } else {
            itemsCard.setVisibility(View.VISIBLE);
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.optJSONObject(i);
                if (item == null) continue;
                count += item.optInt("Quantity", 1);
                itemLines++;
                if (itemLines > 1) itemsContainer.addView(divider());
                itemsContainer.addView(itemRow(item, status == STATUS_ASSIGNED));
            }
            itemsTitleTxt.setText(status == STATUS_ASSIGNED ? "Items to pick up" : "Items in this order");
            itemsHintTxt.setText(status == STATUS_ASSIGNED ? "Tap each item as you check it in the bag"
                    : count + (count == 1 ? " item" : " items"));
        }
        updateItemsProgress();
        subtitleTxt.setVisibility(count > 0 ? View.VISIBLE : View.GONE);
        subtitleTxt.setText(count + (count == 1 ? " item" : " items") + " · " + itemLines + (itemLines == 1 ? " product" : " products"));
        renderSteps(status);

        // Next step
        problemRow.setVisibility(finished ? View.GONE : View.VISIBLE);
        actionBar.setVisibility(finished ? View.GONE : View.VISIBLE);
        if (status == STATUS_ASSIGNED) {
            stepHintTxt.setText("Collect the packed order from the store, then tap below.");
            actionBtn.setText("Picked up · Start delivery");
            actionBtn.setIconResource(R.drawable.ic_check_circle);
        } else if (status == STATUS_OUT) {
            stepHintTxt.setText("Tap when you reach the customer. They will get the delivery OTP.");
            actionBtn.setText("I have arrived");
            actionBtn.setIconResource(R.drawable.ic_location);
        } else if (status == STATUS_ARRIVED) {
            stepHintTxt.setText(collectCash ? "Collect " + rupees(grandTotal) + ", then ask the customer for the OTP."
                    : "Ask the customer for the 4-digit OTP.");
            actionBtn.setText("Enter OTP & deliver");
            actionBtn.setIconResource(R.drawable.ic_lock);
        } else if (!finished) {
            stepHintTxt.setText("The store is preparing this order.");
            actionBtn.setText("Waiting for the store");
            actionBtn.setIcon(null);
        }
        boolean canAct = status == STATUS_ASSIGNED || status == STATUS_OUT || status == STATUS_ARRIVED;
        actionBtn.setEnabled(canAct);
        actionBtn.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(this,
                canAct ? R.color.clikgett_green_primary : R.color.clikgett_text_muted)));
    }

    private View itemRow(JSONObject item, boolean checkable) {
        View row = LayoutInflater.from(this).inflate(R.layout.item_order_product, itemsContainer, false);
        ImageView img = row.findViewById(R.id.item_img);
        ImageView check = row.findViewById(R.id.item_check);
        TextView name = row.findViewById(R.id.item_name_txt);
        TextView unitTxt = row.findViewById(R.id.item_unit_txt);
        TextView qty = row.findViewById(R.id.item_qty_txt);

        name.setText(item.optString("ProductName", "").trim());
        String unit = unit(item);
        unitTxt.setText(unit);
        unitTxt.setVisibility(unit.isEmpty() ? View.GONE : View.VISIBLE);
        int quantity = item.optInt("Quantity", 1);
        qty.setText("× " + quantity);
        if (quantity > 1) {
            // Easy to miss when checking the bag, so multiples stand out.
            qty.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(this, R.color.clikgett_green_primary)));
            qty.setTextColor(ContextCompat.getColor(this, R.color.white));
        }

        String url = imageUrl(item);
        if (url != null) {
            Picasso.get().load(url).placeholder(R.drawable.ic_baseline_crop_original_24)
                    .error(R.drawable.ic_baseline_crop_original_24).fit().centerInside().into(img);
        } else {
            img.setImageResource(R.drawable.ic_baseline_crop_original_24);
        }

        String key = itemKey(item);
        Runnable paint = () -> {
            boolean on = checkable && checkedItems.contains(key);
            check.setVisibility(on ? View.VISIBLE : View.GONE);
            row.setBackgroundColor(on ? ContextCompat.getColor(this, R.color.checked_row_bg) : 0);
            name.setTypeface(null, on ? Typeface.BOLD : Typeface.NORMAL);
        };
        paint.run();
        if (checkable) {
            row.setOnClickListener(v -> {
                if (!checkedItems.remove(key)) checkedItems.add(key);
                saveChecks();
                paint.run();
                updateItemsProgress();
            });
        } else {
            row.setClickable(false);
        }
        return row;
    }

    /** Items, discounts, delivery fee, tip and wallet, adding up to the order total. */
    private void renderBill(String method, boolean cashOrder, boolean collectCash, boolean cancelled) {
        LinearLayout rows = findViewById(R.id.bill_rows);
        rows.removeAllViews();
        double items = order.optDouble("SubTotal", 0);
        double discount = order.optDouble("PromoAmount", 0);
        if (discount <= 0) discount = order.optDouble("Discount", 0);
        double delivery = order.optDouble("DeliverCharges", 0);
        double tip = order.optDouble("TipAmount", 0);
        double wallet = order.optDouble("WalletAmount", 0);
        double total = order.optDouble("GrandTotal", 0);

        findViewById(R.id.bill_card).setVisibility(items > 0 || total > 0 ? View.VISIBLE : View.GONE);
        rows.addView(billRow("Items total", rupees(items), false));
        if (discount > 0) rows.addView(billRow("Discount", "− " + rupees(discount), true));
        rows.addView(billRow("Delivery fee", delivery > 0 ? rupees(delivery) : "FREE", delivery <= 0));
        if (tip > 0) rows.addView(billRow("Tip for you", rupees(tip), false));
        if (wallet > 0) rows.addView(billRow("Paid from wallet", "− " + rupees(wallet), true));
        // Older orders may not add up exactly; show the difference instead of a wrong sum.
        double other = Math.round((total - (items - discount + delivery + tip - wallet)) * 100) / 100.0;
        if (Math.abs(other) >= 0.5) rows.addView(billRow("Other adjustments", (other < 0 ? "− " : "") + rupees(Math.abs(other)), other < 0));

        TextView label = findViewById(R.id.bill_total_label_txt);
        TextView hint = findViewById(R.id.bill_total_hint_txt);
        TextView amount = findViewById(R.id.bill_total_txt);
        amount.setText(rupees(total));
        if (cancelled) {
            label.setText("Order total");
            hint.setText("Cancelled · nothing to collect");
        } else if (collectCash) {
            label.setText("To collect");
            hint.setText("Cash or UPI from the customer");
        } else if (cashOrder) {
            label.setText("Total paid");
            hint.setText("Collected in cash / UPI");
        } else {
            label.setText("Total paid");
            hint.setText("WALLET".equals(method) || total == 0 ? "Paid from wallet" : "Paid online");
        }
        amount.setTextColor(ContextCompat.getColor(this, collectCash ? R.color.amber_text : R.color.clikgett_text_primary));
    }

    private View billRow(String label, String value, boolean green) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(0, dp(4), 0, dp(4));
        TextView l = new TextView(this);
        l.setText(label);
        l.setTextSize(14);
        l.setTextColor(ContextCompat.getColor(this, R.color.clikgett_text_secondary));
        l.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        TextView v = new TextView(this);
        v.setText(value);
        v.setTextSize(14);
        v.setTextColor(ContextCompat.getColor(this, green ? R.color.clikgett_green_dark : R.color.clikgett_text_primary));
        if (green) v.setTypeface(null, Typeface.BOLD);
        row.addView(l);
        row.addView(v);
        return row;
    }

    private static String itemKey(JSONObject item) {
        return item.optString("OrderItemID", item.optString("VariantID", item.optString("ProductName", "").trim()));
    }

    private View divider() {
        View line = new View(this);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 1);
        lp.setMarginStart(dp(86));
        line.setLayoutParams(lp);
        line.setBackgroundColor(ContextCompat.getColor(this, R.color.clikgett_divider));
        return line;
    }

    private int checkedCount() {
        JSONArray items = order != null ? order.optJSONArray("orderitems") : null;
        if (items == null) return 0;
        int n = 0;
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item != null && checkedItems.contains(itemKey(item))) n++;
        }
        return n;
    }

    private void updateItemsProgress() {
        if (status != STATUS_ASSIGNED || itemLines == 0) {
            itemsProgressTxt.setVisibility(View.GONE);
            return;
        }
        int done = checkedCount();
        itemsProgressTxt.setVisibility(View.VISIBLE);
        itemsProgressTxt.setText(done == itemLines ? "All checked" : done + " / " + itemLines + " checked");
    }

    /** Product photo: the one saved on the order line, else the product's first image. */
    private static String imageUrl(JSONObject item) {
        String url = item.optString("ImageUrl", "").trim();
        if (url.isEmpty() || "NA".equalsIgnoreCase(url) || "null".equalsIgnoreCase(url)) {
            JSONArray images = item.optJSONArray("ProductImages");
            url = images != null && images.length() > 0 ? images.optString(0, "") : "";
        }
        if (url.isEmpty() || !url.startsWith("http")) return null;
        return url.replace(" ", "%20");
    }

    /** Pick up -> On the way -> Arrived -> Delivered, drawn in the header. */
    private void renderSteps(int s) {
        final String[] labels = {"Pick up", "On the way", "Arrived", "Delivered"};
        int current;
        if (s == STATUS_OUT) current = 1;
        else if (s == STATUS_ARRIVED) current = 2;
        else if (s == STATUS_DELIVERED) current = labels.length;
        else current = 0;
        boolean cancelled = s == STATUS_CANCELLED_STORE || s == STATUS_CANCELLED_CUSTOMER || s == STATUS_RETURNED;
        stepsContainer.setVisibility(cancelled ? View.GONE : View.VISIBLE);
        stepsContainer.removeAllViews();
        int white = ContextCompat.getColor(this, R.color.white);
        int faint = ContextCompat.getColor(this, R.color.white_40);
        for (int i = 0; i < labels.length; i++) {
            boolean done = i < current;
            boolean now = i == current;

            LinearLayout col = new LinearLayout(this);
            col.setOrientation(LinearLayout.VERTICAL);
            col.setGravity(Gravity.CENTER_HORIZONTAL);
            col.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

            LinearLayout track = new LinearLayout(this);
            track.setOrientation(LinearLayout.HORIZONTAL);
            track.setGravity(Gravity.CENTER_VERTICAL);
            track.addView(line(i == 0 ? 0 : (i <= current ? white : faint)));
            View dot = new View(this);
            int size = dp(now ? 16 : 12);
            dot.setLayoutParams(new LinearLayout.LayoutParams(size, size));
            GradientDrawable shape = new GradientDrawable();
            shape.setShape(GradientDrawable.OVAL);
            shape.setColor(done || now ? white : faint);
            if (now) shape.setStroke(dp(3), ContextCompat.getColor(this, R.color.white_40));
            dot.setBackground(shape);
            track.addView(dot);
            track.addView(line(i == labels.length - 1 ? 0 : (i < current ? white : faint)));
            col.addView(track, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(20)));

            TextView label = new TextView(this);
            label.setText(labels[i]);
            label.setTextSize(11.5f);
            label.setGravity(Gravity.CENTER);
            label.setPadding(0, dp(4), 0, 0);
            label.setTextColor(done || now ? white : faint);
            label.setTypeface(null, now ? Typeface.BOLD : Typeface.NORMAL);
            col.addView(label);
            stepsContainer.addView(col);
        }
    }

    private View line(int color) {
        View v = new View(this);
        v.setLayoutParams(new LinearLayout.LayoutParams(0, dp(2), 1));
        v.setBackgroundColor(color);
        return v;
    }

    // ------------------------------------------------------------------ actions

    private void onAction() {
        if (status == STATUS_ASSIGNED) {
            int missing = itemLines - checkedCount();
            String message = itemLines > 0 && missing > 0
                    ? missing + (missing == 1 ? " item is" : " items are") + " not ticked yet. Make sure you have every item before leaving the store."
                    : "Make sure you have every item before leaving the store.";
            confirm("Picked up the order?", message, "Yes, start delivery",
                    () -> updateStatus(STATUS_OUT, false, null));
        } else if (status == STATUS_OUT) {
            updateStatus(STATUS_ARRIVED, false, null);
        } else if (status == STATUS_ARRIVED) {
            askOtp();
        }
    }

    /** Changes the status with the rider's current location (the server checks arrival distance). */
    private void updateStatus(int target, boolean manualOverride, String overrideReason) {
        withLocation(location -> {
            try {
                JSONObject body = new JSONObject().put("OrderStatus", target);
                if (location != null) {
                    body.put("Latitude", location.getLatitude());
                    body.put("Longitude", location.getLongitude());
                }
                if (manualOverride) {
                    body.put("manualOverride", true);
                    body.put("overrideReason", overrideReason);
                }
                ProgressDialog progress = progress("Updating...");
                Api.put(this, "deliveryboy/updatestatus/" + orderId, body, response -> {
                    progress.dismiss();
                    if (response.optInt("Status") == 1) {
                        if (target == STATUS_OUT) trackOrder(orderId);
                        Toast.makeText(this, target == STATUS_OUT ? "Delivery started" : "Customer has been sent the OTP", Toast.LENGTH_SHORT).show();
                        load();
                    } else if (response.optBoolean("RequiresOverride", false)) {
                        confirm("You seem far from the customer",
                                response.optString("Message") + "\n\nMark as arrived anyway?",
                                "Yes, I'm here",
                                () -> updateStatus(target, true, "Rider confirmed arrival; GPS or address pin mismatch"));
                    } else {
                        Toast.makeText(this, response.optString("Message", "Could not update the order"), Toast.LENGTH_LONG).show();
                        load();
                    }
                });
            } catch (Exception e) {
                Toast.makeText(this, "Could not update the order", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void askOtp() {
        EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_NUMBER);
        input.setFilters(new InputFilter[]{new InputFilter.LengthFilter(6)});
        input.setGravity(Gravity.CENTER);
        input.setTextSize(26);
        input.setLetterSpacing(0.4f);
        input.setHint("OTP");
        LinearLayout wrap = new LinearLayout(this);
        wrap.setPadding(dp(24), dp(8), dp(24), 0);
        wrap.addView(input, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Enter the customer's OTP")
                .setMessage("The customer can see the OTP in the ClikGett app and in their notification.")
                .setView(wrap)
                .setPositiveButton("Deliver", null)
                .setNeutralButton("Resend OTP", null)
                .setNegativeButton("Cancel", null)
                .create();
        dialog.setOnShowListener(d -> {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
                String otp = input.getText().toString().trim();
                if (otp.length() < 4) {
                    input.setError("Enter the 4-digit OTP");
                    return;
                }
                deliver(otp, dialog);
            });
            dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(v -> resendOtp());
        });
        dialog.show();
    }

    private void deliver(String otp, AlertDialog dialog) {
        withLocation(location -> {
            try {
                JSONObject body = new JSONObject().put("OTP", otp);
                if (location != null) {
                    body.put("Latitude", location.getLatitude());
                    body.put("Longitude", location.getLongitude());
                }
                ProgressDialog progress = progress("Completing delivery...");
                Api.post(this, "deliveryboy/deliver/" + orderId, body, response -> {
                    progress.dismiss();
                    if (response.optInt("Status") == 1) {
                        dialog.dismiss();
                        trackOrder(null);
                        checksPref().edit().remove(checksKey()).apply();
                        Toast.makeText(this, "Order delivered", Toast.LENGTH_LONG).show();
                        load();
                    } else {
                        Toast.makeText(this, response.optString("Message", "Wrong OTP"), Toast.LENGTH_LONG).show();
                    }
                });
            } catch (Exception e) {
                Toast.makeText(this, "Could not complete the delivery", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void resendOtp() {
        try {
            Api.post(this, "deliveryboy/sendotp_order", new JSONObject().put("OrderID", orderId), response ->
                    Toast.makeText(this, response.optInt("Status") == 1 ? "OTP sent to the customer again"
                            : response.optString("Message", "Could not resend the OTP"), Toast.LENGTH_LONG).show());
        } catch (Exception ignored) {
        }
    }

    private void callCustomer() {
        String phone = order != null ? order.optString("MobileNumber", "") : "";
        if (phone.isEmpty()) return;
        startActivity(new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + phone)));
    }

    private void navigate() {
        if (order == null) return;
        String lat = order.optString("Latitude");
        String lng = order.optString("Longitude");
        Intent maps = new Intent(Intent.ACTION_VIEW, Uri.parse("google.navigation:q=" + lat + "," + lng + "&mode=d"));
        maps.setPackage("com.google.android.apps.maps");
        if (maps.resolveActivity(getPackageManager()) != null) {
            startActivity(maps);
        } else {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng)));
        }
    }

    /** Tags the rider's location pings with this order (or clears it). */
    private void trackOrder(String id) {
        try {
            Intent intent = new Intent(this, LocationTrackingService.class);
            intent.setAction(LocationTrackingService.ACTION_SET_ORDER);
            int numericId = 0;
            try {
                numericId = id != null ? Integer.parseInt(id) : 0;
            } catch (NumberFormatException ignored) {
            }
            intent.putExtra(LocationTrackingService.EXTRA_ORDER_ID, numericId);
            startService(intent);
        } catch (Exception ignored) {
            // Tracking service is not running (rider offline).
        }
    }

    private void reportDelay() {
        final String[] labels = {"Heavy traffic", "Bad weather", "Order not ready at store", "Can't find the customer", "Vehicle problem", "Other"};
        final String[] codes = {"HEAVY_TRAFFIC", "WEATHER_CONDITIONS", "ORDER_NOT_READY", "DIFFICULTY_LOCATING_CUSTOMER", "VEHICLE_ISSUE", "OTHER"};
        new AlertDialog.Builder(this)
                .setTitle("Why are you delayed?")
                .setItems(labels, (d, which) -> {
                    if ("OTHER".equals(codes[which])) {
                        askNote("What is causing the delay?", note -> pickDelayMinutes(codes[which], note));
                    } else {
                        pickDelayMinutes(codes[which], labels[which]);
                    }
                })
                .show();
    }

    private void pickDelayMinutes(String reason, String remarks) {
        final String[] minuteLabels = {"5 minutes", "10 minutes", "15 minutes", "20 minutes", "30 minutes"};
        final int[] minutes = {5, 10, 15, 20, 30};
        new AlertDialog.Builder(this)
                .setTitle("How much extra time?")
                .setItems(minuteLabels, (d, m) -> {
                    try {
                        JSONObject body = new JSONObject()
                                .put("OrderID", orderId)
                                .put("Reason", reason)
                                .put("RequestedMinutes", minutes[m])
                                .put("Remarks", remarks);
                        Api.post(this, "deliveryboy/orders/report-delay", body, r ->
                                Toast.makeText(this, r.optInt("Status") == 1 ? "Delay reported. The customer has been updated."
                                        : r.optString("Message", "Could not report the delay"), Toast.LENGTH_LONG).show());
                    } catch (Exception ignored) {
                    }
                })
                .show();
    }

    private void reportIssue() {
        final String[] labels = {"Customer not reachable", "Wrong address", "Vehicle breakdown", "Problem with the order", "Road blocked", "App problem", "Other"};
        final String[] codes = {"CUSTOMER_UNREACHABLE", "WRONG_ADDRESS", "VEHICLE_BREAKDOWN", "ORDER_PROBLEM", "ROAD_BLOCK", "APP_PROBLEM", "OTHER"};
        new AlertDialog.Builder(this)
                .setTitle("What's the problem?")
                .setItems(labels, (d, which) -> {
                    if ("OTHER".equals(codes[which])) {
                        askNote("Describe the problem", note -> sendIssue(codes[which], note));
                    } else {
                        sendIssue(codes[which], labels[which]);
                    }
                })
                .show();
    }

    private void sendIssue(String issueType, String description) {
        withLocation(location -> {
            try {
                JSONObject body = new JSONObject()
                        .put("OrderID", orderId)
                        .put("IssueType", issueType)
                        .put("Description", description);
                if (location != null) {
                    body.put("Latitude", location.getLatitude());
                    body.put("Longitude", location.getLongitude());
                }
                Api.post(this, "deliveryboy/orders/report-issue", body, r ->
                        Toast.makeText(this, r.optInt("Status") == 1 ? "Reported. The store will contact you."
                                : r.optString("Message", "Could not report the problem"), Toast.LENGTH_LONG).show());
            } catch (Exception ignored) {
            }
        });
    }

    private interface NoteCallback {
        void onNote(String note);
    }

    /** Asks the rider for a short explanation ("Other" reasons need one). */
    private void askNote(String title, NoteCallback callback) {
        EditText input = new EditText(this);
        input.setHint("A few words for the store");
        input.setMinLines(2);
        LinearLayout wrap = new LinearLayout(this);
        wrap.setPadding(dp(24), dp(8), dp(24), 0);
        wrap.addView(input, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle(title)
                .setView(wrap)
                .setPositiveButton("Continue", null)
                .setNegativeButton("Cancel", null)
                .create();
        dialog.setOnShowListener(x -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String note = input.getText().toString().trim();
            if (note.length() < 5) {
                input.setError("Please write at least a few words");
                return;
            }
            dialog.dismiss();
            callback.onNote(note);
        }));
        dialog.show();
    }

    // ------------------------------------------------------------------ helpers

    private interface LocationCallback {
        void onLocation(Location location);
    }

    @SuppressLint("MissingPermission")
    private void withLocation(LocationCallback callback) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            callback.onLocation(null);
            return;
        }
        locationClient.getLastLocation()
                .addOnSuccessListener(callback::onLocation)
                .addOnFailureListener(e -> callback.onLocation(null));
    }

    private void confirm(String title, String message, String yes, Runnable onYes) {
        new AlertDialog.Builder(this)
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton(yes, (d, w) -> onYes.run())
                .setNegativeButton("Cancel", null)
                .show();
    }

    private ProgressDialog progress(String message) {
        ProgressDialog p = new ProgressDialog(this);
        p.setMessage(message);
        p.setCancelable(false);
        p.show();
        return p;
    }

    private static String statusLabel(int s) {
        switch (s) {
            case 8: return "New";
            case 9: return "Packing";
            case STATUS_ASSIGNED: return "Pick up";
            case STATUS_OUT: return "On the way";
            case STATUS_ARRIVED: return "Arrived";
            case STATUS_DELIVERED: return "Delivered";
            case STATUS_CANCELLED_STORE:
            case STATUS_CANCELLED_CUSTOMER: return "Cancelled";
            case STATUS_RETURNED: return "Returned";
            default: return "";
        }
    }

    private static String joinInstructions(Object raw) {
        JSONArray list = null;
        if (raw instanceof JSONArray) list = (JSONArray) raw;
        else if (raw instanceof String) {
            try {
                list = new JSONArray((String) raw);
            } catch (Exception ignored) {
            }
        }
        if (list == null || list.length() == 0) return "";
        StringBuilder sb = new StringBuilder("Note: ");
        for (int i = 0; i < list.length(); i++) {
            if (i > 0) sb.append(" · ");
            sb.append(list.optString(i));
        }
        return sb.toString();
    }

    private static String unit(JSONObject item) {
        double v = item.optDouble("metricvalue", 0);
        String t = item.optString("metrictype", "").trim();
        if (v == 0 && t.isEmpty()) return "";
        String value = v == Math.rint(v) ? String.valueOf((long) v) : String.valueOf(v);
        return (value + " " + t).trim();
    }

    private static void appendPart(StringBuilder sb, String part) {
        if (part == null) return;
        String p = part.trim();
        if (p.isEmpty() || "NA".equalsIgnoreCase(p) || "null".equalsIgnoreCase(p)) return;
        if (sb.length() > 0) sb.append(", ");
        sb.append(p);
    }

    private static String rupees(double v) {
        return v == Math.rint(v) ? String.format(Locale.ENGLISH, "₹%,d", (long) v) : String.format(Locale.ENGLISH, "₹%,.2f", v);
    }

    private static String pad(String id) {
        try {
            return String.format(Locale.ROOT, "%04d", Integer.parseInt(id));
        } catch (Exception e) {
            return id;
        }
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
