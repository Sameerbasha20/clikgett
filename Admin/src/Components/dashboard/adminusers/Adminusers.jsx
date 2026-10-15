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
import Addusers from "./addAdminusers";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";
function Warehouse() {
    const Navigate = useNavigate();
    const [addUser, setAddUser] = useState(false);
    const [id, setid] = useState();
    const [editable, setEditable] = useState(false);
    const [adminusers, setAdminUsers] = useState([]);
    const [searchAdminUsers, setSearchAdminUsers] = useState([]);
    const [warehousedata, setWarehouses] = useState([]);
    let [loading, setLoading] = useState(true);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const categoryHandler = () => {
        setAddUser((prev) => !prev);
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
    const getAdminusers = () => {
        Services.getAdminusers("GET", null, token)
            .then((res) => {
                console.log(res);
                if (res.Status === 1) {
                    setAdminUsers(res.adminUsers);
                    setSearchAdminUsers(res.adminUsers);
                    Services.getwarehouses("GET", null, token).then(
                        (response) => {
                            if (response.Status === 1) {
                                console.log(response);
                                setWarehouses(response.warehouses);
                                setLoading(false);
                            } else if (response.Status === 0) {
                                setLoading(false);
                                toast.error(`${res.Message}`, {
                                    position: "top-center",
                                    autoClose: 1000,
                                    hideProgressBar: true,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                });
                                if (res.Message == "Token expired") {
                                    Navigate("/");
                                }
                            }
                        }
                    );
                } else if (res.Status === 0) {
                    setLoading(false);
                    toast.error(`${res.Message}`, {
                        position: "top-center",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    if (res.Message == "Token expired") {
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
        getAdminusers();
        // eslint-disable-next-line
    }, []);
    const iconformatter = (cell, cellcontent) => {
        if (cell == 1) {
            return <p>Admin</p>;
        }
        if (cell == 2) {
            return <p>WareHouse Manager</p>;
        }
        if (cell == 3) {
            return <p>Customer Support</p>;
        }
    };
    const edithandler = (e) => {
        console.log(e.currentTarget.getAttribute("id"));
        setid(e.currentTarget.getAttribute("id"));
        setEditable(true);
        setAddUser(true);
    };
    const deleteHandler = (e) => {
        if (window.confirm("are you sure you want to delete ")) {
            Services.deleteAdmindata(
                "DELETE",
                null,
                token,
                e.currentTarget.getAttribute("id")
            )
                .then((res) => {
                    if (res.Status === 1) {
                        getAdminusers();
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
                        if (res.Message == "Token expired") {
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
                <button onClick={edithandler} id={cellcontent.adminUserId}>
                    <FaRegEdit size={18} />
                </button>
                <button onClick={deleteHandler} id={cellcontent.adminUserId}>
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
    const wareHouseFormatter = (cell) => {
        // console.log(cell);
        const warehousename = warehousedata.filter(
            (item) => item.warehouseId == cell
        );
        // console.log(warehousedata);
        // console.log(warehousename);
        return (
            <p>
                {warehousename?.length > 0
                    ? warehousename[0]?.warehouseName
                    : "Not Assigned"}
            </p>
        );
    };
    const columns = [
        {
            dataField: "firstName",
            text: "NAME",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "emailId",
            text: "EMAIL",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "warehouseId",
            text: "WareHouse",
            sort: false,
            formatter: wareHouseFormatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "role",
            text: "ROLE",
            sort: false,
            formatter: iconformatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "status",
            text: "status",
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
    const warehousefilter = (e) => {
        //searchAdminUsers
        const search = adminusers.filter(
            (item) => item.warehouseId == e.target.value
        );
        setSearchAdminUsers(search);
    };
    const namefilter = (e) => {
        const search = adminusers.filter((item) =>
            String(item.firstName.toLowerCase()).includes(
                e.target.value.toLowerCase()
            )
        );

        console.log(search);
        console.log("search");
        setSearchAdminUsers(search);
    };
    return (
        <>
            {addUser && (
                <Addusers
                    setmodal={setAddUser}
                    editable={editable}
                    id={id}
                    setEditable={setEditable}
                    getAdminusers={getAdminusers}
                />
            )}

            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="user" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Admin users</h3>

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
                                        dashboardclasses["category-form"]
                                    }>
                                    <input
                                        type={"text"}
                                        placeholder="search by name"
                                        onChange={namefilter}
                                    />

                                    <select
                                        defaultValue=""
                                        onChange={warehousefilter}>
                                        <option value="" disabled>
                                            warehouse
                                        </option>
                                        <option value="0">Not Assigned</option>
                                        {warehousedata?.map((item) => (
                                            <option key={item.warehouseId} value={item.warehouseId}>
                                                {item.warehouseName}
                                            </option>
                                        ))}
                                    </select>
                                    <button onClick={categoryHandler}>
                                        + Add User
                                    </button>
                                </div>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="adminUserId"
                                        data={searchAdminUsers}
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
