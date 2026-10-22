const pool = require('../utils/db');

// Manual cashback review. With Cashback Mode = Manual (Settings), a delivered
// order's cashback waits in CashbackPending until an admin approves it (wallet
// credited) or rejects it (nothing credited). See CommonController.ProcessOrderCashback.

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

const fail = (res, code, message) => res.status(code).json({ Status: 0, status: 0, Message: message, message });
const ok = (res, message, extra = {}) => res.json({ Status: 1, status: 1, Message: message, message, ...extra });

const STATUSES = ['pending', 'approved', 'rejected'];

const CashbackAdminController = {
    // GET /cashback/pending?status=pending|approved|rejected (default pending)
    getPendingCashback: async (req, res) => {
        try {
            const status = STATUSES.includes(String(req.query.status)) ? String(req.query.status) : 'pending';
            const rows = await queryAsync(`
                SELECT cp.CashbackPendingID AS PendingID, cp.OrderID, cp.UserID, cp.CashbackAmount AS Amount,
                       cp.Status, cp.RejectReason AS Reason, cp.CreatedAt, cp.ApprovedAt AS ReviewedAt,
                       TRIM(CONCAT(IFNULL(u.FirstName, ''), ' ', IFNULL(u.LastName, ''))) AS UserName,
                       u.MobileNumber AS Mobile, o.GrandTotal AS OrderTotal, o.SubTotal AS OrderSubTotal,
                       o.OrderStatus, o.CreatedAt AS OrderDate, o.deliveredDateTime AS DeliveredAt,
                       TRIM(CONCAT(IFNULL(a.FirstName, ''), ' ', IFNULL(a.LastName, ''))) AS ReviewedBy
                  FROM CashbackPending cp
                  JOIN Users u ON cp.UserID = u.UserID
                  JOIN Orders o ON cp.OrderID = o.OrderID
                  LEFT JOIN AdminUsers a ON a.AdminID = cp.AdminID
                 WHERE cp.Status = ?
                 ORDER BY ${status === 'pending' ? 'cp.CreatedAt ASC' : 'cp.ApprovedAt DESC'}
                 LIMIT 200`, [status]);
            const list = (rows || []).map((r) => ({ ...r, Amount: parseFloat(r.Amount) }));
            const [counts] = await queryAsync(`
                SELECT SUM(Status = 'pending') AS Pending, SUM(Status = 'approved') AS Approved,
                       SUM(Status = 'rejected') AS Rejected,
                       IFNULL(SUM(CASE WHEN Status = 'pending' THEN CashbackAmount END), 0) AS PendingAmount
                  FROM CashbackPending`);
            const [mode] = await queryAsync('SELECT CashbackMode FROM AdminShopToggleSettings LIMIT 1');
            return ok(res, 'OK', {
                PendingCashback: list,
                Pending: list,
                data: list,
                Counts: {
                    Pending: Number(counts.Pending || 0),
                    Approved: Number(counts.Approved || 0),
                    Rejected: Number(counts.Rejected || 0),
                    PendingAmount: parseFloat(counts.PendingAmount || 0),
                },
                CashbackMode: (mode && mode.CashbackMode) || 'automatic',
            });
        } catch (err) {
            console.error('Error fetching pending cashback:', err);
            return fail(res, 500, 'Error fetching pending cashback');
        }
    },

    // POST /cashback/approve {PendingID}
    approveCashback: async (req, res) => {
        try {
            const targetID = req.body.CashbackPendingID || req.body.PendingID;
            if (!targetID) return fail(res, 400, 'PendingID is required');

            const [item] = await queryAsync(`
                SELECT cp.*, o.OrderStatus FROM CashbackPending cp JOIN Orders o ON o.OrderID = cp.OrderID
                 WHERE cp.CashbackPendingID = ?`, [targetID]);
            if (!item) return fail(res, 404, 'Cashback request not found');
            if (item.Status !== 'pending') return fail(res, 409, `This cashback was already ${item.Status}`);
            if (Number(item.OrderStatus) !== 1) {
                return fail(res, 409, `Order #${item.OrderID} is no longer delivered (cancelled or returned). Reject this cashback instead.`);
            }

            // Claim the row first so a double click or a second admin cannot credit twice.
            const claim = await queryAsync(
                "UPDATE CashbackPending SET Status = 'approved', AdminID = ?, ApprovedAt = NOW() WHERE CashbackPendingID = ? AND Status = 'pending'",
                [req.AdminID || null, targetID]
            );
            if (!claim.affectedRows) return fail(res, 409, 'This cashback was already reviewed');

            const amount = parseFloat(item.CashbackAmount);
            const [settings] = await queryAsync('SELECT CashbackExpiryDays FROM AdminShopToggleSettings LIMIT 1');
            const expiryDays = parseInt((settings && settings.CashbackExpiryDays) || 30, 10) || 30;
            await queryAsync(`
                INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, ExpiryDate, IsExpired, CreatedAt)
                VALUES (?, ?, 1, 4, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), 0, NOW())`,
                [item.UserID, amount, item.OrderID, `Cashback earned on Order #${item.OrderID}`, expiryDays]);
            await queryAsync('UPDATE Users SET WalletAmount = COALESCE(WalletAmount, 0) + ? WHERE UserID = ?', [amount, item.UserID]);

            try {
                const CommonController = require('./CommonController');
                await CommonController.Send_Notification({
                    Title: 'Cashback credited!',
                    Message: `₹${amount.toFixed(2)} cashback for Order #${item.OrderID} is now in your wallet. Use it within ${expiryDays} days.`,
                }, item.UserID);
            } catch (e) {
                console.error('Cashback approved but the notification failed:', e.message);
            }

            return ok(res, `₹${amount.toFixed(2)} credited to the customer's wallet`);
        } catch (err) {
            console.error('Error approving cashback:', err);
            return fail(res, 500, 'Error approving cashback');
        }
    },

    // POST /cashback/reject {PendingID, Reason}
    rejectCashback: async (req, res) => {
        try {
            const targetID = req.body.CashbackPendingID || req.body.PendingID;
            const reason = String(req.body.Reason || '').trim().slice(0, 255);
            if (!targetID) return fail(res, 400, 'PendingID is required');
            if (reason.length < 3) return fail(res, 400, 'Please give a reason for rejecting');

            const result = await queryAsync(
                "UPDATE CashbackPending SET Status = 'rejected', AdminID = ?, ApprovedAt = NOW(), RejectReason = ? WHERE CashbackPendingID = ? AND Status = 'pending'",
                [req.AdminID || null, reason, targetID]
            );
            if (!result.affectedRows) {
                const [item] = await queryAsync('SELECT Status FROM CashbackPending WHERE CashbackPendingID = ?', [targetID]);
                return item ? fail(res, 409, `This cashback was already ${item.Status}`) : fail(res, 404, 'Cashback request not found');
            }
            return ok(res, 'Cashback rejected. Nothing was credited.');
        } catch (err) {
            console.error('Error rejecting cashback:', err);
            return fail(res, 500, 'Error rejecting cashback');
        }
    },
};

module.exports = CashbackAdminController;
