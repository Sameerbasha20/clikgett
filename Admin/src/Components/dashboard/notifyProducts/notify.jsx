import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.css";
import "react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import "../../../App.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { css } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { FaRegEdit } from "react-icons/fa";
import Update from "./updateNotify";
function NotifyProducts() {
    const Navigate = useNavigate();
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    let [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [id, setid] = useState();
    const [modal, setmodal] = useState(false);
    const [searchusers, setSearchusers] = useState([]);
    const headerstyles = {
        color: "#707275",
        fontWeight: 700,
        fontSize: "0.8rem",
    };

    const getusers = () => {
        Services.getNotifyProducts("GET", null, token)
            .then((res) => {
                setLoading(false);
                console.log(res);
                if (res.Status === 1) {
                    setUsers(res.Products);
                    setSearchusers(res.Products);
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
        getusers();
        // eslint-disable-next-line
    }, []);

    const radioformatter = (cell, cellcontent) => {
        let buttonenabler = true;
        if (cellcontent.availableQty > cellcontent.quantity) {
            console.log("111");
            buttonenabler = false;
        }
        // console.log(typeof cellcontent.status);
        return (
            <div className={dashboardclasses.tablebtnsview}>
                <button
                    onClick={edithandler}
                    id={cellcontent.notifyId}
                    disabled={buttonenabler}
                    style={{
                        display: "flex",
                        gap: "0.5rem",
                    }}>
                    <FaRegEdit size={18} />
                    <p style={{ margin: "0" }}> Notify</p>
                </button>
            </div>
        );
    };
    const edithandler = (e) => {
        const method = JSON.stringify({ status: 2 });
        setid(e.currentTarget.getAttribute("id"));
        // setmodal(true);
        Services.updateNotifyProducts(
            "PUT",
            method,
            token,
            e.currentTarget.getAttribute("id")
        )
            .then((res) => {
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
                // alert(err);
                alert("something went wrong please try again");
                console.log(err);
            });
    };

    const quantityformatter = (cell) => {
        return <div style={{ textAlign: "center" }}>{cell}</div>;
    };
    const columns = [
        {
            dataField: "notifyId",
            text: "ID",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        // {
        //     dataField: "shopName",
        //     text: "SHOP NAME",
        //     sort: false,
        //     headerStyle: (colum, colIndex) => {
        //         return { ...headerstyles };
        //     },
        // },
        {
            dataField: "ownerName",
            text: "Customer Name",
            sort: false,

            headerStyle: (colum, colIndex) => {
                return { width: "300px", ...headerstyles };
            },
        },

        {
            dataField: "productName",
            text: "Product Name",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "availableQty",
            text: "available Qty",
            sort: false,

            formatter: quantityformatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles, textAlign: "center" };
            },
        },
        {
            dataField: "quantity",
            text: "Quantity",
            sort: false,
            formatter: quantityformatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles, textAlign: "center" };
            },
        },
        {
            dataField: "userStatus",
            text: "STATUS",
            sort: false,
            formatter: radioformatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
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
        const search = users.filter(
            (item) =>
                item.ownerName
                    .toLowerCase()
                    .includes(e.target.value.toLowerCase()) ||
                item.mobileNumber.includes(e.target.value.toLowerCase()) ||
                item.productName
                    .toLowerCase()
                    .includes(e.target.value.toLowerCase())
        );
        // console.log(search);
        setSearchusers(search);
    };
    return (
        <>
            {modal && (
                <Update
                    // status={}
                    setmodal={setmodal}
                    getusers={getusers}
                    id={id}
                />
            )}
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="notifyproducts" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Notify Products</h3>
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
                                        dashboardclasses["customer-form"]
                                    }>
                                    <input
                                        type={"text"}
                                        placeholder="search by Name/email/phone"
                                        onChange={searchHandler}
                                    />
                                </div>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="NotifyID"
                                        data={searchusers}
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

export default NotifyProducts;
