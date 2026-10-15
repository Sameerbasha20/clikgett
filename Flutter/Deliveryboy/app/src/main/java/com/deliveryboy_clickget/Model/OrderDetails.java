package com.deliveryboy_clickget.Model;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class OrderDetails {
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
    private Integer subTotal;
    @SerializedName("Discount")
    @Expose
    private Integer discount;
    @SerializedName("TaxAmount")
    @Expose
    private Integer taxAmount;
    @SerializedName("PromoAmount")
    @Expose
    private Integer promoAmount;
    @SerializedName("DeliverCharges")
    @Expose
    private Integer deliverCharges;
    @SerializedName("GrandTotal")
    @Expose
    private Integer grandTotal;
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
    @SerializedName("EmailID")
    @Expose
    private String emailID;

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

    public Integer getSubTotal() {
        return subTotal;
    }

    public void setSubTotal(Integer subTotal) {
        this.subTotal = subTotal;
    }

    public Integer getDiscount() {
        return discount;
    }

    public void setDiscount(Integer discount) {
        this.discount = discount;
    }

    public Integer getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(Integer taxAmount) {
        this.taxAmount = taxAmount;
    }

    public Integer getPromoAmount() {
        return promoAmount;
    }

    public void setPromoAmount(Integer promoAmount) {
        this.promoAmount = promoAmount;
    }

    public Integer getDeliverCharges() {
        return deliverCharges;
    }

    public void setDeliverCharges(Integer deliverCharges) {
        this.deliverCharges = deliverCharges;
    }

    public Integer getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(Integer grandTotal) {
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

    public String getEmailID() {
        return emailID;
    }

    public void setEmailID(String emailID) {
        this.emailID = emailID;
    }

}
