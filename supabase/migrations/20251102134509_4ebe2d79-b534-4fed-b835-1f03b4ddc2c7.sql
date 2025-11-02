-- Create product_variants table to store color-size-price-stock combinations
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_id UUID REFERENCES public.colors(id) ON DELETE SET NULL,
  size TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, color_id, size)
);

-- Add index for faster queries
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_color_id ON public.product_variants(color_id);
CREATE INDEX idx_product_variants_active ON public.product_variants(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active variants"
ON public.product_variants
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage variants"
ON public.product_variants
FOR ALL
USING (is_admin(auth.uid()));

-- Add variant_id to cart_items
ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS selected_color TEXT,
ADD COLUMN IF NOT EXISTS selected_size TEXT,
ADD COLUMN IF NOT EXISTS variant_price NUMERIC;

-- Add variant_id to order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS selected_color TEXT,
ADD COLUMN IF NOT EXISTS selected_size TEXT;

-- Add unified_pricing flag to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS unified_pricing BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS min_price NUMERIC,
ADD COLUMN IF NOT EXISTS max_price NUMERIC;

-- Create trigger to update product min/max prices when variants change
CREATE OR REPLACE FUNCTION public.update_product_price_range()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min_price NUMERIC;
  v_max_price NUMERIC;
  v_product_id UUID;
BEGIN
  -- Get the product_id from either NEW or OLD
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);
  
  -- Calculate min and max prices for the product
  SELECT MIN(price), MAX(price)
  INTO v_min_price, v_max_price
  FROM product_variants
  WHERE product_id = v_product_id AND is_active = true;
  
  -- Update the product with new price range
  UPDATE products
  SET 
    min_price = v_min_price,
    max_price = v_max_price,
    updated_at = now()
  WHERE id = v_product_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for insert/update/delete on product_variants
CREATE TRIGGER update_product_price_range_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_product_price_range();

-- Update trigger for updated_at on product_variants
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get available sizes for a color
CREATE OR REPLACE FUNCTION public.get_available_sizes_for_color(p_product_id UUID, p_color_id UUID)
RETURNS TABLE(size TEXT, price NUMERIC, stock_quantity INTEGER, variant_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT size, price, stock_quantity, id as variant_id
  FROM product_variants
  WHERE product_id = p_product_id 
    AND color_id = p_color_id 
    AND is_active = true
  ORDER BY size;
$$;

-- Create function to get price range for a product
CREATE OR REPLACE FUNCTION public.get_product_price_range(p_product_id UUID)
RETURNS TABLE(min_price NUMERIC, max_price NUMERIC, unified_pricing BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.min_price,
    p.max_price,
    p.unified_pricing
  FROM products p
  WHERE p.id = p_product_id;
$$;