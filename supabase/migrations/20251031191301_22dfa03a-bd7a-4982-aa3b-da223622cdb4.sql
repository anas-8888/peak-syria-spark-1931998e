-- Fix ambiguous column reference in validate_discount_code function
CREATE OR REPLACE FUNCTION public.validate_discount_code(p_code text, p_user_id uuid, p_cart_subtotal numeric, p_cart_items jsonb)
 RETURNS TABLE(is_valid boolean, discount_id uuid, discount_amount numeric, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_discount RECORD;
  v_user_usage_count INTEGER;
  v_calculated_discount NUMERIC;
BEGIN
  -- Get discount
  SELECT * INTO v_discount
  FROM discounts
  WHERE code = p_code
    AND status = 'active'
    AND start_date <= now()
    AND (end_date IS NULL OR end_date >= now());

  -- Check if discount exists
  IF v_discount.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, 'Invalid or expired discount code';
    RETURN;
  END IF;

  -- Check min cart subtotal
  IF p_cart_subtotal < v_discount.min_cart_subtotal THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, 
      'Minimum order amount not met: ' || v_discount.min_cart_subtotal;
    RETURN;
  END IF;

  -- Check logged in requirement
  IF v_discount.logged_in_only AND p_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, 'Please log in to use this discount';
    RETURN;
  END IF;

  -- Check global usage limit
  IF v_discount.global_usage_limit IS NOT NULL 
     AND v_discount.total_uses >= v_discount.global_usage_limit THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, 'Discount code limit reached';
    RETURN;
  END IF;

  -- Check per-customer limit - Fixed ambiguous column reference
  IF p_user_id IS NOT NULL AND v_discount.per_customer_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM discount_usages
    WHERE discount_usages.discount_id = v_discount.id AND discount_usages.user_id = p_user_id;
    
    IF v_user_usage_count >= v_discount.per_customer_limit THEN
      RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, 'You have already used this discount';
      RETURN;
    END IF;
  END IF;

  -- Calculate discount amount
  IF v_discount.type = 'percentage' THEN
    v_calculated_discount := p_cart_subtotal * (v_discount.value / 100);
  ELSIF v_discount.type = 'fixed_amount' THEN
    v_calculated_discount := v_discount.value;
  ELSE
    v_calculated_discount := 0;
  END IF;

  -- Apply per-order max discount
  IF v_discount.per_order_max_discount IS NOT NULL THEN
    v_calculated_discount := LEAST(v_calculated_discount, v_discount.per_order_max_discount);
  END IF;

  -- Ensure discount doesn't exceed cart total
  v_calculated_discount := LEAST(v_calculated_discount, p_cart_subtotal);

  RETURN QUERY SELECT true, v_discount.id, v_calculated_discount, 'Discount applied successfully';
END;
$function$;