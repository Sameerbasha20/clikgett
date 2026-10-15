import React, { useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";

import { useForm } from "react-hook-form";
// import { TagsInput } from "react-tag-input-component";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import moment from "moment";
function AddCategory(props) {
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const {
        register,
        handleSubmit,
        reset,

        formState: { errors },
    } = useForm();
    const blurHandler = (e) => {
        e.preventDefault();
        e.target.blur();

        return false;
    };
    useEffect(() => {
        if (props.editable) {
            Services.getProductsByProductId("GET", null, token, props.prodid)
                .then((res) => {
                    console.log(res);
                    if (res?.Status === 1) {
                        const [varient] = res.Products.ProductVariants.filter(
                            // eslint-disable-next-line
                            (item) => item.VariantID == props.id
                        );
                        reset({
                            ...varient,
                            ExpiryDate: moment(varient?.ExpiryDate).format(
                                "YYYY-MM-DD"
                            ),
                        });
                    } else if (res.Status === 0) {
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

    // const fileTypes = ["JPEG", "PNG"];

    const onSubmit = (data) => {
        let method = JSON.stringify({
            ProductID: props.prodid,
            ...data,
        });

        if (!props.editable) {
            Services.addVarient("POST", method, token)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
                        props.getCategories();
                        toast.success(`${res.Message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    } else if (res.Status === 0) {
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
            Services.updateProductVarient("PUT", method, token, props.id)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
                        props.getCategories();
                        toast.success(`${res.Message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    } else if (res.Status === 0) {
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

    return (
        <div className={dashboardclasses.modal} onClick={CancelHandler}>
            <div
                className={dashboardclasses["modal-content"]}
                onClick={openhandler}>
                <div className={dashboardclasses["modal-content-header"]}>
                    <div>
                        <h3>
                            {props.editable ? "Update variant" : "Add variant"}
                        </h3>
                        <p>
                            {props.editable ? "Update variant" : "Add variant"}{" "}
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
                        <label htmlFor="metrictype">Metric Type</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                {...register("metrictype", {
                                    required: "Metric Type is required",
                                })}
                            />

                            {errors?.metrictype && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.metrictype?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="AvailableQty">Available Qty</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type={"number"}
                                {...register("AvailableQty", {
                                    required: "Available Qty is required",
                                })}
                            />

                            {errors?.AvailableQty && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.AvailableQty?.message}
                                </p>
                            )}
                        </div>
                    </div> */}
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="metricvalue">Metric value</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                onWheel={blurHandler}
                                onScroll={blurHandler}
                                step={0.001}
                                type={"number"}
                                {...register("metricvalue", {
                                    required: "Metric value is required",
                                })}
                            />

                            {errors?.metricvalue && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.metricvalue?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="metricvalue">Price</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                onWheel={blurHandler}
                                onScroll={blurHandler}
                                type={"number"}
                                step={0.01}
                                {...register("Price", {
                                    required: "Price is required",
                                })}
                            />

                            {errors?.Price && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.Price?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="OfferPrice">Offer Price</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type={"number"}
                                {...register("OfferPrice", {
                                    required: "Offer Price is required",
                                })}
                            />

                            {errors?.OfferPrice && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.OfferPrice?.message}
                                </p>
                            )}
                        </div>  
                    </div> */}
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="OfferPrice">Offer Price</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                onWheel={blurHandler}
                                onScroll={blurHandler}
                                type={"number"}
                                step={0.01}
                                {...register("OfferPrice", {
                                    required: "Offer Price is required",
                                })}
                            />

                            {errors?.OfferPrice && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.OfferPrice?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="OfferPrice">Expiry Date</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type={"date"}
                                {...register("ExpiryDate", {
                                    required: false,
                                })}
                            />

                            {errors?.ExpiryDate && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.ExpiryDate?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="Buy2Price">Buy 2 Price (₹)</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                onWheel={blurHandler}
                                onScroll={blurHandler}
                                type={"number"}
                                step={0.01}
                                min={0}
                                {...register("Buy2Price", {
                                    required: false,
                                })}
                                placeholder="Special price when 2 qty purchased"
                            />
                            {errors?.Buy2Price && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.Buy2Price?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {
                        <>
                            <div
                                className={
                                    dashboardclasses["item-image-upload"]
                                }>
                                <label htmlFor="AvailableQty">
                                    Available Qty
                                </label>
                                <div className={dashboardclasses["select"]}>
                                    <input
                                        onWheel={blurHandler}
                                        onScroll={blurHandler}
                                        type={"number"}
                                        {...register("AvailableQty", {
                                            required:
                                                "Available Qty is required",
                                        })}
                                    />

                                    {errors?.AvailableQty && (
                                        <p
                                            className={
                                                dashboardclasses["error"]
                                            }>
                                            {errors?.AvailableQty?.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    }
                    {
                        <>
                            <div
                                className={
                                    dashboardclasses["item-image-upload"]
                                }>
                                <label htmlFor="AvailableQty">Max Qty</label>
                                <div className={dashboardclasses["select"]}>
                                    <input
                                        onWheel={blurHandler}
                                        onScroll={blurHandler}
                                        type={"number"}
                                        min={1}
                                        {...register("maxQty", {
                                            required: "Max Qty is required",
                                        })}
                                    />

                                    {errors?.maxQty && (
                                        <p
                                            className={
                                                dashboardclasses["error"]
                                            }>
                                            {errors?.maxQty?.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    }

                    {props.editable && (
                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="status">Status</label>
                            <div className={dashboardclasses["select"]}>
                                <select
                                    {...register("Status", {
                                        required: "status Is required",
                                    })}>
                                    <option value="1">Active</option>
                                    <option value="2">Inactive</option>
                                </select>
                                {errors?.Status && (
                                    <p className={dashboardclasses["error"]}>
                                        {errors?.Status?.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className={dashboardclasses["add-btn"]}>
                        <button type="button" onClick={CancelHandler}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={dashboardclasses["add-category-btn"]}>
                            {props.editable ? "update" : "Add variant"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
