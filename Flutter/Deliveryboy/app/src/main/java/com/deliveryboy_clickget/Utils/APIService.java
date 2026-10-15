package com.deliveryboy_clickget.Utils;




import com.deliveryboy_clickget.Model.LoginDeo;
import com.deliveryboy_clickget.Model.OrderDetailsModel;
import com.deliveryboy_clickget.Model.OrderStatusModel;
import com.deliveryboy_clickget.Model.OrdersListDeo;
import com.deliveryboy_clickget.Model.RouteByOrderdeatails;
import com.deliveryboy_clickget.Model.SendotpDeo;
import com.deliveryboy_clickget.Model.UpdateStatusModel;
import com.deliveryboy_clickget.Model.Verifyotp;

import retrofit2.Call;
import retrofit2.http.Field;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;


public interface APIService {

    @FormUrlEncoded
    @POST("deliveryboy/login")
    Call<LoginDeo> loginverify(@Field("EmailID") String EmailID,
                               @Field("Password") String Password);

    @FormUrlEncoded
    @POST("deliveryboy/sendotp")
    Call<SendotpDeo> sentotp(@Field("MobileNumber") String MobileNumber);
    @FormUrlEncoded
    @POST("deliveryboy/sendotp_order")
    Call<SendotpDeo> sentotpuser(@Field("OrderID") String OrderID,@Header("Authorization") String auth);

    @FormUrlEncoded
    @POST("deliveryboy/verifyotp_order")
    Call<SendotpDeo> verifyotp_order(@Field("OrderID") String OrderID,@Field("OTP") String OTP,@Header("Authorization") String auth);

    @GET("deliveryboy/getroutes?Type=pending")
    Call<OrdersListDeo> getcurrentorders(@Header("Authorization") String auth

    );

    @GET("deliveryboy/getroutes?Type=past")
    Call<OrdersListDeo> getpastorders(@Header("Authorization") String auth

    );

    @GET("routes/deliveryboy/detail/{RouteID}")
    Call<RouteByOrderdeatails> getroutesdeliveryboydetail(@Path("RouteID") String RouteID, @Header("Authorization") String auth

    );

    @GET("deliveryboy/orderdetail?OrderID=")
    Call<OrderDetailsModel> getorderdetail(@Path("OrderID") String OrderID, @Header("Authorization") String auth

    );

    @GET("deliveryboy/orderstatus")
    Call<OrderStatusModel> getstatus(@Header("Authorization") String auth

    );

    @FormUrlEncoded
    @PUT("deliveryboy/updatestatus/{OrderID}")
    Call<UpdateStatusModel> updatestatus(@Path("OrderID") String OrderID, @Header("Authorization") String auth,
                                         @Field("OrderStatus") int OrderStatus
    ,  @Field("UserID") int UserID);

    @FormUrlEncoded
    @POST("deliveryboy/login")
    Call<Verifyotp> loginotpverify(@Field("MobileNumber") String MobileNumber,@Field("OTP") String OTP);

}

