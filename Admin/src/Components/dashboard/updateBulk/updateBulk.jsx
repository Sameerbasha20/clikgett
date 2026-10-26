import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";
import { FileUploader } from "react-drag-drop-files";
import { BsCloudUpload } from "react-icons/bs";
import { GrDocumentCsv } from "react-icons/gr";
import Spinner from "./LoaderModal";
window.Buffer = window.Buffer || require("buffer").Buffer;
function UpdatePrice() {
    const Navigate = useNavigate();
    let [loading, setLoading] = useState(true);
    let [uploadSpinner, setUploadSpinner] = useState(false);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const [fileName, setFileName] = useState("");
    const [url, setUrl] = useState(undefined);
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
    const handleChange = (file) => {
        // Windows often reports CSV as application/vnd.ms-excel, so check the extension too.
        const isCsv = /\.csv$/i.test(file.name || "") || ["text/csv", "application/vnd.ms-excel"].includes(file.type);
        if (!isCsv) {
            toast.error("Please choose a .csv file", { position: "top-center" });
            return;
        }
        setUploadSpinner(true);
        const name = `${Date.now()}.csv`;
        const newfile = new File([file], name, { type: "text/csv" });
        Services.uploadFile(newfile, "productscsv")
            .then((res) => {
                setUrl(res.location);
                setFileName(name);
            })
            .catch((err) => {
                console.log(err);
                toast.error("Could not upload the file. Please try again.", { position: "top-center" });
            })
            .finally(() => setUploadSpinner(false));
    };

    const fileuploadDesign = (
        <div className={dashboardclasses["bulk-upload-desc"]}>
            <BsCloudUpload className={dashboardclasses["bulk-upload-icon"]} />
            <h5>Drag Your File here</h5>
            <p>(Only *.csv will be accepted)</p>
        </div>
    );
    const submitform = (e) => {
        setUploadSpinner(true);
        e.preventDefault();
        if (fileName.length === 0) {
            alert("please upload csv file");
            setUploadSpinner(false);
            return;
        }
        Services.updateBulkPrices("PUT", null, token, fileName)
            .then((res) => {
                setUploadSpinner(false);
                console.log(res);
                setUrl(undefined);
                setFileName("");
                if (res.Status === 1) {
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
                setUploadSpinner(false);
                toast.error("Something went wrong. Please try again.", { position: "top-center" });
                console.log(err);
            });
    };
    return (
        <>
            {uploadSpinner && <Spinner />}
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="priceUpdate" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Update Price</h3>

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
                                    className={dashboardclasses["bulk-upload"]}>
                                    {/* <label htmlFor="category">File</label> */}

                                    <form onSubmit={submitform}>
                                        <FileUploader
                                            classes={
                                                dashboardclasses[
                                                    "bulk-upload-data"
                                                ]
                                            }
                                            multiple={false}
                                            handleChange={handleChange}
                                            name="file"
                                            children={fileuploadDesign}
                                            // types={fileTypes}
                                        />
                                        {url && (
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                download="prices"
                                                className={
                                                    dashboardclasses[
                                                        "priceFile"
                                                    ]
                                                }>
                                                <GrDocumentCsv
                                                    size={55}
                                                    className={
                                                        dashboardclasses[
                                                            "uploaded-icon"
                                                        ]
                                                    }
                                                />
                                            </a>
                                        )}
                                        <button type="submit">Submit</button>
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
