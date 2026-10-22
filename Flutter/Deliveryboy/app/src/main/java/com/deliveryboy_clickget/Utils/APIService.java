package com.deliveryboy_clickget.Utils;

import com.deliveryboy_clickget.Model.OrdersListDeo;
import com.deliveryboy_clickget.Model.SendotpDeo;
import com.deliveryboy_clickget.Model.Verifyotp;

import retrofit2.Call;
import retrofit2.http.Field;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;

/** Login and order lists. Order actions use {@link Api} (OrderDetailsActivity). */
public interface APIService {

    @FormUrlEncoded
    @POST("deliveryboy/sendotp")
    Call<SendotpDeo> sentotp(@Field("MobileNumber") String MobileNumber);

    @FormUrlEncoded
    @POST("deliveryboy/login")
    Call<Verifyotp> loginotpverify(@Field("MobileNumber") String MobileNumber, @Field("OTP") String OTP);

    @GET("deliveryboy/getroutes?Type=pending")
    Call<OrdersListDeo> getcurrentorders(@Header("Authorization") String auth);

    @GET("deliveryboy/getroutes?Type=past")
    Call<OrdersListDeo> getpastorders(@Header("Authorization") String auth);
}
