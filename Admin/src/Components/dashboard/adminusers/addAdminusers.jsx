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
    const [warehousedata, setWarehouses] = useState([]);
    const [file, setFile] = useState("");
    const [base64, setbase64] = useState("");
    useEffect(() => {
        Services.getwarehouses("GET", null, token)
            .then((res) => {
                console.log(res);
                if (res.Status === 1) {
                    setWarehouses(res.warehouses);
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
                    if (res.Message == "Token expired") {
                        Navigate("/");
                    }
                }
            })
            .catch((err) => {
                // alert(err);
                alert("something went wrong please try again");
                console.log(err);
            });
        if (props.editable) {
            Services.AdminUserById("GET", null, token, props.id)
                .then((res) => {
                    console.log(res);
                    if (res?.Status === 1) {
                        //res.categories.imageUrl
                        setFile(res.adminUsers.profilePic);
                        reset({
                            emailId: res.adminUsers.emailId,
                            firstName: res.adminUsers.firstName,
                            role: res.adminUsers.role,
                            password: "**********",
                            warehouseId: res.adminUsers.warehouseId,
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
                        if (res.Message == "Token expired") {
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
        console.log(data);
        let image;
        if (base64.length > 0) {
            image = { profilePic: base64 };
        }
        let method = JSON.stringify({
            ...data,
            ...image,
        });
        if (!props.editable && file.length !== 0) {
            Services.addAdminUser("POST", method, token)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
                        props.getAdminusers();
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
            Services.updateAdmindata("PUT", method, token, props.id)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
                        props.getAdminusers();
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
        } else if (file.length == 0) {
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
                        <h3>{props.editable ? "Update User" : "Add User"}</h3>
                        <p>
                            {props.editable ? "Update User" : "Add User"} and
                            necessary information from here
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
                        <label htmlFor="profilepic">Profile Picture</label>

                        <FileUploader
                            classes={dashboardclasses["upload-image"]}
                            multiple={false}
                            handleChange={handleChange}
                            name="file"
                            children={fileuploadDesign}
                            // types={fileTypes}
                        />
                    </div>
                    <div className={dashboardclasses["uploaded-img"]}>
                        <img src={file} alt="" width={"120px"} />
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="name">Name</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="text"
                                {...register("firstName", {
                                    required: "Name is Required!",
                                })}
                            />
                            {errors?.firstName && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.firstName?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="Email">Email</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="email"
                                {...register("emailId", {
                                    required: "emailId is Required!",
                                })}
                            />
                            {errors?.emailId && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.emailId?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="password">Password</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="password"
                                {...register("password", {
                                    required: "password is Required!",
                                })}
                            />
                            {errors?.password && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.password?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor=" Role">Staff Role</label>
                        <div className={dashboardclasses["select"]}>
                            <select
                                defaultValue=""
                                {...register("role", {
                                    required: "Staff Role Is required",
                                })}>
                                <option value="" disabled>
                                    Staff Role
                                </option>
                                <option value="1">Admin</option>
                                <option value="2">WareHouse Manager</option>
                                <option value="3">Customer Support</option>
                            </select>
                            {errors?.role && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.role?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor=" Role">Warehouse</label>
                        <div className={dashboardclasses["select"]}>
                            <select
                                defaultValue=""
                                {...register("warehouseId")}>
                                <option value="" disabled>
                                    warehouse
                                </option>
                                {warehousedata?.map((item) => (
                                    <option value={item.warehouseId}>
                                        {item.warehouseName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className={dashboardclasses["add-btn"]}>
                        <button type="button" onClick={CancelHandler}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={dashboardclasses["add-category-btn"]}>
                            {props.editable ? "update" : "Add User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
