const pool = require('../utils/db');

// Helper to execute query using pool
function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

// Helper to get connection for transactions
function getConnectionAsync() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) return reject(err);
            resolve(conn);
        });
    });
}

// Helper to execute query on a transaction connection
function connQueryAsync(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

const VALID_SECTION_TYPES = [
    'shop_by_category',
    'category_shelf',
    'subcategory_shelf',
    'selected_products',
    'bestsellers',
    'recommendations',
    'deals_and_offers',
    'promotional_banner',
    'order_again'
];

const AdminHomeSectionsController = {
    // 1. Get all sections with statistics, filtering, search, and pagination
    getAllSections: async (req, res) => {
        try {
            const {
                search,
                status,
                sectionType,
                sortBy = 'DisplayOrder',
                sortOrder = 'ASC',
                page,
                limit
            } = req.query;

            // 1.1 Calculate statistics metrics
            const statsRows = await queryAsync(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Status = 1 AND (StartDate IS NULL OR StartDate <= NOW()) AND (EndDate IS NULL OR EndDate >= NOW()) THEN 1 ELSE 0 END) as published,
                    SUM(CASE WHEN Status = 0 THEN 1 ELSE 0 END) as draft,
                    SUM(CASE WHEN Status = 2 OR (Status = 1 AND StartDate > NOW()) THEN 1 ELSE 0 END) as scheduled,
                    SUM(CASE WHEN Status = 3 OR (Status = 1 AND EndDate < NOW()) THEN 1 ELSE 0 END) as inactive
                FROM HomepageSections
            `);

            const counts = {
                total: (statsRows[0] && statsRows[0].total) || 0,
                published: (statsRows[0] && statsRows[0].published) || 0,
                draft: (statsRows[0] && statsRows[0].draft) || 0,
                scheduled: (statsRows[0] && statsRows[0].scheduled) || 0,
                inactive: (statsRows[0] && statsRows[0].inactive) || 0
            };

            // 1.2 Build WHERE clauses
            const whereConditions = [];
            const queryParams = [];

            if (search && search.trim()) {
                whereConditions.push('(hs.Name LIKE ? OR hs.Description LIKE ?)');
                const searchTerm = `%${search.trim()}%`;
                queryParams.push(searchTerm, searchTerm);
            }

            if (status !== undefined && status !== '' && status !== 'all') {
                const s = parseInt(status, 10);
                if (s === 1) {
                    // Published & currently active
                    whereConditions.push('hs.Status = 1 AND (hs.StartDate IS NULL OR hs.StartDate <= NOW()) AND (hs.EndDate IS NULL OR hs.EndDate >= NOW())');
                } else if (s === 0) {
                    // Draft
                    whereConditions.push('hs.Status = 0');
                } else if (s === 2) {
                    // Scheduled (future)
                    whereConditions.push('(hs.Status = 2 OR (hs.Status = 1 AND hs.StartDate > NOW()))');
                } else if (s === 3) {
                    // Inactive / Expired
                    whereConditions.push('(hs.Status = 3 OR (hs.Status = 1 AND hs.EndDate < NOW()))');
                } else {
                    whereConditions.push('hs.Status = ?');
                    queryParams.push(s);
                }
            }

            if (sectionType && sectionType !== 'all') {
                whereConditions.push('hs.SectionType = ?');
                queryParams.push(sectionType);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // Allowed sort fields
            const allowedSorts = {
                'displayorder': 'hs.DisplayOrder',
                'name': 'hs.Name',
                'title': 'hs.Name',
                'created_at': 'hs.created_at',
                'status': 'hs.Status'
            };
            const sortField = allowedSorts[(sortBy || '').toLowerCase()] || 'hs.DisplayOrder';
            const sortDir = (sortOrder || '').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            let paginationClause = '';
            if (page && limit && parseInt(limit, 10) > 0) {
                const p = Math.max(1, parseInt(page, 10));
                const l = parseInt(limit, 10);
                const offset = (p - 1) * l;
                paginationClause = `LIMIT ${offset}, ${l}`;
            }

            const sectionsSql = `
                SELECT hs.*, 
                       (SELECT COUNT(*) FROM HomeSectionProducts hsp WHERE hsp.HomeSectionID = hs.HomeSectionID) as ProductCount,
                       (SELECT COUNT(*) FROM HomeSectionCategories hsc WHERE hsc.HomeSectionID = hs.HomeSectionID) as CategoryCount
                FROM HomepageSections hs
                ${whereClause}
                ORDER BY ${sortField} ${sortDir}, hs.created_at DESC
                ${paginationClause}
            `;

            const sections = await queryAsync(sectionsSql, queryParams);

            // Fetch associated products and categories for each section
            for (const section of sections) {
                // Compatibility aliases
                section.Title = section.Name;
                section.Subtitle = section.Description;
                section.SectionID = section.HomeSectionID;

                // Parse ConfigurationJSON safely
                if (typeof section.ConfigurationJSON === 'string') {
                    try {
                        section.Configuration = JSON.parse(section.ConfigurationJSON);
                    } catch (e) {
                        section.Configuration = {};
                    }
                } else {
                    section.Configuration = section.ConfigurationJSON || {};
                }

                // Determine effective status badge (e.g. is it live, upcoming, expired, or draft)
                const now = new Date();
                const start = section.StartDate ? new Date(section.StartDate) : null;
                const end = section.EndDate ? new Date(section.EndDate) : null;

                if (section.Status === 0) {
                    section.computedStatus = 'draft';
                } else if (end && end < now) {
                    section.computedStatus = 'expired';
                } else if (start && start > now) {
                    section.computedStatus = 'scheduled';
                } else if (section.Status === 1) {
                    section.computedStatus = 'published';
                } else {
                    section.computedStatus = 'inactive';
                }

                // Associated products
                const products = await queryAsync(`
                    SELECT p.ProductID, p.ProductName, p.ImageUrl, p.ProductImages, p.Status as ProductStatus,
                           MIN(pv.Price) as Price, MIN(pv.OfferPrice) as OfferPrice, SUM(COALESCE(pv.AvailableQty, 0)) as AvailableQty,
                           hsp.DisplayOrder as ItemOrder
                    FROM HomeSectionProducts hsp
                    JOIN Products p ON hsp.ProductID = p.ProductID
                    LEFT JOIN ProductVariants pv ON p.ProductID = pv.ProductID AND pv.status = 1
                    WHERE hsp.HomeSectionID = ?
                    GROUP BY p.ProductID, p.ProductName, p.ImageUrl, p.ProductImages, p.Status, hsp.id, hsp.DisplayOrder
                    ORDER BY hsp.DisplayOrder ASC, hsp.id ASC
                `, [section.HomeSectionID]);
                section.Products = products || [];
                section.ProductIds = (products || []).map(p => p.ProductID);

                // Associated categories
                const categories = await queryAsync(`
                    SELECT c.CategoryID, c.CategoryName, c.CategoryImage, c.ImageUrl, c.Status as CategoryStatus,
                           hsc.DisplayOrder as ItemOrder
                    FROM HomeSectionCategories hsc
                    JOIN Categories c ON hsc.CategoryID = c.CategoryID
                    WHERE hsc.HomeSectionID = ?
                    ORDER BY hsc.DisplayOrder ASC, hsc.id ASC
                `, [section.HomeSectionID]);
                section.Categories = categories || [];
                section.CategoryIds = (categories || []).map(c => c.CategoryID);

                // Associated subcategories
                const subcategories = await queryAsync(`
                    SELECT s.SubCategoryID, s.SubCategoryName, s.CategoryID, s.Status as SubCategoryStatus,
                           hss.DisplayOrder as ItemOrder
                    FROM HomeSectionSubcategories hss
                    JOIN SubCategories s ON hss.SubCategoryID = s.SubCategoryID
                    WHERE hss.HomeSectionID = ?
                    ORDER BY hss.DisplayOrder ASC, hss.id ASC
                `, [section.HomeSectionID]);
                section.Subcategories = subcategories || [];
                section.SubCategoryIds = (subcategories || []).map(s => s.SubCategoryID);
            }

            return res.json({
                Status: 1,
                status: 1,
                counts,
                Sections: sections,
                data: sections,
                total: counts.total
            });
        } catch (err) {
            console.error("Error fetching home sections:", err);
            return res.status(500).json({
                Status: 0,
                status: 0,
                Message: "Error fetching home sections",
                message: err.message
            });
        }
    },

    // 2. Get single section details
    getSectionById: async (req, res) => {
        try {
            const sectionId = req.params.SectionID || req.params.id;
            const rows = await queryAsync("SELECT * FROM HomepageSections WHERE HomeSectionID = ?", [sectionId]);
            if (!rows || rows.length === 0) {
                return res.status(404).json({ Status: 0, status: 0, Message: "Section not found", message: "Section not found" });
            }

            const section = rows[0];
            section.Title = section.Name;
            section.Subtitle = section.Description;
            section.SectionID = section.HomeSectionID;

            if (typeof section.ConfigurationJSON === 'string') {
                try {
                    section.Configuration = JSON.parse(section.ConfigurationJSON);
                } catch (e) {
                    section.Configuration = {};
                }
            } else {
                section.Configuration = section.ConfigurationJSON || {};
            }

            // Products
            const products = await queryAsync(`
                SELECT p.ProductID, p.ProductName, p.ImageUrl, p.ProductImages, p.Status as ProductStatus,
                       MIN(pv.Price) as Price, MIN(pv.OfferPrice) as OfferPrice, SUM(COALESCE(pv.AvailableQty, 0)) as AvailableQty,
                       hsp.DisplayOrder as ItemOrder
                FROM HomeSectionProducts hsp
                JOIN Products p ON hsp.ProductID = p.ProductID
                LEFT JOIN ProductVariants pv ON p.ProductID = pv.ProductID AND pv.status = 1
                WHERE hsp.HomeSectionID = ?
                GROUP BY p.ProductID, p.ProductName, p.ImageUrl, p.ProductImages, p.Status, hsp.id, hsp.DisplayOrder
                ORDER BY hsp.DisplayOrder ASC, hsp.id ASC
            `, [sectionId]);
            section.Products = products || [];
            section.ProductIds = (products || []).map(p => p.ProductID);

            // Categories
            const categories = await queryAsync(`
                SELECT c.CategoryID, c.CategoryName, c.CategoryImage, c.ImageUrl, c.Status as CategoryStatus,
                       hsc.DisplayOrder as ItemOrder
                FROM HomeSectionCategories hsc
                JOIN Categories c ON hsc.CategoryID = c.CategoryID
                WHERE hsc.HomeSectionID = ?
                ORDER BY hsc.DisplayOrder ASC, hsc.id ASC
            `, [sectionId]);
            section.Categories = categories || [];
            section.CategoryIds = (categories || []).map(c => c.CategoryID);

            // Subcategories
            const subcategories = await queryAsync(`
                SELECT s.SubCategoryID, s.SubCategoryName, s.CategoryID, s.Status as SubCategoryStatus,
                       hss.DisplayOrder as ItemOrder
                FROM HomeSectionSubcategories hss
                JOIN SubCategories s ON hss.SubCategoryID = s.SubCategoryID
                WHERE hss.HomeSectionID = ?
                ORDER BY hss.DisplayOrder ASC, hss.id ASC
            `, [sectionId]);
            section.Subcategories = subcategories || [];
            section.SubCategoryIds = (subcategories || []).map(s => s.SubCategoryID);

            return res.json({ Status: 1, status: 1, Section: section, data: section });
        } catch (err) {
            console.error("Error getting section details:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error getting section details", message: err.message });
        }
    },

    // 3. Create a new section (with atomic transaction)
    createSection: async (req, res) => {
        let conn;
        try {
            const {
                Name,
                Title,
                Description,
                Subtitle,
                ImageUrl,
                StartDate,
                EndDate,
                DisplayOrder,
                Status,
                SectionType,
                ConfigurationJSON,
                Configuration,
                ProductIDs,
                ProductIds,
                CategoryIDs,
                CategoryIds,
                SubCategoryIDs,
                SubCategoryIds
            } = req.body;

            const sectionName = (Title || Name || '').trim();
            if (!sectionName) {
                return res.status(400).json({ Status: 0, status: 0, Message: "Section title is required", message: "Section title is required" });
            }

            // Validate date range if both provided
            if (StartDate && EndDate && new Date(StartDate) > new Date(EndDate)) {
                return res.status(400).json({ Status: 0, status: 0, Message: "Start date must be before or equal to End date", message: "Start date must be before or equal to End date" });
            }

            const rawType = (SectionType || 'selected_products').trim().toLowerCase();
            const validatedType = VALID_SECTION_TYPES.includes(rawType) ? rawType : 'selected_products';

            const sectionDescription = (Subtitle !== undefined ? Subtitle : Description) || null;
            const statusVal = Status !== undefined ? parseInt(Status, 10) : 1;
            const displayOrderVal = DisplayOrder !== undefined ? parseInt(DisplayOrder, 10) : 0;

            let configStr = null;
            if (ConfigurationJSON && typeof ConfigurationJSON === 'string') {
                configStr = ConfigurationJSON;
            } else if (Configuration || ConfigurationJSON) {
                configStr = JSON.stringify(Configuration || ConfigurationJSON);
            }

            conn = await getConnectionAsync();
            await new Promise((resolve, reject) => conn.beginTransaction(err => err ? reject(err) : resolve()));

            const insertSql = `
                INSERT INTO HomepageSections 
                (Name, Description, ImageUrl, StartDate, EndDate, DisplayOrder, Status, SectionType, ConfigurationJSON, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            const result = await connQueryAsync(conn, insertSql, [
                sectionName,
                sectionDescription,
                ImageUrl || null,
                StartDate || null,
                EndDate || null,
                displayOrderVal,
                statusVal,
                validatedType,
                configStr
            ]);

            const sectionId = result.insertId;

            // Associate products with display order
            const pids = ProductIds || ProductIDs || [];
            if (Array.isArray(pids) && pids.length > 0) {
                for (let i = 0; i < pids.length; i++) {
                    const item = pids[i];
                    const pid = typeof item === 'object' && item !== null ? item.ProductID : item;
                    const order = typeof item === 'object' && item !== null && item.DisplayOrder !== undefined ? item.DisplayOrder : i + 1;
                    if (pid) {
                        await connQueryAsync(conn, `
                            INSERT INTO HomeSectionProducts (HomeSectionID, ProductID, DisplayOrder, created_at)
                            VALUES (?, ?, ?, NOW())
                        `, [sectionId, pid, order]);
                    }
                }
            }

            // Associate categories with display order
            const cids = CategoryIds || CategoryIDs || [];
            if (Array.isArray(cids) && cids.length > 0) {
                for (let i = 0; i < cids.length; i++) {
                    const item = cids[i];
                    const cid = typeof item === 'object' && item !== null ? item.CategoryID : item;
                    const order = typeof item === 'object' && item !== null && item.DisplayOrder !== undefined ? item.DisplayOrder : i + 1;
                    if (cid) {
                        await connQueryAsync(conn, `
                            INSERT INTO HomeSectionCategories (HomeSectionID, CategoryID, DisplayOrder, created_at)
                            VALUES (?, ?, ?, NOW())
                        `, [sectionId, cid, order]);
                    }
                }
            }

            // Associate subcategories with display order
            const sids = SubCategoryIds || SubCategoryIDs || [];
            if (Array.isArray(sids) && sids.length > 0) {
                for (let i = 0; i < sids.length; i++) {
                    const item = sids[i];
                    const sid = typeof item === 'object' && item !== null ? item.SubCategoryID : item;
                    const order = typeof item === 'object' && item !== null && item.DisplayOrder !== undefined ? item.DisplayOrder : i + 1;
                    if (sid) {
                        await connQueryAsync(conn, `
                            INSERT INTO HomeSectionSubcategories (HomeSectionID, SubCategoryID, DisplayOrder, created_at)
                            VALUES (?, ?, ?, NOW())
                        `, [sectionId, sid, order]);
                    }
                }
            }

            await new Promise((resolve, reject) => conn.commit(err => err ? reject(err) : resolve()));

            return res.json({
                Status: 1,
                status: 1,
                Message: "Home section created successfully",
                message: "Home section created successfully",
                HomeSectionID: sectionId,
                SectionID: sectionId
            });
        } catch (err) {
            if (conn) {
                await new Promise(resolve => conn.rollback(() => resolve()));
            }
            console.error("Error creating home section:", err);
            return res.status(500).json({
                Status: 0,
                status: 0,
                Message: "Error creating home section",
                message: err.message
            });
        } finally {
            if (conn) conn.release();
        }
    },

    // 4. Update an existing section (with atomic transaction)
    updateSection: async (req, res) => {
        let conn;
        try {
            const sectionId = req.params.SectionID || req.params.id || req.body.HomeSectionID || req.body.SectionID;
            if (!sectionId) {
                return res.status(400).json({ Status: 0, status: 0, Message: "Section ID is required", message: "Section ID is required" });
            }

            const {
                Name,
                Title,
                Description,
                Subtitle,
                ImageUrl,
                StartDate,
                EndDate,
                DisplayOrder,
                Status,
                SectionType,
                ConfigurationJSON,
                Configuration,
                ProductIDs,
                ProductIds,
                CategoryIDs,
                CategoryIds,
                SubCategoryIDs,
                SubCategoryIds
            } = req.body;

            const sectionName = (Title || Name || '').trim();
            if (!sectionName) {
                return res.status(400).json({ Status: 0, status: 0, Message: "Section title is required", message: "Section title is required" });
            }

            if (StartDate && EndDate && new Date(StartDate) > new Date(EndDate)) {
                return res.status(400).json({ Status: 0, status: 0, Message: "Start date must be before or equal to End date", message: "Start date must be before or equal to End date" });
            }

            const rawType = (SectionType || 'selected_products').trim().toLowerCase();
            const validatedType = VALID_SECTION_TYPES.includes(rawType) ? rawType : 'selected_products';

            const sectionDescription = (Subtitle !== undefined ? Subtitle : Description) || null;
            const statusVal = Status !== undefined ? parseInt(Status, 10) : 1;
            const displayOrderVal = DisplayOrder !== undefined ? parseInt(DisplayOrder, 10) : 0;

            let configStr = null;
            if (ConfigurationJSON && typeof ConfigurationJSON === 'string') {
                configStr = ConfigurationJSON;
            } else if (Configuration || ConfigurationJSON) {
                configStr = JSON.stringify(Configuration || ConfigurationJSON);
            }

            conn = await getConnectionAsync();
            await new Promise((resolve, reject) => conn.beginTransaction(err => err ? reject(err) : resolve()));

            const updateSql = `
                UPDATE HomepageSections
                SET Name = ?, Description = ?, ImageUrl = ?, StartDate = ?, EndDate = ?, 
                    DisplayOrder = ?, Status = ?, SectionType = ?, ConfigurationJSON = ?, updated_at = NOW()
                WHERE HomeSectionID = ?
            `;
            await connQueryAsync(conn, updateSql, [
                sectionName,
                sectionDescription,
                ImageUrl || null,
                StartDate || null,
                EndDate || null,
                displayOrderVal,
                statusVal,
                validatedType,
                configStr,
                sectionId
            ]);

            // Sync Products if supplied in request
            const pids = ProductIds || ProductIDs;
            if (Array.isArray(pids)) {
                await connQueryAsync(conn, "DELETE FROM HomeSectionProducts WHERE HomeSectionID = ?", [sectionId]);
                for (let i = 0; i < pids.length; i++) {
                    const item = pids[i];
                    const pid = typeof item === 'object' && item !== null ? item.ProductID : item;
                    const order = typeof item === 'object' && item !== null && item.DisplayOrder !== undefined ? item.DisplayOrder : i + 1;
                    if (pid) {
                        await connQueryAsync(conn, `
                            INSERT INTO HomeSectionProducts (HomeSectionID, ProductID, DisplayOrder, created_at)
                            VALUES (?, ?, ?, NOW())
                        `, [sectionId, pid, order]);
                    }
                }
            }

            // Sync Categories if supplied in request
            const cids = CategoryIds || CategoryIDs;
            if (Array.isArray(cids)) {
                await connQueryAsync(conn, "DELETE FROM HomeSectionCategories WHERE HomeSectionID = ?", [sectionId]);
                for (let i = 0; i < cids.length; i++) {
                    const item = cids[i];
                    const cid = typeof item === 'object' && item !== null ? item.CategoryID : item;
                    const order = typeof item === 'object' && item !== null && item.DisplayOrder !== undefined ? item.DisplayOrder : i + 1;
                    if (cid) {
                        await connQueryAsync(conn, `
                            INSERT INTO HomeSectionCategories (HomeSectionID, CategoryID, DisplayOrder, created_at)
                            VALUES (?, ?, ?, NOW())
                        `, [sectionId, cid, order]);
                    }
                }
            }

            // Sync Subcategories if supplied in request
            const sids = SubCategoryIds || SubCategoryIDs;
            if (Array.isArray(sids)) {
                await connQueryAsync(conn, "DELETE FROM HomeSectionSubcategories WHERE HomeSectionID = ?", [sectionId]);
                for (let i = 0; i < sids.length; i++) {
                    const item = sids[i];
                    const sid = typeof item === 'object' && item !== null ? item.SubCategoryID : item;
                    const order = typeof item === 'object' && item !== null && item.DisplayOrder !== undefined ? item.DisplayOrder : i + 1;
                    if (sid) {
                        await connQueryAsync(conn, `
                            INSERT INTO HomeSectionSubcategories (HomeSectionID, SubCategoryID, DisplayOrder, created_at)
                            VALUES (?, ?, ?, NOW())
                        `, [sectionId, sid, order]);
                    }
                }
            }

            await new Promise((resolve, reject) => conn.commit(err => err ? reject(err) : resolve()));

            return res.json({
                Status: 1,
                status: 1,
                Message: "Home section updated successfully",
                message: "Home section updated successfully"
            });
        } catch (err) {
            if (conn) {
                await new Promise(resolve => conn.rollback(() => resolve()));
            }
            console.error("Error updating home section:", err);
            return res.status(500).json({
                Status: 0,
                status: 0,
                Message: "Error updating home section",
                message: err.message
            });
        } finally {
            if (conn) conn.release();
        }
    },

    // 5. Batch Reorder Sections
    reorderSections: async (req, res) => {
        let conn;
        try {
            const { sections, orders } = req.body;
            const items = sections || orders;

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ Status: 0, status: 0, Message: "Array of sections with orders required", message: "Array of sections with orders required" });
            }

            conn = await getConnectionAsync();
            await new Promise((resolve, reject) => conn.beginTransaction(err => err ? reject(err) : resolve()));

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const sectionId = item.HomeSectionID || item.SectionID || item.id;
                const displayOrder = item.DisplayOrder !== undefined ? item.DisplayOrder : (i + 1);

                if (sectionId) {
                    await connQueryAsync(conn, `
                        UPDATE HomepageSections
                        SET DisplayOrder = ?, updated_at = NOW()
                        WHERE HomeSectionID = ?
                    `, [displayOrder, sectionId]);
                }
            }

            await new Promise((resolve, reject) => conn.commit(err => err ? reject(err) : resolve()));

            return res.json({
                Status: 1,
                status: 1,
                Message: "Sections reordered successfully",
                message: "Sections reordered successfully"
            });
        } catch (err) {
            if (conn) {
                await new Promise(resolve => conn.rollback(() => resolve()));
            }
            console.error("Error reordering sections:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error reordering sections", message: err.message });
        } finally {
            if (conn) conn.release();
        }
    },

    // 6. Duplicate Section
    duplicateSection: async (req, res) => {
        let conn;
        try {
            const sectionId = req.params.SectionID || req.params.id;
            const existingRows = await queryAsync("SELECT * FROM HomepageSections WHERE HomeSectionID = ?", [sectionId]);

            if (!existingRows || existingRows.length === 0) {
                return res.status(404).json({ Status: 0, status: 0, Message: "Section not found to duplicate", message: "Section not found to duplicate" });
            }

            const src = existingRows[0];
            const newName = `${src.Name} (Copy)`;

            // Get maximum display order
            const maxOrderRows = await queryAsync("SELECT MAX(DisplayOrder) as maxOrder FROM HomepageSections");
            const nextOrder = ((maxOrderRows[0] && maxOrderRows[0].maxOrder) || 0) + 1;

            conn = await getConnectionAsync();
            await new Promise((resolve, reject) => conn.beginTransaction(err => err ? reject(err) : resolve()));

            const insertSql = `
                INSERT INTO HomepageSections 
                (Name, Description, ImageUrl, StartDate, EndDate, DisplayOrder, Status, SectionType, ConfigurationJSON, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NOW(), NOW())
            `;
            const result = await connQueryAsync(conn, insertSql, [
                newName,
                src.Description,
                src.ImageUrl,
                src.StartDate,
                src.EndDate,
                nextOrder,
                src.SectionType || 'selected_products',
                src.ConfigurationJSON
            ]);

            const newSectionId = result.insertId;

            // Copy products
            const products = await connQueryAsync(conn, "SELECT ProductID, DisplayOrder FROM HomeSectionProducts WHERE HomeSectionID = ?", [sectionId]);
            for (const p of products) {
                await connQueryAsync(conn, `
                    INSERT INTO HomeSectionProducts (HomeSectionID, ProductID, DisplayOrder, created_at)
                    VALUES (?, ?, ?, NOW())
                `, [newSectionId, p.ProductID, p.DisplayOrder]);
            }

            // Copy categories
            const categories = await connQueryAsync(conn, "SELECT CategoryID, DisplayOrder FROM HomeSectionCategories WHERE HomeSectionID = ?", [sectionId]);
            for (const c of categories) {
                await connQueryAsync(conn, `
                    INSERT INTO HomeSectionCategories (HomeSectionID, CategoryID, DisplayOrder, created_at)
                    VALUES (?, ?, ?, NOW())
                `, [newSectionId, c.CategoryID, c.DisplayOrder]);
            }

            // Copy subcategories
            const subcategories = await connQueryAsync(conn, "SELECT SubCategoryID, DisplayOrder FROM HomeSectionSubcategories WHERE HomeSectionID = ?", [sectionId]);
            for (const s of subcategories) {
                await connQueryAsync(conn, `
                    INSERT INTO HomeSectionSubcategories (HomeSectionID, SubCategoryID, DisplayOrder, created_at)
                    VALUES (?, ?, ?, NOW())
                `, [newSectionId, s.SubCategoryID, s.DisplayOrder]);
            }

            await new Promise((resolve, reject) => conn.commit(err => err ? reject(err) : resolve()));

            return res.json({
                Status: 1,
                status: 1,
                Message: "Section duplicated as draft successfully",
                message: "Section duplicated as draft successfully",
                HomeSectionID: newSectionId,
                SectionID: newSectionId
            });
        } catch (err) {
            if (conn) {
                await new Promise(resolve => conn.rollback(() => resolve()));
            }
            console.error("Error duplicating section:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error duplicating section", message: err.message });
        } finally {
            if (conn) conn.release();
        }
    },

    // 7. Toggle / Update Status (Publish / Unpublish)
    updateStatus: async (req, res) => {
        try {
            const sectionId = req.params.SectionID || req.params.id;
            const { Status, status } = req.body;
            let targetStatus = Status !== undefined ? Status : status;

            if (targetStatus === undefined) {
                // If not specified, toggle between 1 and 0
                const cur = await queryAsync("SELECT Status FROM HomepageSections WHERE HomeSectionID = ?", [sectionId]);
                if (!cur || cur.length === 0) {
                    return res.status(404).json({ Status: 0, status: 0, Message: "Section not found", message: "Section not found" });
                }
                targetStatus = cur[0].Status === 1 ? 0 : 1;
            } else {
                targetStatus = parseInt(targetStatus, 10);
            }

            await queryAsync("UPDATE HomepageSections SET Status = ?, updated_at = NOW() WHERE HomeSectionID = ?", [targetStatus, sectionId]);

            return res.json({
                Status: 1,
                status: 1,
                Message: `Section status updated to ${targetStatus === 1 ? 'Published' : (targetStatus === 0 ? 'Draft' : 'Inactive')}`,
                message: `Section status updated successfully`,
                newStatus: targetStatus
            });
        } catch (err) {
            console.error("Error updating section status:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error updating section status", message: err.message });
        }
    },

    // 8. Delete a section safely
    deleteSection: async (req, res) => {
        let conn;
        try {
            const sectionId = req.params.SectionID || req.params.id;

            const checkBuiltIn = await queryAsync("SELECT IsBuiltIn, SystemKey, Name FROM HomepageSections WHERE HomeSectionID = ?", [sectionId]);
            if (checkBuiltIn.length > 0 && (checkBuiltIn[0].IsBuiltIn === 1 || checkBuiltIn[0].SystemKey)) {
                return res.status(400).json({
                    Status: 0,
                    status: 0,
                    Message: `Built-in section '${checkBuiltIn[0].Name}' cannot be deleted. You can unpublish or hide this section instead.`,
                    message: `Built-in section '${checkBuiltIn[0].Name}' cannot be deleted. You can unpublish or hide this section instead.`
                });
            }

            conn = await getConnectionAsync();
            await new Promise((resolve, reject) => conn.beginTransaction(err => err ? reject(err) : resolve()));

            await connQueryAsync(conn, "DELETE FROM HomeSectionProducts WHERE HomeSectionID = ?", [sectionId]);
            await connQueryAsync(conn, "DELETE FROM HomeSectionCategories WHERE HomeSectionID = ?", [sectionId]);
            await connQueryAsync(conn, "DELETE FROM HomeSectionSubcategories WHERE HomeSectionID = ?", [sectionId]);
            await connQueryAsync(conn, "DELETE FROM HomepageSections WHERE HomeSectionID = ?", [sectionId]);

            await new Promise((resolve, reject) => conn.commit(err => err ? reject(err) : resolve()));

            return res.json({
                Status: 1,
                status: 1,
                Message: "Home section deleted successfully",
                message: "Home section deleted successfully"
            });
        } catch (err) {
            if (conn) {
                await new Promise(resolve => conn.rollback(() => resolve()));
            }
            console.error("Error deleting home section:", err);
            return res.status(500).json({
                Status: 0,
                status: 0,
                Message: "Error deleting home section",
                message: err.message
            });
        } finally {
            if (conn) conn.release();
        }
    },

    // 9. Get Category and Subcategory options for the selector
    getCategoryOptions: async (req, res) => {
        try {
            const categories = await queryAsync(`
                SELECT CategoryID, CategoryName, CategoryImage, ImageUrl, Status
                FROM Categories
                WHERE Status = 1
                ORDER BY CategoryName ASC
            `);

            const subcategories = await queryAsync(`
                SELECT SubCategoryID, SubCategoryName, CategoryID, Status
                FROM SubCategories
                WHERE Status = 1
                ORDER BY SubCategoryName ASC
            `);

            return res.json({
                Status: 1,
                status: 1,
                Categories: categories || [],
                SubCategories: subcategories || []
            });
        } catch (err) {
            console.error("Error fetching category options:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error fetching category options", message: err.message });
        }
    },

    // 10. Search and filter Products for selector
    getProductOptions: async (req, res) => {
        try {
            const { search, categoryId, subCategoryId, limit = 100, page = 1 } = req.query;
            const where = ['p.Status = 1'];
            const params = [];

            if (search && search.trim()) {
                where.push('(p.ProductName LIKE ? OR p.ProductID = ?)');
                params.push(`%${search.trim()}%`, search.trim());
            }

            if (categoryId) {
                where.push('p.CategoryID = ?');
                params.push(categoryId);
            }

            if (subCategoryId) {
                where.push('p.SubCategoryID = ?');
                params.push(subCategoryId);
            }

            const l = Math.min(200, Math.max(1, parseInt(limit, 10)));
            const offset = (Math.max(1, parseInt(page, 10)) - 1) * l;

            const products = await queryAsync(`
                SELECT p.ProductID, p.ProductName, p.CategoryID, p.SubCategoryID, p.ImageUrl, p.ProductImages,
                       c.CategoryName,
                       MIN(pv.Price) as Price, MIN(pv.OfferPrice) as OfferPrice, SUM(COALESCE(pv.AvailableQty, 0)) as AvailableQty,
                       MAX(pv.metrictype) as metrictype, MAX(pv.metricvalue) as metricvalue
                FROM Products p
                LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
                LEFT JOIN ProductVariants pv ON p.ProductID = pv.ProductID AND pv.status = 1
                WHERE ${where.join(' AND ')}
                GROUP BY p.ProductID, p.ProductName, p.CategoryID, p.SubCategoryID, p.ImageUrl, p.ProductImages, c.CategoryName
                ORDER BY p.ProductName ASC
                LIMIT ${offset}, ${l}
            `, params);

            return res.json({
                Status: 1,
                status: 1,
                Products: products || []
            });
        } catch (err) {
            console.error("Error fetching product options:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error fetching product options", message: err.message });
        }
    }
};

module.exports = AdminHomeSectionsController;
