-- Add missing INSERT policy for order_items
CREATE POLICY "Users can insert order items for their orders"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Create secure order creation function with validation
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_total_amount NUMERIC,
  p_shipping_address TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_calculated_total NUMERIC := 0;
  v_item JSONB;
  v_product_price NUMERIC;
  v_product_active BOOLEAN;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Validate items exist and calculate total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get product price and active status
    SELECT price, is_active INTO v_product_price, v_product_active
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

    -- Add to calculated total
    v_calculated_total := v_calculated_total + (v_product_price * (v_item->>'quantity')::INTEGER);
  END LOOP;

  -- Validate total matches calculated amount
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
    status
  ) VALUES (
    auth.uid(),
    p_total_amount,
    p_shipping_address,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    'pending'
  ) RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price INTO v_product_price
    FROM products
    WHERE id = (v_item->>'product_id')::UUID;

    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_product_price
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- Add CHECK constraint for order status transitions
ALTER TABLE orders ADD CONSTRAINT valid_order_status 
CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'));

-- Create rate limiting table for AI chat
CREATE TABLE IF NOT EXISTS public.ai_chat_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on rate limiting table
ALTER TABLE public.ai_chat_rate_limit ENABLE ROW LEVEL SECURITY;

-- Policy for rate limit table (only functions can access)
CREATE POLICY "Service role can manage rate limits"
ON public.ai_chat_rate_limit FOR ALL
USING (auth.role() = 'service_role');

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_ai_chat_rate_limit(
  p_user_id UUID,
  p_ip_address TEXT,
  p_max_requests INTEGER DEFAULT 20,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Get current rate limit record
  SELECT request_count, window_start INTO v_current_count, v_window_start
  FROM ai_chat_rate_limit
  WHERE (user_id = p_user_id OR (user_id IS NULL AND ip_address = p_ip_address))
  AND window_start > (now() - (p_window_minutes || ' minutes')::INTERVAL)
  ORDER BY window_start DESC
  LIMIT 1;

  -- If no record or window expired, create new window
  IF v_current_count IS NULL OR v_window_start < (now() - (p_window_minutes || ' minutes')::INTERVAL) THEN
    INSERT INTO ai_chat_rate_limit (user_id, ip_address, request_count, window_start)
    VALUES (p_user_id, p_ip_address, 1, now())
    ON CONFLICT (id) DO NOTHING;
    RETURN TRUE;
  END IF;

  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  -- Increment counter
  UPDATE ai_chat_rate_limit
  SET request_count = request_count + 1
  WHERE (user_id = p_user_id OR (user_id IS NULL AND ip_address = p_ip_address))
  AND window_start = v_window_start;

  RETURN TRUE;
END;
$$;