import React, { useState, useEffect } from "react";
import dashboardclasses from "../dashboard.module.css";
import { IoClose, IoPricetagsOutline } from "react-icons/io5";
import { FileUploader } from "react-drag-drop-files";
import { BsCloudUpload } from "react-icons/bs";
import { useForm } from "react-hook-form";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import Spinner from "../updateBulk/LoaderModal";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import ScaleLoader from "react-spinners/ScaleLoader";
import { 
    MdDelete, MdBlock, MdFlashOn, MdCardMembership, 
    MdLayers, MdInventory, MdInfo 
} from "react-icons/md";
import { FaRegEdit, FaPlus, FaTrash, FaCheck, FaBoxes } from "react-icons/fa";

window.Buffer = window.Buffer || require("buffer").Buffer;

function AddCategory(props) {
    const Navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    // Product Identity & Wizard Stage
    const [productId, setProductId] = useState(props.id || null);
    const isEditing = Boolean(props.editable || productId);
    const [justCreated, setJustCreated] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    // Master Product Data
    const [productDetails, setProductDetails] = useState(null);
    const [categoryItems, setCategoryItems] = useState([]);
    const [subCategoryItems, setSubCategoryItems] = useState([]);
    const [descriptionValue, setDescriptionValue] = useState("");
    const [basicError, setBasicError] = useState("");
    const [paths, setPaths] = useState([]);
    const [uploadSpinner, setUploadSpinner] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [savingBasic, setSavingBasic] = useState(false);

    // Initial Variant (for new product creation wizard)
    const [initialVariant, setInitialVariant] = useState({
        metrictype: "gm",
        metricvalue: "500",
        Price: "",
        OfferPrice: "",
        AvailableQty: "10"
    });

    // Pricing & Variants Tab State
    const [variantsList, setVariantsList] = useState([]);
    const [savingPricing, setSavingPricing] = useState(false);
    const [editingVariantId, setEditingVariantId] = useState(null);
    const [variantFormData, setVariantFormData] = useState({
        metrictype: "gm",
        metricvalue: "",
        Price: "",
        OfferPrice: "",
        AvailableQty: "10"
    });
    const [savingVariant, setSavingVariant] = useState(false);

    // Buy More Tab State
    const [buyMoreLoading, setBuyMoreLoading] = useState(false);
    const [buyMoreSaving, setBuyMoreSaving] = useState(false);
    const [quantityTiers, setQuantityTiers] = useState([
        { Quantity: "2", Price: "" },
        { Quantity: "5", Price: "" }
    ]);
    const [buyMoreStartDate, setBuyMoreStartDate] = useState("");
    const [buyMoreEndDate, setBuyMoreEndDate] = useState("");
    const [buyMoreStatus, setBuyMoreStatus] = useState(1);

    // Restrictions Tab State
    const [restrictionsLoading, setRestrictionsLoading] = useState(false);
    const [restrictionsSaving, setRestrictionsSaving] = useState(false);
    const [restrictionsState, setRestrictionsState] = useState({
        no_cashback: false,
        no_coupon: false,
        no_membership: false
    });

    // Flash Sale Tab State
    const [flashSaleLoading, setFlashSaleLoading] = useState(false);
    const [flashSaleSaving, setFlashSaleSaving] = useState(false);
    const [allSalesCampaigns, setAllSalesCampaigns] = useState([]);
    const [productCurrentSales, setProductCurrentSales] = useState([]);
    const [selectedCampaignToAssign, setSelectedCampaignToAssign] = useState("");

    // Membership Pricing Tab State
    const [membershipLoading, setMembershipLoading] = useState(false);
    const [membershipSaving, setMembershipSaving] = useState(false);
    const [membershipPlansPricing, setMembershipPlansPricing] = useState([]);

    // Stock Tab State
    const [stockSaving, setStockSaving] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        resetField,
        formState: { errors },
    } = useForm();

    const formData = watch();

    // -------------------------------------------------------------
    // Initial Load & Category Resolution
    // -------------------------------------------------------------
    const loadCategories = () => {
        Services.getCategories("GET", null, token)
            .then((res) => {
                if (res.Status === 1) {
                    setCategoryItems(res.Categories || []);
                }
            })
            .catch((err) => console.error("Error loading categories:", err));
    };

    const loadSubCategories = (catId, callback) => {
        Services.GetSubCategoryAll("GET", null, token, catId)
            .then((res) => {
                if (res.Status === 1 && res.SubCategories) {
                    const filtered = res.SubCategories.filter(item => item.CategoryID == catId);
                    setSubCategoryItems(filtered);
                    if (callback) callback(filtered);
                }
            })
            .catch((err) => console.error("Error loading subcategories:", err));
    };

    const loadFullProductData = (pId) => {
        if (!pId) return;
        setLoadingProduct(true);
        Services.getProductsByProductId("GET", null, token, pId)
            .then((res) => {
                setLoadingProduct(false);
                if (res?.Status === 1 && res.Products) {
                    const p = res.Products;
                    setProductDetails(p);
                    setDescriptionValue(p.Description || "");
                    
                    // Populate Form
                    reset({
                        ProductName: p.ProductName,
                        CategoryID: p.CategoryID,
                        SubCategoryID: p.SubCategoryID,
                        Status: p.Status,
                        Type: p.Type || 1
                    });

                    // Subcategories for this category
                    if (p.CategoryID) {
                        loadSubCategories(p.CategoryID, () => {
                            setValue("SubCategoryID", p.SubCategoryID);
                        });
                    }

                    // Images
                    if (p.ProductImages && Array.isArray(p.ProductImages)) {
                        setPaths(p.ProductImages.map(item => ({
                            location: item,
                            path: String(item).split("/").slice(-1)[0]
                        })));
                    } else {
                        setPaths([]);
                    }

                    // Variants
                    if (p.ProductVariants && Array.isArray(p.ProductVariants)) {
                        setVariantsList(p.ProductVariants);
                    } else {
                        setVariantsList([]);
                    }
                } else {
                    toast.error(res?.Message || "Failed to load product details");
                }
            })
            .catch((err) => {
                setLoadingProduct(false);
                console.error("Error loading product details:", err);
                toast.error("Error loading product details");
            });
    };

    useEffect(() => {
        loadCategories();
        if (props.id) {
            setProductId(props.id);
            loadFullProductData(props.id);
        }
    }, [props.id]);

    const handleCategoryChange = (e) => {
        const catId = e.target.value;
        resetField("SubCategoryID");
        if (catId) {
            loadSubCategories(catId);
        } else {
            setSubCategoryItems([]);
        }
    };

    // -------------------------------------------------------------
    // Tab Loaders
    // -------------------------------------------------------------
    useEffect(() => {
        if (!productId) return;

        if (activeTab === "buymore") {
            loadBuyMoreData(productId);
        } else if (activeTab === "restrictions") {
            loadRestrictionsData(productId);
        } else if (activeTab === "flashsale") {
            loadFlashSaleData(productId);
        } else if (activeTab === "membership") {
            loadMembershipData(productId);
        } else if (activeTab === "pricing" || activeTab === "variants" || activeTab === "stock") {
            // Refresh variants
            loadFullProductData(productId);
        }
    }, [activeTab, productId]);

    const loadBuyMoreData = (pId) => {
        setBuyMoreLoading(true);
        Services.getBuyMoreTiers("GET", null, token, pId)
            .then((res) => {
                setBuyMoreLoading(false);
                if (res.Status === 1 && res.Tiers && res.Tiers.length > 0) {
                    const sorted = res.Tiers.slice().sort((a, b) => (a.MinQuantity || a.Quantity) - (b.MinQuantity || b.Quantity));
                    setQuantityTiers(sorted.map(t => ({
                        Quantity: String(t.MinQuantity || t.Quantity || ""),
                        Price: String(t.Price || "")
                    })));
                    setBuyMoreStartDate(sorted[0].StartDate ? sorted[0].StartDate.split("T")[0] : "");
                    setBuyMoreEndDate(sorted[0].EndDate ? sorted[0].EndDate.split("T")[0] : "");
                    setBuyMoreStatus(sorted[0].Status !== undefined ? sorted[0].Status : 1);
                } else {
                    setQuantityTiers([
                        { Quantity: "2", Price: "" },
                        { Quantity: "5", Price: "" }
                    ]);
                    setBuyMoreStartDate("");
                    setBuyMoreEndDate("");
                    setBuyMoreStatus(1);
                }
            })
            .catch((err) => {
                setBuyMoreLoading(false);
                console.error("Error loading buy more tiers:", err);
            });
    };

    const loadRestrictionsData = (pId) => {
        setRestrictionsLoading(true);
        Services.getProductRestrictions("GET", null, token, `?ProductID=${pId}`)
            .then((res) => {
                setRestrictionsLoading(false);
                if (res && res.Status === 1 && res.Restrictions) {
                    const r = res.Restrictions;
                    setRestrictionsState({
                        no_cashback: Boolean(r.no_cashback),
                        no_coupon: Boolean(r.no_coupon),
                        no_membership: Boolean(r.no_membership)
                    });
                } else {
                    setRestrictionsState({
                        no_cashback: false,
                        no_coupon: false,
                        no_membership: false
                    });
                }
            })
            .catch((err) => {
                setRestrictionsLoading(false);
                console.error("Error loading restrictions:", err);
            });
    };

    const loadFlashSaleData = (pId) => {
        setFlashSaleLoading(true);
        Promise.all([
            Services.getSales("GET", null, token),
            Services.getProductSale("GET", null, token, pId)
        ])
            .then(([salesRes, prodSaleRes]) => {
                setFlashSaleLoading(false);
                if (salesRes && salesRes.Status === 1 && Array.isArray(salesRes.Sales)) {
                    setAllSalesCampaigns(salesRes.Sales.filter(s => s.Status === 1));
                }
                if (prodSaleRes && prodSaleRes.Status === 1 && Array.isArray(prodSaleRes.Sales)) {
                    setProductCurrentSales(prodSaleRes.Sales);
                } else {
                    setProductCurrentSales([]);
                }
            })
            .catch((err) => {
                setFlashSaleLoading(false);
                console.error("Error loading flash sales:", err);
            });
    };

    const loadMembershipData = (pId) => {
        setMembershipLoading(true);
        Services.getProductMembershipPricing("GET", null, token, pId)
            .then((res) => {
                setMembershipLoading(false);
                if (res && res.Status === 1 && res.Plans) {
                    setMembershipPlansPricing(res.Plans.map(p => ({
                        PlanID: p.PlanID,
                        PlanName: p.PlanName,
                        SubscriptionPrice: p.SubscriptionPrice,
                        DurationDays: p.DurationDays,
                        PriceID: p.PriceID || null,
                        MembershipPrice: p.MembershipPrice != null ? String(p.MembershipPrice) : "",
                        Status: p.Status !== undefined ? p.Status : 1
                    })));
                } else {
                    toast.error(res?.Message || "Failed to load membership plans");
                }
            })
            .catch((err) => {
                setMembershipLoading(false);
                console.error("Error loading membership pricing:", err);
            });
    };

    // -------------------------------------------------------------
    // Image Upload Handlers
    // -------------------------------------------------------------
    const handleImageChange = (files) => {
        setUploadSpinner(true);
        for (let i = 0; i < files.length; i++) {
            const timestamp = Date.now();
            if (
                files[i].type === "image/png" ||
                files[i].type === "image/jpeg" ||
                files[i].type === "image/jpg" ||
                files[i].type === "image/webp"
            ) {
                const newfile = new File(
                    [files[i]],
                    `${timestamp}.${String(files[i].type).split("/")[1]}`,
                    { type: files[i].type }
                );
                Services.uploadFile(newfile, "Products")
                    .then((res) => {
                        setPaths((prev) => [
                            ...prev,
                            {
                                location: res.location,
                                path: `${timestamp}.${String(files[i].type).split("/")[1]}`,
                            },
                        ]);
                        if (i === files.length - 1) setUploadSpinner(false);
                    })
                    .catch((err) => {
                        console.error("S3 Upload error:", err);
                        // Fallback local preview path
                        setPaths((prev) => [
                            ...prev,
                            {
                                location: URL.createObjectURL(files[i]),
                                path: `${timestamp}_${files[i].name}`,
                            },
                        ]);
                        setUploadSpinner(false);
                    });
            } else {
                toast.error("Please upload image in PNG, JPEG, JPG, or WEBP format");
                setUploadSpinner(false);
                break;
            }
        }
    };

    const handleDeleteImage = (location) => {
        setPaths((prev) => prev.filter((item) => item?.location !== location));
    };

    const handleSaveImages = () => {
        if (!productId) {
            toast.error("Product ID missing");
            return;
        }
        const payload = JSON.stringify({
            ProductImages: paths.map(item => item.path)
        });
        Services.updateProduct("PUT", payload, token, productId)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success("Images updated successfully");
                    loadFullProductData(productId);
                } else {
                    toast.error(res.Message || "Failed to update images");
                }
            })
            .catch((err) => {
                console.error("Error updating images:", err);
                toast.error("Error updating images");
            });
    };

    // -------------------------------------------------------------
    // TAB 1: Basic Info Submit (Create vs Update)
    // -------------------------------------------------------------
    const onSubmitBasic = (data) => {
        if (!productId) {
            // STEP 1: CREATE NEW PRODUCT
            if (!initialVariant.Price || isNaN(parseFloat(initialVariant.Price))) {
                setBasicError("Enter a valid base price for the first pack.");
                toast.error("Enter a valid base price for the first pack.", { position: "top-center" });
                return;
            }

            const offerP = initialVariant.OfferPrice ? parseFloat(initialVariant.OfferPrice) : parseFloat(initialVariant.Price);
            const baseP = parseFloat(initialVariant.Price);
            if (offerP > baseP) {
                setBasicError("Offer price cannot be more than the base price.");
                toast.error("Offer price cannot be more than the base price.", { position: "top-center" });
                return;
            }

            setBasicError("");
            setSavingBasic(true);
            const createPayload = JSON.stringify({
                CategoryID: data.CategoryID,
                SubCategoryID: data.SubCategoryID,
                ProductName: data.ProductName,
                Description: descriptionValue || "NA",
                Type: 1,
                Status: 1,
                ProductVariants: [
                    {
                        metrictype: initialVariant.metrictype || "gm",
                        metricvalue: initialVariant.metricvalue || "500",
                        AvailableQty: parseInt(initialVariant.AvailableQty, 10) || 10,
                        Price: baseP,
                        OfferPrice: offerP,
                    }
                ],
                ProductImages: paths.map((item) => item.path),
            });

            Services.AddProduct("POST", createPayload, token)
                .then((res) => {
                    setSavingBasic(false);
                    if (res.Status === 1 && (res.ProductID || res.ID)) {
                        const newId = res.ProductID || res.ID;
                        setProductId(newId);
                        setJustCreated(true);
                        toast.success(`✓ Product Created Successfully (ID: #${newId})!`);
                        if (props.getCategories) props.getCategories(props.categoryId);
                        loadFullProductData(newId);
                    } else if (res.Status === 1) {
                        toast.success("Product created! Reloading...");
                        if (props.getCategories) props.getCategories(props.categoryId);
                        props.setmodal(false);
                    } else {
                        setBasicError(res.Message || "Failed to create product");
                        toast.error(res.Message || "Failed to create product", { position: "top-center" });
                    }
                })
                .catch((err) => {
                    setSavingBasic(false);
                    console.error("Error creating product:", err);
                    toast.error("Error creating product");
                });
        } else {
            // STEP 2: UPDATE BASIC INFO
            setSavingBasic(true);
            const updatePayload = JSON.stringify({
                CategoryID: data.CategoryID,
                SubCategoryID: data.SubCategoryID,
                ProductName: data.ProductName,
                Description: descriptionValue || "NA",
                Status: data.Status !== undefined ? data.Status : 1,
                Type: 1,
                ProductImages: paths.map((item) => item.path)
            });

            Services.updateProduct("PUT", updatePayload, token, productId)
                .then((res) => {
                    setSavingBasic(false);
                    if (res.Status === 1) {
                        toast.success("✓ Product Basic Information Updated");
                        if (props.getCategories) props.getCategories(props.categoryId);
                        loadFullProductData(productId);
                    } else {
                        toast.error(res.Message || "Failed to update product");
                    }
                })
                .catch((err) => {
                    setSavingBasic(false);
                    console.error("Error updating product:", err);
                    toast.error("Error updating product");
                });
        }
    };

    // -------------------------------------------------------------
    // TAB 2: Pricing Quick-Update
    // -------------------------------------------------------------
    const handleVariantPriceChange = (variantId, field, val) => {
        setVariantsList(prev => prev.map(v => {
            if (v.VariantID === variantId) {
                return { ...v, [field]: val };
            }
            return v;
        }));
    };

    const handleSavePricing = async () => {
        if (!variantsList || variantsList.length === 0) {
            toast.error("No variants available to price");
            return;
        }

        setSavingPricing(true);
        try {
            for (const v of variantsList) {
                const payload = JSON.stringify({
                    ProductID: productId,
                    metrictype: v.metrictype,
                    metricvalue: v.metricvalue,
                    Price: parseFloat(v.Price),
                    OfferPrice: parseFloat(v.OfferPrice || v.Price),
                    AvailableQty: v.AvailableQty,
                    ExpiryDate: v.ExpiryDate || null
                });
                await Services.updateProductVarient("PUT", payload, token, v.VariantID);
            }
            setSavingPricing(false);
            toast.success("✓ Pricing Updated for all variants");
            loadFullProductData(productId);
            if (props.getCategories) props.getCategories(props.categoryId);
        } catch (err) {
            setSavingPricing(false);
            console.error("Error saving pricing:", err);
            toast.error("Error updating pricing");
        }
    };

    // -------------------------------------------------------------
    // TAB 3: Variants Management
    // -------------------------------------------------------------
    const handleAddOrUpdateVariant = (e) => {
        e.preventDefault();
        if (!variantFormData.metricvalue || !variantFormData.Price) {
            toast.error("Metric value and Price are required");
            return;
        }

        const payload = JSON.stringify({
            ProductID: productId,
            metrictype: variantFormData.metrictype,
            metricvalue: variantFormData.metricvalue,
            Price: parseFloat(variantFormData.Price),
            OfferPrice: parseFloat(variantFormData.OfferPrice || variantFormData.Price),
            AvailableQty: parseInt(variantFormData.AvailableQty, 10) || 10
        });

        setSavingVariant(true);
        const action = editingVariantId
            ? Services.updateProductVarient("PUT", payload, token, editingVariantId)
            : Services.addVarient("POST", payload, token);

        action
            .then((res) => {
                setSavingVariant(false);
                if (res.Status === 1) {
                    toast.success(editingVariantId ? "Variant updated" : "Variant added successfully");
                    setEditingVariantId(null);
                    setVariantFormData({
                        metrictype: "gm",
                        metricvalue: "",
                        Price: "",
                        OfferPrice: "",
                        AvailableQty: "10"
                    });
                    loadFullProductData(productId);
                    if (props.getCategories) props.getCategories(props.categoryId);
                } else {
                    toast.error(res.Message || "Failed to save variant");
                }
            })
            .catch((err) => {
                setSavingVariant(false);
                console.error("Error saving variant:", err);
                toast.error("Error saving variant");
            });
    };

    const handleDeleteVariant = (vId) => {
        if (!window.confirm("Are you sure you want to delete this variant?")) return;
        Services.deleteVarient("DELETE", null, token, vId)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success("Variant deleted successfully");
                    loadFullProductData(productId);
                    if (props.getCategories) props.getCategories(props.categoryId);
                } else {
                    toast.error(res.Message || "Failed to delete variant");
                }
            })
            .catch((err) => {
                console.error("Error deleting variant:", err);
                toast.error("Error deleting variant");
            });
    };

    const handleStartEditVariant = (v) => {
        setEditingVariantId(v.VariantID);
        setVariantFormData({
            metrictype: v.metrictype || "gm",
            metricvalue: String(v.metricvalue || ""),
            Price: String(v.Price || ""),
            OfferPrice: String(v.OfferPrice || ""),
            AvailableQty: String(v.AvailableQty || "10")
        });
    };

    // -------------------------------------------------------------
    // TAB 5: Buy More Handlers
    // -------------------------------------------------------------
    const handleAddTier = () => {
        setQuantityTiers(prev => [...prev, { Quantity: "", Price: "" }]);
    };

    const handleRemoveTier = (index) => {
        setQuantityTiers(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleTierChange = (index, field, value) => {
        setQuantityTiers(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const handleSaveBuyMore = (e) => {
        e.preventDefault();
        if (!productId) {
            toast.error("Please save basic product details first before configuring Buy More pricing.");
            return;
        }

        if (quantityTiers.length === 0) {
            setBuyMoreSaving(true);
            const payload = JSON.stringify({
                ProductID: productId,
                items: [],
                Tiers: []
            });
            Services.saveProductTiers("POST", payload, token)
                .then((res) => {
                    setBuyMoreSaving(false);
                    if (res.Status === 1) {
                        toast.success("✓ Buy More pricing tiers cleared successfully");
                    } else {
                        toast.error(res.Message || "Failed to clear Buy More tiers");
                    }
                })
                .catch((err) => {
                    setBuyMoreSaving(false);
                    toast.error("Error clearing Buy More tiers");
                });
            return;
        }

        for (const t of quantityTiers) {
            const q = parseInt(t.Quantity, 10);
            const p = parseFloat(t.Price);
            if (isNaN(q) || q < 1) {
                toast.error("Every tier must have a valid quantity of 1 or more.");
                return;
            }
            if (isNaN(p) || p <= 0) {
                toast.error("Every tier must have a valid price greater than 0.");
                return;
            }
        }

        const quantities = quantityTiers.map(t => parseInt(t.Quantity, 10));
        const uniqueQuantities = new Set(quantities);
        if (uniqueQuantities.size !== quantities.length) {
            toast.error("Duplicate quantity tiers detected. Each tier quantity must be unique.");
            return;
        }

        setBuyMoreSaving(true);
        const mappedItems = quantityTiers.map(t => ({
            Quantity: parseInt(t.Quantity, 10),
            Price: parseFloat(t.Price)
        }));
        const payload = JSON.stringify({
            ProductID: productId,
            items: mappedItems,
            Tiers: mappedItems,
            StartDate: buyMoreStartDate ? `${buyMoreStartDate} 00:00:00` : null,
            EndDate: buyMoreEndDate ? `${buyMoreEndDate} 23:59:59` : null,
            Status: buyMoreStatus
        });

        Services.saveProductTiers("POST", payload, token)
            .then((res) => {
                setBuyMoreSaving(false);
                if (res.Status === 1) {
                    toast.success("✓ Buy More pricing tiers saved successfully");
                } else {
                    toast.error(res.Message || "Failed to save Buy More tiers");
                }
            })
            .catch((err) => {
                setBuyMoreSaving(false);
                console.error("Save error:", err);
                toast.error("Error saving Buy More tiers");
            });
    };

    // -------------------------------------------------------------
    // TAB 6: Restrictions Handlers
    // -------------------------------------------------------------
    const handleSaveRestrictions = (e) => {
        e.preventDefault();
        setRestrictionsSaving(true);
        const payload = JSON.stringify({
            ProductID: productId,
            restrictions: {
                no_cashback: restrictionsState.no_cashback ? 1 : 0,
                no_coupon: restrictionsState.no_coupon ? 1 : 0,
                no_membership: restrictionsState.no_membership ? 1 : 0
            },
            no_cashback: restrictionsState.no_cashback ? 1 : 0,
            no_coupon: restrictionsState.no_coupon ? 1 : 0,
            no_membership: restrictionsState.no_membership ? 1 : 0
        });

        Services.saveProductRestrictions("POST", payload, token)
            .then((res) => {
                setRestrictionsSaving(false);
                if (res.Status === 1) {
                    toast.success("✓ Product restrictions saved successfully");
                } else {
                    toast.error(res.Message || "Failed to save restrictions");
                }
            })
            .catch((err) => {
                setRestrictionsSaving(false);
                console.error("Save restrictions error:", err);
                toast.error("Error saving restrictions");
            });
    };

    // -------------------------------------------------------------
    // TAB 7: Flash Sale Handlers
    // -------------------------------------------------------------
    const handleAssignFlashSale = (e) => {
        e.preventDefault();
        if (!selectedCampaignToAssign) {
            toast.error("Please select a Flash Sale campaign");
            return;
        }

        const sale = allSalesCampaigns.find(s => s.SaleID == selectedCampaignToAssign);
        if (!sale) {
            toast.error("Selected campaign not found");
            return;
        }

        const defaultPrice = variantsList[0]?.OfferPrice || variantsList[0]?.Price || 100;
        const discountPercentage = sale.DiscountPercentage || 10;
        const salePrice = (parseFloat(defaultPrice) * (1 - discountPercentage / 100)).toFixed(2);

        setFlashSaleSaving(true);
        const payload = JSON.stringify({
            SaleID: sale.SaleID,
            ProductID: productId,
            SalePrice: parseFloat(salePrice),
            Status: 1
        });

        Services.assignProductSale("POST", payload, token)
            .then((res) => {
                setFlashSaleSaving(false);
                if (res.Status === 1) {
                    toast.success(`✓ Assigned to "${sale.SaleTitle}" successfully`);
                    setSelectedCampaignToAssign("");
                    loadFlashSaleData(productId);
                } else {
                    toast.error(res.Message || "Failed to assign to sale");
                }
            })
            .catch((err) => {
                setFlashSaleSaving(false);
                console.error("Assign error:", err);
                toast.error("Error assigning to flash sale");
            });
    };

    const handleRemoveFromFlashSale = (sale) => {
        if (!window.confirm(`Remove product from "${sale.SaleTitle || 'Flash Sale'}"?`)) return;

        setFlashSaleSaving(true);
        const payload = JSON.stringify({
            SaleID: sale.SaleID,
            ProductID: productId
        });

        Services.removeProductSale("POST", payload, token)
            .then((res) => {
                setFlashSaleSaving(false);
                if (res.Status === 1) {
                    toast.success("✓ Product removed from flash sale");
                    loadFlashSaleData(productId);
                } else {
                    toast.error(res.Message || "Failed to remove from sale");
                }
            })
            .catch((err) => {
                setFlashSaleSaving(false);
                console.error("Remove error:", err);
                toast.error("Error removing from flash sale");
            });
    };

    // -------------------------------------------------------------
    // TAB 8: Membership Pricing Handlers
    // -------------------------------------------------------------
    const handleMemberPriceChange = (planId, val) => {
        setMembershipPlansPricing(prev => prev.map(p => {
            if (p.PlanID === planId) {
                return { ...p, MembershipPrice: val };
            }
            return p;
        }));
    };

    const handleMemberStatusToggle = (planId) => {
        setMembershipPlansPricing(prev => prev.map(p => {
            if (p.PlanID === planId) {
                return { ...p, Status: p.Status === 1 ? 0 : 1 };
            }
            return p;
        }));
    };

    const handleClearMemberPrice = (planId) => {
        setMembershipPlansPricing(prev => prev.map(p => {
            if (p.PlanID === planId) {
                return { ...p, MembershipPrice: "" };
            }
            return p;
        }));
    };

    const handleSaveMembership = (e) => {
        e.preventDefault();
        for (const item of membershipPlansPricing) {
            const priceStr = String(item.MembershipPrice || '').trim();
            if (priceStr !== '') {
                const num = parseFloat(priceStr);
                if (isNaN(num) || num < 0) {
                    toast.error(`Invalid member price for ${item.PlanName}. Must be a positive number.`);
                    return;
                }
            }
        }

        setMembershipSaving(true);
        const payload = JSON.stringify({
            ProductID: productId,
            items: membershipPlansPricing.map(p => ({
                PlanID: p.PlanID,
                MembershipPrice: p.MembershipPrice ? parseFloat(p.MembershipPrice) : "",
                Status: p.Status
            }))
        });

        Services.saveProductMembershipPricing("POST", payload, token)
            .then((res) => {
                setMembershipSaving(false);
                if (res.Status === 1) {
                    toast.success("✓ Membership pricing saved successfully");
                    loadMembershipData(productId);
                } else {
                    toast.error(res.Message || "Failed to save membership pricing");
                }
            })
            .catch((err) => {
                setMembershipSaving(false);
                console.error("Save membership error:", err);
                toast.error("Error saving membership pricing");
            });
    };

    // -------------------------------------------------------------
    // TAB 9: Stock Handlers
    // -------------------------------------------------------------
    const handleStockChange = (variantId, newQty) => {
        setVariantsList(prev => prev.map(v => {
            if (v.VariantID === variantId) {
                return { ...v, AvailableQty: newQty };
            }
            return v;
        }));
    };

    const handleSaveStock = async () => {
        if (!variantsList || variantsList.length === 0) {
            toast.error("No variants available");
            return;
        }

        setStockSaving(true);
        try {
            for (const v of variantsList) {
                const payload = JSON.stringify({
                    ProductID: productId,
                    metrictype: v.metrictype,
                    metricvalue: v.metricvalue,
                    Price: parseFloat(v.Price),
                    OfferPrice: parseFloat(v.OfferPrice || v.Price),
                    AvailableQty: parseInt(v.AvailableQty, 10) || 0,
                    ExpiryDate: v.ExpiryDate || null
                });
                await Services.updateProductVarient("PUT", payload, token, v.VariantID);
            }
            setStockSaving(false);
            toast.success("✓ Inventory stock updated successfully");
            loadFullProductData(productId);
            if (props.getCategories) props.getCategories(props.categoryId);
        } catch (err) {
            setStockSaving(false);
            console.error("Error updating stock:", err);
            toast.error("Error updating stock");
        }
    };

    // -------------------------------------------------------------
    // Modal Helpers
    // -------------------------------------------------------------
    const handleCloseModal = (e) => {
        if (e) e.stopPropagation();
        props.setmodal(false);
        if (props.setEditable) props.setEditable(false);
    };

    const effectiveOfferPrice = variantsList[0]?.OfferPrice || variantsList[0]?.Price || initialVariant.OfferPrice || initialVariant.Price || "--";

    // -------------------------------------------------------------
    // RENDER UI
    // -------------------------------------------------------------
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(15, 23, 42, 0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                padding: "16px",
                backdropFilter: "blur(2px)"
            }}
            onClick={handleCloseModal}>
            
            {uploadSpinner && <Spinner />}

            <div
                style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    width: "100%",
                    maxWidth: "960px",
                    height: "92vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    overflow: "hidden",
                    position: "relative"
                }}
                onClick={(e) => e.stopPropagation()}>

                {/* MODAL HEADER */}
                <div style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <h4 style={{ margin: 0, color: "#0f172a", fontWeight: 800, fontSize: "1.25rem" }}>
                                {productId ? "Edit Product" : "New Product Creation"}
                            </h4>
                            {productId ? (
                                <span style={{
                                    background: "#e0f2fe",
                                    color: "#0369a1",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "4px"
                                }}>
                                    ID: #{productId}
                                </span>
                            ) : (
                                <span style={{
                                    background: "#fef3c7",
                                    color: "#b45309",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "4px"
                                }}>
                                    Step 1: Basic Info
                                </span>
                            )}
                        </div>
                        <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                            {productId 
                                ? (productDetails?.ProductName || "Unified product management & pricing controls")
                                : "Create basic product first; full product-level configurations will immediately unlock"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCloseModal}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#94a3b8",
                            padding: "6px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                        <IoClose size={22} />
                    </button>
                </div>

                {/* CELEBRATION / SUCCESS BANNER AFTER CREATION */}
                {justCreated && (
                    <div style={{
                        background: "#ecfdf5",
                        borderBottom: "1px solid #a7f3d0",
                        padding: "10px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#065f46",
                        fontSize: "0.85rem",
                        fontWeight: 600
                    }}>
                        <FaCheck color="#059669" size={16} />
                        <span>Product #{productId} created successfully! All configuration tabs are now active and ready.</span>
                    </div>
                )}

                {/* NAVIGATION TABS BAR */}
                <div style={{
                    display: "flex",
                    overflowX: "auto",
                    background: "#f1f5f9",
                    padding: "6px 16px 0 16px",
                    borderBottom: "1px solid #e2e8f0",
                    gap: "4px"
                }}>
                    {[
                        { id: "basic", label: "Basic Info", icon: <MdInfo size={16} /> },
                        { id: "pricing", label: "Pricing", icon: <IoPricetagsOutline size={15} />, requiresId: true },
                        { id: "variants", label: "Variants", icon: <FaBoxes size={14} />, requiresId: true },
                        { id: "images", label: "Images", icon: <BsCloudUpload size={14} />, requiresId: true },
                        { id: "buymore", label: "Buy More", icon: <IoPricetagsOutline size={14} color="#6366f1" />, requiresId: true },
                        { id: "restrictions", label: "Restrictions", icon: <MdBlock size={15} color="#f59e0b" />, requiresId: true },
                        { id: "flashsale", label: "Flash Sale", icon: <MdFlashOn size={16} color="#ec4899" />, requiresId: true },
                        { id: "membership", label: "Membership", icon: <MdCardMembership size={15} color="#0284c7" />, requiresId: true },
                        { id: "stock", label: "Stock", icon: <MdInventory size={15} color="#10b981" />, requiresId: true },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        const isDisabled = tab.requiresId && !productId;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    border: "none",
                                    borderBottom: isActive ? "3px solid #2563eb" : "3px solid transparent",
                                    background: isActive ? "#ffffff" : "transparent",
                                    color: isDisabled ? "#94a3b8" : (isActive ? "#1d4ed8" : "#475569"),
                                    fontWeight: isActive ? 700 : 600,
                                    fontSize: "0.82rem",
                                    borderRadius: "8px 8px 0 0",
                                    cursor: isDisabled ? "not-allowed" : "pointer",
                                    whiteSpace: "nowrap",
                                    opacity: isDisabled ? 0.6 : 1,
                                    transition: "all 0.15s ease"
                                }}>
                                {tab.icon}
                                {tab.label}
                                {isDisabled && (
                                    <span style={{ fontSize: "0.65rem", background: "#cbd5e1", color: "#475569", padding: "1px 4px", borderRadius: "3px" }}>
                                        Step 2
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* MAIN CONTENT AREA */}
                <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                    
                    {/* TAB 1: BASIC INFORMATION */}
                    {activeTab === "basic" && (
                        <form onSubmit={handleSubmit(onSubmitBasic)}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                        Product Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Aashirvaad Superior MP Aata 10kg"
                                        {...register("ProductName", { required: "Product Name is required" })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "6px",
                                            fontSize: "0.9rem"
                                        }}
                                    />
                                    {errors?.ProductName && (
                                        <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "4px 0 0 0" }}>
                                            {errors?.ProductName?.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                        Category *
                                    </label>
                                    <select
                                        defaultValue=""
                                        {...register("CategoryID", { 
                                            required: "Category is required",
                                            onChange: handleCategoryChange 
                                        })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "6px",
                                            fontSize: "0.9rem",
                                            background: "#fff"
                                        }}>
                                        <option value="" disabled>Select Category</option>
                                        {categoryItems.map(c => (
                                            <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
                                        ))}
                                    </select>
                                    {errors?.CategoryID && (
                                        <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "4px 0 0 0" }}>
                                            {errors?.CategoryID?.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                        SubCategory *
                                    </label>
                                    <select
                                        defaultValue=""
                                        {...register("SubCategoryID", { required: "SubCategory is required" })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "6px",
                                            fontSize: "0.9rem",
                                            background: "#fff"
                                        }}>
                                        <option value="" disabled>Select Subcategory</option>
                                        {subCategoryItems.map(s => (
                                            <option key={s.SubCategoryID} value={s.SubCategoryID}>{s.SubCategoryName}</option>
                                        ))}
                                    </select>
                                    {errors?.SubCategoryID && (
                                        <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "4px 0 0 0" }}>
                                            {errors?.SubCategoryID?.message}
                                        </p>
                                    )}
                                </div>

                                {productId && (
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                            Product Status
                                        </label>
                                        <select
                                            {...register("Status")}
                                            style={{
                                                width: "100%",
                                                padding: "8px 12px",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "6px",
                                                fontSize: "0.9rem",
                                                background: "#fff"
                                            }}>
                                            <option value="1">Active</option>
                                            <option value="2">Inactive</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* INITIAL VARIANT FORM ONLY WHEN CREATING NEW PRODUCT */}
                            {!productId && (
                                <div style={{
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    padding: "16px",
                                    marginBottom: "18px"
                                }}>
                                    <h6 style={{ margin: "0 0 12px 0", color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>
                                        Initial Variant & Pricing (Step 1 Requirement)
                                    </h6>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                                        <div>
                                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Metric Type</label>
                                            <select
                                                value={initialVariant.metrictype}
                                                onChange={(e) => setInitialVariant({ ...initialVariant, metrictype: e.target.value })}
                                                style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem" }}>
                                                <option value="gm">gm</option>
                                                <option value="kg">kg</option>
                                                <option value="ml">ml</option>
                                                <option value="ltr">ltr</option>
                                                <option value="pcs">pcs</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Metric Value</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 500"
                                                value={initialVariant.metricvalue}
                                                onChange={(e) => setInitialVariant({ ...initialVariant, metricvalue: e.target.value })}
                                                style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Base Price (₹) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="100.00"
                                                value={initialVariant.Price}
                                                onChange={(e) => setInitialVariant({ ...initialVariant, Price: e.target.value })}
                                                style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Offer Price (₹)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="90.00"
                                                value={initialVariant.OfferPrice}
                                                onChange={(e) => setInitialVariant({ ...initialVariant, OfferPrice: e.target.value })}
                                                style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Initial Stock</label>
                                            <input
                                                type="number"
                                                placeholder="10"
                                                value={initialVariant.AvailableQty}
                                                onChange={(e) => setInitialVariant({ ...initialVariant, AvailableQty: e.target.value })}
                                                style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* DESCRIPTION */}
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                    Product Description
                                </label>
                                <style>{`.product-description .ql-editor { min-height: 140px; }`}</style>
                                <ReactQuill
                                    className="product-description"
                                    theme="snow"
                                    value={descriptionValue}
                                    onChange={setDescriptionValue}
                                />
                            </div>

                            {basicError && (
                                <div role="alert" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: "6px", padding: "8px 12px", fontSize: "0.85rem", marginTop: "8px" }}>
                                    {basicError}
                                </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                                {!productId && <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    style={{
                                        padding: "8px 18px",
                                        background: "#f1f5f9",
                                        color: "#475569",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "6px",
                                        fontWeight: 600,
                                        fontSize: "0.85rem",
                                        cursor: "pointer"
                                    }}>
                                    Cancel
                                </button>}
                                <button
                                    type="submit"
                                    disabled={savingBasic}
                                    style={{
                                        padding: "8px 24px",
                                        background: savingBasic ? "#94a3b8" : "#2563eb",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        cursor: savingBasic ? "not-allowed" : "pointer"
                                    }}>
                                    {savingBasic 
                                        ? "Saving..." 
                                        : (productId ? "Save Basic Information" : "Create Product & Continue to Configuration")}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 2: PRICING OVERVIEW & QUICK EDIT */}
                    {activeTab === "pricing" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <div>
                                    <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Variant Pricing Overview</h5>
                                    <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                                        Adjust Base Price and Offer Price for each variant of this product.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSavePricing}
                                    disabled={savingPricing}
                                    style={{
                                        padding: "8px 20px",
                                        background: savingPricing ? "#94a3b8" : "#2563eb",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        cursor: savingPricing ? "not-allowed" : "pointer"
                                    }}>
                                    {savingPricing ? "Saving..." : "Save Pricing"}
                                </button>
                            </div>

                            {variantsList.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px" }}>
                                    No variants found for this product. Add a variant in the Variants tab first.
                                </div>
                            ) : (
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                        <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                            <tr style={{ textAlign: "left", color: "#475569" }}>
                                                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Variant</th>
                                                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Base Price (₹)</th>
                                                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Offer Price (₹)</th>
                                                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Discount %</th>
                                                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variantsList.map((v) => {
                                                const bp = parseFloat(v.Price || 0);
                                                const op = parseFloat(v.OfferPrice || v.Price || 0);
                                                const discount = bp > 0 && op < bp ? Math.round(((bp - op) / bp) * 100) : 0;

                                                return (
                                                    <tr key={v.VariantID} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                                                            {v.metricvalue} {v.metrictype}
                                                        </td>
                                                        <td style={{ padding: "10px 14px" }}>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={v.Price}
                                                                onChange={(e) => handleVariantPriceChange(v.VariantID, "Price", e.target.value)}
                                                                style={{ width: "110px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "10px 14px" }}>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={v.OfferPrice}
                                                                onChange={(e) => handleVariantPriceChange(v.VariantID, "OfferPrice", e.target.value)}
                                                                style={{ width: "110px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "10px 14px", color: discount > 0 ? "#16a34a" : "#64748b", fontWeight: 700 }}>
                                                            {discount > 0 ? `${discount}% off` : "No discount"}
                                                        </td>
                                                        <td style={{ padding: "10px 14px" }}>
                                                            <span style={{
                                                                background: v.status === 1 ? "#dcfce7" : "#fee2e2",
                                                                color: v.status === 1 ? "#15803d" : "#b91c1c",
                                                                fontSize: "0.72rem",
                                                                fontWeight: 700,
                                                                padding: "2px 8px",
                                                                borderRadius: "4px"
                                                            }}>
                                                                {v.status === 1 ? "Active" : "Inactive"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: VARIANTS MANAGEMENT */}
                    {activeTab === "variants" && (
                        <div>
                            {/* Variant Form */}
                            <form onSubmit={handleAddOrUpdateVariant} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
                                <h6 style={{ margin: "0 0 12px 0", color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>
                                    {editingVariantId ? "Edit Variant" : "Add New Variant"}
                                </h6>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr) auto", gap: "10px", alignItems: "flex-end" }}>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Metric Type</label>
                                        <select
                                            value={variantFormData.metrictype}
                                            onChange={(e) => setVariantFormData({ ...variantFormData, metrictype: e.target.value })}
                                            style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem" }}>
                                            <option value="gm">gm</option>
                                            <option value="kg">kg</option>
                                            <option value="ml">ml</option>
                                            <option value="ltr">ltr</option>
                                            <option value="pcs">pcs</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Metric Value</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 1"
                                            value={variantFormData.metricvalue}
                                            onChange={(e) => setVariantFormData({ ...variantFormData, metricvalue: e.target.value })}
                                            style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Base Price (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="100.00"
                                            value={variantFormData.Price}
                                            onChange={(e) => setVariantFormData({ ...variantFormData, Price: e.target.value })}
                                            style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Offer Price (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="90.00"
                                            value={variantFormData.OfferPrice}
                                            onChange={(e) => setVariantFormData({ ...variantFormData, OfferPrice: e.target.value })}
                                            style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Available Qty</label>
                                        <input
                                            type="number"
                                            placeholder="10"
                                            value={variantFormData.AvailableQty}
                                            onChange={(e) => setVariantFormData({ ...variantFormData, AvailableQty: e.target.value })}
                                            style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem" }}
                                        />
                                    </div>
                                    <div>
                                        <button
                                            type="submit"
                                            disabled={savingVariant}
                                            style={{
                                                padding: "7px 16px",
                                                background: "#2563eb",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "6px",
                                                fontWeight: 700,
                                                fontSize: "0.82rem",
                                                cursor: "pointer"
                                            }}>
                                            {editingVariantId ? "Update" : "+ Add"}
                                        </button>
                                        {editingVariantId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingVariantId(null);
                                                    setVariantFormData({ metrictype: "gm", metricvalue: "", Price: "", OfferPrice: "", AvailableQty: "10" });
                                                }}
                                                style={{ marginLeft: "6px", padding: "7px 10px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.82rem", cursor: "pointer" }}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>

                            {/* Variants Table */}
                            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                    <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                        <tr style={{ textAlign: "left", color: "#475569" }}>
                                            <th style={{ padding: "10px 14px", fontWeight: 700 }}>ID</th>
                                            <th style={{ padding: "10px 14px", fontWeight: 700 }}>Specification</th>
                                            <th style={{ padding: "10px 14px", fontWeight: 700 }}>Price</th>
                                            <th style={{ padding: "10px 14px", fontWeight: 700 }}>Offer Price</th>
                                            <th style={{ padding: "10px 14px", fontWeight: 700 }}>Stock Qty</th>
                                            <th style={{ padding: "10px 14px", fontWeight: 700 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variantsList.map((v) => (
                                            <tr key={v.VariantID} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "10px 14px", color: "#64748b" }}>#{v.VariantID}</td>
                                                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{v.metricvalue} {v.metrictype}</td>
                                                <td style={{ padding: "10px 14px" }}>₹{parseFloat(v.Price || 0).toFixed(2)}</td>
                                                <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>₹{parseFloat(v.OfferPrice || v.Price || 0).toFixed(2)}</td>
                                                <td style={{ padding: "10px 14px" }}>{v.AvailableQty} units</td>
                                                <td style={{ padding: "10px 14px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartEditVariant(v)}
                                                        style={{ background: "#e0f2fe", color: "#0284c7", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", marginRight: "6px" }}>
                                                        <FaRegEdit size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteVariant(v.VariantID)}
                                                        style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}>
                                                        <FaTrash size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: IMAGES */}
                    {activeTab === "images" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <div>
                                    <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Product Image Gallery</h5>
                                    <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                                        Upload and manage product photography.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveImages}
                                    style={{
                                        padding: "8px 20px",
                                        background: "#2563eb",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        cursor: "pointer"
                                    }}>
                                    Save Image Changes
                                </button>
                            </div>

                            <FileUploader
                                multiple={true}
                                handleChange={handleImageChange}
                                name="file">
                                <div style={{
                                    border: "2px dashed #cbd5e1",
                                    borderRadius: "8px",
                                    padding: "30px",
                                    textAlign: "center",
                                    background: "#f8fafc",
                                    cursor: "pointer",
                                    marginBottom: "20px"
                                }}>
                                    <BsCloudUpload size={32} color="#64748b" />
                                    <h6 style={{ margin: "8px 0 4px 0", color: "#1e293b", fontWeight: 700 }}>Drag & Drop product images here</h6>
                                    <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.78rem" }}>Supports PNG, JPEG, JPG, WEBP</p>
                                </div>
                            </FileUploader>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "14px" }}>
                                {paths.map((item, idx) => (
                                    <div key={idx} style={{
                                        position: "relative",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        aspectRatio: "1 / 1",
                                        background: "#f8fafc"
                                    }}>
                                        <img src={item.location} alt="Product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteImage(item.location)}
                                            style={{
                                                position: "absolute",
                                                top: "6px",
                                                right: "6px",
                                                background: "rgba(239, 68, 68, 0.9)",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "50%",
                                                width: "24px",
                                                height: "24px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer"
                                            }}>
                                            <IoClose size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 5: BUY MORE MULTI-TIER PRICING */}
                    {activeTab === "buymore" && (
                        <div>
                            {buyMoreLoading ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <ScaleLoader color="#6366f1" />
                                </div>
                            ) : (
                                <form onSubmit={handleSaveBuyMore}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <div>
                                            <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <IoPricetagsOutline color="#6366f1" size={20} /> Buy More Quantity Pricing
                                            </h5>
                                            <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                                                Configure quantity-specific pricing (e.g. 2 units for ₹30, 5 units for ₹70).
                                            </p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={buyMoreSaving}
                                            style={{
                                                padding: "8px 20px",
                                                background: buyMoreSaving ? "#94a3b8" : "#6366f1",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "6px",
                                                fontWeight: 700,
                                                fontSize: "0.85rem",
                                                cursor: buyMoreSaving ? "not-allowed" : "pointer"
                                            }}>
                                            {buyMoreSaving ? "Saving..." : "Save Buy More Pricing"}
                                        </button>
                                    </div>

                                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                                <tr style={{ textAlign: "left", color: "#475569" }}>
                                                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Quantity (Units)</th>
                                                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Package Price (₹)</th>
                                                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Effective (₹/unit)</th>
                                                    <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center", width: "80px" }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {quantityTiers.map((tier, idx) => {
                                                    const q = parseInt(tier.Quantity, 10);
                                                    const p = parseFloat(tier.Price);
                                                    const eff = (!isNaN(q) && q > 0 && !isNaN(p) && p >= 0) ? (p / q).toFixed(2) : "--";

                                                    return (
                                                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                            <td style={{ padding: "8px 14px" }}>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    placeholder="e.g. 2"
                                                                    value={tier.Quantity}
                                                                    onChange={(e) => handleTierChange(idx, "Quantity", e.target.value)}
                                                                    style={{ width: "120px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: "8px 14px" }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    placeholder="e.g. 30.00"
                                                                    value={tier.Price}
                                                                    onChange={(e) => handleTierChange(idx, "Price", e.target.value)}
                                                                    style={{ width: "120px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: "8px 14px", fontWeight: 700, color: "#10b981" }}>
                                                                ₹{eff}
                                                            </td>
                                                            <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveTier(idx)}
                                                                    style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}>
                                                                    <FaTrash size={13} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <button
                                            type="button"
                                            onClick={handleAddTier}
                                            style={{
                                                padding: "6px 14px",
                                                background: "#f1f5f9",
                                                color: "#6366f1",
                                                border: "1px dashed #cbd5e1",
                                                borderRadius: "6px",
                                                fontWeight: 700,
                                                fontSize: "0.82rem",
                                                cursor: "pointer"
                                            }}>
                                            + Add Quantity Tier
                                        </button>

                                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                            <div>
                                                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginRight: "6px" }}>Start Date</label>
                                                <input
                                                    type="date"
                                                    value={buyMoreStartDate}
                                                    onChange={(e) => setBuyMoreStartDate(e.target.value)}
                                                    style={{ padding: "5px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem" }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginRight: "6px" }}>End Date</label>
                                                <input
                                                    type="date"
                                                    value={buyMoreEndDate}
                                                    onChange={(e) => setBuyMoreEndDate(e.target.value)}
                                                    style={{ padding: "5px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* TAB 6: PRODUCT RESTRICTIONS */}
                    {activeTab === "restrictions" && (
                        <div>
                            {restrictionsLoading ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <ScaleLoader color="#f59e0b" />
                                </div>
                            ) : (
                                <form onSubmit={handleSaveRestrictions}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <div>
                                            <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <MdBlock color="#f59e0b" size={20} /> Product Exclusions & Restrictions
                                            </h5>
                                            <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                                                Enforce product-level exclusions across coupons, cashback, and membership benefits.
                                            </p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={restrictionsSaving}
                                            style={{
                                                padding: "8px 20px",
                                                background: restrictionsSaving ? "#94a3b8" : "#f59e0b",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "6px",
                                                fontWeight: 700,
                                                fontSize: "0.85rem",
                                                cursor: restrictionsSaving ? "not-allowed" : "pointer"
                                            }}>
                                            {restrictionsSaving ? "Saving..." : "Save Restrictions"}
                                        </button>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {[
                                            { key: "no_cashback", title: "No Cashback", desc: "Exclude this product from earning wallet cashback during checkout." },
                                            { key: "no_coupon", title: "No Coupon", desc: "Exclude this product value from coupon promo code discounts." },
                                            { key: "no_membership", title: "No Membership", desc: "Exclude this product from membership pricing, discounts, and delivery benefits." },
                                        ].map((r) => (
                                            <label
                                                key={r.key}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "12px",
                                                    padding: "14px 16px",
                                                    border: "1px solid",
                                                    borderColor: restrictionsState[r.key] ? "#fde68a" : "#e2e8f0",
                                                    borderRadius: "8px",
                                                    background: restrictionsState[r.key] ? "#fffbeb" : "#ffffff",
                                                    cursor: "pointer"
                                                }}>
                                                <input
                                                    type="checkbox"
                                                    checked={restrictionsState[r.key]}
                                                    onChange={(e) => setRestrictionsState({ ...restrictionsState, [r.key]: e.target.checked })}
                                                    style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "#f59e0b" }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem" }}>{r.title}</div>
                                                    <div style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "2px" }}>{r.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* TAB 7: FLASH SALE */}
                    {activeTab === "flashsale" && (
                        <div>
                            {flashSaleLoading ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <ScaleLoader color="#ec4899" />
                                </div>
                            ) : (
                                <div>
                                    <div style={{ marginBottom: "16px" }}>
                                        <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <MdFlashOn color="#ec4899" size={22} /> Flash Sale Campaign Assignment
                                        </h5>
                                        <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                                            Assign this product to an active flash sale campaign or remove it.
                                        </p>
                                    </div>

                                    {/* Current Assignments */}
                                    <div style={{ marginBottom: "20px" }}>
                                        <h6 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                                            Current Active Campaign
                                        </h6>
                                        {productCurrentSales.length === 0 ? (
                                            <div style={{ padding: "16px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", color: "#64748b", fontSize: "0.85rem" }}>
                                                This product is not currently assigned to any active Flash Sale campaign.
                                            </div>
                                        ) : (
                                            productCurrentSales.map((sale) => (
                                                <div
                                                    key={sale.SaleID}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        padding: "12px 16px",
                                                        border: "1px solid #fbcfe8",
                                                        borderRadius: "8px",
                                                        background: "#fdf2f8"
                                                    }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: "#9d174d", fontSize: "0.95rem" }}>
                                                            {sale.SaleTitle || `Campaign #${sale.SaleID}`}
                                                        </div>
                                                        <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                                                            Discount: {sale.DiscountPercentage || 10}% | Valid: {sale.StartDate ? sale.StartDate.split("T")[0] : ""} to {sale.EndDate ? sale.EndDate.split("T")[0] : ""}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveFromFlashSale(sale)}
                                                        disabled={flashSaleSaving}
                                                        style={{
                                                            padding: "6px 12px",
                                                            background: "#fee2e2",
                                                            color: "#b91c1c",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            fontWeight: 600,
                                                            fontSize: "0.78rem",
                                                            cursor: "pointer"
                                                        }}>
                                                        Remove From Sale
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Assign to Campaign Form */}
                                    <form onSubmit={handleAssignFlashSale} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
                                        <h6 style={{ margin: "0 0 10px 0", color: "#0f172a", fontWeight: 700, fontSize: "0.85rem" }}>
                                            Assign to Existing Campaign
                                        </h6>
                                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                            <select
                                                value={selectedCampaignToAssign}
                                                onChange={(e) => setSelectedCampaignToAssign(e.target.value)}
                                                style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem", background: "#fff" }}>
                                                <option value="">-- Select Active Flash Sale Campaign --</option>
                                                {allSalesCampaigns.map((c) => (
                                                    <option key={c.SaleID} value={c.SaleID}>
                                                        {c.SaleTitle} ({c.DiscountPercentage}% Off)
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="submit"
                                                disabled={flashSaleSaving}
                                                style={{
                                                    padding: "8px 18px",
                                                    background: flashSaleSaving ? "#94a3b8" : "#ec4899",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                    cursor: flashSaleSaving ? "not-allowed" : "pointer"
                                                }}>
                                                Assign Product
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 8: MEMBERSHIP PRICING (DYNAMIC) */}
                    {activeTab === "membership" && (
                        <div>
                            {membershipLoading ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <ScaleLoader color="#0284c7" />
                                </div>
                            ) : (
                                <form onSubmit={handleSaveMembership}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <div>
                                            <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <MdCardMembership color="#0284c7" size={22} /> Product Membership Pricing
                                            </h5>
                                            <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                                                Dynamically loaded membership plans. Configure product-level member prices.
                                            </p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={membershipSaving}
                                            style={{
                                                padding: "8px 20px",
                                                background: membershipSaving ? "#94a3b8" : "#0284c7",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "6px",
                                                fontWeight: 700,
                                                fontSize: "0.85rem",
                                                cursor: membershipSaving ? "not-allowed" : "pointer"
                                            }}>
                                            {membershipSaving ? "Saving..." : "Save Membership Pricing"}
                                        </button>
                                    </div>

                                    {membershipPlansPricing.length === 0 ? (
                                        <div style={{ padding: "30px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px" }}>
                                            No active membership plans found in database. Create plans in Membership Plans module first.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                            {membershipPlansPricing.map((plan) => {
                                                const offerP = parseFloat(effectiveOfferPrice) || 0;
                                                const memberP = parseFloat(plan.MembershipPrice);
                                                const savings = (!isNaN(memberP) && memberP > 0 && offerP > memberP) 
                                                    ? (offerP - memberP).toFixed(2) 
                                                    : null;

                                                return (
                                                    <div
                                                        key={plan.PlanID}
                                                        style={{
                                                            border: "1px solid #cbd5e1",
                                                            borderRadius: "8px",
                                                            padding: "16px",
                                                            background: "#ffffff"
                                                        }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                                            <div>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>
                                                                        {plan.PlanName}
                                                                    </span>
                                                                    <span style={{
                                                                        background: plan.Status === 1 ? "#dcfce7" : "#f1f5f9",
                                                                        color: plan.Status === 1 ? "#15803d" : "#64748b",
                                                                        fontSize: "0.7rem",
                                                                        fontWeight: 700,
                                                                        padding: "2px 8px",
                                                                        borderRadius: "4px"
                                                                    }}>
                                                                        {plan.Status === 1 ? "Active" : "Disabled"}
                                                                    </span>
                                                                </div>
                                                                <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                                                                    Subscription Fee: ₹{plan.SubscriptionPrice} / {plan.DurationDays} days
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleMemberStatusToggle(plan.PlanID)}
                                                                style={{
                                                                    background: plan.Status === 1 ? "#e0f2fe" : "#f1f5f9",
                                                                    color: plan.Status === 1 ? "#0369a1" : "#64748b",
                                                                    border: "1px solid",
                                                                    borderColor: plan.Status === 1 ? "#bae6fd" : "#cbd5e1",
                                                                    borderRadius: "6px",
                                                                    padding: "4px 10px",
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: 600,
                                                                    cursor: "pointer"
                                                                }}>
                                                                {plan.Status === 1 ? "Enabled" : "Disabled"}
                                                            </button>
                                                        </div>

                                                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                                                                    Member Price (₹)
                                                                </label>
                                                                <div style={{ position: "relative" }}>
                                                                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontWeight: 700 }}>
                                                                        ₹
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        placeholder="e.g. 85.00"
                                                                        value={plan.MembershipPrice}
                                                                        onChange={(e) => handleMemberPriceChange(plan.PlanID, e.target.value)}
                                                                        style={{
                                                                            width: "100%",
                                                                            padding: "7px 10px 7px 24px",
                                                                            border: "1px solid #cbd5e1",
                                                                            borderRadius: "6px",
                                                                            fontSize: "0.9rem",
                                                                            fontWeight: 600
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {plan.MembershipPrice && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleClearMemberPrice(plan.PlanID)}
                                                                    style={{
                                                                        background: "#fee2e2",
                                                                        color: "#b91c1c",
                                                                        border: "none",
                                                                        borderRadius: "6px",
                                                                        padding: "8px 12px",
                                                                        fontSize: "0.78rem",
                                                                        fontWeight: 600,
                                                                        cursor: "pointer",
                                                                        marginTop: "18px"
                                                                    }}>
                                                                    Clear
                                                                </button>
                                                            )}
                                                        </div>

                                                        {savings && (
                                                            <div style={{ marginTop: "8px", fontSize: "0.78rem", color: "#16a34a", fontWeight: 600 }}>
                                                                ✓ Members save ₹{savings} compared to standard price
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>
                    )}

                    {/* TAB 9: STOCK & INVENTORY AVAILABILITY */}
                    {activeTab === "stock" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <div>
                                    <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Stock & Inventory Availability</h5>
                                    <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                                        Manage available units and stock levels across product variants.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveStock}
                                    disabled={stockSaving}
                                    style={{
                                        padding: "8px 20px",
                                        background: stockSaving ? "#94a3b8" : "#10b981",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        cursor: stockSaving ? "not-allowed" : "pointer"
                                    }}>
                                    {stockSaving ? "Saving..." : "Update Stock Levels"}
                                </button>
                            </div>

                            {variantsList.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px" }}>
                                    No variants found for this product.
                                </div>
                            ) : (
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                        <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                            <tr style={{ textAlign: "left", color: "#475569" }}>
                                                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Variant ID</th>
                                                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Specification</th>
                                                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Available Units</th>
                                                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Inventory Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variantsList.map((v) => {
                                                const qty = parseInt(v.AvailableQty, 10) || 0;
                                                const inStock = qty > 0;

                                                return (
                                                    <tr key={v.VariantID} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                        <td style={{ padding: "10px 14px", color: "#64748b" }}>#{v.VariantID}</td>
                                                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{v.metricvalue} {v.metrictype}</td>
                                                        <td style={{ padding: "10px 14px" }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={v.AvailableQty}
                                                                onChange={(e) => handleStockChange(v.VariantID, e.target.value)}
                                                                style={{ width: "100px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "10px 14px" }}>
                                                            <span style={{
                                                                background: inStock ? "#dcfce7" : "#fee2e2",
                                                                color: inStock ? "#15803d" : "#b91c1c",
                                                                fontSize: "0.75rem",
                                                                fontWeight: 700,
                                                                padding: "3px 8px",
                                                                borderRadius: "4px"
                                                            }}>
                                                                {inStock ? `In Stock (${qty} available)` : "Out of Stock"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER */}
                {productId && (
                <div style={{
                    padding: "12px 24px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {`Configuring Product #${productId}`}
                    </div>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        style={{
                            padding: "8px 18px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: "pointer"
                        }}>
                        Done / Close
                    </button>
                </div>
                )}
            </div>
        </div>
    );
}

export default AddCategory;
