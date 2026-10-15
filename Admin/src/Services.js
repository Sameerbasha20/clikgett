// Builds the full API URL for a path like "adminuser/login" (shared by httpcall and blob downloads).
const getBaseApiUrl = () => {
    const envUrl = (process.env.REACT_APP_BASE_URL || "").trim();
    if (!envUrl || envUrl === "/api") {
        return "/api";
    }
    // If configured with localhost in development, use relative '/api'
    // so CRA development proxy handles requests locally and across tunnels.
    if (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
        return "/api";
    }
    return envUrl;
};

const normalizeUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== "string") {
        return "/api";
    }
    const trimmed = rawUrl.trim();
    if (!trimmed) {
        return "/api";
    }
    // Pass through external absolute URLs untouched
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    // Separate query string/hash from pathname
    const [pathWithHash, ...queryParts] = trimmed.split("?");
    const queryString = queryParts.length > 0 ? `?${queryParts.join("?")}` : "";

    // Strip leading/trailing slashes and collapse duplicate consecutive slashes
    let cleanPath = pathWithHash
        .replace(/^\/+/, "")
        .replace(/\/+$/, "")
        .replace(/\/+/g, "/");

    // Prevent duplicate /api/ prefixes
    while (cleanPath.startsWith("api/")) {
        cleanPath = cleanPath.slice(4);
    }
    if (cleanPath === "api") {
        cleanPath = "";
    }

    const base = getBaseApiUrl();

    // If base is an external absolute URL (e.g. remote deployment)
    if (/^https?:\/\//i.test(base)) {
        const cleanBase = base.replace(/\/+$/, "");
        if (cleanBase.endsWith("/api")) {
            return cleanPath ? `${cleanBase}/${cleanPath}${queryString}` : `${cleanBase}${queryString}`;
        }
        return cleanPath ? `${cleanBase}/api/${cleanPath}${queryString}` : `${cleanBase}/api${queryString}`;
    }

    // Relative same-origin base (default: '/api')
    let cleanBase = (base || "/api").trim().replace(/^\/+/, "").replace(/\/+$/, "");
    if (!cleanBase) {
        cleanBase = "api";
    }
    if (cleanBase !== "api" && !cleanBase.endsWith("/api")) {
        cleanBase = `${cleanBase}/api`;
    }

    return cleanPath ? `/${cleanBase}/${cleanPath}${queryString}` : `/${cleanBase}${queryString}`;
};


// Authorization: `token ${token}`,
export const apiUrl = (path) => normalizeUrl(path);

const httpcall = (url, method, body, token) => {
    let authHeader = {};
    if (token) {
        if (typeof token === "string") {
            const trimmed = token.trim();
            if (trimmed && trimmed !== "token undefined" && trimmed !== "token null" && trimmed !== "undefined" && trimmed !== "null") {
                authHeader = {
                    Authorization: trimmed.startsWith("token ") || trimmed.startsWith("Bearer ")
                        ? trimmed
                        : `token ${trimmed}`
                };
            }
        } else if (typeof token === "object") {
            const authVal = token.Authorization || (token.token ? `token ${token.token}` : null);
            if (authVal && typeof authVal === "string") {
                const trimmed = authVal.trim();
                if (trimmed && trimmed !== "token undefined" && trimmed !== "token null" && trimmed !== "undefined" && trimmed !== "null") {
                    authHeader = { Authorization: trimmed };
                }
            }
        }
    }

    // Fallback to sessionStorage/localStorage if Authorization header is missing or invalid
    if (!authHeader || !authHeader.Authorization) {
        const stored = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
                       (typeof localStorage !== "undefined" && localStorage.getItem("token"));
        if (stored && typeof stored === "string") {
            const trimmed = stored.trim();
            if (trimmed && trimmed !== "undefined" && trimmed !== "null") {
                authHeader = { Authorization: trimmed.startsWith("token ") || trimmed.startsWith("Bearer ") ? trimmed : `token ${trimmed}` };
            }
        }
    }

    const requestUrl = normalizeUrl(url);

    let requestBody = body;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const headers = {
        "Accept": "application/json",
        ...authHeader,
    };

    if (body !== null && body !== undefined && method !== "GET" && method !== "HEAD") {
        if (typeof body === "object" && !isFormData) {
            requestBody = JSON.stringify(body);
            headers["Content-type"] = "application/json; charset=UTF-8";
        } else if (typeof body === "string") {
            headers["Content-type"] = "application/json; charset=UTF-8";
        }
    }

    return fetch(requestUrl, {
        method: method,
        body: requestBody,
        headers: headers,
    }).then((response) => response.json());
};

