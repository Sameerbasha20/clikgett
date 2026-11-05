import { AiOutlineUnorderedList, AiOutlineGift, AiOutlineDashboard } from "react-icons/ai";
import { GiNewspaper } from "react-icons/gi";
import { MdOutlineCategory, MdOutlineDeliveryDining, MdOutlineInventory2, MdOutlinePriceChange, MdOutlineRemoveShoppingCart } from "react-icons/md";
import { CgShoppingCart } from "react-icons/cg";
import { IoPricetagsOutline } from "react-icons/io5";
import { FiSettings, FiDownload } from "react-icons/fi";
import {
    FaUserFriends, FaPercent, FaSearch, FaCommentDots, FaStore, FaUnlockAlt, FaCoins,
    FaCamera, FaClipboardList, FaCrown, FaUserShield, FaBell, FaClock, FaGift, FaBalanceScale, FaQuestionCircle,
} from "react-icons/fa";

// Sidebar, grouped by job. `active` must match the page's <SideNav isactive="..."> value.
export const menuSections = [
    {
        title: null,
        items: [{ name: "Dashboard", menuLink: "/dashboard", area: "common", active: "dashboard", icon: AiOutlineDashboard }],
    },
    {
        title: "Orders",
        items: [
            { name: "Orders", menuLink: "/orders", area: "orders", active: "orders", icon: CgShoppingCart },
            { name: "Live Operations", menuLink: "/live-operations", area: "orders", active: "LiveOperations", icon: MdOutlineDeliveryDining },
            { name: "Photo Orders", menuLink: "/photo-orders", area: "orders", active: "photoOrders", icon: FaCamera },
            { name: "Customer Requests", menuLink: "/product-requests", area: "orders", active: "productRequests", icon: FaClipboardList },
        ],
    },
    {
        title: "Catalog",
        items: [
            { name: "Products", menuLink: "/products", area: "catalog", active: "products", icon: MdOutlineCategory },
            { name: "Stock", menuLink: "/stock", area: "catalog", active: "stock", icon: MdOutlineInventory2 },
            { name: "Out of stock", menuLink: "/out-of-stock", area: "catalog", active: "out-of-stock", icon: MdOutlineRemoveShoppingCart },
            { name: "Categories", menuLink: "/categories", area: "catalog", active: "categories", icon: AiOutlineUnorderedList },
            { name: "Sub categories", menuLink: "/subcategories", area: "catalog", active: "subcategories", icon: MdOutlineCategory },
            { name: "Bulk price update", menuLink: "/update-price", area: "catalog", active: "priceUpdate", icon: MdOutlinePriceChange },
        ],
    },
    {
        title: "Storefront",
        items: [
            { name: "Home Sections", menuLink: "/home-sections", area: "catalog", active: "home-sections", icon: FaStore },
            { name: "Banners", menuLink: "/banners", area: "catalog", active: "banners", icon: GiNewspaper },
        ],
    },
    {
        title: "Marketing",
        items: [
            { name: "Coupon Codes", menuLink: "/promocodes", area: "marketing", active: "promocode", icon: AiOutlineGift },
            { name: "Flash Sales", menuLink: "/sales", area: "marketing", active: "sales", icon: IoPricetagsOutline },
            { name: "Welcome Offer", menuLink: "/welcome-offer", area: "marketing", active: "welcome-offer", icon: FaGift },
            { name: "Price Compare", menuLink: "/price-compare", area: "marketing", active: "price-compare", icon: FaBalanceScale },
            { name: "Cart Offers", menuLink: "/cart-offers", area: "marketing", active: "cartoffers", icon: FaPercent },
            { name: "Abandoned Carts", menuLink: "/abandoned-carts", area: "marketing", active: "abandoned-carts", icon: CgShoppingCart },
            { name: "Send Notification", menuLink: "/notification", area: "marketing", active: "notification", icon: FaBell },
        ],
    },
    {
        title: "Rewards",
        items: [
            { name: "Cashback Review", menuLink: "/cashback-review", area: "finance", active: "cashback-review", icon: FaCoins },
            { name: "Milestones", menuLink: "/milestones", area: "marketing", active: "milestones", icon: AiOutlineGift },
            { name: "Unlock deals", menuLink: "/product-unlocks", area: "marketing", active: "product-unlocks", icon: FaUnlockAlt },
            { name: "Feedback & Rewards", menuLink: "/feedback", area: "customers", active: "feedback", icon: FaCommentDots },
            { name: "Membership", menuLink: "/membership", area: "marketing", active: "membership", icon: FaCrown },
        ],
    },
    {
        title: "People",
        items: [
            { name: "Customers", menuLink: "/customers", area: "customers", active: "customers", icon: FaUserFriends },
            { name: "Riders", menuLink: "/DeliveryBoy", area: "riders", active: "Deliveryboy", icon: MdOutlineDeliveryDining },
            { name: "Admin Users", menuLink: "/admin-users", area: "admins", active: "user", icon: FaUserShield },
        ],
    },
    {
        title: "Settings",
        items: [
            { name: "Settings", menuLink: "/settings", area: "settings", active: "settings", icon: FiSettings },
            { name: "Store Details & Timings", menuLink: "/store-timings", area: "settings", active: "Store Timings", icon: FaClock },
            { name: "FAQs", menuLink: "/faqs", area: "settings", active: "faqs", icon: FaQuestionCircle },
            { name: "Search Analytics", menuLink: "/search-analytics", area: "marketing", active: "search-analytics", icon: FaSearch },
            { name: "Data Exports", menuLink: "/exports", area: "finance", active: "operations", icon: FiDownload },
        ],
    },
];

// What each admin role may open (mirrors Backend/server/utils/adminRoles.js; the server enforces it).
export const ROLE_AREAS = {
    super: ["*"],
    operations: ["common", "orders", "riders", "customers"],
    catalog: ["common", "catalog"],
    marketing: ["common", "marketing"],
    finance: ["common", "finance", "customers"],
};

export const currentAdminRole = () => {
    try {
        const d = JSON.parse(sessionStorage.getItem("admindata") || "null");
        return (d && ROLE_AREAS[d.AdminRole] && d.AdminRole) || "super";
    } catch (e) {
        return "super";
    }
};

export const canOpen = (area, role = currentAdminRole()) => {
    const areas = ROLE_AREAS[role] || ROLE_AREAS.super;
    return areas.includes("*") || areas.includes(area || "settings");
};
