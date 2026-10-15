import React, { useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";
import { useForm } from "react-hook-form";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function AddCategory(props) {
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const Navigate = useNavigate();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();
    useEffect(() => {
        if (props.editable) {
            Services.getWarehousebyId("GET", null, token, props.id)
                .then((res) => {
                    console.log(res);
                    if (res?.Status === 1) {
                        reset({
                            warehouseName: res.warehouses.warehouseName,
                            city: res.warehouses.city,
                            latitude: res.warehouses.latitude,
                            longitude: res.warehouses.longitude,
                            pincode: res.warehouses.pincode,
                            status: res.warehouses.status,
                        });
                    } else if (res?.Status === 0) {
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

    const onSubmit = (data) => {
        console.log(data);
        let method = JSON.stringify({
            ...data,
        });
        if (!props.editable) {
            Services.AddWarehouse("POST", method, token)
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
            Services.updateWarehouse("PUT", method, token, props.id)
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
        }
    };

    const blurHandler = (e) => {
        e.preventDefault();
        e.target.blur();

        return false;
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
                                ? "Update warehouse"
                                : "Add warehouse"}
                        </h3>
                        <p>
                            {props.editable
                                ? "Update warehouse"
                                : "Add warehouse"}{" "}
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
                        <label htmlFor="categoryName">Warehouse Name</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                {...register("warehouseName", {
                                    required: "warehouse Name  is required",
                                })}
                            />

                            {errors?.warehouseName && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.warehouseName?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="categoryName">city</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                {...register("city", {
                                    required: "city is required",
                                })}
                            />

                            {errors?.city && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.city?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="latitude">latitude</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                onWheel={blurHandler}
                                onScroll={blurHandler}
                                type={"number"}
                                step={"any"}
                                {...register("latitude", {
                                    required: "latitude is required",
                                })}
                            />

                            {errors?.latitude && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.latitude?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="longitude">longitude</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                onWheel={blurHandler}
                                onScroll={blurHandler}
                                type={"number"}
                                step={"any"}
                                {...register("longitude", {
                                    required: "longitude is required",
                                })}
                            />

                            {errors?.latitude && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.longitude?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="pincode">pincode</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                onWheel={blurHandler}
                                onScroll={blurHandler}
                                type={"number"}
                                {...register("pincode", {
                                    required: "pincode is required",
                                })}
                            />

                            {errors?.pincode && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.pincode?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor=" status">Status</label>
                        <div className={dashboardclasses["select"]}>
                            <select
                                defaultValue=""
                                {...register("status", {
                                    required: "status Is required",
                                })}>
                                <option value="" disabled>
                                    Select status
                                </option>
                                <option value={1}>active</option>
                                <option value={2}>inactive</option>
                            </select>
                            {errors?.status && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.status?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* <div className={dashboardclasses["item-tag-input"]}>
                        <label htmlFor=" child">Child Category</label>
                        <div className={dashboardclasses["item-tag"]}>
                            <TagsInput
                                value={selected}
                                onChange={setSelected}
                                name="fruits"
                                placeHolder="Child Category"
                            />
                        </div>
                    </div> */}
                    <div className={dashboardclasses["add-btn"]}>
                        <button type="button" onClick={CancelHandler}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={dashboardclasses["add-category-btn"]}>
                            {props.editable ? "update" : "Add Warehouse"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
