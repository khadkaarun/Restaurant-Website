-- Update Teriyaki base price to $10 (chicken default) for UI display
UPDATE menu_items 
SET price_cents = 1000,
    description = 'Served with stir-fried vegetables and steamed Japanese rice. Choose your protein: Chicken $10.00, Salmon $12.00, or Tofu $9.00.'
WHERE name = 'Teriyaki';