const signup = (method, body) => {
    return httpcall("adminusers/signup", method, body);
};

const login = (method, body) => {
    return httpcall("adminuser/login", method, body);
};

const getRoutes = (method, body, token, status) => {
    return httpcall(
        `routes/admin/bystatus?Status=${status}`,
        method,
        body,
        token
    );
};
const AddRoutes = (method, body, token) => {
    return httpcall(`routes/admin/add`, method, body, token);
};
const getRoutebyId = (method, body, token, id) => {
    return httpcall(`routes/admin/detail/${id}`, method, body, token);
};
const RouteUpdate = (method, body, token, id) => {
    return httpcall(`routes/admin/update/${id}`, method, body, token);
};
const DeleteRoutes = (method, body, token, id) => {
    return httpcall(`routes/admin/delete/${id}`, method, body, token);
};
const getCategories = (method, body, token) => {
    return httpcall("categories/allcategoriesadmin", method, body, token);
};
const AddCategories = (method, body, token) => {
    return httpcall("categories/addcategory", method, body, token);
};
const updateDeliveryboyOrder = (method, body, token, OrderID) => {
    return httpcall(`adminorders/assigndeliverboy/${OrderID}`, method, body, token);
};
const getCategoriesbyId = (method, body, token, id) => {
    return httpcall(`categories/detail/${id}`, method, body, token);
};
const updatecategories = (method, body, token, id) => {
    return httpcall(`categories/updatecategory/${id}`, method, body, token);
};
const Deletecategories = (method, body, token, id) => {
    return httpcall(`categories/deletecategory/${id}`, method, body, token);
};

const getBanners = (method, body, token) => {
    return httpcall("banners", method, body, token);
};
const AddBanners = (method, body, token) => {
    return httpcall("banners/addbanner", method, body, token);
};
const getBannerbyId = (method, body, token, id) => {
    return httpcall(`banners/detail/${id}`, method, body, token);
};
const updateBanner = (method, body, token, id) => {
    return httpcall(`banners/updatebanner/${id}`, method, body, token);
};
const DeleteBannner = (method, body, token, id) => {
    return httpcall(`banners/deletebanner/${id}`, method, body, token);
};

const GetSubCategory = (method, body, token, id) => {
    return httpcall(`subcategories/bycategory/${id}`, method, body, token);
};
const GetSubCategoryAll = (method, body, token, id) => {
    return httpcall(`subcategories`, method, body, token);
};
const AddSubCategory = (method, body, token) => {
    return httpcall(`subcategories/add/`, method, body, token);
};
const getSubCategoryById = (method, body, token, id) => {
    return httpcall(`subcategories/detail/${id}`, method, body, token);
};
const updateSubcategory = (method, body, token, id) => {
    return httpcall(`subcategories/update/${id}`, method, body, token);
};
const DeleteSubcategory = (method, body, token, id) => {
    return httpcall(`subcategories/delete/${id}`, method, body, token);
};

const getAllProducts = (method = "GET", body = null, token, id = null) => {
    const url = id ? `adminproducts/bycategory?CategoryID=${id}` : "adminproducts/bycategory";
    return httpcall(url, method, body, token);
};

const getProductsbyCatId = (method, body, token, id) => {
    return httpcall(
        `adminproducts/bycategory?CategoryID=${id}`,
        method,
        body,
        token
    );
};
const AddProduct = (method, body, token) => {
    return httpcall(`adminproducts/addproduct`, method, body, token);
};

const getProductsByProductId = (method, body, token, id) => {
    return httpcall(`adminproducts/productdetail/${id}`, method, body, token);
};
const updateProduct = (method, body, token, id) => {
    return httpcall(`adminproducts/updateproduct/${id}`, method, body, token);
};
const updateProductVarient = (method, body, token, id) => {
    return httpcall(
        `adminproducts/updateproductvariant/${id}`,
        method,
        body,
        token
    );
};

const deleteProductWithVarient = (method, body, token, id) => {
    return httpcall(`adminproducts/deleteproduct/${id}`, method, body, token);
};
const addVarient = (method, body, token) => {
    return httpcall(
        `adminproducts/addvariant
    `,
        method,
        body,
        token
    );
};
const deleteVarient = (method, body, token, id) => {
    return httpcall(`adminproducts/deletevariant/${id}`, method, body, token);
};
const getDeliveryBoy = (method, body, token) => {
    return httpcall("adminuser/getalldeliveryboys", method, body, token);
};
const AddDeliveryBoy = (method, body, token) => {
    return httpcall(
        `adminuser/addeliveryboy
    `,
        method,
        body,
        token
    );
};
const getDeliveryBoyByID = (method, body, token, id) => {
    return httpcall(
        `adminuser/deliveryboydetail?AdminID=${id}`,
        method,
        body,
        token
    );
};
const updateDeliveryboy = (method, body, token, id) => {
    return httpcall(`adminuser/updatedeliveryboy/${id}`, method, body, token);
};

