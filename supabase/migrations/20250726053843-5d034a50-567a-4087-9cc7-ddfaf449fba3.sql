-- Add policy to allow staff to update order items for swapping functionality
CREATE POLICY "Staff can update order items" 
ON public.order_items 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1 
  FROM profiles 
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['staff'::text, 'admin'::text])))
));