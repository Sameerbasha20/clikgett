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
import AddCategory from "./AddsubCategory";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate, useParams } from "react-router-dom";
function Warehouse() {
    const [category, setCategory] = useState(false);
    const Navigate = useNavigate();
    const [id, setid] = useState();
    const [editable, setEditable] = useState(false);
    const [allcategoriesData, setAllCategoriesData] = useState([]);
    const [categoryId, setcategoryId] = useState(null);

    const [categoryItems, setCategoryItems] = useState([]);
    const [categorysearchItems, setCategorySearchItems] = useState([]);
    const [orderChanges, setOrderChanges] = useState({});

    const handleOrderChange = (subCatId, value) => {
        setOrderChanges(prev => ({
            ...prev,
            [subCatId]: parseInt(value) || 0
        }));
    };

    const saveReorder = () => {
        const items = Object.entries(orderChanges).map(([SubCategoryID, DisplayOrder]) => ({
            SubCategoryID: parseInt(SubCategoryID),
            DisplayOrder
        }));

        if (items.length === 0) {
            toast.info("No order changes to save");
            return;
        }

        Services.reorderSubcategories("POST", JSON.stringify({ items }), token)
            .then(res => {
                if (res.status === 1) {
                    toast.success("Subcategory display order updated successfully");
                    setOrderChanges({});
                    getcategories(categoryId);
                } else {
                    toast.error(res.message || "Failed to update order");
                }
            })
            .catch(console.error);
    };
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
    const getcategories = (categoryId) => {
        setLoading(true);
        Services.GetSubCategory("GET", null, token, categoryId)
            .then((res) => {
                setLoading(false);

                if (res.Status === 1) {
                    setCategoryItems(res.SubCategories);
                    setCategorySearchItems(res.SubCategories);
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
    const getallcategories = () => {
        Services.getCategories("GET", null, token)
            .then((res) => {
                if (res.Status === 1) {
                    setAllCategoriesData(res.Categories);
                    if (res.Categories.length > 0) {
                        setcategoryId(res.Categories[0].CategoryID);
                    }
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
        if (categoryId) {
            getcategories(categoryId);
        }
        // eslint-disable-next-line
    }, [categoryId]);
    useEffect(() => {
        getallcategories();
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
            Services.DeleteSubcategory(
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
                <button onClick={edithandler} id={cellcontent.SubCategoryID}>
                    <FaRegEdit size={18} />
                </button>
                <button onClick={deleteHandler} id={cellcontent.SubCategoryID}>
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
            dataField: "CategoryID",
            text: "CATEGORY ID",
            sort: false,

            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "SubCategoryName",
            text: "SUB CATEGORY NAME",
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
        const search = categoryItems.filter((item) =>
            item.SubCategoryName.toLowerCase().includes(
                e.target.value.toLowerCase()
            )
        );
        // console.log(search);
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
                    categoryId={categoryId}
                />
            )}

            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="subcategories" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Subcategory</h3>

                        <div className={dashboardclasses["category-form"]}>
                            <select
                                name=""
                                id=""
                                value={categoryId || ""}
                                onChange={(e) => setcategoryId(e.target.value)}>
                                {allcategoriesData.map((item) => (
                                    <option key={item.CategoryID} value={item.CategoryID}>
                                        {item?.CategoryName}
                                    </option>
                                ))}
                            </select>
                            <input
                                type={"text"}
                                placeholder="Search by category type"
                                onChange={searchHandler}
                            />
                            {/* 
                                    <select defaultValue="">
                                        <option value="type">type</option>
                                        <option value="1">1</option>
                                    </select> */}
                            <button className="btn btn-success mr-2" onClick={saveReorder} style={{ marginRight: "10px" }}>
                                        Save Display Order
                                    </button>
                                    <button onClick={categoryHandler}>
                                + Add Sub Category
                            </button>
                        </div>
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
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="SubCategoryID"
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
