-- insert membership
INSERT INTO "Membership" (
    name,
    deduct_rate,
    deduct_limit,
)
VALUES
    ('Standard', 0.1, 100),
    ('Premium', 0.15, 100);


-- insert product category
INSERT INTO "ProductCategory" (
    name, description
)
VALUES
    ('keycap', 'Keycaps to decorate your keyboards.'),
    ('clothes', 'Includes a variety of styles, each with unique designs and materials suited for different occasions and climates.');
    ('book', 'A collection of written, printed, or illustrated pages bound together, typically offering knowledge, stories, or information on various subjects.');

-- insert products (some products for example)
INSERT INTO "Product" (
    name,
    description,
    price,
    inventory_quantity,
    reorder_point,
    category_id,
    image_url
)
VALUES
    ('Cute Capybara', 'MiFuny Cute Capybara Keycap 3D Artisan Keyboard Caps Customized Original Resin KeyCap for Mechanical.', 10, 200, 50, <keycap category>, 'https://i.pinimg.com/736x/83/b1/f9/83b1f93f5a535f04f792d2d9a3035764.jpg'),
    ('The Art of SQL by Stephane Faroult', 'This is another great SQL book for an experienced developer who touches key areas of database and SQL like designing a database for high performance.
', 2, 200, 20, <book category>, 'https://i.pinimg.com/736x/83/b1/f9/83b1f93f5a535f04f792d2d9a3035764.jpg'),
    ('Volcom Ramp Stone Hat - Black', 'Experience the perfect blend of casual style and comfort with the Volcom Ramp Stone Adjustable Hat. Crafted with 100% premium cotton, this hat is designed to elevate your everyday look while ensuring all-day comfort.', 5, 1000, 100, <hat category>, 'https://www.beartrax.co.uk/images/products/D/D5/d5542302_blk_f_217ca621-5e83-4b59-91a9-8d3e73c88f25_1188x1584_crop_center.webp?width=1998&height=1998&quality=85&mode=pad&format=webp&bgcolor=ffffff'),

INSERT INTO "User" (
    name,
    phone,
    email,
    authority_group,
    department,
    position,
    password
)
VALUES
    ('employee 1', '0123456789', 'employee1@gmail.com', 'employee', 'Department 1', 'employee', crypt('1', gen_salt('bf', 10))),
    ('Thanh', '0123456789', 'thanh@gmail.com', DEFAULT, null, null, crypt('1', gen_salt('bf', 10))),
    ('Lam', '0123456789', 'lam@gmail.com', DEFAULT, null, null, crypt('1', gen_salt('bf', 10)));

    