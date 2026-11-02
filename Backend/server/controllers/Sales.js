const mysql = require('mysql');
require('dotenv').config();
const moment = require('moment');
const CommonController = require('./CommonController');

const pool = require('../utils/db');

const PRODUCT_IMAGES = 'http://clikgett-media.local/Products/';
const DEFAULT_LIMIT = 2;

// Products for a sale with their per-order limit: [{ ProductID, MaxQtyPerOrder }].
// Accepts Items (with limits) or the older ProductIDs list.
const saleRows = (saleId, body) => {
    const items = Array.isArray(body.Items) ? body.Items
        : Array.isArray(body.ProductIDs) ? body.ProductIDs.map((ProductID) => ({ ProductID })) : null;
    if (!items) return null;
    const seen = new Set();
    return items
        .map((i) => ({ id: parseInt(i.ProductID, 10), limit: parseInt(i.MaxQtyPerOrder, 10) }))
        .filter((i) => i.id > 0 && !seen.has(i.id) && seen.add(i.id))
        .map((i) => [saleId, i.id, null, Number.isFinite(i.limit) && i.limit >= 0 ? i.limit : DEFAULT_LIMIT]);
};
const firstImage = (raw) => {
    try {
        const list = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
        const img = list.find(Boolean);
        return img ? (String(img).startsWith('http') ? img : PRODUCT_IMAGES + img) : null;
    } catch (e) {
        return null;
    }
};

