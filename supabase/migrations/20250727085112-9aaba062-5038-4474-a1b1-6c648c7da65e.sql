-- Update Japanese Katsu Curry variants to avoid naming conflicts with Curry Udon
UPDATE menu_item_variants 
SET variant_name = 'curry_chicken'
WHERE variant_name = 'chicken' 
AND menu_item_id IN (
  SELECT id FROM menu_items WHERE name ILIKE '%katsu curry%'
);

UPDATE menu_item_variants 
SET variant_name = 'curry_pork'
WHERE variant_name = 'pork' 
AND menu_item_id IN (
  SELECT id FROM menu_items WHERE name ILIKE '%katsu curry%'
);