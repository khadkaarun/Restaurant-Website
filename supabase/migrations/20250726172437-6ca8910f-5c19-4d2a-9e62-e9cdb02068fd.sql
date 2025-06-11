-- Add a custom_name column to order_items to store the customized name with protein choices
ALTER TABLE order_items ADD COLUMN custom_name TEXT;

-- Update the create_order_transaction function to store the custom name from cart
CREATE OR REPLACE FUNCTION public.create_order_transaction(p_user_id uuid, p_customer_name text, p_customer_email text, p_customer_phone text, p_total_cents integer, p_stripe_payment_id text, p_special_requests text, p_cart_data text)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_cart_item JSON;
BEGIN
  -- Insert order with unique constraint on stripe_payment_id
  INSERT INTO orders (
    user_id, 
    customer_name, 
    customer_email, 
    customer_phone, 
    total_cents, 
    status, 
    special_requests, 
    stripe_payment_id
  ) VALUES (
    p_user_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_total_cents,
    'confirmed',
    p_special_requests,
    p_stripe_payment_id
  ) RETURNING id INTO v_order_id;

  -- Insert order items from cart data
  FOR v_cart_item IN SELECT * FROM json_array_elements(p_cart_data::json)
  LOOP
    INSERT INTO order_items (
      order_id,
      menu_item_id,
      quantity,
      unit_price_cents,
      special_instructions,
      custom_name
    ) VALUES (
      v_order_id,
      (v_cart_item->>'menu_item_id')::UUID,
      (v_cart_item->>'quantity')::INTEGER,
      COALESCE((v_cart_item->>'price_cents')::INTEGER, ROUND((v_cart_item->>'price')::NUMERIC * 100)),
      v_cart_item->>'special_instructions',
      v_cart_item->>'name'
    );
  END LOOP;

  -- Return order ID
  RETURN json_build_object('order_id', v_order_id, 'success', true);
  
EXCEPTION WHEN OTHERS THEN
  -- Re-raise the error for proper handling
  RAISE;
END;
$function$;