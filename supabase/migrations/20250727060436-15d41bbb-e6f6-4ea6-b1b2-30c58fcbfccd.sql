-- Create menu item variants table to handle sub-options like proteins
CREATE TABLE public.menu_item_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL, -- 'protein', 'topping', etc.
  variant_name TEXT NOT NULL, -- 'chicken', 'beef', 'salmon', etc.
  price_modifier_cents INTEGER NOT NULL DEFAULT 0, -- price difference from base item
  sort_order INTEGER DEFAULT 0,
  stock_status TEXT DEFAULT 'in_stock',
  out_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_item_variants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view available variants" 
ON public.menu_item_variants 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage variants" 
ON public.menu_item_variants 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['staff', 'admin'])
));

-- Add updated_at trigger
CREATE TRIGGER update_menu_item_variants_updated_at
BEFORE UPDATE ON public.menu_item_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial variants based on current menu structure
-- Teriyaki variants (chicken $10, salmon $12, tofu $9)
INSERT INTO menu_item_variants (menu_item_id, variant_type, variant_name, price_modifier_cents, sort_order)
SELECT id, 'protein', 'chicken', 0, 1 FROM menu_items WHERE LOWER(name) LIKE '%teriyaki%'
UNION ALL
SELECT id, 'protein', 'salmon', 200, 2 FROM menu_items WHERE LOWER(name) LIKE '%teriyaki%'
UNION ALL
SELECT id, 'protein', 'tofu', -100, 3 FROM menu_items WHERE LOWER(name) LIKE '%teriyaki%';

-- Katsu curry variants (chicken and pork same price)
INSERT INTO menu_item_variants (menu_item_id, variant_type, variant_name, price_modifier_cents, sort_order)
SELECT id, 'protein', 'chicken', 0, 1 FROM menu_items WHERE LOWER(name) LIKE '%katsu curry%'
UNION ALL
SELECT id, 'protein', 'pork', 0, 2 FROM menu_items WHERE LOWER(name) LIKE '%katsu curry%';

-- Katsu don variants (chicken and pork same price)
INSERT INTO menu_item_variants (menu_item_id, variant_type, variant_name, price_modifier_cents, sort_order)
SELECT id, 'protein', 'chicken', 0, 1 FROM menu_items WHERE LOWER(name) LIKE '%katsu don%'
UNION ALL
SELECT id, 'protein', 'pork', 0, 2 FROM menu_items WHERE LOWER(name) LIKE '%katsu don%';

-- Udon variants (chicken, beef, shrimp tempura, tofu)
INSERT INTO menu_item_variants (menu_item_id, variant_type, variant_name, price_modifier_cents, sort_order)
SELECT id, 'protein', 'chicken', 0, 1 FROM menu_items WHERE LOWER(name) = 'udon'
UNION ALL
SELECT id, 'protein', 'beef', 0, 2 FROM menu_items WHERE LOWER(name) = 'udon'
UNION ALL
SELECT id, 'protein', 'shrimp_tempura', 0, 3 FROM menu_items WHERE LOWER(name) = 'udon'
UNION ALL
SELECT id, 'protein', 'tofu', 0, 4 FROM menu_items WHERE LOWER(name) = 'udon';

-- Curry udon variants (katsu chicken and katsu pork)
INSERT INTO menu_item_variants (menu_item_id, variant_type, variant_name, price_modifier_cents, sort_order)
SELECT id, 'protein', 'katsu_chicken', 0, 1 FROM menu_items WHERE LOWER(name) LIKE '%curry udon%'
UNION ALL
SELECT id, 'protein', 'katsu_pork', 0, 2 FROM menu_items WHERE LOWER(name) LIKE '%curry udon%';

-- Pho variants (chicken and beef same price)
INSERT INTO menu_item_variants (menu_item_id, variant_type, variant_name, price_modifier_cents, sort_order)
SELECT id, 'protein', 'chicken', 0, 1 FROM menu_items WHERE LOWER(name) LIKE '%pho%'
UNION ALL
SELECT id, 'protein', 'beef', 0, 2 FROM menu_items WHERE LOWER(name) LIKE '%pho%';

-- Katsu sando variants (katsu chicken and katsu pork)
INSERT INTO menu_item_variants (menu_item_id, variant_type, variant_name, price_modifier_cents, sort_order)
SELECT id, 'protein', 'katsu_chicken', 0, 1 FROM menu_items WHERE LOWER(name) LIKE '%katsu sando%'
UNION ALL
SELECT id, 'protein', 'katsu_pork', 0, 2 FROM menu_items WHERE LOWER(name) LIKE '%katsu sando%';

-- Onigiri variants (salmon, tuna, chicken karaage)
INSERT INTO menu_item_variants (menu_item_id, variant_type, variant_name, price_modifier_cents, sort_order)
SELECT id, 'protein', 'salmon', 0, 1 FROM menu_items WHERE LOWER(name) LIKE '%onigiri%'
UNION ALL
SELECT id, 'protein', 'tuna', 0, 2 FROM menu_items WHERE LOWER(name) LIKE '%onigiri%'
UNION ALL
SELECT id, 'protein', 'chicken_karaage', 0, 3 FROM menu_items WHERE LOWER(name) LIKE '%onigiri%';