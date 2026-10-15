package com.deliveryboy_clickget.Model;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.util.List;

public class RouteByOrderOrder {
    @SerializedName("RouteID")
    @Expose
    private Integer routeID;
    @SerializedName("Name")
    @Expose
    private String name;
    @SerializedName("OrderIDs")
    @Expose
    private List<Integer> orderIDs = null;
    @SerializedName("Status")
    @Expose
    private Integer status;
    @SerializedName("DeliveryBoyID")
    @Expose
    private Integer deliveryBoyID;
    @SerializedName("CreatedAt")
    @Expose
    private String createdAt;
    @SerializedName("UpdatedAt")
    @Expose
    private String updatedAt;
    @SerializedName("Orders")
    @Expose
    private List<RouteByOrderList> orders = null;

    public Integer getRouteID() {
        return routeID;
    }

    public void setRouteID(Integer routeID) {
        this.routeID = routeID;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<Integer> getOrderIDs() {
        return orderIDs;
    }

    public void setOrderIDs(List<Integer> orderIDs) {
        this.orderIDs = orderIDs;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Integer getDeliveryBoyID() {
        return deliveryBoyID;
    }

    public void setDeliveryBoyID(Integer deliveryBoyID) {
        this.deliveryBoyID = deliveryBoyID;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<RouteByOrderList> getOrders() {
        return orders;
    }

    public void setOrders(List<RouteByOrderList> orders) {
        this.orders = orders;
    }
}
