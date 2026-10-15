import React from "react";
import topnavclasses from "./navbar.module.css";
import User from "../../Assets/user.svg";
import GlobalSearch from "./GlobalSearch";

function TopNav() {
    return (
        <div className={topnavclasses["TopNav"]}>
            <GlobalSearch />
            <div className={topnavclasses["user"]}>
                <img src={User} alt="user" />
            </div>
        </div>
    );
}

export default TopNav;
