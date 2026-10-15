import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Login/login";
import ForgotPassword from "./Components/Login/forgotPassword";
import Warehouse from "./Components/dashboard/Warehouse/Warehouse";
import Category from "./Components/dashboard/Category/Category";
import Customers from "./Components/dashboard/Customers/Customers";
import Products from "./Components/dashboard/Products/Products";
import Orders from "./Components/dashboard/orders/Orders";
import Promocodes from "./Components/dashboard/promocode/Promocodes";
import Banners from "./Components/dashboard/banners/banners";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserDetails from "./Components/dashboard/Customers/userdetails";
import Transactions from "./Components/dashboard/Customers/Transactions";
import OrderDetails from "./Components/dashboard/orders/OrderDetails";
import FranchiseEnquiry from "./Components/dashboard/Franchise/Franchise";
import Callbackforms from "./Components/dashboard/callBackForm/callbackform";
import Availability from "./Components/dashboard/AvailabilityForm/availability";
import Notify from "./Components/dashboard/notifyProducts/notify";
import Subcategories from "./Components/dashboard/subcategories/subCategory";
import Details from "./Components/dashboard/Products/details";
import DeliverBoy from "./Components/dashboard/Deliveryboy/Delivery";
import RoutesComponent from "./Components/dashboard/Routes/Routes";
import Update from "./Components/dashboard/updateBulk/updateBulk";
import Notification from "./Components/dashboard/SendNotification/notification";
import Settings from "./Components/dashboard/Settings/settings";
import Kits from "./Components/dashboard/kits/Products";
import KitsDetails from "./Components/dashboard/kits/details";
import Operations from "./Components/dashboard/operations";
import Recommended from "./Components/dashboard/recommend/details";
import StoreTimings from './Components/dashboard/StoreTimings/Category';
import Sales from "./Components/dashboard/Sales/Sales";
import AbandonedCarts from "./Components/dashboard/AbandonedCarts/AbandonedCarts";
import Milestones from "./Components/dashboard/Milestones/Milestones";
import BuyMore from "./Components/dashboard/BuyMore/BuyMore";
import Restrictions from "./Components/dashboard/Restrictions/Restrictions";
import CartOffers from "./Components/dashboard/CartOffers/CartOffers";
import Feedback from "./Components/dashboard/Feedback/Feedback";
import SearchAnalytics from "./Components/dashboard/SearchAnalytics/SearchAnalytics";
import HomeSections from "./Components/dashboard/HomeSections/HomeSections";
import ProductUnlocks from "./Components/dashboard/ProductUnlocks/ProductUnlocks";
import CashbackReview from "./Components/dashboard/Cashback/CashbackReview";
import CostOverview from "./Components/dashboard/CostOverview/CostOverview";
import LiveOperations from "./Components/dashboard/LiveOperations/LiveOperations";
import PhotoOrders from "./Components/dashboard/photoOrders/PhotoOrders";
import PhotoOrderDetail from "./Components/dashboard/photoOrders/PhotoOrderDetail";
import CustomerEnquiries from "./Components/dashboard/CustomerEnquiries/CustomerEnquiries";
import ProductRequests from "./Components/dashboard/ProductRequests/ProductRequests";

function App() {
    return (
        <>
            <ToastContainer />
            <Routes>
                <Route exact path="/" element={<Login />} />
                <Route
                    exact
                    path="/forgotpassword"
                    element={<ForgotPassword />}
                />
                <Route exact path="/Warehouse" element={<Warehouse />} />
                <Route exact path="/customers/transactions/:id" element={<Transactions />} />
                <Route exact path="/categories" element={<Category />} />
                <Route exact path="/customers" element={<Customers />} />
                <Route exact path="/customers/:id" element={<UserDetails />} />
                <Route exact path="/banners" element={<Banners />} />
                <Route
                    exact
                    path="/products"
                    element={<Products />}
                />
                <Route
                    exact
                    path="/products/details/:productID"
                    element={<Details />}
                />
                <Route
                    exact
                    path="/kits/details/:productID"
                    element={<KitsDetails />}
                />
                <Route exact path="/orders" element={<Orders />} />
                <Route exact path="/photo-orders" element={<PhotoOrders />} />
                <Route exact path="/photo-orders/:id" element={<PhotoOrderDetail />} />
                <Route exact path="/customer-enquiries" element={<CustomerEnquiries />} />
                <Route exact path="/product-requests" element={<ProductRequests />} />
                <Route exact path="/store-timings" element={<StoreTimings />} />
                <Route exact path="/orders/:id" element={<OrderDetails />} />
                <Route exact path="/promocodes" element={<Promocodes />} />
                <Route exact path="/sales" element={<Sales />} />
                <Route exact path="/abandoned-carts" element={<AbandonedCarts />} />
                <Route exact path="/milestones" element={<Milestones />} />
                <Route exact path="/buymore" element={<Navigate to="/products" replace />} />
                <Route exact path="/restrictions" element={<Navigate to="/products" replace />} />
                <Route exact path="/cart-offers" element={<CartOffers />} />
                <Route
                    exact
                    path="/FranchiseEnquiry"
                    element={<FranchiseEnquiry />}
                />
                <Route
                    exact
                    path="/Callbackforms"
                    element={<Callbackforms />}
                />
                <Route
                    exact
                    path="/availabilityForms"
                    element={<Availability />}
                />
                <Route exact path="/notifyproducts" element={<Notify />} />
                <Route
                    exact
                    path="/subcategories"
                    element={<Subcategories />}
                />
                <Route exact path="/DeliveryBoy" element={<DeliverBoy />} />
                <Route exact path="/routes" element={<RoutesComponent />} />
                <Route exact path="/update-price" element={<Update />} />
                <Route exact path="/notification" element={<Notification />} />
                <Route exact path="/settings" element={<Settings />} />
                <Route exact path="/referrals" element={<Navigate to="/settings?tab=referrals" replace />} />
                <Route exact path="/delivery-eta" element={<Navigate to="/settings?tab=delivery-eta" replace />} />
                <Route exact path="/kits" element={<Kits />} />
                <Route exact path="/operations" element={<Operations />} />
                <Route exact path="/Recommended" element={<Recommended />} />
                <Route exact path="/feedback" element={<Feedback />} />
                <Route exact path="/search-analytics" element={<SearchAnalytics />} />
                <Route exact path="/home-sections" element={<HomeSections />} />
                <Route exact path="/product-unlocks" element={<ProductUnlocks />} />
                <Route exact path="/cashback-review" element={<CashbackReview />} />
                <Route exact path="/aws-billing" element={<CostOverview />} />
                <Route exact path="/live-operations" element={<LiveOperations />} />
            </Routes>
        </>
    );
}

export default App;
