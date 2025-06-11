-- Remove any existing CHECK constraint on stock_status
ALTER TABLE public.menu_items 
DROP CONSTRAINT IF EXISTS menu_items_stock_status_check;

-- Add a properly formatted CHECK constraint
ALTER TABLE public.menu_items 
ADD CONSTRAINT menu_items_stock_status_check 
CHECK (stock_status IN ('in_stock', 'out_today', 'out_indefinite', 'out_until'));