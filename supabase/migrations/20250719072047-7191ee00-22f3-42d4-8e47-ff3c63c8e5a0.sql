-- First, clear order items that reference the old menu items
DELETE FROM order_items;

-- Clear existing orders to avoid reference issues  
DELETE FROM orders;

-- Now clear and update menu data
DELETE FROM menu_items;
DELETE FROM menu_categories;

-- Insert new categories for Maki Express Ramen House
INSERT INTO menu_categories (name, sort_order) VALUES 
('Appetizers', 1),
('Rice', 2),
('Ramen', 3),
('Soba & Udon', 4),
('Topping & Extra', 5);

-- Get the category IDs for inserting menu items
DO $$
DECLARE
    app_cat_id uuid;
    rice_cat_id uuid;
    ramen_cat_id uuid;
    noodle_cat_id uuid;
    topping_cat_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO app_cat_id FROM menu_categories WHERE name = 'Appetizers';
    SELECT id INTO rice_cat_id FROM menu_categories WHERE name = 'Rice';
    SELECT id INTO ramen_cat_id FROM menu_categories WHERE name = 'Ramen';
    SELECT id INTO noodle_cat_id FROM menu_categories WHERE name = 'Soba & Udon';
    SELECT id INTO topping_cat_id FROM menu_categories WHERE name = 'Topping & Extra';

    -- Insert Appetizers
    INSERT INTO menu_items (name, description, price_cents, category_id, is_available) VALUES
    ('House Salad', 'Fresh green salad with tomato and cucumber with sesame dressing', 400, app_cat_id, true),
    ('Edamame', 'Steamed soy beans with salt', 400, app_cat_id, true),
    ('Seaweed Salad', 'Marinated seaweed, served cold', 500, app_cat_id, true),
    ('Gyoza', 'Deep-fried or steamed pork dumpling', 500, app_cat_id, true),
    ('Shrimp Shumai', 'Deep-fried or steamed Japanese shrimp dumpling', 600, app_cat_id, true),
    ('Chicken Karaage', 'Japanese fried chicken', 600, app_cat_id, true),
    ('Yasai Korokke (Croquettes)', 'Mixed vegetable with mashed potato', 600, app_cat_id, true),
    ('Takoyaki', 'A ball shaped Japanese snack made of wheat flour base batter with octopus', 600, app_cat_id, true),
    ('Okonomiyaki', 'Japanese mixed seafood pizza', 750, app_cat_id, true),
    ('Soft Taco with Pork Belly (2 pieces)', 'Soft taco with pork belly', 600, app_cat_id, true),
    ('Onigiri', 'Choice of Salmon Teriyaki or Chicken karaage or Tuna Salad', 350, app_cat_id, true),
    ('Katsu Sando', 'Crispy and juicy chicken or pork cutlet sandwiched', 800, app_cat_id, true);

    -- Insert Rice dishes
    INSERT INTO menu_items (name, description, price_cents, category_id, is_available) VALUES
    ('Chicken Teriyaki', 'Served with stir-fried vegetables and steamed Japanese rice', 1000, rice_cat_id, true),
    ('Tofu Teriyaki', 'Served with stir-fried vegetables and steamed Japanese rice', 900, rice_cat_id, true),
    ('Salmon Teriyaki', 'Served with stir-fried vegetables and steamed Japanese rice', 1200, rice_cat_id, true),
    ('Unagi Don', 'Barbecue eel and sauce on top with rice', 1500, rice_cat_id, true),
    ('Japanese Katsu Curry - Chicken', 'Choice of Chicken or Pork', 1000, rice_cat_id, true),
    ('Japanese Katsu Curry - Pork', 'Choice of Chicken or Pork', 1000, rice_cat_id, true),
    ('Katsu Don - Chicken', 'Chicken breaded and deep-fried, onion, egg and sauce on top of a bowl of rice', 1000, rice_cat_id, true),
    ('Katsu Don - Pork', 'Pork breaded and deep-fried, onion, egg and sauce on top of a bowl of rice', 1000, rice_cat_id, true),
    ('Ten Don', 'Shrimp tempura, onion, egg and sauce on top of bowl of rice', 1200, rice_cat_id, true),
    ('Gyudon', 'Thinly sliced beef, sliced onions and sauce on top of bowl of rice', 1200, rice_cat_id, true);

    -- Insert Ramen
    INSERT INTO menu_items (name, description, price_cents, category_id, is_available) VALUES
    ('Tonkotsu Ramen', 'Pork chashu, pork belly, bamboo, soft boiled egg, black garlic oil, chilli oil and green onion', 1100, ramen_cat_id, true),
    ('Miso Ramen', 'Pork chashu, pork belly, bamboo, soft boiled egg, corn, bean sprout, green onion, black garlic oil and Naruto', 1200, ramen_cat_id, true),
    ('Shoyu Ramen', 'Pork chashu, bamboo, green onion, Naruto, white onion, soft boiled egg and black garlic oil', 1000, ramen_cat_id, true),
    ('Tom Yum Shrimp Ramen', 'Thai style Tom Yum broth with shrimp, cherry tomato, mushroom, cilantro and green onion', 1100, ramen_cat_id, true),
    ('Vegetable Ramen', 'Steam broccoli, corn, mushroom, bamboo, carrot, zucchini and tofu with mushroom broth', 1100, ramen_cat_id, true),
    ('Tan Tan Ramen', 'Spicy ramen noodles with stir-fried ground chicken, egg and green onion', 1100, ramen_cat_id, true),
    ('Spicy Chicken Karaage Ramen', 'Spicy Tonkotsu ramen noodles with chicken karaage, and green onion', 1200, ramen_cat_id, true),
    ('Ann Tori Ramen (LIMITED)', 'Ramen noodle in shoyu chicken broth with grilled chicken, bamboo, egg and green onion', 1200, ramen_cat_id, true);

    -- Insert Soba & Udon
    INSERT INTO menu_items (name, description, price_cents, category_id, is_available) VALUES
    ('Soba (Hot or Cold)', 'With shrimp tempura and vegetable tempura', 1200, noodle_cat_id, true),
    ('Udon - Tofu', 'Japanese wheat noodles in tempura broth with broccoli, corn, shitake mushroom, carrot, zucchini, and seaweed', 1200, noodle_cat_id, true),
    ('Udon - Chicken', 'Japanese wheat noodles in tempura broth with broccoli, corn, shitake mushroom, carrot, zucchini, and seaweed', 1200, noodle_cat_id, true),
    ('Udon - Shrimp Tempura', 'Japanese wheat noodles in tempura broth with broccoli, corn, shitake mushroom, carrot, zucchini, and seaweed', 1200, noodle_cat_id, true),
    ('Udon - Beef', 'Japanese wheat noodles in tempura broth with broccoli, corn, shitake mushroom, carrot, zucchini, and seaweed', 1200, noodle_cat_id, true),
    ('Pho - Chicken', 'Rice noodle with bean sprout, basil, jalapeno, lime and meat ball', 1200, noodle_cat_id, true),
    ('Pho - Beef', 'Rice noodle with bean sprout, basil, jalapeno, lime and meat ball', 1200, noodle_cat_id, true),
    ('Curry Udon - Katsu Pork', 'Japanese wheat noodles with light curry broth with your choice of meat', 1200, noodle_cat_id, true),
    ('Curry Udon - Katsu Chicken', 'Japanese wheat noodles with light curry broth with your choice of meat', 1200, noodle_cat_id, true);

    -- Insert Toppings & Extra
    INSERT INTO menu_items (name, description, price_cents, category_id, is_available) VALUES
    ('Soft boiled egg', 'Add to any dish', 150, topping_cat_id, true),
    ('Pork Chashu', 'Add to any dish', 150, topping_cat_id, true),
    ('Pork Belly', 'Add to any dish', 150, topping_cat_id, true),
    ('Corn', 'Add to any dish', 100, topping_cat_id, true),
    ('Mushroom', 'Add to any dish', 100, topping_cat_id, true),
    ('Noodle', 'Extra noodles', 200, topping_cat_id, true),
    ('Bamboo', 'Add to any dish', 100, topping_cat_id, true),
    ('Rice', 'Extra rice', 200, topping_cat_id, true),
    ('Garlic', 'Add to any dish', 100, topping_cat_id, true);
END $$;