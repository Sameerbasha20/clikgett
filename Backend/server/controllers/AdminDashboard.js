// Admin dashboard numbers and the new-order alert feed.
// Orders.CreatedAt is stored in UTC; "today" means the store's day (IST).
const moment = require('moment');
const pool = require('../utils/db');

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const istDayStartUtc = (daysAgo = 0) =>
    moment().utcOffset(330).startOf('day').subtract(daysAgo, 'days').utc().format('YYYY-MM-DD HH:mm:ss');

const money = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

const AdminDashboard = {
    summary: async (req, resp) => {
        try {
            const today = istDayStartUtc(0);
            const weekStart = istDayStartUtc(6);
            const [
                [todayRow], pipeline, [riders], lowStock, [photo], [requests], [enquiries], [refunds], daily,
            ] = await Promise.all([
                queryAsync(
                    `SELECT COUNT(*) AS Orders,
                            SUM(OrderStatus NOT IN (3,4,6)) AS ActiveOrDelivered,
                            SUM(OrderStatus = 1) AS Delivered,
                            SUM(OrderStatus IN (3,4)) AS Cancelled,
                            COALESCE(SUM(CASE WHEN OrderStatus NOT IN (3,4,6) THEN GrandTotal + WalletAmount ELSE 0 END), 0) AS Revenue,
                            COALESCE(AVG(CASE WHEN OrderStatus = 1 AND deliveredDateTime IS NOT NULL
                                THEN TIMESTAMPDIFF(MINUTE, CreatedAt, deliveredDateTime) END), 0) AS AvgDeliveryMinutes
                       FROM Orders WHERE CreatedAt >= ?`,
                    [today]
                ),
                queryAsync('SELECT OrderStatus, COUNT(*) AS n FROM Orders WHERE OrderStatus IN (8,9,2,5,7) GROUP BY OrderStatus'),
                queryAsync(
                    `SELECT SUM(DutyStatus IN ('ONLINE','ON_DELIVERY')) AS Online,
                            SUM(DutyStatus = 'ON_DELIVERY') AS OnDelivery,
                            COUNT(*) AS Total
                       FROM AdminUsers WHERE Role = 2 AND Status = 1`
                ),
                queryAsync(
                    `SELECT V.VariantID, V.ProductID, P.ProductName, V.metricvalue, V.metrictype, V.AvailableQty
                       FROM ProductVariants V JOIN Products P ON P.ProductID = V.ProductID
                      WHERE V.Status = 1 AND P.Status = 1 AND V.AvailableQty <= 5
                      ORDER BY V.AvailableQty ASC, P.ProductName LIMIT 50`
                ),
                queryAsync("SELECT COUNT(*) AS n FROM PhotoOrderRequests WHERE RequestStatus IN ('PENDING','UNDER_REVIEW','PROPOSAL_DRAFT')"),
                queryAsync("SELECT COUNT(*) AS n FROM ProductRequests WHERE LOWER(Status) = 'pending'"),
                queryAsync("SELECT COUNT(*) AS n FROM CustomerEnquiries WHERE LOWER(Status) NOT IN ('resolved','closed') AND IFNULL(Category, '') <> 'Product Request'"),
                queryAsync("SELECT COUNT(*) AS n FROM Orders WHERE RefundStatus = 'FAILED'"),
                queryAsync(
                    `SELECT DATE(CONVERT_TZ(CreatedAt, '+00:00', '+05:30')) AS Day,
                            COUNT(*) AS Orders,
                            COALESCE(SUM(CASE WHEN OrderStatus NOT IN (3,4,6) THEN GrandTotal + WalletAmount ELSE 0 END), 0) AS Revenue
                       FROM Orders WHERE CreatedAt >= ? GROUP BY Day ORDER BY Day`,
                    [weekStart]
                ),
            ]);

            const byStatus = {};
            pipeline.forEach((r) => { byStatus[r.OrderStatus] = Number(r.n) || 0; });
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const day = moment().utcOffset(330).subtract(i, 'days').format('YYYY-MM-DD');
                const row = daily.find((d) => moment(d.Day).format('YYYY-MM-DD') === day);
                days.push({ Day: day, Orders: row ? Number(row.Orders) : 0, Revenue: row ? money(row.Revenue) : 0 });
            }

            return resp.json({
                Status: 1,
                Today: {
                    Orders: Number(todayRow.Orders) || 0,
                    Delivered: Number(todayRow.Delivered) || 0,
                    Cancelled: Number(todayRow.Cancelled) || 0,
                    Revenue: money(todayRow.Revenue),
                    AvgOrderValue: todayRow.ActiveOrDelivered ? money(todayRow.Revenue / todayRow.ActiveOrDelivered) : 0,
                    AvgDeliveryMinutes: Math.round(parseFloat(todayRow.AvgDeliveryMinutes) || 0),
                },
                Pipeline: {
                    Received: byStatus[8] || 0,
                    Packing: byStatus[9] || 0,
                    Assigned: byStatus[2] || 0,
                    OutForDelivery: byStatus[5] || 0,
                    Arrived: byStatus[7] || 0,
                },
                Riders: {
                    Online: Number(riders.Online) || 0,
                    OnDelivery: Number(riders.OnDelivery) || 0,
                    Total: Number(riders.Total) || 0,
                },
                LowStock: lowStock,
                Pending: {
                    PhotoOrders: Number(photo.n) || 0,
                    ProductRequests: Number(requests.n) || 0,
                    Enquiries: Number(enquiries.n) || 0,
                    FailedRefunds: Number(refunds.n) || 0,
                },
                Last7Days: days,
            });
        } catch (err) {
            console.log('admin dashboard failed', err);
            return resp.status(500).json({ Status: 0, Message: 'Could not load the dashboard' });
        }
    },

    // GET /adminorders/new-since?after=<OrderID>: orders placed after the given order id.
    newSince: async (req, resp) => {
        try {
            const after = parseInt(req.query.after, 10);
            if (isNaN(after)) {
                const [latest] = await queryAsync('SELECT COALESCE(MAX(OrderID), 0) AS id FROM Orders');
                return resp.json({ Status: 1, LatestOrderID: Number(latest.id), Orders: [] });
            }
            const rows = await queryAsync(
                `SELECT O.OrderID, LPAD(O.OrderID, 4, '0') AS OrderSequence, O.GrandTotal, O.PaymentMethod, O.CreatedAt,
                        TRIM(CONCAT(IFNULL(U.FirstName, ''), ' ', IFNULL(U.LastName, ''))) AS CustomerName
                   FROM Orders O LEFT JOIN Users U ON U.UserID = O.UserID
                  WHERE O.OrderID > ? ORDER BY O.OrderID ASC LIMIT 20`,
                [after]
            );
            const latest = rows.length ? rows[rows.length - 1].OrderID : after;
            return resp.json({ Status: 1, LatestOrderID: latest, Orders: rows });
        } catch (err) {
            console.log('new-since failed', err);
            return resp.status(500).json({ Status: 0, Message: 'Could not check for new orders' });
        }
    },
};

module.exports = AdminDashboard;
