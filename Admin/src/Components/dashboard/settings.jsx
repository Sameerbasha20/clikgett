import React, { useEffect, useState } from "react";
import TopNav from "../Navbar/topNav";
import SideNav from "../Navbar/sideNav";
import dashboardclasses from "./dashboard.module.css";
import { useForm } from "react-hook-form";
import { FileUploader } from "react-drag-drop-files";
import { BsCloudUpload } from "react-icons/bs";
import { Services } from "../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function Settings() {
    const [file, setFile] = useState();
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const admindata = JSON.parse(sessionStorage.getItem("admindata"));
    const [profilepic, setprofilepic] = useState();
    const [categoryItems, setCategoryItems] = useState([]);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const handleChange = (file) => {
        if (file.type === "image/png" || file.type === "image/jpeg") {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                setFile(reader.result);
                setprofilepic(reader.result);
            };
            reader.onerror = function (error) {
                console.log("Error: ", error);
            };
        } else {
            alert("upload file in png and jpeg fromat");
        }
    };
    useEffect(() => {
        Services.getwarehouses("GET", null, token)
            .then((res) => {
                console.log("1", res);
                if (res.Status === 1) {
                    setprofilepic(admindata.profilePic);
                    reset({
                        emailId: admindata.emailId,
                        firstName: admindata.firstName,
                        lastName: admindata.lastName,
                        password: "*********",
                        // profilePic: "",
                        warehouseId: admindata.warehouseId,
                    });
                    setCategoryItems(res.warehouses);
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
        // eslint-disable-next-line
    }, []);
    const fileuploadDesign = (
        <div className={dashboardclasses["add-item"]}>
            <BsCloudUpload className={dashboardclasses["upload-icon"]} />
            <h5>Drag Your Image here</h5>
            <p>(Only *.jpeg and *.png images will be accepted)</p>
        </div>
    );
    const onSubmit = (data) => {
        const method = JSON.stringify({
            ...data,
            profilePic: file,
        });
        if (window.confirm("Please re-login to take effect of the changes.")) {
            Services.updateprofile("PUT", method, token, admindata.adminUserId)
                .then((res) => {
                    console.log("1", res);
                    if (res.Status === 1) {
                        sessionStorage.clear();
                        // window.location.reload();
                        Navigate("/");
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
        <>
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="settings" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />
                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Edit Profile</h3>
                    </div>
                    <form
                        className={dashboardclasses["edit-profile"]}
                        onSubmit={handleSubmit(onSubmit)}>
                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="Profile picture">
                                Profile Picture
                            </label>
                            <FileUploader
                                classes={dashboardclasses["upload-image"]}
                                multiple={false}
                                handleChange={handleChange}
                                name="file"
                                children={fileuploadDesign}
                            />
                        </div>
                        <div className={dashboardclasses["uploaded-img"]}>
                            <img src={profilepic} alt="" width={"120px"} />
                        </div>
                        <div
                            className={
                                dashboardclasses["edit-profile-formControl"]
                            }>
                            <label htmlFor="firstName">first name</label>
                            <div
                                className={
                                    dashboardclasses["edit-profile-input"]
                                }>
                                <input
                                    type="text"
                                    {...register("firstName", {
                                        required: "firstName is Required!",
                                    })}
                                />
                                {errors?.firstName && (
                                    <p className={dashboardclasses["error"]}>
                                        {errors?.firstName?.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div
                            className={
                                dashboardclasses["edit-profile-formControl"]
                            }>
                            <label htmlFor="Name">last name</label>
                            <div
                                className={
                                    dashboardclasses["edit-profile-input"]
                                }>
                                <input
                                    type="text"
                                    {...register("lastName", {
                                        required: "lastName is Required!",
                                    })}
                                />
                                {errors?.lastName && (
                                    <p className={dashboardclasses["error"]}>
                                        {errors?.lastName?.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div
                            className={
                                dashboardclasses["edit-profile-formControl"]
                            }>
                            <label htmlFor="Email">Email</label>
                            <div
                                className={
                                    dashboardclasses["edit-profile-input"]
                                }>
                                <input
                                    type="Email"
                                    {...register("emailId", {
                                        required: "Email is Required!",
                                    })}
                                />
                                {errors?.emailId && (
                                    <p className={dashboardclasses["error"]}>
                                        {errors?.emailId?.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div
                            className={
                                dashboardclasses["edit-profile-formControl"]
                            }>
                            <label htmlFor="warehouse">Warehouse</label>
                            <div
                                className={
                                    dashboardclasses["edit-profile-input"]
                                }>
                                <select
                                    {...register("warehouseId")}
                                    defaultValue="">
                                    {categoryItems.map((item) => (
                                        <option value={item.warehouseId}>
                                            {item.warehouseName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <input type={"submit"} value="Update profile" />
                    </form>
                </div>
            </div>
        </>
    );
}

export default Settings;
