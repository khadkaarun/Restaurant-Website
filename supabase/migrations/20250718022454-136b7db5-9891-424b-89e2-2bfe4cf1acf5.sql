-- Add policy to allow viewing orders by ID for guest orders (no authentication required)
CREATE POLICY "Anyone can view orders by ID" ON public.orders
FOR SELECT
USING (true);