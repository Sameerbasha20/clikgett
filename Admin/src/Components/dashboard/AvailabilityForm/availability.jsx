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
// import Addbanners from "./Addbanners";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";
import Update from "./availabilityupdate";
import { FaRegEdit } from "react-icons/fa";
function Warehouse() {
    const Navigate = useNavigate();
    const [id, setid] = useState();
    const [Navactive, setNavactive] = useState("1");
    const [availabilityItems, setavailabilityItems] = useState([]);
    const [availabilitySearchItems, setavailabilitySearchItems] = useState([]);
    const [modal, setmodal] = useState(false);
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
    const getAvailabilityform = () => {
        Services.getAvailabilityform("GET", null, token)
            .then((res) => {
                setLoading(false);
                console.log(res);
                if (res.Status === 1) {
                    setavailabilityItems(res.AvailabilityForms);
                    setavailabilitySearchItems(
                        res.AvailabilityForms.filter(
                            (item) => item.status === 1
                        )
                    );
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
        getAvailabilityform();
        // eslint-disable-next-line
    }, []);
    const edithandler = (e) => {
        setid(e.currentTarget.getAttribute("id"));
        setmodal(true);
    };
    const radioformatter = (cell, cellcontent) => {
        return (
            <div className={dashboardclasses.tablebtnsview}>
                <button
                    onClick={edithandler}
                    id={cellcontent.availabilityId}
                    style={{
                        display: "flex",
                        gap: "0.5rem",
                    }}>
                    <FaRegEdit size={18} />
                    <p style={{ margin: "0" }}> View</p>
                </button>
            </div>
        );
    };
    const imageformatter = (cell, cellcontent) => {
        if (cell === "NA") {
            return <p>-</p>;
        } else {
            return (
                <a
                    href={cell}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        textDecoration: "none",
                        // color: "white",
                        // backgroundColor: "#0e9f6e",
                        // padding: "0.5rem 1rem",
                    }}>
                    View
                </a>
            );
        }
    };
    const columns = [
        {
            dataField: "name",
            text: "NAME",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },

        {
            dataField: "emailId",
            text: "EmailId",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "contactNumber",
            text: "CONTACT NUMBER",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },

        {
            dataField: "message",
            text: "Message",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "imageUrl",
            text: "IMAGE",
            formatter: imageformatter,
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "status",
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
        const search = availabilityItems.filter((item) =>
            item.bannerName.toLowerCase().includes(e.target.value.toLowerCase())
        );
        // console.log(search);
        setavailabilitySearchItems(search);
    };

    const navactivehandler = (e) => {
        let status = e.currentTarget.getAttribute("id");
        setNavactive(status);

        setavailabilitySearchItems(
            availabilityItems.filter((item) => item.status === Number(status))
        );
    };
    return (
        <>
            {modal && (
                <Update
                    // status={}
                    setmodal={setmodal}
                    getAvailabilityform={getAvailabilityform}
                    id={id}
                    setNavactive={setNavactive}
                />
            )}
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="availabilityForm" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Availability Form</h3>

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
                                        placeholder="search by name"
                                        onChange={searchHandler}
                                    />
                                </div>
                                <div
                                    className={
                                        dashboardclasses["orders-navbar"]
                                    }>
                                    <button
                                        id="1"
                                        className={Navactive === "1" ? dashboardclasses["order-active"] : undefined}
                                        onClick={navactivehandler}>
                                        Pending
                                    </button>
                                    <button
                                        id="2"
                                        className={Navactive === "2" ? dashboardclasses["order-active"] : undefined}
                                        onClick={navactivehandler}>
                                        Past
                                    </button>
                                </div>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="availabilityId"
                                        data={availabilitySearchItems}
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
