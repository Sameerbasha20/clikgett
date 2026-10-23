const mysql = require('mysql');
require('dotenv').config({ path: './.env' });

const pool = require('../utils/db');

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

const PricingEngine = {
    /**
     * Fetch active restrictions for a list of products/variants/categories
     * @param {Array<number>} productIds 
     * @param {Array<number>} variantIds 
     * @param {Array<number>} categoryIds
     */
    getProductRestrictions: async (productIds = [], variantIds = [], categoryIds = []) => {
        const pIds = (productIds || []).map(Number).filter(n => !isNaN(n) && n > 0);
        const vIds = (variantIds || []).map(Number).filter(n => !isNaN(n) && n > 0);
        const cIds = (categoryIds || []).map(Number).filter(n => !isNaN(n) && n > 0);
        if (!pIds.length && !vIds.length && !cIds.length) return [];
        
        let sql = "SELECT * FROM product_restrictions WHERE Status = 1";
        const clauses = [];
        const params = [];
        if (pIds.length > 0) {
            clauses.push("ProductID IN (?)");
            params.push(pIds);
        }
        if (vIds.length > 0) {
            clauses.push("VariantID IN (?)");
            params.push(vIds);
        }
        if (cIds.length > 0) {
            clauses.push("CategoryID IN (?)");
            params.push(cIds);
        }
        if (clauses.length > 0) {
            sql += " AND (" + clauses.join(" OR ") + ")";
        }
        return await queryAsync(sql, params);
    },

    /**
     * Fetch active Buy More tiers for a product/variant
     * @param {number} productId 
     * @param {number} variantId 
     */
    getBuyMoreTiers: async (productId, variantId = null) => {
        const sql = `
            SELECT * FROM buy_more_config 
            WHERE ProductID = ? 
              AND Status = 1
              AND (StartDate IS NULL OR StartDate <= NOW())
              AND (EndDate IS NULL OR EndDate >= NOW())
            ORDER BY MinQuantity ASC
        `;
        const tiers = await queryAsync(sql, [productId]);
        if (variantId) {
            return tiers.filter(t => !t.VariantID || t.VariantID === variantId);
        }
        return tiers;
    },

    /**
     * Check if a user has an active membership
     * @param {number} userId 
     */
    getUserActiveMembership: async (userId) => {
        if (!userId) return null;
        const sql = `
            SELECT um.*, mp.PlanName, mp.FreeDelivery, mp.ExtraCashbackPercentage, mp.ExclusiveCoupons
            FROM UserMemberships um
            JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            WHERE um.UserID = ? 
              AND um.StartDate <= NOW() 
              AND um.EndDate >= NOW()
            ORDER BY um.EndDate DESC LIMIT 1
        `;
        const rows = await queryAsync(sql, [userId]);
        return rows.length > 0 ? rows[0] : null;
    },

    /**
     * Get active Cart Threshold Offers
     */
    getActiveCartOffers: async () => {
        const sql = `
            SELECT * FROM cart_offers 
            WHERE Status = 1 
              AND (StartDate IS NULL OR StartDate <= NOW())
              AND (EndDate IS NULL OR EndDate >= NOW())
            ORDER BY ThresholdAmount DESC
        `;
        return await queryAsync(sql);
    },

    /**
     * Get active Flash Sales for a list of products
     * @param {Array<number>} productIds
     */
    getActiveFlashSales: async (productIds = []) => {
        const pIds = (productIds || []).map(Number).filter(n => !isNaN(n) && n > 0);
        if (!pIds.length) return [];
        const sql = `
            SELECT s.SaleID, s.SaleName, s.DiscountType, s.DiscountValue,
                   s.StartDate, s.EndDate, s.Status, si.ProductID, si.SaleItemID
            FROM Sales s
            JOIN SaleItems si ON s.SaleID = si.SaleID
            WHERE si.ProductID IN (?)
              AND s.Status = 1
              AND s.StartDate <= NOW()
              AND s.EndDate >= NOW()
            ORDER BY s.CreatedAt DESC
        `;
        return await queryAsync(sql, [pIds]);
    },

    /**
     * Get active Product Membership Prices for a list of products and a specific planId
     * @param {Array<number>} productIds
     * @param {number} planId
     */
    getProductMembershipPrices: async (productIds = [], planId = null) => {
        const pIds = (productIds || []).map(Number).filter(n => !isNaN(n) && n > 0);
        if (!pIds.length || !planId) return [];
        const sql = `
            SELECT mpp.*, mp.PlanName
            FROM membership_product_prices mpp
            JOIN MembershipPlans mp ON mpp.PlanID = mp.PlanID
            WHERE mpp.ProductID IN (?)
              AND mpp.PlanID = ?
              AND mpp.Status = 1
        `;
        return await queryAsync(sql, [pIds, planId]);
    },

    /**
     * Calculate line price for a single product/variant item
     * Evaluates: Base Price, Offer Price, Buy 2 Price, Buy More tiers, Flash Sales, Membership Pricing
     */
    calculateLinePrice: (item, buyMoreTiers = [], userMembership = null, restrictions = [], activeSale = null, memberPriceConfig = null, itemCategoryId = null) => {
        const qty = parseInt(item.Quantity || 1);
        const basePrice = parseFloat(item.Price || item.OfferPrice || 0);
        const offerPrice = parseFloat(item.OfferPrice || item.Price || 0);
        const buy2Price = item.Buy2Price != null && item.Buy2Price !== '' ? parseFloat(item.Buy2Price) : null;

        // Check active Flash Sale
        let flashSaleDiscount = 0;
        let flashSaleUnitPrice = offerPrice;
        let hasActiveSale = false;

        if (activeSale && activeSale.Status == 1) {
            const discVal = parseFloat(activeSale.DiscountValue || 0);
            if (discVal > 0) {
                if (activeSale.DiscountType === 'percentage') {
                    flashSaleDiscount = (offerPrice * discVal) / 100;
                } else if (activeSale.DiscountType === 'flat') {
                    flashSaleDiscount = discVal;
                }
                flashSaleUnitPrice = Math.max(0, parseFloat((offerPrice - flashSaleDiscount).toFixed(2)));
                hasActiveSale = true;
            }
        }

        // Check product & category restrictions for this item
        const catId = itemCategoryId || item.CategoryID;
        const itemRestrictions = restrictions.filter(r => 
            (r.ProductID && r.ProductID == item.ProductID && (!r.VariantID || r.VariantID == item.VariantID)) ||
            (r.VariantID && r.VariantID == item.VariantID) ||
            (r.CategoryID && catId && r.CategoryID == catId)
        );

        const isCashbackExcluded = itemRestrictions.some(r => 
            r.RestrictionType === 'no_cashback' || r.RestrictionType === 'cashback_excluded'
        );
        const isCouponExcluded = itemRestrictions.some(r => 
            r.RestrictionType === 'no_coupon' || r.RestrictionType === 'coupon_excluded'
        );
        const isMembershipExcluded = itemRestrictions.some(r => 
            r.RestrictionType === 'no_membership' || r.RestrictionType === 'membership_excluded'
        );

        // Check active Membership Pricing for this item
        let memberUnitPrice = offerPrice;
        let hasActiveMemberPrice = false;

        if (!isMembershipExcluded && userMembership && memberPriceConfig && memberPriceConfig.Status == 1) {
            const configuredPrice = parseFloat(memberPriceConfig.MembershipPrice || 0);
            if (configuredPrice > 0 && configuredPrice < offerPrice) {
                memberUnitPrice = configuredPrice;
                hasActiveMemberPrice = true;
            }
        }

        let finalLineTotal = 0;
        let appliedRule = 'Standard Offer Price';
        let unitPrice = offerPrice;

        // 1. Check Buy More Multi-Tier Pricing (Highest priority bulk discount)
        if (buyMoreTiers && buyMoreTiers.length > 0) {
            // Sort active tiers descending by quantity
            const sortedTiers = buyMoreTiers.slice().sort((a, b) => (b.MinQuantity || b.Quantity) - (a.MinQuantity || a.Quantity));
            
            // Check for exact quantity tier match first
            const exactMatch = sortedTiers.find(t => (t.MinQuantity || t.Quantity) === qty);
            
            if (exactMatch) {
                // If it's an explicit slab with MaxQuantity > MinQuantity, Price is unit price
                if (exactMatch.MaxQuantity && exactMatch.MaxQuantity > exactMatch.MinQuantity) {
                    unitPrice = parseFloat(exactMatch.Price);
                    finalLineTotal = unitPrice * qty;
                    appliedRule = `Buy More Slab (${exactMatch.MinQuantity}-${exactMatch.MaxQuantity} @ ₹${unitPrice.toFixed(2)}/unit)`;
                } else if (exactMatch.MaxQuantity === null && (exactMatch.MinQuantity || exactMatch.Quantity) > 1) {
                    // Open-ended slab (e.g. 10+ @ ₹70.00/unit)
                    unitPrice = parseFloat(exactMatch.Price);
                    finalLineTotal = unitPrice * qty;
                    appliedRule = `Buy More Slab (${exactMatch.MinQuantity}+ @ ₹${unitPrice.toFixed(2)}/unit)`;
                } else {
                    // Exact quantity package price (e.g. Qty 2 -> ₹30.00, Qty 5 -> ₹70.00)
                    finalLineTotal = parseFloat(exactMatch.Price);
                    unitPrice = finalLineTotal / qty;
                    appliedRule = `Buy More Quantity Offer (Qty ${qty} @ ₹${finalLineTotal.toFixed(2)})`;
                }
            } else {
                // Check if qty falls inside an explicit slab range (e.g. 2-4, 5-9, or open-ended 10+)
                const slabMatch = sortedTiers.find(t => 
                    (qty >= t.MinQuantity && t.MaxQuantity != null && t.MaxQuantity > t.MinQuantity && qty <= t.MaxQuantity) ||
                    (qty >= t.MinQuantity && t.MaxQuantity === null && t.MinQuantity > 1)
                );
                
                if (slabMatch) {
                    unitPrice = parseFloat(slabMatch.Price);
                    finalLineTotal = unitPrice * qty;
                    appliedRule = slabMatch.MaxQuantity 
                        ? `Buy More Slab (${slabMatch.MinQuantity}-${slabMatch.MaxQuantity} @ ₹${unitPrice.toFixed(2)}/unit)`
                        : `Buy More Slab (${slabMatch.MinQuantity}+ @ ₹${unitPrice.toFixed(2)}/unit)`;
                } else {
                    // Bundle decomposition: largest available bundles + remaining items
                    let remaining = qty;
                    let bundleTotal = 0;
                    const bundleNotes = [];
                    
                    for (const tier of sortedTiers) {
                        const tierQty = tier.MinQuantity || tier.Quantity;
                        if (tierQty > 0 && remaining >= tierQty) {
                            const bundles = Math.floor(remaining / tierQty);
                            bundleTotal += bundles * parseFloat(tier.Price);
                            remaining %= tierQty;
                            bundleNotes.push(`${bundles}x(Qty ${tierQty} @ ₹${parseFloat(tier.Price).toFixed(2)})`);
                        }
                    }
                    
                    if (bundleNotes.length > 0) {
                        if (remaining > 0) {
                            bundleTotal += remaining * offerPrice;
                            bundleNotes.push(`${remaining}x(Single @ ₹${offerPrice.toFixed(2)})`);
                        }
                        
                        if (bundleTotal < (offerPrice * qty)) {
                            finalLineTotal = bundleTotal;
                            unitPrice = finalLineTotal / qty;
                            appliedRule = `Buy More Bundle (${bundleNotes.join(' + ')})`;
                        }
                    }
                }
            }
        }

        // 2. Check Buy 2 Pricing (if not satisfied by Buy More)
        if (finalLineTotal === 0 && buy2Price != null && buy2Price > 0) {
            if (qty === 2) {
                finalLineTotal = buy2Price;
                unitPrice = buy2Price / 2;
                appliedRule = `Buy 2 Special Price (2 for ₹${buy2Price.toFixed(2)})`;
            } else if (qty > 2) {
                // Apply Buy 2 pairs + remaining at offer price
                const pairs = Math.floor(qty / 2);
                const remainder = qty % 2;
                finalLineTotal = (pairs * buy2Price) + (remainder * offerPrice);
                unitPrice = finalLineTotal / qty;
                appliedRule = `Buy 2 Bundle (${pairs} pairs @ ₹${buy2Price} + ${remainder} @ ₹${offerPrice})`;
            } else {
                finalLineTotal = offerPrice * qty;
                unitPrice = offerPrice;
                appliedRule = 'Standard Offer Price';
            }
        } 
        // 3. Standard Offer Price / Flash Sale / Membership Pricing fallback
        else if (finalLineTotal === 0) {
            if (hasActiveSale && hasActiveMemberPrice) {
                // If both Flash Sale and Membership Pricing exist, customer receives the lowest price
                if (memberUnitPrice <= flashSaleUnitPrice) {
                    finalLineTotal = parseFloat((memberUnitPrice * qty).toFixed(2));
                    unitPrice = memberUnitPrice;
                    appliedRule = `Membership Exclusive Price (${(memberPriceConfig && memberPriceConfig.PlanName) || (userMembership && userMembership.PlanName) || 'Member'}: ₹${memberUnitPrice.toFixed(2)})`;
                } else {
                    finalLineTotal = parseFloat((flashSaleUnitPrice * qty).toFixed(2));
                    unitPrice = flashSaleUnitPrice;
                    appliedRule = `Flash Sale: ${activeSale.SaleName} (${activeSale.DiscountType === 'percentage' ? activeSale.DiscountValue + '%' : '₹' + activeSale.DiscountValue} OFF)`;
                }
            } else if (hasActiveMemberPrice) {
                finalLineTotal = parseFloat((memberUnitPrice * qty).toFixed(2));
                unitPrice = memberUnitPrice;
                appliedRule = `Membership Exclusive Price (${(memberPriceConfig && memberPriceConfig.PlanName) || (userMembership && userMembership.PlanName) || 'Member'}: ₹${memberUnitPrice.toFixed(2)})`;
            } else if (hasActiveSale) {
                finalLineTotal = parseFloat((flashSaleUnitPrice * qty).toFixed(2));
                unitPrice = flashSaleUnitPrice;
                appliedRule = `Flash Sale: ${activeSale.SaleName} (${activeSale.DiscountType === 'percentage' ? activeSale.DiscountValue + '%' : '₹' + activeSale.DiscountValue} OFF)`;
            } else {
                finalLineTotal = offerPrice * qty;
                unitPrice = offerPrice;
                appliedRule = 'Standard Offer Price';
            }
        }

        // If Buy More / Buy 2 evaluated, but Flash Sale offers an even lower price, apply Flash Sale
        if (hasActiveSale && (flashSaleUnitPrice * qty) < finalLineTotal) {
            finalLineTotal = parseFloat((flashSaleUnitPrice * qty).toFixed(2));
            unitPrice = flashSaleUnitPrice;
            appliedRule = `Flash Sale: ${activeSale.SaleName} (${activeSale.DiscountType === 'percentage' ? activeSale.DiscountValue + '%' : '₹' + activeSale.DiscountValue} OFF)`;
        }

        // If Member Price offers an even lower price than current finalLineTotal, apply Member Price
        if (hasActiveMemberPrice && (memberUnitPrice * qty) < finalLineTotal) {
            finalLineTotal = parseFloat((memberUnitPrice * qty).toFixed(2));
            unitPrice = memberUnitPrice;
            appliedRule = `Membership Exclusive Price (${(memberPriceConfig && memberPriceConfig.PlanName) || (userMembership && userMembership.PlanName) || 'Member'}: ₹${memberUnitPrice.toFixed(2)})`;
        }

        const originalTotal = basePrice * qty;
        const totalDiscount = Math.max(0, originalTotal - finalLineTotal);

        return {
            ProductID: item.ProductID,
            VariantID: item.VariantID,
            ProductName: item.ProductName,
            Quantity: qty,
            BasePrice: basePrice,
            OfferPrice: offerPrice,
            Buy2Price: buy2Price,
            UnitPrice: parseFloat(unitPrice.toFixed(2)),
            LineTotal: parseFloat(finalLineTotal.toFixed(2)),
            OriginalTotal: parseFloat(originalTotal.toFixed(2)),
            Discount: parseFloat(totalDiscount.toFixed(2)),
            AppliedRule: appliedRule,
            ActiveFlashSale: hasActiveSale ? {
                SaleID: activeSale.SaleID,
                SaleName: activeSale.SaleName,
                DiscountType: activeSale.DiscountType,
                DiscountValue: activeSale.DiscountValue,
                SalePrice: flashSaleUnitPrice
            } : null,
            ActiveMembershipPricing: hasActiveMemberPrice ? {
                PlanID: memberPriceConfig.PlanID,
                PlanName: (memberPriceConfig && memberPriceConfig.PlanName) || (userMembership && userMembership.PlanName) || 'Member',
                MemberPrice: memberUnitPrice
            } : null,
            IsCashbackExcluded: isCashbackExcluded,
            IsCouponExcluded: isCouponExcluded,
            IsMembershipExcluded: isMembershipExcluded
        };
    },

    /**
     * Full Cart / Checkout Financial Breakdown Engine
     */
    calculateCart: async (cartItems = [], promoCode = null, userId = null, userLocation = null) => {
        if (!cartItems || cartItems.length === 0) {
            return {
                Status: 1,
                Items: [],
                SubTotal: 0,
                OriginalSubTotal: 0,
                TotalSavings: 0,
                CouponEligibleSubTotal: 0,
                CashbackEligibleSubTotal: 0,
                CouponDiscount: 0,
                PromoCode: promoCode || null,
                AppliedCartOffer: null,
                CartOfferDiscount: 0,
                DeliveryCharges: 0,
                FreeDeliveryApplied: false,
                CashbackEarned: 0,
                CashbackExpiryDays: 30,
                GrandTotal: 0
            };
        }

        const productIds = cartItems.map(i => i.ProductID).filter(Boolean);
        const variantIds = cartItems.map(i => i.VariantID).filter(Boolean);

        // Fetch category & subcategory IDs for all products in cart
        const productCategoryRows = productIds.length > 0 
            ? await queryAsync("SELECT ProductID, CategoryID, SubCategoryID FROM Products WHERE ProductID IN (?)", [productIds])
            : [];
        const categoryMap = {};
        const subCategoryMap = {};
        (productCategoryRows || []).forEach(r => {
            categoryMap[r.ProductID] = r.CategoryID;
            subCategoryMap[r.ProductID] = r.SubCategoryID;
        });
        const categoryIds = Object.values(categoryMap).filter(Boolean);

        // Fetch parallel context
        const [restrictions, userMembership, activeOffers, activeSales, shopSettingsRows, globalSettingsRows, activeUnlocks, allActivePromos] = await Promise.all([
            PricingEngine.getProductRestrictions(productIds, variantIds, categoryIds),
            PricingEngine.getUserActiveMembership(userId),
            PricingEngine.getActiveCartOffers(),
            PricingEngine.getActiveFlashSales(productIds),
            queryAsync("SELECT * FROM AdminShopToggleSettings LIMIT 1"),
            queryAsync("SELECT * FROM Settings"),
            queryAsync(`
                SELECT pu.*, p.ProductName, p.ProductImages,
                       pv.Price, pv.OfferPrice, pv.VariantID, pv.metrictype, pv.metricvalue
                FROM product_unlocks pu 
                JOIN Products p ON pu.ProductID = p.ProductID 
                LEFT JOIN ProductVariants pv ON (pu.VariantID IS NOT NULL AND pu.VariantID = pv.VariantID) 
                                             OR (pu.VariantID IS NULL AND p.ProductID = pv.ProductID)
                WHERE pu.Status = 1 
                  AND (pu.StartDate IS NULL OR pu.StartDate <= NOW()) 
                  AND (pu.EndDate IS NULL OR pu.EndDate >= NOW())
                GROUP BY pu.UnlockID
                ORDER BY pu.ThresholdAmount ASC
            `),
            queryAsync(`
                SELECT PromoCode, MinOrderValue, OfferValue, MaxDiscount, Type, Description
                FROM PromoCodes
                WHERE Status = 1
                  AND IFNULL(Is_Secret, 0) = 0
                  AND (StartDate IS NULL OR StartDate <= DATE(CONVERT_TZ(NOW(),'+00:00','+05:30')))
                  AND (EndDate IS NULL OR EndDate >= DATE(CONVERT_TZ(NOW(),'+00:00','+05:30')))
                ORDER BY MinOrderValue ASC
            `)
        ]);

        const shopSettings = shopSettingsRows && shopSettingsRows.length > 0 ? shopSettingsRows[0] : {};
        const globalSettings = {};
        (globalSettingsRows || []).forEach(s => { globalSettings[s.SettingKey] = s.SettingValue; });

        const memberPrices = (userMembership && userMembership.PlanID)
            ? await PricingEngine.getProductMembershipPrices(productIds, userMembership.PlanID)
            : [];

        // Calculate each line item price
        const processedItems = [];
        for (const item of cartItems) {
            const itemCatId = categoryMap[item.ProductID] || item.CategoryID;
            const tiers = await PricingEngine.getBuyMoreTiers(item.ProductID, item.VariantID);
            const itemSale = activeSales.find(s => s.ProductID == item.ProductID) || null;
            const itemMemberPrice = memberPrices.find(m => m.ProductID == item.ProductID) || null;
            const line = PricingEngine.calculateLinePrice(item, tiers, userMembership, restrictions, itemSale, itemMemberPrice, itemCatId);
            processedItems.push({
                ...item,
                CategoryID: itemCatId,
                SubCategoryID: subCategoryMap[item.ProductID] || item.SubCategoryID,
                ...line
            });
        }

        const subTotal = processedItems.reduce((sum, item) => sum + item.LineTotal, 0);
        const originalSubTotal = processedItems.reduce((sum, item) => sum + item.OriginalTotal, 0);
        const couponEligibleSubTotal = processedItems.filter(i => !i.IsCouponExcluded).reduce((sum, item) => sum + item.LineTotal, 0);
        const cashbackEligibleSubTotal = processedItems.filter(i => !i.IsCashbackExcluded).reduce((sum, item) => sum + item.LineTotal, 0);

        // 1. Evaluate Promo Code / Coupon against couponEligibleSubTotal
        let couponDiscount = 0;
        let couponMessage = null;
        if (promoCode) {
            const cleanCode = promoCode.toString().trim().toUpperCase();
            const promoRows = await queryAsync(
                "SELECT * FROM PromoCodes WHERE UPPER(PromoCode) = ? AND Status = 1 AND (StartDate IS NULL OR StartDate <= DATE(CONVERT_TZ(NOW(),'+00:00','+05:30'))) AND (EndDate IS NULL OR EndDate >= DATE(CONVERT_TZ(NOW(),'+00:00','+05:30')))",
                [cleanCode]
            );
            if (promoRows && promoRows.length > 0) {
                const promo = promoRows[0];
                const minOrder = parseFloat(promo.MinOrderValue || 0);
                if (couponEligibleSubTotal <= 0) {
                    // Every item is excluded from coupons (no_coupon restriction).
                    couponMessage = `Promo code ${cleanCode} can't be used on the items in your cart`;
                } else if (couponEligibleSubTotal >= minOrder) {
                    if (promo.Type == 2) {
                        couponDiscount = parseFloat(promo.OfferValue || promo.MaxDiscount || 0);
                    } else {
                        couponDiscount = (couponEligibleSubTotal * parseFloat(promo.OfferValue || 0)) / 100;
                    }
                    const maxDisc = parseFloat(promo.MaxDiscount || 0);
                    if (maxDisc > 0 && couponDiscount > maxDisc) {
                        couponDiscount = maxDisc;
                    }
                    // A flat coupon can't take off more than the items it applies to.
                    couponDiscount = Math.min(couponDiscount, couponEligibleSubTotal);
                    couponMessage = `Promo code ${cleanCode} applied successfully`;
                } else {
                    couponMessage = `Eligible item total (₹${couponEligibleSubTotal.toFixed(2)}) is below min requirement of ₹${minOrder}`;
                }
            } else {
                couponMessage = "Invalid or expired promo code";
            }
        }

        // Generate dynamic coupon suggestions
        const applicableCoupons = [];
        const suggestedCoupons = [];
        for (const c of (allActivePromos || [])) {
            const minOrder = parseFloat(c.MinOrderValue || 0);
            if (couponEligibleSubTotal >= minOrder) {
                applicableCoupons.push({
                    PromoCode: c.PromoCode,
                    MinOrderValue: minOrder,
                    OfferValue: c.OfferValue,
                    Description: c.Description,
                    IsApplicable: true
                });
            } else {
                const gap = parseFloat((minOrder - couponEligibleSubTotal).toFixed(2));
                suggestedCoupons.push({
                    PromoCode: c.PromoCode,
                    MinOrderValue: minOrder,
                    OfferValue: c.OfferValue,
                    Description: c.Description,
                    AmountNeeded: gap,
                    Message: `Add ₹${gap} more to unlock this coupon`,
                    IsApplicable: false
                });
            }
        }

        // 2. Evaluate Cart Threshold Offers
        let appliedCartOffer = null;
        let cartOfferDiscount = 0;
        let offerFreeShipping = false;
        let offerBonusCashback = 0;

        for (const offer of activeOffers) {
            const threshold = parseFloat(offer.ThresholdAmount);
            if (subTotal >= threshold) {
                appliedCartOffer = offer;
                const offerVal = parseFloat(offer.OfferValue || 0);
                if (offer.OfferType === 'fixed_discount') {
                    cartOfferDiscount = offerVal;
                } else if (offer.OfferType === 'percent_discount') {
                    cartOfferDiscount = (subTotal * offerVal) / 100;
                } else if (offer.OfferType === 'free_shipping') {
                    offerFreeShipping = true;
                } else if (offer.OfferType === 'cashback') {
                    offerBonusCashback = offerVal;
                }
                break; // Take the highest qualifying offer
            }
        }

        // 3. Delivery Charges & Long-Distance Extra Fee Calculation
        let deliveryCharges = 0;
        let freeDeliveryApplied = false;
        let longDistanceFee = 0;
        let isLongDistance = false;

        const baseDelivery = parseFloat(shopSettings.BaseDeliveryCharge || globalSettings.DeliveryCharges || 25);
        const pricePerKm = parseFloat(shopSettings.PricePerKm || 5);
        const freeDeliveryThreshold = parseFloat(globalSettings.FreeDelivery_CartAmount || 499);

        // Estimate distance if coordinates supplied
        let distanceKm = 1;
        if (userLocation && (userLocation.distanceKm !== undefined || userLocation.DistanceKm !== undefined)) {
            distanceKm = parseFloat(userLocation.distanceKm !== undefined ? userLocation.distanceKm : userLocation.DistanceKm);
        } else if (userLocation && userLocation.latitude && userLocation.longitude && shopSettings.Latitude && shopSettings.Longitude) {
            const lat1 = parseFloat(shopSettings.Latitude);
            const lon1 = parseFloat(shopSettings.Longitude);
            const lat2 = parseFloat(userLocation.latitude);
            const lon2 = parseFloat(userLocation.longitude);
            const p = 0.017453292519943295;
            const a = 0.5 - Math.cos((lat2 - lat1) * p)/2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p))/2;
            distanceKm = Math.max(1, 12742 * Math.asin(Math.sqrt(a)));
        }

        // Long distance check
        if (shopSettings.LongDistanceFeeEnabled == 1 && distanceKm > parseFloat(shopSettings.LongDistanceThresholdKm || 8)) {
            longDistanceFee = parseFloat(shopSettings.LongDistanceFee || 40);
            isLongDistance = true;
        }

        deliveryCharges = Math.ceil(baseDelivery + (distanceKm * pricePerKm)) + longDistanceFee;
        const deliveryBeforeWaiver = deliveryCharges;

        if (subTotal >= freeDeliveryThreshold || offerFreeShipping || (userMembership && userMembership.FreeDelivery == 1)) {
            deliveryCharges = longDistanceFee; // Long distance fee remains even if base delivery is free
            freeDeliveryApplied = true;
        }

        // 4. Dynamic Delivery ETA & Large Order Buffer (Total Item Quantity: 1-10 -> 30m, 11-20 -> 40m, 21+ -> 50m)
        const totalItemQty = processedItems.reduce((sum, item) => sum + (parseInt(item.Quantity) || 1), 0);
        let additionalDeliveryMinutes = 0;
        let largeCartNotice = null;

        const t1Items = parseInt(shopSettings.LargeCartThreshold1Items || 10);
        const t1Mins = parseInt(shopSettings.LargeCartThreshold1Minutes || 10);
        const t2Items = parseInt(shopSettings.LargeCartThreshold2Items || 20);
        const t2Mins = parseInt(shopSettings.LargeCartThreshold2Minutes || 10);

        if (totalItemQty <= t1Items) {
            additionalDeliveryMinutes = 0;
        } else if (totalItemQty <= t2Items) {
            additionalDeliveryMinutes = t1Mins;
            largeCartNotice = `${totalItemQty} items in your order · +${additionalDeliveryMinutes} mins preparation buffer`;
        } else {
            const step = (t2Items - t1Items) > 0 ? (t2Items - t1Items) : 10;
            const extraSteps = Math.ceil((totalItemQty - t2Items) / step);
            additionalDeliveryMinutes = t1Mins + (extraSteps * t2Mins);
            largeCartNotice = `${totalItemQty} items in your order · +${additionalDeliveryMinutes} mins preparation buffer`;
        }

        // Fruit Products Buffer Rule: Fruit items add +10 minutes preparation buffer
        const hasFruitItem = processedItems.some(i => {
            const subCatId = parseInt(i.SubCategoryID || 0);
            const catId = parseInt(i.CategoryID || 0);
            return subCatId === 84 || subCatId === 17 || catId === 6;
        });
        if (hasFruitItem) {
            additionalDeliveryMinutes += 10;
            if (largeCartNotice) {
                largeCartNotice += ` · +10 mins fruit buffer`;
            } else {
                largeCartNotice = `Fruit item in cart · +10 mins preparation buffer`;
            }
        }

        const baseDeliveryMinutes = 30;
        const totalEstimatedMinutes = baseDeliveryMinutes + additionalDeliveryMinutes;

        // 5. Dynamic Product Unlocks Evaluation (Threshold > ₹1000)
        const unlockProductIds = new Set((activeUnlocks || []).map(u => parseInt(u.ProductID)));
        const qualifyingBaseSubTotal = processedItems
            .filter(i => !unlockProductIds.has(parseInt(i.ProductID)))
            .reduce((sum, item) => sum + item.LineTotal, 0);

        const evalSubTotal = qualifyingBaseSubTotal > 0 ? qualifyingBaseSubTotal : subTotal;

        // Check if any unlock items in cart qualify for unlock pricing
        let didApplyUnlockPrice = false;
        (activeUnlocks || []).forEach(u => {
            const threshold = parseFloat(u.ThresholdAmount);
            const isUnlocked = evalSubTotal > threshold;
            if (isUnlocked && u.UnlockPrice !== null && u.UnlockPrice !== undefined && parseFloat(u.UnlockPrice) >= 0) {
                const uPrice = parseFloat(u.UnlockPrice);
                processedItems.forEach(item => {
                    if (item.ProductID == u.ProductID && (!u.VariantID || item.VariantID == u.VariantID)) {
                        if (uPrice < item.UnitPrice) {
                            const qty = item.Quantity || 1;
                            item.UnitPrice = uPrice;
                            item.LineTotal = parseFloat((uPrice * qty).toFixed(2));
                            item.TotalDiscount = Math.max(0, item.OriginalTotal - item.LineTotal);
                            item.AppliedRule = `Special Unlock Price (₹${uPrice.toFixed(2)})`;
                            item.IsUnlockedProduct = true;
                            didApplyUnlockPrice = true;
                        }
                    }
                });
            }
        });

        // Recompute subTotal if an unlock price was applied
        let finalSubTotal = subTotal;
        if (didApplyUnlockPrice) {
            finalSubTotal = processedItems.reduce((sum, item) => sum + item.LineTotal, 0);
        }

        const productUnlocksEvaluated = (activeUnlocks || []).map(u => {
            const threshold = parseFloat(u.ThresholdAmount);
            const isUnlocked = evalSubTotal > threshold;
            const gap = isUnlocked ? 0 : parseFloat(((threshold - evalSubTotal) + 1).toFixed(2));
            const unlockPrice = (u.UnlockPrice !== null && u.UnlockPrice !== undefined) ? parseFloat(u.UnlockPrice) : parseFloat(u.OfferPrice || u.Price || 0);
            return {
                UnlockID: u.UnlockID,
                ThresholdAmount: threshold,
                ProductID: u.ProductID,
                VariantID: u.VariantID,
                ProductName: u.ProductName,
                ProductImages: u.ProductImages,
                Price: parseFloat(u.Price || 0),
                OfferPrice: parseFloat(u.OfferPrice || u.Price || 0),
                UnlockPrice: unlockPrice,
                Unit: u.metrictype ? `${u.metricvalue} ${u.metrictype}` : (u.Unit || ''),
                IsUnlocked: isUnlocked,
                AmountNeeded: gap,
                Message: isUnlocked ? 'Special Products Unlocked' : (u.Message || `Add ₹${gap} more to unlock`)
            };
        });

        // 6. Dynamic Cashback Calculation
        let cashbackEarned = 0;
        const cashbackExpiryDays = parseInt(shopSettings.CashbackExpiryDays || 30);
        const cashbackEnabled = shopSettings.CashbackEnabled == 1 || (userMembership && userMembership.ExtraCashbackPercentage > 0);

        if (cashbackEnabled) {
            const basePercent = parseFloat(shopSettings.CashbackPercentage || 0);
            const extraMemberPercent = (userMembership && userMembership.ExtraCashbackPercentage)
                ? parseFloat(userMembership.ExtraCashbackPercentage)
                : 0;

            const baseEarned = (basePercent > 0 && cashbackEligibleSubTotal > 0)
                ? (cashbackEligibleSubTotal * basePercent) / 100
                : 0;

            const memberEligibleSubTotal = processedItems
                .filter(i => !i.IsCashbackExcluded && !i.IsMembershipExcluded)
                .reduce((sum, item) => sum + item.LineTotal, 0);

            const memberExtraEarned = (extraMemberPercent > 0 && memberEligibleSubTotal > 0)
                ? (memberEligibleSubTotal * extraMemberPercent) / 100
                : 0;

            cashbackEarned = baseEarned + memberExtraEarned;
            const maxCashback = parseFloat(shopSettings.CashbackMaxAmount || 0);
            if (maxCashback > 0 && cashbackEarned > maxCashback) {
                cashbackEarned = maxCashback;
            }
        }
        if (offerBonusCashback > 0) {
            cashbackEarned += offerBonusCashback;
        }

        // 7. Final Grand Total
        const totalDiscounts = couponDiscount + cartOfferDiscount;
        const grandTotal = Math.max(0, parseFloat((finalSubTotal - totalDiscounts + deliveryCharges).toFixed(2)));
        const totalSavings = parseFloat((originalSubTotal - grandTotal).toFixed(2));

        return {
            Status: 1,
            Items: processedItems,
            SubTotal: parseFloat(finalSubTotal.toFixed(2)),
            OriginalSubTotal: parseFloat(originalSubTotal.toFixed(2)),
            TotalSavings: totalSavings,
            CouponEligibleSubTotal: parseFloat(couponEligibleSubTotal.toFixed(2)),
            CashbackEligibleSubTotal: parseFloat(cashbackEligibleSubTotal.toFixed(2)),
            CouponDiscount: parseFloat(couponDiscount.toFixed(2)),
            CouponMessage: couponMessage,
            PromoCode: promoCode || null,
            ApplicableCoupons: applicableCoupons,
            SuggestedCoupons: suggestedCoupons,
            ProductUnlocks: productUnlocksEvaluated,
            AppliedCartOffer: appliedCartOffer ? {
                OfferID: appliedCartOffer.OfferID,
                OfferName: appliedCartOffer.OfferName,
                ThresholdAmount: appliedCartOffer.ThresholdAmount,
                OfferType: appliedCartOffer.OfferType,
                OfferValue: appliedCartOffer.OfferValue
            } : null,
            CartOfferDiscount: parseFloat(cartOfferDiscount.toFixed(2)),
            DeliveryCharges: parseFloat(deliveryCharges.toFixed(2)),
            DeliveryChargesBeforeWaiver: parseFloat(deliveryBeforeWaiver.toFixed(2)),
            LongDistanceFee: longDistanceFee,
            IsLongDistance: isLongDistance,
            BaseDeliveryMinutes: baseDeliveryMinutes,
            AdditionalDeliveryMinutes: additionalDeliveryMinutes,
            TotalDeliveryMinutes: totalEstimatedMinutes,
            TotalItemQuantity: totalItemQty,
            LargeCartNotice: largeCartNotice,
            FreeDeliveryApplied: freeDeliveryApplied,
            CashbackEarned: parseFloat(cashbackEarned.toFixed(2)),
            CashbackExpiryDays: cashbackExpiryDays,
            GrandTotal: grandTotal,
            UserMembership: userMembership ? {
                PlanName: userMembership.PlanName,
                FreeDelivery: userMembership.FreeDelivery == 1,
                ExtraCashbackPercentage: userMembership.ExtraCashbackPercentage
            } : null
        };
    }
};

module.exports = PricingEngine;
