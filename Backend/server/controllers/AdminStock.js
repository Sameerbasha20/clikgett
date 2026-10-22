// Out-of-stock list for admin. Computed live from ProductVariants, so a pack
// disappears from it as soon as its stock goes above 0 (restock here, product
// editor, bulk upload or an order cancellation).
const pool = require('../utils/db');

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const AdminStock = {
    outOfStock: async (req, resp) => {
        try {
            const rows = await queryAsync(
                `SELECT V.VariantID, V.ProductID, P.ProductName, V.metricvalue, V.metrictype, V.Price, V.OfferPrice,
                        V.AvailableQty, V.UpdatedAt, C.CategoryName, S.SubCategoryName,
                        (SELECT COUNT(DISTINCT CI.CartID) FROM CartItems CI JOIN Carts CT ON CT.CartID = CI.CartID
                          WHERE CI.VariantID = V.VariantID AND CT.isOrderLinked = 1) AS InCarts,
                        (SELECT MAX(O.CreatedAt) FROM OrderItems OI JOIN Orders O ON O.OrderID = OI.OrderID
                          WHERE OI.VariantID = V.VariantID AND O.OrderStatus NOT IN (3,4)) AS LastSoldAt
                   FROM ProductVariants V
                   JOIN Products P ON P.ProductID = V.ProductID
                   LEFT JOIN Categories C ON C.CategoryID = P.CategoryID
                   LEFT JOIN SubCategories S ON S.SubCategoryID = P.SubCategoryID
                  WHERE V.status = 1 AND P.Status = 1 AND V.AvailableQty <= 0
                  ORDER BY InCarts DESC, LastSoldAt DESC, P.ProductName ASC`
            );
            return resp.json({ Status: 1, Count: rows.length, Items: rows });
        } catch (err) {
            console.log('out of stock list failed', err);
            return resp.status(500).json({ Status: 0, Message: 'Could not load out-of-stock products' });
        }
    },

    // PUT /adminproducts/restock/:VariantID { AvailableQty }
    restock: async (req, resp) => {
        try {
            const qty = parseInt(req.body && req.body.AvailableQty, 10);
            if (!(qty > 0) || qty > 100000) {
                return resp.status(400).json({ Status: 0, Message: 'Enter a stock quantity above 0' });
            }
            const result = await queryAsync(
                'UPDATE ProductVariants SET AvailableQty = ?, UpdatedAt = NOW() WHERE VariantID = ?',
                [qty, req.params.VariantID]
            );
            if (!result.affectedRows) return resp.status(404).json({ Status: 0, Message: 'Pack not found' });
            return resp.json({ Status: 1, Message: `Back in stock (${qty})` });
        } catch (err) {
            console.log('restock failed', err);
            return resp.status(500).json({ Status: 0, Message: 'Could not update stock' });
        }
    },
};

module.exports = AdminStock;
