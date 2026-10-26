import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./Components/Login/login";
import Dashboard from "./Components/dashboard/Dashboard/Dashboard";
import Category from "./Components/dashboard/Category/Category";
import Customers from "./Components/dashboard/Customers/Customers";
import UserDetails from "./Components/dashboard/Customers/userdetails";
import Transactions from "./Components/dashboard/Customers/Transactions";
import Products from "./Components/dashboard/Products/Products";
import Details from "./Components/dashboard/Products/details";
import Orders from "./Components/dashboard/orders/Orders";
import OrderDetails from "./Components/dashboard/orders/OrderDetails";
import Promocodes from "./Components/dashboard/promocode/Promocodes";
import Banners from "./Components/dashboard/banners/banners";
import Subcategories from "./Components/dashboard/subcategories/subCategory";
import DeliverBoy from "./Components/dashboard/Deliveryboy/Delivery";
import Update from "./Components/dashboard/updateBulk/updateBulk";
import Notification from "./Components/dashboard/SendNotification/notification";
import Settings from "./Components/dashboard/Settings/settings";
import Exports from "./Components/dashboard/operations";
import StoreTimings from "./Components/dashboard/StoreTimings/Category";
import Sales from "./Components/dashboard/Sales/Sales";
import AbandonedCarts from "./Components/dashboard/AbandonedCarts/AbandonedCarts";
import Milestones from "./Components/dashboard/Milestones/Milestones";
import CartOffers from "./Components/dashboard/CartOffers/CartOffers";
import Feedback from "./Components/dashboard/Feedback/Feedback";
import SearchAnalytics from "./Components/dashboard/SearchAnalytics/SearchAnalytics";
import HomeSections from "./Components/dashboard/HomeSections/HomeSections";
import ProductUnlocks from "./Components/dashboard/ProductUnlocks/ProductUnlocks";
import CashbackReview from "./Components/dashboard/Cashback/CashbackReview";
import LiveOperations from "./Components/dashboard/LiveOperations/LiveOperations";
import PhotoOrders from "./Components/dashboard/photoOrders/PhotoOrders";
import PhotoOrderDetail from "./Components/dashboard/photoOrders/PhotoOrderDetail";
import CustomerEnquiries from "./Components/dashboard/CustomerEnquiries/CustomerEnquiries";
import ProductRequests from "./Components/dashboard/ProductRequests/ProductRequests";
import Membership from "./Components/dashboard/Membership/Membership";
import AdminUsers from "./Components/dashboard/adminusers/Adminusers";
import OutOfStock from "./Components/dashboard/OutOfStock/OutOfStock";
import Stock from "./Components/dashboard/Stock/Stock";

const isLoggedIn = () => {
    const token = sessionStorage.getItem("token");
    return !!token && token !== "undefined" && token !== "null";
};

/** Pages behind login: without a session the admin goes back to the login screen. */
function RequireAuth({ children }) {
    const location = useLocation();
    if (!isLoggedIn()) return <Navigate to="/" replace state={{ from: location.pathname }} />;
    return children;
}

const pages = [
    ["/dashboard", <Dashboard />],
    ["/orders", <Orders />],
    ["/orders/:id", <OrderDetails />],
    ["/live-operations", <LiveOperations />],
    ["/photo-orders", <PhotoOrders />],
    ["/photo-orders/:id", <PhotoOrderDetail />],
    ["/customer-enquiries", <CustomerEnquiries />],
    ["/product-requests", <ProductRequests />],
    ["/products", <Products />],
    ["/products/details/:productID", <Details />],
    ["/out-of-stock", <OutOfStock />],
    ["/stock", <Stock />],
    ["/categories", <Category />],
    ["/subcategories", <Subcategories />],
    ["/update-price", <Update />],
    ["/home-sections", <HomeSections />],
    ["/banners", <Banners />],
    ["/promocodes", <Promocodes />],
    ["/sales", <Sales />],
    ["/cart-offers", <CartOffers />],
    ["/abandoned-carts", <AbandonedCarts />],
    ["/notification", <Notification />],
    ["/cashback-review", <CashbackReview />],
    ["/milestones", <Milestones />],
    ["/product-unlocks", <ProductUnlocks />],
    ["/feedback", <Feedback />],
    ["/membership", <Membership />],
    ["/customers", <Customers />],
    ["/customers/:id", <UserDetails />],
    ["/customers/transactions/:id", <Transactions />],
    ["/DeliveryBoy", <DeliverBoy />],
    ["/admin-users", <AdminUsers />],
    ["/settings", <Settings />],
    ["/store-timings", <StoreTimings />],
    ["/search-analytics", <SearchAnalytics />],
    ["/exports", <Exports />],
];

function App() {
    return (
        <>
            <ToastContainer />
            <Routes>
                <Route path="/" element={isLoggedIn() ? <Navigate to="/dashboard" replace /> : <Login />} />
                {pages.map(([path, element]) => (
                    <Route key={path} path={path} element={<RequireAuth>{element}</RequireAuth>} />
                ))}
                {/* Old links */}
                <Route path="/buymore" element={<Navigate to="/products" replace />} />
                <Route path="/restrictions" element={<Navigate to="/products" replace />} />
                <Route path="/operations" element={<Navigate to="/exports" replace />} />
                <Route path="/referrals" element={<Navigate to="/settings?tab=referrals" replace />} />
                <Route path="/delivery-eta" element={<Navigate to="/settings?tab=delivery-eta" replace />} />
                <Route path="*" element={<Navigate to={isLoggedIn() ? "/dashboard" : "/"} replace />} />
            </Routes>
        </>
    );
}

export default App;
