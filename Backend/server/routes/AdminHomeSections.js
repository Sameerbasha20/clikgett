const express = require('express');
const router = express.Router();
const AdminHomeSectionsController = require('../controllers/AdminHomeSections');
const util = require('../utils/utils');

router
    // Options & Lookups
    .get('/sections/category-options', util.authenticate.adminAuthenticate, AdminHomeSectionsController.getCategoryOptions)
    .get('/sections/product-options', util.authenticate.adminAuthenticate, AdminHomeSectionsController.getProductOptions)
    .get('/category-options', util.authenticate.adminAuthenticate, AdminHomeSectionsController.getCategoryOptions)
    .get('/product-options', util.authenticate.adminAuthenticate, AdminHomeSectionsController.getProductOptions)

    // Batch Reorder (MUST be before :SectionID)
    .put('/sections/reorder', util.authenticate.adminAuthenticate, AdminHomeSectionsController.reorderSections)
    .post('/sections/reorder', util.authenticate.adminAuthenticate, AdminHomeSectionsController.reorderSections)
    .put('/admin/reorder', util.authenticate.adminAuthenticate, AdminHomeSectionsController.reorderSections)
    .post('/admin/reorder', util.authenticate.adminAuthenticate, AdminHomeSectionsController.reorderSections)

    // Duplicate & Status toggles
    .post('/sections/:SectionID/duplicate', util.authenticate.adminAuthenticate, AdminHomeSectionsController.duplicateSection)
    .patch('/sections/:SectionID/status', util.authenticate.adminAuthenticate, AdminHomeSectionsController.updateStatus)
    .put('/sections/:SectionID/status', util.authenticate.adminAuthenticate, AdminHomeSectionsController.updateStatus)
    .post('/admin/:SectionID/duplicate', util.authenticate.adminAuthenticate, AdminHomeSectionsController.duplicateSection)
    .patch('/admin/:SectionID/status', util.authenticate.adminAuthenticate, AdminHomeSectionsController.updateStatus)
    .put('/admin/:SectionID/status', util.authenticate.adminAuthenticate, AdminHomeSectionsController.updateStatus)

    // Specific Section ID operations
    .get('/sections/:SectionID', util.authenticate.adminAuthenticate, AdminHomeSectionsController.getSectionById)
    .put('/sections/:SectionID', util.authenticate.adminAuthenticate, AdminHomeSectionsController.updateSection)
    .delete('/sections/:SectionID', util.authenticate.adminAuthenticate, AdminHomeSectionsController.deleteSection)
    .get('/admin/:SectionID', util.authenticate.adminAuthenticate, AdminHomeSectionsController.getSectionById)
    .put('/admin/:SectionID', util.authenticate.adminAuthenticate, AdminHomeSectionsController.updateSection)
    .delete('/admin/:SectionID', util.authenticate.adminAuthenticate, AdminHomeSectionsController.deleteSection)

    // Collection operations
    .get('/sections', util.authenticate.adminAuthenticate, AdminHomeSectionsController.getAllSections)
    .post('/sections', util.authenticate.adminAuthenticate, AdminHomeSectionsController.createSection)
    .get('/admin', util.authenticate.adminAuthenticate, AdminHomeSectionsController.getAllSections)
    .post('/admin', util.authenticate.adminAuthenticate, AdminHomeSectionsController.createSection);

module.exports = router;
