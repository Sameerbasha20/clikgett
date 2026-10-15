import React, { useState, useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";
import { FileUploader } from "react-drag-drop-files";
import { BsCloudUpload } from "react-icons/bs";
import { useForm } from "react-hook-form";
// import { TagsInput } from "react-tag-input-component";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function AddCategory(props) {
    const [categoryItems, setCategoryItems] = useState([]);
    const [subCategoryItems, setSubCategoryItems] = useState([]);
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm();
    const [file, setFile] = useState("");
    const [base64, setbase64] = useState("");
    const formData = watch();

    useEffect(() => {
        if (props.editable) {
            Services.KitsDetails("GET", null, token, props.id)
                .then((res) => {
                    console.log(res);
                    if (res?.Status === 1) {
                        setFile(res.Kits.ImageUrl);
                        reset({
                            Description: res.Kits.Description,
                            KitName: res.Kits.KitName,
                            Price: res.Kits.Price,
                            Status: res.Kits.Status,
                            OfferPrice: res.Kits.OfferPrice,
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
    const handleChange = (file) => {
        if (file.type === "image/png" || file.type === "image/jpeg") {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                setbase64(reader.result);
                setFile(reader.result);
            };
            reader.onerror = function (error) {
                console.log("Error: ", error);
            };
        } else {
            alert("please upload image in PNG and JPEG format ");
        }
    };

    const fileuploadDesign = (
        <div className={dashboardclasses["add-item"]}>
            <BsCloudUpload className={dashboardclasses["upload-icon"]} />
            <h5>Drag Your Image here</h5>
            <p>(Only *.jpeg and *.png images will be accepted)</p>
        </div>
    );
    const onSubmit = (data) => {
        let image;
        if (base64.length > 0) {
            image = { ImageUrl: base64 };
        }
        console.log(data);
        let method = JSON.stringify({
            KitName: formData.KitName,
            Description: formData.Description,
            Price: formData.Price,
            OfferPrice: formData.OfferPrice,
            ...image,
        });
        if (!props.editable && file.length > 0) {
            Services.addKit("POST", method, token)
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
            method = JSON.stringify({
                KitName: formData.KitName,
                Description: formData.Description,
                Price: formData.Price,
                Status: formData.Status,
                OfferPrice: formData.OfferPrice,
                ...image,
            });
            Services.updateKit("PUT", method, token, props.id)
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
        } else if (file.length === 0) {
            alert("please upload image");
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
                        <h3>{props.editable ? "Update kit" : "Add kit"}</h3>
                        <p>
                            {props.editable ? "Update kit" : "Add kit"} and
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
                        <label htmlFor="ProductName">Kit Name</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                {...register("KitName", {
                                    required: "Kit Name is required",
                                })}
                            />

                            {errors?.KitName && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.KitName?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="image">Image</label>

                        <FileUploader
                            classes={dashboardclasses["upload-image"]}
                            multiple={false}
                            handleChange={handleChange}
                            name="file"
                            children={fileuploadDesign}
                            // types={fileTypes}
                        />
                    </div>
                    {file && (
                        <div className={dashboardclasses["uploaded-img"]}>
                            <img src={file} alt="" width={"120px"} />
                        </div>
                    )}

                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="metricvalue">Price</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                onWheel={blurHandler}
                                onScroll={blurHandler}
                                type={"number"}
                                {...register("Price", {
                                    required: "Price is required",
                                })}
                            />

                            {errors?.Price && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.Price?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="metricvalue">Offer Price</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                onWheel={blurHandler}
                                onScroll={blurHandler}
                                type={"number"}
                                {...register("OfferPrice", {
                                    required: "Offer Price is required",
                                })}
                            />

                            {errors?.OfferPrice && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.OfferPrice?.message}
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
                    <div className={dashboardclasses["item-image-upload"]}>
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
                    </div>
                    <div className={dashboardclasses["add-btn"]}>
                        <button type="button" onClick={CancelHandler}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={dashboardclasses["add-category-btn"]}>
                            {props.editable ? "update" : "Add kit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
