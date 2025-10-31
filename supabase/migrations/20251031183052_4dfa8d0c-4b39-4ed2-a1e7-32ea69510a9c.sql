-- Update function to handle nullable shipping carrier
DROP FUNCTION IF EXISTS public.create_order_with_items(uuid, numeric, text, text, text, text, uuid, uuid, numeric, uuid, numeric, jsonb);

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_user_id uuid,
  p_total_amount numeric,
  p_shipping_address text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_carrier_id uuid DEFAULT NULL,
  p_shipping_region_id uuid DEFAULT NULL,
  p_shipping_cost numeric DEFAULT 0,
  p_discount_id uuid DEFAULT NULL,
  p_discount_amount numeric DEFAULT 0,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_calculated_total NUMERIC := 0;
  v_item JSONB;
  v_product_price NUMERIC;
  v_product_offer_price NUMERIC;
  v_product_active BOOLEAN;
  v_final_price NUMERIC;
BEGIN
  -- Validate user is authenticated
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Validate items exist and calculate total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get product price and active status
    SELECT price, offer_price, is_active 
    INTO v_product_price, v_product_offer_price, v_product_active
    FROM products
    WHERE id = (v_item->>'product_id')::UUID;

    -- Check product exists and is active
    IF v_product_price IS NULL THEN
      RAISE EXCEPTION 'Product % does not exist', v_item->>'product_id';
    END IF;

    IF NOT v_product_active THEN
      RAISE EXCEPTION 'Product % is not active', v_item->>'product_id';
    END IF;

    -- Validate quantity is positive
    IF (v_item->>'quantity')::INTEGER <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    -- Use offer price if available, otherwise regular price
    v_final_price := COALESCE(v_product_offer_price, v_product_price);

    -- Add to calculated total
    v_calculated_total := v_calculated_total + (v_final_price * (v_item->>'quantity')::INTEGER);
  END LOOP;

  -- Add shipping cost to total
  v_calculated_total := v_calculated_total + p_shipping_cost;

  -- Subtract discount
  v_calculated_total := v_calculated_total - p_discount_amount;

  -- Validate total matches calculated amount (allow small rounding differences)
  IF ABS(p_total_amount - v_calculated_total) > 0.01 THEN
    RAISE EXCEPTION 'Order total (%) does not match calculated total (%)', p_total_amount, v_calculated_total;
  END IF;

  -- Create order
  INSERT INTO orders (
    user_id,
    total_amount,
    shipping_address,
    customer_name,
    customer_phone,
    customer_email,
    shipping_carrier_id,
    shipping_region_id,
    shipping_cost,
    status
  ) VALUES (
    p_user_id,
    p_total_amount,
    p_shipping_address,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_shipping_carrier_id,
    p_shipping_region_id,
    p_shipping_cost,
    'pending'
  ) RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price, offer_price INTO v_product_price, v_product_offer_price
    FROM products
    WHERE id = (v_item->>'product_id')::UUID;

    v_final_price := COALESCE(v_product_offer_price, v_product_price);

    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_final_price
    );
  END LOOP;

  -- Record discount usage if applicable
  IF p_discount_id IS NOT NULL AND p_discount_amount > 0 THEN
    PERFORM record_discount_usage(
      p_discount_id,
      v_order_id,
      p_user_id,
      p_discount_amount,
      v_calculated_total + p_discount_amount - p_shipping_cost
    );
  END IF;

  RETURN v_order_id;
END;
$$;