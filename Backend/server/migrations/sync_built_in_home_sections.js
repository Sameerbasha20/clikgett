'use strict';

const mysql = require('mysql');

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'clikgett_user',
    password: process.env.DB_PASSWORD || process.env.PASSWORD || 'clikgett_dev_password',
    database: process.env.DB_NAME || process.env.db || 'clikgett-dev',
    charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function run() {
    console.log("=== Sync Built-In Home Sections Migration ===");
    console.log("Connecting to:", dbConfig.host, dbConfig.port, dbConfig.database, "as", dbConfig.user);

    // 1. Ensure SystemKey and IsBuiltIn columns exist
    const cols = await query("SHOW COLUMNS FROM HomepageSections LIKE 'SystemKey'");
    if (cols.length === 0) {
        console.log("Adding SystemKey column to HomepageSections...");
        await query("ALTER TABLE HomepageSections ADD COLUMN SystemKey VARCHAR(50) NULL UNIQUE AFTER SectionType");
    } else {
        console.log("SystemKey column already exists.");
    }

    const builtInCols = await query("SHOW COLUMNS FROM HomepageSections LIKE 'IsBuiltIn'");
    if (builtInCols.length === 0) {
        console.log("Adding IsBuiltIn column to HomepageSections...");
        await query("ALTER TABLE HomepageSections ADD COLUMN IsBuiltIn TINYINT(1) DEFAULT 0 AFTER SystemKey");
    } else {
        console.log("IsBuiltIn column already exists.");
    }

    // 2. Adjust orders for existing custom curated sections so built-ins can occupy 1-8
    await query("UPDATE HomepageSections SET DisplayOrder = 9, IsBuiltIn = 0 WHERE HomeSectionID = 1 AND (SystemKey IS NULL OR SystemKey = '')");
    await query("UPDATE HomepageSections SET DisplayOrder = 10, IsBuiltIn = 0 WHERE HomeSectionID = 2 AND (SystemKey IS NULL OR SystemKey = '')");
    await query("UPDATE HomepageSections SET DisplayOrder = 11, IsBuiltIn = 0 WHERE HomeSectionID = 3 AND (SystemKey IS NULL OR SystemKey = '')");

    // 3. Define the 8 authoritative built-in system sections
    const builtInSections = [
        {
            systemKey: 'hero_banners',
            name: 'Promotional Banners',
            description: 'Special promotions, bank offers, and discount carousel',
            sectionType: 'promotional_banner',
            displayOrder: 1,
            config: { theme: 'mint', badgeText: 'Offers' }
        },
        {
            systemKey: 'shop_by_category',
            name: 'Shop by Category',
            description: 'Explore curated grocery, snack, beverage and household categories',
            sectionType: 'shop_by_category',
            displayOrder: 2,
            config: { theme: 'white', viewAllLabel: 'View All Categories' }
        },
        {
            systemKey: 'bestsellers',
            name: 'Bestsellers',
            description: 'Most loved items frequently bought by our customers',
            sectionType: 'bestsellers',
            displayOrder: 3,
            config: { theme: 'white', badgeText: 'Top Seller' }
        },
        {
            systemKey: 'grocery_kitchen',
            name: 'Grocery & Kitchen',
            description: 'Fresh milk, daily vegetables, grains, and kitchen essentials',
            sectionType: 'category_shelf',
            displayOrder: 4,
            config: { theme: 'mint', icon: 'kitchen_rounded', viewAllLabel: 'See all' },
            categoryIds: [1, 2, 4, 5, 6, 7]
        },
        {
            systemKey: 'snacks_drinks',
            name: 'Snacks & Drinks',
            description: 'Crispy namkeen, cold beverages, chips and instant snacks',
            sectionType: 'category_shelf',
            displayOrder: 5,
            config: { theme: 'orange', icon: 'fastfood_rounded', viewAllLabel: 'See all' },
            categoryIds: [8, 9, 10, 11, 12]
        },
        {
            systemKey: 'deals_offers',
            name: 'Deals & Offers',
            description: 'Special markdown prices and limited-time flash discount offers',
            sectionType: 'deals_and_offers',
            displayOrder: 6,
            config: { theme: 'orange', badgeText: 'Save Big' }
        },
        {
            systemKey: 'recommended_for_you',
            name: 'Recommended for You',
            description: 'Personalized product recommendations based on shopping patterns',
            sectionType: 'recommendations',
            displayOrder: 7,
            config: { theme: 'lavender', badgeText: 'For You' }
        },
        {
            systemKey: 'order_again',
            name: 'Order Again',
            description: 'Quick one-tap repeat purchases from your recent order history',
            sectionType: 'order_again',
            displayOrder: 8,
            config: { theme: 'sky', badgeText: 'Repeat' }
        }
    ];

    for (const s of builtInSections) {
        const existing = await query("SELECT HomeSectionID FROM HomepageSections WHERE SystemKey = ?", [s.systemKey]);
        let sectionId;
        if (existing.length > 0) {
            sectionId = existing[0].HomeSectionID;
            console.log(`Updating built-in section '${s.name}' (ID: ${sectionId})...`);
            await query(
                `UPDATE HomepageSections SET 
                    Name = ?, 
                    Description = ?, 
                    SectionType = ?, 
                    DisplayOrder = ?, 
                    IsBuiltIn = 1, 
                    ConfigurationJSON = ? 
                WHERE HomeSectionID = ?`,
                [s.name, s.description, s.sectionType, s.displayOrder, JSON.stringify(s.config), sectionId]
            );
        } else {
            console.log(`Inserting built-in section '${s.name}'...`);
            const insRes = await query(
                `INSERT INTO HomepageSections 
                    (Name, Description, SectionType, SystemKey, IsBuiltIn, DisplayOrder, Status, ConfigurationJSON)
                VALUES (?, ?, ?, ?, 1, ?, 1, ?)`,
                [s.name, s.description, s.sectionType, s.systemKey, s.displayOrder, JSON.stringify(s.config)]
            );
            sectionId = insRes.insertId;
        }

        // Handle category associations if defined
        if (s.categoryIds && s.categoryIds.length > 0) {
            await query("DELETE FROM HomeSectionCategories WHERE HomeSectionID = ?", [sectionId]);
            for (let i = 0; i < s.categoryIds.length; i++) {
                await query(
                    "INSERT INTO HomeSectionCategories (HomeSectionID, CategoryID, DisplayOrder) VALUES (?, ?, ?)",
                    [sectionId, s.categoryIds[i], i + 1]
                );
            }
            console.log(`Associated ${s.categoryIds.length} categories with '${s.name}' (ID: ${sectionId})`);
        }
    }

    const allSections = await query("SELECT HomeSectionID, Name, SectionType, SystemKey, IsBuiltIn, DisplayOrder, Status FROM HomepageSections ORDER BY DisplayOrder ASC");
    console.log("\nAuthoritative Sections in Database:");
    console.table(allSections);

    pool.end();
    console.log("\nMigration completed successfully.");
}

run().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
