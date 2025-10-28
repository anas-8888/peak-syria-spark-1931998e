-- Add new columns to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS offer_price NUMERIC,
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS flag TEXT;

-- Create function to generate SKU
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  counter INTEGER;
  new_sku TEXT;
BEGIN
  IF NEW.sku IS NULL THEN
    -- Extract prefix from category or use PEAK
    prefix := COALESCE(UPPER(SUBSTRING(NEW.category FROM 1 FOR 3)), 'PEAK');
    
    -- Get counter based on existing products
    SELECT COUNT(*) + 1 INTO counter FROM products;
    
    -- Generate SKU like PEAK-BBX-001
    new_sku := prefix || '-' || LPAD(counter::TEXT, 3, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM products WHERE sku = new_sku) LOOP
      counter := counter + 1;
      new_sku := prefix || '-' || LPAD(counter::TEXT, 3, '0');
    END LOOP;
    
    NEW.sku := new_sku;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating SKU
DROP TRIGGER IF EXISTS generate_sku_trigger ON products;
CREATE TRIGGER generate_sku_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_sku();