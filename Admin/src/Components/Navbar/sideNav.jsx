import React, { useState, useRef, useEffect } from "react";
import navbarClasses from "./navbar.module.css";
import { useNavigate, NavLink } from "react-router-dom";
import { menuItems } from "./Config";
import { HiOutlineLogout } from "react-icons/hi";
import useStore from "../../Store";
import Logo from "../../Assets/logo.jpeg";
function SideNav(props) {
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const isactive = props.isactive;
    // eslint-disable-next-line
    const [adminuser, setadminuser] = useState(false);
    const { showNavbar: show, setshowNavbar: setshow } = useStore(
        (state) => state
    );
    const Navigate = useNavigate();
    const element = useRef();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);

        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);
    useEffect(() => {
        if (windowWidth <= 767) {
            if (show) {
                setshow(false);
            }
        } else if (!show && windowWidth >= 767) {
            setshow(true);
        }
    }, [windowWidth]);
    useEffect(() => {
        try {
            const userdata = JSON.parse(sessionStorage.getItem("admindata"));
            if (userdata && (userdata.role === 1 || userdata.Role === 1)) {
                setadminuser(true);
            }
        } catch (e) {}
    }, []);

    const logouthandler = () => {
        if (window.confirm("Are you sure you want to logout")) {
            sessionStorage.clear();
            // window.location.reload();
            Navigate("/");
        }
    };
    return (
        <>
            {/*     <div
                className={`${!show ? navbarClasses["backdrop"] : ""}`}
                onClick={() => {
                    setDropdown("");
                }}></div> */}
            <div
                className={`${navbarClasses["Container"]} ${
                    !show ? navbarClasses["hide"] : ""
                }`}>
                <div>
                    <div className={navbarClasses["hamburger"]}>
                        <img
                            className={!show ? navbarClasses["img-size"] : undefined}
                            src={Logo}
                            alt="logo"
                        />
                    </div>

                    <div className={navbarClasses["navlinks"]}>
                        {menuItems.map((menuData) => {
                            if (!menuData.multiple) {
                                return (
                                    <NavLink
                                        key={menuData.id}
                                        id={menuData.id}
                                        to={menuData.menuLink}
                                        data-tooltip-id={menuData.id}
                                        data-tooltip-content={menuData.name}
                                        data-tooltip-position-strategy={
                                            "fixed"
                                        }
                                        className={
                                            isactive === menuData.active
                                                ? navbarClasses["navActive"]
                                                : navbarClasses[
                                                      "navInactive"
                                                  ]
                                        }>
                                        <menuData.icon
                                            className={
                                                navbarClasses["nav-icon"]
                                            }
                                        />
                                        {show && (
                                            <span>{menuData.name}</span>
                                        )}
                                    </NavLink>
                                );
                            }
                            return null;
                        })}
                        <div className={navbarClasses["logout"]}>
                            <button>
                                {" "}
                                <HiOutlineLogout size={22} />
                                <span onClick={logouthandler}>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SideNav;