const SalesController = {
    getActiveSales: async (req, res) => {
        try {
            const salesQuery = `
                SELECT s.SaleID, s.SaleName, s.Description, s.DiscountType, s.DiscountValue,
                       s.StartDate, s.EndDate, s.Status, s.CreatedAt, s.UpdatedAt
                FROM Sales s
                WHERE s.Status = 1
                  AND s.StartDate <= NOW()
                  AND s.EndDate >= NOW()
                ORDER BY s.CreatedAt DESC
            `;
            pool.query(salesQuery, async (err, activeSales) => {
                if (err) {
                    console.error('Error fetching active sales:', err);
                    return res.status(500).json({ Status: 0, Message: 'Error fetching active sales', Sales: [] });
                }

                if (!activeSales || activeSales.length === 0) {
                    return res.status(200).json({ Status: 1, Sales: [] });
                }

                const resultSales = [];

                for (const sale of activeSales) {
                    // Fetch assigned products for this sale
                    const itemsQuery = `
                        SELECT DISTINCT si.ProductID
                        FROM SaleItems si
                        JOIN Products p ON si.ProductID = p.ProductID
                        WHERE si.SaleID = ? AND p.Status = 1
                    `;
                    const productIds = await new Promise((resolve) => {
                        pool.query(itemsQuery, [sale.SaleID], (itemErr, rows) => {
                            if (itemErr || !rows) resolve([]);
                            else resolve(rows.map(r => r.ProductID));
                        });
                    });

                    if (productIds.length === 0) {
                        continue;
                    }

                    // Fetch full product details including variants
                    const prodQuery = `
                        SELECT P.* FROM Products P
                        WHERE P.Status = 1 AND P.ProductID IN (${productIds.join(',')})
                    `;
                    let products = await CommonController.getproducts(prodQuery);

                    if (!products || products.length === 0) {
                        continue;
                    }

                    // Sale prices come from ProductDeals (via getproducts): the discount is taken
                    // off the MRP and counts only below the offer price, as at checkout. Products
                    // the sale does not make cheaper are left out of the rail.
                    const discVal = parseFloat(sale.DiscountValue || 0);
                    const processedProducts = products.filter((prod) => prod.Deal).map((prod) => {
                        (prod.ProductVariants || []).forEach((variant) => {
                            const mrp = parseFloat(variant.Price || variant.OfferPrice || 0);
                            const offer = parseFloat(variant.OfferPrice || variant.Price || 0);
                            const saleUnitPrice = variant.SalePrice != null ? parseFloat(variant.SalePrice) : offer;
                            variant.FlashSalePrice = saleUnitPrice;
                            variant.SaleDiscount = parseFloat((mrp - saleUnitPrice).toFixed(2));
                            variant.DiscountPercent = mrp > 0 ? Math.round(((mrp - saleUnitPrice) / mrp) * 100) : 0;
                            variant.ActiveSale = {
                                SaleID: sale.SaleID,
                                SaleName: sale.SaleName,
                                DiscountType: sale.DiscountType,
                                DiscountValue: discVal
                            };
                        });
                        const primaryVar = (prod.ProductVariants || [])[0];
                        if (primaryVar) {
                            prod.SalePrice = primaryVar.SalePrice != null ? primaryVar.SalePrice : primaryVar.OfferPrice;
                            prod.FlashSalePrice = primaryVar.FlashSalePrice;
                            prod.Price = primaryVar.Price;
                            prod.OfferPrice = primaryVar.OfferPrice;
                            prod.DiscountPercent = primaryVar.DiscountPercent;
                            prod.SaleDiscount = primaryVar.SaleDiscount;
                        }
                        return prod;
                    });
                    if (!processedProducts.length) continue;

                    resultSales.push({
                        SaleID: sale.SaleID,
                        SaleName: sale.SaleName,
                        Description: sale.Description,
                        DiscountType: sale.DiscountType,
                        DiscountValue: sale.DiscountValue,
                        StartDate: sale.StartDate,
                        EndDate: sale.EndDate,
                        Status: sale.Status,
                        Products: processedProducts
                    });
                }

                return res.status(200).json({
                    Status: 1,
                    Sales: resultSales
                });
            });
        } catch (e) {
            console.error('Exception in getActiveSales:', e);
            return res.status(500).json({ Status: 0, Message: 'Internal server error', Sales: [] });
        }
    },

    getAllSales: (req, res) => {
        const query = `
            SELECT s.*, 
                   COUNT(si.SaleItemID) AS ItemCount
            FROM Sales s
            LEFT JOIN SaleItems si ON s.SaleID = si.SaleID
            GROUP BY s.SaleID
            ORDER BY s.CreatedAt DESC
        `;
        pool.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching sales:', err);
                return res.status(500).json({ Status: 0, Message: 'Error fetching sales' });
            }
            return res.json({ Status: 1, Sales: results });
        });
    },

    getSaleDetails: (req, res) => {
        const saleId = req.params.id || req.query.SaleID;
        if (!saleId) {
            return res.status(400).json({ Status: 0, Message: 'SaleID is required' });
        }

        const saleQuery = "SELECT * FROM Sales WHERE SaleID = ?";
        pool.query(saleQuery, [saleId], (err, sales) => {
            if (err) {
                console.error('Error fetching sale details:', err);
                return res.status(500).json({ Status: 0, Message: 'Error fetching sale details' });
            }
            if (sales.length === 0) {
                return res.status(404).json({ Status: 0, Message: 'Sale not found' });
            }

            const itemsQuery = `
                SELECT si.SaleItemID, si.SaleID, si.ProductID, si.CategoryID, si.MaxQtyPerOrder,
                       p.ProductName, p.ProductImages,
                       (SELECT pv.Price FROM ProductVariants pv WHERE pv.ProductID = si.ProductID AND pv.status = 1 ORDER BY pv.VariantID LIMIT 1) AS MRP,
                       (SELECT pv.OfferPrice FROM ProductVariants pv WHERE pv.ProductID = si.ProductID AND pv.status = 1 ORDER BY pv.VariantID LIMIT 1) AS OfferPrice,
                       (SELECT CONCAT(pv.metricvalue, ' ', pv.metrictype) FROM ProductVariants pv WHERE pv.ProductID = si.ProductID AND pv.status = 1 ORDER BY pv.VariantID LIMIT 1) AS Unit
                FROM SaleItems si
                LEFT JOIN Products p ON si.ProductID = p.ProductID
                WHERE si.SaleID = ?
            `;
            pool.query(itemsQuery, [saleId], (itemErr, items) => {
                if (itemErr) {
                    console.error('Error fetching sale items:', itemErr);
                    return res.status(500).json({ Status: 0, Message: 'Error fetching sale items' });
                }
                return res.json({
                    Status: 1,
                    Sale: sales[0],
                    Items: items.map((i) => ({ ...i, ProductImages: undefined, Image: firstImage(i.ProductImages) }))
                });
            });
        });
    },

    createSale: (req, res) => {
        const { SaleName, Description, DiscountType, DiscountValue, StartDate, EndDate, Status, ProductIDs } = req.body;
        if (!SaleName || !DiscountType || DiscountValue === undefined || DiscountValue === null || !StartDate || !EndDate) {
            return res.status(400).json({ Status: 0, Message: 'Missing required sale fields' });
        }

        const discVal = parseFloat(DiscountValue);
        if (isNaN(discVal) || discVal <= 0) {
            return res.status(400).json({ Status: 0, Message: 'Discount value must be a positive number' });
        }
        if (DiscountType === 'percentage' && discVal > 100) {
            return res.status(400).json({ Status: 0, Message: 'Percentage discount cannot exceed 100%' });
        }
        if (moment(EndDate).isSameOrBefore(moment(StartDate))) {
            return res.status(400).json({ Status: 0, Message: 'End date must be after start date' });
        }

        const insertSaleQuery = `
            INSERT INTO Sales (SaleName, Description, DiscountType, DiscountValue, StartDate, EndDate, Status, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const values = [
            SaleName,
            Description || '',
            DiscountType,
            parseFloat(DiscountValue),
            moment.utc(StartDate).format('YYYY-MM-DD HH:mm:ss'),
            moment.utc(EndDate).format('YYYY-MM-DD HH:mm:ss'),
            Status !== undefined ? Status : 1
        ];

        pool.query(insertSaleQuery, values, (err, result) => {
            if (err) {
                console.error('Error creating sale:', err);
                return res.status(500).json({ Status: 0, Message: 'Error creating sale' });
            }

            const newSaleId = result.insertId;

            const itemValues = saleRows(newSaleId, req.body) || [];
            if (itemValues.length > 0) {
                const insertItemsQuery = `INSERT INTO SaleItems (SaleID, ProductID, CategoryID, MaxQtyPerOrder) VALUES ?`;
                pool.query(insertItemsQuery, [itemValues], (itemErr) => {
                    if (itemErr) {
                        console.error('Error adding products to sale:', itemErr);
                    }
                    return res.json({ Status: 1, Message: 'Sale created successfully with products', SaleID: newSaleId });
                });
            } else {
                return res.json({ Status: 1, Message: 'Sale created successfully', SaleID: newSaleId });
            }
        });
    },

    updateSale: (req, res) => {
        const { SaleID, SaleName, Description, DiscountType, DiscountValue, StartDate, EndDate, Status } = req.body;
        if (!SaleID) {
            return res.status(400).json({ Status: 0, Message: 'SaleID is required' });
        }

        const updateQuery = `
            UPDATE Sales 
            SET SaleName = COALESCE(?, SaleName),
                Description = COALESCE(?, Description),
                DiscountType = COALESCE(?, DiscountType),
                DiscountValue = COALESCE(?, DiscountValue),
                StartDate = COALESCE(?, StartDate),
                EndDate = COALESCE(?, EndDate),
                Status = COALESCE(?, Status),
                UpdatedAt = NOW()
            WHERE SaleID = ?
        `;
        const values = [
            SaleName || null,
            Description !== undefined ? Description : null,
            DiscountType || null,
            DiscountValue !== undefined ? parseFloat(DiscountValue) : null,
            StartDate ? moment.utc(StartDate).format('YYYY-MM-DD HH:mm:ss') : null,
            EndDate ? moment.utc(EndDate).format('YYYY-MM-DD HH:mm:ss') : null,
            Status !== undefined ? Status : null,
            SaleID
        ];

        pool.query(updateQuery, values, (err, result) => {
            if (err) {
                console.error('Error updating sale:', err);
                return res.status(500).json({ Status: 0, Message: 'Error updating sale' });
            }
            // A product list in the request replaces the sale's products.
            const rows = saleRows(SaleID, req.body);
            if (!rows) return res.json({ Status: 1, Message: 'Sale updated successfully' });
            pool.query('DELETE FROM SaleItems WHERE SaleID = ?', [SaleID], (delErr) => {
                if (delErr || !rows.length) return res.json({ Status: delErr ? 0 : 1, Message: delErr ? 'Error updating products' : 'Sale updated successfully' });
                pool.query('INSERT INTO SaleItems (SaleID, ProductID, CategoryID, MaxQtyPerOrder) VALUES ?', [rows], (insErr) => (
                    res.json({ Status: insErr ? 0 : 1, Message: insErr ? 'Error updating products' : 'Sale updated successfully' })));
            });
        });
    },

    deleteSale: (req, res) => {
        const saleId = req.params.id || req.body.SaleID;
        if (!saleId) {
            return res.status(400).json({ Status: 0, Message: 'SaleID is required' });
        }

        // Delete items first then sale
        pool.query("DELETE FROM SaleItems WHERE SaleID = ?", [saleId], (itemErr) => {
            pool.query("DELETE FROM Sales WHERE SaleID = ?", [saleId], (err, result) => {
                if (err) {
                    console.error('Error deleting sale:', err);
                    return res.status(500).json({ Status: 0, Message: 'Error deleting sale' });
                }
                return res.json({ Status: 1, Message: 'Sale deleted successfully' });
            });
        });
    },

    addSaleItems: (req, res) => {
        const { SaleID } = req.body;
        const itemValues = SaleID ? saleRows(SaleID, req.body) : null;
        if (!itemValues || itemValues.length === 0) {
            return res.status(400).json({ Status: 0, Message: 'SaleID and products are required' });
        }
        const insertQuery = `INSERT INTO SaleItems (SaleID, ProductID, CategoryID, MaxQtyPerOrder) VALUES ?`;
        pool.query(insertQuery, [itemValues], (err, result) => {
            if (err) {
                console.error('Error adding sale items:', err);
                return res.status(500).json({ Status: 0, Message: 'Error adding items to sale' });
            }
            return res.json({ Status: 1, Message: 'Items added to sale successfully', AddedCount: result.affectedRows });
        });
    },

    // Products to pick from when building a sale: photo, unit, MRP and offer price.
    saleCatalog: (req, res) => {
        pool.query(
            `SELECT p.ProductID, p.ProductName, p.ProductImages, v.VariantID, v.Price AS MRP, v.OfferPrice,
                    CONCAT(v.metricvalue, ' ', v.metrictype) AS Unit, v.AvailableQty
               FROM Products p
               JOIN ProductVariants v ON v.VariantID = (SELECT MIN(v2.VariantID) FROM ProductVariants v2 WHERE v2.ProductID = p.ProductID AND v2.status = 1)
              WHERE p.Status = 1
              ORDER BY p.ProductName`,
            (err, rows) => {
                if (err) {
                    console.error('Error loading sale catalogue:', err);
                    return res.status(500).json({ Status: 0, Message: 'Could not load products' });
                }
                return res.json({ Status: 1, Products: rows.map((r) => ({ ...r, ProductImages: undefined, Image: firstImage(r.ProductImages) })) });
            });
    },

    // Units per order at the sale price for one product in a sale (0 = no limit).
    setItemLimit: (req, res) => {
        const id = parseInt(req.body && req.body.SaleItemID, 10);
        const limit = parseInt(req.body && req.body.MaxQtyPerOrder, 10);
        if (!(id > 0) || !(limit >= 0 && limit <= 100)) {
            return res.status(400).json({ Status: 0, Message: 'Limit must be between 0 and 100 (0 = no limit)' });
        }
        pool.query('UPDATE SaleItems SET MaxQtyPerOrder = ? WHERE SaleItemID = ?', [limit, id], (err, r) => (
            err ? res.status(500).json({ Status: 0, Message: 'Could not save the limit' })
                : res.json({ Status: r.affectedRows ? 1 : 0, Message: r.affectedRows ? 'Limit saved' : 'Sale product not found' })));
    },

    removeSaleItem: (req, res) => {
        const saleItemId = req.params.id || req.body.SaleItemID;
        if (!saleItemId) {
            return res.status(400).json({ Status: 0, Message: 'SaleItemID is required' });
        }

        pool.query("DELETE FROM SaleItems WHERE SaleItemID = ?", [saleItemId], (err, result) => {
            if (err) {
                console.error('Error removing sale item:', err);
                return res.status(500).json({ Status: 0, Message: 'Error removing item from sale' });
            }
            return res.json({ Status: 1, Message: 'Item removed from sale' });
        });
    },

    getProductSale: (req, res) => {
        const productId = req.params.productId || req.query.ProductID;
        if (!productId) {
            return res.status(400).json({ Status: 0, Message: 'ProductID is required' });
        }

        const query = `
            SELECT si.SaleItemID, si.SaleID, si.ProductID,
                   s.SaleName, s.Description, s.DiscountType, s.DiscountValue,
                   s.StartDate, s.EndDate, s.Status,
                   s.CreatedAt AS SaleCreatedAt
            FROM SaleItems si
            JOIN Sales s ON si.SaleID = s.SaleID
            WHERE si.ProductID = ?
            ORDER BY s.CreatedAt DESC
        `;
        pool.query(query, [productId], (err, rows) => {
            if (err) {
                console.error('Error fetching product sale:', err);
                return res.status(500).json({ Status: 0, Message: 'Error fetching product sale information' });
            }
            return res.json({
                Status: 1,
                ProductID: parseInt(productId, 10),
                Sales: rows || [],
                CurrentSale: rows && rows.length > 0 ? rows[0] : null
            });
        });
    },

    assignProductToSale: (req, res) => {
        const { SaleID, ProductID } = req.body;
        if (!SaleID || !ProductID) {
            return res.status(400).json({ Status: 0, Message: 'SaleID and ProductID are required' });
        }

        const pId = parseInt(ProductID, 10);
        const sId = parseInt(SaleID, 10);

        pool.query("SELECT * FROM SaleItems WHERE SaleID = ? AND ProductID = ?", [sId, pId], (checkErr, existing) => {
            if (checkErr) {
                console.error('Error checking sale item:', checkErr);
                return res.status(500).json({ Status: 0, Message: 'Database error' });
            }

            if (existing && existing.length > 0) {
                return res.json({
                    Status: 1,
                    Message: 'Product is already assigned to this sale',
                    SaleItemID: existing[0].SaleItemID
                });
            }

            pool.query("INSERT INTO SaleItems (SaleID, ProductID) VALUES (?, ?)", [sId, pId], (insErr, result) => {
                if (insErr) {
                    console.error('Error assigning product to sale:', insErr);
                    return res.status(500).json({ Status: 0, Message: 'Error assigning product to sale' });
                }
                return res.json({
                    Status: 1,
                    Message: 'Product assigned to flash sale successfully',
                    SaleItemID: result.insertId
                });
            });
        });
    },

    removeProductFromSale: (req, res) => {
        const { SaleID, ProductID, SaleItemID } = req.body;
        if (!SaleItemID && (!SaleID || !ProductID)) {
            return res.status(400).json({ Status: 0, Message: 'Either SaleItemID or both SaleID and ProductID are required' });
        }

        let deleteQuery = "DELETE FROM SaleItems WHERE ";
        const params = [];
        if (SaleItemID) {
            deleteQuery += "SaleItemID = ?";
            params.push(SaleItemID);
        } else {
            deleteQuery += "SaleID = ? AND ProductID = ?";
            params.push(parseInt(SaleID, 10), parseInt(ProductID, 10));
        }

        pool.query(deleteQuery, params, (err, result) => {
            if (err) {
                console.error('Error removing product from sale:', err);
                return res.status(500).json({ Status: 0, Message: 'Error removing product from sale' });
            }
            return res.json({
                Status: 1,
                Message: 'Product removed from flash sale successfully',
                AffectedRows: result.affectedRows
            });
        });
    }
};

module.exports = SalesController;
