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
import Moment from "react-moment";

function Warehouse() {
    const [category, setCategory] = useState(false);
    const Navigate = useNavigate();
    const [id, setid] = useState();
    const [prodid, setprodid] = useState();
    const [editable, setEditable] = useState(false);
    const [categoryItems, setCategoryItems] = useState([]);
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
        Services.getProductsByProductId("GET", null, token, productID)
            .then((res) => {
                setLoading(false);
                console.log(res);
                if (res.Status === 1) {
                    setCategoryItems(res.Products);
                    setCategorySearchItems(res.Products.ProductVariants);
                    setVarients(res.Products.ProductVariants);
                    setprodid(res.Products.ProductID);
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
        // setprodid(e.currentTarget.getAttribute("prodid"));
        setCategory(true);
    };
    const deleteHandler = (e) => {
        if (window.confirm("are you sure you want to delete ")) {
            Services.deleteVarient(
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
                    prodid={cellcontent.ProductID}>
                    <FaRegEdit size={18} />
                </button>
                <button onClick={deleteHandler} id={cellcontent.VariantID}>
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

    const columns = [
        {
            dataField: "VariantID",
            text: "VARIANT ID",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "metrictype",
            text: "METRIC TYPE",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "metricvalue",
            text: "METRIC VALUE",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "Price",
            text: "PRICE",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "OfferPrice",
            text: "OFFER PRICE",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "Buy2Price",
            text: "BUY 2 PRICE",
            sort: false,
            formatter: (cell) => cell ? `₹${parseFloat(cell).toFixed(2)}` : "-",
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "AvailableQty",
            text: "Available Qty",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "ExpiryDate",
            text: "Expiry Date",
            sort: false,
            formatter: (cell) => {
                return <Moment format="DD-MM-YYYY">{cell}</Moment>;
            },
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
        const search = varients.filter((item) =>
            String(item.VariantID).includes(e.target.value)
        );
        setCategorySearchItems(search);
    };
    const blurHandler = (e) => {
        e.preventDefault();
        e.target.blur();

        return false;
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
                    prodid={prodid}
                />
            )}

            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="products" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>{categoryItems?.ProductName}</h3>

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
                                    className={dashboardclasses["back"]}
                                    onClick={() => Navigate(-1)}>
                                    Back
                                </button>
                                <div
                                    className={
                                        dashboardclasses["category-form-two"]
                                    }>
                                    <input
                                        onWheel={blurHandler}
                                        onScroll={blurHandler}
                                        type={"number"}
                                        placeholder="Search by variant ID"
                                        onChange={searchHandler}
                                    />
                                    {/* 
                                    <select defaultValue="">
                                        <option value="type">type</option>
                                        <option value="1">1</option>
                                    </select> */}
                                    <button onClick={categoryHandler}>
                                        {categoryItems.Type === 1
                                            ? "+ Add Product Variant"
                                            : "+ Add Product"}
                                    </button>
                                </div>

                                <div
                                    className={`${dashboardclasses["product-details"]}`}
                                    style={{
                                        maxWidth: "1200px",
                                        wordBreak: "break-word",
                                    }}>
                                    <div
                                        className={
                                            dashboardclasses["user-details"]
                                        }>
                                        <h4>Category</h4>
                                        <h5>:</h5>
                                        <p>{categoryItems?.CategoryName}</p>
                                    </div>
                                    <div
                                        className={
                                            dashboardclasses["user-details"]
                                        }>
                                        <h4>Sub Category </h4>
                                        <h5>:</h5>
                                        <p>{categoryItems?.SubCategoryName}</p>
                                    </div>
                                    <div
                                        className={
                                            dashboardclasses["user-details"]
                                        }>
                                        <h4>Image </h4>
                                        <h5>:</h5>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "0.5rem",
                                                flexWrap: "wrap",
                                            }}>
                                            {categoryItems?.ProductImages
                                                ?.length > 0 &&
                                                categoryItems.ProductImages?.map(
                                                    (item) => (
                                                        <img
                                                            onClick={() =>
                                                                window.open(
                                                                    item,
                                                                    "_blank"
                                                                )
                                                            }
                                                            src={item}
                                                            alt="product"
                                                            width={"80px"}
                                                        />
                                                    )
                                                )}
                                        </div>
                                    </div>
                                    <div
                                        className={
                                            dashboardclasses["user-details"]
                                        }>
                                        <h4>Description</h4>
                                        <h5>:</h5>
                                        <p
                                            dangerouslySetInnerHTML={{
                                                __html: categoryItems?.Description,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="VariantID"
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
