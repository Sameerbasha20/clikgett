import React, { useState, useRef, useEffect } from "react";
import sideNavClasses from "./navbar.module.css";
import { useNavigate, NavLink } from "react-router-dom";
import { AiOutlineUnorderedList } from "react-icons/ai";
import { BiCloudDownload } from "react-icons/bi";
import { GiNewspaper } from "react-icons/gi";
import { HiOutlineLogout } from "react-icons/hi";
import {
    MdOutlineCategory,
    MdOutlineDeliveryDining,
    MdOutlineAltRoute,
    MdOutlineNotificationsActive,
} from "react-icons/md";
import { Services } from "../../Services";
import { AiOutlineMenu, AiOutlineDown, AiOutlineGift } from "react-icons/ai";
import { CgShoppingBag, CgShoppingCart } from "react-icons/cg";
import { IoPricetagsOutline } from "react-icons/io5";
import { FiSettings } from "react-icons/fi";
import { MdOutlineKitchen } from "react-icons/md";
import { toast } from "react-toastify";
import Logo from "../../Assets/ricehub.png";
import { MdRecommend } from "react-icons/md";
function SideNav(props) {
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const isactive = props.isactive;
    // eslint-disable-next-line
    const [adminuser, setadminuser] = useState(false);
    const [categoryItems, setCategoryItems] = useState([]);
    const [show, setshow] = useState(false);
    const element = useRef();
    const [showNav, setShowNav] = useState(false);
    const Navigate = useNavigate();
    const [productShow, setProductShow] = useState(false);
    useEffect(() => {
        try {
            const userdata = JSON.parse(sessionStorage.getItem("admindata"));
            if (userdata && (userdata.role === 1 || userdata.Role === 1)) {
                setadminuser(true);
            }
        } catch (e) {}
    }, []);
    const getcategories = () => {
        Services.getCategories("GET", null, token)
            .then((res) => {
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
    };
    useEffect(() => {
        getcategories();
        // eslint-disable-next-line
    }, []);
    const homeHandler = () => {
        Navigate("/categories");
    };
    const navbarhandler = () => {
        setShowNav((prev) => !prev);
    };
    const logouthandler = () => {
        if (window.confirm("Are you sure you want to logout")) {
            sessionStorage.clear();
            // window.location.reload();
            Navigate("/");
        }
    };
    return (
        <>
            <div
                className={showNav ? sideNavClasses["drop-back"] : ""}
                onClick={navbarhandler}></div>
            <div
                ref={element}
                className={`${sideNavClasses["sidenavwrapper"]} ${
                    showNav && sideNavClasses["wrapper-show"]
                }`}>
                <AiOutlineMenu
                    className={sideNavClasses["menu-icon"]}
                    onClick={navbarhandler}
                />

                <div
                    className={`${sideNavClasses["sidenavbar"]} ${
                        showNav && sideNavClasses["show"]
                    }`}>
                    <button
                        className={sideNavClasses["logo"]}
                        onClick={homeHandler}>
                        <img src={Logo} alt="logo" width={"200px"} />
                        {/* <p>Rice Hub</p> */}
                    </button>
                    <div className={sideNavClasses["Navlinks"]}>
                        <NavLink
                            to="/categories"
                            className={
                                isactive === "categories"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <AiOutlineUnorderedList />
                            <span>Categories</span>
                        </NavLink>
                        <NavLink
                            to="/banners"
                            className={
                                isactive === "banners"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <GiNewspaper
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Banners</span>
                        </NavLink>
                        <div className={sideNavClasses["subcategories"]}>
                            <button
                                onClick={() => {
                                    setshow((prev) => !prev);
                                }}
                                className={
                                    isactive === "subcategories"
                                        ? sideNavClasses["nav-active"]
                                        : sideNavClasses["nav-inactive"]
                                }>
                                <MdOutlineCategory
                                    className={sideNavClasses["nav-icon"]}
                                />
                                <span>Sub categories</span>
                                <AiOutlineDown
                                    className={`${sideNavClasses["nav-icon"]} ${sideNavClasses["nav-icon-categories"]}`}
                                />
                            </button>
                            {show && (
                                <div
                                    className={`${
                                        sideNavClasses["subcategories-items"]
                                    } ${
                                        !show
                                            ? sideNavClasses["fadeOut"]
                                            : sideNavClasses["fadein"]
                                    }`}>
                                    {categoryItems.map((item) => {
                                        return (
                                            <NavLink
                                                to={`/subcategories/${item.CategoryID}`}
                                                className={({ isActive }) =>
                                                    isActive
                                                        ? sideNavClasses[
                                                              "nav-active"
                                                          ]
                                                        : sideNavClasses[
                                                              "nav-inactive"
                                                          ]
                                                }>
                                                <span>{item.CategoryName}</span>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className={sideNavClasses["subcategories"]}>
                            <button
                                onClick={() => {
                                    setProductShow((prev) => !prev);
                                }}
                                className={
                                    isactive === "products"
                                        ? sideNavClasses["nav-active"]
                                        : sideNavClasses["nav-inactive"]
                                }>
                                <CgShoppingBag
                                    className={sideNavClasses["nav-icon"]}
                                />
                                <span>Products</span>
                                <AiOutlineDown
                                    className={`${sideNavClasses["nav-icon"]} ${sideNavClasses["nav-icon-categories"]}`}
                                />
                            </button>
                            {productShow && (
                                <div
                                    className={`${
                                        sideNavClasses["subcategories-items"]
                                    } ${
                                        !productShow
                                            ? sideNavClasses["fadeOut"]
                                            : sideNavClasses["fadein"]
                                    }`}>
                                    {categoryItems.map((item) => {
                                        return (
                                            <NavLink
                                                to={`/products/${item.CategoryID}`}
                                                className={({ isActive }) =>
                                                    isActive
                                                        ? sideNavClasses[
                                                              "nav-active"
                                                          ]
                                                        : sideNavClasses[
                                                              "nav-inactive"
                                                          ]
                                                }>
                                                <span>{item.CategoryName}</span>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {/*    <NavLink
                            to="/kits"
                            className={
                                isactive === "kits"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <MdOutlineKitchen
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Kits</span>
                        </NavLink> */}
                        <NavLink
                            to="/Recommended"
                            className={
                                isactive === "Recommended"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <MdRecommend
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Recommended Products</span>
                        </NavLink>
                        <NavLink
                            to="/DeliveryBoy"
                            className={
                                isactive === "Deliveryboy"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <MdOutlineDeliveryDining
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Delivery Boy</span>
                        </NavLink>
                        <NavLink
                            to="/promocodes"
                            className={
                                isactive === "promocode"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <AiOutlineGift
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Promocodes</span>
                        </NavLink>
                        <NavLink
                            to="/orders"
                            className={
                                isactive === "orders"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <CgShoppingCart
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Orders</span>
                        </NavLink>
                        <NavLink
                            to="/routes"
                            className={
                                isactive === "routes"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <MdOutlineAltRoute
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Routes</span>
                        </NavLink>
                        {/*   <NavLink
                            to="/update-price"
                            className={
                                isactive === "priceUpdate"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <IoPricetagsOutline
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Bulk Price Update</span>
                        </NavLink> */}
                        {/*   <NavLink
                            to="/operations"
                            className={
                                isactive === "operations"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <BiCloudDownload
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Operations</span>
                        </NavLink> */}
                        <NavLink
                            to="/notification"
                            className={
                                isactive === "notification"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <MdOutlineNotificationsActive
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Notifiction</span>
                        </NavLink>
                        <NavLink
                            to="/settings"
                            className={
                                isactive === "settings"
                                    ? sideNavClasses["nav-active"]
                                    : sideNavClasses["nav-inactive"]
                            }>
                            <FiSettings
                                className={sideNavClasses["nav-icon"]}
                            />
                            <span>Settings</span>
                        </NavLink>
                    </div>
                    <div className={sideNavClasses["logout"]}>
                        <button>
                            {" "}
                            <HiOutlineLogout size={22} />
                            <span onClick={logouthandler}>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SideNav;
