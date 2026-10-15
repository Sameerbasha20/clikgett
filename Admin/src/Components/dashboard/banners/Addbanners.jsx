import React, { useState, useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose } from "react-icons/io5";
import { FileUploader } from "react-drag-drop-files";
import { BsCloudUpload } from "react-icons/bs";
import { useForm } from "react-hook-form";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function AddCategory(props) {
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();
    const [file, setFile] = useState("");
    const [base64, setbase64] = useState("");
    // eslint-disable-next-line
    const [categoryItems, setCategoryItems] = useState([]);
    const [subCategoryItems, setSubCategoryItems] = useState([]);
    const [destType, setDestType] = useState("subcategory");
    useEffect(() => {
        Services.GetSubCategoryAll("GET", null, token)
            .then((res) => {
                if (res.Status === 1) {
                    setSubCategoryItems(res.SubCategories || []);
                }
            })
            .catch(console.error);
        Services.getCategories("GET", null, token)
            .then((res) => {
                console.log(res);
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
            Services.getBannerbyId("GET", null, token, props.id)
                .then((res) => {
                    console.log(res);
                    if (res?.status === 1) {
                        //res.categories.imageUrl
                        setFile(res.Banners.ImageUrl);

                        reset({
                            BannerName: res.Banners.BannerName,
                            Description: res.Banners.Description,
                            Status: res.Banners.Status,
                            // categoryId: res.banners.categoryId,
                        });
                    } else if (res.status === 0) {
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
    const handleChange = (file) => {
        if (file.type === "image/png" || file.type === "image/jpeg") {
            let maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
                alert("File size cannot be greater than 2 MB");
                return;
            }

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
        console.log(data);
        let image;
        if (base64.length > 0) {
            image = { ImageUrl: base64 };
        }
        let method = JSON.stringify({
            ...data,
            ...image,
        });
        if (!props.editable && file.length !== 0) {
            Services.AddBanners("POST", method, token)
                .then((res) => {
                    if (res.status === 1) {
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
                    } else if (res.status === 0) {
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
            Services.updateBanner("PUT", method, token, props.id)
                .then((res) => {
                    if (res.status === 1) {
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
                    } else if (res.status === 0) {
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
        } else if (file.length === 0) {
            alert("please upload icon");
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
                            {props.editable ? "Update Banner" : "Add Banner"}
                        </h3>
                        <p>
                            {props.editable ? "Update Banner" : "Add Banner"}{" "}
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
                        <label htmlFor="Bannername">Banner Name</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                {...register("BannerName", {
                                    required: "Banner Name is required",
                                })}
                            />

                            {errors?.BannerName && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.BannerName?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="image">Banner Image</label>

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

                    {/* <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor=" Category">Category</label>
                        <div className={dashboardclasses["select"]}>
                            <select
                                defaultValue=""
                                {...register("categoryId", {
                                    required: "Category Is required",
                                })}>
                                <option value="" disabled>
                                    Select category
                                </option>
                                {categoryItems.map((item) => (
                                    <option value={item.CategoryID}>
                                        {item.CategoryName}
                                    </option>
                                ))}
                            </select>
                            {errors?.categoryId && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.categoryId?.message}
                                </p>
                            )}
                        </div>
                    </div> */}
                    {props.editable && (
                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor=" status">Status</label>
                            <div className={dashboardclasses["select"]}>
                                <select
                                    defaultValue=""
                                    {...register("Status", {
                                        required: "Status Is required",
                                    })}>
                                    <option value="" disabled>
                                        Select status
                                    </option>
                                    <option value={1}>active</option>
                                    <option value={2}>inactive</option>
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
                            {props.editable ? "update" : "Add Banner"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
