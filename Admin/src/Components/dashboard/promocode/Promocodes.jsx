import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.css";
import "react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import "../../../App.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import Addpromocodes from "./Addpromocode";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";
function Warehouse() {
    const Navigate = useNavigate();
    const [promocodes, setpromocodes] = useState(false);
    const [editable, setEditable] = useState(false);
    const [promoCodeItems, setPromoCodeItems] = useState([]);
    const [productSearch, setproductSearch] = useState([]);
    const [promocodeid, setpromocodeid] = useState();
    let [loading, setLoading] = useState(true);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

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
    const getpromocodes = () => {
        Services.getPromoCode("GET", null, token)
            .then((res) => {
                setLoading(false);
                console.log(res);
                if (res.status === 1) {
                    setPromoCodeItems(res.PromoCodes);
                    setproductSearch(res.PromoCodes);
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
    useEffect(() => {
        getpromocodes();
        // eslint-disable-next-line
    }, []);
    const edithandler = (e) => {
        setpromocodeid(e.currentTarget.getAttribute("promoid"));
        setEditable(true);
        setpromocodes(true);
    };
    const deleteHandler = (e) => {
        if (window.confirm("are you sure you want to delete ")) {
            Services.DeletePromocode(
                "DELETE",
                null,
                token,
                e.currentTarget.getAttribute("id")
            )
                .then((res) => {
                    if (res.status === 1) {
                        getpromocodes();
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
        }
    };
    const searchHandler = (e) => {
        // console.log(e.target.value);
        const search = promoCodeItems.filter((item) =>
            item.PromoCode.toLowerCase().includes(e.target.value.toLowerCase())
        );
        // console.log(search);
        setproductSearch(search);
    };
    console.log(promoCodeItems);
    const ActionFormatter = (cell, cellcontent) => {
        return (
            <div className={dashboardclasses.tablebtns}>
                <button onClick={edithandler} promoid={cellcontent.PromoCodeID}>
                    <FaRegEdit size={18} />
                </button>
                <button onClick={deleteHandler} id={cellcontent.PromoCodeID}>
                    <MdDelete size={18} />
                </button>
            </div>
        );
    };
    const dateformatter = (cell, cellcontent) => {
        const date = new Date(cell);
        const datestring = `${String(date.getDate()).padStart(2, "0")}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}-${date.getFullYear()}`;
        return datestring;
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
    const columns = [
        {
            dataField: "StartDate",
            text: "START DATE",
            sort: false,
            formatter: dateformatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "EndDate",
            text: "END DATE",
            sort: false,
            formatter: dateformatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },

        {
            dataField: "PromoCode",
            text: "COUPONCODE",
            sort: false,

            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "OfferValue",
            text: "OFFER VALUE",
            sort: false,
            formatter: (col, items) => {
                return `${items?.Type == 2 ? "₹" : ""} ${col}${
                    items?.Type == 1 ? "%" : ""
                }`;
            },
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "MaxDiscount",
            text: "MAX DISCOUNT",
            formatter: (col, items) => {
                return `₹ ${col}`;
            },
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "MinOrderValue",
            text: "MIN ORDER VALUE",
            sort: false,
            formatter: (col, items) => {
                return `₹ ${col}`;
            },
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "Is_Secret",
            text: "SECRET CODE",
            sort: false,
            formatter: (col, items) => {
                return `${col == 1 ? "YES" : "NO"}`;
            },
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "Status",
            text: "STATUS",
            sort: false,
            formatter: statusFormatter,
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
            // console.log("page", page);
            // console.log("sizePerPage", sizePerPage);
        },
        onSizePerPageChange: function (page, sizePerPage) {
            // console.log("page", page);
            // console.log("sizePerPage", sizePerPage);
        },
    });
    const defaultSorted = [
        {
            dataField: "name",
            order: "desc",
        },
    ];
    return (
        <>
            {promocodes && (
                <Addpromocodes
                    setmodal={setpromocodes}
                    editable={editable}
                    setEditable={setEditable}
                    getpromocodes={getpromocodes}
                    promocodeid={promocodeid}
                />
            )}

            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="promocode" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Coupon Codes</h3>

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
                                        dashboardclasses["category-form-two"]
                                    }>
                                    <input
                                        type={"text"}
                                        placeholder="Search by Couponcode"
                                        onChange={searchHandler}
                                    />
                                    {/* <div></div> */}
                                    <button
                                        onClick={() => {
                                            setpromocodes(true);
                                        }}>
                                        + Add Couponcode
                                    </button>
                                </div>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="PromoCodeID"
                                        data={productSearch}
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
