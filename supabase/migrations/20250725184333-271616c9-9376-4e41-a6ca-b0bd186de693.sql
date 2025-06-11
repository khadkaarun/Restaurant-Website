-- Consolidate duplicate menu items into single items with options

-- First, let's update the teriyaki items - keep Chicken Teriyaki and delete the others
UPDATE menu_items 
SET name = 'Teriyaki', 
    description = 'Served with stir-fried vegetables and steamed Japanese rice. Choice of Chicken, Salmon, or Tofu.'
WHERE name = 'Chicken Teriyaki';

-- Delete duplicate teriyaki items
DELETE FROM menu_items WHERE name IN ('Salmon Teriyaki', 'Tofu Teriyaki');

-- Update Japanese Katsu Curry - keep the chicken one and delete pork
UPDATE menu_items 
SET name = 'Japanese Katsu Curry', 
    description = 'Choice of Chicken or Pork katsu with Japanese curry sauce over rice.'
WHERE name = 'Japanese Katsu Curry - Chicken';

DELETE FROM menu_items WHERE name = 'Japanese Katsu Curry - Pork';

-- Update Katsu Don - keep chicken and delete pork
UPDATE menu_items 
SET name = 'Katsu Don', 
    description = 'Breaded and deep-fried cutlet (chicken or pork), onion, egg and sauce on top of a bowl of rice.'
WHERE name = 'Katsu Don - Chicken';

DELETE FROM menu_items WHERE name = 'Katsu Don - Pork';

-- Update Pho - keep chicken and delete beef
UPDATE menu_items 
SET name = 'Pho', 
    description = 'Rice noodle with bean sprout, basil, jalapeno, lime and your choice of chicken or beef.'
WHERE name = 'Pho - Chicken';

DELETE FROM menu_items WHERE name = 'Pho - Beef';

-- Update Curry Udon - keep chicken and delete pork
UPDATE menu_items 
SET name = 'Curry Udon', 
    description = 'Japanese wheat noodles with light curry broth with your choice of chicken or pork katsu.'
WHERE name = 'Curry Udon - Katsu Chicken';

DELETE FROM menu_items WHERE name = 'Curry Udon - Katsu Pork';

-- Update regular Udon - keep chicken and delete others
UPDATE menu_items 
SET name = 'Udon', 
    description = 'Japanese wheat noodles in tempura broth with broccoli, corn, shitake mushroom, carrot, zucchini, and seaweed. Choice of chicken, beef, shrimp tempura, or tofu.'
WHERE name = 'Udon - Chicken';

DELETE FROM menu_items WHERE name IN ('Udon - Beef', 'Udon - Shrimp Tempura', 'Udon - Tofu');