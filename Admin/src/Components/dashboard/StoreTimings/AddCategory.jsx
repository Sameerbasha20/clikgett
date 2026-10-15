import React, { useState, useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";
import { FileUploader } from "react-drag-drop-files";
import { BsCloudUpload } from "react-icons/bs";
import { useForm } from "react-hook-form";
// import { TagsInput } from "react-tag-input-component";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import TimePicker from "rc-time-picker";
import "rc-time-picker/assets/index.css";

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
    const [base64, setbase64] = useState("");
    useEffect(() => {
        if (props.editable) {
            reset({
                StartTime: props?.id?.StartTime,
                EndTime: props?.id?.EndTime,
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
    const handleChange = (file) => {
        if (file.type === "image/png" || file.type === "image/jpeg") {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                setbase64(reader.result);
                setFile(reader.result);
            };
            reader.onerror = function (error) {
                console.log("Error: ", error);
            };
        } else {
            alert("please upload image in PNG and JPEG format ");
        }
    };

    const fileuploadDesign = (
        <div className={dashboardclasses["add-item"]}>
            <BsCloudUpload className={dashboardclasses["upload-icon"]} />
            <h5>Drag Your Image here</h5>
            <p>(Only *.jpeg and *.png images will be accepted)</p>
        </div>
    );
    const onSubmit = (data) => {
        let method = JSON.stringify({
            ...data,
        });
        if (!props.editable) {
            Services.AddTimings("POST", method, token)
                .then((res) => {
                    if (res.status === 1) {
                        props.setmodal(false);
                        props.getCategories();
                        toast.success(`${res.message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    } else if (res.status === 0) {
                        toast.error(`${res.message}`, {
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
            Services.UpdateTimings("PUT", method, token, props?.id?.TimingID)
                .then((res) => {
                    if (res.status === 1) {
                        props.setmodal(false);
                        props.getCategories();
                        toast.success(`${res.message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    } else if (res.status === 0) {
                        toast.error(`${res.message}`, {
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
        } else if (file.length === 0) {
            alert("please upload icon");
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
                            {props.editable ? "Update Timings" : "Add Timings"}
                        </h3>
                        <p>
                            {props.editable ? "Update Timings" : "Add Timings"}{" "}
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
                        <label htmlFor="categoryName">Start Time</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="time"
                                {...register("StartTime", {
                                    required: "Start Time is required",
                                })}
                            />

                            {errors?.StartTime && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.StartTime?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="category">End Time</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="time"
                                {...register("EndTime", {
                                    required: "End Time is required",
                                })}
                            />

                            {errors?.EndTime && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.EndTime?.message}
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
                            {props.editable ? "update" : "Add Timings"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
