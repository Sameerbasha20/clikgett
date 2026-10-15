package com.deliveryboy_clickget.Model;

import java.io.Serializable;
import java.util.List;

public class OrderListItems implements Serializable {
    public String getProductName() {
        return ProductName;
    }

    public void setProductName(String productName) {
        ProductName = productName;
    }

    String ProductName;

    public String getMetrictype() {
        return metrictype;
    }

    public void setMetrictype(String metrictype) {
        this.metrictype = metrictype;
    }

    String metrictype;

    public String getImageUrl() {
        return ImageUrl;
    }

    public void setImageUrl(String imageUrl) {
        ImageUrl = imageUrl;
    }

    public double getMetricvalue() {
        return metricvalue;
    }

    public void setMetricvalue(double metricvalue) {
        this.metricvalue = metricvalue;
    }

    public double getPrice() {
        return Price;
    }

    public void setPrice(double price) {
        Price = price;
    }

    String ImageUrl;
    double metricvalue;
    double Price;

    public List<String> getProductImages() {
        return ProductImages;
    }

    public void setProductImages(List<String> productImages) {
        ProductImages = productImages;
    }

    private List<String> ProductImages; // Add this field for product images

    public double getOfferPrice() {
        return OfferPrice;
    }

    public void setOfferPrice(double offerPrice) {
        OfferPrice = offerPrice;
    }

    double OfferPrice;

    public double getQty() {
        return qty;
    }

    public void setQty(double qty) {
        this.qty = qty;
    }

    double qty;
}
