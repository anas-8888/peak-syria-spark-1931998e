-- Add discount_id to orders table to track which discount was used
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES discounts(id);

-- Add discount_amount to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Modify create_order_with_items to NOT record usage immediately
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_user_id uuid,
  p_total_amount numeric,
  p_shipping_address text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_carrier_id uuid DEFAULT NULL::uuid,
  p_shipping_region_id uuid DEFAULT NULL::uuid,
  p_shipping_cost numeric DEFAULT 0,
  p_discount_id uuid DEFAULT NULL::uuid,
  p_discount_amount numeric DEFAULT 0,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_delivery_latitude numeric DEFAULT NULL::numeric,
  p_delivery_longitude numeric DEFAULT NULL::numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_calculated_total NUMERIC := 0;
  v_item JSONB;
  v_product_price NUMERIC;
  v_product_offer_price NUMERIC;
  v_product_active BOOLEAN;
  v_final_price NUMERIC;
  v_variant_id UUID;
  v_variant_stock INTEGER;
  v_product_stock INTEGER;
BEGIN
  -- Validate user is authenticated
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Validate items exist and calculate total (stock validation only, no reduction yet)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    
    IF v_variant_id IS NOT NULL THEN
      SELECT price, stock_quantity, is_active
      INTO v_product_price, v_variant_stock, v_product_active
      FROM product_variants
      WHERE id = v_variant_id;

      IF v_product_price IS NULL THEN
        RAISE EXCEPTION 'Variant % does not exist', v_variant_id;
      END IF;

      IF NOT v_product_active THEN
        RAISE EXCEPTION 'Variant % is not active', v_variant_id;
      END IF;

      IF v_variant_stock < (v_item->>'quantity')::INTEGER THEN
        RAISE EXCEPTION 'Insufficient stock for variant %. Available: %, Requested: %', 
          v_variant_id, v_variant_stock, (v_item->>'quantity')::INTEGER;
      END IF;

      v_final_price := v_product_price;
    ELSE
      SELECT price, offer_price, is_active, stock_quantity
      INTO v_product_price, v_product_offer_price, v_product_active, v_product_stock
      FROM products
      WHERE id = (v_item->>'product_id')::UUID;

      IF v_product_price IS NULL THEN
        RAISE EXCEPTION 'Product % does not exist', v_item->>'product_id';
      END IF;

      IF NOT v_product_active THEN
        RAISE EXCEPTION 'Product % is not active', v_item->>'product_id';
      END IF;

      IF v_product_stock < (v_item->>'quantity')::INTEGER THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', 
          v_item->>'product_id', v_product_stock, (v_item->>'quantity')::INTEGER;
      END IF;

      v_final_price := COALESCE(v_product_offer_price, v_product_price);
    END IF;

    IF (v_item->>'quantity')::INTEGER <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    v_calculated_total := v_calculated_total + (v_final_price * (v_item->>'quantity')::INTEGER);
  END LOOP;

  v_calculated_total := v_calculated_total + p_shipping_cost;
  v_calculated_total := v_calculated_total - p_discount_amount;

  IF ABS(p_total_amount - v_calculated_total) > 0.01 THEN
    RAISE EXCEPTION 'Order total (%) does not match calculated total (%)', p_total_amount, v_calculated_total;
  END IF;

  -- Create order with pending status and store discount info (but don't record usage yet)
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
    delivery_latitude,
    delivery_longitude,
    discount_id,
    discount_amount,
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
    p_delivery_latitude,
    p_delivery_longitude,
    p_discount_id,
    p_discount_amount,
    'pending'
  ) RETURNING id INTO v_order_id;

  -- Insert order items WITHOUT reducing stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    
    IF v_variant_id IS NOT NULL THEN
      SELECT price INTO v_product_price
      FROM product_variants
      WHERE id = v_variant_id;
      v_final_price := v_product_price;
    ELSE
      SELECT price, offer_price INTO v_product_price, v_product_offer_price
      FROM products
      WHERE id = (v_item->>'product_id')::UUID;
      v_final_price := COALESCE(v_product_offer_price, v_product_price);
    END IF;

    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price,
      notes,
      variant_id,
      selected_color,
      selected_size
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_final_price,
      v_item->>'notes',
      (v_item->>'variant_id')::UUID,
      v_item->>'selected_color',
      v_item->>'selected_size'
    );
  END LOOP;

  -- NOTE: Discount usage will be recorded by trigger when order is confirmed
  
  RETURN v_order_id;
END;
$function$;

-- Create function to handle discount usage on order status changes
CREATE OR REPLACE FUNCTION handle_discount_usage_on_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_subtotal NUMERIC;
BEGIN
  -- Record discount usage when order is confirmed (status changes to 'processing')
  IF OLD.status = 'pending' AND NEW.status = 'processing' 
     AND NEW.discount_id IS NOT NULL AND NEW.discount_amount > 0 THEN
    
    -- Calculate order subtotal (total - shipping)
    v_order_subtotal := NEW.total_amount - COALESCE(NEW.shipping_cost, 0) + NEW.discount_amount;
    
    -- Record the discount usage
    PERFORM record_discount_usage(
      NEW.discount_id,
      NEW.id,
      NEW.user_id,
      NEW.discount_amount,
      v_order_subtotal
    );
  END IF;

  -- Reverse discount usage when order is cancelled
  -- This happens either when status is directly changed to 'cancelled'
  -- OR when cancellation request is approved
  IF (OLD.status != 'cancelled' AND NEW.status = 'cancelled')
     OR (OLD.cancel_status = 'pending' AND NEW.cancel_status = 'approved')
     AND NEW.discount_id IS NOT NULL THEN
    
    -- Delete the discount usage record
    DELETE FROM discount_usages
    WHERE order_id = NEW.id AND discount_id = NEW.discount_id;
    
    -- Decrement the usage count and revenue
    UPDATE discounts
    SET 
      total_uses = GREATEST(0, total_uses - 1),
      total_revenue = GREATEST(0, total_revenue - (NEW.total_amount - COALESCE(NEW.shipping_cost, 0) + NEW.discount_amount))
    WHERE id = NEW.discount_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for discount usage handling
DROP TRIGGER IF EXISTS trigger_handle_discount_usage ON orders;
CREATE TRIGGER trigger_handle_discount_usage
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_discount_usage_on_order_status_change();