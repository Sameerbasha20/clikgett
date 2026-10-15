const pool = require('../server/utils/db');

async function check() {
    pool.query('SELECT CategoryID, CategoryName, Status FROM Categories', (e, categories) => {
        if (e) {
            console.error('Error fetching categories:', e);
            pool.end();
            return;
        }
        console.log('Categories:', categories);

        pool.query('SELECT SubCategoryID, SubCategoryName, CategoryID FROM SubCategories WHERE SubCategoryName LIKE "%fruit%" OR CategoryID IN (SELECT CategoryID FROM Categories WHERE CategoryName LIKE "%fruit%")', (e2, subcats) => {
            if (e2) console.error('Error fetching subcategories:', e2);
            else console.log('Fruit Subcategories:', subcats);

            pool.query('SELECT ProductID, ProductName, CategoryID, SubCategoryID FROM Products WHERE ProductName LIKE "%apple%" OR ProductName LIKE "%banana%" OR ProductName LIKE "%fruit%" LIMIT 10', (e3, products) => {
                if (e3) console.error('Error fetching products:', e3);
                else console.log('Sample Fruit Products:', products);
                pool.end();
            });
        });
    });
}
check();
