import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.css";
import "react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { FaRegEdit, FaPlus, FaTrash } from "react-icons/fa";
import { MdDelete, MdBlock, MdFlashOn, MdCardMembership } from "react-icons/md";
import { IoPricetagsOutline } from "react-icons/io5";
import "../../../App.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import AddCategory from "./Addproducts";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlineEye, AiOutlineClose } from "react-icons/ai";
import { useSearchParams } from "react-router-dom";
function Warehouse() {
    const [params, setParams] = useSearchParams();
    const [category, setCategory] = useState(false);
    const Navigate = useNavigate();
    const [id, setid] = useState();
    const [editable, setEditable] = useState(false);
    const [allcategoriesData, setAllCategoriesData] = useState([]);
    const [categoryItems, setCategoryItems] = useState([]);
    const [categoryId, setcategoryId] = useState(null);
    const [categorysearchItems, setCategorySearchItems] = useState([]);
    let [loading, setLoading] = useState(true);

    // Buy More Modal State
    const [buyMoreModal, setBuyMoreModal] = useState(false);
    const [selectedBuyMoreProduct, setSelectedBuyMoreProduct] = useState(null);
    const [buyMoreLoading, setBuyMoreLoading] = useState(false);
    const [buyMoreSaving, setBuyMoreSaving] = useState(false);
    const [quantityTiers, setQuantityTiers] = useState([
        { Quantity: "2", Price: "" },
        { Quantity: "5", Price: "" }
    ]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState(1);

    // Product Restrictions Modal State
    const [restrictionModal, setRestrictionModal] = useState(false);
    const [selectedRestrictionProduct, setSelectedRestrictionProduct] = useState(null);
    const [restrictionLoading, setRestrictionLoading] = useState(false);
    const [restrictionSaving, setRestrictionSaving] = useState(false);
    const [restrictionsState, setRestrictionsState] = useState({
        no_cashback: false,
        no_coupon: false,
        no_membership: false
    });

    // Flash Sale Modal State
    const [flashSaleModal, setFlashSaleModal] = useState(false);
    const [selectedFlashSaleProduct, setSelectedFlashSaleProduct] = useState(null);
    const [flashSaleLoading, setFlashSaleLoading] = useState(false);
    const [flashSaleSaving, setFlashSaleSaving] = useState(false);
    const [allSalesCampaigns, setAllSalesCampaigns] = useState([]);
    const [productCurrentSales, setProductCurrentSales] = useState([]);
    const [selectedCampaignToAssign, setSelectedCampaignToAssign] = useState("");

    // Membership Pricing Modal State
    const [membershipModal, setMembershipModal] = useState(false);
    const [selectedMembershipProduct, setSelectedMembershipProduct] = useState(null);
    const [membershipLoading, setMembershipLoading] = useState(false);
    const [membershipSaving, setMembershipSaving] = useState(false);
    const [membershipPlansPricing, setMembershipPlansPricing] = useState([]);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const categoryHandler = () => {
        setid(null);
        setEditable(false);
        setCategory((prev) => !prev);
    };
    const headerstyles = {
        color: "#707275",
        fontWeight: 700,
        fontSize: "0.8rem",
    };
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;

    const getallcategories = () => {
        Services.getCategories("GET", null, token)
            .then((res) => {
                if (res.Status === 1) {
                    setAllCategoriesData(res.Categories);
                    if (res.Categories.length > 0) {
                        setcategoryId(
                            params.get("Category")
                                ? params.get("Category")
                                : res.Categories[0].CategoryID
                        );
                        setParams({
                            Category: params.get("Category")
                                ? params.get("Category")
                                : res.Categories[0].CategoryID,
                        });
                    }
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
    const getcategories = (categoryId) => {
        setLoading(true);
        Services.getProductsbyCatId("GET", null, token, categoryId)
            .then((res) => {
                setLoading(false);
                console.log(res);
                if (res.Status === 1) {
                    setCategoryItems(res.Products);
                    setCategorySearchItems(res.Products);
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
        if (categoryId) {
            getcategories(categoryId);
        }
        // eslint-disable-next-line
    }, [categoryId]);
    useEffect(() => {
        getallcategories();
    }, []);
    const edithandler = (e) => {
        console.log(e.currentTarget.getAttribute("id"));
        setid(e.currentTarget.getAttribute("id"));
        setEditable(true);
        setCategory(true);
    };
    const deleteHandler = (e) => {
        if (window.confirm("are you sure you want to delete ")) {
            Services.deleteProductWithVarient(
                "DELETE",
                null,
                token,
                e.currentTarget.getAttribute("id")
            )
                .then((res) => {
                    if (res.Status === 1) {
                        getcategories(categoryId);
                        toast.success(`${res.Message}`, {
                            position: "top-center",
                            autoClose: 1000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
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
        }
    };
    const openBuyMoreModal = (product) => {
        setSelectedBuyMoreProduct(product);
        setBuyMoreModal(true);
        setBuyMoreLoading(true);

        Services.getBuyMoreTiers("GET", null, token, product.ProductID)
            .then((res) => {
                setBuyMoreLoading(false);
                if (res.Status === 1 && res.Tiers && res.Tiers.length > 0) {
                    const sorted = res.Tiers.slice().sort((a, b) => (a.MinQuantity || a.Quantity) - (b.MinQuantity || b.Quantity));
                    setQuantityTiers(
                        sorted.map((t) => ({
                            Quantity: String(t.MinQuantity || t.Quantity || ""),
                            Price: String(t.Price || "")
                        }))
                    );
                    if (sorted[0].StartDate) {
                        setStartDate(sorted[0].StartDate.split("T")[0]);
                    } else {
                        setStartDate("");
                    }
                    if (sorted[0].EndDate) {
                        setEndDate(sorted[0].EndDate.split("T")[0]);
                    } else {
                        setEndDate("");
                    }
                    setStatus(sorted[0].Status !== undefined ? sorted[0].Status : 1);
                } else {
                    setQuantityTiers([
                        { Quantity: "2", Price: "" },
                        { Quantity: "5", Price: "" }
                    ]);
                    setStartDate("");
                    setEndDate("");
                    setStatus(1);
                }
            })
            .catch((err) => {
                setBuyMoreLoading(false);
                console.error("Error loading tiers:", err);
                setQuantityTiers([
                    { Quantity: "2", Price: "" },
                    { Quantity: "5", Price: "" }
                ]);
            });
    };

    const handleAddTierRow = () => {
        let nextQty = 2;
        if (quantityTiers.length > 0) {
            const maxQty = Math.max(...quantityTiers.map(t => parseInt(t.Quantity, 10) || 0));
            nextQty = maxQty >= 5 ? maxQty + 5 : 5;
        }
        setQuantityTiers([...quantityTiers, { Quantity: String(nextQty), Price: "" }]);
    };

    const handleRemoveTierRow = (index) => {
        const updated = quantityTiers.filter((_, i) => i !== index);
        setQuantityTiers(updated);
    };

    const handleTierChange = (index, field, value) => {
        const updated = [...quantityTiers];
        updated[index][field] = value;
        setQuantityTiers(updated);
    };

    const handleSaveBuyMore = (e) => {
        if (e) e.preventDefault();
        if (!selectedBuyMoreProduct || !selectedBuyMoreProduct.ProductID) {
            toast.error("Invalid product selected");
            return;
        }

        if (quantityTiers.length === 0) {
            setBuyMoreSaving(true);
            const payload = {
                ProductID: selectedBuyMoreProduct.ProductID,
                items: [],
                StartDate: startDate || null,
                EndDate: endDate || null,
                Status: status
            };

            Services.saveProductTiers("POST", payload, token)
                .then((res) => {
                    setBuyMoreSaving(false);
                    if (res.Status === 1) {
                        toast.success(res.Message || `Buy More pricing cleared for ${selectedBuyMoreProduct.ProductName}`);
                        setBuyMoreModal(false);
                    } else {
                        toast.error(res.Message || "Failed to clear Buy More pricing");
                    }
                })
                .catch((err) => {
                    setBuyMoreSaving(false);
                    console.error("Save error:", err);
                    toast.error("Error clearing Buy More pricing");
                });
            return;
        }

        const seen = new Set();
        const items = [];

        for (let i = 0; i < quantityTiers.length; i++) {
            const row = quantityTiers[i];
            const q = parseInt(row.Quantity, 10);
            const p = parseFloat(row.Price);

            if (isNaN(q) || q < 1) {
                toast.error(`Row ${i + 1}: Quantity must be an integer greater than 0`);
                return;
            }
            if (seen.has(q)) {
                toast.error(`Duplicate quantity ${q} in row ${i + 1}. Each quantity tier must be unique.`);
                return;
            }
            seen.add(q);

            if (isNaN(p) || p < 0) {
                toast.error(`Row ${i + 1}: Offer price must be a valid positive number`);
                return;
            }

            items.push({ Quantity: q, Price: p });
        }

        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            toast.error("End Date cannot be before Start Date");
            return;
        }

        setBuyMoreSaving(true);
        const payload = {
            ProductID: selectedBuyMoreProduct.ProductID,
            items,
            StartDate: startDate || null,
            EndDate: endDate || null,
            Status: status
        };

        Services.saveProductTiers("POST", payload, token)
            .then((res) => {
                setBuyMoreSaving(false);
                if (res.Status === 1) {
                    toast.success(res.Message || `Successfully saved Buy More pricing for ${selectedBuyMoreProduct.ProductName}`);
                    setBuyMoreModal(false);
                } else {
                    toast.error(res.Message || "Failed to save Buy More pricing");
                }
            })
            .catch((err) => {
                setBuyMoreSaving(false);
                console.error("Save error:", err);
                toast.error("Error saving Buy More pricing");
            });
    };

    const openRestrictionModal = (product) => {
        setSelectedRestrictionProduct(product);
        setRestrictionModal(true);
        setRestrictionLoading(true);
        setRestrictionsState({
            no_cashback: false,
            no_coupon: false,
            no_membership: false
        });

        Services.getProductRestrictions("GET", null, token, `?ProductID=${product.ProductID}`)
            .then((res) => {
                setRestrictionLoading(false);
                if (res && res.Status === 1 && res.Restrictions) {
                    const activeTypes = {};
                    res.Restrictions.forEach(r => {
                        if (r.Status === 1) {
                            activeTypes[r.RestrictionType] = true;
                        }
                    });
                    setRestrictionsState({
                        no_cashback: !!activeTypes.no_cashback,
                        no_coupon: !!activeTypes.no_coupon,
                        no_membership: !!activeTypes.no_membership
                    });
                }
            })
            .catch((err) => {
                setRestrictionLoading(false);
                console.error("Error fetching product restrictions:", err);
            });
    };

    const handleSaveRestrictions = (e) => {
        e.preventDefault();
        if (!selectedRestrictionProduct || !selectedRestrictionProduct.ProductID) {
            toast.error("No product selected");
            return;
        }

        setRestrictionSaving(true);
        const payload = JSON.stringify({
            ProductID: selectedRestrictionProduct.ProductID,
            restrictions: restrictionsState
        });

        Services.saveProductRestrictions("POST", payload, token)
            .then((res) => {
                setRestrictionSaving(false);
                if (res.Status === 1) {
                    toast.success(res.Message || `Updated restrictions for ${selectedRestrictionProduct.ProductName}`);
                    setRestrictionModal(false);
                } else {
                    toast.error(res.Message || "Failed to save restrictions");
                }
            })
            .catch((err) => {
                setRestrictionSaving(false);
                console.error("Save error:", err);
                toast.error("Error saving product restrictions");
            });
    };

    const getSaleStatusBadge = (start, end, status) => {
        if (status === 0) return <span style={{ background: "#e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>Disabled</span>;
        const now = new Date();
        const s = new Date(start);
        const e = new Date(end);
        if (now < s) return <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>Upcoming</span>;
        if (now > e) return <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>Expired</span>;
        return <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>Active Now</span>;
    };

    const openFlashSaleModal = (product) => {
        setSelectedFlashSaleProduct(product);
        setFlashSaleModal(true);
        setFlashSaleLoading(true);
        setSelectedCampaignToAssign("");
        setProductCurrentSales([]);

        Promise.all([
            Services.getProductSale("GET", null, token, product.ProductID),
            Services.getSales("GET", null, token)
        ])
            .then(([prodRes, allSalesRes]) => {
                setFlashSaleLoading(false);
                if (prodRes && prodRes.Status === 1) {
                    setProductCurrentSales(prodRes.Sales || []);
                }
                if (allSalesRes && allSalesRes.Status === 1) {
                    setAllSalesCampaigns(allSalesRes.Sales || []);
                }
            })
            .catch((err) => {
                setFlashSaleLoading(false);
                console.error("Error loading flash sale data:", err);
                toast.error("Failed to load flash sale information");
            });
    };

    const handleAssignToSale = (e) => {
        e.preventDefault();
        if (!selectedCampaignToAssign) {
            toast.warning("Please select a sales campaign to assign");
            return;
        }
        if (!selectedFlashSaleProduct || !selectedFlashSaleProduct.ProductID) {
            toast.error("No product selected");
            return;
        }

        setFlashSaleSaving(true);
        const payload = JSON.stringify({
            SaleID: parseInt(selectedCampaignToAssign, 10),
            ProductID: selectedFlashSaleProduct.ProductID
        });

        Services.assignProductSale("POST", payload, token)
            .then((res) => {
                setFlashSaleSaving(false);
                if (res.Status === 1) {
                    toast.success(res.Message || "Assigned product to flash sale");
                    Services.getProductSale("GET", null, token, selectedFlashSaleProduct.ProductID)
                        .then((r) => {
                            if (r && r.Status === 1) {
                                setProductCurrentSales(r.Sales || []);
                            }
                        });
                    setSelectedCampaignToAssign("");
                } else {
                    toast.error(res.Message || "Failed to assign to sale");
                }
            })
            .catch((err) => {
                setFlashSaleSaving(false);
                console.error("Assign error:", err);
                toast.error("Error assigning product to flash sale");
            });
    };

    const handleRemoveFromSale = (sale) => {
        setFlashSaleSaving(true);
        const payload = JSON.stringify({
            SaleID: sale.SaleID,
            ProductID: selectedFlashSaleProduct.ProductID,
            SaleItemID: sale.SaleItemID
        });

        Services.removeProductSale("POST", payload, token)
            .then((res) => {
                setFlashSaleSaving(false);
                if (res.Status === 1) {
                    toast.success("Product removed from flash sale");
                    setProductCurrentSales(prev => prev.filter(s => s.SaleID !== sale.SaleID));
                } else {
                    toast.error(res.Message || "Failed to remove from sale");
                }
            })
            .catch((err) => {
                setFlashSaleSaving(false);
                console.error("Remove error:", err);
                toast.error("Error removing product from flash sale");
            });
    };

    const openMembershipModal = (product) => {
        setSelectedMembershipProduct(product);
        setMembershipModal(true);
        setMembershipLoading(true);
        setMembershipPlansPricing([]);

        Services.getProductMembershipPricing("GET", null, token, product.ProductID)
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
                console.error("Error loading product membership pricing:", err);
                toast.error("Error loading membership pricing");
            });
    };

    const handleMemberPriceChange = (planId, value) => {
        setMembershipPlansPricing(prev => prev.map(p => {
            if (p.PlanID === planId) {
                return { ...p, MembershipPrice: value };
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

    const handleSaveMembershipPricing = (e) => {
        e.preventDefault();
        if (!selectedMembershipProduct || !selectedMembershipProduct.ProductID) {
            toast.error("No product selected");
            return;
        }

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
            ProductID: selectedMembershipProduct.ProductID,
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
                    toast.success(res.Message || `Saved membership pricing for ${selectedMembershipProduct.ProductName}`);
                    setMembershipModal(false);
                } else {
                    toast.error(res.Message || "Failed to save membership pricing");
                }
            })
            .catch((err) => {
                setMembershipSaving(false);
                console.error("Save error:", err);
                toast.error("Error saving membership pricing");
            });
    };

    const ActionFormatter = (cell, cellcontent) => {
        return (
            <div className={dashboardclasses.tablebtns} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                    type="button"
                    className={dashboardclasses.actionBadgeBtn}
                    title="Configure Buy More Pricing"
                    onClick={() => openBuyMoreModal(cellcontent)}>
                    <IoPricetagsOutline size={13} color="#ffffff" /> Buy More
                </button>
                <button
                    type="button"
                    className={dashboardclasses.actionBadgeBtn}
                    title="Configure Product Restrictions & Exclusions"
                    onClick={() => openRestrictionModal(cellcontent)}>
                    <MdBlock size={13} color="#ffffff" /> Restrictions
                </button>
                <button
                    type="button"
                    className={dashboardclasses.actionBadgeBtn}
                    title="Manage Flash Sale for this Product"
                    onClick={() => openFlashSaleModal(cellcontent)}>
                    <MdFlashOn size={14} color="#ffffff" /> Flash Sale
                </button>
                <button
                    type="button"
                    className={dashboardclasses.actionBadgeBtn}
                    title="Configure Product Membership Pricing"
                    onClick={() => openMembershipModal(cellcontent)}>
                    <MdCardMembership size={13} color="#ffffff" /> Membership
                </button>
                <button onClick={edithandler} id={cellcontent.ProductID} title="Edit Product">
                    <FaRegEdit size={16} />
                </button>
                <button onClick={deleteHandler} id={cellcontent.ProductID} title="Delete Product">
                    <MdDelete size={16} />
                </button>
            </div>
        );
    };
    const viewHandler = (e) => {
        Navigate(
            `/products/details/${e.currentTarget.getAttribute("productID")}`
        );
    };
    const view = (cell, cellcontent) => {
        return (
            <div className={dashboardclasses.tablebtns}>
                <button onClick={() => Navigate(`/products/details/${cellcontent.ProductID}`)}>
                    <AiOutlineEye size={18} />
                </button>
            </div>
        );
    };
    const statusFormatter = (cell, cellcontent) => {
        let classname =
            cell === 1
                ? dashboardclasses["status_active"]
                : dashboardclasses["status_inactive"];
        return (
            <p className={classname}>{cell === 1 ? "Active" : "Inactive"}</p>
        );
    };

    const columns = [
        {
            dataField: "ProductName",
            text: "PRODUCT NAME",
            sort: false,

            headerStyle: (colum, colIndex) => {
                return { ...headerstyles, width: "30%" };
            },
        },
        {
            dataField: "CategoryName",
            text: "CATEGORY NAME",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "SubCategoryName",
            text: "SUB CATEGORY NAME",
            sort: false,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "view",
            text: "VIEW",
            sort: false,
            formatter: view,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },

        {
            dataField: "Status",
            text: "STATUS",
            sort: false,
            formatter: statusFormatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },

        {
            dataField: "ACTIONS",
            text: "ACTIONS",
            sort: false,
            formatter: ActionFormatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles, width: "480px" };
            },
        },
    ];
    const pagination = paginationFactory({
        page: 1,
        sizePerPage: 8,
        lastPageText: ">>",
        firstPageText: "<<",
        nextPageText: ">",
        prePageText: "<",
        hideSizePerPage: true,
        showTotal: true,
        alwaysShowAllBtns: true,
        onPageChange: function (page, sizePerPage) {
            console.log("page", page);
            console.log("sizePerPage", sizePerPage);
        },
        onSizePerPageChange: function (page, sizePerPage) {
            console.log("page", page);
            console.log("sizePerPage", sizePerPage);
        },
    });
    const defaultSorted = [
        {
            dataField: "name",
            order: "desc",
        },
    ];
    const searchHandler = (e) => {
        const search = categoryItems.filter((item) =>
            item.ProductName.toLowerCase().includes(
                e.target.value.toLowerCase()
            )
        );
        // console.log(search);
        setCategorySearchItems(search);
    };
    return (
        <>
            {category && (
                <AddCategory
                    setmodal={setCategory}
                    editable={editable}
                    id={id}
                    setEditable={setEditable}
                    getCategories={getcategories}
                    categoryId={categoryId}
                />
            )}

            {buyMoreModal && selectedBuyMoreProduct && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                        padding: "20px"
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setBuyMoreModal(false);
                    }}>
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            width: "100%",
                            maxWidth: "680px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
                            padding: "24px",
                            position: "relative"
                        }}>
                        {/* Modal Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px" }}>
                            <div>
                                <h4 style={{ margin: 0, color: "#111827", fontWeight: 700, fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <IoPricetagsOutline color="#6366f1" size={22} /> Buy More Quantity Pricing
                                </h4>
                                <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "0.85rem" }}>
                                    Configure dynamic quantity pricing points for this product.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBuyMoreModal(false)}
                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}>
                                <AiOutlineClose size={20} />
                            </button>
                        </div>

                        {/* Product Summary Card */}
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px", marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>Product</span>
                                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>
                                    {selectedBuyMoreProduct.ProductName}
                                </div>
                                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                    ID: {selectedBuyMoreProduct.ProductID} | Category: {selectedBuyMoreProduct.CategoryName || "General"}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>Base / Offer Price</span>
                                <div style={{ fontWeight: 700, color: "#10b981", fontSize: "1.1rem" }}>
                                    ₹{parseFloat(selectedBuyMoreProduct.OfferPrice || selectedBuyMoreProduct.Price || selectedBuyMoreProduct.product_price || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {buyMoreLoading ? (
                            <div style={{ textAlign: "center", padding: "40px 0" }}>
                                <ScaleLoader color="#6366f1" loading={true} size={100} />
                                <p style={{ marginTop: "12px", color: "#6b7280", fontSize: "0.85rem" }}>Loading existing pricing tiers...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveBuyMore}>
                                {/* Quantity Tiers Table */}
                                <div style={{ marginBottom: "16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <label style={{ fontWeight: 700, color: "#374151", fontSize: "0.85rem", margin: 0 }}>
                                            Quantity Pricing Tiers
                                        </label>
                                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                            Minimum 1 tier required
                                        </span>
                                    </div>

                                    <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                            <thead>
                                                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#4b5563", textAlign: "left" }}>
                                                    <th style={{ padding: "10px 12px", fontWeight: 600 }}>Quantity (Units)</th>
                                                    <th style={{ padding: "10px 12px", fontWeight: 600 }}>Package Price (₹)</th>
                                                    <th style={{ padding: "10px 12px", fontWeight: 600 }}>Effective (₹/unit)</th>
                                                    <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "center", width: "60px" }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {quantityTiers.map((tier, idx) => {
                                                    const q = parseInt(tier.Quantity, 10);
                                                    const p = parseFloat(tier.Price);
                                                    const effective = (!isNaN(q) && q > 0 && !isNaN(p) && p >= 0) ? (p / q).toFixed(2) : "--";

                                                    return (
                                                        <tr key={idx} style={{ borderBottom: idx !== quantityTiers.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                                            <td style={{ padding: "8px 12px" }}>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    step="1"
                                                                    placeholder="e.g. 2"
                                                                    value={tier.Quantity}
                                                                    onChange={(e) => handleTierChange(idx, "Quantity", e.target.value)}
                                                                    required
                                                                    style={{ width: "100%", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.85rem" }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: "8px 12px" }}>
                                                                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                                                    <span style={{ position: "absolute", left: "10px", color: "#6b7280" }}>₹</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="e.g. 30.00"
                                                                        value={tier.Price}
                                                                        onChange={(e) => handleTierChange(idx, "Price", e.target.value)}
                                                                        required
                                                                        style={{ width: "100%", padding: "6px 10px 6px 24px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.85rem" }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: "8px 12px", color: "#4f46e5", fontWeight: 600 }}>
                                                                {effective !== "--" ? `₹${effective}/unit` : "--"}
                                                            </td>
                                                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveTierRow(idx)}
                                                                    disabled={quantityTiers.length <= 1}
                                                                    title={quantityTiers.length <= 1 ? "Minimum 1 tier required" : "Remove tier"}
                                                                    style={{
                                                                        background: "transparent",
                                                                        border: "none",
                                                                        cursor: quantityTiers.length <= 1 ? "not-allowed" : "pointer",
                                                                        color: quantityTiers.length <= 1 ? "#d1d5db" : "#ef4444",
                                                                        padding: "4px"
                                                                    }}>
                                                                    <FaTrash size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddTierRow}
                                        style={{
                                            marginTop: "10px",
                                            background: "#f0fdf4",
                                            color: "#16a34a",
                                            border: "1px dashed #86efac",
                                            borderRadius: "6px",
                                            padding: "6px 14px",
                                            fontSize: "0.82rem",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px"
                                        }}>
                                        <FaPlus size={11} /> Add Quantity Price
                                    </button>
                                </div>

                                {/* Schedule & Status Section */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px", background: "#f9fafb", padding: "12px", borderRadius: "8px", border: "1px solid #f3f4f6" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#4b5563", marginBottom: "4px" }}>
                                            Start Date (Optional)
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            style={{ width: "100%", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.82rem" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#4b5563", marginBottom: "4px" }}>
                                            End Date (Optional)
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            style={{ width: "100%", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.82rem" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#4b5563", marginBottom: "4px" }}>
                                            Status
                                        </label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(Number(e.target.value))}
                                            style={{ width: "100%", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.82rem", background: "#fff" }}>
                                            <option value={1}>Active</option>
                                            <option value={0}>Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #e5e7eb", paddingTop: "14px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setBuyMoreModal(false)}
                                        style={{
                                            background: "#fff",
                                            border: "1px solid #d1d5db",
                                            color: "#374151",
                                            borderRadius: "6px",
                                            padding: "8px 18px",
                                            fontSize: "0.85rem",
                                            fontWeight: 600,
                                            cursor: "pointer"
                                        }}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={buyMoreSaving}
                                        style={{
                                            background: "#4f46e5",
                                            border: "none",
                                            color: "#fff",
                                            borderRadius: "6px",
                                            padding: "8px 22px",
                                            fontSize: "0.85rem",
                                            fontWeight: 600,
                                            cursor: buyMoreSaving ? "not-allowed" : "pointer",
                                            opacity: buyMoreSaving ? 0.7 : 1,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px"
                                        }}>
                                        {buyMoreSaving ? "Saving..." : "Save Pricing"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Product Restrictions & Exclusions Modal */}
            {restrictionModal && selectedRestrictionProduct && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 99999,
                        padding: "20px"
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setRestrictionModal(false);
                    }}>
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "14px",
                            width: "560px",
                            maxWidth: "100%",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            border: "1px solid #e2e8f0",
                            padding: "24px"
                        }}>
                        {/* Header */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                borderBottom: "1px solid #f1f5f9",
                                paddingBottom: "16px",
                                marginBottom: "20px"
                            }}>
                            <div>
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: "1.25rem",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}>
                                    <MdBlock color="#f59e0b" size={24} /> Product Restrictions & Exclusions
                                </h3>
                                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                                    Configure checkout exclusions and promotional restrictions for this product.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRestrictionModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    padding: "4px",
                                    fontSize: "1.2rem",
                                    display: "flex",
                                    alignItems: "center"
                                }}>
                                <AiOutlineClose />
                            </button>
                        </div>

                        {/* Product Summary Header */}
                        <div
                            style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderLeft: "4px solid #f59e0b",
                                borderRadius: "8px",
                                padding: "14px 16px",
                                marginBottom: "20px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                            <div>
                                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                                    PRODUCT
                                </div>
                                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "1.05rem" }}>
                                    {selectedRestrictionProduct.ProductName}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                    ID: {selectedRestrictionProduct.ProductID} | Category: {selectedRestrictionProduct.CategoryName || "General"}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                                    BASE / OFFER PRICE
                                </div>
                                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669" }}>
                                    ₹{parseFloat(selectedRestrictionProduct.OfferPrice || selectedRestrictionProduct.Price || selectedRestrictionProduct.product_price || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {restrictionLoading ? (
                            <div style={{ textAlign: "center", padding: "40px" }}>
                                <ScaleLoader color="#f59e0b" />
                                <div style={{ marginTop: "12px", color: "#64748b", fontSize: "0.9rem" }}>Loading existing restrictions...</div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveRestrictions}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                                    {/* 1. No Cashback */}
                                    <div
                                        style={{
                                            border: restrictionsState.no_cashback ? "1.5px solid #f59e0b" : "1px solid #e2e8f0",
                                            background: restrictionsState.no_cashback ? "#fffbeb" : "#fff",
                                            borderRadius: "10px",
                                            padding: "14px 16px",
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "14px",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease"
                                        }}
                                        onClick={() => setRestrictionsState(prev => ({ ...prev, no_cashback: !prev.no_cashback }))}>
                                        <input
                                            type="checkbox"
                                            id="cb_no_cashback"
                                            checked={restrictionsState.no_cashback}
                                            onChange={() => {}}
                                            style={{ marginTop: "3px", width: "18px", height: "18px", cursor: "pointer", accentColor: "#f59e0b" }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <label htmlFor="cb_no_cashback" style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", margin: 0, cursor: "pointer" }}>
                                                    Cashback Exclusion (No Cashback)
                                                </label>
                                                {restrictionsState.no_cashback && (
                                                    <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "#fef3c7", color: "#92400e", borderRadius: "4px", fontWeight: 700 }}>
                                                        ACTIVE EXCLUSION
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>
                                                Exclude this product from earning wallet cashback. When in cart, its line total will not contribute to cashback calculation.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. No Coupon */}
                                    <div
                                        style={{
                                            border: restrictionsState.no_coupon ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                                            background: restrictionsState.no_coupon ? "#fef2f2" : "#fff",
                                            borderRadius: "10px",
                                            padding: "14px 16px",
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "14px",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease"
                                        }}
                                        onClick={() => setRestrictionsState(prev => ({ ...prev, no_coupon: !prev.no_coupon }))}>
                                        <input
                                            type="checkbox"
                                            id="cb_no_coupon"
                                            checked={restrictionsState.no_coupon}
                                            onChange={() => {}}
                                            style={{ marginTop: "3px", width: "18px", height: "18px", cursor: "pointer", accentColor: "#ef4444" }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <label htmlFor="cb_no_coupon" style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", margin: 0, cursor: "pointer" }}>
                                                    Coupon Exclusion (No Coupon)
                                                </label>
                                                {restrictionsState.no_coupon && (
                                                    <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "#fee2e2", color: "#991b1b", borderRadius: "4px", fontWeight: 700 }}>
                                                        ACTIVE EXCLUSION
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>
                                                Exclude this product from promo codes & coupons. Its line total will not receive percentage/fixed discounts and will not count towards minimum coupon thresholds.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3. No Membership */}
                                    <div
                                        style={{
                                            border: restrictionsState.no_membership ? "1.5px solid #8b5cf6" : "1px solid #e2e8f0",
                                            background: restrictionsState.no_membership ? "#f5f3ff" : "#fff",
                                            borderRadius: "10px",
                                            padding: "14px 16px",
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "14px",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease"
                                        }}
                                        onClick={() => setRestrictionsState(prev => ({ ...prev, no_membership: !prev.no_membership }))}>
                                        <input
                                            type="checkbox"
                                            id="cb_no_membership"
                                            checked={restrictionsState.no_membership}
                                            onChange={() => {}}
                                            style={{ marginTop: "3px", width: "18px", height: "18px", cursor: "pointer", accentColor: "#8b5cf6" }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <label htmlFor="cb_no_membership" style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", margin: 0, cursor: "pointer" }}>
                                                    Membership Price Exclusion
                                                </label>
                                                {restrictionsState.no_membership && (
                                                    <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "#ede9fe", color: "#6d28d9", borderRadius: "4px", fontWeight: 700 }}>
                                                        ACTIVE EXCLUSION
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>
                                                Exclude this product from prime membership benefits. Active members will not receive extra member cashback or exclusive pricing on this item.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: "12px",
                                        borderTop: "1px solid #f1f5f9",
                                        paddingTop: "16px"
                                    }}>
                                    <button
                                        type="button"
                                        onClick={() => setRestrictionModal(false)}
                                        style={{
                                            padding: "9px 18px",
                                            background: "#f1f5f9",
                                            color: "#475569",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "6px",
                                            fontWeight: 600,
                                            fontSize: "0.875rem",
                                            cursor: "pointer"
                                        }}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={restrictionSaving}
                                        style={{
                                            padding: "9px 22px",
                                            background: "#f59e0b",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "6px",
                                            fontWeight: 600,
                                            fontSize: "0.875rem",
                                            cursor: restrictionSaving ? "not-allowed" : "pointer",
                                            opacity: restrictionSaving ? 0.7 : 1,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px"
                                        }}>
                                        {restrictionSaving ? "Saving..." : "Save Restrictions"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Product Flash Sale Modal */}
            {flashSaleModal && selectedFlashSaleProduct && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 99999,
                        padding: "20px"
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setFlashSaleModal(false);
                    }}>
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "14px",
                            width: "580px",
                            maxWidth: "100%",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            border: "1px solid #e2e8f0",
                            padding: "24px"
                        }}>
                        {/* Header */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                borderBottom: "1px solid #f1f5f9",
                                paddingBottom: "16px",
                                marginBottom: "20px"
                            }}>
                            <div>
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: "1.25rem",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}>
                                    <MdFlashOn color="#ec4899" size={24} /> Product Flash Sale Management
                                </h3>
                                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                                    Assign or remove this product from active flash sale discount events.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFlashSaleModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    padding: "4px",
                                    fontSize: "1.2rem",
                                    display: "flex",
                                    alignItems: "center"
                                }}>
                                <AiOutlineClose />
                            </button>
                        </div>

                        {/* Product Summary Header */}
                        <div
                            style={{
                                background: "#fdf2f8",
                                border: "1px solid #fbcfe8",
                                borderLeft: "4px solid #ec4899",
                                borderRadius: "8px",
                                padding: "14px 16px",
                                marginBottom: "20px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                            <div>
                                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9d174d", fontWeight: 700 }}>
                                    PRODUCT
                                </div>
                                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "1.05rem" }}>
                                    {selectedFlashSaleProduct.ProductName}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                    ID: {selectedFlashSaleProduct.ProductID} | Category: {selectedFlashSaleProduct.CategoryName || "General"}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9d174d", fontWeight: 700 }}>
                                    BASE / OFFER PRICE
                                </div>
                                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669" }}>
                                    ₹{parseFloat(selectedFlashSaleProduct.OfferPrice || selectedFlashSaleProduct.Price || selectedFlashSaleProduct.product_price || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {flashSaleLoading ? (
                            <div style={{ textAlign: "center", padding: "40px" }}>
                                <ScaleLoader color="#ec4899" />
                                <div style={{ marginTop: "12px", color: "#64748b", fontSize: "0.9rem" }}>Loading flash sale details...</div>
                            </div>
                        ) : (
                            <div>
                                {/* Current Flash Sale Campaigns Section */}
                                <div style={{ marginBottom: "24px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569", marginBottom: "10px" }}>
                                        Current Campaign Assignment
                                    </div>
                                    {productCurrentSales.length === 0 ? (
                                        <div
                                            style={{
                                                padding: "16px",
                                                background: "#f8fafc",
                                                border: "1px dashed #cbd5e1",
                                                borderRadius: "8px",
                                                textAlign: "center",
                                                color: "#64748b",
                                                fontSize: "0.875rem"
                                            }}>
                                            This product is not currently assigned to any flash sale campaign.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            {productCurrentSales.map((sale) => {
                                                const baseOffer = parseFloat(selectedFlashSaleProduct.OfferPrice || selectedFlashSaleProduct.Price || selectedFlashSaleProduct.product_price || 0);
                                                const disc = sale.DiscountType === "percentage" ? (baseOffer * parseFloat(sale.DiscountValue)) / 100 : parseFloat(sale.DiscountValue);
                                                const salePrice = Math.max(0, baseOffer - disc);

                                                return (
                                                    <div
                                                        key={sale.SaleID}
                                                        style={{
                                                            border: "1px solid #e2e8f0",
                                                            borderRadius: "8px",
                                                            padding: "14px 16px",
                                                            background: "#fff",
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center"
                                                        }}>
                                                        <div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                                                <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>
                                                                    {sale.SaleName}
                                                                </span>
                                                                {getSaleStatusBadge(sale.StartDate, sale.EndDate, sale.Status)}
                                                            </div>
                                                            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                                                                Discount: <strong style={{ color: "#ec4899" }}>{sale.DiscountType === "percentage" ? `${sale.DiscountValue}%` : `₹${sale.DiscountValue}`} OFF</strong>
                                                                {" | "}Effective Sale Price: <strong style={{ color: "#059669" }}>₹{salePrice.toFixed(2)}</strong>
                                                            </div>
                                                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                                                                Period: {new Date(sale.StartDate).toLocaleDateString()} — {new Date(sale.EndDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            disabled={flashSaleSaving}
                                                            onClick={() => handleRemoveFromSale(sale)}
                                                            style={{
                                                                background: "#fee2e2",
                                                                color: "#b91c1c",
                                                                border: "1px solid #fca5a5",
                                                                borderRadius: "6px",
                                                                padding: "6px 12px",
                                                                fontSize: "0.8rem",
                                                                fontWeight: 600,
                                                                cursor: flashSaleSaving ? "not-allowed" : "pointer",
                                                                opacity: flashSaleSaving ? 0.6 : 1
                                                            }}>
                                                            Remove From Sale
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Assign to Existing Sale Section */}
                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569", marginBottom: "8px" }}>
                                        Assign to Existing Flash Sale
                                    </div>
                                    <form onSubmit={handleAssignToSale}>
                                        <div style={{ marginBottom: "12px" }}>
                                            <select
                                                value={selectedCampaignToAssign}
                                                onChange={(e) => setSelectedCampaignToAssign(e.target.value)}
                                                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.875rem" }}>
                                                <option value="">-- Select an Existing Flash Sale Campaign --</option>
                                                {allSalesCampaigns.map((camp) => {
                                                    const isAssigned = productCurrentSales.some(s => s.SaleID === camp.SaleID);
                                                    return (
                                                        <option key={camp.SaleID} value={camp.SaleID} disabled={isAssigned}>
                                                            {camp.SaleName} — {camp.DiscountType === "percentage" ? `${camp.DiscountValue}%` : `₹${camp.DiscountValue}`} OFF ({new Date(camp.StartDate).toLocaleDateString()} to {new Date(camp.EndDate).toLocaleDateString()}) {isAssigned ? "[ALREADY ASSIGNED]" : ""}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                            <button
                                                type="submit"
                                                disabled={flashSaleSaving || !selectedCampaignToAssign}
                                                style={{
                                                    background: "#ec4899",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    padding: "8px 20px",
                                                    fontWeight: 600,
                                                    fontSize: "0.85rem",
                                                    cursor: (flashSaleSaving || !selectedCampaignToAssign) ? "not-allowed" : "pointer",
                                                    opacity: (flashSaleSaving || !selectedCampaignToAssign) ? 0.6 : 1,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}>
                                                {flashSaleSaving ? "Assigning..." : "+ Assign Product to Sale"}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Navigate to Campaign Manager Section */}
                                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFlashSaleModal(false);
                                            Navigate("/sales");
                                        }}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#6366f1",
                                            fontSize: "0.82rem",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            padding: 0,
                                            textDecoration: "underline"
                                        }}>
                                        Manage or create sales campaigns in Flash Sales (/sales) →
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFlashSaleModal(false)}
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
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* PRODUCT MEMBERSHIP PRICING MODAL                        */}
            {/* ======================================================== */}
            {membershipModal && selectedMembershipProduct && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(4px)",
                        zIndex: 1050,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "16px"
                    }}
                    onClick={() => setMembershipModal(false)}>
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "12px",
                            width: "100%",
                            maxWidth: "680px",
                            maxHeight: "90vh",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            overflow: "hidden"
                        }}
                        onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header Banner */}
                        <div
                            style={{
                                background: "linear-gradient(135deg, #0369a1, #0284c7)",
                                padding: "18px 24px",
                                color: "#fff",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                            <div>
                                <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <MdCardMembership size={22} /> PRODUCT MEMBERSHIP PRICING
                                </h4>
                                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                                    Configure plan-specific member prices for this product
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMembershipModal(false)}
                                style={{
                                    background: "rgba(255, 255, 255, 0.2)",
                                    border: "none",
                                    color: "#fff",
                                    borderRadius: "50%",
                                    width: "32px",
                                    height: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer"
                                }}>
                                <AiOutlineClose size={18} />
                            </button>
                        </div>

                        {/* Product Summary Header (Authoritative Product Context) */}
                        <div
                            style={{
                                background: "#f8fafc",
                                borderBottom: "1px solid #e2e8f0",
                                padding: "14px 24px"
                            }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a" }}>
                                    {selectedMembershipProduct.ProductName}
                                </div>
                                <span style={{
                                    background: "#e0f2fe",
                                    color: "#0369a1",
                                    padding: "3px 10px",
                                    borderRadius: "12px",
                                    fontSize: "0.75rem",
                                    fontWeight: 700
                                }}>
                                    Product ID: #{selectedMembershipProduct.ProductID}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: "20px", fontSize: "0.85rem", color: "#475569" }}>
                                <div><strong>Category:</strong> {selectedMembershipProduct.CategoryName || "N/A"}</div>
                                <div><strong>Base Price:</strong> ₹{selectedMembershipProduct.Price || "N/A"}</div>
                                <div><strong>Offer Price:</strong> ₹{selectedMembershipProduct.OfferPrice || selectedMembershipProduct.Price || "N/A"}</div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        {membershipLoading ? (
                            <div style={{ padding: "40px", textAlign: "center" }}>
                                <ScaleLoader color="#0284c7" loading={true} />
                                <p style={{ marginTop: "12px", color: "#64748b", fontSize: "0.9rem" }}>Loading membership pricing...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveMembershipPricing} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                                <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                                    
                                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                        Set an exclusive price for active members of each membership plan. Non-members and users without an active membership will continue to pay the standard Offer Price.
                                    </div>

                                    {/* Plans List */}
                                    {(!membershipPlansPricing || membershipPlansPricing.length === 0) ? (
                                        <div style={{ padding: "30px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                                            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>No active membership plans found in the system.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            {membershipPlansPricing.map((plan) => {
                                                const hasPrice = plan.MembershipPrice !== "" && plan.MembershipPrice !== null && !isNaN(parseFloat(plan.MembershipPrice));
                                                const currentPrice = hasPrice ? parseFloat(plan.MembershipPrice) : null;
                                                const offerPrice = parseFloat(selectedMembershipProduct.OfferPrice || selectedMembershipProduct.Price || 0);
                                                const savings = hasPrice && offerPrice > currentPrice ? (offerPrice - currentPrice).toFixed(2) : null;

                                                return (
                                                    <div
                                                        key={plan.PlanID}
                                                        style={{
                                                            border: plan.Status === 1 && hasPrice ? "1.5px solid #0284c7" : "1px solid #e2e8f0",
                                                            background: plan.Status === 1 && hasPrice ? "#f0f9ff" : "#fff",
                                                            borderRadius: "10px",
                                                            padding: "16px",
                                                            transition: "all 0.2s ease"
                                                        }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                            <div>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>
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
                                                                    Plan Fee: ₹{plan.SubscriptionPrice} / {plan.DurationDays} days
                                                                </div>
                                                            </div>

                                                            {/* Status Toggle Button */}
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

                                                        {/* Price Input Row */}
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
                                                                            fontWeight: 600,
                                                                            outline: "none"
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {hasPrice && (
                                                                <button
                                                                    type="button"
                                                                    title="Clear price"
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
                                                                ✓ Members save ₹{savings} compared to Offer Price (₹{offerPrice})
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div
                                    style={{
                                        padding: "14px 24px",
                                        background: "#f8fafc",
                                        borderTop: "1px solid #e2e8f0",
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: "12px",
                                        alignItems: "center"
                                    }}>
                                    <button
                                        type="button"
                                        onClick={() => setMembershipModal(false)}
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
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={membershipSaving}
                                        style={{
                                            padding: "8px 22px",
                                            background: membershipSaving ? "#94a3b8" : "#0284c7",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "6px",
                                            fontWeight: 700,
                                            fontSize: "0.85rem",
                                            cursor: membershipSaving ? "not-allowed" : "pointer"
                                        }}>
                                        {membershipSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="products" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper}>
                        {/* <h3>{categoryItems[0]?.CategoryName}</h3> */}
                        <div className={dashboardclasses["category-form"]}>
                            <select
                                name=""
                                id=""
                                value={categoryId || ""}
                                onChange={(e) => {
                                    setcategoryId(e.target.value);
                                    setParams({ 
                                        Category: e.target.value,
                                    });
                                }}>
                                {allcategoriesData.map((item) => (
                                    <option key={item.CategoryID} value={item.CategoryID}>
                                        {item?.CategoryName}
                                    </option>
                                ))}
                            </select>
                            <input
                                type={"text"}
                                placeholder="Search by product Name"
                                onChange={searchHandler}
                            />

                            <button onClick={categoryHandler}>
                                + Add Product
                            </button>
                        </div>
                        {loading ? (
                            <div className={dashboardclasses["loader"]}>
                                <ScaleLoader
                                    color={"black"}
                                    loading={true}
                                    css={override}
                                    size={150}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="ProductID"
                                        data={categorysearchItems}
                                        columns={columns}
                                        defaultSorted={defaultSorted}
                                        pagination={pagination}
                                        wrapperClasses="table-responsive"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Warehouse;
