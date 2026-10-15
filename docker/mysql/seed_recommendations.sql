USE `clikgett-dev`;

INSERT INTO Products (ProductID, ProductName, Description, CategoryID, SubCategoryID, Status, Type, ImageUrl, ProductImages)
VALUES 
(83, 'Cow Fresh Milk 500ml', 'Pure farm fresh cow milk with balanced cream.', 1, 1, 1, 1, 'cow_milk_500ml.png', '["cow_milk_500ml.png"]'),
(84, 'Toned Fresh Milk 1L', 'Healthy toned pasteurized milk for daily wellness.', 1, 1, 1, 1, 'toned_milk_1l.png', '["toned_milk_1l.png"]'),
(85, 'Organic Buffalo Milk 1L', 'Rich and creamy pure buffalo milk pouch.', 1, 1, 1, 1, 'buffalo_milk_1l.png', '["buffalo_milk_1l.png"]'),
(86, 'Fresh Malai Paneer 200g', 'Soft and fresh malai paneer block for curry & snacks.', 1, 2, 1, 1, 'paneer_200g.png', '["paneer_200g.png"]'),
(87, 'Pure Cow Ghee 500ml', 'Traditional bilona method pure cow ghee.', 1, 2, 1, 1, 'cow_ghee_500ml.png', '["cow_ghee_500ml.png"]'),
(88, 'Salted Table Butter 100g', 'Delicious salted creamy butter block.', 1, 2, 1, 1, 'butter_100g.png', '["butter_100g.png"]'),
(89, 'Fresh Red Onions 1kg', 'Crisp pungent red onions sourced directly from farms.', 2, 3, 1, 1, 'onions_1kg.png', '["onions_1kg.png"]'),
(90, 'Farm Fresh Potatoes 1kg', 'Premium quality round golden potatoes.', 2, 3, 1, 1, 'potatoes_1kg.png', '["potatoes_1kg.png"]'),
(91, 'Organic Forest Honey 250g', 'Raw unprocessed multi-floral forest honey jar.', 3, NULL, 1, 1, 'honey_250g.png', '["honey_250g.png"]')
ON DUPLICATE KEY UPDATE ProductName = VALUES(ProductName), CategoryID = VALUES(CategoryID), SubCategoryID = VALUES(SubCategoryID), Status = VALUES(Status);

INSERT INTO ProductVariants (VariantID, ProductID, metrictype, metricvalue, Price, OfferPrice, AvailableQty, maxQty, status)
VALUES
(831, 83, 'ml', '500', 34.00, 30.00, 40, 10, 1),
(841, 84, 'L', '1', 58.00, 54.00, 35, 10, 1),
(851, 85, 'L', '1', 78.00, 72.00, 20, 10, 1),
(861, 86, 'g', '200', 95.00, 85.00, 25, 10, 1),
(871, 87, 'ml', '500', 350.00, 320.00, 15, 5, 1),
(881, 88, 'g', '100', 55.00, 50.00, 50, 10, 1),
(891, 89, 'kg', '1', 40.00, 35.00, 60, 10, 1),
(901, 90, 'kg', '1', 35.00, 30.00, 80, 10, 1),
(911, 91, 'g', '250', 180.00, 165.00, 10, 5, 1)
ON DUPLICATE KEY UPDATE Price = VALUES(Price), OfferPrice = VALUES(OfferPrice), AvailableQty = VALUES(AvailableQty);
