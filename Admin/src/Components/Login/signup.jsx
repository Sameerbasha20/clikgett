import React, { useState } from "react";
import LoginClasses from "./login.module.css";
import LoginLogo from "../../Assets/login/createaccount.jpeg";
import { useForm } from "react-hook-form";
import { TiSocialFacebook } from "react-icons/ti";
import { AiOutlineGoogle } from "react-icons/ai";
import { NavLink } from "react-router-dom";
import { Services } from "../../Services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function Login() {
    const [isChecked, setIsChecked] = useState(false);
    const Navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();
    const termsHandler = (e) => {
        setIsChecked(e.target.checked);
    };
    const onSubmit = (data) => {
        const body = JSON.stringify(data);
        if (isChecked) {
            Services.signup("POST", body)
                .then((response) => {
                    console.log(response);
                    if (response.Status === 1) {
                        toast.success(`${response.Message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                        Navigate("/");
                    } else if (response.Status === 0) {
                        alert(response.Message);
                    }
                })
                .catch((err) => {
                    // alert(err);
                    alert("something went wrong please try again");
                    console.log(err);
                });
        } else {
            alert("please Accept terms and conditions");
        }
    };
    return (
        <div className={LoginClasses["login-wrapper"]}>
            <div className={`${LoginClasses["signup-subwrapper"]}`}>
                <div className={LoginClasses["login-logo"]}>
                    <img src={LoginLogo} alt="login-logo" />
                </div>
                <div className={LoginClasses["login-form"]}>
                    <h3>Create Account</h3>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className={LoginClasses["form-control"]}>
                            <label htmlFor="Name">Name</label>
                            <input
                                type="text"
                                {...register("firstName", {
                                    required: "Name is required!",
                                })}
                            />
                            {errors?.firstName && (
                                <p className={LoginClasses.error}>
                                    {errors?.firstName?.message}
                                </p>
                            )}
                        </div>
                        <div className={LoginClasses["form-control"]}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                {...register("emailId", {
                                    required: "Email is required!",
                                })}
                            />
                            {errors?.emailId && (
                                <p className={LoginClasses.error}>
                                    {errors?.emailId?.message}
                                </p>
                            )}
                        </div>
                        <div className={LoginClasses["form-control"]}>
                            <label htmlFor="password">Password</label>

                            <input
                                type="password"
                                {...register("password", {
                                    required: "Password is required!",
                                })}
                            />
                            {errors?.password && (
                                <p className={LoginClasses.error}>
                                    {errors?.password?.message}
                                </p>
                            )}
                        </div>
                        <div className={LoginClasses["form-control"]}>
                            <label htmlFor="StaffRole">Staff Role</label>
                            <select
                                defaultValue=""
                                {...register("role", {
                                    required: "Staff Role is required!",
                                })}>
                                <option value="" disabled>
                                    Staff Role
                                </option>
                                <option value="1">Admin</option>
                                <option value="2">CEO</option>
                                <option value="3">Manager</option>
                                <option value="4">Accountant</option>
                                <option value="5">Driver</option>
                                <option value="6">Security Guard</option>
                                <option value="7">Delivery Person</option>
                            </select>
                            {errors?.role && (
                                <p className={LoginClasses.error}>
                                    {errors?.role?.message}
                                </p>
                            )}
                        </div>
                        <div className={LoginClasses["form-control-terms"]}>
                            <input type="checkbox" onClick={termsHandler} />
                            <label htmlFor="TERMS">
                                I agree to <span>Privacy Policy</span>
                            </label>
                        </div>
                        <input type="submit" value="Sign up" />

                        <span className={LoginClasses.border}></span>
                    </form>
                    <div className={LoginClasses["social-btns"]}>
                        <button className={LoginClasses["facebook"]}>
                            <TiSocialFacebook size={29} />
                            <p>Login With Facebook</p>
                        </button>
                        <button className={LoginClasses["google"]}>
                            <AiOutlineGoogle size={26} />
                            <p>Login With Google</p>
                        </button>
                    </div>
                    <div className={LoginClasses["login-links"]}>
                        <NavLink to="/">Already Have Account? Login</NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
