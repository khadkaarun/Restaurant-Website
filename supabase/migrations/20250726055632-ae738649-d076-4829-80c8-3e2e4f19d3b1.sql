-- Add stock management fields to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN out_of_stock_status text DEFAULT 'in_stock',
ADD COLUMN out_of_stock_until timestamp with time zone,
ADD COLUMN stock_notes text;

-- Create enum for stock status
CREATE TYPE public.stock_status AS ENUM ('in_stock', 'out_today', 'out_indefinite', 'out_until');

-- Update the column to use the enum
ALTER TABLE public.menu_items 
ALTER COLUMN out_of_stock_status TYPE stock_status USING out_of_stock_status::stock_status;

-- Create function to automatically reset daily out of stock items at midnight
CREATE OR REPLACE FUNCTION public.reset_daily_stock()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.menu_items 
  SET out_of_stock_status = 'in_stock'
  WHERE out_of_stock_status = 'out_today';
END;
$$;

-- Create function to check if item is available for ordering
CREATE OR REPLACE FUNCTION public.is_item_available(item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  item_status stock_status;
  until_time timestamp with time zone;
BEGIN
  SELECT out_of_stock_status, out_of_stock_until
  INTO item_status, until_time
  FROM public.menu_items
  WHERE id = item_id AND is_available = true;
  
  IF item_status IS NULL THEN
    RETURN false;
  END IF;
  
  CASE item_status
    WHEN 'in_stock' THEN
      RETURN true;
    WHEN 'out_today' THEN
      RETURN false;
    WHEN 'out_indefinite' THEN
      RETURN false;
    WHEN 'out_until' THEN
      RETURN until_time IS NULL OR now() >= until_time;
    ELSE
      RETURN true;
  END CASE;
END;
$$;