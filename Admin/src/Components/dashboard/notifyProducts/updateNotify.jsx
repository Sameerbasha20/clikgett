import React, { useEffect, useState } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";

import { useForm } from "react-hook-form";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { css } from "@emotion/react";
import { useNavigate } from "react-router-dom";
function UpdateCallBack(props) {
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    let [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    useEffect(() => {
        Services.getNotifyById("GET", null, token, props.id)
            .then((res) => {
                if (res.Status === 1) {
                    console.log(res);
                    reset({ status: res.Products.status });
                    setFormData(res.Products);
                    setLoading(false);
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
                    props.setmodal(false);
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
        // eslint-disable-next-line
    }, []);
    const CancelHandler = (e) => {
        e.stopPropagation();
        props.setmodal(false);
        // props.setEditable(false);
    };

    const openhandler = (e) => {
        e.stopPropagation();
    };

    const onSubmit = (data) => {
        console.log(data);

        let method = JSON.stringify({
            ...data,
            // ...image
        });

        Services.updateNotifyProducts("PUT", method, token, props.id)
            .then((res) => {
                if (res.Status === 1) {
                    props.setmodal(false);
                    props.getusers();
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
    };

    return (
        <div className={dashboardclasses.modal} onClick={CancelHandler}>
            <div
                className={dashboardclasses["modal-content"]}
                onClick={openhandler}>
                <div className={dashboardclasses["modal-content-header"]}>
                    <div>
                        <h3>Update CallBack </h3>
                    </div>
                    <button
                        className={dashboardclasses["close-btn"]}
                        onClick={CancelHandler}>
                        <IoClose size={22} color={"red"} />
                    </button>
                </div>
                {loading ? (
                    <div className={dashboardclasses["loader"]}>
                        <ScaleLoader
                            color={"black"}
                            loading={true}
                            css={override}
                            size={150}
                        />
                    </div>
                ) : (
                    <form
                        className={dashboardclasses["add-items"]}
                        onSubmit={handleSubmit(onSubmit)}>
                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="name">Name</label>
                            <div className={dashboardclasses["select"]}>
                                <input
                                    defaultValue={formData.ownerName}
                                    disabled={true}
                                />
                            </div>
                        </div>

                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="contactNumber">
                                Contact Number
                            </label>
                            <div className={dashboardclasses["select"]}>
                                <input
                                    defaultValue={formData.mobileNumber}
                                    disabled={true}
                                />
                            </div>
                        </div>

                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="productName">product Name</label>
                            <div className={dashboardclasses["select"]}>
                                <input
                                    defaultValue={formData.productName}
                                    disabled={true}
                                />
                            </div>
                        </div>
                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="quantity">Quantity</label>
                            <div className={dashboardclasses["select"]}>
                                <input
                                    defaultValue={formData.quantity}
                                    disabled={true}
                                />
                            </div>
                        </div>

                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor=" status">Status</label>
                            <div className={dashboardclasses["select"]}>
                                <select
                                    style={{ backgroundColor: "white" }}
                                    defaultValue=""
                                    {...register("status", {
                                        required: "status Is required",
                                    })}>
                                    <option value="" disabled>
                                        Select status
                                    </option>
                                    <option value="1">Active</option>
                                    <option value="2">Inactive</option>
                                </select>
                                {errors?.status && (
                                    <p className={dashboardclasses["error"]}>
                                        {errors?.status?.message}
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
                                className={
                                    dashboardclasses["add-category-btn"]
                                }>
                                update
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default UpdateCallBack;
