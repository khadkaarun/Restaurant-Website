-- Add stock management fields to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_today', 'out_indefinite', 'out_until')),
ADD COLUMN out_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN stock_notes TEXT;

-- Update existing items to be in stock
UPDATE public.menu_items SET stock_status = 'in_stock' WHERE stock_status IS NULL;