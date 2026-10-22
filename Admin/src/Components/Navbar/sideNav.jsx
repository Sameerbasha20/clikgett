import React, { useState, useEffect } from "react";
import navbarClasses from "./navbar.module.css";
import { useNavigate, NavLink } from "react-router-dom";
import { menuSections } from "./Config";
import { HiOutlineLogout } from "react-icons/hi";
import useStore from "../../Store";
import Logo from "../../Assets/logo.jpeg";
function SideNav(props) {
    const isactive = props.isactive;
    // eslint-disable-next-line
    const [adminuser, setadminuser] = useState(false);
    const { showNavbar: show, setshowNavbar: setshow } = useStore(
        (state) => state
    );
    const Navigate = useNavigate();
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
                        {menuSections.map((section) => (
                            <div key={section.title || "main"}>
                                {section.title && show && (
                                    <div className={navbarClasses["section-title"]}>{section.title}</div>
                                )}
                                {section.items.map((menuData) => (
                                    <NavLink
                                        key={menuData.menuLink}
                                        to={menuData.menuLink}
                                        title={menuData.name}
                                        className={
                                            isactive === menuData.active
                                                ? navbarClasses["navActive"]
                                                : navbarClasses["navInactive"]
                                        }>
                                        <menuData.icon className={navbarClasses["nav-icon"]} />
                                        {show && <span>{menuData.name}</span>}
                                    </NavLink>
                                ))}
                            </div>
                        ))}
                        <div className={navbarClasses["logout"]}>
                            <button type="button" onClick={logouthandler}>
                                <HiOutlineLogout size={22} />
                                {show && <span>Logout</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SideNav;
