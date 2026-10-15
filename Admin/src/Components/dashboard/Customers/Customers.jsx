import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.css";
import "react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { GrFormView } from "react-icons/gr";
import { MdDelete } from "react-icons/md";
import "../../../App.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { css } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import Moment from "react-moment";

function Warehouse() {
    const Navigate = useNavigate();
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    let [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [exportT, setExport] = useState();
    const [searchusers, setSearchusers] = useState([]);
    const headerstyles = {
        color: "#707275",
        fontWeight: 700,
        fontSize: "0.8rem",
    };

    const getusers = () => {
        Services.getUsers("GET", null, token)
            .then((res) => {
                setLoading(false);
                console.log(res);
                if (res.status === 1) {
                    setUsers(res.Users);
                    setSearchusers(res.Users);
                    setExport(res?.url);
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
    useEffect(() => {
        getusers();
        // eslint-disable-next-line
    }, []);
    const DeleteHandler = (e) => {
        if (window.confirm("are you sure you want to delete ")) {
            Services.DeleteUser(
                "DELETE",
                null,
                token,
                e.currentTarget.getAttribute("id")
            )
                .then((res) => {
                    if (res.Status === 1) {
                        getusers();
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
        }
    };
    const viewuserdetails = (e) => {
        let amount = e.currentTarget.getAttribute("amount");
        localStorage.setItem("amount", amount);
        Navigate(
            `/customers/transactions/${e.currentTarget.getAttribute("id")}`
        );
    };
    const ActionFormatter = (cell, cellcontent) => {
        return (
            <div>
                <button
                    style={{
                        color: "white",
                        backgroundColor: "green",
                        borderRadius: "10px",
                        height: "2.5rem",
                        padding: "0 0.5rem",
                        border: "none",
                    }}
                    id={cellcontent.UserID}
                    amount={cellcontent?.WalletAmount}
                    onClick={viewuserdetails}>
                    Add Transaction
                </button>
                {/*    <button onClick={DeleteHandler} id={cellcontent.userId}>
                    <MdDelete size={18} />
                </button> */}
            </div>
        );
    };
    // const Idformatter = (cell, cellcontent) => {
    //     return (
    //         <div>
    //             <p className={dashboardclasses["idformatter"]}>{cell}</p>
    //         </div>
    //     );
    // };
    const radioformatter = (cell, cellcontent) => {
        // console.log(typeof cellcontent.userStatus);
        return (
            <div className="table-checkbox">
                <label className={dashboardclasses["switch"]}>
                    <input
                        onClick={clickHandler}
                        id={cellcontent.userId}
                        status={cellcontent.userStatus}
                        type="checkbox"
                        defaultChecked={
                            cellcontent.userStatus === 1 ? true : false
                        }
                    />
                    <span
                        className={`${dashboardclasses["slider"]} ${dashboardclasses["round"]}`}></span>
                </label>
            </div>
        );
    };
    const clickHandler = (e) => {
        const userid = e.currentTarget.getAttribute("id");
        let status =
            e.currentTarget.getAttribute("status") === String(1) ? 2 : 1;
        const updatedbody = JSON.stringify({ userStatus: status });
        Services.updateuser("PUT", updatedbody, token, userid)
            .then((res) => {
                console.log(res);
                if (res.Status === 1) {
                    getusers();
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
    const columns = [
        {
            dataField: "FirstName",
            text: "NAME",
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
            dataField: "EmailID",
            text: "EMAIL",
            sort: false,

            headerStyle: (colum, colIndex) => {
                return { width: "300px", ...headerstyles };
            },
        },

        {
            dataField: "MobileNumber",
            text: "PHONE",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        /*  {
            dataField: "userType",
            text: "USER TYPE",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        }, */
        {
            dataField: "WalletAmount",
            text: "WALLET BALANCE",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "CreatedAt",
            text: "REGISTERED ON",
            sort: false,
            formatter: (cell) => {
                return (
                    <p>
                        <Moment format="DD-MM-YYYY">{cell}</Moment>
                    </p>
                );
            },
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
                return { ...headerstyles, width: "200px" };
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
                item.FirstName.toLowerCase().includes(
                    e.target.value.toLowerCase()
                ) ||
                item.EmailID.toLowerCase().includes(
                    e.target.value.toLowerCase()
                ) ||
                item.MobileNumber.toLowerCase().includes(e.target.value)
        );
        // console.log(search);
        setSearchusers(search);
    };
    return (
        <>
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="customers" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Customers</h3>
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
                                        placeholder="Search by Name/email/phone"
                                        onChange={searchHandler}
                                    />
                                    <button
                                        onClick={() =>
                                            window.open(exportT, "_blank")
                                        }>
                                        Export
                                    </button>
                                </div>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="UserID"
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

export default Warehouse;
