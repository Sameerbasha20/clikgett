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
import Addwarehouse from "./Addwarehouse";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";
function Warehouse() {
    const Navigate = useNavigate();
    const [category, setCategory] = useState(false);

    const [categorysearchItems, setCategorySearchItems] = useState([]);
    const [id, setid] = useState();
    const [editable, setEditable] = useState(false);
    const [categoryItems, setCategoryItems] = useState([]);
    let [loading, setLoading] = useState(true);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const categoryHandler = () => {
        setCategory((prev) => !prev);
    };
    const headerstyles = {
        color: "#707275",
        fontWeight: 700,
        fontSize: "0.8rem",
        textAlign: "center",
    };
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    const getcategories = () => {
        Services.getwarehouses("GET", null, token)
            .then((res) => {
                setLoading(false);
                console.log("1", res);
                if (res.Status === 1) {
                    setCategoryItems(res.warehouses);
                    setCategorySearchItems(res.warehouses);
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
        getcategories();
        // eslint-disable-next-line
    }, []);

    const edithandler = (e) => {
        console.log(e.currentTarget.getAttribute("id"));
        setid(e.currentTarget.getAttribute("id"));
        setEditable(true);
        setCategory(true);
    };
    const deleteHandler = (e) => {
        if (window.confirm("are you sure you want to delete ")) {
            Services.DeleteWarehouse(
                "DELETE",
                null,
                token,
                e.currentTarget.getAttribute("id")
            )
                .then((res) => {
                    if (res.Status === 1) {
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
                    }
                    if (res.Message === "Token expired") {
                        Navigate("/");
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
        console.log(cellcontent);
        return (
            <div className={dashboardclasses.tablebtns}>
                <button onClick={edithandler} id={cellcontent.warehouseId}>
                    <FaRegEdit size={18} />
                </button>
                <button onClick={deleteHandler} id={cellcontent.warehouseId}>
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
            dataField: "warehouseName",
            text: "NAME",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "city",
            text: "CITY",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "status",
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
        const search = categoryItems.filter((item) =>
            item.city.toLowerCase().includes(e.target.value.toLowerCase())
        );
        console.log(search);
        setCategorySearchItems(search);
    };
    return (
        <>
            {category && (
                <Addwarehouse
                    setmodal={setCategory}
                    editable={editable}
                    id={id}
                    setEditable={setEditable}
                    getCategories={getcategories}
                />
            )}

            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="warehouse" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Warehouse</h3>

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
                                        placeholder="search by Name"
                                        onChange={searchHandler}
                                    />

                                    <button onClick={categoryHandler}>
                                        + Add Warehouse
                                    </button>
                                </div>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="warehouseId"
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
