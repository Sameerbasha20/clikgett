const pool = require('../utils/db');

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

const CashbackAdminController = {
    // List pending cashbacks for manual review
    getPendingCashback: async (req, res) => {
        try {
            const sql = `
                SELECT cp.*, u.FirstName, u.LastName, u.MobileNumber, o.GrandTotal as OrderTotal, o.CreatedAt as OrderDate
                FROM CashbackPending cp
                JOIN Users u ON cp.UserID = u.UserID
                JOIN Orders o ON cp.OrderID = o.OrderID
                WHERE cp.Status = 'pending'
                ORDER BY cp.CreatedAt DESC
            `;
            const rows = await queryAsync(sql);
            const list = rows || [];
            return res.json({ Status: 1, status: 1, PendingCashback: list, Pending: list, data: list });
        } catch (err) {
            console.error("Error fetching pending cashback:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error fetching pending cashback", message: "Error fetching pending cashback" });
        }
    },

    // Approve a pending cashback and credit user wallet
    approveCashback: async (req, res) => {
        try {
            const { CashbackPendingID, PendingID } = req.body;
            const targetID = CashbackPendingID || PendingID;
            const AdminID = req.AdminID || null;

            if (!targetID) {
                return res.status(400).json({ Status: 0, status: 0, Message: "CashbackPendingID is required", message: "CashbackPendingID is required" });
            }

            const pendingRows = await queryAsync("SELECT * FROM CashbackPending WHERE CashbackPendingID = ? AND Status = 'pending'", [targetID]);
            if (!pendingRows || pendingRows.length === 0) {
                return res.status(404).json({ Status: 0, status: 0, Message: "Pending cashback record not found or already processed", message: "Pending cashback record not found or already processed" });
            }

            const item = pendingRows[0];
            const amount = parseFloat(item.CashbackAmount);

            // 1. Mark approved
            await queryAsync("UPDATE CashbackPending SET Status = 'approved', AdminID = ?, ApprovedAt = NOW() WHERE CashbackPendingID = ?", [AdminID, targetID]);

            // 2. Record in Wallets ledger
            const desc = `Cashback approved by Admin for order #${item.OrderID}`;
            await queryAsync(`
                INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, CreatedAt)
                VALUES (?, ?, 1, 4, ?, ?, NOW())
            `, [item.UserID, amount, item.OrderID, desc]);

            // 3. Update Users WalletAmount
            await queryAsync("UPDATE Users SET WalletAmount = COALESCE(WalletAmount, 0) + ? WHERE UserID = ?", [amount, item.UserID]);

            return res.json({
                Status: 1,
                status: 1,
                Message: `Successfully credited ₹${amount.toFixed(2)} cashback to user wallet`,
                message: `Successfully credited ₹${amount.toFixed(2)} cashback to user wallet`
            });
        } catch (err) {
            console.error("Error approving cashback:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error approving cashback", message: "Error approving cashback" });
        }
    },

    // Reject a pending cashback
    rejectCashback: async (req, res) => {
        try {
            const { CashbackPendingID, PendingID, Reason } = req.body;
            const targetID = CashbackPendingID || PendingID;
            const AdminID = req.AdminID || null;

            await queryAsync("UPDATE CashbackPending SET Status = 'rejected', AdminID = ?, ApprovedAt = NOW() WHERE CashbackPendingID = ?", [AdminID, targetID]);
            return res.json({ Status: 1, status: 1, Message: "Cashback request rejected", message: "Cashback request rejected" });
        } catch (err) {
            console.error("Error rejecting cashback:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error rejecting cashback", message: "Error rejecting cashback" });
        }
    }
};

module.exports = CashbackAdminController;