const deleteDeliveryBoy = (method, body, token, id) => {
    return httpcall(`adminuser/deletedeliveryboy/${id}`, method, body, token);
};
const getwarehouses = (method, body, token) => {
    return httpcall("warehouses/all", method, body, token);
};

const getWarehousebyId = (method, body, token, id) => {
    return httpcall(`warehouses/detail/${id}`, method, body, token);
};
const AddWarehouse = (method, body, token) => {
    return httpcall("warehouses/add", method, body, token);
};
const updateWarehouse = (method, body, token, id) => {
    return httpcall(`warehouses/update/${id}`, method, body, token);
};
const DeleteWarehouse = (method, body, token, id) => {
    return httpcall(`warehouses/delete/${id}`, method, body, token);
};

const getUsers = (method, body, token) => {
    return httpcall("adminuser/userslist", method, body, token);
};
const Getuserbyid = (method, body, token, id) => {
    return httpcall(`adminuser/userdetail/${id}`, method, body, token);
};
const updateuser = (method, body, token, id) => {
    return httpcall(`adminuser/user/update/${id}`, method, body, token);
};
const DeleteUser = (method, body, token, id) => {
    return httpcall(`adminuser/user/delete/${id}`, method, body, token);
};

const getPromoCode = (method, body, token) => {
    return httpcall("promocodes/admin/all", method, body, token);
};
const addPromoCode = (method, body, token) => {
    return httpcall("promocodes/admin/add", method, body, token);
};

const getpromocodeByID = (method, body, token, id) => {
    return httpcall(`promocodes/admin/detail/${id}`, method, body, token);
};
const updatepromocode = (method, body, token, id) => {
    return httpcall(`promocodes/admin/update/${id}`, method, body, token);
};
const DeletePromocode = (method, body, token, id) => {
    return httpcall(`promocodes/admin/delete/${id}`, method, body, token);
};
const getAllCurrentOrders = (method, body, token) => {
    return httpcall(`adminorders/currentorders`, method, body, token);
};
const getAllPastOrders = (method, body, token, query = "") => {
    return httpcall(query ? `adminorders/pastorders${query}` : `adminorders/pastorders`, method, body, token);
};
const orderbyid = (method, body, token, id) => {
    return httpcall(
        `adminorders/orderdetail?OrderID=${id}`,
        method,
        body,
        token
    );
};
const getAdminusers = (method, body, token) => {
    return httpcall("adminusers/list", method, body, token);
};
const addAdminUser = (method, body, token) => {
    return httpcall("adminusers/addadmin", method, body, token);
};
const AdminUserById = (method, body, token, id) => {
    return httpcall(`adminusers/detail/${id}`, method, body, token);
};
const getOrderByStatus = (method, body, token, id) => {
    return httpcall(`adminorders?orderStatus=${id}`, method, body, token);
};
const updateAdmindata = (method, body, token, id) => {
    return httpcall(`adminusers/updateadminuser/${id}`, method, body, token);
};
const deleteAdmindata = (method, body, token, id) => {
    return httpcall(`adminusers/deleteadminuser/${id}`, method, body, token);
};
const updateprofile = (method, body, token, id) => {
    return httpcall(`adminusers/update/${id}`, method, body, token);
};
const getFranchiseForm = (method, body, token) => {
    return httpcall(`forms/franchiseEnquiryforms`, method, body, token);
};
const getCallbackForm = (method, body, token) => {
    return httpcall(`forms/callbackforms`, method, body, token);
};
const getAvailabilityform = (method, body, token) => {
    return httpcall(`forms/availabilityforms`, method, body, token);
};
const orderByUserId = (method, body, token, id) => {
    return httpcall(`adminorders?userId=${id}`, method, body, token);
};
const UpdateOrderDetails = (method, body, token, id) => {
    return httpcall(`adminorders/updatestatus/${id}`, method, body, token);
};
const getNotifyProducts = (method, body, token) => {
    return httpcall(`adminusers/notifyproducts`, method, body, token);
};
const updateNotifyProducts = (method, body, token, id) => {
    return httpcall(
        `adminusers/notifyproductupdate/${id}`,
        method,
        body,
        token
    );
};
const AddShipmentData = (method, body, token) => {
    return httpcall(`shiprocket/createorder`, method, body, token);
};
const getCallBackById = (method, body, token, id) => {
    return httpcall(`forms/callback/${id}`, method, body, token);
};
const getFranchiseById = (method, body, token, id) => {
    return httpcall(`forms/franchiseEnquiry/${id}`, method, body, token);
};
const getAvailabilityById = (method, body, token, id) => {
    return httpcall(`forms/availability/${id}`, method, body, token);
};
const getNotifyById = (method, body, token, id) => {
    return httpcall(
        `adminusers/notifyproductdetail/${id}`,
        method,
        body,
        token
    );
};

