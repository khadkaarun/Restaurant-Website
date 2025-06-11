-- Add special_requests field to orders table
ALTER TABLE public.orders 
ADD COLUMN special_requests TEXT;