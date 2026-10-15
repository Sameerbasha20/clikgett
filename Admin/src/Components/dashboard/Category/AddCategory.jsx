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
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const [loading, setLoading] = useState(false);
    let [old, setOld] = useState(null);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();
    const [file, setFile] = useState("");
    const [base64, setbase64] = useState("");
    useEffect(() => {
        if (props.editable) {
            Services.getCategoriesbyId("GET", null, token, props.id)
                .then((res) => {
                    if (res?.Status === 1) {
                        //res.categories.imageUrl
                        setFile(res.Categories.ImageUrl);

                        reset({
                            CategoryName: res.Categories.CategoryName,
                            Status: res.Categories.Status,
                            Description: res.Categories.Description,
                            Priority: res.Categories.Priority,
                        });
                        setOld(res.Categories.Priority);
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
        let image;
        if (base64.length > 0) {
            image = { ImageUrl: base64 };
        }
        console.log(data);
        let method = {
            ...data,
            ...image,
        };
        setLoading(true);
        if (!props.editable && file.length !== 0) {
            Services.AddCategories("POST", JSON.stringify(method), token)
                .then((res) => {
                    setLoading(false);
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
                    setLoading(false);
                    // alert(err);
                    alert("something went wrong please try again");
                    console.log(err);
                });
        } else if (props.editable) {
            method = { ...method };
            if (old != null) {
                method = { ...method, oldPriority: old };
            }
            console.log(old);
            Services.updatecategories(
                "PUT",
                JSON.stringify(method),
                token,
                props.id
            )
                .then((res) => {
                    setLoading(false);
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
                    setLoading(false);
                    // alert(err);
                    alert("something went wrong please try again");
                    console.log(err);
                });
        } else if (file.length === 0) {
            setLoading(false);
            alert("please upload icon");
        }
    };

    return (
        <div
            className={dashboardclasses.modal}
            onClick={CancelHandler}
            style={{ cursor: loading ? "progress" : "initial" }}>
            <div
                className={dashboardclasses["modal-content"]}
                onClick={openhandler}>
                <div className={dashboardclasses["modal-content-header"]}>
                    <div>
                        <h3>
                            {props.editable
                                ? "Update Category"
                                : "Add Category"}
                        </h3>
                        <p>
                            {props.editable
                                ? "Update Category"
                                : "Add Category"}{" "}
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
                        <label htmlFor="categoryName">category Name</label>
                        <div className={dashboardclasses["select"]}>
                            <input
                                {...register("CategoryName", {
                                    required: "category Name is required",
                                })}
                            />

                            {errors?.CategoryName && (
                                <p className={dashboardclasses["error"]}>
                                    {errors?.CategoryName?.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={dashboardclasses["item-image-upload"]}>
                        <label htmlFor="category">Category Icon</label>

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
                    {props.editable && (
                        <div className={dashboardclasses["item-image-upload"]}>
                            <label htmlFor="status">Priority</label>
                            <div className={dashboardclasses["select"]}>
                                <input
                                    type="number"
                                    {...register("Priority", {
                                        required: "Priority is required",
                                    })}
                                />

                                {errors?.Priority && (
                                    <p className={dashboardclasses["error"]}>
                                        {errors?.Priority?.message}
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
                            disabled={loading}
                            className={dashboardclasses["add-category-btn"]}>
                            {loading
                                ? "Loading..."
                                : props.editable
                                ? "update"
                                : "Add Category"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;
