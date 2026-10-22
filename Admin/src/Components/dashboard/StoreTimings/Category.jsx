import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.css";
import "react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import Moment from "react-moment";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import "../../../App.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import AddCategory from "./AddCategory";
import StoreStatusCard from "./StoreStatusCard";
import { css } from "@emotion/react";
import { useForm } from "react-hook-form";

import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";
import moment from "moment";
function Warehouse() {
    const [category, setCategory] = useState(false);
    const Navigate = useNavigate();
    const [id, setid] = useState();
    const [editable, setEditable] = useState(false);
    const [categoryItems, setCategoryItems] = useState([]);
    const [StoreDetails, setStoreDetails] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [categorysearchItems, setCategorySearchItems] = useState([]);
    let [loading, setLoading] = useState(true);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const categoryHandler = () => {
        setCategory((prev) => !prev);
    };
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();
    const headerstyles = {
        color: "#707275",
        fontWeight: 700,
        fontSize: "0.8rem",
    };
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    const getcategories = () => {
        Services.GetTimings("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.status === 1) {
                    setCategoryItems(res.data);
                    setCategorySearchItems(res.data);
                    setRefreshKey((k) => k + 1);
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
                alert("something went wrong please try again");
                console.log(err);
            });
    };
    const getStatus = (e) => {
        Services.getShopStatus("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.status == 1) {
                    setStoreDetails(res?.Shop);
                }
            })
            .catch((err) => {
                alert("something went wrong please try again");
                console.log(err);
            });
    };
    useEffect(() => {
        getcategories();
        getStatus();
        // eslint-disable-next-line
    }, []);
    const iconformatter = (cell, cellcontent) => {
        return (
            <div className={dashboardclasses["cat-tableicon"]}>
                <img src={cell} alt="table-icon" />
                {/* </div> */}
            </div>
        );
    };
    const edithandler = (e) => {
        setid(e);
        setEditable(true);
        setCategory(true);
    };
    const deleteHandler = (e) => {
        if (window.confirm("are you sure you want to delete? ")) {
            Services.DeleteTimings(
                "DELETE",
                null,
                token,
                e.currentTarget.getAttribute("id")
            )
                .then((res) => {
                    if (res.status === 1) {
                        getcategories();
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
        }
    };
    const ActionFormatter = (cell, cellcontent) => {
        return (
            <div className={dashboardclasses.tablebtns}>
                <button
                    onClick={() => edithandler(cellcontent)}
                    id={cellcontent.CategoryID}>
                    <FaRegEdit size={18} />
                </button>
                <button onClick={deleteHandler} id={cellcontent.TimingID}>
                    <MdDelete size={18} />
                </button>
            </div>
        );
    };
    const statusFormatter = (cell, cellcontent) => {
        let classname =
            cell === 1
                ? dashboardclasses["status_active"]
                : dashboardclasses["status_inactive"];
        return (
            <p className={classname}>{cell === 1 ? "Active" : "Inactive"}</p>
        );
    };
    // const radioformatter = (cell, cellcontent) => {
    //     return (
    //         <div className="table-checkbox">
    //             <label
    //                 className={dashboardclasses["switch"]}
    //                 onClick={clickHandler}>
    //                 <input type="checkbox" defaultChecked={true} />
    //                 <span
    //                     className={`${dashboardclasses["slider"]} ${dashboardclasses["round"]}`}></span>
    //             </label>
    //         </div>
    //     );
    // };

    const columns = [
        {
            dataField: "StartTime",
            text: "START TIME",

            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "EndTime",
            text: "END TIME",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "CreatedAt",
            text: "CREATED ON",
            sort: false,
            formatter: (label) => <Moment format="DD-MM-YYYY">{label}</Moment>,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "UpdatedAt",
            text: "UPDATED ON",
            sort: false,
            formatter: (label) => <Moment format="DD-MM-YYYY">{label}</Moment>,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },

        {
            dataField: "ACTIONS",
            text: "ACTIONS",
            sort: false,
            formatter: ActionFormatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles, width: "100px" };
            },
        },
    ];
    const pagination = paginationFactory({
        page: 1,
        sizePerPage: 8,
        lastPageText: ">>",
        firstPageText: "<<",
        nextPageText: ">",
        prePageText: "<",
        hideSizePerPage: true,
        showTotal: true,
        alwaysShowAllBtns: true,
        onPageChange: function (page, sizePerPage) {
            console.log("page", page);
            console.log("sizePerPage", sizePerPage);
        },
        onSizePerPageChange: function (page, sizePerPage) {
            console.log("page", page);
            console.log("sizePerPage", sizePerPage);
        },
    });
    const defaultSorted = [
        {
            dataField: "name",
            order: "desc",
        },
    ];
    const searchHandler = (e) => {
        const search = categoryItems.filter((item) =>
            item.CategoryName.toLowerCase().includes(
                e.target.value.toLowerCase()
            )
        );
        // console.log(search);
        setCategorySearchItems(search);
    };
    const onSubmit = (data) => {
        let method = JSON.stringify({
            ...data,
        });
        Services.updateStoreData("PUT", method, token, StoreDetails?.SettingID)
            .then((res) => {
                if (res.status === 1) {
                    setShowForm(false);
                    getStatus();
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
                alert("something went wrong please try again");
                console.log(err);
            });
    };
    return (
        <>
            {category && (
                <AddCategory
                    setmodal={setCategory}
                    editable={editable}
                    id={id}
                    setEditable={setEditable}
                    getCategories={getcategories}
                />
            )}

            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="Store Timings" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Store Status</h3>
                        <StoreStatusCard refreshKey={refreshKey} />
                        <div className={dashboardclasses["store_details"]}>
                            <h3>
                                Store Details{" "}
                                {!showForm && (
                                    <button
                                        onClick={() => {
                                            setShowForm((prev) => !prev);
                                            reset({
                                                Latitude:
                                                    StoreDetails?.Latitude,
                                                PricePerKm:
                                                    StoreDetails?.PricePerKm,
                                                Longitude:
                                                    StoreDetails?.Longitude,
                                            });
                                        }}>
                                        <MdEdit />
                                    </button>
                                )}
                            </h3>
                            {!showForm ? (
                                <div className={dashboardclasses["storeData"]}>
                                    <div>
                                        <label htmlFor="">Latitude</label>
                                        <span>:</span>
                                        <p>{StoreDetails?.Latitude}</p>
                                    </div>
                                    <div>
                                        <label htmlFor="">Longitude</label>
                                        <span>:</span>
                                        <p>{StoreDetails?.Longitude}</p>
                                    </div>
                                    <div>
                                        <label htmlFor="">Price Per Km</label>
                                        <span>:</span>
                                        <p>{StoreDetails?.PricePerKm}</p>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    className={dashboardclasses["add-items"]}
                                    onSubmit={handleSubmit(onSubmit)}>
                                    <div
                                        className={
                                            dashboardclasses[
                                                "item-image-upload"
                                            ]
                                        }>
                                        <label htmlFor="categoryName">
                                            Latitude
                                        </label>
                                        <div
                                            className={
                                                dashboardclasses["select"]
                                            }>
                                            <input
                                                type="number"
                                                step={0.000001}
                                                {...register("Latitude", {
                                                    required:
                                                        "Latitude is required",
                                                })}
                                            />

                                            {errors?.Latitude && (
                                                <p
                                                    className={
                                                        dashboardclasses[
                                                            "error"
                                                        ]
                                                    }>
                                                    {errors?.Latitude?.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={
                                            dashboardclasses[
                                                "item-image-upload"
                                            ]
                                        }>
                                        <label htmlFor="category">
                                            Longitude
                                        </label>
                                        <div
                                            className={
                                                dashboardclasses["select"]
                                            }>
                                            <input
                                                type="number"
                                                step={0.000001}
                                                {...register("Longitude", {
                                                    required:
                                                        "Longitude is required",
                                                })}
                                            />

                                            {errors?.Longitude && (
                                                <p
                                                    className={
                                                        dashboardclasses[
                                                            "error"
                                                        ]
                                                    }>
                                                    {errors?.Longitude?.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={
                                            dashboardclasses[
                                                "item-image-upload"
                                            ]
                                        }>
                                        <label htmlFor="category">
                                            Price Per KM
                                        </label>
                                        <div
                                            className={
                                                dashboardclasses["select"]
                                            }>
                                            <input
                                                type="number"
                                                step={0.01}
                                                {...register("PricePerKm", {
                                                    required:
                                                        "End Time is required",
                                                })}
                                            />

                                            {errors?.PricePerKm && (
                                                <p
                                                    className={
                                                        dashboardclasses[
                                                            "error"
                                                        ]
                                                    }>
                                                    {
                                                        errors?.PricePerKm
                                                            ?.message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className={dashboardclasses["add-btn"]}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowForm((prev) => !prev)
                                            }>
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className={
                                                dashboardclasses[
                                                    "add-category-btn"
                                                ]
                                            }>
                                            Update
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                        <h3>Store Timings</h3>

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
                                <button
                                    onClick={categoryHandler}
                                    className="Add-store">
                                    + Add Timings
                                </button>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="TimingID"
                                        data={categorysearchItems}
                                        columns={columns}
                                        defaultSorted={defaultSorted}
                                        pagination={pagination}
                                        wrapperClasses="table-responsive"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Warehouse;
