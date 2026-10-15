import React from "react";
import LoginClasses from "./login.module.css";
import LoginLogo from "../../Assets/login/forgotpassword.jpeg";
import { useForm } from "react-hook-form";
import { NavLink } from "react-router-dom";
function Login() {
    const {
        register,
        handleSubmit,

        formState: { errors },
    } = useForm();
    const onSubmit = (data) => console.log(data);
    return (
        <div className={LoginClasses["login-wrapper"]}>
            <div
                className={`${LoginClasses["signup-subwrapper"]} ${LoginClasses["forgot-password"]}`}>
                <div className={LoginClasses["login-logo"]}>
                    <img src={LoginLogo} alt="login-logo" />
                </div>
                <div className={LoginClasses["login-form"]}>
                    <h3>Forgot Password</h3>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className={LoginClasses["form-control"]}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                {...register("EmailID", {
                                    required: "Email is required!",
                                })}
                            />
                            {errors?.EmailID && (
                                <p className={LoginClasses.error}>
                                    {errors?.EmailID?.message}
                                </p>
                            )}
                        </div>

                        <input type="submit" value="Recover Password" />

                        <span className={LoginClasses.border}></span>
                    </form>
                    <div className={LoginClasses["login-links"]}>
                        <NavLink to="/">Already Have Account? Login</NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
