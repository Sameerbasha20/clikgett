-- =============================================================================
-- ClikGett Homepage Schema & Catalog Expansion
-- Creates HomepageSections, HomeSectionProducts, RecommendedProducts
-- Enhances Banners and Categories columns for compatibility
-- =============================================================================

USE `clikgett-dev`;

-- 1. RecommendedProducts Table
CREATE TABLE IF NOT EXISTS `RecommendedProducts` (
    `RecProductID` INT AUTO_INCREMENT PRIMARY KEY,
    `ProductID` BIGINT NOT NULL,
    `Status` INT DEFAULT 1,
    `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_rec_product` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. HomepageSections Table
CREATE TABLE IF NOT EXISTS `HomepageSections` (
    `HomeSectionID` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `ImageUrl` TEXT NULL,
    `StartDate` DATETIME NULL,
    `EndDate` DATETIME NULL,
    `DisplayOrder` INT DEFAULT 0,
    `Status` INT DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. HomeSectionProducts Table
CREATE TABLE IF NOT EXISTS `HomeSectionProducts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `HomeSectionID` INT NOT NULL,
    `ProductID` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_hs_section` (`HomeSectionID`),
    INDEX `idx_hs_product` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Active Promotional Banners
INSERT INTO `Banners` (`BannerID`, `BannerName`, `Description`, `BannerImage`, `ImageUrl`, `Status`, `DestinationType`, `DestinationID`)
VALUES 
(1, 'Super Milk & Breakfast Sale', 'Up to 25% off on morning dairy essentials', 'banner_dairy.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Banners/banner_dairy.png', 1, 'Category', 1),
(2, 'Crisp Farm Veggies & Fruits', 'Farm fresh, harvested daily, delivered in 10 mins', 'banner_veggies.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Banners/banner_veggies.png', 1, 'Category', 2),
(3, 'Tea Time Snacks & Beverages', 'Crunchy namkeens, cookies, and refreshing drinks', 'banner_snacks.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Banners/banner_snacks.png', 1, 'Category', 8)
ON DUPLICATE KEY UPDATE `Status` = 1, `BannerImage` = VALUES(`BannerImage`), `ImageUrl` = VALUES(`ImageUrl`), `BannerName` = VALUES(`BannerName`);

-- Seed Categories covering Grocery, Kitchen, Snacks, Drinks, Pantry
INSERT INTO `Categories` (`CategoryID`, `CategoryName`, `CategoryImage`, `ImageUrl`, `Status`, `Priority`)
VALUES 
(1, 'Dairy & Breakfast', 'dairy.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/dairy.png', 1, 1),
(2, 'Fruits & Vegetables', 'fruits.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/fruits.png', 1, 2),
(3, 'Groceries & Staples', 'groceries.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/groceries.png', 1, 3),
(4, 'Atta, Rice & Dal', 'atta_rice_dal.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/atta_rice_dal.png', 1, 4),
(5, 'Oil, Ghee & Masala', 'oil_masala.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/oil_masala.png', 1, 5),
(6, 'Bakery & Biscuits', 'bakery_biscuits.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/bakery_biscuits.png', 1, 6),
(7, 'Dry Fruits & Cereals', 'dry_fruits.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/dry_fruits.png', 1, 7),
(8, 'Chips & Namkeen', 'chips_namkeen.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/chips_namkeen.png', 1, 8),
(9, 'Sweets & Chocolates', 'sweets_chocolates.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/sweets_chocolates.png', 1, 9),
(10, 'Drinks & Juices', 'drinks_juices.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/drinks_juices.png', 1, 10),
(11, 'Tea & Coffee', 'tea_coffee.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/tea_coffee.png', 1, 11),
(12, 'Instant Food & Noodles', 'instant_food.png', 'https://d3c9kvg5gaqz48.cloudfront.net/Categories/instant_food.png', 1, 12)
ON DUPLICATE KEY UPDATE `Status` = 1, `CategoryName` = VALUES(`CategoryName`), `CategoryImage` = VALUES(`CategoryImage`), `ImageUrl` = VALUES(`ImageUrl`), `Priority` = VALUES(`Priority`);

-- Seed SubCategories
INSERT INTO `SubCategories` (`SubCategoryID`, `CategoryID`, `SubCategoryName`, `DisplayOrder`, `Status`)
VALUES 
(1, 1, 'Milk & Cream', 1, 1),
(2, 1, 'Butter & Ghee', 2, 1),
(3, 2, 'Fresh Vegetables', 1, 1),
(4, 4, 'Atta & Flours', 1, 1),
(5, 4, 'Rice & Grains', 2, 1),
(6, 5, 'Cooking Oils', 1, 1),
(7, 8, 'Potato Chips & Crisps', 1, 1),
(8, 10, 'Fruit Juices & Cold Drinks', 1, 1),
(9, 11, 'Tea & Coffee Leaves', 1, 1),
(10, 12, 'Instant Noodles & Pasta', 1, 1)
ON DUPLICATE KEY UPDATE `Status` = 1, `SubCategoryName` = VALUES(`SubCategoryName`);

-- Seed Complementary Products across sections
INSERT INTO `Products` (`ProductID`, `ProductName`, `Description`, `CategoryID`, `SubCategoryID`, `Status`, `Type`, `ImageUrl`, `ProductImages`)
VALUES 
-- Atta, Rice & Dal
(92, 'Aashirvaad Shudh Chakki Atta 5kg', '100% whole wheat chakki atta with natural fibers.', 4, 4, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/atta_5kg.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/atta_5kg.png"]'),
(93, 'Fortune Rozana Basmati Rice 1kg', 'Pristine fragrant aged basmati rice for daily meals.', 4, 5, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/basmati_1kg.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/basmati_1kg.png"]'),
(94, 'Tata Sampann Unpolished Toor Dal 1kg', 'Rich in protein unpolished toor dal grains.', 4, 5, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/toor_dal_1kg.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/toor_dal_1kg.png"]'),
-- Oil, Ghee & Masala
(95, 'Fortune Sunlite Refined Sunflower Oil 1L', 'Light and healthy sunflower oil enriched with vitamins.', 5, 6, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/sunflower_oil_1l.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/sunflower_oil_1l.png"]'),
-- Snacks & Drinks
(96, 'Lay''s India''s Magic Masala Chips 50g', 'Spicy rippled potato chips with zesty Indian spices.', 8, 7, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/lays_masala.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/lays_masala.png"]'),
(97, 'Kurkure Masala Munch 85g', 'Crispy crunchy corn & rice puffs with rich spices.', 8, 7, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/kurkure_munch.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/kurkure_munch.png"]'),
(98, 'Real Activ 100% Orange Fruit Juice 1L', 'No added sugar pure refreshing orange juice carton.', 10, 8, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/orange_juice_1l.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/orange_juice_1l.png"]'),
(99, 'Thums Up Charged Cold Drink 750ml', 'Strong sparkling fizzy soft drink bottle.', 10, 8, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/thums_up_750ml.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/thums_up_750ml.png"]'),
-- Tea, Coffee & Instant Food
(100, 'Taj Mahal Strong Leaf Tea 250g', 'Rich aroma premium crafted Assam tea blend.', 11, 9, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/taj_mahal_tea_250g.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/taj_mahal_tea_250g.png"]'),
(101, 'Maggi 2-Minute Masala Instant Noodles 280g', 'Classic Indian favorite instant noodles 4-pack.', 12, 10, 1, 1, 'https://d3c9kvg5gaqz48.cloudfront.net/Products/maggi_4pack.png', '["https://d3c9kvg5gaqz48.cloudfront.net/Products/maggi_4pack.png"]')
ON DUPLICATE KEY UPDATE `Status` = 1, `ProductName` = VALUES(`ProductName`);

-- Seed Product Variants
INSERT INTO `ProductVariants` (`VariantID`, `ProductID`, `metrictype`, `metricvalue`, `Price`, `OfferPrice`, `AvailableQty`, `maxQty`, `status`)
VALUES 
(921, 92, 'kg', '5', 260.00, 235.00, 45, 4, 1),
(931, 93, 'kg', '1', 110.00, 95.00, 60, 5, 1),
(941, 94, 'kg', '1', 165.00, 148.00, 50, 5, 1),
(951, 95, 'L', '1', 145.00, 130.00, 75, 6, 1),
(961, 96, 'g', '50', 20.00, 18.00, 120, 10, 1),
(971, 97, 'g', '85', 25.00, 22.00, 100, 10, 1),
(981, 98, 'L', '1', 135.00, 115.00, 40, 5, 1),
(991, 99, 'ml', '750', 45.00, 40.00, 80, 6, 1),
(1001, 100, 'g', '250', 170.00, 150.00, 50, 5, 1),
(1011, 101, 'g', '280', 56.00, 50.00, 150, 10, 1)
ON DUPLICATE KEY UPDATE `status` = 1, `Price` = VALUES(`Price`), `OfferPrice` = VALUES(`OfferPrice`), `AvailableQty` = VALUES(`AvailableQty`);

-- Seed Recommended Products (for Bestsellers / Recommended for You)
INSERT INTO `RecommendedProducts` (`ProductID`, `Status`)
VALUES 
(82, 1),
(83, 1),
(84, 1),
(86, 1),
(88, 1),
(89, 1),
(90, 1),
(92, 1),
(96, 1),
(101, 1)
ON DUPLICATE KEY UPDATE `Status` = 1;

-- Seed HomepageSections (Dynamic curated shopping shelves)
INSERT INTO `HomepageSections` (`HomeSectionID`, `Name`, `Description`, `ImageUrl`, `DisplayOrder`, `Status`)
VALUES 
(1, 'Daily Fresh Essentials', 'Farm fresh vegetables and pure morning dairy', 'https://d3c9kvg5gaqz48.cloudfront.net/Sections/daily_fresh.png', 1, 1),
(2, 'Snacks & Evening Munchies', 'Crispy chips, refreshing beverages and teas', 'https://d3c9kvg5gaqz48.cloudfront.net/Sections/snacks_munchies.png', 2, 1),
(3, 'Kitchen & Cooking Staples', 'Pure grains, aromatic basmati, and nutritious dals', 'https://d3c9kvg5gaqz48.cloudfront.net/Sections/cooking_staples.png', 3, 1)
ON DUPLICATE KEY UPDATE `Status` = 1, `Name` = VALUES(`Name`), `DisplayOrder` = VALUES(`DisplayOrder`);

-- Seed HomeSectionProducts
INSERT INTO `HomeSectionProducts` (`HomeSectionID`, `ProductID`)
VALUES 
(1, 82), (1, 83), (1, 86), (1, 89), (1, 90),
(2, 96), (2, 97), (2, 98), (2, 99), (2, 101),
(3, 92), (3, 93), (3, 94), (3, 95), (3, 87);
