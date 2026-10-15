package com.deliveryboy_clickget.Model;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class OrderDetailsModel {
    @SerializedName("Status")
    @Expose
    private Integer status;
    @SerializedName("Orders")
    @Expose
    private OrderDetails orders;

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public OrderDetails getOrders() {
        return orders;
    }

    public void setOrders(OrderDetails orders) {
        this.orders = orders;
    }
}
