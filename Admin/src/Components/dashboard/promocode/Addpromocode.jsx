import React, { useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";

import { useForm } from "react-hook-form";
// import { TagsInput } from "react-tag-input-component";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function AddProducts(props) {
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm();
    const formData = watch();
    useEffect(() => {
        if (props.editable) {
            Services.getpromocodeByID("GET", null, token, props.promocodeid)
                .then((response) => {
                    if (response.status === 1) {
                        const date = (date) => {
                            const startdate = new Date(date);
                            const startdatestring = `${startdate.getFullYear()}-${String(
                                startdate.getMonth() + 1
                            ).padStart(2, "0")}-${String(
                                startdate.getDate()
                            ).padStart(2, "0")}`;
                            return startdatestring;
                        };
                        const startDate = date(response.PromoCode.StartDate);
                        const endDate = date(response.PromoCode.EndDate);
                        reset({
                            Description: response.PromoCode.Description,
                            EndDate: endDate,
                            MaxDiscount: response.PromoCode.MaxDiscount,
                            OfferValue: response.PromoCode.OfferValue,
                            PromoCode: response.PromoCode.PromoCode,
                            PromoCodeId: response.PromoCode.PromoCodeId,
                            StartDate: startDate,
                            Status: response.PromoCode.Status,
                            MinOrderValue: response.PromoCode.MinOrderValue,
                            Type: response.PromoCode.Type,
                            Is_Secret: response.PromoCode.Is_Secret,
                        });
                    } else if (response.status === 0) {
                        toast.error(`${response.Message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                        if (response.Message === "Token expired") {
                            Navigate("/");
                        }
                    }
                })
                .catch((err) => {
                    // alert(err);
                    alert("something went wrong please try again");
                    console.log(err);
                });
        }
        // eslint-disable-next-line
    }, []);
    const CancelHandler = (e) => {
        e.stopPropagation();
        props.setmodal(false);
        props.setEditable(false);
    };

    const openhandler = (e) => {
        e.stopPropagation();
    };
    const onSubmit = (data) => {
        console.log(data);
        if (data?.Type == 1 && data?.OfferValue > 100) {
            toast.warning(`Offer value cannot be greater than 100`, {
                position: "top-center",
                autoClose: 1000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return;
        }
        let method = JSON.stringify({
            ...data,
            MaxDiscount: data?.Type == 1 ? data?.MaxDiscount : data?.OfferValue,
        });
        if (!props.editable) {
            Services.addPromoCode("POST", method, token)
                .then((res) => {
                    if (res.status === 1) {
                        props.setmodal(false);
                        props.getpromocodes();
                        toast.success(`${res.Message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    } else if (res.status === 0) {
                        toast.error(`${res.Message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                        if (res.Message === "Token expired") {
                            Navigate("/");
                        }
                    }
                })
                .catch((err) => {
                    // alert(err);
                    alert("something went wrong please try again");

                    console.log(err);
                });
        } else if (props.editable) {
            Services.updatepromocode("PUT", method, token, props.promocodeid)
                .then((res) => {
                    if (res.status === 1) {
                        props.setmodal(false);
                        props.getpromocodes();
                        toast.success(`${res.Message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    } else if (res.status === 0) {
                        toast.error(`${res.Message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                        if (res.Message === "Token expired") {
                            Navigate("/");
                        }
                    }
                })
                .catch((err) => {
                    // alert(err);
                    alert("something went wrong please try again");
                    console.log(err);
                });
        }
    };
    const blurHandler = (e) => {
        e.preventDefault();
        e.target.blur();

        return false;
    };
    return (
        <div className={dashboardclasses.modal} onClick={CancelHandler}>
            <div
                className={dashboardclasses["modal-content"]}
                onClick={openhandler}>
                <div className={dashboardclasses["modal-content-header"]}>
                    <div>
                        <h3>
                            {props.editable
                                ? "Update Couponcode"
                                : "Add Couponcode"}
                        </h3>
                        <p>
                            {props.editable
                                ? "Update Couponcode"
                                : "Add Couponcode"}{" "}
                            and necessary information from here
                        </p>
                    </div>
                    <button
                        className={dashboardclasses["close-btn"]}
                        onClick={CancelHandler}>
                        <IoClose size={22} color={"red"} />
                    </button>
                </div>
                <form
                    className={dashboardclasses["add-items"]}
                    onSubmit={handleSubmit(onSubmit)}>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="categoryName">Couponcode</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="text"
                                {...register("PromoCode", {
                                    required: "promoCode is required",
                                })}
                            />

                            {errors?.PromoCode && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.PromoCode?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="categoryName">Secret</label>
                        <div className={dashboardclasses["select"]}>
                            <select
                                {...register("Is_Secret", {
                                    required: "Secret is required",
                                })}>
                                <option value="" disabled>
                                    Please Select
                                </option>
                                <option value="0">No</option>
                                <option value="1">Yes</option>
                            </select>
                            {errors?.Is_Secret && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.Is_Secret?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="categoryName">Min Order Value</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="text"
                                {...register("MinOrderValue", {
                                    required: "Min order value is required",
                                })}
                            />

                            {errors?.MinOrderValue && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.MinOrderValue?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="startDate">start Date</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type={"date"}
                                {...register("StartDate", {
                                    required: "startDate is required",
                                })}
                            />

                            {errors?.StartDate && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.StartDate?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="endDate">End Date</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="date"
                                {...register("EndDate", {
                                    required: "endDate is required",
                                })}
                            />

                            {errors?.EndDate && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.EndDate?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor=" type">type</label>
                        <div className={dashboardclasses["select"]}>
                            <select
                                defaultValue=""
                                {...register("Type", {
                                    required: "type is required",
                                })}>
                                <option value="" disabled>
                                    Select type
                                </option>
                                <option value="1">percentage </option>
                                <option value="2">amount</option>
                            </select>
                            {errors?.Type && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.Type?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="offerValue">offer Value</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                onWheel={blurHandler}
                                onScroll={blurHandler}
                                type={"number"}
                                step="0.00001"
                                {...register("OfferValue", {
                                    required: "offerValue is required",
                                })}
                            />

                            {errors?.OfferValue && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.OfferValue?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    {formData.Type == 1 && (
                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="maxDiscount">maxDiscount</label>
                            <div className={dashboardclasses["select"]}>
                                <input
                                    onWheel={blurHandler}
                                    onScroll={blurHandler}
                                    type={"number"}
                                    step="0.00001"
                                    {...register("MaxDiscount", {
                                        required: "max Discount is required",
                                    })}
                                />

                                {errors?.MaxDiscount && (
                                    <p className={dashboardclasses["error"]}>
                                        {errors?.MaxDiscount?.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {props.editable && (
                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor=" type">Status</label>
                            <div className={dashboardclasses["select"]}>
                                <select
                                    defaultValue=""
                                    {...register("Status", {
                                        required: "Status is required",
                                    })}>
                                    <option value="" disabled>
                                        Status
                                    </option>
                                    <option value="1">Active </option>
                                    <option value="2">InActive</option>
                                </select>
                                {errors?.Status && (
                                    <p className={dashboardclasses["error"]}>
                                        {errors?.Status?.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="Description">Description</label>
                        <div className={dashboardclasses["select"]}>
                            <textarea
                                rows="5"
                                {...register("Description")}></textarea>

                            {errors?.Description && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.Description?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={dashboardclasses["add-btn"]}>
                        <button type="button" onClick={CancelHandler}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={dashboardclasses["add-category-btn"]}>
                            {props.editable ? "update" : "Add Couponcode"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddProducts;
