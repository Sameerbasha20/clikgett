package com.deliveryboy_clickget;

import android.graphics.Typeface;
import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.deliveryboy_clickget.Utils.Api;

import org.json.JSONObject;

import java.util.Locale;

/** Deliveries, cash collected, tips and points for today, this week and all time. */
public class StatusActivity extends AppCompatActivity {

    private LinearLayout container;
    private TextView cashNote;
    private SwipeRefreshLayout swipe;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_status);
        container = findViewById(R.id.periods_container);
        cashNote = findViewById(R.id.cash_note_txt);
        swipe = findViewById(R.id.swipe_refresh);
        swipe.setColorSchemeResources(R.color.clikgett_green_primary);
        swipe.setOnRefreshListener(this::load);
        findViewById(R.id.back_img).setOnClickListener(v -> finish());
        load();
    }

    private void load() {
        swipe.setRefreshing(true);
        Api.get(this, "deliveryboy/summary", response -> {
            swipe.setRefreshing(false);
            if (response.optInt("Status") != 1) {
                Toast.makeText(this, response.optString("Message", "Could not load your summary"), Toast.LENGTH_LONG).show();
                return;
            }
            // Keep the cash note (first child), rebuild the period cards.
            while (container.getChildCount() > 1) container.removeViewAt(1);
            JSONObject today = response.optJSONObject("Today");
            double cashToday = today != null ? today.optDouble("CashCollected", 0) : 0;
            cashNote.setVisibility(cashToday > 0 ? View.VISIBLE : View.GONE);
            cashNote.setText("Cash collected today: " + rupees(cashToday) + ". Hand it over at the store.");
            addPeriod("Today", today);
            addPeriod("This week", response.optJSONObject("Week"));
            addPeriod("All time", response.optJSONObject("AllTime"));
        });
    }

    private void addPeriod(String title, JSONObject data) {
        if (data == null) return;
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(R.drawable.bg_card_surface);
        card.setPadding(dp(14), dp(14), dp(14), dp(14));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.bottomMargin = dp(12);
        card.setLayoutParams(lp);

        TextView heading = new TextView(this);
        heading.setText(title);
        heading.setTextSize(15);
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        heading.setTextColor(ContextCompat.getColor(this, R.color.clikgett_text_primary));
        card.addView(heading);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(0, dp(10), 0, 0);
        row.addView(stat(String.valueOf(data.optInt("Delivered")), "Delivered"));
        row.addView(stat(rupees(data.optDouble("CashCollected", 0)), "Cash collected"));
        row.addView(stat(rupees(data.optDouble("Tips", 0)), "Tips"));
        row.addView(stat(String.valueOf(data.optInt("Points")), "Points"));
        card.addView(row);
        container.addView(card);
    }

    private View stat(String value, String label) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        TextView v = new TextView(this);
        v.setText(value);
        v.setTextSize(17);
        v.setTypeface(Typeface.DEFAULT_BOLD);
        v.setTextColor(ContextCompat.getColor(this, R.color.clikgett_green_dark));
        TextView l = new TextView(this);
        l.setText(label);
        l.setTextSize(11);
        l.setTextColor(ContextCompat.getColor(this, R.color.clikgett_text_secondary));
        box.addView(v);
        box.addView(l);
        return box;
    }

    private static String rupees(double v) {
        return v == Math.rint(v) ? "₹" + (long) v : String.format(Locale.ROOT, "₹%.2f", v);
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
