-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION create_order_transaction(
  p_user_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_total_cents INTEGER,
  p_payment_id TEXT,
  p_special_requests TEXT,
  p_cart_data TEXT
) RETURNS JSON AS $$
DECLARE
  v_order_id UUID;
  v_cart_item JSON;
BEGIN
  -- Insert order with unique constraint on payment_id
  INSERT INTO orders (
    user_id, 
    customer_name, 
    customer_email, 
    customer_phone, 
    total_cents, 
    status, 
    special_requests, 
    square_payment_id
  ) VALUES (
    p_user_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_total_cents,
    'confirmed',
    p_special_requests,
    p_payment_id
  ) RETURNING id INTO v_order_id;

  -- Insert order items from cart data
  FOR v_cart_item IN SELECT * FROM json_array_elements(p_cart_data::json)
  LOOP
    INSERT INTO order_items (
      order_id,
      menu_item_id,
      quantity,
      unit_price_cents,
      special_instructions
    ) VALUES (
      v_order_id,
      (v_cart_item->>'menu_item_id')::UUID,
      (v_cart_item->>'quantity')::INTEGER,
      COALESCE((v_cart_item->>'price_cents')::INTEGER, ROUND((v_cart_item->>'price')::NUMERIC * 100)),
      v_cart_item->>'special_instructions'
    );
  END LOOP;

  -- Return order ID
  RETURN json_build_object('order_id', v_order_id, 'success', true);
  
EXCEPTION WHEN OTHERS THEN
  -- Re-raise the error for proper handling
  RAISE;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';