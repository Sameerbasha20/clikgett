package com.deliveryboy_clickget.Model;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class OrderStatusModel {
    @SerializedName("Status")
    @Expose
    private Integer status;
    @SerializedName("OrdersStatus")
    @Expose
    private OrdersStatus ordersStatus;

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public OrdersStatus getOrdersStatus() {
        return ordersStatus;
    }

    public void setOrdersStatus(OrdersStatus ordersStatus) {
        this.ordersStatus = ordersStatus;
    }
}
