import React, { useState, useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";
import { useForm } from "react-hook-form";
// import { TagsInput } from "react-tag-input-component";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function AddCategory(props) {
    const [categoryItems, setCategoryItems] = useState([]);
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    useEffect(() => {
        Services.getCategories("GET", null, token)
            .then((res) => {
                if (res.Status === 1) {
                    setCategoryItems(res.Categories);
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

        if (props.editable) {
            Services.getSubCategoryById("GET", null, token, props.id)
                .then((res) => {
                    console.log(res);
                    if (res?.Status === 1) {
                        //res.categories.imageUrl
                        reset({
                            SubCategoryName: res.SubCategories.SubCategoryName,
                            Status: res.SubCategories.Status,
                            CategoryID: res.SubCategories.CategoryID,
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
        e.stopPropagation();
    };
    // const fileTypes = ["JPEG", "PNG"];

    const onSubmit = (data) => {
        console.log(data);
        let method = JSON.stringify({
            ...data,
        });
        if (!props.editable) {
            Services.AddSubCategory("POST", method, token)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
                        props.getCategories(props.categoryId);
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
            Services.updateSubcategory("PUT", method, token, props.id)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
                        props.getCategories(props.categoryId);
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

    return (
        <div className={dashboardclasses.modal} onClick={CancelHandler}>
            <div
                className={dashboardclasses["modal-content"]}
                onClick={openhandler}>
                <div className={dashboardclasses["modal-content-header"]}>
                    <div>
                        <h3>
                            {props.editable
                                ? "Update Subcategory"
                                : "Add Subcategory"}
                        </h3>
                        <p>
                            {props.editable
                                ? "Update Subcategory"
                                : "Add Subcategory"}{" "}
                            your Product category and necessary information from
                            here
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
                        <label htmlFor="SubCategoryName">
                            Subcategory Name
                        </label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                {...register("SubCategoryName", {
                                    required: "Subcategory Name is required",
                                })}
                            />

                            {errors?.SubCategoryName && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.SubCategoryName?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="Category">Category</label>
                        <div className={dashboardclasses["select"]}>
                            <select
                                defaultValue=""
                                {...register("CategoryID", {
                                    required: "Category is required",
                                })}>
                                <option value="" disabled>
                                    Select Category
                                </option>
                                {categoryItems?.map((item) => {
                                    return (
                                        <option value={item?.CategoryID}>
                                            {item?.CategoryName}
                                        </option>
                                    );
                                })}
                            </select>
                            {errors?.CategoryID && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.CategoryID?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    {props.editable && (
                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="status">Status</label>
                            <div className={dashboardclasses["select"]}>
                                <select
                                    {...register("Status", {
                                        required: "status Is required",
                                    })}>
                                    <option value="1">Active</option>
                                    <option value="2">Inactive</option>
                                </select>
                                {errors?.Status && (
                                    <p className={dashboardclasses["error"]}>
                                        {errors?.Status?.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className={dashboardclasses["add-btn"]}>
                        <button type="button" onClick={CancelHandler}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={dashboardclasses["add-category-btn"]}>
                            {props.editable ? "update" : "Add Subcategory"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
