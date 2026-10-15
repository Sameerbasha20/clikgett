package com.deliveryboy_clickget.Model;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class RouteByOrderList {
    @SerializedName("OrderID")
    @Expose
    private Integer orderID;
    @SerializedName("CartID")
    @Expose
    private Integer cartID;
    @SerializedName("MobileNumber")
    @Expose
    private String mobileNumber;
    @SerializedName("UserID")
    @Expose
    private Integer userID;
    @SerializedName("PromoCode")
    @Expose
    private String promoCode;
    @SerializedName("SubTotal")
    @Expose
    private Double subTotal;
    @SerializedName("Discount")
    @Expose
    private Double discount;
    @SerializedName("TaxAmount")
    @Expose
    private Double taxAmount;
    @SerializedName("PromoAmount")
    @Expose
    private Double promoAmount;
    @SerializedName("DeliverCharges")
    @Expose
    private Double deliverCharges;
    @SerializedName("GrandTotal")
    @Expose
    private Double grandTotal;
    @SerializedName("PaymentMethod")
    @Expose
    private String paymentMethod;
    @SerializedName("Address")
    @Expose
    private String address;
    @SerializedName("FlatNo")
    @Expose
    private String flatNo;
    @SerializedName("City")
    @Expose
    private String city;
    @SerializedName("LandMark")
    @Expose
    private String landMark;
    @SerializedName("Latitude")
    @Expose
    private Double latitude;
    @SerializedName("Longitude")
    @Expose
    private Double longitude;
    @SerializedName("PaymentStatus")
    @Expose
    private Integer paymentStatus;
    @SerializedName("PaymentTransactionID")
    @Expose
    private String paymentTransactionID;
    @SerializedName("OrderStatus")
    @Expose
    private Integer orderStatus;
    @SerializedName("DeliveryBoyID")
    @Expose
    private Integer deliveryBoyID;
    @SerializedName("RazorpayOrderID")
    @Expose
    private String razorpayOrderID;
    @SerializedName("CancellationReason")
    @Expose
    private String cancellationReason;
    @SerializedName("Delivered_datetime")
    @Expose
    private String deliveredDatetime;
    @SerializedName("EstimateDateTime")
    @Expose
    private String estimateDateTime;
    @SerializedName("CreatedAt")
    @Expose
    private String createdAt;
    @SerializedName("UpdatedAt")
    @Expose
    private String updatedAt;
    @SerializedName("UserName")
    @Expose
    private String userName;

    public Integer getOrderID() {
        return orderID;
    }

    public void setOrderID(Integer orderID) {
        this.orderID = orderID;
    }

    public Integer getCartID() {
        return cartID;
    }

    public void setCartID(Integer cartID) {
        this.cartID = cartID;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public Integer getUserID() {
        return userID;
    }

    public void setUserID(Integer userID) {
        this.userID = userID;
    }

    public String getPromoCode() {
        return promoCode;
    }

    public void setPromoCode(String promoCode) {
        this.promoCode = promoCode;
    }

    public Double getSubTotal() {
        return subTotal;
    }

    public void setSubTotal(Double subTotal) {
        this.subTotal = subTotal;
    }

    public Double getDiscount() {
        return discount;
    }

    public void setDiscount(Double discount) {
        this.discount = discount;
    }

    public Double getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(Double taxAmount) {
        this.taxAmount = taxAmount;
    }

    public Double getPromoAmount() {
        return promoAmount;
    }

    public void setPromoAmount(Double promoAmount) {
        this.promoAmount = promoAmount;
    }

    public Double getDeliverCharges() {
        return deliverCharges;
    }

    public void setDeliverCharges(Double deliverCharges) {
        this.deliverCharges = deliverCharges;
    }

    public Double getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(Double grandTotal) {
        this.grandTotal = grandTotal;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getFlatNo() {
        return flatNo;
    }

    public void setFlatNo(String flatNo) {
        this.flatNo = flatNo;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getLandMark() {
        return landMark;
    }

    public void setLandMark(String landMark) {
        this.landMark = landMark;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Integer getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(Integer paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentTransactionID() {
        return paymentTransactionID;
    }

    public void setPaymentTransactionID(String paymentTransactionID) {
        this.paymentTransactionID = paymentTransactionID;
    }

    public Integer getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(Integer orderStatus) {
        this.orderStatus = orderStatus;
    }

    public Integer getDeliveryBoyID() {
        return deliveryBoyID;
    }

    public void setDeliveryBoyID(Integer deliveryBoyID) {
        this.deliveryBoyID = deliveryBoyID;
    }

    public String getRazorpayOrderID() {
        return razorpayOrderID;
    }

    public void setRazorpayOrderID(String razorpayOrderID) {
        this.razorpayOrderID = razorpayOrderID;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getDeliveredDatetime() {
        return deliveredDatetime;
    }

    public void setDeliveredDatetime(String deliveredDatetime) {
        this.deliveredDatetime = deliveredDatetime;
    }

    public String getEstimateDateTime() {
        return estimateDateTime;
    }

    public void setEstimateDateTime(String estimateDateTime) {
        this.estimateDateTime = estimateDateTime;
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

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }
}
