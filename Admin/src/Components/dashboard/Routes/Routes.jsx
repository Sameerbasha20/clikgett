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
import AddRoutes from "./AddRoutes";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";
function Warehouse() {
    const Navigate = useNavigate();
    const [category, setCategory] = useState(false);
    const [id, setid] = useState();
    const [editable, setEditable] = useState(false);

    const [Navactive, setNavactive] = useState("1");
    const [categoryItems, setCategoryItems] = useState([]);
    const [categorysearchItems, setCategorySearchItems] = useState([]);
    let [loading, setLoading] = useState(true);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const categoryHandler = () => {
        setCategory((prev) => !prev);
    };
    const headerstyles = {
        color: "#707275",
        fontWeight: 700,
        fontSize: "0.8rem",
        // "textAlign": "center",
    };
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    const getcategories = (status) => {
        Services.getRoutes("GET", null, token, status)
            .then((res) => {
                setLoading(false);
                console.log(res);
                if (res.status === 1) {
                    setCategoryItems(res.Routes);
                    setCategorySearchItems(res.Routes);
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
        getcategories(Navactive);
        // eslint-disable-next-line
    }, [Navactive]);

    const edithandler = (e) => {
        console.log(e.currentTarget.getAttribute("id"));
        setid(e.currentTarget.getAttribute("id"));
        setEditable(true);
        setCategory(true);
    };
    const deleteHandler = (e) => {
        if (window.confirm("are you sure you want to delete ")) {
            Services.DeleteRoutes(
                "DELETE",
                null,
                token,
                e.currentTarget.getAttribute("id")
            )
                .then((res) => {
                    if (res.status === 1) {
                        getcategories();
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
    const ActionFormatter = (cell, cellcontent) => {
        return (
            <div className={dashboardclasses.tablebtns}>
                <button onClick={edithandler} id={cellcontent.RouteID}>
                    <FaRegEdit size={18} />
                </button>
                <button onClick={deleteHandler} id={cellcontent.RouteID}>
                    <MdDelete size={18} />
                </button>
            </div>
        );
    };
    const statusFormatter = (cell, cellcontent) => {
        let classname =
            cell === 1
                ? dashboardclasses["status_inactive"]
                : dashboardclasses["status_active"];
        return <p className={classname}>{cell == 1 ? "Pending" : "Past"}</p>;
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
            dataField: "RouteID",
            text: "RouteID",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "DeliveryBoyID",
            text: "DeliveryBoy ID",
            sort: false,
            formatter: (cell) => <p style={{ margin: "0 0 0 2rem" }}>{cell}</p>,
            headerStyle: (colum, colIndex) => {
                return {
                    ...headerstyles,

                    // width: "100px",
                };
            },
        },
        {
            dataField: "Name",
            text: "Name",
            sort: false,
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
        console.log("ass");
        console.log(categoryItems);
        const search = categoryItems.filter((item) =>
            String(item.RouteID).includes(e.target.value)
        );
        console.log(search);
        setCategorySearchItems(search);
    };
    const navactivehandler = (e) => {
        setLoading(true);
        let status = e.currentTarget.getAttribute("id");
        setNavactive(status);
    };
    return (
        <>
            {category && (
                <AddRoutes
                    setmodal={setCategory}
                    editable={editable}
                    id={id}
                    setEditable={setEditable}
                    getCategories={getcategories}
                    setNavactive={setNavactive}
                    Navactive={Navactive}
                />
            )}

            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="routes" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Routes</h3>

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
                                        placeholder="search by Routeid"
                                        onChange={searchHandler}
                                    />

                                    <button onClick={categoryHandler}>
                                        + Add Routes
                                    </button>
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
                                        keyField="RouteID"
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
