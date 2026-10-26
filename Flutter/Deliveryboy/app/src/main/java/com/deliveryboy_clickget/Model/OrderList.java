package com.deliveryboy_clickget.Model;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class OrderList {
    @SerializedName("OrderID")
    @Expose
    private Integer orderID;
    @SerializedName("MobileNumber")
    @Expose
    private String mobileNumber;
    @SerializedName("CancellationReason")
    @Expose
    private String cancellationReason;
    @SerializedName("City")
    @Expose
    private String city;

    public String getUserName() {
        return UserName;
    }

    public void setUserName(String userName) {
        UserName = userName;
    }

    @SerializedName("UserName")
    @Expose
    private String UserName;

    public String getOrderSequence() {
        return OrderSequence;
    }

    public void setOrderSequence(String orderSequence) {
        OrderSequence = orderSequence;
    }

    @SerializedName("OrderSequence")
    @Expose
    private String OrderSequence;
    @SerializedName("CartID")
    @Expose
    private Integer cartID;
    @SerializedName("UserID")
    @Expose
    private Integer userID;
    @SerializedName("PromoCode")
    @Expose
    private String promoCode;
    @SerializedName("SubTotal")
    @Expose
    private String subTotal;
    @SerializedName("TaxAmount")
    @Expose
    private Integer taxAmount;
    @SerializedName("PromoAmount")
    @Expose
    private String promoAmount;
    @SerializedName("DeliverCharges")
    @Expose
    private Integer deliverCharges;
    @SerializedName("GrandTotal")
    @Expose
    private String grandTotal;
    @SerializedName("PaymentMethod")
    @Expose
    private String paymentMethod;
    @SerializedName("Address")
    @Expose
    private String address;
    @SerializedName("FlatNo")
    @Expose
    private String flatNo;
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
    @SerializedName("Discount")
    @Expose
    private String discount;
    @SerializedName("EstimateDateTime")
    @Expose
    private String estimateDateTime;
    @SerializedName("EtaMinutesLeft")
    @Expose
    private Integer etaMinutesLeft;
    @SerializedName("EstimateTimeText")
    @Expose
    private String estimateTimeText;
    @SerializedName("DeliveryInstructions")
    @Expose
    private String deliveryInstructions;
    @SerializedName("CreatedAt")
    @Expose
    private String createdAt;
    @SerializedName("UpdatedAt")
    @Expose
    private String updatedAt;
    @SerializedName("Delivered_Cancelled_datetime")
    @Expose
    private String deliveredCancelledDatetime;
    @SerializedName("deliveredDateTime")
    @Expose
    private String deliveredDateTime;
    @SerializedName("IsAssigned")
    @Expose
    private Integer isAssigned;
    @SerializedName("OTP")
    @Expose
    private String otp;
    @SerializedName("OrderType")
    @Expose
    private String orderType;
    @SerializedName("InvoiceFile")
    @Expose
    private String invoiceFile;
    @SerializedName("WalletAmount")
    @Expose
    private String walletAmount;

    public Integer getOrderID() {
        return orderID;
    }

    public void setOrderID(Integer orderID) {
        this.orderID = orderID;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Integer getCartID() {
        return cartID;
    }

    public void setCartID(Integer cartID) {
        this.cartID = cartID;
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

    public String getSubTotal() {
        return subTotal;
    }

    public void setSubTotal(String subTotal) {
        this.subTotal = subTotal;
    }

    public Integer getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(Integer taxAmount) {
        this.taxAmount = taxAmount;
    }

    public String getPromoAmount() {
        return promoAmount;
    }

    public void setPromoAmount(String promoAmount) {
        this.promoAmount = promoAmount;
    }

    public Integer getDeliverCharges() {
        return deliverCharges;
    }

    public void setDeliverCharges(Integer deliverCharges) {
        this.deliverCharges = deliverCharges;
    }

    public String  getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(String grandTotal) {
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

    public String getDiscount() {
        return discount;
    }

    public void setDiscount(String discount) {
        this.discount = discount;
    }

    /** Minutes until the delivery time the customer is shown (server-computed). */
    public Integer getEtaMinutesLeft() {
        return etaMinutesLeft;
    }

    /** That delivery time in IST, e.g. "07:05 PM". */
    public String getEstimateTimeText() {
        return estimateTimeText;
    }

    public String getEstimateDateTime() {
        return estimateDateTime;
    }

    public void setEstimateDateTime(String estimateDateTime) {
        this.estimateDateTime = estimateDateTime;
    }

    public String getDeliveryInstructions() {
        return deliveryInstructions;
    }

    public void setDeliveryInstructions(String deliveryInstructions) {
        this.deliveryInstructions = deliveryInstructions;
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

    public String getDeliveredCancelledDatetime() {
        return deliveredCancelledDatetime;
    }

    public void setDeliveredCancelledDatetime(String deliveredCancelledDatetime) {
        this.deliveredCancelledDatetime = deliveredCancelledDatetime;
    }

    public String getDeliveredDateTime() {
        return deliveredDateTime;
    }

    public void setDeliveredDateTime(String deliveredDateTime) {
        this.deliveredDateTime = deliveredDateTime;
    }

    public Integer getIsAssigned() {
        return isAssigned;
    }

    public void setIsAssigned(Integer isAssigned) {
        this.isAssigned = isAssigned;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public String getInvoiceFile() {
        return invoiceFile;
    }

    public void setInvoiceFile(String invoiceFile) {
        this.invoiceFile = invoiceFile;
    }

    public String getWalletAmount() {
        return walletAmount;
    }

    public void setWalletAmount(String walletAmount) {
        this.walletAmount = walletAmount;
    }
}
//    @SerializedName("RouteID")
//    @Expose
//    private Integer routeID;
//    @SerializedName("Name")
//    @Expose
//    private String name;
//    @SerializedName("OrderIDs")
//    @Expose
//    private String orderIDs;
//    @SerializedName("Status")
//    @Expose
//    private Integer status;
//    @SerializedName("DeliveryBoyID")
//    @Expose
//    private Integer deliveryBoyID;
//    @SerializedName("CreatedAt")
//    @Expose
//    private String createdAt;
//    @SerializedName("UpdatedAt")
//    @Expose
//    private String updatedAt;
//    @SerializedName("NoOfOrders")
//    @Expose
//    private Integer noOfOrders;
//
//    public Integer getRouteID() {
//        return routeID;
//    }
//
//    public void setRouteID(Integer routeID) {
//        this.routeID = routeID;
//    }
//
//    public String getName() {
//        return name;
//    }
//
//    public void setName(String name) {
//        this.name = name;
//    }
//
//    public String getOrderIDs() {
//        return orderIDs;
//    }
//
//    public void setOrderIDs(String orderIDs) {
//        this.orderIDs = orderIDs;
//    }
//
//    public Integer getStatus() {
//        return status;
//    }
//
//    public void setStatus(Integer status) {
//        this.status = status;
//    }
//
//    public Integer getDeliveryBoyID() {
//        return deliveryBoyID;
//    }
//
//    public void setDeliveryBoyID(Integer deliveryBoyID) {
//        this.deliveryBoyID = deliveryBoyID;
//    }
//
//    public String getCreatedAt() {
//        return createdAt;
//    }
//
//    public void setCreatedAt(String createdAt) {
//        this.createdAt = createdAt;
//    }
//
//    public String getUpdatedAt() {
//        return updatedAt;
//    }
//
//    public void setUpdatedAt(String updatedAt) {
//        this.updatedAt = updatedAt;
//    }
//
//    public Integer getNoOfOrders() {
//        return noOfOrders;
//    }
//
//    public void setNoOfOrders(Integer noOfOrders) {
//        this.noOfOrders = noOfOrders;
//    }
//}
