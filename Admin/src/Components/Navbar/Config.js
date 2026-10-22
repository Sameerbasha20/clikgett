import { AiOutlineUnorderedList, AiOutlineGift, AiOutlineDashboard } from "react-icons/ai";
import { GiNewspaper } from "react-icons/gi";
import { MdOutlineCategory, MdOutlineDeliveryDining, MdOutlinePriceChange, MdOutlineRemoveShoppingCart } from "react-icons/md";
import { CgShoppingCart } from "react-icons/cg";
import { IoPricetagsOutline } from "react-icons/io5";
import { FiSettings, FiDownload } from "react-icons/fi";
import {
    FaUserFriends, FaPercent, FaSearch, FaCommentDots, FaStore, FaUnlockAlt, FaCoins,
    FaCamera, FaQuestionCircle, FaClipboardList, FaCrown, FaUserShield, FaBell, FaClock,
} from "react-icons/fa";

// Sidebar, grouped by job. `active` must match the page's <SideNav isactive="..."> value.
export const menuSections = [
    {
        title: null,
        items: [{ name: "Dashboard", menuLink: "/dashboard", active: "dashboard", icon: AiOutlineDashboard }],
    },
    {
        title: "Orders",
        items: [
            { name: "Orders", menuLink: "/orders", active: "orders", icon: CgShoppingCart },
            { name: "Live Operations", menuLink: "/live-operations", active: "LiveOperations", icon: MdOutlineDeliveryDining },
            { name: "Photo Orders", menuLink: "/photo-orders", active: "photoOrders", icon: FaCamera },
            { name: "Product Requests", menuLink: "/product-requests", active: "productRequests", icon: FaClipboardList },
            { name: "Customer Enquiries", menuLink: "/customer-enquiries", active: "customerEnquiries", icon: FaQuestionCircle },
        ],
    },
    {
        title: "Catalog",
        items: [
            { name: "Products", menuLink: "/products", active: "products", icon: MdOutlineCategory },
            { name: "Out of stock", menuLink: "/out-of-stock", active: "out-of-stock", icon: MdOutlineRemoveShoppingCart },
            { name: "Categories", menuLink: "/categories", active: "categories", icon: AiOutlineUnorderedList },
            { name: "Sub categories", menuLink: "/subcategories", active: "subcategories", icon: MdOutlineCategory },
            { name: "Bulk price update", menuLink: "/update-price", active: "priceUpdate", icon: MdOutlinePriceChange },
        ],
    },
    {
        title: "Storefront",
        items: [
            { name: "Home Sections", menuLink: "/home-sections", active: "home-sections", icon: FaStore },
            { name: "Banners", menuLink: "/banners", active: "banners", icon: GiNewspaper },
        ],
    },
    {
        title: "Marketing",
        items: [
            { name: "Coupon Codes", menuLink: "/promocodes", active: "promocode", icon: AiOutlineGift },
            { name: "Flash Sales", menuLink: "/sales", active: "sales", icon: IoPricetagsOutline },
            { name: "Cart Offers", menuLink: "/cart-offers", active: "cartoffers", icon: FaPercent },
            { name: "Abandoned Carts", menuLink: "/abandoned-carts", active: "abandoned-carts", icon: CgShoppingCart },
            { name: "Send Notification", menuLink: "/notification", active: "notification", icon: FaBell },
        ],
    },
    {
        title: "Rewards",
        items: [
            { name: "Cashback Review", menuLink: "/cashback-review", active: "cashback-review", icon: FaCoins },
            { name: "Milestones", menuLink: "/milestones", active: "milestones", icon: AiOutlineGift },
            { name: "Product Unlocks", menuLink: "/product-unlocks", active: "product-unlocks", icon: FaUnlockAlt },
            { name: "Feedback & Rewards", menuLink: "/feedback", active: "feedback", icon: FaCommentDots },
            { name: "Membership", menuLink: "/membership", active: "membership", icon: FaCrown },
        ],
    },
    {
        title: "People",
        items: [
            { name: "Customers", menuLink: "/customers", active: "customers", icon: FaUserFriends },
            { name: "Riders", menuLink: "/DeliveryBoy", active: "Deliveryboy", icon: MdOutlineDeliveryDining },
            { name: "Admin Users", menuLink: "/admin-users", active: "user", icon: FaUserShield },
        ],
    },
    {
        title: "Settings",
        items: [
            { name: "Settings", menuLink: "/settings", active: "settings", icon: FiSettings },
            { name: "Store Details & Timings", menuLink: "/store-timings", active: "Store Timings", icon: FaClock },
            { name: "Search Analytics", menuLink: "/search-analytics", active: "search-analytics", icon: FaSearch },
            { name: "Data Exports", menuLink: "/exports", active: "operations", icon: FiDownload },
        ],
    },
];