const updateBulkPrices = (method, body, token, filename) => {
    return httpcall(`productcsv/update/${filename}`, method, body, token);
};
const sendNotification = (method, body, token) => {
    return httpcall(`adminuser/sendnotifications`, method, body, token);
};
const getsettings = (method, body, token) => {
    return httpcall(`adminuser/Settingslist`, method, body, token);
};
const getsettingsbyid = (method, body, token, id) => {
    return httpcall(`adminuser/settingdetail/${id}`, method, body, token);
};
const addsettings = (method, body, token) => {
    return httpcall(`adminuser/addsettings`, method, body, token);
};
const updatesettings = (method, body, token, id) => {
    return httpcall(`adminuser/updatesettings/${id}`, method, body, token);
};
const deletesettings = (method, body, token, id) => {
    return httpcall(`adminuser/deletesettings/${id}`, method, body, token);
};
const getKits = (method, body, token) => {
    return httpcall(`adminproducts/allkits`, method, body, token);
};
const addKit = (method, body, token) => {
    return httpcall(`adminproducts/addkit`, method, body, token);
};
const KitsDetails = (method, body, token, id) => {
    return httpcall(`adminproducts/kitdetail/${id}`, method, body, token);
};
const updateKit = (method, body, token, id) => {
    return httpcall(`adminproducts/updatekit/${id}`, method, body, token);
};
const updateKititem = (method, body, token, id) => {
    return httpcall(`adminproducts/updatekititem/${id}`, method, body, token);
};
const DeleteKit = (method, body, token, id) => {
    return httpcall(`adminproducts/deletekit/${id}`, method, body, token);
};
const DeleteKititem = (method, body, token, id) => {
    return httpcall(`adminproducts/deletekititem/${id}`, method, body, token);
};
const SearchProduct = (method, body, token, search) => {
    return httpcall(`adminproducts/search/${search}`, method, body, token);
};
const AddKitvarient = (method, body, token) => {
    return httpcall(`adminproducts/addkititem`, method, body, token);
};
const downloadcsv = (method, body, token, filename) => {
    return httpcall(`csv/${filename}`, method, body, token);
};
const getRecommendedProducts = (method, body, token) => {
    return httpcall(`adminproducts/recommendedproducts`, method, body, token);
};
const AddRecommendedProducts = (method, body, token) => {
    return httpcall(`adminproducts/addrecommendedproduct`, method, body, token);
};
const deleteRecommendedProducts = (method, body, token, id) => {
    return httpcall(
        `adminproducts/deleterecommendedproducts/${id}`,
        method,
        body,
        token
    );
};
const GetTimings = (method, body, token) => {
    return httpcall(
        `admintiming`,
        method,
        body,
        token
    );
};
const AddTimings = (method, body, token) => {
    return httpcall(
        `admintiming/add`,
        method,
        body,
        token
    );
};
const UpdateTimings = (method, body, token, id) => {
    return httpcall(
        `admintiming/update/${id}`,
        method,
        body,
        token
    );
};
const DeleteTimings = (method, body, token, id) => {
    return httpcall(
        `admintiming/delete/${id}`,
        method,
        body,
        token
    );
};
const UpdateToggleStore = (method, body, token, id) => {
    return httpcall(
        `admintiming/toggle?status=${id}`,
        method,
        body,
        token
    );
};
const getShopStatus = (method, body, token) => {
    return httpcall(
        `admintiming/shopstatus`,
        method,
        body,
        token
    );
};
const updateStoreData = (method, body, token, id) => {
    return httpcall(
        `admintiming/updatesettings/${id}`,
        method,
        body,
        token
    );
};
const walletTransactions = (method, body, token, id) => {
    return httpcall(
        `adminuser/wallettransactions/${id}`,
        method,
        body,
        token
    );
};
const creditdebitwallet = (method, body, token, id) => {
    return httpcall(
        `adminuser/creditdebitwallet`,
        method,
        body,
        token
    );
};



