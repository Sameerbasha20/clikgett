import React, { useState, useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";
import { FileUploader } from "react-drag-drop-files";
import { BsCloudUpload } from "react-icons/bs";
import { useForm } from "react-hook-form";
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
    const [base64, setbase64] = useState("");
    // eslint-disable-next-line
    const [categoryItems, setCategoryItems] = useState([]);
    useEffect(() => {
        if (props.editable) {
            Services.getDeliveryBoyByID("GET", null, token, props.id)
                .then((res) => {
                    console.log(res);
                    if (res?.Status === 1) {
                        //res.categories.imageUrl
                        setFile(res.Deliveryboy.ProfilePic);
                        reset({
                            EmailID: res.Deliveryboy.EmailID,
                            FirstName: res.Deliveryboy.FirstName,
                            LastName: res.Deliveryboy.LastName,
                            MobileNumber: res.Deliveryboy.MobileNumber,
                            Password: res.Deliveryboy.Password,
                            Status: res.Deliveryboy.Status,
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
    const handleChange = (file) => {
        if (file.type === "image/png" || file.type === "image/jpeg") {
            let maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
                alert("File size cannot be greater than 2 MB");
                return;
            }
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                console.log(reader.result);
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
        console.log(data);
        let image;
        if (base64.length > 0) {
            image = { ProfilePic: base64 };
        }
        let method = JSON.stringify({
            ...data,
            ...image,
        });
        if (!props.editable && file.length !== 0) {
            Services.AddDeliveryBoy("POST", method, token)
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
                    }
                })
                .catch((err) => {
                    // alert(err);
                    alert("something went wrong please try again");
                    console.log(err);
                });
        } else if (props.editable) {
            Services.updateDeliveryboy("PUT", method, token, props.id)
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
                    }
                })
                .catch((err) => {
                    // alert(err);
                    alert("something went wrong please try again");
                    console.log(err);
                });
        } else if (file.length === 0) {
            alert("please upload profile pic");
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
                                ? "Update DeliveryBoy"
                                : "Add DeliveryBoy"}
                        </h3>
                        <p>
                            {props.editable
                                ? "Update DeliveryBoy"
                                : "Add DeliveryBoy"}{" "}
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
                    {
                        <>
                            <div
                                className={
                                    dashboardclasses["item-image-upload"]
                                }>
                                <label htmlFor="image">Profile Pic</label>

                                <FileUploader
                                    classes={dashboardclasses["upload-image"]}
                                    multiple={false}
                                    handleChange={handleChange}
                                    name="file"
                                    children={fileuploadDesign}
                                    // types={fileTypes}
                                />
                            </div>
                            {file && (
                                <div
                                    className={
                                        dashboardclasses["uploaded-img"]
                                    }>
                                    <img src={file} alt="" width={"120px"} />
                                </div>
                            )}
                        </>
                    }

                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="FirstName">First Name</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type={"text"}
                                {...register("FirstName", {
                                    required: "First Name is required",
                                })}
                            />

                            {errors?.FirstName && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.FirstName?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="LastName">Last Name</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type={"text"}
                                {...register("LastName", {
                                    required: "Last Name is required",
                                })}
                            />

                            {errors?.LastName && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.LastName?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="EmailID">Email ID</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type={"email"}
                                {...register("EmailID", {
                                    required: "Email ID is required",
                                })}
                            />

                            {errors?.EmailID && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.EmailID?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    {!props.editable && (
                        <>
                            <div
                                className={
                                    dashboardclasses["item-image-upload"]
                                }>
                                <label htmlFor="password">Password</label>
                                <div className={dashboardclasses["select"]}>
                                    <input
                                        type={"password"}
                                        {...register("Password", {
                                            required: "Password is required",
                                        })}
                                    />

                                    {errors?.Password && (
                                        <p
                                            className={
                                                dashboardclasses["error"]
                                            }>
                                            {errors?.Password?.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div
                                className={
                                    dashboardclasses["item-image-upload"]
                                }>
                                <label htmlFor="MobileNumber">
                                    MobileNumber
                                </label>
                                <div className={dashboardclasses["select"]}>
                                    <input
                                        onWheel={blurHandler}
                                        onScroll={blurHandler}
                                        type={"number"}
                                        {...register("MobileNumber", {
                                            required:
                                                "Mobile Number is required",
                                        })}
                                    />

                                    {errors?.MobileNumber && (
                                        <p
                                            className={
                                                dashboardclasses["error"]
                                            }>
                                            {errors?.MobileNumber?.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    {props.editable && (
                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="MobileNumber">Status</label>
                            <div className={dashboardclasses["select"]}>
                                <select
                                    onWheel={blurHandler}
                                    onScroll={blurHandler}
                                    type={"number"}
                                    {...register("Status", {
                                        required: "Status is required",
                                    })}>
                                    <option value="1">Active</option>
                                    <option value="2">inActive</option>
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
                            {props.editable ? "update" : "Add DeliveryBoy"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
