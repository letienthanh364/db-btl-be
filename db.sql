
INSERT INTO `Order` (OrderID, UserID, CustomerName, CustomerPhone, CustomerEmail, Province, District, Commune, Address, HousingType, TotalAmount, TotalFee, TotalDiscount)
VALUES ('order-uuid', 'user-uuid', 'assessment', 'gu@gmail.com', '328355333', 'Bắc Kạn', 'Ba Bể', 'Phúc Lộc', '37 tân hòa 2', 'nhà riêng', 150.00, 10.00, 5.00);

SET @ProductID = (
    SELECT ProductID 
    FROM Product
    WHERE ProductName = `KAPPA Women's Sneakers`
      AND Size = 36
      AND Color = 'yellow'
    LIMIT 1
);

INSERT INTO OrderDetail (OrderID, ProductID, Quantity, UnitPrice)
VALUES (
    'order-uuid',
    @ProductID,
    5, 
    980000 
);

UPDATE ProductInStore
SET InventoryQuantity = InventoryQuantity - 5 
WHERE ProductID = @ProductID;


-- c --

SELECT 
    DATE_FORMAT(o.created_at, '%Y-%m') AS Month, 
    AVG(od.TotalPrice) AS AverageOrderValue     
FROM 
    `Order` o
JOIN 
    OrderDetail od ON o.OrderID = od.OrderID
WHERE 
    YEAR(o.created_at) = YEAR(CURDATE())         
    AND o.deleted_at IS NULL                     
GROUP BY 
    DATE_FORMAT(o.created_at, '%Y-%m')           
ORDER BY 
    Month;


-- d --

WITH Customers_Prior6Months AS (
    SELECT DISTINCT o.UserID
    FROM `Order` o
    WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      AND o.created_at < DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      AND o.deleted_at IS NULL
),
Customers_Last6Months AS (
    SELECT DISTINCT o.UserID
    FROM `Order` o
    WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      AND o.deleted_at IS NULL
)
SELECT 
    COUNT(p.UserID) AS ChurnedCustomers, 
    (COUNT(p.UserID) / COUNT(*) OVER ()) * 100 AS ChurnRate
FROM Customers_Prior6Months p
LEFT JOIN Customers_Last6Months l 
    ON p.UserID = l.UserID
WHERE l.UserID IS NULL;  

{
    "success": true,
    "data": [
        {
            "categoryID": "uuid-1",
            "categoryName": "Electronics",
            "description": "Electronic gadgets and accessories"
        },
        {
            "categoryID": "uuid-2",
            "categoryName": "Clothing",
            "description": "Men and Women Clothing"
        }
    ]
}

{
    "success": true,
    "data": [
        {
            "productID": "uuid-10",
            "productName": "Wireless Mouse",
            "price": 29.99,
            "description": "Ergonomic wireless mouse",
            "categoryID": "uuid-1"
        },
        {
            "productID": "uuid-11",
            "productName": "Mechanical Keyboard",
            "price": 89.99,
            "description": "RGB mechanical keyboard",
            "categoryID": "uuid-1"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "pageSize": 10
    }
}

{
    "success": true,
    "data": [
        {
            "productID": "uuid-15",
            "productName": "Red Hoodie",
            "price": 49.99,
            "color": "Red",
            "size": "M",
            "categoryID": "uuid-2",
            "description": "Comfortable cotton hoodie"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 2,
        "pageSize": 10
    }
}

{
    "userID": "uuid-user-1",
    "orderDetails": [
        {
            "productID": "uuid-10",
            "quantity": 2
        },
        {
            "productID": "uuid-11",
            "quantity": 1
        }
    ],
    "shippingAddress": {
        "province": "New York",
        "city": "NYC",
        "address": "123 Main Street"
    },
    "payment": {
        "currency": "USD",
        "paymentMethod": "Credit Card",
        "amount": 149.97
    }
}

{
    "success": true,
    "orderID": "uuid-order-1",
    "message": "Order created and payment processed successfully."
}


{
    "success": true,
    "message": "Order confirmation email message."
}