// Uploads a file through a short-lived presigned URL issued by the backend, so
// no storage credentials are ever shipped to the browser. Resolves to
// { location } like the previous react-s3 upload did.
const uploadFile = async (file, folder) => {
    const signed = await httpcall(`adminuser/upload-url`, "POST", {
        folder,
        fileName: file.name,
        contentType: file.type,
    });
    if (!signed || signed.Status !== 1) {
        throw new Error((signed && signed.Message) || "Unable to get upload URL");
    }
    const put = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });
    if (!put.ok) {
        throw new Error(`Upload failed (${put.status})`);
    }
    return { location: signed.location, key: signed.key };
};

export const Services = {
    uploadFile,
    creditdebitwallet,
    walletTransactions,
    signup,
    getKits,
    updateStoreData,
    getShopStatus,
    DeleteTimings,
    AddTimings,
    login,
    getCategories,
    UpdateToggleStore,
    GetTimings,
    AddCategories,
    getCategoriesbyId,
    updatecategories,
    UpdateTimings,
    Deletecategories,
    getwarehouses,
    getWarehousebyId,
    AddWarehouse,
    updateWarehouse,
    DeleteWarehouse,
    getBanners,
    AddBanners,
    getBannerbyId,
    updateBanner,
    DeleteBannner,
    getUsers,
    updateuser,
    DeleteUser,
    Getuserbyid,
    getProductsbyCatId,
    getAllProducts,
    getallproducts: getAllProducts,
    updateDeliveryboyOrder,
    // getProductsByCategoryId,
    getProductsByProductId,
    updateProduct,
    getPromoCode,
    addPromoCode,
    getpromocodeByID,
    updatepromocode,
    DeletePromocode,
    getAllCurrentOrders,
    orderbyid,
    getAdminusers,
    addAdminUser,
    AdminUserById,
    getOrderByStatus,
    updateAdmindata,
    deleteAdmindata,
    updateprofile,
    getFranchiseForm,
    getCallbackForm,
    getAvailabilityform,
    orderByUserId,
    UpdateOrderDetails,
    getNotifyProducts,
    updateNotifyProducts,
    AddShipmentData,
    getCallBackById,
    getFranchiseById,
    getAvailabilityById,
    getNotifyById,
    GetSubCategory,
    AddSubCategory,
    getSubCategoryById,
    DeleteSubcategory,
    updateSubcategory,
    AddProduct,
    deleteProductWithVarient,
    updateProductVarient,
    addVarient,
    deleteVarient,
    getDeliveryBoy,
    AddDeliveryBoy,
    getDeliveryBoyByID,
    updateDeliveryboy,
    deleteDeliveryBoy,
    getAllPastOrders,
    GetSubCategoryAll,
    getRoutes,
    DeleteRoutes,
    getRoutebyId,
    AddRoutes,
    RouteUpdate,
    updateBulkPrices,
    sendNotification,
    getsettings,
    getsettingsbyid,
    updatesettings,
    addsettings,
    deletesettings,
    KitsDetails,
    addKit,
    updateKit,
    DeleteKit,
    SearchProduct,
    AddKitvarient,
    updateKititem,
    DeleteKititem,
    downloadcsv,
    getRecommendedProducts,
    AddRecommendedProducts,
    deleteRecommendedProducts,
    // Flash Sales Services
    getSales: (method = "GET", body = null, token) => httpcall("sales/all", method, body, token),
    getSaleDetails: (method = "GET", body = null, token, id) => httpcall(`sales/details/${id}`, method, body, token),
    createSale: (method = "POST", body, token) => httpcall("sales/create", method, body, token),
    updateSale: (method = "POST", body, token) => httpcall("sales/update", method, body, token),
    deleteSale: (method = "POST", body, token) => httpcall("sales/delete", method, body, token),
    addSaleProducts: (method = "POST", body, token) => httpcall("sales/additems", method, body, token),
    removeSaleProduct: (method = "POST", body, token) => httpcall("sales/removeitem", method, body, token),
    getProductSale: (method = "GET", body = null, token, productId) => httpcall(`sales/product/${productId}`, method, body, token),
    assignProductSale: (method = "POST", body, token) => httpcall("sales/assign-product", method, body, token),
    removeProductSale: (method = "POST", body, token) => httpcall("sales/remove-product", method, body, token),
    // Abandoned Carts Services
    getAbandonedCarts: (method = "GET", body = null, token) => httpcall("carts/abandoned/list", method, body, token),
    updateAbandonedCartStatus: (method = "POST", body, token) => httpcall("carts/abandoned/status", method, body, token),
    getAbandonedCartDetails: (method = "POST", body, token) => httpcall("carts/abandoned/details", method, body, token),
    // Milestones / Rewards Services
    getMilestones: (method = "GET", body = null, token) => httpcall("milestones/config", method, body, token),
    getAllRewards: (method = "GET", body = null, token) => httpcall("rewards/all", method, body, token),
    createMilestone: (method = "POST", body, token) => httpcall("rewards/create", method, body, token),
    updateMilestone: (method = "POST", body, token) => httpcall("rewards/update", method, body, token),
    deleteMilestone: (method = "POST", body, token) => httpcall("rewards/delete", method, body, token),
    getMilestoneProgress: (method = "GET", body = null, token) => httpcall("rewards/userprogress", method, body, token),
    // Order Adjustments
    adjustOrder: (method = "POST", body, token) => httpcall("adminorders/adjustorder", method, body, token),
    getOrderAdjustments: (method = "GET", body = null, token, orderId) => httpcall(`adminorders/adjustments/${orderId}`, method, body, token),
    // Buy More Multi-Tier Pricing
    getBuyMoreTiers: (method = "GET", body = null, token, productId) => httpcall(productId ? `buymore/tiers?ProductID=${productId}` : "buymore/tiers", method, body, token),
    addBuyMoreTier: (method = "POST", body, token) => httpcall("buymore/tiers", method, body, token),
    saveProductTiers: (method = "POST", body, token) => httpcall("buymore/save-product-tiers", method, body, token),
    updateBuyMoreTier: (method = "PUT", body, token, id) => httpcall(`buymore/tiers/${id}`, method, body, token),
    deleteBuyMoreTier: (method = "DELETE", body = null, token, id) => httpcall(`buymore/tiers/${id}`, method, body, token),
    // Product Restrictions & Exclusions
    getProductRestrictions: (method = "GET", body = null, token, query = "") => httpcall(`restrictions/restrictions${query}`, method, body, token),
    addProductRestriction: (method = "POST", body, token) => httpcall("restrictions/restrictions", method, body, token),
    saveProductRestrictions: (method = "POST", body, token) => httpcall("restrictions/save-product-restrictions", method, body, token),
    updateProductRestriction: (method = "PUT", body, token, id) => httpcall(`restrictions/restrictions/${id}`, method, body, token),
    deleteProductRestriction: (method = "DELETE", body = null, token, id) => httpcall(`restrictions/restrictions/${id}`, method, body, token),
    // Cart Threshold Offers
    getCartOffers: (method = "GET", body = null, token) => httpcall("cartoffers/offers", method, body, token),
    createCartOffer: (method = "POST", body, token) => httpcall("cartoffers/offers", method, body, token),
    updateCartOffer: (method = "PUT", body, token, id) => httpcall(`cartoffers/offers/${id}`, method, body, token),
    deleteCartOffer: (method = "DELETE", body = null, token, id) => httpcall(`cartoffers/offers/${id}`, method, body, token),
    // Wallet & Cashback Expiry
    getWalletTransactions: (method = "GET", body = null, token, userId) => httpcall(`adminusers/wallettransactions/${userId}`, method, body, token),
    creditDebitWallet: (method = "POST", body, token) => httpcall("adminusers/creditdebitwallet", method, body, token),
    expireCashback: (method = "POST", body = {}, token) => httpcall("adminusers/expirecashback", method, body, token),
    // Notify Products & Trigger Alert
    triggerProductNotification: (method = "POST", body = {}, token, id) => httpcall(`adminusers/triggernotifyproduct/${id}`, method, body, token),
    // Product Membership Pricing Services
    getMembershipPlans: (method = "GET", body = null, token) => httpcall("membership/plans", method, body, token),
    getProductMembershipPricing: (method = "GET", body = null, token, productId) => httpcall(`membership/product/${productId}`, method, body, token),
    saveProductMembershipPricing: (method = "POST", body, token) => httpcall("membership/product/save", method, body, token),
    deleteProductMembershipPricing: (method = "POST", body, token) => httpcall("membership/product/delete", method, body, token),
    // Full Customer Details (Ledger, Addresses, Orders, Rewards, Referrals, Device)
    getFullCustomerDetails: (method = "GET", body = null, token, userId) => httpcall(`adminusers/customer-full-details/${userId}`, method, body, token),
    // Feedback Management & Rewards
    getFeedbackList: (method = "GET", body = null, token, query = "") => httpcall(query ? `adminusers/feedback/list?${query}` : "adminusers/feedback/list", method, body, token),
    getFeedbackDetail: (method = "GET", body = null, token, feedbackId) => httpcall(`adminusers/feedback/detail/${feedbackId}`, method, body, token),
    replyFeedback: (method = "POST", body, token, feedbackId) => httpcall(`adminusers/feedback/reply/${feedbackId}`, method, body, token),
    reviewFeedback: (method = "POST", body, token, feedbackId) => httpcall(`adminusers/feedback/review/${feedbackId}`, method, body, token),
    creditFeedbackReward: (method = "POST", body = {}, token, feedbackId) => httpcall(`adminusers/feedback/credit-reward/${feedbackId}`, method, body, token),
    getFeedbackRewardConfig: (method = "GET", body = null, token) => httpcall("adminusers/feedback/reward-config", method, body, token),
    updateFeedbackRewardConfig: (method = "POST", body, token) => httpcall("adminusers/feedback/reward-config", method, body, token),
    // Search Analytics
    getSearchAnalytics: (method = "GET", body = null, token, filter = "") => httpcall(filter ? `search-analytics/keywords?${filter}` : "search-analytics/keywords", method, body, token),
    getKeywordUsers: (method = "GET", body = null, token, keyword) => httpcall(`search-analytics/keyword-users?keyword=${encodeURIComponent(keyword)}`, method, body, token),
    // Dynamic Home Sections
    getHomeSections: (method = "GET", body = null, token, filter = "") => httpcall(filter ? `admin-home-sections/sections?${filter}` : "admin-home-sections/sections", method, body, token),
    getHomeSectionById: (method = "GET", body = null, token, id) => httpcall(`admin-home-sections/sections/${id}`, method, body, token),
    createHomeSection: (method = "POST", body, token) => httpcall("admin-home-sections/sections", method, body, token),
    updateHomeSection: (method = "PUT", body, token, id) => httpcall(`admin-home-sections/sections/${id}`, method, body, token),
    reorderHomeSections: (method = "PUT", body, token) => httpcall("admin-home-sections/sections/reorder", method, body, token),
    duplicateHomeSection: (method = "POST", body = null, token, id) => httpcall(`admin-home-sections/sections/${id}/duplicate`, method, body, token),
    updateHomeSectionStatus: (method = "PATCH", body, token, id) => httpcall(`admin-home-sections/sections/${id}/status`, method, body, token),
    deleteHomeSection: (method = "DELETE", body = null, token, id) => httpcall(`admin-home-sections/sections/${id}`, method, body, token),
    getHomeSectionCategoryOptions: (method = "GET", body = null, token) => httpcall("admin-home-sections/sections/category-options", method, body, token),
    getHomeSectionProductOptions: (method = "GET", body = null, token, query = "") => httpcall(query ? `admin-home-sections/sections/product-options?${query}` : "admin-home-sections/sections/product-options", method, body, token),
    // Dynamic Product Unlocks
    getProductUnlocks: (method = "GET", body = null, token) => httpcall("product-unlocks/unlocks", method, body, token),
    createProductUnlock: (method = "POST", body, token) => httpcall("product-unlocks/unlocks", method, body, token),
    updateProductUnlock: (method = "PUT", body, token, id) => httpcall(`product-unlocks/unlocks/${id}`, method, body, token),
    deleteProductUnlock: (method = "DELETE", body = null, token, id) => httpcall(`product-unlocks/unlocks/${id}`, method, body, token),
    // Subcategory Reorder
    reorderSubcategories: (method = "POST", body, token) => httpcall("subcategories/reorder", method, body, token),
    // Cashback Review
    getPendingCashback: (method = "GET", body = null, token) => httpcall("cashback/pending", method, body, token),
    approveCashback: (method = "POST", body, token) => httpcall("cashback/approve", method, body, token),
    rejectCashback: (method = "POST", body, token) => httpcall("cashback/reject", method, body, token),
    // AWS Billing / Cost Overview
    getAwsBilling: (method = "GET", body = null, token) => httpcall("cost-overview/cost-overview", method, body, token),
    // Order ETA Adjustments
    editDeliveryTime: (method = "PUT", body, token, orderId) => httpcall(`adminorders/editedeliverytime/${orderId}`, method, body, token),
    // Order Timeline
    getOrderTimeline: (method = "GET", body = null, token, orderId) => httpcall(`adminorders/ordertimeline/${orderId}`, method, body, token),
    // Live Delivery Operations & Fleet
    getLiveOperations: (method = "GET", body = null, token) => httpcall("adminorders/live-operations", method, body, token),
    getDelayQueue: (method = "GET", body = null, token) => httpcall("adminorders/delays", method, body, token),
    reviewDelay: (method = "POST", body, token, delayId) => httpcall(`adminorders/delays/${delayId}/review`, method, body, token),
    reassignDriver: (method = "PUT", body, token, orderId) => httpcall(`adminorders/reassign/${orderId}`, method, body, token),
    getDynamicETA: (method = "GET", body = null, token, orderId) => httpcall(`adminorders/dynamic-eta/${orderId}`, method, body, token),
    // Driver Assignment & Eligibility
    getEligibleDrivers: (method = "GET", body = null, token) => httpcall("adminorders/eligible-drivers", method, body, token),
    assignDeliveryBoy: (method = "PUT", body, token, orderId) => httpcall(`adminorders/assigndeliverboy/${orderId}`, method, body, token),
    // Order Item Removal & Recalculation
    removeItemFromOrder: (method = "POST", body, token) => httpcall("adminorders/remove-item", method, body, token),
    getRemovedOrderItems: (method = "GET", body = null, token, orderId) => httpcall(`adminorders/removed-items/${orderId}`, method, body, token),
    // Photo Order Requests
    getAdminPhotoOrders: (method = "GET", body = null, token, query = "") => httpcall(query ? `admin/photo-orders/list?${query}` : "admin/photo-orders/list", method, body, token),
    getAdminPhotoOrderDetail: (method = "GET", body = null, token, id) => httpcall(`admin/photo-orders/detail/${id}`, method, body, token),
    claimPhotoOrder: (method = "PUT", body = null, token, id) => httpcall(`admin/photo-orders/claim/${id}`, method, body, token),
    preparePhotoOrderProposal: (method = "POST", body, token, id) => httpcall(`admin/photo-orders/prepare-proposal/${id}`, method, body, token),
    sendPhotoOrderProposal: (method = "POST", body = null, token, id) => httpcall(`admin/photo-orders/send-proposal/${id}`, method, body, token),
    cancelPhotoOrder: (method = "POST", body, token, id) => httpcall(`admin/photo-orders/cancel/${id}`, method, body, token),
    searchAdminProducts: (method = "GET", body = null, token, term) => httpcall(`adminproducts/search/${encodeURIComponent(term)}`, method, body, token),
    // Customer Enquiries
    getCustomerEnquiries: (method = "GET", body = null, token, query = "") => httpcall(query ? `admin/customer-enquiries?${query}` : "admin/customer-enquiries", method, body, token),
    updateCustomerEnquiryStatus: (method = "PUT", body, token, id) => httpcall(`admin/customer-enquiries/${id}/status`, method, body, token),
    // Product Requests
    getProductRequests: (method = "GET", body = null, token, query = "") => httpcall(query ? `admin/product-requests?${query}` : "admin/product-requests", method, body, token),
    updateProductRequestStatus: (method = "PUT", body, token, id) => httpcall(`admin/product-requests/${id}/status`, method, body, token),
    notifyProductRequest: (method = "POST", body = {}, token, id) => httpcall(`admin/product-requests/${id}/notify`, method, body, token),
    // Two-Factor Authentication (2FA)
    verify2FA: (method = "POST", body) => httpcall("adminuser/verify-2fa", method, body),
    reset2FA: (method = "POST", body = {}, token, adminId) => httpcall(`adminuser/reset-2fa/${adminId}`, method, body, token),
    get2FAStatus: (method = "GET", body = null, token) => httpcall("adminuser/2fa-status", method, body, token),
    // Global Search
    globalSearch: (method = "GET", body = null, token, query) => httpcall(`adminuser/global-search?q=${encodeURIComponent(query)}`, method, body, token),
    // Refer & Earn Rewards Configuration & Claims
    getReferralConfig: (method = "GET", body = null, token) => httpcall("adminuser/referrals/config", method, body, token),
    updateReferralConfig: (method = "PUT", body, token) => httpcall("adminuser/referrals/config", method, body, token),
    getReferralAuditHistory: (method = "GET", body = null, token) => httpcall("adminuser/referrals/audit-history", method, body, token),
    getReferralClaims: (method = "GET", body = null, token) => httpcall("adminuser/referrals/claims", method, body, token),
    // Distance-Based Delivery ETA
    getETARules: (method = "GET", body = null, token) => httpcall("adminuser/delivery-eta/rules", method, body, token),
    updateETARules: (method = "PUT", body, token) => httpcall("adminuser/delivery-eta/rules", method, body, token),
    getOrderEffectiveETA: (method = "GET", body = null, token, orderId) => httpcall(`adminuser/delivery-eta/order/${orderId}`, method, body, token),
};
