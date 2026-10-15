import React, { useState } from "react";
import TopNav from "../Navbar/topNav";
import SideNav from "../Navbar/sideNav";
import dashboardclasses from "./dashboard.module.css";
import { useForm } from "react-hook-form";

import { Services } from "../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function Settings() {
    // const [file, setFile] = useState();
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    // const fileTypes = ["JPEG"];
    // const handleChange = (file) => {
    //     setFile(file);
    //     console.log(file);
    // };
    // const fileuploadDesign = (
    //     <div className={dashboardclasses["add-item"]}>
    //         <BsCloudUpload className={dashboardclasses["upload-icon"]} />
    //         <h5>Drag Your Image here</h5>
    //         <p>(Only *.jpeg and *.png images will be accepted)</p>
    //     </div>
    // );
    const onSubmit = (data) => {
        const body = JSON.stringify(data);
        Services.signup("POST", body)
            .then((response) => {
                console.log(response);
                if (response.Status === 1) {
                    toast.success(`${response.Message}`, {
                        position: "top-center",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                } else if (response.Status === 0) {
                    alert(response.Message);
                }
            })
            .catch((err) => {
                // alert(err);
                alert("something went wrong please try again");
                console.log(err);
            });
    };

    return (
        <>
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="user" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />
                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Add Admin Users</h3>
                    </div>
                    <form
                        className={dashboardclasses["edit-profile"]}
                        onSubmit={handleSubmit(onSubmit)}>
                        {/* <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="Profile picture">
                                Profile Picture
                            </label>
                            <FileUploader
                                classes={dashboardclasses["upload-image"]}
                                multiple={false}
                                handleChange={handleChange}
                                name="file"
                                children={fileuploadDesign}
                                types={fileTypes}
                            />
                        </div> */}
                        <div
                            className={
                                dashboardclasses["edit-profile-formControl"]
                            }>
                            <label htmlFor="Name">Name</label>
                            <div
                                className={
                                    dashboardclasses["edit-profile-input"]
                                }>
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
                            <label htmlFor="password">Password</label>
                            <div
                                className={
                                    dashboardclasses["edit-profile-input"]
                                }>
                                <input
                                    type="text"
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
                        <div
                            className={
                                dashboardclasses["edit-profile-formControl"]
                            }>
                            <label htmlFor="Role">Staff Role</label>
                            <div
                                className={
                                    dashboardclasses["edit-profile-input"]
                                }>
                                <select
                                    defaultValue=""
                                    {...register("role", {
                                        required: "Staff Role is required!",
                                    })}>
                                    <option value="" disabled>
                                        Staff Role
                                    </option>
                                    <option value="1">Admin</option>
                                    <option value="2">CEO</option>
                                    <option value="3">Manager</option>
                                    <option value="4">Accountant</option>
                                    <option value="5">Driver</option>
                                    <option value="6">Security Guard</option>
                                    <option value="7">Delivery Person</option>
                                </select>
                                {errors?.role && (
                                    <p className={dashboardclasses["error"]}>
                                        {errors?.role?.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <input type={"submit"} value="Add Admin User" />
                    </form>
                </div>
            </div>
        </>
    );
}

export default Settings;
