-- Update Teriyaki base price to $0 since pricing comes from protein selection
UPDATE menu_items 
SET price_cents = 0,
    description = 'Served with stir-fried vegetables and steamed Japanese rice. Choose your protein: Chicken $10.00, Salmon $12.00, or Tofu $9.00.'
WHERE name = 'Teriyaki';