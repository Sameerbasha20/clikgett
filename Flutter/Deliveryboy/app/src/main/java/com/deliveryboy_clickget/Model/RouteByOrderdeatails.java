package com.deliveryboy_clickget.Model;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.util.List;

public class RouteByOrderdeatails {
    @SerializedName("Status")
    @Expose
    private Integer status;
    @SerializedName("Orders")
    @Expose
    private List<RouteByOrderOrder> orders = null;

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public List<RouteByOrderOrder> getOrders() {
        return orders;
    }

    public void setOrders(List<RouteByOrderOrder> orders) {
        this.orders = orders;
    }
}
