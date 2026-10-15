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
// import img from "../../../Assets/login/createaccount.jpeg";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import AddCategory from "./AddVarient";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate, useParams } from "react-router-dom";

function Warehouse() {
    const [category, setCategory] = useState(false);
    const Navigate = useNavigate();
    const [id, setid] = useState();
    const [prodid, setprodid] = useState();
    const [editable, setEditable] = useState(false);
    const [categoryItems, setCategoryItems] = useState([]);
    const [kititem, setkititemid] = useState();
    const [categorysearchItems, setCategorySearchItems] = useState([]);
    const [varients, setVarients] = useState([]);
    let [loading, setLoading] = useState(true);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const categoryHandler = () => {
        setCategory((prev) => !prev);
    };
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
    const { productID } = useParams();
    const getcategories = () => {
        setLoading(true);
        Services.KitsDetails("GET", null, token, productID)
            .then((res) => {
                setLoading(false);
                console.log(res);
                if (res.Status === 1) {
                    setCategoryItems(res.Kits);
                    setCategorySearchItems(res.Kits.KitItems);
                    setVarients(res.Kits.KitItems);
                    setprodid(res.Kits.KitID);
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
    }, [productID]);

    const edithandler = (e) => {
        console.log(e.currentTarget.getAttribute("id"));
        setEditable(true);
        setid(e.currentTarget.getAttribute("id"));
        // console.log(e.currentTarget.getAttribute("prodid"));
        setkititemid(e.currentTarget.getAttribute("kititemid"));
        setCategory(true);
    };
    const deleteHandler = (e) => {
        if (window.confirm("are you sure you want to delete ")) {
            Services.DeleteKititem(
                "DELETE",
                null,
                token,
                e.currentTarget.getAttribute("kititemid")
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
                    onClick={edithandler}
                    id={cellcontent.VariantID}
                    kititemid={cellcontent.KitItemID}
                    prodid={cellcontent.ProductID}>
                    <FaRegEdit size={18} />
                </button>
                <button
                    onClick={deleteHandler}
                    kititemid={cellcontent.KitItemID}>
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
    const dateformatter = (cell, cellcontent) => {
        const date = new Date(cell);
        const datestring = `${String(date.getDate()).padStart(2, "0")}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}-${date.getFullYear()}`;
        return (
            <div>
                <p>{datestring}</p>
            </div>
        );
    };
    const columns = [
        {
            dataField: "ProductID",
            text: "Product ID",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "Variant",
            text: "VARIENT",
            sort: false,
            formatter: (cell, cellcontent) => {
                return (
                    <p style={{ margin: 0 }}>
                        {cellcontent.metricvalue}
                        {cellcontent.metrictype}
                    </p>
                );
            },
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "ProductName",
            text: "PRODUCT NAME",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles, width: "40%" };
            },
        },
        {
            dataField: "UpdatedAt",
            text: "UPDATED AT",
            sort: false,
            formatter: dateformatter,
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
        const search = varients.filter((item) =>
            String(item.ProductName)
                .toLowerCase()
                .includes(String(e.target.value).toLowerCase())
        );
        setCategorySearchItems(search);
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
                    kitid={prodid}
                    kititemid={kititem}
                />
            )}

            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="kits" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>{categoryItems?.KitName}</h3>

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
                                        placeholder="search by Product name"
                                        onChange={searchHandler}
                                    />
                                    {/* 
                                    <select defaultValue="">
                                        <option value="type">type</option>
                                        <option value="1">1</option>
                                    </select> */}
                                    <button onClick={categoryHandler}>
                                        + Add Product
                                    </button>
                                </div>

                                <div
                                    className={`${dashboardclasses["product-details"]}`}>
                                    <div
                                        className={
                                            dashboardclasses["user-details"]
                                        }>
                                        <h4>Name</h4>
                                        <h5>:</h5>
                                        <p>{categoryItems?.KitName}</p>
                                    </div>
                                    <div
                                        className={
                                            dashboardclasses["user-details"]
                                        }>
                                        <h4>Price</h4>
                                        <h5>:</h5>
                                        <p>₹ {categoryItems?.Price}</p>
                                    </div>
                                    <div
                                        className={
                                            dashboardclasses["user-details"]
                                        }>
                                        <h4>Offer Price</h4>
                                        <h5>:</h5>
                                        <p>₹ {categoryItems?.OfferPrice}</p>
                                    </div>

                                    <div
                                        className={
                                            dashboardclasses["user-details"]
                                        }>
                                        <h4>Image </h4>
                                        <h5>:</h5>
                                        <img
                                            src={categoryItems?.ImageUrl}
                                            alt="kit"
                                            width={"80px"}
                                        />
                                    </div>
                                    <div
                                        className={
                                            dashboardclasses["user-details"]
                                        }>
                                        <h4>Description</h4>
                                        <h5>:</h5>
                                        <p>{categoryItems?.Description}</p>
                                    </div>
                                </div>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="KitItemID"
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
