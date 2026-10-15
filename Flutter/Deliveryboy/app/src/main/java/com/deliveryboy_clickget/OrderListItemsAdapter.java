package com.deliveryboy_clickget;

import android.content.Context;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.recyclerview.widget.RecyclerView;
import androidx.viewpager2.widget.ViewPager2;

import com.deliveryboy_clickget.Model.OrderListItems;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.List;

public class OrderListItemsAdapter extends RecyclerView.Adapter<OrderListItemsAdapter.MyViewHolder> {
    private List<OrderListItems> orderLists;
    Context context;

    public OrderListItemsAdapter(Context applicationContext, List<OrderListItems> orderLists) {
        this.context = applicationContext;
        this.orderLists = orderLists;
    }

    public class MyViewHolder extends RecyclerView.ViewHolder {
        public TextView productname_txt, productamount_txt, productmetricvalue_txt;
        ImageView setproduct_img;
        ViewPager2 viewPager;
        TabLayout tabLayout ;



        public MyViewHolder(View view) {
            super(view);
            viewPager = view.findViewById(R.id.viewPager);
             tabLayout = view.findViewById(R.id.tab_layout);

//            setproduct_img = view.findViewById(R.id.setproduct_img);
            productname_txt = view.findViewById(R.id.productname_txt);
            productamount_txt = view.findViewById(R.id.productamount_txt);
            productmetricvalue_txt = view.findViewById(R.id.productmetricvalue_txt);
        }
    }


    @Override
    public MyViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View itemView = LayoutInflater.from(parent.getContext()).inflate(R.layout.orders_list, parent, false);
        return new MyViewHolder(itemView);
    }

    @Override
    public void onBindViewHolder(MyViewHolder holder, int position) {
        holder.productname_txt.setText(orderLists.get(position).getProductName());
        String productAmount = String.valueOf(orderLists.get(position).getOfferPrice());
        double qty = orderLists.get(position).getQty();
        double metric = orderLists.get(position).getMetricvalue();
        String metrictype = orderLists.get(position).getMetrictype();

//        List<String> productImg = orderLists.get(position).getProductImages();
//        if (productImg.equalsIgnoreCase("NA")) {
//            holder.setproduct_img.setImageResource(R.drawable.ic_baseline_crop_original_24);
//        } else {
//            Picasso.get().load(productImg).fit()
//                    .centerCrop().into(holder.setproduct_img);
//        }
        List<String> productImg = orderLists.get(position).getProductImages();
        if (productImg != null && !productImg.isEmpty()) {
            ImagePagerAdapter adapter = new ImagePagerAdapter(productImg);
            holder.viewPager.setAdapter(adapter);
            if(productImg.size()>1){
                new TabLayoutMediator(holder.tabLayout, holder.viewPager, (tab, tabPosition) -> {
                    // Optional: Customize the tab if needed
                }).attach();
            }

        } else {
            // Handle case where no images are available
            List<String> defaultImg = new ArrayList<>();
            defaultImg.add("NA"); // Or some placeholder logic
            ImagePagerAdapter adapter = new ImagePagerAdapter(defaultImg);
            holder.viewPager.setAdapter(adapter);
            if(productImg.size()>1){
                new TabLayoutMediator(holder.tabLayout, holder.viewPager, (tab, tabPosition) -> {
                    // Optional: Customize the tab if needed
                }).attach();
            }
        }

        holder.productamount_txt.setText("₹" + productAmount);
        Log.d("Amountoff", "" + productAmount);
        holder.productmetricvalue_txt.setText("" + metric + metrictype + "  "  + " X " + (int) qty);

//        holder.productmetricvalue_txt.setText("" + (int) metric + metrictype + "  " + (int) qty + " X Qty");
    }

    @Override
    public int getItemCount() {
        return orderLists.size();
    }
}