import React from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { css } from "@emotion/react";
import dashboardclasses from "../dashboard.module.css";
function LoaderModal() {
    const spinload = css`display: "block",
 margin: "0 auto",
 borderColor: "red",
`;
    return (
        <div className={dashboardclasses["modal-spinner"]}>
            <div className={dashboardclasses["modal-content-spinner"]}>
                {" "}
                <ClipLoader
                    color={"black"}
                    loading={spinload}
                    css={spinload}
                    size={50}
                />
            </div>
        </div>
    );
}

export default LoaderModal;
