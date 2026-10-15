import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Spinner from "../updateBulk/LoaderModal";
window.Buffer = window.Buffer || require("buffer").Buffer;
function UpdatePrice() {
    const Navigate = useNavigate();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    let [loading, setLoading] = useState(true);
    let [uploadSpinner, setUploadSpinner] = useState(false);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 200);
        // eslint-disable-next-line
    }, []);

    const onSubmit = (data) => {
        setUploadSpinner(true);
        let body = JSON.stringify({ ...data });
        Services.sendNotification("POST", body, token)
            .then((res) => {
                setUploadSpinner(false);
                console.log(res);
                if (res.status === 1) {
                    reset();
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
                setUploadSpinner(true);
                alert("something went wrong please try again");
                console.log(err);
            });
    };
    return (
        <>
            {uploadSpinner && <Spinner />}
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="notification" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Notification</h3>

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
                            <>
                                <div
                                    className={
                                        dashboardclasses["notification"]
                                    }>
                                    {/* <label htmlFor="category">File</label> */}
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <div
                                            className={
                                                dashboardclasses[
                                                    "notification-formControl"
                                                ]
                                            }>
                                            <label htmlFor="Title">Title</label>
                                            <input
                                                type={"text"}
                                                {...register("Title", {
                                                    required:
                                                        "Please enter Title",
                                                })}
                                            />
                                            {errors?.Title && (
                                                <p
                                                    className={
                                                        dashboardclasses[
                                                            "error"
                                                        ]
                                                    }>
                                                    {errors?.Title?.message}
                                                </p>
                                            )}
                                        </div>
                                        <div
                                            className={
                                                dashboardclasses[
                                                    "notification-formControl"
                                                ]
                                            }>
                                            <label htmlFor="Message">
                                                Message
                                            </label>
                                            <textarea
                                                placeholder="Enter Message"
                                                rows={6}
                                                maxLength="800"
                                                {...register("Message", {
                                                    required:
                                                        "Please enter message",
                                                })}></textarea>
                                            {errors?.Message && (
                                                <p
                                                    className={
                                                        dashboardclasses[
                                                            "error"
                                                        ]
                                                    }>
                                                    {errors?.Message?.message}
                                                </p>
                                            )}
                                        </div>
                                        <button type="submit">Send</button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default UpdatePrice;
