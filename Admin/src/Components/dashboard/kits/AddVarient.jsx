import React, { useEffect, useState } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";

import { useForm } from "react-hook-form";
// import { TagsInput } from "react-tag-input-component";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function AddCategory(props) {
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const [products, setproducts] = useState([]);
    const [showproducts, setshowproducts] = useState(false);
    const [search, setsearch] = useState("");
    const [searchdata, setsearchdata] = useState("");
    const [productId, setProductId] = useState("");
    const [varient, setvarient] = useState([]);
    const {
        register,
        handleSubmit,
        reset,

        formState: { errors },
    } = useForm();
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchdata) {
                Services.SearchProduct("GET", null, token, searchdata)
                    .then((res) => {
                        console.log(res);
                        if (res?.Status === 1) {
                            setproducts(res.Products);
                            setshowproducts(true);
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
                        alert("something went wrong");
                        console.log(err);
                    });
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [search]);
    useEffect(() => {
        if (props.editable) {
            Services.KitsDetails("GET", null, token, props.kitid)
                .then((res) => {
                    console.log(res);
                    if (res?.Status === 1) {
                        const [varient] = res.Kits.KitItems.filter(
                            // eslint-disable-next-line
                            (item) => item.VariantID == props.id
                        );
                        setsearch(varient.ProductName);
                        getvarients(varient.ProductID);
                        setProductId(varient.ProductID);
                        reset({
                            ProductID: varient.ProductID,
                            Quantity: varient.Quantity,
                            VariantID: varient.VariantID,
                            Status: varient.Status,
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
        // eslint-disable-next-line
    }, []);
    const CancelHandler = (e) => {
        e.stopPropagation();
        props.setmodal(false);
        props.setEditable(false);
    };

    const openhandler = (e) => {
        setshowproducts(false);
        e.stopPropagation();
    };

    // const fileTypes = ["JPEG", "PNG"];

    const onSubmit = (data) => {
        if (productId.length == 0) {
            alert("please enter a valid product");
            return;
        }
        let method = JSON.stringify({
            KitID: props.kitid,
            ProductID: productId,
            VariantID: data.VariantID,
        });
        if (!props.editable) {
            Services.AddKitvarient("POST", method, token)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
                        props.getCategories();
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
        } else if (props.editable) {
            Services.updateKititem("PUT", method, token, props.kititemid)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
                        props.getCategories();
                        props.setEditable(false);
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
    const getvarients = (id) => {
        Services.getProductsByProductId("GET", null, token, id)
            .then((res) => {
                console.log(res);
                if (res.Status === 1) {
                    setvarient(res.Products.ProductVariants);
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
    const clickhandler = (e) => {
        const id = e.currentTarget.getAttribute("id");
        const prodName = e.currentTarget.getAttribute("name");
        setsearch(prodName);
        setshowproducts(false);
        setsearchdata(undefined);
        setProductId(id);
        getvarients(id);
    };
    const deleteinput = (e) => {
        var key = e.keyCode || e.charCode;
        if (key == 8) {
            setProductId("");
            setsearch("");
            setvarient([]);
            reset({ VariantID: "" });
        }
    };
    return (
        <div className={dashboardclasses.modal} onClick={CancelHandler}>
            <div
                className={dashboardclasses["modal-content"]}
                onClick={openhandler}>
                <div className={dashboardclasses["modal-content-header"]}>
                    <div>
                        <h3>
                            {props.editable ? "Update Product" : "Add Product"}
                        </h3>
                        <p>
                            {props.editable ? "Update Product" : "Add Product"}{" "}
                            and necessary information from here
                        </p>
                    </div>
                    <button
                        className={dashboardclasses["close-btn"]}
                        onClick={CancelHandler}>
                        <IoClose size={22} color={"red"} />
                    </button>
                </div>
                <form
                    className={dashboardclasses["add-items"]}
                    onSubmit={handleSubmit(onSubmit)}>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="Quantity">Product</label>
                        <div
                            className={`${dashboardclasses["select"]} ${dashboardclasses["select-product"]}`}>
                            {showproducts && (
                                <div
                                    className={
                                        dashboardclasses["product-items"]
                                    }>
                                    {products.map((item) => (
                                        <button
                                            onClick={clickhandler}
                                            id={item.ProductID}
                                            name={item.ProductName}>
                                            {item.ProductName}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <input
                                list="suggestions"
                                onChange={(e) => {
                                    setsearch(e.target.value);
                                    setsearchdata(e.target.value);
                                }}
                                onKeyDown={deleteinput}
                                value={search}
                            />
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="Quantity">Variant</label>
                        <div className={dashboardclasses["select"]}>
                            <select
                                defaultValue=""
                                {...register("VariantID", {
                                    required: "Variant is required",
                                })}>
                                <option value="" disabled>
                                    Select Variant
                                </option>
                                {varient.length > 0 &&
                                    varient.map((item) => (
                                        <option value={item.VariantID}>
                                            {item.metricvalue}
                                            {item.metrictype}
                                        </option>
                                    ))}
                            </select>

                            {errors?.VariantID && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.VariantID?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={dashboardclasses["add-btn"]}>
                        <button type="button" onClick={CancelHandler}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={dashboardclasses["add-category-btn"]}>
                            {props.editable ? "update" : "Add Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
