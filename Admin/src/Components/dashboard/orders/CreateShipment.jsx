import React from "react";
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
    const {
        register,
        handleSubmit,

        formState: { errors },
    } = useForm();

    // useEffect(() => {
    //     if (props.editable) {
    //     }
    // }, []);
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
        let method = JSON.stringify({
            ...data,
            orderId: props.id,
        });
        if (!props.editable) {
            Services.AddShipmentData("POST", method, token)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
                        props.getorders();
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
            Services.updatecategories("PUT", method, token, props.id)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
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
                                ? "Update shipment"
                                : "Add Shipment"}
                        </h3>
                        <p>
                            {props.editable
                                ? "Update shipment"
                                : "Add shipment"}{" "}
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
                        <label htmlFor=" length">Length</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="text"
                                {...register("Length", {
                                    required: "length is required",
                                })}
                            />

                            {errors?.Length && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.Length?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor=" height">Height</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="text"
                                {...register("height", {
                                    required: "height is required",
                                })}
                            />

                            {errors?.height && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.height?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor=" breadth">Breadth</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="text"
                                {...register("breadth", {
                                    required: "breadth is required",
                                })}
                            />

                            {errors?.breadth && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.breadth?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor=" weight">Weight</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                type="text"
                                {...register("weight", {
                                    required: "weight is required",
                                })}
                            />

                            {errors?.weight && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.weight?.message}
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
                            {props.editable ? "update" : "Add Shipment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
