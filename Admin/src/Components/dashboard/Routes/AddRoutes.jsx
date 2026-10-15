import React, { useState, useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";
import { useForm } from "react-hook-form";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { WithContext as ReactTags } from "react-tag-input";
import "../../../App.css";
function AddCategory(props) {
    const KeyCodes = {
        comma: 188,
        enter: 13,
    };
    const [tagerror, setTagError] = useState(false);
    const delimiters = [KeyCodes.comma, KeyCodes.enter];

    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();
    // eslint-disable-next-line
    const [categoryItems, setCategoryItems] = useState([]);
    const [deliveryboys, setDeliveryBoys] = useState([]);
    const [tags, setTags] = React.useState([]);

    const handleDelete = (i) => {
        setTags(tags.filter((tag, index) => index !== i));
    };

    const handleAddition = (tag) => {
        setTags([...tags, tag]);
    };

    const handleDrag = (tag, currPos, newPos) => {
        const newTags = tags.slice();

        newTags.splice(currPos, 1);
        newTags.splice(newPos, 0, tag);

        // re-render
        setTags(newTags);
    };

    const handleTagClick = (index) => {
        console.log("The tag at index " + index + " was clicked");
    };

    useEffect(() => {
        Services.getDeliveryBoy("GET", null, token)
            .then((res) => {
                console.log(res);
                if (res.Status === 1) {
                    setDeliveryBoys(
                        res.Deliveryboys?.filter((item) => item.Status == 1)
                    );
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
            Services.getRoutebyId("GET", null, token, props.id)
                .then((res) => {
                    console.log(res);
                    if (res?.Status === 1) {
                        if (res?.Orders[0]?.OrderIDs?.length > 0) {
                            let selectedta = res?.Orders[0]?.OrderIDs?.map(
                                (item) => {
                                    return {
                                        id: String(item),
                                        text: String(item),
                                    };
                                }
                            );
                            console.log(selectedta);
                            setTags(selectedta);
                        }

                        //res.categories.imageUrl
                        reset({
                            Name: res.Orders[0].Name,
                            DeliveryBoyID: res.Orders[0].DeliveryBoyID,
                            Status: res.Orders[0].Status,
                            // categoryId: res.banners.categoryId,
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

    const onSubmit = (data) => {
        console.log(data);
        if (!tags.length > 0) {
            setTagError(true);
            return;
        }
        setTagError(false);
        const selectedorders = tags.map((tag) => tag.text);

        let method = JSON.stringify({
            ...data,
            OrderIDs: selectedorders,
        });
        if (!props.editable) {
            Services.AddRoutes("POST", method, token)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);
                        props.getCategories(props.Navactive);
                        // props.setNavactive(data.Status);
                        toast.success(`${res.Message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    } else {
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
                })
                .catch((err) => {
                    // alert(err);
                    alert("something went wrong please try again");
                    console.log(err);
                });
        } else if (props.editable) {
            Services.RouteUpdate("PUT", method, token, props.id)
                .then((res) => {
                    if (res.Status === 1) {
                        props.setmodal(false);

                        props.getCategories(props.Navactive);
                        // props.setNavactive(data.Status);
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
                        <h3>{props.editable ? "Update Route" : "Add Route"}</h3>
                        <p>
                            {props.editable ? "Update Route" : "Add Route"} and
                            necessary information from here
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
                        <label htmlFor="Name">Name</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                {...register("Name", {
                                    required: "Name is required",
                                })}
                            />

                            {errors?.Name && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.Name?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="Delivery boy">Delivery Boy</label>
                        <div className={dashboardclasses["select"]}>
                            <select
                                defaultValue=""
                                {...register("DeliveryBoyID", {
                                    required: "Select Delivery boy",
                                })}>
                                <option value="" disabled>
                                    Select Delivery boy
                                </option>
                                {deliveryboys.map((boy) => (
                                    <option value={boy.AdminID}>
                                        {boy.FirstName}
                                    </option>
                                ))}
                            </select>
                            {errors?.DeliveryBoyID && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.DeliveryBoyID?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div
                        className={`${dashboardclasses["item-image-upload"]} `}>
                        <label htmlFor="OrderIDs">Orders</label>
                        <div
                            className={`${dashboardclasses["select"]} ${dashboardclasses["tags"]}`}>
                            <ReactTags
                                tags={tags}
                                delimiters={delimiters}
                                handleDelete={handleDelete}
                                handleAddition={handleAddition}
                                handleDrag={handleDrag}
                                handleTagClick={handleTagClick}
                                inputFieldPosition="bottom"
                                autocomplete
                            />
                            {tagerror && (
                                <p className={dashboardclasses["error"]}>
                                    Please enter OrderID
                                </p>
                            )}
                        </div>
                    </div>

                    {/* <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="Description">Description</label>
                        <div className={dashboardclasses["select"]}>
                            <textarea
                                rows={5}
                                {...register("Description", {
                                    required: "Description is required",
                                })}></textarea>

                            {errors?.Description && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.Description?.message}
                                </p>
                            )}
                        </div>
                    </div> */}

                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="Status">Status</label>
                        <div className={dashboardclasses["select"]}>
                            <select
                                defaultValue=""
                                {...register("Status", {
                                    required: "Status Is required",
                                })}>
                                <option value="" disabled>
                                    Select Status
                                </option>
                                <option value="1">Pending</option>
                                <option value="2">Past</option>
                            </select>
                            {errors?.Status && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.Status?.message}
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
                            {props.editable ? "update" : "Add Route"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
