const pool = require('../utils/db');

const FormsController = {
    getCallbackForms: async (req, resp) => {
        try {
            pool.query("SELECT FormID, FormID AS ID, UserID, FullName, MobileNumber, PreferredTime, Subject, Message, Status, Notes, CreatedAt FROM CallBackForms ORDER BY CreatedAt DESC", (err, results) => {
                if (err) {
                    console.error("Error fetching callback forms:", err);
                    return resp.json({ Status: 1, CallBackForms: [], callBackForms: [] });
                }
                return resp.json({ Status: 1, CallBackForms: results || [], callBackForms: results || [] });
            });
        } catch (e) {
            return resp.json({ Status: 1, CallBackForms: [], callBackForms: [] });
        }
    },

    getCallbackById: async (req, resp) => {
        try {
            const id = req.params.id;
            pool.query("SELECT FormID, FormID AS ID, UserID, FullName, MobileNumber, PreferredTime, Subject, Message, Status, Notes, CreatedAt FROM CallBackForms WHERE FormID = ?", [id], (err, results) => {
                if (err || !results || results.length === 0) {
                    return resp.json({ Status: 1, CallBackForm: {}, callBackForm: {} });
                }
                return resp.json({ Status: 1, CallBackForm: results[0], callBackForm: results[0] });
            });
        } catch (e) {
            return resp.json({ Status: 1, CallBackForm: {}, callBackForm: {} });
        }
    },

    updateCallbackStatus: async (req, resp) => {
        try {
            const id = req.params.id || req.body.FormID || req.body.ID;
            const { Status, Notes } = req.body;
            pool.query("UPDATE CallBackForms SET Status = COALESCE(?, Status), Notes = COALESCE(?, Notes), UpdatedAt = NOW() WHERE FormID = ?", [Status, Notes, id], (err, result) => {
                if (err) {
                    console.error("Error updating callback form:", err);
                    return resp.status(500).json({ Status: 0, Message: "Error updating form" });
                }
                return resp.json({ Status: 1, Message: "Callback status updated successfully" });
            });
        } catch (e) {
            return resp.status(500).json({ Status: 0, Message: "Error updating form" });
        }
    },

    getFranchiseForms: async (req, resp) => {
        try {
            pool.query("SELECT FormID, FormID AS ID, FullName, MobileNumber, EmailID, City, State, InvestmentRange, Experience, Message, Status, Notes, CreatedAt FROM FranchiseEnquiryForms ORDER BY CreatedAt DESC", (err, results) => {
                if (err) {
                    console.error("Error fetching franchise forms:", err);
                    return resp.json({ Status: 1, FranchiseForms: [], franchiseEnquiries: [] });
                }
                return resp.json({ Status: 1, FranchiseForms: results || [], franchiseEnquiries: results || [] });
            });
        } catch (e) {
            return resp.json({ Status: 1, FranchiseForms: [], franchiseEnquiries: [] });
        }
    },

    getFranchiseById: async (req, resp) => {
        try {
            const id = req.params.id;
            pool.query("SELECT FormID, FormID AS ID, FullName, MobileNumber, EmailID, City, State, InvestmentRange, Experience, Message, Status, Notes, CreatedAt FROM FranchiseEnquiryForms WHERE FormID = ?", [id], (err, results) => {
                if (err || !results || results.length === 0) {
                    return resp.json({ Status: 1, FranchiseForm: {}, franchiseEnquiry: {} });
                }
                return resp.json({ Status: 1, FranchiseForm: results[0], franchiseEnquiry: results[0] });
            });
        } catch (e) {
            return resp.json({ Status: 1, FranchiseForm: {}, franchiseEnquiry: {} });
        }
    },

    updateFranchiseStatus: async (req, resp) => {
        try {
            const id = req.params.id || req.body.FormID || req.body.ID;
            const { Status, Notes } = req.body;
            pool.query("UPDATE FranchiseEnquiryForms SET Status = COALESCE(?, Status), Notes = COALESCE(?, Notes), UpdatedAt = NOW() WHERE FormID = ?", [Status, Notes, id], (err, result) => {
                if (err) {
                    console.error("Error updating franchise form:", err);
                    return resp.status(500).json({ Status: 0, Message: "Error updating form" });
                }
                return resp.json({ Status: 1, Message: "Franchise status updated successfully" });
            });
        } catch (e) {
            return resp.status(500).json({ Status: 0, Message: "Error updating form" });
        }
    },

    getAvailabilityForms: async (req, resp) => {
        try {
            pool.query("SELECT FormID, FormID AS ID, UserID, CustomerName, MobileNumber, ProductName, Pincode, Status, Notes, CreatedAt FROM AvailabilityForms ORDER BY CreatedAt DESC", (err, results) => {
                if (err) {
                    console.error("Error fetching availability forms:", err);
                    return resp.json({ Status: 1, AvailabilityForms: [], availabilityForms: [] });
                }
                return resp.json({ Status: 1, AvailabilityForms: results || [], availabilityForms: results || [] });
            });
        } catch (e) {
            return resp.json({ Status: 1, AvailabilityForms: [], availabilityForms: [] });
        }
    },

    getAvailabilityById: async (req, resp) => {
        try {
            const id = req.params.id;
            pool.query("SELECT FormID, FormID AS ID, UserID, CustomerName, MobileNumber, ProductName, Pincode, Status, Notes, CreatedAt FROM AvailabilityForms WHERE FormID = ?", [id], (err, results) => {
                if (err || !results || results.length === 0) {
                    return resp.json({ Status: 1, AvailabilityForm: {}, availabilityForm: {} });
                }
                return resp.json({ Status: 1, AvailabilityForm: results[0], availabilityForm: results[0] });
            });
        } catch (e) {
            return resp.json({ Status: 1, AvailabilityForm: {}, availabilityForm: {} });
        }
    },

    updateAvailabilityStatus: async (req, resp) => {
        try {
            const id = req.params.id || req.body.FormID || req.body.ID;
            const { Status, Notes } = req.body;
            pool.query("UPDATE AvailabilityForms SET Status = COALESCE(?, Status), Notes = COALESCE(?, Notes), UpdatedAt = NOW() WHERE FormID = ?", [Status, Notes, id], (err, result) => {
                if (err) {
                    console.error("Error updating availability form:", err);
                    return resp.status(500).json({ Status: 0, Message: "Error updating form" });
                }
                return resp.json({ Status: 1, Message: "Availability status updated successfully" });
            });
        } catch (e) {
            return resp.status(500).json({ Status: 0, Message: "Error updating form" });
        }
    }
};

module.exports = FormsController;
