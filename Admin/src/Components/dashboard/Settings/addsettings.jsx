import React, { useState, useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";
import { useForm } from "react-hook-form";
// import { TagsInput } from "react-tag-input-component";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function AddCategory(props) {
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();
    const [file, setFile] = useState("");
    useEffect(() => {
        if (props.editable) {
            Services.getsettingsbyid("GET", null, token, props.id)
                .then((res) => {
                    console.log(res);
                    if (res?.status === 1) {
                        //res.categories.imageUrl

                        reset({ ...res.Settings });
                    } else if (res.status === 0) {
                        toast.error(`${res.Message}`, {
                            position: "top-center",
                            autoClose: 4000,
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
        console.log(data);
        let method = JSON.stringify({
            ...data,
        });
        if (!props.editable) {
            Services.addsettings("POST", method, token)
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
                            autoClose: 4000,
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
            Services.updatesettings("PUT", method, token, props.id)
                .then((res) => {
                    if (res.status === 1) {
                        props.setmodal(false);
                        props.getCategories();

                        props.setEditable(false);
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
                            autoClose: 4000,
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
                            {props.editable
                                ? "Update Settings"
                                : "Add Settings"}
                        </h3>
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
                        <label htmlFor="SettingKey">Setting Key</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                disabled
                                {...register("SettingKey", {
                                    required: "key is required",
                                })}
                            />

                            {errors?.SettingKey && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.SettingKey?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="SettingValue">Setting Value</label>
                        <div className={dashboardclasses["select"]}>
                            <textarea
                                rows={6}
                                style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem" }}
                                {...register("SettingValue", {
                                    required: "Value is required",
                                })}
                            />

                            {errors?.SettingValue && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.SettingValue?.message}
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
                            {props.editable ? "update" : "Add Settings"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
