import React from "react";
import topnavclasses from "./navbar.module.css";
import User from "../../Assets/user.svg";
import GlobalSearch from "./GlobalSearch";
import NewOrderAlert from "./NewOrderAlert";
import StockAlert from "./StockAlert";

function TopNav() {
    return (
        <div className={topnavclasses["TopNav"]}>
            <GlobalSearch />
            <StockAlert />
            <NewOrderAlert />
            <div className={topnavclasses["user"]}>
                <img src={User} alt="user" />
            </div>
        </div>
    );
}

export default TopNav;
