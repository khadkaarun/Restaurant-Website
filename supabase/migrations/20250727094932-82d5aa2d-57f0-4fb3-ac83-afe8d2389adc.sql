-- Give Katsu Don completely unique variant names
UPDATE menu_item_variants 
SET variant_name = 'don_chicken'
WHERE menu_item_id = (SELECT id FROM menu_items WHERE name = 'Katsu Don') 
AND variant_name = 'katsu_chicken';

UPDATE menu_item_variants 
SET variant_name = 'don_pork'
WHERE menu_item_id = (SELECT id FROM menu_items WHERE name = 'Katsu Don') 
AND variant_name = 'katsu_pork';