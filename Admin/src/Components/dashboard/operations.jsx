import React from "react";
import TopNav from "../Navbar/topNav";
import SideNav from "../Navbar/sideNav";
import dashboardclasses from "./dashboard.module.css";
import { useNavigate } from "react-router-dom";
import { Services } from "../../Services";
import { toast } from "react-toastify";
function Settings() {
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const downloadHandler = (e) => {
        let btnid = e.currentTarget.getAttribute("btnid");
        Services.downloadcsv("GET", null, token, btnid)
            .then((res) => {
                console.log("1", res);
                if (res.Status === 1) {
                    window.open(res.File, "_blank");
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
        <>
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="operations" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />
                    <div
                        className={`${dashboardclasses.CategoryWrapper} ${dashboardclasses.operations}`}>
                        <h3>Operations</h3>
                        <div>
                            <button
                                btnid={"productdetails"}
                                onClick={downloadHandler}>
                                Download Products{" "}
                            </button>
                            <button
                                btnid={"orderdetails"}
                                onClick={downloadHandler}>
                                Download Orders{" "}
                            </button>
                            <button
                                btnid={"warehouse"}
                                onClick={downloadHandler}>
                                Download warehouse{" "}
                            </button>
                            <button
                                btnid={"pendingproductscsv"}
                                onClick={downloadHandler}>
                                {" "}
                                Download Pending Orders{" "}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Settings;
