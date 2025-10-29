-- Create discount types enum
CREATE TYPE discount_type AS ENUM (
  'percentage',
  'fixed_amount',
  'bogo',
  'tiered',
  'bundle',
  'volume',
  'free_shipping',
  'clearance',
  'flash'
);

-- Create discount status enum
CREATE TYPE discount_status AS ENUM (
  'active',
  'scheduled',
  'expired',
  'paused',
  'archived'
);

-- Create discount scope enum
CREATE TYPE discount_scope AS ENUM (
  'store_wide',
  'categories',
  'products',
  'tags'
);

-- Create channel enum
CREATE TYPE discount_channel AS ENUM (
  'web',
  'app',
  'pos',
  'marketplace'
);

-- Main discounts table
CREATE TABLE public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  internal_notes TEXT,
  marketing_label TEXT,
  
  -- Type and value
  type discount_type NOT NULL,
  value_type TEXT, -- 'percentage' or 'fixed'
  value NUMERIC NOT NULL,
  
  -- Tiered discount config (JSON for multiple tiers)
  tiered_config JSONB DEFAULT '[]'::jsonb,
  
  -- Scope
  scope discount_scope NOT NULL DEFAULT 'store_wide',
  
  -- Channels
  channels discount_channel[] DEFAULT ARRAY['web']::discount_channel[],
  
  -- Eligibility
  min_cart_subtotal NUMERIC DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  customer_segments TEXT[] DEFAULT ARRAY[]::text[],
  first_order_only BOOLEAN DEFAULT false,
  logged_in_only BOOLEAN DEFAULT false,
  
  -- Usage limits
  global_usage_limit INTEGER,
  per_customer_limit INTEGER DEFAULT 1,
  per_order_max_discount NUMERIC,
  
  -- Stacking
  is_stackable BOOLEAN DEFAULT false,
  stack_with_shipping BOOLEAN DEFAULT true,
  
  -- Scheduling
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  days_of_week INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  happy_hours_start TIME,
  happy_hours_end TIME,
  
  -- Application
  is_automatic BOOLEAN DEFAULT false,
  
  -- Status
  status discount_status NOT NULL DEFAULT 'scheduled',
  
  -- Analytics
  total_uses INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discount product associations
CREATE TABLE public.discount_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  is_excluded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(discount_id, product_id)
);

-- Discount category associations
CREATE TABLE public.discount_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  is_excluded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(discount_id, category_id)
);

-- Track individual discount usages
CREATE TABLE public.discount_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  discount_amount NUMERIC NOT NULL,
  order_subtotal NUMERIC NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_discounts_code ON public.discounts(code);
CREATE INDEX idx_discounts_status ON public.discounts(status);
CREATE INDEX idx_discounts_dates ON public.discounts(start_date, end_date);
CREATE INDEX idx_discount_usages_discount_id ON public.discount_usages(discount_id);
CREATE INDEX idx_discount_usages_user_id ON public.discount_usages(user_id);
CREATE INDEX idx_discount_usages_order_id ON public.discount_usages(order_id);
CREATE INDEX idx_discount_products_discount_id ON public.discount_products(discount_id);
CREATE INDEX idx_discount_categories_discount_id ON public.discount_categories(discount_id);

-- Enable RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discounts
CREATE POLICY "Anyone can view active discounts"
  ON public.discounts FOR SELECT
  USING (status = 'active' OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage discounts"
  ON public.discounts FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for discount_products
CREATE POLICY "Anyone can view discount products"
  ON public.discount_products FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage discount products"
  ON public.discount_products FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for discount_categories
CREATE POLICY "Anyone can view discount categories"
  ON public.discount_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage discount categories"
  ON public.discount_categories FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for discount_usages
CREATE POLICY "Users can view their own discount usages"
  ON public.discount_usages FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "System can create discount usages"
  ON public.discount_usages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all discount usages"
  ON public.discount_usages FOR SELECT
  USING (is_admin(auth.uid()));

-- Trigger to update updated_at
CREATE TRIGGER update_discounts_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate discount code
CREATE OR REPLACE FUNCTION public.validate_discount_code(
  p_code TEXT,
  p_user_id UUID,
  p_cart_subtotal NUMERIC,
  p_cart_items JSONB
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_id UUID,
  discount_amount NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Check per-customer limit
  IF p_user_id IS NOT NULL AND v_discount.per_customer_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM discount_usages
    WHERE discount_id = v_discount.id AND user_id = p_user_id;
    
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
$$;

-- Function to record discount usage
CREATE OR REPLACE FUNCTION public.record_discount_usage(
  p_discount_id UUID,
  p_order_id UUID,
  p_user_id UUID,
  p_discount_amount NUMERIC,
  p_order_subtotal NUMERIC,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert usage record
  INSERT INTO discount_usages (
    discount_id,
    order_id,
    user_id,
    discount_amount,
    order_subtotal,
    ip_address
  ) VALUES (
    p_discount_id,
    p_order_id,
    p_user_id,
    p_discount_amount,
    p_order_subtotal,
    p_ip_address
  );

  -- Update discount stats
  UPDATE discounts
  SET 
    total_uses = total_uses + 1,
    total_revenue = total_revenue + p_order_subtotal
  WHERE id = p_discount_id;

  RETURN true;
END;
$$;