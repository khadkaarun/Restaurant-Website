-- Clear existing menu data
DELETE FROM menu_items;
DELETE FROM menu_categories;

-- Insert new categories for Maki Express Ramen House
INSERT INTO menu_categories (id, name, sort_order) VALUES 
('app-cat', 'Appetizers', 1),
('rice-cat', 'Rice', 2),
('ramen-cat', 'Ramen', 3),
('noodle-cat', 'Soba & Udon', 4),
('topping-cat', 'Topping & Extra', 5);

-- Insert Appetizers
INSERT INTO menu_items (name, description, price_cents, category_id, is_available) VALUES
('House Salad', 'Fresh green salad with tomato and cucumber with sesame dressing', 400, 'app-cat', true),
('Edamame', 'Steamed soy beans with salt', 400, 'app-cat', true),
('Seaweed Salad', 'Marinated seaweed, served cold', 500, 'app-cat', true),
('Gyoza', 'Deep-fried or steamed pork dumpling', 500, 'app-cat', true),
('Shrimp Shumai', 'Deep-fried or steamed Japanese shrimp dumpling', 600, 'app-cat', true),
('Chicken Karaage', 'Japanese fried chicken', 600, 'app-cat', true),
('Yasai Korokke (Croquettes)', 'Mixed vegetable with mashed potato', 600, 'app-cat', true),
('Takoyaki', 'A ball shaped Japanese snack made of wheat flour base batter with octopus', 600, 'app-cat', true),
('Okonomiyaki', 'Japanese mixed seafood pizza', 750, 'app-cat', true),
('Soft Taco with Pork Belly (2 pieces)', 'Soft taco with pork belly', 600, 'app-cat', true),
('Onigiri', 'Choice of Salmon Teriyaki or Chicken karaage or Tuna Salad', 350, 'app-cat', true),
('Katsu Sando', 'Crispy and juicy chicken or pork cutlet sandwiched', 800, 'app-cat', true);

-- Insert Rice dishes
INSERT INTO menu_items (name, description, price_cents, category_id, is_available) VALUES
('Chicken Teriyaki', 'Served with stir-fried vegetables and steamed Japanese rice', 1000, 'rice-cat', true),
('Tofu Teriyaki', 'Served with stir-fried vegetables and steamed Japanese rice', 900, 'rice-cat', true),
('Salmon Teriyaki', 'Served with stir-fried vegetables and steamed Japanese rice', 1200, 'rice-cat', true),
('Unagi Don', 'Barbecue eel and sauce on top with rice', 1500, 'rice-cat', true),
('Japanese Katsu Curry - Chicken', 'Choice of Chicken or Pork', 1000, 'rice-cat', true),
('Japanese Katsu Curry - Pork', 'Choice of Chicken or Pork', 1000, 'rice-cat', true),
('Katsu Don - Chicken', 'Chicken breaded and deep-fried, onion, egg and sauce on top of a bowl of rice', 1000, 'rice-cat', true),
('Katsu Don - Pork', 'Pork breaded and deep-fried, onion, egg and sauce on top of a bowl of rice', 1000, 'rice-cat', true),
('Ten Don', 'Shrimp tempura, onion, egg and sauce on top of bowl of rice', 1200, 'rice-cat', true),
('Gyudon', 'Thinly sliced beef, sliced onions and sauce on top of bowl of rice', 1200, 'rice-cat', true);

-- Insert Ramen
INSERT INTO menu_items (name, description, price_cents, category_id, is_available) VALUES
('Tonkotsu Ramen', 'Pork chashu, pork belly, bamboo, soft boiled egg, black garlic oil, chilli oil and green onion', 1100, 'ramen-cat', true),
('Miso Ramen', 'Pork chashu, pork belly, bamboo, soft boiled egg, corn, bean sprout, green onion, black garlic oil and Naruto', 1200, 'ramen-cat', true),
('Shoyu Ramen', 'Pork chashu, bamboo, green onion, Naruto, white onion, soft boiled egg and black garlic oil', 1000, 'ramen-cat', true),
('Tom Yum Shrimp Ramen', 'Thai style Tom Yum broth with shrimp, cherry tomato, mushroom, cilantro and green onion', 1100, 'ramen-cat', true),
('Vegetable Ramen', 'Steam broccoli, corn, mushroom, bamboo, carrot, zucchini and tofu with mushroom broth', 1100, 'ramen-cat', true),
('Tan Tan Ramen', 'Spicy ramen noodles with stir-fried ground chicken, egg and green onion', 1100, 'ramen-cat', true),
('Spicy Chicken Karaage Ramen', 'Spicy Tonkotsu ramen noodles with chicken karaage, and green onion', 1200, 'ramen-cat', true),
('Ann Tori Ramen (LIMITED)', 'Ramen noodle in shoyu chicken broth with grilled chicken, bamboo, egg and green onion', 1200, 'ramen-cat', true);

-- Insert Soba & Udon
INSERT INTO menu_items (name, description, price_cents, category_id, is_available) VALUES
('Soba (Hot or Cold)', 'With shrimp tempura and vegetable tempura', 1200, 'noodle-cat', true),
('Udon - Tofu', 'Japanese wheat noodles in tempura broth with broccoli, corn, shitake mushroom, carrot, zucchini, and seaweed', 1200, 'noodle-cat', true),
('Udon - Chicken', 'Japanese wheat noodles in tempura broth with broccoli, corn, shitake mushroom, carrot, zucchini, and seaweed', 1200, 'noodle-cat', true),
('Udon - Shrimp Tempura', 'Japanese wheat noodles in tempura broth with broccoli, corn, shitake mushroom, carrot, zucchini, and seaweed', 1200, 'noodle-cat', true),
('Udon - Beef', 'Japanese wheat noodles in tempura broth with broccoli, corn, shitake mushroom, carrot, zucchini, and seaweed', 1200, 'noodle-cat', true),
('Pho - Chicken', 'Rice noodle with bean sprout, basil, jalapeno, lime and meat ball', 1200, 'noodle-cat', true),
('Pho - Beef', 'Rice noodle with bean sprout, basil, jalapeno, lime and meat ball', 1200, 'noodle-cat', true),
('Curry Udon - Katsu Pork', 'Japanese wheat noodles with light curry broth with your choice of meat', 1200, 'noodle-cat', true),
('Curry Udon - Katsu Chicken', 'Japanese wheat noodles with light curry broth with your choice of meat', 1200, 'noodle-cat', true);

-- Insert Toppings & Extra
INSERT INTO menu_items (name, description, price_cents, category_id, is_available) VALUES
('Soft boiled egg', 'Add to any dish', 150, 'topping-cat', true),
('Pork Chashu', 'Add to any dish', 150, 'topping-cat', true),
('Pork Belly', 'Add to any dish', 150, 'topping-cat', true),
('Corn', 'Add to any dish', 100, 'topping-cat', true),
('Mushroom', 'Add to any dish', 100, 'topping-cat', true),
('Noodle', 'Extra noodles', 200, 'topping-cat', true),
('Bamboo', 'Add to any dish', 100, 'topping-cat', true),
('Rice', 'Extra rice', 200, 'topping-cat', true),
('Garlic', 'Add to any dish', 100, 'topping-cat', true);