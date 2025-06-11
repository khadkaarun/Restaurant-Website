-- Fix Katsu Don variant names to match the expected format
UPDATE menu_item_variants 
SET variant_name = 'katsu_chicken'
WHERE menu_item_id = (SELECT id FROM menu_items WHERE name = 'Katsu Don') 
AND variant_name = 'chicken';

UPDATE menu_item_variants 
SET variant_name = 'katsu_pork'
WHERE menu_item_id = (SELECT id FROM menu_items WHERE name = 'Katsu Don') 
AND variant_name = 'pork';